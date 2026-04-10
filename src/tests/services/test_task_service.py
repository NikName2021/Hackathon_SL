from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from database.all_models import ApplicationStatus, Task, TaskApplication, TaskStatus, TaskSubmission
from schemas.task import ApplicationCreate, SubmissionCreate, TaskCreate, TaskResponse, ApplicationResponse
from services.task_service import TaskService


@pytest.fixture
def mock_task():
    return Task(
        id=1,
        title="Test Task",
        description="Task Description",
        category_id=1,
        owner_id=2,
        status=TaskStatus.PENDING_APPROVAL,
        points_reward=10,
        is_confidential=False,
    )


@pytest.fixture
def mock_application():
    return TaskApplication(
        id=1,
        task_id=1,
        student_id=1,
        status=ApplicationStatus.PENDING,
        message="I can do it",
    )


@pytest.fixture
def mock_accepted_application(mock_task):
    application = TaskApplication(
        id=1,
        task_id=mock_task.id,
        student_id=1,
        status=ApplicationStatus.ACCEPTED,
        message="I can do it",
    )
    application.task = mock_task
    application.student = None
    return application


@pytest.mark.asyncio
async def test_create_task(mock_db_session, mock_task):
    task_data = TaskCreate(title="Test Task", description="Desc", category_id=1, points_reward=10)

    with patch("repositories.task.TaskRepository.create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_task

        with patch("repositories.task.TaskRepository.update_status", new_callable=AsyncMock) as mock_update_status:
            mock_update_status.return_value = mock_task
            result = await TaskService.create_task(task_data, owner_id=2, session=mock_db_session)

            assert result.id == 1
            mock_create.assert_called_once()
            mock_update_status.assert_called_once_with(1, TaskStatus.PENDING_APPROVAL, mock_db_session)


@pytest.mark.asyncio
async def test_approve_task(mock_db_session, mock_task):
    with patch("repositories.task.TaskRepository.get_by_id", new_callable=AsyncMock) as mock_get:
        mock_task.status = TaskStatus.PENDING_APPROVAL
        mock_get.return_value = mock_task
        with patch("repositories.task.TaskRepository.update_status", new_callable=AsyncMock) as mock_update:
            updated_task = Task(
                id=mock_task.id,
                title=mock_task.title,
                description=mock_task.description,
                category_id=mock_task.category_id,
                owner_id=mock_task.owner_id,
                status=TaskStatus.OPEN,
                points_reward=mock_task.points_reward,
            )
            mock_update.return_value = updated_task

            result = await TaskService.approve_task(1, mock_db_session)
            assert result.status == TaskStatus.OPEN


@pytest.mark.asyncio
async def test_approve_student_assigns_executor_and_rejects_rest(mock_db_session, mock_task, mock_application):
    mock_task.status = TaskStatus.OPEN
    mock_task.applications = [mock_application]
    mock_application.task = mock_task
    accepted_application = TaskApplication(
        id=1,
        task_id=1,
        student_id=1,
        status=ApplicationStatus.ACCEPTED,
        message="I can do it",
    )
    accepted_application.task = mock_task
    accepted_application.student = None

    with patch("repositories.task.ApplicationRepository.get_by_id", new_callable=AsyncMock) as mock_get_app:
        mock_get_app.side_effect = [mock_application, accepted_application]
        with patch("repositories.task.TaskRepository.get_by_id", new_callable=AsyncMock) as mock_get_task:
            mock_get_task.return_value = mock_task
            with patch("repositories.task.ApplicationRepository.update_status", new_callable=AsyncMock) as mock_update_app:
                with patch("repositories.task.TaskRepository.assign_student", new_callable=AsyncMock) as mock_assign:
                    with patch("repositories.task.ApplicationRepository.reject_pending_for_task_except", new_callable=AsyncMock) as mock_reject:
                        with patch("repositories.task.TaskRepository.update_status", new_callable=AsyncMock) as mock_update_task:
                            mock_update_app.return_value = accepted_application
                            mock_update_task.return_value = mock_task

                            result = await TaskService.approve_student(1, 2, mock_db_session)

                            assert result.status == ApplicationStatus.ACCEPTED
                            mock_assign.assert_awaited_once_with(1, 1, mock_db_session)
                            mock_reject.assert_awaited_once_with(1, 1, mock_db_session)
                            mock_update_app.assert_awaited_once_with(1, ApplicationStatus.ACCEPTED, mock_db_session)
                            mock_update_task.assert_awaited_once_with(1, TaskStatus.IN_PROGRESS, mock_db_session)


@pytest.mark.asyncio
async def test_task_response_serialization(mock_task, mock_admin_user):
    older = TaskSubmission(
        id=1,
        task_id=mock_task.id,
        student_id=1,
        content="old",
        status="reviewing",
        submitted_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    newer = TaskSubmission(
        id=2,
        task_id=mock_task.id,
        student_id=1,
        content="new",
        status="approved",
        submitted_at=datetime.now(timezone.utc),
    )
    mock_task.submissions = [older, newer]
    mock_task.created_date = datetime.now()
    mock_task.skills = []
    mock_task.attachments = []
    mock_task.owner = mock_admin_user
    mock_task.category = None

    result = TaskResponse.model_validate(mock_task)

    assert result.latest_submission is not None
    assert result.latest_submission.id == 2
    assert result.latest_submission.status == "approved"


@pytest.mark.asyncio
async def test_application_response_serialization(mock_task, mock_application, mock_student_user):
    mock_application.task = mock_task
    mock_application.student = mock_student_user
    mock_application.created_at = datetime.now()

    result = ApplicationResponse.model_validate(mock_application)

    assert result.task.id == mock_task.id
    assert result.task.title == mock_task.title
    assert result.student.id == mock_student_user.id


@pytest.mark.asyncio
async def test_apply_for_task_success(mock_db_session, mock_task, mock_application, mock_student_user):
    app_data = ApplicationCreate(message="I can do it")

    with patch("repositories.task.TaskRepository.get_by_id", new_callable=AsyncMock) as mock_get_task:
        mock_task.status = TaskStatus.OPEN
        mock_get_task.return_value = mock_task

        with patch("repositories.task.ApplicationRepository.get_by_task_and_student", new_callable=AsyncMock) as mock_get_app:
            mock_get_app.return_value = None

            with patch("repositories.task.ApplicationRepository.create", new_callable=AsyncMock) as mock_create_app:
                mock_create_app.return_value = mock_application

                result = await TaskService.apply_for_task(1, 1, app_data, mock_db_session)

                assert result.status == ApplicationStatus.PENDING
                assert result.task_id == 1


@pytest.mark.asyncio
async def test_apply_for_task_already_applied(mock_db_session, mock_task, mock_application):
    app_data = ApplicationCreate(message="I can do it")

    with patch("repositories.task.TaskRepository.get_by_id", new_callable=AsyncMock) as mock_get_task:
        mock_task.status = TaskStatus.OPEN
        mock_task.applications = [mock_application]
        mock_get_task.return_value = mock_task

        with patch("repositories.task.ApplicationRepository.get_by_task_and_student", new_callable=AsyncMock) as mock_get_app:
            mock_get_app.return_value = mock_application

            with pytest.raises(HTTPException) as exc_info:
                await TaskService.apply_for_task(1, 1, app_data, mock_db_session)

            assert exc_info.value.status_code == 400
            assert isinstance(exc_info.value.detail, str)
            assert exc_info.value.detail
