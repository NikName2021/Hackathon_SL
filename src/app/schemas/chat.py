from datetime import datetime
from pydantic import BaseModel, ConfigDict
from schemas.task import UserShortResponse

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    task_id: int
    sender_id: int
    sender: UserShortResponse
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
