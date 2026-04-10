import os
from datetime import datetime, timedelta

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.all_models import (
    ApplicationStatus,
    Category,
    Role,
    Task,
    TaskApplication,
    TaskStatus,
    TaskSubmission,
    User,
    Skill,
    Achievement,
    ActivityLog,
    ActivityType,
    FAQArticle
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


async def seed_categories(session: AsyncSession):
    stmt = select(Category)
    result = await session.execute(stmt)
    if result.scalars().first():
        return

    default_categories = [
        "Исследования",
        "Мероприятия",
        "IT и разработка",
        "Дизайн",
        "Административная помощь",
        "Контент и соцсети",
        "Волонтерство",
    ]

    for cat_name in default_categories:
        session.add(Category(name=cat_name))

    await session.commit()


async def seed_demo_data(session: AsyncSession):
    if not _env_bool("DEMO_SEED", default=True):
        return

    demo_emails = [
        "admin@demo.ru", "employee@demo.ru", "student@demo.ru",
        "ivanov@demo.ru", "petrov@demo.ru", "sidorov@demo.ru",
        "kuznetsov@demo.ru", "volkov@demo.ru", "lebedeva@demo.ru",
        "morozova@demo.ru", "smirnov@demo.ru"
    ]
    
    users_stmt = select(User).where(User.email.in_(demo_emails))
    users_result = await session.execute(users_stmt)
    users = {user.email: user for user in users_result.scalars().all()}

    default_password = pwd_context.hash("demo12345")

    admin = users.get("admin@demo.ru")
    if not admin:
        admin = User(
            email="admin@demo.ru",
            hashed_password=default_password,
            full_name="Demo Admin",
            role=Role.ADMIN,
            points=0,
            reputation=0.0,
            is_active=True,
            is_verified=True,
        )
        session.add(admin)

    employee = users.get("employee@demo.ru")
    if not employee:
        employee = User(
            email="employee@demo.ru",
            hashed_password=default_password,
            full_name="Demo Employee",
            role=Role.EMPLOYEE,
            points=50,
            reputation=1.0,
            is_active=True,
            is_verified=True,
        )
        session.add(employee)

    # Add several demo students to populate the leaderboard
    demo_students = [
        ("student@demo.ru", "Demo Student", 120, 3.5),
        ("ivanov@demo.ru", "Иван Иванов", 450, 4.8),
        ("petrov@demo.ru", "Петр Петров", 380, 4.2),
        ("sidorov@demo.ru", "Сидор Сидоров", 290, 3.9),
        ("kuznetsov@demo.ru", "Алексей Кузнецов", 210, 3.1),
        ("volkov@demo.ru", "Дмитрий Волков", 180, 2.8),
        ("lebedeva@demo.ru", "Ольга Лебедева", 560, 4.9),
        ("morozova@demo.ru", "Анна Морозова", 320, 4.5),
        ("smirnov@demo.ru", "Николай Смирнов", 90, 2.1),
    ]

    for email, name, points, reputation in demo_students:
        s = users.get(email)
        if not s:
            s = User(
                email=email,
                hashed_password=default_password,
                full_name=name,
                role=Role.STUDENT,
                points=points,
                reputation=reputation,
                is_active=True,
                is_verified=True,
            )
            session.add(s)
            if email == "student@demo.ru":
                student = s  # Keep reference for tasks

    await session.flush()

    tasks_stmt = select(Task).where(
        Task.title.in_(
            [
                "Подготовить визуал для дня открытых дверей",
                "Собрать данные для учебного исследования",
                "Сверстать страницу проекта кафедры",
                "Проверить материалы перед публикацией",
            ]
        )
    )
    tasks_result = await session.execute(tasks_stmt)
    if tasks_result.scalars().first():
        await session.commit()
        return

    category_stmt = select(Category).order_by(Category.id)
    category_result = await session.execute(category_stmt)
    category = category_result.scalars().first()
    if not category:
        await session.commit()
        return

    now = datetime.now()

    open_task = Task(
        title="Подготовить визуал для дня открытых дверей",
        description="Нужно сделать 3 баннера для соцсетей и афишу для печати.",
        acceptance_criteria="Переданы исходники и PNG-версии в нужных размерах.",
        performer_requirements="Базовый опыт Figma/Photoshop.",
        category_id=category.id,
        owner_id=employee.id,
        status=TaskStatus.OPEN,
        points_reward=40,
        deadline=now + timedelta(days=5),
    )

    in_progress_task = Task(
        title="Собрать данные для учебного исследования",
        description="Собрать ответы по опросу и подготовить csv-файл для аналитики.",
        acceptance_criteria="CSV-файл + краткое описание структуры данных.",
        performer_requirements="Уверенное владение Excel/Google Sheets.",
        category_id=category.id,
        owner_id=employee.id,
        assignee_id=student.id,
        status=TaskStatus.IN_PROGRESS,
        points_reward=30,
        deadline=now + timedelta(days=3),
    )

    review_task = Task(
        title="Сверстать страницу проекта кафедры",
        description="Нужен лендинг по готовому макету для внутреннего сайта.",
        acceptance_criteria="Страница адаптивна и соответствует макету.",
        performer_requirements="HTML/CSS/JS, опыт адаптивной верстки.",
        category_id=category.id,
        owner_id=employee.id,
        assignee_id=student.id,
        status=TaskStatus.REVIEW,
        points_reward=80,
        deadline=now + timedelta(days=2),
    )

    pending_task = Task(
        title="Проверить материалы перед публикацией",
        description="Нужна финальная проверка текста и ссылок перед размещением.",
        acceptance_criteria="Найденные ошибки собраны в комментарии к документу.",
        performer_requirements="Внимательность, грамотность.",
        category_id=category.id,
        owner_id=employee.id,
        status=TaskStatus.PENDING_APPROVAL,
        points_reward=20,
        deadline=now + timedelta(days=7),
    )

    session.add_all([open_task, in_progress_task, review_task, pending_task])
    await session.flush()

    session.add_all(
        [
            TaskApplication(
                task_id=open_task.id,
                student_id=student.id,
                status=ApplicationStatus.PENDING,
                message="Готов приступить сегодня, есть релевантные кейсы.",
            ),
            TaskApplication(
                task_id=in_progress_task.id,
                student_id=student.id,
                status=ApplicationStatus.ACCEPTED,
                message="Есть опыт работы с опросными данными.",
            ),
            TaskApplication(
                task_id=review_task.id,
                student_id=student.id,
                status=ApplicationStatus.ACCEPTED,
                message="Сделаю по макету и отправлю на проверку.",
            ),
            TaskSubmission(
                task_id=review_task.id,
                student_id=student.id,
                content="https://example.com/demo-landing",
                status="reviewing",
            ),
        ]
    )

    # 5. NEW: Skills & Achievements
    skills_stmt = select(Skill)
    if not (await session.execute(skills_stmt)).scalars().first():
        default_skills = ["Python", "React", "SQL", "UI/UX Design", "Copywriting", "Project Management", "Research"]
        for s_name in default_skills:
            session.add(Skill(name=s_name))
        await session.flush()

    ach_stmt = select(Achievement)
    if not (await session.execute(ach_stmt)).scalars().first():
        achs = [
            ("Первопроходец", "Выполнена первая задача на платформе", "zap"),
            ("Гуру кода", "Завершено более 5 IT-задач", "code"),
            ("Лидер мнений", "Топ-3 в лидерборде за месяц", "star")
        ]
        for name, desc, icon in achs:
            session.add(Achievement(name=name, description=desc, icon_type=icon))
        await session.flush()

    # 6. ENHANCED Activity Logs
    # This will populate the "Recent Activity" feed for the employee
    activities_stmt = select(ActivityLog).limit(1)
    if not (await session.execute(activities_stmt)).scalars().first():
        # Add some historical context
        past_date = now - timedelta(hours=5)
        
        # New applications activities
        session.add(ActivityLog(
            user_id=employee.id,
            actor_id=student.id,
            task_id=open_task.id,
            activity_type=ActivityType.NEW_APPLICATION,
            created_at=past_date
        ))
        
        session.add(ActivityLog(
            user_id=employee.id,
            actor_id=student.id,
            task_id=review_task.id,
            activity_type=ActivityType.WORK_SUBMITTED,
            created_at=past_date + timedelta(minutes=30),
            content="Сделал верстку по макету, проверил адаптивность."
        ))

        # Moderation activities
        session.add(ActivityLog(
            user_id=employee.id,
            task_id=in_progress_task.id,
            activity_type=ActivityType.TASK_APPROVED,
            created_at=past_date - timedelta(hours=10)
        ))

    # 7. NEW: FAQ Articles
    faq_stmt = select(FAQArticle).limit(1)
    if not (await session.execute(faq_stmt)).scalars().first():
        faq_items = [
            # General
            {
                "title": "Что такое баллы и зачем они нужны?",
                "slug": "what-are-points",
                "content": "Баллы — это внутренняя валюта платформы. Вы получаете их за выполнение задач и можете обменивать на бонусы от университета или партнеров.",
                "target_role": None
            },
            {
                "title": "Как работает система репутации?",
                "slug": "reputation-system",
                "content": "Репутация отражает вашу надежность. Она растет при успешном выполнении задач в срок и падает при нарушениях дедлайнов или отказе от работы.",
                "target_role": None
            },
            # Student specific
            {
                "title": "Как откликнуться на задачу?",
                "slug": "how-to-apply",
                "content": "Выберите подходящую задачу в каталоге, нажмите 'Откликнуться' и напишите краткое сопроводительное письмо о своих навыках.",
                "target_role": Role.STUDENT
            },
            {
                "title": "Когда я получу баллы за работу?",
                "slug": "when-points-awarded",
                "content": "Баллы начисляются автоматически сразу после того, как заказчик примет вашу работу и переведет задачу в статус 'Завершена'.",
                "target_role": Role.STUDENT
            },
            # Employee specific
            {
                "title": "Как создать эффективную задачу?",
                "slug": "create-effective-task",
                "content": "Подробно опишите требования и критерии приемки. Указывайте нужные навыки, чтобы система точнее рекомендовала вашу задачу студентам.",
                "target_role": Role.EMPLOYEE
            },
            {
                "title": "Как выбрать лучшего исполнителя?",
                "slug": "choosing-performer",
                "content": "Обращайте внимание на репутацию студента и его предыдущие работы. Также вы можете пообщаться с кандидатом в чате перед подтверждением.",
                "target_role": Role.EMPLOYEE
            }
        ]
        
        for item in faq_items:
            session.add(FAQArticle(**item))
        
        await session.flush()

    await session.commit()
