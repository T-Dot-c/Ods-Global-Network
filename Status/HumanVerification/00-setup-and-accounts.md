# 00. Test Setup, Accounts Matrix & Environment Guide

This document establishes the testing baseline for human testers. Review this guide before beginning any checklist.

---

## 1. Test Accounts Matrix

The platform includes pre-configured development test accounts for each role. In the local development environment, all accounts use the standard passwords configured in your local environment file (`.env`).

> [!IMPORTANT]
> **Password Sourcing Rule**: 
> * For regular accounts (Customer, Merchant, Provider), the password is the value defined in `DEV_PASSWORD` in your local `.env` file (typically `Password123!`).
> * For administrative accounts (Staff Admin, Super Admin), the password is the value defined in `ADMIN_PASSWORD` in your local `.env` file (typically `AdminPassword123!`).
> * Never print real production secrets in tickets, logs, or chat messages.

| Target Role | Email Address / Identifier | Account State | Purpose & Permissions in Testing |
| :--- | :--- | :--- | :--- |
| **Visitor** | *(None — Logged out)* | Unauthenticated | Public browsing, registration, terms, security rejection checks |
| **Customer (Verified)** | `customer@123.com` | Email Verified, Active | Booking healthcare appointments, Chapa payments, buying/redeeming gifts, wallet |
| **Customer (Unverified)**| *Register fresh in UI* | Email Unverified, Active | Testing email verification banners and sensitive action gating |
| **Merchant (Approved)** | `merchant@123.com` | KYC Approved, Active | Managing merchant profile, retail documents, pharmacy/health product listings |
| **Merchant (Pending)** | `merchant01@ods.com` | KYC Pending Review | Verifying pending review banner, restricted public listing, document status |
| **Provider (Approved)** | `serviceprovider@123.com` | KYC Approved, Active | Configuring weekly schedules, managing bookings, in-clinic voucher redemption |
| **Provider (Pending/Rejected)** | *Register fresh in UI* | KYC Pending / Rejected | Testing KYC rejection notices, re-upload workflow, and compliance resets |
| **Suspended Account** | *Suspended via Admin UI* | `is_active = FALSE` | Verifying instant login rejection, session termination, and support messaging |
| **Staff Admin (Support)** | `admin_support@odsglobal.net` | Active, Support Group | Customer lookups, adding internal user notes, support/partner inquiry inbox |
| **Staff Admin (Finance)**| `admin_finance@odsglobal.net`| Active, Finance Group | Viewing payment transactions, initiating customer refunds, financial exports |
| **Staff Admin (Compliance)**| `admin_compliance@odsglobal.net`| Active, Compliance Group| KYC queues, viewing submitted documents with security headers, approval decisions |
| **Super Administrator** | `superadmin@odsglobal.net` | Active, All Permissions | Full system oversight, staff provisioning, RBAC groups, 2FA settings, audit logs |

---

## 2. Mailpit: Local Email & Notification Inspector

The platform dispatches all transactional emails (verification links, password resets, receipts, booking notices) to a local Mailpit server.

* **Mailpit Web Interface Address**: `http://127.0.0.1:8025`
* **SMTP Listening Port**: `1025`

### How to Inspect Emails in Mailpit:
1. When a checklist item indicates an email has been sent, open a new browser tab to `http://127.0.0.1:8025`.
2. Find the message by searching the recipient's email address in the search bar.
3. Click on the message to inspect:
   * **Subject line**: Verify correct spelling, no placeholders (like `{{name}}` or `null`).
   * **Body text**: Verify polite, clear, professional language with accurate details (times, amounts, names).
   * **Action links**: Verify the "Verify Email" or "Reset Password" button links contain a security token fragment (`#token=...`) and do NOT expose tokens in query parameters (`?token=...`).
   * **Unsubscribe link**: Verify marketing/reminder emails contain a functioning unsubscribe link at the footer.

---

## 3. Chapa Sandbox Payment Simulation Rules

When testing the checkout flow for appointment bookings or gift card purchases, the system connects to the **Chapa Payment Gateway Sandbox**.

> [!TIP]
> **Real Money is Never Handled in Sandbox Mode.**
> Do not use real personal credit cards, debit cards, or bank credentials.

### Test Card Credentials for Chapa Sandbox:
* **Test Card Number**: `4084084084084081` (Standard Chapa / Visa Sandbox)
* **Expiration Date**: Any future month and year (e.g., `12/28`)
* **CVV / Security Code**: `123`
* **Test OTP Code** (if prompted by 3D-Secure simulation): `1234` or `123456`
* **Simulated Test Mobile Numbers** (for Telebirr/CBE Birr sandbox): `0911223344`

### Expected Chapa Behavior:
1. Clicking **"Proceed to Payment"** in the ODS platform should redirect to `https://checkout.chapa.co/checkout/payment/...` (or local test checkout).
2. Entering the test card and submitting should show a green "Payment Successful" screen.
3. Chapa should automatically redirect back to:
   `http://localhost:5173/payment/success?tx_ref=...`
4. The ODS platform should display an official itemized receipt with transaction reference, paid amount in ETB, and a button to view the booking or gift card.

---

## 4. Testing Devices, Viewports & Browsers

All public pages and authenticated dashboards must be inspected across three standard viewports:

| Device Category | Target Dimensions | DevTools Emulation Preset | Required Testing Passes |
| :--- | :--- | :--- | :--- |
| **Desktop / Laptop** | `1920 × 1080` or `1440 × 900` | Standard Fullscreen Window | Primary desktop workflow, multi-column tables, admin console |
| **Tablet** | `768 × 1024` | iPad (Portrait & Landscape) | Collapsible navigation, catalog grid responsiveness |
| **Mobile Phone** | `375 × 667` or `390 × 844` | iPhone SE / iPhone 12/13/14 | Mobile hamburger menu, single-column booking wizard, card checkout |

### Keyboard-Only Navigation Pass:
* For primary forms (Login, Register, Checkout, Booking):
  * Put the mouse aside.
  * Use `Tab` to move forward between input fields and buttons.
  * Use `Shift + Tab` to move backward.
  * Use `Space` or `Enter` to toggle checkboxes and activate buttons.
  * Verify that a visible focus outline clearly indicates which element is selected, and that focus is never "trapped".

---

## 5. Safe Test Data Reset & Cleanup Procedures

If you need to reset test state after completing a destructive test pass (e.g. changing passwords or suspending accounts):

### Resetting Dev Passwords to Default:
To restore standard passwords for the default test accounts (`customer@123.com`, `merchant@123.com`, `serviceprovider@123.com`):
1. In the backend terminal, run the safe restoration script:
   ```powershell
   node scripts/restore-dev-accounts.js
   ```
2. This resets their passwords back to `DEV_PASSWORD` without altering existing catalog services or migrations.

### Clearing Mailpit Inboxes:
To clear all accumulated test emails in Mailpit, click the **"Clear All"** button in the Mailpit web UI (`http://127.0.0.1:8025`) or restart the Mailpit runner script.
