from fastapi import APIRouter, HTTPException, status, Depends, Response, Cookie, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db, logger, REFRESH_TOKEN_EXPIRE_DAYS
from schemas.input_forms import UserCreate, UserLogin
from schemas.task import UserShortResponse, AuthResponse, Token, UserResponse, ProfileUpdate
from services.user_service import AuthService, ProfileService
from helpers.auth import get_current_user, decode_token
from database.all_models import User

router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate,
    response: Response,
    db: AsyncSession = Depends(async_get_db)
):
    try:
        logger.info(f"Request to register user: {user_data.email}")
        user = await AuthService.register_user(user_data, db)
        
        # Immediate login after registration for better UX
        login_data = await AuthService.authenticate_user(
            UserLogin(email=user_data.email, password=user_data.password), 
            db
        )
        
        response.set_cookie(
            key="refresh_token",
            value=login_data["refresh_token"],
            httponly=True,
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            samesite="lax",
            secure=False # Set to True in production with HTTPS
        )
        
        return AuthResponse(
            user=UserShortResponse.model_validate(user),
            token=Token(access_token=login_data["access_token"])
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in register: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Ошибка при регистрации")


@router.post("/login", response_model=AuthResponse)
async def login(
    user_data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(async_get_db)
):
    try:
        logger.info(f"Login request: {user_data.email}")
        login_data = await AuthService.authenticate_user(user_data, db)
        
        response.set_cookie(
            key="refresh_token",
            value=login_data["refresh_token"],
            httponly=True,
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            samesite="lax",
            secure=False
        )
        
        return AuthResponse(
            user=login_data["user"],
            token=Token(access_token=login_data["access_token"])
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in login: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Ошибка при входе")


@router.post("/token/refresh", response_model=Token)
async def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(async_get_db)
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    try:
        token_data = await AuthService.refresh_token(refresh_token, db)
        
        response.set_cookie(
            key="refresh_token",
            value=token_data["refresh_token"],
            httponly=True,
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            samesite="lax",
            secure=False
        )
        
        return Token(access_token=token_data["access_token"])
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in refresh: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Не удалось обновить токен")


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    if refresh_token:
        payload = decode_token(refresh_token)
        if payload:
            await AuthService.logout(current_user.id, payload.get("jti"), db)
        
    response.delete_cookie(key="refresh_token")
    return {"status": "ok"}


@router.get("/checkAuth")
async def check_auth(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}


@router.get("/getIdentity", response_model=UserResponse)
async def get_identity(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    update_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    user = await ProfileService.update_profile(current_user.id, update_data, db)
    return UserResponse.model_validate(user)


@router.post("/profile/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")
    user = await ProfileService.upload_avatar(current_user.id, file, db)
    return UserResponse.model_validate(user)


@router.post("/profile/resume", response_model=UserResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    if not file.filename.lower().endswith((".pdf", ".doc", ".docx")):
        raise HTTPException(status_code=400, detail="Разрешены только файлы PDF и Word")
    user = await ProfileService.upload_resume(current_user.id, file, db)
    return UserResponse.model_validate(user)


@router.post("/profile/skills", response_model=UserResponse)
async def update_skills(
    skills: List[str],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    user = await ProfileService.update_skills(current_user.id, skills, db)
    return UserResponse.model_validate(user)
