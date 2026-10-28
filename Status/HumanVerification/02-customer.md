# 02. Human Verification Checklist — Customer Role

**Target Role**: Personal Customer  
**Primary Test Account**: `customer@123.com` (Verified) | Fresh Registration (Unverified)  
**Password Source**: `DEV_PASSWORD` in `.env` (typically `Password123!`)  
**Primary URL**: `http://localhost:5173/dashboard`

---

## Module A: Sign-In, Email Verification States & Navigation

- [ ] **CUS-AUTH-001** | Page: `/login` | Do: 1. Navigate to `/login`.<br>2. Sign in with `customer@123.com` and `Password123!`. | Expect: Successfully signs in. Redirects to `/dashboard` (Customer Portal). Top header displays "Customer Portal", active user name, notification bell icon, and "Sign Out" button. | Watch for: Redirecting to wrong role dashboard or blank white page. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-AUTH-002** | Page: `/dashboard` (Unverified Customer) | Do: 1. Register a brand-new customer account (e.g. `unv_test_user@example.com`).<br>2. Log in without clicking the email link in Mailpit. | Expect: A yellow/amber banner appears at the top of the dashboard: "Your email address is not yet verified. Please check your inbox or click here to resend verification link." | Watch for: No verification reminder displayed to an unverified user. | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-AUTH-003** | Page: `/dashboard` (Resend Verification) | Do: 1. As the unverified customer, click "Resend verification link" on the banner. | Expect: Green toast notification appears: "Verification link sent! Please check your email." Open Mailpit (`http://127.0.0.1:8025`) and verify a new email arrived with subject "Verify your ODS Global Network account". | Watch for: Spamming the button resulting in server crash or missing emails. | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-AUTH-004** | Page: `/verify-email` | Do: 1. In Mailpit, open the verification email and click the verification button.<br>2. Browser opens `/verify-email#token=...`. | Expect: Screen displays a spinner for 1 second, then green checkmark: "Email verified successfully! You now have full access." Click "Continue to Dashboard" -> banner is gone. | Watch for: Token visible in query parameters (`?token=...`) instead of fragment (`#token=...`). | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: Profile Management & Security Invalidation

- [ ] **CUS-PROF-001** | Page: `/dashboard#profile` | Do: 1. In the customer dashboard, click the "Profile" tab.<br>2. Inspect personal details and address fields. | Expect: Full Name, Email, Phone, Country, City, and Address Line are displayed accurately matching account registration. | Watch for: Fields populated with `undefined` or `null`. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-PROF-002** | Page: `/dashboard#profile` | Do: 1. Update Full Name to "Abebe Kebede", Phone to "+251911998877", City to "Addis Ababa".<br>2. Click "Save Profile Changes". | Expect: Green toast confirms: "Profile updated successfully." Reload the browser page (`F5`) and confirm updated name and city persist. | Watch for: Changes disappearing upon page refresh (lost in memory). | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-SEC-001** | Page: `/dashboard#security` | Do: 1. Click "Security" tab in customer dashboard.<br>2. In the "Change Password" form, enter Current Password `WrongPassword!`, New Password `NewSecurePass123!`.<br>3. Click "Update Password". | Expect: Operation rejected with red alert: "Current password is incorrect." | Watch for: Password updating despite incorrect current password. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-SEC-002 [HIGH RISK]** | Page: `/dashboard#security` | Do: 1. Enter correct Current Password `Password123!`, New Password `NewPass456!`, Confirm `NewPass456!`.<br>2. Click "Update Password". | Expect: Green confirmation appears: "Password updated successfully. Please sign in with your new password." User is logged out immediately. Check Mailpit to confirm security alert email was received. | Watch for: Old session remaining active across other browser windows (session invalidation failure). | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-SEC-003** | Page: `/login` | Do: 1. Attempt login with old password `Password123!`.<br>2. Then log in with new password `NewPass456!`. | Expect: Old password returns 401 "Invalid email or password." New password signs in immediately to `/dashboard`. *(Reset password back to `Password123!` after test).* | Watch for: Old password still working. | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: Healthcare Appointment Booking & 10-Minute Hold

