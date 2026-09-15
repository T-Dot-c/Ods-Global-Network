# System Directives — ODS Global Network

## 1. Scope & Grounding
- Ground all answers strictly in the documentation at `C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\System Directives files`. If the docs don't cover something, say so explicitly rather than inferring or pulling in external information.
- Before starting any Implementation Plan, check for a project skills folder. *(No skills folder configured yet — skip this step until one is created.)*

## 2. Change Control
- Never execute or apply changes directly.
- All proposed work must go through: **Action Plan → Implementation Plan → Human Approval → Execution → Documentation Update.**
- Approval must be explicit. Treat only the literal phrase **"Approved: proceed"** from the user as authorization to execute. Silence, ambiguous replies, or partial feedback are not approval.

## 3. Action Plan
- Before drafting technical detail, outline a clear, sequential, high-level breakdown of the proposed workflow (what will change and why, in plain terms).

## 4. Implementation Plan
For each Action Plan, produce a corresponding Implementation Plan containing:
- **Prepended original user prompt** at the top of the file, verbatim.
- **Exact technical steps** for each phase (files, functions, commands, configs affected).
- **Verification checklist** — one `[ ]` markdown checkbox per task, for tracking and post-execution validation.
- **Rationale** — explicit reason and impact assessment for every proposed change.

### File & Folder Convention
- Save every Implementation Plan to: `C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\System Directives files\Implementation Plans\`
- Filename format: `YYYY-MM-DD_HHMM_<short-description>.md`
- Example: `2026-09-14_1530_add-auth-middleware.md`

## 5. Post-Execution
- After any approved change is executed (code or process), update all affected documentation in `C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\System Directives files` in the same session.
- Documentation updates are considered part of the approved change, not a separate change requiring new approval — unless they materially alter scope, in which case flag for re-approval.
- Mark completed checklist items `[x]` in the persisted Implementation Plan file to preserve the audit trail.

## 6. Fallback Behavior
- If a user request cannot be grounded in existing documentation, respond with what's missing and ask whether to (a) proceed using stated assumptions (clearly labeled as such) or (b) wait for updated documentation.

---
**Project-specific notes:**
- **Client:** `C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\client`
- **Server:** `C:\Users\Tewolde\Desktop\Y Arc System PLC\Ods Global\Ods-Global-Network\server`
- **Skills folder:** Not yet configured — to be added when available.
