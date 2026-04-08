from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.all_models import Task, User, Skill, TaskStatus
from sqlalchemy.orm import selectinload
from typing import List, Tuple
import re

class RecommendationService:
    @staticmethod
    async def get_recommendations(
        user_id: int, 
        session: AsyncSession, 
        limit: int = 5, 
        offset: int = 0
    ) -> List[dict]:
        """
        Get task recommendations for a user based on skills and keywords.
        Scoring:
        - +10 for each matching skill tag
        - +2 for each keyword match in title/description
        """
        # 1. Get user and their skills
        user_stmt = select(User).where(User.id == user_id).options(selectinload(User.skills))
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            return []
            
        user_skills = [s.name.lower() for s in user.skills]
        
        # 2. Get all OPEN tasks
        # In a real-world scenario, we'd do this via a more efficient SQL query or ElasticSearch.
        # But for this hackathon MVP, we'll do the scoring in Python for flexibility with keyword matching.
        tasks_stmt = (
            select(Task)
            .where(Task.status == TaskStatus.OPEN)
            .options(
                selectinload(Task.applications),
                selectinload(Task.skills),
                selectinload(Task.category),
                selectinload(Task.owner)
            )
        )
        tasks_result = await session.execute(tasks_stmt)
        all_tasks = tasks_result.scalars().all()
        
        scored_tasks = []
        
        for task in all_tasks:
            # Skip tasks where user is the owner or already applied
            if task.owner_id == user_id:
                continue
            
            # Check if user already applied
            applied = False
            for app in task.applications:
                if app.student_id == user_id:
                    applied = True
                    break
            if applied:
                continue
                
            score = 0
            
            # A. Tag matching (+10 per skill)
            task_skill_names = [s.name.lower() for s in task.skills]
            for skill in user_skills:
                if skill in task_skill_names:
                    score += 10
            
            # B. Keyword matching (+2 per match)
            # Use user skill names as keywords for matching in description/title
            text_to_search = f"{task.title} {task.description or ''}".lower()
            for skill in user_skills:
                # Simple check if skill name is in text
                # We use regex for word boundaries to avoid partial matches like 'java' in 'javascript'
                if re.search(r'\b' + re.escape(skill) + r'\b', text_to_search):
                    score += 2
                    
            if score > 0:
                scored_tasks.append({
                    "task": task,
                    "score": score
                })
        
        # 3. Sort by score DESC
        scored_tasks.sort(key=lambda x: x["score"], reverse=True)
        
        # 4. Apply pagination
        paginated_results = scored_tasks[offset : offset + limit]
        
        # 5. Format response
        result = []
        for entry in paginated_results:
            t = entry["task"]
            result.append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "points_reward": t.points_reward,
                "category": t.category.name if t.category else "Uncategorized",
                "owner_name": t.owner.full_name if t.owner else "Unknown",
                "match_score": entry["score"],
                "skills": [s.name for s in t.skills]
            })
            
        return result
