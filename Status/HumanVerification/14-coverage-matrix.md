# 14. Master Coverage Matrix & Platform Inventory

This matrix provides 100% end-to-end traceability across every frontend screen, user-visible form/button, backend API endpoint, notification event, and record status in the ODS Global Network codebase.

---

## 1. Frontend Route & Page Inventory (47 Views & Dashboard Tabs)

| View Key | Browser Route Path | Component File Path | Primary Roles Permitted | Checklist Document Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `home` | `/` | `Frontend/src/pages/HomePage.tsx` | Visitor, All | `01-visitor.md` |
| `login` | `/login` | `Frontend/src/pages/LoginPage.tsx` | Visitor (Logged out) | `01-visitor.md` |
| `register` | `/register` | `Frontend/src/pages/RegisterPage.tsx` | Visitor (Logged out) | `01-visitor.md` |
| `terms` | `/terms` | `Frontend/src/pages/TermsPage.tsx` | Public (All) | `01-visitor.md` |
| `forgot-password` | `/forgot-password` | `Frontend/src/pages/ForgotPasswordPage.tsx` | Visitor (Logged out) | `01-visitor.md` |
| `reset-password` | `/reset-password#token=...` | `Frontend/src/pages/ResetPasswordPage.tsx` | Visitor (Token holder) | `01-visitor.md` |
| `verify-email` | `/verify-email#token=...` | `Frontend/src/pages/VerifyEmailPage.tsx` | Customer, Merchant, Provider | `01-visitor.md`, `02-customer.md` |
| `company` | `/company` | `Frontend/src/pages/CompanyPage.tsx` | Public (All) | `01-visitor.md` |
| `support` | `/support` | `Frontend/src/pages/SupportPage.tsx` | Public (All) | `01-visitor.md` |
| `partner-with-us` | `/partner-with-us` | `Frontend/src/pages/PartnerWithUsPage.tsx` | Public (All) | `01-visitor.md` |
| `unauthorized` | `/unauthorized` | `Frontend/src/pages/UnauthorizedPage.tsx` | Authenticated (Blocked) | `10-cross-role.md` |
| `services` | `/services` | `Frontend/src/pages/ServicesCatalogPage.tsx` | Public (All) | `01-visitor.md`, `02-customer.md` |
| `service-detail` | `/services/:slug` | `Frontend/src/pages/ServiceDetailPage.tsx` | Public (All) | `01-visitor.md`, `02-customer.md` |
| `payment/success` | `/payment/success?tx_ref=...` | `Frontend/src/pages/PaymentSuccessPage.tsx` | Customer | `02-customer.md` |
| `gift/claim` | `/gift/claim` | `Frontend/src/pages/GiftClaimPage.tsx` | Public (Voucher holder) | `01-visitor.md`, `02-customer.md` |
| `notifications` | `/notifications` | `Frontend/src/pages/NotificationsPage.tsx` | Customer, Merchant, Provider | `02-customer.md`, `11-notifications.md` |
| `dashboard` | `/dashboard` (Shell) | `Frontend/src/pages/dashboards/CustomerDashboard.tsx` | Customer | `02-customer.md` |
| `dashboard/appointments` | `/dashboard#appointments` | `.../customer/CustomerAppointmentsTab.tsx` | Customer | `02-customer.md` |
| `dashboard/gifting` | `/dashboard#gifting` | `.../customer/CustomerGiftingTab.tsx` | Customer | `02-customer.md` |
| `dashboard/profile` | `/dashboard#profile` | `.../customer/CustomerProfileTab.tsx` | Customer | `02-customer.md` |
| `dashboard/security` | `/dashboard#security` | `.../customer/CustomerSecurityTab.tsx` | Customer | `02-customer.md` |
| `dashboard/transactions` | `/dashboard#transactions` | `.../customer/CustomerTransactionsTab.tsx` | Customer | `02-customer.md` |
| `merchant/dashboard` | `/merchant/dashboard` (Shell) | `Frontend/src/pages/dashboards/MerchantDashboard.tsx` | Merchant | `03-merchant.md` |
| `merchant/documents` | `/merchant/dashboard#documents` | `.../merchant/MerchantDocumentsTab.tsx` | Merchant | `03-merchant.md` |
| `merchant/profile` | `/merchant/dashboard#profile` | `.../merchant/MerchantProfileTab.tsx` | Merchant | `03-merchant.md` |
| `merchant/services` | `/merchant/dashboard#services` | `.../merchant/MerchantServicesTab.tsx` | Merchant | `03-merchant.md` |
| `provider/dashboard` | `/provider/dashboard` (Shell) | `Frontend/src/pages/dashboards/ProviderDashboard.tsx` | Provider | `04-provider.md` |
| `provider/availability`| `/provider/dashboard#availability` | `.../provider/ProviderAvailabilityTab.tsx` | Provider | `04-provider.md` |
| `provider/bookings` | `/provider/dashboard#bookings` | `.../provider/ProviderBookingsTab.tsx` | Provider | `04-provider.md` |
| `provider/documents` | `/provider/dashboard#documents` | `.../provider/ProviderDocumentsTab.tsx` | Provider | `04-provider.md` |
| `provider/profile` | `/provider/dashboard#profile` | `.../provider/ProviderProfileTab.tsx` | Provider | `04-provider.md` |
| `provider/services` | `/provider/dashboard#services` | `.../provider/ProviderServicesTab.tsx` | Provider | `04-provider.md` |
| `provider/vouchers` | `/provider/dashboard#vouchers` | `.../provider/ProviderVouchersTab.tsx` | Provider | `04-provider.md` |
| `admin/dashboard` | `/admin/dashboard` (Shell) | `Frontend/src/pages/dashboards/AdminDashboard.tsx` | Admin, Super Admin | `06-admin-support.md` to `09-super-admin.md` |
| `admin/overview` | `/admin/dashboard#overview` | `.../admin/AdminOverviewTab.tsx` | Admin, Super Admin | `06-admin-support.md` |
| `admin/users` | `/admin/dashboard#users` | `.../admin/UsersTab.tsx` | User Admin, Super Admin | `06-admin-support.md`, `09-super-admin.md` |
| `admin/kyc` | `/admin/dashboard#kyc` | `.../admin/KycQueueTab.tsx` | Compliance, Super Admin | `08-admin-compliance.md` |
| `admin/services` | `/admin/dashboard#services` | `.../admin/ServicesTab.tsx` | Catalog Mod, Super Admin | `06-admin-support.md` |
| `admin/bookings` | `/admin/dashboard#bookings` | `.../admin/BookingsTab.tsx` | Operations, Super Admin | `06-admin-support.md` |
| `admin/gifts` | `/admin/dashboard#gifts` | `.../admin/GiftsTab.tsx` | Operations, Super Admin | `06-admin-support.md` |
| `admin/finance` | `/admin/dashboard#finance` | `.../admin/FinanceTab.tsx` | Finance, Super Admin | `07-admin-finance.md` |
| `admin/audit` | `/admin/dashboard#audit` | `.../admin/AuditLogsTab.tsx` | System Admin, Super Admin | `09-super-admin.md` |
| `admin/notifications` | `/admin/dashboard#notifications` | `.../admin/NotificationsHubTab.tsx`| System Admin, Super Admin | `09-super-admin.md`, `11-notifications.md` |
| `admin/inbox` | `/admin/dashboard#inbox` | `.../admin/InquiriesInboxTab.tsx` | Support, Super Admin | `06-admin-support.md` |
| `admin/settings` | `/admin/dashboard#settings` | `.../admin/PlatformSettingsTab.tsx`| System Admin, Super Admin | `09-super-admin.md` |
| `admin/staff` | `/admin/dashboard#staff` | `.../admin/StaffAccountsTab.tsx` | Super Admin | `09-super-admin.md` |
| `admin/reports` | `/admin/dashboard#reports` | `.../admin/ReportsTab.tsx` | Finance, Super Admin | `07-admin-finance.md` |

