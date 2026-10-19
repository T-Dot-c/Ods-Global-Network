# Implementation Plan: Batch 5 — Email Foundation, Account Recovery, and Session Invalidation

**Project:** ODS Global Network  
**Created:** 2026-10-13 14:00 (Revision 10: 2026-10-16 12:25)  
**Status:** Pending Approval  

---

## Original User Prompt

### Kickoff Prompt
*(first kickoff message not available)*

> Continuation of the Batch 5 kickoff. This is the rest of the prompt, which was
> cut off. Treat it as binding.
> 
> OPEN DECISIONS (recommend one for each, with reasons, then wait for my answer)
> 1. Unverified users: blocked from login, blocked from sensitive actions only, or
>    not blocked.
> 2. Session invalidation mechanism: token_version vs sessions table.
> 3. Dev mail strategy: SMTP catcher (Mailpit or Ethereal) vs console fallback.
> 4. Include KYC approve/reject emails as the first consumer of the email sender?
>    (Batch 4 deliberately left them out. Full templates and preferences remain
>    Batch 11.)
> 
> TESTING
> - New test-batch5-endpoints.js in the style of test-batch4-endpoints.js: own
>   fixtures, tracked IDs, owner-level teardown (TEST_ADMIN_DB_*), dev-database
>   guard, ALLOW_DESTRUCTIVE_TESTS=1. Tests must not mutate existing dev data.
> - Must cover: token expiry, reuse, tampering, a token for account A used on
>   account B, an older token after a newer one is requested, enumeration-safe
>   responses (forgot-password and registration), rate limits (per IP and per
>   email), old sessions rejected after reset and after change on login, /me and
>   the admin routes, new password works and old one fails, the verification
>   flow including resend limits, and that no token or link appears in logs.
> - Re-run test-batch3-endpoints.js and test-batch4-endpoints.js as regression.
> - Run the app as ods_app throughout.
> 
> RULES FOR THE WHOLE BATCH
> - Report raw command output, not summaries. Use node --check once per file.
> - Do not weaken a security guard to make a test pass. If a test and a guard
>   conflict, stop and tell me.
> - Do not mark anything complete before my human checks (UI verification and the
>   approval block).
> - No hardcoded credentials, and nothing secret in committed files, including
>   .env.example (use placeholders).
> - Implement phase by phase, with a report and evidence after each phase.
> - At the end, add a Commit Sync Record to the plan and update
>   Status/PROJECT_STATUS.md. Do not commit or push until I say so.
> 
> Start with the baseline check and the plan. Wait for my approval.

### Revision Directives (Binding Constraints)
> 1. Reordered Phase Dependencies: No phase relies on an artifact created in a later phase. P1 (Foundation: Migration 015, emailService, sessionService with resolveSession/revokeUserSessions, owner script); P2 (Session Invalidation: async requireAuth, minimal login JWT { id, token_version }, change-password, documents extractOptionalAuth, retire verifySession); P3 (Account Recovery: forgot/reset password); P4 (Registration & Verification: register, resend, verify-email, requireVerifiedEmail, Batch 4 fixture verification); P5 (Frontend); P6 (Full Suite & Regressions).
> 2. Dual Child Server Harness: Child #1 (port 3005, generous limits) runs functional tests; Child #2 (port 3005, strict limits) runs rate limit and SMTP-down tests.
> 3. Robust SMTP-Down Tolerance: Registration, forgot-password, resend, and change-password never await email sending; they fire non-blocking in background, continuing to return normal success responses (201 / 200) when SMTP is unreachable, logging only sanitized error codes without crashing or leaking data.
> 4. Test Harness Log Assertion (T1d): Asserts no raw token, hash, password, `#token=` substring, verification/reset URL, or SMTP credential appears in captured server logs.
> 5. DashboardShell Resend: Calls public `POST /api/auth/resend-verification` passing `{ email: user.email }` with a 120s visual countdown cooldown timer.
> 6. Migration 015 & Rollback: No BEGIN/COMMIT statements; `migrate.js` wraps executions in transactions. Guarded DO-block includes `table_schema = current_schema()`.
> 7. `FRONTEND_ORIGIN`: Set to `http://localhost:5173` matching Vite's local dev server; SMTP (`127.0.0.1:1025`) and Mailpit (`http://127.0.0.1:8025`) remain on `127.0.0.1`.
> 8. Regression Exit Gates: Every milestone phase (Phases 2, 3, and 4) must pass clean regression runs of `test-batch3-endpoints.js` (17/17) and `test-batch4-endpoints.js` (96/96) before proceeding.

---

## Scope Traceability Matrix

Every file touched in Batch 5 maps directly to an authoritative requirement. Frontend forgot, reset, and verification views are strictly in scope for human UI checks; no out-of-scope frontend files will be touched.

| Scope Item | Description | Files In Scope & Status |
| :--- | :--- | :--- |
| **B5-MIG** | Migration 015 & owner script: `token_version`, token hash columns, indexes, ods_app grants, guarded DO-block grandfathering | `Backend/src/database/migrations/015_email_verification_and_session_invalidation.sql` (NEW - no BEGIN/COMMIT), `Backend/src/database/rollbacks/rollback_015.sql` (NEW - in rollbacks/ without BEGIN/COMMIT), `Backend/scripts/migrate-as-owner.js` (NEW) |
| **B5-ENV** | Nodemailer dependency, environment configuration, placeholders, startup guards | `Backend/package.json` (MODIFIED), `Backend/package-lock.json` (MODIFIED), `Backend/.env.example` (MODIFIED), `Backend/src/server.js` (MODIFIED) |
| **B5-MAIL** | Transactional email delivery service, Mailpit SMTP transporter (127.0.0.1:1025), header sanitization, zero-secret logging, non-blocking fire-and-forget dispatch | `Backend/src/services/emailService.js` (NEW) |
| **B5-SESS** | Session invalidation via `token_version`, minimal JWT payload ({ id, token_version }), fail-closed async DB verification, shared `resolveSession` and `revokeUserSessions`, retirement of local `verifySession` | `Backend/src/services/sessionService.js` (NEW), `Backend/src/middleware/auth.js` (MODIFIED), `Backend/src/routes/customer.js` (MODIFIED), `Backend/src/routes/auth.js` (MODIFIED), `Backend/src/routes/documents.js` (MODIFIED) |
| **B5-RECOV** | Forgot & reset password endpoints, cryptographic token hashing, instant response, non-blocking email dispatch, silent per-email throttling, reset verifies email and clears verification tokens | `Backend/src/routes/auth.js` (MODIFIED), `Backend/src/routes/recovery.placeholder.js` (DEPRECATED / RETIRED) |
| **B5-VERIF** | Email verification POST endpoint, respond-first resend throttling, cooldowns, daily caps, `requireVerifiedEmail` guard, test-batch4 fixture verification | `Backend/src/middleware/auth.js` (MODIFIED), `Backend/src/routes/auth.js` (MODIFIED), `Backend/src/routes/merchant.js` (MODIFIED), `Backend/src/routes/provider.js` (MODIFIED), `Backend/test-batch4-endpoints.js` (MODIFIED - line 135 fixture verification) |
| **B5-FRONT** | User interfaces: ForgotPassword, ResetPassword, VerifyEmail, RegisterPage UX ("check email"), DashboardShell banner, AuthContext types & `refreshUser` | `Frontend/src/pages/ForgotPasswordPage.tsx` (MODIFIED), `Frontend/src/pages/ResetPasswordPage.tsx` (MODIFIED), `Frontend/src/pages/VerifyEmailPage.tsx` (NEW), `Frontend/src/pages/RegisterPage.tsx` (MODIFIED), `Frontend/src/pages/dashboards/DashboardShell.tsx` (MODIFIED), `Frontend/src/context/AuthContext.tsx` (MODIFIED), `Frontend/src/App.tsx` (MODIFIED), `Frontend/src/services/recoveryService.ts` (MODIFIED), `Frontend/src/services/publicService.ts` (MODIFIED) |
| **B5-TEST** | Batch 5 automated verification suite with dual child server lifecycle on port 3005, Mailpit API integration, tracked fixtures, owner teardown | `Backend/test-batch5-endpoints.js` (NEW), `Backend/test-batch4-endpoints.js` (MODIFIED - line 135 fixture verification in Phase 4) |

*(Note: `Frontend/src/pages/LoginPage.tsx` requires zero code changes as it passes `data.user` directly into `login(data.user)`).*

---

## Phase Dependency Matrix

To ensure architectural integrity, phases are strictly sequenced so no phase relies on an artifact created in a later phase:

| Phase | Core Deliverables | Prerequisites & Artifacts Consumed | Why This Sequence is Mandatory & Regression Exit Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Migration 015, `migrate-as-owner.js`, `emailService.js`, `sessionService.js` (`resolveSession`, `revokeUserSessions`) | None (PostgreSQL baseline) | Provides database schema (`token_version`, token columns), mail transporter, and core session helpers needed by all subsequent phases. |
| **Phase 2** | Session Invalidation: async `requireAuth` (try/catch), minimal login JWT payload (`{ id, token_version }`), DB-resolved response `is_email_verified`, retire local `verifySession`, `POST /api/customer/change-password`, `documents.js` `extractOptionalAuth` refactor | Phase 1 (`sessionService.js`, Migration 015) | Secures all existing routes with fresh DB resolution and version checking before introducing new public auth endpoints. **Exit criteria includes clean regression runs of `test-batch3` (17/17) and `test-batch4` (96/96)**. |
| **Phase 3** | Account Recovery: `POST /api/auth/forgot-password` (instant response, non-blocking email), `POST /api/auth/reset-password` (clears tokens, revokes sessions, sets `is_email_verified = true`) | Phase 1 (`sessionService.js`, `emailService.js`), Phase 2 (`requireAuth`) | Uses `revokeUserSessions` and `emailService` established in Phase 1; relies on Phase 2 session invalidation to reject stale tokens. **Exit criteria includes clean regression runs of `test-batch3` (17/17) and `test-batch4` (96/96)**. |
| **Phase 4** | Registration & Email Verification: `POST /api/auth/register` (anti-enumeration, UUID, non-blocking email), `POST /api/auth/resend-verification`, `POST /api/auth/verify-email`, `requireVerifiedEmail` middleware, `test-batch4-endpoints.js` line 135 fixture verification | Phase 1 (`emailService.js`), Phase 2 (`sessionService.js`), Phase 3 (`auth.js` rate limiting patterns) | Protects sensitive routes with verified email enforcement; updates Batch 4 fixture verification at the moment `requireVerifiedEmail` is mounted. **Exit criteria includes clean regression runs of `test-batch3` (17/17) and `test-batch4` (96/96)**. |
| **Phase 5** | Frontend Interfaces: `AuthContext` (`refreshUser`), `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage`, `DashboardShell` banner | Phases 1–4 (All Backend API Endpoints Live) | Frontend views wire directly to complete, tested backend endpoints. |
| **Phase 6** | Full Verification: End-to-end test suite (`test-batch5-endpoints.js`), regression suites (Batch 3 & Batch 4), dev account preservation assertion, Commit Sync | Phases 1–5 | Validates the platform as an integrated whole under least-privilege `ods_app`. |

---

## Architectural & Security Specifications

### 1. Decisions Alignment
- **D-1 (Unverified Users)**: Users are **not blocked from login**. They can sign in, query `/api/auth/me`, and access their dashboard. They are blocked from sensitive operations only through a single `requireVerifiedEmail` middleware.
  - **Protected Endpoints (Exact List)**:
    1. Authenticated `POST /api/documents/upload`: Blocks sensitive document uploads (including KYC submissions) for unverified users. An in-app banner guides newly registered merchants and providers to verify their email before submitting official compliance documents.
    2. `PUT /api/merchant/profile`: Blocks compliance profile edits that trigger `COMPLIANCE_RESET` until verified.
    3. `PUT /api/provider/profile`: Blocks compliance profile edits that trigger `COMPLIANCE_RESET` until verified.
  - **Explicitly Excluded Endpoints**:
    - Anonymous `POST /api/documents/upload` (support/partner intake never requires user email verification).
    - `GET /api/documents/:id/view` (governed by tenancy/owner/admin RBAC checks).
    - `PUT /api/customer/profile` (basic customer profile edits remain accessible).
    - `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/resend-verification`, `POST /api/auth/verify-email`, `POST /api/customer/change-password`, anonymous `/api/partners` and `/api/support`.
  - **Role Exemption**: `admin` and `super_admin` are explicitly exempt from `requireVerifiedEmail`.
- **D-2 (Session Invalidation, Minimal Token Payload & DB Resolution)**: Implemented using `token_version INT NOT NULL DEFAULT 1` on `users` managed via `sessionService.js`.
  - **Minimal JWT Payload**: Login mints a minimal JWT cookie containing ONLY `{ id, token_version }`. The token never carries `role`, `approval_status`, or `is_email_verified`.
  - **Legacy Token Rejection**: Tokens issued prior to Batch 5 lack the numeric `token_version` claim and are rejected with 401 across all authenticated endpoints, forcing all sessions to re-authenticate cleanly.
  - **Fresh DB Resolution**: DB values always supersede JWT claims for authorization decisions. `resolveSession(token)` resolves fresh state from PostgreSQL on every authenticated request, dynamically computing the effective role and approval status.
- **D-3 (Dev Mail Strategy)**: **Mailpit** (`127.0.0.1:1025` SMTP, `http://127.0.0.1:8025/api/v1/messages` HTTP API).
  - Startup Probe: `test-batch5-endpoints.js` probes `http://127.0.0.1:8025/api/v1/info` at startup. If unreachable, fails fast:
    `[FATAL] Mailpit SMTP catcher is not reachable on http://127.0.0.1:8025. Please start Mailpit (D:\Ods Global\Tools\mailpit\start-mailpit.ps1).`
  - Console fallback: Permitted ONLY when `NODE_ENV === 'development'` AND `SMTP_HOST` is unset.
- **D-4 (KYC Emails)**: Excluded from Batch 5. Reserved for Batch 11.
- **D-5 (Password Reset Verifies Email & Clears Pending Tokens)**: Successful password reset via `POST /api/auth/reset-password` marks `is_email_verified = TRUE` and clears `email_verification_token` and `email_verification_expires`, as receipt and redemption of the reset token confirms email control.

---

### 2. Comprehensive Session Invalidation Matrix & `resolveSession`

#### Shared Module: `Backend/src/services/sessionService.js`
- **Module-Load Security Guard**: Checks `JWT_SECRET` immediately at load time, identical to `Backend/src/middleware/auth.js`:
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('[FATAL SECURITY ERROR] JWT_SECRET is missing. Server must not run without JWT_SECRET.');
    process.exit(1);
  }
  ```
Exports:
1. `resolveSession(token, poolInstance = pool)`:
   - If token is missing, returns `null`.
   - Decodes JWT via `jwt.verify(token, JWT_SECRET)`. If verification throws, returns `null`.
   - Requires numeric `decoded.token_version` claim (`typeof decoded.token_version === 'number'`); returns `null` if missing (rejects legacy pre-Batch-5 tokens).
   - Executes parameterized PostgreSQL query:
     ```sql
     SELECT 
       u.id, 
       u.email, 
       u.full_name, 
       u.phone,
       u.role, 
       u.is_active, 
       u.is_email_verified, 
       u.token_version, 
       u.last_login_at,
       a.admin_level,
       m.approval_status AS merchant_approval_status,
       p.approval_status AS provider_approval_status
     FROM users u
     LEFT JOIN admins a ON a.user_id = u.id AND u.role = 'admin'
     LEFT JOIN merchants m ON m.user_id = u.id AND u.role = 'merchant'
     LEFT JOIN providers p ON p.user_id = u.id AND u.role = 'provider'
     WHERE u.id = $1;
     ```
   - Validation & Failsafe:
     - If row not found, or `row.is_active !== true`, returns `null`.
     - If `row.token_version !== decoded.token_version`, returns `null` (session invalidated).
   - Compute Effective Role & Approval Status:
     - `effectiveRole = (row.role === 'admin' && row.admin_level === 'super_admin') ? 'super_admin' : row.role;` (computed exactly as login does).
     - `approvalStatus = (row.role === 'merchant') ? (row.merchant_approval_status || 'pending') : (row.role === 'provider') ? (row.provider_approval_status || 'pending') : 'approved';` (read fresh from DB per request, identical to `getApprovalStatus` logic; never stored in or taken from the token).
   - Route Consumers of `approval_status` (per A1 analysis):
     - `Backend/src/routes/auth.js:410` (Login response body: `{ id, email, role, full_name, approval_status, is_email_verified }`).
     - `Backend/src/routes/auth.js:451` (`GET /api/auth/me` response body: returns DB-resolved `user` with `approval_status`, consumed by Frontend `AuthContext`, `MerchantDashboard.tsx`, and `ProviderDashboard.tsx` for compliance alerts and upload gating).
     - Available on `req.user.approval_status` for all downstream controllers mounted behind `requireAuth`.
   - Populates every `req.user` field identified in Evidence A1:
     - `req.user = { id, email, full_name, phone, role: effectiveRole, base_role: row.role, is_active: Boolean(row.is_active), is_email_verified: Boolean(row.is_email_verified), token_version: row.token_version, approval_status: approvalStatus, last_login_at: row.last_login_at }`.
   - Verification of `admin.js:136` Usage:
     - In `admin.js:136`, `const adminUser = req.user;` is declared.
     - `adminUser.id` is read at line 168 (reviewer ID passed to KYC decision query `$3`) and at line 222 (audit logging `userId: adminUser.id`).
     - **Confirmed**: `resolveSession` provides `id` on `req.user`, so `adminUser.id` resolves directly to the authenticated admin's user UUID.
   - Local `verifySession` Helper Retirement & `GET /api/auth/me` Allowlist:
     - The local `verifySession(req)` helper in `Backend/src/routes/auth.js` is completely retired.
     - `GET /api/auth/me` is protected by `requireAuth` middleware.
     - `GET /api/auth/me` returns an **explicit allowlist** only: `{ id, email, full_name, phone, role, last_login_at, approval_status, is_email_verified }`, **never** returning `req.user` as a whole (omitting `token_version`, `is_active`, and `base_role`).
   - Wrapped in try/catch: any DB error, connection error, or unexpected exception returns `null` (fail closed 401), **never throwing** into Express or callers.
2. `revokeUserSessions(userId, client = pool)`:
   - Executes `UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE id = $1 RETURNING token_version;`.
3. `isVerifiedOrExempt(user)` (Shared Pure Verification Helper):
   - Defined in `Backend/src/middleware/auth.js` and exported:
     ```javascript
     function isVerifiedOrExempt(user) {
       if (!user) return false;
       if (['admin', 'super_admin'].includes(user.role)) return true;
       return Boolean(user.is_email_verified);
     }
     ```
   - `requireVerifiedEmail(req, res, next)` middleware wraps this helper: calls `if (isVerifiedOrExempt(req.user)) return next();` else returns 403 `EMAIL_NOT_VERIFIED`.
   - `Backend/src/routes/documents.js` upload handler directly calls `isVerifiedOrExempt(authUser)` to evaluate verification before Multer parses the multipart body or saves files to disk.

| Check Location | File & Line | Guard Used | How `resolveSession` is Used | Behavior on Mismatch / Inactive |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Middleware (`requireAuth`)** | `Backend/src/middleware/auth.js:19-35` | `async requireAuth` | Calls `const user = await resolveSession(req.cookies?.ods_session)`. If `!user`, returns 401. Populates `req.user = user` with all fields per A1. Wrapped in try/catch; any error returns 401 (fail closed). | Returns `401 Unauthorized` (`"Session expired, revoked, or invalid. Please log in again."`). |
| **Session Profile (`/me`)** | `Backend/src/routes/auth.js:425` | `requireAuth` + route handler | Protected by `requireAuth` (resolved via `resolveSession`). Replaces retired `verifySession`. Returns explicit allowlist: `{ id, email, full_name, phone, role, last_login_at, approval_status, is_email_verified }`. Never returns `req.user` as a whole (omits `token_version`, `is_active`, `base_role`). | Returns `401 Unauthorized` if session invalid, expired, revoked, or user inactive. |
| **Customer Routes** | `Backend/src/routes/customer.js:20, 75, 220` | `requireAuth` | Checked via `requireAuth` calling `resolveSession`. | Returns `401 Unauthorized`. |
| **Merchant Routes** | `Backend/src/routes/merchant.js:18-19, 24` | Router-level `requireAuth` + `requireRole('merchant')` | Checked via router-level `requireAuth` calling `resolveSession`. | Returns `401 Unauthorized`. |
| **Provider Routes** | `Backend/src/routes/provider.js:18-19, 24` | Router-level `requireAuth` + `requireRole('provider')` | Checked via router-level `requireAuth` calling `resolveSession`. | Returns `401 Unauthorized`. |
| **Admin Console Routes** | `Backend/src/routes/admin.js:31, 39, 133` | Router-level `requireAuth` + `requireRole` | Checked via router-level `requireAuth` calling `resolveSession`. `super_admin` elevation read fresh from DB. Provides `adminUser.id` for KYC decision review and audit log. | Returns `401 Unauthorized`. |
| **Document View Route** | `Backend/src/routes/documents.js:305` | Route-level `requireAuth` | Checked via `requireAuth` calling `resolveSession`. | Returns `401 Unauthorized`. |
| **Document Upload (Authenticated Path)** | `Backend/src/routes/documents.js:48-95` | `extractOptionalAuth` &rarr; `resolveSession` | Calls `const authUser = await resolveSession(token)`. If present and valid, checks `requireVerifiedEmail(req, res)` BEFORE `uploadMiddleware` (Multer) parses body or writes disk. | If unverified, returns `403 Forbidden` (`EMAIL_NOT_VERIFIED`). |
| **Document Upload (Anonymous Fallback)** | `Backend/src/routes/documents.js:48-95` | `extractOptionalAuth` fallback | **Single Anonymous Fallback Rule**: If `resolveSession` returns `null` (missing, expired, stale version, inactive user), request falls back to anonymous mode. Bypasses `requireVerifiedEmail`. If purpose is anonymous (`support_attachment`), returns 201; if authenticated KYC purpose, returns 400. | Rejects missing/stale session on KYC upload (400); allows anonymous support upload (201). |
| **Login (`/login`)** | `Backend/src/routes/auth.js:380-415` | Session Minting | Queries DB for user credentials and `token_version`. Signs minimal JWT payload: `{ id: user.id, token_version: user.token_version }`. Builds response body separately: `{ id, email, role: effectiveRole, full_name, approval_status, is_email_verified }`. The token never carries role, approval_status, or is_email_verified. | Fresh session issued with current `token_version`. Pre-Batch-5 tokens lacking `token_version` rejected. |
| **Logout (`/logout`)** | `Backend/src/routes/auth.js:461` | Session Clearance | Clears `ods_session` cookie via `res.clearCookie`. | Cookie cleared. |

---

### 3. Token Lifecycle & Storage Architecture

| Property | Password Reset Token | Email Verification Token | Justification |
| :--- | :--- | :--- | :--- |
| **Raw Token Entropy** | 32 bytes cryptographically secure random (`crypto.randomBytes(32).toString('hex')` &rarr; 64 chars) | 32 bytes cryptographically secure random (`crypto.randomBytes(32).toString('hex')` &rarr; 64 chars) | 256 bits of entropy prevents brute-force guessing. |
| **Storage Mechanism** | **Hash-only**: SHA-256 hex digest (`crypto.createHash('sha256').update(rawToken).digest('hex')`) | **Hash-only**: SHA-256 hex digest (`crypto.createHash('sha256').update(rawToken).digest('hex')`) | Database compromise does not leak actionable tokens. |
| **Expiry Value** | **15 minutes** | **24 hours** | Tight reset window; reasonable verification window across time zones. |
| **Single-Use Enforcement** | Token cleared atomically upon reset (`password_reset_token = NULL, password_reset_expires = NULL, email_verification_token = NULL, email_verification_expires = NULL, is_email_verified = TRUE`). | Token cleared atomically upon verification (`email_verification_token = NULL, email_verification_expires = NULL, is_email_verified = TRUE`). | Prevents replay attacks. |
| **Older Token Invalidation** | Requesting a new reset token overwrites prior token hash and expiry immediately. | Requesting a resend overwrites prior token hash and expiry immediately. | Only the most recently issued token is ever valid. |
| **Exchange Mechanism** | **POST body exchange only** (`{ "token": "...", "newPassword": "..." }`). Token received via URL fragment `#token=...`. | **POST body exchange only** (`{ "token": "..." }` to `POST /api/auth/verify-email`). Token received via URL fragment `#token=...`. | Browsers do not send URL fragments to HTTP servers or in `Referer` headers. |
| **Referrer Policy** | `Referrer-Policy: no-referrer` enforced on all responses + HTML meta tag on frontend pages. | `Referrer-Policy: no-referrer` enforced on all responses + HTML meta tag on frontend pages. | Prevents token leakage to external assets. |
| **Password Bounds** | Min 8 characters, **Max 72 bytes** (strict bcrypt limit). | N/A | Bcrypt truncates after 72 bytes; enforcing 72-byte ceiling prevents truncation vulnerabilities. |

