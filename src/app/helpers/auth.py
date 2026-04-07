from datetime import datetime, timedelta
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, async_get_db, security, \
    REFRESH_TOKEN_EXPIRE_DAYS
import bcrypt
from database.all_models import User, Role


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, str(SECRET_KEY), algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Generate unique jti (JWT ID)
    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4())
    })
    return jwt.encode(to_encode, str(SECRET_KEY), algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, str(SECRET_KEY), algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: AsyncSession = Depends(async_get_db)
) -> User:
    """Получить текущего авторизованного пользователя"""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный токен"
        )

    user_id = payload.get("user_id")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден или деактивирован"
        )

    return user


async def get_current_user_optional(
        credentials: HTTPAuthorizationCredentials | None = Depends(security),
        db: AsyncSession = Depends(async_get_db)
) -> User | None:
    """Опционально получить текущего пользователя (без ошибки 401)"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        if not payload:
            return None

        user_id = payload.get("user_id")
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except Exception:
        return None


class RoleChecker:
    """Проверка ролей пользователя"""

    def __init__(self, allowed_roles: list[Role]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        allowed_values = [r.value if hasattr(r, 'value') else r for r in self.allowed_roles]
        user_role_value = user.role.value if hasattr(user.role, 'value') else user.role
        
        if user_role_value not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Доступ запрещён. Требуется роль: {allowed_values}. Ваша роль: {user_role_value}"
            )
        return user
