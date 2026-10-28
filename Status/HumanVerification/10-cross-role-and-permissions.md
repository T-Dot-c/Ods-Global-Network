# ODS Global Network — Cross-Role Boundary & Permission Enforcement Checklist

**Scope:** Cross-Role Security, RBAC Isolation, and Insecure Direct Object Reference (IDOR) Defenses  
**Applicable Batches:** Batch 3, Batch 5, Batch 8, Batch 10, Batch 12  
**Purpose:** Verify that no user role can access pages, API endpoints, or private data belonging to another role or another tenant, even by directly entering URLs or tampering with identifiers.

---

## 1. Quick Reference Matrix

| User Role | Should ONLY Access | MUST Be Blocked From |
| :--- | :--- | :--- |
| **Anonymous Visitor** | `/`, `/catalog`, `/services/*`, `/about`, `/faq`, `/contact`, `/login`, `/register`, `/verify-voucher` | Any dashboard (`/profile`, `/provider/*`, `/merchant/*`, `/admin/*`) |
| **Customer** | `/profile`, `/appointments`, `/wallet`, `/checkout/*` | Provider, Merchant, and Admin dashboards and APIs |
| **Merchant** | `/merchant/dashboard`, own products, own gift redemptions | Customer private profiles, Provider clinic records, Admin controls |
| **Healthcare Provider** | `/provider/dashboard`, own services, own appointments, own calendar | Other providers' records, Merchant inventory, Admin settings |
| **Support Admin** | `/admin/dashboard#users`, `#services`, `#appointments`, internal notes | Finance ledger, KYC decisions, Refund approval, Platform settings |
| **Finance Admin** | `/admin/dashboard#payments`, transaction ledger, refunds | KYC approvals, catalog moderation, staff provisioning |
| **Compliance Admin**| `/admin/dashboard#kyc`, verification queues, provider credential review | Payment refund approval, platform settings, user password resets |

---

## 2. Verification Checklist

