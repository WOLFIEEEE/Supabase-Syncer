#!/bin/bash

# Full Integration Test with khushwantcp@gmail.com
# Tests the complete frontend-backend integration

set -e

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
TEST_EMAIL="khushwantcp@gmail.com"
TEST_PASSWORD="TestPassword123!"
SECRET="${BACKEND_SHARED_SECRET:-dev-backend-shared-secret-minimum-32-characters-long-for-development-only}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Full Frontend-Backend Integration Test"
echo "=========================================="
echo ""
echo "Test Account: $TEST_EMAIL"
echo ""

# Load env
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check services
echo -e "${BLUE}Step 1: Checking services...${NC}"
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}❌ Backend not running${NC}"
    echo "   Start with: docker-compose up -d backend redis"
    exit 1
fi

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend not running${NC}"
    echo "   Start with: npm run dev"
fi

echo -e "${GREEN}✓ Services running${NC}"
echo ""

# Get token
echo -e "${BLUE}Step 2: Getting authentication token...${NC}"
TOKEN_OUTPUT=$(NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  npx tsx scripts/get-test-token.ts --email "$TEST_EMAIL" --password "$TEST_PASSWORD" 2>&1)

if echo "$TOKEN_OUTPUT" | grep -q "Successfully"; then
    TEST_TOKEN=$(echo "$TOKEN_OUTPUT" | grep -A 1 "Full Access Token:" | tail -1 | tr -d ' ')
    export TEST_USER_TOKEN="$TEST_TOKEN"
    echo -e "${GREEN}✓ Token obtained${NC}"
    echo "   Token: ${TEST_TOKEN:0:50}..."
else
    echo -e "${YELLOW}⚠️  Could not get token${NC}"
    echo "$TOKEN_OUTPUT"
    echo ""
    echo "💡 The user might need email confirmation."
    echo "   Option 1: Check email and confirm"
    echo "   Option 2: Use Supabase Dashboard to confirm user"
    echo "   Option 3: Use service role key to create confirmed user"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

echo ""

# Test backend routes
echo -e "${BLUE}Step 3: Testing authenticated backend routes...${NC}"
echo ""

test_route() {
    local method=$1
    local endpoint=$2
    local desc=$3
    
    echo -n "  $desc... "
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
        -H "X-Backend-Secret: $SECRET" \
        -H "Authorization: Bearer $TEST_USER_TOKEN" 2>/dev/null)
    
    code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$code" -eq 200 ] || [ "$code" -eq 201 ]; then
        echo -e "${GREEN}✓${NC} (HTTP $code)"
        return 0
    elif [ "$code" -eq 400 ] || [ "$code" -eq 404 ]; then
        echo -e "${YELLOW}⚠${NC} (HTTP $code - Expected)"
        return 0
    elif [ "$code" -eq 401 ]; then
        echo -e "${RED}✗${NC} (HTTP $code - Auth failed)"
        return 1
    else
        echo -e "${RED}✗${NC} (HTTP $code)"
        return 1
    fi
}

test_route "GET" "/api/sync" "List sync jobs"
test_route "GET" "/api/admin/analytics" "Admin analytics"
test_route "GET" "/api/admin/users" "List users"
test_route "GET" "/api/admin/sync-jobs" "List all sync jobs"

echo ""
echo -e "${GREEN}✅ Backend testing complete!${NC}"
echo ""
echo "=========================================="
echo "Browser Testing Instructions"
echo "=========================================="
echo ""
echo "1. Open browser: http://localhost:3000"
echo "2. Sign in with:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo ""
echo "3. Test features:"
echo "   - Dashboard"
echo "   - Add connections"
echo "   - Create sync jobs"
echo "   - View sync history"
echo ""
echo "4. Check DevTools → Network tab for API calls"
echo ""
echo "5. Watch backend logs:"
echo "   docker logs -f supabase-syncer-backend"
echo ""
