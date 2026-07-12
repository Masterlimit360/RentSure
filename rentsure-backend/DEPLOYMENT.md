# RentSure Deployment Notes

This document contains operational and deployment notes specific to Phase B1-S (Supabase Postgres integration).

## 1. Region Locality
For the best performance, ensure that the Spring Boot hosting provider (e.g., Render, Railway, AWS ECS) is located in the **SAME region** as your Supabase project (e.g., `eu-central-1`). 
- **Why?** The backend communicates with the database multiple times per HTTP request (especially with JPA/Hibernate lazy loading and pessimistic locking). Network latency between the backend and the database is crossed repeatedly, so keeping them in the same data center is critical.

## 2. Supabase Free-Tier Idle Pausing
- Supabase free-tier projects are **automatically paused after ~1 week of inactivity**.
- If the database pauses, the Spring Boot app will start throwing connection errors (`HikariPool-1 - Connection is not available, request timed out`).
- **Action:** Before demonstrating the app to investors or clients, log in to the Supabase dashboard and ensure the database is active. Upgrading to a paid tier removes this idle pausing.

## 3. Connection Pooling Limits
- The Supabase free tier enforces strict concurrent connection limits.
- The backend's HikariCP pool is explicitly configured with `maximumPoolSize: 10`. **Do not increase this** unless you have upgraded your Supabase plan.
- Ensure your Spring Boot backend connects to the **SESSION-MODE pooler (port 5432)** (or the direct database port, if allowed). Do NOT use transaction-mode pooling (port 6543) as it breaks Hibernate's prepared statements, leading to intermittent query execution errors.

## 4. Backups and Restore
- **Backups:** Supabase automatically performs daily logical backups (on the Pro tier and above). Free tier users should occasionally export their database manually or upgrade for automated daily backups.
- **Restore:** Do not attempt to manually inject raw SQL to restore. Use the Supabase dashboard's "Restore" feature. Because Flyway is strictly used, the schema is always perfectly in sync with the codebase. If you need to rebuild from scratch, let Flyway create the tables on boot, then import data.

## 5. Environment Variables Checklist
In your production environment, the following variables must be set securely:
- `DB_URL`: `jdbc:postgresql://db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require`
- `DB_USERNAME`: `postgres`
- `DB_PASSWORD`: The database password set during project creation.
- `JWT_SECRET`: A secure, randomly generated 32+ character string.
