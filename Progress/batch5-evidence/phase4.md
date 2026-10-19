# Batch 5 — Phase 4 Evidence Report

**Phase:** Phase 4 — Registration, Verification & Sensitive Action Gating
**Date/Time:** 2026-10-16 14:38 UTC+3
**Branch:** batch5-email-recovery

---

## 1. Syntax Check (node --check)

- Backend/src/routes/auth.js: OK
- Backend/src/routes/documents.js: OK
- Backend/src/routes/merchant.js: OK
- Backend/src/routes/provider.js: OK
- Backend/test-batch4-endpoints.js: OK
- Backend/test-batch5-endpoints.js: OK

All files checked with exit code 0 and zero syntax errors.

---

## 2. Phase 4 Test Run Output (test-batch5-endpoints.js --through 4)

### Phase 1 Tests (T1a-T1e): 10 Passed, 0 Failed
### Phase 2 Tests (T2a-T2j): 10 Passed, 0 Failed
### Phase 3 Tests (T3a-T3k): 11 Passed, 0 Failed

### Phase 4 Tests (T4a-T4j):
- [PASS] T4a: Registration creates user with is_email_verified = FALSE and hash in email_verification_token
- [PASS] T4b: Verification email dispatched to Mailpit
- [PASS] T4b: Verification link contains 64-char hex token in URL fragment
- [PASS] T4c: Duplicate registration returns uniform 201 with fresh random UUID and dispatches alert
- [PASS] T4d: Unverified merchant upload denied (403 EMAIL_VERIFICATION_REQUIRED) with zero DB rows and no file on disk
- [PASS] T4e: Unverified merchant denied on PUT /profile (403 EMAIL_VERIFICATION_REQUIRED)
- [PASS] T4f: POST /api/auth/verify-email succeeds (200), marks is_email_verified = TRUE, clears token, bumps version
- [PASS] T4g: Replaying already-consumed verification token rejected (400)
- [PASS] T4h: Expired verification token rejected (400)
- [PASS] T4i: POST /api/auth/resend-verification returns 200 and dispatches new link
- [PASS] T4j: Unverified customer access to /api/customer/profile succeeds (200) (exempt)

### Child #2 Strict Limiter Suite:
- [PASS] T2j (strict): Change-password executes under rate limiter configuration
- [PASS] T3l: Forgot-password per-email cap dispatches exactly 3 emails for 4 requests
- [PASS] T3m: Forgot-password per-IP rate limit blocks 6th request with 429
- [PASS] T3n: Reset-password per-IP rate limit blocks 6th attempt with 429
- [PASS] T4l: Registration per-email cap dispatches exactly 3 emails for 4 attempts
- [PASS] T4k: Registration per-IP rate limit blocks 6th request with 429
- [PASS] T4m: Resend-verification cooldown skips 2nd email dispatch within 2 minutes
- [PASS] T4n: Resend-verification per-IP rate limit blocks 6th request with 429

**Summary:** 51 Passed, 0 Failed across all phases through Phase 4.

---

## 3. Batch 3 Regression Output (test-batch3-endpoints.js)

Total: 17 Passed, 0 Failed. All customer auth and audit trails intact.

---

## 4. Batch 4 Regression Output (test-batch4-endpoints.js)

Total: 96 Passed, 0 Failed.
Dev accounts preserved in approved status:
- merchant@123.com: status=approved
- merchant01@ods.com: status=approved
- serviceprovider@123.com: status=approved

---

## 5. Files Changed in Phase 4

- Backend/src/routes/auth.js (registration anti-enumeration, verification tokens, resend-verification with cooldown, verify-email atomic invalidation)
- Backend/src/routes/documents.js (upload route pre-Multer verification check using isVerifiedOrExempt)
- Backend/src/routes/merchant.js (PUT /profile protected with requireVerifiedEmail)
- Backend/src/routes/provider.js (PUT /profile protected with requireVerifiedEmail)
- Backend/test-batch4-endpoints.js (updated fixture helper to mark verified for KYC upload and profile updates)
- Backend/test-batch5-endpoints.js (added T4a-T4j tests, Child #2 strict test suite, Mailpit polling and delete by ID)

---

## 6. Git Diff Stat

Backend/src/middleware/auth.js: 51 lines
Backend/src/routes/auth.js: 573 lines
Backend/src/routes/customer.js: 27 lines
Backend/src/routes/documents.js: 28 lines
Backend/src/routes/merchant.js: 4 lines
Backend/src/routes/provider.js: 4 lines
Backend/src/server.js: 10 lines
Backend/test-batch4-endpoints.js: 2 lines

---

## 7. Redaction Verification

Zero secrets, passwords, reset links, tokens, or hashes are logged in raw outputs or test summaries. All token values checked via regex matching and hashes validated without printing raw entropy.