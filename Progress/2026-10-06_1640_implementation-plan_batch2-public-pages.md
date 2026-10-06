# Implementation Plan: Batch 2 Public Pages & Testing Endpoints
## `/company`, `/support`, `/partner-with-us`

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-06_1640_implementation-plan_batch2-public-pages.md`  
**Date:** 2026-10-06 16:40  
**Branch:** `batch2-public-pages` (To be created from `main` post-approval)  
**Status:** **Pending User Approval** ("Approved: proceed")  

---

## 1. Exact Files In Scope

Only the files explicitly listed below will be created or modified. Anything not listed is strictly out of scope and requires a separate approval.

### Files to Create (7 Files):
1. `d:/Ods Global/Source Code/Ods-Global-Network/Frontend/src/pages/CompanyPage.tsx`
2. `d:/Ods Global/Source Code/Ods-Global-Network/Frontend/src/pages/SupportPage.tsx`
3. `d:/Ods Global/Source Code/Ods-Global-Network/Frontend/src/pages/PartnerWithUsPage.tsx`
4. `d:/Ods Global/Source Code/Ods-Global-Network/Backend/src/database/migrations/010_create_support_requests_table.sql`
5. `d:/Ods Global/Source Code/Ods-Global-Network/Backend/src/database/migrations/011_create_partners_table.sql`
6. `d:/Ods Global/Source Code/Ods-Global-Network/Backend/src/routes/support.js`
7. `d:/Ods Global/Source Code/Ods-Global-Network/Backend/src/routes/partners.js`

### Files to Modify (4 Files):
1. `d:/Ods Global/Source Code/Ods-Global-Network/Frontend/src/App.tsx`
   - *Justification*: Register `'company' | 'support' | 'partner-with-us'` in the `View` type union, route normalizer, and view render switch.
2. `d:/Ods Global/Source Code/Ods-Global-Network/Frontend/src/components/layout/Header.tsx`
   - *Justification*: Fix verified navigation mismatches: wire top utility bar "Help Center" button to `onNavigate('support')` (currently scrolls to `#contact`), and wire "Partner With Us" under `businessMenu`.
3. `d:/Ods Global/Source Code/Ods-Global-Network/Frontend/src/components/layout/Footer.tsx`
   - *Justification*: Fix verified navigation mismatches: convert inert `<span>Help Center</span>` into an active button calling `onNavigate?.('support')`, and add links to `company` and `partner-with-us`.
4. `d:/Ods Global/Source Code/Ods-Global-Network/Backend/src/server.js`
   - *Justification*: Mount the two new modular route handlers: `app.use('/api/support', supportRoutes)` and `app.use('/api/partners', partnerRoutes)`. Zero changes to existing auth, security headers, or rate-limiters.

