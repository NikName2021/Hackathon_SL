from sqlalchemy.ext.asyncio import AsyncSession
from repositories.category import CategoryRepository
from schemas.task import CategoryCreate


class CategoryService:
    @staticmethod
    async def get_all_categories(session: AsyncSession):
        return await CategoryRepository.get_all(session)

    @staticmethod
    async def create_category(category_data: CategoryCreate, session: AsyncSession):
        return await CategoryRepository.create(category_data.name, session)
