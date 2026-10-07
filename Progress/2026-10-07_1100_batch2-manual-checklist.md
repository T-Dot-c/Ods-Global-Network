# Batch 2 Manual Verification Checklist
## `/company`, `/support`, `/partner-with-us`

**File:** `./Progress/2026-10-07_1100_batch2-manual-checklist.md`  
**Date:** 2026-10-07  
**Branch:** `batch2-public-pages`  
**Status:** Ready for User Browser Verification  

---

### Prerequisites
Both local servers should be running:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

---

### Step 1: Navigation & Routing Checks

- [ ] **Direct URL Navigation**:
  - Visit `http://localhost:5173/company` &rarr; verify page loads with document title *"Company Overview | ODS Global Network"*.
  - Visit `http://localhost:5173/support` &rarr; verify page loads with document title *"Customer Support & Help Center | ODS Global Network"*.
  - Visit `http://localhost:5173/partner-with-us` &rarr; verify page loads with document title *"Partner With Us | ODS Global Network"*.
- [ ] **Subpage "Back to Home" Buttons**:
  - On `/company`, click "Back to Home" &rarr; verify URL returns to `/` and homepage displays.
  - On `/support`, click "Back to Home" &rarr; verify URL returns to `/`.
  - On `/partner-with-us`, click "Back to Home" &rarr; verify URL returns to `/`.
- [ ] **Header Menu Links (on Homepage)**:
  - Open "About Us" dropdown &rarr; click "About ODS Global Net" &rarr; verify navigates to `/company`.
  - Open "About Us" dropdown &rarr; click "Our Network" &rarr; verify smooth scroll to `#ecosystem`.
  - Open "About Us" dropdown &rarr; click "Contact Us" &rarr; verify navigates to `/support`.
  - Click top-bar "Help Center" button &rarr; verify navigates to `/support`.
  - Open "For Businesses" dropdown &rarr; click "Partner With Us" &rarr; verify navigates to `/partner-with-us`.
- [ ] **Header Search Dialog**:
  - Click "Search" button &rarr; type "Partner" &rarr; click "Partner With Us" result &rarr; verify navigates to `/partner-with-us`.
  - Click "Search" button &rarr; type "About" &rarr; click "About ODS Global Net" result &rarr; verify navigates to `/company`.
  - Click "Search" button &rarr; type "Contact" &rarr; click "Contact Us" result &rarr; verify navigates to `/support`.
- [ ] **Footer Navigation**:
  - In bottom utility bar, click "Help Center" button &rarr; verify navigates to `/support`.
  - Verify "Privacy Policy" is static text and "Terms & Conditions" navigates to `/terms`.

---

### Step 2: `/company` Verification

- [ ] **Content & Categories**:
  - Verify Hero header displays corporate wordmark and tagline *"Ethiopian Blessings, Modern Gifting"*.
  - Verify Mission and Vision cards are rendered in dark navy/gold cards.
  - Verify 9 Provider Network categories (Hospitals, Clinics, Pharmacies, Laboratories, Wellness Centers, Ambulance Services, Home Care, Specialists, Diagnostic Centers).
  - Verify 4 Strategic Platform Pillars.
- [ ] **Cultural Gifting Block**:
  - Verify condensed Cultural Gifting card is displayed.
  - Click "Explore Gifting on Home →" &rarr; verify it navigates to `/` and smoothly scrolls down to `#gifting`.

---

### Step 3: `/support` Verification

- [ ] **Direct Contact Channels**:
  - Verify Phone (+251 960 606 042), Email (info@odsglobal.net), Telegram (@odsglobalnet), and WhatsApp links display and have gold hover states.
- [ ] **Form Submission**:
  - Fill Name, Email, Subject, Message.
  - Click "Send Support Request".
  - Verify loading state appears on button.
  - Verify success banner appears showing reference ID format `ODS-REQ-XXXXXXXX` (8 hex characters).
  - Verify message is neutral: *"Your support request has been received (Reference: ODS-REQ-XXXXXXXX). For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net."* (No promise of follow-up).
- [ ] **FAQ Accordion**:
  - Click each of the 5 FAQ questions to expand/collapse.
  - Verify FAQ 2 explains account registration with customer, merchant, and service provider roles.
  - Verify FAQ 4 lists 9 categories without claiming "verified".
  - Verify zero claims about orders, delivery tracking, appointment booking, payments, refunds, gift card redemptions, or ticket tracking portals.

---

### Step 4: `/partner-with-us` Verification

- [ ] **Tab Navigation**:
  - Click "Investor", "Strategic Partner", and "Sponsorship" tabs.
  - Verify active tab transitions smoothly with gold background.
  - Verify dynamic fields: "Proposed Investment Type" dropdown appears on "Investor" tab only.
  - Verify Industry Sector dropdown is hidden on "Sponsorship" tab.
  - Verify **no document upload inputs** are rendered anywhere on the form.
- [ ] **Form Submission**:
  - Fill Name, Organization Name, Official Email, Phone, WhatsApp (optional), Sector, Investment Type, Enquiry.
  - Click "Submit Partnership Inquiry".
  - Verify inline success confirmation displays: *"Your partnership inquiry has been received. For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net."*

---

### Step 5: Responsive & Accessibility Checks

- [ ] **Desktop (1280px)**:
  - Verify multi-column grid layout across all three pages.
  - Verify no horizontal scrollbar or overflow.
- [ ] **Mobile (375px / 768px)**:
  - Open browser DevTools device emulation (e.g. iPhone 12 / 375px width).
  - Verify forms and cards stack cleanly in a single column.
  - Verify tap targets (inputs, buttons) are at least 44x44px.
  - Open mobile navigation drawer (hamburger icon) &rarr; verify "For Businesses" accordion includes "Partner With Us" and "About Us" accordion includes "About ODS Global Net" and "Contact Us".
- [ ] **Keyboard Navigation**:
  - Press `Tab` through interactive elements.
  - Verify visible gold outline ring (`outline: 2px solid var(--color-gold-bright)`) on all active buttons, links, and inputs.
  - Press `Enter` or `Space` to activate buttons and expand FAQ accordions.
