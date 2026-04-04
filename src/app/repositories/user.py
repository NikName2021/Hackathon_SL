from datetime import datetime
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.all_models import User, IssuedJWTToken, Role


class UserCreateDTO(BaseModel):
    email: EmailStr
    hashed_password: str
    full_name: str | None = None
    role: Role = Role.STUDENT


class UserRepository:
    @staticmethod
    async def get_by_email(email: str, session: AsyncSession) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(user_id: int, session: AsyncSession) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(user_data: UserCreateDTO, session: AsyncSession) -> User:
        user = User(**user_data.model_dump())
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    @staticmethod
    async def update_points(user_id: int, points_delta: int, session: AsyncSession) -> User | None:
        user = await UserRepository.get_by_id(user_id, session)
        if user:
            user.points += points_delta
            await session.commit()
            await session.refresh(user)
        return user

    @staticmethod
    async def get_leaderboard(session: AsyncSession, limit: int = 10):
        stmt = select(User).where(User.role == Role.STUDENT).order_by(User.reputation.desc()).limit(limit)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_all_users(session: AsyncSession, limit: int = 100, offset: int = 0):
        stmt = select(User).limit(limit).offset(offset)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update_status(user_id: int, is_active: bool, session: AsyncSession) -> User | None:
        user = await UserRepository.get_by_id(user_id, session)
        if user:
            user.is_active = is_active
            await session.commit()
            await session.refresh(user)
        return user

    @staticmethod
    async def update_role(user_id: int, role: Role, session: AsyncSession) -> User | None:
        user = await UserRepository.get_by_id(user_id, session)
        if user:
            user.role = role
            await session.commit()
            await session.refresh(user)
        return user
