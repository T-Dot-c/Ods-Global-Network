# 06. Human Verification Checklist — Admin (Support & Catalog Moderation)

**Target Role**: Staff Administrator with **Support** & **Catalog Moderation** Permission Groups  
**Primary Test Account**: `admin_support@odsglobal.net`  
**Password Source**: `ADMIN_PASSWORD` in `.env` (typically `AdminPassword123!`)  
**Assigned Permissions**: `users.view`, `users.notes_add`, `bookings.view`, `gifts.view`, `payments.view`, `services.view`, `services.moderate`, `categories.manage`  
**Primary URL**: `http://localhost:5173/admin/dashboard`

---

## Module A: Sign-In, Role Badges & Visible Tabs

- [ ] **ADM-SUP-001** | Page: `/login` | Do: 1. Sign in with `admin_support@odsglobal.net` and `AdminPassword123!`. | Expect: Successfully signs in. Redirects to `/admin/dashboard`. Header displays "ODS Global Network — Administrative Console", user email, and role badge: "Support Staff". | Watch for: Showing Super Admin privileges or full platform settings. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-002** | Page: `/admin/dashboard` (Visible Tabs) | Do: 1. Inspect the administrative navigation tab bar. | Expect: Visible tabs include: "Overview", "Users & Customers", "Healthcare Services", "Bookings & Operations", "Gift Cards", and "Inquiries Inbox". Financial refund approval tabs and Staff account settings are hidden or disabled. | Watch for: Support staff having access to staff creation or financial refund approval buttons. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: User Search & Internal Administrative Notes

- [ ] **ADM-SUP-003** | Page: `/admin/dashboard#users` | Do: 1. Click "Users & Customers" tab.<br>2. In the search box, type "customer@123.com". | Expect: Customer account appears in search results with Full Name, Role ("Customer"), Email Verification badge ("Verified"), and Registration Date. Action button: "View Details". | Watch for: Customer passwords or hashed tokens visible in the table. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-004** | Page: `/admin/dashboard#users` (Add Internal Note) | Do: 1. Click "View Details" on `customer@123.com`.<br>2. In the "Administrative Notes" section, click "Add Note".<br>3. Enter: "Customer called regarding appointment rescheduling on 2026-10-28."<br>4. Submit note. | Expect: Note appears at the top of the timeline with Author Name ("Support Staff"), timestamp, and text. Note is strictly internal (customer cannot see it). | Watch for: Notes disappearing upon page refresh. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: Customer Support & Enterprise Inquiries Inbox

- [ ] **ADM-SUP-005** | Page: `/admin/dashboard#inbox` | Do: 1. Click "Inquiries Inbox" tab.<br>2. Inspect submissions table. | Expect: Displays all public contact submissions and enterprise partnership inquiries with Reference ID, Submitter Name, Email, Subject, Date, and Status ("New" / "Replied"). | Watch for: Missing inquiries or unformatted submission dates. | Batch: 2, 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-006** | Page: `/admin/dashboard#inbox` (Attachment Inspection) | Do: 1. Click on an inquiry that has an attached document (e.g. from `/partner-with-us`).<br>2. Click "View Attached Document". | Expect: Document opens securely in a new browser tab with strict security headers (`X-Content-Type-Options: nosniff`, `Cache-Control: no-store`). | Watch for: File downloading as executable or browser throwing security warning. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: Healthcare Services Catalog Moderation (Batch 8)

- [ ] **ADM-SUP-007** | Page: `/admin/dashboard#services` | Do: 1. Click "Healthcare Services" tab.<br>2. Filter by status: "Pending Review". | Expect: Table displays submitted provider services awaiting moderation with Provider Name, Service Title, Category, Consultation Fee in ETB, and Submission Date. Buttons: "Approve", "Reject", "View Details". | Watch for: Empty table when pending services exist. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-008** | Page: `/admin/dashboard#services` (Approve Service) | Do: 1. On a pending service (e.g. "Cardiology Consultation"), click "Approve".<br>2. Confirm approval in modal dialog. | Expect: Green confirmation toast: "Service listing approved and published." Service transitions to green badge: "Published". Verify in public catalog (`/services`) that it now appears in public search. | Watch for: Approved service still showing as pending. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-009** | Page: `/admin/dashboard#services` (Reject Service) | Do: 1. On a pending service, click "Reject".<br>2. Form prompts: "Rejection Reason (Mandatory)" - enter "Consultation fee does not match standard clinic tier; please review pricing."<br>3. Submit rejection. | Expect: Service transitions to red badge: "Rejected". Check Mailpit to verify provider received notification with explanation. | Watch for: Rejection succeeding without providing a mandatory explanation. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-010** | Page: `/admin/dashboard#services` (Takedown Service) | Do: 1. On an already published service, click "Take Down".<br>2. Enter reason: "Temporary doctor leave of absence."<br>3. Confirm takedown. | Expect: Status updates to "Taken Down". Verify on public catalog (`/services`) that this service is immediately removed from public search results. | Watch for: Taken-down service remaining visible in public catalog search. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module E: Support Admin "Must NOT Be Able To" (RBAC Defense)

- [ ] **ADM-SUP-SEC-001** | Page: User Suspension Attempt | Do: 1. As Support Admin, inspect user row in `/admin/dashboard#users`. | Expect: "Suspend Account" button is either hidden, disabled, or clicking it returns a red error: "Access Denied: You do not have the 'users.suspend' permission." | Watch for: Support staff able to suspend accounts without authorization. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-SEC-002** | Page: Financial Refund Approval Attempt | Do: 1. Attempt to navigate to `/admin/dashboard#finance` or trigger refund approval via URL. | Expect: Access blocked with HTTP 403 Forbidden. Message: "Access Denied: Missing 'refunds.approve' permission." | Watch for: Support staff able to issue or approve financial refunds. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **ADM-SUP-SEC-003** | Page: Staff Provisioning Attempt | Do: 1. Attempt to open `/admin/dashboard#staff`. | Expect: Tab is completely hidden. Direct access returns HTTP 403 Forbidden. | Watch for: Support staff able to create new administrators. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
