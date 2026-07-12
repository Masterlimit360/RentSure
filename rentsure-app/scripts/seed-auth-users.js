/**
 * scripts/seed-auth-users.js
 *
 * Creates the three demo accounts in Supabase Auth via the Admin API.
 * This is the ONLY safe way to create users with a known password.
 *
 * NEVER INSERT directly into auth.users via SQL — GoTrue will produce
 * HTTP 500 on sign-in because it cannot verify externally-hashed passwords.
 *
 * Usage:
 *   node scripts/seed-auth-users.js
 *
 * Requires env vars (from .env or shell):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← from Project Settings → API → service_role
 */

require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing env vars. Ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const DEMO_USERS = [
  {
    email: 'tenant@rentsure.com',
    password: 'Test1234!',
    email_confirm: true,
    user_metadata: { full_name: 'Kwame Mensah', phone: '0500000001', role: 'TENANT' },
  },
  {
    email: 'landlord@rentsure.com',
    password: 'Test1234!',
    email_confirm: true,
    user_metadata: { full_name: 'Abena Osei', phone: '0500000002', role: 'LANDLORD' },
  },
  {
    email: 'admin@rentsure.com',
    password: 'Test1234!',
    email_confirm: true,
    user_metadata: { full_name: 'System Admin', phone: '0500000003', role: 'ADMIN' },
  },
];

async function adminFetch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function updatePassword(userId, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ password }),
  });
  return { status: res.status, body: await res.json() };
}

async function listUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const data = await res.json();
  return data.users || [];
}

async function main() {
  console.log('🔍 Fetching existing users...');
  const existing = await listUsers();
  const existingEmails = Object.fromEntries(existing.map((u) => [u.email, u.id]));

  for (const user of DEMO_USERS) {
    if (existingEmails[user.email]) {
      const userId = existingEmails[user.email];
      console.log(`🔄 ${user.email} already exists (${userId}) — resetting password...`);
      const { status, body } = await updatePassword(userId, user.password);
      if (status === 200) {
        console.log(`   ✅ Password reset OK`);
      } else {
        console.error(`   ❌ Password reset failed:`, body);
      }
    } else {
      console.log(`➕ Creating ${user.email}...`);
      const { status, body } = await adminFetch('/auth/v1/admin/users', {
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata,
      });
      if (status === 200 || status === 201) {
        console.log(`   ✅ Created: ${body.id}`);
      } else {
        console.error(`   ❌ Failed (HTTP ${status}):`, body);
      }
    }
  }

  console.log('\n✅ Done. Run `npx supabase db push` to apply the public.profiles backfill migration.');
}

main().catch(console.error);
