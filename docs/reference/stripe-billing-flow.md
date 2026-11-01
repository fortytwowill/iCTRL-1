# Stripe Billing Flow Reference

## Flow summary

1. User opens `/subscribe`.
2. Frontend calls `supabase.functions.invoke("create-checkout-session", body)`.
3. Function creates/reuses Stripe customer and creates Checkout Session.
4. Browser redirects to Stripe Checkout.
5. Stripe sends webhook events to `stripe-webhook`.
6. Webhook updates `subscriptions`, `organizations.subscription_status`, and roles.

## Frontend request contract

Function: `create-checkout-session`

Request body:

```json
{
  "plan": "starter | business | enterprise",
  "successUrl": "https://app/subscribe?success=true",
  "cancelUrl": "https://app/subscribe?canceled=true"
}
```

Response body:

```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

## Metadata handoff to Stripe

Session/subscription metadata includes:

- `organization_id`
- `supabase_user_id`
- `plan`

## Webhook event handling matrix

- `checkout.session.completed`
- Upserts subscription row
- Sets org status to `active`
- Promotes earliest org profile to `master_admin`

- `customer.subscription.updated`
- Updates subscription plan/status/period fields
- Syncs org subscription status (`active`, `past_due`, `canceled`, or `trialing`)

- `customer.subscription.deleted`
- Marks subscription as canceled
- Sets org status to `canceled`
- Demotes org `master_admin` users to `user`

- `invoice.payment_failed`
- Marks subscription row as `past_due`

## Source-of-truth references

- UI pricing: `src/pages/Subscribe.tsx`
- Plan limits: latest migrations:
- `supabase/migrations/20260611000000_update_plan_tiers_and_enforce_capacity.sql`
- `supabase/migrations/20260612000000_trial_expiry_lock_and_notifications.sql`

## Failure behavior

- Missing authorization header in checkout function returns 401.
- Unknown plan or missing price ID returns 400.
- Invalid webhook signature returns 400.
- Processing errors return 500 and should be investigated with function logs.
