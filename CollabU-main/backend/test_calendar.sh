#!/bin/bash

echo "📅 Testing Calendar Blocks"
echo "=========================="
echo ""

BASE_URL="http://localhost:5000/api"

# Login
echo "1️⃣  Logging in..."
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kaleb@collabu.com","password":"SecurePass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

echo "✅ Logged in"
echo ""

# Create calendar block - Monday class
echo "2️⃣  Creating calendar block: Monday CS Class..."
curl -s -X POST $BASE_URL/calendar/blocks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2025-12-22T09:00:00",
    "end_time": "2025-12-22T12:00:00",
    "title": "Computer Science Class",
    "description": "CS 401 - Advanced Algorithms",
    "block_type": "class"
  }' | python3 -m json.tool
echo ""

# Create calendar block - Work
echo "3️⃣  Creating calendar block: Part-time Work..."
curl -s -X POST $BASE_URL/calendar/blocks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2025-12-23T14:00:00",
    "end_time": "2025-12-23T20:00:00",
    "title": "Part-time Job",
    "description": "Working at coffee shop",
    "block_type": "work"
  }' | python3 -m json.tool
echo ""

# Create calendar block - Recurring sleep
echo "4️⃣  Creating recurring block: Sleep Schedule..."
curl -s -X POST $BASE_URL/calendar/blocks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2025-12-22T23:00:00",
    "end_time": "2025-12-23T07:00:00",
    "title": "Sleep",
    "description": "Daily sleep schedule",
    "block_type": "sleep",
    "is_recurring": true,
    "recurrence_pattern": "daily"
  }' | python3 -m json.tool
echo ""

# Get all calendar blocks
echo "5️⃣  Getting all calendar blocks..."
curl -s -X GET $BASE_URL/calendar/blocks \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Get availability
echo "6️⃣  Calculating availability (Dec 20 - Dec 31)..."
curl -s -X GET "$BASE_URL/calendar/availability?start_date=2025-12-20T00:00:00&end_date=2025-12-31T23:59:59" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "✅ Calendar tests complete!"
echo ""
echo "Now run the deadline algorithm again to see how it accounts for busy times!"
echo "  ./backend/test_deadline_simple.sh"
