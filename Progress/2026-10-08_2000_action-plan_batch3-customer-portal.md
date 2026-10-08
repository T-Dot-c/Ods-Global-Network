# Action Plan: Batch 3 Customer Portal & Security Baseline

> **DOCUMENT TYPE**: Action Plan (Batch 3)  
> **DATE**: 2026-10-08  
> **STAGE**: BATCH 3 — Customer Portal & Security Baseline  
> **BRANCH**: `batch3-customer-portal`  
> **SCOPE REFERENCE**: KPIs & SCOPES Module 3 (Customer Portal) & Module 10 (Security)  

---

## 1. High-Level Summary

Batch 3 implements the **Customer Portal** module from the authoritative scope document and begins the **Security Baseline** hardening:
1. **Database Schema Migrations**:
   - `012_remove_or_rotate_seeded_admin.sql`: Purges the default static seeded test admin credentials from the database to eliminate the deployment blocker documented in `PROJECT_STATUS.md`.
   - `013_create_audit_logs_table.sql`: Creates the relational audit log table to track key security events (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `PASSWORD_CHANGE`, `PROFILE_UPDATE`).
2. **Backend Server-Side RBAC & Middleware**:
   - Creates `Backend/src/middleware/auth.js` with `requireAuth` (verifies valid `ods_session` cookie) and `requireRole` (restricts access by user role, returning HTTP 403 on role mismatch).
   - Creates `Backend/src/services/auditService.js` to log security events.
3. **Customer Backend Endpoints**:
   - `GET /api/customer/profile`: Retrieves customer profile details (`full_name`, `email`, `phone`, `preferred_language`, `notification_preference`, `created_at`, `last_login_at`).
   - `PUT /api/customer/profile`: Validates and updates mutable customer profile fields (`full_name`, `phone`, `preferred_language`, `notification_preference`). `email` is strictly immutable.
   - `POST /api/customer/change-password`: Verifies existing password with `bcrypt.compare`, validates new password complexity (8–128 chars), hashes new password (12 rounds), updates database, resets lockout, and records an audit log entry.
   - Mounts routes under `/api/customer` in `server.js` with a dedicated rate limiter (10 req / 15 min).
4. **Frontend Customer Service & Dashboard Architecture**:
   - Creates `Frontend/src/services/customerService.ts` with typed API functions and unified error handling.
   - Enhances `AuthContext.tsx` with an `updateUser` method for zero-reload local session state synchronization.
   - Refactors `CustomerDashboard.tsx` into a stateful tabbed panel system:
     - **Overview Tab**: Live customer greetings, honest metric cards (0 Bookings, 0 Active Vouchers), quick navigation shortcuts, and honest empty activity feed.
     - **My Profile Tab**: Interactive profile view and edit form with real-time feedback.
     - **Security Tab**: In-portal self-service password update form with password strength indicator.
     - **Appointments Tab**: Honest empty state with vector calendar icon explaining upcoming features (Batch 7).
     - **Gift Cards Tab**: Honest empty state with vector gift icon explaining digital voucher management (Batch 7).
     - **Notifications Tab**: Honest empty state with vector bell icon explaining alert logs (Batch 9).
5. **Quality Assurance & Verification**:
   - Strict TypeScript compiler verification (`npx tsc --noEmit`).
   - Production bundle build (`npm run build`).
   - Automated endpoint testing matrix across 6 scenarios: (1) valid profile get/put, (2) invalid input rejection, (3) unauthenticated access (401), (4) unauthorized role access (403), (5) password change success, (6) password change incorrect current password rejection.
   - Comprehensive manual browser verification checklist.

---

## 2. Strict Constraints & Out-of-Scope Declarations

- **Explicitly Out of Scope**: Merchant and provider registration updates, KYC document uploads, payment processing, gift card purchase/redemption engine, and admin pages.
- **No Mock Data**: All metrics, activity feeds, and lists must display honest empty states until corresponding backend modules are deployed.
- **No New Dependencies**: Zero new npm packages added to `package.json`. All vector icons use existing `lucide-react`.
- **Directory Confinement**: All code confined to `./Frontend` and `./Backend`. `./resource` remains strictly read-only.
- **Branch Confinement**: Work performed exclusively on `batch3-customer-portal`. Zero pushes or merges to `main` until explicitly authorized.
