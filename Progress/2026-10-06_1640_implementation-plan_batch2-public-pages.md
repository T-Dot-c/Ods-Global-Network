# Implementation Plan: Batch 2 Public Pages & Testing Endpoints
## `/company`, `/support`, `/partner-with-us`

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-06_1640_implementation-plan_batch2-public-pages.md`  
**Date:** 2026-10-07 (Updated with User Amendments)  
**Branch:** `batch2-public-pages` (Created from `main`)  
**Status:** **Approved by User — Active Execution**  

---

## 1. Exact Files In Scope

Only the files explicitly listed below will be created or modified. Anything not listed is strictly out of scope.

### Files to Create (8 Files):
1. `Frontend/src/pages/CompanyPage.tsx`
2. `Frontend/src/pages/SupportPage.tsx`
3. `Frontend/src/pages/PartnerWithUsPage.tsx`
4. `Frontend/src/services/publicService.ts`
5. `Backend/src/database/migrations/010_create_support_requests_table.sql`
6. `Backend/src/database/migrations/011_create_partners_table.sql`
7. `Backend/src/routes/support.js`
8. `Backend/src/routes/partners.js`

### Documentation / Verification Files to Create in `./Progress/` (2 Files):
1. `Progress/2026-10-07_1100_batch2-audit-log.md`
2. `Progress/2026-10-07_1100_batch2-manual-checklist.md`

### Files to Modify (6 Files):
1. `Frontend/src/App.tsx`
   - *Scope*: Register `'company' | 'support' | 'partner-with-us'` in the `View` type union, route normalizer, and view render switch.
2. `Frontend/src/components/layout/Header.tsx`
   - *Scope*: Minimal surgical link updates (capped at ~40 lines diff).
3. `Frontend/src/components/layout/Footer.tsx`
   - *Scope*: Minimal link wiring for "Help Center" button (capped at ~10 lines diff).
4. `Backend/src/server.js`
   - *Scope*: Mount the two modular route handlers under `/api/support` and `/api/partners` (~4 lines added).
5. `Status/PROJECT_STATUS.md`
   - *Scope*: Record Batch 2 completion status.
6. `Progress/2026-10-06_1640_action-plan_batch2-public-pages.md` & `Progress/2026-10-06_1640_summary_batch2-analysis.md` (Updated with amendments).

### Files Strictly Untouched:
- `Backend/src/routes/auth.js` (ZERO changes)
- `Frontend/src/styles/tokens.css` (ZERO changes)
- All Batch 1 pages (`LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `TermsPage.tsx`, `UnauthorizedPage.tsx`) (ZERO changes)
- All role dashboards (`CustomerDashboard.tsx`, `MerchantDashboard.tsx`, `ProviderDashboard.tsx`, `AdminDashboard.tsx`) (ZERO changes)
- `resource/` directory (100% READ-ONLY)

---

## 2. Routing Architecture & Navigation Alignment

### 2.1. Routing & Subpage Behavior
* **View-State & HTML5 History**: The application uses client-side view-state management (`currentView: View` in `App.tsx`) synchronized with browser history (`window.history.pushState(null, '', newPath)` and `popstate` event listeners).
* **Gifting Link on `/company`**: Navigates to `home` and smoothly scrolls to `#gifting` (`onNavigate('home')` followed by scrolling to `#gifting`). It will not rely on silent fallback. Batch 4 will replace this target with dedicated `/gifting-options`.
* **SEO Metadata**: Each of the 3 pages sets its own `document.title` and meta description via `useEffect` upon mounting.

### 2.2. Surgical Edits to `Header.tsx` & `Footer.tsx`
* **Diff Caps**: `Header.tsx` diff capped at ~40 lines; `Footer.tsx` diff capped at ~10 lines. `git diff --stat` will be quoted.
* **Header MenuItem Type Update**: Allow optional `anchor?: string;` and `view?: string;`.
* **Header Icon Import**: Add `Handshake` from `lucide-react`.
* **Search Overlay Click Handler**: Check search result click handler (approx line 994) and support items with `view`: `item.view ? onNavigate(item.view) : handleLinkClick(item.anchor)`.
* **Menu Items**:
  - `businessMenu`: Add 3rd item `{ label: 'Partner With Us', view: 'partner-with-us', icon: <Handshake size={16} /> }`.
  - `aboutMenu`: `"About ODS Global Net"` → `view: 'company'`; `"Our Network"` → `anchor: '#ecosystem'` (stays unchanged); `"Contact Us"` → `view: 'support'`.
  - Top Utility Bar: "Help Center" button → `onNavigate('support')`.
* **Footer**: Bottom utility bar `<span>Help Center</span>` becomes `<button type="button" onClick={() => onNavigate?.('support')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}>Help Center</button>`. `Privacy Policy` remains strictly untouched.

---

## 3. Technical Specifications