---

### 4. Anti-Enumeration, Timing Architecture & Rate Limiting

- **Non-Blocking Email Dispatch Guarantee**: Email sending is **never awaited** in any request path (`register`, `forgot-password`, `resend-verification`, `change-password`). All transactional email dispatches are executed non-blocking in the background (via `setImmediate()`), catching errors silently and logging only a sanitized error code (`[MAIL] Delivery failed: <code_or_sanitized_msg>`), ensuring request latency is never bound to SMTP response times and unreachable SMTP hosts never crash or fail client requests.

1. **Forgot-Password Anti-Enumeration & Instant Response**:
   - `POST /api/auth/forgot-password` responds **immediately** (< 100ms) with HTTP 200:
     `{ "success": true, "message": "If an account exists with this email, recovery instructions have been sent." }`
   - Background execution via `setImmediate()`: looks up `is_active = TRUE`, checks per-email limit (skip if exceeded), generates 32-byte token, writes SHA-256 hash to `password_reset_token` (15m expiry), dispatches email with link `${FRONTEND_ORIGIN}/reset-password#token=${rawToken}`. Deactivated users silently skipped.
2. **Registration Anti-Enumeration & Exact Type Parity**:
   - In migration 001, `users.id` is of type `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
   - On duplicate registration:
     - Performs identical bcrypt work (`await bcrypt.hash(password, 12)`).
     - Generates a cryptographically random UUID via `crypto.randomUUID()` matching the exact database UUID format.
     - Returns HTTP 201 Created with identical field names and shapes:
       `{ "success": true, "user": { "id": "<random-uuid>", "email": "<email>", "full_name": "<name>", "role": "<role>", "approval_status": "pending" } }`.
     - Asynchronously dispatches security notice email to the existing user in the background.
   - Frontend `RegisterPage.tsx` UX: Displays uniform confirmation screen for all submissions: *"Check your email. We've sent a verification link to your email address. Please check your inbox to activate your account."*
3. **Verification Resend Anti-Enumeration & Respond-First Background Processing**:
   - `POST /api/auth/resend-verification` responds **immediately** with HTTP 200:
     `{ "success": true, "message": "If an unverified account exists with this email, a verification link has been sent." }`.
   - Background task via `setImmediate()`:
     - Queries DB for user where `email = $1`.
     - If user not found, or `!user.is_active`, or `user.is_email_verified === true`: silently exits without dispatching email.
     - Per-email cooldown (2 min) and daily cap (10) check: stored in an **in-memory Map** in `Backend/src/routes/auth.js` (`resendTracker`, keyed by normalized email). If cooldown or cap exceeded, silently exits without dispatching email.
     - *In-Memory Storage Limitation*: The in-memory tracker is high-performance and dependency-free for development and single-server deployments, but resets on server process restart and does not synchronize state across multi-node server clusters (which would require Redis or dedicated database timestamp columns).
     - Otherwise generates fresh 32-byte token, updates `email_verification_token` with SHA-256 hash (24h expiry), dispatches verification email to Mailpit.
   - Only per-IP rate limit triggers HTTP 429.
4. **Rate Limiting Strategy**:
   - Compiled production defaults in code; overrides active **only when `NODE_ENV === 'development'`**.
   - `RATE_LIMIT_FORGOT_IP_MAX`: 5 req / 15 min per IP &rarr; 429.
   - `RATE_LIMIT_FORGOT_EMAIL_MAX`: 3 req / 15 min per email &rarr; silent skip, uniform 200.
   - `RATE_LIMIT_RESET_IP_MAX`: 5 attempts / 15 min per IP &rarr; 429.
   - `RATE_LIMIT_REGISTER_IP_MAX`: 5 registrations / 1 hr per IP &rarr; 429; per-email counts identically (silent skip, 201).
   - `RATE_LIMIT_RESEND_IP_MAX`: 5 req / 15 min per IP &rarr; 429; per-email silent skip (200).
   - `RATE_LIMIT_CHANGE_PASSWORD_MAX`: 5 changes / 1 hr per user ID &rarr; 429.

---

### 5. Migration 015 & Owner-Level Apply Script

- **Migration File**: `Backend/src/database/migrations/015_email_verification_and_session_invalidation.sql` *(No BEGIN/COMMIT statements; `migrate.js` wraps migration execution in transactions)*.
- **Rollback File**: `Backend/src/database/rollbacks/rollback_015.sql` *(Stored in `rollbacks/` outside `migrations/` so `migrate.js` never executes it forward; no BEGIN/COMMIT statements)*.
- **Exact SQL for Migration 015**:
  ```sql
  -- 1. Guarded grandfather UPDATE: runs ONLY when adding token_version for the first time
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'token_version'
    ) THEN
      UPDATE users 
      SET is_email_verified = TRUE 
      WHERE is_email_verified = FALSE;
    END IF;
  END $$;

  -- 2. Add token_version column to users table
  ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;

  -- 3. Indexes for token lookups and session validation
  CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(id, token_version);

  -- 4. Explicit ods_app grants:
  GRANT SELECT, UPDATE(token_version) ON users TO ods_app;
  ```

#### Owner-Level Apply Script: `Backend/scripts/migrate-as-owner.js`
- Loads `dotenv.config()`.
- Validates presence of `TEST_ADMIN_DB_USER` and `TEST_ADMIN_DB_PASSWORD`. If either is missing, aborts immediately:
  `console.error('[FATAL] Missing required owner credentials: TEST_ADMIN_DB_USER and TEST_ADMIN_DB_PASSWORD must be defined in .env.'); process.exit(1);`
- Maps ONLY `TEST_ADMIN_DB_USER` &rarr; `DB_USER` and `TEST_ADMIN_DB_PASSWORD` &rarr; `DB_PASSWORD`. Host, port, and database name are taken directly from `DB_*` (`DB_HOST`, `DB_PORT`, `DB_NAME`). Never falls back to `ods_app` credentials; never prints credential values.
- Spawns `node src/database/migrate.js` synchronously with mapped owner environment.
- Execution command: `node scripts/migrate-as-owner.js`.

---

### 6. Development & Regression Environment Setup

- **Operational Rule for Environment Files**:
  - `Backend/.env` is edited **only after human approval of each phase**; no automated tool or agent touches `Backend/.env` without explicit approval.
  - `Backend/.env.example` receives **placeholders only** (never real credentials or secrets).
  - Note: `FRONTEND_ORIGIN=http://localhost:5173` already exists in `Backend/.env`.

- **Suggested Generous Dev Overrides for `Backend/.env`** (to be added manually by user upon approval):
  ```env
  # Batch 5: Generous Development Rate Limit Overrides (Backend/.env)
  RATE_LIMIT_FORGOT_IP_MAX=1000
  RATE_LIMIT_FORGOT_EMAIL_MAX=1000
  RATE_LIMIT_RESET_IP_MAX=1000
  RATE_LIMIT_REGISTER_IP_MAX=1000
  RATE_LIMIT_REGISTER_EMAIL_MAX=1000
  RATE_LIMIT_RESEND_IP_MAX=1000
  RATE_LIMIT_CHANGE_PASSWORD_MAX=1000

  # Batch 5: Mailpit SMTP Configuration (Backend/.env)
  SMTP_HOST=127.0.0.1
  SMTP_PORT=1025
  SMTP_SECURE=false
  SMTP_USER=
  SMTP_PASS=
  SMTP_FROM="ODS Global Network <no-reply@ods-global.net>"
  ```
- **New Variable Names for Reference**:
  - `RATE_LIMIT_FORGOT_IP_MAX`
  - `RATE_LIMIT_FORGOT_EMAIL_MAX`
  - `RATE_LIMIT_RESET_IP_MAX`
  - `RATE_LIMIT_REGISTER_IP_MAX`
  - `RATE_LIMIT_REGISTER_EMAIL_MAX`
  - `RATE_LIMIT_RESEND_IP_MAX`
  - `RATE_LIMIT_CHANGE_PASSWORD_MAX`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
  - `FRONTEND_ORIGIN` (already present)
- All existing `Backend/.env` settings (`NODE_ENV=development`, `DB_NAME=ods_global.net`, `DB_USER=ods_app`, `RATE_LIMIT_GLOBAL_MAX=5000`, `RATE_LIMIT_AUTH_MAX=1000`, `RATE_LIMIT_CUSTOMER_MAX=1000`, `RATE_LIMIT_ANON_MAX=10`, `RATE_LIMIT_ANON_WINDOW_MS=3000`) remain preserved. `ALLOW_DESTRUCTIVE_TESTS` is explicitly excluded from `.env` and passed per test invocation.

Startup SMTP guard in `server.js` and `emailService.js` reports `NODE_ENV`:
```javascript
if (process.env.NODE_ENV !== 'development') {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(`[FATAL] SMTP configuration is strictly required when NODE_ENV is not 'development' (current NODE_ENV="${process.env.NODE_ENV}").`);
  }
}
```

---

### 7. Known Limitations & Residual Timing

