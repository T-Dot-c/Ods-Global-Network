# 08. Human Verification Checklist — Admin (Compliance & KYC Accreditation)

**Target Role**: Staff Administrator with **Compliance** Permission Group  
**Primary Test Account**: `admin_compliance@odsglobal.net`  
**Password Source**: `ADMIN_PASSWORD` in `.env` (typically `AdminPassword123!`)  
**Assigned Permissions**: `kyc.queue_view`, `kyc.document_view`, `kyc.decide`, `providers.review`, `users.view`  
**Primary URL**: `http://localhost:5173/admin/dashboard`

---

## Module A: Sign-In & KYC Moderation Queue

- [ ] **ADM-CMP-001** | Page: `/login` | Do: 1. Sign in with `admin_compliance@odsglobal.net` and `AdminPassword123!`. | Expect: Successfully signs in. Redirects to `/admin/dashboard`. Header displays "Compliance Officer" badge. Navigation shows: "KYC Onboarding Queue", "Accredited Entities", and "Verification History". | Watch for: Showing Finance or Super Admin tabs. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-CMP-002** | Page: `/admin/dashboard#kyc` | Do: 1. Click "KYC Onboarding Queue" tab.<br>2. Filter by: "Pending Review". | Expect: Table lists all pending Healthcare Provider and Merchant applicants with Business/Provider Name, Entity Type ("Merchant" / "Provider"), Submission Date, and Number of Attached Documents (e.g. "2 Documents"). Action button: "Inspect Application". | Watch for: Empty table when applications are pending. | Batch: 4, 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: Secure Document Viewing & Security Headers (Batch 4)

- [ ] **ADM-CMP-003 [HIGH RISK]** | Page: `/admin/dashboard#kyc` (Document Inspection) | Do: 1. Click "Inspect Application" on a pending provider (e.g. `b4_provider@...`).<br>2. In the documents section, click "View Trade License". | Expect: Document opens securely in a sandboxed PDF viewer. In DevTools (`F12` -> Network tab -> click document request), verify response headers include: `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`. | Watch for: Document opening without security headers, or attempting to download as an executable file. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: Document Guard & Decision Workflow

- [ ] **ADM-CMP-004 [HIGH RISK]** | Page: Zero-Document Approval Guard | Do: 1. Locate an entity that has 0 uploaded documents.<br>2. Attempt to click "Approve Entity". | Expect: System strictly blocks approval with an explicit red alert: "Cannot approve entity: At least one verified compliance document (license or registration) is required before accreditation can be granted." Status remains "Pending". | Watch for: Approving an applicant with zero uploaded compliance documents (critical compliance breach). | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-CMP-005** | Page: `/admin/dashboard#kyc` (Approve Entity) | Do: 1. On an applicant with valid verified documents, click "Approve Entity".<br>2. Confirm approval in modal dialog. | Expect: Green confirmation toast: "Entity accreditation approved successfully." Status updates to green badge: "Approved". Reviewer ID and approval timestamp are permanently recorded in database. Check Mailpit to verify provider received congratulatory onboarding email. | Watch for: Entity remaining in pending status after approval. | Batch: 4, 11
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-CMP-006** | Page: `/admin/dashboard#kyc` (Reject Entity) | Do: 1. On a pending applicant, click "Reject Entity".<br>2. Form prompts: "Rejection Reason (Mandatory)" - enter "Submitted trade license is unreadable/blurred; please re-upload clear color scan."<br>3. Submit rejection. | Expect: Entity status updates to red badge: "Rejected". Attached documents update to "rejected". Check Mailpit to confirm applicant received rejection notice containing the exact feedback text. | Watch for: Rejection submitting with empty reason. | Batch: 4, 11
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: Compliance Officer "Must NOT Be Able To" (RBAC Defense)

- [ ] **ADM-CMP-SEC-001** | Page: Financial Refund Attempt | Do: 1. Attempt to call `/api/admin/finance/refunds` or open `/admin/dashboard#finance`. | Expect: Blocked with HTTP 403 Forbidden: "Missing 'refunds.initiate' permission." | Watch for: Compliance officer able to disburse financial refunds. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-CMP-SEC-002** | Page: Staff Provisioning Attempt | Do: 1. Attempt to open `/admin/dashboard#staff`. | Expect: Blocked with HTTP 403 Forbidden. Tab is hidden. | Watch for: Compliance officer able to create administrators. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
