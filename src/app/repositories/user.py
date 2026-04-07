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

    @staticmethod
    async def update_profile(user_id: int, update_data: dict, session: AsyncSession) -> User | None:
        user = await UserRepository.get_by_id(user_id, session)
        if user:
            for key, value in update_data.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
            await session.commit()
            await session.refresh(user)
        return user

    @staticmethod
    async def update_avatar(user_id: int, avatar_url: str, session: AsyncSession) -> User | None:
        user = await UserRepository.get_by_id(user_id, session)
        if user:
            user.avatar_url = avatar_url
            await session.commit()
            await session.refresh(user)
        return user

    @staticmethod
    async def update_resume(user_id: int, resume_path: str, session: AsyncSession) -> User | None:
        user = await UserRepository.get_by_id(user_id, session)
        if user:
            user.resume_path = resume_path
            await session.commit()
            await session.refresh(user)
        return user

    @staticmethod
    async def update_skills(user_id: int, skill_names: list[str], session: AsyncSession) -> User | None:
        from database.all_models import Skill
        user = await UserRepository.get_by_id(user_id, session)
        if not user:
            return None
        
        # Get or create skills
        new_skills = []
        for name in skill_names:
            stmt = select(Skill).where(Skill.name == name)
            result = await session.execute(stmt)
            skill = result.scalar_one_or_none()
            if not skill:
                skill = Skill(name=name)
                session.add(skill)
                # Flush to get ID if needed, though append works with non-persistent objects
            new_skills.append(skill)
        
        user.skills = new_skills
        await session.commit()
        await session.refresh(user)
        return user

    @staticmethod
    async def save_refresh_token(user_id: int, jti: str, session: AsyncSession):
        token = IssuedJWTToken(user_id=user_id, jti=jti)
        session.add(token)
        await session.commit()
        return token

    @staticmethod
    async def revoke_refresh_token(jti: str, session: AsyncSession):
        stmt = select(IssuedJWTToken).where(IssuedJWTToken.jti == jti)
        result = await session.execute(stmt)
        token = result.scalar_one_or_none()
        if token:
            token.revoked = True
            await session.commit()
        return token

    @staticmethod
    async def get_valid_refresh_token(jti: str, user_id: int, session: AsyncSession):
        stmt = select(IssuedJWTToken).where(
            IssuedJWTToken.jti == jti,
            IssuedJWTToken.user_id == user_id,
            IssuedJWTToken.revoked == False
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
