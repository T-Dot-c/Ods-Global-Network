# Implementation Plan: Remove 'Other Network Portals' Section from Sidebar in All Portals

**Project:** ODS Global Network  
**Created:** 2026-09-14 2322  
**Status:** ✅ Completed  

---

## Original User Prompt
> remove the content / section Other Network Portals in the sidebar from each potal

---

## Action Plan (High-Level Summary)
Remove the "Other Network Portals" navigation block and external links from the sidebars in each of the three portal layouts:
1. **Admin Portal Layout (`AdminLayout.tsx`)**: Remove the "Other Network Portals" section and clean up unused icon imports (`Building2`, `ExternalLink`).
2. **Provider Portal Layout (`ProviderLayout.tsx`)**: Remove the "Other Network Portals" section and clean up unused icon imports (`ShieldAlert`, `ExternalLink`).
3. **Customer Portal Layout (`CustomerLayout.tsx`)**: Remove the "Other Network Portals" section and clean up unused icon imports (`ShieldAlert`, `Building2`, `ExternalLink`).

---

## Implementation Details

### Phase 1: Layout Updates & Cleanup
**Rationale:** The user requested each portal sidebar to remain strictly isolated to its respective actor workflows without displaying links to other portals.

**Steps:**
- [x] In `client/src/apps/admin/AdminLayout.tsx`: Remove the "Other Network Portals" section and unused icon imports.
- [x] In `client/src/apps/provider/ProviderLayout.tsx`: Remove the "Other Network Portals" section and unused icon imports.
- [x] In `client/src/apps/customer/CustomerLayout.tsx`: Remove the "Other Network Portals" section and unused icon imports.

### Phase 2: Verification
**Rationale:** Ensure clean Vite hot module replacement (HMR) across all three running dev servers (ports 3000, 3001, 3002) and verify TypeScript types pass with zero errors.

**Steps:**
- [x] Run `npx tsc -b --noEmit` in `client/` to verify zero type errors or unused import issues.
- [x] Verify visually in browser on `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002` that sidebars render without the "Other Network Portals" section.

---

## Verification Checklist
- [x] All phase steps completed
- [x] Tests / manual checks pass (Verified across all 3 portals in browser)
- [x] No unintended side effects on primary actor navigation items
- [x] Documentation in `C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\System Directives files` updated to reflect changes
- [x] Implementation Plan file updated with checked-off boxes and final Status

---

## Approval
**Approval status:** Approved  
**Approved by:** User  
**Approval phrase received:** The user has approved this document.  
**Date/time approved:** 2026-09-14 23:22  

---

## Post-Execution Notes
- The "Other Network Portals" section was cleanly removed from all three layout files:
  - `AdminLayout.tsx` (only Admin Controls remain)
  - `ProviderLayout.tsx` (only Merchant Operations remain)
  - `CustomerLayout.tsx` (only Customer Experience remains)
- Unused icon imports were pruned from all files.
- TypeScript compiler verified 0 errors (`npx tsc -b --noEmit`).
- Browser subagent verified on all three ports (3000, 3001, 3002) that each sidebar now displays solely the actor's own menu and badge.
