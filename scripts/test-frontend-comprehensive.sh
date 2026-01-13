#!/bin/bash

# Comprehensive Frontend Testing Script
# Tests all frontend API routes with proper authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
TEST_EMAIL="khushwantcp+test@gmail.com"
TEST_PASSWORD="testsupabase"

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Get token
echo -e "${BLUE}🔐 Getting authentication token...${NC}"
TOKEN_OUTPUT=$(npx tsx scripts/get-test-token.ts --email "$TEST_EMAIL" --password "$TEST_PASSWORD" 2>&1)
TOKEN=$(echo "$TOKEN_OUTPUT" | grep -A 1 "Full Access Token:" | tail -1 | tr -d ' ')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token obtained${NC}"
echo ""

# Get backend secret
BACKEND_SECRET="${BACKEND_SECRET:-${NEXT_PUBLIC_BACKEND_SECRET}}"
if [ -z "$BACKEND_SECRET" ]; then
  echo -e "${YELLOW}⚠️  BACKEND_SECRET not set, some tests may fail${NC}"
fi

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Test function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4
  local expected_status=${5:-200}
  
  echo -e "${BLUE}Testing: ${description}${NC}"
  echo "  ${method} ${endpoint}"
  
  # Build curl command
  CURL_CMD="curl -s -w '\n%{http_code}' -X ${method}"
  
  # Add headers
  CURL_CMD="${CURL_CMD} -H 'Content-Type: application/json'"
  CURL_CMD="${CURL_CMD} -H 'Authorization: Bearer ${TOKEN}'"
  
  if [ -n "$BACKEND_SECRET" ]; then
    CURL_CMD="${CURL_CMD} -H 'X-Backend-Secret: ${BACKEND_SECRET}'"
  fi
  
  # Add data if provided
  if [ -n "$data" ]; then
    CURL_CMD="${CURL_CMD} -d '${data}'"
  fi
  
  CURL_CMD="${CURL_CMD} '${FRONTEND_URL}${endpoint}'"
  
  # Execute and capture response
  RESPONSE=$(eval $CURL_CMD)
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  # Check status
  if [ "$HTTP_CODE" = "$expected_status" ] || [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} (HTTP $HTTP_CODE)"
    PASSED=$((PASSED + 1))
    if [ -n "$BODY" ] && [ "$BODY" != "null" ]; then
      echo "  Response: $(echo "$BODY" | head -c 200)..."
    fi
  else
    echo -e "  ${RED}❌ FAIL${NC} (HTTP $HTTP_CODE, expected $expected_status)"
    echo "  Response: $BODY"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

# Test unauthenticated endpoint
test_unauthenticated() {
  local method=$1
  local endpoint=$2
  local description=$3
  
  echo -e "${BLUE}Testing (unauthenticated): ${description}${NC}"
  echo "  ${method} ${endpoint}"
  
  HTTP_CODE=$(curl -s -w '%{http_code}' -o /dev/null -X ${method} "${FRONTEND_URL}${endpoint}")
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} (HTTP $HTTP_CODE)"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}❌ FAIL${NC} (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Comprehensive Frontend API Testing${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo "Test User: $TEST_EMAIL"
echo ""

# ============================================
# 1. Health & Status Checks
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}1. Health & Status Checks${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_unauthenticated "GET" "/api/health" "Health check"
test_unauthenticated "GET" "/api/status" "Status check"
test_unauthenticated "GET" "/api/version" "Version check"

# ============================================
# 2. Authentication Tests
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}2. Authentication Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "GET" "/api/sessions" "Get user sessions"

# ============================================
# 3. Connections API
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}3. Connections API${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "GET" "/api/connections" "List connections"

# Test connection operations (will fail without actual connection ID, but tests routing)
CONNECTION_ID="test-connection-id"
test_endpoint "GET" "/api/connections/${CONNECTION_ID}" "Get connection" "" "404"
test_endpoint "POST" "/api/connections/${CONNECTION_ID}/test" "Test connection" '{"encryptedUrl":"test"}' "400"
test_endpoint "GET" "/api/connections/${CONNECTION_ID}/schema" "Get connection schema" "" "404"
test_endpoint "POST" "/api/connections/${CONNECTION_ID}/execute" "Execute SQL" '{"encryptedUrl":"test","sql":"SELECT 1"}' "400"
test_endpoint "GET" "/api/connections/${CONNECTION_ID}/keep-alive" "Get keep-alive settings" "" "404"

# ============================================
# 4. Sync API
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}4. Sync API${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "GET" "/api/sync" "List sync jobs"
test_endpoint "POST" "/api/sync" "Create sync job" '{"name":"Test Sync","sourceConnectionId":"test","targetConnectionId":"test","tables":[]}' "400"
test_endpoint "POST" "/api/sync/validate" "Validate schema" '{"sourceEncryptedUrl":"test","targetEncryptedUrl":"test"}' "400"
test_endpoint "POST" "/api/sync/generate-migration" "Generate migration" '{"sourceEncryptedUrl":"test","targetEncryptedUrl":"test"}' "400"

# Test sync job operations
SYNC_ID="test-sync-id"
test_endpoint "GET" "/api/sync/${SYNC_ID}" "Get sync job" "" "404"
test_endpoint "POST" "/api/sync/${SYNC_ID}/start" "Start sync job" '{"sourceEncryptedUrl":"test","targetEncryptedUrl":"test"}' "404"
test_endpoint "POST" "/api/sync/${SYNC_ID}/pause" "Pause sync job" "" "404"
test_endpoint "POST" "/api/sync/${SYNC_ID}/stop" "Stop sync job" "" "404"
test_endpoint "GET" "/api/sync/${SYNC_ID}/stream" "Stream sync progress" "" "404"

# ============================================
# 5. Explorer API
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}5. Explorer API${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

EXPLORER_CONNECTION_ID="test-connection"
test_endpoint "GET" "/api/explorer/${EXPLORER_CONNECTION_ID}/tables" "List tables" "" "404"
test_endpoint "GET" "/api/explorer/${EXPLORER_CONNECTION_ID}/test-table/rows" "Get table rows" "" "404"

# ============================================
# 6. Admin API
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}6. Admin API${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "GET" "/api/admin/analytics" "Get admin analytics"
test_endpoint "GET" "/api/admin/users" "List users"
test_endpoint "GET" "/api/admin/sync-jobs" "List all sync jobs"
test_endpoint "GET" "/api/admin/security-events" "Get security events"
test_endpoint "GET" "/api/admin/export" "Export data"

# ============================================
# 7. Backend Direct Health Check
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}7. Backend Direct Health Check${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}Testing: Backend health check${NC}"
echo "  GET ${BACKEND_URL}/health"
BACKEND_HEALTH=$(curl -s "${BACKEND_URL}/health" || echo "ERROR")
if echo "$BACKEND_HEALTH" | grep -q "healthy\|status"; then
  echo -e "  ${GREEN}✅ PASS${NC}"
  echo "  Response: $(echo "$BACKEND_HEALTH" | head -c 200)..."
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}❌ FAIL${NC}"
  echo "  Response: $BACKEND_HEALTH"
  FAILED=$((FAILED + 1))
fi
echo ""

# ============================================
# Summary
# ============================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Test Summary${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo -e "${YELLOW}⏭️  Skipped: ${SKIPPED}${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$((PASSED * 100 / TOTAL))
  echo -e "Success Rate: ${SUCCESS_RATE}%"
fi

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed${NC}"
  exit 1
fi

