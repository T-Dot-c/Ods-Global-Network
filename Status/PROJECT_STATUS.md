# ODS Global Network — Current Project Status

> **LAST UPDATED**: 2026-10-08  
> **CURRENT STAGE**: BATCH 3 Complete — Customer Portal & Security Baseline (Module 3 & Initial Module 10)  
> **OVERALL HEALTH**: ON TRACK 🟢  

---

## 1. Directory Structure & Roles

| Folder | Status | Role & Duty |
| :--- | :--- | :--- |
| **`./resource`** | ✅ Locked | Read-only reference of legacy architecture, schemas, and routes. Never modified. |
| **`./Frontend`** | 🚀 Active | Main client application (React 18 + TypeScript + Vite). Home, Login, Register, Public Info pages, and Customer Dashboard with live Profile and Security tabs. |
| **`./Backend`** | 🚀 Active | Main server API workspace (Express.js + PostgreSQL 18 with connection pooling, bcrypt, RBAC middleware, audit logging, and secure session cookies). |
| **`./System Directive`** | ✅ Active | Non-negotiable architectural, security, design, and domain mandates. |
| **`./Progress`** | ✅ Active | Stores all implementation plans, roadmap phase tracking, and directive outputs. |
| **`./Assets`** | ✅ Organized | Standardized brand vectors, rasters, variable web fonts, partner badges, and official PDF manual. |
| **`./Status`** | ✅ Active | Real-time progress dashboard and completed milestone logs. |

---

## 2. Completed Milestones

### TASK 01: Frontend Pages (Home, Login, Register)

- [x] **Frontend Architecture**: Initialized clean Vite + React + TypeScript in `./Frontend`.
- [x] **Design Tokens**: Configured `./Frontend/src/styles/tokens.css` with exact hex palette matching `ODS_BRAND_GUIDELINE.pdf` (`#0F285B` Deep Navy background, `#081738` dark shade, `#BE9B49` Gold, `#EDC45B` luminous gold).
- [x] **Typography**: Bound variable fonts `Google Sans Flex` and `Inter` via `@font-face` in `./Frontend/src/styles/fonts.css`.
- [x] **Reusable UI**: Built `Button.tsx`, `Input.tsx`, `Card.tsx`, `Header.tsx`, and `Footer.tsx`.
- [x] **Home Page (`./Frontend/src/pages/HomePage.tsx`)**:
  - Implemented the official 17-section ODS Global Net content architecture:
    1. Hero Section ("Connecting People, Businesses, and Services in One Digital Platform.")
    2. Introduction / About ODS Global Net ("A Smarter Way to Access and Manage Services")
    3. How ODS Global Net Works (01 Discover, 02 Book, 03 Pay, 04 Manage)
    4. Services & Provider Categories (9 categories: Hospitals, Clinics, Pharmacies, Labs, Wellness, Ambulance, Home Care, Specialists, Diagnostic Centers)
    5. For Customers (9 customer features & benefits)
    6. For Merchants (9 business digital management capabilities)
    7. Service Provider Network (5 provider enterprise benefits)
    8. Appointment Booking (8 seamless booking features)
    9. Payments (5 payment methods with settlement gateways)
    10. Gift Cards (ODS digital vouchers & balance management)
    11. One Connected Platform (Customers, Merchants, Providers, Administrators)
    12. Platform Management (9 centralized administrative capabilities)
    13. Security & Trust (7 enterprise security controls)
    14. Notifications (Email, SMS, Push Notification channels)
    15. Why ODS Global Net (4 key pillars)
    16. Call to Action (Customer, Merchant, Provider registration paths)
    17. Final Homepage CTA ("Discover. Connect. Book. Pay. Manage.")
  - Implemented multi-tier luxury header architecture:
    - Top utility bar with welcome badge, Help Center, Contact Us, Language selector (EN ▾), and lightweight Login link.
    - Brand wordmark with subtitle tagline ("Connected Services. One Platform.").
    - Interactive dropdown navigation (Services ▾, How It Works, Gifting ▾, For Businesses ▾, About Us ▾).
    - Dual conversion action buttons (Login & Get Started → Register).
    - Full mobile responsive drawer with accordions for all sub-menus.
  - Configured Footer with comprehensive contact details and smooth anchor targeting.
