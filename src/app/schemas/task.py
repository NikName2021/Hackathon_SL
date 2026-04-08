from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database.all_models import TaskStatus, ApplicationStatus, Role


class CategoryResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class TaskAttachmentResponse(BaseModel):
    id: int
    filename: str
    url: str
    file_type: Optional[str] = None
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
    skills: List[str] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    points_reward: Optional[int] = None
    deadline: Optional[datetime] = None
    skills: Optional[List[str]] = None


class TaskShortResponse(BaseModel):
    id: int
    title: str
    model_config = ConfigDict(from_attributes=True)


class ApplicationCreate(BaseModel):
    message: str | None = None


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


class SubmissionResponse(BaseModel):
    id: int
    task_id: int
    student_id: int
    content: str
    status: str
    submitted_at: datetime
    feedback: str | None = None
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
    category: CategoryResponse | None = None
    applications: List[ApplicationResponse] = []
    latest_submission: Optional[SubmissionResponse] = None
    skills: List[SkillResponse] = []
    attachments: List[TaskAttachmentResponse] = []
    model_config = ConfigDict(from_attributes=True)


class RecommendedTaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    points_reward: int
    category: str
    owner_name: str
    match_score: int
    skills: List[str] = []


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
    history: List[PointTransactionResponse]
    model_config = ConfigDict(from_attributes=True)
