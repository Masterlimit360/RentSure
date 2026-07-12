# RentSure

A mobile rental marketplace for Ghana — built with React Native (Expo) and powered entirely by Supabase.

## Architecture

```
┌──────────────────────┐
│   React Native App   │  ← Expo SDK 54
│  (Tenant / Landlord  │
│   / Admin views)     │
└──────────┬───────────┘
           │ supabase-js
           ▼
┌──────────────────────┐
│      Supabase        │
│  ┌────────────────┐  │
│  │  PostgreSQL    │  │  ← Schema, RLS, Triggers, RPCs
│  │  (Auth + Data) │  │
│  ├────────────────┤  │
│  │  Edge Functions│  │  ← paystack-init, paystack-webhook,
│  │  (Deno)        │  │     expire-bookings, admin-verify
│  ├────────────────┤  │
│  │  Storage       │  │  ← property-media (public), verification-docs (private)
│  └────────────────┘  │
└──────────────────────┘
```

**There is no custom API server.** No Spring Boot, no Express, no FastAPI. Server-side rules live in:
- **RLS policies** for authorization
- **Postgres triggers/functions** for data invariants
- **Edge Functions** for payment secrets and multi-step orchestration

## Quick Start

```bash
# 1. Install dependencies
cd rentsure-app
npm install

# 2. Start in demo mode (default — no Supabase needed)
# .env has EXPO_PUBLIC_USE_MOCKS=true
npx expo start

# 3. Start in live mode
# Set EXPO_PUBLIC_USE_MOCKS=false in .env
# Ensure Supabase project is active
npx expo start
```

## Modes

| Mode | Env Var | Data Source | Use Case |
|---|---|---|---|
| **Mock** | `EXPO_PUBLIC_USE_MOCKS=true` | AsyncStorage + in-memory | Offline demo, QA, investor walkthroughs |
| **Live** | `EXPO_PUBLIC_USE_MOCKS=false` | Supabase Postgres | Production, integration testing |

## Key Documents

| Document | Description |
|---|---|
| `AUTHORIZATION_MATRIX.md` | Every table × role × operation mapped to its RLS policy |
| `INTEGRATION_REPORT.md` | Live mode audit results and security checklist |
| `DEPLOYMENT.md` | Operational notes for production deployment |

## Project Structure

```
rentsure-app/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (auth)/             # Login, Register, Verify
│   ├── (tenant)/           # Tenant dashboard, bookings, payments
│   ├── (landlord)/         # Landlord dashboard, properties, bookings
│   └── (admin)/            # Admin dashboard, verifications, users
├── src/
│   ├── api/                # API layer (supabase-js in live, mocks in demo)
│   ├── components/         # Reusable UI components
│   ├── hooks/              # TanStack Query hooks
│   ├── mocks/              # Mock data layer (AsyncStorage persistence)
│   ├── store/              # Zustand stores (auth, notifications)
│   ├── types/              # TypeScript interfaces (frozen API contract)
│   └── utils/              # Formatters, helpers
├── supabase/
│   ├── migrations/         # SQL schema (tables, triggers, RLS, RPCs)
│   └── functions/          # Deno Edge Functions
└── .env                    # Environment variables
```
