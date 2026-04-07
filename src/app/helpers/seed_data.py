from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.all_models import Category

async def seed_categories(session: AsyncSession):
    # Check if categories already exist
    stmt = select(Category)
    result = await session.execute(stmt)
    if result.scalars().first():
        return

    # Default categories from TZ and common university needs
    default_categories = [
        "Исследования",
        "Мероприятия",
        "IT и разработка",
        "Дизайн",
        "Административная помощь",
        "Контент и соцсети",
        "Волонтерство"
    ]

    for cat_name in default_categories:
        category = Category(name=cat_name)
        session.add(category)
    
    await session.commit()
