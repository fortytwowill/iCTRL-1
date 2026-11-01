# Getting Started

## Purpose

Set up InventoryCTRL locally with Supabase and optional Stripe/PostHog integration.

## Audience

Engineers running the project for development.

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- Supabase project
- Stripe account (optional for billing flows)

## 1. Clone and install

```bash
git clone https://github.com/rickadipa/IMStool.git
cd IMStool
npm install
```

## 2. Configure frontend environment

Copy `.env.example` to `.env` and set:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Optional:

```env
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
VITE_POSTHOG_API_KEY=phc_xxx
VITE_POSTHOG_HOST=https://app.posthog.com
```

## 3. Link Supabase and apply migrations

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

## 4. Start the app

```bash
npm run dev
```

Expected output includes:

- Local URL: `http://localhost:5173`

## 5. Stripe (optional)

If you want to test subscription flows, follow `docs/STRIPE_SETUP.md` and deploy:

- `create-checkout-session`
- `stripe-webhook`

## 6. Verify basic flows

1. Sign up and sign in.
2. Confirm you can access dashboard routes.
3. Open `/subscribe` and ensure plans render.

## Troubleshooting

### Supabase connection errors

- Validate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Confirm your Supabase project is active.

### Database migration issues

- Run `supabase migration list`.
- Validate project link with `supabase projects list`.

### Dependency/install issues (PowerShell)

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Dependency/install issues (Bash)

```bash
rm -rf node_modules package-lock.json
npm install
```

## Next docs

- `docs/DEPLOYMENT.md`
- `docs/ARCHITECTURE.md`
- `docs/STRIPE_SETUP.md`
- `docs/reference/environment-variables.md`
