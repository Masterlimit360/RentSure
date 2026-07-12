# RentSure Deployment Guide

## Prerequisites
- Supabase project (free or Pro tier)
- Expo CLI / EAS CLI
- Paystack account (test + live keys)

## 1. Supabase Setup

### Apply Migrations
Run the SQL migrations in order against your Supabase project:
```bash
npx supabase db push
```
Or manually execute each file in `supabase/migrations/` via the SQL Editor:
1. `20260712000000_init.sql` — Tables, triggers, state machine
2. `20260712000001_rpcs.sql` — Business logic RPCs
3. `20260712000002_rls.sql` — Row Level Security policies
4. `20260712000003_storage.sql` — Storage buckets and policies

### Deploy Edge Functions
```bash
npx supabase functions deploy paystack-init
npx supabase functions deploy paystack-webhook
npx supabase functions deploy expire-bookings
npx supabase functions deploy admin-verify
```

### Set Edge Function Secrets
```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_key_here
```

### Configure Paystack Webhook
In your Paystack dashboard, set the webhook URL to:
```
https://nxujvinvafvfsavdlqwj.supabase.co/functions/v1/paystack-webhook
```

### RLS Verification
Run the Supabase Security Advisor from the dashboard:
- Navigate to **Database** → **Security Advisor**
- Verify all 10 tables have RLS enabled
- No table should show "RLS not enabled" warning

## 2. Environment Variables

### Development (.env)
```
EXPO_PUBLIC_USE_MOCKS=true
EXPO_PUBLIC_SUPABASE_URL=https://nxujvinvafvfsavdlqwj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
EXPO_PUBLIC_PAYSTACK_KEY=pk_test_<your_test_key>
```

### Production (.env.production)
```
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_SUPABASE_URL=https://nxujvinvafvfsavdlqwj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
EXPO_PUBLIC_PAYSTACK_KEY=pk_live_<your_live_key>
```

## 3. Build & Release

### EAS Build
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Security Check: No Service-Role Key in Bundle
After building, verify no secret keys leaked into the app bundle:
```bash
# For Android APK:
unzip app.apk -d apk_contents
grep -r "service_role" apk_contents/ # Should return nothing
grep -r "sk_test" apk_contents/      # Should return nothing
grep -r "sk_live" apk_contents/      # Should return nothing
```

## 4. Free Tier Caveats

| Issue | Mitigation |
|---|---|
| DB pauses after ~1 week idle | Visit Supabase dashboard before demos |
| Limited connections | App uses connection pooling via supabase-js |
| Edge Function cold starts (2-3s) | First payment init may be slow |
| No daily backups | Upgrade to Pro for automated backups |

## 5. Monitoring
- **Supabase Dashboard** → Logs → Edge Functions: Monitor webhook processing
- **Paystack Dashboard** → Transactions: Verify payment processing
- **Supabase Dashboard** → Auth → Users: Monitor signups
