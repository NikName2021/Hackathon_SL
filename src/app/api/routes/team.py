from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from helpers.auth import get_current_user
from core.config import async_get_db
from database.all_models import User, Role
from schemas.team import TeamCreate, TeamResponse
from services.task_service import TaskService


router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/create/{task_id}", response_model=TeamResponse)
async def create_team(
    task_id: int,
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(async_get_db)
):
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can create teams")
    
    return await TaskService.create_team(task_id, current_user.id, team_data, session)


@router.get("/task/{task_id}", response_model=List[TeamResponse])
async def get_task_teams(
    task_id: int,
    session: AsyncSession = Depends(async_get_db)
):
    return await TaskService.get_task_teams(task_id, session)


@router.post("/{team_id}/join")
async def join_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(async_get_db)
):
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can join teams")
    
    return await TaskService.join_team(team_id, current_user.id, session)


@router.post("/{team_id}/leave")
async def leave_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(async_get_db)
):
    return await TaskService.leave_team(team_id, current_user.id, session)
