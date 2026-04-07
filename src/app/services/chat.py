from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.chat import ChatRepository
from repositories.task import TaskRepository
from database.all_models import Role, ApplicationStatus

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

        return await ChatRepository.create(task_id, sender_id, content, session)

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

        return await ChatRepository.get_task_messages(task_id, session)
