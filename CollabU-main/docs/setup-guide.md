# CollabU Local Development Setup

## Prerequisites

- Python 3.10+
- Node.js 18+
- Git

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/CollabU.git
cd CollabU
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your own secret keys (see .env.example for guidance)
```

### 4. Initialize database
```bash
flask db upgrade
```

### 5. Run backend server
```bash
python run.py
# API available at http://localhost:5000
```

### 6. Frontend setup (new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# App available at http://localhost:5173
```

## Running Tests

```bash
cd backend
source venv/bin/activate
# API workflow tests
bash test_auth.sh
bash test_complete_workflow.sh
bash test_tasks.sh
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all configurable options.

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Flask session secret |
| `JWT_SECRET_KEY` | Yes | JWT signing key |
| `DATABASE_URL` | No | Defaults to SQLite for development |
| `VITE_API_URL` | No | Backend URL, defaults to `http://localhost:5000/api` |