- [x] **Login Page (`./Frontend/src/pages/LoginPage.tsx`)**:
  - Split-screen brand layout with geometric pattern backdrop (`brand-pattern.png`).
  - Streamlined single sign-in flow with automatic portal role detection (Customer, Provider, Admin) directly from credentials.
  - Removed manual role selector pills for frictionless user experience.
  - Password visibility toggle, remember-me session flag, and validation error states.
  - Zero token exposure in URL parameters.
- [x] **Register Page (`./Frontend/src/pages/RegisterPage.tsx`)**:
  - Implemented role-based dynamic registration system with Step 1 "Registering as ▾" role selector (Customer, Merchant, Service Provider, Business / Organization).
  - Dynamic form fields specific to each role:
    - Customer: Personal Info, Account Info, Language & Notification Preferences, Email/Phone Verification flags.
    - Merchant: Business Info, Category & Type, GPS/Location, Compliance Document Uploads, Contact Rep & Account Info.
    - Service Provider: Provider Info, Healthcare Facility Type & Services, Operating Hours, Accreditation Uploads, Contact Rep & Account Info.
    - Business / Organization: Institutional Profile, Industry, Representative Delegation, Registration Documents & Account Info.
  - Interactive live password strength indicator with color transitions.
  - Verification & compliance review notices with clean post-submission confirmation states.
- [x] **Brand Pattern Texture Uniformity**: Applied official brand pattern texture (`brand-pattern.png`, opacity 0.05, 360px grid) consistently across all 5 sections of `HomePage.tsx` with proper z-index isolation.
- [x] **Build Verification**: Executed `npm run build` with exit code 0 (`tsc && vite build`).

### TASK 02: Database Migration, Backend Auth API, RBAC & Minimalist Dashboards

- [x] **Database Layer (PostgreSQL 18 — `ods_global.net`)**:
  - Configured PostgreSQL 18 connection pool on port 5432 via `./Backend/.env`.
  - Executed all 9 schema migrations in `./Backend/migrations/`:
    - `001_create_users_table.sql` — UUID primary keys, bcrypt hashes, roles, lockouts.
    - `002_create_merchants_table.sql` — Business/merchant profiles with `pending` approval status.
    - `003_create_providers_table.sql` — Healthcare provider facilities with normalized types & check constraints.
    - `004_create_admins_table.sql` — Administrator authorization profiles.
    - `005_create_addresses_table.sql` — Shared polymorphic addresses for entities.
    - `006_create_contact_persons_table.sql` — Authorized representatives.
    - `007_create_documents_table.sql` — KYC / license compliance uploads.
    - `008_create_otp_codes_table.sql` — Phone & email OTP records.
    - `009_seed_admin.sql` — Seeded default administrator (`admin@odsglobal.net` / `admin@odsglobal.net`).
  - Added database connectivity check script (`./Backend/test-connection.js`) and `npm run db:check` command.
- [x] **Backend Authentication API (`./Backend/src/routes/auth.js`)**:
  - `POST /api/auth/register`: Atomic transaction inserting user, role profile (`merchants`/`providers`), address, and contact person with automated rollback on error.
  - `POST /api/auth/login`: Database verification with `bcrypt.compare`, progressive lockout (5 failed attempts → 15-minute lock), updates `last_login_at`, and sets secure `HttpOnly`, `SameSite=Lax` cookie (`ods_session`).
  - `GET /api/auth/me`: Session verification returning authenticated user details, assigned role, and entity approval status.
  - `POST /api/auth/logout`: Clears session cookie.
  - `GET /api/health`: Operational service health endpoint.
