import datetime
from enum import Enum

from pydantic import ConfigDict
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger, Float, Enum as SQLAlchemyEnum, Table, text
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.orm import declarative_base, relationship

DeclBase = declarative_base()


# Association table for User and Skill (Many-to-Many)
user_skills = Table(
    "user_skills",
    DeclBase.metadata,
    Column("user_id", Integer, ForeignKey("user.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skill.id"), primary_key=True),
)


# Association table for Task and Skill (Many-to-Many)
task_skills = Table(
    "task_skills",
    DeclBase.metadata,
    Column("task_id", Integer, ForeignKey("task.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skill.id"), primary_key=True),
)


# Association table for User and Achievement (Many-to-Many)
user_achievements = Table(
    "user_achievements",
    DeclBase.metadata,
    Column("user_id", Integer, ForeignKey("user.id"), primary_key=True),
    Column("achievement_id", Integer, ForeignKey("achievement.id"), primary_key=True),
    Column("earned_at", DateTime, default=datetime.datetime.now),
)


class Role(str, Enum):
    STUDENT = "student"
    EMPLOYEE = "employee"
    ADMIN = "admin"


class TaskStatus(str, Enum):
    PENDING_APPROVAL = "pending_approval"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ApplicationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class User(DeclBase):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(SQLAlchemyEnum(Role), default=Role.STUDENT)
    points = Column(Integer, default=0)
    reputation = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    
    # Profile fields
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    resume_path = Column(String, nullable=True)
    
    # Optional TG fields (keeping them for possible future integration)
    telegram_id = Column(BigInteger, nullable=True)
    chat_id = Column(BigInteger, nullable=True)
    
    last_login = Column(DateTime, default=datetime.datetime.now)
    created_date = Column(DateTime, default=datetime.datetime.now)

    user_refresh_tokens = relationship("IssuedJWTToken", cascade="all,delete", back_populates="user")
    created_tasks = relationship("Task", back_populates="owner", foreign_keys="Task.owner_id")
    applications = relationship("TaskApplication", back_populates="student")
    submissions = relationship("TaskSubmission", back_populates="student")
    
    # Skills relationship
    skills = relationship("Skill", secondary=user_skills, back_populates="users", lazy="selectin")
    
    # Achievements relationship
    achievements = relationship("Achievement", secondary=user_achievements, back_populates="users", lazy="selectin")


class Skill(DeclBase):
    __tablename__ = "skill"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    users = relationship("User", secondary=user_skills, back_populates="skills")
    tasks = relationship("Task", secondary=task_skills, back_populates="skills")


class Achievement(DeclBase):
    __tablename__ = "achievement"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    icon_type = Column(String, default="award")  # e.g., 'award', 'star', 'target', 'zap'
    
    users = relationship("User", secondary=user_achievements, back_populates="achievements")


class Category(DeclBase):
    __tablename__ = "category"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    
    tasks = relationship("Task", back_populates="category")


class Task(DeclBase):
    __tablename__ = "task"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(String)
    acceptance_criteria = Column(String, nullable=True)
    performer_requirements = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("category.id"))
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    status = Column(SQLAlchemyEnum(TaskStatus), default=TaskStatus.OPEN)
    points_reward = Column(Integer, default=0)
    deadline = Column(DateTime)
    created_date = Column(DateTime, default=datetime.datetime.now)

    owner = relationship("User", back_populates="created_tasks", foreign_keys=[owner_id])
    assignee = relationship("User", foreign_keys=[assignee_id])
    category = relationship("Category", back_populates="tasks")
    applications = relationship("TaskApplication", back_populates="task")
    submissions = relationship("TaskSubmission", back_populates="task")
    
    # Skills relationship
    skills = relationship("Skill", secondary=task_skills, back_populates="tasks", lazy="selectin")
    
    # Attachments relationship
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")

    @property
    def latest_submission(self):
        if self.submissions:
            # Sort by ID or date descending
            return sorted(self.submissions, key=lambda x: x.submitted_at, reverse=True)[0]
        return None


class TaskApplication(DeclBase):
    __tablename__ = "task_application"
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    status = Column(SQLAlchemyEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    message = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.now)

    task = relationship("Task", back_populates="applications")
    student = relationship("User", back_populates="applications")


class TaskSubmission(DeclBase):
    __tablename__ = "task_submission"
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    content = Column(String)  # Text or Link for MVP
    feedback = Column(String)
    status = Column(String, default="reviewing")
    submitted_at = Column(DateTime, default=datetime.datetime.now)

    task = relationship("Task", back_populates="submissions")
    student = relationship("User", back_populates="submissions")


class PointTransaction(DeclBase):
    __tablename__ = "point_transaction"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=True)
    amount = Column(Integer, nullable=False)
    transaction_type = Column(String)  # e.g., "earned", "spent"
    created_at = Column(DateTime, default=datetime.datetime.now)

    user = relationship("User")
    task = relationship("Task")


class IssuedJWTToken(DeclBase):
    __tablename__ = "issued_jwt_token"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    jti = Column(String)
    revoked = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.datetime.now)
    modificated_date = Column(DateTime, default=datetime.datetime.now)

    user = relationship("User", back_populates="user_refresh_tokens")


class ChatMessage(DeclBase):
    __tablename__ = "chat_message"
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    content = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_type = Column(String, nullable=True) # 'image' or 'file'
    created_at = Column(DateTime, default=datetime.datetime.now)

    task = relationship("Task")
    sender = relationship("User")


class TaskAttachment(DeclBase):
    __tablename__ = "task_attachment"
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=False)
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    file_type = Column(String)  # 'image' or 'document'
    created_at = Column(DateTime, default=datetime.datetime.now)

    task = relationship("Task", back_populates="attachments")


async def create_tables(engine: AsyncEngine):
    async with engine.begin() as conn:
        await conn.run_sync(DeclBase.metadata.create_all)
        await conn.execute(
            text('ALTER TABLE task ADD COLUMN IF NOT EXISTS assignee_id INTEGER REFERENCES "user"(id)')
        )
        await conn.execute(
            text("ALTER TABLE task ADD COLUMN IF NOT EXISTS acceptance_criteria VARCHAR")
        )
        await conn.execute(
            text("ALTER TABLE task ADD COLUMN IF NOT EXISTS performer_requirements VARCHAR")
        )