- **Registration Residual Timing**:
  - The new-account path and duplicate-email path execute identical `bcrypt.hash(password, 12)` work.
  - The new-account path performs 2–5 database `INSERT` queries + audit logging.
  - The duplicate-email path performs 1 `SELECT` + transaction rollback + async background alert email.
  - The exact residual timing difference is **to be measured and reported in Phase 4**.
- **Registration Per-Email Rate Limit Behavior**:
  - When the registration per-email rate limit (`RATE_LIMIT_REGISTER_EMAIL_MAX=3/hr`) is exceeded for a given email address, the API returns the identical uniform HTTP 201 Created response shape (`{ success: true, user: { id: '<random-uuid>', ... } }`) to preserve anti-enumeration.
  - However, the server **silently skips** account creation and skips email dispatch; **no account and no email is created**.
  - Documented as an intentional anti-enumeration design.
- **SMTP-Down Behavior & Non-Blocking Resilience**:
  - Email sending is never awaited in any request path; all transactional mail dispatches are launched non-blocking via `setImmediate()`.
  - In `emailService.js`, transactional mail dispatches catch network errors and log only a sanitized error code (`[MAIL] Delivery failed: ECONNREFUSED`).
  - Calls to `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/resend-verification`, and `POST /api/customer/change-password` never crash or return HTTP 500 when SMTP is offline; user responses remain uniform (201 / 200) and return within normal execution time (< 200ms).
  - For regression suites (`test-batch3-endpoints.js`, `test-batch4-endpoints.js`) running on port 3001: they do not test email delivery; even if Mailpit were stopped, SMTP dispatch errors in background tasks are caught silently, so regression suites run cleanly without dependency on an external SMTP daemon.

---

### 8. Test Harness Lifecycle, Environment Configurations & Test Allocation Matrix

`Backend/test-batch5-endpoints.js` isolates all testing using spawned child server processes to avoid port collisions and guarantee clean rate limit state:
- **Child #1 (Port 3005, Generous Functional Suite)**: Runs all functional security, token lifecycle, anti-enumeration timing, session invalidation, and role elevation tests.
- **Child #2 (Port 3005, Strict Batch 5 Rate Limit Suite)**: Spawned cleanly after Child #1 shuts down. Configured with strict values **only for the specific Batch 5 limiters under test**, keeping all existing baseline limits generous.
- **SMTP-Down Test Child (Port 3006, Dedicated Resilience Child)**: Spawns a dedicated instance pointing to a closed port (`SMTP_PORT=1026`) to assert non-blocking error tolerance across registration, forgot-password, and resend.

#### Exact Child Server Environment Configurations:

| Environment Variable | Child #1 (Generous) | Child #2 (Strict Batch 5 Limiters) | SMTP-Down Child (Port 3006) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `3005` | `3005` | `3006` | Isolated test ports; port 3001 preserved |
| `NODE_ENV` | `development` | `development` | `development` | Enables dev rate-limit overrides |
| `DB_NAME` | `ods_global.net` | `ods_global.net` | `ods_global.net` | Dev database |
| `DB_USER` | `ods_app` | `ods_app` | `ods_app` | Runs strictly with limited app privileges |
| `TRUST_PROXY` | `false` | `false` | `false` | All test requests resolve to IP `127.0.0.1` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | `http://localhost:5173` | `http://localhost:5173` | Matches local Vite origin |
| `SMTP_HOST` | `127.0.0.1` | `127.0.0.1` | `127.0.0.1` | Mailpit host |
| `SMTP_PORT` | `1025` | `1025` | `1026` | Port 1026 is closed to test offline SMTP |
| `RATE_LIMIT_GLOBAL_MAX` | `5000` | `5000` | `5000` | Baseline preserved generous |
| `RATE_LIMIT_AUTH_MAX` | `1000` | `1000` | `1000` | Baseline preserved generous |
| `RATE_LIMIT_CUSTOMER_MAX` | `1000` | `1000` | `1000` | Baseline preserved generous |
| `RATE_LIMIT_ANON_MAX` | `1000` | `1000` | `1000` | Baseline preserved generous |
| `RATE_LIMIT_CHANGE_PASSWORD_MAX` | `1000` | **`5`** | `1000` | 5 changes / 1 hr per user ID |
| `RATE_LIMIT_FORGOT_IP_MAX` | `1000` | **`5`** | `1000` | 5 requests / 15 min per IP |
| `RATE_LIMIT_FORGOT_EMAIL_MAX` | `1000` | **`3`** | `1000` | 3 requests / 15 min per email (silent skip) |
| `RATE_LIMIT_RESET_IP_MAX` | `1000` | **`5`** | `1000` | 5 attempts / 15 min per IP |
| `RATE_LIMIT_REGISTER_IP_MAX` | `1000` | **`5`** | `1000` | 5 registrations / 1 hr per IP |
| `RATE_LIMIT_REGISTER_EMAIL_MAX` | `1000` | **`3`** | `1000` | 3 registrations / 1 hr per email (silent skip) |
| `RATE_LIMIT_RESEND_IP_MAX` | `1000` | **`5`** | `1000` | 5 resends / 15 min per IP |

#### Child #2 Test Execution Order & Limiter Exhaustion Sequence:
With `TRUST_PROXY=false`, Express resolves all incoming HTTP requests to IP `127.0.0.1`. If an IP rate limiter is tripped, subsequent calls to that endpoint from `127.0.0.1` immediately return 429. Therefore, Child #2 executes tests in a strict sequence where email-scoped limiters run first with request counts below the IP limit, followed immediately by tests that exhaust the remaining IP quota:

1. **`T2j` (Change-Password Per-User Limit)**:
   - Route: `POST /api/customer/change-password`
   - Key: `req.user.id` (User ID).
   - Execution: An authenticated customer performs 5 consecutive valid password changes (all return 200). The 6th attempt is blocked with HTTP 429 `Too Many Requests`.
   - Limiter exhausted: `changePasswordLimiter` (user-scoped). Does not hit or affect any other endpoint or IP counter.

2. **`T3l` (Forgot-Password Per-Email Silent Skip)**:
   - Route: `POST /api/auth/forgot-password`
   - Key: Email address (`exhaust-email@test.com`) for email limiter; IP (`127.0.0.1`) for IP limiter.
   - Execution: Sends 4 consecutive requests for `exhaust-email@test.com`.
     - Requests 1–3: IP count reaches 3/5, email count reaches 3/3 &rarr; returns 200, sends email.
     - Request 4: IP count reaches 4/5 (limit not reached), email count exceeds 3 &rarr; returns uniform 200, but background email dispatch is silently skipped (verified in Mailpit: exactly 3 emails arrived, 4th was omitted).
   - Limiter exhausted: `forgotPasswordEmailLimiter` (email-scoped for `exhaust-email@test.com`). IP limit remains unexhausted (4/5).

3. **`T3m` (Forgot-Password Per-IP Rate Limit)**:
   - Route: `POST /api/auth/forgot-password`
   - Key: IP (`127.0.0.1`).
   - Execution: Sends requests using fresh distinct email addresses (`fresh-forgot-1@test.com`, `fresh-forgot-2@test.com`) so email limits are 1/3:
     - Request 5 (cumulative on IP): IP count reaches 5/5 &rarr; returns 200.
     - Request 6 (cumulative on IP): IP count reaches 6/5 (> 5) &rarr; HTTP 429 `Too Many Requests`.
   - Limiter exhausted: `forgotPasswordIpLimiter` (IP-scoped).

4. **`T3n` (Reset-Password Per-IP Rate Limit)**:
   - Route: `POST /api/auth/reset-password`
   - Key: IP (`127.0.0.1`). (Completely separate route and limiter instance from forgot-password).
   - Execution: Sends 5 consecutive invalid token attempts &rarr; all return 400 Bad Request. The 6th attempt is rejected with HTTP 429 `Too Many Requests`.
   - Limiter exhausted: `resetPasswordLimiter` (IP-scoped).

5. **`T4l` (Registration Per-Email Silent Skip)**:
   - Route: `POST /api/auth/register`
   - Key: Email address (`exhaust-reg@test.com`) for email limiter; IP (`127.0.0.1`) for IP limiter.
   - Execution: Sends 4 consecutive registration requests for `exhaust-reg@test.com`:
     - Request 1: IP count 1/5, email count 1/3 &rarr; 201 Created (new user, verification email sent).
     - Requests 2–3: IP count reaches 3/5, email count reaches 3/3 &rarr; uniform 201 Created (duplicate notice emails sent).
     - Request 4: IP count reaches 4/5 (limit not reached), email count exceeds 3 &rarr; uniform 201 Created (anti-enumeration: silently skips account creation and skips email dispatch; no DB row and no mail created).
   - Limiter exhausted: `registerEmailLimiter` (email-scoped for `exhaust-reg@test.com`). IP limit remains unexhausted (4/5).

6. **`T4k` (Registration Per-IP Rate Limit)**:
   - Route: `POST /api/auth/register`
   - Key: IP (`127.0.0.1`).
   - Execution: Sends requests using fresh distinct email addresses (`fresh-reg-1@test.com`, `fresh-reg-2@test.com`):
     - Request 5 (cumulative on IP): IP count reaches 5/5 &rarr; returns 201 Created.
     - Request 6 (cumulative on IP): IP count reaches 6/5 (> 5) &rarr; HTTP 429 `Too Many Requests`.
   - Limiter exhausted: `registerIpLimiter` (IP-scoped).

7. **`T4m` (Resend-Verification Per-Email Cooldown Silent Skip)**:
   - Route: `POST /api/auth/resend-verification`
   - Key: Email address (`unverified-resend@test.com`).
   - Execution: An unverified account created in Child #1 triggers 2 immediate resend requests:
     - Request 1: IP count 1/5 &rarr; returns 200, sends verification email.
     - Request 2 (within 2-minute cooldown): IP count reaches 2/5 (limit not reached) &rarr; uniform 200, but background email dispatch is silently skipped (verified in Mailpit: no 2nd email dispatched).
   - Limiter exhausted: Resend per-email cooldown guard. IP limit remains unexhausted (2/5).

8. **`T4n` (Resend-Verification Per-IP Rate Limit)**:
   - Route: `POST /api/auth/resend-verification`
   - Key: IP (`127.0.0.1`).
   - Execution: Sends requests across 4 distinct unverified account emails (`resend-ip-1@test.com` through `resend-ip-4@test.com`):
     - Requests 3–5 (cumulative on IP): IP count reaches 3/5, 4/5, 5/5 &rarr; returns 200.
     - Request 6 (cumulative on IP): IP count reaches 6/5 (> 5) &rarr; HTTP 429 `Too Many Requests`.
   - Limiter exhausted: `resendVerificationIpLimiter` (IP-scoped).

#### Test Fixture & Mailpit Integration Architecture:
1. **Child #2 Fixtures**:
   - The user accounts for `T3l` (existing active user), `T4m` and `T4n` (unverified users), and the customer for `T2j` are created **BEFORE Child #2 starts** (via owner-level DB inserts using `adminPool` or during Child #1), **never** through the registration endpoint after registration limits are exhausted.
   - All test fixtures use unique run-prefixed email addresses on the project test domain (e.g. `b5_<runId>_user@ods-test.local`, never `@test.com`), and their UUIDs are tracked in a run-level fixture array for owner-level DB teardown (`DELETE FROM users WHERE id = ANY($1)`).
