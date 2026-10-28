# ODS Global Network — Super Administrator Human Verification Checklist

**Role Target:** Super Administrator (`role = 'admin'` with `system_admin` or complete RBAC authority)  
**Pre-requisite Test Account:** `admin.super@ods.et` (Password from `ADMIN_PASSWORD` in `.env`, or configured super admin)  
**Applicable Batches:** Batch 3, Batch 8, Batch 10, Batch 11, Batch 12  
**Purpose:** Verify system administration, staff account provisioning, role-based access control (RBAC), TOTP two-factor authentication (2FA), global platform settings, and immutable audit logs.

---

## 1. Quick Reference & Security Bounds

| Item | Specification |
| :--- | :--- |
| **Admin Route** | `/admin/dashboard` |
| **Primary Navigation Tabs** | `#overview`, `#users`, `#staff`, `#services`, `#appointments`, `#payments`, `#kyc`, `#settings`, `#audit` |
| **TOTP Standard** | RFC 6238 time-based one-time password (6 digits, 30-second window) |
| **Audit Log Guarantee** | Append-only, tamper-evident audit records logged on all administrative mutations |
| **Security Negative Boundary** | Super admin **cannot** bypass the two-person refund rule (>10,000 ETB self-approval block) and **cannot** read raw passwords or encryption keys |

---

## 2. Verification Checklist

