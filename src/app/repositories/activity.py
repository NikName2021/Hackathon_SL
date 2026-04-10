from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from database.all_models import ActivityLog, ActivityType, User, Task

class ActivityLogRepository:
    @staticmethod
    async def create(
        session: AsyncSession,
        user_id: int,
        activity_type: ActivityType,
        actor_id: int | None = None,
        task_id: int | None = None,
        content: str | None = None
    ) -> ActivityLog:
        activity = ActivityLog(
            user_id=user_id,
            actor_id=actor_id,
            task_id=task_id,
            activity_type=activity_type,
            content=content
        )
        session.add(activity)
        await session.commit()
        await session.refresh(activity)
        return activity

    @staticmethod
    async def get_recent_for_user(
        session: AsyncSession,
        user_id: int,
        limit: int = 15
    ):
        stmt = (
            select(ActivityLog)
            .where(ActivityLog.user_id == user_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
            .options(
                selectinload(ActivityLog.actor).selectinload(User.skills),
                selectinload(ActivityLog.task)
            )
        )
        result = await session.execute(stmt)
        return result.scalars().all()
