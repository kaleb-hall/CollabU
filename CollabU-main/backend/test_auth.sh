#!/bin/bash

echo "=== Testing CollabU Authentication ==="
echo ""

# Test 1: Register
echo "1. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123",
    "first_name": "Test",
    "last_name": "User"
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

echo ""
echo "2. Getting current user info..."
curl -s -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool

echo ""
echo "3. Testing login..."
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }' | python3 -m json.tool

echo ""
echo "=== Tests Complete ==="
