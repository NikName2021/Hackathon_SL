from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from pydantic import BaseModel
from core.config import async_get_db, logger
from schemas.task import UserShortResponse, TaskResponse, TaskReview
from services.task_service import TaskService
from repositories.user import UserRepository
from repositories.task import TaskRepository
from helpers.auth import RoleChecker
from database.all_models import User, Role, TaskStatus

router = APIRouter(prefix="/admin", tags=["Админ-панель"])


class UserAdminUpdate(BaseModel):
    role: Role | None = None
    is_active: bool | None = None


class AdminStats(BaseModel):
    total_users: int
    total_tasks: int
    pending_tasks: int
    total_points_awarded: int


@router.get("/users", response_model=List[UserShortResponse])
async def list_users(
    limit: int = 100,
    offset: int = 0,
    role: Role | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await UserRepository.get_all_users(
        db,
        limit=limit,
        offset=offset,
        role=role,
        is_active=is_active,
        search=search,
    )


@router.patch("/users/{user_id}", response_model=UserShortResponse)
async def update_user(
    user_id: int,
    update_data: UserAdminUpdate,
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    user = await UserRepository.get_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if update_data.is_active is False and user.is_active is True:
        # Banning logic
        await TaskService.ban_user(user_id, db)
    elif update_data.is_active is True:
        await UserRepository.update_status(user_id, True, db)
        
    if update_data.role:
        await UserRepository.update_role(user_id, update_data.role, db)
        
    return await UserRepository.get_by_id(user_id, db)


@router.get("/tasks", response_model=List[TaskResponse])
async def list_all_tasks(
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    # Admin can see all tasks, we might need a separate repo method but get_all works if we pass status
    # For now, let's just get all tasks
    from sqlalchemy import select
    from database.all_models import Task
    from sqlalchemy.orm import selectinload
    stmt = select(Task).options(selectinload(Task.owner), selectinload(Task.category))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/tasks/{task_id}/approve", response_model=TaskResponse)
async def approve_task(
    task_id: int,
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    task = await TaskService.approve_task(task_id, db)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.post("/tasks/{task_id}/reject", response_model=TaskResponse)
async def reject_task(
    task_id: int,
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    task = await TaskService.reject_task(task_id, db)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.get("/analytics", response_model=AdminStats)
async def get_analytics(
    current_admin: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    from sqlalchemy import func
    from database.all_models import User, Task, PointTransaction
    
    user_count = await db.scalar(select(func.count(User.id)))
    task_count = await db.scalar(select(func.count(Task.id)))
    pending_count = await db.scalar(select(func.count(Task.id)).where(Task.status == TaskStatus.PENDING_APPROVAL))
    total_points = await db.scalar(select(func.sum(PointTransaction.amount)).where(PointTransaction.transaction_type == "earned"))
    
    return AdminStats(
        total_users=user_count or 0,
        total_tasks=task_count or 0,
        pending_tasks=pending_count or 0,
        total_points_awarded=total_points or 0
    )
