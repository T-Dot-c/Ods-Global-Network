# ODS Global Network — Human-Visible Error Field Guide & Bug Catalogue

**Document ID:** `13-visible-error-catalogue.md`  
**Target Audience:** Non-Technical Human Testers, QA Reviewers, Business Stakeholders  
**Purpose:** Provide visual descriptions, real-world examples, and diagnostic instructions to help human testers instantly identify software defects that any real user would notice in a web browser.

---

## 1. How to Use This Catalogue

When testing any page in the ODS Global Network platform:
1. Compare what you see on screen with the defect patterns described below.
2. If any pattern matches what you observe, mark the checklist item **Fail**.
3. Open `15-defect-log-template.md` and log the defect using the designated Category Code (e.g., `ERR-BLANK`, `ERR-LEAK`).

---

## 2. The 11 Visual Error Patterns

### 1. Blank Page ("White Screen of Death")
* **Category Code:** `ERR-BLANK`
* **Severity:** Critical (P0 / P1)
* **What it looks like:** The browser tab finishes loading or shows a spinner, but the viewport is completely white, blank, or missing all content. No header, no footer, no text.
* **Why it happens:** An uncaught JavaScript exception occurred during page render (e.g., trying to read a property of `undefined`), crashing the React component tree.
* **How to spot it:**
  - Screen is pure white.
  - URL is `/services/some-id` or `/checkout/...` but nothing appears.
  - Right-click anywhere -> Inspect -> Console tab shows red text: `Uncaught TypeError: Cannot read properties of undefined` or `ChunkLoadError`.

---

### 2. Endless Loading Spinner
* **Category Code:** `ERR-SPIN`
* **Severity:** High (P1)
* **What it looks like:** A circular loading spinner, pulsating skeleton card, or "Loading..." label stays on screen indefinitely (longer than 5 seconds) and never resolves to real content or an error message.
* **Why it happens:** The frontend made an API request that either hung, timed out, or returned an error status that the UI did not catch in a `.catch()` block.
* **How to spot it:**
  - Spinner spins forever after clicking a button or visiting a page.
  - Buttons remain disabled in "Submitting..." state permanently.
  - No timeout message like "Taking longer than usual, please refresh" appears.

---

### 3. Raw Errors, Stack Traces, or JSON Dumps
* **Category Code:** `ERR-LEAK`
* **Severity:** High (P1 / Security)
* **What it looks like:** Instead of a friendly alert banner, the user sees raw code, JSON snippets, or database error traces.
* **Examples of what should NEVER be visible:**
  - `{"status":"error","message":"SequelizeDatabaseError: relation 'users' does not exist"}`
  - `Error: connect ECONNREFUSED 127.0.0.1:5432`
  - `Internal Server Error: at Object.dispatch (/node_modules/...)`
  - `ChapaAPIException: 401 Unauthorized - Invalid Secret Key`
* **How to spot it:** Any text containing technical terms like `SQL`, `Sequelize`, `Prisma`, `TypeError`, `stack trace`, `{ "error": ... }`, or code file paths.

---

### 4. Redirect Loops & Flickering
* **Category Code:** `ERR-LOOP`
* **Severity:** Critical (P0)
* **What it looks like:** The browser rapidly alternates between two URLs (e.g., `/login` -> `/profile` -> `/login`), the screen flashes repeatedly, or the browser displays: *"The page isn't redirecting properly"*.
* **Why it happens:** Conflicting route guards (e.g., Route A thinks the user is logged out and redirects to login, while Route B thinks the user is logged in and redirects to profile).
* **How to spot it:** Address bar URL changes rapidly; page repeatedly reloads without user interaction.

---

### 5. Ugly or Broken Error Pages (Raw 404 / 403)
* **Category Code:** `ERR-ROUTE`
* **Severity:** Medium (P2)
* **What it looks like:** Navigating to an invalid URL shows the default browser error page (*"Cannot GET /unknown-path"*) or a plain black-and-white text block instead of the polished ODS Global Network branded 404 page with a "Return to Home" button.
* **How to spot it:** Missing navigation bar, no site styling, raw Apache/Nginx/Express default text.

---

