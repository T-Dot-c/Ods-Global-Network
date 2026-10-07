# Action Plan: Batch 2 Public Pages Reconstruction
## `/company`, `/support`, `/partner-with-us`

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-06_1640_action-plan_batch2-public-pages.md`  
**Date:** 2026-10-07 (Updated with User Amendments)  
**Branch:** `batch2-public-pages` (Created from `main`)  
**Status:** **Approved by User — Active Execution**  

---

## 1. Process Deviation Log & History Integrity

* **Deviation Record (2026-10-06)**: Documentation commit `0ecee801` ("docs: add Batch 2 analysis briefs and implementation plans for public pages") was committed to `main` and pushed to `origin/main` prior to explicit approval.
* **Resolution**: Recorded here as an official process deviation. History will **not** be rewritten.
* **Strict Corrective Policy**: Branch `batch2-public-pages` has been created directly from `main`. All Batch 2 commits will be made strictly on this branch in the exact 5-stage order specified below. `main` will remain untouched.

---

## 2. Commit Staging Order on `batch2-public-pages`

All work will be committed on `batch2-public-pages` in this exact sequence:

1. **Commit 1: Updated Plan Files**
   - `./Progress/2026-10-06_1640_action-plan_batch2-public-pages.md`
   - `./Progress/2026-10-06_1640_implementation-plan_batch2-public-pages.md`
   - `./Progress/2026-10-06_1640_summary_batch2-analysis.md`
2. **Commit 2: Migrations + Backend Routes**
   - `Backend/src/database/migrations/010_create_support_requests_table.sql`
   - `Backend/src/database/migrations/011_create_partners_table.sql`
   - `Backend/src/routes/support.js`
   - `Backend/src/routes/partners.js`
   - `Backend/src/server.js` (mount routes)
3. **Commit 3: Frontend Pages & Service**
   - `Frontend/src/services/publicService.ts`
   - `Frontend/src/pages/CompanyPage.tsx`
   - `Frontend/src/pages/SupportPage.tsx`
   - `Frontend/src/pages/PartnerWithUsPage.tsx`
4. **Commit 4: Layout & Router Wiring**
   - `Frontend/src/App.tsx`
   - `Frontend/src/components/layout/Header.tsx`
   - `Frontend/src/components/layout/Footer.tsx`
5. **Commit 5: Status & Audit Log**
   - `Status/PROJECT_STATUS.md`
   - `Progress/2026-10-07_1100_batch2-audit-log.md`
   - `Progress/2026-10-07_1100_batch2-manual-checklist.md`

---

## 3. Scope & Key Decision Summary

1. **`/company`**: Institutional profile, mission, vision, 9 healthcare provider categories. Cultural Gifting condensed to a card navigating to `home` and scrolling to `#gifting` (Batch 4 will replace target).
2. **`/support`**: Contact form + 5 truthful FAQs. Submissions generate 8-hex reference ID (`ODS-REQ-XXXXXXXX`) with collision retry. Neutral response with urgent contact phone/email. Console logs reference/type only in non-production.
3. **`/partner-with-us`**: 3 intake tracks with WhatsApp field, max length constraints, zero document upload inputs.
4. **Header/Footer**: Minimal surgical edits capped at ~40 lines (`Header.tsx`) and ~10 lines (`Footer.tsx`). Search overlay supports `view` destinations.
