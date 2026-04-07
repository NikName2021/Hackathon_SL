from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.all_models import (
    ApplicationStatus,
    PointTransaction,
    Task,
    TaskApplication,
    TaskStatus,
    TaskSubmission,
)


TASK_LOAD_OPTIONS = (
    selectinload(Task.owner),
    selectinload(Task.assignee),
    selectinload(Task.category),
    selectinload(Task.applications).selectinload(TaskApplication.student),
    selectinload(Task.submissions),
)

APPLICATION_LOAD_OPTIONS = (
    selectinload(TaskApplication.student),
    selectinload(TaskApplication.task).selectinload(Task.owner),
    selectinload(TaskApplication.task).selectinload(Task.assignee),
    selectinload(TaskApplication.task).selectinload(Task.category),
    selectinload(TaskApplication.task).selectinload(Task.submissions),
)


async def _fetch_one(session: AsyncSession, stmt):
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _fetch_all(session: AsyncSession, stmt):
    result = await session.execute(stmt)
    return result.unique().scalars().all()


async def _reject_pending_applications(
    task_id: int,
    *,
    except_app_id: int,
    session: AsyncSession,
):
    stmt = select(TaskApplication).where(
        TaskApplication.task_id == task_id,
        TaskApplication.id != except_app_id,
        TaskApplication.status == ApplicationStatus.PENDING,
    )
    result = await session.execute(stmt)
    applications = result.scalars().all()
    for application in applications:
        application.status = ApplicationStatus.REJECTED
    await session.commit()


class TaskCreateDTO(BaseModel):
    title: str
    description: str | None = None
    category_id: int | None = None
    owner_id: int
    points_reward: int = 0
    deadline: datetime | None = None


class TaskRepository:
    @staticmethod
    async def get_all(
        session: AsyncSession,
        status: TaskStatus | None = TaskStatus.OPEN,
        category_id: int | None = None,
    ):
        stmt = select(Task).options(*TASK_LOAD_OPTIONS)
        if status:
            stmt = stmt.where(Task.status == status)
        if category_id:
            stmt = stmt.where(Task.category_id == category_id)
        return await _fetch_all(session, stmt)

    @staticmethod
    async def get_by_owner(owner_id: int, session: AsyncSession):
        stmt = select(Task).where(Task.owner_id == owner_id).options(*TASK_LOAD_OPTIONS)
        return await _fetch_all(session, stmt)

    @staticmethod
    async def get_by_student(student_id: int, session: AsyncSession):
        stmt = (
            select(Task)
            .outerjoin(TaskApplication)
            .where(
                or_(
                    Task.assignee_id == student_id,
                    and_(
                        TaskApplication.student_id == student_id,
                        TaskApplication.status == ApplicationStatus.ACCEPTED,
                    ),
                )
            )
            .options(*TASK_LOAD_OPTIONS)
        )
        return await _fetch_all(session, stmt)

    @staticmethod
    async def get_by_id(task_id: int, session: AsyncSession) -> Task | None:
        stmt = select(Task).where(Task.id == task_id).options(*TASK_LOAD_OPTIONS)
        return await _fetch_one(session, stmt)

    @staticmethod
    async def create(task_data: TaskCreateDTO, session: AsyncSession) -> Task:
        task = Task(**task_data.model_dump())
        session.add(task)
        await session.commit()
        return await TaskRepository.get_by_id(task.id, session)

    @staticmethod
    async def update_status(task_id: int, status: TaskStatus, session: AsyncSession) -> Task | None:
        task = await TaskRepository.get_by_id(task_id, session)
        if task:
            task.status = status
            await session.commit()
            return await TaskRepository.get_by_id(task_id, session)
        return None

    @staticmethod
    async def assign_student(task_id: int, student_id: int | None, session: AsyncSession) -> Task | None:
        task = await TaskRepository.get_by_id(task_id, session)
        if task:
            task.assignee_id = student_id
            await session.commit()
            return await TaskRepository.get_by_id(task_id, session)
        return None

    @staticmethod
    async def reject_pending_applications_for_task(task_id: int, except_app_id: int, session: AsyncSession):
        await _reject_pending_applications(task_id, except_app_id=except_app_id, session=session)

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
        return await ApplicationRepository.get_by_id(app.id, session)

    @staticmethod
    async def get_by_id(app_id: int, session: AsyncSession) -> TaskApplication | None:
        stmt = select(TaskApplication).where(TaskApplication.id == app_id).options(*APPLICATION_LOAD_OPTIONS)
        return await _fetch_one(session, stmt)

    @staticmethod
    async def get_by_task_and_student(task_id: int, student_id: int, session: AsyncSession) -> TaskApplication | None:
        stmt = (
            select(TaskApplication)
            .where(TaskApplication.task_id == task_id, TaskApplication.student_id == student_id)
            .options(*APPLICATION_LOAD_OPTIONS)
        )
        return await _fetch_one(session, stmt)

    @staticmethod
    async def get_pending_for_owner(owner_id: int, session: AsyncSession):
        stmt = (
            select(TaskApplication)
            .join(Task)
            .where(Task.owner_id == owner_id, TaskApplication.status == ApplicationStatus.PENDING)
            .options(*APPLICATION_LOAD_OPTIONS)
        )
        return await _fetch_all(session, stmt)

    @staticmethod
    async def update_status(app_id: int, status: ApplicationStatus, session: AsyncSession) -> TaskApplication | None:
        app = await ApplicationRepository.get_by_id(app_id, session)
        if app:
            app.status = status
            await session.commit()
            return await ApplicationRepository.get_by_id(app_id, session)
        return None

    @staticmethod
    async def reject_all_by_student(student_id: int, session: AsyncSession):
        stmt = select(TaskApplication).where(
            TaskApplication.student_id == student_id,
            TaskApplication.status == ApplicationStatus.PENDING,
        )
        result = await session.execute(stmt)
        apps = result.scalars().all()
        for app in apps:
            app.status = ApplicationStatus.REJECTED
        await session.commit()

    @staticmethod
    async def reject_pending_for_task_except(task_id: int, approved_app_id: int, session: AsyncSession):
        await _reject_pending_applications(task_id, except_app_id=approved_app_id, session=session)


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
    async def update_review(
        submission_id: int,
        status: str,
        feedback: str | None,
        session: AsyncSession,
    ) -> TaskSubmission | None:
        stmt = select(TaskSubmission).where(TaskSubmission.id == submission_id)
        result = await session.execute(stmt)
        submission = result.scalar_one_or_none()
        if submission:
            submission.status = status
            submission.feedback = feedback
            await session.commit()
            await session.refresh(submission)
        return submission


class TransactionRepository:
    @staticmethod
    async def create(
        user_id: int,
        amount: int,
        transaction_type: str,
        task_id: int | None,
        session: AsyncSession,
    ) -> PointTransaction:
        tx = PointTransaction(user_id=user_id, amount=amount, transaction_type=transaction_type, task_id=task_id)
        session.add(tx)
        await session.commit()
        await session.refresh(tx)
        return tx

    @staticmethod
    async def get_by_user(user_id: int, session: AsyncSession):
        stmt = (
            select(PointTransaction)
            .where(PointTransaction.user_id == user_id)
            .order_by(PointTransaction.created_at.desc())
        )
        result = await session.execute(stmt)
        return result.scalars().all()