- [ ] **CUS-BOOK-001** | Page: `/services` | Do: 1. Navigate to `/services`.<br>2. Select "Cardiology Consultation" service.<br>3. Click "Book Appointment". | Expect: The interactive booking modal opens, showing doctor name, clinic address, and standard consultation fee in ETB (e.g. `1,200.00 ETB`). | Watch for: Modal cut off on screen or unresponsive to clicks. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-BOOK-002** | Page: `/services/:slug` (Slot Picker) | Do: 1. In the booking calendar, select a future date (e.g. tomorrow).<br>2. Inspect available time slots. | Expect: Available time slots appear as selectable buttons (e.g. "09:00 AM", "10:00 AM", "02:00 PM") matching provider working hours. Non-working hours and past slots are disabled. | Watch for: Slots displayed in UTC instead of local Ethiopian Time (East Africa Time, UTC+3). | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-BOOK-003 [HIGH RISK]** | Page: Booking Checkout (Hold Timer) | Do: 1. Select a slot (e.g. "10:00 AM").<br>2. Click "Reserve & Proceed to Checkout". | Expect: Booking transitions to temporary hold. A live countdown banner appears: "Slot reserved for you! Complete payment within 09:59 to confirm." Hold counter counts down second-by-second. | Watch for: Timer starting at 00:00, or slot being immediately freed. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-BOOK-004** | Page: Booking Checkout (Payment Options) | Do: 1. Inspect payment options on the checkout screen. | Expect: Displays options: "Pay via Chapa (Debit / Credit / Telebirr)", "Pay via Digital Wallet (Balance: X ETB)", or "Redeem Gift Card Voucher". | Watch for: Missing total price breakdown or hidden fees. | Batch: 6, 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: Chapa Payment Processing & Itemized Receipt

- [ ] **CUS-PAY-001 [HIGH RISK]** | Page: Chapa Gateway Sandbox | Do: 1. Choose "Pay via Chapa".<br>2. Click "Proceed to Secure Payment". | Expect: Browser redirects to official Chapa sandbox page. URL displays `chapa.co`. Amount matches booking price exactly in ETB. | Watch for: Page getting stuck on blank screen or redirecting to localhost with an error. | Batch: 6
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-PAY-002 [HIGH RISK]** | Page: Chapa Gateway Sandbox | Do: 1. Enter sandbox test card `4084084084084081`, expiry `12/28`, CVV `123`.<br>2. Click "Pay".<br>3. Enter test OTP `1234` if prompted. | Expect: Chapa displays green "Payment Successful" confirmation, then redirects back to `http://localhost:5173/payment/success?tx_ref=...`. | Watch for: Gateway error, transaction failure, or hanging spinner. | Batch: 6
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-PAY-003** | Page: `/payment/success` | Do: 1. Inspect the payment success screen. | Expect: Itemized receipt displays: Transaction Reference (e.g. `ODS-TX-XXXX`), Service Title, Provider Name, Paid Amount in ETB, and "Status: Confirmed". Buttons offer "View Appointment" and "Download Receipt". | Watch for: Missing receipt number or status showing "pending". | Batch: 6
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-PAY-004** | Page: `/dashboard#transactions` | Do: 1. In customer dashboard, click "Transactions" tab. | Expect: The newly paid transaction appears at the top of the history table with Date, Amount in ETB, Method ("Chapa"), Reference, and "Completed" badge. | Watch for: Transaction missing from customer history. | Batch: 6
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module E: Gifting Engine & Digital Wallet

- [ ] **CUS-GFT-001** | Page: `/dashboard#gifting` | Do: 1. In customer dashboard, navigate to "Gifting & Vouchers" tab.<br>2. Click "Buy Health Gift Voucher". | Expect: Gift purchase wizard opens with options: "Select Occasion" (Birthday, Get Well, Holiday), "Voucher Amount in ETB" (1000, 2500, 5000, Custom), and "Recipient Details" (Name, Email, Delivery Date, Personal Note). | Watch for: Form accepting negative or zero amounts. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-GFT-002 [HIGH RISK]** | Page: `/dashboard#gifting` | Do: 1. Complete purchase of a 2,500 ETB gift voucher for "Family Health Care".<br>2. Complete sandbox payment. | Expect: Success modal displays the issued Gift Code (e.g. `ODS-GC-XXXX-XXXX`). Check Mailpit to confirm recipient received the presentation email with the claim link. | Watch for: Gift code missing or truncated. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-GFT-003 [HIGH RISK]** | Page: `/dashboard#gifting` (Wallet Redeem) | Do: 1. In the customer gifting tab, find the "Redeem to Wallet" card.<br>2. Enter an unredeemed gift voucher code.<br>3. Click "Redeem to My Wallet". | Expect: Instant confirmation: "Voucher redeemed! 2,500.00 ETB credited to your digital wallet." Digital Wallet balance increases immediately by 2,500.00 ETB. | Watch for: Wallet balance not updating until page reload. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-GFT-004** | Page: `/dashboard#gifting` (Double-Spend Block) | Do: 1. Attempt to enter the same gift voucher code a second time.<br>2. Click "Redeem to My Wallet". | Expect: System rejects request with red alert: "This gift voucher has already been claimed and redeemed." Wallet balance does not change. | Watch for: Double-crediting funds into wallet (financial bug). | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module F: Appointment Rescheduling & Cancellation Policies

