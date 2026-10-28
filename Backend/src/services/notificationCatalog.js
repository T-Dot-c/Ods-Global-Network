/**
 * ODS Global Network — Notification Catalog Registry
 *
 * Defines all domain events, target audiences, channels, template keys,
 * priorities, and whether the notification is essential (cannot be unsubscribed).
 */
'use strict';

const NOTIFICATION_CATEGORIES = {
  ACCOUNT_SECURITY: 'account_security',
  ONBOARDING_KYC: 'onboarding_kyc',
  PAYMENTS: 'payments',
  GIFTS: 'gifts',
  BOOKINGS: 'bookings',
  CATALOG: 'catalog',
  ADMIN_SAFETY: 'admin_safety',
  SYSTEM: 'system',
};

const CHANNELS = {
  EMAIL: 'email',
  IN_APP: 'in_app',
  SMS: 'sms',
  PUSH: 'push',
};

/**
 * Event Catalog definitions
 */
const EVENT_CATALOG = {
  // --- Account Security & Authentication ---
  'auth.verification_requested': {
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    channels: [CHANNELS.EMAIL],
    templateKey: 'auth_verification_requested',
    isEssential: true,
    description: 'Email verification link sent upon registration or email update request.',
  },
  'auth.password_reset_requested': {
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    channels: [CHANNELS.EMAIL],
    templateKey: 'auth_password_reset_requested',
    isEssential: true,
    description: 'Password reset link sent upon forgotten password request.',
  },
  'auth.password_changed': {
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'auth_password_changed',
    isEssential: true,
    description: 'Security alert dispatched when an account password is modified.',
  },
  'auth.duplicate_registration_alert': {
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    channels: [CHANNELS.EMAIL],
    templateKey: 'auth_duplicate_registration_alert',
    isEssential: true,
    description: 'Notice to account owner that someone attempted to register with their email.',
  },
  'auth.new_login_alert': {
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'auth_new_login_alert',
    isEssential: false,
    description: 'Notice dispatched when a sign-in occurs from a new IP/user-agent.',
  },

  // --- Onboarding & KYC Accreditation ---
  'onboarding.application_received': {
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'onboarding_application_received',
    isEssential: true,
    description: 'Confirmation to provider/merchant that their KYC onboarding submission was received.',
  },
  'onboarding.admin_new_application': {
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'onboarding_admin_new_application',
    isEssential: true,
    description: 'Internal alert to compliance staff that a new provider/merchant application requires review.',
  },
  'onboarding.info_requested': {
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'onboarding_info_requested',
    isEssential: true,
    description: 'Action required notice when compliance team requests additional documentation.',
  },
  'onboarding.approved': {
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'onboarding_approved',
    isEssential: true,
    description: 'Congratulatory notification when KYC verification and accreditation is approved.',
  },
  'onboarding.rejected': {
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'onboarding_rejected',
    isEssential: true,
    description: 'Advisory notice with reasons when a provider/merchant application is rejected.',
  },

  // --- Healthcare Services Catalog & Moderation ---
  'catalog.service_submitted': {
    category: NOTIFICATION_CATEGORIES.CATALOG,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'catalog_service_submitted',
    isEssential: false,
    description: 'Notice confirming a provider has submitted a service listing for compliance review.',
  },
  'catalog.service_approved': {
    category: NOTIFICATION_CATEGORIES.CATALOG,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'catalog_service_approved',
    isEssential: false,
    description: 'Notification to provider that their service listing has been approved and published.',
  },
  'catalog.service_rejected': {
    category: NOTIFICATION_CATEGORIES.CATALOG,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'catalog_service_rejected',
    isEssential: false,
    description: 'Notification to provider that their service listing was rejected, including feedback.',
  },
  'catalog.service_taken_down': {
    category: NOTIFICATION_CATEGORIES.CATALOG,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'catalog_service_taken_down',
    isEssential: true,
    description: 'Notice to provider that a published service was taken down for safety or quality reasons.',
  },

  // --- Payments & Financial Settlements ---
  'payment.receipt': {
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'payment_receipt',
    isEssential: true,
    description: 'Official payment receipt dispatched to customer after successful transaction.',
  },
  'payment.failed': {
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'payment_failed',
    isEssential: true,
    description: 'Notice to customer that a payment attempt failed or expired.',
  },
  'payment.refund_issued': {
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'payment_refund_issued',
    isEssential: true,
    description: 'Confirmation of processed refund to customer and provider.',
  },
  'payment.admin_refund_approval_pending': {
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'payment_admin_refund_approval_pending',
    isEssential: true,
    description: 'Notice to finance approvers for dual-authorization high-value refund requests.',
  },

  // --- Gifting & Vouchers ---
  'gift.purchased_receipt': {
    category: NOTIFICATION_CATEGORIES.GIFTS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'gift_purchased_receipt',
    isEssential: true,
    description: 'Receipt and order confirmation sent to the purchaser of a gift card.',
  },
  'gift.delivered': {
    category: NOTIFICATION_CATEGORIES.GIFTS,
    channels: [CHANNELS.EMAIL],
    templateKey: 'gift_delivered',
    isEssential: true,
    description: 'Gift card presentation email sent to recipient with claim link and security token.',
  },
  'gift.redeemed_notice': {
    category: NOTIFICATION_CATEGORIES.GIFTS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'gift_redeemed_notice',
    isEssential: false,
    description: 'Notification to the gift card buyer that their recipient has redeemed the card.',
  },
  'gift.expiry_warning': {
    category: NOTIFICATION_CATEGORIES.GIFTS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'gift_expiry_warning',
    isEssential: false,
    description: 'Scheduled warning before an unredeemed gift card voucher expires.',
  },

  // --- Bookings & Appointments ---
  'booking.created_awaiting_provider': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_created_awaiting_provider',
    isEssential: true,
    description: 'Notice to customer that booking was requested and provider has been alerted.',
  },
  'booking.provider_new_request': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_provider_new_request',
    isEssential: true,
    description: 'Action required notice to healthcare provider regarding a new pending booking.',
  },
  'booking.confirmed': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_confirmed',
    isEssential: true,
    description: 'Confirmation email and in-app notice when appointment is confirmed/accepted.',
  },
  'booking.declined': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_declined',
    isEssential: true,
    description: 'Notice to customer when provider is unable to accept the booking.',
  },
  'booking.cancelled': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_cancelled',
    isEssential: true,
    description: 'Cancellation notice sent to both customer and provider.',
  },
  'booking.rescheduled': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_rescheduled',
    isEssential: true,
    description: 'Appointment reschedule notice reflecting updated date and time.',
  },
  'booking.reminder_24h': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_reminder_24h',
    isEssential: false,
    description: 'Scheduled 24-hour advance appointment reminder.',
  },
  'booking.reminder_1h': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_reminder_1h',
    isEssential: false,
    description: 'Scheduled 1-hour advance appointment reminder.',
  },
  'booking.completed': {
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'booking_completed',
    isEssential: false,
    description: 'Notice to customer following completion of appointment, inviting review.',
  },

  // --- Admin Governance & Safety ---
  'admin.account_suspended': {
    category: NOTIFICATION_CATEGORIES.ADMIN_SAFETY,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'admin_account_suspended',
    isEssential: true,
    description: 'Formal notification when an account is suspended with policy reason.',
  },
  'admin.account_reactivated': {
    category: NOTIFICATION_CATEGORIES.ADMIN_SAFETY,
    channels: [CHANNELS.EMAIL, CHANNELS.IN_APP],
    templateKey: 'admin_account_reactivated',
    isEssential: true,
    description: 'Notification when an account suspension is lifted by administrative review.',
  },
  'admin.staff_provisioned': {
    category: NOTIFICATION_CATEGORIES.ADMIN_SAFETY,
    channels: [CHANNELS.EMAIL],
    templateKey: 'admin_staff_provisioned',
    isEssential: true,
    description: 'Invitation and credential setup instructions for newly provisioned admin staff.',
  },

  // --- Partner Inquiry ---
  'partner.inquiry_received': {
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    channels: [CHANNELS.EMAIL],
    templateKey: 'partner_inquiry_received',
    isEssential: false,
    description: 'Acknowledgment email to enterprise partner submitting inquiry.',
  },
};

module.exports = {
  NOTIFICATION_CATEGORIES,
  CHANNELS,
  EVENT_CATALOG,
};
