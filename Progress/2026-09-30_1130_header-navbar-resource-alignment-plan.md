<!--
REUSABLE TEMPLATE — Implementation Plan
Save to: ./Progress/
Filename: 2026-09-30_1130_header-navbar-resource-alignment-plan.md
-->

# Implementation Plan: Frontend Header & Navigation Bar Scope Re-baselining

**Project:** ODS Global Network  
**Created:** 2026-09-30 11:30 (Re-baselined 12:15, Revised 12:20)  
**Status:** Completed  

---

## Authority & Precedence Hierarchy
All architectural, design, and code decisions in this plan strictly adhere to the following order of precedence:
$$\mathbf{1.\ Scope\ Document\ (resource/KPIs\ \&\ SCOPES\ ODS\ GLOBAL\ NET\ .txt)} \succ \mathbf{2.\ Brand\ Guideline\ (Assets/)} \succ \mathbf{3.\ Legacy\ Resources\ (resource/client)} \succ \mathbf{4.\ Current\ Code\ (Frontend/)}$$

---

## Baseline Declaration
All references to "current `Header.tsx`" in this plan describe the **uncommitted working-tree state** of `Frontend/src/components/layout/Header.tsx`.

### Differences Between Working-Tree `Header.tsx` and `origin/main` (`07928bec`):
1. **Direct Contacts**: Added phone (`+251 960 606 042`), email (`info@odsglobal.net`), Telegram, and WhatsApp links in top utility bar and mobile drawer. (Absent on `origin/main`).
2. **Search Overlay**: Added interactive search trigger button and live filtering modal across services and gifting options. (Absent on `origin/main`).
3. **Gifting Menu**: Expanded from 3 base items (`Gift Cards`, `Send a Gift`, `Redeem a Gift Card`) to 6 items (`Gift Cards Overview`, `Individual Gifts`, `Corporate Gifts`, `Ethiopian Diaspora Gifting`, `Send a Gift`, `Redeem a Gift Card`). Top-level title is `"Gifting ▾"`.
4. **About Menu**: Base labels `'Our Network'` and `'Contact Us'` were changed to `'Our Connected Network'` and `'Contact & Support'`.
5. **Responsive Styling**: Added component-scoped `<style>` tag for 960px and 860px breakpoints.

### Approval Audit of Prior Edit
* Prior plan [`Progress/2026-09-30_1115_header-navbar-brand-alignment.md`](./Progress/2026-09-30_1115_header-navbar-brand-alignment.md) **was formally approved** by the user with the exact phrase **`"Approved: proceed"`** on `2026-09-30 11:12:36+03:00` prior to writing those edits to `Header.tsx`.

---

## 1. Scope Document Requirement Extraction (`resource/KPIs & SCOPES ODS GLOBAL NET .txt`)

Every requirement touching header, navigation, menus, search, language, responsive behavior, auth entry points, vouchers, and onboarding is quoted below:

### Objective
* Line 10: `Objective: Complete core development, testing, and deployment of ODS Global Net to deliver a fully functional Minimum Viable Product (MVP) ready for merchant onboarding and pilot operations. Complete all remaining platform modules, integrate core services, perform testing, and prepare ODS Global Net for merchant onboarding and pilot launch.`

### Section 1: Website Completion
* Line 14: `* Complete all website pages.`
* Line 15: `* Verify all menus and navigation links.`
* Line 16: `* Optimize desktop and mobile responsiveness.`
* Line 17: `* Integrate company branding.`
* Line 22: `* Fully operational website.`
* Line 23: `* Responsive design.`
* Line 24: `* Zero broken pages.`
* Line 28: `* 100% website pages completed.`
* Line 31: `* Mobile responsiveness above 95%.`
* Line 200: `* Fully operational website.`
* Line 229–230: `Mobile Compatibility: 95%+`

### Section 2: Merchant Registration Portal
* Line 32: `2. Merchant Registration Portal`
* Line 34: `* Complete merchant registration workflow.`
* Line 35: `* Build merchant dashboard.`
* Line 41: `* Functional merchant portal.`
* Line 201: `* Merchant registration portal.`
* Line 243: `* Complete merchant registration workflow.`
* Line 247: `* Merchant dashboard.`

### Section 3: Customer Portal
* Line 50: `* Customer registration.`
* Line 51: `* Login and password recovery.`
* Line 57: `* Complete customer account system.`
* Line 59: `* Login success above 99%.`
* Line 202: `* Customer registration portal.`
* Line 253: `* Customer registration.`
* Line 254: `* Login and password recovery.`

### Section 4: Service Provider Management
* Line 61: `4. Service Provider Management`
* Line 63–72:
  ```text
  Integrate:
  * Hospitals
  * Clinics
  * Pharmacies
  * Laboratories
  * Wellness Centers
  * Ambulance Services
  * Home Care
  * Specialists
  * Diagnostic Centers
  ```
* Line 74: `* Service provider database.`
* Line 75: `* Provider dashboard.`
* Line 78: `* All provider categories functional.`
* Line 79: `* Provider onboarding completed successfully.`
* Line 203: `* Service provider onboarding.`

### Section 5: Appointment Booking System
* Line 82: `* Online booking.`
* Line 85: `* Booking confirmation.`
* Line 87: `* Cancellation and rescheduling.`
* Line 89: `* Live booking engine.`
* Line 204: `* Appointment booking engine.`

### Section 7: Gift Card System
* Line 108: `7. Gift Card System`
* Line 110: `* Purchase gift cards.`
* Line 111: `* Redeem gift cards.`
* Line 112: `* Balance tracking.`
* Line 113: `* Expiry management.`
* Line 115: `* Functional gift card module.`
* Line 206: `* Gift card module.`

### Section 8: Admin Dashboard
* Line 128: `* Support tickets`  
  *(Note: "Support tickets" is an internal administrative dashboard management module, not a public customer-facing navigation label).*

### Section 10: Security
* Line 148: `* User authentication.`
* Line 149: `* Role-based access control.`

---

## 2. Section A: Scope Traceability & Comparison Table

Classification definitions:
* **REQUIRED**: Directly named in `KPIs & SCOPES ODS GLOBAL NET .txt`.
* **SUPPORTED**: Implied by a defined functional capability in `KPIs & SCOPES ODS GLOBAL NET .txt`.
* **LEGACY-ONLY**: Present only in legacy reference files (`Navbar.tsx`, `en.json`, `am.json`).
* **NOT IN SCOPE**: Not mentioned in the scope document or brand guideline.

| Header Element | Target Action / Anchor | Scope Document Reference | Classification | Action Decided by User |
| :--- | :--- | :--- | :--- | :--- |
| **Top Bar: Announcement Text** | None | None (Not in `BRAND_GUIDELINES.md`) | **NOT IN SCOPE** | **REMOVE** |
| **Top Bar: Direct Phone** | `tel:+251-960-606-042` | `Navbar.tsx` & Footer | **LEGACY-ONLY** | **KEEP** |
| **Top Bar: Direct Email** | `mailto:info@odsglobal.net` | `Navbar.tsx` & Footer | **LEGACY-ONLY** | **KEEP** |
| **Top Bar: Telegram / WhatsApp**| `https://t.me/...` & `wa.me/...`| `Navbar.tsx` | **LEGACY-ONLY** | **KEEP** |
| **Top Bar: Language Toggle** | Visual `EN`/`AM` | None (No scope requirement) | **NOT IN SCOPE** | **REMOVE for now** (avoids non-functional control) |
| **Top Bar: Lightweight Sign In**| `onNavigate('login')` | Sec 3 Line 51 | **SUPPORTED** | **REMOVE** (eliminates duplicate CTA with main Login button) |
| **Top Bar: Help Center** | `#contact` | Sec 8 Line 128 | **SUPPORTED** | **KEEP** (Label: `"Help Center"`) |
| **Brand Logo** | `onNavigate('home')` / `#hero` | Sec 1 Line 17 ("Integrate company branding") | **REQUIRED** | **KEEP** (`ods-logo-gold-primary.svg`, 42px) |
| **Nav: Home** | `onNavigate('home')` / `#hero` | Sec 1 Line 14, 15 | **REQUIRED** | **KEEP** |
| **Nav: Services ▾** | Trigger | Sec 1 Line 15, Sec 4 Line 61 | **REQUIRED** | **KEEP** (Disclosure pattern) |
| ↳ *All Services* | `#services` | Sec 4 Line 78 ("All provider categories functional") | **SUPPORTED** | **KEEP** |
| ↳ *Hospitals* | `#services` | Sec 4 Line 64 ("* Hospitals") | **REQUIRED** | **KEEP** |
| ↳ *Clinics* | `#services` | Sec 4 Line 65 ("* Clinics") | **REQUIRED** | **KEEP** |
| ↳ *Pharmacies* | `#services` | Sec 4 Line 66 ("* Pharmacies") | **REQUIRED** | **KEEP** |
| ↳ *Laboratories* | `#services` | Sec 4 Line 67 ("* Laboratories") | **REQUIRED** | **KEEP** |
| ↳ *Wellness Centers* | `#services` | Sec 4 Line 68 ("* Wellness Centers") | **REQUIRED** | **KEEP** |
| ↳ *Ambulance Services* | `#services` | Sec 4 Line 69 ("* Ambulance Services") | **REQUIRED** | **KEEP** |
| ↳ *Home Care* | `#services` | Sec 4 Line 70 ("* Home Care") | **REQUIRED** | **KEEP** |
| ↳ *Specialists* | `#services` | Sec 4 Line 71 ("* Specialists") | **REQUIRED** | **KEEP** |
| ↳ *Diagnostic Centers* | `#services` | Sec 4 Line 72 ("* Diagnostic Centers") | **REQUIRED** | **KEEP** |
| **Nav: How It Works** | `#how-it-works` | Sec 1 Line 14, Sec 5 Line 82 ("Online booking") | **SUPPORTED** | **KEEP** |
| **Nav: Gifting ▾** | Trigger | Sec 7 Line 108 ("7. Gift Card System") | **REQUIRED** | **KEEP** (Title: `"Gifting ▾"`) |
| ↳ *Gift Cards* | `#gifting` | Current `Header.tsx` & Scope Sec 7 | **REQUIRED** | **KEEP** |
| ↳ *Purchase Gift Cards* | `#gifting` | Sec 7 Line 110 ("* Purchase gift cards.") | **REQUIRED** | **KEEP** |
| ↳ *Redeem Gift Cards* | `#gifting` | Sec 7 Line 111 ("* Redeem gift cards.") | **REQUIRED** | **KEEP** |
| ↳ *Individual Gifts* | `#gifting` | `en.json` (`nav.giftsMenu.individual`) | **LEGACY-ONLY** | **KEEP** |
| ↳ *Corporate Gifts* | `#gifting` | `en.json` (`nav.giftsMenu.corporate`) | **LEGACY-ONLY** | **KEEP** |
| ↳ *Ethiopian Diaspora* | `#gifting` | `en.json` (`nav.giftsMenu.diaspora`) | **LEGACY-ONLY** | **KEEP** |
| **Nav: For Businesses ▾** | Trigger | Sec 2 Line 32, Sec 4 Line 61 | **SUPPORTED** | **KEEP** |
| ↳ *For Merchants* | `#for-merchants` | Sec 2 Line 34, 41 ("Merchant registration workflow") | **REQUIRED** | **KEEP** |
| ↳ *For Service Providers* | `#for-providers` | Sec 4 Line 79 ("Provider onboarding completed") | **REQUIRED** | **KEEP** |
| **Nav: About Us ▾** | Trigger | Sec 1 Line 14, 17 ("Company branding") | **SUPPORTED** | **KEEP** |
| ↳ *About ODS Global Net* | `#about` | Sec 1 Line 17 | **SUPPORTED** | **KEEP** |
| ↳ *Our Network* | `#ecosystem` | Sec 1 Line 10 ("Connected ecosystem") | **SUPPORTED** | **KEEP** |
| ↳ *Contact Us* | `#contact` | Sec 8 Line 128 | **SUPPORTED** | **KEEP** |
| **Search Trigger & Overlay** | Modal toggle | Legacy `Navbar.tsx` | **LEGACY-ONLY** | **KEEP** (Indexes final menu items) |
| **CTA: Login** | `onNavigate('login')` | Sec 3 Line 51, Sec 10 Line 148 | **REQUIRED** | **KEEP** |
| **CTA: Get Started** | `onNavigate('register')`| Sec 2 Line 34, Sec 3 Line 50 | **REQUIRED** | **KEEP** |
| **Mobile Drawer & Toggle** | Drawer trigger | Sec 1 Line 16, 23, 31 ("Mobile responsiveness 95%+")| **REQUIRED** | **KEEP** |

---

## 3. Section B: In-Page Anchor Verification

### Terminal Grep Output Across `Frontend/src/pages` & `Frontend/src/components/layout/`
```text
Grep Query: id=["'](hero|services|gifting|how-it-works|for-merchants|for-providers|about|ecosystem|contact)["']

Path                                            LineNumber Line
----                                            ---------- ----
Frontend\src\pages\HomePage.tsx                        293         id="hero"
Frontend\src\pages\HomePage.tsx                        430         id="about"
Frontend\src\pages\HomePage.tsx                        556         id="how-it-works"
Frontend\src\pages\HomePage.tsx                        664         id="services"
Frontend\src\pages\HomePage.tsx                        836         id="for-merchants"
Frontend\src\pages\HomePage.tsx                        928         id="for-providers"
Frontend\src\pages\HomePage.tsx                       1198         id="gifting"
Frontend\src\pages\HomePage.tsx                       1383         id="ecosystem"
Frontend\src\components\layout\Footer.tsx                 6       id="contact"
```

### Anchor Audit Findings:
* **All 9 required target IDs exist in the active codebase without creating any new IDs**:
  * 8 IDs reside inside [`Frontend/src/pages/HomePage.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Frontend/src/pages/HomePage.tsx).
  * 1 ID (`id="contact"`) is located on the root element of [`Frontend/src/components/layout/Footer.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Frontend/src/components/layout/Footer.tsx) (line 6), which mounts directly beneath `HomePage.tsx` on the Home view.
* **Known Limitation**: All 9 service categories in the `Services ▾` dropdown scroll to `#services` (the single service categories section in `HomePage.tsx`), because individual category anchor targets (`#services-hospitals`, `#services-clinics`, etc.) do not exist on the page.

---

## 4. Section C: Route Mapping (Clean In-Page Smooth Scroll)

Because `Header` renders exclusively when `currentView === 'home'`, all non-home branching and `setTimeout` are dead code. Direct `scrollIntoView` is utilized:

```typescript
const handleLinkClick = (anchor: string) => {
  setOpenDropdown(null);
  setMobileOpen(false);
  setSearchOpen(false);
  const el = document.querySelector(anchor);
  el?.scrollIntoView({ behavior: 'smooth' });
};
```

---

## 5. Section D: Brand Audit & Hard-Coded Color Replacement Table

| Brand Requirement | Specification in `BRAND_GUIDELINES.md` | Current Header State | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Header Surface Color** | ODS Deep Navy (`#0F285B`) / Dark Shade (`#081738`) | `rgba(15, 40, 91, 0.98)` and `var(--color-navy-dark)` | **Compliant** |
| **Top Bar Surface Color** | Deep Navy Shade (`#081738`) | `var(--color-navy-dark)` | **Compliant** |
| **Divider & Border Color**| Soft Navy (`#264572`) | `var(--color-border-dark)` (`#1a3875`) | **Deviation (token drift, see below)** |
| **Accent & Highlight Color**| Classic Gold (`#BE9B49`) & Luminous Gold (`#EDC45B`) | `var(--color-gold-mid)` & `var(--color-gold-bright)` | **Compliant** |
| **Typography (Display)** | `Google Sans Flex` (`600`–`800`) | Bound via `var(--font-heading)` in CSS | **Compliant** |
| **Typography (Interface/Nav)**| `Inter` (`400`, `500`, `600`, `700`) | Default body font `var(--font-body)` (`Inter`) | **Compliant** |
| **Logo Asset Variant** | `ods-logo-gold-primary.svg` on dark backgrounds | `/assets/brand/vector/ods-logo-gold-primary.svg` | **Compliant** |
| **Logo Height & Alt Text** | Height `42px`, aspect ratio preserved, descriptive alt | `height: 42px`, `objectFit: contain`, `alt="ODS Global Network"` | **Compliant** |
| **Elevations & Dropdowns**| Luxury card shadow & blur filter | `backdrop-filter: blur(16px)`, `box-shadow: var(--shadow-card-dark)` | **Compliant** |
| **Border Radius** | 8px to 12px for interactive elements and cards | 8px (buttons/inputs), 12px (dropdowns) | **Compliant** |

### Hard-Coded Color Values in `Header.tsx` & Replacement Plan

#### Colors Eliminated by Feature Removals:
* **Line 209**: `#e2e8f0` (announcement banner text) &rarr; **Eliminated** via removal of announcement text.
* **Line 381**: `#e2e8f0` (English language dropdown option text) &rarr; **Eliminated** via removal of language toggle.
* **Lines 384, 401**: `rgba(190, 155, 73, 0.15)` (language dropdown active option background) &rarr; **Eliminated** via removal of language toggle.
* **Line 410**: `rgba(255, 255, 255, 0.15)` (divider before top-bar Sign In) &rarr; **Eliminated** via removal of top-bar Sign In.
* **Line 320**: `rgba(255, 255, 255, 0.15)` (divider before language toggle) &rarr; **Eliminated** via removal of language toggle.

#### Remaining Hard-Coded Colors in `Header.tsx` & Exact Replacements:
| Hard-Coded Value | Line Numbers in Current `Header.tsx` | Role in Header | Token or `color-mix()` Replacement |
| :--- | :--- | :--- | :--- |
| `rgba(15, 40, 91, 0.98)` | L153 | Sticky header root background | `color-mix(in srgb, var(--color-navy) 98%, transparent)` |
| `rgba(255, 255, 255, 0.08)` | L180, L562, L1318 | Top bar border (L180), dropdown divider (L562), mobile contacts border (L1318) | `color-mix(in srgb, var(--color-white) 8%, transparent)` |
| `rgba(255, 255, 255, 0.15)` | L301, L862, L879 | Top bar divider after contacts (L301), search trigger border (L862, L879) | `color-mix(in srgb, var(--color-white) 15%, transparent)` |
| `rgba(255, 255, 255, 0.06)` / `0.07` / `0.04` | L861, L949, L1021, L1316 | Search trigger background (L861), search input (L949), search divider (L1021), mobile contact card (L1316) | `color-mix(in srgb, var(--color-white) 6%, transparent)` / `7%` / `4%` |
| `rgba(8, 23, 56, 0.98)` | L536, L641, L726, L811 | Services (L536), Gifting (L641), Business (L726), About (L811) dropdown panels | `color-mix(in srgb, var(--color-navy-dark) 98%, transparent)` |
| `rgba(13, 34, 77, 0.98)` | L1003 | Search modal results overlay panel | `color-mix(in srgb, var(--color-card-dark) 98%, transparent)` |
| `rgba(190, 155, 73, 0.3)` | L539, L644, L729, L814 | Dropdown panel borders across all 4 menus | `color-mix(in srgb, var(--color-gold-mid) 30%, transparent)` |
| `rgba(190, 155, 73, 0.15)` | L565, L668, L753, L838, L1024 | Dropdown item hover (L565, L668, L753, L838) & search result hover (L1024) | `color-mix(in srgb, var(--color-gold-mid) 15%, transparent)` |
| `#e2e8f0` | L555, L570, L660, L673, L745, L758, L830, L843, L868, L880, L1328, L1334 | Dropdown item text, search button text, mobile contacts text | `var(--color-border-light)` (exact `#e2e8f0` match in `tokens.css`) |
| `#ffffff` | L482, L506, L585, L594, L611, L696, L781, L968, L1029, L1095, L1145, L1164, L1216, L1268 | Nav links, trigger buttons, search input/result text, mobile drawer links | `var(--color-white)` |
| `#94a3b8` | L976, L1039 | Search close icon button (L976), no-results text (L1039) | `var(--color-text-muted-dark)` |

---

## 6. Section E: Accessibility (W3C Disclosure Pattern) & Contrast Audit

1. **Disclosure Pattern**:
   * Dropdowns use `<button aria-expanded={openDropdown === 'services'} aria-controls="services-dropdown-panel">` revealing `<ul>` / `<li>` lists (no `role="menu"` / `role="menuitem"`).
   * Mobile drawer uses disclosure button (`aria-expanded={mobileOpen}`, `aria-controls="mobile-nav-drawer"`), with `Escape` key dismissing and returning focus to toggle.
2. **Computed Contrast Ratios (WCAG AA Compliance)**:
   * White text (`#FFFFFF`) on Deep Navy (`#0F285B`): **14.25 : 1** &rarr; **Passes AAA & AA**
   * White text (`#FFFFFF`) on Navy Dark (`#081738`): **17.67 : 1** &rarr; **Passes AAA & AA**
   * Luminous Gold (`#EDC45B`) on Deep Navy (`#0F285B`): **8.58 : 1** &rarr; **Passes AAA & AA**
   * Classic Gold (`#BE9B49`) on Deep Navy (`#0F285B`): **5.46 : 1** &rarr; **Passes AA**
   * Muted Slate (`#94A3B8`) on Navy Dark (`#081738`): **6.94 : 1** &rarr; **Passes AA**
   * Light Slate (`#E2E8F0`) on Navy Dark (`#081738`): **14.32 : 1** &rarr; **Passes AAA & AA**
   * **Navy Dark (`#081738`) text on Gold Button Gradient**:
     * Darkest stop (`#8D7338` at 0% edge): **3.89 : 1** (Passes WCAG AA for bold/large text $\ge 3.0:1$).
     * Text center position (`#BE9B49` to `#EDC45B`): **6.77 : 1** to **10.63 : 1** &rarr; **Passes WCAG AAA & AA**.

---

## 7. Section F: Component Contract & Clean TypeScript Requirements

1. **Interface Contract**:
   * The `HeaderProps` interface remains strictly unchanged:
     ```typescript
     interface HeaderProps {
       currentView: string;
       onNavigate: (view: string) => void;
     }
     ```
   * `Frontend/src/App.tsx` continues to pass `currentView={currentView}` and `onNavigate={handleNavigate}`.
2. **Clean TypeScript Compilation**:
   * Unused imports (`Globe`, etc.) and unused state variables (`langOpen`, `currentLang`) left behind by the removal of the language toggle and announcement text must be deleted so that `tsc` compiles with zero warnings and zero errors.

---

## 8. Section G: Implementation Details (Phases 1–3)

### Phase 1: Reconcile Navigation Structure, Top Bar & Clean Dead Code
**Rationale:** Apply approved user decisions to `Header.tsx`: remove announcement text, language toggle, and top-bar Sign In link; retain direct contacts and Help Center; apply approved menu titles and labels; eliminate dead non-home branching; maintain `HeaderProps` contract; purge unused imports and state.

