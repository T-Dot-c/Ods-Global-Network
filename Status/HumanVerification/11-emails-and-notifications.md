# ODS Global Network — Emails & Notification Engine Verification Checklist

**Scope:** All 35 Notification Events across Email, In-App, and Admin Alert Channels  
**Local Testing Inbox:** Mailpit web interface at `http://127.0.0.1:8025`  
**Applicable Batches:** Batch 11, Batch 12  
**Purpose:** Ensure every transactional, security, booking, payment, and administrative notification renders properly, contains valid dynamic data, includes mandatory security headers, and respects user preferences.

---

## 1. Quick Reference & Email Standards

| Property | Requirement |
| :--- | :--- |
| **Mailpit Web UI** | `http://127.0.0.1:8025` |
| **SMTP Delivery Port** | `127.0.0.1:1025` |
| **From Address** | `ODS Global Network <no-reply@ods.et>` (or configured `MAIL_FROM`) |
| **Mandatory Headers** | `X-ODS-Notification-Id`, `X-ODS-Event-Type`, `List-Unsubscribe` (for non-essential events) |
| **Template Formatting** | Clean HTML with inline CSS + Plaintext fallback (`multipart/alternative`) |
| **Placeholders** | Zero raw mustache tags like `{{user_name}}`, `{{amount}}`, or `{{date}}` visible to the recipient |

---

## 2. Notification Events Verification Matrix

### A. Account & Security Events (5 Events)

- [ ] **CHK-NOTIF-01** | Event: `auth.verification_requested` | Trigger: Register new user on `/register` or click "Resend Verification" | Recipient: New registrant email | Expect in Mailpit: Subject contains "Verify your email". Body contains brand logo, greeting, and a clickable verification button. URL expires after 24 hours. | Watch for: Raw `{{link}}`, missing expiration note. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-02** | Event: `auth.password_reset_requested` | Trigger: Submit email on `/forgot-password` | Recipient: Registered user email | Expect in Mailpit: Subject "Reset your password". Contains secure one-time token link. Notice stating link expires in 1 hour and advising user to ignore if they did not request it. | Watch for: Token leaked in plain text, link broken or missing host. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-03** | Event: `auth.password_changed` | Trigger: Update password on `/profile` | Recipient: User email | Expect in Mailpit: Subject "Security Alert: Password Changed". Mentions time and user-agent/browser. Advises immediate contact with support if unauthorized. | Watch for: Password plaintext revealed in email (critical violation). | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-04** | Event: `auth.duplicate_registration_alert` | Trigger: Attempt to register with an existing active email | Recipient: Existing account holder | Expect in Mailpit: Security alert notifying that a registration was attempted using their address. Recommends password reset if concerned. | Watch for: Leaking whether password matched or revealing second party info. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-05** | Event: `auth.new_login_alert` | Trigger: Sign in from a fresh incognito window or new IP | Recipient: Account holder | Expect in Mailpit: Subject "New sign-in detected". Shows approximate location/IP, device type, and login time. | Watch for: Missing device metadata, blank placeholders. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### B. Onboarding & KYC Accreditation (5 Events)

- [ ] **CHK-NOTIF-06** | Event: `onboarding.application_received` | Trigger: Provider submits KYC documents on `/provider/dashboard` | Recipient: Provider email | Expect in Mailpit: Acknowledgment email with tracking reference, estimated review time (24-48 business hours). | Watch for: Missing tracking reference number. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-07** | Event: `onboarding.admin_new_application` | Trigger: Provider submits KYC documents | Recipient: Internal Compliance Team (`compliance@ods.et`) | Expect in Mailpit: Compliance alert with applicant business name, provider category, and deep link to `/admin/dashboard#kyc`. | Watch for: Missing link or broken route. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-08** | Event: `onboarding.info_requested` | Trigger: Compliance admin requests updated documents | Recipient: Provider email | Expect in Mailpit: "Additional Information Required" with specific auditor note and direct link to re-upload on dashboard. | Watch for: Auditor comment missing or clipped. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-09** | Event: `onboarding.approved` | Trigger: Compliance admin approves KYC application | Recipient: Provider email | Expect in Mailpit: Congratulatory email "Your Provider Account has been Approved!". Direct link to publish services and set clinic schedule. | Watch for: Stale pending links. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-10** | Event: `onboarding.rejected` | Trigger: Compliance admin rejects KYC application | Recipient: Provider email | Expect in Mailpit: "Application Status Update" email detailing formal regulatory rejection reason and appeal guidance. | Watch for: Empty rejection reason field. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### C. Services Catalog Moderation (4 Events)

