# Password Reset Redirect Fix

## Issue

When users click the password reset link from their email, they are redirected to the dashboard instead of the password reset page.

## Root Cause

The password recovery flow was using mixed public app URLs (`ictrl.app`, `www.ictrl.app`, and the legacy
`invctrl.vercel.app`). That mismatch allowed recovery sessions to land on a non-login route, where the app
would treat the user as normally signed in and render the dashboard before the password reset form appeared.

## Fixes Applied

### 1. Local Development (config.toml)

**File:** `supabase/config.toml`

Updated the auth configuration:

```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173", "https://ictrl.app", "https://www.ictrl.app", "https://invctrl.vercel.app"]
```

### 2. Production (Manual Dashboard Update Required)

**Project:** `https://katrzxlydbvuabyhuliq.supabase.co`

**Steps to fix:**

1. Go to **Supabase Dashboard** → <https://supabase.com/dashboard/project/katrixzxlydbvuabyhuliq>
2. Navigate to **Authentication** → **Providers**
3. Find the **Email** provider settings
4. Update:
   - **Site URL**: `https://ictrl.app`
   - **Redirect URLs**: Add `https://ictrl.app`, `https://www.ictrl.app`, `https://invctrl.vercel.app`, and `http://localhost:5173`
5. Click **Save**

## Code Verification

The application code correctly handles password recovery:

**AuthContext.tsx:**

```typescript
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildPublicAppUrl("/login"),
  });
  return { error };
};
```

**Login.tsx:**

```typescript
useEffect(() => {
  const hashType = getAuthCallbackType(location.hash);
  const isRecoveryCallback = hashType === "recovery" || recoveryParam;

  if (isRecoveryCallback) {
    setView("setNewPassword");
    clearAuthCallbackState();
  }
  // ...
}, [clearAuthCallbackState, location.hash, recoveryParam]);
```

When a user clicks the recovery link:

1. Supabase redirects to `/login` with `#access_token=xxx&type=recovery`
2. `AuthCallbackRedirector` routes recovery callbacks back to `/login?recovery=1` if they land anywhere else
3. Login.tsx detects either `type=recovery` or `?recovery=1` and switches to "setNewPassword"
4. The callback markers are cleared from the URL after the reset form is shown
5. User can enter new password
6. After success, shows "passwordChanged" confirmation

## Testing

### Local Testing (requires Docker)

```bash
supabase start
npm run dev
# Visit http://localhost:5173/login
# Test forgot password flow
# Check Inbucket at http://localhost:54324
```

### Production Testing

After updating dashboard settings:

1. Deploy the app to production
2. Test forgot password from the live site
3. Verify the recovery link goes to `https://ictrl.app/login`
4. Verify the user sees the password reset form instead of the dashboard
