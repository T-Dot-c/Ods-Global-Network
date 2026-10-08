# Summary: Batch 3 Analysis, Risks & Dependencies

> **DOCUMENT TYPE**: Architectural Synthesis & Decision Matrix (Batch 3)  
> **DATE**: 2026-10-08  
> **SCOPE REFERENCE**: KPIs & SCOPES Module 3 (Customer Portal) & Module 10 (Security)  

---

## 1. Scope Synthesis

Batch 3 focuses on delivering the **Customer Portal** (Module 3) and initializing the **Security Architecture** (Module 10):
- Full Customer Profile view and edit capability.
- Self-service password updates with current password verification.
- Server-side RBAC and route authorization middleware (`requireAuth`, `requireRole`).
- Removal/rotation of seeded admin test credentials (`012_remove_or_rotate_seeded_admin.sql`).
- Audit logging infrastructure for customer security events (`013_create_audit_logs_table.sql`).
- Customer dashboard shell with interactive tab routing and honest empty states for appointments, gift cards, and notifications.

---

## 2. Risk Assessment & Mitigation

| Risk ID | Risk Description | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **R-1** | **Admin Lockout after Seed Removal** | High | Ensure admin accounts can be provisioned via an explicit CLI script (`node scripts/seed-admin.js`) reading from `.env` before running migration 012 in environments that need an admin. |
| **R-2** | **Profile Hijacking / Email Mutation** | High | Lock `email` as strictly immutable in the profile update endpoint. Changes to email must require a separate, authenticated verification workflow. |
| **R-3** | **Unauthenticated Profile Editing** | High | Enforce `requireAuth` and `requireRole('customer', 'admin')` middleware on all customer API routes. Reject missing cookies with HTTP 401 and wrong roles with HTTP 403. |
| **R-4** | **Stale Context State in Frontend** | Medium | Extend `AuthContext` to expose `updateUser(updatedFields: Partial<AuthUser>)` so that when a user edits their name or preferences, the topbar and context sync immediately without requiring full page reload. |
| **R-5** | **Misleading Claims on Future Features** | Medium | Enforce strict honest empty states across Appointments (Batch 7), Gifting (Batch 7), and Notifications (Batch 9). |

---

## 3. Proposed Build Order

1. **Database Layer (Migrations 012 & 013)**:
   - `012_remove_or_rotate_seeded_admin.sql`: Remove default test admin account.
   - `013_create_audit_logs_table.sql`: Create structured audit trail table for login, password change, and profile update events.
2. **Backend Security Middleware & Audit Service**:
   - Create `Backend/src/middleware/auth.js` (`requireAuth`, `requireRole`).
   - Create `Backend/src/services/auditService.js` (logs events to `audit_logs`).
3. **Backend Customer API Routes (`Backend/src/routes/customer.js`)**:
   - `GET /api/customer/profile`: Return full customer profile data.
   - `PUT /api/customer/profile`: Update editable customer fields (`full_name`, `phone`, `preferred_language`, `notification_preference`).
   - `POST /api/customer/change-password`: Validate current password, enforce bcrypt complexity, hash new password, reset lockout, write audit log.
   - Mount under `/api/customer` in `server.js` with rate limiting.
4. **Frontend Customer Service (`Frontend/src/services/customerService.ts`)**:
   - Typed fetch wrapper with structured error handling for profile retrieval, profile updates, and password changes.
5. **Frontend Dashboard Architecture & Tabbed Panels**:
   - Update `AuthContext.tsx` with `updateUser` helper.
   - Refactor `CustomerDashboard.tsx` to handle stateful tab switching (`overview`, `profile`, `security`, `appointments`, `giftcards`, `notifications`).
   - Build `CustomerProfileTab.tsx` (view/edit profile) and `CustomerSecurityTab.tsx` (password change).
   - Wire honest empty state views for appointments, gift cards, and notifications.
6. **Testing & Verification**:
   - Run PostgreSQL migration checks.
   - Execute endpoint verification suite (valid, invalid, unauthorized, wrong role).
   - Execute TypeScript compiler checks and production bundle build (`npm run build`).

---

## 4. Open Questions for User Approval

1. **Seeded Admin Account Removal (Migration 012)**:
   - Should Migration 012 delete `admin@odsglobal.net` directly from the database, or should it update the password to an environment variable `ADMIN_INITIAL_PASSWORD` if provided? *(Recommendation: Delete the default seeded admin in migration 012, and provide a standalone `npm run seed:admin` script that reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` for local testing.)*
2. **Profile Editability Scope**:
   - Are `full_name`, `phone`, `preferred_language`, and `notification_preference` the exact mutable fields for the customer profile in Batch 3, with `email` kept read-only? *(Recommendation: Yes, keep `email` immutable to prevent account hijacking without a dedicated email verification flow.)*
3. **Audit Log Scope**:
   - Is logging `LOGIN_SUCCESS`, `LOGIN_FAILED`, `PASSWORD_CHANGE`, and `PROFILE_UPDATE` in `audit_logs` sufficient for Module 10 KPI baseline in Batch 3? *(Recommendation: Yes, this covers all critical identity events for Batch 3.)*
