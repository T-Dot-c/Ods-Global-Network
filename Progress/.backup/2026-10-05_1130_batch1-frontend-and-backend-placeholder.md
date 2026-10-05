# Implementation Plan: Batch 1 Frontend Pages & Backend Placeholder

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-05_1130_batch1-frontend-and-backend-placeholder.md`  
**Task ref:** TASK 06 (Batch 1 Frontend Implementation & Backend Placeholder)  
**Tier:** **M**  
**Created:** 2026-10-05 11:30  
**Updated:** 2026-10-05 11:35 (Revision 2)  
**Status:** **Pending Approval**  

---

## Original User Prompt (revision 1 — verbatim)
> Approved: proceed
> 
> Conditions:
> 1. The neutral message on Forgot Password appears only on a real successful response (or dev simulation). Any failure shows a generic error.
> 2. Reset Password must handle a missing email (refresh or direct visit) with a "Start again" path. No email in the URL.
> 3. Define the simulation's success/error triggers using fixed test values that work only in simulation mode. After the production build, search the output for the storage key and test values and report the result.
> 4. Reset Password: add Resend code (with cooldown), Use a different email, numeric-friendly code input with one-time-code autofill, one generic invalid/expired message, clear email after success.
> 5. Unauthorized with no session shows Sign In and Back to Home instead of Return to Dashboard.
> 6. Terms: include at minimum a Back to Home link and the footer. Keep "pending legal review" notices out of the public page and record them as open items in ./Progress/. Show a "Last updated" date.
> 7. Before writing the placeholder comments, verify (read-only) the password column name in migration 001, any constraint on otp_codes.purpose, and that server.js does not auto-load files from routes/. Report findings and document only what you confirmed.
> 8. Add "Switch RegisterPage to the shared PasswordStrengthIndicator" to the open items. Do not do it now.
> 9. LoginPage.tsx edit is approved as proposed (anchor to button, same styling, visible focus ring).

---

## Revision Log (revision 2 — deltas)
> Approved: proceed
> 
> Conditions (revision 2):
> 1. Verification: grep the production build for the storage key and both simulation test values. Use distinctive test values (not 123456). Mark all checks PENDING until run and report actual output.
> 2. State how the email passes from Forgot Password to Reset Password (not via URL) and where it is cleared.
> 3. Check how Footer links behave on the Terms page. Report findings and options before changing the footer beyond the Terms link. Home behavior must not change.
> 4. Terms: payment clause says payments are confirmed only after the payment provider confirms them (no "cryptographic settlement"). Remove "Account Responsibilities" or list it as a new clause for legal review in ./Progress/.
> 5. Confirm useAuth() exists before using it. Define signed-out access to dashboards (stays login redirect). Provide a role-versus-route test matrix.
> 6. Define behavior when a signed-in user opens Forgot/Reset Password.
> 7. Placeholder comments must mention the existing users.password_reset_token and password_reset_expires columns as unused, with otp_codes as the chosen path.
> 8. Use design tokens for strength-indicator colors where they exist; otherwise log an accepted deviation.
> 9. Add a git diff check proving the only Backend change is the new placeholder file and that RegisterPage.tsx, Header.tsx, tokens.css and dashboards are unchanged.
> 10. Confirm the working branch for Task 06 and back up the Progress files before execution.

---

## Baseline & Pre-Execution Checks
| Item | Result |
| :--- | :--- |
| Current stage in `PROJECT_STATUS.md` | TASK 05 Complete — Frontend Header Scope Re-baselining & Accessibility Refinements |
| Working Branch | `header-navbar-alignment` (confirmed) |
| Progress Backup | Completed to `<appDataDir>/brain/<conversation-id>/scratch/progress_backup/` |
| `useAuth()` Existence | Confirmed in [`Frontend/src/context/AuthContext.tsx:L81-L85`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Frontend/src/context/AuthContext.tsx#L81-L85) |
| Migration 001 Password Column | Confirmed as `password_hash VARCHAR(255) NOT NULL` in [`001_create_users_table.sql:L12`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Backend/src/database/migrations/001_create_users_table.sql#L12) |
| Unused Password Reset Columns | Confirmed: `password_reset_token` and `password_reset_expires` exist on `users` table; noted as unused in favor of `otp_codes` |
| Migration 008 OTP Purpose | Confirmed: `purpose VARCHAR(30) NOT NULL DEFAULT 'phone_verification'` with NO check constraint |
| Server.js Route Loading | Confirmed: Statically loads `./routes/auth`; zero dynamic directory auto-loading |
| Design Tokens for Strength Colors | `--color-danger: #ef4444`, `--color-warning: #f59e0b`, `--color-success: #10b981` confirmed in `tokens.css`; `#3b82f6` logged as accepted deviation for "Good" tier |

