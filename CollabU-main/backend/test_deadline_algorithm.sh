#!/bin/bash

echo "🎯 TESTING THE DEADLINE ALGORITHM"
echo "=================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:5000/api"

# Login
echo -e "${BLUE}🔐 Logging in...${NC}"
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kaleb@collabu.com","password":"SecurePass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

echo -e "${GREEN}✅ Logged in${NC}"
echo ""

# Get projects
PROJECTS=$(curl -s -X GET $BASE_URL/projects -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(echo "$PROJECTS" | python3 -c "import sys, json; print(json.load(sys.stdin)['projects'][0]['id'])" 2>/dev/null)

echo -e "${BLUE}📁 Using Project ID: $PROJECT_ID${NC}"
echo ""

# Make sure we have tasks
echo -e "${BLUE}📋 Current tasks in project:${NC}"
curl -s -X GET $BASE_URL/tasks/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# THE MAGIC MOMENT! 🪄
echo -e "${YELLOW}✨ RUNNING THE DEADLINE ALGORITHM...${NC}"
echo ""

SCHEDULE=$(curl -s -X POST $BASE_URL/deadline/projects/$PROJECT_ID/calculate-schedule \
  -H "Authorization: Bearer $TOKEN")

echo "$SCHEDULE" | python3 -m json.tool

echo ""
echo -e "${GREEN}🎉 ALGORITHM COMPLETE!${NC}"
echo ""

# Show summary
echo "📊 SCHEDULE SUMMARY:"
echo "$SCHEDULE" | python3 -c "
import sys
import json

try:
    data = json.load(sys.stdin)
    schedule = data.get('schedule', {})
    
    print(f'\n  Total Hours Needed: {schedule.get(\"total_hours_needed\", 0):.1f}')
    print(f'  Total Hours Available: {schedule.get(\"total_hours_available\", 0):.1f}')
    print(f'  Is Achievable: {\"✅ YES\" if schedule.get(\"is_achievable\") else \"❌ NO\"}')
    
    print('\n  Team Workload:')
    for user_id, hours in schedule.get('team_workload', {}).items():
        print(f'    User {user_id}: {hours:.1f} hours')
    
    if data.get('warnings'):
        print('\n  ⚠️  Warnings:')
        for warning in data['warnings']:
            print(f'    {warning}')
    
    print(f'\n  📝 {len(schedule.get(\"tasks\", []))} tasks scheduled\n')
except json.JSONDecodeError:
    print('\n  ❌ Error parsing schedule response\n')
except Exception as e:
    print(f'\n  ❌ Error: {e}\n')
"

echo ""
echo -e "${GREEN}✅ Algorithm test complete!${NC}"
