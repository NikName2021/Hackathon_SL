from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.config import async_get_db, logger
from schemas.task import TaskCreate, TaskResponse, ApplicationCreate, ApplicationResponse, SubmissionCreate, SubmissionResponse, TaskReview
from services.task_service import TaskService
from helpers.auth import get_current_user, RoleChecker
from database.all_models import User, Role

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
