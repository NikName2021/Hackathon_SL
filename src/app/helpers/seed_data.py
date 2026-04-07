from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.all_models import Category


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
