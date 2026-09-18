# Implementation Plan: Post-Registration Success Flow + Role-Based Dashboard Routing

**Project:** ODS Global Network  
**Created:** 2026-09-18 1208  
**Status:** ✅ Executed — 2026-09-18 1333  

---

## Original User Prompt

> TASK: Post-Registration Success Flow + Role-Based Dashboard Routing
> 
> PROJECT: ODS Global Network
> ROOT: All paths relative to project root. Absolute paths forbidden.
> 
> ## Objective
> Implement the flow connecting Register → Login → role-based placeholder Dashboard, 
> for all 4 roles: Customer, Merchant, Provider, Admin.
> 
> ## Part 1 — Post-Registration Success Message
> 
> After a successful registration (any role: Customer, Merchant, Provider):
> - Show a clean success confirmation screen/message immediately after form submission 
>   (do not silently redirect — the user must see confirmation their account was created).
> - Message must include:
>   - Confirmation that the account was created (role-aware wording, e.g. 
>     "Your Merchant account has been created" vs "Welcome, [Name]").
>   - If approval_status = 'pending' (Merchant/Provider): note that their account 
>     is pending review/approval, so expectations are set correctly.
>   - A direct, clearly visible link/button: "Go to Login" → routes to the Login page.
> - Do NOT auto-login the user after registration. Registration and Login are 
>   separate steps in this flow — the user must log in manually after registering, 
>   even though a link is provided for convenience.
> 
> ## Part 2 — Login → Authentication → Role-Based Redirect
> 
> On the Login page, when valid credentials are submitted:
> 1. Verify credentials against `users` table (email + password_hash via bcrypt compare).
> 2. On success:
>    - Create an authenticated session (JWT via httpOnly cookie, per earlier security 
>      decisions — no token in URL, no localStorage).
>    - Update `last_login_at`, reset `failed_login_attempts` to 0.
>    - Read `role` from the authenticated user record.
>    - Redirect based on role:
>      - `customer`   → /dashboard/customer
>      - `merchant`   → /dashboard/merchant
>      - `provider`   → /dashboard/provider
>      - `admin`      → /dashboard/admin
> 3. On failure: standard invalid-credentials error, increment `failed_login_attempts`, 
>    apply lockout logic per earlier rate-limiting decision.
> 
> Each dashboard route must be protected — unauthenticated users or users of a 
> different role attempting to access another role's dashboard URL directly must 
> be redirected to Login (no role can view another role's dashboard).
> 
> ## Part 3 — Placeholder Dashboard Design (all 4 roles)
> 
> Each dashboard is a minimal, clean placeholder — not functional yet — displaying ONLY:
> 
> - **Welcome header**: "Welcome, [First Name / Business Name]"
> - **Role badge**: a small label/chip showing their role (e.g. "Merchant", "Provider")
> - **Account status** (Merchant/Provider only): approval_status shown clearly 
>   (e.g. "Status: Pending Review" / "Status: Approved") — Customer and Admin skip this.
> - **"Coming soon" notice**: short line indicating full dashboard features are in 
>   development (e.g. "Your full dashboard is under construction — more features 
>   coming soon.")
> - **Logout button**: clears the session and returns to Home or Login.
> 
> >> ASSUMPTION FLAGGED: The user's original instruction was cut off after 
>    "displaying only:" — the field list above (Welcome header, Role badge, 
>    Account status, Coming soon notice, Logout) is my proposed minimal default. 
>    Confirm or adjust this list before building.
> 
> Do NOT add any other content, widgets, charts, or navigation to these placeholder 
> dashboards — they exist only to prove the auth + routing flow works end-to-end.
> 
> ## Brand & Design
> - Use ./Assets for all styling (colors, logo, typography) — consistent with 
>   Home/Login/Register pages already built.
> 
> ## Constraints
> - Do not modify ./resource, ./System Directive, or ./Assets — read-only.
> - Frontend → ./Frontend. Backend/API → ./Backend.
> 
> ## Required Workflow (mandatory)
> 1. Action Plan — routes, session/cookie handling approach, redirect logic, 
>    and confirm the placeholder dashboard field list.
> 2. Implementation Plan → ./Progress/YYYY-MM-DD_HHMM_post-registration-login-dashboards.md
> 3. Wait for approval — exact phrase "Approved: proceed"
> 4. Execution
> 5. Documentation Update → ./Status

---

## Action Plan (High-Level Summary)

This plan implements the complete end-to-end user lifecycle connecting **Registration Confirmation** → **Secure Login & Session Management** → **Role-Based Protected Dashboard Routing** for all four platform roles (`customer`, `merchant`, `provider`, `admin`).

1. **Part 1 — Post-Registration Confirmation (`./Frontend/src/pages/RegisterPage.tsx`)**:
   - Immediately display an in-place, role-aware confirmation screen upon registration submission (no silent redirect, no auto-login).
   - Display role-specific messaging:
     - **Customer**: Confirms active account ready for immediate login.
     - **Merchant / Institutional**: Confirms application received and explicitly states that the account is in `pending` compliance review.
     - **Service Provider**: Confirms application received and explicitly states that the account is in `pending` accreditation review.
   - Provide a prominent, direct `"Go to Login"` button that navigates the user to the Login page.

2. **Part 2 — Backend Auth Engine & Database Verification (`./Backend`)**:
   - Establish API server in `./Backend` with Express, CORS (supporting credentials), and cookie-parser.
   - Implement database user verification against the `users` table:
     - Compare passwords using `bcryptjs` (12 rounds).
     - Track `failed_login_attempts` with progressive lockout (locks account for 15 minutes after 5 consecutive failures).
     - On valid credentials, update `last_login_at` and reset `failed_login_attempts = 0`.
   - Issue secure session via **`HttpOnly`, `SameSite=Lax` cookie** (`ods_session`), strictly eliminating tokens in URLs or `localStorage`.
   - Expose endpoints:
     - `POST /api/auth/register` (handles Customer, Merchant, Provider registration with correct `approval_status`)
     - `POST /api/auth/login` (verifies credentials, issues cookie)
     - `GET /api/auth/me` (reads cookie, returns current session and role)
     - `POST /api/auth/logout` (clears cookie)

3. **Part 3 — Frontend Routing & Route Guards (`./Frontend`)**:
   - Configure declarative URL-based client routing in `./Frontend` supporting:
     - `/` (Home)
     - `/login` (Login)
     - `/register` (Register)
     - `/dashboard/customer` (Customer Dashboard)
     - `/dashboard/merchant` (Merchant Dashboard)
     - `/dashboard/provider` (Service Provider Dashboard)
     - `/dashboard/admin` (Admin Dashboard)
   - Implement `ProtectedRoute` wrapper component:
     - Redirects unauthenticated visitors to `/login`.
     - Strictly enforces RBAC: visitors with a role mismatch attempting direct URL access are redirected to their own designated dashboard or `/login`.

4. **Part 4 — Minimal Placeholder Dashboards (`./Frontend/src/pages/dashboards/`)**:
   - Build 4 minimal placeholder dashboard views strictly containing **ONLY** the 5 approved items:
     1. **Welcome header**: `"Welcome, [First Name / Business Name]"`
     2. **Role badge**: Small styled chip indicating role (`Customer`, `Merchant`, `Service Provider`, `Administrator`)
     3. **Account status**: Shown **only** for Merchant and Provider (e.g. `"Status: Pending Review"` or `"Status: Approved"`)
     4. **Coming soon notice**: `"Your full dashboard is under construction — more features coming soon."`
     5. **Logout button**: Clears session cookie via `/api/auth/logout` and redirects to `/login`.

---

## Implementation Details

### Phase 1: Post-Registration Confirmation Screen

**Rationale:** Users must clearly understand the state of their account immediately after submitting registration. Customers can log in right away, whereas Merchants and Providers must be informed that their accounts require compliance/accreditation approval before full activation.

**Steps:**
- [ ] Update Step 3 in `./Frontend/src/pages/RegisterPage.tsx` to display role-aware confirmation copy:
  - **Customer**: `"Welcome, [Name]! Your customer account has been created."`
  - **Merchant**: `"Application Submitted! Your Merchant account has been created and is currently pending review by our compliance team."`
  - **Service Provider**: `"Application Submitted! Your Service Provider account has been created and is currently pending accreditation verification."`
- [ ] Provide prominent button labeled `"Go to Login"` directing to `/login`.
- [ ] Ensure auto-login does NOT occur after registration.

### Phase 2: Backend Authentication API & Database Schema

**Rationale:** System directives mandate zero token exposure (no JWT in URL or localStorage) and strict password hashing via bcrypt (12 rounds). An HttpOnly session cookie ensures maximum security and seamless route protection.

**Steps:**
- [ ] Create `./Backend/package.json` with dependencies: `express`, `cors`, `cookie-parser`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `mysql2` (or SQLite fallback for robust local dev testing).
- [ ] Create `./Backend/src/server.js` configuring CORS with `credentials: true` for `http://localhost:5173`.
- [ ] Implement database connection and ensure `users` table schema:
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `email VARCHAR(255) UNIQUE NOT NULL`
  - `password_hash VARCHAR(255) NOT NULL`
  - `full_name VARCHAR(255) NOT NULL`
  - `role ENUM('customer', 'merchant', 'provider', 'admin') NOT NULL`
  - `approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'` (Customer/Admin default `'approved'`, Merchant/Provider default `'pending'`)
  - `failed_login_attempts INT DEFAULT 0`
  - `lockout_until DATETIME DEFAULT NULL`
  - `last_login_at DATETIME DEFAULT NULL`
  - `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
- [ ] Implement `POST /api/auth/register` to save registered users with bcrypt-hashed passwords.
- [ ] Implement `POST /api/auth/login`:
  - Validate email & password against `users` table using `bcrypt.compare`.
  - Enforce rate-limiting / lockout (lock for 15 mins after 5 failed attempts).
  - On success, reset `failed_login_attempts = 0`, update `last_login_at = NOW()`.
  - Issue JWT with payload `{ id, email, role, full_name, approval_status }` in `HttpOnly` cookie `ods_session`.
  - Return `{ success: true, user: { id, email, role, full_name, approval_status } }`.
- [ ] Implement `GET /api/auth/me` to authenticate the cookie session and return the current user profile.
- [ ] Implement `POST /api/auth/logout` to clear the `ods_session` cookie.

### Phase 3: Frontend Routing & Protected Route Guards

**Rationale:** Routing must handle deep-linking and browser navigation while strictly preventing cross-role access to unauthorized dashboards.

**Steps:**
- [ ] Install or configure client routing in `./Frontend` (e.g. `react-router-dom` or browser history routing with URL sync).
- [ ] Create `./Frontend/src/context/AuthContext.tsx` to provide `user`, `role`, `loading`, `login()`, `logout()`.
- [ ] Create `./Frontend/src/components/auth/ProtectedRoute.tsx`:
  - Validates session with `AuthContext`.
  - If unauthenticated, redirects to `/login`.
  - If authenticated user role does not match required route role, redirects to their own role dashboard.
- [ ] Update `./Frontend/src/pages/LoginPage.tsx`:
  - Call `/api/auth/login` on form submission.
  - On success, read `user.role` and route to `/dashboard/${user.role}`.
  - On failure, display error message and failed attempt warnings.

### Phase 4: Placeholder Dashboards (All 4 Roles)

**Rationale:** Provide clean, minimal, brand-consistent placeholder dashboards strictly containing only the 5 approved items to verify end-to-end auth flow.

**Steps:**
- [ ] Create `./Frontend/src/pages/dashboards/CustomerDashboard.tsx`:
  - Welcome header: `"Welcome, [First Name]"`
  - Role badge: `"Customer"`
  - "Coming soon" notice: `"Your full dashboard is under construction — more features coming soon."`
  - Logout button: calls logout and returns to `/login`.
- [ ] Create `./Frontend/src/pages/dashboards/MerchantDashboard.tsx`:
  - Welcome header: `"Welcome, [Business Name / Representative]"`
  - Role badge: `"Merchant"`
  - Account status: `"Status: Pending Review"` or `"Status: Approved"`
  - "Coming soon" notice: `"Your full dashboard is under construction — more features coming soon."`
  - Logout button: calls logout and returns to `/login`.
- [ ] Create `./Frontend/src/pages/dashboards/ProviderDashboard.tsx`:
  - Welcome header: `"Welcome, [Facility Name / Contact]"`
  - Role badge: `"Service Provider"`
  - Account status: `"Status: Pending Review"` or `"Status: Approved"`
  - "Coming soon" notice: `"Your full dashboard is under construction — more features coming soon."`
  - Logout button: calls logout and returns to `/login`.
- [ ] Create `./Frontend/src/pages/dashboards/AdminDashboard.tsx`:
  - Welcome header: `"Welcome, [Name]"`
  - Role badge: `"Administrator"`
  - "Coming soon" notice: `"Your full dashboard is under construction — more features coming soon."`
  - Logout button: calls logout and returns to `/login`.
- [ ] Style all dashboards with `./Assets` brand standards (navy/gold palette, typography, responsive card).

---

## Verification Checklist

- [ ] Post-registration confirmation displays role-tailored messaging for Customer, Merchant, and Provider.
- [ ] Direct "Go to Login" button properly navigates to `/login` without auto-logging in.
- [ ] Valid login credentials authenticate via bcrypt compare against `users` table.
- [ ] Successful login issues JWT inside secure `HttpOnly` cookie (`ods_session`).
- [ ] `last_login_at` updates and `failed_login_attempts` resets to 0 upon successful login.
- [ ] Role-based redirect navigates to the exact path (`/dashboard/customer`, `/dashboard/merchant`, `/dashboard/provider`, `/dashboard/admin`).
- [ ] Direct URL access to unauthorized dashboard routes is blocked and redirects to Login.
- [ ] All 4 placeholder dashboards display ONLY the 5 approved minimal items.
- [ ] Logout button clears session cookie and routes back to `/login`.
- [ ] TypeScript compilation (`tsc --noEmit`) passes with 0 errors.

---

## Approval

**Approval status:** ✅ Approved  
**Approved by:** User  
**Approval phrase received:** "Approved Proceed"  
**Date/time approved:** 2026-09-18 1318  
**Execution completed:** 2026-09-18 1333  

---

## Post-Execution Notes

## Post-Execution Notes

### Files Created / Modified

| File | Action |
|------|--------|
| `Frontend/src/pages/RegisterPage.tsx` | MODIFIED — success card now shows role-aware headline, pending-review banner for Merchant/Provider, customer first-name in greeting, "Go to Login" CTA |
| `Frontend/src/context/AuthContext.tsx` | NEW — AuthProvider + useAuth hook, HttpOnly cookie session via `/api/auth/me` on mount |
| `Frontend/src/App.tsx` | REWRITTEN — AuthProvider wrapper, 7-view state type, RBAC route guard in `handleNavigate`, session-restore loading splash |
| `Frontend/src/pages/LoginPage.tsx` | MODIFIED — real `fetch` to `/api/auth/login`, role-based redirect, error banner, full 4-role `roleMeta` |
| `Frontend/src/pages/dashboards/DashboardShell.tsx` | NEW — shared branded placeholder with 5 approved items |
| `Frontend/src/pages/dashboards/CustomerDashboard.tsx` | NEW — thin wrapper |
| `Frontend/src/pages/dashboards/MerchantDashboard.tsx` | NEW — thin wrapper |
| `Frontend/src/pages/dashboards/ProviderDashboard.tsx` | NEW — thin wrapper |
| `Frontend/src/pages/dashboards/AdminDashboard.tsx` | NEW — thin wrapper |
| `Frontend/src/components/layout/Header.tsx` | MODIFIED — `onNavigate` prop widened to `string` |
| `Backend/package.json` | CREATED — full deps list |
| `Backend/src/server.js` | NEW — Express + helmet + CORS credentials + rate limiters |
| `Backend/src/db.js` | NEW — PostgreSQL pool |
| `Backend/src/routes/auth.js` | NEW — register, login, /me, logout |
| `Backend/.env.example` | NEW — config template |

### Verification
- `npx tsc --noEmit` → **Exit code 0, zero errors** ✅
- `npm install` in Backend → **103 packages, 0 vulnerabilities** ✅

### Next Steps (before production)
1. Copy `Backend/.env.example` → `Backend/.env` and fill in real DB credentials and a strong JWT secret
2. Create the `users` table in PostgreSQL (schema documented in Phase 2 implementation details above)
3. Start backend: `cd Backend && npm run dev`
4. Start frontend: `cd Frontend && npm run dev`
5. Full end-to-end test of Register → Success Screen → Login → Dashboard → Logout flow
