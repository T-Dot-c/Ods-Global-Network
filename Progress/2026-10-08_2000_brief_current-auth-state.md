# Brief: Current Authentication & Session State

> **DOCUMENT TYPE**: Architectural Brief (Batch 3)  
> **DATE**: 2026-10-08  
> **SCOPE REFERENCE**: KPIs & SCOPES Module 3 (Customer Portal) & Module 10 (Security)  

---

## 1. Executive Summary

This brief provides a comprehensive code-level audit of the authentication, session management, and role-based access control (RBAC) mechanisms currently implemented across `./Frontend` and `./Backend`. It explicitly contrasts **production-grade live implementations** against **mocked, placeholder, or missing elements**.

---

## 2. Real vs. Mocked Analysis Matrix

| Domain | Implemented (Real) | Mocked / Missing / Assumed | Verification Reference |
| :--- | :--- | :--- | :--- |
| **Registration** | ✅ Real PostgreSQL multi-table atomic transaction (`users`, `merchants`, `providers`, `addresses`, `contact_persons`). Validates email regex, length bounds, password length (8-128 chars), bcrypt (12 rounds). | ⚠️ No SMS/Email verification dispatch (OTP record inserted into DB, but outbound SMTP/SMS gateway is not wired). | [auth.js:116-278](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L116-L278) |
| **Login** | ✅ Real database lookup against `users`, `bcrypt.compare`, progressive lockout (5 failed attempts &rarr; 15-minute lockout), `last_login_at` update, `failed_login_attempts` reset on success. | None in core flow. | [auth.js:283-369](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L283-L369) |
| **Token & Session** | ✅ Real JWT signed with `JWT_SECRET` issued via `Set-Cookie` as `HttpOnly`, `SameSite=Lax` cookie named `ods_session` with 1-day expiration. Zero storage in `localStorage` or URL query params. | ⚠️ No token revocation list / Redis session blacklist on logout (relies on cookie clearing). | [auth.js:52-60](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L52-L60), [AuthContext.tsx:43-55](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Frontend/src/context/AuthContext.tsx#L43-L55) |
| **Password Recovery** | ✅ Real endpoints `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`. Relational `otp_codes` storage with 15-min expiry, anti-enumeration uniform response, bcrypt-hashed OTP codes. | ⚠️ In local dev, OTP is output to console log rather than dispatched over real SMS/SMTP. | [auth.js:415-568](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L415-L568) |
| **Server Role Checks** | ❌ **MISSING / NOT ENFORCED**: `verifySession` exists in `auth.js`, but there is NO reusable middleware (`requireAuth`, `requireRole`) guarding protected API endpoints. | Endpoints currently rely on inline session verification inside `auth.js:374` (`/api/auth/me`). | [auth.js:65-73](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L65-L73) |
| **Client Role Checks** | ✅ Real client-side RBAC in `App.tsx` routing (`DASHBOARD_VIEWS`, `ROLE_TO_DASHBOARD`), redirecting role mismatches to `/unauthorized`. | ⚠️ Client-side routing is not a security boundary; server must strictly reject unauthorized requests with HTTP 403. | [App.tsx:110-124](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Frontend/src/App.tsx#L110-L124) |
| **Customer Dashboard** | ❌ **MOCKED**: Stat cards have hardcoded 0s, Quick Actions trigger browser `alert()`, sidebar tabs do not switch views, no profile view/edit component exists. | Dashboard is a static shell without dynamic customer state or sub-views. | [CustomerDashboard.tsx:21-54](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Frontend/src/pages/dashboards/CustomerDashboard.tsx#L21-L54) |

---

## 3. Deep Dive into Codebase Locations

### 3.1 Backend Authentication Flow
- **Registration**: [Backend/src/routes/auth.js:116-278](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L116-L278)
  - Uses `pool.connect()` with `BEGIN` / `COMMIT` / `ROLLBACK`.
  - Hashes passwords using `bcrypt.hash(password, 12)`.
  - Checks duplicate email: `SELECT id FROM users WHERE email = $1`.
- **Login**: [Backend/src/routes/auth.js:283-369](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L283-L369)
  - Enforces payload size limits (`email <= 255`, `password <= 128`).
  - Checks lockout: `users.locked_until > now()` &rarr; returns HTTP 423.
  - Updates failed attempts: `UPDATE users SET failed_login_attempts = $1, locked_until = $2`.
  - Issues cookie: `res.cookie('ods_session', token, { httpOnly: true, sameSite: 'lax', secure: COOKIE_SECURE, maxAge: COOKIE_MAX_AGE })`.
- **Session Verification**: [Backend/src/routes/auth.js:374-397](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Backend/src/routes/auth.js#L374-L397)
  - `GET /api/auth/me` decodes JWT from cookie, queries `users` table for `id, email, full_name, phone, role, last_login_at`, and queries `merchants`/`providers` for approval status.

### 3.2 Frontend Auth & Session State
- **Context**: [Frontend/src/context/AuthContext.tsx:1-88](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Frontend/src/context/AuthContext.tsx)
  - Manages `user: AuthUser | null` (`id`, `email`, `full_name`, `role`, `approval_status`) and `loading: boolean`.
  - Restores session automatically on app startup via `fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })`.
- **App Router & Protection**: [Frontend/src/App.tsx:110-136](file:///c:/Users/Tewolde/Desktop/Y%20Arc%20System%20PLC/Ods%20Global/Ods-Global-Network/Frontend/src/App.tsx#L110-L136)
  - Intercepts navigation to `dashboard`, `merchant/dashboard`, `provider/dashboard`, `admin/dashboard`.
  - Unauthenticated users redirected to `/login`; role mismatches redirected to `/unauthorized`.

---

## 4. Gaps to Close in Batch 3

1. **Server-Side Protected Customer Routes**:
   - Need `GET /api/customer/profile` and `PUT /api/customer/profile` guarded by server middleware.
   - Need `POST /api/customer/change-password` requiring verification of the user's current password.
2. **Server-Side Authorization Middleware**:
   - Create `Backend/src/middleware/auth.js` providing `requireAuth` (verifies valid session cookie) and `requireRole(roles)` (verifies role matches 'customer', 'admin', etc.).
3. **Customer Dashboard View State**:
   - Refactor `CustomerDashboard.tsx` to handle active tab switching (Overview, Profile, Appointments, Bookings, Notifications, Settings) with live profile data binding.
