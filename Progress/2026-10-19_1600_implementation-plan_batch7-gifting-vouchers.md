# Implementation Plan: Batch 7 — Gifting & Vouchers (Digital Gift Cards, Custom Vouchers, Wallet Balance & Atomic Redemption)

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-19_1600_implementation-plan_batch7-gifting-vouchers.md`  
**Task ref:** TASK 07 / BATCH 07 (from `./Status/PROJECT_STATUS.md`)  
**Tier:** L (Large — financial gifting engine with database migrations, atomic double-spend locking, digital wallet ledger, and frontend portals)  
**Created:** 2026-10-19 16:00  
**Status:** Approved  

---

## Original User Prompt (revision 1 — verbatim, stored once)
> Next: Batch 7 — Gifting & Vouchers

---

## Baseline Check (read-only evidence gathered before drafting)
| Item | Result |
| :--- | :--- |
| Current stage in `PROJECT_STATUS.md` | BATCH 6 COMPLETED & CLOSED (`98aac4e8`) |
| Branch / HEAD | `batch7-gifting-vouchers` / `98aac4e8` |
| Working tree | Clean (`git status --porcelain` produced 0 lines) |
| Sync Marker vs HEAD | In sync with `origin/main` at `98aac4e8` |
| Matching earlier plan | `Progress/2026-10-19_1255_implementation-plan_batch6-payments.md` (Approved & Closed) |

---

## Scope Traceability
| # | Requirement | Source (`Scope §n Line n` / Directive) | Plan Step |
| :- | :--- | :--- | :--- |
| 1 | Purchase gift cards (custom & fixed denominations) | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §7 Line 144 | Phase 2, Phase 3 |
| 2 | Redeem gift cards with atomic double-spend prevention | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §7 Line 145 & `System Directive v2.0` §7 Line 102–105 | Phase 1, Phase 3 |
| 3 | Balance tracking & customer wallet ledger | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §7 Line 146 | Phase 1, Phase 3, Phase 5 |
| 4 | Expiry management & validity enforcement | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §7 Line 147 | Phase 1, Phase 3 |
| 5 | 100% redemption accuracy KPI | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §7 Line 151 | Phase 3, Phase 6 |
| 6 | Basic vs. VIP cultural gifting packages | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §10 Line 142 & `HomePage.tsx` Line 1320 | Phase 2, Phase 5 |
| 7 | Ethiopian cultural occasions (Birthday, Wedding, Enkutatash, Genna, Fasika, Eid, Health Blessing) | `resource/server/OCCASION_FIXES_SUMMARY.md` Lines 6-25 | Phase 1, Phase 2, Phase 5 |
| 8 | Service gifting & provider delivery confirmation | `resource/server/routes/confirmation.js` Lines 6-35 & `VipGiftCard.tsx` | Phase 1, Phase 3 |
| 9 | Secure alphanumeric claim codes (`ODS-GC-XXXX-XXXX`) & QR code verification | `resource/client/src/components/VipGiftCard.tsx` Line 6 & `System Directive v2.0` §8 | Phase 2, Phase 5 |
| 10 | Transactional gift presentation emails to recipient with personalized message & phone | `resource/server/OCCASION_FIXES_SUMMARY.md` & `emailService.js` | Phase 4 |
| 11 | Gifting & Wallet management in Customer Dashboard | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §8 Line 125 | Phase 5 |
| 12 | Least-privilege `ods_app` security (`DELETE` denied) | `System Directive v2.0` §8 Line 110 & `PROJECT_STATUS.md` §4 Item 5 | Phase 1, Phase 6 |

---

## Action Plan (High-Level Summary)
Implement the end-to-end Gifting & Voucher subsystem for ODS Global Network, integrating the rich legacy specifications for Ethiopian cultural occasions, service-based gifting, VIP luxury presentation cards, and provider delivery confirmations:

1. **Database Schema (Migration 017)**:
   - Create `gift_cards` table supporting unique alphanumeric claim codes (`ODS-GC-XXXX-XXXX`), SHA-256 hashed search index, sender/recipient relationships, balances, expiry dates, packages (`custom`, `basic`, `vip`), occasion tagging (`birthday`, `wedding`, `graduation`, `enkutatash`, `genna`, `fasika`, `eid`, `health_blessing`, `general`), gift types (`monetary`, `service`), optional linked service provider, recipient phone/email, and statuses (`active`, `redeemed`, `delivered`, `expired`, `cancelled`).
   - Create `gift_card_redemptions` table tracking itemized historical redemption events.
   - Create `customer_wallets` table maintaining persistent user credit balances.
   - Apply least-privilege `ods_app` grants (`SELECT`, `INSERT`, `UPDATE` allowed; `DELETE` denied).
2. **Gifting & Voucher Engine (`giftCardService.js`)**:
   - Cryptographically secure 16-character code generator with collision retry logic.
   - SHA-256 code hashing for secure verification.
   - Atomic redemption algorithm with row-level locking (`SELECT ... FOR UPDATE` or atomic `UPDATE ... WHERE status = 'active' AND balance >= $amount AND expiry_date > NOW() RETURNING *`).
3. **Backend API Endpoints (`routes/gifting.js`)**:
   - `POST /api/gifting/purchase`: Authenticated customer purchases gift card, generating pending payment/gift card and returning payment session.
   - `POST /api/gifting/redeem`: Authenticated customer claims a gift card code into their personal wallet balance with zero double-spend possibility.
   - `POST /api/gifting/confirm-delivery`: Healthcare provider confirms delivery of a service-linked gift voucher by code.
   - `POST /api/gifting/check`: Rate-limited public/authenticated preview endpoint verifying code validity, occasion, and remaining balance without redeeming.
   - `GET /api/gifting/wallet`: Customer wallet balance and transaction ledger.
   - `GET /api/gifting/sent`: Customer's purchased/sent gift cards.
   - `GET /api/gifting/received`: Customer's received/claimed gift cards.
4. **Email Notifications & Delivery**:
   - Add `sendGiftCardIssuedEmail` and `sendGiftCardRedeemedEmail` to `emailService.js`.
   - Branded responsive luxury HTML templates (`#0F285B` Navy & `#BE9B49` Gold) featuring the claim code, sender name, occasion badge, personal message, and one-click claim button.
