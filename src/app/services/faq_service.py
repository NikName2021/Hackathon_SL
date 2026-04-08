from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from repositories.faq import FAQRepository
from schemas.faq import FAQCreate, FAQUpdate


class FAQService:
    @staticmethod
    async def list_public(session: AsyncSession):
        return await FAQRepository.get_all_published(session)

    @staticmethod
    async def list_all(session: AsyncSession):
        return await FAQRepository.get_all(session)

    @staticmethod
    async def get_public_by_slug(slug: str, session: AsyncSession):
        article = await FAQRepository.get_by_slug(slug, session)
        if not article or not article.is_published:
            raise HTTPException(status_code=404, detail="FAQ article not found")
        return article

    @staticmethod
    async def create(data: FAQCreate, session: AsyncSession):
        existing = await FAQRepository.get_by_slug(data.slug, session)
        if existing:
            raise HTTPException(status_code=400, detail="FAQ article with this slug already exists")
        return await FAQRepository.create(
            title=data.title,
            slug=data.slug,
            content=data.content,
            is_published=data.is_published,
            session=session,
        )

    @staticmethod
    async def update(article_id: int, data: FAQUpdate, session: AsyncSession):
        if data.slug:
            existing = await FAQRepository.get_by_slug(data.slug, session)
            if existing and existing.id != article_id:
                raise HTTPException(status_code=400, detail="FAQ article with this slug already exists")

        article = await FAQRepository.update(
            article_id,
            data.model_dump(exclude_unset=True),
            session,
        )
        if not article:
            raise HTTPException(status_code=404, detail="FAQ article not found")
        return article

    @staticmethod
    async def delete(article_id: int, session: AsyncSession):
        deleted = await FAQRepository.delete(article_id, session)
        if not deleted:
            raise HTTPException(status_code=404, detail="FAQ article not found")
        return {"status": "deleted"}