- [x] **Post-Registration Confirmation Card (`./Frontend/src/pages/RegisterPage.tsx`)**:
  - Replaced temporary inline notification with user-specified minimalist ASCII confirmation box design:
    - Clean checkmark icon (`✓`) and `"Registration Successful"` header.
    - Informative notice: `"Your account has been created successfully. You can now sign in using your credentials."`
    - Prominent `"Sign In →"` conversion button directing the user to `/login` without auto-login.
    - Return to Home option.
- [x] **Authentication & Role-Based Protected Routing (`./Frontend/src/pages/LoginPage.tsx` & `App.tsx`)**:
  - Login page verifies credentials against live backend database and receives user role.
  - Automated redirect to role-specific dashboard URLs:
    - Customer (`customer`) → `/dashboard`
    - Merchant (`merchant`) → `/merchant/dashboard`
    - Service Provider (`provider`) → `/provider/dashboard`
    - System Administrator (`admin`) → `/admin/dashboard`
  - URL synchronization with `window.history.pushState` and `window.addEventListener('popstate')`.
  - Client-side RBAC route protection preventing unauthorized cross-role view access.
  - Session bootstrap verification on startup via `/api/auth/me` with brand loading splash.
- [x] **Minimalist Dashboard Architecture (`./Frontend/src/pages/dashboards/`)**:
  - Implemented shared `DashboardLayout.tsx` matching user layout specifications:
    - **Top Navbar**: `ODS GLOBAL NET` wordmark, 🔔 notification bell with badge (`0`), and `[Profile ▾]` dropdown with user details and Sign Out.
    - **Left Sidebar**: Distinct navigation links per role with active gold indicator bar and bottom `Sign Out` button.
    - **Stat Cards Grid**: Responsive metric cards tailored to each role.
    - **Quick Actions**: Prominent role-specific workflow cards.
    - **Activity & Status**: Account status badge (`Pending Review`, `Active`) and activity feed.
  - Applied pure white container background (`#ffffff`) with subtle brand pattern overlay (`brand-pattern.png`, opacity `0.015`, `360px` tile) across all dashboards and `DashboardShell.tsx`.
  - Built 4 dedicated dashboard views:
    - `CustomerDashboard.tsx` (`/dashboard`): Bookings (0), Payments (0), Gift Cards (0); Quick actions: Find Services, Book Appointment, Buy Gift Card, View History.
    - `MerchantDashboard.tsx` (`/merchant/dashboard`): Services (0), Bookings (0), Customers (0); Quick actions: Manage Business, Manage Services, View Bookings, Update Availability; Approval Status badge.
    - `ProviderDashboard.tsx` (`/provider/dashboard`): Services (0), Appointments (0), Availability (`Active`); Quick actions: Manage Profile, Manage Services, View Appointments, Set Availability; Approval Status badge.
    - `AdminDashboard.tsx` (`/admin/dashboard`): 6 platform stat cards, Quick actions: Review Registrations, Manage Users, View Transactions, View Reports; System Activity.

### TASK 03: Resource Content Extraction & Navigation Alignment
- [x] **Navigation Bar (`Header.tsx`)**: Re-enabled visible `Home` navigation item, updated Top Utility Bar welcome text (`"Welcome to ODS Global Net • Connecting Healthcare, Wellness & Gifting"`), added `Ambulance Services` to `servicesMenu` (aligning all 9 authoritative categories from Section 4), verified Gifting, Business, About Us dropdowns, and responsive mobile drawer accordions.
- [x] **Homepage Content (`HomePage.tsx`)**: Populated with authentic narrative, official Mission, and Vision from `CompanyInfo.tsx`; official taglines (`"Ethiopian Blessings, Modern Gifting"`); comprehensive descriptions for all 9 provider categories; Basic vs. VIP gifting packages; Ethiopian cultural occasions & celebrations; Work With Us engagement cards; and Help Center FAQs.
- [x] **Footer Alignment (`Footer.tsx`)**: Updated brand copy, listed all 9 authoritative provider categories, verified official contact info (`+251 960 606 042`, `info@odsglobal.net`, Addis Ababa), ecosystem links, and payment gateways.
- [x] **Role Dashboards (`dashboards/`)**: Aligned stat cards and quick action labels with KPIs & Scopes Section 2, 3, 4, 5, and 8.
- [x] **Login & Register Isolation**: Verified 100% untouched (`LoginPage.tsx` & `RegisterPage.tsx`).
- [x] **Production Verification**: `npm run build` completed with exit code 0 (1602 modules transformed in 14.59s).

