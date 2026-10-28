# 04. Human Verification Checklist — Healthcare Provider Role

**Target Role**: Healthcare Provider (Physicians, Specialty Clinics, Hospitals)  
**Primary Test Account**: `serviceprovider@123.com` (Approved) | Fresh Registration (Pending/Rejected)  
**Password Source**: `DEV_PASSWORD` in `.env` (typically `Password123!`)  
**Primary URL**: `http://localhost:5173/provider/dashboard`

---

## Module A: Sign-In, Accreditation States & Dashboard Layout

- [ ] **PRV-AUTH-001** | Page: `/login` | Do: 1. Navigate to `/login`.<br>2. Sign in with `serviceprovider@123.com` and `Password123!`. | Expect: Successfully signs in. Redirects to `/provider/dashboard`. Top header displays "Healthcare Provider Portal", clinic name, and verified doctor badge. | Watch for: Redirecting to wrong role portal or blank screen. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-AUTH-002** | Page: `/provider/dashboard` (Approved State) | Do: 1. Inspect status badge on dashboard header. | Expect: Green badge: "Accredited & Active". All provider tabs (Availability, Bookings, Services, Vouchers, Documents, Profile) are accessible. | Watch for: Showing "Pending" for approved provider. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-AUTH-003** | Page: `/provider/dashboard` (Rejected State with Reason) | Do: 1. In a fresh registration or rejected test provider account, sign in. | Expect: Prominent red banner appears: "Application Rejected by Compliance Team". An explicit explanation displays the rejection reason (e.g. "Expired medical license submitted; please upload current certified board license"). Provides a button: "Re-upload Compliance Documents". | Watch for: Rejection shown with no reason, leaving the provider with no guidance. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: Weekly Working Hours & Blackout Dates (Batch 9)

- [ ] **PRV-SCH-001** | Page: `/provider/dashboard#availability` | Do: 1. Click "Availability & Hours" tab.<br>2. Inspect weekly schedule grid (Monday through Sunday). | Expect: Each day displays toggle switches ("Active / Closed"), Start Time dropdown, and End Time dropdown (e.g. Monday: 09:00 AM to 05:00 PM). | Watch for: Dropdown allowing End Time to be earlier than Start Time. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-SCH-002** | Page: `/provider/dashboard#availability` (Update Hours) | Do: 1. Change Tuesday hours to 10:00 AM – 04:00 PM.<br>2. Click "Save Schedule". | Expect: Green confirmation toast: "Weekly schedule updated successfully." Verify on the public booking page that Tuesday slots now reflect 10:00 AM to 04:00 PM. | Watch for: Changes failing to reflect on public booking calendar. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-SCH-003** | Page: `/provider/dashboard#availability` (Blackout Date) | Do: 1. In the "Holiday & Blackout Exceptions" section, click "Add Blackout Date".<br>2. Select a date (e.g. next Friday).<br>3. Enter Reason: "Attending Medical Conference".<br>4. Click "Add Exception". | Expect: Exception is added to the blackout list. In the public booking calendar, next Friday is completely greyed out and disabled. | Watch for: Public visitors still able to book slots on a blackout date. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: Appointment Management & Patient Privacy

- [ ] **PRV-BOK-001** | Page: `/provider/dashboard#bookings` | Do: 1. Click "Bookings & Calendar" tab.<br>2. Inspect upcoming appointment list. | Expect: Appointments display Patient Name, Service ("Cardiology Consultation"), Date & Time, Payment Status ("Paid via Chapa"), and Appointment Status ("Confirmed"). | Watch for: Patient phone numbers visible on unconfirmed/cancelled appointments (privacy breach). | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-BOK-002** | Page: `/provider/dashboard#bookings` (Mark Complete) | Do: 1. On an appointment occurring today, click "Mark Completed". | Expect: Status updates to green badge: "Completed". Check Mailpit to verify patient received post-appointment notification thanking them. | Watch for: Completed appointments remaining in "Pending" status. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-BOK-003 [HIGH RISK]** | Page: `/provider/dashboard#bookings` (Provider Cancellation) | Do: 1. On a confirmed upcoming appointment, click "Cancel Appointment".<br>2. Form prompts: "Cancellation Reason (Mandatory)" - enter "Doctor Emergency Surgery".<br>3. Confirm cancellation. | Expect: Appointment transitions to "Cancelled by Provider". System automatically triggers 100% full refund to patient. Patient receives urgent notification in Mailpit with doctor's explanation. | Watch for: Cancellation succeeding without a mandatory explanation. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: In-Clinic Gift Voucher & Service Redemption (Batch 7)

