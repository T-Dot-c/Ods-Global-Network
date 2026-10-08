# Brief: Customer Portal UI/UX Design & Architecture

> **DOCUMENT TYPE**: Interface Design & Component Reuse Specification (Batch 3)  
> **DATE**: 2026-10-08  
> **SCOPE REFERENCE**: KPIs & SCOPES Module 3 (Customer Portal) & Brand Guidelines  

---

## 1. Customer Portal Architecture

The Customer Portal will be structured as an interactive, accessible dashboard within `Frontend/src/pages/dashboards/CustomerDashboard.tsx` utilizing the established `DashboardLayout.tsx` shell.

### Portal Navigation Tabs
1. **Overview** (`'overview'`): Key metric stats, quick navigation shortcuts, and recent activity card.
2. **My Profile** (`'profile'`): View and edit customer profile information, language, and notification channels.
3. **Security** (`'security'`): Self-service password change with strength validation and session info.
4. **Appointments** (`'appointments'`): Honest empty state for healthcare & lab bookings.
5. **Gift Cards** (`'giftcards'`): Honest empty state for digital vouchers.
6. **Notifications** (`'notifications'`): Honest empty state for user alerts and updates.

---

## 2. Form Fields, Validations & Data Model

### 2.1 Profile Management (`My Profile` Tab)

| Field Label | Database Column | Control Type | Validation Rules | Mutable? |
| :--- | :--- | :--- | :--- | :--- |
| **Full Name** | `users.full_name` | Text Input | Required, 1–128 characters, trimmed. | ✅ Yes |
| **Email Address** | `users.email` | Email Input | RFC 5322 regex format, max 255 chars. | ❌ Disabled / Read-Only (Anti-Account-Takeover) |
| **Phone Number** | `users.phone` | Tel Input | Optional, max 32 chars, international phone format (`+251...` / `+1...`). | ✅ Yes |
| **Preferred Language** | `users.preferred_language` | Select Dropdown | Whitelist: `'en'` (English), `'am'` (Amharic). | ✅ Yes |
| **Notification Channel** | `users.notification_preference` | Select Dropdown | Whitelist: `'email'`, `'sms'`, `'both'`. | ✅ Yes |
| **Account Created** | `users.created_at` | Badge / Read-only text | Formatted timestamp (e.g. `MMM DD, YYYY`). | ❌ Read-Only |
| **Last Login** | `users.last_login_at` | Badge / Read-only text | Formatted timestamp (e.g. `MMM DD, YYYY HH:mm`). | ❌ Read-Only |

### 2.2 Security & Password Update (`Security` Tab)

| Field Label | Payload Key | Control Type | Validation Rules |
| :--- | :--- | :--- | :--- |
| **Current Password** | `currentPassword` | Password Input (with show/hide toggle) | Required, verified against stored bcrypt hash on server. |
| **New Password** | `newPassword` | Password Input (with strength meter) | Required, 8–128 characters, live strength indicator. |
| **Confirm New Password** | `confirmPassword` | Password Input | Required, must exactly match `newPassword`. |

---

## 3. Honest Empty States (No Mock Data)

In accordance with strict project rules against claiming non-existent functionality:

1. **Appointments Tab (`appointments`)**:
   - **Vector Icon**: `<Calendar size={40} color="var(--color-gold-bright)" />`
   - **Heading**: `"No Appointments Scheduled"`
   - **Body**: `"You have no active or past medical consultations. When you book appointments with hospitals, clinics, or specialists (launching in Batch 7), they will appear here."`
   - **Action**: Button `"Explore Healthcare Services"` linking to `#services` on Homepage.

2. **Gift Cards Tab (`giftcards`)**:
   - **Vector Icon**: `<Gift size={40} color="var(--color-gold-bright)" />`
   - **Heading**: `"No Active Gift Cards"`
   - **Body**: `"You have not purchased or redeemed any ODS digital vouchers yet. Digital gifting and balance management will be fully enabled in Batch 7."`
   - **Action**: Button `"View Gifting Packages"` linking to `#gifting` on Homepage.

3. **Notifications Tab (`notifications`)**:
   - **Vector Icon**: `<Bell size={40} color="var(--color-gold-bright)" />`
   - **Heading**: `"All Caught Up"`
   - **Body**: `"You have zero unread notifications. Account alerts, booking confirmations, and security notices will be logged here in real-time."`

---

## 4. Reusable Design System Assets

| Asset / Component | Source | Application in Batch 3 |
| :--- | :--- | :--- |
| **`DashboardLayout.tsx`** | `./Frontend/src/pages/dashboards/DashboardLayout.tsx` | Main responsive shell, brand topbar, notification bell, user dropdown, left sidebar navigation. |
| **Design Tokens** | `./Frontend/src/styles/tokens.css` | `--color-navy-dark` (`#0F285B`), `--color-gold-bright` (`#EDC45B`), `--color-gold-deep` (`#BE9B49`), `--color-border-dark`. |
| **Typography** | `./Frontend/src/styles/fonts.css` | Variable Google Sans Flex & Inter fonts. |
| **Focus Rings** | `./Frontend/src/styles/batch1-focus.css` | Accessible high-contrast luminous gold outline rings (`outline: 2px solid var(--color-gold-bright)`). |
| **Input / Button** | `./Frontend/src/components/ui/Input.tsx`, `Button.tsx` | Consistent form fields, loading spinners, primary gold & outline navy buttons. |
| **Vector Icons** | `lucide-react` | Strict vector iconography (`User`, `Shield`, `Calendar`, `Gift`, `Bell`, `Key`, `CheckCircle2`, `AlertCircle`). Zero emojis. |

---

## 5. Verified Facts vs. Assumptions

### Verified:
- `DashboardLayout.tsx` already contains all responsive sidebar styling, topbar user menu, and sign-out logic.
- `tokens.css` and `fonts.css` are configured and working cleanly across the app.
- `AuthContext.tsx` can be extended with a lightweight `updateUser(data)` method to update local context immediately upon successful profile edits without page reloads.

### Assumed:
- Assumed that the customer dashboard tabs will be managed via internal state inside `CustomerDashboard.tsx` (`activeTab: 'overview' | 'profile' | 'security' | 'appointments' | 'giftcards' | 'notifications'`) without requiring top-level URL route modifications in `App.tsx`.