### TASK 04: Vibe-Code Cleanup & Production Security Audit
- [x] **Emoji to Icon Replacement**:
  - Replaced all raw functional emojis across UI components with official `lucide-react` vector icons aligned with `./Assets/BRAND_GUIDELINES.md`:
    - `RegisterPage.tsx`: Line 648 `⚠️` replaced with `<AlertTriangle size={18} color="#b45309" />`; `✓ Uploaded` text replaced with `<CheckCircle2 size={13} color="#10b981" /> Uploaded`.
    - `DashboardShell.tsx`: Line 176 `✓` / `⏳` replaced with `<CheckCircle2 size={14} />` / `<Clock size={14} />`; Line 200 `🚧` replaced with `<Construction size={28} color="var(--color-gold-bright)" />`.
    - `DashboardLayout.tsx`: Lines 43-45 `'⏳'`, `'✓'`, `'✕'` replaced with `<Clock size={14} color="#b45309" />`, `<CheckCircle2 size={14} color="#065f46" />`, `<XCircle size={14} color="#b91c1c" />`; Line 710 `📋` replaced with `<ClipboardList size={30} color="#64748b" />`.
    - `HomePage.tsx`: Lines 1317 & 1330 checkmarks replaced with `<CheckCircle2 size={14} color="var(--color-gold-bright)" />`.
- [x] **Backend Security & Input Hardening**:
  - `server.js`: Added production startup validation enforcing secure `JWT_SECRET` (at least 32 characters, non-placeholder); cleaned console log emojis.
  - `migrate.js`: Cleaned decorative console emojis into structured tags (`[Migrations]`, `[Skipped]`, `[Applied]`, `[Failed]`).
  - `auth.js`: Added RFC 5322 regex validation & max 255 chars limit for `email`; full name bounds (1-128 chars); password bounds (8-128 chars) mitigating bcrypt computational DoS; login payload bounds; and defined explicit `ALLOWED_DOCUMENT_TYPES` whitelist and validator helper for polymorphic uploads.
- [x] **Verification & Tests**:
  - `Frontend`: `npm run build` completed cleanly with exit code 0 (1602 modules, 313.03 kB JS bundle, built in 4.57s).
  - `Backend`: Syntax validated with `node -c`; `/api/health` verified 200 OK; registration input rejection verified (invalid email 400, oversized password 400, invalid role 400, oversized login 401).
  - Dependency audit: Verified 0 vulnerabilities across both `Frontend` and `Backend`.
  - Git secrets: Verified `.env` is git-ignored and never committed to repository history.

### TASK 05: Frontend Header & Navigation Bar Scope Re-baselining & Brand Alignment
- [x] **Scope Baseline Alignment (`KPIs & SCOPES ODS GLOBAL NET .txt`)**:
  - Re-baselined Header against authoritative scope document, resolving conflicts between legacy `Navbar.tsx` and official requirements.
  - Eliminated non-scoped/non-compliant elements: removed top-bar announcement text (absent from `BRAND_GUIDELINES.md`), language toggle dropdown (`EN`/`AM`, avoiding non-functional controls per Section 1 Line 15/24), and duplicate lightweight top `Sign In` link.
  - Preserved direct communication shortcuts: Phone (`+251 960 606 042`), Email (`info@odsglobal.net`), Telegram, and WhatsApp quick links, plus `"Help Center"` (`#contact`).
