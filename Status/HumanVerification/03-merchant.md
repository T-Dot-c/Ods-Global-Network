# 03. Human Verification Checklist — Merchant Role

**Target Role**: Healthcare Retailer / Merchant (Pharmacies, Medical Supplies)  
**Primary Test Account**: `merchant@123.com` (Approved) | `merchant01@ods.com` (Pending)  
**Password Source**: `DEV_PASSWORD` in `.env` (typically `Password123!`)  
**Primary URL**: `http://localhost:5173/merchant/dashboard`

---

## Module A: Sign-In & Onboarding State Badges

- [ ] **MER-AUTH-001** | Page: `/login` | Do: 1. Navigate to `/login`.<br>2. Sign in with `merchant@123.com` and `Password123!`. | Expect: Successfully signs in. Redirects to `/merchant/dashboard`. Top header displays "Merchant Portal", business name, and active user badge. | Watch for: Redirecting to customer dashboard or public homepage. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-AUTH-002** | Page: `/merchant/dashboard` (Approved State) | Do: 1. Inspect the account status badge on the dashboard header for `merchant@123.com`. | Expect: A green badge is displayed: "Status: Verified & Approved". Full feature tabs (Overview, Documents, Profile, Products/Services) are active. | Watch for: Showing "Pending" or "Rejected" for an approved merchant. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-AUTH-003** | Page: `/merchant/dashboard` (Pending State) | Do: 1. Sign out, then sign in with `merchant01@ods.com` and `Password123!`. | Expect: Header displays yellow/amber badge: "Status: Under Compliance Review". An advisory banner states: "Your business documentation is currently under review by our compliance team. You will be notified once verified." | Watch for: Prematurely showing as approved or missing the compliance banner. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module B: KYC Document Upload & Magic-Byte Validation

- [ ] **MER-DOC-001** | Page: `/merchant/dashboard#documents` | Do: 1. Click "Documents & KYC" tab in merchant dashboard.<br>2. Inspect the document requirement list. | Expect: Displays requirements: "Business Registration Certificate" and "Pharmacy / Trade License". Shows current upload status, file name, upload date, and verification status ("Pending", "Verified", or "Missing"). | Watch for: Missing document type labels or empty screen. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-DOC-002 [HIGH RISK]** | Page: `/merchant/dashboard#documents` (Fake MIME Check) | Do: 1. Create a plain text file, rename it to `fake_license.pdf` (fake extension).<br>2. Select Purpose: "Trade License".<br>3. Attempt to upload this fake PDF. | Expect: Upload is strictly rejected with a clear red alert: "Invalid file format. Uploaded file content does not match genuine PDF/JPEG/PNG format (magic byte validation failed)." | Watch for: System accepting executable or renamed text files as valid PDFs. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-DOC-003** | Page: `/merchant/dashboard#documents` (Oversized File) | Do: 1. Attempt to upload a genuine file larger than 10MB.<br>2. Click Upload. | Expect: Form immediately flags: "File size exceeds the 10 MB limit. Please compress your document and try again." | Watch for: Upload hanging indefinitely or crashing browser. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-DOC-004** | Page: `/merchant/dashboard#documents` (Valid Upload) | Do: 1. Select a genuine valid PDF file under 5MB (e.g. `trade_license_2026.pdf`).<br>2. Select Purpose: "Trade License".<br>3. Click "Upload Document". | Expect: Progress bar indicates upload, followed by green confirmation: "Document uploaded successfully." The table updates immediately, displaying the file name, upload date, and a yellow "Pending Review" tag. | Watch for: Page having to be manually reloaded to see the new document. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module C: Automatic Compliance Reset Workflows

