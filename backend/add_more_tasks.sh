#!/bin/bash

echo "📝 Adding More Tasks to Test Algorithm"
echo ""

# Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kaleb@collabu.com","password":"SecurePass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

# Get project ID
PROJECT_ID=$(curl -s -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['projects'][0]['id'])" 2>/dev/null)

echo "Adding tasks to Project $PROJECT_ID..."
echo ""

# Task 1: Design Database
curl -s -X POST http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Database Schema",
    "description": "Create ERD and define all tables",
    "due_date": "2025-12-31T23:59:59",
    "estimated_hours": 8.0,
    "priority": "urgent"
  }' > /dev/null

echo "✅ Added: Design Database Schema (8 hours, urgent)"

# Task 2: Build Authentication
curl -s -X POST http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Authentication System",
    "description": "Implement JWT-based authentication",
    "due_date": "2025-12-31T23:59:59",
    "estimated_hours": 12.0,
    "priority": "urgent"
  }' > /dev/null

echo "✅ Added: Build Authentication System (12 hours, urgent)"

# Task 3: Create API Endpoints
curl -s -X POST http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Create REST API Endpoints",
    "description": "Build all CRUD endpoints",
    "due_date": "2025-12-31T23:59:59",
    "estimated_hours": 16.0,
    "priority": "high"
  }' > /dev/null

echo "✅ Added: Create REST API Endpoints (16 hours, high)"

# Task 4: Write Tests
curl -s -X POST http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Write Unit Tests",
    "description": "Test all endpoints and functions",
    "due_date": "2025-12-31T23:59:59",
    "estimated_hours": 10.0,
    "priority": "medium"
  }' > /dev/null

echo "✅ Added: Write Unit Tests (10 hours, medium)"

# Task 5: Frontend Development
curl -s -X POST http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build React Frontend",
    "description": "Create UI components and pages",
    "due_date": "2025-12-31T23:59:59",
    "estimated_hours": 24.0,
    "priority": "high"
  }' > /dev/null

echo "✅ Added: Build React Frontend (24 hours, high)"

# Task 6: Documentation
curl -s -X POST http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Write Documentation",
    "description": "API docs and user guide",
    "due_date": "2025-12-31T23:59:59",
    "estimated_hours": 6.0,
    "priority": "low"
  }' > /dev/null

echo "✅ Added: Write Documentation (6 hours, low)"

echo ""
echo "📊 Total: 6 new tasks, 76 hours of work"
echo ""
echo "Now run the algorithm again!"
echo "  ./backend/test_deadline_simple.sh"
