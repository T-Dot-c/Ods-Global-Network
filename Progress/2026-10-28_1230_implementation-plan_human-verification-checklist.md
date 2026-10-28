# Implementation Plan — Platform-Wide Human Verification Checklist (Batches 1–12)

**Document Identifier**: `Progress/2026-10-28_1230_implementation-plan_human-verification-checklist.md`  
**Date**: 2026-10-28  
**Module**: Quality Assurance & Manual Acceptance — Platform-Wide Human Verification Checklist (Batches 1 to 12)  
**Status**: Proposed (Awaiting User Review & Approval Block Sign-Off)  
**Nature of Task**: Documentation only. Strict zero-code-change policy (no modification of application code, migrations, tests, or configuration).  
**Outcome**: A complete, rigorous, role-organized suite of manual human-verification checklists in `Status/HumanVerification/` that a non-technical user can follow in a browser to thoroughly inspect and validate every screen, role, state, action, number, and notification across the platform.

---

## 1. Approval Block

```
================================================================================
APPROVAL BLOCK
Status: APPROVED
Reviewer: USER
Decision: Approved: proceed - revision 1
Revision: 1
Date: 2026-10-28
Notes: Plan formally approved by user to proceed with Phase 1.
================================================================================
```

---

## 2. Purpose & Executive Summary

Batches 1 through 12 have engineered, tested, and hardened the entire ODS Global Network platform across 24 database migrations, 144 API endpoints, 47 frontend pages and dashboard tabs, and 393 automated unit/E2E test cases.

While automated tests verify backend logic, database constraints, encryption, and cryptographic signatures, **real human users experience the software visually through a web browser.** Subtle human-visible flaws—such as unhandled loading spinners, confusing copy, broken layouts on mobile screens, missing currency formatting, misleading error banners, or keyboard accessibility traps—can only be verified through disciplined human manual inspection.

This plan outlines the architecture, method, and deliverables for constructing the **ODS Global Network Human Verification Checklist** in `Status/HumanVerification/`. It breaks down every user role and state, defines stable item IDs, maps all 144 endpoints and 47 views into a zero-gap coverage matrix, catalogs all 35 notification events in Mailpit, and provides exact test account fixtures and step-by-step journeys for a non-developer tester.

---

## 3. Scope Traceability & Non-Goals

### 3.1 Traceability to Batches 1–12
| Batch | Area & Scope in Codebase | Checklist Document Mapping |
| :--- | :--- | :--- |
| **Batch 1 & 2** | Workspace foundation, public pages, branding, footer, legal placeholders | `01-visitor.md`, `14-coverage-matrix.md` |
| **Batch 3** | Customer self-serve portal, profile management, password change, address persistence | `02-customer.md`, `12-end-to-end-journeys.md` |
| **Batch 4** | KYC document upload engine, magic-byte checks, anonymous staging, document moderation | `03-merchant.md`, `04-provider.md`, `08-admin-compliance.md` |
| **Batch 5** | Authentication, email verification, session invalidation (`token_version`), recovery | `01-visitor.md`, `02-customer.md`, `10-cross-role.md` |
| **Batch 6** | Chapa payment checkout, webhook verification, receipt generation, transaction history | `02-customer.md`, `07-admin-finance.md`, `12-journeys.md` |
| **Batch 7** | Gifting engine, digital vouchers, wallet balance, atomic redemption, in-clinic claim | `02-customer.md`, `04-provider.md`, `12-journeys.md` |
| **Batch 8** | Service catalog, category taxonomy, multi-tenant draft authoring, admin moderation | `03-merchant.md`, `04-provider.md`, `06-admin-support.md` |
| **Batch 9** | Working hours, slot generation, 10-minute checkout hold, 5-parallel concurrency, cancel/refund | `02-customer.md`, `04-provider.md`, `07-admin-finance.md` |
| **Batch 10** | Admin control center, RBAC groups, 2-person refund authorization, immutable audit ledger | `06-admin-support.md`, `07-admin-finance.md`, `09-super-admin.md` |
| **Batch 11** | Transactional notification engine, outbox worker, 35 templates, Mailpit delivery, unsubscribe | `11-emails-and-notifications.md` |
| **Batch 12** | Production hardening, token bucket rate limits, Admin 2FA TOTP, recovery codes, health probes | `09-super-admin.md`, `13-visible-error-catalogue.md` |

### 3.2 Explicit Non-Goals & Strict Constraints
* **ZERO CODE CHANGES**: No modification to `.js`, `.ts`, `.tsx`, `.sql`, `.json`, `.css`, or `.env` files. The task is strictly documentation.
* **NO UNAUTHORIZED SEED SCRIPTS**: If test data setup requires data creation, it is outlined as an open decision in this plan for user decision. No scripts will be written without prior user approval.
* **NO INVENTED FEATURES**: If any step or behavior is not explicitly verified in the codebase, it must be labeled `UNCONFIRMED - ask the user`.
* **NO SELF-MARKING**: Checklists are written as instructions for human testers; the agent will never mark checklist items "Pass" or "Verified".

---

## 4. Files in Scope (Deliverables in `Status/HumanVerification/`)

All deliverables will be written to `Status/HumanVerification/`:

1. `Status/HumanVerification/README.md`: Master user guide on how to navigate the checklists, run test passes, record pass/fail results, and capture evidence.
2. `Status/HumanVerification/00-setup-and-accounts.md`: Test account matrix across all roles, dev password sourcing (`DEV_PASSWORD` in `.env`), Chapa Sandbox testing rules, Mailpit instructions (`127.0.0.1:8025`), target browsers, mobile viewport sizes, and safe reset procedures.
3. `Status/HumanVerification/01-visitor.md`: Public unauthenticated visitor checklist (landing, navigation, catalog browsing, forms, inquiries, footer, terms, security rejection on private URLs).
4. `Status/HumanVerification/02-customer.md`: Customer portal checklist (split into Email Verified vs Unverified), covering profile, password change, booking flow, wallet, gifts, receipt views, 10-min hold timers.
5. `Status/HumanVerification/03-merchant.md`: Merchant portal checklist covering KYC upload, business profile updates, services management, and approval states.
6. `Status/HumanVerification/04-provider.md`: Provider portal checklist covering all lifecycle states (Approved, Pending Review, Rejected, Needs-Info), availability scheduling, appointment handling, and voucher in-clinic claim.
7. `Status/HumanVerification/05-suspended-user.md`: Suspended account checklist verifying instant login blocking, session invalidation, clear user feedback, and security logging.
8. `Status/HumanVerification/06-admin-support.md`: Operations/Support Admin checklist (user search, profile notes, inquiry inbox, service catalog moderation).
9. `Status/HumanVerification/07-admin-finance.md`: Finance Admin checklist (transaction lookup, refund initiation vs approval, two-person rule enforcement).
10. `Status/HumanVerification/08-admin-compliance.md`: Compliance Admin checklist (KYC moderation queue, document viewing with security headers, approve/reject with reason).
11. `Status/HumanVerification/09-super-admin.md`: Super Admin checklist (staff account management, RBAC permission groups, force sign-out, TOTP 2FA setup, recovery codes, audit log inspection).
12. `Status/HumanVerification/10-cross-role-and-permissions.md`: Cross-role matrix (e.g. customer attempting provider URL, merchant accessing admin tabs, staff admin attempting superadmin actions).
13. `Status/HumanVerification/11-emails-and-notifications.md`: Complete notification catalog covering all 35 triggers, email layout, in-app bell counter, unsubscribe link, and Mailpit verification.
14. `Status/HumanVerification/12-end-to-end-journeys.md`: Multi-role integrated workflows (e.g., Customer books -> Provider confirms -> Customer cancels -> Admin inspects refund).
15. `Status/HumanVerification/13-visible-error-catalogue.md`: Comprehensive field guide to human-visible platform errors (blank screens, stuck spinners, raw JSON/SQL leaks, timezone mismatches, bad currency symbols, broken layout) with real examples from this codebase.
16. `Status/HumanVerification/14-coverage-matrix.md`: Exhaustive mapping linking every single frontend route (47 views), backend endpoint (144 routes), and business action to its exact checklist item ID. Zero unexplained gaps.
17. `Status/HumanVerification/15-defect-log-template.md`: Standardized defect tracking template for human testers to record discrepancies, severity, console logs, and steps to reproduce.

---

## 5. Standard Checklist Item Format & Quality Rules

Every test item will strictly follow this structured schema:

```markdown
- [ ] **<STABLE-ID>** | Page: `/exact/route` | Do: <Numbered plain-language steps> | Expect: <Exact visible text, status, amount, time, email> | Watch for: <Specific human-visible failure mode> | Batch: <Batch N>
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence: 
```

### Strict Quality Rules:
1. **Single Action & Result**: Exactly one user action and one deterministic expected result per checklist ID.
2. **Plain Non-Technical Language**: No terminal commands, SQL queries, or backend code snippets in human test steps.
3. **Comprehensive State Coverage**: Every page must cover normal path, invalid inputs, empty state, loading state, error state, permission denied, and browser Back/Refresh behavior.
4. **Exact Numerical & Financial Thresholds**: Explicit Ethiopian Birr (ETB) figures, 10-minute hold counters, 24-hour cancellation windows, 15-minute token expiry, and exact calculation formulas.
5. **Mobile & Keyboard Passes**: Mandatory phone-width viewport pass (375px) and keyboard-only Tab/Enter navigation pass for primary workflows.
6. **HIGH RISK Flags**: Prominent `[HIGH RISK]` badge for financial operations (Chapa payments, wallet credits, refunds), security boundaries (RBAC, 2FA, session revocation), and sensitive documents (KYC viewing).

---

## 6. Execution Phases

### Phase 1: Codebase Inventory & Skeleton Coverage Matrix
- Perform full extraction of all frontend pages/dashboards, user-visible buttons/forms, backend endpoints, and email templates directly from active source code.
- Generate initial `14-coverage-matrix.md` skeleton mapping all inventory items.
- Deliver Phase 1 report with RAW evidence (inventory counts, routes, actions).

### Phase 2: Setup, Accounts, Test Data & README
- Author `README.md` and `00-setup-and-accounts.md`.
- Detail dev account matrix, `DEV_PASSWORD` sourcing, Mailpit configuration, Chapa Sandbox rules, screen viewports, and reset safeguards.
- Author `15-defect-log-template.md`.
- Deliver Phase 2 report with file verification and account matrix evidence.

### Phase 3: Visitor & Customer Checklists (Batches 1–9)
- Author `01-visitor.md` (unauthenticated public browsing, catalog discovery, inquiry submission, footer links).
- Author `02-customer.md` (verified vs unverified customer, booking flow, 10-minute hold, Chapa checkout, wallet, gifting, appointments).
- Deliver Phase 3 report with item counts and coverage evidence.

### Phase 4: Merchant & Provider Checklists (Batches 1–9)
- Author `03-merchant.md` (onboarding, profile edit, compliance reset, document replacement).
- Author `04-provider.md` (approved, pending, rejected states, weekly schedule configuration, blackout dates, appointment cancellations, in-clinic voucher delivery).
- Author `05-suspended-user.md` (suspended user rejection, audit trail).
- Deliver Phase 4 report with item counts and coverage evidence.

### Phase 5: Admin Checklists by Role & Super Admin (Batch 10)
- Author `06-admin-support.md` (user management, inquiry inbox, service catalog moderation).
- Author `07-admin-finance.md` (transaction audit, 2-person refund initiation and approval).
- Author `08-admin-compliance.md` (KYC queue, document viewer, approve/reject workflow).
- Author `09-super-admin.md` (staff administration, permission groups, force sign-out, TOTP 2FA configuration, recovery codes).
- Deliver Phase 5 report with item counts and coverage evidence.

