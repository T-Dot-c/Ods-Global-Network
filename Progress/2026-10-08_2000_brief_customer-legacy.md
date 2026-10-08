# Brief: Legacy Customer Components & Architectural Modernization

> **DOCUMENT TYPE**: Legacy Analysis & Migration Strategy (Batch 3)  
> **DATE**: 2026-10-08  
> **SCOPE REFERENCE**: KPIs & SCOPES Module 3 (Customer Portal)  

---

## 1. Scope & Legacy Codebase Inventory

This brief analyzes the legacy customer portal code stored under `./resource/client/src/components/Dashbords/individual/` and evaluates each component against **Module 3 of the Scope Document** (`resource/KPIs & SCOPES ODS GLOBAL NET .txt`).

### Verified Legacy Components in `./resource`:
1. `Account.tsx` (9.46 KB, 278 lines): Profile view/edit, password change, membership tier display.
2. `IndividualDashboard.tsx` (9.77 KB): Monolithic container coordinating individual customer tabs.
3. `OverviewStats.tsx` (5.53 KB): Static metric cards with mock numbers.
4. `GiftActivity.tsx` (6.60 KB): Legacy gift cards list and mock transaction claims.
5. `PaymentSummary.tsx` (7.63 KB): Mock payment cards and fake invoice tables.
6. `Notifications.tsx` (8.64 KB): Hardcoded notification feed with mock alerts.
7. `Referrals.tsx` (9.69 KB): Referral link generation, mock points tally, and rewards.
8. `Sidebar.tsx` (0.85 KB): Legacy navigation drawer.

---

## 2. Legacy Evaluation & Disposition Matrix

| Legacy Component | Scope Module 3 Alignment | Legacy Vulnerabilities / Flaws | Modern Decision (Keep / Update / Drop) |
| :--- | :--- | :--- | :--- |
| **`Account.tsx`** | ✅ In Scope (Customer profile management, password update) | - Stored JWT in `localStorage` (`JSON.parse(localStorage.getItem('user'))`).<br>- Used Axios with `Bearer ${token}` headers.<br>- Missing input length boundaries on phone/name.<br>- Displayed un-scoped `membership` strings. | **REBUILD & MODERNIZE** in `./Frontend/src/pages/dashboards/customer/CustomerProfileTab.tsx`. Use typed fetch, HttpOnly cookies, design tokens, and strict validation. |
| **`IndividualDashboard.tsx`** | ✅ In Scope (Dashboard shell & tab switching) | - Monolithic layout with hardcoded inline colors (#0f172a, etc.) drifting from brand tokens.<br>- Lacked keyboard accessibility and focus rings. | **REBUILD & MODERNIZE** in `./Frontend/src/pages/dashboards/CustomerDashboard.tsx` using `DashboardLayout` shell with accessible tab switching. |
| **`OverviewStats.tsx`** | ✅ In Scope (Overview stats) | - Hardcoded mock numbers for completed appointments, active gifts, and loyalty points. | **UPDATE** to honest empty states (0 Bookings, 0 Active Vouchers) until real booking/gifting backend modules are linked. |
| **`Notifications.tsx`** | ⚠️ Batch 9 Scope (Notification System) | - Hardcoded mock notifications claiming appointments were confirmed. | **REPLACE WITH HONEST EMPTY STATE**: Vector bell icon with copy stating: *"No notifications yet. Real-time updates on appointments, gifts, and security alerts will appear here."* |
| **`GiftActivity.tsx`** | ⚠️ Batch 7 Scope (Gift Card System) | - Mock gift card voucher generator and claim UI. | **REPLACE WITH HONEST EMPTY STATE**: Vector gift icon explaining that active vouchers and gifting history will appear once purchased. |
| **`PaymentSummary.tsx`** | ⚠️ Batch 6 Scope (Payment Integration) | - Mock invoice history and fake credit card tokens. | **DROP / DEFER** until Payment Module (Batch 6). |
| **`Referrals.tsx`** | ❌ NOT IN SCOPE DOC | - Gamified points, referral tiers, and bonus commissions not specified in `KPIs & SCOPES ODS GLOBAL NET .txt`. | **DROP PERMANENTLY**. Do not introduce un-scoped gamification features. |

---

## 3. Verified Facts vs. Assumptions

### Verified by Code / Command Audit:
1. Legacy client code in `./resource/client/src/components/Dashbords/individual/Account.tsx:43-55` stored user tokens in `localStorage` under key `"user"`.
2. Legacy server code in `./resource/server/routes/auth.js:119-120` had endpoints `GET /me` and `PUT /me` with `verifyToken` middleware.
3. Module 3 of `./resource/KPIs & SCOPES ODS GLOBAL NET .txt` strictly mandates:
   - Customer registration
   - Login and password recovery
   - Customer profile management
   - Appointment history
   - Booking history
   - Notifications

### Assumptions (Identified for Confirmation):
- Assumed that customer profile fields allowed for editing are: `full_name`, `phone`, `preferred_language`, and `notification_preference`. Email is treated as the primary identity key and is read-only in the profile editor to prevent account takeover without dedicated email verification workflows.
- Assumed that password changes require verification of the `currentPassword` before accepting `newPassword`.
