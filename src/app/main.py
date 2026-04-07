import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_swagger_ui_oauth2_redirect_html
from fastapi.staticfiles import StaticFiles
from swagger_ui_bundle import swagger_ui_3_path

from api.routes.api import router as api_router
from core.config import API_PREFIX, DEBUG, HOST, MEMOIZATION_FLAG, PORT, PROJECT_NAME, VERSION, sessionmaker
from core.events import create_start_app_handler
from helpers.seed_data import seed_categories
from middleware import LoggingMiddleware


origins = ["*"]


def get_application() -> FastAPI:
    application = FastAPI(
        title=PROJECT_NAME,
        debug=DEBUG,
        version=VERSION,
        docs_url=None,
        redoc_url=None,
    )
    application.include_router(api_router, prefix=API_PREFIX)
    application.mount("/swagger-static", StaticFiles(directory=swagger_ui_3_path), name="swagger-static")
    application.add_middleware(LoggingMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if MEMOIZATION_FLAG:
        application.add_event_handler("startup", create_start_app_handler(application))

    @application.on_event("startup")
    async def startup_seed():
        async with sessionmaker() as session:
            await seed_categories(session)

    @application.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return get_swagger_ui_html(
            openapi_url=application.openapi_url,
            title=f"{PROJECT_NAME} - Swagger UI",
            oauth2_redirect_url="/docs/oauth2-redirect",
            swagger_js_url="/swagger-static/swagger-ui-bundle.js",
            swagger_css_url="/swagger-static/swagger-ui.css",
        )

    @application.get("/docs/oauth2-redirect", include_in_schema=False)
    async def swagger_ui_redirect():
        return get_swagger_ui_oauth2_redirect_html()

    return application


app = get_application()


if __name__ == "__main__":
    uvicorn.run(get_application(), host=HOST, port=PORT)