---

## Architecture Specifications

### 1. In-Memory State & Recovery Lifecycle
- **State Location**: In `Frontend/src/App.tsx`, managed as `const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);`.
- **Passing Mechanism**:
  - `ForgotPasswordPage` receives `onCodeSent: (email: string) => void`.
  - When submission succeeds, `setRecoveryEmail(email)` is called and view changes to `'reset-password'`.
  - `ResetPasswordPage` receives `recoveryEmail` via props.
  - Zero presence in URL query parameters, hash fragments, or `localStorage`.
- **Missing Email Fallback**:
  - If `recoveryEmail` is null/empty (direct navigation to `/reset-password` or browser refresh), `ResetPasswordPage` displays a "Start Again" card with button routing to `'forgot-password'`.
- **Clearing Points**:
  - Cleared on successful password reset (`onResetSuccess`).
  - Cleared when clicking "Start Again" or "Use a different email".
  - Cleared when user navigates away to `'login'` or `'home'`.

### 2. Role-versus-Route Access Matrix
| Session State | `/terms` | `/forgot-password` | `/reset-password` | `/unauthorized` | `/dashboard` (Customer) | `/admin/dashboard` | `/merchant/dashboard` | `/provider/dashboard` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Signed Out (`null`)** | Public | Public | Public (Start Again fallback) | Public (shows `"Sign In"` & `"Back to Home"`) | Redirects to `/login` | Redirects to `/login` | Redirects to `/login` | Redirects to `/login` |
| **Customer (`customer`)** | Public | Redirects to `/dashboard` | Redirects to `/dashboard` | Shows `"Return to Dashboard"` & `"Sign Out"` | Accessible | Redirects to `/unauthorized` | Redirects to `/unauthorized` | Redirects to `/unauthorized` |
| **Merchant (`merchant`)** | Public | Redirects to `/merchant/dashboard` | Redirects to `/merchant/dashboard` | Shows `"Return to Dashboard"` & `"Sign Out"` | Redirects to `/unauthorized` | Redirects to `/unauthorized` | Accessible | Redirects to `/unauthorized` |
| **Provider (`provider`)** | Public | Redirects to `/provider/dashboard` | Redirects to `/provider/dashboard` | Shows `"Return to Dashboard"` & `"Sign Out"` | Redirects to `/unauthorized` | Redirects to `/unauthorized` | Redirects to `/unauthorized` | Accessible |
| **Admin (`admin`)** | Public | Redirects to `/admin/dashboard` | Redirects to `/admin/dashboard` | Shows `"Return to Dashboard"` & `"Sign Out"` | Redirects to `/unauthorized` | Accessible | Redirects to `/unauthorized` | Redirects to `/unauthorized` |

