from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db
from schemas.task import SkillResponse
from repositories.task import SkillRepository

router = APIRouter(prefix="/skills", tags=["Навыки"])

@router.get("/", response_model=List[SkillResponse])
async def get_all_skills(db: AsyncSession = Depends(async_get_db)):
    return await SkillRepository.get_all(db)
