# RentSure — System Architecture & Technical Specification

**Version:** 1.0 | **Date:** July 2026
**Stack:** React Native (Expo) · Spring Boot 3.x · PostgreSQL 16

---

## 1. Architecture Overview

RentSure follows a **3-tier client–server architecture**:

```
┌─────────────────────┐
│  React Native App   │  Presentation tier (iOS + Android via Expo)
│  (Tenant/Landlord/  │
│   Admin views)      │
└─────────┬───────────┘
          │ HTTPS / REST (JSON) + JWT
┌─────────▼───────────┐
│  Spring Boot API    │  Application tier
│  - Controllers      │  (business rules, validation,
│  - Services         │   state machine, payments)
│  - Repositories     │
└─────────┬───────────┘
          │ JDBC / Hibernate (JPA)
┌─────────▼───────────┐
│  PostgreSQL 16      │  Data tier
└─────────────────────┘

External services:
- Paystack (escrow payments, webhooks)
- S3-compatible object storage (property photos/videos — only URLs in DB)
- Firebase Cloud Messaging (push notifications)
- SMTP provider (email verification, receipts)
```

**Key principle:** the mobile app is a *thin client*. All business rules (who can review, when escrow releases, booking transitions) are enforced server-side. Never trust the client.

---

## 2. User Roles & Permissions

| Capability | Tenant | Landlord | Admin |
|---|---|---|---|
| Register / login | ✓ | ✓ | — (seeded) |
| Browse & search listings | ✓ | ✓ | ✓ |
| Create/edit own listings | — | ✓ | ✓ |
| Request booking | ✓ | — | — |
| Accept/reject booking | — | ✓ (own) | ✓ |
| Pay into escrow | ✓ | — | — |
| Confirm move-in (release escrow) | ✓ | — | ✓ (dispute) |
| Leave review | ✓ (completed bookings only) | ✓ (rate tenant) | — |
| Submit verification docs | — | ✓ | — |
| Approve Verified Badge | — | — | ✓ |
| Suspend users / remove listings | — | — | ✓ |

Roles are stored as an enum on `users.role` and enforced with Spring Security method-level annotations (`@PreAuthorize("hasRole('LANDLORD')")`).

---

## 3. Database Schema (PostgreSQL)

### 3.1 Entity-Relationship Summary

```
users 1──∞ properties 1──∞ property_media
users 1──∞ bookings ∞──1 properties
bookings 1──1 payments
bookings 1──1 agreements
bookings 1──∞ reviews
users 1──∞ verifications
users 1──∞ notifications
users 1──∞ payment_methods
users 1──∞ payout_methods
```

### 3.2 Tables

**users**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| full_name | VARCHAR(120) | NOT NULL |
| email | VARCHAR(160) | UNIQUE, NOT NULL |
| phone | VARCHAR(20) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL (BCrypt) |
| role | VARCHAR(10) | CHECK (role IN ('TENANT','LANDLORD','ADMIN')) |
| is_verified_email | BOOLEAN | default false |
| verification_status | VARCHAR(10) | ('PENDING','APPROVED','REJECTED') — used to restrict landlord listings |
| status | VARCHAR(10) | CHECK ('ACTIVE','SUSPENDED') |
| created_at / updated_at | TIMESTAMPTZ | default now() |

**properties**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| landlord_id | UUID | FK → users(id), NOT NULL |
| title | VARCHAR(150) | NOT NULL |
| description | TEXT | |
| property_type | VARCHAR(20) | ('SINGLE_ROOM','SELF_CONTAINED','APARTMENT','HOUSE') |
| region / city / area | VARCHAR | NOT NULL |
| gps_lat / gps_lng | DECIMAL(9,6) | nullable |
| price_per_year | NUMERIC(12,2) | NOT NULL, CHECK > 0 |
| bedrooms / bathrooms | SMALLINT | |
| amenities | JSONB | e.g. ["water","wifi","security"] |
| is_verified | BOOLEAN | default false (Verified Badge) |
| status | VARCHAR(12) | ('AVAILABLE','RENTED','HIDDEN') |
| created_at / updated_at | TIMESTAMPTZ | |

Index: `CREATE INDEX idx_properties_search ON properties(city, property_type, price_per_year) WHERE status='AVAILABLE';`

**property_media**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| property_id | UUID | FK, ON DELETE CASCADE |
| media_type | VARCHAR(6) | ('PHOTO','VIDEO') |
| url | TEXT | object-storage URL |
| sort_order | SMALLINT | |

**bookings** — *the heart of the system*
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| property_id | UUID | FK |
| tenant_id | UUID | FK → users |
| status | VARCHAR(15) | state machine (see 3.3) |
| requested_at | TIMESTAMPTZ | |
| move_in_date | DATE | |
| duration_months | SMALLINT | |
| total_amount | NUMERIC(12,2) | snapshot of price at booking time |
| booking_ref | VARCHAR(12) | UNIQUE, human-readable (e.g. RS-8F3K2A) |

