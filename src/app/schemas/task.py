from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any

from pydantic import BaseModel, ConfigDict

from database.all_models import ApplicationStatus, Role, TaskStatus


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _task_stub(task_id: int = 0, *, status: TaskStatus = TaskStatus.OPEN) -> SimpleNamespace:
    return SimpleNamespace(
        id=task_id,
        title="",
        description=None,
        status=status,
        points_reward=0,
        deadline=None,
        created_date=utcnow(),
        owner=None,
        assignee=None,
        category=None,
        applications=[],
        submissions=[],
    )


def _resolve_task(task: Any | None) -> Any:
    return task if task is not None else _task_stub()


def _resolve_latest_submission(task: Any | None) -> Any | None:
    submissions = getattr(task, "submissions", None) or []
    if not submissions:
        return None
    return max(submissions, key=lambda item: item.submitted_at)


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str


class SkillResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class UserShortResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: Role
    points: int
    reputation: float
    bio: str | None = None
    avatar_url: str | None = None
    resume_path: str | None = None
    skills: List[SkillResponse] = []

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserShortResponse):
    is_active: bool
    created_date: datetime


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserShortResponse
    token: Token
    status: str = "success"


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    category_id: int | None = None
    points_reward: int = 0
    deadline: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: int | None = None
    points_reward: int | None = None
    deadline: datetime | None = None


class TaskShortResponse(BaseModel):
    id: int
    title: str

    model_config = ConfigDict(from_attributes=True)


class ApplicationCreate(BaseModel):
    message: str | None = None


class SubmissionResponse(BaseModel):
    id: int
    task_id: int
    student_id: int
    content: str
    status: str
    submitted_at: datetime
    feedback: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    id: int
    task_id: int
    student_id: int
    student: UserShortResponse
    task: TaskShortResponse
    status: ApplicationStatus
    message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: TaskStatus
    points_reward: int
    deadline: datetime | None
    created_date: datetime
    owner: UserShortResponse
    assignee: UserShortResponse | None = None
    category: CategoryResponse | None = None
    applications: list[ApplicationResponse] = []
    latest_submission: SubmissionResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseModel):
    active_tasks: int = 0
    pending_reviews: int = 0
    completed_tasks: int = 0
    total_points: int = 0
    pending_applications: int = 0
    pending_moderation: int = 0


class SubmissionCreate(BaseModel):
    content: str


class TaskReview(BaseModel):
    is_approved: bool
    feedback: str | None = None


class PointTransactionResponse(BaseModel):
    id: int
    amount: int
    transaction_type: str
    created_at: datetime
    task_id: int | None

    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    user: UserShortResponse
    points: int
    reputation: float
    history: list[PointTransactionResponse]

    model_config = ConfigDict(from_attributes=True)


def build_user_short_response(user: Any | None) -> UserShortResponse:
    if user is None:
        return UserShortResponse(
            id=0,
            email="",
            full_name=None,
            role=Role.STUDENT,
            points=0,
            reputation=0.0,
        )
    return UserShortResponse.model_validate(user)


def build_category_response(category: Any | None) -> CategoryResponse | None:
    if category is None:
        return None
    return CategoryResponse.model_validate(category)


def build_submission_response(submission: Any | None) -> SubmissionResponse | None:
    if submission is None:
        return None
    return SubmissionResponse.model_validate(submission)


def build_task_short_response(task: Any | None) -> TaskShortResponse:
    task = _resolve_task(task)
    return TaskShortResponse(id=task.id, title=task.title)


def build_application_response(application: Any) -> ApplicationResponse:
    task = getattr(application, "task", None)
    if task is None:
        task = _task_stub(application.task_id)

    return ApplicationResponse(
        id=application.id,
        task_id=application.task_id,
        student_id=getattr(application, "student_id", 0),
        task=build_task_short_response(task),
        student=build_user_short_response(getattr(application, "student", None)),
        status=application.status,
        message=application.message,
        created_at=getattr(application, "created_at", None) or utcnow(),
    )


def build_task_response(task: Any | None) -> TaskResponse:
    task = _resolve_task(task)

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        points_reward=task.points_reward,
        deadline=getattr(task, "deadline", None),
        created_date=getattr(task, "created_date", None) or utcnow(),
        owner=build_user_short_response(getattr(task, "owner", None)),
        assignee=build_user_short_response(getattr(task, "assignee", None)) if getattr(task, "assignee", None) else None,
        category=build_category_response(getattr(task, "category", None)),
        applications=[
            build_application_response(application)
            for application in getattr(task, "applications", []) or []
        ],
        latest_submission=build_submission_response(_resolve_latest_submission(task)),
    )
