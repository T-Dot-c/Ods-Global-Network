# Implementation Plan: Batch 5 — Email Foundation, Account Recovery, and Session Invalidation

**Project:** ODS Global Network  
**Created:** 2026-10-13 14:00 (Revision 2: 2026-10-13 15:45)  
**Status:** Pending Approval  

---

## Original User Prompt
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

---

## Scope Traceability Matrix

Every file touched in Batch 5 maps directly to an authoritative scope requirement. Only frontend forgot, reset, and verification views are in scope for human UI checks; no other frontend files outside this scope will be modified.

| Scope Item | Description | Files In Scope |
| :--- | :--- | :--- |
| **B5-MIG** | Migration 015: token_version, token hash columns, indexes, ods_app grants, grandfathering | `Backend/src/database/migrations/015_email_verification_and_session_invalidation.sql` |
| **B5-MAIL** | Transactional email delivery service, Mailpit SMTP transporter, template escaping, zero-secret logging | `Backend/src/services/emailService.js`, `Backend/.env.example` |
| **B5-RECOV** | Forgot & reset password endpoints, cryptographic token hashing, timing equalization, rate limiting | `Backend/src/routes/auth.js`, `Backend/src/routes/recovery.placeholder.js` (deprecated) |
| **B5-VERIF** | Email verification endpoints, resend throttling, cooldowns, daily caps, `requireVerifiedEmail` guard | `Backend/src/middleware/auth.js`, `Backend/src/routes/auth.js`, `Backend/src/routes/documents.js`, `Backend/src/routes/merchant.js`, `Backend/src/routes/provider.js`, `Backend/src/routes/customer.js` |
| **B5-SESS** | Session invalidation via `token_version`, fail-closed DB verification, bumping on password change & admin promotion | `Backend/src/middleware/auth.js`, `Backend/src/routes/customer.js`, `Backend/src/routes/admin.js`, `Backend/src/routes/auth.js` |
| **B5-FRONT** | User interfaces for password recovery, reset, and verification banner (strictly in-scope for human UI checks) | `Frontend/src/pages/ForgotPasswordPage.tsx`, `Frontend/src/pages/ResetPasswordPage.tsx`, `Frontend/src/pages/VerifyEmailPage.tsx` (or view), `Frontend/src/components/layout/DashboardShell.tsx` |
| **B5-TEST** | Batch 5 automated verification suite with Mailpit API integration, tracked fixtures, owner teardown | `Backend/test-batch5-endpoints.js` |

---

## Architectural & Security Specifications

### 1. Decisions Alignment
- **D-1 (Unverified Users)**: Users are **not blocked from login**. They are blocked from sensitive operations only through a single `requireVerifiedEmail` middleware.
  - **Protected Endpoints**:
    - `POST /api/documents/upload`: Blocks sensitive document uploads (including KYC submissions) for unverified users. Impact on Batch 4 onboarding: a newly registered merchant or provider can configure profile data, but must verify their email before submitting official compliance documents. An in-app banner guides the user. Existing dev accounts are grandfathered as verified.
    - `GET /api/documents/:id/view`: Blocks direct viewing of private documents by unverified users.
    - `PUT /api/merchant/profile` & `PUT /api/provider/profile`: Blocks compliance profile edits that trigger `COMPLIANCE_RESET` until verified.
    - `PUT /api/customer/profile`: Blocks customer profile updates until verified.
  - **Exempt Endpoints**: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/resend-verification`, `/api/auth/verify-email`, `POST /api/customer/change-password`, anonymous `/api/partners` intake.
  - **Role Exemption**: `admin` and `super_admin` are explicitly exempt from `requireVerifiedEmail`.
- **D-2 (Session Invalidation)**: Implemented using `token_version INT NOT NULL DEFAULT 1` on `users`.
- **D-3 (Dev Mail Strategy)**: **Mailpit** (`localhost:1025` SMTP, `http://localhost:8025/api/v1/messages` HTTP API). Tests retrieve messages via Mailpit API without logging tokens. Console fallback is permitted only when `NODE_ENV=development` and SMTP is unconfigured.
  - **Mailpit Missing Guard**: The test suite probes `http://localhost:8025/api/v1/info` at startup. If unreachable, it fails fast with:
    `[FATAL] Mailpit SMTP catcher is not reachable on http://localhost:8025. Please start Mailpit (e.g., mailpit.exe or docker run -p 1025:1025 -p 8025:8025 axllent/mailpit).`
