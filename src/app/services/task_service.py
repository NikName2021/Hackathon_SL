import math
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
from repositories.team import TeamRepository
from schemas.task import ApplicationCreate, SubmissionCreate, TaskCreate, TaskReview, TaskUpdate, SmartBadge
from schemas.team import TeamCreate
from services.gamification_service import GamificationService
from sqlalchemy import select, func
from database.all_models import Task, TaskSubmission, TaskApplication, ActivityType
from repositories.activity import ActivityLogRepository


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
        # Log activity: New task created (for owner info)
        await ActivityLogRepository.create(session, owner_id, ActivityType.TASK_CREATED, actor_id=owner_id, task_id=task.id)
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
        if task.status not in {TaskStatus.PENDING_APPROVAL, TaskStatus.OPEN, TaskStatus.CANCELLED}:
            raise HTTPException(status_code=400, detail="Task is not editable in current status")

        updated_task = await TaskRepository.update(
            task_id,
            update_data.model_dump(exclude_unset=True, exclude={"skills"}),
            session,
            skill_names=update_data.skills,
        )
        
        # If task was cancelled (rejected), after edit move it back to moderation
        if updated_task and updated_task.status == TaskStatus.CANCELLED:
             # Reset status and clear rejection reason
             await TaskRepository.update_status(task_id, TaskStatus.PENDING_APPROVAL, session, reason=None)
             
        return updated_task

    @staticmethod
    async def approve_task(task_id: int, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.status != TaskStatus.PENDING_APPROVAL:
            raise HTTPException(status_code=400, detail="Only pending tasks can be approved")
        
        # Log activity: Task approved
        await ActivityLogRepository.create(session, task.owner_id, ActivityType.TASK_APPROVED, task_id=task.id)
        
        return await TaskRepository.update_status(task_id, TaskStatus.OPEN, session)

    @staticmethod
    async def reject_task(task_id: int, reason: str, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.status not in {TaskStatus.PENDING_APPROVAL, TaskStatus.OPEN}:
            raise HTTPException(status_code=400, detail="Task cannot be rejected in current status")
            
        # Log activity: Task rejected
        await ActivityLogRepository.create(session, task.owner_id, ActivityType.TASK_REJECTED, task_id=task.id, content=reason)
        
        return await TaskRepository.update_status(task_id, TaskStatus.CANCELLED, session, reason=reason)

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
        apps = await ApplicationRepository.get_pending_for_owner(user_id, session)
        if not apps:
            return []
            
        # Enrich apps with smart badges
        for app in apps:
            badges = []
            score = 0
            
            # 1. Category Top
            if app.task.category_id:
                cat_tasks_stmt = select(func.count(Task.id)).where(
                    Task.assignee_id == app.student_id,
                    Task.category_id == app.task.category_id,
                    Task.status == TaskStatus.COMPLETED
                )
                cat_count = (await session.execute(cat_tasks_stmt)).scalar() or 0
                if cat_count >= 1:
                    badges.append(SmartBadge(
                        type="category_top",
                        label="Топ в категории",
                        description=f"Выполнил {cat_count} задач в этой категории"
                    ))
                    score += cat_count * 2
            
            # 2. Department Veteran
            owner_tasks_stmt = select(func.count(Task.id)).where(
                Task.assignee_id == app.student_id,
                Task.owner_id == user_id,
                Task.status == TaskStatus.COMPLETED
            )
            owner_count = (await session.execute(owner_tasks_stmt)).scalar() or 0
            if owner_count >= 1:
                badges.append(SmartBadge(
                    type="department_veteran",
                    label="Старожил кафедры",
                    description=f"Ранее выполнил {owner_count} задач для вас"
                ))
                score += owner_count * 3
            
            # 3. Speedster (by reputation for now as proxy)
            if app.student.reputation >= 20:
                badges.append(SmartBadge(
                    type="speedster",
                    label="Быстрый старт",
                    description="Имеет высокую репутацию и проверенную скорость"
                ))
                score += app.student.reputation / 10
            
            app.smart_badges = badges
            app.match_score = score # Transient field for sorting
            
        # Flag Top 3 as Best Match
        sorted_apps = sorted(apps, key=lambda x: getattr(x, 'match_score', 0), reverse=True)
        for i, app in enumerate(sorted_apps):
            app.is_best_match = (i < 3 and getattr(app, 'match_score', 0) > 0)
            
        return apps

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

        # Team validation if applicable
        if app_data.team_id:
            team = await TeamRepository.get_by_id(app_data.team_id, session)
            if not team:
                raise HTTPException(status_code=404, detail="Team not found")
            if team.creator_id != student_id:
                raise HTTPException(status_code=403, detail="Only team leader can apply")
            if team.task_id != task_id:
                raise HTTPException(status_code=400, detail="Team is for another task")
            
            # Update team status to applied
            await TeamRepository.update_status(app_data.team_id, "applied", session)

        app = await ApplicationRepository.create(task_id, student_id, app_data.message, session, team_id=app_data.team_id)
        
        # Log activity: New application for owner
        await ActivityLogRepository.create(session, task.owner_id, ActivityType.NEW_APPLICATION, actor_id=student_id, task_id=task.id)
        
        return app

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
        if task.assignee_id is not None or task.team_id is not None:
            raise HTTPException(status_code=400, detail="Task already has assignee or team")

        accepted = await ApplicationRepository.update_status(app_id, ApplicationStatus.ACCEPTED, session)
        await ApplicationRepository.reject_pending_for_task_except(task.id, app_id, session)
        
        if app.team_id:
            await TaskRepository.assign_team(task.id, app.team_id, session)
            await TeamRepository.update_status(app.team_id, "active", session)
        else:
            await TaskRepository.assign_student(task.id, app.student_id, session)
            
        await TaskRepository.update_status(task.id, TaskStatus.IN_PROGRESS, session)
        
        # Log activity: Application accepted
        await ActivityLogRepository.create(session, app.student_id, ActivityType.APPLICATION_ACCEPTED, actor_id=owner_id, task_id=task.id)
        
        return accepted

    @staticmethod
    async def reject_student(app_id: int, owner_id: int, session: AsyncSession):
        app = await TaskService._get_application_or_404(app_id, session)
        task = await TaskService._get_task_or_404(app.task_id, session)

        if task.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Only task owner can reject")
        if app.status != ApplicationStatus.PENDING:
            raise HTTPException(status_code=400, detail="Application is not pending")

        # Log activity: Application rejected
        await ActivityLogRepository.create(session, app.student_id, ActivityType.APPLICATION_REJECTED, actor_id=owner_id, task_id=task.id)

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
        
        # Log activity: Work submitted
        await ActivityLogRepository.create(session, task.owner_id, ActivityType.WORK_SUBMITTED, actor_id=student_id, task_id=task.id)
        
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
            
            # Point awarding
            reward_recipients = []
            if task.team_id:
                team = await TeamRepository.get_by_id(task.team_id, session)
                if team:
                    reward_recipients = [m.user_id for m in team.members]
                    await TeamRepository.update_status(task.team_id, "completed", session)
            else:
                reward_recipients = [submission.student_id]
                
            if reward_recipients:
                individual_reward = math.ceil(task.points_reward / len(reward_recipients))
                for user_id in reward_recipients:
                    await UserRepository.update_points(user_id, individual_reward, session)
                    await TransactionRepository.create(user_id, individual_reward, "earned", task.id, session)
                    
                    user = await UserRepository.get_by_id(user_id, session)
                    if user:
                        user.reputation += 1.0 # In team reward, everyone gets reputation?
                        # await session.commit() # Repository handles commit usually, but here we might need it for each user update if not in one transaction
                
                await session.commit()

            await GamificationService.check_achievements(submission.student_id, session)
        else:
            await SubmissionRepository.update_review(submission.id, "rejected", review_data.feedback, session)
            await TaskRepository.update_status(task_id, TaskStatus.IN_PROGRESS, session)
            
            # Log activity: Work rejected
            await ActivityLogRepository.create(session, submission.student_id, ActivityType.WORK_REJECTED, actor_id=owner_id, task_id=task.id, content=review_data.feedback)

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

    @staticmethod
    async def create_team(task_id: int, creator_id: int, team_data: TeamCreate, session: AsyncSession):
        task = await TaskService._get_task_or_404(task_id, session)
        if task.status != TaskStatus.OPEN:
            raise HTTPException(status_code=400, detail="Cannot create team for non-open task")
        
        return await TeamRepository.create(task_id, creator_id, team_data.name, session)

    @staticmethod
    async def join_team(team_id: int, user_id: int, session: AsyncSession):
        team = await TeamRepository.get_by_id(team_id, session)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.status != "recruiting":
            raise HTTPException(status_code=400, detail="Team is no longer recruiting")
        if len(team.members) >= 4:
            raise HTTPException(status_code=400, detail="Team is full (max 4 members)")
        
        existing = await TeamRepository.get_member(team_id, user_id, session)
        if existing:
            raise HTTPException(status_code=400, detail="Already a member")
            
        return await TeamRepository.add_member(team_id, user_id, session)

    @staticmethod
    async def leave_team(team_id: int, user_id: int, session: AsyncSession):
        team = await TeamRepository.get_by_id(team_id, session)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.creator_id == user_id:
            raise HTTPException(status_code=400, detail="Creator cannot leave the team. Dissolve it instead (not implemented).")
        
        success = await TeamRepository.remove_member(team_id, user_id, session)
        if not success:
            raise HTTPException(status_code=400, detail="Not a member")
        return {"status": "success"}

    @staticmethod
    async def get_task_teams(task_id: int, session: AsyncSession):
        return await TeamRepository.get_by_task_id(task_id, session)
