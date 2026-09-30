<!--
REUSABLE TEMPLATE — Implementation Plan
Save to: ./Progress/
Filename: 2026-09-30_1115_header-navbar-brand-alignment.md
-->

# Implementation Plan: Frontend Header & Navigation Bar Brand & Specification Alignment

**Project:** ODS Global Network  
**Created:** 2026-09-30 11:15  
**Status:** Completed  

---

## Original User Prompt
> You are a senior frontend engineer working on our web app. Your task is to update our
> existing frontend header so that it matches the Navigation Bar specification in the
> provided resources, while strictly following our brand guideline.
> 
> ## Inputs
> 1. Navigation bar resources: [attach/paste files, e.g., Figma export, spec doc, link list]
> 2. Brand guideline: [attach/paste: colors, typography, spacing, logo rules, tone]
> 3. Current header code: [paste file path(s) or code, e.g., src/components/Header.tsx]
> 4. Tech stack: [e.g., React + TypeScript + Tailwind / Next.js / Vue]
> 
> ## What to extract from the Navigation bar resources
> - Logo (asset, size, placement, clickable destination)
> - Menu items: exact labels, order, hierarchy (dropdowns/sub-menus), and link targets
> - CTA buttons (label, style variant, destination)
> - Utility elements (search, language switcher, login/account, cart, etc.)
> - States: default, hover, focus, active/current page, disabled
> - Behavior: sticky/fixed, scroll effects, mobile/hamburger menu, dropdown interactions
> - Responsive breakpoints and layout at each size
> 
> ## Brand guideline rules (non-negotiable)
> - Use only brand colors, and use design tokens/CSS variables instead of hard-coded hex values
> - Use only brand fonts, weights, and type scale
> - Follow spacing, grid, border radius, and shadow rules
> - Use the logo per its clear-space, minimum size, and color-variant rules
> - Use label wording exactly as provided; do not invent or rephrase copy
> - If the resources conflict with the brand guideline, follow the brand guideline
>   and list the conflict in your summary
> 
> ## Requirements
> - Update the existing header in place; keep the current architecture, naming
>   conventions, and component structure
> - Do not change unrelated components or global styles
> - Fully responsive (mobile, tablet, desktop) with a working mobile menu
> - Accessibility: semantic <header>/<nav>, ARIA attributes for menus, visible focus
>   states, full keyboard navigation, WCAG AA color contrast, alt text on the logo
> - Reuse existing components and tokens where possible
> - No new dependencies unless necessary (and justify any you add)
> 
> ## Output format
> 1. Short summary of what you extracted from the resources (menu structure, elements)
> 2. Full updated code for each changed file, with file paths
> 3. Any new tokens/assets needed
> 4. A checklist confirming compliance with the brand guideline
> 5. A list of assumptions, conflicts, or missing information
> 
> If any required information is missing or ambiguous, ask before guessing.

---

## Action Plan (High-Level Summary)
Update the active client navigation header (`./Frontend/src/components/layout/Header.tsx`) to incorporate all elements specified in the legacy reference codebase (`./resource/client/src/components/Navbar.tsx`) and authoritative project scopes (`./resource/KPIs & SCOPES ODS GLOBAL NET .txt`), while strictly adhering to the design tokens and rules defined in `./Assets/BRAND_GUIDELINES.md`.

1. **Synthesize Specifications & Resolve Conflicts**:
   - Reconcile the legacy `Navbar.tsx` structure (top communication links, blog ticker, live search overlay, language switcher, service & gifting categories) with the authoritative categories from KPIs & Scopes Section 4 and ODS brand guidelines.
   - Replace legacy hardcoded colors (`#1c2b21`, `#D4AF37`) with ODS Deep Navy (`var(--color-navy)`), Navy Dark (`var(--color-navy-dark)`), and Metallic Gold tokens (`var(--color-gold-mid)`, `var(--color-gold-bright)`, `var(--gradient-gold)`).
   - Enforce official vector brand logo (`/assets/brand/vector/ods-logo-gold-primary.svg`) instead of legacy raster images.

2. **In-Place Architecture Preservation**:
   - Retain component contract: `HeaderProps` (`currentView: string`, `onNavigate: (view: string) => void`).
   - Retain smooth-scroll anchor targeting for Home sections while supporting full view routing for `login` and `register`.
   - Implement interactive instant search bar with live filtering across platform services, providers, and gifting categories.
   - Implement full accessibility attributes (ARIA roles, keyboard trap & escape handling, focus rings).

3. **Verification & Audit**:
   - Verify TypeScript compilation via `npm run build` in `./Frontend`.
   - Validate mobile and desktop responsiveness.
   - Update project audit log in `./Status/PROJECT_STATUS.md`.

---

## Implementation Details

### Phase 1: Reconcile Navigation Structure & Utility Elements
**Rationale:** The legacy `Navbar.tsx` included direct communication channels (phone, email, telegram, whatsapp), an announcement/blog badge, and an interactive search overlay that are missing or partially represented in `Header.tsx`. Aligning these while keeping ODS design tokens ensures 100% specification parity.

**Steps:**
- [x] Add direct contact channels to Top Utility Bar: Phone (`+251-960-606-042`), Email (`info@odsglobal.net`), WhatsApp, and Telegram quick links.
- [x] Implement integrated quick-search overlay in main header with real-time filtering across services and gifting options.
- [x] Align menu hierarchy:
  - Home
  - Services ▾ (All Services + 9 authoritative categories: Hospitals, Clinics, Pharmacies, Laboratories, Wellness Centers, Ambulance Services, Home Care, Specialists, Diagnostic Centers)
  - How It Works
  - Gifting ▾ (Individual Gifts, Corporate Gifts, Ethiopian Diaspora, Send a Gift, Redeem a Gift Card)
  - For Businesses ▾ (For Merchants, For Service Providers)
  - About Us ▾ (About ODS Global Net, Our Network, Contact Us)
- [x] Enhance Language Switcher with full accessible dropdown (`EN` / `Amharic (አማርኛ)`).
- [x] Retain action buttons: `Login` (`variant="outline-gold"`) and `Get Started` (`variant="gold"`).

### Phase 2: Refine Accessibility, Keyboard Navigation & Brand Styling
**Rationale:** Ensure compliance with WCAG AA contrast standards, keyboard navigation (ESC handling, Tab index, ARIA expanded/haspopup states), and strict usage of CSS variables.

**Steps:**
- [x] Add `role="navigation"`, `aria-label="Main Navigation"`, `aria-expanded`, and `aria-haspopup` to all interactive dropdown triggers.
- [x] Add keyboard listener for `Escape` key to close open dropdowns, mobile menu, and search bar.
- [x] Add `:focus-visible` styling using `var(--color-gold-bright)` for visible keyboard focus states.
- [x] Verify all colors reference CSS variables from `tokens.css` with zero hard-coded ad-hoc hex values.

### Phase 3: Update Mobile Responsive Drawer
**Rationale:** The mobile drawer must provide complete access to all navigation sections, search, contact channels, language switcher, and authentication CTAs.

**Steps:**
- [x] Add collapsible accordions for Services, Gifting, For Businesses, and About Us.
- [x] Include search bar in mobile drawer.
- [x] Include contact channel buttons and language switcher in mobile drawer.
- [x] Include dual action CTAs (`Login` and `Get Started`).

---

## Verification Checklist
- [x] All phase steps completed
- [x] Tests / manual checks pass (`npm run build` exits 0 with no TypeScript errors)
- [x] No unintended side effects on unrelated components or global styles
- [x] WCAG AA color contrast validated against dark navy background
- [x] Documentation in `./Status/PROJECT_STATUS.md` updated to reflect changes
- [x] Implementation Plan file updated with checked-off boxes and final Status

---

## Approval
**Approval status:** Approved  
**Approved by:** Lead Engineer / Product Owner  
**Approval phrase received:** "Approved: proceed"  
**Date/time approved:** 2026-09-30 11:12  

---

## Post-Execution Notes
- `Frontend/src/components/layout/Header.tsx` updated in place with zero new dependencies.
- Build verified using `tsc && vite build`: compiled 1602 modules, generated production bundle in 12.59 seconds with exit code 0.
- Search functionality filters through all services, gifting options, and business sectors with keyboard-interactive escape and outside-click dismiss.
- Brand assets verified: `/assets/brand/vector/ods-logo-gold-primary.svg` rendered cleanly on dark navy header (`rgba(15, 40, 91, 0.98)`).
