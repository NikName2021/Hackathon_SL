import jwt
from datetime import datetime
from fastapi import HTTPException, status
from core.config import SECRET_KEY, ALGORITHM
from database.all_models import User, Role, IssuedJWTToken
from helpers.auth import hash_password, verify_password, create_access_token, create_refresh_token
from schemas.input_forms import UserCreate, UserLogin
from schemas.task import UserShortResponse
from repositories.user import UserRepository, UserCreateDTO
from sqlalchemy.ext.asyncio import AsyncSession


class AuthService:
    @staticmethod
    async def register_user(user_data: UserCreate, session: AsyncSession) -> User:
        existing_user = await UserRepository.get_by_email(user_data.email, session)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

        new_user_dto = UserCreateDTO(
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.username, # Using username as full_name for now
            role=Role.STUDENT # Default role
        )
        return await UserRepository.create(new_user_dto, session)

    @staticmethod
    async def authenticate_user(user_data: UserLogin, session: AsyncSession):
        user = await UserRepository.get_by_email(user_data.email, session)

        if not user or not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный email или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ваш аккаунт заблокирован. Пожалуйста, свяжитесь с администрацией."
            )

        payload = {"user_id": user.id, "role": user.role.value}
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)

        # In a real app, we'd save the refresh token to the DB here
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": UserShortResponse.model_validate(user)
        }