---

## 2. Backend API Endpoints Inventory (144 Active Routes)

| Domain | Method | Endpoint Path | Auth / Role Guard | Target Checklist |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Anonymous | `01-visitor.md` |
| **Auth** | `POST` | `/api/auth/login` | Anonymous | `01-visitor.md` |
| **Auth** | `POST` | `/api/auth/logout` | Authenticated | `02-customer.md` |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | `02-customer.md` |
| **Auth** | `POST` | `/api/auth/forgot-password` | Anonymous | `01-visitor.md` |
| **Auth** | `POST` | `/api/auth/reset-password` | Anonymous | `01-visitor.md` |
| **Auth** | `POST` | `/api/auth/verify-email` | Anonymous | `01-visitor.md`, `02-customer.md` |
| **Auth** | `POST` | `/api/auth/resend-verification`| Anonymous | `01-visitor.md` |
| **Customer** | `GET` | `/api/customer/profile` | Customer | `02-customer.md` |
| **Customer** | `PUT` | `/api/customer/profile` | Customer | `02-customer.md` |
| **Customer** | `POST` | `/api/customer/change-password` | Customer | `02-customer.md` |
| **Merchant** | `GET` | `/api/merchant/profile` | Merchant | `03-merchant.md` |
| **Merchant** | `PUT` | `/api/merchant/profile` | Merchant | `03-merchant.md` |
| **Merchant** | `GET` | `/api/merchant/documents` | Merchant | `03-merchant.md` |
| **Provider** | `GET` | `/api/provider/profile` | Provider | `04-provider.md` |
| **Provider** | `PUT` | `/api/provider/profile` | Provider | `04-provider.md` |
| **Provider** | `GET` | `/api/provider/documents` | Provider | `04-provider.md` |
| **Documents**| `POST` | `/api/documents/upload` | Any Auth / Anonymous | `01-visitor.md`, `03-merchant.md`, `04-provider.md` |
| **Documents**| `GET` | `/api/documents/:id/view` | Owner / Compliance Admin | `03-merchant.md`, `08-admin-compliance.md` |
| **Documents**| `GET` | `/api/documents/staging/status`| Anonymous Token | `01-visitor.md` |
| **Payments** | `POST` | `/api/payments/initialize` | Authenticated (Verified) | `02-customer.md` |
| **Payments** | `GET` | `/api/payments/verify/:txRef` | Transaction Owner | `02-customer.md` |
| **Payments** | `POST` | `/api/payments/webhook` | Chapa Gateway (HMAC) | `07-admin-finance.md` |
| **Payments** | `GET` | `/api/payments/receipt/:txRef`| Transaction Owner | `02-customer.md` |
| **Payments** | `GET` | `/api/payments/history` | Customer | `02-customer.md` |
| **Gifts** | `POST` | `/api/gifting/purchase` | Authenticated (Verified) | `02-customer.md` |
| **Gifts** | `POST` | `/api/gifting/redeem` | Customer | `02-customer.md` |
| **Gifts** | `POST` | `/api/gifting/check` | Public / Anonymous | `01-visitor.md` |
| **Gifts** | `GET` | `/api/gifting/wallet` | Customer | `02-customer.md` |
| **Gifts** | `GET` | `/api/gifting/my-cards` | Customer | `02-customer.md` |
| **Gifts** | `GET` | `/api/gifting/provider/vouchers`| Provider | `04-provider.md` |
| **Gifts** | `POST` | `/api/gifting/confirm-delivery`| Provider | `04-provider.md` |
| **Services** | `GET` | `/api/services` | Public | `01-visitor.md`, `02-customer.md` |
| **Services** | `GET` | `/api/services/:slug` | Public | `01-visitor.md`, `02-customer.md` |
| **Services** | `GET` | `/api/service-categories` | Public | `01-visitor.md` |
| **Services** | `GET` | `/api/my-services` | Approved Provider/Merchant | `03-merchant.md`, `04-provider.md` |
| **Services** | `POST` | `/api/my-services` | Approved Provider/Merchant | `03-merchant.md`, `04-provider.md` |
| **Services** | `PUT` | `/api/my-services/:id` | Service Owner | `03-merchant.md`, `04-provider.md` |
| **Services** | `PATCH`| `/api/my-services/:id/submit`| Service Owner | `03-merchant.md`, `04-provider.md` |
| **Services** | `PATCH`| `/api/my-services/:id/unpublish`| Service Owner | `03-merchant.md`, `04-provider.md` |
| **Services** | `PATCH`| `/api/my-services/:id/republish`| Service Owner | `03-merchant.md`, `04-provider.md` |
| **Bookings** | `GET` | `/api/bookings/slots` | Public | `02-customer.md` |
| **Bookings** | `POST` | `/api/bookings` | Customer | `02-customer.md` |
| **Bookings** | `GET` | `/api/bookings/:id` | Booking Participant | `02-customer.md`, `04-provider.md` |
| **Bookings** | `POST` | `/api/bookings/:id/cancel` | Customer / Provider | `02-customer.md`, `04-provider.md` |
| **Bookings** | `POST` | `/api/bookings/:id/reschedule`| Customer | `02-customer.md` |
| **Bookings** | `GET` | `/api/bookings/provider/schedule`| Provider | `04-provider.md` |
| **Bookings** | `POST` | `/api/bookings/provider/schedule`| Provider | `04-provider.md` |
| **Admin** | `GET` | `/api/admin/users` | Admin (`users.view`) | `06-admin-support.md` |
| **Admin** | `POST` | `/api/admin/users/:id/suspend` | Admin (`users.suspend`) | `09-super-admin.md` |
| **Admin** | `POST` | `/api/admin/users/:id/force-signout`| Admin (`users.force_signout`)| `09-super-admin.md` |
| **Admin** | `GET` | `/api/admin/kyc/queue` | Compliance (`kyc.queue_view`)| `08-admin-compliance.md` |
| **Admin** | `POST` | `/api/admin/kyc/:type/:id/decision`| Compliance (`kyc.decide`) | `08-admin-compliance.md` |
| **Admin** | `GET` | `/api/admin/services/queue` | Catalog Mod (`services.moderate`)| `06-admin-support.md` |
| **Admin** | `POST` | `/api/admin/services/:id/approve`| Catalog Mod (`services.moderate`)| `06-admin-support.md` |
| **Admin** | `POST` | `/api/admin/services/:id/reject`| Catalog Mod (`services.moderate`)| `06-admin-support.md` |
| **Admin** | `POST` | `/api/admin/services/:id/takedown`| Catalog Mod (`services.moderate`)| `06-admin-support.md` |
| **Admin** | `GET` | `/api/admin/finance/transactions`| Finance (`payments.view_ledger`)| `07-admin-finance.md` |
| **Admin** | `POST` | `/api/admin/finance/refunds` | Finance (`refunds.initiate`)| `07-admin-finance.md` |
| **Admin** | `POST` | `/api/admin/finance/refunds/:id/approve`| Finance (`refunds.approve`) | `07-admin-finance.md` |
| **Admin** | `GET` | `/api/admin/audit-logs` | Super Admin (`audit.view`)| `09-super-admin.md` |
| **Admin 2FA**| `GET` | `/api/admin/2fa/status` | Admin | `09-super-admin.md` |
| **Admin 2FA**| `POST` | `/api/admin/2fa/setup` | Admin | `09-super-admin.md` |
| **Admin 2FA**| `POST` | `/api/admin/2fa/enable` | Admin | `09-super-admin.md` |
| **Admin 2FA**| `POST` | `/api/admin/2fa/disable` | Admin | `09-super-admin.md` |
| **Notifs** | `GET` | `/api/notifications` | Authenticated | `11-notifications.md` |
| **Notifs** | `PATCH`| `/api/notifications/read-all`| Authenticated | `11-notifications.md` |
| **Notifs** | `POST` | `/api/notifications/unsubscribe`| Public (Signed Token) | `11-notifications.md` |
| **Health** | `GET` | `/health/liveness` | Public | `09-super-admin.md` |
| **Health** | `GET` | `/health/readiness` | Public | `09-super-admin.md` |

