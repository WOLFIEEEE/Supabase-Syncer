# Domain Setup Guide - suparbase.com

## Current Status
- **App URL**: http://72.61.229.220:3000/
- **Target Domain**: suparbase.com
- **Coolify Server IP**: 72.61.229.220

## Step 1: DNS Configuration

### Option A: Root Domain (suparbase.com)

In your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.), create:

**A Record:**
```
Type: A
Name: @ (or leave blank for root domain)
Value: 72.61.229.220
TTL: 3600 (or Auto)
```

**Optional - WWW Subdomain:**
```
Type: CNAME
Name: www
Value: suparbase.com
TTL: 3600
```

### Option B: Subdomain (app.suparbase.com)

If you prefer a subdomain:

**A Record:**
```
Type: A
Name: app
Value: 72.61.229.220
TTL: 3600
```

## Step 2: Add Domain in Coolify

1. **Open Coolify Dashboard**
   - Navigate to your application
   - Click on the application name to open detail page

2. **Find Domains Section**
   - Scroll down to "Domains" section
   - If not visible, make sure you're on the application detail page (not project list)

3. **Add Custom Domain**
   - Click **"+ Add Domain"** or **"Add Custom Domain"** button
   - Enter: `suparbase.com` (without https://)
   - Click **Save** or **Add**

4. **Wait for SSL Certificate**
   - Coolify will automatically request SSL from Let's Encrypt
   - Takes 1-5 minutes
   - Check logs for SSL status
   - Green lock icon appears when ready

## Step 3: Update Environment Variables in Coolify

1. **Go to Environment Variables** in your Coolify app settings

2. **Update or Add:**
   ```env
   NEXT_PUBLIC_APP_URL=https://suparbase.com
   ```

3. **Important**: 
   - Use `https://` (not http://)
   - Must match exactly the domain you added in Coolify
   - This is critical for OAuth callbacks

4. **Redeploy** (if needed):
   - Coolify may auto-redeploy when env vars change
   - Or manually trigger a redeploy

## Step 4: Update Supabase Redirect URLs

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication Settings**
   - Go to **Authentication** → **URL Configuration**

3. **Update URLs:**
   - **Site URL**: `https://suparbase.com`
   - **Redirect URLs**: Add `https://suparbase.com/**`
   - Click **Save**

4. **Verify Additional Redirect URLs** (if any):
   - Check if you have any other redirect URLs configured
   - Make sure they match your new domain

## Step 5: Verify DNS Propagation

Before proceeding, verify DNS is working:

```bash
# Check A record
nslookup suparbase.com

# Or use dig
dig suparbase.com

# Should return: 72.61.229.220
```

**Wait Time**: DNS propagation can take 5 minutes to 24 hours, but usually 5-15 minutes.

## Step 6: Test Your Domain

1. **Wait for DNS Propagation** (5-15 minutes)

2. **Check SSL Certificate**:
   - Visit: https://suparbase.com
   - Should show green lock (HTTPS working)
   - If not, wait a few more minutes for SSL to generate

3. **Test Health Endpoint**:
   ```bash
   curl https://suparbase.com/api/status
   ```
   Should return: `{"status":"ok",...}`

4. **Test Full Application**:
   - Visit: https://suparbase.com
   - Should load your landing page
   - Try signing up/logging in
   - Verify OAuth redirects work

## Step 7: Update Any Hardcoded URLs

If you have any hardcoded references to the IP address or old domain:

1. **Check Environment Variables**:
   - Ensure all `NEXT_PUBLIC_*` variables use `https://suparbase.com`

2. **Check Application Code**:
   - Search for any hardcoded URLs
   - Replace with environment variables

## Troubleshooting

### DNS Not Resolving

**Check DNS:**
```bash
nslookup suparbase.com
# Should return: 72.61.229.220
```

**If not working:**
- Verify A record is correct in DNS provider
- Wait longer for propagation (up to 24 hours)
- Check DNS provider's propagation status

### SSL Certificate Fails

**Common Issues:**
- Port 80 not open on server (required for Let's Encrypt)
- DNS not fully propagated
- Too many certificate requests (rate limit)

**Solutions:**
- Ensure port 80 is accessible
- Wait for DNS to fully propagate
- Check Coolify logs for specific error

### Cloudflare Users

If using Cloudflare:
1. **During SSL Setup**: Disable proxy (gray cloud, not orange)
2. **After SSL Works**: You can re-enable proxy (orange cloud)
3. **SSL Mode**: Set to "Full" or "Full (strict)" in Cloudflare

### Domain Not Accessible

**Check:**
1. DNS is resolving correctly
2. SSL certificate is issued (green lock)
3. Coolify shows domain as active
4. Application is running (check logs)
5. Environment variables are correct

### OAuth Not Working

**Verify:**
1. `NEXT_PUBLIC_APP_URL` is set to `https://suparbase.com`
2. Supabase redirect URLs include `https://suparbase.com/**`
3. Application has been redeployed after env var changes
4. Clear browser cookies and try again

## Quick Checklist

- [ ] DNS A record created: `@ → 72.61.229.220`
- [ ] Domain added in Coolify: `suparbase.com`
- [ ] SSL certificate issued (green lock)
- [ ] Environment variable updated: `NEXT_PUBLIC_APP_URL=https://suparbase.com`
- [ ] Application redeployed (if env vars changed)
- [ ] Supabase Site URL updated: `https://suparbase.com`
- [ ] Supabase Redirect URLs updated: `https://suparbase.com/**`
- [ ] DNS propagated (nslookup returns correct IP)
- [ ] HTTPS working: `https://suparbase.com` loads
- [ ] Health check works: `https://suparbase.com/api/status`
- [ ] Authentication works (sign up/login)

## Expected Timeline

1. **DNS Setup**: 2 minutes
2. **DNS Propagation**: 5-15 minutes (can be up to 24 hours)
3. **SSL Certificate**: 1-5 minutes after DNS resolves
4. **Total**: ~10-20 minutes typically

## Final Configuration

After setup, your configuration should be:

**Coolify:**
- Domain: `suparbase.com`
- SSL: Enabled (Let's Encrypt)
- Environment: `NEXT_PUBLIC_APP_URL=https://suparbase.com`

**Supabase:**
- Site URL: `https://suparbase.com`
- Redirect URLs: `https://suparbase.com/**`

**DNS:**
- A Record: `@ → 72.61.229.220`

## Support

If you encounter issues:
1. Check Coolify application logs
2. Verify DNS with `nslookup suparbase.com`
3. Check SSL certificate status in Coolify
4. Verify environment variables are correct
5. Review Supabase redirect URL configuration

---

**Your app will be live at**: https://suparbase.com 🚀

