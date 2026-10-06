# Batch 2 Analysis Brief: Partner With Us (`/partner-with-us`)

**File:** `./Progress/2026-10-06_1640_brief_partner-with-us.md`  
**Route Ref:** `/partner-with-us`  
**Date:** 2026-10-06 16:40  
**Status:** Complete Analysis  

---

## a. Legacy File Paths, Components, Services & API Calls

* **Primary Legacy File**: [`resource/client/src/components/PartnerWithUs.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/PartnerWithUs.tsx)
* **Legacy Sub-Components Imported**: None.
* **Legacy Services & API Calls**:
  - `axios.post(`${BASE_URL}/partner-request`, data)` (multipart/form-data with file attachments).
  - Legacy backend route: [`resource/server/routes/partnerRoutes.js`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/routes/partnerRoutes.js).
* **Legacy State Structure**:
  - `tab`: `"Investor" | "Strategic Partner" | "Sponsorship"`
  - `formData`: 15 text fields.
  - `files`: 8 File attachments.

---

## b. Content Inventory & Scope/Brand Alignment

| Section / Element | Legacy Content | Recommendation (KEEP / UPDATE / DROP) | Rationale & Authority Check |
| :--- | :--- | :---: | :--- |
| **Decorative Shapes** | Absolute pulse/spin circles with `#1c2b21` green | **DROP** | Incompatible with ODS corporate navy and gold guidelines. |
| **Header Badge** | Floating pill `"Partner With Us"` with `#D4AF37` | **UPDATE** | Rebuild with ODS gold design token (`--color-gold-bright`) and Inter font. |
| **Main Heading** | `"Invest / Partner With Us"` | **UPDATE** | Use Google Sans Flex with luxury dark navy typography. |
| **Tab Bar** | 3 buttons: `"Investor"`, `"Strategic Partner"`, `"Sponsorship"` | **KEEP** | Good multi-track partnership intake. Style with luxury active gold tab states. |
| **Sector Dropdown** | 10 sectors (Technology, Healthcare, Finance, Manufacturing, Real Estate, Education, Hospitality & Tourism, Agriculture, Media & Entertainment, Construction) | **KEEP** | Comprehensive sector list. Ensure accessible `<select>` dropdown styling. |
| **Investment Type** | Equity, Debt, Convertible Bonds | **KEEP** | Relevant for the "Investor" tab. |
| **Contact Fields** | Name, Company Name, Email, Phone, WhatsApp, Office Phone | **UPDATE** | Rebuild with ODS standard inputs and client-side validation. |
| **Sponsorship Fields** | Motto, Special Packages, Messages, Effective Date, Expiry Date | **UPDATE** | Retain for "Sponsorship" track; use accessible date inputs and textareas. |
| **8 File Attachment Inputs** | ID/Passport, License, Trade Registration, Business Proposal, Business Plan, Logo, MOU Signed, Contract Signed | **UPDATE** | For minimal testing in Batch 2 without requiring complex cloud storage, handle metadata and client file attachment validation gracefully. |

---

## c. Forms Analysis (Partner Request Form)

### Legacy Form Fields:
1. **`tab`**: Selector (`"Investor" | "Strategic Partner" | "Sponsorship"`).
2. **`sector`**: Dropdown (10 sectors), required for Investor and Strategic Partner.
3. **`investmentType`**: Dropdown (`"Equity" | "Debt" | "Convertible Bonds"`), displayed only on Investor tab.
4. **`name`**: Text input, required.
5. **`companyName`**: Text input, required.
6. **`email`**: Text/email input, required.
7. **`phone`**: Text input, required.
8. **`whatsapp`**: Text input, required.
9. **`officePhone`**: Text input, required on Sponsorship tab.
10. **`enquiry`**: Textarea, optional.
11. **`motto`**: Textarea, Sponsorship tab.
12. **`specialPackages`**: Textarea, Sponsorship tab.
13. **`messages`**: Textarea, Sponsorship tab.
14. **`effectiveDate`**: Date input, Sponsorship tab.
15. **`expiryDate`**: Date input, Sponsorship tab.
16. **8 File Inputs**:
    - Investor files: `idOrPassport`, `license`, `tradeRegistration`.
    - Strategic Partner files: `businessProposal`, `businessPlan`, `logo`, `mouSigned`, `contractSigned`.
    - Sponsorship files: `logo`, `mouSigned`, `contractSigned`.

### Legacy Submission Behavior:
* Appends all populated fields and files to a `FormData` object.
* Dispatches `POST ${BASE_URL}/partner-request`.
* On success: triggers browser `alert("🎉 Your form was submitted successfully!")` and wipes form state back to defaults.
* On error: triggers `alert("❌ Failed to submit. Please try again.")`.

---

## d. Data Model Proposal (`partners`)

For testing purposes in PostgreSQL (minimal table columns only, per prompt instructions):

```sql
CREATE TABLE IF NOT EXISTS partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_type VARCHAR(50) NOT NULL, -- 'investor', 'strategic_partner', 'sponsorship'
    name            VARCHAR(128) NOT NULL,
    company_name    VARCHAR(128) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(50) NOT NULL,
    sector          VARCHAR(100),
    investment_type VARCHAR(100),
    enquiry         TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb, -- stores additional track-specific details
    status          VARCHAR(30) NOT NULL DEFAULT 'submitted',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_created ON partners(created_at DESC);
```

---

## e. Batch 1 & Current Frontend Reusability

* **Shared Components**:
  - `Button` (`Frontend/src/components/common/Button.tsx`)
  - `Input` (`Frontend/src/components/common/Input.tsx`)
  - `Card` (`Frontend/src/components/common/Card.tsx`)
* **Tokens & Styling**:
  - Design tokens from `tokens.css` (`--color-navy`, `--color-gold-deep`, `--color-gold-bright`, `--color-border-dark`).
  - High-contrast gold focus rings (`batch1-focus.css`).
* **Icons**: Lucide React (`Briefcase`, `Building2`, `Handshake`, `Mail`, `Phone`, `FileText`, `CheckCircle2`, `AlertCircle`, `ArrowLeft`).
* **Spam Guard**: Single honeypot field (`website` honeypot), invisible to human users, strictly rejecting bot submissions.

---

## f. Routing & Navigation Impact

* **Header Navigation**:
  - In `Header.tsx`, `businessMenu` currently only has:
    - `"For Merchants"` &rarr; `#for-merchants`
    - `"For Service Providers"` &rarr; `#for-providers`
  - *Mismatch*: There is currently **zero** link or menu item for `"Partner With Us"` in `Header.tsx`.
  - *Recommendation*: Add `"Partner With Us"` under `businessMenu` in `Header.tsx` routing to `/partner-with-us`.
* **Footer Navigation**:
  - In `Footer.tsx` (Col 4), the section title is `"Strategic Partners"`, but it only displays logos of Chapa, Ethio Telecom, and Capital Bank without a conversion link for prospective partners.
  - *Recommendation*: Add a `"Become a Partner →"` link/button in Col 4 of `Footer.tsx` routing to `/partner-with-us`.

---

## g. Accessibility & Mobile Notes

* Tab Keyboard Navigation: The 3 tabs must follow the W3C Tabs Pattern (`role="tablist"`, `role="tab"`, `aria-selected`, arrow key navigation).
* Dynamic Conditional Fields: When tabs change, non-applicable inputs must be unmounted or disabled with proper `aria-hidden` attributes to avoid confusing screen readers.
* Mobile Grid: Form grid collapses to a single column on viewports under 640px.

---

## h. Support Page Specific Question

* *(N/A for Partner Brief — addressed in Support Brief)*.

---

## i. Open Questions for User

1. In the testing implementation for Batch 2, should the partner request form store document filenames/metadata in PostgreSQL `metadata` column, or do you require binary file upload handling in this test phase? (Recommending metadata to keep testing simple and robust without cloud bucket dependencies).
2. Should we add `"Partner With Us"` directly into the Header's "For Businesses" dropdown menu, or keep it strictly accessible via Footer and direct URL during Batch 2?
