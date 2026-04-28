# CollabU Architecture

## Overview

CollabU follows a standard client-server architecture with a React SPA frontend communicating with a Flask REST API backend.

```
┌─────────────────────┐     HTTP/JSON      ┌─────────────────────┐
│   React Frontend    │ ◄────────────────► │    Flask Backend     │
│   (Vite + Tailwind) │                    │    (REST API)        │
└─────────────────────┘                    └──────────┬──────────┘
                                                      │
                                                      │ SQLAlchemy ORM
                                                      │
                                              ┌───────▼───────┐
                                              │   SQLite (dev) │
                                              │   PostgreSQL   │
                                              │   (production) │
                                              └───────────────┘
```

## Backend Structure (MVC Pattern)

```
backend/
├── app/
│   ├── __init__.py          # App factory, extension initialization
│   ├── controllers/         # Route handlers (View layer)
│   │   ├── auth_controller.py
│   │   ├── project_controller.py
│   │   ├── task_controller.py
│   │   ├── calendar_controller.py
│   │   └── ...
│   ├── models/              # SQLAlchemy models (Model layer)
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── task.py
│   │   └── ...
│   ├── schemas/             # Marshmallow validation schemas
│   └── utils/               # Helpers, decorators, constants
├── migrations/              # Alembic database migrations
├── tests/
└── run.py                   # Application entry point
```

## Frontend Structure

```
frontend/src/
├── contexts/        # React Context providers (AuthContext)
├── pages/           # Route-level page components
├── services/        # API client modules (axios-based)
├── utils/           # Shared constants and helpers
└── App.jsx          # Router and app shell
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | JWT (access tokens) | Stateless, scales horizontally |
| Validation | Marshmallow schemas | Decoupled from models, reusable |
| State management | React Query + Context | Server state caching + minimal client state |
| Styling | Tailwind CSS | Rapid prototyping, consistent design |
| Dev database | SQLite | Zero-config local development |
| Prod database | PostgreSQL | Reliability, concurrent access |

## API Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns a JWT access token
3. Frontend stores token in `localStorage`
4. All subsequent requests include `Authorization: Bearer <token>` header
5. Backend validates token via `@jwt_required()` decorator
6. Expired/invalid tokens return 401, frontend redirects to login