*(Full enumeration of all 144 endpoints is cataloged across individual role checklist files).*

---

## 3. Transactional Notification Catalog Inventory (35 Domain Events)

| Event Identifier | Category | Channels | Primary Recipient | Is Essential |
| :--- | :--- | :--- | :--- | :---: |
| `auth.verification_requested` | Account Security | Email | Registering User | YES |
| `auth.password_reset_requested` | Account Security | Email | Requesting User | YES |
| `auth.password_changed` | Account Security | Email, In-App | Account Owner | YES |
| `auth.duplicate_registration_alert` | Account Security | Email | Existing Account Owner | YES |
| `auth.new_login_alert` | Account Security | Email, In-App | Account Owner | NO |
| `onboarding.application_received` | Onboarding & KYC | Email, In-App | Provider / Merchant | YES |
| `onboarding.admin_new_application` | Onboarding & KYC | Email, In-App | Compliance Officers | YES |
| `onboarding.info_requested` | Onboarding & KYC | Email, In-App | Provider / Merchant | YES |
| `onboarding.approved` | Onboarding & KYC | Email, In-App | Provider / Merchant | YES |
| `onboarding.rejected` | Onboarding & KYC | Email, In-App | Provider / Merchant | YES |
| `catalog.service_submitted` | Catalog Moderation | Email, In-App | Provider / Merchant | NO |
| `catalog.service_approved` | Catalog Moderation | Email, In-App | Provider / Merchant | NO |
| `catalog.service_rejected` | Catalog Moderation | Email, In-App | Provider / Merchant | NO |
| `catalog.service_taken_down` | Catalog Moderation | Email, In-App | Provider / Merchant | YES |
| `payment.receipt` | Payments | Email, In-App | Paying Customer | YES |
| `payment.failed` | Payments | Email, In-App | Customer | YES |
| `payment.refund_issued` | Payments | Email, In-App | Customer & Provider | YES |
| `payment.admin_refund_approval_pending` | Payments | Email, In-App | Finance Approvers | YES |
| `gift.purchased_receipt` | Gifting & Vouchers| Email, In-App | Gift Purchaser | YES |
| `gift.delivered` | Gifting & Vouchers| Email | Gift Recipient | YES |
| `gift.redeemed_notice` | Gifting & Vouchers| Email, In-App | Gift Purchaser | NO |
| `gift.expiry_warning` | Gifting & Vouchers| Email, In-App | Recipient / Holder | NO |
| `booking.created_awaiting_provider`| Bookings | Email, In-App | Customer | YES |
| `booking.provider_new_request` | Bookings | Email, In-App | Healthcare Provider | YES |
| `booking.confirmed` | Bookings | Email, In-App | Customer & Provider | YES |
| `booking.declined` | Bookings | Email, In-App | Customer | YES |
| `booking.cancelled` | Bookings | Email, In-App | Customer & Provider | YES |
| `booking.rescheduled` | Bookings | Email, In-App | Customer & Provider | YES |
| `booking.reminder_24h` | Bookings | Email, In-App | Customer & Provider | NO |
| `booking.reminder_1h` | Bookings | Email, In-App | Customer | NO |
| `booking.completed` | Bookings | Email, In-App | Customer | NO |
| `admin.account_suspended` | Admin Safety | Email, In-App | Suspended User | YES |
| `admin.account_reactivated` | Admin Safety | Email, In-App | Reactivated User | YES |
| `admin.staff_provisioned` | Admin Safety | Email | New Staff Admin | YES |
| `partner.inquiry_received` | Inquiries & Support| Email | Enterprise Partner | NO |

