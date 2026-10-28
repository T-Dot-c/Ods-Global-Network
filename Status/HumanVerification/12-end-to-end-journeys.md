# ODS Global Network — End-to-End Multi-Role Journeys Verification Checklist

**Scope:** 8 Integrated Multi-Role Workflows Connecting Public Visitors, Customers, Providers, Merchants, and Administrators  
**Applicable Batches:** All Batches (Batch 3 through Batch 12)  
**Purpose:** Validate real-world end-to-end journeys across browser sessions, state machines, email triggers, and financial settlements.

---

## 1. Journey Index

1. **Journey 1: Customer Onboarding, Email Verification & Profile Setup**
2. **Journey 2: Healthcare Provider Accreditation & Compliance Onboarding**
3. **Journey 3: Clinical Service Listing Authoring, Review & Public Publishing**
4. **Journey 4: Complete Appointment Booking, 10-Minute Hold & Chapa Payment**
5. **Journey 5: Appointment Rescheduling, Cancellation & Refund Settlement**
6. **Journey 6: Digital Gift Card Gifting, Email Delivery, Wallet Claim & Clinic Voucher Redemption**
7. **Journey 7: Dual-Admin Multi-Authorization High-Value Refund Workflow (>10,000 ETB)**
8. **Journey 8: Account Security Incident: Password Reset, Admin Force Sign-Out & Suspension**

---

## 2. Integrated Journeys Checklist

### Journey 1: Customer Onboarding, Email Verification & Profile Setup

- [ ] **CHK-E2E-J1** | Flow: Visitor to Verified Customer | Steps:  
  1. Open `/register` as anonymous visitor.  
  2. Fill in full name (`Abebe Bikila`), email (`abebe.test@ods.et`), password, and submit.  
  3. Notice redirection to `/profile` with amber banner: "Please verify your email address to unlock appointment booking and gift card purchases."  
  4. Open Mailpit at `http://127.0.0.1:8025` and find the verification email addressed to `abebe.test@ods.et`.  
  5. Click the verification link in the email.  
  6. Verify landing on `/verify-email?token=...` with green success toast: "Your email has been verified successfully!"  
  7. On `/profile`, edit phone number (`+251911223344`) and city (`Addis Ababa`), and click "Save Changes".  
  | Expect: User status transitions immediately from unverified to verified. Amber warning banner disappears. Profile reflects updated phone and city. Database `email_verified_at` timestamp is populated. | Watch for: Expired token error on fresh link, amber banner persisting after refresh, 500 crash on profile update. | Batch: 3, 10, 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### Journey 2: Healthcare Provider Accreditation & Compliance Onboarding

- [ ] **CHK-E2E-J2** | Flow: Provider Applicant to Approved Clinical Partner | Steps:  
  1. Register a new provider account (`dr.solomon@ods.et`) with role `provider`.  
  2. Log in and land on `/provider/dashboard`. Notice status banner: "Account Pending Verification — Submit Accreditation Documents."  
  3. Upload valid PDF Medical License and Clinic Registration Certificate.  
  4. Submit application for compliance review. Notice banner changes to "Application Under Review".  
  5. Open Mailpit and verify `onboarding.admin_new_application` email sent to `compliance@ods.et`.  
  6. In a second browser window, sign in as Compliance Admin (`admin.compliance@ods.et`).  
  7. Open `/admin/dashboard#kyc` and locate Dr. Solomon's submission.  
  8. Click to inspect uploaded license documents. Verify inline preview loads safely.  
  9. Click "Approve Application", add optional welcome note, and confirm.  
  10. Return to Dr. Solomon's provider browser window and refresh.  
  | Expect: Provider dashboard instantly displays green badge: "Approved & Verified Healthcare Provider". Service listing creation and calendar scheduling tools unlock. Provider receives congratulatory email in Mailpit. | Watch for: Documents failing to render in admin preview, approval failing without reason, status remaining pending after admin approval. | Batch: 4, 10, 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### Journey 3: Clinical Service Listing Authoring, Review & Public Publishing

