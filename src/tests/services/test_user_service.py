import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from services.user_service import AuthService
from schemas.input_forms import UserCreate, UserLogin
from database.all_models import Role

@pytest.mark.asyncio
async def test_register_user_success(mock_db_session, mock_student_user):
    user_data = UserCreate(email="test@test.com", password="password123", username="Test User")
    
    with patch("repositories.user.UserRepository.get_by_email", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        with patch("repositories.user.UserRepository.create", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_student_user
            
            with patch("services.user_service.hash_password") as mock_hash:
                mock_hash.return_value = "hashed_pass"
                result = await AuthService.register_user(user_data, mock_db_session)
                
                assert result.id == mock_student_user.id
                assert result.email == "student@test.com"
                mock_create.assert_called_once()

@pytest.mark.asyncio
async def test_register_user_duplicate_email(mock_db_session, mock_student_user):
    user_data = UserCreate(email="test@test.com", password="password123", username="Test User")
    
    with patch("repositories.user.UserRepository.get_by_email", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_student_user  # Email already exists
        
        with patch("services.user_service.hash_password") as mock_hash:
            mock_hash.return_value = "hashed"
            
            with pytest.raises(HTTPException) as exc_info:
                await AuthService.register_user(user_data, mock_db_session)
                
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "Email уже зарегистрирован"

@pytest.mark.asyncio
async def test_authenticate_user_success(mock_db_session, mock_student_user):
    login_data = UserLogin(email="student@test.com", password="password123")
    
    with patch("repositories.user.UserRepository.get_by_email", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_student_user
        
        with patch("services.user_service.verify_password") as mock_verify:
            mock_verify.return_value = True
            
            with patch("repositories.user.UserRepository.save_refresh_token", new_callable=AsyncMock) as mock_save_token:
                
                result = await AuthService.authenticate_user(login_data, mock_db_session)
                
                assert "access_token" in result
                assert "refresh_token" in result
                assert result["user"].email == mock_student_user.email
                mock_save_token.assert_called_once()
