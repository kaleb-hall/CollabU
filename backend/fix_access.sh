#!/bin/bash

echo "🔍 Debugging Access Issue"
echo "========================="
echo ""

# Get token
echo "1️⃣  Logging in..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kaleb@collabu.com","password":"SecurePass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi

echo "✅ Logged in"
echo ""

# Check projects
echo "2️⃣  Checking your projects..."
PROJECTS=$(curl -s -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN")

echo "$PROJECTS" | python3 -m json.tool

PROJECT_COUNT=$(echo "$PROJECTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('projects', [])))" 2>/dev/null)

if [ "$PROJECT_COUNT" -eq 0 ]; then
    echo ""
    echo "📝 No projects found. Creating one..."
    
    CREATE_PROJ=$(curl -s -X POST http://localhost:5000/api/projects \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "My First Project",
        "description": "Testing project for tasks",
        "deadline": "2025-12-31T23:59:59"
      }')
    
    echo "$CREATE_PROJ" | python3 -m json.tool
    PROJECT_ID=$(echo "$CREATE_PROJ" | python3 -c "import sys, json; print(json.load(sys.stdin).get('project', {}).get('id', ''))" 2>/dev/null)
else
    echo ""
    echo "✅ Found $PROJECT_COUNT project(s)"
    PROJECT_ID=$(echo "$PROJECTS" | python3 -c "import sys, json; print(json.load(sys.stdin)['projects'][0]['id'])" 2>/dev/null)
fi

echo ""
echo "3️⃣  Using Project ID: $PROJECT_ID"
echo ""

# Try to create a task
echo "4️⃣  Creating a task in project $PROJECT_ID..."
TASK_RESPONSE=$(curl -s -X POST http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "due_date": "2025-12-31T23:59:59",
    "priority": "medium"
  }')

echo "$TASK_RESPONSE" | python3 -m json.tool

if echo "$TASK_RESPONSE" | grep -q "Access denied"; then
    echo ""
    echo "❌ Still getting access denied!"
    echo "Let me check the database..."
else
    echo ""
    echo "✅ Task created successfully!"
fi

echo ""
echo "5️⃣  Getting all tasks for project..."
curl -s -X GET http://localhost:5000/api/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
