# RentSure Backend (ARCHIVED)

> **ARCHIVED — not deployed. All backend logic lives in Supabase (migrations, RPCs, Edge Functions). Kept for reference.**

This Spring Boot backend was originally designed for the RentSure platform, but the architecture has been migrated to use Supabase directly. **NOTHING** in the current production architecture depends on this folder.

## Original Architecture Rule (DEPRECATED)
> Supabase is used **ONLY** as a hosted PostgreSQL database and S3-compatible storage. 
> There is **one door** to our data: React Native → Spring Boot → Supabase.

1. **NO supabase-js anywhere**: The React Native frontend never talks to Supabase directly. All HTTP calls go to the Spring Boot backend.
2. **NO Supabase Auth**: We use our own stateless JWT authentication built into Spring Security.
3. **NO RLS (Row Level Security)**: All authorization logic (e.g., verifying a tenant can only view their own bookings) lives in the Spring Boot `@Service` layer.
4. **NO Edge Functions**: All business logic lives in Java.
5. **Schema Ownership**: Flyway owns 100% of the database schema. **NEVER** create or modify tables via the Supabase dashboard. If a table exists in Supabase Studio that isn't in a Flyway migration inside `src/main/resources/db/migration`, it is considered a bug and will be dropped.

## Tech Stack
- Java 21
- Spring Boot 3
- Spring Security + JWT
- PostgreSQL (Supabase) + Flyway
- Testcontainers (for testing)

## Profiles
- **`dev`**: Used for local offline development. Connects to the local PostgreSQL database managed via `docker-compose.yml` and executes `V3__dev_seed.sql` to populate dummy data.
- **`prod`**: Connects strictly to the Supabase Connection Pooler (`sslmode=require`). Seeds are never executed in production.

## Storage
Media storage (property images and verification documents) is fully integrated with Supabase Storage via the REST API.
- **`property-media`**: Public read bucket for property photos and videos.
- **`verification-docs`**: Private bucket for sensitive identity documents. The backend generates short-lived signed URLs when viewing these documents.