- [ ] **PRV-VOU-001** | Page: `/provider/dashboard#vouchers` | Do: 1. Click "Vouchers & Claims" tab in provider dashboard.<br>2. Inspect voucher redemption station. | Expect: A clean redemption tool displays: "Verify & Claim Patient Voucher", an input box for the 16-character code, and an "Inspect Voucher" button. | Watch for: Broken redemption input or missing instructions. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-VOU-002 [HIGH RISK]** | Page: `/provider/dashboard#vouchers` | Do: 1. Enter an active service gift voucher code (e.g. `ODS-GC-XXXX-XXXX`).<br>2. Click "Inspect Voucher". | Expect: Screen shows voucher details: Service Name ("Executive Health Screening"), Patient/Recipient Name, Status ("Active / Unredeemed"), and Value in ETB. An active button appears: "Confirm Clinical Service Delivered". | Watch for: Wrong service name or expired voucher showing as active. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-VOU-003 [HIGH RISK]** | Page: `/provider/dashboard#vouchers` | Do: 1. Click "Confirm Clinical Service Delivered". | Expect: Green confirmation modal appears: "Service Delivery Recorded. Voucher marked as Delivered." Timestamp is recorded. Voucher balance updates to 0 ETB. | Watch for: Voucher remaining active after delivery confirmation. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-VOU-004** | Page: `/provider/dashboard#vouchers` (Double-Claim Defense) | Do: 1. Attempt to enter the exact same voucher code again.<br>2. Click "Inspect Voucher". | Expect: System flags: "This voucher has already been delivered on [Date/Time] and cannot be redeemed again." | Watch for: Allowing multiple delivery claims on a single voucher. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module E: Healthcare Services Authoring & Catalog Moderation (Batch 8)

- [ ] **PRV-SRV-001** | Page: `/provider/dashboard#services` | Do: 1. Click "Services Management" tab.<br>2. Click "Create New Healthcare Service". | Expect: Authoring wizard opens with fields: Service Title, Specialty Category (e.g. "Cardiology", "Dentistry"), Duration in Minutes (e.g. "45"), Consultation Fee in ETB, and Detailed Description. | Watch for: Negative fees or 0-minute duration accepted. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-SRV-002** | Page: `/provider/dashboard#services` | Do: 1. Fill out: Title "General Health Examination", Duration "30", Fee "800.00 ETB", Description "Complete physical assessment."<br>2. Click "Submit for Moderation". | Expect: Service card appears in provider dashboard with yellow badge: "Pending Compliance Review". Status note clarifies it will appear in public search once approved by admin. | Watch for: Service appearing immediately on public catalog before admin approval. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module F: Provider "Must NOT Be Able To" (RBAC Defense)

- [ ] **PRV-RBAC-001** | Page: `/merchant/dashboard` | Do: 1. While logged in as `serviceprovider@123.com`, type `http://localhost:5173/merchant/dashboard` in browser address bar and press Enter. | Expect: Blocked immediately. Redirects to `/unauthorized` with message: "Access Denied: Merchant account required." | Watch for: Pharmacy stock or retail merchant sales data exposed. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-RBAC-002** | Page: `/admin/dashboard` | Do: 1. Type `http://localhost:5173/admin/dashboard` in address bar and press Enter. | Expect: Blocked immediately. Redirects to `/unauthorized` or `/login`. | Watch for: Administrative console exposed. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-RBAC-003** | Page: Other Provider Bookings | Do: 1. Attempt to access a booking URL belonging to another clinic/doctor (e.g. `/api/bookings/OTHER_PROVIDER_BOOKING_ID`). | Expect: Server returns HTTP 403 Forbidden: "Access denied. You are not a participant in this booking." | Watch for: Doctor viewing competitor's patient appointments (IDOR privacy violation). | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module G: Mobile Responsiveness & Keyboard-Only Pass

- [ ] **PRV-MOB-001** | Page: `/provider/dashboard` (Mobile 375px) | Do: 1. Switch DevTools to iPhone SE (375px).<br>2. Open "Availability & Hours" tab. | Expect: Weekly schedule adapts cleanly. Day toggles and time dropdowns stack vertically with no horizontal overflow. | Watch for: Save button cut off or time dropdowns unselectable on mobile. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **PRV-KEY-001** | Page: `/provider/dashboard#vouchers` (Keyboard Only) | Do: 1. Navigate to voucher redemption form using keyboard only.<br>2. Type voucher code and trigger "Inspect Voucher" with `Enter`. | Expect: Code input and claim buttons are fully keyboard navigable with high-visibility focus borders. | Watch for: Inability to trigger claim button without a mouse. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
