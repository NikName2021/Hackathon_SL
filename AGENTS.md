# Project: University Task Board (Hackathon)

## Project Overview
A digital platform for university students and staff to manage small tasks, projects, and research opportunities. It aims to bridge the gap between staff needs and student professional growth through a gamified, point-based system.

## Technical Stack
- **Backend**: Python (FastAPI), SQLAlchemy (Async), Pydantic, SQLite/PostgreSQL.
- **Frontend**: React, TypeScript, Vite, Axios, Tailwind CSS (Design System).
- **Infratructure**: Docker, Docker Compose.

## Repository Structure
- `/src`: Backend FastAPI application.
  - `/src/app/api/routes`: API endpoints (auth, tasks, admin, profile).
  - `/src/app/database`: Models and DB session.
  - `/src/app/services`: Business logic (task lifecycle, points).
  - `/src/app/repositories`: Data access layer.
- `/spa`: Frontend React application.
  - `/spa/src/pages`: Main application views.
  - `/spa/src/components`: Reusable UI components.
  - `/spa/src/api`: API client and services.
- `/docker`: Dockerfiles and configuration.

## Implemented Features (MVP)
- [x] User registration and role-based authentication (Student, Employee, Admin).
- [x] Task lifecycle: Creation -> Moderation -> Open -> Application -> In Progress -> Review -> Completed.
- [x] Point awarding and basic reputation system.
- [x] Admin dashboard with expandable moderation queue.
- [x] Student dashboard with interactive task recommendations.
- [x] Employee dashboard for owner task tracking and management.
- [x] **New**: Cover letter support for task applications.
- [x] **New**: Deep-linking and highlighting system for recommended tasks.
- [x] Telegram integration placeholders.

## Missing Features / Roadmap
- [ ] **Messenger**: Real-time communication between student and task owner.
- [ ] **Gamification**: Visual leaderboards, achievement system, and interactive stats.
- [ ] **Knowledge Base / FAQ**: Documentation for platform use.
- [ ] **Profile Enhancements**: Student resume upload and skill tags.
- [ ] **UX/UI Polish**: Mobile responsiveness and micro-interactions.

## How to Run

### Backend
1. `cd src/app`
2. `python main.py`
Backend API: `http://localhost:8000` (Swagger: `/docs`)

### Frontend
1. `cd spa`
2. `npm run dev`
Frontend SPA: `http://localhost:3000`

## Key Files to Watch
- `src/app/database/all_models.py`: Core data structure.
- `src/app/services/task_service.py`: Main business logic.
- `spa/src/pages/TaskCatalog.tsx`: Main user interaction point (with highlighting).
- `spa/src/pages/ModerationPanel.tsx`: Admin interface for task reviews.
- `spa/src/pages/MyTasks.tsx`: Owner/Student project management dashboard.
- `spa/src/components/ApplicationModal.tsx`: Core logic for task applications with cover letters.
