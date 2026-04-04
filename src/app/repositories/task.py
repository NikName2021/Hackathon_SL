from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.all_models import Task, TaskStatus, TaskApplication, ApplicationStatus, TaskSubmission, PointTransaction


class TaskCreateDTO(BaseModel):
    title: str
    description: str | None = None
    category_id: int | None = None
    owner_id: int
    points_reward: int = 0
    deadline: str | None = None


class TaskRepository:
    @staticmethod
    async def get_all(session: AsyncSession, status: TaskStatus = TaskStatus.OPEN, category_id: int | None = None):
        stmt = select(Task).where(Task.status == status).options(selectinload(Task.owner), selectinload(Task.category))
        if category_id:
            stmt = stmt.where(Task.category_id == category_id)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(task_id: int, session: AsyncSession) -> Task | None:
        stmt = select(Task).where(Task.id == task_id).options(selectinload(Task.owner), selectinload(Task.applications))
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(task_data: TaskCreateDTO, session: AsyncSession) -> Task:
        task = Task(**task_data.model_dump())
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task

        return task

    @staticmethod
    async def cancel_all_by_owner(owner_id: int, session: AsyncSession):
        stmt = select(Task).where(Task.owner_id == owner_id, Task.status != TaskStatus.COMPLETED)
        result = await session.execute(stmt)
        tasks = result.scalars().all()
        for task in tasks:
            task.status = TaskStatus.CANCELLED
        await session.commit()


class ApplicationRepository:
    @staticmethod
    async def create(task_id: int, student_id: int, message: str | None, session: AsyncSession) -> TaskApplication:
        app = TaskApplication(task_id=task_id, student_id=student_id, message=message)
        session.add(app)
        await session.commit()
        await session.refresh(app)
        return app

    @staticmethod
    async def get_by_id(app_id: int, session: AsyncSession) -> TaskApplication | None:
        stmt = select(TaskApplication).where(TaskApplication.id == app_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

        if app:
            app.status = status
            await session.commit()
            await session.refresh(app)
        return app

    @staticmethod
    async def reject_all_by_student(student_id: int, session: AsyncSession):
        stmt = select(TaskApplication).where(TaskApplication.student_id == student_id, TaskApplication.status == ApplicationStatus.PENDING)
        result = await session.execute(stmt)
        apps = result.scalars().all()
        for app in apps:
            app.status = ApplicationStatus.REJECTED
        await session.commit()


class SubmissionRepository:
    @staticmethod
    async def create(task_id: int, student_id: int, content: str, session: AsyncSession) -> TaskSubmission:
        submission = TaskSubmission(task_id=task_id, student_id=student_id, content=content)
        session.add(submission)
        await session.commit()
        await session.refresh(submission)
        return submission

    @staticmethod
    async def get_by_task_id(task_id: int, session: AsyncSession) -> TaskSubmission | None:
        stmt = select(TaskSubmission).where(TaskSubmission.task_id == task_id).order_by(TaskSubmission.submitted_at.desc())
        result = await session.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def update_review(submission_id: int, status: str, feedback: str | None, session: AsyncSession) -> TaskSubmission | None:
        stmt = select(TaskSubmission).where(TaskSubmission.id == submission_id)
        result = await session.execute(stmt)
        sub = result.scalar_one_or_none()
        if sub:
            sub.status = status
            sub.feedback = feedback
            await session.commit()
            await session.refresh(sub)
        return sub


class TransactionRepository:
    @staticmethod
    async def create(user_id: int, amount: int, transaction_type: str, task_id: int | None, session: AsyncSession) -> PointTransaction:
        tx = PointTransaction(user_id=user_id, amount=amount, transaction_type=transaction_type, task_id=task_id)
        session.add(tx)
        await session.commit()
        await session.refresh(tx)
        return tx

    @staticmethod
    async def get_by_user(user_id: int, session: AsyncSession):
        stmt = select(PointTransaction).where(PointTransaction.user_id == user_id).order_by(PointTransaction.created_at.desc())
        result = await session.execute(stmt)
        return result.scalars().all()
