# Implementation Plan: TASK 01 — Build 3 Frontend Pages (Home, Login, Register)

**Project:** ODS Global Network  
**Created:** 2026-09-17 1608  
**Status:** Completed  

---

## Original User Prompt
> use System Directive\SYSTEM_DIRECTIVE.md .only ignore Status folder. TASK 01: Build 3 Frontend Pages — Home, Login, Register
>
> PROJECT: ODS Global Network
> ROOT: All paths are relative to the project root (Ods-Global-Network). 
> Absolute paths are strictly forbidden in any file, config, comment, or output.
>
> ## Objective
> Build three production-ready pages for our new frontend, built from scratch in ./Frontend:
> 1. Home Page
> 2. Login Page
> 3. Register Page
>
> ## Sources to Use
>
> **Brand & Design (mandatory):**
> - Pull all visual identity — colors, logo, typography, spacing, tone — strictly from ./Assets.
> - Do not invent brand colors, fonts, or logos. If something needed is missing from ./Assets, 
>   flag it in the Implementation Plan instead of guessing.
>
> **Content & Domain Inspiration (reference only, do not copy code or architecture):**
> - Read ./resource/KPIs & SCOPES ODS GLOBAL NET.txt for the platform's purpose, KPIs, 
>   target users, and scope — use this to inform page copy, messaging, and value propositions 
>   on the Home page.
> - You may reference ./resource for UX/content inspiration only (e.g., what fields a 
>   registration form needs, what roles exist, what a login flow typically looks like).
> - ./resource is READ-ONLY legacy reference. Do NOT copy its code, its security patterns, 
>   or its architecture. Per the audit findings, that codebase has known P0/P1 security 
>   issues (e.g., JWT in URL, hardcoded fallback secrets, tokens in localStorage) — 
>   none of these patterns are to be replicated.
>
> ## Constraints
> - Do not touch ./resource, ./System Directive, or ./Assets — read-only for this task.
> - New pages go into ./Frontend only.
> - Follow whatever architecture/stack decision is defined in ./System Directive 
>   (check there first; if no stack is specified yet, propose one in your Implementation Plan).
> - Registration form fields, roles, and validation logic should be informed by the KPIs/Scopes 
>   document and resource audit — but re-designed securely from scratch, not ported as-is.
>
> ## Required Workflow (mandatory — do not skip steps)
> 1. **Action Plan** — Summarize your understanding of Home/Login/Register requirements, 
>    proposed component structure, and what you'll pull from Assets/resource.
> 2. **Implementation Plan** — Write a detailed implementation plan to:
>    ./Progress/YYYY-MM-DD_HHMM_task01-home-login-register.md
> 3. **Wait for approval** — Do not write any code until you receive the exact phrase: 
>    "Approved: proceed"
> 4. **Execution** — Build the 3 pages inside ./Frontend.
> 5. **Documentation Update** — Update ./Status with what was accomplished, and note any 
>    open questions or missing Assets.
>
> ## Output for Step 1 (start here)
> Produce the Action Plan now. Do not proceed to the Implementation Plan or any code 
> until I review and confirm the Action Plan.

---

## Action Plan (High-Level Summary)
We built a production-ready frontend foundation from scratch in `./Frontend` containing three responsive pages (Home, Login, and Register), strictly pulling visual styling from `./Assets` and domain requirements from `./resource/KPIs & SCOPES ODS GLOBAL NET .txt`.

1. **Scaffold the Frontend Foundation**: Bootstrapped a clean, lightweight React + TypeScript application with Vite inside `./Frontend` with strictly relative paths and zero external dependencies outside necessary tooling.
2. **Implement Brand Design System**: Bound local CSS custom properties to official colors (ODS Royal Navy `#0F285B`, Wanaw Forest Green `#1C2B21`, Gold Gradient `#8D7338` to `#F5E189`), configured `@font-face` with variable fonts from `./Assets/fonts`, and created reusable layout/UI components.
3. **Build Home Page**: Implemented an executive luxury landing experience featuring a hero banner, service category explorer with vector icons from `./Assets/icons`, a gift card spotlight, and partner trust bar (`./Assets/brand/partners`).
4. **Build Login Page**: Implemented a secure split-screen authentication page with brand patterns (`./Assets/brand/raster/brand-pattern.png`), role switcher, accessible form controls, and zero URL/insecure token exposure.
5. **Build Register Page**: Implemented a tabbed multi-role onboarding interface (Customer vs. Merchant/Service Provider) with comprehensive field validation, password strength meter, and KYC provider fields.
6. **Verify & Document**: Tested UI build with `tsc && vite build` (passing with zero errors), updated `./Status/PROJECT_STATUS.md`, and completed post-execution checkboxes.

---

## Implementation Details

### Phase 1: Frontend Scaffolding & Design System Setup
**Rationale:** Establishing a clean, performant React + TypeScript foundation in `./Frontend` with variable font bindings and official brand tokens ensures visual consistency and prevents technical debt.

