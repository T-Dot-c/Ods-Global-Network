# Implementation Plan: Strict Brand Guideline & Reference Layout Alignment

**Project:** ODS Global Network  
**Created:** 2026-09-14 2336  
**Status:** Pending Approval  

---

## Original User Prompt
> use the the brand guideline striictly follow it and consistent for all portals C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\ODS Complete file and C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\ODS BRAND GUIDLINE .pdf and use this layout structure from the above image

---

## Action Plan (High-Level Summary)
Strictly implement the official ODS Brand Guidelines and replicate the reference layout structure across all portals:
1. **Brand Guidelines Color & Typography Standards**:
   - **Deep Navy**: `#0F285B` (RGB: 15, 40, 91)
   - **Antique Gold**: `#BE9B49` (RGB: 190, 155, 73)
   - **Signature Accent Gold**: `#EDC45B` (RGB: 237, 196, 91)
   - **Radiant Gold**: `#F5E189` (RGB: 245, 225, 137)
   - **Deep Rich Gold**: `#8D7338` (RGB: 141, 115, 56)
   - **Soft Silver**: `#E8E8E8` (RGB: 232, 232, 232)
   - **Background Clean Slate**: `#F8FAFC`
   - **Typeface**: Google Sans / Inter geometric typography.
2. **Recreate Reference Sidebar Structure (as shown in image)**:
   - Gold rounded logo badge with the official ODS hand & globe mark.
   - Brand title: **ODS Global** (White, bold, clean).
   - Subtitle: **NETWORK ADMIN** / **PROVIDER HUB** / **CUSTOMER NETWORK** (Gold, tracked, uppercase).
   - Prominent **Home** button with rounded border and subtle dark background.
   - Collapsible sections:
     - `MERCHANT MANAGEMENT` with chevron toggle `v`
       - Registration
       - Dashboard
       - Profile
       - Approval Queue
     - `CUSTOMER MANAGEMENT` with chevron toggle `v`
       - Registration
       - Login / Recovery
       - Profile Hub
3. **Recreate Reference Main Area & Hero Card (as shown in image)**:
   - Dark navy gradient banner (`#0F285B` to `#0A1B3D`) with rounded corners (`rounded-3xl`).
   - Badge: Shield check icon + `ODS GLOBAL NETWORK` in gold.
   - Dual-tone title:
     - `Healthcare & Wellness` (White)
     - `Management Platform` (Signature Gold `#EDC45B`)
   - Description text in blue-100/blue-200.
   - Three feature pills:
     - 🌐 `Ethiopia & Diaspora`
     - 🤍 `8 Healthcare Categories`
     - 🎁 `Digital Gifting Platform`
   - Module cards with clean white backgrounds, border, rounded badge icons, and golden hover arrows.
4. **Consistency across all portals**:
   - Main Portal (`http://localhost:5173`): Complete reference shell with both modules.
   - Admin Portal (`http://localhost:3000`): Same layout and brand identity, tailored to Admin.
   - Provider Portal (`http://localhost:3001`): Same layout and brand identity, tailored to Provider.
   - Customer Portal (`http://localhost:3002`): Same layout and brand identity, tailored to Customer.

---

## Implementation Details

### Phase 1: Brand Token System & Logo Component
**Rationale:** Ensure all CSS tokens match the exact HEX codes extracted from `ODS BRAND GUIDLINE .pdf` (Pages 5–6) and provide a reusable vector logo component.

**Steps:**
- [ ] Update `client/src/index.css` with the verified brand CSS variables:
  - `--ods-navy: #0F285B`
  - `--ods-gold: #BE9B49`
  - `--ods-gold-bright: #EDC45B`
  - `--ods-gold-radiant: #F5E189`
  - `--ods-gold-deep: #8D7338`
  - `--ods-silver: #E8E8E8`
- [ ] Create `client/src/components/common/ODSLogo.tsx` rendering the official ODS favicon/logo mark inside the signature gold rounded square.

### Phase 2: Reference Layout Implementation
**Rationale:** Replicate the exact sidebar and hero layout shown in the user's reference image with interactive collapsible accordions and high-contrast brand styling.

**Steps:**
- [ ] Update `client/src/components/Layout.tsx` to match the exact visual layout of the reference image (sidebar header, Home button border, collapsible section titles, chevron icons, and clean background).
- [ ] Update `client/src/App.tsx` (Home Page) to match the exact hero banner (shield badge, dual-tone heading, description, 3 pills, and 2 module cards with direct links).
- [ ] Update `client/src/apps/admin/AdminLayout.tsx` and `Admin App.tsx` to adopt the matching layout styling with the "NETWORK ADMIN" badge.
- [ ] Update `client/src/apps/provider/ProviderLayout.tsx` and `Provider App.tsx` to adopt the matching layout styling with the "MERCHANT / PROVIDER" badge.
- [ ] Update `client/src/apps/customer/CustomerLayout.tsx` and `Customer App.tsx` to adopt the matching layout styling with the "CUSTOMER NETWORK" badge.

### Phase 3: Verification & Visual Proof
**Rationale:** Verify that the layout across all ports renders identically to the user's reference screenshot with zero regressions.

**Steps:**
- [ ] Run `npx tsc -b --noEmit` to verify type safety.
- [ ] Take browser screenshots comparing the rendered pages against the user's reference image.
- [ ] Verify collapsible sidebar accordions function smoothly across all portals.

---

## Verification Checklist
- [ ] All phase steps completed
- [ ] Colors strictly match PDF specifications (`#0F285B`, `#BE9B49`, `#EDC45B`, `#E8E8E8`)
- [ ] Sidebar matches the reference image structure (Logo badge, Home button, collapsible headers)
- [ ] Hero banner matches the reference image layout (Dual-tone heading, 3 pills, cards)
- [ ] Consistent appearance across Port 5173, Port 3000, Port 3001, and Port 3002
- [ ] Documentation updated in project's Implementation Plans folder

---

## Approval
**Approval status:** Pending  
**Approved by:** Pending  
**Approval phrase received:** Pending (requires: "Approved: proceed")  
**Date/time approved:** Pending  

---

## Post-Execution Notes
*(To be populated after execution)*
