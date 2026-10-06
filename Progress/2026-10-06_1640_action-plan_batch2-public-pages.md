# Action Plan: Batch 2 Public Pages Reconstruction
## `/company`, `/support`, `/partner-with-us`

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-06_1640_action-plan_batch2-public-pages.md`  
**Date:** 2026-10-06 16:40  
**Status:** Pending User Approval ("Approved: proceed")  

---

## 1. High-Level Objectives

Reconstruct and modernize three public-facing legacy routes into the official ODS Global Network React 18 + Vite frontend and Express + PostgreSQL backend:
1. **`/company`**: Institutional profile, mission, vision, and strategic impact pillars.
2. **`/support`**: Customer care, verified direct channels, ticket inquiry form, and contextual FAQs.
3. **`/partner-with-us`**: Multi-track partnership intake (Investor, Strategic Partner, Sponsorship) with accessible validation.

---

## 2. Phased Architectural Steps

### Phase 1: Branch Setup & Schema Preparation (Post-Approval)
1. Verify working tree is clean.
2. Create dedicated feature branch: `batch2-public-pages` from `main`.
3. Apply minimal database tables (`support_requests` and `partners`) using standard PostgreSQL migrations or pool scripts.

### Phase 2: Backend Test Route Layer
1. Create `Backend/src/routes/support.js`:
   - `POST /api/support` with parameterized query, server-side validation, and honeypot check.
   - Terminal dev logging for inquiry dispatch.
2. Create `Backend/src/routes/partners.js`:
   - `POST /api/partners` with parameterized query, server-side validation, and honeypot check.
   - Terminal dev logging for partnership dispatch.
3. Mount the two route files in `Backend/src/server.js` under `/api/support` and `/api/partners`.

### Phase 3: Frontend Page Rebuilds
1. Build `Frontend/src/pages/CompanyPage.tsx`:
   - Luxury brand header with back navigation.
   - About ODS Global Network, Mission & Vision, 9 Provider Categories, Impact Pillars.
2. Build `Frontend/src/pages/SupportPage.tsx`:
   - Customer support header, direct contact channels (phone, email, WhatsApp, Telegram).
   - Accessible ticket submission form with client-side validation and honeypot.
   - Categorized ODS platform FAQs.
3. Build `Frontend/src/pages/PartnerWithUsPage.tsx`:
   - Multi-track partnership tabs (Investor, Strategic Partner, Sponsorship).
   - Accessible sector and investment options.
   - Clean intake form with client-side validation, honeypot, and inline confirmation state.

### Phase 4: Router & Layout Link Alignment
1. Update `Frontend/src/App.tsx`:
   - Add views `'company' | 'support' | 'partner-with-us'` to `View` type and route normalization.
   - Mount components in `<main>`.
2. Update `Frontend/src/components/layout/Header.tsx`:
   - Wire "Help Center" top utility button to `onNavigate('support')`.
   - Wire "Partner With Us" menu item if confirmed.
3. Update `Frontend/src/components/layout/Footer.tsx`:
   - Convert `<span>Help Center</span>` to button triggering `onNavigate('support')`.
   - Add `company` and `partner-with-us` links.

### Phase 5: Verification & Quality Assurance
1. Execute `npx tsc --noEmit` in `Frontend` (0 errors).
2. Execute `npm run build` in `Frontend` (exit code 0).
3. Execute backend endpoint tests (valid, invalid, honeypot) using Node fetch.
4. Verify desktop & mobile responsiveness and keyboard accessibility.
5. Create comprehensive audit report in `./Progress/`.
