/**
 * ODS Global Network — Notification Template Service
 *
 * Handles template retrieval, version resolution, Mustache/Handlebars-style variable
 * interpolation with strict HTML-escaping, and responsive HTML email wrapping.
 */
'use strict';

const pool = require('../db');

/**
 * Escapes characters for HTML output to prevent XSS / HTML injection.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats ETB currency amounts nicely
 */
function formatETB(amount) {
  if (amount === undefined || amount === null) return '0.00 ETB';
  const num = Number(amount);
  if (isNaN(num)) return `${amount} ETB`;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
}

/**
 * Formats a Date into Ethiopia Timezone (Africa/Addis_Ababa, UTC+3)
 */
function formatEthiopianDate(dateValue) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleString('en-US', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' (EAT)';
}

/**
 * Safely resolves nested property strings like 'booking.customer.name'
 */
function resolvePath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.trim().split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

/**
 * Renders a template string by replacing {{variable}} placeholders with escaped data.
 * Supports triple curly {{{variable}}} for unescaped content (restricted/safe only).
 */
function interpolate(templateStr, data = {}) {
  if (!templateStr) return '';

  // 1. Triple-curly unescaped {{{variable}}}
  let result = templateStr.replace(/\{\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}\}/g, (match, key) => {
    const val = resolvePath(data, key);
    return val !== undefined && val !== null ? String(val) : '';
  });

  // 2. Double-curly escaped {{variable}}
  result = result.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    const val = resolvePath(data, key);
    return val !== undefined && val !== null ? escapeHtml(val) : '';
  });

  return result;
}

/**
 * Wraps content in standard responsive ODS Global Network brand shell
 */
function wrapBrandEmailLayout({ title, contentHtml, actionButton, unsubscribeUrl }) {
  const brandPrimary = '#0b1f3a';   // Deep navy
  const brandAccent = '#0284c7';    // Electric cyan/blue
  const brandGold = '#eab308';      // Accent gold
  const neutralBg = '#f8fafc';
  const cardBg = '#ffffff';
  const textDark = '#1e293b';
  const textMuted = '#64748b';

  const buttonHtml = actionButton && actionButton.url && actionButton.text ? `
    <div style="margin: 32px 0 24px 0; text-align: center;">
      <a href="${escapeHtml(actionButton.url)}" style="background-color: ${brandAccent}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(2,132,199,0.25);">
        ${escapeHtml(actionButton.text)}
      </a>
    </div>
  ` : '';

  const unsubscribeHtml = unsubscribeUrl ? `
    <p style="margin-top: 16px; font-size: 12px; color: ${textMuted};">
      If you no longer wish to receive this type of email, you can <a href="${escapeHtml(unsubscribeUrl)}" style="color: ${brandAccent}; text-decoration: underline;">unsubscribe here</a>.
    </p>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || 'ODS Global Network')}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${neutralBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textDark}; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${neutralBg}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${cardBg}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: ${brandPrimary}; padding: 24px 32px; border-bottom: 3px solid ${brandAccent};">
              <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">
                ODS <span style="color: ${brandAccent};">GLOBAL</span> NETWORK
              </div>
              <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
                Healthcare Access &amp; Discovery
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: ${brandPrimary}; line-height: 1.3;">
                ${escapeHtml(title)}
              </h1>
              <div style="font-size: 15px; color: ${textDark}; line-height: 1.6;">
                ${contentHtml}
              </div>
              ${buttonHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: ${textMuted}; text-align: center;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">ODS Global Network Ltd.</p>
              <p style="margin: 0 0 8px 0;">Addis Ababa, Ethiopia &bull; Connecting Patients with Accredited Healthcare</p>
              <p style="margin: 0;">This is an automated system notification. For inquiries, visit our support portal.</p>
              ${unsubscribeHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Loads an active template version from DB or falls back to built-in code defaults
 */
async function getTemplateVersion(templateKey, locale = 'en', client = null) {
  const runner = client || pool;

  const query = `
    SELECT v.id, v.template_key, v.version, v.locale, v.subject, v.body_html, v.body_text, t.is_essential, t.category
    FROM notification_template_versions v
    JOIN notification_templates t ON t.key = v.template_key
    WHERE v.template_key = $1 AND v.locale = $2 AND v.is_active = TRUE
    ORDER BY v.version DESC
    LIMIT 1;
  `;

  const { rows } = await runner.query(query, [templateKey, locale]);
  if (rows.length > 0) {
    return rows[0];
  }

  // Fallback to English if localized version was requested but not found
  if (locale !== 'en') {
    const { rows: fallbackRows } = await runner.query(query, [templateKey, 'en']);
    if (fallbackRows.length > 0) return fallbackRows[0];
  }

  return null;
}

/**
 * Previews/Renders a template with given payload data
 */
async function renderNotification(templateKey, payload = {}, locale = 'en', options = {}) {
  const tpl = await getTemplateVersion(templateKey, locale);
  if (!tpl) {
    throw new Error(`[NotificationTemplateService] No active template found for key="${templateKey}" locale="${locale}"`);
  }

  // Inject standard formatting helpers into data payload
  const renderData = {
    ...payload,
    helpers: {
      formatETB,
      formatEthiopianDate,
    },
  };

  const subject = interpolate(tpl.subject, renderData);
  const rawHtml = interpolate(tpl.body_html, renderData);
  const text = interpolate(tpl.body_text, renderData);

  const fullHtml = wrapBrandEmailLayout({
    title: subject,
    contentHtml: rawHtml,
    actionButton: options.actionButton || payload.actionButton,
    unsubscribeUrl: options.unsubscribeUrl,
  });

  return {
    templateKey,
    templateVersion: tpl.version,
    subject,
    html: fullHtml,
    text,
    category: tpl.category,
    isEssential: tpl.is_essential,
  };
}

module.exports = {
  escapeHtml,
  formatETB,
  formatEthiopianDate,
  interpolate,
  wrapBrandEmailLayout,
  getTemplateVersion,
  renderNotification,
};
