import os
import shutil
import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database.all_models import ApplicationStatus, Role, TaskStatus
from repositories.task import (
    ApplicationRepository,
    AttachmentRepository,
    SubmissionRepository,
    TaskCreateDTO,
    TaskRepository,
    TransactionRepository,
)
from repositories.user import UserRepository
from schemas.task import ApplicationCreate, SubmissionCreate, TaskCreate, TaskReview, TaskUpdate
from services.gamification_service import GamificationService


class TaskService:
    @staticmethod
    async def _get_task_or_404(task_id: int, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    @staticmethod
    async def _get_application_or_404(app_id: int, session: AsyncSession):
        app = await ApplicationRepository.get_by_id(app_id, session)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app

    @staticmethod
    async def create_task(task_data: TaskCreate, owner_id: int, session: AsyncSession):
        dto = TaskCreateDTO(**task_data.model_dump(exclude={"skills"}), owner_id=owner_id)
        task = await TaskRepository.create(dto, session, skill_names=task_data.skills)
        return await TaskRepository.update_status(task.id, TaskStatus.PENDING_APPROVAL, session)

    @staticmethod
    async def get_task_for_user(task_id: int, user_id: int, role: Role, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if role == Role.ADMIN:
            return task
        if task.owner_id == user_id:
            return task
        if role == Role.STUDENT and task.assignee_id == user_id:
            return task
        raise HTTPException(status_code=403, detail="Forbidden")

    @staticmethod
    async def update_task(task_id: int, owner_id: int, update_data: TaskUpdate, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only owner can update task")
        if task.status not in {TaskStatus.PENDING_APPROVAL, TaskStatus.OPEN}:
            raise HTTPException(status_code=400, detail="Task is not editable in current status")

        return await TaskRepository.update(
            task_id,
            update_data.model_dump(exclude_unset=True, exclude={"skills"}),
            session,
            skill_names=update_data.skills,
        )

    @staticmethod
    async def approve_task(task_id: int, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.status != TaskStatus.PENDING_APPROVAL:
            raise HTTPException(status_code=400, detail="Only pending tasks can be approved")
        return await TaskRepository.update_status(task_id, TaskStatus.OPEN, session)

    @staticmethod
    async def reject_task(task_id: int, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.status not in {TaskStatus.PENDING_APPROVAL, TaskStatus.OPEN}:
            raise HTTPException(status_code=400, detail="Task cannot be rejected in current status")
        return await TaskRepository.update_status(task_id, TaskStatus.CANCELLED, session)

    @staticmethod
    async def get_available_tasks(session: AsyncSession, category_id: int | None = None, user_id: int | None = None):
        return await TaskRepository.get_all(
            session,
            status=TaskStatus.OPEN,
            category_id=category_id,
            exclude_student_id=user_id,
        )
    
    @staticmethod
    async def get_available_tasks_filtered(
        session: AsyncSession,
        category_id: int | None = None,
        user_id: int | None = None,
        min_points: int | None = None,
        max_points: int | None = None,
        deadline_before: datetime | None = None,
        deadline_after: datetime | None = None,
    ):
        return await TaskRepository.get_all(
            session,
            status=TaskStatus.OPEN,
            category_id=category_id,
            exclude_student_id=user_id,
            min_points=min_points,
            max_points=max_points,
            deadline_before=deadline_before,
            deadline_after=deadline_after,
        )

    @staticmethod
    async def get_my_tasks(user_id: int, role: Role, session: AsyncSession):
        if role == Role.STUDENT:
            return await TaskRepository.get_by_student(user_id, session)
        return await TaskRepository.get_by_owner(user_id, session)

    @staticmethod
    async def get_incoming_applications(user_id: int, session: AsyncSession):
        return await ApplicationRepository.get_pending_for_owner(user_id, session)

    @staticmethod
    async def get_tasks_for_moderation(session: AsyncSession):
        return await TaskRepository.get_all(session, status=TaskStatus.PENDING_APPROVAL)

    @staticmethod
    async def apply_for_task(task_id: int, student_id: int, app_data: ApplicationCreate, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.status != TaskStatus.OPEN:
            raise HTTPException(status_code=400, detail="Task is not available")
        if task.owner_id == student_id:
            raise HTTPException(status_code=400, detail="Cannot apply for own task")

        existing = await ApplicationRepository.get_by_task_and_student(task_id, student_id, session)
        if existing:
            raise HTTPException(status_code=400, detail="Already applied")

        return await ApplicationRepository.create(task_id, student_id, app_data.message, session)

    @staticmethod
    async def approve_student(app_id: int, owner_id: int, session: AsyncSession):
        app = await TaskService._get_application_or_404(app_id, session)
        task = await TaskService._get_task_or_404(app.task_id, session)

        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only task owner can approve")
        if task.status != TaskStatus.OPEN:
            raise HTTPException(status_code=400, detail="Task is not open")
        if app.status != ApplicationStatus.PENDING:
            raise HTTPException(status_code=400, detail="Application is not pending")
        if task.assignee_id is not None:
            raise HTTPException(status_code=400, detail="Task already has assignee")

        accepted = await ApplicationRepository.update_status(app_id, ApplicationStatus.ACCEPTED, session)
        await ApplicationRepository.reject_pending_for_task_except(task.id, app_id, session)
        await TaskRepository.assign_student(task.id, app.student_id, session)
        await TaskRepository.update_status(task.id, TaskStatus.IN_PROGRESS, session)
        return accepted

    @staticmethod
    async def reject_student(app_id: int, owner_id: int, session: AsyncSession):
        app = await TaskService._get_application_or_404(app_id, session)
        task = await TaskService._get_task_or_404(app.task_id, session)

        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only task owner can reject")
        if app.status != ApplicationStatus.PENDING:
            raise HTTPException(status_code=400, detail="Application is not pending")

        return await ApplicationRepository.update_status(app_id, ApplicationStatus.REJECTED, session)

    @staticmethod
    async def submit_task(task_id: int, student_id: int, submission_data: SubmissionCreate, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.status != TaskStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Task is not in progress")
        if task.assignee_id != student_id:
            raise HTTPException(status_code=403, detail="Only assignee can submit")

        submission = await SubmissionRepository.create(task_id, student_id, submission_data.content, session)
        await TaskRepository.update_status(task_id, TaskStatus.REVIEW, session)
        return submission

    @staticmethod
    async def review_task(task_id: int, owner_id: int, review_data: TaskReview, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only task owner can review")
        if task.status != TaskStatus.REVIEW:
            raise HTTPException(status_code=400, detail="Task is not under review")

        submission = await SubmissionRepository.get_by_task_id(task_id, session)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        if task.assignee_id != submission.student_id:
            raise HTTPException(status_code=400, detail="Submission does not match assignee")

        if review_data.is_approved:
            await SubmissionRepository.update_review(submission.id, "approved", review_data.feedback, session)
            await TaskRepository.update_status(task_id, TaskStatus.COMPLETED, session)
            await UserRepository.update_points(submission.student_id, task.points_reward, session)
            await TransactionRepository.create(submission.student_id, task.points_reward, "earned", task.id, session)

            user = await UserRepository.get_by_id(submission.student_id, session)
            if user:
                user.reputation += 1.0
                await session.commit()

            await GamificationService.check_achievements(submission.student_id, session)
        else:
            await SubmissionRepository.update_review(submission.id, "rejected", review_data.feedback, session)
            await TaskRepository.update_status(task_id, TaskStatus.IN_PROGRESS, session)

        return await TaskRepository.get_by_id(task_id, session)

    @staticmethod
    async def complete_task(task_id: int, owner_id: int, session: AsyncSession):
        return await TaskService.review_task(
            task_id,
            owner_id,
            TaskReview(is_approved=True, feedback=None),
            session,
        )

    @staticmethod
    async def ban_user(user_id: int, session: AsyncSession):
        user = await UserRepository.update_status(user_id, False, session)
        if not user:
            return None

        await TaskRepository.cancel_all_by_owner(user_id, session)
        await ApplicationRepository.reject_all_by_student(user_id, session)
        return user

    @staticmethod
    async def upload_attachments(task_id: int, files: list, session: AsyncSession):
        await TaskService._get_task_or_404(task_id, session)

        upload_dir = "uploads/task_attachments"
        os.makedirs(upload_dir, exist_ok=True)

        attachments = []
        for file in files:
            file_ext = file.filename.split(".")[-1]
            file_name = f"{task_id}_{uuid.uuid4().hex}.{file_ext}"
            file_path = os.path.join(upload_dir, file_name)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            url = f"/uploads/task_attachments/{file_name}"
            file_type = "image" if file.content_type.startswith("image/") else "document"
            attachment = await AttachmentRepository.create(task_id, file.filename, url, file_type, session)
            attachments.append(attachment)

        return attachments

    @staticmethod
    async def delete_attachment(attachment_id: int, session: AsyncSession):
        attachment = await AttachmentRepository.get_by_id(attachment_id, session)
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")

        file_path = attachment.url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

        return await AttachmentRepository.delete(attachment_id, session)
