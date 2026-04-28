#!/bin/bash

echo "👥 Adding Team Member to Project"
echo ""

# Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kaleb@collabu.com","password":"SecurePass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

# Register Alice
echo "Registering Alice..."
ALICE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@collabu.com",
    "password": "AlicePass123",
    "first_name": "Alice",
    "last_name": "Smith"
  }')

ALICE_ID=$(echo "$ALICE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$ALICE_ID" ]; then
    echo "Alice already exists, getting ID..."
    ALICE_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"alice@collabu.com","password":"AlicePass123"}')
    ALICE_ID=$(echo "$ALICE_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null)
fi

echo "✅ Alice ID: $ALICE_ID"

# Get project ID
PROJECT_ID=$(curl -s -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['projects'][0]['id'])" 2>/dev/null)

# Add Alice to project
echo "Adding Alice to project..."
curl -s -X POST http://localhost:5000/api/projects/$PROJECT_ID/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $ALICE_ID,
    \"role\": \"member\"
  }" | python3 -m json.tool

echo ""
echo "✅ Alice added to project!"
echo ""
echo "Now run the algorithm to see workload distribution!"
echo "  ./backend/test_deadline_simple.sh"
