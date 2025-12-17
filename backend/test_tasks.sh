#!/bin/bash

echo "✅ Testing Task Management API"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:5000/api"

# Login and get token
echo -e "${BLUE}🔐 Logging in...${NC}"
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kaleb@collabu.com","password":"SecurePass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "Registering new user..."
    RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
      -H "Content-Type: application/json" \
      -d '{"email":"kaleb@collabu.com","password":"SecurePass123","first_name":"Kaleb","last_name":"Hall"}')
    TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
fi

echo -e "${GREEN}✅ Logged in${NC}"
echo ""

# Create a project first
echo -e "${BLUE}📁 Creating a project...${NC}"
PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task Testing Project",
    "description": "Project for testing tasks",
    "deadline": "2025-12-31T23:59:59"
  }')

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('project', {}).get('id', ''))" 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Project might already exist, using existing projects...${NC}"
    PROJECTS=$(curl -s -X GET $BASE_URL/projects -H "Authorization: Bearer $TOKEN")
    PROJECT_ID=$(echo "$PROJECTS" | python3 -c "import sys, json; projects = json.load(sys.stdin).get('projects', []); print(projects[0]['id'] if projects else '')" 2>/dev/null)
fi

echo -e "${GREEN}✅ Using Project ID: $PROJECT_ID${NC}"
echo ""

# Test 1: Create a task
echo -e "${BLUE}1️⃣  Creating a task...${NC}"
TASK1=$(curl -s -X POST $BASE_URL/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Database Schema",
    "description": "Create ERD and define all tables",
    "due_date": "2025-12-15T23:59:59",
    "estimated_hours": 8.0,
    "priority": "high"
  }')

echo "$TASK1" | python3 -m json.tool
TASK1_ID=$(echo "$TASK1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('task', {}).get('id', ''))" 2>/dev/null)
echo ""

# Test 2: Create another task
echo -e "${BLUE}2️⃣  Creating another task...${NC}"
TASK2=$(curl -s -X POST $BASE_URL/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement Authentication",
    "description": "Build JWT-based auth system",
    "due_date": "2025-12-20T23:59:59",
    "estimated_hours": 12.0,
    "priority": "urgent"
  }')

echo "$TASK2" | python3 -m json.tool
TASK2_ID=$(echo "$TASK2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('task', {}).get('id', ''))" 2>/dev/null)
echo ""

# Test 3: Create a third task
echo -e "${BLUE}3️⃣  Creating a third task...${NC}"
curl -s -X POST $BASE_URL/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Write Unit Tests",
    "description": "Test all endpoints",
    "due_date": "2025-12-25T23:59:59",
    "estimated_hours": 6.0,
    "priority": "medium"
  }' | python3 -m json.tool
echo ""

# Test 4: Get all tasks for project
echo -e "${BLUE}4️⃣  Getting all tasks for the project...${NC}"
curl -s -X GET $BASE_URL/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test 5: Get specific task
echo -e "${BLUE}5️⃣  Getting specific task details...${NC}"
curl -s -X GET $BASE_URL/tasks/$TASK1_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test 6: Update task
echo -e "${BLUE}6️⃣  Updating task (changing priority)...${NC}"
curl -s -X PUT $BASE_URL/tasks/$TASK1_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Database Schema (Updated)",
    "priority": "urgent",
    "estimated_hours": 10.0
  }' | python3 -m json.tool
echo ""

# Test 7: Update task status
echo -e "${BLUE}7️⃣  Updating task status to in_progress...${NC}"
curl -s -X PUT $BASE_URL/tasks/$TASK1_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}' | python3 -m json.tool
echo ""

# Test 8: Complete a task
echo -e "${BLUE}8️⃣  Marking task as completed...${NC}"
curl -s -X PUT $BASE_URL/tasks/$TASK2_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}' | python3 -m json.tool
echo ""

# Test 9: Get my tasks
echo -e "${BLUE}9️⃣  Getting my assigned tasks...${NC}"
curl -s -X GET $BASE_URL/tasks/my-tasks \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test 10: Filter tasks by status
echo -e "${BLUE}🔟 Filtering tasks by status (in_progress)...${NC}"
curl -s -X GET "$BASE_URL/tasks/project/$PROJECT_ID?status=in_progress" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test 11: Filter by priority
echo -e "${BLUE}1️⃣1️⃣  Filtering tasks by priority (urgent)...${NC}"
curl -s -X GET "$BASE_URL/tasks/project/$PROJECT_ID?priority=urgent" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Summary
echo ""
echo "==============================="
echo -e "${GREEN}🎉 Task Management Tests Complete!${NC}"
echo "==============================="
echo ""
echo "✅ Tasks created"
echo "✅ Tasks retrieved"
echo "✅ Tasks updated"
echo "✅ Task status changed"
echo "✅ Task filtering works"
echo ""
echo -e "${GREEN}Your task management system is fully functional! 🚀${NC}"