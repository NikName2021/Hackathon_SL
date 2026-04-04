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
