from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.all_models import Task, TaskStatus, TaskApplication, ApplicationStatus, TaskSubmission, PointTransaction, Skill, TaskAttachment, User


class TaskCreateDTO(BaseModel):
    title: str
    description: str | None = None
    acceptance_criteria: str | None = None
    performer_requirements: str | None = None
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
        exclude_student_id: int | None = None,
        min_points: int | None = None,
        max_points: int | None = None,
        deadline_before: datetime | None = None,
        deadline_after: datetime | None = None,
    ):
        stmt = select(Task).options(
            selectinload(Task.owner).selectinload(User.skills),
            selectinload(Task.owner).selectinload(User.achievements),
            selectinload(Task.assignee),
            selectinload(Task.category),
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions),
            selectinload(Task.skills),
            selectinload(Task.attachments)
        )
        if status:
            stmt = stmt.where(Task.status == status)
        if category_id:
            stmt = stmt.where(Task.category_id == category_id)
        if min_points is not None:
            stmt = stmt.where(Task.points_reward >= min_points)
        if max_points is not None:
            stmt = stmt.where(Task.points_reward <= max_points)
        if deadline_before is not None:
            stmt = stmt.where(Task.deadline <= deadline_before)
        if deadline_after is not None:
            stmt = stmt.where(Task.deadline >= deadline_after)
        
        if exclude_student_id:
            # Subquery to find task IDs already applied to by this student
            subq = select(TaskApplication.task_id).where(TaskApplication.student_id == exclude_student_id)
            stmt = stmt.where(Task.id.not_in(subq))
            
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_owner(owner_id: int, session: AsyncSession):
        stmt = select(Task).where(Task.owner_id == owner_id).options(
            selectinload(Task.owner).selectinload(User.skills),
            selectinload(Task.owner).selectinload(User.achievements),
            selectinload(Task.assignee),
            selectinload(Task.category), 
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions),
            selectinload(Task.skills),
            selectinload(Task.attachments)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_student(student_id: int, session: AsyncSession):
        stmt = select(Task).join(TaskApplication).where(
            TaskApplication.student_id == student_id
        ).options(
            selectinload(Task.owner).selectinload(User.skills),
            selectinload(Task.owner).selectinload(User.achievements),
            selectinload(Task.assignee),
            selectinload(Task.category),
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions),
            selectinload(Task.skills),
            selectinload(Task.attachments)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(task_id: int, session: AsyncSession) -> Task | None:
        stmt = select(Task).where(Task.id == task_id).options(
            selectinload(Task.owner).selectinload(User.skills),
            selectinload(Task.owner).selectinload(User.achievements),
            selectinload(Task.assignee),
            selectinload(Task.category),
            selectinload(Task.applications).selectinload(TaskApplication.student),
            selectinload(Task.applications).selectinload(TaskApplication.task),
            selectinload(Task.submissions),
            selectinload(Task.skills),
            selectinload(Task.attachments)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(task_data: TaskCreateDTO, session: AsyncSession, skill_names: list[str] = None) -> Task:
        data = task_data.model_dump()
        task = Task(**data)
        task.skills = [] # Initialize collection to avoid lazy loading triggers
        
        if skill_names:
            from database.all_models import Skill
            for name in skill_names:
                skill_stmt = select(Skill).where(Skill.name == name)
                skill_res = await session.execute(skill_stmt)
                skill = skill_res.scalar_one_or_none()
                if not skill:
                    skill = Skill(name=name)
                    session.add(skill)
                task.skills.append(skill)
                
        session.add(task)
        await session.commit()
        return await TaskRepository.get_by_id(task.id, session)

    @staticmethod
    async def update(task_id: int, update_data: dict, session: AsyncSession, skill_names: list[str] = None) -> Task | None:
        task = await TaskRepository.get_by_id(task_id, session)
        if task:
            for key, value in update_data.items():
                if value is not None:
                    setattr(task, key, value)
            
            if skill_names is not None:
                from database.all_models import Skill
                # Ensure task is in session (though get_by_id should have handled it)
                if task not in session:
                    session.add(task)
                    
                task.skills = []
                for name in skill_names:
                    skill_stmt = select(Skill).where(Skill.name == name)
                    skill_res = await session.execute(skill_stmt)
                    skill = skill_res.scalar_one_or_none()
                    if not skill:
                        skill = Skill(name=name)
                        session.add(skill)
                    task.skills.append(skill)
                    
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
    async def assign_student(task_id: int, student_id: int, session: AsyncSession) -> Task | None:
        task = await TaskRepository.get_by_id(task_id, session)
        if task:
            task.assignee_id = student_id
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
        stmt = select(TaskApplication).where(TaskApplication.id == app_id).options(
            selectinload(TaskApplication.student),
            selectinload(TaskApplication.task)
        )
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
        ).options(
            selectinload(TaskApplication.student).selectinload(User.skills),
            selectinload(TaskApplication.student).selectinload(User.achievements),
            selectinload(TaskApplication.task)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update_status(app_id: int, status: ApplicationStatus, session: AsyncSession) -> TaskApplication | None:
        app = await ApplicationRepository.get_by_id(app_id, session)
        if app:
            app.status = status
            await session.commit()
            # Re-fetch with fresh relationships after commit
            return await ApplicationRepository.get_by_id(app_id, session)
        return app

    @staticmethod
    async def reject_pending_for_task_except(task_id: int, keep_app_id: int, session: AsyncSession):
        stmt = select(TaskApplication).where(
            TaskApplication.task_id == task_id,
            TaskApplication.id != keep_app_id,
            TaskApplication.status == ApplicationStatus.PENDING
        )
        result = await session.execute(stmt)
        apps = result.scalars().all()
        for app in apps:
            app.status = ApplicationStatus.REJECTED
        await session.commit()

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


class SkillRepository:
    @staticmethod
    async def get_all(session: AsyncSession):
        stmt = select(Skill).order_by(Skill.name)
        result = await session.execute(stmt)
        return result.scalars().all()


class AttachmentRepository:
    @staticmethod
    async def create(task_id: int, filename: str, url: str, file_type: str, session: AsyncSession):
        attachment = TaskAttachment(task_id=task_id, filename=filename, url=url, file_type=file_type)
        session.add(attachment)
        await session.commit()
        await session.refresh(attachment)
        return attachment

    @staticmethod
    async def get_by_id(attachment_id: int, session: AsyncSession) -> TaskAttachment | None:
        stmt = select(TaskAttachment).where(TaskAttachment.id == attachment_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def delete(attachment_id: int, session: AsyncSession):
        attachment = await AttachmentRepository.get_by_id(attachment_id, session)
        if attachment:
            await session.delete(attachment)
            await session.commit()
            return True
        return False
