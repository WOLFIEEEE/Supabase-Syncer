# Billing & Subscription Implementation Guide

This guide outlines how to implement billing and subscription management for suparbase using Stripe.

---

## 🎯 Overview

To monetize suparbase, you need:
1. **Subscription Management**: Handle plan tiers, upgrades, downgrades
2. **Payment Processing**: Stripe integration for payments
3. **Usage-Based Limits**: Connect subscription tiers to usage limits
4. **Billing Dashboard**: Let users manage subscriptions

---

## 📋 Step 1: Database Schema

### Create Subscription Tables

Add this migration to `supabase/migrations/005_add_subscriptions.sql`:

```sql
-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 'free', 'starter', 'pro', 'team', 'enterprise'
    display_name VARCHAR(100) NOT NULL, -- 'Free', 'Starter', 'Pro', 'Team', 'Enterprise'
    price_monthly INTEGER NOT NULL DEFAULT 0, -- in cents
    price_yearly INTEGER, -- in cents (optional)
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    features JSONB NOT NULL DEFAULT '{}', -- JSON object with feature flags
    limits JSONB NOT NULL DEFAULT '{}', -- JSON object with limits
    max_users INTEGER, -- NULL = unlimited
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing history table
CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(10) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- 'paid', 'pending', 'failed', 'refunded'
    invoice_url TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Users can read all active plans
CREATE POLICY "Users can view active plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true);

-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only view their own billing history
CREATE POLICY "Users can view own billing history"
    ON billing_history FOR SELECT
    USING (auth.uid() = user_id);

-- Function to get user's current plan limits
CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_limits JSONB;
BEGIN
    SELECT sp.limits INTO v_limits
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    LIMIT 1;
    
    RETURN COALESCE(v_limits, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, price_monthly, features, limits) VALUES
('free', 'Free', 0, 
 '{"scheduledSyncs": false, "apiAccess": false, "webhooks": false, "teamWorkspaces": false}'::jsonb,
 '{"maxConnections": 3, "maxSyncJobsPerMonth": 5, "maxDataTransferMbPerMonth": 500}'::jsonb),
('starter', 'Starter', 900, -- $9.00
 '{"scheduledSyncs": true, "apiAccess": false, "webhooks": false, "teamWorkspaces": false}'::jsonb,
 '{"maxConnections": 10, "maxSyncJobsPerMonth": 20, "maxDataTransferMbPerMonth": 5120}'::jsonb),
('pro', 'Pro', 2900, -- $29.00
 '{"scheduledSyncs": true, "apiAccess": true, "webhooks": true, "teamWorkspaces": false}'::jsonb,
 '{"maxConnections": 50, "maxSyncJobsPerMonth": 100, "maxDataTransferMbPerMonth": 51200}'::jsonb),
('team', 'Team', 7900, -- $79.00
 '{"scheduledSyncs": true, "apiAccess": true, "webhooks": true, "teamWorkspaces": true}'::jsonb,
 '{"maxConnections": 100, "maxSyncJobsPerMonth": 500, "maxDataTransferMbPerMonth": 256000, "maxUsers": 5}'::jsonb)
ON CONFLICT (name) DO NOTHING;
```

---

## 📦 Step 2: Install Stripe

```bash
npm install stripe @stripe/stripe-js
```

---

## 🔧 Step 3: Create Subscription Service

Create `lib/services/subscription-service.ts`:

```typescript
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly?: number;
  features: Record<string, boolean>;
  limits: {
    maxConnections: number;
    maxSyncJobsPerMonth: number;
    maxDataTransferMbPerMonth: number;
    maxUsers?: number;
  };
}

export interface UserSubscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(plan => ({
    id: plan.id,
    name: plan.name,
    displayName: plan.display_name,
    priceMonthly: plan.price_monthly,
    priceYearly: plan.price_yearly,
    features: plan.features || {},
    limits: plan.limits || {},
  }));
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    planId: data.plan_id,
    status: data.status,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
  };
}

/**
 * Get user's plan limits (from subscription or default to free)
 */
export async function getUserPlanLimits(userId: string) {
  const supabase = await createClient();
  
  // Get user's subscription
  const subscription = await getUserSubscription(userId);
  
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    // Return free plan limits
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('limits')
      .eq('name', 'free')
      .single();
    
    return freePlan?.limits || {
      maxConnections: 3,
      maxSyncJobsPerMonth: 5,
      maxDataTransferMbPerMonth: 500,
    };
  }
  
  // Get plan limits
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('limits')
    .eq('id', subscription.planId)
    .single();
  
  return plan?.limits || {};
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  isYearly: boolean = false
): Promise<string> {
  const supabase = await createClient();
  
  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  if (planError || !plan) throw new Error('Plan not found');
  
  // Get or create Stripe customer
  const subscription = await getUserSubscription(userId);
  let customerId = subscription?.stripeCustomerId;
  
  if (!customerId) {
    // Get user email
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('User email not found');
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    
    customerId = customer.id;
    
    // Save customer ID
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: planId,
        status: 'incomplete',
        stripe_customer_id: customerId,
      }, {
        onConflict: 'user_id',
      });
  }
  
  // Get Stripe price ID
  const priceId = isYearly 
    ? plan.stripe_price_id_yearly 
    : plan.stripe_price_id_monthly;
  
  if (!priceId) throw new Error('Stripe price ID not configured for this plan');
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      userId,
      planId,
    },
  });
  
  return session.url!;
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  const supabase = await createClient();
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      
      if (!userId || !planId) return;
      
      // Update subscription
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          stripe_subscription_id: session.subscription as string,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })
        .eq('user_id', userId);
      
      break;
    }
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Find user by customer ID
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single();
      
      if (!userSub) return;
      
      const status = subscription.status === 'active' 
        ? 'active' 
        : subscription.status === 'canceled'
        ? 'canceled'
        : 'past_due';
      
      await supabase
        .from('user_subscriptions')
        .update({
          status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end !== null,
        })
        .eq('user_id', userSub.user_id);
      
      break;
    }
    
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Find user by customer ID
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('user_id, id')
        .eq('stripe_customer_id', invoice.customer as string)
        .single();
      
      if (!userSub) return;
      
      // Record billing history
      await supabase
        .from('billing_history')
        .insert({
          user_id: userSub.user_id,
          subscription_id: userSub.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'paid',
          invoice_url: invoice.hosted_invoice_url,
          paid_at: new Date(),
        });
      
      break;
    }
  }
}
```

---

## 🌐 Step 4: Create API Routes

### Create `app/api/subscriptions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionPlans, getUserSubscription, createCheckoutSession } from '@/lib/services/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const plans = await getSubscriptionPlans();
    const subscription = await getUserSubscription(user.id);
    
    return NextResponse.json({
      success: true,
      data: {
        plans,
        subscription,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { planId, isYearly } = await request.json();
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }
    
    const checkoutUrl = await createCheckoutSession(user.id, planId, isYearly);
    
    return NextResponse.json({
      success: true,
      data: { checkoutUrl },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Create `app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleStripeWebhook } from '@/lib/services/subscription-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await handleStripeWebhook(event);
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

---

## 🔄 Step 5: Update Usage Limits Service

Modify `lib/services/usage-limits.ts` to use subscription limits:

```typescript
import { getUserPlanLimits } from './subscription-service';

// Replace DEFAULT_LIMITS usage with:
export async function getUserUsageLimits(userId: string): Promise<UsageLimits> {
  const supabase = await createClient();
  
  // Get plan limits
  const planLimits = await getUserPlanLimits(userId);
  
  // Get or create usage limits record
  // ... existing code ...
  
  // Use plan limits instead of DEFAULT_LIMITS
  const limits = {
    maxConnections: planLimits.maxConnections || 3,
    maxSyncJobsPerMonth: planLimits.maxSyncJobsPerMonth || 5,
    maxDataTransferMbPerMonth: planLimits.maxDataTransferMbPerMonth || 500,
  };
  
  // ... rest of function ...
}
```

---

## 🎨 Step 6: Update Frontend

### Update Pricing Page

Modify `app/(public)/pricing/PricingPageClient.tsx` to:
1. Fetch plans from API
2. Show current subscription status
3. Add "Upgrade" buttons that redirect to checkout

### Create Settings Page for Subscription Management

Create `app/settings/subscription/page.tsx`:
- Show current plan
- Show usage vs limits
- Upgrade/downgrade buttons
- Cancel subscription option
- Billing history

---

## 🔐 Step 7: Environment Variables

Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📝 Step 8: Stripe Setup

1. **Create Stripe Account**: https://stripe.com
2. **Create Products & Prices**: In Stripe Dashboard, create products for each plan
3. **Get Price IDs**: Copy the price IDs and update `subscription_plans` table
4. **Set Webhook Endpoint**: Point to `https://yourdomain.com/api/webhooks/stripe`
5. **Test**: Use Stripe test mode first

---

## ✅ Testing Checklist

- [ ] User can view all plans
- [ ] User can subscribe to a plan
- [ ] Stripe checkout works
- [ ] Webhook updates subscription status
- [ ] Usage limits update based on plan
- [ ] User can cancel subscription
- [ ] Billing history is recorded
- [ ] Upgrade/downgrade flows work

---

## 🚀 Next Steps

1. Implement the database migration
2. Create the subscription service
3. Set up Stripe products
4. Test the flow end-to-end
5. Add UI for subscription management
6. Add email notifications for subscription events

---

This implementation provides a solid foundation for monetizing suparbase. Start with the free and starter plans, then expand based on customer feedback.

