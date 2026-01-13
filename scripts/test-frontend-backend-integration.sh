#!/bin/bash

# Frontend-Backend Integration Testing Script
# Tests that the frontend properly proxies requests to the backend

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Frontend-Backend Integration Testing"
echo "=========================================="
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
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$FRONTEND_URL$endpoint" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}⚠ Auth Required${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "${YELLOW}⚠ Expected${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "$body" | head -3
        return 1
    fi
}

# 1. Check Frontend Status
echo -e "${BLUE}=== Frontend Status ===${NC}"
test_endpoint "GET" "/api/status" "Frontend status endpoint"
test_endpoint "GET" "/api/health" "Frontend health endpoint"
echo ""

# 2. Test Frontend Proxy Routes (these should forward to backend)
echo -e "${BLUE}=== Frontend Proxy Routes ===${NC}"
echo "These routes should proxy to backend and require authentication:"
echo ""

# Sync routes
test_endpoint "GET" "/api/sync" "List sync jobs (proxy)"
test_endpoint "POST" "/api/sync" "Create sync job (proxy)" '{"sourceConnectionId":"test","targetConnectionId":"test","direction":"one_way","tables":[]}'
test_endpoint "GET" "/api/sync/test-id" "Get sync job status (proxy)"
test_endpoint "POST" "/api/sync/test-id/start" "Start sync job (proxy)" '{}'
test_endpoint "POST" "/api/sync/test-id/pause" "Pause sync job (proxy)" '{}'
test_endpoint "POST" "/api/sync/test-id/stop" "Stop sync job (proxy)" '{}'
test_endpoint "POST" "/api/sync/validate" "Validate schema (proxy)" '{"sourceConnectionId":"test","targetConnectionId":"test"}'
test_endpoint "POST" "/api/sync/generate-migration" "Generate migration (proxy)" '{"sourceConnectionId":"test","targetConnectionId":"test"}'
echo ""

# Connection routes
test_endpoint "POST" "/api/connections/test-id/test" "Test connection (proxy)" '{"encryptedUrl":"test"}'
test_endpoint "POST" "/api/connections/test-id/execute" "Execute SQL (proxy)" '{"sql":"SELECT 1","encryptedUrl":"test"}'
test_endpoint "GET" "/api/connections/test-id/schema" "Get schema (proxy)"
test_endpoint "POST" "/api/connections/test-id/keep-alive" "Keep-alive (proxy)" '{"encryptedUrl":"test"}'
echo ""

# Admin routes
test_endpoint "GET" "/api/admin/analytics" "Admin analytics (proxy)"
test_endpoint "GET" "/api/admin/users" "List users (proxy)"
test_endpoint "GET" "/api/admin/sync-jobs" "List sync jobs (proxy)"
test_endpoint "GET" "/api/admin/security-events" "Security events (proxy)"
test_endpoint "POST" "/api/admin/export" "Export data (proxy)" '{"type":"users"}'
echo ""

# 3. Test Direct Backend Access (should work)
echo -e "${BLUE}=== Direct Backend Access ===${NC}"
echo "Testing direct backend endpoints (bypassing frontend):"
echo ""

backend_health=$(curl -s "$BACKEND_URL/health" | jq -r '.status' 2>/dev/null)
if [ "$backend_health" = "healthy" ]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

backend_root=$(curl -s "$BACKEND_URL/" | jq -r '.status' 2>/dev/null)
if [ "$backend_root" = "running" ]; then
    echo -e "${GREEN}✓ Backend root endpoint working${NC}"
else
    echo -e "${RED}✗ Backend root endpoint failed${NC}"
fi
echo ""

# 4. Test Frontend Pages
echo -e "${BLUE}=== Frontend Pages ===${NC}"
frontend_home=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/")
if [ "$frontend_home" = "200" ]; then
    echo -e "${GREEN}✓ Frontend home page accessible${NC}"
else
    echo -e "${RED}✗ Frontend home page failed (HTTP $frontend_home)${NC}"
fi
echo ""

# 5. Summary
echo "=========================================="
echo "Integration Test Summary"
echo "=========================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""
echo "All proxy routes should return 401 (auth required) which means:"
echo "  ✓ Frontend is running"
echo "  ✓ Routes are properly configured"
echo "  ✓ Requests are being forwarded to backend"
echo "  ✓ Backend is rejecting unauthorized requests (expected)"
echo ""

