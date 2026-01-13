# Test Page Documentation

## Overview

A comprehensive password-protected test page that validates all frontend and backend integration scenarios.

## Access

**URL:** http://localhost:3000/test

**Password:** `test123` (default, configurable via `NEXT_PUBLIC_TEST_PAGE_PASSWORD`)

## Features

### Password Protection
- Simple password-based access control
- Session-based authentication (stored in sessionStorage)
- Lock/unlock functionality

### Test Categories

1. **Health & Status Checks**
   - Frontend health endpoint
   - Frontend status endpoint
   - Backend health check

2. **Authentication**
   - CSRF token generation
   - User sessions (requires auth)

3. **Connections API**
   - List connections
   - Test connection endpoint
   - Get connection schema
   - Execute SQL endpoint

4. **Sync Operations**
   - List sync jobs
   - Get sync job
   - Create sync job
   - Validate schema
   - Generate migration
   - Start sync job
   - Pause sync job
   - Stop sync job

5. **Database Explorer**
   - Explorer tables endpoint
   - Get table rows

6. **Admin API**
   - Admin analytics
   - Admin users list
   - Admin sync jobs list
   - Admin security events

7. **Backend Integration**
   - Backend health
   - Backend ready check
   - Redis connection
   - Queue status

8. **SSE Streaming**
   - SSE stream endpoint test

## Test Results

Each test shows:
- ✅ **Passed** - Test succeeded
- ❌ **Failed** - Test failed
- ⏭️ **Skipped** - Test skipped (expected behavior, e.g., requires authentication)
- ⏳ **Pending** - Test not run yet

## Usage

1. Navigate to http://localhost:3000/test
2. Enter password: `test123`
3. Click "Run All Tests"
4. Review results for each category
5. Expand test details to see full response data

## Configuration

Set environment variable in `.env.local`:

```bash
NEXT_PUBLIC_TEST_PAGE_PASSWORD=your-secure-password
```

## Security Note

⚠️ **Important:** This test page is for development/testing only. Do not deploy with a weak password in production. Consider:
- Using a strong password
- Restricting access via IP/network
- Removing the test page in production builds

## Test Scenarios Covered

### ✅ Working Scenarios
- Health endpoints (frontend & backend)
- Backend service status
- Redis connectivity
- Queue readiness

### ⏭️ Expected Skipped (Requires Auth)
- User sessions
- Connections list
- Sync jobs list
- Admin endpoints
- Explorer endpoints

### 🔒 CSRF Protected
- POST endpoints (create, update, delete operations)
- SQL execution
- Sync job management

## Troubleshooting

### Tests Failing
1. Ensure Docker containers are running: `docker-compose ps`
2. Check backend is accessible: `curl http://localhost:3001/health`
3. Verify frontend is running: `curl http://localhost:3000/api/health`

### Password Not Working
- Check `NEXT_PUBLIC_TEST_PAGE_PASSWORD` in `.env.local`
- Default password is `test123`
- Clear sessionStorage and try again

### Backend Tests Failing
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check backend logs: `docker-compose logs backend`
- Ensure Redis is running: `docker-compose ps redis`

