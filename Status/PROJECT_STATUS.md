# ODS Global Network — Current Project Status

> **LAST UPDATED**: 2026-10-08  
> **CURRENT STAGE**: BATCH 3 Complete — Customer Portal & Security Baseline (Module 3 & Initial Module 10)  
> **OVERALL HEALTH**: ON TRACK 🟢  

---

## 1. Directory Structure & Roles

| Folder | Status | Role & Duty |
| :--- | :--- | :--- |
| **`./resource`** | ✅ Locked | Read-only reference of legacy architecture, schemas, and routes. Never modified. |
| **`./Frontend`** | 🚀 Active | Main client application (React 18 + TypeScript + Vite). Home, Login, Register, Public Info pages, and Customer Dashboard with live Profile and Security tabs. |
| **`./Backend`** | 🚀 Active | Main server API workspace (Express.js + PostgreSQL 18 with connection pooling, bcrypt, RBAC middleware, audit logging, and secure session cookies). |
| **`./System Directive`** | ✅ Active | Non-negotiable architectural, security, design, and domain mandates. |
| **`./Progress`** | ✅ Active | Stores all implementation plans, roadmap phase tracking, and directive outputs. |
| **`./Assets`** | ✅ Organized | Standardized brand vectors, rasters, variable web fonts, partner badges, and official PDF manual. |
| **`./Status`** | ✅ Active | Real-time progress dashboard and completed milestone logs. |

---

## 2. Completed Milestones