**Phase 1 Checklist:**
- [x] Top utility bar: Remove announcement text (not present in `BRAND_GUIDELINES.md`).
- [x] Top utility bar: Remove language toggle dropdown (`EN`/`AM`) for now (no scope requirement; avoids non-functional control).
- [x] Top utility bar: Remove lightweight Sign In link (eliminates duplicate CTA with main Login button).
- [x] Top utility bar: Retain direct contact channels (Phone `+251 960 606 042`, Email `info@odsglobal.net`, Telegram, WhatsApp) and `"Help Center"` (`#contact`).
- [x] Main navigation: Keep top-level menu title as `"Gifting ▾"` (containing approved items: `"Gift Cards"`, `"Purchase Gift Cards"`, `"Redeem Gift Cards"`, `"Individual Gifts"`, `"Corporate Gifts"`, `"Ethiopian Diaspora"`).
- [x] Main navigation: Retain `"Services ▾"` with 9 categories + `"All Services"` (known limitation: all scroll to `#services`).
- [x] Main navigation: Retain `"How It Works"` (`#how-it-works`), `"For Businesses ▾"` (`"For Merchants"`, `"For Service Providers"`), and `"About Us ▾"` (`"About ODS Global Net"`, `"Our Network"`, `"Contact Us"`).
- [x] Main navigation: Confirm `Blog`, `Programs`, and `Request Service` remain deferred with zero broken routes.
- [x] Refactor `handleLinkClick` to remove dead non-home branching and `setTimeout`, using direct `scrollIntoView`.
- [x] Update search overlay query index to match these exact 9+1 services and 6 gifting items.
- [x] Ensure `HeaderProps` interface remains strictly unchanged (`currentView: string; onNavigate: (view: string) => void`).
- [x] Delete all unused imports (`Globe`, etc.) and unused state variables (`langOpen`, `currentLang`) left by the removals so `tsc` passes with zero errors or warnings.

### Phase 2: Accessibility Refactor & Color Tokenization
**Rationale:** Implement the W3C Disclosure Pattern and replace hard-coded colors with tokens/`color-mix()`.

**Steps:**
- [x] Replace `role="menu"` / `role="menuitem"` with disclosure `<button aria-expanded aria-controls>` pattern on all dropdowns.
- [x] Bind `aria-expanded` and `aria-controls` to the mobile toggle and drawer panel.
- [x] Replace remaining hard-coded colors with CSS variables or `color-mix()` expressions per Section D.
- [x] Ensure visible focus outline (`var(--color-gold-bright)`) on all interactive buttons and links.

### Phase 3: Build Verification & Documentation Audit
**Rationale:** Validate Section 1 Line 15 ("Verify all menus and navigation links") ensuring every item resolves to a working destination, and update documentation.

**Steps:**
- [x] Execute `npm run build` in `./Frontend` (`tsc && vite build`).
- [x] Verify every menu link and drawer link maps to an existing DOM anchor (`hero`, `services`, `how-it-works`, `gifting`, `for-merchants`, `for-providers`, `about`, `ecosystem`, `contact`) or view (`login`, `register`).
- [x] Log the token border deviation (`--color-border-dark: #1a3875`) into `Status/PROJECT_STATUS.md`.
- [ ] Complete manual browser verification across desktop, 960px, 860px/768px, and keyboard navigation.
- [ ] Update this plan file to `Completed` with all checked-off boxes upon final user sign-off.

---

## 9. Section H: Final Decisions Summary (Approved by User)

1. **Service Categories**: **Option 1A** &rarr; 9 Authoritative Provider Categories from Scopes Section 4 (`Hospitals`, `Clinics`, `Pharmacies`, `Laboratories`, `Wellness Centers`, `Ambulance Services`, `Home Care`, `Specialists`, `Diagnostic Centers`) + `"All Services"`.
2. **Unique Menu Items**: **Modified Option 2A** &rarr; Keep `"How It Works"` and `"For Businesses"`. Defer `"Blog"`, `"Programs"`, and `"Request Service"` (no real destination pages yet). Support label is `"Help Center"`.
3. **Design Token Drift**: **Option 3A** &rarr; Keep `tokens.css` unchanged; log `--color-border-dark: #1a3875` as an accepted deviation in `Status/PROJECT_STATUS.md`.
4. **Language Toggle**: **Removed for now** &rarr; No scope requirement, and a non-functional control conflicts with Section 1 Line 15 ("Verify all menus") and Line 24 ("Zero broken pages").
5. **Top Bar Announcement Text**: **Removed** &rarr; Not present in `BRAND_GUIDELINES.md`.
6. **Top Bar Sign In**: **Removed** &rarr; Eliminates visual duplication with main `Login` CTA button.
7. **Direct Contacts**: **Kept** &rarr; Phone, Email, Telegram, WhatsApp shortcuts retained.
8. **Interactive Search**: **Kept** &rarr; Indexes the finalized menu items and services.
9. **Gifting Menu Title & Items**: Top-level menu title is **`"Gifting ▾"`** (not `"Gift Cards ▾"`), containing approved items: `"Gift Cards"`, `"Purchase Gift Cards"`, `"Redeem Gift Cards"`, `"Individual Gifts"`, `"Corporate Gifts"`, `"Ethiopian Diaspora"`.
10. **Business Menu Items**: Kept as `"For Merchants"` and `"For Service Providers"`.
11. **Component Contract & Clean TypeScript**: The `HeaderProps` interface stays strictly unchanged (`currentView: string; onNavigate: (view: string) => void` as passed by `App.tsx`); all unused imports (`Globe`, etc.) and unused state variables (`langOpen`, `currentLang`) left by feature removals are deleted so that `tsc` passes without errors or warnings.

