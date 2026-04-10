import os
import uuid
import shutil
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.chat import ChatRepository
from repositories.task import TaskRepository
from database.all_models import Role, ApplicationStatus
from services.watermark_service import WatermarkService
from core.crypto import EncryptionService

class ChatService:
    @staticmethod
    async def send_message(task_id: int, sender_id: int, content: str, role: Role, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")

        # Security check: only owner or assigned student
        is_owner = task.owner_id == sender_id
        is_assigned = any(
            app.student_id == sender_id and app.status == ApplicationStatus.ACCEPTED 
            for app in task.applications
        )

        if not (is_owner or is_assigned):
            raise HTTPException(status_code=403, detail="У вас нет доступа к чату этой задачи")

        encrypted_content = EncryptionService.encrypt_message(content)
        return await ChatRepository.create(task_id, sender_id, encrypted_content, session)

    @staticmethod
    async def send_file_message(task_id: int, sender_id: int, file: UploadFile, content: str, role: Role, session: AsyncSession, is_secure: bool = False):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")

        # Security check
        is_owner = task.owner_id == sender_id
        is_assigned = any(
            app.student_id == sender_id and app.status == ApplicationStatus.ACCEPTED 
            for app in task.applications
        )

        if not (is_owner or is_assigned):
            raise HTTPException(status_code=403, detail="У вас нет доступа к чату этой задачи")

        # Handle file upload
        upload_dir = "protected_storage/chat"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{task_id}_{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Apply Watermark if secure
        if is_secure:
            from datetime import datetime
            cipher = f"TRC-T{task_id}-U{sender_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            WatermarkService.apply_watermark(file_path, cipher)
            
        file_url = f"/api/v1/chat/attachment/{unique_filename}"
        file_type = "image" if file.content_type.startswith("image/") else "file"
        
        message_content = content or f"Файл: {file.filename}"
        encrypted_content = EncryptionService.encrypt_message(message_content)
        
        return await ChatRepository.create(
            task_id=task_id, 
            sender_id=sender_id, 
            content=encrypted_content, 
            session=session,
            file_url=file_url,
            file_name=file.filename,
            file_type=file_type,
            is_secure_file=is_secure
        )

    @staticmethod
    async def get_messages(task_id: int, user_id: int, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")

        # Security check
        is_owner = task.owner_id == user_id
        is_assigned = any(
            app.student_id == user_id and app.status == ApplicationStatus.ACCEPTED 
            for app in task.applications
        )

        if not (is_owner or is_assigned):
            raise HTTPException(status_code=403, detail="У вас нет доступа к чату этой задачи")

        messages = await ChatRepository.get_task_messages(task_id, session)
        for msg in messages:
            msg.content = EncryptionService.decrypt_message(msg.content)
        
        return messages
