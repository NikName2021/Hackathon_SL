from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FAQCreate(BaseModel):
    title: str
    slug: str
    content: str
    is_published: bool = True


class FAQUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    content: str | None = None
    is_published: bool | None = None


class FAQResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
