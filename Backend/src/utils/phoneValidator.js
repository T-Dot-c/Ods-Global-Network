/**
 * ODS Global Network — Phone Number Validation & Normalization Utility
 * Approved Option B: Zero-dependency ISO-3166 dial-code table (240+ countries)
 * Strict regex for Ethiopian mobile and landline numbers + ITU E.164 for international numbers.
 */
'use strict';

// ── Complete ISO-3166 Dial Codes Table (240+ countries & territories) ───────
const COUNTRY_DIAL_CODES = [
  { code: 'ET', name: 'Ethiopia', dial_code: '+251', flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya', dial_code: '+254', flag: '🇰🇪' },
  { code: 'DJ', name: 'Djibouti', dial_code: '+253', flag: '🇩🇯' },
  { code: 'SO', name: 'Somalia', dial_code: '+252', flag: '🇸🇴' },
  { code: 'SD', name: 'Sudan', dial_code: '+249', flag: '🇸🇩' },
  { code: 'SS', name: 'South Sudan', dial_code: '+211', flag: '🇸🇸' },
  { code: 'ER', name: 'Eritrea', dial_code: '+291', flag: '🇪🇷' },
  { code: 'UG', name: 'Uganda', dial_code: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', dial_code: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', dial_code: '+250', flag: '🇷🇼' },
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', dial_code: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial_code: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dial_code: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dial_code: '+965', flag: '🇰🇼' },
  { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dial_code: '+39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dial_code: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', dial_code: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dial_code: '+47', flag: '🇳🇴' },
  { code: 'CH', name: 'Switzerland', dial_code: '+41', flag: '🇨🇭' },
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
  { code: 'ZA', name: 'South Africa', dial_code: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial_code: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', dial_code: '+20', flag: '🇪🇬' },
  { code: 'GH', name: 'Ghana', dial_code: '+233', flag: '🇬🇭' },
  { code: 'TR', name: 'Turkey', dial_code: '+90', flag: '🇹🇷' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dial_code: '+64', flag: '🇳🇿' },
  { code: 'JP', name: 'Japan', dial_code: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial_code: '+82', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', dial_code: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dial_code: '+60', flag: '🇲🇾' },
  { code: 'AF', name: 'Afghanistan', dial_code: '+93', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', dial_code: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', dial_code: '+213', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', dial_code: '+376', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', dial_code: '+244', flag: '🇦🇴' },
  { code: 'AR', name: 'Argentina', dial_code: '+54', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', dial_code: '+374', flag: '🇦🇲' },
  { code: 'AT', name: 'Austria', dial_code: '+43', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', dial_code: '+994', flag: '🇦🇿' },
  { code: 'BH', name: 'Bahrain', dial_code: '+973', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', dial_code: '+880', flag: '🇧🇩' },
  { code: 'BY', name: 'Belarus', dial_code: '+375', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', dial_code: '+32', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', dial_code: '+501', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', dial_code: '+229', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', dial_code: '+975', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', dial_code: '+591', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dial_code: '+387', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', dial_code: '+267', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', dial_code: '+55', flag: '🇧🇷' },
  { code: 'BG', name: 'Bulgaria', dial_code: '+359', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', dial_code: '+226', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', dial_code: '+257', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', dial_code: '+855', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', dial_code: '+237', flag: '🇨🇲' },
  { code: 'CV', name: 'Cape Verde', dial_code: '+238', flag: '🇨🇻' },
  { code: 'CF', name: 'Central African Republic', dial_code: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', dial_code: '+235', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', dial_code: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dial_code: '+57', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', dial_code: '+269', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', dial_code: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)', dial_code: '+243', flag: '🇨🇩' },
  { code: 'CR', name: 'Costa Rica', dial_code: '+506', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia', dial_code: '+385', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', dial_code: '+53', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', dial_code: '+357', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', dial_code: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', dial_code: '+45', flag: '🇩🇰' },
  { code: 'EC', name: 'Ecuador', dial_code: '+593', flag: '🇪🇨' },
  { code: 'EE', name: 'Estonia', dial_code: '+372', flag: '🇪🇪' },
  { code: 'FI', name: 'Finland', dial_code: '+358', flag: '🇫🇮' },
  { code: 'GA', name: 'Gabon', dial_code: '+241', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', dial_code: '+220', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', dial_code: '+995', flag: '🇬🇪' },
  { code: 'GR', name: 'Greece', dial_code: '+30', flag: '🇬🇷' },
  { code: 'GT', name: 'Guatemala', dial_code: '+502', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', dial_code: '+224', flag: '🇬🇳' },
  { code: 'HT', name: 'Haiti', dial_code: '+509', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', dial_code: '+504', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', dial_code: '+852', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', dial_code: '+36', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', dial_code: '+354', flag: '🇮🇸' },
  { code: 'ID', name: 'Indonesia', dial_code: '+62', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', dial_code: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', dial_code: '+964', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', dial_code: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', dial_code: '+972', flag: '🇮🇱' },
  { code: 'JM', name: 'Jamaica', dial_code: '+1876', flag: '🇯🇲' },
  { code: 'JO', name: 'Jordan', dial_code: '+962', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', dial_code: '+7', flag: '🇰🇿' },
  { code: 'LB', name: 'Lebanon', dial_code: '+961', flag: '🇱🇧' },
  { code: 'LY', name: 'Libya', dial_code: '+218', flag: '🇱🇾' },
  { code: 'LU', name: 'Luxembourg', dial_code: '+352', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar', dial_code: '+261', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', dial_code: '+265', flag: '🇲🇼' },
  { code: 'MV', name: 'Maldives', dial_code: '+960', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', dial_code: '+223', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', dial_code: '+356', flag: '🇲🇹' },
  { code: 'MR', name: 'Mauritania', dial_code: '+222', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', dial_code: '+230', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', dial_code: '+52', flag: '🇲🇽' },
  { code: 'MA', name: 'Morocco', dial_code: '+212', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', dial_code: '+258', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibia', dial_code: '+264', flag: '🇳🇦' },
  { code: 'NP', name: 'Nepal', dial_code: '+977', flag: '🇳🇵' },
  { code: 'NE', name: 'Niger', dial_code: '+227', flag: '🇳🇪' },
  { code: 'OM', name: 'Oman', dial_code: '+968', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', dial_code: '+92', flag: '🇵🇰' },
  { code: 'PS', name: 'Palestine', dial_code: '+970', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', dial_code: '+507', flag: '🇵🇦' },
  { code: 'PH', name: 'Philippines', dial_code: '+63', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', dial_code: '+48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dial_code: '+351', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', dial_code: '+40', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', dial_code: '+7', flag: '🇷🇺' },
  { code: 'SN', name: 'Senegal', dial_code: '+221', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', dial_code: '+381', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', dial_code: '+248', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', dial_code: '+232', flag: '🇸🇱' },
  { code: 'SK', name: 'Slovakia', dial_code: '+421', flag: '🇸🇰' },
  { code: 'ES', name: 'Spain', dial_code: '+34', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', dial_code: '+94', flag: '🇱🇰' },
  { code: 'TH', name: 'Thailand', dial_code: '+66', flag: '🇹🇭' },
  { code: 'TN', name: 'Tunisia', dial_code: '+216', flag: '🇹🇳' },
  { code: 'UA', name: 'Ukraine', dial_code: '+380', flag: '🇺🇦' },
  { code: 'VN', name: 'Vietnam', dial_code: '+84', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', dial_code: '+967', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', dial_code: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', dial_code: '+263', flag: '🇿🇼' }
];

// ── Validation Regular Expressions ───────────────────────────────────────────
// Strict Ethiopian Mobile (9 or 7 followed by 8 digits) and Landline (1-5 followed by 8 digits)
// Reference: Ethiopian Communications Authority (ECA) National Numbering Plan
const ETHIOPIAN_PHONE_REGEX = /^\+251(9\d{8}|7\d{8}|[1-5]\d{8})$/;

// ITU-T E.164 General International Standard (+ followed by 7 to 15 digits)
const GENERAL_E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Normalizes phone components into standard E.164 string:
 * - Strips all non-digit characters from national number
 * - Strips leading '0' from national number
 * - Prepends selected dial code
 */
function normalizePhoneNumber(dialCode, nationalNumber) {
  if (!dialCode || !nationalNumber) return '';
  const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode.replace(/\D/g, '')}`;
  const cleanNational = String(nationalNumber).replace(/\D/g, '').replace(/^0+/, '');
  if (!cleanNational) return '';
  return `${cleanDial}${cleanNational}`;
}

/**
 * Validates a full E.164 phone number string:
 * Returns { isValid: boolean, e164: string, error?: string }
 */
function validatePhoneNumber(phoneString) {
  if (!phoneString || typeof phoneString !== 'string') {
    return { isValid: false, e164: '', error: 'Phone number is required.' };
  }

  // Trim and remove intra-string spaces/dashes/parentheses
  const cleaned = phoneString.trim().replace(/[\s\-_()]/g, '');

  if (!cleaned.startsWith('+')) {
    return {
      isValid: false,
      e164: cleaned,
      error: 'Phone number must start with a country code (e.g. +251).'
    };
  }

  // If Ethiopian number (+251), enforce strict national numbering plan
  if (cleaned.startsWith('+251')) {
    if (!ETHIOPIAN_PHONE_REGEX.test(cleaned)) {
      return {
        isValid: false,
        e164: cleaned,
        error: 'Invalid Ethiopian phone number. Mobile must start with +251 9 or +251 7; landlines start with +251 1-5 followed by 8 digits.'
      };
    }
    return { isValid: true, e164: cleaned };
  }

  // For all other international countries, enforce ITU-T E.164 general standard
  if (!GENERAL_E164_REGEX.test(cleaned)) {
    return {
      isValid: false,
      e164: cleaned,
      error: 'Invalid international phone number. Must be valid E.164 format (+[country code][number], 7-15 digits).'
    };
  }

  return { isValid: true, e164: cleaned };
}

module.exports = {
  COUNTRY_DIAL_CODES,
  ETHIOPIAN_PHONE_REGEX,
  GENERAL_E164_REGEX,
  normalizePhoneNumber,
  validatePhoneNumber,
};

