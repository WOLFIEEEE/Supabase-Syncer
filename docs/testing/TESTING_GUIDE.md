# Frontend-Backend Testing Guide

Complete guide for testing the frontend-backend integration with authentication.

---

## 🚀 Quick Start

### 1. Create a Test User

```bash
# Create a test user in Supabase
npx tsx scripts/create-test-user.ts

# Or with custom credentials
npx tsx scripts/create-test-user.ts --email test@example.com --password MyPassword123!
```

**Output:**
```
✅ Test user created successfully!
📋 User Details:
   User ID: abc123...
   Email: test@example.com
   Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔑 To use this token for testing:
   export TEST_USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Get a Test Token

If you already have a user, get a fresh token:

```bash
npx tsx scripts/get-test-token.ts

# Or with custom credentials
npx tsx scripts/get-test-token.ts --email test@example.com --password MyPassword123!
```

### 3. Test with Authentication

```bash
# Export the token
export TEST_USER_TOKEN="your_token_here"

# Run authenticated tests
./test-authenticated-routes.sh
```

---

## 📋 Testing Methods

### Method 1: Browser Testing (Recommended)

1. **Start the frontend:**
   ```bash
   npm run dev
   ```

2. **Start the backend (Docker):**
   ```bash
   docker-compose up -d backend redis
   ```

3. **Open browser:**
   - Navigate to `http://localhost:3000`
   - Sign up or sign in with your test user
   - Test all features through the UI

4. **Check browser console:**
   - Open DevTools (F12)
   - Check Network tab for API calls
   - Verify requests are going to backend

### Method 2: Direct Backend Testing with Token

Test backend directly with a JWT token:

```bash
# Get token
export TEST_USER_TOKEN=$(npx tsx scripts/get-test-token.ts 2>&1 | grep "Bearer" | awk '{print $NF}')

# Test backend endpoint
curl -X GET "http://localhost:3001/api/sync" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  | jq .
```

### Method 3: Frontend Proxy Testing

Test through frontend proxy routes:

```bash
# First, sign in through browser to get session cookies
# Then use the session cookie in curl:

curl -X GET "http://localhost:3000/api/sync" \
  -H "Cookie: sb-access-token=$TEST_USER_TOKEN" \
  | jq .
```

**Note:** Frontend uses cookie-based authentication, so you need to sign in through the browser first to get valid session cookies.

---

## 🔧 Configuration for Testing

### Environment Variables

Make sure these are set in `.env.local`:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend (for testing)
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
BACKEND_SHARED_SECRET=dev-backend-shared-secret-minimum-32-characters-long-for-development-only

# Encryption
ENCRYPTION_KEY=your_32_character_key_here
```

### Supabase Configuration

1. **Disable Email Confirmation (for easier testing):**
   - Go to Supabase Dashboard → Authentication → Settings
   - Disable "Enable email confirmations"
   - This allows immediate user creation without email verification

2. **Create Test Users via Dashboard:**
   - Go to Authentication → Users
   - Click "Add User"
   - Enter email and password
   - Copy the user ID for testing

---

## 🧪 Test Scenarios

### Scenario 1: Create and List Sync Jobs

```bash
# 1. Get token
export TEST_USER_TOKEN=$(npx tsx scripts/get-test-token.ts 2>&1 | grep "Full Access Token:" -A 1 | tail -1)

# 2. Create a sync job (requires connections first)
curl -X POST "http://localhost:3001/api/sync" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceConnectionId": "source-id",
    "targetConnectionId": "target-id",
    "direction": "one_way",
    "tables": [{"tableName": "users", "enabled": true}]
  }' | jq .

# 3. List sync jobs
curl -X GET "http://localhost:3001/api/sync" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" | jq .
```

### Scenario 2: Test Connection

```bash
# Test a database connection
curl -X POST "http://localhost:3001/api/connections/test-id/test" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedUrl": "encrypted_connection_string_here"
  }' | jq .
```

### Scenario 3: Admin Routes

```bash
# Get admin analytics
curl -X GET "http://localhost:3001/api/admin/analytics" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" | jq .

# List all users (admin only)
curl -X GET "http://localhost:3001/api/admin/users" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" | jq .
```

---

## 🐛 Troubleshooting

### Issue: "Invalid or expired token"

**Solution:**
1. Get a fresh token: `npx tsx scripts/get-test-token.ts`
2. Make sure the token is not expired (Supabase tokens expire after 1 hour)
3. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### Issue: "User not found" or "Authentication required"

**Solution:**
1. Create the user first: `npx tsx scripts/create-test-user.ts`
2. Make sure email confirmation is disabled in Supabase (if testing)
3. Verify the user exists in Supabase Dashboard → Authentication → Users

### Issue: Frontend redirects to sign-in

**Solution:**
- This is expected behavior for unauthenticated requests
- Sign in through the browser first to get session cookies
- Or test backend directly with JWT tokens

### Issue: "Missing X-Backend-Secret header"

**Solution:**
- Make sure `BACKEND_SHARED_SECRET` is set in backend `.env`
- Use the same secret in your test requests
- Check `server/.env` file

---

## 🔐 Using Service Role Key (Advanced)

For testing admin features or bypassing RLS:

1. **Get Service Role Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy "service_role" key (keep this secret!)

2. **Create users without email confirmation:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_key \
   npx tsx scripts/create-test-user.ts --service service
   ```

3. **Use in backend for admin operations:**
   - Set `SUPABASE_SERVICE_ROLE_KEY` in backend `.env`
   - Backend can now bypass RLS for admin operations

---

## 📊 Testing Checklist

- [ ] Test user created successfully
- [ ] Can sign in and get JWT token
- [ ] Backend accepts token and returns data
- [ ] Frontend proxy routes work with browser session
- [ ] Sync job creation works
- [ ] Connection testing works
- [ ] Admin routes work (if admin user)
- [ ] Error handling works (401 for invalid tokens)
- [ ] Rate limiting works
- [ ] Health checks pass

---

## 🎯 Example Test Flow

```bash
# 1. Start services
docker-compose up -d backend redis
npm run dev

# 2. Create test user
npx tsx scripts/create-test-user.ts --email test@example.com --password Test123!

# 3. Get token
export TEST_USER_TOKEN=$(npx tsx scripts/get-test-token.ts 2>&1 | tail -1)

# 4. Test backend
curl -X GET "http://localhost:3001/api/sync" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN"

# 5. Test in browser
# Open http://localhost:3000
# Sign in with test@example.com / Test123!
# Navigate to dashboard and test features
```

---

## 📝 Notes

- **Token Expiration:** Supabase JWT tokens expire after 1 hour. Get a fresh token if testing fails.
- **Email Confirmation:** Disable in Supabase Dashboard for easier testing
- **RLS Policies:** Make sure Row Level Security policies allow your test user to access data
- **Session Cookies:** Frontend uses cookie-based auth, so browser testing is most reliable
- **Service Role:** Use service role key only for admin testing, never in production frontend code

---

**Happy Testing! 🚀**

