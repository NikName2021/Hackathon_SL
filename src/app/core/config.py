import logging
import os
from logging.config import dictConfig
from pathlib import Path
from typing import AsyncGenerator

from fastapi.security import HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from starlette.config import Config
from starlette.datastructures import Secret

from database.db_session import get_db_path
from .logging import logging_config

APP_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = Path(os.getenv("APP_ENV_FILE", APP_DIR / ".env"))
config = Config(str(ENV_FILE))


def parse_bool(value: str | bool | None, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value

    if value is None:
        return default

    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on", "debug", "development", "dev"}:
        return True
    if normalized in {"0", "false", "no", "off", "release", "production", "prod"}:
        return False
    return default

API_PREFIX = "/api"
VERSION = "0.1.0"
DEBUG: bool = parse_bool(config("DEBUG", cast=str, default="false"))
SECRET_KEY: Secret = config("SECRET_KEY", cast=Secret, default="")
MEMOIZATION_FLAG: bool = parse_bool(config("MEMOIZATION_FLAG", cast=str, default="true"), default=True)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

HOST: str = config("HOST", cast=str, default="localhost")
PORT: int = config("PORT", cast=int, default=8000)
PROJECT_NAME: str = config("PROJECT_NAME", default="pregnancy-model")

POSTGRES_HOST: str = config("POSTGRES_HOST", cast=str, default="localhost")
POSTGRES_PORT: int = config("POSTGRES_PORT", cast=int, default=5432)
POSTGRES_USER: str = config("POSTGRES_USER", cast=str, default="postgres")
POSTGRES_PASSWORD: str = config("POSTGRES_PASSWORD", cast=str, default="<PASSWORD>")
POSTGRES_DB: str = config("POSTGRES_DATABASE", cast=str, default="postgres")

BOT_TOKEN: str = config("BOT_TOKEN", cast=str, default="")
SMTP_USER: str = config("SMTP_USER", default="test@gmail.com")
SMTP_PASSWORD: str = config("SMTP_PASSWORD", default="your_app_password")
SMTP_SERVER: str = config("SMTP_SERVER", default="smtp.gmail.com")
SMTP_PORT: int = config("SMTP_PORT", cast=int, default=587)
MAIL_FROM: str = config("MAIL_FROM", default="test@gmail.com")
FRONTEND_URL: str = config("FRONTEND_URL", default="http://localhost:3000")

engine = create_async_engine(
    get_db_path(POSTGRES_USER, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB,
                POSTGRES_PASSWORD))
sessionmaker = async_sessionmaker(engine, expire_on_commit=False)

security = HTTPBearer(auto_error=False)


async def async_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with sessionmaker() as db:
        yield db


# logging configuration
# LOGGING_LEVEL = logging.DEBUG if DEBUG else logging.INFO
# logging.basicConfig(
#     handlers=[InterceptHandler(level=LOGGING_LEVEL)], level=LOGGING_LEVEL
# )
# logger.configure(handlers=[{"sink": sys.stderr, "level": LOGGING_LEVEL}])

os.makedirs("logs", exist_ok=True)
dictConfig(logging_config)

# Создаем экземпляр логгера для нашего модуля
logger = logging.getLogger(__name__)
