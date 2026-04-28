# CollabU

**Intelligent deadline management and team collaboration for students.**

CollabU helps students break down overwhelming project deadlines into manageable tasks, coordinate with team members, and stay on track with smart scheduling. Built as a full-stack application with a Flask REST API backend and React frontend.

> **Status:** Core features functional — authentication, project management, task tracking, team collaboration, calendar blocking, and intelligent task scheduling are all working. File management and notifications are in active development.

---

## The Problem

Group projects in college are chaotic. Students juggle multiple deadlines, struggle to divide work fairly, and lose track of who's doing what. CollabU addresses this by combining project management with an intelligent scheduling algorithm that accounts for each team member's availability.

## Key Features

**Project & Task Management**
Create projects, break them into tasks with priorities and time estimates, assign work to team members, and track progress through a Kanban-style workflow (todo → in progress → review → completed).

**Smart Task Generation**
Describe your project and CollabU suggests a full task breakdown based on the project type — research papers, software projects, presentations, lab reports, and more. Each suggestion includes time estimates and priority levels.

**Deadline Scheduling Algorithm**
The core differentiator: given a project deadline, team member availability, and task estimates, CollabU calculates an optimal schedule. It factors in each member's calendar blocks (classes, work, etc.) and distributes work based on available hours.

**Team Collaboration**
Invite members by email, assign roles, delegate tasks, and track team-wide progress. Access controls ensure only project owners can modify membership and settings.

**Calendar Integration**
Block off busy times (lectures, jobs, commitments) so the scheduling algorithm knows when you're actually available to work.

**JWT Authentication**
Secure user registration and login with token-based auth, automatic token refresh handling, and protected routes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, React Query, React Router |
| Backend | Flask, SQLAlchemy, Marshmallow, Flask-JWT-Extended |
| Database | SQLite (development), PostgreSQL (production) |
| Auth | JWT access tokens with bcrypt password hashing |
| Deployment | Render (API + DB), Vercel (frontend) |

## Architecture

```
frontend/                          backend/
├── src/                           ├── app/
│   ├── pages/                     │   ├── controllers/    ← Route handlers
│   │   ├── Dashboard.jsx          │   ├── models/         ← SQLAlchemy ORM
│   │   ├── ProjectDetail.jsx      │   ├── schemas/        ← Validation
│   │   ├── Calendar.jsx           │   ├── services/       ← Business logic
│   │   ├── Login.jsx              │   │   ├── deadline_service.py
│   │   └── Register.jsx           │   │   ├── ai_task_generator.py
│   ├── services/                  │   │   ├── calendar_service.py
│   │   ├── api.js                 │   │   └── ...
│   │   ├── projectService.js      │   └── utils/          ← Decorators, helpers
│   │   ├── taskService.js         ├── migrations/         ← Alembic
│   │   └── ...                    └── run.py
│   └── contexts/
│       └── AuthContext.jsx
```

The backend follows MVC with a dedicated services layer for business logic. The frontend uses React Query for server state management and Axios interceptors for automatic auth token injection.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Edit with your own secret keys
flask db upgrade
python run.py                     # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev                       # http://localhost:5173
```

### Docker (alternative)
```bash
docker-compose up
```

## API Overview

All endpoints return JSON. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/projects/` | List user's projects |
| POST | `/api/projects/` | Create project |
| GET | `/api/projects/:id` | Project details + members + tasks |
| POST | `/api/projects/:id/members` | Add team member by user ID |
| GET | `/api/tasks/my` | Tasks assigned to current user |
| POST | `/api/tasks/` | Create task |
| PUT | `/api/tasks/:id` | Update task status/details |
| POST | `/api/deadline/projects/:id/calculate-schedule` | Run scheduling algorithm |
| GET | `/api/calendar/blocks` | Get user's calendar blocks |
| POST | `/api/calendar/blocks` | Create busy-time block |

Full API documentation: [`docs/api-documentation.md`](docs/api-documentation.md)

## Project Structure

```
CollabU/
├── backend/
│   ├── app/
│   │   ├── controllers/     # 8 route modules (auth, projects, tasks, calendar, ...)
│   │   ├── models/          # 7 data models (user, project, task, calendar, ...)
│   │   ├── schemas/         # Marshmallow validation
│   │   ├── services/        # Business logic (deadline algorithm, task generator, ...)
│   │   └── utils/           # Decorators, validators, constants
│   ├── migrations/          # Database version control
│   ├── tests/               # API test scripts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # 5 page components
│   │   ├── services/        # API client layer
│   │   └── contexts/        # Auth state management
│   └── package.json
├── database/
│   └── schema.sql           # Full PostgreSQL schema with indexes
├── docs/                    # Architecture, API docs, setup guide
├── docker-compose.yml
└── render.yaml              # One-click Render deployment
```

## Deployment

### Backend → Render

1. Push repo to GitHub
2. Connect repo on [Render](https://render.com)
3. Render auto-detects `render.yaml` and provisions the API + PostgreSQL database
4. Set `CORS_ORIGINS` env var to your Vercel frontend URL

### Frontend → Vercel

1. Import the repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-render-api.onrender.com/api`
4. Deploy

## Roadmap

- [x] User authentication (JWT)
- [x] Project CRUD with team management
- [x] Task management with priority and status tracking
- [x] Smart task generation by project type
- [x] Deadline scheduling algorithm
- [x] Calendar blocking for availability
- [x] React frontend with dashboard, project detail, and calendar views

## Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api-documentation.md)
- [Database ERD](docs/database-erd.md)
- [Local Setup Guide](docs/setup-guide.md)

## License

This project was built as a portfolio piece and learning exercise. Feel free to reference the architecture and patterns for your own projects.
