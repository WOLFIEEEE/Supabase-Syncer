# Implementation Priority - Step by Step

A simple, actionable list of what to build first for your initial paid release.

---

## 🎯 Phase 1: Make It Paid (Week 1)

### Step 1: Add Subscription Table (2 hours)
**File**: `supabase/migrations/005_add_subscriptions.sql`

```sql
-- Simple subscription table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
    plan_name VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'starter', 'pro'
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);
```

**Why**: Minimal schema to get started. Can expand later.

---

### Step 2: Update Usage Limits Service (1 hour)
**File**: `lib/services/usage-limits.ts`

Add function to get plan limits:

```typescript
const PLAN_LIMITS = {
  free: {
    maxConnections: 3,
    maxSyncJobsPerMonth: 5,
    maxDataTransferMbPerMonth: 500,
  },
  starter: {
    maxConnections: 10,
    maxSyncJobsPerMonth: 20,
    maxDataTransferMbPerMonth: 5120, // 5GB
  },
  pro: {
    maxConnections: 50,
    maxSyncJobsPerMonth: 100,
    maxDataTransferMbPerMonth: 51200, // 50GB
  },
};

export async function getUserPlan(userId: string): Promise<'free' | 'starter' | 'pro'> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan_name')
    .eq('user_id', userId)
    .single();
  
  return (data?.plan_name as any) || 'free';
}

// Update getUserUsageLimits to use plan
export async function getUserUsageLimits(userId: string): Promise<UsageLimits> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];
  
  // ... rest of existing code, but use limits instead of DEFAULT_LIMITS
}
```

**Why**: Reuses existing code, just changes the limits source.

---

### Step 3: Stripe Checkout Integration (4 hours)
**File**: `app/api/subscriptions/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { planId } = await request.json(); // 'starter' or 'pro'
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Get or create Stripe customer
  let customerId = await getStripeCustomerId(user.id);
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! });
    customerId = customer.id;
    await supabase.from('user_subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
    });
  }
  
  // Create checkout session
  const priceId = planId === 'starter' 
    ? process.env.STRIPE_STARTER_PRICE_ID!
    : process.env.STRIPE_PRO_PRICE_ID!;
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
  });
  
  return NextResponse.json({ url: session.url });
}
```

**Why**: Stripe Checkout handles everything - no custom payment forms needed.

---

### Step 4: Stripe Webhook (2 hours)
**File**: `app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;
  
  const event = stripe.webhooks.constructEvent(
    body, sig, process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  const supabase = await createClient();
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Update subscription
    await supabase.from('user_subscriptions').update({
      plan_name: session.metadata?.plan || 'starter',
      stripe_subscription_id: session.subscription,
      status: 'active',
    }).eq('stripe_customer_id', session.customer);
  }
  
  return NextResponse.json({ received: true });
}
```

**Why**: Updates subscription when payment succeeds.

---

### Step 5: Update Pricing Page (2 hours)
**File**: `app/(public)/pricing/PricingPageClient.tsx`

Add "Upgrade" buttons:

```typescript
const handleUpgrade = async (plan: 'starter' | 'pro') => {
  const res = await fetch('/api/subscriptions/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: plan }),
  });
  const { url } = await res.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

**Why**: Simple button that opens Stripe Checkout.

---

## ✅ Phase 1 Complete Checklist

- [ ] Subscription table created
- [ ] Usage limits use subscription plan
- [ ] Stripe checkout works
- [ ] Webhook updates subscription
- [ ] Pricing page has upgrade buttons
- [ ] Test: Free user can upgrade
- [ ] Test: Paid user has higher limits

**Time**: ~12 hours total

---

## 🚀 Phase 2: Add Value (Week 2)

### Step 6: Scheduled Syncs (1 day)

**File**: `lib/services/scheduler.ts` (create new)

```typescript
// Simple scheduler using existing queue
export async function scheduleSync(jobId: string, schedule: 'daily' | 'weekly') {
  // Add to queue with delay
  // Use existing queue infrastructure
}
```

**File**: `app/api/sync/route.ts` (update)

Add schedule field when creating sync:

```typescript
if (schedule) {
  await scheduleSync(job.id, schedule);
}
```

**UI**: Add schedule dropdown in sync creation form.

**Why**: Clear paid feature, reduces manual work.

---

### Step 7: Email Notifications (4 hours)

**Install**: `npm install resend`

**File**: `lib/services/email-notifications.ts` (update)

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmailNotification(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject,
    html,
  });
}
```

**Why**: Users want to know when syncs complete.

---

### Step 8: Usage Dashboard (3 hours)

**File**: `app/settings/page.tsx` (add section)

```typescript
const UsageDashboard = () => {
  const { data } = useSWR('/api/usage', fetcher);
  
  return (
    <Box>
      <Heading>Usage</Heading>
      <Progress value={data.connections.percentage} />
      <Text>{data.connections.current} / {data.connections.limit} connections</Text>
      {/* Repeat for syncs and data transfer */}
    </Box>
  );
};
```

**Why**: Users need to see their usage.

---

## 📊 Phase 3: Polish (Week 3)

### Step 9: Subscription Management (2 hours)

**File**: `app/settings/page.tsx`

Add link to Stripe Customer Portal:

```typescript
const handleManageSubscription = async () => {
  const res = await fetch('/api/subscriptions/portal', { method: 'POST' });
  const { url } = await res.json();
  window.location.href = url;
};
```

**API**: `app/api/subscriptions/portal/route.ts`

```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
});
```

**Why**: Stripe Customer Portal handles everything - cancel, update payment, etc.

---

### Step 10: Upgrade Prompts (2 hours)

**File**: `components/UpgradePrompt.tsx`

```typescript
const UpgradePrompt = ({ usage, limit, feature }) => {
  if (usage / limit < 0.8) return null;
  
  return (
    <Alert status="warning">
      <AlertIcon />
      You've used {Math.round(usage / limit * 100)}% of your {feature} limit.
      <Button onClick={() => router.push('/pricing')}>Upgrade</Button>
    </Alert>
  );
};
```

**Why**: Convert free users to paid.

---

## 🎯 Summary: What to Build First

### Week 1: Make It Paid
1. ✅ Subscription table
2. ✅ Update usage limits
3. ✅ Stripe checkout
4. ✅ Stripe webhook
5. ✅ Pricing page buttons

### Week 2: Add Value
6. ✅ Scheduled syncs
7. ✅ Email notifications
8. ✅ Usage dashboard

### Week 3: Polish
9. ✅ Subscription management
10. ✅ Upgrade prompts

---

## 💡 Pro Tips

1. **Start with Stripe Checkout** - Don't build custom payment forms
2. **Use Stripe Customer Portal** - Don't build subscription management UI
3. **Reuse existing code** - Your usage limits system is already good
4. **Test in Stripe test mode first** - Use test cards
5. **Keep it simple** - Add complexity later based on feedback

---

## 🚫 Don't Build Yet

- Team features
- API access
- Complex analytics
- Multiple billing cycles
- Usage-based overages

**Add these after you have paying customers and feedback!**

---

**Total Time Estimate**: ~3 weeks for MVP launch

**Focus**: Get paying customers first, then iterate based on what they actually want.