2. **Mailpit Test Cleanliness & Determinism**:
   - Tests search Mailpit specifically by recipient email (`GET http://127.0.0.1:8025/api/v1/messages?search=<recipient>`).
   - Tests delete only their own processed messages by message ID (`DELETE http://127.0.0.1:8025/api/v1/message/<id>`). They **never** invoke delete-all (`DELETE /api/v1/messages`).
   - Tests poll Mailpit with a deterministic timeout (e.g. 5,000ms timeout with 100ms polling interval) instead of arbitrary sleep calls.
3. **Multi-Child Output Buffer Audit (`T1d`)**:
   - `T1d` audits the combined stdout/stderr output buffers across **Child #1, Child #2, and the SMTP-Down Child (Port 3006)**, asserting zero raw tokens, hashes, passwords, `#token=` strings, reset/verification links, or SMTP credentials exist anywhere in the server output.
4. **Targeted Phase Execution CLI Flag**:
   - `test-batch5-endpoints.js` supports a `--through <phase>` flag (e.g. `node test-batch5-endpoints.js --through 1` or `--through 2`), allowing discrete execution and verification of individual batch phases without triggering subsequent unimplemented phase tests.
5. **Sequential Cookie & Password Chaining (`T2j`)**:
   - In `T2j`, the customer executes 5 successive password changes; each change uses the fresh session cookie returned by the previous change and authenticates using the previous new password. The 6th change attempt is blocked with HTTP 429.
6. **Pre-Multer Document Upload Assertions (`T4d` & `T4j`)**:
   - `T4d`: Asserts HTTP 403 `EMAIL_NOT_VERIFIED`, asserts that no new row was created in the `documents` table (`SELECT COUNT(*) FROM documents WHERE user_id = $1`), and asserts that no file was saved to the upload disk directory, using the identical minimal 1 KB valid PDF buffer from Batch 4 tests.
   - `T4j`: Asserts HTTP 400 status only when anonymous upload is attempted with authenticated KYC purposes copied from Batch 4 (`kyc_license`, `partner_proposal`); the exact error message text is not asserted.

#### Complete Test Allocation Table:
| Test ID | Test Name / Assertion | Harness Child | Limits Configuration |
| :--- | :--- | :--- | :--- |
| **T1a** | Mailpit health probe (`/api/v1/info`) | Child #1 | Generous |
| **T1b** | Migration 015 schema inspection (`token_version`, grandfathering) | Child #1 | Generous |
| **T1c** | `ods_app` permission test (SELECT, UPDATE allowed; DELETE denied) | Child #1 | Generous |
| **T1d** | Zero secrets in logs (no raw token, hash, password, `#token=`, link, SMTP pass) | Child #1, Child #2, and Port 3006 Child | Combined stdout/stderr buffer audit across all child processes |
| **T1e** | SMTP-down tolerance (closed port 1026 &rarr; register responds within normal time with normal 201 body, forgot 200, resend 200, no leaks) | Dedicated Child (Port 3006) | Closed SMTP Port 1026 |
| **T2a** | Legacy token without `token_version` claim rejected (401) | Child #1 | Generous |
| **T2b** | Active session becomes invalid (401) immediately after password reset | Child #1 | Generous |
| **T2c** | Fresh cookie succeeds and old cookie returns 401 after change-password | Child #1 | Generous |
| **T2d** | Session profile `GET /api/auth/me` returns explicit allowlist (`id, email, full_name, phone, role, last_login_at, approval_status, is_email_verified`), asserts `token_version`, `is_active`, and `base_role` are absent; stale session rejected (401) | Child #1 | Generous |
| **T2e** | Stale session rejected across customer, merchant, provider, admin routes | Child #1 | Generous |
| **T2f** | Direct DB deactivation (`is_active = FALSE`) takes effect immediately | Child #1 | Generous |
| **T2g** | Direct DB role change takes effect immediately on next request | Child #1 | Generous |
| **T2h** | New password works and old password fails after reset/change | Child #1 | Generous |
| **T2i** | `super_admin` session reaches `/api/admin/audit-logs` via `resolveSession` | Child #1 | Generous |
| **T2j** | Change-password per-user rate limit enforced (429) | Child #2 | Strict (`RATE_LIMIT_CHANGE_PASSWORD_MAX=5`) |
| **T3a** | Forgot-password returns uniform 200 for existing and non-existent emails | Child #1 | Generous |
| **T3b** | Forgot-password responds immediately (< 100ms) | Child #1 | Generous |
| **T3c** | Reset token retrieved from Mailpit works via POST body to reset password | Child #1 | Generous |
| **T3d** | Expired reset token rejected (400) | Child #1 | Generous |
| **T3e** | Replayed / already-used reset token rejected (400) | Child #1 | Generous |
| **T3f** | Tampered reset token rejected (400) | Child #1 | Generous |
| **T3g** | Reset token for User A cannot reset User B | Child #1 | Generous |
| **T3h** | Requesting newer reset token invalidates older token | Child #1 | Generous |
| **T3i** | Password exceeding 72 bytes rejected with 400 | Child #1 | Generous |
| **T3j** | Successful password reset marks `is_email_verified = TRUE` & clears tokens | Child #1 | Generous |
| **T3k** | Deactivated user cannot reset password (400) and remains inactive | Child #1 | Generous |
| **T3l** | Forgot-password email rate limit silently skips email sending (uniform 200) | Child #2 | Strict (`RATE_LIMIT_FORGOT_EMAIL_MAX=3`, `RATE_LIMIT_FORGOT_IP_MAX=5`) |
| **T3m** | Forgot-password IP rate limit enforced (429) | Child #2 | Strict (`RATE_LIMIT_FORGOT_IP_MAX=5`) |
| **T3n** | Reset-password rate limit enforced (429) | Child #2 | Strict (`RATE_LIMIT_RESET_IP_MAX=5`) |
| **T4a** | New registration starts unverified and receives verification email | Child #1 | Generous |
| **T4b** | Registration with duplicate email returns identical 201/UUID and alert email | Child #1 | Generous |
| **T4c** | Unverified user can log in and query `GET /api/auth/me` (`is_email_verified: false`) | Child #1 | Generous |
| **T4d** | Unverified user denied (403 `EMAIL_NOT_VERIFIED`) on KYC document upload before Multer body parse; asserts no DB row & no file on disk using Batch 4 minimal PDF | Child #1 | Generous |
| **T4e** | Anonymous upload succeeds without verification check (`support_attachment` purpose) | Child #1 | Generous |
| **T4f** | Unverified merchant denied on `PUT /api/merchant/profile` | Child #1 | Generous |
| **T4g** | Verification token from Mailpit verifies account via `POST /api/auth/verify-email` | Child #1 | Generous |
| **T4h** | Expired verification token rejected | Child #1 | Generous |
| **T4i** | Admin and super_admin exempt from `requireVerifiedEmail` | Child #1 | Generous |
| **T4j** | Anonymous upload with stale cookie succeeds for anonymous & 400 for KYC purposes (`kyc_license`, `partner_proposal`) | Child #1 | Generous |
| **T4k** | Registration per-IP rate limit enforced (429) | Child #2 | Strict (`RATE_LIMIT_REGISTER_IP_MAX=5`) |
| **T4l** | Registration per-email limit counts non-existent emails identically (silent skip, 201) | Child #2 | Strict (`RATE_LIMIT_REGISTER_EMAIL_MAX=3`, `RATE_LIMIT_REGISTER_IP_MAX=5`) |
| **T4m** | Resend-verification per-email silent skip (200) | Child #2 | Strict (`RATE_LIMIT_RESEND_IP_MAX=5`) |
| **T4n** | Resend-verification IP rate limit enforced (429) | Child #2 | Strict (`RATE_LIMIT_RESEND_IP_MAX=5`) |

---

## Action Plan & Phased Implementation

### Phase 1: Database Migration 015, Email Service, and Session Service Foundation
**Rationale:** Schema foundation for session invalidation, secure transactional email client, Mailpit test integration, and centralized session resolution helper.

**Steps:**
- [x] Create `Backend/src/database/rollbacks/` directory.
- [x] Create `Backend/src/database/migrations/015_email_verification_and_session_invalidation.sql` and `Backend/src/database/rollbacks/rollback_015.sql` (no BEGIN/COMMIT).
- [x] Create `Backend/scripts/migrate-as-owner.js` mapping `TEST_ADMIN_DB_*` to `DB_*`.
- [x] Apply migration: `node scripts/migrate-as-owner.js`.
- [x] Restart dev server as `ods_app`.
- [x] Install `nodemailer` in `Backend/package.json` (updates `package-lock.json`).
- [x] Implement `Backend/src/services/sessionService.js`:
  - Export `resolveSession(token, poolInstance = pool)`: verifies JWT, validates numeric `token_version`, executes parameterized SQL with joins on `admins`, `merchants`, and `providers`, computes `effectiveRole` (with `super_admin` elevation) and `approval_status`, fails closed on inactive/revoked accounts, catches any DB error and returns `null`.
  - Export `revokeUserSessions(userId, client = pool)`: increments `token_version = token_version + 1`.
- [x] Implement `Backend/src/services/emailService.js`:
  - Transporter for Mailpit (`127.0.0.1:1025`) / SMTP.
  - No nodemailer logger or debug options enabled.
  - Strip `\r` and `\n` from email subjects and headers to prevent injection.
  - Normalize `FRONTEND_ORIGIN` using `new URL(FRONTEND_ORIGIN).origin` before link construction.
  - Startup check: enforce SMTP outside development (reports `NODE_ENV`).
  - Escaped HTML templates (Verification, Reset, Password Changed, Registration Alert).
  - Zero token/secret logging; log only sanitized error codes (`err.code`).
  - Tolerates SMTP unreachable errors without throwing unhandled exceptions.
- [x] Update `Backend/.env.example` with rate limit and SMTP placeholders.
- [x] Update `Backend/src/server.js`: validate `FRONTEND_ORIGIN` (must be https outside development).
- [x] Write Phase 1 automated tests in `Backend/test-batch5-endpoints.js`:
  - T1a: Mailpit health probe (`http://127.0.0.1:8025/api/v1/info`).
  - T1b: Migration 015 schema inspection (`token_version` column exists, existing accounts grandfathered).
  - T1c: `ods_app` permission test (SELECT, UPDATE allowed; DELETE denied on users).
  - T1d: Zero token, hash, password, `#token=`, link, or SMTP credential in logs assertion across Child #1 and Child #2 buffers.
  - T1e: SMTP-down tolerance assertion (spawns child on port 3006 with closed SMTP port 1026).

**Rollback Plan:** Run `rollback_015.sql` via owner script; revert `emailService.js`, `sessionService.js`, and dependencies; restart server.  
**Exit Criteria:** Migration 015 applied cleanly; `node --check` passes; Mailpit responds; Phase 1 tests pass.

---

### Phase 2: Session Invalidation Across Every Platform Route
**Rationale:** Enforces token version verification and session revocation across all existing platform routes before introducing recovery and registration changes.

**Steps:**
- [x] Update `Backend/src/middleware/auth.js` (`async requireAuth`):
  - Calls `resolveSession(token)`.
  - Wrapped in `try/catch`: any DB error or invalid session returns `401 Unauthorized` (`{ success: false, message: 'Session expired, revoked, or invalid. Please log in again.' }`).
  - Populates fresh `req.user` with DB-resolved state (`id, email, full_name, phone, role: effectiveRole, approval_status, is_active, is_email_verified, token_version`).
