# Quick Testing Guide

Fast way to test the frontend-backend integration with authentication.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start Services

```bash
# Start backend and Redis in Docker
docker-compose up -d backend redis

# Start frontend (in another terminal)
npm run dev
```

### Step 2: Create Test User & Get Token

**Option A: Automated Script**
```bash
./scripts/test-with-auth.sh
```

**Option B: Manual**
```bash
# Create test user
npx tsx scripts/create-test-user.ts --email test@test.com --password Test123!

# Get token
export TEST_USER_TOKEN=$(npx tsx scripts/get-test-token.ts --email test@test.com --password Test123! 2>&1 | tail -1)
```

### Step 3: Test Routes

```bash
# Test backend directly
curl -X GET "http://localhost:3001/api/sync" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  | jq .

# Or test in browser
# 1. Go to http://localhost:3000
# 2. Sign in with your test credentials
# 3. Navigate to dashboard and test features
```

---

## 🎯 Browser Testing (Recommended)

1. **Open browser:** `http://localhost:3000`
2. **Sign up/Sign in** with test credentials
3. **Test features:**
   - Add a connection
   - Create a sync job
   - View sync history
   - Check admin dashboard (if admin user)

---

## 🔧 Supabase Dashboard Method

### Create User via Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Enter:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - **Disable "Auto Confirm User"** (or enable if you want immediate access)
6. Click **"Create User"**
7. Copy the user ID for reference

### Get Token via Dashboard:

1. In Supabase Dashboard → **Authentication** → **Users**
2. Find your test user
3. Click on the user
4. Go to **"Access Tokens"** tab
5. Copy the JWT token

Or use the script:
```bash
npx tsx scripts/get-test-token.ts --email test@example.com --password TestPassword123!
```

---

## 🧪 Test Scenarios

### Scenario 1: Test Sync Job Creation

```bash
# 1. Get token
export TEST_USER_TOKEN=$(npx tsx scripts/get-test-token.ts 2>&1 | tail -1)

# 2. First, create connections (you need connection IDs)
# Then create sync job:
curl -X POST "http://localhost:3001/api/sync" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceConnectionId": "your-source-id",
    "targetConnectionId": "your-target-id",
    "direction": "one_way",
    "tables": [{"tableName": "users", "enabled": true}]
  }' | jq .
```

### Scenario 2: Test Connection

```bash
# Test a database connection
curl -X POST "http://localhost:3001/api/connections/test-id/test" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedUrl": "your_encrypted_url_here"
  }' | jq .
```

---

## 📝 Environment Setup

Make sure `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
BACKEND_SHARED_SECRET=dev-backend-shared-secret-minimum-32-characters-long-for-development-only
ENCRYPTION_KEY=your_32_character_key
```

---

## ✅ Verification Checklist

- [ ] Backend running: `curl http://localhost:3001/health`
- [ ] Frontend running: `curl http://localhost:3000`
- [ ] Test user created
- [ ] Token obtained successfully
- [ ] Backend accepts token (returns 200 or 400, not 401)
- [ ] Browser sign-in works
- [ ] Can access dashboard after sign-in

---

## 🐛 Common Issues

**"Invalid or expired token"**
- Get a fresh token: `npx tsx scripts/get-test-token.ts`
- Tokens expire after 1 hour

**"User not found"**
- Create user first: `npx tsx scripts/create-test-user.ts`
- Or create via Supabase Dashboard

**"Email confirmation required"**
- Disable in Supabase Dashboard → Authentication → Settings
- Or use service role key for testing

**Frontend redirects to sign-in**
- This is normal for unauthenticated requests
- Sign in through browser to get session cookies

---

**Ready to test! 🎉**