- [x] **Taxonomy & Category Integration**:
  - Services Menu: Bound all 9 Authoritative Provider Categories from Scopes Section 4 (`Hospitals`, `Clinics`, `Pharmacies`, `Laboratories`, `Wellness Centers`, `Ambulance Services`, `Home Care`, `Specialists`, `Diagnostic Centers`) + `"All Services"`.
  - Gifting Menu: Bound approved 6-item taxonomy under `"Gifting ▾"` title (`"Gift Cards"`, `"Purchase Gift Cards"`, `"Redeem Gift Cards"`, `"Individual Gifts"`, `"Corporate Gifts"`, `"Ethiopian Diaspora"`).
  - Business Menu: Bound `"For Businesses ▾"` (`"For Merchants"`, `"For Service Providers"`).
  - About Menu: Bound `"About Us ▾"` (`"About ODS Global Net"`, `"Our Network"`, `"Contact Us"`).
  - Kept `"How It Works"` (`#how-it-works`).
  - Deferred unbuilt routes (`Blog`, `Programs`, `Request Service`) to guarantee 100% working navigation targets.
- [x] **Design Token Deviation Audit**:
  - **Token Drift Logged**: `--color-border-dark: #1a3875` in `tokens.css` (vs `#264572` in PDF/MD) is retained as an accepted baseline deviation across the design system to preserve visual parity across 10+ UI components (`HomePage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `DashboardShell.tsx`, `Header.tsx`, `Footer.tsx`, `Input.tsx`, `Card.tsx`, `Button.tsx`).
  - Replaced all hard-coded colors in `Header.tsx` with CSS variables (`var(--color-navy-dark)`, `var(--color-border-dark)`, `var(--color-white)`, `var(--color-border-light)`, `var(--color-text-muted-dark)`) or dynamic `color-mix()` expressions (e.g. `color-mix(in srgb, var(--color-navy) 98%, transparent)`).
- [x] **Accessibility & Architecture**:
  - Replaced menu ARIA roles with the W3C Disclosure pattern (`<button aria-expanded aria-controls>` revealing `<ul>`/`<li>` lists).
  - Implemented responsive mobile drawer with sub-menu accordions, outside click handling, and `Escape` key dismiss returning focus to the hamburger button.
  - Retained strict `HeaderProps` contract (`{ currentView: string; onNavigate: (view: string) => void }`) with zero `App.tsx` regressions.
  - Purged unused imports (`Globe`) and unused state (`langOpen`, `currentLang`) for clean TypeScript compilation.
  - All navigation links verified to resolve to existing active DOM anchors or app views.
- [x] **Accessibility Refinements (Addendum Executed)**:
  - **Trigger Focus Return**: Bound 10 dedicated React refs (`servicesBtnRef`, `giftingBtnRef`, `businessBtnRef`, `aboutBtnRef`, `searchBtnRef`, `mobileToggleRef`, `mobileServicesBtnRef`, `mobileGiftingBtnRef`, `mobileBusinessBtnRef`, `mobileAboutBtnRef`) restoring programmatic focus upon `Escape` or modal close.
  - **State-Aware Hierarchical Escape**: Prioritizes search overlay &rarr; desktop dropdowns &rarr; mobile accordion submenus &rarr; mobile drawer.
  - **Click-Only Desktop Navigation**: Converted desktop dropdowns to click-only activation (removed hover `onMouseEnter`/`onMouseLeave`).
  - **Safe Blur Focus-Out**: Implemented `handleDropdownBlur` requiring non-null `relatedTarget` outside container, eliminating swallowed click events on Safari/macOS Firefox.
  - **Outside Click Dismissal**: Added document-level conditional `pointerdown` listener dismissing open overlays when clicking outside `<header>`.
  - **High-Contrast Focus Ring**: Removed inline `outline: 'none'` from search input; added `header button:focus-visible, header a:focus-visible, header input:focus-visible` with `outline: 2px solid var(--color-gold-bright); outline-offset: 2px;` in `<style>`.
- [x] **Production Build Verification**:
  - `Frontend`: `npm run build` completed cleanly with exit code 0 (`tsc && vite build`, 1602 modules, built in 4.24s).
- [x] **Manual Browser Verification**:
  - Visual and responsive layout testing (1280px desktop, ~900px touch emulation, and mobile drawer at 860px/768px), mouse click persistence without swallowed clicks, outside click dismissal, and keyboard accessibility (`Tab`, `Enter`, `Escape` focus restoration) verified and passed by user.

### BATCH 02: Public Informational & Intake Pages (`/company`, `/support`, `/partner-with-us`)

- [x] **Database Migrations (010 & 011)**:
  - `010_create_support_requests_table.sql`: Support tickets with unique 8-hex reference and status.
  - `011_create_partners_table.sql`: Partnership intake with multi-track fields, WhatsApp, and length limits.
- [x] **Backend Endpoints (`/api/support` & `/api/partners`)**:
  - `POST /api/support`: Parameterized insert, honeypot protection, 8-hex reference generator (`ODS-REQ-XXXXXXXX`) with unique collision retry logic, and neutral acknowledgment message.
  - `POST /api/partners`: Parameterized insert, allowlisted partnership types, honeypot protection, zero document upload dependency, and neutral acknowledgment message.
- [x] **Frontend Public Pages & Service**:
  - `Frontend/src/services/publicService.ts`: Centralized service with typed error classification (`network`, `validation`, `server`, `unknown`).
  - `CompanyPage.tsx` (`/company`): Corporate profile, mission & vision, 9 healthcare provider categories, and condensed Cultural Gifting card linking to home `#gifting`.
  - `SupportPage.tsx` (`/support`): Direct contact channels, support inquiry form with reference ID display, and 5 truthful FAQs compliant with today's built system state.
  - `PartnerWithUsPage.tsx` (`/partner-with-us`): 3-track intake (Investor, Strategic Partner, Sponsorship) with sector and investment fields, and document upload inputs removed.
- [x] **Routing & Navigation Wiring**:
  - `App.tsx`: Registered `company`, `support`, and `partner-with-us` routes in `View` union and route normalizer.
  - `Header.tsx`: Wired "About ODS Global Net" to `/company`, "Contact Us" to `/support`, top-bar "Help Center" to `/support`, and added "Partner With Us" to "For Businesses" dropdown, mobile drawer, and search index.
  - `Footer.tsx`: Converted "Help Center" span into active button linking to `/support`.
- [x] **Build & Test Verification**:
  - `npx tsc --noEmit` passed with 0 errors.
  - `npm run build` passed with exit code 0 (1,613 modules transformed, 11.23s).
  - All 6 backend endpoint scenarios (valid, invalid, honeypot for support & partners) verified against PostgreSQL.

### BATCH 03: Customer Portal & Security Baseline (Module 3 & Initial Module 10)
- [x] **Database Migrations (012 & 013)**:
  - `012_purge_seeded_admin_and_update_addresses.sql`: Purged default test admin (`admin@odsglobal.net`), updated `addresses.entity_type` check constraint to include `customer`, and added unique index `idx_addresses_customer_unique` on `(entity_type, entity_id)` for customer addresses.
  - `013_create_audit_logs_table.sql`: Created `audit_logs` table with composite and single column indices (`user_id`, `action`, `created_at`).
- [x] **Backend Security & Middleware (`Backend/src/middleware/auth.js`)**:
  - Implemented `requireAuth` verifying `ods_session` JWT cookie against live DB active status.
  - Implemented `requireRole(...roles)` returning HTTP 403 on role mismatch.
  - Implemented asynchronous audit service (`Backend/src/services/auditService.js`) logging auth and customer profile/password events.
  - Hardened server startup: fails immediately if `JWT_SECRET` is unset or shorter than 32 chars across all environments.
  - Added dedicated customer route rate limiter (30 req / 15 min).
  - Updated registration transaction to persist customer address (`country`, `city`) in the same atomic transaction.
- [x] **Customer API Endpoints (`Backend/src/routes/customer.js`)**:
  - `GET /api/customer/profile`: Returns customer profile data and primary address from DB.
  - `PUT /api/customer/profile`: Updates name, phone, preferences (`language_preference`, `notification_preference`), and updates/inserts address record via update-then-insert.
  - `POST /api/customer/change-password`: Validates non-empty `current_password`, enforces 8-128 char policy on `new_password`, verifies against bcrypt hash, updates password, and writes to audit log.
- [x] **Frontend Customer Portal (`Frontend/src/pages/dashboards/`)**:
  - Centralized customer API service (`Frontend/src/services/customerService.ts`).
  - Added `updateUser` to `AuthContext.tsx` to keep topbar and profile in sync immediately without full page reloads.
  - Replaced mock numeric stat cards and internal "Scheduled for Batch N" labels with honest empty states and "Not available yet" messaging.
  - Implemented live `CustomerProfileTab.tsx` with full edit form, validation, and read-only email.
  - Implemented live `CustomerSecurityTab.tsx` with live password strength meter and uniform feedback.
  - Upgraded `DashboardLayout.tsx` and `CustomerDashboard.tsx` to support tab switching across Overview, Profile, Security, Bookings, Orders, and Settings.
- [x] **Admin & Database Operations Scripts**:
  - `Backend/scripts/create-admin.js`: CLI script for securely creating administrative users with role validation.
  - `Backend/scripts/setup-limited-db-user.sql`: Production SQL script to provision least-privilege `ods_app` database user.

---

## 3. Verification & Compliance

- **PostgreSQL Migrations**: 13 of 13 migrations applied to `ods_global.net` on PostgreSQL 18.
- **Audit Logging**: Verified audit log insertion on customer registration, login, logout, profile update, and password changes.
- **TypeScript Compiler**: `npx tsc --noEmit` exited with 0 errors.
- **Production Bundle**: `npm run build` completed with exit code 0 (1,616 modules transformed in 2.78s).
- **Backend Endpoints**: Syntax checked with `node -c` (exit code 0); endpoint verification test suite created in `test-batch3-endpoints.js`.
- **Folder Confinement**: 100% of code and documentation strictly confined within the 7 designated root directories (`./Frontend`, `./Backend`, `./System Directive`, `./Progress`, `./Assets`, `./Status`, `./resource`).
- **Path Portability**: All code imports, links, and documentation paths are strictly relative to `Ods-Global-Network`.

---

## 4. Release Blockers & Security Notes

1. **Database Superuser Connection (Open)**:
   - The application currently connects as the PostgreSQL superuser.
   - Script `Backend/scripts/setup-limited-db-user.sql` has been authored to create a dedicated `ods_app` user with limited grants. This must be executed and `.env` credentials updated prior to production deployment.
2. **Admin UI Access (Open until Module 8)**:
   - The default seeded admin was purged in migration 012. Admin users can now be created via `Backend/scripts/create-admin.js`.
   - Admin login is functional via `/login`, but the full Admin management portal is scheduled for Batch 8 (Module 8).
3. **Password Change Session Invalidation (Logged Enhancement)**:
   - Old `ods_session` JWT cookies remain valid until expiration (7 days) after a password change because token revocation/versioning is not yet implemented.
4. **Rate Limiting on Password Endpoint (Logged Enhancement)**:
   - `/api/customer/change-password` is covered by the general customer router rate limit (30 req / 15 min), but does not yet have a dedicated stricter brute-force limit.
5. **Intake Visibility (Open until Batch 8 & 9)**:
   - Support requests and partnership inquiries remain visible only via direct database queries until the Admin Dashboard (Batch 8) and Notification Engine (Batch 9) are built.

---

## 5. Immediate Next Steps

1. **Batch 4: Merchant & Service Provider Onboarding (Module 4 & 5)**:
   - KYC document upload endpoint with file type and size restrictions.
   - Merchant and Service Provider profile management and operating hours.
2. **Batch 6: Service Catalog & Offerings (Module 6)**:
   - Service listing, category tagging, and pricing configuration.
3. **Batch 7: Appointment Booking Engine (Module 7)**:
   - Availability slot generation, booking creation, and collision prevention.