- **D-4 (KYC Emails)**: Excluded from Batch 5. Reserved for Batch 11.

---

### 2. Session Invalidation Matrix (`token_version`)

Every place `ods_session` is checked must validate `token_version` against the database and fail closed.

| Verification Location | File & Route | How `token_version` is Checked | Behavior on Mismatch / Missing Claim |
| :--- | :--- | :--- | :--- |
| **Auth Middleware (`requireAuth`)** | `Backend/src/middleware/auth.js` | Decodes JWT; verifies `decoded.token_version !== undefined`. Queries `SELECT id, role, is_active, token_version FROM users WHERE id = $1`. Verifies `row.token_version === decoded.token_version`. | Returns `401 Unauthorized` (`"Session expired or revoked. Please log in again."`). Fails closed if user inactive or not found. |
| **Session Profile (`/me`)** | `Backend/src/routes/auth.js` (`GET /me`) | Runs `requireAuth` (or verifies decoded `token_version` against active DB user record). | Returns `401 Unauthorized` if `token_version` does not match DB or claim missing. |
| **Customer Routes** | `Backend/src/routes/customer.js` (`/api/customer/*`) | Protected by `requireAuth`. | Returns `401 Unauthorized`. |
| **Merchant Routes** | `Backend/src/routes/merchant.js` (`/api/merchant/*`) | Protected by `requireAuth` + `requireRole('merchant')`. | Returns `401 Unauthorized`. |
| **Provider Routes** | `Backend/src/routes/provider.js` (`/api/provider/*`) | Protected by `requireAuth` + `requireRole('provider')`. | Returns `401 Unauthorized`. |
| **Admin Routes** | `Backend/src/routes/admin.js` (`/api/admin/*`) | Protected by `requireAuth` + `requireRole('admin', 'super_admin')`. | Returns `401 Unauthorized`. |
| **Super Admin Routes** | `Backend/src/routes/admin.js` (`/api/admin/audit-logs`) | Protected by `requireAuth` + `requireRole('super_admin')`. | Returns `401 Unauthorized`. |
| **Documents Routes** | `Backend/src/routes/documents.js` (`/api/documents/*`) | Protected by `requireAuth` on uploads and views. | Returns `401 Unauthorized`. |
| **Partners Routes** | `Backend/src/routes/partners.js` | Optional auth inspects session; if token supplied, validates `token_version`. | Ignores invalid/stale session or rejects if invalid. |
| **Login (`/login`)** | `Backend/src/routes/auth.js` (`POST /login`) | Issues JWT containing `token_version: user.token_version`. | New session minted with latest version. |
| **Logout (`/logout`)** | `Backend/src/routes/auth.js` (`POST /logout`) | Clears `ods_session` cookie. | Session cookie cleared. |

#### Exact Handlers that Bump `token_version`:
1. `Backend/src/routes/customer.js`: `PUT /api/customer/change-password` &rarr; `UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2`
2. `Backend/src/routes/auth.js`: `POST /api/auth/reset-password` &rarr; `UPDATE users SET password_hash = $1, token_version = token_version + 1, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $2`
3. `Backend/src/routes/admin.js`:
   - `PUT /api/admin/users/:id/status` (new handler in Phase 4 for admin user status/lock toggle): `UPDATE users SET is_active = $1, token_version = token_version + 1 WHERE id = $2`
   - `PUT /api/admin/users/:id/role` (new handler in Phase 4 for role elevation / admin level change): `UPDATE users SET role = $1, token_version = token_version + 1 WHERE id = $2`
   - `POST /api/admin/kyc/:entityType/:id/decision` (existing handler in `admin.js`): updates entity approval status and bumps the target entity's `user_id` `token_version = token_version + 1` so the merchant/provider's active session cookie immediately reflects their approved/rejected status.

---

### 3. Token Lifecycle & Storage Architecture

