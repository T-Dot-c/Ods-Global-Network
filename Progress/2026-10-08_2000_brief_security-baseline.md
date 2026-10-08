# Brief: Security Baseline & Hardening Assessment

> **DOCUMENT TYPE**: Security & Vulnerability Assessment (Batch 3)  
> **DATE**: 2026-10-08  
> **SCOPE REFERENCE**: KPIs & SCOPES Module 10 (Security) & System Directive  

---

## 1. Security Vulnerability Ranking & Threat Analysis

This assessment audits the current security baseline across `./Backend` and `./Frontend`, ranking findings by severity and impact.

| Rank & Severity | Vulnerability / Concern | Current Implementation | Risk & Threat Model | Batch 3 Remediation vs. Deferred |
| :--- | :--- | :--- | :--- | :--- |
| **1. HIGH** | **Seeded Admin Account in Migration 009** | `009_seed_admin.sql` inserts `admin@odsglobal.net` with plain known credentials. | High vulnerability if deployed outside localhost; attacker with known password could gain super_admin access. | **BATCH 3 FIX**: Add migration `012_remove_or_rotate_seeded_admin.sql` to remove the default test admin or lock it behind environment variable gating. |
| **2. HIGH** | **Missing Server-Side Role Enforcement Middleware** | `verifySession` exists in `auth.js:65`, but no Express middleware protects routes by role (`requireRole('customer')`). | An authenticated user of one role (e.g. `merchant`) could call customer or admin endpoints if they exist and are not explicitly checked. | **BATCH 3 FIX**: Build `Backend/src/middleware/auth.js` (`requireAuth`, `requireRole`) and bind to all new `/api/customer/*` endpoints. |
| **3. MEDIUM** | **Superuser Database Connection** | Backend connects to PostgreSQL as the `postgres` superuser. | Compromise of the backend process or SQL injection could lead to full DB server compromise. | **DEFERRED (Documented Release Blocker)**: Requires creating a dedicated `ods_app_user` with restricted privileges before staging/prod deployment. |
| **4. MEDIUM** | **Rate Limiting Granularity on Sensitive Actions** | Global auth limiter is 20 req / 15 min per IP (`server.js:78`). | Password changes and profile modifications could be subjected to targeted brute-force if not protected. | **BATCH 3 FIX**: Attach dedicated rate limiter (10 req / 15 min) to `POST /api/customer/change-password` and `PUT /api/customer/profile`. |
| **5. LOW** | **Token Lifetime & Storage** | JWT is signed with 1-day expiration and stored in `HttpOnly`, `SameSite=Lax` cookie. | Well-fortified against XSS. However, no database token revocation blacklist exists on logout (session relies on cookie destruction). | **CURRENT BASELINE ACCEPTABLE FOR BATCH 3**: 1-day JWT in HttpOnly cookie is secure for MVP. Revocation lists / Redis store deferred to Advanced Auth batch. |
| **6. LOW** | **CORS Configuration & Dev Origins** | `server.js:34-61` dynamically allows localhost ports (5173, 5174, 5175) in development, and enforces `FRONTEND_ORIGIN` in production. | Development configuration is safe for local pair-programming. In production, strict single-origin matching is enforced. | **KEEP**: Production guard is already in place (`server.js:23-28`). |
| **7. LOW** | **Information Leakage in Error Messages** | Forgot password uses uniform anti-enumeration message (`auth.js:417`). Auth errors return generic `"Invalid email or password"`. | Error handling is hardened against user enumeration. | **KEEP**: Preserve anti-enumeration across all new endpoints. |

---

## 2. Minimal Batch 3 Security Fix List

1. **Migration 012 (`012_remove_or_rotate_seeded_admin.sql`)**:
   - Removes the static seeded test admin credentials from the database to eliminate the release blocker.
2. **Server-Side Auth Middleware (`Backend/src/middleware/auth.js`)**:
   - `requireAuth`: Verifies `ods_session` cookie; returns HTTP 401 if missing or invalid.
   - `requireRole(...roles)`: Verifies `req.user.role` matches allowed roles; returns HTTP 403 Forbidden with `{ success: false, message: 'Access denied: insufficient permissions.' }` on role mismatch.
3. **Audit Logging Table (`013_create_audit_logs_table.sql`) & Service**:
   - Implements Module 10 KPI ("Audit logging enabled for key actions").
   - Logs `user_id`, `action` (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `PASSWORD_CHANGE`, `PROFILE_UPDATE`), `ip_address`, `user_agent`, and `timestamp`.
4. **Dedicated Endpoint Rate Limiters**:
   - Apply specific `rateLimit` middleware on password change and profile updates.

---

## 3. Items Deferred to Future Batches

1. **Database Role Principle of Least Privilege**:
   - Creating `ods_app_user` with limited `GRANT` permissions on specific tables (documented as a non-local deployment release blocker).
2. **Session Revocation List / Redis Blacklist**:
   - Immediate invalidation of active JWTs across multiple devices upon password change (requires Redis or database session table in a future infrastructure batch).
3. **Two-Factor Authentication (2FA) for Administrative Logins**:
   - Mandatory OTP / TOTP for admin accounts (scheduled for Admin Portal batch).

---

## 4. Verified Facts vs. Assumptions

### Verified:
- `Backend/src/database/migrations/009_seed_admin.sql:14-26` created test admin credentials in PostgreSQL.
- `server.js:78-84` has a 20 req / 15 min rate limiter on `/api/auth`.
- `auth.js:413-438` implements anti-enumeration on password recovery.

### Assumed:
- Assumed that removing the test admin via migration `012` is the preferred approach, with documentation added for how developers can seed an admin account locally using a secure node script or environment variable.
