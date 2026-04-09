from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database.all_models import FAQArticle, Role


class FAQRepository:
    @staticmethod
    async def get_all_published(session: AsyncSession, role: Role | None = None):
        stmt = (
            select(FAQArticle)
            .where(FAQArticle.is_published.is_(True))
        )
        if role:
            stmt = stmt.where(or_(FAQArticle.target_role == role, FAQArticle.target_role.is_(None)))
        
        stmt = stmt.order_by(FAQArticle.created_at.desc())
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_all(session: AsyncSession):
        stmt = select(FAQArticle).order_by(FAQArticle.created_at.desc())
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_slug(slug: str, session: AsyncSession):
        stmt = select(FAQArticle).where(FAQArticle.slug == slug)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(article_id: int, session: AsyncSession):
        stmt = select(FAQArticle).where(FAQArticle.id == article_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        title: str,
        slug: str,
        content: str,
        is_published: bool,
        target_role: Role | None,
        session: AsyncSession,
    ):
        article = FAQArticle(
            title=title,
            slug=slug,
            content=content,
            is_published=is_published,
            target_role=target_role,
        )
        session.add(article)
        await session.commit()
        await session.refresh(article)
        return article

    @staticmethod
    async def update(article_id: int, update_data: dict, session: AsyncSession):
        article = await FAQRepository.get_by_id(article_id, session)
        if not article:
            return None
        for key, value in update_data.items():
            if value is not None:
                setattr(article, key, value)
        await session.commit()
        await session.refresh(article)
        return article

    @staticmethod
    async def delete(article_id: int, session: AsyncSession):
        article = await FAQRepository.get_by_id(article_id, session)
        if not article:
            return False
        await session.delete(article)
        await session.commit()
        return True
