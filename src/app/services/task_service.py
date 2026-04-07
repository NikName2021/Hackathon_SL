from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database.all_models import ApplicationStatus, Role, TaskStatus
from repositories.task import (
    ApplicationRepository,
    SubmissionRepository,
    TaskCreateDTO,
    TaskRepository,
    TransactionRepository,
)
from repositories.user import UserRepository
from schemas.task import (
    ApplicationCreate,
    TaskCreate,
    TaskReview,
    SubmissionCreate,
    build_application_response,
    build_task_response,
)


class TaskService:
    @staticmethod
    async def create_task(task_data: TaskCreate, owner_id: int, session: AsyncSession):
        dto = TaskCreateDTO(**task_data.model_dump(), owner_id=owner_id)
        task = await TaskRepository.create(dto, session)
        await TaskRepository.update_status(task.id, TaskStatus.PENDING_APPROVAL, session)
        task.status = TaskStatus.PENDING_APPROVAL
        return build_task_response(task)

    @staticmethod
    async def approve_task(task_id: int, session: AsyncSession):
        task = await TaskRepository.update_status(task_id, TaskStatus.OPEN, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return build_task_response(task)

    @staticmethod
    async def reject_task(task_id: int, session: AsyncSession):
        task = await TaskRepository.update_status(task_id, TaskStatus.CANCELLED, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return build_task_response(task)

    @staticmethod
    async def get_available_tasks(session: AsyncSession, category_id: int | None = None):
        tasks = await TaskRepository.get_all(session, status=TaskStatus.OPEN, category_id=category_id)
        return [build_task_response(task) for task in tasks]

    @staticmethod
    async def get_my_tasks(user_id: int, role: Role, session: AsyncSession):
        if role == Role.STUDENT:
            tasks = await TaskRepository.get_by_student(user_id, session)
        else:
            tasks = await TaskRepository.get_by_owner(user_id, session)
        return [build_task_response(task) for task in tasks]

    @staticmethod
    async def get_incoming_applications(user_id: int, session: AsyncSession):
        applications = await ApplicationRepository.get_pending_for_owner(user_id, session)
        return [build_application_response(app) for app in applications]

    @staticmethod
    async def get_tasks_for_moderation(session: AsyncSession):
        tasks = await TaskRepository.get_all(session, status=TaskStatus.PENDING_APPROVAL)
        return [build_task_response(task) for task in tasks]

    @staticmethod
    async def apply_for_task(task_id: int, student_id: int, app_data: ApplicationCreate, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")

        if task.status != TaskStatus.OPEN:
            raise HTTPException(status_code=400, detail="Задача недоступна для отклика")

        existing_application = await ApplicationRepository.get_by_task_and_student(task_id, student_id, session)
        if existing_application:
            raise HTTPException(status_code=400, detail="Вы уже откликнулись на эту задачу")

        application = await ApplicationRepository.create(task_id, student_id, app_data.message, session)
        if getattr(application, "task", None) is None:
            application.task = task
        return build_application_response(application)

    @staticmethod
    async def approve_student(app_id: int, owner_id: int, session: AsyncSession):
        application = await ApplicationRepository.get_by_id(app_id, session)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        task = await TaskRepository.get_by_id(application.task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only the task owner can approve an application")

        await ApplicationRepository.update_status(app_id, ApplicationStatus.ACCEPTED, session)
        await TaskRepository.update_status(task.id, TaskStatus.IN_PROGRESS, session)

        updated_application = await ApplicationRepository.get_by_id(app_id, session)
        return build_application_response(updated_application)

    @staticmethod
    async def submit_task(task_id: int, student_id: int, submission_data: SubmissionCreate, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        assigned = any(
            app.student_id == student_id and app.status == ApplicationStatus.ACCEPTED
            for app in task.applications
        )
        if not assigned:
            raise HTTPException(status_code=403, detail="Only the selected student can submit this task")

        submission = await SubmissionRepository.create(task_id, student_id, submission_data.content, session)
        await TaskRepository.update_status(task_id, TaskStatus.REVIEW, session)
        return submission

    @staticmethod
    async def review_task(task_id: int, owner_id: int, review_data: TaskReview, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only the task owner can review the submission")

        submission = await SubmissionRepository.get_by_task_id(task_id, session)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        if review_data.is_approved:
            await SubmissionRepository.update_review(submission.id, "approved", review_data.feedback, session)
            await TaskRepository.update_status(task_id, TaskStatus.COMPLETED, session)
            await UserRepository.update_points(submission.student_id, task.points_reward, session)
            await TransactionRepository.create(submission.student_id, task.points_reward, "earned", task.id, session)

            user = await UserRepository.get_by_id(submission.student_id, session)
            if user:
                user.reputation += 1.0
                await session.commit()
        else:
            await SubmissionRepository.update_review(submission.id, "rejected", review_data.feedback, session)
            await TaskRepository.update_status(task_id, TaskStatus.IN_PROGRESS, session)

        updated_task = await TaskRepository.get_by_id(task_id, session)
        return build_task_response(updated_task)

    @staticmethod
    async def complete_task(task_id: int, owner_id: int, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only the task owner can complete the task")

        if task.status != TaskStatus.REVIEW:
            raise HTTPException(status_code=400, detail="Task can be completed only after submission review")

        updated_task = await TaskRepository.update_status(task_id, TaskStatus.COMPLETED, session)
        return build_task_response(updated_task)

    @staticmethod
    async def ban_user(user_id: int, session: AsyncSession):
        user = await UserRepository.update_status(user_id, False, session)
        if not user:
            return None

        await TaskRepository.cancel_all_by_owner(user_id, session)
        await ApplicationRepository.reject_all_by_student(user_id, session)
        return user