- [x] Update `POST /api/auth/login` in `Backend/src/routes/auth.js`:
  - Queries DB for `token_version`.
  - Signs minimal JWT payload: `{ id: user.id, token_version: user.token_version }`. (Token never carries role, approval_status, or is_email_verified; legacy tokens without token_version rejected).
  - Builds response body separately: `{ id, email, role: effectiveRole, full_name, approval_status, is_email_verified: Boolean(user.is_email_verified) }`.
- [x] Update `GET /api/auth/me` in `Backend/src/routes/auth.js`:
  - Add `requireAuth` middleware to the `/me` route (populating `req.user` via `resolveSession`).
  - Retires local `verifySession` helper in `Backend/src/routes/auth.js` completely.
  - Returns an **explicit allowlist** only: `{ id, email, full_name, phone, role, last_login_at, approval_status, is_email_verified }`, **never** returning `req.user` as a whole (omitting `token_version`, `is_active`, and `base_role`).
- [x] Update `POST /api/customer/change-password` in `Backend/src/routes/customer.js`:
  - Enforce password length: min 8, max 72 bytes.
  - Rate limiter: 5 changes per hour per user ID (`RATE_LIMIT_CHANGE_PASSWORD_MAX`).
  - Verify current password, update `password_hash`.
  - Call `revokeUserSessions(req.user.id)` from `sessionService.js`.
  - Re-issue cookie with updated `token_version`.
  - Send "Password Changed" security notice email non-blocking in background via `setImmediate()` (never awaited).
- [x] Refactor `extractOptionalAuth` and `/upload` in `Backend/src/routes/documents.js`:
  - Session resolution and email verification gate run **BEFORE** `uploadMiddleware` (Multer) parses the multipart body or writes files to disk.
  - Calls `resolveSession(req.cookies?.ods_session)`.
  - If valid authenticated session returned: evaluates `requireVerifiedEmail(req, res)` immediately. If unverified (and not admin/super_admin), returns `403 Forbidden` (`{ success: false, code: "EMAIL_NOT_VERIFIED", message: "Email verification required to perform this action." }`) without invoking Multer. If verified, proceeds to `uploadMiddleware`.
  - If returns `null` (missing cookie, expired, stale `token_version`, or inactive user), enters anonymous upload pipeline (Single Anonymous Fallback Rule): bypasses `requireVerifiedEmail`, proceeds to `uploadMiddleware`. In handler: if purpose is `support_attachment`, returns 201; if authenticated KYC purpose, returns 400.
- [x] Write Phase 2 automated tests in `Backend/test-batch5-endpoints.js`:
  - T2a: Legacy token without `token_version` claim rejected (401).
  - T2b: Active session becomes invalid (401) immediately after password reset.
  - T2c: Fresh cookie succeeds and old cookie returns 401 after change-password.
  - T2d: Session profile `GET /api/auth/me` returns explicit allowlist (`id, email, full_name, phone, role, last_login_at, approval_status, is_email_verified`), asserts `token_version`, `is_active`, and `base_role` are strictly absent (`undefined`), and stale/revoked session returns 401.
  - T2e: Stale session rejected across customer, merchant, provider, and admin routes.
  - T2f: Direct DB deactivation (`is_active = FALSE`) takes effect immediately on next request without token reissue.
  - T2g: Direct DB role change takes effect immediately on next request.
  - T2h: New password works and old password fails after reset/change.
  - T2i: super_admin session accesses `/api/admin/audit-logs` via `resolveSession`; DB role changes take effect immediately on next request.
  - T2j: Change-password per-user rate limit enforced (429) on Child #2.

**Rollback Plan:** Revert `requireAuth`, `customer.js`, `auth.js`, and `documents.js`.  
**Exit Criteria:** All T2 test cases pass; session revocation proven; regression runs pass: `node test-batch3-endpoints.js` (17/17) and `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` (96/96).

---

### Phase 3: Account Recovery Engine & Anti-Enumeration Protections
**Rationale:** Production-grade, enumeration-safe password recovery with instant response, non-blocking email dispatch, and URL fragment exchange.

**Steps:**
- [x] Implement rate limiters in `Backend/src/routes/auth.js`:
  - `forgotPasswordIpLimiter` (5 per 15 min per IP &rarr; 429).
  - `forgotPasswordEmailLimiter` (3 per 15 min per email &rarr; silent skip, uniform 200).
  - `resetPasswordLimiter` (5 attempts per 15 min per IP &rarr; 429).
- [x] Implement `POST /api/auth/forgot-password`:
  - RFC 5322 regex validation and email normalization.
  - **Instant response**: returns HTTP 200 immediately (< 100ms) with uniform message.
  - Background execution via `setImmediate()` (never awaited): lookup user with `is_active = TRUE`, check per-email limit (skip if exceeded), generate 32-byte token, write SHA-256 hash to `password_reset_token` (15m expiry), dispatch email with link `${FRONTEND_ORIGIN}/reset-password#token=${rawToken}`. Deactivated users skipped. Errors caught and logged with sanitized code, never surfaced.
  - `Referrer-Policy: no-referrer` header.
- [x] Implement `POST /api/auth/reset-password`:
  - Accepts `{ token, newPassword }` in POST body.
  - Computes SHA-256 hash; finds user with unexpired token.
  - Account active guard: asserts `user.is_active === true`; rejects deactivated users with 400.
  - Password length validation: **min 8, max 72 bytes** (`Buffer.byteLength(newPassword, 'utf8') <= 72`).
  - Hashes with bcrypt (12 rounds).
  - Atomically updates `password_hash`, clears `password_reset_token`/expiry, clears `email_verification_token`/expiry, clears lockout/failed attempts, sets `is_email_verified = TRUE`.
  - Calls `revokeUserSessions(user.id)` from `sessionService.js` to bump `token_version`.
  - Dispatches "Password Changed" security notice email non-blocking in background via `setImmediate()` (never awaited).
  - Logs `PASSWORD_RESET_SUCCESS` in `audit_logs`.
- [x] Retire `Backend/src/routes/recovery.placeholder.js`.
- [x] Write Phase 3 automated tests in `Backend/test-batch5-endpoints.js`:
  - T3a: Forgot-password returns uniform 200 for existing and non-existent emails.
  - T3b: Forgot-password responds immediately (< 100ms) and background job does not leak errors or status changes.
  - T3c: Reset token retrieved from Mailpit works via POST body to reset password.
  - T3d: Expired reset token rejected (400).
  - T3e: Replayed / already-used reset token rejected (400).
  - T3f: Tampered reset token rejected (400).
  - T3g: Reset token for User A cannot reset User B.
  - T3h: Requesting newer reset token invalidates older token.
  - T3i: Password exceeding 72 bytes rejected with 400.
  - T3j: Successful password reset marks `is_email_verified = TRUE` and clears pending verification tokens.
  - T3k: Deactivated user cannot reset password (400) and account remains inactive.
  - T3l: Forgot-password email rate limit silently skips email sending without returning 429.
  - T3m: Forgot-password IP rate limit enforced (429) on Child #2.
  - T3n: Reset-password rate limit enforced (429) on Child #2.

**Rollback Plan:** Revert recovery handlers in `Backend/src/routes/auth.js`.  
**Exit Criteria:** All T3 test cases pass; no tokens in logs; `node --check` passes; regression runs pass: `node test-batch3-endpoints.js` (17/17) and `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` (96/96).

---

### Phase 4: Registration, Email Verification & `requireVerifiedEmail` Middleware
**Rationale:** Anti-enumeration registration flow, respond-first verification resend, non-blocking mail delivery, gating sensitive actions, and updating test-batch4 fixtures for verified email.

**Steps:**
- [x] Update `POST /api/auth/register` in `Backend/src/routes/auth.js`:
  - Password length check: **min 8, max 72 bytes**.
  - Rate limits: 5/hr per IP (`RATE_LIMIT_REGISTER_IP_MAX` &rarr; 429); 3/hr per email (silent skip, 201; counts non-existent emails identically; no account and no email created on per-email limit).
  - Anti-enumeration: If email exists, execute identical bcrypt work (`await bcrypt.hash(password, 12)`), return uniform 201 Created with mock profile and `crypto.randomUUID()`, and dispatch security notice email non-blocking via `setImmediate()` (never awaited).
  - New user starts `is_email_verified = FALSE`.
  - Issues 32-byte verification token (SHA-256 hash stored in `email_verification_token`, 24h expiry).
  - Dispatches verification email with link `${FRONTEND_ORIGIN}/verify-email#token=${rawToken}` non-blocking in background via `setImmediate()` (never awaited).
- [x] Implement `POST /api/auth/resend-verification`:
  - Respond-first: returns HTTP 200 immediately.
  - Background task via `setImmediate()` (never awaited): query DB for `is_active = TRUE` and `is_email_verified = FALSE`. If missing, inactive, or already verified, silently exits.
  - Per-email cooldown (2 min) and daily cap (10) silently skip sending.
  - Per-IP limiter: 5 per 15 min &rarr; 429 (`RATE_LIMIT_RESEND_IP_MAX`).
  - Fresh token generated, older token invalidated, email dispatched in background.
- [x] Implement `POST /api/auth/verify-email`:
  - Accepts `{ token }` in POST body.
  - Validates SHA-256 hash against `email_verification_token` where `email_verification_expires > NOW()`.
  - Sets `is_email_verified = TRUE`, clears token and expiry. Logs `EMAIL_VERIFIED` in `audit_logs`.
- [x] Implement `requireVerifiedEmail` middleware in `Backend/src/middleware/auth.js`:
  - Exemption: if `['admin', 'super_admin'].includes(req.user.role)`, calls `return next()`.
  - Checks `req.user.is_email_verified` (resolved from DB via `resolveSession`).
  - If `!is_email_verified`, returns `403 Forbidden` (`{ "success": false, "code": "EMAIL_NOT_VERIFIED", "message": "Email verification required to perform this action." }`).
- [x] Mount `requireVerifiedEmail` on exact protected endpoints:
  - Authenticated `POST /api/documents/upload` (session resolution and verified-email gate evaluated BEFORE Multer parses multipart body or saves file to disk; anonymous requests bypass this gate and proceed to Multer, where `support_attachment` uploads succeed with 201 and KYC uploads return 400)
  - `PUT /api/merchant/profile`
  - `PUT /api/provider/profile`
- [x] Update `Backend/test-batch4-endpoints.js`: in `registerAndLogin` helper (line 135), add `await adminPool.query('UPDATE users SET is_email_verified = TRUE WHERE email = $1', [email]);` so registered fixtures are verified through the owner connection. Confirmed zero existing assertions weakened.
- [x] Write Phase 4 automated tests in `Backend/test-batch5-endpoints.js`:
  - T4a: New registration starts unverified and receives verification email in Mailpit.
  - T4b: Registration with duplicate email returns identical 201 response/timing/UUID shape and triggers notice email.
  - T4c: Unverified user can log in and query `GET /api/auth/me` (receives `is_email_verified: false`).
  - T4d: Unverified user denied (403 `EMAIL_NOT_VERIFIED`) on authenticated `POST /api/documents/upload` before Multer body parse; asserts no new DB row in `documents` and no file written to disk using Batch 4 minimal PDF buffer.
  - T4e: Anonymous upload path succeeds without verification check (`support_attachment` purpose returns 201).
  - T4f: Unverified merchant denied on `PUT /api/merchant/profile`.
  - T4g: Verification token from Mailpit successfully verifies account via `POST /api/auth/verify-email`.
  - T4h: Expired verification token rejected.
  - T4i: Admin and super_admin exempt from `requireVerifiedEmail`.
  - T4j: Anonymous upload with invalid or stale cookie succeeds for anonymous purposes (`support_attachment` returns 201) and asserts status 400 only for authenticated KYC purposes (`kyc_license`, `partner_proposal`) without asserting message text.
  - T4k: Registration per-IP rate limit enforced (429) on Child #2.
  - T4l: Registration per-email limit counts non-existent emails identically (silent skip, 201) on Child #2.
  - T4m: Resend verification enforces per-email silent skip (200) on Child #2.
  - T4n: Resend verification per-IP rate limit enforced (429) on Child #2.

