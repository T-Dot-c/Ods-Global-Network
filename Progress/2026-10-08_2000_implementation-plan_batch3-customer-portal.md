# Implementation Plan: Batch 3 Customer Portal & Security Baseline

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-08_2000_implementation-plan_batch3-customer-portal.md`  
**Task ref:** TASK 07 (Batch 3 Customer Portal & Security Baseline)  
**Tier:** L  
**Created:** 2026-10-08 20:00  
**Status:** Pending Approval  

---

## 1. Original User Prompt
> "Final steps for Batch 2. Do them in this order and stop if any step fails... BATCH 3: CUSTOMER PORTAL (module 3 of the scope document, plus the start of module 10 Security)
> Source of authority, highest first:
> 1. resource/KPIs & SCOPES ODS GLOBAL NET .txt
> 2. Assets/BRAND_GUIDELINES.md and Assets/ODS_BRAND_GUIDELINE.pdf
> 3. Legacy code in resource/client/src and resource server code
> 4. Current Frontend/ and Backend/
> PROPOSED SCOPE:
> - Customer registration, login, password recovery (frontend exists from Batch 1; recovery endpoints exist).
> - Server-side authentication and role checks.
> - Removal or rotation of the seeded default admin (migration 009).
> - Customer profile (view and edit) and a customer dashboard shell.
> - Appointment history, booking history, notifications: honest empty states only. Booking is Batch 7 and notifications are Batch 9. No mock data, no claims about features that do not exist.
> Out of scope: merchant and provider registration, document upload, payments, gift cards, admin pages.
> THIS TURN: PHASES 0 TO 2 ONLY. WRITE NO APPLICATION CODE."

---

## 2. Baseline Check (Gathered Evidence)

| Item | Result / Quoted Evidence |
| :--- | :--- |
| **Current Stage** | Batch 2 Merged (`b51fe1c5c52c546d9cb87f9912273ae733d96b65`) in `PROJECT_STATUS.md` |
| **Branch / HEAD** | `batch3-customer-portal` created cleanly from `main` (`b51fe1c`) |
| **Working Tree** | Clean (`nothing to commit, working tree clean`) |
| **Sync Marker vs HEAD** | Remote `main` in sync with local `main` (`b51fe1c`) |
| **Legacy Codebase** | `./resource` locked as read-only reference |

---

## 3. Scope Traceability

| # | Requirement | Source Document | Implementation Step |
| :--- | :--- | :--- | :--- |
| 1 | Customer Registration, Login & Recovery | `Scope Doc §3 (Customer Portal)` | Preserved from Batch 1; auth routes wired to PostgreSQL |
| 2 | Customer Profile Management (View & Edit) | `Scope Doc §3 (Customer Portal)` | Phase 2 (Endpoints) & Phase 3 (Frontend UI) |
| 3 | Server-Side Authentication & Role Enforcement | `Scope Doc §10 (Security)` | Phase 1 (`Backend/src/middleware/auth.js`) |
| 4 | Removal of Seeded Default Admin | `PROJECT_STATUS.md §4 (Release Blockers)` | Phase 1 (`Backend/src/database/migrations/012_remove_seeded_admin.sql`) |
| 5 | Audit Trail for Key Actions | `Scope Doc §10 (Security)` | Phase 1 (`013_create_audit_logs_table.sql`) & Phase 2 (`auditService.js`) |
| 6 | Appointment & Booking History (Honest Empty States) | `Scope Doc §3 (Customer Portal)` | Phase 3 (`CustomerDashboard.tsx` panels) |
| 7 | Notifications (Honest Empty State) | `Scope Doc §3 (Customer Portal)` | Phase 3 (`CustomerDashboard.tsx` panels) |

---

## 4. Action Plan (High-Level Summary)

1. **Phase 1: Database Migrations & RBAC Middleware**:
   - Create migration `012_remove_seeded_admin.sql` to purge static test credentials and `013_create_audit_logs_table.sql` for security logging.
   - Build server-side auth middleware `Backend/src/middleware/auth.js` (`requireAuth`, `requireRole`) and audit logger `Backend/src/services/auditService.js`.
2. **Phase 2: Customer Endpoints & Security Updates**:
   - Build `Backend/src/routes/customer.js` supporting `GET /api/customer/profile`, `PUT /api/customer/profile`, and `POST /api/customer/change-password`.
   - Update `auth.js` login and recovery routes to write security events to `audit_logs`.
   - Mount `/api/customer` in `server.js` with rate limiting.
3. **Phase 3: Frontend Customer Service & Interactive Dashboard UI**:
   - Build `Frontend/src/services/customerService.ts` with error handling.
   - Add `updateUser` to `AuthContext.tsx`.
   - Refactor `CustomerDashboard.tsx` to support tab switching across Overview, My Profile, Security, Appointments, Gift Cards, and Notifications with honest empty states and zero mock data.
4. **Phase 4: Verification, Test Suite & Documentation**:
   - Run typecheck (`npx tsc --noEmit`), build (`npm run build`), migration checks, and full API endpoint test matrix.
   - Update `PROJECT_STATUS.md` and generate audit logs.

---

## 5. Open Decisions

| ID | Question | Options | Agent Recommendation | Human Decision |
| :--- | :--- | :--- | :--- | :--- |
| **OD-1** | Seeded Admin Removal Strategy | A) Delete default admin in migration 012 and provide local admin seeding script.<br>B) Keep admin with randomized password. | **Option A (Recommended)**: Delete static test admin via migration `012`, provide `scripts/seed-admin.js` for local dev. | *(Pending Approval)* |
| **OD-2** | Customer Email Mutability | A) Keep email immutable in profile editor.<br>B) Allow email editing without re-verification. | **Option A (Recommended)**: Keep email strictly read-only to prevent account hijacking. | *(Pending Approval)* |

---

## 6. Files in Scope

### Files to Create:
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend\src\database\migrations\012_remove_seeded_admin.sql`
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend\src\database\migrations\013_create_audit_logs_table.sql`
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend\src\middleware\auth.js`
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend\src\services\auditService.js`
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend\src\routes\customer.js`
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Frontend\src\services\customerService.ts`
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Frontend\src\pages\dashboards\customer\CustomerProfileTab.tsx`
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Frontend\src\pages\dashboards\customer\CustomerSecurityTab.tsx`

### Files to Modify:
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend\src\server.js` (mount customer routes and audit logging)
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend\src\routes\auth.js` (wire login/recovery audit logging)
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Frontend\src\context\AuthContext.tsx` (add `updateUser` helper)
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Frontend\src\pages\dashboards\CustomerDashboard.tsx` (connect interactive tabs and real profile data)
- `c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Status\PROJECT_STATUS.md` (record Batch 3 milestones)

### Explicitly Out of Scope:
- `./resource/*` (Strictly read-only)
- `Frontend/src/pages/CompanyPage.tsx`, `SupportPage.tsx`, `PartnerWithUsPage.tsx` (Batch 2 files remain untouched)
- `Frontend/src/pages/dashboards/MerchantDashboard.tsx`, `ProviderDashboard.tsx`, `AdminDashboard.tsx`

---

## 7. Detailed Implementation Steps

### Phase 1: Database Migrations & RBAC Middleware
**Rationale:** Remove seeded admin release blocker, establish security audit logging, and construct server-side role verification.
**Steps:**
1. Create `012_remove_seeded_admin.sql` executing `DELETE FROM users WHERE email = 'admin@odsglobal.net';`.
2. Create `013_create_audit_logs_table.sql` creating table `audit_logs` with columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID REFERENCES users(id) ON DELETE SET NULL`, `action VARCHAR(50) NOT NULL`, `ip_address VARCHAR(45)`, `user_agent VARCHAR(255)`, `details JSONB DEFAULT '{}'`, `created_at TIMESTAMPTZ DEFAULT now()`.
3. Create `Backend/src/middleware/auth.js`:
   - `requireAuth(req, res, next)`: Extracts `ods_session` cookie, verifies JWT using `JWT_SECRET`, attaches decoded payload to `req.user`. Returns HTTP 401 if missing/invalid.
   - `requireRole(...roles)`: Verifies `req.user.role` is included in `roles`. Returns HTTP 403 with `{ success: false, message: 'Access denied: insufficient permissions.' }` if unauthorized.
4. Create `Backend/src/services/auditService.js` providing `logAuditEvent({ userId, action, ip, userAgent, details })`.
5. Run migrations via `npm run db:migrate`.
**Rollback:** Run reverse SQL statements to restore admin or drop tables if migration fails.

---

### Phase 2: Customer Endpoints & Security Updates
**Rationale:** Expose protected REST endpoints for customer profile management and password modification.
**Steps:**
1. Create `Backend/src/routes/customer.js`:
   - `GET /api/customer/profile`: Protected by `requireAuth` and `requireRole('customer', 'admin')`. Queries `users` table for `id, email, full_name, phone, role, preferred_language, notification_preference, created_at, last_login_at`.
   - `PUT /api/customer/profile`: Protected by `requireAuth` and `requireRole('customer', 'admin')`. Validates:
     - `full_name`: string, 1–128 chars trimmed.
     - `phone`: optional string, max 32 chars.
     - `preferred_language`: whitelist `['en', 'am']`.
     - `notification_preference`: whitelist `['email', 'sms', 'both']`.
     - Updates `users` table and writes `PROFILE_UPDATE` event to `audit_logs`.
   - `POST /api/customer/change-password`: Protected by `requireAuth`. Validates:
     - `currentPassword`: string, checked via `bcrypt.compare` against `users.password_hash`.
     - `newPassword`: string, 8–128 chars.
     - Hashes new password (12 rounds), updates `users.password_hash`, resets lockout counters, and writes `PASSWORD_CHANGE` event to `audit_logs`.
2. In `server.js`, mount `customer.js` under `/api/customer` with a dedicated 10 req / 15 min rate limiter.
3. In `auth.js`, hook `logAuditEvent` to record `LOGIN_SUCCESS`, `LOGIN_FAILED`, and `PASSWORD_RESET` events.
**Rollback:** Revert `server.js` and `auth.js` edits; remove `customer.js`.

---

### Phase 3: Frontend Customer Service & Dashboard UI
**Rationale:** Connect the customer frontend to real backend endpoints with responsive, accessible tabs and honest empty states.
**Steps:**
1. Create `Frontend/src/services/customerService.ts`:
   - `getCustomerProfile()`: `GET /api/customer/profile` with `credentials: 'include'`.
   - `updateCustomerProfile(data)`: `PUT /api/customer/profile` with `credentials: 'include'`.
   - `changePassword(data)`: `POST /api/customer/change-password` with `credentials: 'include'`.
2. Update `Frontend/src/context/AuthContext.tsx`:
   - Add `updateUser: (fields: Partial<AuthUser>) => void` to synchronize `user` context in-memory upon successful profile edits.
3. Create `Frontend/src/pages/dashboards/customer/CustomerProfileTab.tsx`:
   - Renders Full Name input, disabled Email input, Phone input, Language selector, Notification channel selector, and Save button.
   - Includes real-time validation error display and success toast banner.
4. Create `Frontend/src/pages/dashboards/customer/CustomerSecurityTab.tsx`:
   - Renders Current Password, New Password with strength meter, Confirm Password, and Update Password button.
5. Refactor `Frontend/src/pages/dashboards/CustomerDashboard.tsx`:
   - Adds stateful sidebar navigation switching between:
     - `'overview'`: Stat cards (0 Bookings, 0 Active Vouchers), Quick action shortcuts (Explore Services &rarr; `#services`, Buy Gift Card &rarr; `#gifting`, Edit Profile &rarr; switches to `'profile'`, Support &rarr; navigates to `/support`), and empty Recent Activity card.
     - `'profile'`: Renders `<CustomerProfileTab />`.
     - `'security'`: Renders `<CustomerSecurityTab />`.
     - `'appointments'`: Renders honest empty state with vector calendar icon and roadmap note (Batch 7).
     - `'giftcards'`: Renders honest empty state with vector gift icon and roadmap note (Batch 7).
     - `'notifications'`: Renders honest empty state with vector bell icon and roadmap note (Batch 9).
**Rollback:** `git restore` on `AuthContext.tsx` and `CustomerDashboard.tsx`.

---

### Phase 4: Verification, Testing & Documentation
**Rationale:** Validate all changes against strict compiler, security, and functional standards.
**Steps:**
1. Execute `npx tsc --noEmit` in `Frontend/` &rarr; verify 0 errors.
2. Execute `npm run build` in `Frontend/` &rarr; verify exit code 0.
3. Run automated backend endpoint verification script testing:
   - Valid customer profile GET/PUT.
   - Invalid customer input rejection (400).
   - Unauthenticated request rejection (401).
   - Wrong-role request rejection (403).
   - Password change with valid current password (200).
   - Password change with wrong current password (400).
   - Verification of `audit_logs` records in PostgreSQL.
4. Complete manual browser verification checklist (desktop and mobile emulation).
5. Update `Status/PROJECT_STATUS.md` recording Batch 3 completion.

---

## 8. Test Plan & Quoting Protocol

Every verification step will be executed in real terminals with output quoted:

```bash
# 1. Database Migrations Check
npm run db:migrate

# 2. TypeScript Compilation Check
npx tsc --noEmit

# 3. Production Bundle Build
npm run build

# 4. Backend Route Syntax Check
node -c src/server.js src/routes/customer.js src/middleware/auth.js

# 5. Endpoint & RBAC Verification Test Script
node test-batch3-endpoints.js
```

---

## 9. Key Performance Indicators (KPIs) & Measurement

| Module | Authoritative KPI | Measurement Method | Target |
| :--- | :--- | :--- | :--- |
| **Module 3 (Customer Portal)** | Login Success Rate | Ratio of successful authentications vs. valid credentials submitted in test suite. | &gt; 99% |
| **Module 3 (Customer Portal)** | Registration Completion | Ratio of valid customer registrations successfully committed to database without transaction aborts. | &gt; 95% |
| **Module 3 (Customer Portal)** | Profile Update Integrity | Verified persistence of updated profile fields in PostgreSQL `users` table. | 100% |
| **Module 10 (Security)** | Zero Critical Vulnerabilities | Elimination of seeded test admin from database and enforcement of server-side RBAC on customer routes. | 0 Criticals |
| **Module 10 (Security)** | Audit Logging for Key Actions | Count of structured log rows created in `audit_logs` for login, password update, and profile update actions. | 100% logged |

---

## 10. Manual Verification Checklist

- [ ] **Tab Navigation**: Clicking Overview, My Profile, Security, Appointments, Gift Cards, Notifications cleanly renders each sub-panel without page reloads.
- [ ] **Profile Editing**: Editing Full Name and Phone updates the database and immediately updates the topbar user dropdown name without reloading.
- [ ] **Read-Only Email**: Email field is disabled with an explanatory tooltip/label.
- [ ] **Password Change**: Entering wrong current password displays a clean error banner; entering correct current password and compliant new password succeeds and resets the form.
- [ ] **Empty States**: Appointments, Gift Cards, and Notifications display honest vector-illustrated cards with zero mock figures.
- [ ] **Accessible Focus**: All interactive elements in the customer tabs display luminous gold focus rings (`outline: 2px solid var(--color-gold-bright)`).

---

## 11. Not Verified (To Be Executed in Phase 3 Execution Turn)

The following items cannot be verified until application code execution is authorized:
- Execution of database migration `012` and `013`.
- Live API response of `GET /api/customer/profile` and `PUT /api/customer/profile`.
- Live password change end-to-end round trip.
- Frontend browser rendering of newly built tabs.