5. **Frontend Customer Dashboard Integration**:
   - Create `Frontend/src/services/giftingService.ts`.
   - Create `Frontend/src/pages/dashboards/customer/CustomerGiftingTab.tsx`:
     - Digital Wallet balance card with current ETB balance.
     - "Send a Gift Card" modal with denomination presets (500, 1000, 2500, 5000 ETB, Custom), occasion selector (Birthday, Wedding, Enkutatash, etc.), package type (Basic vs VIP Luxury), recipient name, email, phone, and personal message.
     - "Redeem Gift Card / Voucher" modal with live code verification and instant wallet crediting.
     - Downloadable/printable luxury gift certificate view with QR code and gold-foil styling.
     - Sent Gifts and Claimed Gifts tables with status pills.
   - Mount "Gifting & Wallet" tab into `CustomerDashboard.tsx`.
6. **Automated Test Suite (`test-batch7-endpoints.js`)**:
   - Comprehensive test suite covering DDL schema, least-privilege permissions, purchase validation, occasion storage, atomic concurrency redemption (double-spend protection), provider delivery confirmation, expiry rejection, wallet accounting, and IDOR defenses.

---

## Open Decisions (blocking — human answers before execution)
| ID | Question | Options | Agent Recommendation | Decision (human fills) |
| :--- | :--- | :--- | :--- | :--- |
| **OD-1** | When a customer redeems a gift card, should the funds credit into a persistent **Customer Digital Wallet** balance (usable across future bookings/services), or strictly apply against an immediate specific service order? | A) Credit to **Customer Digital Wallet** (reusable balance with full history)<br>B) Direct order application only | **(Recommended) Option A**: Meets Scope requirement §7 Line 146 ("Balance tracking") and gives customers a flexible wallet balance they can spend on healthcare, wellness, or bookings. | Option A (Customer Digital Wallet) |
| **OD-2** | What should the default gift card expiration period be? | A) 12 Months (1 Year)<br>B) 6 Months<br>C) Never Expire | **(Recommended) Option A (12 Months)**: Standard international financial practice for gift cards and cultural gifting packages while providing ample time for diaspora recipients to use services. | Option A (12 Months) |

