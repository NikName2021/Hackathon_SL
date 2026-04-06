from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db, logger
from schemas.task import TaskCreate, TaskResponse, ApplicationCreate, ApplicationResponse, SubmissionCreate, SubmissionResponse, TaskReview, DashboardStats
from services.task_service import TaskService
from helpers.auth import get_current_user, RoleChecker
from database.all_models import User, Role, TaskStatus

router = APIRouter(prefix="/tasks", tags=["Задачи"])


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE, Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.create_task(task_data, current_user.id, db)


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    category_id: int | None = None,
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.get_available_tasks(db, category_id=category_id)


@router.get("/my", response_model=List[TaskResponse])
async def get_my_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.get_my_tasks(current_user.id, current_user.role, db)


@router.get("/applications/pending", response_model=List[ApplicationResponse])
async def get_pending_applications(
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE, Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.get_incoming_applications(current_user.id, db)


@router.get("/moderation/pending", response_model=List[TaskResponse])
async def get_tasks_for_moderation(
    current_user: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.get_tasks_for_moderation(db)


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    # This is a simplified aggregate for the MVP
    # In a real app, we'd use optimized count queries
    my_tasks = await TaskService.get_my_tasks(current_user.id, current_user.role, db)
    
    stats = DashboardStats(
        active_tasks=len([t for t in my_tasks if t.status in [TaskStatus.IN_PROGRESS, TaskStatus.OPEN]]),
        pending_reviews=len([t for t in my_tasks if t.status == TaskStatus.REVIEW]),
        completed_tasks=len([t for t in my_tasks if t.status == TaskStatus.COMPLETED]),
        total_points=current_user.points
    )
    
    if current_user.role in [Role.EMPLOYEE, Role.ADMIN]:
        apps = await TaskService.get_incoming_applications(current_user.id, db)
        stats.pending_applications = len(list(apps))
        
    if current_user.role == Role.ADMIN:
        mod = await TaskService.get_tasks_for_moderation(db)
        stats.pending_moderation = len(list(mod))
        
    return stats


@router.post("/{task_id}/approve", response_model=TaskResponse)
async def approve_task(
    task_id: int,
    current_user: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.approve_task(task_id, db)


@router.post("/{task_id}/reject", response_model=TaskResponse)
async def reject_task(
    task_id: int,
    current_user: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.reject_task(task_id, db)


@router.post("/{task_id}/apply", response_model=ApplicationResponse)
async def apply_for_task(
    task_id: int,
    app_data: ApplicationCreate,
    current_user: User = Depends(RoleChecker([Role.STUDENT])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.apply_for_task(task_id, current_user.id, app_data, db)


@router.post("/applications/{app_id}/approve", response_model=ApplicationResponse)
async def approve_application(
    app_id: int,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE, Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.approve_student(app_id, current_user.id, db)


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: int,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE, Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    # This was a placeholder, now covered by review_task with approval
    return await TaskService.complete_task(task_id, current_user.id, db)


@router.post("/{task_id}/submit", response_model=SubmissionResponse)
async def submit_task(
    task_id: int,
    submission_data: SubmissionCreate,
    current_user: User = Depends(RoleChecker([Role.STUDENT])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.submit_task(task_id, current_user.id, submission_data, db)


@router.post("/{task_id}/review", response_model=TaskResponse)
async def review_task(
    task_id: int,
    review_data: TaskReview,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE, Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.review_task(task_id, current_user.id, review_data, db)