### Files Strictly Untouched:
- `Backend/src/routes/auth.js` (ZERO changes)
- `Frontend/src/styles/tokens.css` (ZERO changes)
- `Frontend/src/pages/RegisterPage.tsx`, `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `TermsPage.tsx`, `UnauthorizedPage.tsx` (ZERO changes)
- All 4 role dashboards (`CustomerDashboard.tsx`, `MerchantDashboard.tsx`, `ProviderDashboard.tsx`, `AdminDashboard.tsx`) (ZERO changes)
- `resource/` directory (100% READ-ONLY)

---

## 2. Technical Implementation Specifications

### 2.1. Database Migrations (PostgreSQL 18.6)

#### Migration 010: `support_requests`
```sql
CREATE TABLE IF NOT EXISTS support_requests (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(128) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    subject    VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    status     VARCHAR(30) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_created ON support_requests(created_at DESC);
```

#### Migration 011: `partners`
```sql
CREATE TABLE IF NOT EXISTS partners (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_type VARCHAR(50) NOT NULL,
    name             VARCHAR(128) NOT NULL,
    company_name     VARCHAR(128) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(50) NOT NULL,
    sector           VARCHAR(100),
    investment_type  VARCHAR(100),
    enquiry          TEXT,
    metadata         JSONB DEFAULT '{}'::jsonb,
    status           VARCHAR(30) NOT NULL DEFAULT 'submitted',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_created ON partners(created_at DESC);
```

### 2.2. Backend Endpoints (Testing Mode)

#### Endpoint 1: `POST /api/support` (`Backend/src/routes/support.js`)
* **Spam Guard**: Single honeypot field `website`. If present and non-empty, silently return `{ success: true }` without database insertion.
* **Validation**:
  - `name`: String, 1–128 chars.
  - `email`: RFC 5322 regex match.
  - `subject`: String, 1–200 chars.
  - `message`: String, 1–2000 chars.
* **Database Query**: Parameterized `INSERT INTO support_requests (name, email, subject, message) VALUES ($1, $2, $3, $4)`.
* **Dev Output**: Logs formatted ticket receipt to backend terminal console.
* **Response**: Uniform JSON `{ success: true, message: "Your support request has been received. Our team will contact you shortly." }`.

#### Endpoint 2: `POST /api/partners` (`Backend/src/routes/partners.js`)
* **Spam Guard**: Single honeypot field `website_url`. If present, silently return `{ success: true }`.
* **Validation**:
  - `partnership_type`: Allowed values `['investor', 'strategic_partner', 'sponsorship']`.
  - `name`: String, 1–128 chars.
  - `company_name`: String, 1–128 chars.
  - `email`: RFC 5322 regex match.
  - `phone`: String, 5–50 chars.
* **Database Query**: Parameterized `INSERT INTO partners (partnership_type, name, company_name, email, phone, sector, investment_type, enquiry, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`.
* **Dev Output**: Logs formatted partnership inquiry to backend terminal console.
* **Response**: Uniform JSON `{ success: true, message: "Thank you for your interest in partnering with ODS Global Network. Our partnerships team will be in touch." }`.

---

### 2.3. Frontend Rebuilds

#### Page 1: `CompanyPage.tsx` (`/company`)
* Top sticky utility bar with "Back to Home" button and ODS vector logo.
* Section 1: Hero with ODS corporate wordmark, tagline ("Ethiopian Blessings, Modern Gifting"), and mission/vision cards.
* Section 2: What We Offer — Centralized marketplace, cultural gifting, corporate wellness, diaspora engagement, and community initiatives (with Lucide icons).
* Section 3: Why Choose ODS Global Network — Holistic services, cultural connection, seamless experience, social impact.
* Section 4: 9 Healthcare & Wellness Provider Categories (Hospitals, Clinics, Pharmacies, Labs, Wellness Centers, Ambulance, Home Care, Specialists, Diagnostic Centers).
* Section 5: Key Initiatives & Economic Impact.
* Integrates platform `Footer.tsx`.

#### Page 2: `SupportPage.tsx` (`/support`)
* Top utility bar with "Back to Home" button and ODS vector logo.
* Direct contact banner: Phone (`+251 960 606 042`), Email (`info@odsglobal.net`), WhatsApp, Telegram with active gold hover states.
* Accessible support form: Name, Email, Subject, Message, hidden honeypot field.
* Inline feedback banner (clean success confirmation card; red error alert with focus return).
* Frequently Asked Questions section with accordion or structured cards covering appointments, cancellations, payments, and platform usage.
* Integrates platform `Footer.tsx`.

#### Page 3: `PartnerWithUsPage.tsx` (`/partner-with-us`)
* Top utility bar with "Back to Home" button and ODS vector logo.
* Track selector tabs: **Investor**, **Strategic Partner**, **Sponsorship**.
* Dynamic field display based on active tab with accessible W3C tab patterns.
* Inputs: Name, Company Name, Email, Phone, WhatsApp, Sector (10 sectors), Investment Type, Enquiries, hidden honeypot.
* Inline submission confirmation card.
* Integrates platform `Footer.tsx`.

---

## 3. Test Plan & Evidence Requirements

| Test Step | Command / Tool | Success Criteria | Evidence Required |
| :--- | :--- | :--- | :--- |
| **TypeScript Compilation** | `npx tsc --noEmit` in `Frontend` | Exit code 0, 0 type errors | Terminal output log |
| **Production Build** | `npm run build` in `Frontend` | Exit code 0, bundles created | Vite build output log |
| **Support API Valid** | Node fetch `POST /api/support` | HTTP 200, `{ success: true }`, DB record created | DB query result |
| **Support API Invalid** | Node fetch `POST /api/support` (empty name/email) | HTTP 400, validation error | Response JSON |
| **Support API Honeypot** | Node fetch `POST /api/support` (with `website: "spam.com"`) | HTTP 200, zero DB record created | DB count unchanged |
| **Partners API Valid** | Node fetch `POST /api/partners` | HTTP 200, `{ success: true }`, DB record created | DB query result |
| **Partners API Invalid** | Node fetch `POST /api/partners` (invalid email) | HTTP 400, validation error | Response JSON |
| **Partners API Honeypot** | Node fetch `POST /api/partners` (with `website_url: "spam.com"`) | HTTP 200, zero DB record created | DB count unchanged |
| **Desktop Viewport** | 1280px viewport check | Multi-column grid, no overflow | Visual DOM layout verification |
| **Mobile Viewport** | 375px / 768px viewport check | Single-column stack, tap targets >= 44px | Responsive verification |
| **Keyboard Accessibility** | `Tab`, `Enter`, `Space` | Visible gold focus ring (`--color-gold-bright`) on all interactive controls | CSS focus verification |
| **Link Integrity** | Link audit across all 3 pages | Zero 404s, all routes resolve cleanly | Router mapping check |

---

## 4. KPIs & Root Guideline Compliance Checklist

Checked against [`resource/KPIs & SCOPES ODS GLOBAL NET .txt`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/KPIs%20&%20SCOPES%20ODS%20GLOBAL%20NET%20.txt) Module 1:

- [ ] **100% Website pages completed for Batch 2**: `/company`, `/support`, `/partner-with-us`.
- [ ] **Zero broken links / Zero broken pages**: All internal header, footer, and utility bar links map to valid DOM anchors or views.
- [ ] **Mobile responsiveness above 95%**: Layout stacks gracefully on mobile with zero horizontal scrolling.
- [ ] **Page loading time under 3 seconds**: Minimal lightweight bundle, zero external map scripts or bloated GIF animations.
- [ ] **SSL / Security**: Prepared for HTTPS deployment; parameterized SQL statements preventing SQL injection.
- [ ] **KPIs Not Directly Measurable in Local Dev**: Production SSL termination (requires live domain/proxy), PageSpeed Insights field data (requires live CDN).

---

## 5. Rollback Steps & Branch Management

* **Working Branch**: `batch2-public-pages` (To be created strictly after user approval: `git checkout -b batch2-public-pages main`).
* **Rollback Procedure**:
  - If regressions occur, discard uncommitted changes via `git restore .`.
  - To completely rollback to pre-Batch 2 state: `git checkout main`.
  - Revert database test migrations if needed: `DROP TABLE IF EXISTS support_requests, partners;`.

---

## 6. Risks & Not Verified Section

### Identified Risks:
1. **Header Complexity**: `Header.tsx` has numerous programmatic accessibility refs and nested dropdown state. Modifying dropdown items must be done strictly without breaking `Escape` key hierarchies or safe blur handlers.
2. **PostgreSQL Migrations**: Ensure `010` and `011` migration scripts run cleanly in migration pipeline without altering existing tables `001` through `009`.

### Not Verified (Pending Execution):
* Compilation of new pages (files not yet created).
* Live HTTP response of `/api/support` and `/api/partners` (endpoints not yet created).
* Database insert performance under concurrent load.
* Screen reader speech output on NVDA / JAWS (to be verified via keyboard semantics).
