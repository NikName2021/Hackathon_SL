from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import async_get_db, logger
from schemas.input_forms import UserCreate, UserLogin
from services.user_service import AuthService

router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.post("/register")
async def register(
        user_data: UserCreate,
        db: AsyncSession = Depends(async_get_db)
):
    try:
        logger.info(f"Request to register user: {user_data.email}")
        return await AuthService.register_user(user_data, db)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in register: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Ошибка при регистрации")


@router.post("/login")
async def login(
        user_data: UserLogin,
        db: AsyncSession = Depends(async_get_db)
):
    try:
        logger.info(f"Login request: {user_data.email}")
        return await AuthService.authenticate_user(user_data, db)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in login: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Ошибка при входе")
