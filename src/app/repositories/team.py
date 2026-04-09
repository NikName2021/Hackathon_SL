from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.all_models import TaskTeam, TeamMember, User


class TeamRepository:
    @staticmethod
    async def create(task_id: int, creator_id: int, name: str | None, session: AsyncSession) -> TaskTeam:
        team = TaskTeam(task_id=task_id, creator_id=creator_id, name=name)
        session.add(team)
        await session.commit()
        
        # Add creator as the first member
        member = TeamMember(team_id=team.id, user_id=creator_id)
        session.add(member)
        await session.commit()
        
        # Reload with members
        stmt = select(TaskTeam).where(TaskTeam.id == team.id).options(
            selectinload(TaskTeam.members).selectinload(TeamMember.user),
            selectinload(TaskTeam.creator)
        )
        result = await session.execute(stmt)
        return result.scalar_one()

    @staticmethod
    async def get_by_id(team_id: int, session: AsyncSession) -> TaskTeam | None:
        stmt = select(TaskTeam).where(TaskTeam.id == team_id).options(
            selectinload(TaskTeam.members).selectinload(TeamMember.user),
            selectinload(TaskTeam.creator),
            selectinload(TaskTeam.task)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_task_id(task_id: int, session: AsyncSession):
        stmt = select(TaskTeam).where(TaskTeam.task_id == task_id).options(
            selectinload(TaskTeam.members).selectinload(TeamMember.user),
            selectinload(TaskTeam.creator)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def add_member(team_id: int, user_id: int, session: AsyncSession) -> TeamMember:
        member = TeamMember(team_id=team_id, user_id=user_id)
        session.add(member)
        await session.commit()
        return member

    @staticmethod
    async def remove_member(team_id: int, user_id: int, session: AsyncSession):
        stmt = select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        result = await session.execute(stmt)
        member = result.scalar_one_or_none()
        if member:
            await session.delete(member)
            await session.commit()
            return True
        return False

    @staticmethod
    async def get_member(team_id: int, user_id: int, session: AsyncSession) -> TeamMember | None:
        stmt = select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_status(team_id: int, status: str, session: AsyncSession):
        team = await TeamRepository.get_by_id(team_id, session)
        if team:
            team.status = status
            await session.commit()
            return team
        return None