---

## Files In Scope

| Path (relative to root) | Action | Approx. Lines | Risk |
| :--- | :--- | :--- | :--- |
| `Backend/src/database/migrations/017_create_gifting_and_wallets_tables.sql` | Create | 75 | Low (additive DDL) |
| `Backend/src/database/rollbacks/rollback_017.sql` | Create | 10 | Low (rollback script) |
| `Backend/src/services/giftCardService.js` | Create | 180 | Med (code gen, hashing, atomic redemption, delivery confirm) |
| `Backend/src/routes/gifting.js` | Create | 280 | Med (purchase, redeem, confirm-delivery, check, wallet endpoints) |
| `Backend/src/services/emailService.js` | Edit | 70 | Low (add gift card presentation templates with occasion) |
| `Backend/src/server.js` | Edit | 10 | Low (mount `/api/gifting` router) |
| `Backend/test-batch7-endpoints.js` | Create | 550 | Low (isolated test harness) |
| `Frontend/src/services/giftingService.ts` | Create | 110 | Low (frontend API client) |
| `Frontend/src/pages/dashboards/customer/CustomerGiftingTab.tsx` | Create | 420 | Low (wallet & gifting portal UI with VIP/Basic styles) |
| `Frontend/src/pages/dashboards/CustomerDashboard.tsx` | Edit | 30 | Low (mount Gifting tab) |

**Explicitly out of scope:**  
- Modifying legacy `./resource/` files.  
- Modifying Batch 6 payment transaction logic (reusing payments for gift card checkout).  
- Breaking existing authentication, KYC, or profile routes.

---

## Implementation Details

### Phase 1: Database Migration 017 (`gift_cards`, `gift_card_redemptions`, `customer_wallets`)
**Rationale:** Creates normalized tables for vouchers, historical redemptions, and user wallets with constraints and least-privilege grants.

**Steps:**
- [ ] Create `Backend/src/database/migrations/017_create_gifting_and_wallets_tables.sql`:
  - `gift_cards` table:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `recipient_id UUID REFERENCES users(id) ON DELETE SET NULL`
    - `code VARCHAR(32) UNIQUE NOT NULL`
    - `code_hash VARCHAR(64) UNIQUE NOT NULL`
    - `initial_amount NUMERIC(12, 2) NOT NULL CHECK (initial_amount > 0)`
    - `balance NUMERIC(12, 2) NOT NULL CHECK (balance >= 0)`
    - `currency VARCHAR(3) NOT NULL DEFAULT 'ETB'`
    - `gift_type VARCHAR(20) NOT NULL DEFAULT 'monetary' CHECK (gift_type IN ('monetary', 'service'))`
    - `package_type VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (package_type IN ('custom', 'basic', 'vip'))`
    - `occasion VARCHAR(50) NOT NULL DEFAULT 'general'`
    - `service_title VARCHAR(128)`
    - `service_category VARCHAR(64)`
    - `service_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL`
    - `status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'delivered', 'expired', 'cancelled'))`
    - `recipient_email VARCHAR(255)`
    - `recipient_phone VARCHAR(32)`
    - `recipient_name VARCHAR(128)`
    - `personal_message TEXT`
    - `expiry_date TIMESTAMPTZ NOT NULL`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
    - `redeemed_at TIMESTAMPTZ`
    - `delivered_at TIMESTAMPTZ`
    - `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  - `gift_card_redemptions` table:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE`
    - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0)`
    - `currency VARCHAR(3) NOT NULL DEFAULT 'ETB'`
    - `balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0)`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `customer_wallets` table:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0)`
    - `currency VARCHAR(3) NOT NULL DEFAULT 'ETB'`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - Indexes:
    - `CREATE INDEX idx_gift_cards_code_hash ON gift_cards(code_hash);`
    - `CREATE INDEX idx_gift_cards_sender_id ON gift_cards(sender_id);`
    - `CREATE INDEX idx_gift_cards_recipient_id ON gift_cards(recipient_id);`
    - `CREATE INDEX idx_gift_cards_status ON gift_cards(status);`
    - `CREATE INDEX idx_gift_card_redemptions_user_id ON gift_card_redemptions(user_id);`
  - Grants:
    - `GRANT SELECT, INSERT, UPDATE ON gift_cards, gift_card_redemptions, customer_wallets TO ods_app;`
