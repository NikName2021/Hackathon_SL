from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db
from helpers.auth import get_current_user
from database.all_models import User, Achievement, Role
from services.gamification_service import GamificationService
from schemas.gamification import LeaderboardUserResponse, GamificationStatsResponse, AchievementResponse

router = APIRouter(prefix="/gamification", tags=["Gamification"])

@router.get("/leaderboard", response_model=List[LeaderboardUserResponse])
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(async_get_db)
):
    """Получить список лучших студентов по репутации"""
    return await GamificationService.get_leaderboard(db, limit)

@router.get("/stats", response_model=GamificationStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    """Получить статистику геймификации текущего пользователя"""
    # Check for new achievements
    await GamificationService.check_achievements(current_user.id, db)
    
    level_info = GamificationService.calculate_level_info(current_user.points)
    rank = await GamificationService.get_user_rank(current_user.id, db)
    
    # Reload user to get fresh achievements
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one()
    
    achievement_list = []
    for ach in user.achievements:
        achievement_list.append({
            "id": ach.id,
            "name": ach.name,
            "description": ach.description,
            "icon_type": ach.icon_type,
            "earned_at": None # We could fetch from association table if we stored it there properly
        })
        
    return {
        "level": level_info[0],
        "points_to_next_level": level_info[1],
        "progress_percentage": level_info[2],
        "total_points": user.points,
        "rank": rank,
        "achievements": achievement_list,
        "skill_distribution": await GamificationService.get_skill_distribution(current_user.id, db)
    }

@router.get("/achievements", response_model=List[AchievementResponse])
async def get_all_achievements(db: AsyncSession = Depends(async_get_db)):
    """Получить список всех возможных достижений"""
    stmt = select(Achievement)
    result = await db.execute(stmt)
    return result.scalars().all()
