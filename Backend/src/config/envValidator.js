/**
 * ODS Global Network — Startup Environment Validator
 *
 * Validates required configuration variables and prevents booting with unsafe defaults in production.
 */
'use strict';

function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // 1. JWT Secret Validation
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is missing. Server cannot sign session tokens.');
  } else if (isProduction) {
    if (jwtSecret.includes('change-in-production') || jwtSecret.length < 32) {
      errors.push('JWT_SECRET is using a weak or default development secret in production.');
    }
  }

  // 2. Database Least Privilege Validation
  const dbUser = process.env.DB_USER;
  if (isProduction) {
    if (!dbUser || dbUser.toLowerCase() === 'postgres') {
      errors.push('DB_USER is configured as superuser "postgres" in production. Must run as least-privilege role "ods_app".');
    }
  }

  // 3. Dev Password Elimination
  if (isProduction && process.env.DEV_PASSWORD) {
    errors.push('DEV_PASSWORD is set in production environment. Dev account bypasses are strictly forbidden in production.');
  }

  // 4. Cookie Security Flags
  if (isProduction && process.env.COOKIE_SECURE !== 'true') {
    errors.push('COOKIE_SECURE must be "true" in production to enforce HTTPS-only cookies.');
  }

  // 5. CORS Origin Configuration
  const frontendOrigin = process.env.FRONTEND_ORIGIN;
  if (!frontendOrigin) {
    warnings.push('FRONTEND_ORIGIN is not defined. Defaulting to strict local origin.');
  } else if (isProduction && (frontendOrigin.includes('localhost') || frontendOrigin === '*')) {
    errors.push(`FRONTEND_ORIGIN cannot be localhost or wildcard "*" in production: received "${frontendOrigin}".`);
  }

  // 6. Payment Gateway Validation
  if (isProduction && (!process.env.CHAPA_SECRET_KEY || process.env.CHAPA_SECRET_KEY.includes('CHASECK_TEST-'))) {
    warnings.push('CHAPA_SECRET_KEY is using test sandbox credentials in production environment.');
  }

  // Output audit summary
  if (warnings.length > 0) {
    console.warn('\n⚠️  [ENV CONFIGURATION WARNINGS]');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.error('\n❌ [FATAL CONFIGURATION AUDIT ERRORS]');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\nServer boot halted due to security policy violations.\n');
    throw new Error(`Environment validation failed with ${errors.length} fatal error(s).`);
  }

  console.log(`[ConfigValidator] Environment validation passed (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode).`);
  return true;
}

module.exports = {
  validateEnvironment,
};