- [ ] **CHK-NOTIF-11** | Event: `catalog.service_submitted` | Trigger: Provider submits service draft for approval | Recipient: Provider email & Catalog Reviewers | Expect in Mailpit: Confirmation that service listing is under review. Contains service title and category. | Watch for: Service title empty or missing. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-12** | Event: `catalog.service_approved` | Trigger: Admin approves service listing | Recipient: Provider email | Expect in Mailpit: "Service Approved & Published" with public link to the live service card on `/services/<id>`. | Watch for: Broken public URL link. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-13** | Event: `catalog.service_rejected` | Trigger: Admin rejects service listing | Recipient: Provider email | Expect in Mailpit: "Listing Revisions Requested" with specific admin feedback and button to edit draft. | Watch for: Missing admin revision notes. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-14** | Event: `catalog.service_taken_down` | Trigger: Admin toggles takedown on active service | Recipient: Provider email | Expect in Mailpit: Urgent notice explaining that the service has been unpublished, citing safety or policy grounds. | Watch for: Unhandled status codes in email template. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### D. Payments & Financial Transactions (4 Events)

- [ ] **CHK-NOTIF-15** | Event: `payment.receipt` | Trigger: Successful Chapa sandbox checkout | Recipient: Customer email | Expect in Mailpit: Official receipt with: Transaction Reference, Amount in ETB (formatted `1,500.00 ETB`), Payment Method, Date, and Itemized Service/Voucher. | Watch for: Currency symbol missing or incorrect (e.g. `$` instead of `ETB`), missing decimal places. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-16** | Event: `payment.failed` | Trigger: Chapa sandbox payment cancellation or timeout | Recipient: Customer email | Expect in Mailpit: "Payment Unsuccessful" notice with retry button and reminder that appointment hold will be released. | Watch for: Raw payment gateway error codes exposed in body. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-17** | Event: `payment.refund_issued` | Trigger: Finance admin processes a refund | Recipient: Customer & Provider | Expect in Mailpit: "Refund Processed" confirmation detailing Refund Amount in ETB, Original Transaction ID, and estimated crediting window (3-5 business days). | Watch for: Mismatched refund amount or negative signs. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-18** | Event: `payment.admin_refund_approval_pending` | Trigger: Staff initiates high-value refund (>10,000 ETB) | Recipient: Finance Authorization Group | Expect in Mailpit: Urgent alert to secondary approvers: "High-Value Refund Requires Authorization". Contains initiated amount, initiator name, and link to `/admin/dashboard#payments`. | Watch for: Initiator able to approve their own request. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### E. Gifting & Digital Vouchers (4 Events)

- [ ] **CHK-NOTIF-19** | Event: `gift.purchased_receipt` | Trigger: Customer purchases a gift card | Recipient: Buyer email | Expect in Mailpit: Purchase confirmation, receipt total, recipient email/name, and order status. | Watch for: Full unmasked voucher redemption code leaked to buyer (security breach). | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-20** | Event: `gift.delivered` | Trigger: Gift card purchase completes successfully | Recipient: Recipient email | Expect in Mailpit: High-aesthetic branded gift card email with sender's personal message, value in ETB, expiry date, and direct "Claim Your Gift" button. | Watch for: Broken gift card visual banner, unformatted message. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-21** | Event: `gift.redeemed_notice` | Trigger: Recipient claims gift card to wallet | Recipient: Buyer email | Expect in Mailpit: Polite notice: "Good news! [Recipient] has claimed the gift voucher you sent." | Watch for: Wrong recipient name displayed. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-22** | Event: `gift.expiry_warning` | Trigger: Scheduled cron for unredeemed voucher approaching expiration | Recipient: Recipient email | Expect in Mailpit: Friendly reminder: "Your ODS Gift Voucher expires in 7 days". Includes balance and redemption link. | Watch for: Already redeemed vouchers receiving expiry notice. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### F. Bookings & Appointments (9 Events)