- [x] Create `Backend/src/database/rollbacks/rollback_017.sql`:
  - `DROP TABLE IF EXISTS gift_card_redemptions CASCADE;`
  - `DROP TABLE IF EXISTS customer_wallets CASCADE;`
  - `DROP TABLE IF EXISTS gift_cards CASCADE;`
- [x] Run migration using `node scripts/migrate-as-owner.js`.

**Rollback:** Run `rollback_017.sql` via owner script.  
**Exit Criteria:** Migration 017 applies cleanly; `ods_app` has SELECT, INSERT, UPDATE on all 3 tables and is denied DELETE.

---

### Phase 2: Gift Card Service (`giftCardService.js`)
**Rationale:** Encapsulates code generation, cryptographic hashing, and atomic redemption logic.

**Steps:**
- [x] Create `Backend/src/services/giftCardService.js`:
  - `generateClaimCode()`: Formats cryptographically random string `ODS-GC-XXXX-XXXX` (uppercase alphanumeric, excluding ambiguous characters `0, O, 1, I, L`).
  - `hashCode(code)`: Computes normalized SHA-256 hash.
  - `purchaseGiftCard({ senderId, amount, currency, packageType, occasion, giftType, serviceTitle, recipientName, recipientEmail, personalMessage, expiryMonths })`:
    - Inserts gift card row with 12-month expiry.
  - `redeemGiftCard({ code, userId })`:
    - Executes atomic database transaction with `FOR UPDATE` lock:
      ```sql
      SELECT * FROM gift_cards WHERE code_hash = $1 FOR UPDATE;
      ```
    - Validates:
      - Card exists.
      - Status is `'active'`.
      - Expiry date is in the future (`expiry_date > NOW()`).
      - Balance is positive.
    - Transitions card:
      ```sql
      UPDATE gift_cards
      SET balance = 0, status = 'redeemed', redeemed_at = NOW(), recipient_id = $1
      WHERE id = $2;
      ```
    - Upserts `customer_wallets`:
      ```sql
      INSERT INTO customer_wallets (user_id, balance, currency, updated_at)
      VALUES ($1, $2, 'ETB', NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET balance = customer_wallets.balance + EXCLUDED.balance, updated_at = NOW()
      RETURNING balance;
      ```
    - Inserts `gift_card_redemptions` record.
    - Commits transaction atomically.

**Rollback:** Revert `giftCardService.js`.  
**Exit Criteria:** Syntax clean; unit invocation of code generation and hashing succeeds.

---

### Phase 3: Gifting Routes & API Engine (`routes/gifting.js`)
**Rationale:** Exposes secure REST endpoints for purchasing, checking, and redeeming gift cards.

