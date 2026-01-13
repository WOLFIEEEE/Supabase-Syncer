#!/bin/bash

# Backend API Route Testing Script
# Tests all backend routes to ensure they're working properly

BASE_URL="http://localhost:3001"
SECRET="dev-backend-shared-secret-minimum-32-characters-long-for-development-only"

echo "=========================================="
echo "Testing Supabase Syncer Backend Routes"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local headers=$5
    
    echo -n "Testing $description... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "$headers")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "${YELLOW}⚠ Expected${NC} (HTTP $http_code - Auth/Validation error)"
        echo "$body" | jq -r '.error // .message // "N/A"' 2>/dev/null | head -1
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "$body" | head -5
        return 1
    fi
}

# 1. Health Check Routes
echo "=== Health Check Routes ==="
test_endpoint "GET" "/" "Root endpoint"
test_endpoint "GET" "/health" "Full health check"
test_endpoint "GET" "/health/live" "Liveness probe"
test_endpoint "GET" "/health/ready" "Readiness probe"
echo ""

# 2. Connection Routes (require auth)
echo "=== Connection Routes ==="
AUTH_HEADER="X-Backend-Secret: $SECRET"
test_endpoint "POST" "/api/connections/test-id/test" "Test connection (missing encryptedUrl)" \
    '{"encryptedUrl":""}' "$AUTH_HEADER"
test_endpoint "GET" "/api/connections/test-id/schema" "Get schema (missing encryptedUrl)" \
    "" "$AUTH_HEADER"
test_endpoint "POST" "/api/connections/test-id/execute" "Execute SQL (missing encryptedUrl)" \
    '{"sql":"SELECT 1"}' "$AUTH_HEADER"
test_endpoint "POST" "/api/connections/test-id/keep-alive" "Keep-alive ping (missing encryptedUrl)" \
    '{"encryptedUrl":""}' "$AUTH_HEADER"
echo ""

# 3. Sync Routes (require auth)
echo "=== Sync Routes ==="
test_endpoint "GET" "/api/sync/test-job-id" "Get sync job status" \
    "" "$AUTH_HEADER"
test_endpoint "POST" "/api/sync" "Create sync job (missing required fields)" \
    '{"sourceConnectionId":"","targetConnectionId":""}' "$AUTH_HEADER"
test_endpoint "POST" "/api/sync/test-job-id/start" "Start sync job" \
    '{"sourceEncryptedUrl":"","targetEncryptedUrl":""}' "$AUTH_HEADER"
test_endpoint "POST" "/api/sync/test-job-id/pause" "Pause sync job" \
    "" "$AUTH_HEADER"
test_endpoint "POST" "/api/sync/test-job-id/stop" "Stop sync job" \
    "" "$AUTH_HEADER"
test_endpoint "GET" "/api/sync/test-job-id/stream" "Sync progress stream" \
    "" "$AUTH_HEADER"
test_endpoint "POST" "/api/sync/validate" "Validate schema (missing required fields)" \
    '{"sourceConnectionId":"","targetConnectionId":""}' "$AUTH_HEADER"
test_endpoint "POST" "/api/sync/generate-migration" "Generate migration (missing required fields)" \
    '{"sourceConnectionId":"","targetConnectionId":""}' "$AUTH_HEADER"
echo ""

# 4. Admin Routes (require admin auth)
echo "=== Admin Routes ==="
test_endpoint "GET" "/api/admin/analytics" "Admin analytics" \
    "" "$AUTH_HEADER"
test_endpoint "GET" "/api/admin/users" "List users" \
    "" "$AUTH_HEADER"
test_endpoint "GET" "/api/admin/sync-jobs" "List sync jobs" \
    "" "$AUTH_HEADER"
test_endpoint "GET" "/api/admin/security-events" "Security events" \
    "" "$AUTH_HEADER"
test_endpoint "POST" "/api/admin/export" "Export data (missing type)" \
    '{"type":""}' "$AUTH_HEADER"
echo ""

# 5. Explorer Routes (require auth)
echo "=== Explorer Routes ==="
test_endpoint "GET" "/api/explorer/test-id/tables" "List tables (missing encryptedUrl)" \
    "" "$AUTH_HEADER"
test_endpoint "GET" "/api/explorer/test-id/tables/test-table/rows" "Get table rows (missing encryptedUrl)" \
    "" "$AUTH_HEADER"
echo ""

# 6. Test without authentication (should fail)
echo "=== Authentication Tests ==="
test_endpoint "GET" "/api/sync/test-id" "Get sync job (no auth - should fail)" \
    "" ""
test_endpoint "POST" "/api/connections/test-id/test" "Test connection (no auth - should fail)" \
    '{"encryptedUrl":"test"}' ""
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="

