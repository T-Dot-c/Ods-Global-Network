/**
 * ODS Global Network — Notification Template Seeder
 *
 * Seeds baseline default templates and initial versions into the database
 * so they are immediately available for the worker and can be edited in Admin Console.
 */
'use strict';

const pool = require('../db');
const { NOTIFICATION_CATEGORIES } = require('./notificationCatalog');

const DEFAULT_TEMPLATES = [
  // 1. Account Security
  {
    key: 'auth_verification_requested',
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    is_essential: true,
    description: 'Email verification link sent upon registration or email change',
    subject: 'Verify your ODS Global Network account',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>Thank you for registering with ODS Global Network. Please verify your email address to activate all account features.</p>
      <p>This verification link will remain active for 24 hours.</p>
    `,
    body_text: 'Hello {{firstName}},\n\nPlease verify your email by opening the link below in your browser:\n{{actionUrl}}\n\nThis link expires in 24 hours.',
  },
  {
    key: 'auth_password_reset_requested',
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    is_essential: true,
    description: 'Password reset link sent upon forgotten password request',
    subject: 'Reset your ODS Global Network password',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>We received a request to reset the password for your ODS Global Network account.</p>
      <p>Click the button below to choose a new password. This link expires in 15 minutes.</p>
      <p>If you did not make this request, please disregard this email or contact support if you suspect unauthorized access.</p>
    `,
    body_text: 'Hello {{firstName}},\n\nWe received a password reset request for your account.\n\nReset your password here:\n{{actionUrl}}\n\nThis link expires in 15 minutes.',
  },
  {
    key: 'auth_password_changed',
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    is_essential: true,
    description: 'Security alert dispatched when password is changed',
    subject: 'Security Alert: Your password has been changed',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>This is a confirmation that your ODS Global Network password was recently changed.</p>
      <p>If you initiated this change, no further action is necessary.</p>
      <p style="color: #b91c1c; font-weight: 600;">If you did NOT make this change, please contact our emergency security team immediately.</p>
    `,
    body_text: 'Hello {{firstName}},\n\nYour ODS Global Network account password was changed. If you did not authorize this change, contact support immediately.',
  },
  {
    key: 'auth_duplicate_registration_alert',
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    is_essential: true,
    description: 'Notice to account owner of another registration attempt',
    subject: 'Security Notice: Registration attempt with your email',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>Someone recently attempted to register a new account using your email address on ODS Global Network.</p>
      <p>Because you already hold an active account, no new account was created.</p>
      <p>If this was you, you can log in directly or reset your password if you forgot it.</p>
    `,
    body_text: 'Hello {{firstName}},\n\nAn attempt was made to register a new account with your email. If this was you, please sign in directly.',
  },
  {
    key: 'auth_new_login_alert',
    category: NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY,
    is_essential: false,
    description: 'Notice when account signs in from a new IP/agent',
    subject: 'New sign-in to your ODS Global account',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>Your account was just accessed from a new device or IP address ({{ipAddress}}).</p>
      <p>Time: {{loginTime}}</p>
      <p>If this was you, you can safely ignore this alert.</p>
    `,
    body_text: 'Hello {{firstName}},\n\nNew sign-in detected at {{loginTime}} from IP {{ipAddress}}.',
  },

  // 2. Onboarding & KYC
  {
    key: 'onboarding_application_received',
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    is_essential: true,
    description: 'Confirmation to provider/merchant that onboarding submission was received',
    subject: 'Application Received — ODS Global Healthcare Accreditation',
    body_html: `
      <p>Dear {{organizationName}},</p>
      <p>Thank you for submitting your onboarding documentation and accreditation details.</p>
      <p>Application Reference: <strong>{{referenceNumber}}</strong></p>
      <p>Our Compliance & Medical Verification Team will review your submitted credentials. Reviews typically conclude within 2 to 3 business days.</p>
    `,
    body_text: 'Dear {{organizationName}},\n\nYour application {{referenceNumber}} has been received and is under review by our compliance team.',
  },
  {
    key: 'onboarding_admin_new_application',
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    is_essential: true,
    description: 'Internal alert to compliance staff for new application review',
    subject: 'New KYC Application Pending Review: {{organizationName}}',
    body_html: `
      <p>A new healthcare provider application has been submitted and is ready for compliance review.</p>
      <p><strong>Provider:</strong> {{organizationName}} ({{category}})</p>
      <p><strong>License / Reg No:</strong> {{licenseNumber}}</p>
      <p>Please log in to the Admin Console to review credentials and regulatory documents.</p>
    `,
    body_text: 'New KYC Application: {{organizationName}} ({{category}}). Review in Admin Console.',
  },
  {
    key: 'onboarding_info_requested',
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    is_essential: true,
    description: 'Compliance team requested additional documentation',
    subject: 'Action Required: Additional Information Requested for Your Application',
    body_html: `
      <p>Dear {{organizationName}},</p>
      <p>Our compliance team has reviewed your application (Ref: <strong>{{referenceNumber}}</strong>) and requires additional clarification before completing accreditation:</p>
      <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #0284c7; margin: 16px 0;">
        {{notes}}
      </blockquote>
      <p>Please sign in to your provider dashboard and upload the requested documentation.</p>
    `,
    body_text: 'Dear {{organizationName}},\n\nAdditional information is requested for your application {{referenceNumber}}:\n\n{{notes}}\n\nPlease upload the documents in your portal.',
  },
  {
    key: 'onboarding_approved',
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    is_essential: true,
    description: 'Accreditation approval notice',
    subject: 'Congratulations! Your ODS Global Healthcare Accreditation is Approved',
    body_html: `
      <p>Dear {{organizationName}},</p>
      <p>We are delighted to inform you that your compliance review is complete and your application has been <strong>approved</strong>.</p>
      <p>Your healthcare facility profile and service listings are now eligible to be published on the ODS Global Network.</p>
    `,
    body_text: 'Dear {{organizationName}},\n\nCongratulations! Your application has been approved. You may now publish service listings.',
  },
  {
    key: 'onboarding_rejected',
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    is_essential: true,
    description: 'Application rejection notice',
    subject: 'Update Regarding Your ODS Global Network Application',
    body_html: `
      <p>Dear {{organizationName}},</p>
      <p>Thank you for your interest in joining ODS Global Network. Following review by our compliance committee, we regret to inform you that we are unable to approve your application at this time.</p>
      <p><strong>Reason:</strong></p>
      <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #ef4444; margin: 16px 0;">
        {{reason}}
      </blockquote>
      <p>If you believe this determination was made in error or if your accreditation details change, you may submit an appeal to compliance@ods-global.net.</p>
    `,
    body_text: 'Dear {{organizationName}},\n\nYour application could not be approved at this time.\nReason: {{reason}}',
  },

  // 3. Catalog & Moderation
  {
    key: 'catalog_service_submitted',
    category: NOTIFICATION_CATEGORIES.CATALOG,
    is_essential: false,
    description: 'Service submitted for review',
    subject: 'Service Listing Submitted: {{serviceTitle}}',
    body_html: `
      <p>Hello {{providerName}},</p>
      <p>Your service listing <strong>{{serviceTitle}}</strong> has been submitted for compliance and safety review.</p>
      <p>You will receive a notification once the review is finalized.</p>
    `,
    body_text: 'Hello {{providerName}},\n\nYour service listing "{{serviceTitle}}" has been submitted for review.',
  },
  {
    key: 'catalog_service_approved',
    category: NOTIFICATION_CATEGORIES.CATALOG,
    is_essential: false,
    description: 'Service listing approved and published',
    subject: 'Service Approved & Published: {{serviceTitle}}',
    body_html: `
      <p>Hello {{providerName}},</p>
      <p>Great news! Your service listing <strong>{{serviceTitle}}</strong> has been approved and is now live on the public directory.</p>
      <p>Patients can now discover your offering and book appointments.</p>
    `,
    body_text: 'Hello {{providerName}},\n\nYour service listing "{{serviceTitle}}" is approved and now live.',
  },
  {
    key: 'catalog_service_rejected',
    category: NOTIFICATION_CATEGORIES.CATALOG,
    is_essential: false,
    description: 'Service listing rejected',
    subject: 'Service Listing Update: {{serviceTitle}}',
    body_html: `
      <p>Hello {{providerName}},</p>
      <p>Our review team was unable to publish your listing <strong>{{serviceTitle}}</strong>.</p>
      <p><strong>Feedback:</strong> {{feedback}}</p>
      <p>Please edit your service details in the provider portal and resubmit.</p>
    `,
    body_text: 'Hello {{providerName}},\n\nYour service listing "{{serviceTitle}}" requires revisions:\n{{feedback}}',
  },
  {
    key: 'catalog_service_taken_down',
    category: NOTIFICATION_CATEGORIES.CATALOG,
    is_essential: true,
    description: 'Service listing taken down',
    subject: 'Notice: Service Listing Taken Down ({{serviceTitle}})',
    body_html: `
      <p>Hello {{providerName}},</p>
      <p>Your service listing <strong>{{serviceTitle}}</strong> has been temporarily removed from public view by an administrator.</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p>Please contact provider support for guidance on restoring your listing.</p>
    `,
    body_text: 'Hello {{providerName}},\n\nYour listing "{{serviceTitle}}" was taken down by an administrator.\nReason: {{reason}}',
  },

  // 4. Payments
  {
    key: 'payment_receipt',
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    is_essential: true,
    description: 'Payment receipt',
    subject: 'Receipt for Your Payment (Ref: {{transactionRef}})',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>Thank you for your payment. Your transaction has been confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #64748b;">Transaction Reference:</td><td style="font-weight: 600; text-align: right;">{{transactionRef}}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Item / Service:</td><td style="font-weight: 600; text-align: right;">{{itemDescription}}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Amount Paid:</td><td style="font-weight: 700; color: #0284c7; text-align: right;">{{amount}} ETB</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Payment Method:</td><td style="text-align: right;">{{paymentMethod}}</td></tr>
      </table>
    `,
    body_text: 'Hello {{customerName}},\n\nPayment receipt for {{transactionRef}}:\nAmount: {{amount}} ETB\nItem: {{itemDescription}}',
  },
  {
    key: 'payment_failed',
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    is_essential: true,
    description: 'Payment failed alert',
    subject: 'Payment Unsuccessful (Ref: {{transactionRef}})',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>We were unable to process your payment of <strong>{{amount}} ETB</strong> for {{itemDescription}}.</p>
      <p><strong>Reason:</strong> {{errorMessage}}</p>
      <p>No funds were deducted. You may try again with an alternative payment method.</p>
    `,
    body_text: 'Hello {{customerName}},\n\nPayment of {{amount}} ETB for {{itemDescription}} was unsuccessful. Reason: {{errorMessage}}.',
  },
  {
    key: 'payment_refund_issued',
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    is_essential: true,
    description: 'Refund processed confirmation',
    subject: 'Refund Confirmation ({{refundAmount}} ETB)',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>A refund of <strong>{{refundAmount}} ETB</strong> has been issued for your transaction {{transactionRef}}.</p>
      <p><strong>Reason:</strong> {{refundReason}}</p>
      <p>Depending on your payment provider, funds typically settle within 3 to 5 business days.</p>
    `,
    body_text: 'Hello {{customerName}},\n\nA refund of {{refundAmount}} ETB has been processed for transaction {{transactionRef}}.\nReason: {{refundReason}}',
  },
  {
    key: 'payment_admin_refund_approval_pending',
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    is_essential: true,
    description: 'Dual authorization refund notice',
    subject: 'Action Required: High-Value Refund Approval ({{refundAmount}} ETB)',
    body_html: `
      <p>A refund request exceeding standard authorization limits requires secondary approval.</p>
      <p><strong>Amount:</strong> {{refundAmount}} ETB</p>
      <p><strong>Initiator:</strong> {{initiatorEmail}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p>Please log in to the Admin Console to authorize or reject this refund.</p>
    `,
    body_text: 'Secondary refund authorization required for {{refundAmount}} ETB. Review in Admin Console.',
  },

  // 5. Gifts & Vouchers
  {
    key: 'gift_purchased_receipt',
    category: NOTIFICATION_CATEGORIES.GIFTS,
    is_essential: true,
    description: 'Receipt for gift voucher purchase',
    subject: 'Your ODS Healthcare Gift Card Order ({{amount}} ETB)',
    body_html: `
      <p>Hello {{senderName}},</p>
      <p>Thank you for purchasing an ODS Healthcare Gift Card for <strong>{{recipientName}}</strong>.</p>
      <p><strong>Value:</strong> {{amount}} ETB</p>
      <p><strong>Scheduled Delivery:</strong> {{deliveryDate}}</p>
      <p>We will deliver the presentation email to {{recipientEmail}} as scheduled.</p>
    `,
    body_text: 'Hello {{senderName}},\n\nYour gift card purchase of {{amount}} ETB for {{recipientName}} is confirmed. Delivery scheduled for {{deliveryDate}}.',
  },
  {
    key: 'gift_delivered',
    category: NOTIFICATION_CATEGORIES.GIFTS,
    is_essential: true,
    description: 'Gift card presentation delivered to recipient',
    subject: '{{senderName}} sent you an ODS Healthcare Gift Card ({{amount}} ETB)',
    body_html: `
      <p>Hello {{recipientName}},</p>
      <p><strong>{{senderName}}</strong> has gifted you an ODS Global Network Healthcare Gift Card valued at <strong>{{amount}} ETB</strong>!</p>
      <blockquote style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px; margin: 20px 0; font-style: italic;">
        "{{personalMessage}}"
      </blockquote>
      <p>You can use this gift card to book medical consultations, diagnostics, and accredited healthcare services across our network.</p>
      <p>Click below to reveal your voucher and claim it to your account or present it to an accredited provider:</p>
    `,
    body_text: 'Hello {{recipientName}},\n\n{{senderName}} sent you an ODS Healthcare Gift Card of {{amount}} ETB!\nMessage: "{{personalMessage}}"\nClaim link: {{actionUrl}}',
  },
  {
    key: 'gift_redeemed_notice',
    category: NOTIFICATION_CATEGORIES.GIFTS,
    is_essential: false,
    description: 'Notice to sender that gift was redeemed',
    subject: 'Your Gift Card to {{recipientName}} has been Redeemed',
    body_html: `
      <p>Hello {{senderName}},</p>
      <p>Wonderful news! The healthcare gift card of <strong>{{amount}} ETB</strong> you sent to {{recipientName}} has just been redeemed.</p>
      <p>Thank you for supporting your loved ones\' health and wellbeing through ODS Global Network.</p>
    `,
    body_text: 'Hello {{senderName}},\n\nThe gift card of {{amount}} ETB you sent to {{recipientName}} has been redeemed.',
  },
  {
    key: 'gift_expiry_warning',
    category: NOTIFICATION_CATEGORIES.GIFTS,
    is_essential: false,
    description: 'Gift voucher expiry warning',
    subject: 'Reminder: Your Healthcare Gift Card Expires Soon',
    body_html: `
      <p>Hello {{recipientName}},</p>
      <p>This is a gentle reminder that your healthcare gift card voucher of <strong>{{amount}} ETB</strong> will expire on <strong>{{expiryDate}}</strong>.</p>
      <p>Do not let your gift go unused! Browse accredited clinics and services to schedule an appointment today.</p>
    `,
    body_text: 'Hello {{recipientName}},\n\nYour healthcare gift card of {{amount}} ETB will expire on {{expiryDate}}. Redeem it soon!',
  },

  // 6. Bookings & Appointments
  {
    key: 'booking_created_awaiting_provider',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: true,
    description: 'Booking request sent to provider',
    subject: 'Booking Received: {{serviceTitle}} (Ref: {{reference}})',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>Your booking request for <strong>{{serviceTitle}}</strong> has been submitted to <strong>{{providerName}}</strong>.</p>
      <p><strong>Appointment Time:</strong> {{appointmentTime}}</p>
      <p>The provider will review and accept your appointment shortly. We will notify you as soon as it is confirmed.</p>
    `,
    body_text: 'Hello {{customerName}},\n\nYour booking request for {{serviceTitle}} on {{appointmentTime}} has been sent to {{providerName}}.',
  },
  {
    key: 'booking_provider_new_request',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: true,
    description: 'New booking alert for provider',
    subject: 'New Booking Request: {{serviceTitle}} from {{customerName}}',
    body_html: `
      <p>Hello {{providerName}},</p>
      <p>You have received a new appointment booking request from <strong>{{customerName}}</strong>.</p>
      <p><strong>Service:</strong> {{serviceTitle}}</p>
      <p><strong>Requested Time:</strong> {{appointmentTime}}</p>
      <p>Please log in to your provider portal to accept or decline this appointment within 24 hours.</p>
    `,
    body_text: 'Hello {{providerName}},\n\nNew booking request for {{serviceTitle}} from {{customerName}} on {{appointmentTime}}.',
  },
  {
    key: 'booking_confirmed',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: true,
    description: 'Appointment confirmed',
    subject: 'Appointment Confirmed: {{serviceTitle}} (Ref: {{reference}})',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>Your appointment with <strong>{{providerName}}</strong> is <strong>confirmed</strong>!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #64748b;">Service:</td><td style="font-weight: 600;">{{serviceTitle}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date & Time:</td><td style="font-weight: 600; color: #0284c7;">{{appointmentTime}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Location / Facility:</td><td>{{facilityAddress}}</td></tr>
      </table>
      <p>Please arrive 10 minutes prior to your scheduled time.</p>
    `,
    body_text: 'Hello {{customerName}},\n\nYour appointment for {{serviceTitle}} with {{providerName}} is confirmed for {{appointmentTime}} at {{facilityAddress}}.',
  },
  {
    key: 'booking_declined',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: true,
    description: 'Appointment declined by provider',
    subject: 'Booking Request Update (Ref: {{reference}})',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>Unfortunately, {{providerName}} is unable to accommodate your appointment request for <strong>{{serviceTitle}}</strong> at the requested time.</p>
      <p><strong>Reason:</strong> {{declineReason}}</p>
      <p>If payment was held, the authorization hold has been released immediately. You may choose an alternative time or provider.</p>
    `,
    body_text: 'Hello {{customerName}},\n\n{{providerName}} declined your booking request for {{serviceTitle}}. Reason: {{declineReason}}.',
  },
  {
    key: 'booking_cancelled',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: true,
    description: 'Booking cancelled notice',
    subject: 'Appointment Cancelled: {{serviceTitle}} (Ref: {{reference}})',
    body_html: `
      <p>Hello {{recipientName}},</p>
      <p>This is to confirm that the appointment for <strong>{{serviceTitle}}</strong> scheduled for <strong>{{appointmentTime}}</strong> has been <strong>cancelled</strong>.</p>
      <p><strong>Cancelled by:</strong> {{cancelledBy}}</p>
      <p><strong>Reason:</strong> {{cancelReason}}</p>
      <p>Any applicable refunds will be processed in accordance with the service cancellation policy.</p>
    `,
    body_text: 'Hello {{recipientName}},\n\nAppointment for {{serviceTitle}} on {{appointmentTime}} has been cancelled by {{cancelledBy}}.\nReason: {{cancelReason}}',
  },
  {
    key: 'booking_rescheduled',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: true,
    description: 'Booking rescheduled notice',
    subject: 'Appointment Rescheduled: {{serviceTitle}} (Ref: {{reference}})',
    body_html: `
      <p>Hello {{recipientName}},</p>
      <p>The appointment for <strong>{{serviceTitle}}</strong> has been rescheduled.</p>
      <p><strong>New Date &amp; Time:</strong> <span style="color: #0284c7; font-weight: 700;">{{newAppointmentTime}}</span></p>
      <p><strong>Previous Time:</strong> {{oldAppointmentTime}}</p>
      <p><strong>Facility:</strong> {{facilityAddress}}</p>
    `,
    body_text: 'Hello {{recipientName}},\n\nAppointment rescheduled to {{newAppointmentTime}} (previously {{oldAppointmentTime}}).',
  },
  {
    key: 'booking_reminder_24h',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: false,
    description: '24-hour advance appointment reminder',
    subject: 'Reminder: Tomorrow\'s Appointment with {{providerName}}',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>This is a reminder that you have an upcoming appointment scheduled for tomorrow:</p>
      <p><strong>Service:</strong> {{serviceTitle}}</p>
      <p><strong>Time:</strong> <span style="font-weight: 700; color: #0284c7;">{{appointmentTime}}</span></p>
      <p><strong>Location:</strong> {{facilityAddress}}</p>
      <p>If you need to reschedule, please notify us at least 2 hours in advance.</p>
    `,
    body_text: 'Hello {{customerName}},\n\nReminder: Appointment tomorrow for {{serviceTitle}} at {{appointmentTime}} with {{providerName}}.',
  },
  {
    key: 'booking_reminder_1h',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: false,
    description: '1-hour advance appointment reminder',
    subject: 'Starting in 1 Hour: Appointment with {{providerName}}',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>Your appointment for <strong>{{serviceTitle}}</strong> begins in 1 hour at <strong>{{appointmentTime}}</strong>.</p>
      <p><strong>Facility Location:</strong> {{facilityAddress}}</p>
      <p>Have your ID and reference <strong>{{reference}}</strong> ready when you arrive.</p>
    `,
    body_text: 'Hello {{customerName}},\n\nYour appointment for {{serviceTitle}} begins in 1 hour at {{facilityAddress}}.',
  },
  {
    key: 'booking_completed',
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    is_essential: false,
    description: 'Post-appointment review invitation',
    subject: 'How was your appointment with {{providerName}}?',
    body_html: `
      <p>Hello {{customerName}},</p>
      <p>We hope your appointment for <strong>{{serviceTitle}}</strong> on {{appointmentTime}} went well.</p>
      <p>Your feedback helps maintain quality standards across our network. Please take a moment to rate your experience.</p>
    `,
    body_text: 'Hello {{customerName}},\n\nHow was your visit with {{providerName}} for {{serviceTitle}}? Leave a review to help others.',
  },

  // 7. Admin Governance & Safety
  {
    key: 'admin_account_suspended',
    category: NOTIFICATION_CATEGORIES.ADMIN_SAFETY,
    is_essential: true,
    description: 'Account suspension notice',
    subject: 'Important Notice: Your Account Has Been Suspended',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>Your ODS Global Network account has been suspended following administrative safety review.</p>
      <p><strong>Reason:</strong></p>
      <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #ef4444; margin: 16px 0;">
        {{reason}}
      </blockquote>
      <p>Active appointments and listing visibility have been put on hold. If you believe this action was taken in error, you may submit an appeal to compliance@ods-global.net.</p>
    `,
    body_text: 'Hello {{firstName}},\n\nYour account has been suspended.\nReason: {{reason}}\nContact compliance@ods-global.net to appeal.',
  },
  {
    key: 'admin_account_reactivated',
    category: NOTIFICATION_CATEGORIES.ADMIN_SAFETY,
    is_essential: true,
    description: 'Account suspension lifted',
    subject: 'Notice: Your ODS Global Account Has Been Reactivated',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>We are pleased to inform you that your account suspension has been lifted following administrative review.</p>
      <p>You may now sign in and resume full access to the platform.</p>
    `,
    body_text: 'Hello {{firstName}},\n\nYour account has been reactivated. You may sign in immediately.',
  },
  {
    key: 'admin_staff_provisioned',
    category: NOTIFICATION_CATEGORIES.ADMIN_SAFETY,
    is_essential: true,
    description: 'Staff member account invitation',
    subject: 'Welcome to ODS Global Network — Staff Account Provisioned',
    body_html: `
      <p>Hello {{firstName}},</p>
      <p>An administrative staff account has been created for you on the ODS Global Network Admin Console.</p>
      <p><strong>Assigned Role / Group:</strong> {{assignedRole}}</p>
      <p>Please click the link below to set your permanent password and access the console:</p>
    `,
    body_text: 'Hello {{firstName}},\n\nYour administrative staff account (Role: {{assignedRole}}) is ready.\nSet password: {{actionUrl}}',
  },

  // 8. Partner Inquiries
  {
    key: 'partner_inquiry_received',
    category: NOTIFICATION_CATEGORIES.ONBOARDING_KYC,
    is_essential: false,
    description: 'Enterprise partner inquiry confirmation',
    subject: 'Inquiry Received — ODS Global Network Partnerships',
    body_html: `
      <p>Dear {{contactPerson}},</p>
      <p>Thank you for reaching out regarding a partnership with ODS Global Network on behalf of <strong>{{companyName}}</strong>.</p>
      <p>Our business partnerships team is reviewing your inquiry and will connect with you within 1 to 2 business days.</p>
    `,
    body_text: 'Dear {{contactPerson}},\n\nThank you for reaching out regarding partnership opportunities for {{companyName}}. Our team will reply shortly.',
  },
];

async function seedDefaultNotificationTemplates(client = null) {
  const runner = client || pool;

  console.log(`[NotificationSeeder] Seeding ${DEFAULT_TEMPLATES.length} baseline templates...`);

  for (const t of DEFAULT_TEMPLATES) {
    // 1. Upsert template definition
    await runner.query(`
      INSERT INTO notification_templates (key, channel, category, is_essential, description)
      VALUES ($1, 'email', $2, $3, $4)
      ON CONFLICT (key) DO UPDATE
      SET category = EXCLUDED.category,
          is_essential = EXCLUDED.is_essential,
          description = EXCLUDED.description,
          updated_at = NOW();
    `, [t.key, t.category, t.is_essential, t.description]);

    // 2. Ensure initial version (version 1, en) exists
    await runner.query(`
      INSERT INTO notification_template_versions (
        template_key, version, locale, subject, body_html, body_text, is_active
      )
      VALUES ($1, 1, 'en', $2, $3, $4, TRUE)
      ON CONFLICT (template_key, version, locale) DO NOTHING;
    `, [t.key, t.subject, t.body_html.trim(), t.body_text.trim()]);
  }

  console.log('[NotificationSeeder] Seed complete.');
}

if (require.main === module) {
  seedDefaultNotificationTemplates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[NotificationSeeder] Error seeding templates:', err);
      process.exit(1);
    });
}

module.exports = {
  DEFAULT_TEMPLATES,
  seedDefaultNotificationTemplates,
};
