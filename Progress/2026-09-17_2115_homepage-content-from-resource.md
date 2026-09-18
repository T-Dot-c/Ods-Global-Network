<!--
REUSABLE TEMPLATE — Implementation Plan
Save to: ./Progress/
Filename: 2026-09-17_2115_homepage-content-from-resource.md
-->

# Implementation Plan: Integrate HomePage Contents from Resource & Replace Wanaw/Wanaw.et with ODS Global Network

**Project:** ODS Global Network  
**Created:** 2026-09-17 2115  
**Status:** Completed  

---

## Original User Prompt
> use contents for the hompage from the resources and replace the text content that say wanaw.et / wanaw by Ods Global network

---

## Action Plan (High-Level Summary)
Extract the authentic text content, service taxonomies, cultural celebration scopes, and company descriptions from `./resource` (`resource/client/src/locales/en.json`, `Home.tsx`, `HomeHighlights.tsx`, `CompanyInfo.tsx`, and `Cards.tsx`), replace all legacy references to `wanaw`, `wanaw.et`, and `Wanaw Gifting` with `ODS Global Network`, and apply these structured contents to `HomePage.tsx` and `Header.tsx` within the newly adopted crisp white aesthetic.

1. **Header Updates (`Header.tsx`)**:
   - Update navigation link from "Wanaw Vouchers" to "ODS Gifting & Vouchers".
2. **Hero & About Integration (`HomePage.tsx`)**:
   - Title: "ODS Global Network Gifting"
   - Tagline: "“Ethiopian Blessings, Modern Gifting”"
   - Subtitle: "Book, gift, and manage health, wellness, and hotel room services — all in one platform."
   - About Section: Integrate the complete 3-paragraph company mission from `resource/client/src/locales/en.json` (About ODS Global Network).
   - Mission & Vision: Integrate official Mission and Vision from `CompanyInfo.tsx`.
3. **Core Services Taxonomy (`HomePage.tsx`)**:
   - Align service categories directly with `resource/client/src/locales/en.json`:
     - Wellness: "Relaxation, yoga, and spa treatments."
     - Health: "Health consultations, specialist diagnostics, and screenings."
     - Home Based / Mobile Services: "Licensed clinical and domestic services delivered to your home or location of choice."
     - Hotel Rooms & Stays: "Book hotel stays, recovery rooms, and restorative lodging."
4. **4-Step Gifting Journey (`HomePage.tsx`)**:
   - Integrate the exact 4-step journey from `HomeHighlights.tsx` and `en.json`:
     1. Browse Services by Category
     2. Choose Your Role (Individual vs. Corporate)
     3. Pick the Occasion (Cultural & Global Celebrations: Enkutatash, Meskel, Timket, Genna, Fasika, Irreechaa, Ashenda, Mother's Day, etc.)
     4. Send with a Personal Touch
5. **Work with ODS Global Network (from `Cards.tsx`)**:
   - Partner with Us (Investors, VCs, healthcare providers)
   - Join ODS Global Network Community (Diaspora, Healthcare professionals, Volunteers)
   - Career Openings
6. **Voucher & Digital Card Showcase**:
   - Replace "WANAW HEALTH & WELLNESS GIFTING" with "ODS GLOBAL NETWORK HEALTH & WELLNESS GIFTING".
   - Voucher label: "ODS GLOBAL NETWORK EXECUTIVE VOUCHER".
7. **Build & Quality Validation**:
   - Run `npm run build` (`tsc && vite build`) to confirm zero compilation or TypeScript errors.

---

## Implementation Details

### Phase 1: Header Alignment
**Rationale:** Ensure navigation labels are completely free of "Wanaw" references and reflect the unified ODS Global Network brand.

**Steps:**
- [x] Update `./Frontend/src/components/layout/Header.tsx`:
  - Change "Wanaw Vouchers" to "ODS Gifting & Vouchers" in both desktop and mobile navigation.

### Phase 2: Re-populate HomePage with Exact Resource Content
**Rationale:** Ground the home page in the rich, verified copy from `./resource` while maintaining the clean white aesthetic and replacing all legacy branding with ODS Global Network.

**Steps:**
- [x] **Hero & About**:
  - Apply the exact headline and tagline from `resource`: "ODS Global Network Gifting" and "“Ethiopian Blessings, Modern Gifting”".
  - Feature the verified About ODS Global Network narrative and Mission/Vision statements.
- [x] **Service Categories**:
  - Structure services into Wellness, Health, Home-Based/Mobile Care, and Hotel Stays matching `locales/en.json`.
- [x] **Gifting Journey & Highlights**:
  - Incorporate the 4 steps: Browse Services, Choose Role (Individual/Corporate), Pick Occasion, and Send with Personal Touch.
- [x] **Ethiopian & Global Celebrations**:
  - Feature celebrations from `FestivitiesT.tsx` (Enkutatash, Meskel, Timket, Genna, Fasika, Irreechaa, Ashenda) as occasion filters.
- [x] **ODS Digital Voucher**:
  - Rebrand all card assets to ODS Global Network Executive Voucher with balance lookup.
- [x] **Work with ODS Global Network Cards**:
  - Implement the 3 engagement pathways from `Cards.tsx`: Partner With Us, Join Community, and Careers.

### Phase 3: Build Verification & Audit Trail
**Rationale:** Verify TypeScript compilation and maintain the implementation plan audit trail in `./Progress/`.

**Steps:**
- [x] Run `npm run build` in `./Frontend` (`tsc && vite build`) - passed with code 0 in 2.45s.
- [x] Mark verification checkboxes complete in this plan upon user approval and execution.

---

## Verification Checklist
- [x] All occurrences of "Wanaw" and "wanaw.et" replaced with "ODS Global Network"
- [x] Content faithfully reflects `./resource` (`locales/en.json`, `CompanyInfo.tsx`, `HomeHighlights.tsx`, `Cards.tsx`)
- [x] Background remains crisp white with deep navy typography and gold accents
- [x] `npm run build` succeeds with code 0
- [x] Implementation Plan file updated with checked-off boxes and final Status

---

## Approval
**Approval status:** Approved  
**Approved by:** Tewolde  
**Approval phrase received:** "Approved: proceed"  
**Date/time approved:** 2026-09-17 21:15:18  

---

## Post-Execution Notes
Extracted authentic content from `./resource/client/src/locales/en.json`, `CompanyInfo.tsx`, `HomeHighlights.tsx`, and `Cards.tsx`. Replaced all occurrences of `Wanaw` and `wanaw.et` across `HomePage.tsx`, `Header.tsx`, and `Footer.tsx` with `ODS Global Network`. Successfully verified with `npm run build` (exit code 0).