**Rollback Plan:** Revert auth routes, middleware, documents upload handler, and test-batch4-endpoints.js fixture update.  
**Exit Criteria:** All T4 test cases pass; `node --check` passes; regression runs pass: `node test-batch3-endpoints.js` (17/17) and `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` (96/96).

---

### Phase 5: Frontend Pages & Human-Check Verification Handshake
**Rationale:** User interfaces for password recovery, reset, and email verification.

**Steps:**
- [x] Update `Frontend/src/context/AuthContext.tsx`:
  - Add `is_email_verified: boolean;` to `AuthUser` interface.
  - Add `refreshUser: () => Promise<void>` helper calling `GET /api/auth/me` and updating React state.
- [x] Update `Frontend/src/pages/RegisterPage.tsx`:
  - On submission success (201), display uniform confirmation screen: *"Check your email. We've sent a verification link to your email address. Please check your inbox to activate your account."*
- [x] Update `Frontend/src/pages/ForgotPasswordPage.tsx`:
  - Wire submission to `POST /api/auth/forgot-password`.
  - Display anti-enumeration confirmation state.
- [x] Update `Frontend/src/pages/ResetPasswordPage.tsx`:
  - Extract token from URL fragment (`window.location.hash`).
  - Clear fragment immediately using `window.history.replaceState(null, '', window.location.pathname + window.location.search)`.
  - Add page-level `<meta name="referrer" content="no-referrer" />`.
  - Wire submission to `POST /api/auth/reset-password` in JSON body with `{ token, newPassword }`.
  - Validate password length (8–72 bytes).
  - Handle success and expired token error states.
- [x] Create `Frontend/src/pages/VerifyEmailPage.tsx`:
  - Extract token from URL fragment (`window.location.hash`).
  - Clear fragment immediately using `window.history.replaceState(null, '', window.location.pathname + window.location.search)`.
  - Add page-level `<meta name="referrer" content="no-referrer" />`.
  - Wire submission to `POST /api/auth/verify-email` in JSON body with `{ token }`.
  - On verification success, call `await refreshUser()`; DashboardShell banner disappears immediately without a page reload.
  - Display verified confirmation card with dashboard link.
- [x] Update `Frontend/src/App.tsx`: register route `/verify-email`.
- [x] Update `Frontend/src/pages/dashboards/DashboardShell.tsx` and `DashboardLayout.tsx`:
  - Display unverified email alert banner when `user.is_email_verified === false` (except admin/super_admin).
  - Calls public `POST /api/auth/resend-verification` passing `{ email: user.email }`.
  - Disables button and displays a 120-second visual countdown cooldown timer upon click.
- [x] Update `Frontend/src/services/recoveryService.ts` and `publicService.ts`: add client methods for forgot, reset, and verify-email.
- [x] Validate frontend build: `npx tsc --noEmit` and `npm run build`.

**Rollback Plan:** Revert frontend page modifications.  
**Exit Criteria:** Frontend compiles cleanly with zero errors; human verification of forgot, reset, verify, registration, and banner views succeeds.

---

### Phase 6: Full Verification Suite, Regressions, and Commit Sync
**Rationale:** Full verification suite execution, regression validation, and documentation sync.

**Steps:**
- [x] Execute `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch5-endpoints.js` (runs dual child server harness on port 3005).
- [x] Execute `node test-batch3-endpoints.js` regression suite (all 17 tests pass).
- [x] Execute `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` regression suite (all 96 tests pass).
- [x] Re-verify dev accounts (`merchant01@ods.com`, `merchant@123.com`, `serviceprovider@123.com`) preserved in approved status.
- [x] Fill Commit Sync Record in plan.
- [x] Update `Status/PROJECT_STATUS.md`.

---

## Verification Plan

| # | Check | Command / method | Type | Expected Result |
| :- | :--- | :--- | :--- | :--- |
| 1 | Baseline Health Check | `node test-connection.js` | Auto | Connected as `ods_app` on `ods_global.net` |
| 2 | Migration 015 | `node scripts/migrate-as-owner.js` | Auto | Migration 015 applied cleanly; rollback script in `rollbacks/` ignored |
| 3 | Backend Syntax | `node --check <file>` individually for all backend files | Auto | All files pass exit code 0 |
| 4 | TypeScript Verification | `npx tsc --noEmit` | Auto | Exit code 0, zero type errors |
| 5 | Frontend Production Build | `npm run build` | Auto | Exit code 0, dist bundle generated |
| 6 | Batch 5 Test Suite | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch5-endpoints.js` | Auto | Complete security test suite passes on port 3005 across both child lifecycles |
| 7 | Regression: Batch 3 | `node test-batch3-endpoints.js` | Auto | 17 Passed / 0 Failed (zero test changes) |
| 8 | Regression: Batch 4 | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` | Auto | 96 Passed / 0 Failed (line 135 fixture update applied in Phase 4) |
| 9 | Dev Account Integrity | SQL assertion on dev accounts | Auto | `merchant01@ods.com`, `merchant@123.com`, `serviceprovider@123.com` preserved and approved |
| 10 | Human UI Verification | Manual browser verification | 🧑 Human | Forgot password, reset password, verify email, register UX, and dashboard banner verified |

---

## Commit Sync Record (DRAFT)

* **Status:** Automated verification: ALL PASSED (Phases 1–6) | Human UI verification: PASSED
* **Branch:** `batch5-email-recovery`
* **Evidence Reports:**
  - `Progress/batch5-evidence/phase1.md` (Migration 015, Email & Session Service foundation, T1a-T1e: 10/10 PASS)
  - `Progress/batch5-evidence/phase2.md` (Session Invalidation & Immediate Revocation, T2a-T2j: 10/10 PASS)
  - `Progress/batch5-evidence/phase3.md` (Account Recovery & Anti-Enumeration, T3a-T3k: 11/11 PASS)
  - `Progress/batch5-evidence/phase4.md` (Registration Verification, Gating, Strict Limiters, T4a-T4n: 51/51 PASS)
  - `Progress/batch5-evidence/phase5.md` (Frontend Pages, TypeScript 0 errors, Vite production build OK)
  - `Progress/batch5-evidence/final.md` (Final full verification: Batch 5 51/51, Batch 3 17/17, Batch 4 96/96, tsc, build)
* **Checklist Execution:**
  - [x] Phase 1: Applied migration 015, implemented emailService and sessionService.
  - [x] Phase 2: Refactored requireAuth with resolveSession, minimal JWT login, explicit /me allowlist, password length & session invalidation.
  - [x] Phase 3: Implemented forgot-password (<100ms respond-first, background SHA-256 token hashing, fragment link email) and reset-password (atomic invalidation, 8-72 byte password, session bump). Retired recovery.placeholder.js.
  - [x] Phase 4: Updated register with anti-enumeration uniform 201, verification tokens, resend-verification with 2m in-memory cooldown, verify-email, requireVerifiedEmail on KYC upload & merchant/provider profile PUTs.
  - [x] Phase 5: AuthContext (is_email_verified, refreshUser), VerifyEmailPage.tsx, ResetPasswordPage.tsx (fragment token extraction & stripping, no-referrer meta), ForgotPasswordPage.tsx, RegisterPage.tsx, DashboardShell.tsx (unverified banner & 120s cooldown resend).
  - [x] Phase 6: Full verification run (Batch 5 51/51, Batch 3 17/17, Batch 4 96/96, tsc, build).
  - [x] Human UI Verification: PASSED
* **Suggested Commit Message (DRAFT — do not commit):**
  ```
  feat(batch5): email foundation, account recovery, session invalidation & registration verification

  - Migration 015: add token_version, password_reset_token, email_verification_token to users table with partial indexes
  - Session service: resolveSession() with fresh DB lookups and role elevation; revokeUserSessions() invalidates sessions immediately on password change
  - Email service: Nodemailer configured for Mailpit (dev) and SMTP (prod), header sanitization, zero secret logging
  - Auth routes: minimal JWT { id, token_version } on login; explicit allowlist on GET /api/auth/me
  - Account recovery: respond-first POST /api/auth/forgot-password (<100ms) with background SHA-256 token generation and email dispatch; POST /api/auth/reset-password with 8-72 byte check and atomic session invalidation
  - Registration & verification: uniform 201 anti-enumeration on duplicate register; POST /api/auth/resend-verification with 2-minute cooldown; POST /api/auth/verify-email
  - Sensitive action gating: requireVerifiedEmail protects KYC uploads (pre-Multer) and merchant/provider PUT /profile
  - Frontend: AuthContext with refreshUser(); VerifyEmailPage; ResetPasswordPage with fragment token extraction and no-referrer meta; DashboardShell unverified email banner with 120s cooldown timer
  - Automated test suite: 51/51 Batch 5 tests passing on dual child server harness; 17/17 Batch 3 and 96/96 Batch 4 regressions intact
  ```

---

## Approval (human-owned — the agent leaves these blank)
**Approval status:** Approved  
**Approved by:** Human Project Owner  
**Approval phrase received:** `Approved: proceed`  
**Plan revision approved:** Revision 10  
**Date/time approved:** 2026-10-19 12:08:54  

---

