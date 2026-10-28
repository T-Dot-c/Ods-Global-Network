# 01. Human Verification Checklist — Public Visitor (Logged Out)

**Target Role**: Public Visitor (Unauthenticated / Anonymous)  
**Starting State**: Logged out (Open browser in Incognito / Private window)  
**Primary URL**: `http://localhost:5173/`

---

## Module A: Homepage, Navigation & Brand Presentation

- [ ] **VIS-NAV-001** | Page: `/` | Do: 1. Open `http://localhost:5173/` in a fresh private browser window.<br>2. Inspect the top header. | Expect: ODS Global Network logo, main navigation links ("Services", "Partner With Us", "Company", "Support"), and "Log In" / "Register" buttons appear clearly with no overlapping text. | Watch for: Broken logo image, unstyled blue default links, or missing navigation items. | Batch: 1
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-NAV-002** | Page: `/` | Do: 1. Scroll through the homepage from top to bottom.<br>2. Inspect the hero banner, value proposition cards, and footer. | Expect: Professional typography, harmonious color palette, high-resolution imagery, and clean spacing. Footer displays links to Terms, Support, and Company information. | Watch for: "Lorem ipsum" placeholder text, generic AI stock phrases, broken layout cards, or cut-off text. | Batch: 1
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-NAV-003** | Page: `/terms` | Do: 1. Click the "Terms of Service" link in the footer. | Expect: Navigates to `/terms`. Displays official platform terms, including 10-minute booking hold policies, 24-hour cancellation refund thresholds, and gift card validity rules. | Watch for: Blank white page, unstyled text, or raw HTML tags visible on the page. | Batch: 2
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-NAV-004** | Page: `/company` | Do: 1. Click "Company" in the top navigation header. | Expect: Navigates to `/company`. Displays the ODS Global Network healthcare mission, leadership commitment, and diaspora service explanation. | Watch for: 404 Not Found error or infinite loading spinner. | Batch: 2
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: Public Healthcare Service Catalog & Discovery

- [ ] **VIS-CAT-001** | Page: `/services` | Do: 1. Click "Services" in the top navigation header. | Expect: Navigates to `/services`. Displays the search bar, category filter sidebar, and active healthcare service cards with published prices in ETB. | Watch for: Raw JSON displayed on screen, missing prices, or broken provider image thumbnails. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-CAT-002** | Page: `/services` | Do: 1. In the search box on the catalog page, type "Cardiology".<br>2. Press Enter or click Search. | Expect: The service list dynamically filters to display matching cardiology consultation services, showing doctor/clinic name, location, and consultation fee in ETB. | Watch for: Stuck loading spinner or page failing to update results. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-CAT-003** | Page: `/services` | Do: 1. In the search box, type a random non-existent word like "xyznonexistent999".<br>2. Press Enter. | Expect: An elegant empty state appears stating "No matching healthcare services found" with a button to "Clear Filters". | Watch for: An ugly blank white area, browser error message, or crashed JavaScript. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-CAT-004** | Page: `/services/:slug` | Do: 1. Click on any service card in the catalog (e.g. "Cardiology Consultation"). | Expect: Navigates to the service detail page (`/services/...`). Displays full service description, duration (e.g., "60 minutes"), provider credentials, clinic address, and an active "Book Appointment" button. | Watch for: "Undefined" or "null" in place of doctor or clinic names. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-CAT-005** | Page: `/services/:slug` | Do: 1. On the service detail page, click the "Book Appointment" button while logged out. | Expect: System gracefully prompts: "Please log in or create an account to schedule this appointment", providing quick action buttons to Login or Register. | Watch for: System attempting to process a booking without an account or freezing. | Batch: 9
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: Public Gift Voucher Balance Check

- [ ] **VIS-GFT-001** | Page: `/gift/claim` | Do: 1. Click "Claim Gift" in navigation or navigate directly to `http://localhost:5173/gift/claim`. | Expect: Clean voucher claim card appears with an input field: "Enter your 16-character gift code (e.g. ODS-GC-XXXX-XXXX)" and a "Check Balance" button. | Watch for: Input field rejecting pasted uppercase codes or formatting incorrectly. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-GFT-002** | Page: `/gift/claim` | Do: 1. Type an invalid code: `ODS-GC-FAKE-9999`.<br>2. Click "Check Balance". | Expect: A clear red or amber error message appears: "Invalid or unrecognized gift voucher code. Please check your card details and try again." | Watch for: Raw server error, database stack trace, or no visual feedback. | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-GFT-003** | Page: `/gift/claim` | Do: 1. Enter a valid gift voucher code.<br>2. Click "Check Balance". | Expect: Displays the gift card occasion (e.g. "Birthday Greeting"), remaining balance in ETB (e.g. "2,500.00 ETB"), and expiry date, with ZERO exposure of sender/recipient personal email or phone numbers. | Watch for: Sender or recipient email addresses leaked on the public screen (PII violation). | Batch: 7
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: Public Support & Enterprise Partnership Inquiries

