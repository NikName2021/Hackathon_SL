from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database.all_models import User, Achievement, user_achievements, Role, TaskApplication
from sqlalchemy.orm import selectinload
from typing import List, Optional
import math

class GamificationService:
    @staticmethod
    async def get_user_rank(user_id: int, session: AsyncSession) -> int:
        """Calculate the rank of a user based on reputation."""
        # Simple subquery or total count for rank
        stmt = select(func.count(User.id)).where(
            User.role == Role.STUDENT,
            User.reputation > select(User.reputation).where(User.id == user_id).scalar_subquery()
        )
        result = await session.execute(stmt)
        return result.scalar() + 1

    @staticmethod
    def calculate_level_info(points: int):
        """Calculate Level, Progress, and Points for the next level."""
        # Level 1: 0-99
        # Level 2: 100-199
        # Level 3: 200-299
        level = (points // 100) + 1
        points_in_current_level = points % 100
        points_to_next_level = 100 - points_in_current_level
        progress_percentage = points_in_current_level / 100 * 100
        
        return level, points_to_next_level, progress_percentage

    @staticmethod
    async def get_leaderboard(session: AsyncSession, limit: int = 10):
        """Get the top students by reputation."""
        stmt = (
            select(User)
            .where(User.role == Role.STUDENT)
            .options(selectinload(User.skills))
            .order_by(User.reputation.desc(), User.points.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        users = result.scalars().all()
        
        leaderboard = []
        for i, user in enumerate(users):
            leaderboard.append({
                "id": user.id,
                "full_name": user.full_name,
                "reputation": user.reputation,
                "points": user.points,
                "avatar_url": user.avatar_url,
                "rank": i + 1,
                "skills": [s.name for s in user.skills] if user.skills else []
            })
        return leaderboard

    @staticmethod
    async def award_achievement(user_id: int, achievement_name: str, session: AsyncSession):
        """Award an achievement to a user if they don't have it yet."""
        # Get achievement
        stmt = select(Achievement).where(Achievement.name == achievement_name)
        result = await session.execute(stmt)
        achievement = result.scalar_one_or_none()
        
        if not achievement:
            return False
            
        # Check if already has it
        user_stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.achievements))
        )
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user or achievement in user.achievements:
            return False
            
        user.achievements.append(achievement)
        await session.commit()
        return True

    @staticmethod
    async def check_achievements(user_id: int, session: AsyncSession):
        """Check all possible achievements for a user."""
        user_stmt = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.skills),
                selectinload(User.achievements),
                selectinload(User.applications).selectinload(TaskApplication.task)
            )
        )
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            return
            
        # 1. Сборщик знаний (5 навыков)
        if len(user.skills) >= 5:
            await GamificationService.award_achievement(user_id, "Сборщик знаний", session)
            
        # 2. Миллионер (1000 баллов)
        if user.points >= 1000:
            await GamificationService.award_achievement(user_id, "Миллионер", session)
            
        # 3. Активист (5 заявок)
        if len(user.applications) >= 5:
            await GamificationService.award_achievement(user_id, "Активист", session)
            
        # 4. Мастер задач (10 выполненных задач)
        completed_tasks_count = sum(1 for app in user.applications if app.status == "accepted" and app.task.status == "completed")
        if completed_tasks_count >= 10:
            await GamificationService.award_achievement(user_id, "Мастер задач", session)
        elif completed_tasks_count >= 1:
            await GamificationService.award_achievement(user_id, "Первопроходец", session)
