# 07. Human Verification Checklist — Admin (Finance & 2-Person Refunds)

**Target Role**: Staff Administrator with **Finance** Permission Group  
**Primary Test Account**: `admin_finance@odsglobal.net`  
**Password Source**: `ADMIN_PASSWORD` in `.env` (typically `AdminPassword123!`)  
**Assigned Permissions**: `payments.view_ledger`, `refunds.initiate`, `refunds.approve`, `reports.financial_export`, `bookings.view`  
**Primary URL**: `http://localhost:5173/admin/dashboard`

---

## Module A: Sign-In & Financial Ledger Oversight

- [ ] **ADM-FIN-001** | Page: `/login` | Do: 1. Sign in with `admin_finance@odsglobal.net` and `AdminPassword123!`. | Expect: Successfully signs in. Redirects to `/admin/dashboard`. Header displays "Finance Officer" badge. Navigation displays: "Financial Overview", "Transactions Ledger", "Refund Operations", and "Financial Reports". | Watch for: Showing Compliance or User Administration tabs. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-FIN-002** | Page: `/admin/dashboard#finance` | Do: 1. Click "Transactions Ledger" tab.<br>2. Inspect transaction records. | Expect: Comprehensive ledger displays: Date & Time, Transaction Reference (`ODS-TX-...`), Customer Email, Payment Method (Chapa, Wallet, Gift), Amount in ETB, and Settlement Status ("Completed", "Pending", "Refunded"). | Watch for: Negative or unformatted currency values. | Batch: 6, 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: Standard Refund Initiation (< 10,000 ETB Threshold)

- [ ] **ADM-FIN-003 [HIGH RISK]** | Page: `/admin/dashboard#finance` | Do: 1. Locate a completed booking transaction for `1,200.00 ETB`.<br>2. Click "Initiate Refund".<br>3. Enter Amount: `1,200.00 ETB`, Reason: "Doctor unwell, patient request accepted."<br>4. Submit refund. | Expect: Green confirmation toast: "Refund processed successfully." Transaction status updates to "Refunded". Check Mailpit to verify patient received refund notice. | Watch for: Small refunds unnecessarily getting locked in pending approval. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: High-Value Refund & Two-Person Approval (> 10,000 ETB)

- [ ] **ADM-FIN-004 [HIGH RISK]** | Page: `/admin/dashboard#finance` (Threshold Hold) | Do: 1. Locate or create a transaction for `15,000.00 ETB` (exceeds 10,000 ETB threshold).<br>2. As `admin_finance@odsglobal.net`, click "Initiate Refund" for `15,000.00 ETB`.<br>3. Enter Reason: "Executive annual family package cancellation."<br>4. Submit request. | Expect: System responds with an amber advisory: "High-value refund submitted. Under platform policy, refunds exceeding 10,000.00 ETB require authorization by a second administrator. Status: Pending Second Approver." | Watch for: High-value refund executing instantly without dual authorization. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-FIN-005 [HIGH RISK]** | Page: `/admin/dashboard#finance` (Self-Approval Block) | Do: 1. While still logged in as `admin_finance@odsglobal.net` (the requester), inspect the pending refund in the "Needs Approval" queue.<br>2. Attempt to click "Approve Refund" on your own request. | Expect: Action is strictly blocked with red alert: "Two-Person Rule Enforced: The administrator who initiated a refund request cannot approve it. A different authorized administrator must approve." | Watch for: Requester able to approve their own financial refund (critical fraud risk). | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-FIN-006 [HIGH RISK]** | Page: `/admin/dashboard#finance` (Second Approver Action) | Do: 1. Sign out. Sign in as Super Admin (`superadmin@odsglobal.net`).<br>2. Navigate to Finance -> Refund Approvals queue.<br>3. Locate the `15,000.00 ETB` request initiated by `admin_finance`.<br>4. Enter decision note: "Authorized by Lead Auditor."<br>5. Click "Approve & Execute Refund". | Expect: Refund executes successfully. Status updates to "Approved & Executed". Check Mailpit for high-value refund confirmation notice. | Watch for: Second approver being blocked or request remaining pending. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: Financial Reports & Audited CSV Export

- [ ] **ADM-FIN-007** | Page: `/admin/dashboard#reports` | Do: 1. In Finance console, click "Reports & Exports" tab.<br>2. Select Dataset: "Settlement & Transaction Ledger", Date Range: "Last 30 Days".<br>3. Click "Generate Financial Export (CSV)". | Expect: File downloads immediately: `financial_transactions_export_YYYY-MM-DD.csv`. Open CSV in Excel/text editor and verify: RFC 4180 compliant, properly escaped commas, columns for Date, TxRef, Amount, Method, and Status. | Watch for: CSV file empty or corrupted. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-FIN-008** | Page: `/admin/dashboard#audit` | Do: 1. Check the Audit Log.<br>2. Verify that an entry was written for the CSV export: Action `FINANCIAL_EXPORT_DOWNLOADED`, Actor `admin_finance@odsglobal.net`, IP address, and dataset name. | Expect: Audit entry is visible, confirming financial exports are strictly tracked. | Watch for: Financial exports occurring silently without audit logging. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module E: Finance Admin "Must NOT Be Able To" (RBAC Defense)

- [ ] **ADM-FIN-SEC-001** | Page: Staff Provisioning Attempt | Do: 1. Attempt to open `/admin/dashboard#staff` or call `/api/admin/staff`. | Expect: Blocked with HTTP 403 Forbidden: "Missing 'admins.manage' permission." | Watch for: Finance officer able to create administrative users. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-FIN-SEC-002** | Page: KYC Approval Attempt | Do: 1. Attempt to access `/admin/dashboard#kyc` or approve a merchant document. | Expect: Blocked with HTTP 403 Forbidden: "Missing 'kyc.decide' permission." | Watch for: Finance officer able to approve healthcare provider licenses. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
