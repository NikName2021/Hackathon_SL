import os
import uuid
import shutil
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from database.all_models import TaskStatus, ApplicationStatus, User, Role
from repositories.task import TaskRepository, TaskCreateDTO, ApplicationRepository, SubmissionRepository, TransactionRepository, AttachmentRepository
from repositories.user import UserRepository
from services.gamification_service import GamificationService
from schemas.task import TaskCreate, ApplicationCreate, SubmissionCreate, TaskReview, TaskUpdate


class TaskService:
    @staticmethod
    async def create_task(task_data: TaskCreate, owner_id: int, session: AsyncSession):
        dto = TaskCreateDTO(
            **task_data.model_dump(exclude={"skills"}),
            owner_id=owner_id
        )
        task = await TaskRepository.create(dto, session, skill_names=task_data.skills)
        # Initial status for moderation
        await TaskRepository.update_status(task.id, TaskStatus.PENDING_APPROVAL, session)
        return task

    @staticmethod
    async def update_task(task_id: int, owner_id: int, update_data: TaskUpdate, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")
        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Вы не являетесь владельцем задачи")
        
        updated_task = await TaskRepository.update(
            task_id, 
            update_data.model_dump(exclude_unset=True, exclude={"skills"}), 
            session,
            skill_names=update_data.skills
        )
        return updated_task

    @staticmethod
    async def approve_task(task_id: int, session: AsyncSession):
        return await TaskRepository.update_status(task_id, TaskStatus.OPEN, session)

    @staticmethod
    async def reject_task(task_id: int, session: AsyncSession):
        return await TaskRepository.update_status(task_id, TaskStatus.CANCELLED, session)

    @staticmethod
    async def get_available_tasks(session: AsyncSession, category_id: int | None = None, user_id: int | None = None):
        return await TaskRepository.get_all(session, status=TaskStatus.OPEN, category_id=category_id, exclude_student_id=user_id)

    @staticmethod
    async def get_my_tasks(user_id: int, role: Role, session: AsyncSession):
        if role == Role.STUDENT:
            return await TaskRepository.get_by_student(user_id, session)
        else:
            return await TaskRepository.get_by_owner(user_id, session)

    @staticmethod
    async def get_incoming_applications(user_id: int, session: AsyncSession):
        return await ApplicationRepository.get_pending_for_owner(user_id, session)

    @staticmethod
    async def get_tasks_for_moderation(session: AsyncSession):
        return await TaskRepository.get_all(session, status=TaskStatus.PENDING_APPROVAL)

    @staticmethod
    async def apply_for_task(task_id: int, student_id: int, app_data: ApplicationCreate, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")
        
        if task.status != TaskStatus.OPEN:
            raise HTTPException(status_code=400, detail="Задача не доступна для отклика")

        # Check if already applied
        for app in task.applications:
            if app.student_id == student_id:
                raise HTTPException(status_code=400, detail="Вы уже откликнулись на эту задачу")

        return await ApplicationRepository.create(task_id, student_id, app_data.message, session)

    @staticmethod
    async def approve_student(app_id: int, owner_id: int, session: AsyncSession):
        app = await ApplicationRepository.get_by_id(app_id, session)
        if not app:
            raise HTTPException(status_code=404, detail="Отклик не найден")
        
        task = await TaskRepository.get_by_id(app.task_id, session)
        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Только владелец задачи может выбирать исполнителя")

        # Update application status
        await ApplicationRepository.update_status(app_id, ApplicationStatus.ACCEPTED, session)
        
        # Update task status
        await TaskRepository.update_status(task.id, TaskStatus.IN_PROGRESS, session)
        
        return app

    @staticmethod
    async def submit_task(task_id: int, student_id: int, submission_data: SubmissionCreate, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")
        
        # Verify student is the assigned performer
        assigned = False
        for app in task.applications:
            if app.student_id == student_id and app.status == ApplicationStatus.ACCEPTED:
                assigned = True
                break
        
        if not assigned:
            raise HTTPException(status_code=403, detail="Вы не являетесь исполнителем этой задачи")

        submission = await SubmissionRepository.create(task_id, student_id, submission_data.content, session)
        await TaskRepository.update_status(task_id, TaskStatus.REVIEW, session)
        return submission

    @staticmethod
    async def review_task(task_id: int, owner_id: int, review_data: TaskReview, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")
        
        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Только владелец задачи может проводить ревью")

        submission = await SubmissionRepository.get_by_task_id(task_id, session)
        if not submission:
            raise HTTPException(status_code=404, detail="Сдача работы не найдена")

        if review_data.is_approved:
            await SubmissionRepository.update_review(submission.id, "approved", review_data.feedback, session)
            await TaskRepository.update_status(task_id, TaskStatus.COMPLETED, session)
            
            # Award points
            await UserRepository.update_points(submission.student_id, task.points_reward, session)
            await TransactionRepository.create(submission.student_id, task.points_reward, "earned", task.id, session)
            
            # Simple reputation update (MVP: 1 task = +1 reputation point)
            user = await UserRepository.get_by_id(submission.student_id, session)
            if user:
                user.reputation += 1.0 # Simple fixed increment for now
                await session.commit()
                
            # Check for achievements
            await GamificationService.check_achievements(submission.student_id, session)
        else:
            await SubmissionRepository.update_review(submission.id, "rejected", review_data.feedback, session)
            await TaskRepository.update_status(task_id, TaskStatus.IN_PROGRESS, session)
        
        return task

    @staticmethod
    async def ban_user(user_id: int, session: AsyncSession):
        user = await UserRepository.update_status(user_id, False, session)
        if not user:
            return None
        
        # Cancel all active tasks where user is owner
        await TaskRepository.cancel_all_by_owner(user_id, session)
        
        # Reject all active applications by the user
        await ApplicationRepository.reject_all_by_student(user_id, session)
        
        return user

    @staticmethod
    async def upload_attachments(task_id: int, files: list, session: AsyncSession):
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
            # Simple check for file type
            file_type = "image" if file.content_type.startswith("image/") else "document"
            
            attachment = await AttachmentRepository.create(task_id, file.filename, url, file_type, session)
            attachments.append(attachment)
            
        return attachments

    @staticmethod
    async def delete_attachment(attachment_id: int, session: AsyncSession):
        attachment = await AttachmentRepository.get_by_id(attachment_id, session)
        if not attachment:
            raise HTTPException(status_code=404, detail="Вложение не найдено")
        
        # Remove file from disk
        file_path = attachment.url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return await AttachmentRepository.delete(attachment_id, session)
