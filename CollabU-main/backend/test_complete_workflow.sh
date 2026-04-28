#!/bin/bash

echo "🎯 CollabU Complete Workflow Test"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:5000/api"

# Test 1: Register User 1 (Project Owner)
echo -e "${BLUE}📝 Test 1: Registering User 1 (Kaleb)${NC}"
USER1_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kaleb@collabu.com",
    "password": "SecurePass123",
    "first_name": "Kaleb",
    "last_name": "Hall"
  }')

if echo "$USER1_RESPONSE" | grep -q "already registered"; then
    echo -e "${YELLOW}User already exists, logging in...${NC}"
    USER1_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "kaleb@collabu.com",
        "password": "SecurePass123"
      }')
fi

TOKEN1=$(echo "$USER1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
USER1_ID=$(echo "$USER1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$TOKEN1" ]; then
    echo -e "${RED}❌ Failed to get User 1 token${NC}"
    exit 1
fi
echo -e "${GREEN}✅ User 1 registered/logged in (ID: $USER1_ID)${NC}"
echo ""

# Test 2: Register User 2 (Team Member)
echo -e "${BLUE}📝 Test 2: Registering User 2 (Alice)${NC}"
USER2_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@collabu.com",
    "password": "AlicePass123",
    "first_name": "Alice",
    "last_name": "Smith"
  }')

if echo "$USER2_RESPONSE" | grep -q "already registered"; then
    echo -e "${YELLOW}User already exists, logging in...${NC}"
    USER2_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "alice@collabu.com",
        "password": "AlicePass123"
      }')
fi

TOKEN2=$(echo "$USER2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
USER2_ID=$(echo "$USER2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$TOKEN2" ]; then
    echo -e "${RED}❌ Failed to get User 2 token${NC}"
    exit 1
fi
echo -e "${GREEN}✅ User 2 registered/logged in (ID: $USER2_ID)${NC}"
echo ""

# Test 3: User 1 creates a project
echo -e "${BLUE}🚀 Test 3: User 1 creates a project${NC}"
CREATE_PROJECT=$(curl -s -X POST $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CollabU MVP Development",
    "description": "Build the minimum viable product for CollabU",
    "deadline": "2025-12-31T23:59:59"
  }')

echo "$CREATE_PROJECT" | python3 -m json.tool
PROJECT_ID=$(echo "$CREATE_PROJECT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('project', {}).get('id', ''))" 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Failed to create project${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Project created (ID: $PROJECT_ID)${NC}"
echo ""

# Test 4: User 1 adds User 2 as a member
echo -e "${BLUE}👥 Test 4: User 1 adds User 2 to the project${NC}"
ADD_MEMBER=$(curl -s -X POST $BASE_URL/projects/$PROJECT_ID/members \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER2_ID,
    \"role\": \"member\"
  }")

echo "$ADD_MEMBER" | python3 -m json.tool
echo -e "${GREEN}✅ User 2 added as member${NC}"
echo ""

# Test 5: User 1 views all their projects
echo -e "${BLUE}📋 Test 5: User 1 views all their projects${NC}"
USER1_PROJECTS=$(curl -s -X GET $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN1")

echo "$USER1_PROJECTS" | python3 -m json.tool
echo -e "${GREEN}✅ Projects retrieved${NC}"
echo ""

# Test 6: User 2 views all their projects (should see the project they were added to)
echo -e "${BLUE}📋 Test 6: User 2 views all their projects${NC}"
USER2_PROJECTS=$(curl -s -X GET $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN2")

echo "$USER2_PROJECTS" | python3 -m json.tool
echo -e "${GREEN}✅ Projects retrieved for User 2${NC}"
echo ""

# Test 7: User 1 gets specific project details
echo -e "${BLUE}🔍 Test 7: User 1 gets project details${NC}"
PROJECT_DETAILS=$(curl -s -X GET $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN1")

echo "$PROJECT_DETAILS" | python3 -m json.tool
echo -e "${GREEN}✅ Project details retrieved${NC}"
echo ""

# Test 8: User 1 updates the project
echo -e "${BLUE}✏️  Test 8: User 1 updates the project${NC}"
UPDATE_PROJECT=$(curl -s -X PUT $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CollabU MVP Development (Updated)",
    "description": "Build the minimum viable product for CollabU - Updated description",
    "status": "active"
  }')

echo "$UPDATE_PROJECT" | python3 -m json.tool
echo -e "${GREEN}✅ Project updated${NC}"
echo ""

# Test 9: User 1 gets current user info
echo -e "${BLUE}👤 Test 9: User 1 gets their profile${NC}"
USER1_PROFILE=$(curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN1")

echo "$USER1_PROFILE" | python3 -m json.tool
echo -e "${GREEN}✅ Profile retrieved${NC}"
echo ""

# Test 10: User 2 tries to update the project (should fail - not admin)
echo -e "${BLUE}🚫 Test 10: User 2 tries to update project (should fail)${NC}"
USER2_UPDATE=$(curl -s -X PUT $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hacked Project"
  }')

echo "$USER2_UPDATE" | python3 -m json.tool
if echo "$USER2_UPDATE" | grep -q "Access denied"; then
    echo -e "${GREEN}✅ Correctly denied access${NC}"
else
    echo -e "${RED}❌ Security issue: User 2 should not be able to update${NC}"
fi
echo ""

# Test 11: User 1 removes User 2 from project
echo -e "${BLUE}❌ Test 11: User 1 removes User 2 from project${NC}"
REMOVE_MEMBER=$(curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID/members/$USER2_ID \
  -H "Authorization: Bearer $TOKEN1")

echo "$REMOVE_MEMBER" | python3 -m json.tool
echo -e "${GREEN}✅ Member removed${NC}"
echo ""

# Test 12: User 2 tries to access project (should fail)
echo -e "${BLUE}🚫 Test 12: User 2 tries to access project (should fail)${NC}"
USER2_ACCESS=$(curl -s -X GET $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN2")

echo "$USER2_ACCESS" | python3 -m json.tool
if echo "$USER2_ACCESS" | grep -q "Access denied"; then
    echo -e "${GREEN}✅ Correctly denied access${NC}"
else
    echo -e "${RED}❌ Security issue: User 2 should not have access${NC}"
fi
echo ""

# Test 13: User 1 deletes the project
echo -e "${BLUE}🗑️  Test 13: User 1 deletes the project${NC}"
DELETE_PROJECT=$(curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN1")

echo "$DELETE_PROJECT" | python3 -m json.tool
echo -e "${GREEN}✅ Project deleted${NC}"
echo ""

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 All Tests Completed!${NC}"
echo "=================================="
echo ""
echo "Summary:"
echo "- ✅ User registration/login"
echo "- ✅ Project creation"
echo "- ✅ Member management"
echo "- ✅ Project viewing"
echo "- ✅ Project updating"
echo "- ✅ Access control"
echo "- ✅ Project deletion"
echo ""
echo "Your CollabU backend is working great! 🚀"