- [ ] **CHK-XROL-01** | Page: Anonymous Browser / Deep Links | Do: 1. Open a clean incognito window (no active session). 2. Manually enter `/profile` in the address bar. 3. Manually enter `/provider/dashboard`. 4. Manually enter `/merchant/dashboard`. 5. Manually enter `/admin/dashboard`. | Expect: For every protected URL, immediate redirect to `/login?redirect=...` (or clean 401/403 page). Zero flashes of protected user dashboards, customer names, provider calendars, or admin navigation. | Watch for: Page rendering for a split-second before redirecting, sensitive data in initial HTML or client state, infinite redirect loop. | Batch: 3, 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-02** | Page: Customer Session / Provider & Merchant Routes | Do: 1. Sign in as Customer (`cust.active@ods.et`). 2. Manually enter `/provider/dashboard` in the address bar. 3. Manually enter `/merchant/dashboard`. | Expect: System denies access with a clear, polite 403 Forbidden message or redirects to `/profile` with alert toast: "Access Denied: You do not have permission to view this portal." Navigation controls for providers/merchants remain hidden. | Watch for: 500 Internal Server Error, blank white screen, customer viewing provider schedule interface. | Batch: 3, 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-03** | Page: Customer Session / Admin Routes | Do: 1. With Customer signed in (`cust.active@ods.et`), manually navigate to `/admin/dashboard` or `/admin/dashboard#users`. | Expect: Immediate denial: 403 Forbidden page or redirect to `/` with security alert. No administrative sidebar, tabs, or user statistics are rendered. | Watch for: Admin UI frame loading even if data fetches fail, raw GraphQL or REST error messages exposed to user. | Batch: 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-04** | Page: Customer IDOR Isolation (Cross-Customer Appointments) | Do: 1. Sign in as Customer A (`cust.active@ods.et`) and note the UUID or ID of an appointment belonging to Customer A. 2. Sign out and sign in as Customer B (`cust.unverified@ods.et` or second test customer). 3. In the address bar, attempt to navigate directly to Customer A's appointment URL (e.g. `/appointments/<Customer_A_Appointment_ID>`). | Expect: System responds with a 404 Not Found or 403 Access Denied: "Appointment not found or you do not have permission to view it." No details of Customer A's healthcare service, provider, notes, or payment are disclosed. | Watch for: Customer B seeing Customer A's appointment details, medical service name, or personal contact info (Critical IDOR failure). | Batch: 5, 8
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-05** | Page: Customer IDOR Isolation (Cross-Customer Gift Vouchers) | Do: 1. Have Customer A purchase a digital gift card and view the gift card receipt. 2. Sign in as Customer B. 3. Attempt to fetch or view Customer A's gift card details by altering the URL path or ID to Customer A's gift ID. | Expect: "Voucher not found or access denied." Customer B cannot view recipient contact information, custom gift message, or unmasked voucher claim code belonging to Customer A. | Watch for: Unauthenticated or cross-customer voucher code reveal. | Batch: 7, 8
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-06** | Page: Healthcare Provider IDOR Isolation (Cross-Provider Appointments) | Do: 1. Sign in as Provider A (`provider.approved@ods.et`). 2. Obtain the appointment ID of an appointment booked with Provider B (`provider.pending@ods.et`). 3. Attempt to navigate directly to `/provider/dashboard?appointment=<Provider_B_ID>` or perform a status update via form action. | Expect: "Appointment not found for your provider profile" or 403 Forbidden. Provider A cannot see patient names, clinic notes, or appointment statuses booked with Provider B. | Watch for: Provider A seeing Provider B's patient roster or modifying Provider B's appointment status. | Batch: 5, 8
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-07** | Page: Healthcare Provider Session / Merchant Routes | Do: 1. Sign in as Provider (`provider.approved@ods.et`). 2. Navigate to `/merchant/dashboard`. | Expect: Immediate 403 Forbidden or redirect: "Access restricted to registered merchant partners." Provider cannot access merchant inventory, redemption ledger, or merchant payout settings. | Watch for: Mixed portal interfaces, blank dashboard, unhandled API error traces. | Batch: 3, 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-08** | Page: Merchant Session / Provider Routes | Do: 1. Sign in as Merchant (`merchant.active@ods.et`). 2. Navigate to `/provider/dashboard`. | Expect: Immediate 403 Forbidden or redirect: "Access restricted to licensed healthcare providers." Merchant cannot view patient appointments or provider availability management. | Watch for: Merchant accessing clinical service authoring or patient records. | Batch: 3, 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-09** | Page: Support Admin / Finance Restrictions | Do: 1. Sign in as Support Admin (`admin.support@ods.et`). 2. Attempt to navigate to `/admin/dashboard#payments`. 3. Attempt to trigger a refund action. | Expect: Payments tab is either completely hidden from navigation or renders "Access Restricted: Requires `payments.view_ledger` and `refunds.initiate` permissions." Refund buttons are absent. | Watch for: Support admin seeing complete transaction ledger or being able to trigger monetary refunds without authorization. | Batch: 8, 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-10** | Page: Support Admin / Compliance & KYC Restrictions | Do: 1. Sign in as Support Admin (`admin.support@ods.et`). 2. Attempt to navigate to `/admin/dashboard#kyc`. 3. Attempt to click "Approve" or "Reject" on a pending provider KYC submission. | Expect: KYC decision buttons are absent or return 403 Forbidden: "Insufficient permissions: Requires `kyc.decide`." | Watch for: Support staff approving provider medical accreditations without compliance role. | Batch: 4, 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-11** | Page: Compliance Admin / Financial & Settings Restrictions | Do: 1. Sign in as Compliance Admin (`admin.compliance@ods.et`). 2. Attempt to navigate to `/admin/dashboard#payments` or `/admin/dashboard#settings`. | Expect: Navigation items are hidden. Direct URL navigation renders "Access Restricted: You lack permissions for financial operations and platform settings." | Watch for: Compliance officer modifying refund thresholds or reading platform payment keys. | Batch: 10
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:

---

- [ ] **CHK-XROL-12** | Page: Any User / Tampered UUID Parameter Injection | Do: 1. On any view displaying an entity by ID (e.g. `/services/<uuid>`, `/appointments/<uuid>`), replace the valid UUID with:  
   a) A non-existent UUID (`00000000-0000-0000-0000-000000000000`)  
   b) An invalid format string (`test-id-123`, `../../etc/passwd`, `' OR 1=1 --`) | Expect: User-friendly error message: "Resource not found" (404) or "Invalid identifier format" (400). Application handles the condition gracefully without crashing or dumping SQL query stack traces. | Watch for: Raw PostgreSQL error messages, Sequelize/Prisma errors, server 500 crash, unhandled blank page. | Batch: 3, 12
* Result: [ ] Pass  [ ] Fail  [ ] N/A
* Notes / Evidence:
