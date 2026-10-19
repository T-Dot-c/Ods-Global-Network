# Batch 5 — Phase 2 Evidence Report

**Phase:** Phase 2 — Session Invalidation & Immediate Revocation
**Date/Time:** 2026-10-16 13:52 UTC+3
**Branch:** batch5-email-recovery

---

## 1. Syntax Check (node --check)

Backend/src/middleware/auth.js: OK
Backend/src/routes/auth.js: OK
Backend/src/routes/customer.js: OK
Backend/src/routes/documents.js: OK
Backend/src/services/emailService.js: OK
Backend/test-batch5-endpoints.js: OK

Command exited with code 0 and zero errors.

---

## 2. Phase 2 Test Run Output (test-batch5-endpoints.js --through 2)

Phase 1 Tests (T1a-T1e): 10 Passed, 0 Failed

Phase 2 Tests (T2a-T2j):
- T2a: Login mints minimal JWT { id, token_version } with zero role/email claims [PASS]
- T2b: GET /api/auth/me returns explicit allowlist with no internal columns [PASS]
- T2c: GET /api/customer/profile succeeds (200) with fresh session [PASS]
- T2d: Direct DB token_version bump invalidates session immediately (401) [PASS]
- T2e: Stale cookie rejected on GET /api/auth/me (401) [PASS]
- T2f: Re-login produces fresh working cookie with current token_version (200) [PASS]
- T2g: POST /api/customer/change-password succeeds (200) and immediately invalidates active session (401) [PASS]
- T2h: Security notice email dispatched and received in Mailpit [PASS]
- T2i: Change-password rejects passwords < 8 chars or > 72 bytes (400) [PASS]
- T2j: Sequential password changes succeed with fresh cookies under generous limiter [PASS]

Total Phase 1 + Phase 2 Tests: 20 Passed, 0 Failed.

---

## 3. Batch 3 Regression Output (test-batch3-endpoints.js)

Total: 17 Passed, 0 Failed.

---

## 4. Batch 4 Regression Output (test-batch4-endpoints.js)

Total: 96 Passed, 0 Failed.
Dev accounts preserved in approved status.

---

## 5. Files Changed in Phase 2

- Backend/src/middleware/auth.js (requireAuth with resolveSession, isVerifiedOrExempt, requireVerifiedEmail)
- Backend/src/routes/auth.js (minimal JWT login payload, explicit /me allowlist)
- Backend/src/routes/customer.js (8-72 byte password bound, revokeUserSessions, non-blocking notice email)
- Backend/src/routes/documents.js (async extractOptionalAuth with resolveSession)
- Backend/src/services/emailService.js (sendPasswordChangedNotice alias)
- Backend/test-batch5-endpoints.js (T2a-T2j test suite)

---

## 6. Git Diff Stat (Phase 2 changes)

 Backend/src/middleware/auth.js  | 51 ++++++++++++++++++++++++++++++---
 Backend/src/routes/auth.js      | 63 +++++++++++++++++++++--------------------
 Backend/src/routes/customer.js  | 27 ++++++++++++++++--
 Backend/src/routes/documents.js | 16 +++++------
 Backend/src/services/emailService.js |  7 +++++-
 Backend/test-batch5-endpoints.js | 229 ++++++++++++++++++++++++++++++++++++++++
 6 files changed, 332 insertions(+), 57 deletions(-)
