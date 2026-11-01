# Environment Variables Reference

## Frontend (`.env`)

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `VITE_PUBLIC_APP_URL` (canonical app URL for auth redirects; production default is `https://ictrl.app`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (fallback compatibility)
- `VITE_POSTHOG_API_KEY` (analytics enablement)
- `VITE_POSTHOG_HOST` (defaults to `https://app.posthog.com`)

Notes:

- Do not store server secrets in frontend `.env`.
- If PostHog key is missing/placeholder, analytics is disabled by runtime guard.

## Supabase Edge Function secrets

Core:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGIN`
- `SITE_URL`
- `APP_URL` (optional, used by invitation/trial email flows)

Stripe billing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_BUSINESS`
- `STRIPE_PRICE_ENTERPRISE`

Trial notifier SMTP (if enabled):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `TRIAL_EMAIL_FROM`

Contact form email (Resend):

- `RESEND_API_KEY` — Resend API key for sending contact form emails
- `CONTACT_TO_EMAIL` — Destination email address (e.g. `contact@capyco.ca`)
- `CONTACT_FROM_EMAIL` — Optional sender address (defaults to `InventoryCTRL Contact <onboarding@resend.dev>`)