### 3.1. Database Migrations (PostgreSQL 18.6)
* **Runner**: `node src/database/migrate.js` (invoked via `npm run migrate` in `Backend`).
* **Existing State**: Highest existing migration is `009_seed_admin.sql`. Zero gaps exist between `001` and `009`.
* **New Migration Files**:
  - `010_create_support_requests_table.sql`:
    ```sql
    CREATE TABLE IF NOT EXISTS support_requests (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference  VARCHAR(32) NOT NULL UNIQUE,
        name       VARCHAR(128) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        subject    VARCHAR(200) NOT NULL,
        message    TEXT NOT NULL,
        status     VARCHAR(30) NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_support_requests_created ON support_requests(created_at DESC);
    ```
  - `011_create_partners_table.sql`:
    *(Added `whatsapp` column with validation; max length constraints applied; zero document upload columns)*
    ```sql
    CREATE TABLE IF NOT EXISTS partners (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partnership_type VARCHAR(50) NOT NULL,
        name             VARCHAR(128) NOT NULL,
        company_name     VARCHAR(128) NOT NULL,
        email            VARCHAR(255) NOT NULL,
        phone            VARCHAR(50) NOT NULL,
        whatsapp         VARCHAR(50),
        sector           VARCHAR(100),
        investment_type  VARCHAR(100),
        enquiry          VARCHAR(2000),
        status           VARCHAR(30) NOT NULL DEFAULT 'submitted',
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_partners_created ON partners(created_at DESC);
    ```

### 3.2. Backend Routes (Testing Endpoints)

#### Endpoint 1: `POST /api/support` (`Backend/src/routes/support.js`)
* **Spam Guard**: Honeypot `website`. If filled, return `{ success: true, reference: "ODS-REQ-00000000" }` without database insertion.
* **Validation**:
  - `name`: 1–128 chars.
  - `email`: RFC 5322 regex match.
  - `subject`: 1–200 chars.
  - `message`: 1–2000 chars.
* **Reference ID & Collision Handling**:
  - Generates at least 8 hex chars: `ODS-REQ-` + `crypto.randomBytes(4).toString('hex').toUpperCase()` (e.g. `ODS-REQ-A1B2C3D4`).
  - Retry on unique violation (PostgreSQL error code `23505`) up to 3 attempts. Never return a 500 on collision.
* **Console Logging**: Reference ID and type only, never message body, and only when `NODE_ENV !== 'production'`.
* **Response**: `{ success: true, reference: "ODS-REQ-A1B2C3D4", message: "Your support request has been received (Reference: ODS-REQ-A1B2C3D4). For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net." }`. (Zero promises of follow-up).

#### Endpoint 2: `POST /api/partners` (`Backend/src/routes/partners.js`)
* **Spam Guard**: Honeypot `website_url`. If filled, return `{ success: true }`.
* **Validation**:
  - `partnership_type`: Allowlist `['investor', 'strategic_partner', 'sponsorship']`.
  - `name`: 1–128 chars.
  - `company_name`: 1–128 chars.
  - `email`: RFC 5322 regex match.
  - `phone`: 5–50 chars.
  - `whatsapp`: Optional, 5–50 chars.
  - `sector`: Max 100 chars.
  - `investment_type`: Max 100 chars.
  - `enquiry`: Max 2000 chars.
* **Console Logging**: Type only, never message body, only when `NODE_ENV !== 'production'`.
* **Response**: `{ success: true, message: "Your partnership inquiry has been received. For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net." }`. (Zero promises of follow-up).

### 3.3. Frontend Service Layer (`Frontend/src/services/publicService.ts`)
* Uses `API_BASE = 'http://localhost:3001'`.
* Methods:
  - `submitSupportRequest(data)`
  - `submitPartnerRequest(data)`
* Error classification: `'network' | 'validation' | 'server' | 'unknown'`.

### 3.4. Frontend Page Specifications
* **`CompanyPage.tsx`**: Sets `document.title = "Company Overview | ODS Global Network"`. 9 categories. Condensed Cultural Gifting card linking to home `#gifting`.
* **`SupportPage.tsx`**: Sets `document.title = "Customer Support & Help Center | ODS Global Network"`. Contact channels, support form with honeypot, reference ID display, neutral message with phone/email for urgent matters. 5 truthful FAQs:
  1. What is ODS Global Network?
  2. How do I get started or create an account? (Explicitly references customer, merchant, and provider roles from `RegisterPage.tsx:33-38`).
  3. How can I reach the ODS Global Network team?
  4. What services will be available through the network? (Omits "verified").
  5. How do I inquire about partnerships or corporate packages?
* **`PartnerWithUsPage.tsx`**: Sets `document.title = "Partner With Us | ODS Global Network"`. 3 tabs, sector/investment dropdowns, contact fields (including WhatsApp), no document upload fields.

---

## 4. Test Plan & Evidence Requirements

1. **TypeScript Compilation**: `npx tsc --noEmit` in `Frontend` (Quote exact output, exit code 0).
2. **Production Build**: `npm run build` in `Frontend` (Quote exact output, exit code 0).
3. **Six Backend Endpoint Tests** (via Node script):
   - `POST /api/support` Valid & DB insertion verified.
   - `POST /api/support` Invalid (missing required fields) & 400 verified.
   - `POST /api/support` Honeypot & DB non-insertion verified.
   - `POST /api/partners` Valid & DB insertion verified.
   - `POST /api/partners` Invalid & 400 verified.
   - `POST /api/partners` Honeypot & DB non-insertion verified.
   - Collision retry logic verified.
4. **Git Diff Caps**:
   - `git diff --stat` for `Header.tsx` (< 40 lines).
   - `git diff --stat` for `Footer.tsx` (< 10 lines).
5. **Manual Verification Checklist**:
   - Layout, mobile, keyboard, header clicks, and direct route checks documented in `Progress/2026-10-07_1100_batch2-manual-checklist.md` under "Not verified" for local agent execution.
