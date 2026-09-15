# Implementation Plan: Role-Based Authentication from Landing Page to Dashboards & Multi-Project Runner

**Project:** ODS Global Network  
**Created:** 2026-09-15 09:10  
**Status:** Pending Approval  

---

## Original User Prompt
> from the landing page to Dashboard all roles are separated by email and password run all the projects

---

## Action Plan (High-Level Summary)
1. **Role-Based Authentication & Session Architecture**:
   - Establish a centralized auth and role management system supporting the three core ODS network roles:
     - **Admin** (`admin@ods.global` / `Admin@123`) -> Redirects to System Administration & Merchant Approval Queue (`/merchant/approval` or Port `3000`).
     - **Provider / Merchant** (`provider@ods.global` / `Provider@123`) -> Redirects to Merchant Operations Dashboard (`/merchant/dashboard` or Port `3001`).
     - **Customer / Diaspora Member** (`customer@ods.global` / `Customer@123`) -> Redirects to Customer Health Profile Hub (`/customer/profile` or Port `3002`).
   - Allow dynamic email/password authentication with smart role detection or explicit role tabs, complete with one-click demo credentials for easy reviewer evaluation.
   - Persist role sessions in `localStorage` (`currentUser`, `userRole`, `token`), enabling automatic session recovery, personalized dashboard redirects, and a quick sign-out capability.

2. **Landing Page & Navigation Integration**:
   - Update the Landing Page (`client/src/App.tsx`) with an interactive "Role Access & Login" portal modal / section:
     - Dedicated Sign In modal or panel triggered from the Hero banner or navigation.
     - Role quick-access cards showing credentials for Admin, Provider, and Customer with "Quick Login" buttons.
     - When logged in, landing page displays active user profile card with direct "Enter [Role] Dashboard" action button and "Sign Out" button.
   - Update `Layout.tsx` navbar to display the authenticated role status, avatar badge, active role indicator, and sign-in / sign-out controls.
   - Update `CustomerAuthRecovery.tsx` (the `/customer/login` route) to support the unified multi-role credentials or route appropriately.

3. **Install Dependencies & Run All Projects**:
   - Run `npm install` in `client/` to install all required dependencies (`react`, `react-dom`, `react-router-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `vite`, `concurrently`, `typescript`).
   - Launch `npm run dev:all` to run all four Vite projects simultaneously:
     - **Unified Main Portal**: `http://localhost:5173`
     - **Admin Portal**: `http://localhost:3000`
     - **Provider Portal**: `http://localhost:3001`
     - **Customer Portal**: `http://localhost:3002`
   - Verify that each portal runs and that role-based redirection works seamlessly from the landing page.

---

## Implementation Details

### Phase 1: Authentication & Role Context
**Rationale:** Centralize authentication, role determination, session persistence, and logout capabilities so all pages and portals can interact with role-based state consistently.

**Steps:**
- [ ] Create `client/src/context/AuthContext.tsx` with role definitions (`admin`, `provider`, `customer`), login/logout methods, and credential verification.
- [ ] Create `client/src/components/common/RoleLoginModal.tsx` for easy modal or page-level login with role-specific tab selection and one-click demo credentials.

### Phase 2: Landing Page & Layout Role Separation
**Rationale:** Connect the landing page directly to role-separated dashboard routing so users signing in with role email/password are guided directly to their respective role dashboard.

**Steps:**
- [ ] Wrap `client/src/App.tsx` with `AuthProvider`.
- [ ] Add role login trigger, interactive role login cards, and authenticated user dashboard button on `HomePage`.
- [ ] Update `client/src/components/Layout.tsx` with active user profile bar, current role badge, and Sign In / Sign Out actions.
- [ ] Update `client/src/components/CustomerManagement/CustomerAuthRecovery.tsx` to integrate with `AuthContext` and route to the corresponding dashboard.

### Phase 3: Dependency Installation & Multi-Project Runner
**Rationale:** Ensure all required npm packages are installed and launch the concurrent dev server runner to serve all 4 portals.

**Steps:**
- [ ] Run `npm install` in `client/`.
- [ ] Run `npx tsc -b --noEmit` to verify type safety across all apps.
- [ ] Run `npm run dev:all` to start all projects on ports 5173, 3000, 3001, and 3002.
- [ ] Test and verify role login and redirects in browser.

---

## Verification Checklist
- [ ] All phase steps completed
- [ ] Email & password authentication separates roles (Admin, Provider, Customer)
- [ ] Logging in as Admin navigates to Admin Dashboard / Approvals Queue
- [ ] Logging in as Provider navigates to Provider / Merchant Operations Dashboard
- [ ] Logging in as Customer navigates to Customer Profile Hub
- [ ] Landing page reflects authenticated status and allows 1-click dashboard entry or sign-out
- [ ] All 4 dev server projects run concurrently (`dev:all`) on ports 5173, 3000, 3001, 3002
- [ ] Documentation updated in `System Directives files/`

---

## Approval
**Approval status:** Pending  
**Approved by:** Pending  
**Approval phrase received:** Pending (requires: "Approved: proceed")  
**Date/time approved:** Pending  

---

## Post-Execution Notes
*(To be populated after execution)*
