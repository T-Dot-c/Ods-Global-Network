# 05. Human Verification Checklist — Suspended Account

**Target Role**: Suspended User (Customer, Merchant, or Provider)  
**Starting State**: Account marked suspended by an Administrator (`is_active = FALSE`)  
**Primary URL**: `http://localhost:5173/login`

---

## Module A: Sign-In Rejection & User Feedback

- [ ] **SUS-AUTH-001** | Page: `/login` | Do: 1. In the Super Admin console, suspend a test customer account (e.g. `test_suspended@example.com`).<br>2. In a fresh private browser tab, attempt to sign in with that suspended account. | Expect: Sign-in is strictly blocked. A prominent red alert banner displays: "Account Suspended: Your account has been deactivated by administrative review. If you believe this is an error, please contact customer support." | Watch for: System saying "Invalid password" or generic internal server error. | Batch: 5, 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **SUS-AUTH-002** | Page: `/login` (Support Appeal Link) | Do: 1. On the suspension error banner, inspect the contact support link.<br>2. Click "contact customer support". | Expect: Navigates directly to the `/support` page with the user's email pre-populated in the inquiry form and Subject set to "Account Suspension Appeal". | Watch for: Dead link or 404 error. | Batch: 2, 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: Live Session Invalidation (Immediate Revocation)

- [ ] **SUS-REV-001 [HIGH RISK]** | Page: Customer Dashboard (`/dashboard`) | Do: 1. In Browser Window A, log in as active customer `customer@123.com`.<br>2. In Browser Window B, log in as Super Admin and suspend `customer@123.com`.<br>3. Return to Window A and attempt any action (e.g. click "Profile" or "Appointments"). | Expect: Action is immediately rejected. Active session is destroyed on the spot. Window A redirects to `/login` with an alert: "Your session has ended. Your account is currently suspended." | Watch for: Suspended user continuing to browse private dashboard or create bookings. | Batch: 5, 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: Password Reset & Anti-Enumeration Defense

- [ ] **SUS-REC-001** | Page: `/forgot-password` | Do: 1. Navigate to `/forgot-password`.<br>2. Enter the email address of the suspended account.<br>3. Click "Send Recovery Link". | Expect: Screen shows uniform feedback: "If an account exists with this email, a password reset link has been dispatched." Check Mailpit (`http://127.0.0.1:8025`) and verify that ZERO password reset emails were sent to the suspended account. | Watch for: Mailpit receiving a password reset link for a suspended user (security leak). | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: Account Reactivation Workflow

- [ ] **SUS-ACT-001** | Page: `/admin/dashboard#users` | Do: 1. In the Super Admin console, navigate to Users tab.<br>2. Locate the suspended account.<br>3. Click "Reactivate Account".<br>4. Enter reason: "Identity verified after compliance review." | Expect: Status updates to green badge: "Active". Check Mailpit to verify the user received an official account reactivation notification email. | Watch for: Reactivated account remaining blocked from login. | Batch: 10, 11
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **SUS-ACT-002** | Page: `/login` | Do: 1. Return to the login page as the reactivated user.<br>2. Sign in with original password. | Expect: Sign-in succeeds immediately without errors. Redirects to `/dashboard` with full access restored. | Watch for: Persistent suspension state requiring manual cache clearing. | Batch: 5, 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
