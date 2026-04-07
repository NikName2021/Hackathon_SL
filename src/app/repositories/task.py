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
    async def get_all(session: AsyncSession, status: TaskStatus | None = TaskStatus.OPEN, category_id: int | None = None, exclude_student_id: int | None = None):
        stmt = select(Task).options(
            selectinload(Task.owner), 
            selectinload(Task.category),
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions)
        )
        if status:
            stmt = stmt.where(Task.status == status)
        if category_id:
            stmt = stmt.where(Task.category_id == category_id)
        
        if exclude_student_id:
            # Subquery to find task IDs already applied to by this student
            subq = select(TaskApplication.task_id).where(TaskApplication.student_id == exclude_student_id)
            stmt = stmt.where(Task.id.not_in(subq))
            
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_owner(owner_id: int, session: AsyncSession):
        stmt = select(Task).where(Task.owner_id == owner_id).options(
            selectinload(Task.owner),
            selectinload(Task.category), 
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_student(student_id: int, session: AsyncSession):
        stmt = select(Task).join(TaskApplication).where(
            TaskApplication.student_id == student_id
        ).options(
            selectinload(Task.owner), 
            selectinload(Task.category),
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(task_id: int, session: AsyncSession) -> Task | None:
        stmt = select(Task).where(Task.id == task_id).options(
            selectinload(Task.owner), 
            selectinload(Task.category),
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(task_data: TaskCreateDTO, session: AsyncSession) -> Task:
        task = Task(**task_data.model_dump())
        session.add(task)
        await session.commit()
        return await TaskRepository.get_by_id(task.id, session)

    @staticmethod
    async def update(task_id: int, update_data: dict, session: AsyncSession) -> Task | None:
        task = await TaskRepository.get_by_id(task_id, session)
        if task:
            for key, value in update_data.items():
                if value is not None:
                    setattr(task, key, value)
            await session.commit()
            return await TaskRepository.get_by_id(task_id, session)
        return task

    @staticmethod
    async def update_status(task_id: int, status: TaskStatus, session: AsyncSession) -> Task | None:
        task = await TaskRepository.get_by_id(task_id, session)
        if task:
            task.status = status
            await session.commit()
            return await TaskRepository.get_by_id(task_id, session)
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
        
        # Load relationships for the response
        stmt = select(TaskApplication).where(TaskApplication.id == app.id).options(
            selectinload(TaskApplication.student),
            selectinload(TaskApplication.task)
        )
        result = await session.execute(stmt)
        return result.scalar_one()

    @staticmethod
    async def get_by_id(app_id: int, session: AsyncSession) -> TaskApplication | None:
        stmt = select(TaskApplication).where(TaskApplication.id == app_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_task_and_student(task_id: int, student_id: int, session: AsyncSession) -> TaskApplication | None:
        stmt = select(TaskApplication).where(TaskApplication.task_id == task_id, TaskApplication.student_id == student_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_pending_for_owner(owner_id: int, session: AsyncSession):
        stmt = select(TaskApplication).join(Task).where(
            Task.owner_id == owner_id,
            TaskApplication.status == ApplicationStatus.PENDING
        ).options(selectinload(TaskApplication.student), selectinload(TaskApplication.task))
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update_status(app_id: int, status: ApplicationStatus, session: AsyncSession) -> TaskApplication | None:
        app = await ApplicationRepository.get_by_id(app_id, session)
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
