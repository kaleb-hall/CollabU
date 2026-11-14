# CollabU

**A planner for student group projects.** Break a project into tasks, share the work fairly, and see who is doing what before the deadline sneaks up.

Flask API + React frontend. Built as a portfolio project.

## What it does

- **Projects and tasks** on a kanban board (To do, In progress, In review, Blocked, Done) with drag and drop, including the keyboard.
- **Suggested tasks** from templates (research paper, lab report, presentation and more), with time estimates.
- **Plan schedule**: spreads open tasks across the team, around everyone's classes and busy time.
- **Calendar** with weekly repeating busy time, like lectures.
- **Teams**: invite by email, comments on tasks, file attachments, an activity feed and a workload view.
- **Notifications** in the app, plus email for big moments and a daily "due soon" digest.
- **Finishing a project**: a celebration, a final note to the team, a summary, and lock and archive.

## Run it locally (about 5 minutes)

You need **Python 3.12** and **Node 20.19 or newer**. macOS or Linux (on Windows, use WSL).

```bash
git clone <your fork url> CollabU
cd CollabU
npm run setup
npm run dev
```

Then open http://localhost:5173 and log in as **demo@collabu.test** with password **Demo1234!**.

What those two commands do:

- `npm run setup` creates the Python virtual environment, installs the Python and Node packages, copies `backend/.env.example` and `frontend/.env.example` to `.env` (only if you do not have one yet), creates the local SQLite database and fills it with demo data. Safe to run again.
- `npm run dev` starts the API on port 5000 and the website on port 5173 together. Stop both with Ctrl+C.

Other commands:

| Command | What it does |
|---|---|
| `npm run seed` | Resets the demo data (only the @collabu.test people; your own accounts are untouched) |
| `npm test` | Runs the backend and frontend tests |
| `cd backend && venv/bin/flask send-digest` | Sends the "due soon" emails now (locally they print in the terminal) |

Locally, emails are printed in the terminal running `npm run dev` instead of being sent, and uploaded files go to `backend/uploads`. Every setting is explained in [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

## Tech

| Part | Tools |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Query, React Router, Base UI, dnd-kit, motion |
| Backend | Flask 3, SQLAlchemy 2, Alembic, Marshmallow, Flask-JWT-Extended, Flask-Limiter |
| Database | SQLite locally, PostgreSQL in production |
| Hosting | Render (API and database), Vercel (website), Supabase Storage (files), Resend (email) |

## How the code is organized

```
backend/app/
  controllers/   one file per area of the API (routes only)
  services/      the actual logic: scheduling, notifications, email, storage...
  models/        database tables
  schemas/       input checking and JSON output
  utils/         permissions decorator, time and paging helpers
backend/migrations/   database changes, applied with `flask db upgrade`
backend/tests/        pytest

frontend/src/
  pages/         one file per screen
  components/    layout, home, project, calendar and shared ui pieces
  hooks/         React Query hooks (all query keys live in hooks/queryKeys.js)
  services/      API calls
  lib/           small helpers: dates, urgency, files, tokens
  styles/tokens.css   every color, for light and dark mode
```

Every API error looks the same: `{"error": {"code": "NOT_FOUND", "message": "...", "details": {}}}`.

## Deploying

See [DEPLOY.md](DEPLOY.md) for a step by step checklist (Render, Vercel, Supabase, Resend, GitHub Actions).

## More

- [PLAN.md](PLAN.md): what changed in each phase of the cleanup, with measurements and open decisions.
- [`docs/`](docs): older design notes from the first version. The API list there is out of date; the code in `backend/app/controllers` is the source of truth.
