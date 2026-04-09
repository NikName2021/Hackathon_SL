from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class UserMinimal(BaseModel):
    id: int
    full_name: Optional[str] = None
    role: str
    reputation: float
    
    model_config = ConfigDict(from_attributes=True)


class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    user: UserMinimal
    
    model_config = ConfigDict(from_attributes=True)


class TeamResponse(BaseModel):
    id: int
    task_id: int
    creator_id: int
    name: Optional[str] = None
    status: str
    created_at: datetime
    creator: UserMinimal
    members: List[TeamMemberResponse]
    
    model_config = ConfigDict(from_attributes=True)


class TeamCreate(BaseModel):
    name: Optional[str] = None
