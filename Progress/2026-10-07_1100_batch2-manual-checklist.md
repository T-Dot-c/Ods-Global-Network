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

---

### Step 6: Backend Migrations & Database Endpoint Verification (PowerShell)

Ensure `Backend/.env` is configured with your local database password (`DB_PASSWORD`), and `Backend` dev server is running on `http://localhost:3001`.

#### 1. Apply Migrations 010 and 011
```powershell
cd "c:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\Backend"
npm run migrate
```
*Expected Output:*
```
[Migrations] Found 11 migration file(s) in ./migrations/
  [Skipped] (already applied): 001_create_users_table.sql
  ...
  [Applied] 010_create_support_requests_table.sql
  [Applied] 011_create_partners_table.sql
[Migrations] Complete. Applied: 2  |  Skipped: 9
```

#### 2. Check Initial Table Row Counts
```powershell
psql -U postgres -d ods_global -c "SELECT count(*) AS support_count FROM support_requests;"
psql -U postgres -d ods_global -c "SELECT count(*) AS partners_count FROM partners;"
```

#### 3. Test `POST /api/support` Endpoints
```powershell
# (A) Valid Support Request (Expect HTTP 200, ODS-REQ-XXXXXXXX, +1 row in DB)
Invoke-RestMethod -Uri "http://localhost:3001/api/support" -Method Post -ContentType "application/json" -Body '{"name":"Abebe Kebede","email":"abebe@example.com","subject":"Appointment Inquiry","message":"Requesting information regarding clinic specialist availability."}'

# (B) Invalid Support Request (Expect HTTP 400 error, 0 rows added)
try {
  Invoke-RestMethod -Uri "http://localhost:3001/api/support" -Method Post -ContentType "application/json" -Body '{"name":"","email":"invalid-email","subject":"Test","message":""}'
} catch {
  $_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}

# (C) Bot Honeypot Support Request (Expect HTTP 200 with ODS-REQ-00000000, 0 rows added)
Invoke-RestMethod -Uri "http://localhost:3001/api/support" -Method Post -ContentType "application/json" -Body '{"name":"Spam Bot","email":"bot@spam.com","subject":"Buy Now","message":"Spam offer text","website":"http://spam-link.com"}'

# Verify Row Count
psql -U postgres -d ods_global -c "SELECT reference, name, email, subject, created_at FROM support_requests ORDER BY created_at DESC LIMIT 5;"
```

#### 4. Test `POST /api/partners` Endpoints
```powershell
# (A) Valid Partner Request (Expect HTTP 200, +1 row in DB)
Invoke-RestMethod -Uri "http://localhost:3001/api/partners" -Method Post -ContentType "application/json" -Body '{"partnership_type":"investor","name":"Sara Tesfaye","company_name":"Highland Capital","email":"sara@highland.com","phone":"+251911223344","whatsapp":"+251911223344","sector":"Healthcare","investment_type":"Equity","enquiry":"Interested in Series A co-investment."}'

# (B) Invalid Partner Request (Expect HTTP 400 error, 0 rows added)
try {
  Invoke-RestMethod -Uri "http://localhost:3001/api/partners" -Method Post -ContentType "application/json" -Body '{"partnership_type":"invalid_type","name":"","company_name":"","email":"bad","phone":""}'
} catch {
  $_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}

# (C) Bot Honeypot Partner Request (Expect HTTP 200, 0 rows added)
Invoke-RestMethod -Uri "http://localhost:3001/api/partners" -Method Post -ContentType "application/json" -Body '{"partnership_type":"investor","name":"Spam Bot","company_name":"Spam Corp","email":"bot@spam.com","phone":"+123456789","website_url":"http://spam-site.com"}'

# Verify Row Count
psql -U postgres -d ods_global -c "SELECT id, partnership_type, name, company_name, phone, whatsapp, created_at FROM partners ORDER BY created_at DESC LIMIT 5;"
```