## Revision Log (append-only)
| Rev | Date/time | Change (delta only) | Re-approval needed? |
| :--- | :--- | :--- | :--- |
| 1 | 2026-10-13 14:00 | Initial draft for Batch 5: Email Foundation, Account Recovery, and Session Invalidation. | Yes |
| 2 | 2026-10-13 15:45 | Incorporate user binding decisions: (1) Scope traceability matrix explicitly mapping files; (2) Session invalidation table across all check points with fail-closed DB verification and explicit admin.js handlers; (3) Token architecture: 15m reset / 24h verif, hash-only SHA-256 storage, single-use, Referrer-Policy no-referrer, POST-body exchange; (4) Anti-enumeration with dummy timing equalization and registration notice email; (5) Rate limits per IP and per email with documented in-memory limitation; (6) Migration 015 specs with explicit ods_app grants, grandfathering existing users, keeping otp_codes for phone verification; (7) FRONTEND_ORIGIN validation, production SMTP enforcement, zero-secret logging; (8) requireVerifiedEmail middleware gating sensitive endpoints (including KYC doc submission) with admin/super_admin exemption; (9) Mailpit dev mail catcher with startup probe; (10) Restructured into 6 phases with individual tests, rollback, and exit criteria per phase. | Yes |
| 3 | 2026-10-14 11:30 | Comprehensive revision per user directive: (1) Replaced new admin endpoints and KYC token bump with reusable `revokeUserSessions(userId)` helper; `requireAuth` reads `role` and `is_active` fresh from DB every request; (2) Rebuilt session invalidation matrix from exact grep of `jwt.verify`, `ods_session`, and `req.cookies`, documenting separate anonymous upload and partner staging token paths, and test minting locations; (3) Forgot-password responds immediately (< 100ms) with background DB/token/mail processing, removing dummy hashing; redesigned T2b for non-flaky timing bounds; (4) `POST /api/auth/verify-email` with token in body; email links use URL fragment (`#token=...`); (5) Registration duplicate email returns identical 201 status, body, and timing via matching bcrypt work, with per-IP and per-email rate limits counting identically; (6) `requireVerifiedEmail` scoped strictly to authenticated `POST /api/documents/upload`, `PUT /api/merchant/profile`, and `PUT /api/provider/profile` (removed document view and customer profile); reads `is_email_verified` from DB; `/me` returns `is_email_verified`; (7) Documented exact fixture verification in Batch 4 (`registerAndLogin` owner-level update); confirmed zero existing assertions weakened; (8) SMTP enforcement outside development, console fallback only in dev with unset SMTP, `FRONTEND_ORIGIN` must be https outside dev; (9) Migration 015 exact SQL, grants, rollback script, and guarded grandfather update (`created_at <= CURRENT_TIMESTAMP`); (10) Password bounds min 8, max 72 bytes (bcrypt limit); (11) T1d log stream assertion with Mailpit self-cleanup; (12) Scope matrix expanded to include server.js, package.json, App.tsx, API client, migrate.js, and confirmed page statuses; added full kickoff prompt; (13) Confirmed change-password method `POST /api/customer/change-password` and noted only customer role has change-password today; (14) Batch 4 plan test count corrected from 93 to 96. | Yes |
| 4 | 2026-10-14 12:15 | Revision 4 incorporating user feedback and architectural hardening: (1) Moved rollback script to `Backend/src/database/rollbacks/rollback_015.sql` so `migrate.js` never executes it; (2) Guarded grandfather UPDATE via DO block checking if `token_version` column exists prior to ALTER, guaranteeing re-runs never verify new accounts; (3) Isolated test harness: `test-batch5-endpoints.js` spawns its own server on port 3005 with captured stdout/stderr for T1d, with rate limit overrides active only in `development`; (4) Registration UX updated: `RegisterPage.tsx` displays uniform "check your email" screen for all submissions; duplicate email returns 201 with mock UUID; documented residual timing difference in Known Limitations; (5) Standardized all dev network references to `127.0.0.1` (SMTP host, probe, API URLs); (6) Formalized documents.js upload fallback behavior for stale/invalid cookies to anonymous mode per A7 and added test T3k; (7) Forgot-password per-email limit silently drops email dispatch while returning identical uniform 200 (no 429, no leak); per-IP limit returns 429; (8) Successful password reset marks `is_email_verified = TRUE` with test T2m; (9) Frontend reset and verify pages read token from URL fragment, immediately clear it with `history.replaceState`, and add no-referrer meta tag. | Yes |
| 5 | 2026-10-14 12:45 | Revision 5 incorporating owner-level migration procedure and regression safety: (1) Documented owner-level migration execution procedure ($env:DB_USER=$env:TEST_ADMIN_DB_USER) and dev server restart as ods_app; (2) Added exact development environment rate limit overrides and NODE_ENV=development in .env so Batch 3 (3 registrations) + Batch 4 (7) pass without 429s; SMTP startup error explicitly names current NODE_ENV; (3) Batch 5 test harness runs rate limit tests last or uses distinct X-Forwarded-For with TRUST_PROXY, with unique emails per test; (4) Formalized single anonymous fallback rule in documents.js and detailed async extractOptionalAuth refactor with requireVerifiedEmail running only on authenticated branch before disk writes; added stale-session KYC 400 and support 201 tests; (5) Resend-verification per-email cooldown/cap silently skips (returns 200); only per-IP returns 429; (6) Forgot-password and resend-verification query is_active = TRUE only; reset-password rejects deactivated users (400) and never reactivates them (test T2n); (7) Login and /me return is_email_verified; updated AuthUser interface and DashboardShell banner; noted LoginPage.tsx requires no changes; (8) Moved revokeUserSessions to Backend/src/services/sessionService.js; added package-lock.json to scope matrix; (9) emailService stripped of logger/debug options, logs only sanitized error codes, strips CR/LF from subjects/headers, and normalizes FRONTEND_ORIGIN with new URL().origin; (10) Added test verifying old cookie fails and fresh cookie succeeds after change-password; confirmed test-batch3-endpoints.js needs zero changes. | Yes |
| 6 | 2026-10-14 13:15 | Revision 6 addressing user technical review: (1) Added `Backend/src/services/sessionService.js` function `resolveSession(token)` returning DB-resolved user (id, effective role with super_admin elevation, is_active, is_email_verified, token_version) or null; DB values win; `requireAuth`, `GET /me`, and `documents.js` all use it; (2) `requireAuth` is async, wrapped in try/catch; any DB error returns 401 (fail closed), never throwing into Express; (3) Migration apply uses `Backend/scripts/migrate-as-owner.js` mapping `TEST_ADMIN_DB_*` to `DB_*`, replacing PowerShell `$env:` in plan and verification; (4) Migration 015 and rollback scripts stripped of redundant `BEGIN` / `COMMIT` statements because `migrate.js` wraps migrations in its own transactions; (5) `FRONTEND_ORIGIN` dev value set to `http://localhost:5173` matching Vite dev server; SMTP (`127.0.0.1:1025`) and Mailpit (`http://127.0.0.1:8025`) remain on `127.0.0.1`; (6) Dev `.env` preserves existing `RATE_LIMIT_*` values and adds only new Batch 5 variables; (7) Registration duplicate path generates `crypto.randomUUID()` matching `users.id` UUID type, preserving 100% field parity; (8) Dual child server test harness in `test-batch5-endpoints.js`: Child #1 (port 3005, generous limits) runs functional suite T1–T4, Child #2 (port 3005, strict limits) runs rate-limit tests last; T1d asserts zero secrets across logs of both children; (9) Resend-verification uses respond-first with background processing checking `is_active`, `is_email_verified === false`, and per-email limits; (10) `POST /api/auth/reset-password` clears both reset and verification tokens; (11) `VerifyEmailPage.tsx` refreshes `AuthContext` via `refreshUser()`, clearing the banner reactively without page reload; (12) Retained earliest available kickoff text after exhaustive search across transcripts; (13) Added test T4i for super_admin route access and immediate DB role change enforcement. | Yes |
| 7 | 2026-10-14 14:15 | Revision 7: (1) Reordered phases so no phase relies on an artifact created later: P1 Foundation (Migration 015, emailService, sessionService with resolveSession/revokeUserSessions, owner script); P2 Session Invalidation (async requireAuth, login token_version/is_email_verified, change-password, documents extractOptionalAuth, T2 tests); P3 Account Recovery (forgot/reset password, T3 tests); P4 Registration & Email Verification (register, resend, verify-email, requireVerifiedEmail, T4 tests); P5 Frontend; P6 Final Suite; (2) Added Phase Dependency Matrix and Complete Test Allocation Table mapping every test to Child #1 (generous) or Child #2 (strict); (3) Added tests for registration per-IP (429) & per-email (201 silent skip), change-password per-user limit (429), and SMTP-down tolerance (T1e on port 3006); (4) Documented SMTP-down behavior across registration, forgot, and resend, noting Batch 3/4 regression runs on port 3001 tolerate offline SMTP; (5) Expanded T1d assertion to check for `#token=`, verification/reset links, and SMTP credentials; (6) Clarified DashboardShell resend calls public endpoint with user's email and shows 120s countdown cooldown; (7) Recorded 'first kickoff message not available' under Original User Prompt. | Yes |
| 8 | 2026-10-16 11:35 | Revision 8 addressing user technical review: (1) Login signs minimal JWT payload (`{ id, token_version }`) and builds response body separately, rejecting legacy pre-Batch-5 tokens lacking `token_version`; (2) `resolveSession` LEFT JOINs `admins`, `merchants`, and `providers` to compute effective role and `approval_status` fresh from DB per request, populating all `req.user` fields identified in A1 (`id, email, full_name, phone, role, approval_status, is_active, is_email_verified, token_version`); (3) Completely retired local `verifySession` in `auth.js` in favor of `resolveSession`; documented route consumers of `approval_status`; (4) Moved `test-batch4-endpoints.js` fixture verification (`is_email_verified = TRUE`) to Phase 4; added `test-batch3` (17/17) and `test-batch4` (96/96) regression runs to exit criteria of Phases 2, 3, and 4; (5) Added `table_schema = current_schema()` to Migration 015 DO block; (6) Guaranteed email sending is never awaited in any request path (`register`, `forgot`, `resend`, `change-password`), with unreachable SMTP test T1e asserting register returns normal 201 within normal execution time (< 200ms); (7) Documented registration per-email limit behavior in Known Limitations (uniform 201 response, but no account and no email created). | Yes |
| 9 | 2026-10-16 11:45 | Revision 9 addressing user technical review: (1) `GET /api/auth/me` protected by `requireAuth` and returns explicit allowlist (`{ id, email, full_name, phone, role, last_login_at, approval_status, is_email_verified }`), never `req.user` as a whole; T2d asserts `token_version`, `is_active`, and `base_role` are strictly absent; (2) Child #2 sets strict values ONLY for the specific Batch 5 limiters under test (`forgot IP/email, reset IP, register IP/email, resend IP, change-password`), keeping existing global, auth, customer, and anon limits generous; listed exact env values for Child #1, Child #2, and SMTP-down child; (3) Assigned T3l to Child #2 and defined full Child #2 test order where each limiter is exhausted by exactly one test with `TRUST_PROXY=false`; updated Test Allocation Table so every test has an assigned child; (4) Listed new `RATE_LIMIT_*` and `SMTP_*` variable names for `Backend/.env` and recorded that `Backend/.env` is edited only after human approval of each phase and `Backend/.env.example` receives placeholders only; (5) `documents.js /upload` executes session check and verified-email gate BEFORE Multer parses multipart body or saves files to disk; added small file (1 KB) 403 test to T4d and documented anonymous fallback behavior; (6) `sessionService.js` checks `JWT_SECRET` at module load and `resolveSession` returns null (never throws) on any error; documented `admin.js:136` (`adminUser = req.user`) reads `adminUser.id` at lines 168 and 222 and confirmed `resolveSession` provides it. | Yes |
| 10 | 2026-10-16 12:25 | Revision 10 clarifications (no re-approval needed): (1) Child #2 fixtures (T3l active user, T4m/T4n unverified users, T2j customer) created before Child #2 starts via owner DB inserts / Child #1 with unique run-prefixed @ods-test.local emails and tracked IDs for teardown; (2) Mailpit tests search by recipient, delete only own messages by ID (never delete-all), and poll with timeout instead of sleeping; (3) T1d log audit includes SMTP-down child output; (4) T4d asserts 403, no new DB document row, and no file on disk using Batch 4 minimal PDF; (5) T4j asserts status 400 only with Batch 4 purposes (kyc_license, partner_proposal) without asserting message text; (6) isVerifiedOrExempt(user) implemented as shared pure helper, wrapped by requireVerifiedEmail and called by upload handler; (7) Resend per-email cooldown and daily cap stored in-memory Map in auth.js with documented restart/clustering limitation; (8) test-batch5-endpoints.js supports --through <phase> flag; T2j chains fresh cookies and passwords across 5 changes; (9) Section 6 notes FRONTEND_ORIGIN already exists in Backend/.env and provides suggested generous dev values code block for RATE_LIMIT_* and SMTP_*. | No |
