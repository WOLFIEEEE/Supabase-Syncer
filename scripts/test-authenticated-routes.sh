#!/bin/bash

# Authenticated Route Testing Script
# Tests frontend-backend integration with real authentication

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
SECRET="${BACKEND_SHARED_SECRET:-dev-backend-shared-secret-minimum-32-characters-long-for-development-only}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Authenticated Frontend-Backend Testing"
echo "=========================================="
echo ""

# Check if test token is set
if [ -z "$TEST_USER_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  TEST_USER_TOKEN not set${NC}"
    echo ""
    echo "To get a test token:"
    echo "  1. Create a test user:"
    echo "     npx tsx scripts/create-test-user.ts"
    echo ""
    echo "  2. Get the token:"
    echo "     npx tsx scripts/get-test-token.ts"
    echo ""
    echo "  3. Export the token:"
    echo "     export TEST_USER_TOKEN=\"your_token_here\""
    echo ""
    echo "  4. Run this script again"
    echo ""
    exit 1
fi

echo -e "${BLUE}Using test token: ${TEST_USER_TOKEN:0:50}...${NC}"
echo ""

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing $description... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$FRONTEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Cookie: sb-access-token=$TEST_USER_TOKEN" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$FRONTEND_URL$endpoint" \
            -H "Cookie: sb-access-token=$TEST_USER_TOKEN" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}⚠ Auth Issue${NC} (HTTP $http_code)"
        echo "$body" | jq -r '.error // .message // "N/A"' 2>/dev/null | head -1
        return 0
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "${YELLOW}⚠ Expected${NC} (HTTP $http_code)"
        echo "$body" | jq -r '.error // .message // "N/A"' 2>/dev/null | head -1
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "$body" | head -3
        return 1
    fi
}

# Test direct backend with token
test_backend_direct() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing $description (direct backend)... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-Backend-Secret: $SECRET" \
            -H "Authorization: Bearer $TEST_USER_TOKEN" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
            -H "X-Backend-Secret: $SECRET" \
            -H "Authorization: Bearer $TEST_USER_TOKEN" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}⚠ Auth Issue${NC} (HTTP $http_code)"
        echo "$body" | jq -r '.error // .message // "N/A"' 2>/dev/null | head -1
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "$body" | head -3
        return 1
    fi
}

echo -e "${BLUE}=== Testing Direct Backend Access ===${NC}"
echo ""

# Test backend directly with token
test_backend_direct "GET" "/api/sync" "List sync jobs"
test_backend_direct "GET" "/api/admin/analytics" "Admin analytics"
test_backend_direct "GET" "/api/admin/users" "List users"

echo ""
echo -e "${BLUE}=== Testing Frontend Proxy Routes ===${NC}"
echo "Note: Frontend routes require browser session cookies, not just tokens"
echo ""

# Test frontend routes (these might still redirect if using cookie-based auth)
test_endpoint "GET" "/api/sync" "List sync jobs (proxy)"
test_endpoint "GET" "/api/admin/analytics" "Admin analytics (proxy)"

echo ""
echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "💡 Note: Frontend routes use cookie-based authentication."
echo "   For full testing, use a browser with a logged-in session."
echo ""