- [ ] **CHK-NOTIF-23** | Event: `booking.created_awaiting_provider` | Trigger: Customer pays for appointment hold | Recipient: Customer email | Expect in Mailpit: Acknowledgment that appointment request is booked and waiting for clinic confirmation. | Watch for: Missing clinic address or date/time. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-24** | Event: `booking.provider_new_request` | Trigger: Customer books appointment | Recipient: Healthcare Provider email | Expect in Mailpit: "New Patient Appointment Request" with appointment date, selected service, patient name, and link to confirm. | Watch for: Patient contact email/phone missing. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-25** | Event: `booking.confirmed` | Trigger: Provider clicks "Confirm Appointment" | Recipient: Customer email | Expect in Mailpit: "Appointment Confirmed!" email with calendar ICS invite attachment, clinic location, preparation instructions, and booking reference. | Watch for: Corrupted or missing .ics calendar attachment. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-26** | Event: `booking.declined` | Trigger: Provider declines booking | Recipient: Customer email | Expect in Mailpit: Polite notification that provider is unavailable, notice of automatic payment refund or wallet credit, and button to choose alternate provider. | Watch for: Failure to explain refund handling. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-27** | Event: `booking.cancelled` | Trigger: Customer or provider cancels confirmed appointment | Recipient: Customer & Provider | Expect in Mailpit: Cancellation confirmation, cancellation policy summary, and refund/fee statement. | Watch for: Cancellation reason missing. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-28** | Event: `booking.rescheduled` | Trigger: Appointment date/time updated | Recipient: Customer & Provider | Expect in Mailpit: "Appointment Rescheduled" highlighting the OLD date/time vs NEW date/time with updated calendar ICS file. | Watch for: Only showing new date without indicating change. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-29** | Event: `booking.reminder_24h` | Trigger: Scheduled cron 24 hours prior to appointment | Recipient: Customer email | Expect in Mailpit: "Reminder: Your appointment is tomorrow at [Time]". Clinic address, directions, and provider phone. | Watch for: Wrong timezone calculation. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-30** | Event: `booking.reminder_1h` | Trigger: Scheduled cron 1 hour prior to appointment | Recipient: Customer email | Expect in Mailpit: "Reminder: Your appointment is in 1 hour". Quick clinic check-in instructions. | Watch for: Misfired alerts for cancelled appointments. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-31** | Event: `booking.completed` | Trigger: Provider marks appointment completed | Recipient: Customer email | Expect in Mailpit: "Thank you for visiting [Clinic Name]". Invitation to leave an honest review on the service page. | Watch for: Broken review feedback link. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### G. Administrative Safety & Governance (3 Events)

- [ ] **CHK-NOTIF-32** | Event: `admin.account_suspended` | Trigger: Admin suspends an account | Recipient: Suspended user email | Expect in Mailpit: Formal notification: "Your ODS Global Network account has been suspended". Contains policy citation and link to support appeal form. | Watch for: Harsh or unprofessional language, missing appeal link. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-33** | Event: `admin.account_reactivated` | Trigger: Admin lifts suspension | Recipient: Reactivated user email | Expect in Mailpit: "Your ODS Global Network account has been restored". Direct button to log in. | Watch for: Stale suspension warnings in body. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-NOTIF-34** | Event: `admin.staff_provisioned` | Trigger: Super admin invites new staff user | Recipient: Provisioned staff email | Expect in Mailpit: Staff onboarding email with temporary setup token, assigned role group name, and security setup guide. | Watch for: Permanent password transmitted in plain text. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

### H. Partner & Inquiries (1 Event)

- [ ] **CHK-NOTIF-35** | Event: `partner.inquiry_received` | Trigger: Visitor submits `/contact` enterprise form | Recipient: Inquiring partner email | Expect in Mailpit: "Thank you for contacting ODS Global Network". Summarizes inquiry subject and promises response in 1 business day. | Watch for: Sender receiving unformatted dump of form fields. | Batch: 11
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

## 3. Email Formatting & Header Technical Checks

- [ ] **CHK-NOTIF-TECH-01** | Technical: In Mailpit, select any 3 emails and click "Headers" tab. Verify presence of:  
  `X-ODS-Notification-Id: <uuid>`  
  `X-ODS-Event-Type: <event.name>`  
  `From: ODS Global Network <...>`
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

- [ ] **CHK-NOTIF-TECH-02** | Technical: On non-essential marketing/reminder emails (e.g. `booking.reminder_24h`, `gift.expiry_warning`), verify `List-Unsubscribe` header is present.
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

- [ ] **CHK-NOTIF-TECH-03** | Technical: In Mailpit, toggle the "HTML" and "Raw / Plain Text" tabs. Verify that the plain text fallback is legible, has clean linebreaks, and contains plain URLs for all buttons.
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:
