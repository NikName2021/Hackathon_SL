from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db
from schemas.task import CategoryCreate, CategoryResponse
from services.category_service import CategoryService
from helpers.auth import RoleChecker
from database.all_models import Role

router = APIRouter(prefix="/categories", tags=["Категории"])


@router.get("/", response_model=List[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(async_get_db)
):
    return await CategoryService.get_all_categories(db)


@router.post("/", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user = Depends(RoleChecker([Role.ADMIN])), # Only Admin can create
    db: AsyncSession = Depends(async_get_db)
):
    return await CategoryService.create_category(category_data, db)