### BATCH 01: System Restructure, Frontend Pages & Auth/RBAC Foundation
- [x] Initialized modern Vite + React + TypeScript in `./Frontend` and Express + PostgreSQL 18 in `./Backend`.
- [x] Configured official luxury design tokens (`#0F285B` Deep Navy, `#BE9B49` Gold) and typography in `./Frontend/src/styles/`.
- [x] Implemented official 17-section `HomePage.tsx`, streamlined `LoginPage.tsx`, and multi-role dynamic `RegisterPage.tsx`.
- [x] Executed migrations 001 through 009 on PostgreSQL 18.
- [x] Implemented core session auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`) with `ods_session` HttpOnly cookie.
- [x] Built initial role dashboard shells (`CustomerDashboard.tsx`, `MerchantDashboard.tsx`, `ProviderDashboard.tsx`, `AdminDashboard.tsx`) with `DashboardLayout.tsx`.

### BATCH 02: Public Informational & Intake Pages (`/company`, `/support`, `/partner-with-us`)
- [x] Database migrations 010 (`support_requests`) and 011 (`partners`).
- [x] Backend intake endpoints (`POST /api/support` with reference `ODS-REQ-XXXXXXXX` and `POST /api/partners`) with honeypot validation.
- [x] Frontend public pages: `CompanyPage.tsx`, `SupportPage.tsx`, `PartnerWithUsPage.tsx` and centralized `publicService.ts`.
- [x] Fully integrated Header/Footer navigation, search index, and mobile drawer targets.

### BATCH 03: Customer Portal & Security Baseline (Module 3 & Initial Module 10)
- [x] **Database Migrations (012 & 013)**:
  - `012_purge_seeded_admin_and_update_addresses.sql`: Purged default test admin (`admin@odsglobal.net`), updated `addresses.entity_type` check constraint to include `customer`, and added unique index `idx_addresses_customer_unique` on `(entity_type, entity_id)` for customer addresses.
  - `013_create_audit_logs_table.sql`: Created `audit_logs` table with composite and single column indices (`user_id`, `action`, `created_at`).
- [x] **Backend Security & Middleware (`Backend/src/middleware/auth.js`)**:
  - Implemented `requireAuth` verifying `ods_session` JWT cookie against live DB active status.
  - Implemented `requireRole(...roles)` returning HTTP 403 on role mismatch.
  - Implemented asynchronous audit service (`Backend/src/services/auditService.js`) logging auth and customer profile/password events.
  - Hardened server startup: fails immediately if `JWT_SECRET` is unset or shorter than 32 chars across all environments.
  - Added dedicated customer route rate limiter (30 req / 15 min).
  - Updated registration transaction to persist customer address (`country`, `city`) in the same atomic transaction.
- [x] **Customer API Endpoints (`Backend/src/routes/customer.js`)**:
  - `GET /api/customer/profile`: Returns customer profile data and primary address from DB.
  - `PUT /api/customer/profile`: Updates name, phone, preferences (`language_preference`, `notification_preference`), and updates/inserts address record via update-then-insert.
  - `POST /api/customer/change-password`: Validates non-empty `current_password`, enforces 8-128 char policy on `new_password`, verifies against bcrypt hash, updates password, and writes to audit log.
- [x] **Frontend Customer Portal (`Frontend/src/pages/dashboards/`)**:
  - Centralized customer API service (`Frontend/src/services/customerService.ts`).
  - Added `updateUser` to `AuthContext.tsx` to keep topbar and profile in sync immediately without full page reloads.
  - Replaced mock numeric stat cards and internal "Scheduled for Batch N" labels with honest empty states and "Not available yet" messaging.
  - Implemented live `CustomerProfileTab.tsx` with full edit form, validation, and read-only email.
  - Implemented live `CustomerSecurityTab.tsx` with live password strength meter and uniform feedback.
  - Upgraded `DashboardLayout.tsx` and `CustomerDashboard.tsx` to support tab switching across Overview, Profile, Security, Bookings, Orders, and Settings.
- [x] **Admin & Database Operations Scripts**:
  - `Backend/scripts/create-admin.js`: CLI script for securely creating administrative users with role validation.
  - `Backend/scripts/setup-limited-db-user.sql`: Production SQL script to provision least-privilege `ods_app` database user.

---

## 3. Verification & Compliance

- **PostgreSQL Migrations**: 13 of 13 migrations applied to `ods_global.net` on PostgreSQL 18.
- **Audit Logging**: Verified audit log insertion on customer registration, login, logout, profile update, and password changes.
- **TypeScript Compiler**: `npx tsc --noEmit` exited with 0 errors.
- **Production Bundle**: `npm run build` completed with exit code 0 (1,616 modules transformed in 2.78s).
- **Backend Endpoints**: Syntax checked with `node -c` (exit code 0); endpoint verification test suite created in `test-batch3-endpoints.js`.
- **Folder Confinement**: 100% of code and documentation strictly confined within the 7 designated root directories (`./Frontend`, `./Backend`, `./System Directive`, `./Progress`, `./Assets`, `./Status`, `./resource`).
- **Path Portability**: All code imports, links, and documentation paths are strictly relative to `Ods-Global-Network`.

---

## 4. Release Blockers & Security Notes

1. **Database Superuser Connection (Open)**:
   - The application currently connects as the PostgreSQL superuser.
   - Script `Backend/scripts/setup-limited-db-user.sql` has been authored to create a dedicated `ods_app` user with limited grants. This must be executed and `.env` credentials updated prior to production deployment.
2. **Admin UI Access (Open until Module 8)**:
   - The default seeded admin was purged in migration 012. Admin users can now be created via `Backend/scripts/create-admin.js`.
   - Admin login is functional via `/login`, but the full Admin management portal is scheduled for Batch 8 (Module 8).
3. **Password Change Session Invalidation (Logged Enhancement)**:
   - Old `ods_session` JWT cookies remain valid until expiration (7 days) after a password change because token revocation/versioning is not yet implemented.
4. **Rate Limiting on Password Endpoint (Logged Enhancement)**:
   - `/api/customer/change-password` is covered by the general customer router rate limit (30 req / 15 min), but does not yet have a dedicated stricter brute-force limit.
5. **Intake Visibility (Open until Batch 8 & 9)**:
   - Support requests and partnership inquiries remain visible only via direct database queries until the Admin Dashboard (Batch 8) and Notification Engine (Batch 9) are built.

---

## 5. Immediate Next Steps

1. **Batch 4: Merchant & Service Provider Onboarding (Module 4 & 5)**:
   - KYC document upload endpoint with file type and size restrictions.
   - Merchant and Service Provider profile management and operating hours.
2. **Batch 6: Service Catalog & Offerings (Module 6)**:
   - Service listing, category tagging, and pricing configuration.
3. **Batch 7: Appointment Booking Engine (Module 7)**:
   - Availability slot generation, booking creation, and collision prevention.