- [ ] **MER-CMP-001 [HIGH RISK]** | Page: `/merchant/dashboard#profile` (Address Change) | Do: 1. Log in as approved merchant `merchant@123.com`.<br>2. In the "Business Profile" tab, change City from "Addis Ababa" to "Hawassa" and update Address Line.<br>3. Click "Save Profile Changes". | Expect: System prompts a confirmation warning: "Changing regulated business location will reset your account to Pending Compliance Review." After saving, status badge changes from "Approved" to "Pending Review". | Watch for: Regulated location changing without resetting compliance status. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-CMP-002 [HIGH RISK]** | Page: `/merchant/dashboard#documents` (Document Replacement) | Do: 1. On an approved merchant account, upload a replacement KYC document for an existing verified slot.<br>2. Confirm upload. | Expect: Upload accepted. Compliance status automatically resets to "Pending Review" until an administrator verifies the replacement document. Check Mailpit for compliance notice. | Watch for: Replaced document automatically remaining in "Approved" state without admin review. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module D: Merchant Products & Healthcare Packages

- [ ] **MER-PRD-001** | Page: `/merchant/dashboard#services` | Do: 1. Click "Products & Services" tab.<br>2. Click "Add New Product / Health Package". | Expect: Product authoring modal opens with fields: Product Title, Category (e.g. "Pharmacy / Prescription", "Medical Devices"), Description, Price in ETB, and Stock / Availability. | Watch for: Price field accepting non-numeric values or negative numbers. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-PRD-002** | Page: `/merchant/dashboard#services` | Do: 1. Fill out: Title "First Aid Emergency Kit", Category "Medical Supplies", Price "1,500.00 ETB", Description "Complete sterile first aid kit."<br>2. Click "Save as Draft". | Expect: Product appears in the merchant list with a grey badge: "Status: Draft (Unpublished)". It is NOT visible in the public search catalog. | Watch for: Draft products appearing in the public catalog prematurely. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-PRD-003** | Page: `/merchant/dashboard#services` | Do: 1. Click "Submit for Compliance Review" on the draft product. | Expect: Confirmation dialog appears. Status transitions to yellow badge: "Pending Review". Explains that catalog curators will review product details within 24 hours. | Watch for: Product becoming published immediately without review. | Batch: 8
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module E: Merchant "Must NOT Be Able To" (RBAC Defense)

- [ ] **MER-RBAC-001** | Page: `/provider/dashboard` | Do: 1. While logged in as `merchant@123.com`, type `http://localhost:5173/provider/dashboard` in the address bar and press Enter. | Expect: Strictly blocked. Redirects to `/unauthorized` with banner: "Access Denied: Healthcare Provider credentials required." | Watch for: Doctor consultation schedule or patient booking lists exposed. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-RBAC-002** | Page: `/admin/dashboard` | Do: 1. Type `http://localhost:5173/admin/dashboard` in the address bar and press Enter. | Expect: Strictly blocked. Redirects to `/unauthorized` or `/login`. | Watch for: Administrative console tabs exposed to merchant. | Batch: 10
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-RBAC-003** | Page: Direct Document Access | Do: 1. Attempt to view another entity's KYC document URL (e.g., `/api/documents/OTHER_DOC_ID/view`). | Expect: Browser receives HTTP 403 Forbidden with message: "Access denied. You do not have permission to view this document." | Watch for: Foreign merchant or provider PDF opening in browser (IDOR vulnerability). | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

---

## Module F: Mobile Responsiveness & Keyboard-Only Pass

- [ ] **MER-MOB-001** | Page: `/merchant/dashboard` (Mobile 375px) | Do: 1. Switch DevTools to iPhone SE (375px width).<br>2. Open "Documents & KYC" tab. | Expect: Document table adapts to card layout or scrolls horizontally with no overlapping buttons. "Upload Document" button remains fully visible and clickable. | Watch for: Upload button disappearing off-screen or unclickable. | Batch: 4
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:

- [ ] **MER-KEY-001** | Page: `/merchant/dashboard#profile` (Keyboard Only) | Do: 1. Navigate merchant profile form using `Tab` and `Enter`. | Expect: Focus rings highlight inputs clearly. Form submits upon pressing `Enter` on "Save Profile Changes". | Watch for: Focus trapped in dropdown menus. | Batch: 3
  * Result: [ ] Pass  [ ] Fail  [ ] N/A
  * Notes / Evidence:
