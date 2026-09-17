# System Directives — ODS Global Network

> **STATUS**: ACTIVE MANDATE  
> **SCOPE**: Entire Project (`./Frontend`, `./Backend`, and all modules)  
> **AUTHORITY**: Lead Engineering Directive  
> **PATH RESOLUTION**: All paths must strictly be relative to project root (`Ods-Global-Network`). Never use absolute paths.  
> **FOLDER CONFINEMENT**: Strictly no files or folders may be created outside the 7 designated directories.

All engineering, architecture, design, and code implementations in this repository **must strictly adhere** to the directives defined in this document without exception.

---

## 0. Strict Folder Confinement
All files, assets, source code, documentation, and configurations must strictly reside within the following 7 designated directories:
1. **`./resource`** — Read-only legacy reference codebase
2. **`./Frontend`** — Main client application
3. **`./Backend`** — Main server API
4. **`./System Directive`** — Governance rules, standing instructions, and templates
5. **`./Progress`** — Implementation plans and directive outputs
6. **`./Assets`** — Official brand identity, fonts, vectors, and guidelines
7. **`./Status`** — Real-time project status and milestone tracking

**Rule**: Never create any new folders, scratch files, or configuration files outside these 7 directories at the root level.

---

## 1. Scope & Grounding
- Ground all answers strictly in project documentation located at `./System Directive`, `./Progress`, `./Assets`, `./Status`, and `./resource`. If the docs don't cover something, state so explicitly rather than inferring or pulling in unverified external information.
- Before starting any Implementation Plan, read and apply relevant guidance from workspace skills and project directives.

---

## 2. Change Control Workflow
- **Never execute or apply changes directly.**
- All proposed work must strictly follow the 5-step lifecycle:
  $$\text{Action Plan} \longrightarrow \text{Implementation Plan} \longrightarrow \text{Human Approval} \longrightarrow \text{Execution} \longrightarrow \text{Documentation Update}$$
- **Approval Phrase**: Treat only the exact literal phrase **`"Approved: proceed"`** from the user as authorization to execute. Silence, ambiguous replies ("looks good", "ok"), or partial feedback are **not** approval.

---

## 3. Action Plan Requirements
- Before drafting technical detail, outline a clear, sequential, high-level summary of the proposed workflow (what will change, why, and impact in plain terms).

---

## 4. Implementation Plan Requirements
For each Action Plan, produce a corresponding Implementation Plan using the structure in `./System Directive/implementation_plan_template.md` containing:
- **Prepended original user prompt** at the top of the file, verbatim.
- **Exact technical steps** for each phase (files, functions, commands, configs affected).
- **Verification checklist** — markdown checkboxes (`[ ]`) per task for tracking and post-execution validation.
- **Rationale** — explicit reason and impact assessment for every proposed change.

### File & Folder Convention
- Save every Implementation Plan to: **`./Progress/`**
- Filename format: `YYYY-MM-DD_HHMM_<short-description>.md`
- Example: `./Progress/2026-09-17_1600_initialize-frontend-backend.md`

---

## 5. Post-Execution Governance
- After any approved change is executed (code or process), update all affected documentation in `./Status` and `./Progress` in the same session.
- Mark completed checklist items `[x]` in the persisted Implementation Plan file in `./Progress` to maintain a verifiable audit trail.

---

## 6. Directory Isolation & Responsibilities
1. **`./resource` is Strictly Read-Only**: Legacy source code for reference only. Never modify or run from here.
2. **`./Frontend` and `./Backend`**: Sole active code workspaces.
3. **`./Progress`**: Central repository for all implementation plans, phase tracking, and directive outputs.
4. **`./Assets`**: Single source of truth for brand standards, vector logos (`./Assets/brand/vector`), fonts (`./Assets/fonts`), and guidelines.
5. **`./Status`**: Real-time progress and milestone dashboard (`./Status/PROJECT_STATUS.md`).

---

## 7. Beyond-CRUD Domain Architecture
- Standard database table editing without validation or domain logic is prohibited.
- Workflows must reflect business state transitions (Merchant KYC verification, conflict-free appointment booking, HMAC-signed payment gateways, cryptographic gift card vouchers).

---

## 8. Security & Hardening Directives
- **Zero Token Exposure**: Never pass tokens in URL query parameters. Use secure `HttpOnly` cookies.
- **Password Security**: Use `bcryptjs` with a work factor of 12 rounds minimum.
- **HMAC Signatures**: Verify all external payment webhooks (e.g., Chapa) cryptographically.
- **Mandatory RBAC**: Every non-public API endpoint must enforce authentication and role authorization.
