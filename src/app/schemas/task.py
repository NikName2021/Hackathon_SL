from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database.all_models import TaskStatus, ApplicationStatus, Role


class CategoryResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str


class UserShortResponse(BaseModel):
    id: int
    full_name: str | None
    email: str
    role: Role
    model_config = ConfigDict(from_attributes=True)


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    category_id: int | None = None
    points_reward: int = 0
    deadline: datetime | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: TaskStatus
    points_reward: int
    deadline: datetime | None
    created_date: datetime
    owner: UserShortResponse
    category: CategoryResponse | None = None
    model_config = ConfigDict(from_attributes=True)


class ApplicationCreate(BaseModel):
    message: str | None = None


class ApplicationResponse(BaseModel):
    id: int
    task_id: int
    student: UserShortResponse
    status: ApplicationStatus
    message: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SubmissionCreate(BaseModel):
    content: str


class SubmissionResponse(BaseModel):
    id: int
    task_id: int
    student_id: int
    content: str
    status: str
    submitted_at: datetime
    feedback: str | None = None
    model_config = ConfigDict(from_attributes=True)


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
    history: List[PointTransactionResponse]
    model_config = ConfigDict(from_attributes=True)