### Phase 6: Cross-Role Security, Notifications & End-to-End Journeys
- Author `10-cross-role-and-permissions.md` (cross-tenant IDOR, URL tampering, role boundary enforcement).
- Author `11-emails-and-notifications.md` (catalog of all 35 notification events, trigger steps, Mailpit verification, unsubscribe).
- Author `12-end-to-end-journeys.md` (8 comprehensive multi-role workflows from registration to refund).
- Deliver Phase 6 report with item counts and coverage evidence.

### Phase 7: Visible Error Catalogue & Go-Live Human Verification
- Author `13-visible-error-catalogue.md` (catalog of human-visible error modes, real examples from ODS codebase, "how to spot it" guide).
- Integrate Batch 12 go-live hardening items that humans can visually inspect (rate limit error banners, 2FA challenge screens, X-Request-ID in error messages).
- Deliver Phase 7 report with catalogue entries and verification evidence.

### Phase 8: Coverage Matrix Finalization, Project Status Update & Completion
- Finalize `14-coverage-matrix.md`, ensuring 100% of routes, endpoints, and actions are mapped to specific checklist IDs with zero unexplained gaps.
- Compile summary metrics (total items per role, total items per batch, unconfirmed items list).
- Update `Status/PROJECT_STATUS.md` with final documentation deliverables.
- Prepare Commit Sync Record (holding commit and push until explicit user instruction).

---

## 7. Open Architectural Decisions & Questions for User

| # | Topic | Description & Options | Agent Recommendation | User Decision |
|---|---|---|---|---|
| **1** | **Test Data Preparation Approach** | **Option A (Manual)**: Tester manually registers users and submits KYC/services through the UI.<br>**Option B (Dev Seed Script)**: Agent prepares a proposed dedicated dev script (e.g. `scripts/seed-human-test-fixtures.js`) that creates pre-baked accounts and fixtures for review. | **Option A for initial baseline, with Option B raised for user consideration**: In accordance with the prompt ("Do not build it. Raise as an open decision"), manual steps will be detailed in `00-setup-and-accounts.md`. If user prefers automated seed fixtures, user can approve building Option B. | *[Awaiting User Selection]* |
| **2** | **Chapa Sandbox Test Credentials & Cards** | Where sandbox payment test card details (test card numbers, CVV, OTP) should be documented. | Document public Chapa test card numbers in `00-setup-and-accounts.md` (e.g., standard Chapa test cards from official docs). | *[Awaiting User Confirmation]* |
| **3** | **Tester Viewports & Devices** | Which devices and screen dimensions should be standard for human testing passes. | **Desktop**: 1920x1080 (Chrome/Edge/Firefox).<br>**Tablet**: 768x1024 (iPad view in DevTools).<br>**Mobile**: 375x667 (iPhone SE) & 390x844 (iPhone 12/13/14). | *[Awaiting User Confirmation]* |
| **4** | **Unconfirmed Behaviors in Codebase** | Any behaviors where frontend code and backend responses require user policy confirmation. | List any identified items explicitly under an "UNCONFIRMED - ask the user" banner in the inventory. | *[Continuous verification]* |

---

## 8. Rollback & Safety Plan

* **Non-Destructive Nature**: All deliverables are new Markdown files in `Status/HumanVerification/`.
* **Zero Disruption to Existing Code**: Existing application code in `Backend/src` and `Frontend/src` will remain completely untouched.
* **Rollback Procedure**: If the user desires to revert or restart this documentation work, deleting `Status/HumanVerification/` restores the repository to its exact prior commit state without any impact on database or server operations.

---

## 9. Revision Log

| Revision | Date | Author | Description of Changes |
| :---: | :---: | :---: | :--- |
| **1** | 2026-10-28 | Lead Engineer Agent | Initial proposed plan for Platform-Wide Human Verification Checklist (Batches 1–12), following System Directive v2.0. |

---

## 10. Next Steps

In strict accordance with System Directive v2.0:
1. **Stop execution immediately.**
2. Await user review, completion of the Approval Block, and the explicit command: `"Approved: proceed - revision 1"`.
3. Do not begin Phase 1 until approval is granted.