- [ ] **CHK-SADM-01** | Page: `/login` & `/admin/dashboard#overview` | Do: 1. Navigate to `/login`. 2. Enter Super Admin credentials and sign in. 3. Verify landing on `/admin/dashboard#overview`. | Expect: Clean administrative dashboard displaying system-wide aggregate metrics (total users, active appointments, transaction volume in ETB, pending KYC queue count). All navigation tabs are visible and accessible. | Watch for: 403 Forbidden, missing overview metrics, broken charts, raw database counts or `NaN`. | Batch: 3, 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-02** | Page: `/admin/dashboard#staff` | Do: 1. Click the "Staff Management" tab. 2. Click "Create Staff User" or "Invite Admin". 3. Enter a full name (`Test Support Agent`), email (`temp.support@ods.et`), select role group `Support`, and submit. | Expect: Confirmation toast "Staff member created successfully". New user appears in staff table with assigned role `support` and active status. Temporary invite or verification email generated in Mailpit (`http://127.0.0.1:8025`). | Watch for: Unhandled 500 server error, duplicate email crash, silent failure without table refresh. | Batch: 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-03** | Page: `/admin/dashboard#staff` | Do: 1. In the staff user table, find an active staff member (`temp.support@ods.et`). 2. Click "Edit Roles / Permissions". 3. Add `finance` group permissions or toggle individual overrides (e.g. `payments.view_ledger`). 4. Save changes. | Expect: Permission update succeeds with "Permissions updated" toast. Audit record logged for permission mutation. When the updated staff user logs in, their navigation updates to show the newly granted tabs without requiring backend code redeployment. | Watch for: RBAC permissions not persisting, checkboxes resetting on modal reopen, missing audit trail. | Batch: 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-04** | Page: `/admin/dashboard#staff` | Do: 1. In staff table, select a staff user (`temp.support@ods.et`). 2. Click "Deactivate Account" and confirm the prompt. 3. In an incognito browser window, attempt to sign in with that deactivated staff account. | Expect: Deactivated badge appears in the staff table. Attempting to sign in returns error message: "Account is inactive or suspended. Contact an administrator." Sign-in is blocked. | Watch for: Inactive staff member still able to log in, silent failure, unhandled crash. | Batch: 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-05** | Page: `/admin/dashboard#users` | Do: 1. Open the Users tab and find an active customer or merchant currently logged in. 2. Click "Force Sign-Out" (or "Revoke Active Sessions"). 3. In the user's active browser window, attempt to navigate to `/profile` or perform any authenticated action. | Expect: "Active sessions revoked" confirmation in admin panel. In user's browser, the next request or page refresh immediately redirects to `/login` with toast "Your session has expired or was revoked. Please log in again." | Watch for: User session remaining valid despite revocation, stale token reuse succeeding. | Batch: 10, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-06** | Page: `/admin/dashboard#profile` (or Security Settings) | Do: 1. Navigate to admin security / profile settings. 2. Click "Enable Two-Factor Authentication (2FA)". 3. Verify display of QR code and manual base32 secret key. 4. Open an authenticator app (Google Authenticator, Microsoft Authenticator, or Bitwarden). 5. Scan QR code and enter generated 6-digit TOTP code. 6. Click "Verify and Activate". | Expect: "Two-factor authentication enabled successfully" confirmation. Display of single-use emergency recovery backup codes (with warning to copy and store safely). | Watch for: Broken QR code image, invalid time sync rejection without clear error message, missing recovery codes. | Batch: 10, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-07** | Page: `/login` (TOTP Login Challenge) | Do: 1. Sign out of Super Admin session. 2. Enter admin email and password on `/login`. 3. Click "Sign In". 4. Verify prompt for 6-digit TOTP code. 5. Enter invalid code (`000000`). 6. Enter valid 6-digit code from authenticator app. | Expect: Invalid code shows "Invalid two-factor authentication code. Please try again." Valid code successfully signs in and redirects to `/admin/dashboard#overview`. | Watch for: Direct bypass of 2FA prompt, infinite loading spinner, lack of rate limiting on failed TOTP attempts. | Batch: 10, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-08** | Page: `/admin/dashboard#settings` | Do: 1. Navigate to the Platform Settings tab. 2. Verify display of system operational parameters (e.g. `booking_hold_duration_minutes` = 10, `gift_voucher_expiry_days` = 90, `refund_two_person_threshold_etb` = 10000). 3. Update an allowed setting (e.g. edit a customer support contact phone or email). 4. Click "Save Settings". | Expect: "Platform settings updated successfully" toast. New setting reflects immediately. Audit log captures `settings.update` with previous and updated values. | Watch for: Unhandled backend 500, non-numeric values accepted for threshold fields, missing validation feedback. | Batch: 10, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-09** | Page: `/admin/dashboard#audit` | Do: 1. Navigate to the "Audit Logs" tab. 2. Verify chronological display of recent admin and sensitive user actions. 3. Filter by Action type (e.g. `user.suspend`, `refund.approve`, `kyc.approve`). 4. Filter by Date range (today). 5. Click on an individual log entry to inspect JSON details. | Expect: Audit table displays: Timestamp (local/UTC), Actor Email, IP Address, Action Performed, Target Entity Type & ID, and Status. Inspection modal shows metadata diff without leaking plain-text passwords or secret keys. Table is read-only (no delete or edit buttons exist). | Watch for: Ability to delete or alter audit records (prohibited), missing actor IP, JSON formatting errors, empty table when actions have occurred. | Batch: 10, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-SADM-10** | Page: `/admin/dashboard#payments` (Two-Person Refund Rule Strict Enforcement) | Do: 1. Navigate to Payments / Refunds tab. 2. Initiate a refund for an eligible transaction exceeding 10,000 ETB (e.g. 15,000 ETB). 3. Notice the refund enters status `pending_approval`. 4. As this same Super Admin who requested it, attempt to click "Approve Refund". | Expect: System strictly blocks self-approval with explicit error message: "Dual authorization required: You cannot approve a refund that you initiated." The button is either disabled or returns a 403 Forbidden alert. The approval MUST be completed by a different administrator. | Watch for: Super admin privilege overriding the two-person rule (this is a critical security vulnerability), silent approval, status transitioning to completed without second admin. | Batch: 8, 10, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

## 3. Negative Boundary Checks ("Must NOT Be Able To")

- [ ] **CHK-SADM-NEG-01** | Action: Super Admin cannot delete or truncate the `audit_logs` table via any UI control or API endpoint.
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

- [ ] **CHK-SADM-NEG-02** | Action: Super Admin cannot view user passwords in plaintext, decryption keys, or secret tokens in audit log metadata or user inspection modals.
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

- [ ] **CHK-SADM-NEG-03** | Action: Super Admin cannot approve their own high-value refund (>10,000 ETB) under any circumstance.
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:
