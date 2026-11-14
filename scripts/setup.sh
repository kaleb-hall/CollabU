#!/usr/bin/env bash
# First-time setup: Python and Node packages, .env files, database, demo data.
# Safe to run again.
set -o errexit
cd "$(dirname "$0")/.."

PYTHON=${PYTHON:-python3.12}
if ! command -v "$PYTHON" >/dev/null; then
  echo "Python 3.12 is needed (or set PYTHON=/path/to/python3.12)." >&2
  exit 1
fi

echo "Backend: Python packages"
[ -d backend/venv ] || "$PYTHON" -m venv backend/venv
backend/venv/bin/pip install --quiet -r backend/requirements-dev.txt

echo "Frontend: Node packages"
npm install --silent
npm --prefix frontend install --silent

for dir in backend frontend; do
  if [ ! -f "$dir/.env" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "Created $dir/.env from $dir/.env.example"
  fi
done

echo "Database: migrations and demo data"
(cd backend && venv/bin/flask db upgrade && venv/bin/flask seed)

echo
echo "All set. Start everything with: npm run dev"
echo "Then open http://localhost:5173 and log in as demo@collabu.test / Demo1234!"