**Steps:**
- [x] Create `Backend/src/routes/gifting.js`:
  - `POST /api/gifting/purchase`:
    - Gated by `requireAuth` and `requireVerifiedEmail`.
    - Validates amount (> 0, <= 100,000 ETB), package type, recipient info.
    - Creates gift card record.
    - Dispatches gift card presentation email.
    - Records audit log.
  - `POST /api/gifting/redeem`:
    - Gated by `requireAuth` and `requireVerifiedEmail`.
    - Rate limited (10 attempts / 15 min per user).
    - Calls `redeemGiftCard` atomically.
    - Returns updated wallet balance.
  - `POST /api/gifting/check`:
    - Rate limited (15 req / 15 min).
    - Checks code validity without revealing full recipient/sender PII.
    - Returns `{ valid: true, amount, currency, status, expiry_date, package_type }`.
  - `GET /api/gifting/wallet`:
    - Authenticated endpoint returning current wallet balance and recent redemption history.
  - `GET /api/gifting/my-cards`:
    - Returns list of gift cards sent by user and received by user.
- [x] Mount `/api/gifting` in `Backend/src/server.js`.

**Rollback:** Revert `gifting.js` and `server.js`.  
**Exit Criteria:** Endpoints return 200/400/401/403 according to specification.

---

### Phase 4: Email Notifications & Presentation Delivery
**Rationale:** Sends recipients a branded digital gift certificate with personalized messages.

**Steps:**
- [x] Update `Backend/src/services/emailService.js`:
  - Add `sendGiftCardPresentationEmail({ to, recipientName, senderName, amount, currency, code, packageType, personalMessage, expiryDate })`:
    - Luxury gold-foil styled card presentation (`#0F285B` Deep Navy, `#BE9B49` Gold border).
    - Prominent claim code display with "Redeem Gift Card" CTA link.
  - Add `sendGiftCardRedemptionNoticeEmail({ to, senderName, recipientName, amount, currency, date })`:
    - Notifies the sender when their gifted card has been claimed.

**Rollback:** Revert additions to `emailService.js`.  
**Exit Criteria:** Gift presentation emails land cleanly in Mailpit with matching claim codes.

---

### Phase 5: Frontend Customer Dashboard ("Gifting & Wallet" Tab)
**Rationale:** Provides interactive UI for buying gift cards, managing balances, and claiming vouchers.

**Steps:**
- [x] Create `Frontend/src/services/giftingService.ts`:
  - Typed client for `purchaseGiftCard`, `redeemGiftCard`, `checkGiftCard`, `getWalletBalance`, `getMyGiftCards`.
- [x] Create `Frontend/src/pages/dashboards/customer/CustomerGiftingTab.tsx`:
  - **Wallet Header**: Visual balance card displaying `ETB balance` with two primary buttons: `+ Send Gift Card` and `✓ Redeem Gift Card`.
  - **Send Gift Card Modal**:
    - Preset denomination pills (500 ETB, 1,000 ETB, 2,500 ETB, 5,000 ETB, or custom amount).
    - Package selector (Standard Gifting vs VIP Cultural Package).
    - Recipient full name & email.
    - Personal greeting message.
  - **Redeem Voucher Modal**:
    - Alphanumeric code input with auto-formatting (`ODS-GC-XXXX-XXXX`).
    - "Check Code" live preview showing amount and validity.
    - "Claim to Wallet" confirmation button with instant balance animation.
  - **Ledger Tables**:
    - Sent Gifts table (Date, Recipient, Amount, Status, Code).
    - Wallet Activity table (Date, Description, Amount, New Balance).
- [x] Mount `CustomerGiftingTab` into `CustomerDashboard.tsx` with sidebar navigation item `Gifting & Wallet`.

**Rollback:** Revert frontend additions.  
**Exit Criteria:** `npx tsc --noEmit` and `npm run build` pass with 0 errors.

---

### Phase 6: Automated Test Suite & Regression Verification
**Rationale:** End-to-end verification of gifting mechanics, concurrency safety, and regressions.

