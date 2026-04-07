import pytest
from httpx import AsyncClient
from unittest.mock import patch

from main import app
from helpers.auth import get_current_user
from database.all_models import Role

@pytest.mark.asyncio
async def test_get_tasks(test_client: AsyncClient):
    with patch("services.task_service.TaskService.get_available_tasks") as mock_get:
        mock_get.return_value = [
            {
                "id": 1,
                "title": "Clean room",
                "description": "It's dirty",
                "status": "open",
                "points_reward": 5,
                "deadline": "2026-12-31T23:59:59",
                "created_date": "2026-04-01T12:00:00",
                "owner": {"id": 2, "email": "emp@t.com", "role": "employee", "points": 0, "reputation": 0, "full_name": "Emp User", "is_active": True},
                "category": {"id": 1, "name": "Chores"}
            }
        ]
        
        response = await test_client.get("/api/v1/tasks/")
        
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Clean room"

@pytest.mark.asyncio
async def test_create_task_forbidden_for_student(test_client: AsyncClient, mock_student_user):
    # Override current user to be a student
    app.dependency_overrides[get_current_user] = lambda: mock_student_user
    
    response = await test_client.post(
        "/api/v1/tasks/",
        json={"title": "My Task", "description": "desc", "category_id": 1, "points_reward": 10}
    )
    
    assert response.status_code == 403
    assert "Доступ запрещён" in response.json()["detail"]
    
    app.dependency_overrides.pop(get_current_user, None)

@pytest.mark.asyncio
async def test_create_task_success_for_employee(test_client: AsyncClient, mock_employee_user):
    app.dependency_overrides[get_current_user] = lambda: mock_employee_user
    
    with patch("services.task_service.TaskService.create_task") as mock_create:
        mock_create.return_value = {
            "id": 2,
            "title": "My Task",
            "description": "desc",
            "status": "pending_approval",
            "points_reward": 10,
            "deadline": "2026-12-31T23:59:59",
            "created_date": "2026-04-01T12:00:00",
            "owner": {"id": mock_employee_user.id, "email": mock_employee_user.email, "role": "employee", "points": 0, "reputation": 0, "full_name": "Employee User", "is_active": True},
            "category": {"id": 1, "name": "Cat"}
        }
        
        response = await test_client.post(
            "/api/v1/tasks/",
            json={"title": "My Task", "description": "desc", "category_id": 1, "points_reward": 10}
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "pending_approval"
        
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_update_task_forbidden_for_student(test_client: AsyncClient, mock_student_user):
    app.dependency_overrides[get_current_user] = lambda: mock_student_user

    response = await test_client.patch(
        "/api/v1/tasks/10",
        json={"title": "Updated title"},
    )

    assert response.status_code == 403

    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_update_task_success_for_employee(test_client: AsyncClient, mock_employee_user):
    app.dependency_overrides[get_current_user] = lambda: mock_employee_user

    with patch("services.task_service.TaskService.update_task") as mock_update:
        mock_update.return_value = {
            "id": 10,
            "title": "Updated title",
            "description": "desc",
            "status": "open",
            "points_reward": 15,
            "deadline": "2026-12-31T23:59:59",
            "created_date": "2026-04-01T12:00:00",
            "owner": {"id": mock_employee_user.id, "email": mock_employee_user.email, "role": "employee", "points": 0, "reputation": 0, "full_name": "Employee User", "is_active": True},
            "category": {"id": 1, "name": "Cat"},
            "applications": [],
        }

        response = await test_client.patch(
            "/api/v1/tasks/10",
            json={"title": "Updated title"},
        )

        assert response.status_code == 200
        assert response.json()["title"] == "Updated title"

    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_get_task_success_for_owner(test_client: AsyncClient, mock_employee_user):
    app.dependency_overrides[get_current_user] = lambda: mock_employee_user

    with patch("services.task_service.TaskService._get_task_or_404") as mock_get:
        mock_get.return_value = type(
            "TaskStub",
            (),
            {
                "id": 10,
                "title": "Editable task",
                "description": "desc",
                "status": "open",
                "points_reward": 15,
                "deadline": None,
                "created_date": "2026-04-01T12:00:00",
                "owner_id": mock_employee_user.id,
                "owner": mock_employee_user,
                "assignee": None,
                "category": None,
                "applications": [],
                "submissions": [],
            },
        )()

        response = await test_client.get("/api/v1/tasks/10")

        assert response.status_code == 200
        assert response.json()["title"] == "Editable task"

    app.dependency_overrides.pop(get_current_user, None)