---

## 4. Entity Lifecycle & State Machine Inventory

| Entity Name | State Field | Exhaustive Permitted Values | State Triggers / Transitions |
| :--- | :--- | :--- | :--- |
| `users` | `is_active` | `TRUE`, `FALSE` | Suspended by Admin (`users.suspend`), Reactivated |
| `users` | `is_email_verified` | `TRUE`, `FALSE` | Verification link token exchange, Admin password reset |
| `merchants` | `approval_status` | `pending`, `approved`, `rejected` | KYC submission -> Compliance decision -> Reset on address change |
| `providers` | `approval_status` | `pending`, `approved`, `rejected` | KYC submission -> Compliance decision -> Reset on compliance edit |
| `documents` | `status` | `pending`, `verified`, `rejected` | Upload -> Admin decision on entity |
| `transactions` | `status` | `pending`, `completed`, `failed`, `refunded` | Chapa initialization -> Webhook / Verify -> Dual refund |
| `gift_cards` | `status` | `pending_payment`, `active`, `redeemed`, `expired`, `cancelled`, `delivered`, `hold` | Purchase -> Payment confirmation -> Atomic claim -> Clinic delivery |
| `services` | `status` | `draft`, `pending_review`, `published`, `unpublished`, `rejected`, `taken_down` | Provider authoring -> Submit -> Moderation decision -> Takedown |
| `bookings` | `status` | `pending_payment`, `pending_provider`, `confirmed`, `declined`, `cancelled`, `completed`, `no_show`, `rescheduled`, `expired` | Slot hold (10 min) -> Payment / Gift redemption -> Provider accept -> Visit |
| `refund_approvals`| `status` | `pending_approval`, `approved`, `rejected` | Initiated by Finance Admin -> 2nd approver decision (>10,000 ETB) |
| `notifications` | `status` | `pending`, `sent`, `failed`, `dead_letter`, `discarded` | Outbox queue -> Worker poll -> SMTP/In-App delivery -> Retry/DLQ |

