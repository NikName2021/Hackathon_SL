import asyncio
import datetime
from sqlalchemy import select
from core.config import sessionmaker, engine
from database import create_tables
from database.all_models import Task, TaskApplication, TaskSubmission, ActivityLog, ActivityType, TaskStatus, ApplicationStatus

async def backfill():
    # Ensure tables are created
    await create_tables(engine)
    
    async with sessionmaker() as session:
        # 1. Backfill Task Created events
        tasks_stmt = select(Task)
        tasks = (await session.execute(tasks_stmt)).scalars().all()
        for task in tasks:
            # Check if already exists
            exists_stmt = select(ActivityLog).where(
                ActivityLog.task_id == task.id, 
                ActivityLog.activity_type == ActivityType.TASK_CREATED
            )
            if not (await session.execute(exists_stmt)).scalar_one_or_none():
                session.add(ActivityLog(
                    user_id=task.owner_id,
                    actor_id=task.owner_id,
                    task_id=task.id,
                    activity_type=ActivityType.TASK_CREATED,
                    created_at=task.created_date
                ))
            
            # If approved
            if task.status != TaskStatus.PENDING_APPROVAL:
                 exists_appr = select(ActivityLog).where(
                    ActivityLog.task_id == task.id,
                    ActivityLog.activity_type == ActivityType.TASK_APPROVED
                 )
                 if not (await session.execute(exists_appr)).scalar_one_or_none():
                    session.add(ActivityLog(
                        user_id=task.owner_id,
                        task_id=task.id,
                        activity_type=ActivityType.TASK_APPROVED,
                        created_at=task.created_date + datetime.timedelta(minutes=10) # Dummy offset
                    ))

        # 2. Backfill Applications
        apps_stmt = select(TaskApplication).join(Task)
        apps = (await session.execute(apps_stmt)).scalars().all()
        for app in apps:
             exists_stmt = select(ActivityLog).where(
                ActivityLog.task_id == app.task_id,
                ActivityLog.actor_id == app.student_id,
                ActivityLog.activity_type == ActivityType.NEW_APPLICATION
             )
             if not (await session.execute(exists_stmt)).scalar_one_or_none():
                # Get the task owner
                task_res = await session.execute(select(Task).where(Task.id == app.task_id))
                task = task_res.scalar_one_or_none()
                if task:
                    session.add(ActivityLog(
                        user_id=task.owner_id,
                        actor_id=app.student_id,
                        task_id=app.task_id,
                        activity_type=ActivityType.NEW_APPLICATION,
                        created_at=app.created_at
                    ))

        # 3. Backfill Submissions
        subs_stmt = select(TaskSubmission).join(Task)
        subs = (await session.execute(subs_stmt)).scalars().all()
        for sub in subs:
             exists_stmt = select(ActivityLog).where(
                ActivityLog.task_id == sub.task_id,
                ActivityLog.actor_id == sub.student_id,
                ActivityLog.activity_type == ActivityType.WORK_SUBMITTED
             )
             if not (await session.execute(exists_stmt)).scalar_one_or_none():
                task_res = await session.execute(select(Task).where(Task.id == sub.task_id))
                task = task_res.scalar_one_or_none()
                if task:
                    session.add(ActivityLog(
                        user_id=task.owner_id,
                        actor_id=sub.student_id,
                        task_id=sub.task_id,
                        activity_type=ActivityType.WORK_SUBMITTED,
                        created_at=sub.submitted_at
                    ))

        await session.commit()
        print("Backfill completed successfully.")

if __name__ == "__main__":
    asyncio.run(backfill())
