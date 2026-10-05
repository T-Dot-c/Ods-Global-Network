# Page Brief: Terms & Conditions (`/terms`)

> **DOCUMENT TYPE**: Legacy Analysis / Page Specification (Batch 1)  
> **TARGET ROUTE**: `/terms`  
> **SOURCE FILE**: [`resource/client/src/components/pages/TermsAndConditions.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/pages/TermsAndConditions.tsx#L1-L106)  
> **ROUTE WIRING**: [`resource/client/src/App.tsx:L108`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/App.tsx#L108)  
> **AUDIT DATE**: 2026-10-05

---

### 1. Identity
- **Route**: `/terms` (configured in [`resource/client/src/App.tsx:L108`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/App.tsx#L108)).
- **Legacy File Path**: `resource/client/src/components/pages/TermsAndConditions.tsx`.
- **Access Level**: Public (unauthenticated). Accessible by all site visitors, prospective merchants, healthcare providers, and customers.
- **Arrival Points**: Footer links ("Terms of Service" / "Terms & Conditions"), registration page disclaimers, checkout/payment steps, or direct URL.

---

### 2. Purpose
Provides the legal agreement, operational boundaries, payment terms, and liability disclaimers governing the relationship between ODS Global Network and users accessing the platform.

---

### 3. Visible Content (Word-for-Word Copy)
*All user-facing strings copied verbatim from [`TermsAndConditions.tsx:L5-L100`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/pages/TermsAndConditions.tsx#L5-L100):*

- **Main Heading**: `"Terms & Conditions"`
- **Introduction**:
  > `"Welcome to ODS Global Network Health and Wellness Digital Solutions. By using our platform, you agree to the following terms and conditions. These govern the use of our gifting services for both corporate and individual users."`
- **Section 1 Heading**: `"1. Service Overview"`
- **Section 1 Body**:
  > `"ODS Global Network is a one-stop digital solution for curated gifting, offering services tailored for both corporate entities and individuals. We facilitate thoughtful, customized, and meaningful gift experiences across a range of occasions."`
- **Section 2 Heading**: `"2. Gift Givers"`
- **Section 2 List**:
  - `"Corporate: Companies, Institutions, Entities"`
  - `"Individuals: Anyone looking to send a personal gift"`
- **Section 3 Heading**: `"3. Gift Receivers"`
- **Section 3 List**:
  - `"Corporate: Employees, Clients, Partners"`
  - `"Individuals: Friends, Family, Loved Ones"`
- **Section 4 Heading**: `"4. Corporate Gifting Occasions"`
- **Section 4 List**:
  - `"Festivals: Ashenda, Irreechaa, Fichee Chambalaalla, Enkutatash, Timket, Ledet, Meskel, Fasika, Eid"`
  - `"Milestones & Celebrations"`
  - `"New Employee Welcome Kits"`
  - `"Branded Chocolate Gifts"`
  - `"Corporate Gifting for Him / Her"`
- **Section 5 Heading**: `"5. Individual Gifting Occasions"`
- **Section 5 List**:
  - `"Personal Milestones: Birthdays, Anniversaries, Graduations, Weddings"`
  - `"Festivals: Includes both national and religious holidays"`
  - `"Expressions of Gratitude: Thank-you gifts, sympathy, congratulations"`
  - `"Friendship & Relationship Gifts"`
- **Section 6 Heading**: `"6. Payments & Delivery"`
- **Section 6 Body**:
  > `"All payments are processed securely via Chapa. Gifts are confirmed upon payment success. In case of failure, no gift will be processed."`
- **Section 7 Heading**: `"7. Limitations"`
- **Section 7 Body**:
  > `"ODS Global Network is not liable for delays caused by third-party service providers, including payment processors or delivery partners."`
- **Section 8 Heading**: `"8. Contact Information"`
- **Section 8 Body**:
  > `"For inquiries, support, or complaints, please contact our team at: "`  
  > `"Email: support@odsglobal.net.com"` *(Note: Notice the erroneous domain typo in legacy source: `.net.com`)*

---

### 4. Categorization of Clauses: Generic vs. Gifting-Specific
*(Required for legal review and platform re-baselining)*

> [!NOTE]  
> **Legal Disclaimer**: All clauses listed below require formal legal counsel review before publication in production.

#### A. Generic Clauses (Reusable After Legal Review)
These clauses establish standard contract and platform operating principles:
1. **Preamble Agreement Principle (from Intro)**: Acceptance of terms by using the digital platform. (Needs expansion to cover healthcare providers, appointments, and merchants).
2. **Section 6 — Payment Confirmation Principle**: Principle that services/transactions are confirmed only upon cryptographic payment verification, and unconfirmed/failed transactions are void.
3. **Section 7 — Limitation of Liability**: Third-party disclaimer stating ODS Global Network is not liable for upstream/downstream delays caused by external banks, telecommunications, or independent third parties.
4. **Section 8 — Contact Information**: Contact routing for inquiries, dispute resolution, and complaints. (Requires correcting email to official `info@odsglobal.net` or `support@odsglobal.net`).

#### B. Gifting- or Wanaw-Specific Clauses (Not Reusable for General Platform Terms)
These clauses describe single-purpose gifting store logistics rather than the enterprise ODS multi-sector ecosystem:
1. **Intro & Section 1 (Service Overview)**: Narrowly restricts the platform definition to `"curated gifting"`. Completely omits hospitals, clinics, telemedicine, diagnostics, and merchant commerce.
2. **Sections 2 & 3 (Gift Givers & Receivers)**: Strictly classifies participants into gift givers and gift recipients.
3. **Sections 4 & 5 (Gifting Occasions & Chocolate Gifts)**: Lists seasonal festivals, personal milestones, and specific catalog items like `"Branded Chocolate Gifts"`. These belong in marketing copy or a dedicated Gifting Policy Addendum, not general Terms of Service.
4. **Section 6 (Specific Mention of Chapa only & "Gifts")**: Ignores credit/debit cards, bank transfer, and mobile money listed in Scope Section 6.

---

### 5. Fields and Rules
- **Fields**: None. Static legal markdown/text display.

---

### 6. States and Flows
- **Display Flow**: Static layout wrapped in a container (`max-w-4xl mx-auto px-6 py-10`). No interactive states or form controls.

---

### 7. Data and Backend
- **Data Call**: None. Completely client-rendered static JSX.

---

### 8. Dependencies
- **Dependencies**: None. Pure React JSX component.
- **Styling**: Tailwind utility classes (`max-w-4xl mx-auto px-6 py-10 text-gray-800 leading-7 text-[#1c2b21]`).

---

### 9. Security & Legal Observations
1. **Erroneous Contact Address**: Lists invalid domain `support@odsglobal.net.com` ([`TermsAndConditions.tsx:L99`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/pages/TermsAndConditions.tsx#L99)).
2. **Severe Legal Omissions**:
   - Zero medical or healthcare disclaimers (ODS aggregates hospitals, clinics, and doctors; missing standard "ODS does not provide medical advice or emergency medical services" disclaimer).
   - Zero merchant onboarding / KYC liability terms.
   - Zero user data privacy, HIPAA/GDPR-equivalent health data protection, or audit log consent terms.
   - Zero refund, cancellation, or appointment rescheduling terms (despite appointment booking being a core MVP pillar in Scope Section 5).

---

### 10. Scope Mapping
- **Scope Document**: [`KPIs & SCOPES ODS GLOBAL NET .txt`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/KPIs%20&%20SCOPES%20ODS%20GLOBAL%20NET%20.txt#L14-L24)
  - **Section 1 (Website Completion)**: Mandates `"Complete all website pages"`, `"Zero broken pages"`, and `"Integrate company branding"`.
  - **Section 12 (Documentation)**: Mandates legal and operational documentation package.
- **Verdict**: Mandatory standard public compliance page required for full website launch.

---

### 11. Current State in Modern Codebase
- **Frontend**: **None**. Footer links currently point to `#terms` anchor without a dedicated `/terms` route or page component.
- **Backend**: **None**. Not applicable.

---

### 12. Suggested Bucket & Rationale
- **Suggested Bucket**: **Adapt**
- **One-Line Reason**: Mandatory for production compliance, but the legacy text must be heavily adapted: separate general platform/healthcare terms from gifting terms, fix the email domain typo, apply official brand tokens, and submit to legal counsel for final text ratification.
