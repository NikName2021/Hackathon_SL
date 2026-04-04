from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db, logger
from schemas.task import ProfileResponse, UserShortResponse, PointTransactionResponse
from repositories.user import UserRepository
from repositories.task import TransactionRepository
from helpers.auth import get_current_user
from database.all_models import User, Role

router = APIRouter(prefix="/profile", tags=["Профиль и Рейтинг"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    history = await TransactionRepository.get_by_user(current_user.id, db)
    
    return ProfileResponse(
        user=UserShortResponse.model_validate(current_user),
        points=current_user.points,
        reputation=current_user.reputation,
        history=[PointTransactionResponse.model_validate(tx) for tx in history]
    )


@router.get("/leaderboard", response_model=List[UserShortResponse])
async def get_leaderboard(
    limit: int = 10,
    db: AsyncSession = Depends(async_get_db)
):
    users = await UserRepository.get_leaderboard(db, limit=limit)
    return [UserShortResponse.model_validate(u) for u in users]
