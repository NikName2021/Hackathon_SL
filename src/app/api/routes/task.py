from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db, logger
from schemas.task import (
    TaskCreate, TaskResponse, ApplicationCreate, ApplicationResponse, 
    SubmissionCreate, SubmissionResponse, TaskReview, DashboardStats, TaskUpdate,
    RecommendedTaskResponse, TaskAttachmentResponse, TaskReject, ActivityResponse
)
from repositories.activity import ActivityLogRepository
from services.task_service import TaskService
from services.recommendation_service import RecommendationService
from helpers.auth import get_current_user, RoleChecker, get_current_user_optional
from database.all_models import User, Role, TaskStatus

router = APIRouter(prefix="/tasks", tags=["Задачи"])


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.create_task(task_data, current_user.id, db)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.update_task(task_id, current_user.id, task_data, db)


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    category_id: int | None = None,
    min_points: int | None = None,
    max_points: int | None = None,
    deadline_before: datetime | None = None,
    deadline_after: datetime | None = None,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(async_get_db)
):
    user_id = current_user.id if current_user else None
    return await TaskService.get_available_tasks_filtered(
        db,
        category_id=category_id,
        user_id=user_id,
        min_points=min_points,
        max_points=max_points,
        deadline_before=deadline_before,
        deadline_after=deadline_after,
    )


@router.get("/recommendations", response_model=List[RecommendedTaskResponse])
async def get_recommendations(
    limit: int = 5,
    offset: int = 0,
    current_user: User = Depends(RoleChecker([Role.STUDENT])),
    db: AsyncSession = Depends(async_get_db)
):
    """
    Получить рекомендованные задачи для студента на основе его навыков.
    Сначала топ-5, затем по пагинации.
    """
    return await RecommendationService.get_recommendations(
        current_user.id, db, limit=limit, offset=offset
    )


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
        active_tasks=len([t for t in my_tasks if t.status in [
            TaskStatus.IN_PROGRESS, 
            TaskStatus.OPEN, 
            TaskStatus.PENDING_APPROVAL,
            TaskStatus.CANCELLED
        ]]),
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


@router.get("/activity", response_model=List[ActivityResponse])
async def get_activity_feed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    """
    Получить последние уведомления и изменения статусов для пользователя.
    Для сотрудника: новые отклики, сданные работы.
    Для студента: одобренные отклики, принятые задачи.
    """
    return await ActivityLogRepository.get_recent_for_user(db, current_user.id)


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
    reject_data: TaskReject,
    current_user: User = Depends(RoleChecker([Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.reject_task(task_id, reject_data.reason, db)


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


@router.post("/applications/{app_id}/reject", response_model=ApplicationResponse)
async def reject_application(
    app_id: int,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE, Role.ADMIN])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.reject_student(app_id, current_user.id, db)


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: int,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE])),
    db: AsyncSession = Depends(async_get_db)
):
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
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.review_task(task_id, current_user.id, review_data, db)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_by_id(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.get_task_for_user(task_id, current_user.id, current_user.role, db)


@router.post("/{task_id}/attachments", response_model=List[TaskAttachmentResponse])
async def upload_attachments(
    task_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.upload_attachments(task_id, files, db)


@router.delete("/attachments/{attachment_id}")
async def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(RoleChecker([Role.EMPLOYEE])),
    db: AsyncSession = Depends(async_get_db)
):
    return await TaskService.delete_attachment(attachment_id, db)

