import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add src/app to path to allow imports
sys.path.append(os.path.join(os.getcwd()))

from sqlalchemy import select
from core.config import sessionmaker
from database.all_models import (
    User, Task, Category, TaskApplication, TaskStatus, ApplicationStatus, Role
)

async def seed_smart_match():
    async with sessionmaker() as session:
        # 0. Ensure demo users exist with .ru and are verified
        default_password = "demo12345" # Assuming from seed_data.py context
        from helpers.auth import hash_password
        
        demo_users_data = [
            ("admin@demo.ru", "Demo Admin", Role.ADMIN),
            ("employee@demo.ru", "Demo Employee", Role.EMPLOYEE),
            ("student@demo.ru", "Demo Student", Role.STUDENT),
            ("ivanov@demo.ru", "Иван Иванов", Role.STUDENT),
            ("petrov@demo.ru", "Петр Петров", Role.STUDENT),
            ("lebedeva@demo.ru", "Ольга Лебедева", Role.STUDENT),
            ("sidorov@demo.ru", "Сидор Сидоров", Role.STUDENT),
        ]
        
        for email, name, role in demo_users_data:
            stmt = select(User).where(User.email == email)
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                u = User(
                    email=email,
                    hashed_password=hash_password(default_password),
                    full_name=name,
                    role=role,
                    is_active=True,
                    is_verified=True,
                    points=100 if role == Role.STUDENT else 0,
                    reputation=3.5 if role == Role.STUDENT else 0.0
                )
                session.add(u)
        await session.flush()

        # 1. Get or create category
        stmt = select(Category).where(Category.name == "IT и разработка")
        result = await session.execute(stmt)
        category = result.scalar_one_or_none()
        if not category:
            category = Category(name="IT и разработка")
            session.add(category)
            await session.flush()

        # 2. Get the demo employee (owner)
        stmt = select(User).where(User.email == "employee@demo.ru")
        result = await session.execute(stmt)
        owner = result.scalar_one_or_none()

        # 3. Get students
        emails = ["ivanov@demo.ru", "petrov@demo.ru", "lebedeva@demo.ru", "sidorov@demo.ru"]
        stmt = select(User).where(User.email.in_(emails))
        result = await session.execute(stmt)
        students = {u.email: u for u in result.scalars().all()}

        # 4. Create History for Student A (Category Top)
        # Completed 3 tasks in IT
        for i in range(3):
            t = Task(
                title=f"Completed IT Task {i}",
                category_id=category.id,
                owner_id=owner.id,
                assignee_id=students["ivanov@demo.ru"].id,
                status=TaskStatus.COMPLETED,
                points_reward=50,
                created_date=datetime.now() - timedelta(days=20+i)
            )
            session.add(t)

        # 5. Create History for Student B (Department Veteran)
        # Completed 4 tasks for this owner
        for i in range(4):
            t = Task(
                title=f"Completed Owner Task {i}",
                category_id=category.id,
                owner_id=owner.id,
                assignee_id=students["petrov@demo.ru"].id,
                status=TaskStatus.COMPLETED,
                points_reward=30,
                created_date=datetime.now() - timedelta(days=10+i)
            )
            session.add(t)

        # 6. Create the Target Task
        target_task = Task(
            title="Разработка системы умных фильтров (ТЕСТ МЭТЧА)",
            description="Нужно реализовать алгоритм ранжирования кандидатов на основе их опыта.",
            category_id=category.id,
            owner_id=owner.id,
            status=TaskStatus.OPEN,
            points_reward=150,
            deadline=datetime.now() + timedelta(days=7)
        )
        session.add(target_task)
        await session.flush()

        # 7. Create Applications
        apps = [
            TaskApplication(
                task_id=target_task.id,
                student_id=students["ivanov@demo.ru"].id,
                status=ApplicationStatus.PENDING,
                message="Я лучший в IT, посмотрите мой профиль!"
            ),
            TaskApplication(
                task_id=target_task.id,
                student_id=students["petrov@demo.ru"].id,
                status=ApplicationStatus.PENDING,
                message="Мы уже работали вместе, я знаю ваши требования."
            ),
            TaskApplication(
                task_id=target_task.id,
                student_id=students["lebedeva@demo.ru"].id,
                status=ApplicationStatus.PENDING,
                message="Выполню всё максимально быстро и качественно."
            ),
            TaskApplication(
                task_id=target_task.id,
                student_id=students["sidorov@demo.ru"].id,
                status=ApplicationStatus.PENDING,
                message="Очень хочу попробовать свои силы в этом проекте."
            )
        ]
        session.add_all(apps)
        
        await session.commit()
        print(f"Successfully seeded testing data for task: {target_task.title}")

if __name__ == "__main__":
    asyncio.run(seed_smart_match())