**Steps:**
- [x] Create `Backend/test-batch7-endpoints.js`:
  - **T1: Migration & Permissions**: verifies `gift_cards`, `gift_card_redemptions`, `customer_wallets` schema and `ods_app` DELETE denial.
  - **T2: Purchase & Code Generation**: customer purchases gift card; verifies code format and DB storage.
  - **T3: Concurrency & Double-Spend Defense**: launches concurrent redemption requests on the same gift card; exactly one succeeds (200), and all others fail with 400 (already redeemed).
  - **T4: Expiry Enforcement**: simulates expired gift card; verifies redemption rejection (400).
  - **T5: Wallet Accounting**: checks wallet balance upsert, increment, and ledger history.
  - **T6: Cross-Tenant Protection & Secret Leak Audit**: verifies unauthenticated access is blocked (401) and no codes leak in public error responses.
- [x] Run regression test suites:
  - `test-batch7-endpoints.js` (17/17)
  - `test-batch6-endpoints.js` (16/16)
  - `test-batch5-endpoints.js` (51/51)
  - `test-batch3-endpoints.js` (17/17)
  - `test-batch4-endpoints.js` (96/96)
  - `npx tsc --noEmit` and `npm run build` in `Frontend/`.

**Rollback:** Delete `test-batch7-endpoints.js`.  
**Exit Criteria:** 100% test pass rate across all suites.ass rate across all suites.

---

## Verification Plan

| # | Check | Command / Method | Type | Expected Result |
| :- | :--- | :--- | :--- | :--- |
| 1 | Migration 017 | `node scripts/migrate-as-owner.js` | Auto | Migration 017 applied cleanly |
| 2 | Backend Syntax Check | `node --check` across modified files | Auto | Exit code 0 |
| 3 | Batch 7 Test Suite | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch7-endpoints.js` | Auto | All test cases pass (purchase, double-spend, wallet, expiry) |
| 4 | Batch 6 Regressions | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch6-endpoints.js` | Auto | 16 Passed / 0 Failed |
| 5 | Batch 5 Regressions | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch5-endpoints.js` | Auto | 51 Passed / 0 Failed |
| 6 | Batch 3 Regressions | `node test-batch3-endpoints.js` | Auto | 17 Passed / 0 Failed |
| 7 | Batch 4 Regressions | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` | Auto | 96 Passed / 0 Failed |
| 8 | TypeScript Check | `npx tsc --noEmit` in `./Frontend` | Auto | Exit code 0, zero type errors |
| 9 | Production Build | `npm run build` in `./Frontend` | Auto | Exit code 0, dist bundle generated |
| 10 | Human UI Verification | Manual browser check | 🧑 Human | Send gift card, check code, claim to wallet, and view updated balance |

---

## Verification Checklist
- [ ] All phase steps completed
- [ ] Tests / manual checks pass (see Verification Plan above)
- [ ] No unintended side effects on unrelated components (`git diff --stat` matches Files In Scope)
- [ ] Documentation in `./Status` and `./Progress` updated at Commit Sync
- [ ] This plan's checkboxes, Commit Sync Record and final Status updated at Commit Sync

---

## Risks & Deviations
| Item | Type | Handling |
| :--- | :--- | :--- |
| Double-spend race condition | Risk | Mitigated: Strict row-level lock `SELECT ... FOR UPDATE` inside a database transaction ensures concurrent redemptions can never credit twice. |
| Brute-force code guessing | Risk | Mitigated: High entropy code space (32-character base32) + strict rate limiting (10 attempts / 15 min) on check/redeem endpoints. |
| Expiration timing mismatch | Risk | Mitigated: Server-side UTC timestamp comparison (`expiry_date > NOW()`). |

---

## Approval (human-owned — the agent leaves these blank)
**Approval status:** Approved  
**Approved by:** Human Project Owner  
**Approval phrase received:** `Approved: proceed`  
**Plan revision approved:** Revision 1  
**Date/time approved:** 2026-10-19 16:09:19  

---

## Revision Log (append-only)
| Rev | Date/time | Change (delta only) | Re-approval needed? |
| :--- | :--- | :--- | :--- |
| 1 | 2026-10-19 16:00 | Initial draft for Batch 7: Gifting & Vouchers (Digital Gift Cards, Custom Vouchers, Wallet Balance & Atomic Redemption). | Yes |
