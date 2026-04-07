# Backend Project: University Task Board (App)

## Overview
This is the core FastAPI backend for the University Task Board. It handles authentication, task lifecycle management, point transactions, and administrative moderation.

## Tech Stack
- **Framework**: FastAPI (Asynchronous).
- **ORM**: SQLAlchemy 2.0 (Async) with `asyncpg`.
- **Database**: PostgreSQL (Production) / SQLite (Testing/Dev if configured).
- **Validation**: Pydantic v2.
- **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `passlib` (bcrypt).
- **Logging**: Python `logging` with `dictConfig`.

## Directory Structure
- `/api/routes`: Layer for API endpoint definitions. All routes are aggregated in `api/routes/api.py`.
- `/core`: Application configuration, database engine/session logic, and security settings.
- `/database`: SQLAlchemy models (`all_models.py`) and migration scripts.
- `/repositories`: Data Access Layer (DAL). Contains static methods for direct DB interaction.
- `/services`: Business Logic Layer (BLL). Coordinates repositories to perform complex operations (e.g., `TaskService.review_task`).
- `/schemas`: Pydantic models for request/response validation.
- `/helpers`: Utility functions and maintenance scripts (e.g., `seed_data.py`).
- `/middleware`: Custom FastAPI middleware (e.g., `LoggingMiddleware.py`).

## Architectural Patterns
1. **Repository Pattern**: We separate DB queries from business logic. Look in `/repositories` for raw SQL/ORM operations.
2. **Service Layer**: Business rules (like "only owner can review") live in `/services`.
3. **Pydantic Schemas**: Separate schemas are used for input (`TaskCreate`) and output (`TaskResponse`).
4. **Dependency Injection**: Database sessions and current users are injected using FastAPI `Depends`.

## Core Data Models (`database/all_models.py`)
- `User`: Roles (`ADMIN`, `EMPLOYEE`, `STUDENT`), `points`, `reputation`.
- `Task`: `status` (`PENDING_APPROVAL`, `OPEN`, `IN_PROGRESS`, `REVIEW`, `COMPLETED`, `CANCELLED`).
- `Application`: Student's request to perform a task.
- `Submission`: Student's work submission.
- `PointTransaction`: History of earned/spent points.

## Key Files for Agents
- `main.py`: Entry point, CORS config, and startup events.
- `core/config.py`: Database engine, JWT settings, and environment variable loading.
- `helpers/auth.py`: JWT decoding and `RoleChecker` dependency.
- `repositories/task.py`: Most complex queries reside here.

## Advice for Future Agents
- **Async First**: Always use `await` for DB calls and repository methods.
- **Role Control**: Use `RoleChecker([Role.ADMIN, ...])` to protect sensitive endpoints.
- **DTOs & Schemas**: If you add a field to the model, update the corresponding `schemas/` and repository DTOs.
- **Seeding**: New categories or default data should be added to `helpers/seed_data.py` and called from `main.py` startup.