| Property | Password Reset Token | Email Verification Token | Justification |
| :--- | :--- | :--- | :--- |
| **Raw Token Entropy** | 32 bytes cryptographically secure random (`crypto.randomBytes(32).toString('hex')` &rarr; 64 chars) | 32 bytes cryptographically secure random (`crypto.randomBytes(32).toString('hex')` &rarr; 64 chars) | 256 bits of entropy prevents brute-force guessing. |
| **Storage Mechanism** | **Hash-only**: SHA-256 hex digest (`crypto.createHash('sha256').update(rawToken).digest('hex')`) | **Hash-only**: SHA-256 hex digest (`crypto.createHash('sha256').update(rawToken).digest('hex')`) | Database compromise does not leak actionable reset/verification tokens. |
| **Expiry Value** | **15 minutes** | **24 hours** | Password reset requires tight window to mitigate link hijacking; email verification allows user reasonable window across time zones. |
| **Single-Use Enforcement** | Token cleared atomically upon successful reset (`password_reset_token = NULL, password_reset_expires = NULL`). | Token cleared atomically upon verification (`email_verification_token = NULL, email_verification_expires = NULL, is_email_verified = TRUE`). | Prevents replay attacks. |
| **Older Token Invalidation** | Requesting a new reset token overwrites prior token and expires immediately. | Requesting a resend overwrites prior token and expires immediately. | Only the most recently issued token is ever valid. |
| **Exchange Mechanism** | **POST body exchange only** (`{ "token": "...", "newPassword": "..." }`). Never in URL query params on mutating endpoints. | Token exchanged via POST body or dedicated verify endpoint. | Avoids token retention in web server access logs and browser history. |
| **Referrer Policy** | `Referrer-Policy: no-referrer` enforced on all auth responses. | `Referrer-Policy: no-referrer` enforced on all auth responses. | Prevents token leakage via HTTP `Referer` headers to third-party assets. |

---

### 4. Anti-Enumeration & Timing Equalization

1. **Forgot-Password Anti-Enumeration**:
   - Whether the email exists, is inactive, or does not exist, the endpoint returns HTTP 200 with identical payload:
     `{ "success": true, "message": "If an account exists with this email, recovery instructions have been sent." }`
   - **Timing Equalization**: If the email is NOT found in the database, the server runs a dummy cryptographic hash calculation (`crypto.createHash('sha256').update('dummy-salt-constant').digest('hex')` and pseudo random generation) before responding, equalizing latency against the user-found branch.
2. **Registration Anti-Enumeration**:
   - If an account already exists with the provided email, `POST /api/auth/register` returns HTTP 200 (or uniform accepted response) and asynchronously dispatches a secure notice email: *"An attempt was made to register an account with your email. If this was you, please log in or reset your password."* No account details are revealed.
3. **Verification Resend Anti-Enumeration**:
   - Uniform response: `{ "success": true, "message": "If an unverified account exists with this email, a verification link has been sent." }`
   - Governed by cooldown (1 request per 2 minutes per email), per-IP limit (5 per 15 min), and daily cap (10 per email per 24h).

---

### 5. Rate Limiting Strategy
All rate limiters use `express-rate-limit` with IP and email key generators.
*(Note: In-memory rate limiting limitation is documented; distributed Redis rate limiting is scheduled for Batch 12).*

- **Forgot-Password Limiter**: 5 requests per 15 minutes per IP; 3 requests per 15 minutes per normalized email.
- **Reset-Password Limiter**: 5 failed reset attempts per 15 minutes per IP.
- **Verification Resend Limiter**: 3 requests per 15 minutes per IP/email; 2-minute mandatory cooldown between requests.
- **Change-Password Limiter**: 5 password changes per 1 hour per authenticated user ID.

---

### 6. Migration 015 & Database Grants

- **Migration File**: `Backend/src/database/migrations/015_email_verification_and_session_invalidation.sql`
- **Schema Alterations**:
  - `ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;`
  - Ensure columns exist on `users`:
    - `is_email_verified` (already exists from Migration 001, confirmed)
    - `email_verification_token` (VARCHAR(255), stores SHA-256 hash)
    - `email_verification_expires` (TIMESTAMPTZ)
    - `password_reset_token` (VARCHAR(255), stores SHA-256 hash)
    - `password_reset_expires` (TIMESTAMPTZ)
  - Indexes:
    - `CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;`
    - `CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;`
    - `CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(id, token_version);`
