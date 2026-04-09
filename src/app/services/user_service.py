import jwt
import uuid
import os
import shutil
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

        # Map string role directly to enum
        try:
            role_enum = Role(user_data.role.lower())
            if role_enum == Role.ADMIN: # Don't allow public admin registrations
                role_enum = Role.STUDENT
        except (ValueError, AttributeError):
            role_enum = Role.STUDENT

        new_user_dto = UserCreateDTO(
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.username,
            role=role_enum
        )
        user = await UserRepository.create(new_user_dto, session)
        
        # Trigger verification email
        try:
            from services.email_service import EmailService
            token = EmailService.create_verification_token(user.id)
            await EmailService.send_verification_email(user.email, token)
        except Exception as e:
            # We don't want to crash the whole registration if email fails, 
            # though locally it might. In production, we'd use a background task.
            from core.config import logger
            logger.error(f"Failed to send verification email: {e}")
            
        return user

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

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Пожалуйста, подтвердите вашу почту перед входом."
            )

        jti = str(uuid.uuid4())
        payload = {"user_id": user.id, "role": user.role.value, "jti": jti}
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)

        # Save refresh token to DB
        await UserRepository.save_refresh_token(user.id, jti, session)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": UserShortResponse.model_validate(user)
        }

    @staticmethod
    async def refresh_token(old_refresh_token: str, session: AsyncSession):
        from helpers.auth import decode_token
        payload = decode_token(old_refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Неверный токен обновления")
        
        user_id = payload.get("user_id")
        jti = payload.get("jti")
        
        valid_token = await UserRepository.get_valid_refresh_token(jti, user_id, session)
        if not valid_token:
            raise HTTPException(status_code=401, detail="Сессия истекла или отозвана")
        
        # Revoke old token (rotation)
        await UserRepository.revoke_refresh_token(jti, session)
        
        # Issue new pair
        new_jti = str(uuid.uuid4())
        new_payload = {"user_id": user_id, "role": payload.get("role"), "jti": new_jti}
        
        new_access_token = create_access_token(new_payload)
        new_refresh_token = create_refresh_token(new_payload)
        
        await UserRepository.save_refresh_token(user_id, new_jti, session)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        }

    @staticmethod
    async def logout(current_user_id: int, refresh_token_jti: str, session: AsyncSession):
        # We need the JTI from the token being used/cleared
        await UserRepository.revoke_refresh_token(refresh_token_jti, session)
        return {"status": "ok"}

    @staticmethod
    async def verify_email(token: str, session: AsyncSession):
        from helpers.auth import decode_token
        payload = decode_token(token)
        
        if not payload or payload.get("scope") != "email_verification":
            raise HTTPException(status_code=400, detail="Неверная или просроченная ссылка для подтверждения")
        
        user_id = payload.get("user_id")
        user = await UserRepository.get_by_id(user_id, session)
        
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
            
        if user.is_verified:
            return {"status": "already_verified"}
            
        # Update user
        from sqlalchemy import update
        from database.all_models import User
        stmt = update(User).where(User.id == user_id).values(is_verified=True)
        await session.execute(stmt)
        await session.commit()
        
        return {"status": "ok"}

    @staticmethod
    async def request_password_reset(email: str, session: AsyncSession):
        user = await UserRepository.get_by_email(email, session)
        if not user:
            # We don't want to leak if an email exists, so we return OK but don't send anything
            return {"status": "ok"}
            
        from services.email_service import EmailService
        token = EmailService.create_password_reset_token(user.id)
        await EmailService.send_password_reset_email(user.email, token)
        return {"status": "ok"}

    @staticmethod
    async def complete_password_reset(token: str, new_password: str, session: AsyncSession):
        from helpers.auth import decode_token, hash_password
        payload = decode_token(token)
        
        if not payload or payload.get("scope") != "password_reset":
            raise HTTPException(status_code=400, detail="Неверная или просроченная ссылка для сброса пароля")
            
        user_id = payload.get("user_id")
        user = await UserRepository.get_by_id(user_id, session)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
            
        # Update password
        from sqlalchemy import update
        from database.all_models import User
        hashed_pwd = hash_password(new_password)
        stmt = update(User).where(User.id == user_id).values(hashed_password=hashed_pwd)
        await session.execute(stmt)
        
        # Also revoke all old sessions for security
        from database.all_models import IssuedJWTToken
        stmt_revoke = update(IssuedJWTToken).where(IssuedJWTToken.user_id == user_id).values(revoked=True)
        await session.execute(stmt_revoke)
        
        await session.commit()
        return {"status": "ok"}


class ProfileService:
    @staticmethod
    async def update_profile(user_id: int, update_data: any, session: AsyncSession):
        return await UserRepository.update_profile(user_id, update_data.model_dump(exclude_unset=True), session)

    @staticmethod
    async def update_skills(user_id: int, skill_names: list[str], session: AsyncSession):
        return await UserRepository.update_skills(user_id, skill_names, session)

    @staticmethod
    async def upload_avatar(user_id: int, file: any, session: AsyncSession):
        # Ensure uploads dir exists
        upload_dir = "uploads/avatars"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_ext = file.filename.split(".")[-1]
        file_name = f"{user_id}_{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        url = f"/uploads/avatars/{file_name}"
        return await UserRepository.update_avatar(user_id, url, session)

    @staticmethod
    async def upload_resume(user_id: int, file: any, session: AsyncSession):
        upload_dir = "uploads/resumes"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_ext = file.filename.split(".")[-1]
        file_name = f"{user_id}_{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        url = f"/uploads/resumes/{file_name}"
        return await UserRepository.update_resume(user_id, url, session)