### 3. Footer Link Behavior on Terms Page
- **Investigation Finding**: In [`Frontend/src/components/layout/Footer.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Frontend/src/components/layout/Footer.tsx), all links are either telephone (`tel:`), email (`mailto:`), or plain text `<li>` elements.
- The only change made to `Footer.tsx` is converting `<span>Terms &amp; Conditions</span>` to `<button type="button" onClick={() => onNavigate?.('terms')}>` with subtle hover styling.
- On `HomePage`, clicking it navigates to `'terms'`.
- On `TermsPage`, clicking it scrolls to top of `'terms'`.
- Zero changes to homepage behavior or external footer contacts.

### 4. Dev Simulation Test Values & Tree-Shaking
- **Storage Key**: `'ODS_DEV_SIMULATE_RECOVERY'`
- **Distinctive Test Fail Email**: `'simulate-fail-user@ods-test.local'`
- **Distinctive Test Success Code**: `'789456'`
- **Distinctive Test Fail Code**: `'000000'`
- **Gating**:
  ```typescript
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    if (localStorage.getItem('ODS_DEV_SIMULATE_RECOVERY') === 'true') {
      // simulation logic using test values
    }
  }
  ```
- **Dead-Code Elimination**: Vite replaces `import.meta.env.DEV` with `false` in production build. All test strings and the storage key will be eliminated from `Frontend/dist`.

---

## Files In Scope
### Files to Create:
1. `Frontend/src/components/common/PasswordStrengthIndicator.tsx`
2. `Frontend/src/services/recoveryService.ts`
3. `Frontend/src/pages/UnauthorizedPage.tsx`
4. `Frontend/src/pages/TermsPage.tsx`
5. `Frontend/src/pages/ForgotPasswordPage.tsx`
6. `Frontend/src/pages/ResetPasswordPage.tsx`
7. `Backend/src/routes/recovery.placeholder.js`

### Files to Modify:
1. `Frontend/src/pages/LoginPage.tsx` (wire forgot password button)
2. `Frontend/src/components/layout/Footer.tsx` (wire terms button)
3. `Frontend/src/App.tsx` (wire routes, in-memory recovery email, route guards)

---

## Detailed Execution Steps

### Phase 1: Shared Component & Recovery Service Layer
1. Create `PasswordStrengthIndicator.tsx`:
   - Uses CSS tokens: `--color-danger: #ef4444`, `--color-warning: #f59e0b`, `--color-success: #10b981`.
   - Uses `#3b82f6` (blue) for the "Good" tier (logged as accepted design system deviation to preserve parity with `RegisterPage.tsx`).
   - Exports `getPasswordStrength(pwd: string): number`.
2. Create `recoveryService.ts`:
   - Functions `requestPasswordReset(email)` and `confirmPasswordReset(email, code, newPassword)`.
   - Configures dev simulation with `ODS_DEV_SIMULATE_RECOVERY`, `simulate-fail-user@ods-test.local`, `789456`.

### Phase 2: Unauthorized (403) Page (`/unauthorized`)
1. Create `UnauthorizedPage.tsx`:
   - Uses `useAuth()`.
   - If signed in: renders `"Return to Dashboard"` (routes to `ROLE_TO_DASHBOARD[user.role]`) and `"Sign Out"`.
   - If signed out (`user === null`): renders `"Sign In"` (routes to `'login'`) and `"Back to Home"` (routes to `'home'`).
   - `ShieldAlert` icon (`lucide-react`), Deep Navy container, Gold accents.

### Phase 3: Terms & Conditions Page (`/terms`)
1. Create `TermsPage.tsx`:
   - Top utility bar with `"Back to Home"` navigation link and ODS gold vector logo.
   - Shows `"Last updated: October 5, 2026"`.
   - Clauses:
     1. Acceptance of Platform Terms (generic, platform-wide).
     2. Service Delivery & Engagement Principles (platform connects users to independent merchants and providers).
     3. Payments & Order Confirmations ("Payments are confirmed only after the payment provider confirms them. In case of payment failure, no service, voucher, or booking is processed.").
     4. Limitation of Third-Party Liability ("ODS Global Network is not liable for delays or failures caused by third-party payment gateways, telecommunication operators, or independent logistics partners.").
     5. Support & Inquiries (`info@odsglobal.net`, `+251 960 606 042`).
   - Note: "Account Responsibilities" is omitted from public copy and recorded under Open Items for legal review.
   - Renders `Footer` at bottom.
2. Update `Footer.tsx`:
   - Wire `<span>Terms &amp; Conditions</span>` to button triggering `onNavigate?.('terms')`.