- [ ] **VIS-INQ-001** | Page: `/support` | Do: 1. Click "Support" in the top navigation header.<br>2. Fill out the contact form: Full Name "Visitor Jane", Email "jane@example.com", Subject "Inquiry", Message "I have a question about overseas payments."<br>3. Click "Submit Support Request". | Expect: Button shows a brief loading state, then a success screen appears with a unique tracking Reference Number (e.g. `SUP-XXXX-XXXX`) and an advisory that support responds within 24 hours. | Watch for: Double-clicking creating two identical support submissions. | Batch: 2
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-INQ-002** | Page: `/partner-with-us` | Do: 1. Click "Partner With Us" in navigation.<br>2. Fill in: Organization "St. Paul Hospital Partner", Contact Name "Dr. Samuel", Email "samuel@partner.et", Phone "+251911223344", Message "Interested in diaspora health packages."<br>3. Attach a sample PDF document (under 5MB).<br>4. Click "Submit Partnership Inquiry". | Expect: File uploads with progress indicator, inquiry submits successfully, and confirmation screen displays: "Inquiry received. An enterprise relationship manager will reach out shortly." | Watch for: Uploads stalling with no progress bar, or rejecting standard `.pdf` files. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module E: Registration & Authentication Forms

- [ ] **VIS-AUTH-001** | Page: `/register` | Do: 1. Click "Register" in top header.<br>2. Inspect the role selection cards. | Expect: Clearly offers three distinct account choices: "Personal / Customer" (family healthcare & gifts), "Healthcare Provider" (doctors, clinics, hospitals), and "Merchant" (pharmacies, medical supplies). | Watch for: Admin role option visible to public visitors (security failure). | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-AUTH-002** | Page: `/register` | Do: 1. Select "Customer".<br>2. Attempt to submit with all fields blank. | Expect: Form prevents submission. Red inline validation messages appear under Full Name, Email, and Password stating they are required. | Watch for: Page refreshing and clearing everything with no explanation. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-AUTH-003** | Page: `/register` | Do: 1. Enter password: `short` (under 8 characters).<br>2. Enter email: `not-an-email`. | Expect: System flags: "Email must be a valid email address" and "Password must be at least 8 characters long". | Watch for: System submitting invalid email format to server. | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-AUTH-004** | Page: `/login` | Do: 1. Click "Log In" in header.<br>2. Enter Email `fake_user_999@example.com` and Password `WrongPassword123!`.<br>3. Click "Sign In". | Expect: Displays a clear red alert banner: "Invalid email or password." Fields remain populated so user can correct their input. | Watch for: System saying "Email does not exist" (user enumeration vulnerability). | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-AUTH-005** | Page: `/forgot-password` | Do: 1. On the login page, click "Forgot Password?".<br>2. Enter email: `customer@123.com`.<br>3. Click "Send Recovery Link". | Expect: Displays immediate green confirmation banner: "If an account exists with this email, a password reset link has been dispatched." Check Mailpit (`http://127.0.0.1:8025`) to confirm delivery. | Watch for: Response taking longer than 2 seconds or revealing if the email exists. | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module F: Visitor "Must NOT Be Able To" (Security & Boundary Defense)

- [ ] **VIS-SEC-001** | Page: `/dashboard` | Do: 1. In the browser address bar, manually type `http://localhost:5173/dashboard` and press Enter while logged out. | Expect: Access is blocked immediately. Browser redirects to `/login` or `/unauthorized` with a prompt: "You must be signed in to view this page." | Watch for: Customer dashboard flashing on screen or rendering private customer data. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-SEC-002** | Page: `/merchant/dashboard` | Do: 1. Manually type `http://localhost:5173/merchant/dashboard` and press Enter while logged out. | Expect: Blocked immediately. Redirects to `/login` or `/unauthorized`. | Watch for: Merchant business data, revenue, or document upload screens visible to logged-out visitor. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-SEC-003** | Page: `/provider/dashboard` | Do: 1. Manually type `http://localhost:5173/provider/dashboard` and press Enter while logged out. | Expect: Blocked immediately. Redirects to `/login` or `/unauthorized`. | Watch for: Doctor appointment calendars or patient booking lists visible to logged-out visitor. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-SEC-004** | Page: `/admin/dashboard` | Do: 1. Manually type `http://localhost:5173/admin/dashboard` and press Enter while logged out. | Expect: Blocked immediately. Redirects to `/login` or displays an explicit "Access Denied" screen. | Watch for: Admin navigation bar, financial charts, or user lists exposed. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module G: Mobile Responsiveness & Keyboard-Only Pass

- [ ] **VIS-MOB-001** | Page: `/` (Mobile 375px) | Do: 1. Open DevTools (`F12`), toggle Device Toolbar (`Ctrl+Shift+M`), select "iPhone SE" (375px width).<br>2. Inspect header navigation. | Expect: Full desktop links collapse into a clean hamburger menu icon. Tapping the hamburger opens an off-canvas drawer with all navigation links neatly aligned. | Watch for: Header links overflowing horizontally or forcing an ugly horizontal scrollbar. | Batch: 1
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **VIS-KEY-001** | Page: `/login` (Keyboard Only) | Do: 1. Put mouse away.<br>2. Navigate to `/login`.<br>3. Use `Tab` key to move through Email, Password, "Remember Me", and "Sign In" button.<br>4. Press `Enter` on "Sign In". | Expect: A clearly visible focus outline rings each input field as it is selected. Pressing `Enter` triggers the login submission. Focus is never trapped. | Watch for: Invisible focus cursor, or inability to reach the submit button using Tab. | Batch: 5
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
