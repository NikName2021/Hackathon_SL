from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon_type: str
    earned_at: Optional[datetime] = None

    class ConfigDict:
        from_attributes = True

class LeaderboardUserResponse(BaseModel):
    id: int
    full_name: str
    reputation: float
    points: int
    avatar_url: Optional[str] = None
    rank: int
    skills: List[str] = []

    class ConfigDict:
        from_attributes = True

class GamificationStatsResponse(BaseModel):
    level: int
    points_to_next_level: int
    progress_percentage: float
    total_points: int
    rank: int
    achievements: List[AchievementResponse]