- [ ] **CHK-E2E-J3** | Flow: Provider Draft to Catalog Publication | Steps:  
  1. As approved provider (`dr.solomon@ods.et`), go to `/provider/dashboard#services`.  
  2. Click "Create New Service". Enter:  
     - Title: `Comprehensive Cardiology Screening`  
     - Category: `Cardiology`  
     - Duration: `45 minutes`  
     - Price: `2,500.00 ETB`  
     - Description: Full clinical checkup details.  
  3. Click "Submit for Moderation". Status shows "Pending Review".  
  4. In admin session (`admin.support@ods.et`), open `/admin/dashboard#services`.  
  5. Find the cardiology service in pending moderation queue.  
  6. Click "Approve & Publish".  
  7. In a clean incognito window, navigate to the public `/catalog` and filter by "Cardiology".  
  | Expect: The service card appears in public search results with price `2,500.00 ETB`, provider name Dr. Solomon, and a functional "Book Appointment" button. Clicking the card opens `/services/<id>` with all details accurately rendered. | Watch for: Service appearing before admin approval, price showing decimal errors, 404 on service detail page. | Batch: 4, 6, 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### Journey 4: Complete Appointment Booking, 10-Minute Hold & Chapa Payment

- [ ] **CHK-E2E-J4** | Flow: Public Discovery to Confirmed Appointment | Steps:  
  1. As logged-in verified customer (`cust.active@ods.et`), navigate to `/services/<cardiology_service_id>`.  
  2. Select an available time slot for tomorrow (e.g. 10:00 AM) and click "Book Appointment".  
  3. Land on `/checkout/appointment/<hold_id>`. Notice live countdown timer starting at `10:00` minutes.  
  4. In another browser tab, attempt to select that exact same time slot as a different customer. Verify slot is blocked/unavailable.  
  5. On checkout page, select payment method "Chapa Pay (Card / Telebirr)".  
  6. Click "Proceed to Secure Payment". Redirects to Chapa Sandbox gateway.  
  7. Enter Chapa test card `4084084084084081`, expiry `12/28`, CVV `123`, and click "Pay 2,500.00 ETB".  
  8. Chapa redirects back to `/checkout/success?ref=...`.  
  | Expect: Success screen displays booking reference and transaction receipt. Appointment status transitions to `confirmed` (or `awaiting_provider`). Both customer and provider receive confirmation emails in Mailpit with ICS calendar attachment. Customer wallet/profile shows appointment in "Upcoming". | Watch for: Hold timer expiring while on Chapa page, double booking permitted, payment confirmation failing to trigger emails. | Batch: 5, 8, 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### Journey 5: Appointment Rescheduling, Cancellation & Refund Settlement

- [ ] **CHK-E2E-J5** | Flow: Confirmed Booking to Rescheduled to Cancelled & Refunded | Steps:  
  1. As customer (`cust.active@ods.et`), go to `/profile` -> "My Appointments".  
  2. Find the confirmed appointment from Journey 4.  
  3. Click "Reschedule Appointment". Select a new date 3 days later at 2:00 PM. Confirm.  
  4. Verify reschedule confirmation toast and check Mailpit for `booking.rescheduled` alert.  
  5. Back on appointment details, click "Cancel Appointment".  
  6. Review cancellation policy dialog (e.g. "Full refund eligible if cancelled >24h in advance"). Select reason "Personal conflict" and confirm.  
  7. Notice appointment status transitions to `cancelled`.  
  8. In admin session (`admin.finance@ods.et`), open `/admin/dashboard#payments`. Verify refund record created and processed for `2,500.00 ETB`.  
  | Expect: Reschedule successfully moves time slot and updates provider calendar. Cancellation frees the reserved slot. Automated or finance-approved refund logs properly in transaction ledger without orphaned records. Customer receives cancellation and refund notice. | Watch for: Original slot staying blocked after reschedule, cancellation failing silently, refund amount calculating incorrectly. | Batch: 5, 8, 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### Journey 6: Digital Gift Card Gifting, Email Delivery, Wallet Claim & Clinic Voucher Redemption