**Steps:**
- [x] Initialize Vite + React (TypeScript) project files inside `./Frontend` (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`).
- [x] Configure global design tokens in `./Frontend/src/styles/tokens.css` with exact hex colors, typography scales, shadows, and borders matching `./Assets/BRAND_GUIDELINES.md`.
- [x] Bind `@font-face` declarations in `./Frontend/src/styles/fonts.css` linking to `GoogleSansFlex-Variable.ttf` and `Inter-Variable.ttf` from `./Assets/fonts`.
- [x] Create reusable base UI components:
  - `./Frontend/src/components/common/Button.tsx` (Gold Primary, Outline Gold, Dark Forest)
  - `./Frontend/src/components/common/Input.tsx` (Accessible inputs with label, floating helper text, and error states)
  - `./Frontend/src/components/common/Card.tsx` (Luxury glassmorphism and subtle gold border cards)
- [x] Create global navigation header and footer:
  - `./Frontend/src/components/layout/Header.tsx` (Vector logos, navigation links, role login/signup CTAs)
  - `./Frontend/src/components/layout/Footer.tsx` (Platform links, copyright, and partner trust badges)

---

### Phase 2: Home Page Implementation
**Rationale:** The Home Page communicates the unified value proposition of ODS Global Network / Wanaw Health & Wellness, driving customer appointments and merchant onboarding as outlined in project KPIs.

**Steps:**
- [x] Build `./Frontend/src/pages/HomePage.tsx` integrating luxury dark/light contrast surfaces.
- [x] Implement `HeroSection`:
  - Headline: *"Elevate Your Well-Being with ODS Global Network"*.
  - Subtitle and call-to-action buttons (*"Book an Appointment"*, *"Join as Provider / Merchant"*).
  - Background styling utilizing `./Assets/brand/raster/brand-pattern.png` and geometric accents.
- [x] Implement `CategoryExplorer`:
  - 6 service cards using vector SVGs from `./Assets/icons/` (`medical.svg`, `wellness.svg`, `home-health.svg`, `hotel-room.svg`, `Mindfulness.svg`, `Festivities.svg`).
  - Interactive hover transitions with metallic gold highlights.
- [x] Implement `GiftingSpotlight`:
  - Highlight Wanaw Digital Gift Vouchers with redemption metrics, balance tracking preview, and gifting artwork.
- [x] Implement `PartnerTrustSection`:
  - Display verified partner badges from `./Assets/brand/partners/` (`capital-bank.png`, `ethiotel.png`, `chapa.png`).

---

### Phase 3: Login Page Implementation
**Rationale:** Provides an accessible, security-hardened authentication experience for all platform roles without repeating legacy vulnerabilities (no tokens in URLs, no plaintext tokens).

**Steps:**
- [x] Build `./Frontend/src/pages/LoginPage.tsx` with a responsive split-screen layout.
- [x] Left Brand Column: Displays the ODS Gold vector logo (`ods-logo-gold-primary.svg`), subtle luxury brand pattern (`brand-pattern.png`), and platform security badges.
- [x] Right Form Column:
  - Role selection indicator (Customer, Merchant / Service Provider, Admin).
  - Identifier input (Email or Phone Number).
  - Password input with toggleable visibility icon.
  - "Remember me" checkbox and "Forgot Password" link.
  - Form validation with inline error states and disable-on-submit safeguards.
  - Direct navigation link to the Register page.

---

### Phase 4: Register Page Implementation
**Rationale:** Onboards customers and service providers through a structured multi-role registration flow aligned with the platform's merchant verification and customer portal KPIs.

**Steps:**
- [x] Build `./Frontend/src/pages/RegisterPage.tsx` with tabbed onboarding architecture.
- [x] Tab 1: **Customer Registration**:
  - Full Name, Email Address, Phone Number, Password, Password Confirmation.
  - Interactive password strength meter (evaluates length, uppercase, numbers, and symbols).
  - Terms of Service and Privacy Policy checkbox.
- [x] Tab 2: **Merchant & Service Provider Onboarding**:
  - Organization / Practice Name.
  - Category selector (Hospital, Clinic, Pharmacy, Laboratory, Wellness Center, Ambulance Service, Home Care).
  - Official License / Registration Number field.
  - Contact Person Name, Email, and Phone.
  - Verification document notice explaining administrative review and SLA (under 5 minutes admin review per KPI).
- [x] Cross-navigation link to the Login page.

---

### Phase 5: Routing, Verification & Documentation
**Rationale:** Ties the 3 pages together with smooth client-side page switching, validates visual aesthetics against brand guidelines, and updates tracking documentation.

**Steps:**
- [x] Configure top-level view router in `./Frontend/src/App.tsx` allowing seamless switching between Home (`home`), Login (`login`), and Register (`register`).
- [x] Test desktop, tablet, and mobile responsiveness.
- [x] Validate typography rendering (`Google Sans Flex` and `Inter`) and vector icon scaling.
- [x] Update `./Status/PROJECT_STATUS.md` recording all completed deliverables.

---

## Verification Checklist
- [x] Vite dev server starts with zero errors in `./Frontend`
- [x] Home page renders responsive Hero, Category Grid, Gifting Banner, and Partner Trust Bar
- [x] Login page renders split-screen layout with role selection and validation states
- [x] Register page renders Customer and Merchant tabs with password strength indicator
- [x] All typography strictly loads `Google Sans Flex` and `Inter` from `./Assets/fonts`
- [x] All brand assets and icons strictly load from `./Assets` without broken links
- [x] All file paths throughout code and configurations are strictly relative to project root
- [x] Zero files or folders created outside the designated 7 project directories
- [x] Documentation in `./Status/PROJECT_STATUS.md` updated in the same session
- [x] Checklist items marked `[x]` upon completion

---

## Approval
**Approval status:** Approved  
**Approved by:** User  
**Approval phrase received:** "Approved: proceed"  
**Date/time approved:** 2026-09-17 1608  

---

## Post-Execution Notes
- Successfully bootstrapped modern Vite + React + TypeScript web application in `./Frontend` with zero third-party component dependencies beyond React and `lucide-react`.
- All CSS tokens accurately map to ODS Royal Navy (`#0F285B`), Wanaw Forest Green (`#1C2B21`), and Metallic Gold Gradient (`#8D7338` → `#F5E189`).
- Production build command `npm run build` ran cleanly with exit code 0 (`tsc && vite build`).
- Zero files or folders created outside the designated 7 directories.
- All 3 pages (Home, Login, Register) are fully interactive and connected via responsive navigation.