**payments**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| booking_id | UUID | FK, UNIQUE |
| paystack_ref | VARCHAR(64) | UNIQUE |
| amount / fee | NUMERIC(12,2) | |
| escrow_status | VARCHAR(12) | ('HELD','RELEASED','REFUNDED') |
| paid_at / released_at | TIMESTAMPTZ | |

**agreements**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| booking_id | UUID | FK, UNIQUE |
| pdf_url | TEXT | generated agreement |
| tenant_signed_at | TIMESTAMPTZ | |
| landlord_signed_at | TIMESTAMPTZ | |

**reviews**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| booking_id | UUID | FK — enforces "completed rental only" |
| reviewer_id / reviewee_id | UUID | FK → users |
| rating | SMALLINT | CHECK (1–5) |
| comment | TEXT | |
| UNIQUE(booking_id, reviewer_id) | | one review per side |

**verifications**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| landlord_id | UUID | FK → users |
| property_id | UUID | FK → properties (Nullable; if null, this is an identity verification) |
| doc_type | VARCHAR(30) | ('GHANA_CARD','LAND_TITLE','UTILITY_BILL') |
| doc_url | TEXT | |
| status | VARCHAR(10) | ('PENDING','APPROVED','REJECTED') |
| reviewed_by | UUID | FK → users (admin) |

**payment_methods** (Tenants)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| provider | VARCHAR(30) | e.g. 'MTN Mobile Money', 'Visa' |
| account_number | VARCHAR(50) | Encrypted or masked (e.g. ****1234) |
| is_default | BOOLEAN | default false |

**payout_methods** (Landlords)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| provider | VARCHAR(30) | e.g. 'Bank Transfer', 'Telecel Cash' |
| account_name | VARCHAR(120) | Name on the account |
| account_number | VARCHAR(50) | Encrypted/Secure |
| is_default | BOOLEAN | default false |

**notifications**
| id, user_id, type, title, body, is_read, created_at |

### 3.3 Booking State Machine

```
REQUESTED ──landlord accepts──▶ ACCEPTED ──tenant pays──▶ PAID_ESCROW
    │                              │                          │
    └──rejected──▶ REJECTED        └──expires 72h──▶ EXPIRED  │
                                                              ▼
                              COMPLETED ◀──review window── MOVED_IN
                                                              │
                                              tenant confirms move-in
                                              → escrow RELEASED to landlord
```

All transitions happen in `BookingService` inside `@Transactional` methods. Invalid transitions throw `IllegalStateTransitionException` → HTTP 409.

---

## 4. API Design (REST)

Base URL: `/api/v1` — versioned from day one (industry standard).

### Auth
```
POST   /auth/register          → 201, sends email OTP
POST   /auth/verify-email
POST   /auth/login             → JWT access (15 min) + refresh token (7 d)
POST   /auth/refresh
POST   /auth/logout
```

### Properties
```
GET    /properties             ?city=&type=&minPrice=&maxPrice=&page=&size=
GET    /properties/{id}
POST   /properties             (LANDLORD)
PUT    /properties/{id}        (owner only)
DELETE /properties/{id}        (owner — soft delete → HIDDEN)
POST   /properties/{id}/media  (multipart, max 10 photos + 2 videos)
```

### Bookings
```
POST   /bookings                        (TENANT)
GET    /bookings/mine
PATCH  /bookings/{id}/accept            (LANDLORD)
PATCH  /bookings/{id}/reject            (LANDLORD)
PATCH  /bookings/{id}/confirm-move-in   (TENANT → releases escrow)
```

### Payments & Financials
```
POST   /payments/initialize/{bookingId} → Paystack checkout URL
POST   /payments/webhook                → Paystack calls this (verify signature!)
GET    /payments/{bookingId}/status
GET    /users/{id}/payment-methods      (TENANT)
POST   /users/{id}/payment-methods      
GET    /users/{id}/payout-methods       (LANDLORD)
POST   /users/{id}/payout-methods
GET    /users/{id}/performance          (LANDLORD) → Aggregated earnings & escrow stats
```

### Reviews, Verification, Admin
```
POST   /reviews                          (booking must be COMPLETED)
GET    /properties/{id}/reviews
POST   /verifications                    (LANDLORD, multipart)
PATCH  /admin/verifications/{id}         (ADMIN approve/reject)
GET    /admin/users · PATCH /admin/users/{id}/suspend
```

**Standard response envelope:**
```json
{ "success": true, "data": { ... }, "error": null, "timestamp": "..." }
```
Errors use RFC 7807-style problem details with a machine-readable `code`.

---

## 5. Backend File Structure (Spring Boot — layered, industry standard)

