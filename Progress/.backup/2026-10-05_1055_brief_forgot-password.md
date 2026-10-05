# Page Brief: Forgot Password (`/forgot-password`)

> **DOCUMENT TYPE**: Legacy Analysis / Page Specification (Batch 1)  
> **TARGET ROUTE**: `/forgot-password`  
> **SOURCE FILE**: [`resource/client/src/components/Auth/ForgotPassword.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/Auth/ForgotPassword.tsx#L1-L107)  
> **BACKEND SOURCE**: [`resource/server/routes/auth.js`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/routes/auth.js#L115) & [`resource/server/controllers/authController.js`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/controllers/authController.js#L522-L618)  
> **AUDIT DATE**: 2026-10-05

---

### 1. Identity
- **Route**: `/forgot-password` (configured in [`resource/client/src/App.tsx:L120`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/App.tsx#L120)).
- **Legacy File Path**: `resource/client/src/components/Auth/ForgotPassword.tsx`.
- **Access Level**: Public (unauthenticated). Any visitor can access this page.
- **Arrival Points**: Arrives primarily via the "Forgot Password?" link on the login page (`/login`) or direct URL navigation.

---

### 2. Purpose
Allows a registered user who has forgotten their account credentials to submit their registered email address to trigger a time-limited password reset link sent to their inbox.

---

### 3. Visible Content (Word-for-Word Copy)
*All user-facing strings copied verbatim from [`ForgotPassword.tsx:L43-L100`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/Auth/ForgotPassword.tsx#L43-L100) and backend controller messages:*

- **Top Badge Pill**: `"ODS Global Network Member Access"`
- **Logo Alt Text**: `"ODS Global Network Logo"`
- **Heading**: `"Forgot Password"`
- **Subtitle / Helper Text**: `"Enter your email to receive a password reset link"`
- **Input Field Label**: `"Email"`
- **Input Placeholder**: `"you@example.com"`
- **Submit Button Text**: `"Send Reset Link"`
- **Navigation Link Prefix**: `"Remembered your password? "`
- **Navigation Link Text**: `"Sign In"` (links to `/login`)
- **Footer Copyright Notice**: `"Ⓒ All rights reserved by ODS Global Network"`
- **Client Fallback Error**: `"Something went wrong."` (displayed on network/fetch exception)
- **Backend Error Message (HTTP 404)**: `"Email not found"` (returned by [`authController.js:L529`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/controllers/authController.js#L529))
- **Backend Error Message (HTTP 500)**: `"Server error"` (returned by [`authController.js:L616`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/controllers/authController.js#L616))
- **Backend Success Message (HTTP 200)**: `"Reset link sent to your email."` (returned by [`authController.js:L613`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/controllers/authController.js#L613))
- **Client Fallback Success Message**: `"Reset link sent! Check your email."` ([`ForgotPassword.tsx:L27`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/Auth/ForgotPassword.tsx#L27))

---

### 4. Fields and Rules
| Field Label | HTML Input Type | Required? | Validation Rules |
| :--- | :--- | :--- | :--- |
| **Email** | `type="email"` | Required | Native HTML5 browser email validation only. No client-side regex check, trim, or length constraint. Form submission blocked if empty. |

---

### 5. States and Flows
1. **Initial State**: Card rendered with empty email input, active submit button, top badge, and login redirection link.
2. **Submitting / Loading State**: None. The button has no disabled state, no loading spinner, and allows repeated multi-clicks during inflight requests.
3. **Client Validation Error**: Native browser tooltip if the input is empty or lacks an `@` symbol.
4. **Server Validation / Not Found Error**: Displays red alert text (`text-red-600 mb-4 text-center`) above the form reading `"Email not found"` or `"Something went wrong."`. User remains on page with input retained.
5. **Server Exception Error**: Displays red alert text `"Something went wrong."`.
6. **Success State**: Displays green alert text (`text-green-600 mb-4 text-center`) reading `"Reset link sent to your email."` or `"Reset link sent! Check your email."`. User remains on the page; input remains editable; no automatic navigation or countdown redirect occurs.
7. **Post-Submission Navigation**: User must manually click `"Sign In"` to return to `/login`.

---

### 6. Data and Backend
- **Endpoint**: `POST ${BASE_URL}/auth/forgot-password` (configured in [`resource/server/routes/auth.js:L115`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/routes/auth.js#L115)).
- **Request Payload**: JSON object `{ "email": string }`.
- **Response Payload**:
  - HTTP 200: `{ "msg": "Reset link sent to your email." }`
  - HTTP 404: `{ "msg": "Email not found" }`
  - HTTP 500: `{ "msg": "Server error" }`
- **Backend Operations ([`authController.js:L522-L618`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/controllers/authController.js#L522-L618))**:
  1. Queries legacy database: `SELECT * FROM users WHERE email = ?`.
  2. If user not found, terminates immediately with HTTP 404.
  3. Generates 32-byte cryptographically random hex token via `crypto.randomBytes(32).toString('hex')`.
  4. Sets expiry: `tokenExpire = Date.now() + 1000 * 60 * 15` (15 minutes).
  5. Updates user record: `UPDATE users SET resetToken = ?, tokenExpire = ? WHERE id = ?`.
  6. Compiles reset URL: `${frontendUrl}/reset-password?token=${token}`.
  7. Prints link to stdout: `console.log("🔑 Password reset link generated:", resetLink);` (Security risk).
  8. Dispatches HTML email using legacy nodemailer/sendEmail helper with subject `"🔐 Reset Your Password - Wanaw Gifting Solution"` containing legacy branding, phone `+251-989-177-777`, and email `info@wanaw.com`.

---

### 7. Dependencies
- **Routing**: `react-router-dom` (`Link`).
- **State**: React built-in `useState`.
- **API URL Helper**: `BASE_URL` from `../../api/api`.
- **Assets**: `/wanaw gifting logo.jpeg` (hard-coded public path).
- **Styling**: TailwindCSS utility classes (`min-h-screen`, `bg-white`, `text-[#1c2b21]`, `bg-[#D4AF37]`).
- **Icons**: None used. Decorative shapes implemented via absolute styled `div` elements.

---

### 8. Security Observations (Scope Section 10 & Directive §8 / §17)
1. **User Enumeration**: The backend explicitly returns HTTP 404 with message `"Email not found"`. An attacker can systematically harvest valid registered user email addresses.
2. **Server Log Credential Exposure**: `authController.js` logs raw reset tokens directly to application console output ([`authController.js:L550`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/server/controllers/authController.js#L550)).
3. **No Rate Limiting**: The endpoint lacks brute-force / IP rate limiting, enabling malicious automated flooding of SMTP services and user inboxes.
4. **Token in URL Query**: The reset link passes the secret reset token as a URL query parameter (`?token=...`), exposing it to browser histories, referer headers, proxy logs, and network monitors.
5. **No CAPTCHA / Bot Protection**: The form has no bot-detection mechanism.

---

### 9. Scope Mapping
- **Scope Document**: [`KPIs & SCOPES ODS GLOBAL NET .txt`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/KPIs%20&%20SCOPES%20ODS%20GLOBAL%20NET%20.txt#L56-L65)
  - **Section 3 (Customer Portal)**: Explicitly mandates `"Login and password recovery"`.
  - **Section 10 (Security)**: Mandates `"User authentication"` and `"Zero critical security vulnerabilities"`.
- **Verdict**: Direct match for Scope Section 3 customer password recovery.

---

### 10. Gaps and Conflicts
- **Brand Identity**: Component uses legacy Wanaw branding (`/wanaw gifting logo.jpeg`, Wanaw Gifting Solution in email copy, non-standard forest green `#1c2b21` and gold `#D4AF37` instead of authoritative `#0F285B` Deep Navy and `#BE9B49` Gold from `ODS_BRAND_GUIDELINE.pdf`).
- **Scope Omissions**: Scope Section 9 calls for multi-channel notifications (SMS and Email); legacy implementation only supported email.
- **Form Controls**: Missing loading indicators, disabled states during submission, and standard input sanitization.

---

### 11. Current State in Modern Codebase
- **Frontend**: **None**. [`Frontend/src/App.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Frontend/src/App.tsx#L14-L21) currently defines views for `home`, `login`, `register`, and 4 dashboards. No `/forgot-password` route or component exists.
- **Backend**: **None**. [`Backend/src/routes/auth.js`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Backend/src/routes/auth.js) provides only `/register`, `/login`, `/me`, and `/logout`. No recovery route is mounted.

---

### 12. Suggested Bucket & Rationale
- **Suggested Bucket**: **Adapt**
- **One-Line Reason**: Password recovery is a mandatory Section 3 scope requirement, but must be adapted to use modern design tokens, ODS branding, account-enumeration prevention, rate limiting, and alignment with the backend notification architecture.