### 6. Double-Submit & Rapid-Click Bugs
* **Category Code:** `ERR-SUBMIT`
* **Severity:** High (P1)
* **What it looks like:** Clicking a button twice quickly (e.g., "Submit Order", "Book Appointment", "Pay Now") creates two charges, two duplicate bookings, or generates two identical confirmation emails in Mailpit.
* **Why it happens:** The button was not disabled immediately upon first click (`disabled={loading}`), allowing multiple simultaneous network requests.
* **How to spot it:**
  - Double-clicking "Confirm" creates duplicate table rows or generates two emails.
  - Button does not visually change to a disabled or loading state immediately when clicked.

---

### 7. Currency & Calculation Errors
* **Category Code:** `ERR-CALC`
* **Severity:** High (P1 / Financial)
* **What it looks like:**
  - Currency shown as `$` (USD) instead of `ETB` (Ethiopian Birr).
  - Missing decimal places (e.g., `1500 ETB` instead of `1,500.00 ETB`).
  - Text showing `NaN ETB` or `undefined ETB`.
  - Negative values like `-50.00 ETB` where positive amounts are expected.
  - Arithmetic that does not add up (e.g., Subtotal 1,000 + Tax 150 = Total 1,200).
* **How to spot it:** Always inspect the summary box on `/checkout/*` and `/admin/dashboard#payments`. Add up line items manually to ensure the sum matches the Total.

---

### 8. Date, Time & Timezone Flaws
* **Category Code:** `ERR-TIME`
* **Severity:** Medium (P2)
* **What it looks like:**
  - Text showing `"Invalid Date"` or `01/01/1970`.
  - Appointment scheduled for 2:00 PM displaying as 11:00 AM (UTC offset error instead of East Africa Time `EAT / UTC+3`).
  - Relative times displaying oddly (e.g., "in -5 minutes" or "54 years ago").
* **How to spot it:** Check appointment cards and confirmation emails to verify that the time matches the time slot selected by the user.

---

### 9. Broken Images & Missing Assets
* **Category Code:** `ERR-IMG`
* **Severity:** Medium (P2)
* **What it looks like:** A small broken document icon with alt text, an empty gray box, or an image that fails to load (404 Not Found on asset URL).
* **How to spot it:** Look for broken icons in:
  - Header brand logo.
  - Healthcare service detail banners.
  - Provider profile avatars.
  - Digital gift card preview designs.

---

### 10. Layout Breakage & Mobile Responsiveness Flaws
* **Category Code:** `ERR-LAYOUT`
* **Severity:** Medium (P2)
* **What it looks like:**
  - Horizontal scrollbar appears on mobile (width 375px) — page scrolls left and right awkwardly.
  - Text overlaps adjacent buttons or flows outside its container box.
  - Navigation menu covers interactive elements or cannot be closed.
  - Modal windows cut off on small screens with no vertical scrollbar, making the "Submit" or "Cancel" button unreachable.
* **How to spot it:** Press `F12`, click the Mobile Device Toggle icon in Chrome/Firefox, select "iPhone SE" (375x667), and browse the page.

---

### 11. Silent Form Failures
* **Category Code:** `ERR-SILENT`
* **Severity:** High (P1)
* **What it looks like:** The user fills out a form, clicks "Save" or "Submit", but **absolutely nothing happens**. No toast message, no error highlight on fields, no redirect, and the user is left wondering if their action succeeded.
* **Why it happens:** Client-side validation failed silently without displaying an error message next to the invalid input field, or an API error was suppressed.
* **How to spot it:** Clicking a primary action button produces zero visible change on screen.

---

## 3. How to Open Browser DevTools Console (For Error Diagnostics)

While non-technical testers do not need to write code, opening the DevTools Console is the fastest way to confirm whether a red error occurred:

1. Press **`F12`** on your keyboard (or right-click anywhere on the page and select **Inspect**).
2. Click the **Console** tab at the top of the developer panel.
3. Look for **Red text** (Errors):
   - Red errors indicate JavaScript crashes or failed API requests (HTTP 400, 401, 403, 404, 500).
   - Yellow text indicates Warnings (usually non-blocking).
4. Take a screenshot of any red errors and paste the text into your defect report in `15-defect-log-template.md`.
