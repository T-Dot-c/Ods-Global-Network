<!--
REUSABLE TEMPLATE — Implementation Plan
Save to: ./Progress/
Filename: 2026-09-17_2002_remove-orphaned-client-server-folders.md
-->

# Implementation Plan: Remove Orphaned client and server Folders

**Project:** ODS Global Network  
**Created:** 2026-09-17 2002  
**Status:** Completed  

---

## Original User Prompt
> so remove them and wher is my Backend folder

---

## Action Plan (High-Level Summary)
The legacy `client/` and `server/` folders at the root are orphaned skeletons from prior restructuring that contain no active project code. Under System Directive (§ 0), all code and files must strictly reside within the 7 designated directories (`./resource`, `./Frontend`, `./Backend`, `./System Directive`, `./Progress`, `./Assets`, `./Status`). 

1. Permanently remove the empty `server/` directory hierarchy.
2. Permanently remove the orphaned `client/` directory hierarchy (including obsolete `node_modules`).
3. Verify that only designated directories remain at the project root.
4. Update `./Status/PROJECT_STATUS.md` and this Implementation Plan to reflect the cleanup.

Regarding the `./Backend` folder: it has not yet been initialized. It is scheduled to be scaffolded in **Task 02** as a fresh, modular Express.js + MySQL environment referencing `./resource/server`.

---

## Implementation Details

### Phase 1: Directory Removal & Root Cleanliness
**Rationale:** Remove orphaned directories that violate the 7-folder confinement mandate in System Directive (§ 0).

**Steps:**
- [x] Remove `server/` directory via shell command `Remove-Item -Recurse -Force server`
- [x] Remove `client/` directory via shell command `Remove-Item -Recurse -Force client`
- [x] Verify that neither `client/` nor `server/` exists at root

### Phase 2: Status & Governance Documentation
**Rationale:** Maintain an audit trail and ensure project status documentation accurately reflects the clean directory structure.

**Steps:**
- [x] Update `./Status/PROJECT_STATUS.md` recording removal of orphaned `client/` and `server/` directories
- [x] Mark verification checkboxes complete in this plan

---

## Verification Checklist
- [x] All phase steps completed
- [x] `client/` directory is completely removed from disk
- [x] `server/` directory is completely removed from disk
- [x] No active or legacy source code lost (all legacy code remains safely in `./resource/server`)
- [x] `./Status/PROJECT_STATUS.md` updated
- [x] Implementation Plan file updated with checked-off boxes and final Status

---

## Approval
**Approval status:** Approved  
**Approved by:** Tewolde  
**Approval phrase received:** "Approved: proceed"  
**Date/time approved:** 2026-09-17 20:01:50  

---

## Post-Execution Notes
Executed recursive removal of orphaned `client/` and `server/` directories at the project root. Verified that `./resource/server` remains completely unaffected and intact with all legacy models, routes, and controllers. Verified working directory root is cleanly confined.
