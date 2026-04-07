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
    SubmissionCreate,
    TaskCreate,
    TaskReview,
    TaskUpdate,
    build_application_response,
    build_task_response,
)


class TaskService:
    @staticmethod
    def _ensure_status(task, allowed_statuses: set[TaskStatus], detail: str) -> None:
        if task.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail=detail)

    @staticmethod
    def _ensure_owner(task, owner_id: int, detail: str) -> None:
        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail=detail)

    @staticmethod
    def _build_task_list(tasks):
        return [build_task_response(task) for task in tasks]

    @staticmethod
    def _build_application_list(applications):
        return [build_application_response(application) for application in applications]

    @staticmethod
    async def _get_task_or_404(task_id: int, session: AsyncSession):
        task = await TaskRepository.get_by_id(task_id, session)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    @staticmethod
    async def _get_application_or_404(app_id: int, session: AsyncSession):
        application = await ApplicationRepository.get_by_id(app_id, session)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        return application

    @staticmethod
    async def create_task(task_data: TaskCreate, owner_id: int, session: AsyncSession):
        dto = TaskCreateDTO(**task_data.model_dump(), owner_id=owner_id)
        task = await TaskRepository.create(dto, session)
        await TaskRepository.update_status(task.id, TaskStatus.PENDING_APPROVAL, session)
        task.status = TaskStatus.PENDING_APPROVAL
        return build_task_response(task)

    @staticmethod
    async def update_task(task_id: int, owner_id: int, update_data: TaskUpdate, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        TaskService._ensure_owner(task, owner_id, "Only the task owner can update the task")
        TaskService._ensure_status(
            task,
            {TaskStatus.PENDING_APPROVAL, TaskStatus.OPEN},
            "Only pending or open tasks can be updated",
        )

        updated_task = await TaskRepository.update(task_id, update_data.model_dump(exclude_unset=True), session)
        return build_task_response(updated_task)

    @staticmethod
    async def approve_task(task_id: int, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        TaskService._ensure_status(task, {TaskStatus.PENDING_APPROVAL}, "Only pending tasks can be approved")
        updated_task = await TaskRepository.update_status(task_id, TaskStatus.OPEN, session)
        return build_task_response(updated_task)

    @staticmethod
    async def reject_task(task_id: int, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        TaskService._ensure_status(
            task,
            {TaskStatus.PENDING_APPROVAL, TaskStatus.OPEN},
            "Task cannot be rejected in its current status",
        )
        updated_task = await TaskRepository.update_status(task_id, TaskStatus.CANCELLED, session)
        return build_task_response(updated_task)

    @staticmethod
    async def get_available_tasks(session: AsyncSession, category_id: int | None = None, user_id: int | None = None):
        tasks = await TaskRepository.get_all(
            session,
            status=TaskStatus.OPEN,
            category_id=category_id,
            exclude_student_id=user_id,
        )
        return TaskService._build_task_list(tasks)

    @staticmethod
    async def get_my_tasks(user_id: int, role: Role, session: AsyncSession):
        if role == Role.STUDENT:
            tasks = await TaskRepository.get_by_student(user_id, session)
        else:
            tasks = await TaskRepository.get_by_owner(user_id, session)
        return TaskService._build_task_list(tasks)

    @staticmethod
    async def get_incoming_applications(user_id: int, session: AsyncSession):
        applications = await ApplicationRepository.get_pending_for_owner(user_id, session)
        return TaskService._build_application_list(applications)

    @staticmethod
    async def get_tasks_for_moderation(session: AsyncSession):
        tasks = await TaskRepository.get_all(session, status=TaskStatus.PENDING_APPROVAL)
        return TaskService._build_task_list(tasks)

    @staticmethod
    async def apply_for_task(task_id: int, student_id: int, app_data: ApplicationCreate, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)

        if task.status != TaskStatus.OPEN:
            raise HTTPException(status_code=400, detail="Задача недоступна для отклика")

        existing_application = await ApplicationRepository.get_by_task_and_student(task_id, student_id, session)
        if existing_application:
            raise HTTPException(status_code=400, detail="Вы уже откликнулись на эту задачу")

        application = await ApplicationRepository.create(task_id, student_id, app_data.message, session)
        return build_application_response(application)

    @staticmethod
    async def approve_student(app_id: int, owner_id: int, session: AsyncSession):
        application = await TaskService._get_application_or_404(app_id, session)
        task = await TaskService._get_task_or_404(application.task_id, session)
        TaskService._ensure_owner(task, owner_id, "Only the task owner can approve an application")
        TaskService._ensure_status(task, {TaskStatus.OPEN}, "Student can be assigned only to an open task")

        if task.assignee_id is not None:
            raise HTTPException(status_code=400, detail="Task already has an assigned student")
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only pending applications can be approved")

        await ApplicationRepository.update_status(app_id, ApplicationStatus.ACCEPTED, session)
        await ApplicationRepository.reject_pending_for_task_except(task.id, app_id, session)
        await TaskRepository.assign_student(task.id, application.student_id, session)
        await TaskRepository.update_status(task.id, TaskStatus.IN_PROGRESS, session)

        updated_application = await ApplicationRepository.get_by_id(app_id, session)
        return build_application_response(updated_application)

    @staticmethod
    async def submit_task(task_id: int, student_id: int, submission_data: SubmissionCreate, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        TaskService._ensure_status(task, {TaskStatus.IN_PROGRESS}, "Task can be submitted only when it is in progress")

        if task.assignee_id != student_id:
            raise HTTPException(status_code=403, detail="Only the selected student can submit this task")

        submission = await SubmissionRepository.create(task_id, student_id, submission_data.content, session)
        await TaskRepository.update_status(task_id, TaskStatus.REVIEW, session)
        return submission

    @staticmethod
    async def review_task(task_id: int, owner_id: int, review_data: TaskReview, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        TaskService._ensure_owner(task, owner_id, "Only the task owner can review the submission")
        TaskService._ensure_status(task, {TaskStatus.REVIEW}, "Task review is available only after submission")

        submission = await SubmissionRepository.get_by_task_id(task_id, session)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        if task.assignee_id is None:
            raise HTTPException(status_code=400, detail="Task does not have an assigned student")

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
        task = await TaskService._get_task_or_404(task_id, session)
        TaskService._ensure_owner(task, owner_id, "Only the task owner can complete the task")
        TaskService._ensure_status(task, {TaskStatus.REVIEW}, "Task can be completed only after submission review")
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