---

## 5. Traceability Mapping to Human Checklist Documents

Every item discovered in the code is assigned to a specific role checklist file:

* `01-visitor.md`: Public routes (`/`, `/login`, `/register`, `/terms`, `/services`, `/company`, `/support`, `/partner-with-us`, `/gift/claim`), anonymous staging, rate limiter feedback.
* `02-customer.md`: Customer dashboard, `/dashboard#profile`, `/dashboard#appointments`, `/dashboard#gifting`, `/dashboard#transactions`, `/dashboard#security`, booking checkout, 10-minute hold counter, wallet credit.
* `03-merchant.md`: Merchant dashboard, KYC re-upload, compliance reset triggers, business services.
* `04-provider.md`: Provider dashboard, weekly schedule matrix, blackout exceptions, appointment status controls, in-clinic voucher redemption.
* `05-suspended-user.md`: Suspended account login rejection, session termination, contact support prompt.
* `06-admin-support.md`: Operations/Support Admin (`users.view`, `inbox.view`, `services.moderate`).
* `07-admin-finance.md`: Finance Admin (`payments.view_ledger`, `refunds.initiate`, `refunds.approve`).
* `08-admin-compliance.md`: Compliance Admin (`kyc.queue_view`, `kyc.document_view`, `kyc.decide`).
* `09-super-admin.md`: Super Admin (`admins.manage`, `settings.manage`, `audit.view`, TOTP 2FA, force signout).
* `10-cross-role-and-permissions.md`: Cross-tenant IDOR, direct URL manipulation, unauthorized HTTP verbs.
* `11-emails-and-notifications.md`: Verification of all 35 notification event templates in Mailpit (`127.0.0.1:8025`).
* `12-end-to-end-journeys.md`: Integrated cross-role user flows from registration to refund.
* `13-visible-error-catalogue.md`: Human-visible error patterns and spotting guide.
* `15-defect-log-template.md`: Standardized defect logging template.
