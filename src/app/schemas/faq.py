from datetime import datetime
from pydantic import BaseModel, ConfigDict
from database.all_models import Role


class FAQCreate(BaseModel):
    title: str
    slug: str
    content: str
    target_role: Role | None = None
    is_published: bool = True


class FAQUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    content: str | None = None
    target_role: Role | None = None
    is_published: bool | None = None


class FAQResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    target_role: Role | None
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