- [ ] **CUS-APT-001** | Page: `/dashboard#appointments` | Do: 1. Click "Appointments" tab in customer dashboard.<br>2. Find an upcoming confirmed appointment. | Expect: Appointment card displays: Doctor Name, Specialty, Clinic Location, Date & Time, Fee Paid, and Status: "Confirmed". Action buttons: "Reschedule" and "Cancel Appointment". | Watch for: Missing appointment cards or wrong appointment time. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-APT-002** | Page: `/dashboard#appointments` (Reschedule) | Do: 1. Click "Reschedule" on an appointment scheduled > 2 hours in the future.<br>2. Pick a new available date and time slot.<br>3. Click "Confirm New Time". | Expect: Appointment updates instantly. Card displays new date and time with a label: "Rescheduled (1/2 allowed)". Check Mailpit to verify appointment reschedule notice was sent. | Watch for: Double-booking the doctor at the old slot. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-APT-003 [HIGH RISK]** | Page: `/dashboard#appointments` (Cancellation >24h) | Do: 1. On an appointment scheduled > 24 hours in the future, click "Cancel Appointment".<br>2. Form prompts for reason and shows: "Eligible for 100% full refund under platform policy."<br>3. Confirm cancellation. | Expect: Appointment transitions to "Cancelled". Full fee is refunded (check transaction history for refund credit). Cancellation notice sent to Mailpit. | Watch for: Deducting fees when cancelled more than 24 hours in advance. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module G: Customer "Must NOT Be Able To" (RBAC Defense)

- [ ] **CUS-RBAC-001** | Page: `/merchant/dashboard` | Do: 1. While logged in as `customer@123.com`, type `http://localhost:5173/merchant/dashboard` in browser address bar and press Enter. | Expect: Blocked immediately. Redirects to `/unauthorized` or `/dashboard` with banner: "Access Denied: Merchant account required." | Watch for: Merchant business forms or pharmacy documents loading. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-RBAC-002** | Page: `/provider/dashboard` | Do: 1. Type `http://localhost:5173/provider/dashboard` in address bar and press Enter. | Expect: Blocked immediately. Redirects to `/unauthorized` with message: "Access Denied: Healthcare Provider account required." | Watch for: Provider appointment booking calendars exposed to customer. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-RBAC-003** | Page: `/admin/dashboard` | Do: 1. Type `http://localhost:5173/admin/dashboard` in address bar and press Enter. | Expect: Strictly blocked. Redirects to `/unauthorized` or `/login`. | Watch for: Administrative console or audit logs exposed. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module H: Mobile Responsiveness & Keyboard-Only Pass

- [ ] **CUS-MOB-001** | Page: `/dashboard` (Mobile 375px) | Do: 1. In DevTools, set viewport to iPhone SE (375px width).<br>2. Navigate through customer tabs: Profile, Appointments, Gifting, Transactions. | Expect: Tab bar scrolls smoothly horizontally or collapses into a dropdown. Appointment cards stack vertically without text overflowing screen edges. | Watch for: Action buttons ("Cancel", "Pay") cut off or overlapping. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **CUS-KEY-001** | Page: `/dashboard#profile` (Keyboard Only) | Do: 1. Navigate customer profile using `Tab`, `Space`, and `Enter` without touching mouse. | Expect: Focus indicator clearly tracks through each text input. Pressing `Enter` on "Save Profile Changes" triggers submission. | Watch for: Keyboard focus jumping randomly or getting trapped in a field. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
