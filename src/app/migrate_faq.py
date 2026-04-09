import asyncio
import logging
from sqlalchemy import text
from core.config import engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate():
    logger.info("Starting migration: adding target_role to faq_article")
    async with engine.begin() as conn:
        try:
            # We use text() to execute raw SQL. 
            # In Postgres, we add the column target_role of type role.
            # We assume the 'role' type already exists since it's used in the User table.
            await conn.execute(text("ALTER TABLE faq_article ADD COLUMN IF NOT EXISTS target_role role;"))
            logger.info("Successfully added target_role column to faq_article table.")
        except Exception as e:
            logger.error(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