### Phase 4: Forgot Password Page (`/forgot-password`)
1. Create `ForgotPasswordPage.tsx`:
   - Signed-in check: if `user !== null`, automatically redirects to `ROLE_TO_DASHBOARD[user.role]`.
   - Split-screen brand layout matching `LoginPage.tsx`.
   - Input: Email with `Mail` icon.
   - Submit button with disabled loading state (`"Sending Code..."`).
   - On response success: displays `"If an account exists with this email, a reset code has been sent."` and primary button `"Enter Reset Code →"`.
   - On response failure: displays generic error `"Unable to process recovery request. Please try again later."`

### Phase 5: Reset Password Page (`/reset-password`)
1. Create `ResetPasswordPage.tsx`:
   - Missing email check: if `recoveryEmail` is null/empty, renders "Start Again" card with button to `'forgot-password'`.
   - Form inputs:
     - 6-digit recovery code: `type="text"`, `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={6}`.
     - New password: with visibility toggle.
     - `PasswordStrengthIndicator`.
     - Confirm password: with real-time match check.
   - Controls:
     - "Resend Code" button with 60-second cooldown timer.
     - "Use a different email" button returning to `'forgot-password'`.
   - On submit failure: Single generic error: `"The recovery code is invalid or has expired. Please check your code or request a new one."`
   - On submit success:
     - Calls `onResetSuccess` (clears in-memory email).
     - Renders success card with checkmark and `"Sign In →"` button.

### Phase 6: App Router & Login Page Integration
1. Update `LoginPage.tsx`:
   - Convert line 346 `<a href="#forgot">` to `<button type="button" onClick={() => onNavigate('forgot-password')}>` with gold styling and visible focus ring.
2. Update `App.tsx`:
   - Include views: `'unauthorized' | 'terms' | 'forgot-password' | 'reset-password'`.
   - Normalize routes.
   - Guard portal routes (redirect to `'unauthorized'` on role mismatch).

### Phase 7: Backend Placeholder File
1. Create `Backend/src/routes/recovery.placeholder.js`:
   - Header comments only documenting `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`.
   - Documents unused `users.password_reset_token` and `users.password_reset_expires` columns in favor of `otp_codes` table (`purpose = 'password_recovery'`).
   - Documents 12-round bcrypt hash, 15-minute expiry, anti-enumeration, and session invalidation.

---

## Verification Plan (Status: PENDING)

| Check | Tool / Command | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| TypeScript check | `npx tsc --noEmit` in `Frontend` | 0 errors | ⏳ PENDING |
| Production build | `npm run build` in `Frontend` | Exit code 0 | ⏳ PENDING |
| Dead-code elimination (storage key) | `grep -r "ODS_DEV_SIMULATE_RECOVERY" Frontend/dist` | 0 matches | ⏳ PENDING |
| Dead-code elimination (test email) | `grep -r "simulate-fail-user@ods-test.local" Frontend/dist` | 0 matches | ⏳ PENDING |
| Dead-code elimination (test code) | `grep -r "789456" Frontend/dist` | 0 matches | ⏳ PENDING |
| Backend syntax check | `node -c src/server.js` in `Backend` | Clean exit 0 | ⏳ PENDING |
| Backend running test | `npm run db:check` in `Backend` | DB connected, 0 errors | ⏳ PENDING |
| Git diff isolation check | `git diff --stat` | Proves only planned files touched | ⏳ PENDING |
| Untouched files check | `git status -s` | Proves `RegisterPage.tsx`, `Header.tsx`, `tokens.css`, dashboards untouched | ⏳ PENDING |
| Browser verification | Human verification in browser | Role matrix & state transitions verified | 🧑 HUMAN-TEST |

---

## Open Items (For Legal & Future Architecture)
1. **Legal Counsel Review — Terms Addenda**:
   - Healthcare provider liability, doctor-patient telehealth boundaries, hospital appointment cancellation/no-show policies, and merchant KYC agreements.
   - Proposed "Account Responsibilities" clause (held back from public text pending review).
2. **Switch `RegisterPage.tsx` to shared `PasswordStrengthIndicator`**: Deferred refactoring item.
3. **SMTP & SMS Transports**: External gateway provisioning for email and SMS OTPs.