```
rentsure-api/
├── src/main/java/com/rentsure/
│   ├── RentSureApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java        # JWT filter chain, CORS
│   │   ├── OpenApiConfig.java         # Swagger/springdoc
│   │   └── StorageConfig.java
│   ├── common/
│   │   ├── exception/                 # GlobalExceptionHandler (@RestControllerAdvice)
│   │   └── dto/ApiResponse.java       # response envelope
│   ├── auth/
│   │   ├── AuthController.java
│   │   ├── AuthService.java
│   │   ├── JwtService.java
│   │   └── dto/ (LoginRequest, RegisterRequest, TokenResponse)
│   ├── user/
│   │   ├── User.java (entity) · UserRepository.java · UserService.java
│   ├── property/
│   │   ├── PropertyController.java · PropertyService.java
│   │   ├── Property.java · PropertyMedia.java · PropertyRepository.java
│   │   └── dto/ (PropertyRequest, PropertyResponse, PropertySearchCriteria)
│   ├── booking/
│   │   ├── BookingController.java · BookingService.java   # state machine lives here
│   │   ├── Booking.java · BookingStatus.java (enum)
│   ├── payment/
│   │   ├── PaymentController.java · PaystackClient.java · WebhookController.java
│   ├── agreement/ · review/ · verification/ · notification/
│   └── admin/
├── src/main/resources/
│   ├── application.yml                # profiles: dev, prod
│   └── db/migration/                  # Flyway: V1__init.sql, V2__bookings.sql ...
├── src/test/java/...                  # unit + @SpringBootTest integration tests
├── Dockerfile
├── docker-compose.yml                 # postgres + api for local dev
└── pom.xml
```

**Pattern:** package-by-feature (not by layer). Each feature folder owns its controller → service → repository → entity → DTOs. This scales far better than one giant `controllers/` folder.

---

## 6. Frontend File Structure (React Native + Expo)

```
rentsure-app/
├── app/                        # expo-router file-based navigation
│   ├── (auth)/login.tsx · register.tsx · verify.tsx
│   ├── (tenant)/
│   │   ├── index.tsx           # search/browse
│   │   ├── property/[id].tsx
│   │   └── bookings.tsx
│   ├── (landlord)/
│   │   ├── listings.tsx · listings/new.tsx · requests.tsx
│   └── _layout.tsx             # role-based route guard
├── src/
│   ├── api/                    # one file per backend feature
│   │   ├── client.ts           # axios instance + JWT interceptor + refresh logic
│   │   ├── auth.api.ts · properties.api.ts · bookings.api.ts
│   ├── components/             # reusable UI (PropertyCard, RatingStars, ...)
│   ├── hooks/                  # useAuth, useProperties (TanStack Query)
│   ├── store/                  # auth state (Zustand) — tokens in expo-secure-store
│   ├── types/                  # shared TS interfaces mirroring backend DTOs
│   └── utils/                  # formatters, validators
├── app.json
└── package.json
```

State strategy: **TanStack Query for server state, Zustand for auth/session only.** Don't put API data in global state.

---

## 7. Non-Functional Requirements (the "industry certified" checklist)

**Security**
- Passwords: BCrypt (strength 12). JWT: short-lived access + rotating refresh tokens stored in `expo-secure-store` (never AsyncStorage).
- All input validated server-side (`jakarta.validation` annotations on DTOs).
- Paystack webhook signature verification (HMAC-SHA512) — never trust the callback blindly.
- HTTPS only; rate limiting on auth endpoints (Bucket4j); SQL injection impossible via JPA parameterized queries.
- File uploads: whitelist MIME types, max sizes (photo 5 MB, video 50 MB), scan filename.

**Reliability & Data Integrity**
- Flyway migrations — schema changes are versioned, never manual.
- `@Transactional` on all state transitions; DB constraints as last line of defense.
- Idempotent payment webhook handling (check `paystack_ref` uniqueness before processing).

**Performance**
- Pagination on all list endpoints (default size 20, max 50).
- Indexed search columns; media served from CDN/object storage, never through the API.

**Quality & Process**
- API documented with Swagger (springdoc-openapi) — auto-generated, always current.
- Testing: JUnit 5 + Mockito for services, Testcontainers (real Postgres) for repositories, ≥70% coverage on service layer.
- Git: feature branches → PR review → main. Conventional commit messages.
- CI: GitHub Actions — build, test, lint on every PR.
- Environments: `dev` (docker-compose local) and `prod` profiles; secrets via env vars, never committed.

**Observability**
- Structured logging (SLF4J + Logback, JSON in prod).
- Spring Boot Actuator `/health` endpoint for uptime monitoring.

---

## 8. Suggested Build Order

| Sprint | Deliverable |
|---|---|
| 1 | Repo setup, docker-compose, Flyway V1, auth (register/login/JWT) |
| 2 | Property CRUD + media upload + search |
| 3 | Booking flow + state machine |
| 4 | Paystack escrow + webhook + agreements PDF |
| 5 | Reviews, verification badge, admin panel |
| 6 | Polish, testing, demo prep |
