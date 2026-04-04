from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.all_models import Category


class CategoryRepository:
    @staticmethod
    async def get_all(session: AsyncSession):
        stmt = select(Category)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create(name: str, session: AsyncSession) -> Category:
        category = Category(name=name)
        session.add(category)
        await session.commit()
        await session.refresh(category)
        return category

    @staticmethod
    async def get_by_id(category_id: int, session: AsyncSession) -> Category | None:
        stmt = select(Category).where(Category.id == category_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
