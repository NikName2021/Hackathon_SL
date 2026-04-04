import pytest
from httpx import AsyncClient
from unittest.mock import patch

from main import app

@pytest.mark.asyncio
async def test_register_route(test_client: AsyncClient):
    with patch("services.user_service.AuthService.register_user") as mock_register:
        with patch("services.user_service.AuthService.authenticate_user") as mock_auth:
            
            # Setup mocks
            class MockUser:
                id = 1
                email = "new@test.com"
                full_name = "Newbie"
                role = "student"
                points = 0
                reputation = 0.0
                
            mock_register.return_value = MockUser()
            mock_auth.return_value = {
                "access_token": "fake_access",
                "refresh_token": "fake_refresh",
                "user": {
                    "id": 1,
                    "email": "new@test.com",
                    "full_name": "Newbie",
                    "role": "student",
                    "points": 0,
                    "reputation": 0.0
                }
            }
            
            response = await test_client.post(
                "/api/v1/auth/register",
                json={
                    "email": "new@test.com",
                    "password": "pass",
                    "username": "Newbie"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["user"]["email"] == "new@test.com"
            assert data["token"]["access_token"] == "fake_access"
            assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_login_route(test_client: AsyncClient):
    with patch("services.user_service.AuthService.authenticate_user") as mock_auth:
        mock_auth.return_value = {
            "access_token": "fake_acc",
            "refresh_token": "fake_ref",
            "user": {
                "id": 1,
                "email": "test@test.com",
                "full_name": "Test",
                "role": "student",
                "points": 0,
                "reputation": 0.0
            }
        }
        
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": "test@test.com", "password": "pwd"}
        )
        
        assert response.status_code == 200
        assert "refresh_token" in response.cookies
        assert response.json()["user"]["email"] == "test@test.com"

@pytest.mark.asyncio
async def test_refresh_token_missing_cookie(test_client: AsyncClient):
    response = await test_client.post("/api/v1/auth/token/refresh")
    assert response.status_code == 401
    assert "Refresh token missing" in response.json()["detail"]