- **Grandfathering Existing Users**:
  - `UPDATE users SET is_email_verified = TRUE WHERE is_email_verified = FALSE;`
  - All pre-existing dev, test, and admin accounts are grandfathered as verified.
  - New registrations start unverified (`DEFAULT FALSE`).
- **Explicit `ods_app` Grants**:
  - `users` is a mutable identity table (not an append-only ledger).
  - Explicit grant: `GRANT SELECT, UPDATE(token_version, password_hash, password_reset_token, password_reset_expires, is_email_verified, email_verification_token, email_verification_expires, failed_login_attempts, locked_until, updated_at) ON users TO ods_app;`
  - **DELETE Grant**: `ods_app` does **NOT** receive `DELETE` privilege on `users`. Test suite teardown cleanup is executed exclusively by `TEST_ADMIN_DB_*` (owner connection).
- **`otp_codes` Table Decision**:
  - **Keep and Deprecate for Password Recovery**: Migration 008 created `otp_codes` for SMS phone verification. It is preserved for future phone verification (Batch 11). Password recovery in Batch 5 uses dedicated hashed columns on `users`. Rollback impact of dropping would be destructive; keeping it has zero rollback impact.
- **`recovery.placeholder.js` Decision**:
  - **Deprecate and Replace**: The unmounted specification file is retired; executable endpoints are placed in `Backend/src/routes/auth.js`.

---

### 7. Security Hardening & Environment Controls

1. **`FRONTEND_ORIGIN` Startup Validation**:
   - `server.js` validates `FRONTEND_ORIGIN` at startup. If missing or invalid URL outside development, fails fast.
2. **Production SMTP Enforcement**:
   - In `production` (`NODE_ENV === 'production'`), `emailService.js` throws a fatal error if `SMTP_HOST`, `SMTP_PORT`, or `SMTP_USER` is missing.
3. **Zero Token / Secret Logging**:
   - Strictly no raw tokens, reset links, SMTP credentials, or passwords logged to console or stored in log files.
4. **HTML Template Escaping**:
   - User-supplied fields (e.g. `full_name`, `email`) in email templates are HTML-entity escaped to prevent HTML injection in email clients.
5. **Security Notices**:
   - Successful password reset or password change triggers an immediate transactional "Password Changed" security notice email to the account's registered address.
6. **Email-Change Endpoint Check**:
   - **Does an email-change endpoint exist today?** **No**.
   - **Future Constraint**: When an email-change feature is introduced in a future batch, it must enforce the constraint: *"No link or confirmation may be sent to an unverified changed address without re-authentication and dual-notice."*

---

## Action Plan & Phased Implementation

### Phase 1: Database Migration 015, Email Service, and Dev Mail (Mailpit)
**Rationale:** Creates the schema foundation for session invalidation and email token hashing, and initializes a secure Nodemailer client with Mailpit test integration.

**Steps:**
- [ ] Create `Backend/src/database/migrations/015_email_verification_and_session_invalidation.sql`:
  - Add `token_version INT NOT NULL DEFAULT 1` to `users`.
  - Add indexes for `password_reset_token`, `email_verification_token`, and `(id, token_version)`.
  - Grandfather existing users: `UPDATE users SET is_email_verified = TRUE`.
  - Grant explicit `SELECT, UPDATE` permissions on `users` to `ods_app`.
- [ ] Apply migration: `node src/database/migrate.js`.
- [ ] Implement `Backend/src/services/emailService.js`:
  - Transporter configuration using `nodemailer` (pointing to `SMTP_HOST:SMTP_PORT` / Mailpit `localhost:1025`).
  - Production SMTP validation (`NODE_ENV === 'production'` requires real SMTP).
  - Escaped transactional templates: Email Verification, Password Reset, Password Changed Notice, Account Registration Notice.
  - Zero token or link logging to stdout/stderr.
