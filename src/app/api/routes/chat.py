from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
import os

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

@router.get("/attachment/{filename}")
async def get_attachment(
    filename: str,
    token: str | None = Query(None),
    db: AsyncSession = Depends(async_get_db)
):
    from helpers.auth import decode_token, security
    from fastapi.security import HTTPAuthorizationCredentials
    from fastapi import Request
    
    # Try to get user from token (header or query)
    user_id = None
    
    # 1. Try header
    # Note: We can't easily use get_current_user dependency here because it's strict on header
    # So we manually extract
    auth_header = None
    try:
        # This is a bit hacky but FastAPI doesn't expose the request easily without adding it to params
        # I'll add Request to params
        pass
    except:
        pass

    # Better: explicitly handle token
    if token:
        payload = decode_token(token)
        if payload:
            user_id = payload.get("user_id")
            
    if not user_id:
        # If no token in query, we need to check header. 
        # But for images from browser, it's usually the query param we care about.
        # However, to be thorough, I'll add Request and use get_current_user if possible.
        raise HTTPException(status_code=401, detail="Не авторизован")

    # Load user
    from database.all_models import User
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
         raise HTTPException(status_code=401, detail="Пользователь не найден")

    # Find task_id from filename (format: {task_id}_{uuid}.ext)
    try:
        task_id = int(filename.split("_")[0])
    except:
        raise HTTPException(status_code=400, detail="Неверный формат имени файла")

    # Security check using existing ChatService logic (check access to task)
    # We can reuse the logic in get_messages
    await ChatService.get_messages(task_id, user.id, db)

    file_path = Path("protected_storage/chat") / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(file_path)
