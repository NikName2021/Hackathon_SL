from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import async_get_db
from database.all_models import Role, User
from helpers.auth import RoleChecker
from schemas.faq import FAQCreate, FAQResponse, FAQUpdate
from services.faq_service import FAQService

router = APIRouter(prefix="/faq", tags=["FAQ"])


@router.get("/", response_model=List[FAQResponse])
async def list_faq_public(db: AsyncSession = Depends(async_get_db)):
    return await FAQService.list_public(db)


@router.get("/admin", response_model=List[FAQResponse])
async def list_faq_admin(
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db),
):
    return await FAQService.list_all(db)


@router.post("/admin", response_model=FAQResponse)
async def create_faq(
    payload: FAQCreate,
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db),
):
    return await FAQService.create(payload, db)


@router.patch("/admin/{article_id}", response_model=FAQResponse)
async def update_faq(
    article_id: int,
    payload: FAQUpdate,
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db),
):
    return await FAQService.update(article_id, payload, db)


@router.delete("/admin/{article_id}")
async def delete_faq(
    article_id: int,
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db),
):
    return await FAQService.delete(article_id, db)


@router.get("/{slug}", response_model=FAQResponse)
async def get_faq_by_slug(slug: str, db: AsyncSession = Depends(async_get_db)):
    return await FAQService.get_public_by_slug(slug, db)