- [ ] Update `Backend/.env.example` with SMTP placeholders:
  `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, `SMTP_USER=`, `SMTP_PASS=`, `SMTP_FROM=no-reply@odsglobal.net`.
- [ ] Write Phase 1 automated tests in `Backend/test-batch5-endpoints.js`:
  - T1a: Mailpit health probe and connection test.
  - T1b: Migration 015 schema inspection (`token_version` exists, existing dev accounts grandfathered).
  - T1c: `ods_app` permission test (SELECT, UPDATE allowed; DELETE denied).
  - T1d: Zero token logging assertion.

**Rollback Plan:** Revert migration 015 using rollback script; remove `emailService.js`.  
**Exit Criteria:** Migration 015 applied cleanly; `node --check` passes; Mailpit responds and test emails are received on `localhost:8025`; Phase 1 tests pass.

---

### Phase 2: Password Recovery Engine & Anti-Enumeration Protections
**Rationale:** Replaces legacy recovery placeholder with production-grade, enumeration-safe password recovery.

**Steps:**
- [ ] Implement rate limiters in `Backend/src/routes/auth.js`:
  - `forgotPasswordLimiter` (5 per 15 min per IP, 3 per 15 min per email).
  - `resetPasswordLimiter` (5 attempts per 15 min per IP).
- [ ] Implement `POST /api/auth/forgot-password`:
  - RFC 5322 regex validation and email normalization.
  - Anti-enumeration uniform response with dummy cryptographic timing equalization.
  - Cryptographic 32-byte raw token generation; store SHA-256 hash in `users.password_reset_token` with 15-minute expiry.
  - Overwrite/invalidate prior pending reset tokens.
  - Dispatch reset email via `emailService` containing link to `${FRONTEND_ORIGIN}/reset-password?token=${rawToken}`.
  - `Referrer-Policy: no-referrer` header.
- [ ] Implement `POST /api/auth/reset-password`:
  - Accepts `{ token, newPassword }` in POST body.
  - Computes SHA-256 hash of token, finds user matching hash where `password_reset_expires > NOW()`.
  - Rejects if token expired, invalid, tampered, or already used (generic 400).
  - Password complexity validation (8–128 characters).
  - `bcryptjs` 12-round hashing.
  - Updates `password_hash`, clears `password_reset_token` and `password_reset_expires`, resets `failed_login_attempts = 0`, `locked_until = NULL`, and increments `token_version = token_version + 1`.
  - Sends "Password Changed" security notice email to user.
  - Logs `PASSWORD_RESET_SUCCESS` in `audit_logs`.
- [ ] Retire `Backend/src/routes/recovery.placeholder.js`.
- [ ] Write Phase 2 automated tests in `Backend/test-batch5-endpoints.js`:
  - T2a: Forgot-password returns uniform 200 for existing and non-existent emails.
  - T2b: Timing difference between existing and non-existing email requests is bounded.
  - T2c: Reset token retrieved from Mailpit API works to reset password.
  - T2d: Expired reset token rejected (400).
  - T2e: Replayed / already-used reset token rejected (400).
  - T2f: Tampered reset token rejected (400).
  - T2g: Reset token for User A cannot reset User B.
  - T2h: Requesting a newer reset token immediately invalidates older token.
  - T2i: Forgot-password rate limit enforced (429).
  - T2j: Reset-password rate limit enforced (429).
  - T2k: Password change notice email received in Mailpit.

**Rollback Plan:** Revert `Backend/src/routes/auth.js` changes; restore placeholder.  
**Exit Criteria:** All T2 test cases pass; no tokens printed to logs; `node --check` passes.

---

### Phase 3: Email Verification Flow & `requireVerifiedEmail` Middleware
**Rationale:** Enforces email verification on registration and protects sensitive platform operations while allowing unverified login.

**Steps:**
- [ ] Update `POST /api/auth/register` in `Backend/src/routes/auth.js`:
  - Newly registered users start with `is_email_verified = FALSE`.
  - Issues 32-byte verification token (SHA-256 hash stored in `email_verification_token`, 24h expiry).
  - Dispatches verification email via `emailService`.
  - Anti-enumeration: if email exists, returns uniform response and dispatches "account already exists" notice.
- [ ] Implement `POST /api/auth/resend-verification`:
  - Rate limited (cooldown 2 min, 3 per 15 min per IP/email, daily cap 10).
  - Generates fresh token, invalidates prior token, dispatches verification email.
  - Uniform response.
- [ ] Implement `GET /api/auth/verify-email`:
  - Validates raw token via query param or POST body against stored SHA-256 hash.
  - Enforces `email_verification_expires > NOW()`.
  - Updates `is_email_verified = TRUE`, clears token fields.
  - Writes `EMAIL_VERIFIED` audit log.
- [ ] Implement `requireVerifiedEmail` middleware in `Backend/src/middleware/auth.js`:
  - Inspects `req.user.role`: if `admin` or `super_admin`, allows immediately (`return next()`).
  - Queries/inspects user `is_email_verified`: if `FALSE`, returns `403 Forbidden` (`{ "success": false, "code": "EMAIL_NOT_VERIFIED", "message": "Email verification required to perform this action." }`).
- [ ] Mount `requireVerifiedEmail` on sensitive endpoints:
  - `POST /api/documents/upload`
  - `GET /api/documents/:id/view`
  - `PUT /api/merchant/profile`
  - `PUT /api/provider/profile`
  - `PUT /api/customer/profile`
- [ ] Write Phase 3 automated tests in `Backend/test-batch5-endpoints.js`:
  - T3a: New registration starts unverified and receives verification email in Mailpit.
  - T3b: Registration with duplicate email returns anti-enumeration response and triggers notice email.
  - T3c: Unverified user can log in and access `GET /api/auth/me`.
  - T3d: Unverified user denied (403 `EMAIL_NOT_VERIFIED`) on `POST /api/documents/upload`.
  - T3e: Unverified user denied on `PUT /api/customer/profile`.
  - T3f: Verification token from Mailpit successfully verifies user via `GET /api/auth/verify-email`.
  - T3g: Expired verification token rejected.
  - T3h: Resend verification enforces 2-minute cooldown and rate limit.
  - T3i: Admin and super_admin exempt from `requireVerifiedEmail`.

**Rollback Plan:** Revert middleware and auth route updates.  
**Exit Criteria:** All T3 test cases pass; `node --check` passes; verification state transitions confirmed.

---

### Phase 4: Session Invalidation Across Every Check Location
**Rationale:** Guarantees that any password change, reset, or administrative elevation immediately revokes stale JWT sessions across all platform routes.

**Steps:**
- [ ] Update `Backend/src/middleware/auth.js` (`requireAuth`):
  - Reject tokens without `token_version` claim (401).
  - Query DB: `SELECT id, role, is_active, token_version FROM users WHERE id = $1`.
  - Fail closed if user inactive or not found (401).
  - Verify `row.token_version === decoded.token_version`; reject if stale (401).
  - Populate current role from DB onto `req.user.role`.
- [ ] Update `POST /api/auth/login`: embed `token_version` in issued JWT.
- [ ] Update `PUT /api/customer/change-password`:
  - Dedicated change-password rate limiter (5 per hour per user).
  - Increment `token_version = token_version + 1` in `users`.
  - Re-issue fresh cookie with updated `token_version`.
  - Send "Password Changed" security notice email.
- [ ] Update `admin.js`:
  - Add `PUT /api/admin/users/:id/status` (bumps `token_version` on lock/deactivation).
  - Add `PUT /api/admin/users/:id/role` (bumps `token_version` on role change).
  - In `POST /api/admin/kyc/:entityType/:id/decision`: bump target entity's `user_id` `token_version`.
- [ ] Write Phase 4 automated tests in `Backend/test-batch5-endpoints.js`:
  - T4a: Legacy/tampered token without `token_version` claim rejected (401).
  - T4b: Active session becomes invalid (401) immediately after password reset.
  - T4c: Active session becomes invalid (401) immediately after password change on login.
  - T4d: Stale session rejected on `GET /api/auth/me`.
  - T4e: Stale session rejected on customer, merchant, provider, and admin routes.
  - T4f: Admin deactivating a user immediately invalidates the user's active session.
  - T4g: Role promotion updates token version and ejects stale session.
  - T4h: New password works and old password fails after reset.

**Rollback Plan:** Revert `requireAuth` query to purely cryptographic check; revert route version bumps.  
**Exit Criteria:** All T4 test cases pass; session invalidation proven across all routes.

---

### Phase 5: Frontend Pages & Human-Check Verification Handshake
**Rationale:** Connects user interfaces to the backend endpoints for human UI verification.

**Steps:**
- [ ] Update `Frontend/src/pages/ForgotPasswordPage.tsx`:
  - Wire submission to `POST /api/auth/forgot-password`.
  - Display anti-enumeration confirmation state.
- [ ] Update `Frontend/src/pages/ResetPasswordPage.tsx`:
  - Extract `token` from URL search parameters.
  - Wire submission to `POST /api/auth/reset-password`.
  - Handle success and expired token error states.
- [ ] Implement email verification banner in `Frontend/src/components/layout/DashboardShell.tsx`:
  - Shows alert when `user.is_email_verified === false`.
  - Includes "Resend Verification Email" button with cooldown timer.
- [ ] Implement `Frontend/src/pages/VerifyEmailPage.tsx` (or view route) to process verify tokens.
- [ ] Validate frontend build: `npx tsc --noEmit` and `npm run build`.

**Rollback Plan:** Revert frontend page modifications.  
**Exit Criteria:** Frontend compiles cleanly; human verification of forgot, reset, and banner views succeeds.

---

### Phase 6: Full Verification Suite, Regressions, and Commit Sync
**Rationale:** Runs full test suites against `ods_app` runtime and prepares Batch 5 documentation.

**Steps:**
- [ ] Execute `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch5-endpoints.js`.
- [ ] Execute `node test-batch3-endpoints.js` regression suite.
- [ ] Execute `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` regression suite.
- [ ] Re-verify dev accounts preserved in approved status.
- [ ] Fill Commit Sync Record in plan.
- [ ] Update `Status/PROJECT_STATUS.md`.

---

## Verification Plan

| # | Check | Command / method | Type | Expected Result |
| :- | :--- | :--- | :--- | :--- |
| 1 | Baseline Health Check | `node test-connection.js` | Auto | Connected as `ods_app` on `ods_global.net` |
| 2 | Migration 015 | `node src/database/migrate.js` | Auto | Migration 015 applied cleanly |
| 3 | Backend Syntax | `node --check <file>` individually for all backend files | Auto | All files pass exit code 0 |
| 4 | TypeScript Verification | `npx tsc --noEmit` | Auto | Exit code 0, zero type errors |
| 5 | Frontend Production Build | `npm run build` | Auto | Exit code 0, dist bundle generated |
| 6 | Batch 5 Test Suite | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch5-endpoints.js` | Auto | Complete security test suite passes |
| 7 | Regression: Batch 3 | `node test-batch3-endpoints.js` | Auto | 17 Passed / 0 Failed |
| 8 | Regression: Batch 4 | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` | Auto | 96 Passed / 0 Failed |
| 9 | Dev Account Integrity | SQL assertion on dev accounts | Auto | `merchant01@ods.com`, `merchant@123.com`, `serviceprovider@123.com` preserved and approved |
| 10 | Human UI Verification | Manual browser verification | 🧑 Human | Forgot password, reset password, and verification banner verified |

---

## Approval (human-owned — the agent leaves these blank)
**Approval status:** Pending  
**Approved by:**  
**Approval phrase received:** *(must match the directive: `"Approved: proceed"`)*  
**Plan revision approved:**  
**Date/time approved:**  

---

## Revision Log (append-only)
| Rev | Date/time | Change (delta only) | Re-approval needed? |
| :--- | :--- | :--- | :--- |
| 1 | 2026-10-13 14:00 | Initial draft for Batch 5: Email Foundation, Account Recovery, and Session Invalidation. | Yes |
| 2 | 2026-10-13 15:45 | Incorporate user binding decisions: (1) Scope traceability matrix explicitly mapping files; (2) Session invalidation table across all check points with fail-closed DB verification and explicit admin.js handlers; (3) Token architecture: 15m reset / 24h verif, hash-only SHA-256 storage, single-use, Referrer-Policy no-referrer, POST-body exchange; (4) Anti-enumeration with dummy timing equalization and registration notice email; (5) Rate limits per IP and per email with documented in-memory limitation; (6) Migration 015 specs with explicit ods_app grants, grandfathering existing users, keeping otp_codes for phone verification; (7) FRONTEND_ORIGIN validation, production SMTP enforcement, zero-secret logging; (8) requireVerifiedEmail middleware gating sensitive endpoints (including KYC doc submission) with admin/super_admin exemption; (9) Mailpit dev mail catcher with startup probe; (10) Restructured into 6 phases with individual tests, rollback, and exit criteria per phase. | Yes |
