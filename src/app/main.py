import uvicorn
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routes.api import router as api_router
from core.config import API_PREFIX, DEBUG, HOST, MEMOIZATION_FLAG, PORT, PROJECT_NAME, VERSION, sessionmaker
from core.events import create_start_app_handler
from helpers.seed_data import seed_categories, seed_demo_data
from middleware import LoggingMiddleware


origins = ["*"]


@asynccontextmanager
async def lifespan(application: FastAPI):
    if MEMOIZATION_FLAG:
        handler = create_start_app_handler(application)
        await handler()

    # Ensure schema exists
    from core.config import engine
    from database import create_tables
    await create_tables(engine)

    # Seed categories and demo data if configured
    async with sessionmaker() as session:
        await seed_categories(session)
        await seed_demo_data(session)

    yield


def get_application() -> FastAPI:
    application = FastAPI(
        title=PROJECT_NAME,
        debug=DEBUG,
        version=VERSION,
        docs_url="/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    application.include_router(api_router, prefix=API_PREFIX)
    application.add_middleware(LoggingMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Ensure uploads directory exists
    os.makedirs("uploads/avatars", exist_ok=True)
    os.makedirs("uploads/resumes", exist_ok=True)
    
    # Mount static files
    application.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    return application


app = get_application()


if __name__ == "__main__":
    uvicorn.run(get_application(), host=HOST, port=PORT)
