from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from database.all_models import ChatMessage

class ChatRepository:
    @staticmethod
    async def create(task_id: int, sender_id: int, content: str, session: AsyncSession, file_url: str | None = None, file_name: str | None = None, file_type: str | None = None) -> ChatMessage:
        message = ChatMessage(
            task_id=task_id, 
            sender_id=sender_id, 
            content=content,
            file_url=file_url,
            file_name=file_name,
            file_type=file_type
        )
        session.add(message)
        await session.commit()
        await session.refresh(message)
        
        # Reload with relations for the response
        stmt = select(ChatMessage).where(ChatMessage.id == message.id).options(
            selectinload(ChatMessage.sender)
        )
        result = await session.execute(stmt)
        return result.scalar_one()

    @staticmethod
    async def get_task_messages(task_id: int, session: AsyncSession):
        stmt = select(ChatMessage).where(ChatMessage.task_id == task_id).order_by(
            ChatMessage.created_at.asc()
        ).options(
            selectinload(ChatMessage.sender)
        )
        result = await session.execute(stmt)
        return result.scalars().all()