---

## Verification Checklist
- [x] All phase steps completed (manual browser verification passed on desktop, ~900px touch emulation, and mobile)
- [x] Tests / build checks pass (`npm run build` exits 0 with no TypeScript errors)
- [x] Section 1 Line 15 verified: every menu link and navigation target resolves to a working destination
- [x] Visual and keyboard responsiveness verified in live browser
- [x] No unintended side effects on unrelated components or global styles
- [x] Computed WCAG AA color contrast validated against dark navy background (visual confirmation passed)
- [x] Documentation in `./Status/PROJECT_STATUS.md` updated to reflect changes
- [x] Implementation Plan file updated with checked-off boxes and final Status

---

## Approval
**Approval status:** Approved  
**Approved by:** User  
**Approval phrase received:** "Approved: proceed"  
**Approval message:** Received on user message prompt ("Approved: proceed")  

---

## Post-Execution Notes
1. **Source Changes Executed**: Modified [`Frontend/src/components/layout/Header.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Frontend/src/components/layout/Header.tsx):
   - Removed announcement text, language toggle, and top utility bar Sign In link.
   - Retained direct contact links and Help Center button.
   - Implemented W3C Disclosure pattern (`<button aria-expanded aria-controls>` with `<ul>`/`<li>`) across all dropdown menus.
   - Enforced menu title `"Gifting ▾"` with 6 approved items.
   - Replaced all hard-coded colors with tokens or dynamic `color-mix()` expressions.
   - Purged unused import (`Globe`) and states (`langOpen`, `currentLang`).
2. **Build Verification**: Executed `npm run build` in `Frontend/`:
   ```text
   > ods-global-network-frontend@1.0.0 build
   > tsc && vite build

   vite v6.4.3 building for production...
   transforming...
   ✓ 1602 modules transformed.
   rendering chunks...
   computing gzip size...
   dist/index.html                   0.65 kB │ gzip:  0.39 kB
   dist/assets/index-Ch5xRqlD.css    3.73 kB │ gzip:  1.38 kB
   dist/assets/index-U1wn0oi6.js   324.07 kB │ gzip: 79.81 kB
   ✓ built in 7.95s
   ```
   Exit code: 0. Zero TypeScript errors or warnings.
3. **Link & Anchor Verification (Scope Section 1 Line 15)**:
   - All 9 DOM anchors (`#hero`, `#services`, `#how-it-works`, `#gifting`, `#for-merchants`, `#for-providers`, `#about`, `#ecosystem`, `#contact`) exist in active code.
   - All CTA and auth actions (`login`, `register`) map to active application routes via `onNavigate`.
4. **Manual Browser Verification Passed**:
   - Confirmed by user testing:
     - Desktop: dropdown click-only activation, outside click dismissal, Tab focus traversal and Escape focus restoration pass.
     - ~900px touch emulation: smooth dropdown toggle, no stuck hover states, outside tap dismissal pass.
     - Mobile: drawer opens cleanly, hierarchical accordion collapse/drawer dismiss on Escape pass, focus returns to hamburger button.

