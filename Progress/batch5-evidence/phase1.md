# Batch 5 — Phase 1 Evidence Report

**Phase:** Phase 1 — Email Foundation, Migration 015 & Health Probes
**Date/Time:** 2026-10-16 13:42 UTC+3
**Branch:** batch5-email-recovery

---

## 1. Syntax Check (node --check)

Backend/scripts/migrate-as-owner.js: OK
Backend/src/services/sessionService.js: OK
Backend/src/services/emailService.js: OK
Backend/src/server.js: OK
Backend/test-batch5-endpoints.js: OK

Command exited with code 0 and zero errors.

---

## 2. Migration 015 Application Output

Executed via owner connection (scripts/migrate-as-owner.js):
- 001 through 014: SKIPPED (already applied)
- 015_email_verification_and_session_invalidation.sql: APPLIED successfully.

---

## 3. Phase 1 Test Run Output (test-batch5-endpoints.js --through 1)

- T1a: Mailpit health probe returns 200 and valid info object [PASS]
- T1b (schema): token_version column exists as INT NOT NULL DEFAULT 1 [PASS]
- T1b (indexes): partial indexes on tokens and composite token_version exist [PASS]
- T1b (grandfather): existing dev users are marked is_email_verified = TRUE [PASS]
- T1c (SELECT): ods_app can SELECT users and token_version [PASS]
- T1c (UPDATE token_version): ods_app can UPDATE token_version [PASS]
- T1c (DELETE denied): ods_app is denied DELETE privilege on users table [PASS]
- T1e (graceful error): unreachable SMTP catches network failure and returns sanitized error code [PASS]
- T1e (liveness): child server with closed SMTP port remains responsive [PASS]
- T1d (zero secrets): combined stdout/stderr log streams contain zero tokens, hashes, passwords, or secrets [PASS]

Total: 10 Passed, 0 Failed.

---

## 4. Batch 3 Regression Output (test-batch3-endpoints.js)

Total: 17 Passed, 0 Failed.

---

## 5. Batch 4 Regression Output (test-batch4-endpoints.js)

Total: 96 Passed, 0 Failed.
Dev accounts preserved in approved status.

---

## 6. Files Changed in Phase 1

- Backend/.env (Appended only SMTP and RATE_LIMIT variables)
- Backend/.env.example (Added placeholders and documented defaults)
- Backend/package.json & Backend/package-lock.json (Added nodemailer)
- Backend/scripts/migrate-as-owner.js (Created owner migration runner)
- Backend/src/database/migrations/015_email_verification_and_session_invalidation.sql (Created migration)
- Backend/src/database/rollbacks/rollback_015.sql (Created rollback script)
- Backend/src/server.js (Enforced HTTPS on FRONTEND_ORIGIN outside dev/test)
- Backend/src/services/sessionService.js (Created resolveSession, revokeUserSessions)
- Backend/src/services/emailService.js (Created email sender with Mailpit transporter)
- Backend/test-batch5-endpoints.js (Created harness and Phase 1 test suite)
- Progress/2026-10-13_1400_implementation-plan_batch5-email-and-recovery.md (Added Revision 10 clarifications)

---

## 7. Git Diff Stat

 Backend/.env.example                               |  21 +-
 Backend/package-lock.json                          |  10 +
 Backend/package.json                               |   1 +
 Backend/src/server.js                              |  10 +
 ..._implementation-plan_batch4-onboarding-admin.md |   4 +-
 ...mplementation-plan_batch5-email-and-recovery.md | 883 +++++++++++++++------
 6 files changed, 682 insertions(+), 247 deletions(-)
