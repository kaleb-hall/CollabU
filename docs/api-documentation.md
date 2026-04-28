# CollabU API Documentation

Base URL: `/api`

All protected endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### POST `/api/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securepassword",
  "first_name": "Jane",
  "last_name": "Doe",
  "university": "UC Santa Cruz"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "access_token": "eyJ...",
  "user": { "id": 1, "email": "student@university.edu", ... }
}
```

### POST `/api/auth/login`
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securepassword"
}
```

**Response:** `200 OK` — returns `access_token` and `user` object.

---

## Projects

### GET `/api/projects/`
List all projects for the authenticated user. *(Protected)*

### POST `/api/projects/`
Create a new project. *(Protected)*

**Request Body:**
```json
{
  "title": "CS 101 Final Project",
  "description": "Build a web application",
  "start_date": "2025-01-15",
  "due_date": "2025-03-01",
  "color": "#3b82f6"
}
```

### GET `/api/projects/<id>`
Get project details including members and tasks. *(Protected)*

### PUT `/api/projects/<id>`
Update project fields. *(Protected, owner only)*

### DELETE `/api/projects/<id>`
Delete a project and all associated data. *(Protected, owner only)*

### POST `/api/projects/<id>/members`
Add a team member by user ID. *(Protected, owner only)*

**Request Body:**
```json
{
  "user_id": 2,
  "role": "member"
}
```

Roles: `admin`, `member`, `viewer` (defaults to `member`).

### DELETE `/api/projects/<id>/members/<user_id>`
Remove a team member. *(Protected, owner only)*

---

## Tasks

### GET `/api/tasks/my`
Get all tasks assigned to the authenticated user. *(Protected)*

### POST `/api/tasks/`
Create a task within a project. *(Protected)*

**Request Body:**
```json
{
  "project_id": 1,
  "title": "Set up database schema",
  "description": "Design and implement the PostgreSQL schema",
  "due_date": "2025-02-01T23:59:00",
  "priority": "high",
  "assigned_to": 2,
  "estimated_hours": 4.0
}
```

### PUT `/api/tasks/<id>`
Update task fields (status, priority, assignment, etc.). *(Protected)*

### DELETE `/api/tasks/<id>`
Delete a task. *(Protected, project owner only)*

---

## Calendar

### GET `/api/calendar/blocks`
Get calendar blocks for the authenticated user. *(Protected)*

### POST `/api/calendar/blocks`
Create a busy-time block. *(Protected)*

**Request Body:**
```json
{
  "title": "CS 101 Lecture",
  "start_time": "2025-01-20T10:00:00",
  "end_time": "2025-01-20T11:30:00",
  "recurring": true,
  "recurrence_pattern": "weekly"
}
```

### DELETE `/api/calendar/blocks/<id>`
Delete a calendar block. *(Protected)*

---

## Error Responses

All endpoints return consistent error format:
```json
{
  "error": "Description of what went wrong"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden / insufficient permissions |
| 404 | Resource not found |
| 500 | Internal server error |
