# Implementation Plan: Separate Actor Dashboards by Dedicated Ports

**Project:** ODS Global Network  
**Created:** 2026-09-14 2248  
**Status:** ✅ Completed  

---

## Original User Prompt
> they must have separate page all Actor/Dashboards (Provider , admin)Task 1 — Merchant Management → 2 Actors , , when you create spearate link http://localhost:5173 , http://localhost:3001 , http://localhost:3000 , http://localhost:3002 ,.... jut do not make in one http://localhost:5173 , is it possible before you crate implemeantaion plan , yes/no?
> yes preapare for both Merchant Management: and Customer Management

---

## Action Plan (High-Level Summary)
Decouple the unified single-port application (`http://localhost:5173`) into three dedicated actor-specific portals running simultaneously on distinct local ports:
1. **Admin Portal (`http://localhost:3000`)**: Dedicated exclusively to system administrators for merchant KYC approval, verification workflows, and audit actions.
2. **Provider (Merchant) Portal (`http://localhost:3001`)**: Dedicated exclusively to healthcare and wellness service providers for merchant onboarding, operational dashboard metrics, and branch/profile management.
3. **Customer Portal (`http://localhost:3002`)**: Dedicated exclusively to local (Ethiopia) and Diaspora customers for account registration, authentication/recovery, and patient/client profile management.

Each portal has its own dedicated entry point (`index.html`), application root, and actor-tailored sidebar/header layout, while reusing the modular components in `client/src/components/MerchantManagement` and `client/src/components/CustomerManagement`.

---

## Implementation Details

### Phase 1: Actor App Entry Points & Tailored Layouts
**Rationale:** Each actor requires a tailored workspace with an appropriate navigation shell rather than a generic unified menu that mixes administrative approval with customer login and merchant operations.

**Steps:**
- [x] Create `client/src/apps/admin/App.tsx` and `client/src/apps/admin/AdminLayout.tsx` for Admin navigation (focusing on Merchant Approval & Verification).
- [x] Create `client/src/apps/provider/App.tsx` and `client/src/apps/provider/ProviderLayout.tsx` for Provider navigation (Dashboard, Onboarding/Registration, Profile/Branches).
- [x] Create `client/src/apps/customer/App.tsx` and `client/src/apps/customer/CustomerLayout.tsx` for Customer navigation (Registration, Login/Security, Profile Hub).
- [x] Create entry HTML files for each portal:
  - `client/admin.html` targeting `/src/apps/admin/main.tsx`
  - `client/provider.html` targeting `/src/apps/provider/main.tsx`
  - `client/customer.html` targeting `/src/apps/customer/main.tsx`
- [x] Create mount scripts `main.tsx` for each portal with dedicated React Router roots.

### Phase 2: Dedicated Vite Dev Server Configurations & Concurrency
**Rationale:** To serve each actor portal independently on its own port without port collision or route contamination, dedicated Vite server configurations and startup scripts are needed.

**Steps:**
- [x] Create `client/vite.admin.config.ts` configured for port `3000` with root entry `admin.html`.
- [x] Create `client/vite.provider.config.ts` configured for port `3001` with root entry `provider.html`.
- [x] Create `client/vite.customer.config.ts` configured for port `3002` with root entry `customer.html`.
- [x] Install `concurrently` in `client/package.json` devDependencies so all three servers can be booted simultaneously or run independently.
- [x] Update `client/package.json` scripts:
  - `"dev:admin"`: `"vite --config vite.admin.config.ts"` (port 3000)
  - `"dev:provider"`: `"vite --config vite.provider.config.ts"` (port 3001)
  - `"dev:customer"`: `"vite --config vite.customer.config.ts"` (port 3002)
  - `"dev:all"`: `"concurrently -n admin,provider,customer -c blue,yellow,green \"npm run dev:admin\" \"npm run dev:provider\" \"npm run dev:customer\""`

### Phase 3: Verification & Browser Testing
**Rationale:** Ensure all three servers start cleanly, run simultaneously on ports 3000, 3001, and 3002, and all actor screens render properly without broken links or style regressions.

**Steps:**
- [x] Verify `npm run dev:admin` serves Admin Portal at `http://localhost:3000` and displays Merchant Approval Workflow.
- [x] Verify `npm run dev:provider` serves Provider Portal at `http://localhost:3001` and displays Merchant Dashboard, Registration, and Profile.
- [x] Verify `npm run dev:customer` serves Customer Portal at `http://localhost:3002` and displays Customer Registration, Login, and Profile.
- [x] Run browser automated checks verifying HTTP status 200 and visual rendering across all three distinct ports.

---

## Verification Checklist
- [x] All phase steps completed
- [x] Tests / manual checks pass (Browser subagent navigated to `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002` — all 3 passed)
- [x] No unintended side effects on existing component files in `components/MerchantManagement` or `components/CustomerManagement`
- [x] Documentation in `C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\System Directives files` updated to reflect changes
- [x] Implementation Plan file updated with checked-off boxes and final Status

---

## Approval
**Approval status:** Approved  
**Approved by:** User  
**Approval phrase received:** The user has approved this document.  
**Date/time approved:** 2026-09-14 22:51  

---

## Post-Execution Notes
All three portals were decoupled and started concurrently:
1. Admin Portal running on `http://localhost:3000` with `vite.admin.config.ts` and `admin.html`.
2. Provider (Merchant) Portal running on `http://localhost:3001` with `vite.provider.config.ts` and `provider.html`.
3. Customer Portal running on `http://localhost:3002` with `vite.customer.config.ts` and `customer.html`.
4. Browser automation verified all 3 portals load cleanly, sidebar links navigate accurately between sub-views, and network switcher links allow hopping between portals.
