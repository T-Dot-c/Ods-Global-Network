# Batch 2 Analysis Summary: Public Informational & Intake Pages

**File:** `./Progress/2026-10-06_1640_summary_batch2-analysis.md`  
**Date:** 2026-10-06 16:40  
**Scope:** `/company`, `/support`, `/partner-with-us`  
**Status:** Complete  

---

## 1. Executive Synthesis & Scope Alignment

Batch 2 covers the reconstruction of three essential public-facing routes from the legacy system:
1. **`/company`** (`CompanyInfo.tsx`): Institutional identity, mission, vision, and strategic impact pillars.
2. **`/support`** (`SupportPage.tsx`): Public customer care, contact channels, inquiry ticketing, and FAQs.
3. **`/partner-with-us`** (`PartnerWithUs.tsx`): Structured multi-track partnership, investment, and sponsorship intake.

All three pages will be modernized using React 18, TypeScript, Vite, ODS Deep Navy (`#0F285B`) and Gold (`#BE9B49`/`#EDC45B`) design tokens, and WCAG 2.1 AA accessibility standards, purging all legacy green artifacts (`#1c2b21`), arbitrary animations, and raw browser `alert()` popups.

---

## 2. Dependencies & Shared Assets

* **Design Tokens & Fonts**: Unchanged `tokens.css`, `Google Sans Flex` headings, `Inter` body text.
* **Reusable UI Components**:
  - `Button` (`Frontend/src/components/common/Button.tsx`)
  - `Input` (`Frontend/src/components/common/Input.tsx`)
  - `Card` (`Frontend/src/components/common/Card.tsx`)
* **Focus Architecture**: `batch1-focus.css` provides scoped luminous gold focus rings.
* **Routing Infrastructure**: `Frontend/src/App.tsx` router views union and `onNavigate` dispatching.
* **Backend Database**: Existing PostgreSQL 18.6 connection pool (`Backend/src/db.js`).

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :---: | :--- |
| **Header / Navigation Regressions** | High | `Header.tsx` is complex (1,400+ lines with accessibility refs). Navigation modifications should be minimal, surgical, and only made to resolve verified mismatches ("Help Center" and "Partner With Us"). |
| **Spam / Bot Form Abuse** | Medium | Implement hidden honeypot fields (`website`) on both `/support` and `/partner-with-us` forms. Submissions with filled honeypots are silently dropped with HTTP 200/400. |
| **File Upload Complexity on Partner Form** | Medium | In legacy, 8 file uploads created complex multer/cloud dependencies. For Batch 2 testing, record file metadata/names into PostgreSQL `metadata JSONB` rather than complex external storage. |
| **Legacy Green & Emojis Carry-Over** | Low | Strict audit to ensure zero `#1c2b21` or raw emojis; all icons migrate to Lucide React vectors. |

---

## 4. Proposed Build Order

1. **Page 1: `/company` (Company Overview)**
   - *Rationale*: Purely informational and visual; requires zero backend endpoints or schema migrations. Establishes the updated corporate brand voice, typography, and responsive cards first.
2. **Page 2: `/support` (Customer Support & Help Center)**
   - *Rationale*: High user-impact route directly referenced in the Header ("Help Center") and Footer. Introduces the minimal `support_requests` PostgreSQL table and test `POST /api/support` endpoint with server-side validation and honeypot.
3. **Page 3: `/partner-with-us` (Partner With Us Intake)**
   - *Rationale*: Multi-tab form intake with dynamic field sets. Leverages the form and validation patterns established on `/support`, introducing the minimal `partners` PostgreSQL table and test `POST /api/partners` endpoint.
