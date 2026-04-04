import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from services.task_service import TaskService
from schemas.task import TaskCreate, ApplicationCreate, SubmissionCreate, TaskReview
from database.all_models import Task, TaskStatus, TaskApplication, ApplicationStatus

@pytest.fixture
def mock_task():
    return Task(
        id=1,
        title="Test Task",
        description="Task Description",
        category_id=1,
        owner_id=2,  # Employee
        status=TaskStatus.PENDING_APPROVAL,
        points_reward=10
    )

@pytest.fixture
def mock_application():
    return TaskApplication(
        id=1,
        task_id=1,
        student_id=1,
        status=ApplicationStatus.PENDING,
        message="I can do it"
    )

@pytest.mark.asyncio
async def test_create_task(mock_db_session, mock_task):
    task_data = TaskCreate(title="Test Task", description="Desc", category_id=1, points_reward=10)
    
    with patch("repositories.task.TaskRepository.create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_task
        
        with patch("repositories.task.TaskRepository.update_status", new_callable=AsyncMock) as mock_update_status:
            
            result = await TaskService.create_task(task_data, owner_id=2, session=mock_db_session)
            
            assert result.id == 1
            mock_create.assert_called_once()
            # Verify it's set to PENDING_APPROVAL initially
            mock_update_status.assert_called_once_with(1, TaskStatus.PENDING_APPROVAL, mock_db_session)

@pytest.mark.asyncio
async def test_approve_task(mock_db_session, mock_task):
    with patch("repositories.task.TaskRepository.update_status", new_callable=AsyncMock) as mock_update:
        mock_task.status = TaskStatus.OPEN
        mock_update.return_value = mock_task
        
        result = await TaskService.approve_task(1, mock_db_session)
        assert result.status == TaskStatus.OPEN

@pytest.mark.asyncio
async def test_apply_for_task_success(mock_db_session, mock_task, mock_application, mock_student_user):
    app_data = ApplicationCreate(message="I can do it")
    
    with patch("repositories.task.TaskRepository.get_by_id", new_callable=AsyncMock) as mock_get_task:
        mock_task.status = TaskStatus.OPEN  # Must be OPEN to apply
        mock_get_task.return_value = mock_task
        
        with patch("repositories.task.ApplicationRepository.get_by_task_and_student", new_callable=AsyncMock) as mock_get_app:
            mock_get_app.return_value = None  # Not applied yet
            
            with patch("repositories.task.ApplicationRepository.create", new_callable=AsyncMock) as mock_create_app:
                mock_create_app.return_value = mock_application
                
                result = await TaskService.apply_for_task(1, 1, app_data, mock_db_session)
                
                assert result.status == ApplicationStatus.PENDING

@pytest.mark.asyncio
async def test_apply_for_task_already_applied(mock_db_session, mock_task, mock_application):
    app_data = ApplicationCreate(message="I can do it")
    
    with patch("repositories.task.TaskRepository.get_by_id", new_callable=AsyncMock) as mock_get_task:
        mock_task.status = TaskStatus.OPEN
        mock_task.applications = [mock_application]
        mock_get_task.return_value = mock_task
        
        with patch("repositories.task.ApplicationRepository.get_by_task_and_student", new_callable=AsyncMock) as mock_get_app:
            mock_get_app.return_value = mock_application  # Already applied
            
            with pytest.raises(HTTPException) as exc_info:
                await TaskService.apply_for_task(1, 1, app_data, mock_db_session)
                
            assert exc_info.value.status_code == 400
            assert "Вы уже откликнулись" in exc_info.value.detail
