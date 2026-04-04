from fastapi import APIRouter

from api.routes import user, task, category, profile, admin

router = APIRouter(prefix="/v1")
router.include_router(user.router)
router.include_router(task.router)
router.include_router(category.router)
router.include_router(profile.router)
router.include_router(admin.router)
