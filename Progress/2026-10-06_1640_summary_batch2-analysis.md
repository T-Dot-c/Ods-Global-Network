# Batch 2 Analysis Summary: Public Informational & Intake Pages
## `/company`, `/support`, `/partner-with-us`

**File:** `./Progress/2026-10-06_1640_summary_batch2-analysis.md`  
**Date:** 2026-10-07 (Updated with User Decisions)  
**Scope:** Rebuilding `/company`, `/support`, `/partner-with-us` in ODS Modern Architecture  
**Status:** Complete  

---

## 1. Executive Synthesis & Applied Decisions

Batch 2 reconstructs three essential public-facing routes from the legacy system:
1. **`/company`** (`CompanyInfo.tsx`): Institutional identity, mission, vision, 9 healthcare provider categories, and a condensed Cultural Gifting block linking to `/gifting-options`.
2. **`/support`** (`SupportPage.tsx`): Customer care channels, inquiry contact form with honeypot spam protection and reference ID generation, plus a 5-question FAQ strictly truthful to today's built system state.
3. **`/partner-with-us`** (`PartnerWithUs.tsx`): Structured multi-track intake (Investor, Strategic Partner, Sponsorship) with contact and partnership fields, with document upload inputs deferred to the Batch 4 unified shared upload service.

All three pages will be modernized using React 18, TypeScript, Vite, ODS Deep Navy (`#0F285B`) and Gold (`#BE9B49`/`#EDC45B`) design tokens, and WCAG 2.1 AA accessibility standards, purging all legacy green artifacts (`#1c2b21`), arbitrary animations, and raw browser `alert()` popups.

---

## 2. Key Decisions Applied

* **Header Navigation**:
  - Top-bar "Help Center" &rarr; opens `/support`.
  - About Us > "About ODS Global Net" &rarr; opens `/company`.
  - About Us > "Our Network" &rarr; stays `#ecosystem` in-page anchor.
  - About Us > "Contact Us" &rarr; opens `/support`.
  - For Businesses &rarr; add "Partner With Us" as third item opening `/partner-with-us` across desktop dropdown, mobile accordion, and search index.
* **Footer Navigation**:
  - Bottom-bar "Help Center" converted to active button opening `/support`. "Privacy Policy" remains strictly untouched.
* **Support Submission Flow**:
  - Submits to `POST /api/support` inserting into `support_requests`.
  - Generates a reference ID (`ODS-REQ-<HEX>`) logged to the backend terminal console.
  - Returns reference ID to client; UI displays an accessible inline success card (no auto-reply email/SMS).
* **Partner Form Scoping**:
  - Document file upload fields removed in Batch 2 (unified upload service built in Batch 4). No filenames or metadata for files recorded in the database in Batch 2.
* **Truthful FAQ Constraint**:
  - 5 audited questions answering what ODS is, how to get started (creating an account with customer/merchant/provider roles verified against `RegisterPage.tsx`), contact channels, 9 categories (without "verified"), and partnership inquiries.
  - Zero claims about orders, delivery tracking, appointment booking, payments, refunds, gift card redemptions, or ticket portals.

---

## 3. Dependencies & Shared Assets

* **Design Tokens & Fonts**: Unchanged `tokens.css`, `Google Sans Flex` headings, `Inter` body text.
* **Reusable UI Components**:
  - `Button` (`Frontend/src/components/common/Button.tsx`)
  - `Input` (`Frontend/src/components/common/Input.tsx`)
  - `Card` (`Frontend/src/components/common/Card.tsx`)
* **Focus Architecture**: `batch1-focus.css` provides scoped luminous gold focus rings.
* **Routing Infrastructure**: `Frontend/src/App.tsx` client-side view-state synchronized with HTML5 History API.
* **Backend Database**: Existing PostgreSQL 18.6 connection pool (`Backend/src/db.js`).

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :---: | :--- |
| **Header Regressions** | High | Apply surgical edits only to target link arrays and top bar (~30 lines max). Enforce `git diff --stat` check to verify minimal footprint. |
| **Bot Abuse on Forms** | Medium | Implement hidden honeypot fields (`website`, `website_url`) with `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden="true"`, discarding bot submissions silently. |
| **Premature Feature Claims** | High | Strictly constrain FAQ text to today's live capabilities, preventing user confusion about unbuilt modules. |

---

## 5. Proposed Build Order

1. **Page 1: `/company` (Company Overview)**
   - Purely informational; requires zero database mutations. Establishes updated brand voice and condensed gifting link first.
2. **Page 2: `/support` (Customer Support & Help Center)**
   - Introduces `support_requests` migration (`010`), `POST /api/support` endpoint with reference ID generation, direct contact banner, and truthful FAQs.
3. **Page 3: `/partner-with-us` (Partnership Intake)**
   - Multi-tab intake (Investor, Strategic Partner, Sponsorship). Introduces `partners` migration (`011`) and `POST /api/partners` endpoint with streamlined fields.
4. **Router & Header/Footer Wiring**:
   - Register views in `App.tsx` and apply surgical link updates to `Header.tsx` and `Footer.tsx`.
