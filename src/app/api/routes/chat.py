from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import async_get_db
from database.all_models import User
from helpers.auth import get_current_user
from schemas.chat import ChatMessageCreate, ChatMessageResponse
from services.chat import ChatService

router = APIRouter(prefix="/chat", tags=["Чат"])

@router.post("/{task_id}", response_model=ChatMessageResponse)
async def send_message(
    task_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    return await ChatService.send_message(
        task_id, current_user.id, message_data.content, current_user.role, db
    )

@router.post("/{task_id}/file", response_model=ChatMessageResponse)
async def send_file_message(
    task_id: int,
    file: UploadFile = File(...),
    content: str = Form(None),
    is_secure: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    return await ChatService.send_file_message(
        task_id, current_user.id, file, content, current_user.role, db, is_secure
    )

@router.get("/{task_id}", response_model=List[ChatMessageResponse])
async def get_messages(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db)
):
    return await ChatService.get_messages(task_id, current_user.id, db)
