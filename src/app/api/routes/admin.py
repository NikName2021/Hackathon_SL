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


class DailyActivity(BaseModel):
    date: str
    tasks: int = 0
    users: int = 0
    points: int = 0


class AdminStats(BaseModel):
    total_users: int
    total_tasks: int
    pending_tasks: int
    total_points_awarded: int
    activity_log: List[DailyActivity] = []


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
    import datetime
    
    # Basic counts
    user_count = await db.scalar(select(func.count(User.id)))
    task_count = await db.scalar(select(func.count(Task.id)))
    pending_count = await db.scalar(select(func.count(Task.id)).where(Task.status == TaskStatus.PENDING_APPROVAL))
    total_points = await db.scalar(select(func.sum(PointTransaction.amount)).where(PointTransaction.transaction_type == "earned"))
    
    # Activity over last 14 days
    limit_date = datetime.datetime.now() - datetime.timedelta(days=14)
    
    # Aggregated tasks
    task_activity_stmt = select(func.date(Task.created_date).label('date'), func.count(Task.id).label('count')).group_by('date').where(Task.created_date >= limit_date)
    task_res = (await db.execute(task_activity_stmt)).all()
    tasks_map = {str(r.date): r.count for r in task_res}
    
    # Aggregated users
    user_activity_stmt = select(func.date(User.created_date).label('date'), func.count(User.id).label('count')).group_by('date').where(User.created_date >= limit_date)
    user_res = (await db.execute(user_activity_stmt)).all()
    users_map = {str(r.date): r.count for r in user_res}
    
    # Aggregated points
    points_activity_stmt = select(func.date(PointTransaction.created_at).label('date'), func.sum(PointTransaction.amount).label('sum')).group_by('date').where(PointTransaction.created_at >= limit_date, PointTransaction.transaction_type == "earned")
    points_res = (await db.execute(points_activity_stmt)).all()
    points_map = {str(r.date): int(r.sum) for r in points_res if r.sum}

    # Merge into a single timeline
    activity_log = []
    for i in range(14, -1, -1):
        day = (datetime.datetime.now() - datetime.timedelta(days=i)).date()
        date_str = str(day)
        activity_log.append(DailyActivity(
            date=date_str,
            tasks=tasks_map.get(date_str, 0),
            users=users_map.get(date_str, 0),
            points=points_map.get(date_str, 0)
        ))
    
    return AdminStats(
        total_users=user_count or 0,
        total_tasks=task_count or 0,
        pending_tasks=pending_count or 0,
        total_points_awarded=total_points or 0,
        activity_log=activity_log
    )
