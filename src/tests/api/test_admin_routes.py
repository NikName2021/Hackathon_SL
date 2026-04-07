import pytest
from httpx import AsyncClient
from unittest.mock import patch

from main import app
from helpers.auth import get_current_user
from database.all_models import Role

@pytest.mark.asyncio
async def test_admin_analytics_forbidden(test_client: AsyncClient, mock_employee_user):
    app.dependency_overrides[get_current_user] = lambda: mock_employee_user
    
    response = await test_client.get("/api/v1/admin/analytics")
    
    assert response.status_code == 403
    
    app.dependency_overrides.pop(get_current_user, None)

@pytest.mark.asyncio
async def test_admin_analytics_success(test_client: AsyncClient, mock_admin_user, mock_db_session):
    app.dependency_overrides[get_current_user] = lambda: mock_admin_user
    
    mock_db_session.scalar.return_value = 10
    
    response = await test_client.get("/api/v1/admin/analytics")
    
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert data["total_users"] == 10
            
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_admin_update_user_role_success(test_client: AsyncClient, mock_admin_user, mock_student_user):
    app.dependency_overrides[get_current_user] = lambda: mock_admin_user

    with patch("repositories.user.UserRepository.get_by_id") as mock_get_by_id:
        mock_get_by_id.side_effect = [mock_student_user, mock_student_user]
        with patch("repositories.user.UserRepository.update_role") as mock_update_role:
            mock_update_role.return_value = mock_student_user

            response = await test_client.patch(
                "/api/v1/admin/users/1",
                json={"role": "employee"},
            )

            assert response.status_code == 200
            assert response.json()["email"] == mock_student_user.email
            mock_update_role.assert_called_once()

    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_admin_update_user_forbidden_for_employee(test_client: AsyncClient, mock_employee_user):
    app.dependency_overrides[get_current_user] = lambda: mock_employee_user

    response = await test_client.patch(
        "/api/v1/admin/users/1",
        json={"role": "employee"},
    )

    assert response.status_code == 403

    app.dependency_overrides.pop(get_current_user, None)
