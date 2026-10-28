# ODS Global Network — Human Verification Master Guide

Welcome to the manual human verification suite for the **ODS Global Network** healthcare and commerce platform.

This directory (`Status/HumanVerification/`) contains an exhaustive, role-organized testing program designed specifically for a **non-developer human tester** working directly in a web browser.

---

## 1. Why Human Verification is Required

While automated test suites verify database queries, encryption, cryptographic signatures, and status codes, they cannot evaluate the visual and interactive human experience. 

Human verification is designed to spot:
* Confusing or misleading terminology and missing Ethiopian Birr (ETB) currency formatting.
* Visual layout breakage on mobile devices (e.g. content clipped, unscrollable modals).
* Stuck loading spinners, disabled buttons that remain disabled, or lack of feedback.
* Accidental exposure of technical details (raw JSON, database error messages, stack traces).
* Security loopholes visible in the browser (e.g., private admin pages accessible by direct address).
* Flawed email wording, broken links, or missing notifications.

---

## 2. Structure of This Verification Suite

| File Name | Scope & Purpose | Primary Role Tested |
| :--- | :--- | :--- |
| [`00-setup-and-accounts.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/00-setup-and-accounts.md) | Test accounts, passwords, Chapa sandbox cards, Mailpit, browser window sizes | All Roles |
| [`01-visitor.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/01-visitor.md) | Public pages, unauthenticated forms, catalog discovery, terms, security blocks | Visitor (Logged Out) |
| [`02-customer.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/02-customer.md) | Customer dashboard, appointments, booking checkout, 10-min hold, gifting, wallet | Customer (Verified & Unverified) |
| [`03-merchant.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/03-merchant.md) | Merchant onboarding, KYC document re-upload, compliance reset, business services | Merchant |
| [`04-provider.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/04-provider.md) | Provider availability rules, blackouts, appointment approvals, clinic voucher claim | Healthcare Provider |
| [`05-suspended-user.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/05-suspended-user.md) | Suspended account login rejection, session termination, support appeals | Suspended User |
| [`06-admin-support.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/06-admin-support.md) | User lookups, internal administrative notes, support inbox, catalog moderation | Support & Catalog Staff |
| [`07-admin-finance.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/07-admin-finance.md) | Financial transactions, reconciliation, 2-person refund initiation & dual approval | Finance Administrator |
| [`08-admin-compliance.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/08-admin-compliance.md) | KYC moderation queue, secure document viewing, rejection with mandatory reason | Compliance Officer |
| [`09-super-admin.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/09-super-admin.md) | Staff provisioning, RBAC groups, force signout, TOTP 2FA, immutable audit log | Super Administrator |
| [`10-cross-role-and-permissions.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/10-cross-role-and-permissions.md) | Cross-tenant isolation, direct URL tampering, privilege escalation attempts | All Roles (Adversarial) |
| [`11-emails-and-notifications.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/11-emails-and-notifications.md) | Exhaustive verification of all 35 email templates in Mailpit (`127.0.0.1:8025`) | All Notification Triggers |
| [`12-end-to-end-journeys.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/12-end-to-end-journeys.md) | Multi-role end-to-end workflows (register, approve, book, pay, refund, gift) | Multi-Role Workflows |
| [`13-visible-error-catalogue.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/13-visible-error-catalogue.md) | Field guide to human-visible platform flaws with real examples and spot guides | Tester Reference |
| [`14-coverage-matrix.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/14-coverage-matrix.md) | Master traceability matrix mapping 100% of routes, endpoints, and actions | Quality Auditor |
| [`15-defect-log-template.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/15-defect-log-template.md) | Standardized defect reporting form for logging issues found during testing | Tester Defect Log |

---

## 3. How to Execute a Test Pass

1. **Read Setup Guide First**: Review [`00-setup-and-accounts.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/00-setup-and-accounts.md) to understand account credentials, the Chapa sandbox payment flow, and how Mailpit works.
2. **Open the Target Role Checklist**: Open the relevant checklist file (e.g. `01-visitor.md` or `02-customer.md`).
3. **Execute Item-by-Item**:
   * Follow the numbered steps in the **Do** section precisely.
   * Verify that what appears on screen matches the **Expect** section.
   * Pay special attention to the **Watch for** section to detect edge-case failures.
4. **Record Your Result**:
   * Check `[x] Pass` if everything looks exactly as described.
   * Check `[x] Fail` if any error, stuck spinner, wrong text, or unexpected behavior occurs.
   * If a test item failed, copy the item ID and log the discrepancy in [`15-defect-log-template.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/15-defect-log-template.md).

---

## 4. Defect Reporting Rules

When you encounter any visual, interactive, or functional flaw:
1. **Take a Full Screenshot**: Capture the full browser window, including the address bar and URL.
2. **Open Developer Console**: Press `F12` (or Right-Click -> Inspect -> Console) and copy any red error text.
3. **Log the Issue**: In [`15-defect-log-template.md`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Status/HumanVerification/15-defect-log-template.md), record:
   * **Test ID** (e.g., `CUS-BOOK-008`)
   * **Exact URL**
   * **Steps taken to trigger the bug**
   * **Expected result vs. Actual result**
   * **Severity** (Blocker, Major, Minor, Cosmetic)
