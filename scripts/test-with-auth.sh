#!/bin/bash

# Complete Testing Script with Authentication
# Creates test user, gets token, and tests all routes

set -e

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
TEST_EMAIL="testuser$(date +%s)@test.com"
TEST_PASSWORD="TestPassword123!"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Complete Frontend-Backend Auth Testing"
echo "=========================================="
echo ""

# Check if services are running
echo -e "${BLUE}Checking services...${NC}"
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}❌ Backend is not running on port 3001${NC}"
    echo "   Start it with: docker-compose up -d backend redis"
    exit 1
fi

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend is not running on port 3000${NC}"
    echo "   Start it with: npm run dev"
    echo ""
fi

echo -e "${GREEN}✓ Services are running${NC}"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check Supabase config
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Supabase configuration missing${NC}"
    echo "   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    exit 1
fi

echo -e "${BLUE}Step 1: Creating test user...${NC}"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo ""

# Create test user
CREATE_OUTPUT=$(NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  npx tsx scripts/create-test-user.ts --email "$TEST_EMAIL" --password "$TEST_PASSWORD" 2>&1)

if echo "$CREATE_OUTPUT" | grep -q "Successfully"; then
    echo -e "${GREEN}✓ Test user created${NC}"
else
    echo -e "${YELLOW}⚠️  User might already exist, trying to sign in...${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Getting authentication token...${NC}"

# Get token
TOKEN_OUTPUT=$(NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  npx tsx scripts/get-test-token.ts --email "$TEST_EMAIL" --password "$TEST_PASSWORD" 2>&1)

# Extract token
TEST_TOKEN=$(echo "$TOKEN_OUTPUT" | grep -A 1 "Full Access Token:" | tail -1 | tr -d ' ')

if [ -z "$TEST_TOKEN" ] || [ "$TEST_TOKEN" = "" ]; then
    echo -e "${RED}❌ Failed to get token${NC}"
    echo "$TOKEN_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ Token obtained${NC}"
echo "   Token: ${TEST_TOKEN:0:50}..."
echo ""

# Export token for use
export TEST_USER_TOKEN="$TEST_TOKEN"
export BACKEND_SHARED_SECRET="${BACKEND_SHARED_SECRET:-dev-backend-shared-secret-minimum-32-characters-long-for-development-only}"

echo -e "${BLUE}Step 3: Testing authenticated routes...${NC}"
echo ""

# Test backend directly
test_backend() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "  Testing $description... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-Backend-Secret: $BACKEND_SHARED_SECRET" \
            -H "Authorization: Bearer $TEST_USER_TOKEN" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
            -H "X-Backend-Secret: $BACKEND_SHARED_SECRET" \
            -H "Authorization: Bearer $TEST_USER_TOKEN" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -eq 400 ] || [ "$http_code" -eq 404 ]; then
        echo -e "${YELLOW}⚠${NC} (HTTP $http_code - Expected for missing data)"
        return 0
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${RED}✗${NC} (HTTP $http_code - Auth failed)"
        echo "$body" | jq -r '.error // .message' 2>/dev/null | head -1
        return 1
    else
        echo -e "${RED}✗${NC} (HTTP $http_code)"
        return 1
    fi
}

# Test routes
test_backend "GET" "/api/sync" "List sync jobs"
test_backend "GET" "/api/admin/analytics" "Admin analytics"
test_backend "GET" "/api/admin/users" "List users"
test_backend "GET" "/api/admin/sync-jobs" "List all sync jobs"

echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"
echo ""
echo "📋 Test Credentials:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo ""
echo "🔑 Token exported as TEST_USER_TOKEN"
echo ""
echo "💡 Use in browser:"
echo "   1. Go to http://localhost:3000"
echo "   2. Sign in with: $TEST_EMAIL / $TEST_PASSWORD"
echo "   3. Test all features through the UI"
echo ""