- [ ] **CHK-E2E-J6** | Flow: Gift Purchase to Recipient Claim to In-Clinic Redemption | Steps:  
  1. As customer (`cust.active@ods.et`), visit `/gift-cards`.  
  2. Select gift design "Health & Wellness", enter value `5,000.00 ETB`.  
  3. Enter recipient name (`Sara Tesfaye`), email (`sara.recipient@ods.et`), and personal note ("Wishing you great health!").  
  4. Complete payment via Chapa Sandbox card `4084084084084081`.  
  5. Open Mailpit at `http://127.0.0.1:8025`. Locate email to `sara.recipient@ods.et` with subject "You've received an ODS Gift Card!".  
  6. Click "Claim Your Gift" link in the email. Lands on `/gifts/claim?token=...`.  
  7. Sara signs in (or creates account) and clicks "Add to My Wallet".  
  8. Check Sara's `/wallet` balance — verify it displays `5,000.00 ETB`.  
  9. Sara visits clinic and presents digital voucher code or QR code (`ODS-GIFT-XXXX-XXXX`).  
  10. Healthcare provider (`dr.solomon@ods.et`) goes to `/provider/dashboard#vouchers`.  
  11. Provider enters voucher code `ODS-GIFT-XXXX-XXXX` and clicks "Validate & Claim".  
  | Expect: Provider dashboard displays: "Voucher Valid: 5,000.00 ETB for Sara Tesfaye. Status: Active." Provider clicks "Confirm Redemption". Voucher status updates to `redeemed`. Sara's wallet balance updates. Buyer receives `gift.redeemed_notice` in Mailpit. | Watch for: Voucher usable multiple times (double spend), expired voucher accepted, provider seeing another clinic's voucher. | Batch: 7, 8, 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### Journey 7: Dual-Admin Multi-Authorization High-Value Refund Workflow (>10,000 ETB)

- [ ] **CHK-E2E-J7** | Flow: High-Value Refund Dual Approval Governance | Steps:  
  1. In admin session as Admin A (`admin.finance@ods.et`), navigate to `/admin/dashboard#payments`.  
  2. Locate or simulate an eligible enterprise or high-value transaction of `25,000.00 ETB`.  
  3. Click "Initiate Refund". Enter reason: "Contractual enterprise service adjustment".  
  4. Confirm submission. Notice the refund status shows `pending_approval` (Two-person authorization triggered because amount > 10,000 ETB).  
  5. As Admin A, attempt to click "Approve Refund".  
  6. Verify system blocks Admin A: "Dual authorization required: Initiator cannot approve their own refund."  
  7. Open Mailpit and verify `payment.admin_refund_approval_pending` alert sent to secondary approvers.  
  8. Sign out and sign in as Admin B (Super Admin `admin.super@ods.et`).  
  9. Navigate to `/admin/dashboard#payments`. Find the pending `25,000.00 ETB` refund.  
  10. As Admin B, click "Approve Refund" and enter approval note.  
  | Expect: Refund transitions from `pending_approval` to `completed`. Audit log captures two distinct actors (`requested_by: admin.finance`, `approved_by: admin.super`). Ledger updates with matching debit/credit entries. Customer receives refund completion notice. | Watch for: Single admin approving high-value refund, audit log missing one of the actors, status stuck in pending after second approval. | Batch: 8, 10, 11, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### Journey 8: Account Security Incident: Password Reset, Admin Force Sign-Out & Suspension

- [ ] **CHK-E2E-J8** | Flow: Security Breach Response & Account Remediation | Steps:  
  1. Have customer (`cust.active@ods.et`) actively logged into Window 1.  
  2. In Window 2, navigate to `/forgot-password` and enter `cust.active@ods.et`.  
  3. In Mailpit, click the password reset link. Enter new password and submit.  
  4. In Window 1, refresh the page or click any link. Verify customer is forced to re-login with new password.  
  5. In Window 3 as Super Admin (`admin.super@ods.et`), open `/admin/dashboard#users`.  
  6. Find `cust.active@ods.et`. Click "Force Sign-Out".  
  7. In customer's window, verify immediate session termination with alert toast.  
  8. Back in Admin window, click "Suspend Account", select reason "Suspected fraudulent activity", and submit.  
  9. Attempt to log in with customer credentials on `/login`.  
  10. Verify login is blocked with explicit suspension notice.  
  11. As Admin, click "Reactivate Account".  
  12. Customer logs in again successfully.  
  | Expect: Password reset revokes all prior tokens. Force sign-out immediately terminates active browser sessions without server restart. Suspension blocks subsequent authentication. Reactivation restores full access cleanly. All events logged in audit trail and dispatched to Mailpit. | Watch for: Active session surviving force sign-out, suspended user still able to call APIs with existing JWT, missing audit records. | Batch: 3, 10, 11, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:
