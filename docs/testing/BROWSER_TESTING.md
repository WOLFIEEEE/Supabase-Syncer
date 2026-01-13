# Browser-Based Testing Guide

The easiest way to test the frontend-backend integration is through the browser with real authentication.

---

## 🎯 Quick Browser Test (Recommended)

### Step 1: Start All Services

```bash
# Terminal 1: Start backend and Redis
docker-compose up -d backend redis

# Terminal 2: Start frontend
npm run dev
```

### Step 2: Create Test User via Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Visit [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Create User:**
   - Navigate to **Authentication** → **Users**
   - Click **"Add User"** → **"Create new user"**
   - Enter:
     - **Email:** `test@example.com` (or any valid email)
     - **Password:** `TestPassword123!`
     - **Auto Confirm User:** ✅ (check this for immediate access)
   - Click **"Create User"**

3. **Disable Email Confirmation (Optional):**
   - Go to **Authentication** → **Settings**
   - Find **"Enable email confirmations"**
   - **Disable** it (for easier testing)
   - This allows users to sign in immediately without email verification

### Step 3: Test in Browser

1. **Open Frontend:**
   ```
   http://localhost:3000
   ```

2. **Sign In:**
   - Click "Sign In"
   - Use your test credentials:
     - Email: `test@example.com`
     - Password: `TestPassword123!`

3. **Test Features:**
   - ✅ Dashboard loads
   - ✅ Can add connections
   - ✅ Can create sync jobs
   - ✅ Can view sync history
   - ✅ API calls work (check Network tab in DevTools)

---

## 🔍 Verify Integration

### Check Browser DevTools

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Filter by "api"**
4. **Test a feature** (e.g., create a connection)
5. **Verify:**
   - Request goes to `/api/connections/*`
   - Response is successful (200 or 201)
   - Check Response tab to see backend data

### Check Backend Logs

```bash
# Watch backend logs
docker logs -f supabase-syncer-backend

# You should see requests like:
# GET /api/sync
# POST /api/connections/...
```

---

## 🧪 Test Scenarios

### Scenario 1: Add a Connection

1. Sign in to frontend
2. Go to Connections page
3. Click "Add Connection"
4. Fill in:
   - Name: "Test DB"
   - Environment: Development
   - Connection String: `postgresql://user:pass@host:5432/db`
5. Click "Test Connection"
6. **Verify:** Backend receives request and tests connection

### Scenario 2: Create Sync Job

1. Sign in to frontend
2. Go to Sync page
3. Create a new sync job
4. **Verify:** 
   - Frontend proxies request to backend
   - Backend creates job in queue
   - Job appears in sync history

### Scenario 3: View Sync Progress

1. Start a sync job
2. Open sync job details
3. **Verify:**
   - Progress updates in real-time
   - SSE stream connects to backend
   - Logs appear in real-time

---

## 🔐 Get JWT Token from Browser

If you need the JWT token for API testing:

1. **Sign in through browser**
2. **Open DevTools** (F12)
3. **Go to Application/Storage tab**
4. **Find Cookies** → `localhost:3000`
5. **Look for:** `sb-<project-ref>-auth-token`
6. **Copy the token value**

Or use the browser console:

```javascript
// In browser console (after signing in)
const cookies = document.cookie.split(';');
const tokenCookie = cookies.find(c => c.includes('sb-') && c.includes('auth-token'));
const token = tokenCookie?.split('=')[1];
console.log('Token:', token);
```

Then use it in curl:

```bash
export TEST_USER_TOKEN="your_token_from_browser"

curl -X GET "http://localhost:3001/api/sync" \
  -H "X-Backend-Secret: dev-backend-shared-secret-minimum-32-characters-long-for-development-only" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  | jq .
```

---

## 📊 Expected Behavior

### ✅ Working Correctly:

- **Sign in:** Redirects to dashboard
- **API calls:** Return 200/201 with data
- **Backend logs:** Show authenticated requests
- **Network tab:** Shows successful API calls

### ⚠️ Expected (Not Errors):

- **401 on unauthenticated:** Normal, redirects to sign-in
- **400 on missing data:** Normal, validation working
- **404 on non-existent resources:** Normal

### ❌ Actual Errors:

- **500 errors:** Check backend logs
- **CORS errors:** Check backend CORS config
- **Connection refused:** Backend not running

---

## 🐛 Troubleshooting

### Issue: Can't sign in

**Check:**
1. User exists in Supabase Dashboard
2. Email confirmation is disabled (or email is confirmed)
3. Password is correct
4. Supabase URL and key are correct in `.env.local`

### Issue: API calls return 401

**Check:**
1. You're signed in (check browser cookies)
2. Session is valid (not expired)
3. Backend is running
4. `BACKEND_SHARED_SECRET` matches in frontend and backend

### Issue: Backend not receiving requests

**Check:**
1. Backend is running: `docker ps`
2. Backend health: `curl http://localhost:3001/health`
3. Frontend `BACKEND_URL` is correct
4. Check browser Network tab for actual request URL

---

## 💡 Pro Tips

1. **Use Browser DevTools:**
   - Network tab shows all API calls
   - Console shows errors
   - Application tab shows cookies/session

2. **Watch Backend Logs:**
   ```bash
   docker logs -f supabase-syncer-backend
   ```

3. **Test Both:**
   - Browser UI (full flow)
   - Direct API calls (with token from browser)

4. **Create Multiple Users:**
   - Regular user for normal testing
   - Admin user for admin features
   - Different users for multi-user scenarios

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ Can sign in through browser
- ✅ Dashboard loads with user data
- ✅ Can create connections
- ✅ Can create sync jobs
- ✅ Backend logs show authenticated requests
- ✅ Network tab shows successful API calls
- ✅ No CORS errors
- ✅ No 401 errors (when signed in)

---

**Happy Testing! 🎉**

