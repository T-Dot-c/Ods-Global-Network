# Implementation Plan: Batch 8 — Service Catalog & Provider Directory

**Project:** ODS Global Network  
**File:** `./Progress/2026-10-21_1630_implementation-plan_batch8-service-catalog.md`  
**Task ref:** TASK 08 / BATCH 08 (from `./Status/PROJECT_STATUS.md`)  
**Tier:** L (Large — multi-tenant service catalog, provider directory, administrative moderation queue, ratings ledger, and customer discovery portal)  
**Created:** 2026-10-21 16:30  
**Status:** Completed & Verified  

---

## Original User Prompt (revision 1 — verbatim, stored once)
> conitue Batch 8: Service Catalog & Directory!
> Approval phrase: okey continu yehr task batch 08

---

## Baseline Check (read-only evidence gathered before drafting)
| Item | Result |
| :--- | :--- |
| Current stage in `PROJECT_STATUS.md` | BATCH 7 COMPLETED & CLOSED (`675b84f9`) |
| Branch / HEAD | `main` / `675b84f9` |
| Working tree | Clean (`git status --porcelain` produced 0 lines) |
| Sync Marker vs HEAD | In sync with `origin/main` at `675b84f9` |
| Matching earlier plan | `Progress/2026-10-19_1600_implementation-plan_batch7-gifting-vouchers.md` (Executed & Verified) |

---

## Scope Traceability
| # | Requirement | Source (`Scope §n Line n` / Directive) | Plan Step |
| :- | :--- | :--- | :--- |
| 1 | Service Provider Management (9 provider categories: Hospitals, Clinics, Pharmacies, Labs, Wellness, Ambulance, Home Care, Specialists, Diagnostic Centers) | `resource/KPIs & SCOPES ODS GLOBAL NET .txt` §4 Line 62–73 | Phase 1, Phase 2, Phase 3 |
| 2 | Service Catalog with categories, pricing, duration, delivery type | `resource/client/src/components/ServiceCatalog.tsx` & `resource/server/routes/service.js` | Phase 1, Phase 2, Phase 3 |
| 3 | Provider service authoring, pricing configuration & discount management | `resource/server/routes/service.js` Lines 116–132, 268–285 | Phase 2, Phase 3, Phase 5 |
| 4 | Admin moderation queue (approval/rejection with audit log) | `resource/server/routes/service.js` Lines 48–94, 246–266 | Phase 1, Phase 3, Phase 5 |
| 5 | Public Service Directory with search, category filtering, location & sorting | `resource/client/src/components/ServiceCatalog.tsx` | Phase 2, Phase 4 |
| 6 | Service reviews & customer rating system | `resource/server/routes/service.js` Lines 108–111 | Phase 1, Phase 2, Phase 3 |
| 7 | Beyond-CRUD business state transition (`pending` -> `approved` / `rejected` -> `archived`) | `System Directive v2.0` §7 Line 102–105 | Phase 1, Phase 2 |
| 8 | Least-privilege `ods_app` security (`DELETE` denied) | `System Directive v2.0` §8 Line 110 & `PROJECT_STATUS.md` §4 Item 5 | Phase 1, Phase 6 |

---

## Action Plan (High-Level Summary)
Implement the end-to-end Service Catalog and Healthcare Provider Directory for ODS Global Network, connecting verified healthcare institutions and wellness providers with diaspora and local clients:

1. **Database Schema (Migration 019)**:
   - Create `services` table supporting provider linkage, category classification (matching the 9 official provider categories), pricing in ETB, discounts, durations, delivery modalities (`in_clinic`, `home_visit`, `virtual`, `diagnostic`), and moderation lifecycle (`pending`, `approved`, `rejected`, `archived`).
   - Create `service_reviews` table for 1–5 star ratings with verified customer reviews.
   - Apply least-privilege `ods_app` grants (`SELECT`, `INSERT`, `UPDATE` allowed; `DELETE` denied).
2. **Service Catalog Engine (`serviceCatalogService.js`)**:
   - Public query builder with multi-facet filtering (search, category, price range, delivery type, sorting, pagination).
   - Provider service management with KYC approval gate (only approved providers can publish services).
   - Admin moderation state machine with atomic status updates and audit logging.
   - Review calculation aggregating average rating score and review count.
3. **Backend API Endpoints (`routes/services.js` & `routes/admin.js`)**:
   - `GET /api/services`: Public search, filter, and pagination.
   - `GET /api/services/categories`: Category taxonomy with active service counts.
   - `GET /api/services/providers`: Provider directory with specialty and location filtering.
   - `GET /api/services/:idOrSlug`: Public single service detail.
   - `POST /api/services`: Provider submits new service for admin review.
   - `GET /api/services/provider/my-services`: Provider manages their catalog.
   - `PUT /api/services/:id`: Provider updates pricing, discounts, duration, or active toggle.
   - `POST /api/services/:id/reviews`: Customer posts service rating and feedback.
   - `GET /api/admin/services/pending`: Admin pending review queue.
   - `POST /api/admin/services/:id/decision`: Admin approves or rejects with reason.
4. **Frontend Public Catalog & Directory Experience**:
   - `Frontend/src/services/serviceCatalogService.ts`: Typed API client.
   - `Frontend/src/pages/ServicesCatalogPage.tsx`: Public luxury catalog browsing interface featuring brand navy/gold aesthetics, search bar, category chips, facet filter drawer, and responsive cards with CTAs to book or gift.
   - `Frontend/src/pages/ServiceDetailPage.tsx`: Dedicated service landing page with provider credential snippet, clinic address, pricing breakdown, and verified reviews.
   - Mount `/services` and `/services/:id` routes in `Frontend/src/App.tsx`.
   - Update `Header.tsx` navbar to link "Services" directly to `/services`.
5. **Provider Dashboard Integration ("Services" Tab)**:
   - `Frontend/src/pages/dashboards/provider/ProviderServicesTab.tsx`:
     - Provider's active, pending, and rejected service listings.
     - "Add New Service" modal with pricing, duration, category, and modality controls.
     - In-place pricing and availability toggle.
6. **Automated Test Suite (`test-batch8-endpoints.js`)**:
   - End-to-end verification covering schema, least-privilege permissions, search facets, provider KYC gating, admin approval state machine, review calculations, IDOR cross-tenant barriers, and regression tests.

---

## Open Decisions (blocking — human answers before execution)
| ID | Question | Options | Agent Recommendation | Decision (human fills) |
| :--- | :--- | :--- | :--- | :--- |
| **OD-1** | Can any registered provider create services, or must the provider's account KYC be in `approved` status before they can publish services to the catalog? | A) Strictly require `approved` provider status<br>B) Allow `pending` providers to draft services, but services remain invisible until both provider and service are approved | **(Recommended) Option B**: Allows newly onboarded providers to prepare their full service menu immediately during onboarding, while public visibility requires both provider approval and service approval. | **Option B Confirmed** (Drafts allowed; visibility requires provider & service approval) |
| **OD-2** | Should the 9 provider categories (`hospital`, `clinic`, `pharmacy`, `laboratory`, `wellness_center`, `ambulance`, `home_care`, `specialist`, `diagnostic_center`) serve as the primary category taxonomy for services? | A) Yes, align directly with the 9 official platform categories<br>B) Separate healthcare services from provider types | **(Recommended) Option A**: Preserves consistency across provider profiles, directory filters, and search menus. | **Option A Confirmed** (Align with 9 official categories) |

---

## Files In Scope

| Path (relative to root) | Action | Approx. Lines | Risk |
| :--- | :--- | :--- | :--- |
| `Backend/src/database/migrations/019_create_services_and_catalog_tables.sql` | Create | 85 | Low (additive DDL) |
| `Backend/src/database/rollbacks/rollback_019.sql` | Create | 10 | Low (rollback script) |
| `Backend/src/services/serviceCatalogService.js` | Create | 280 | Med (catalog queries, admin review, ratings) |
| `Backend/src/routes/services.js` | Create | 290 | Med (public search, provider CRUD, reviews) |
| `Backend/src/routes/admin.js` | Edit | 60 | Low (mount service moderation endpoints) |
| `Backend/src/server.js` | Edit | 10 | Low (mount `/api/services` router) |
| `Backend/test-batch8-endpoints.js` | Create | 650 | Low (isolated test harness) |
| `Frontend/src/services/serviceCatalogService.ts` | Create | 140 | Low (frontend API client) |
| `Frontend/src/pages/ServicesCatalogPage.tsx` | Create | 420 | Low (public search & filter catalog UI) |
| `Frontend/src/pages/ServiceDetailPage.tsx` | Create | 280 | Low (service landing & provider detail view) |
| `Frontend/src/pages/dashboards/provider/ProviderServicesTab.tsx` | Create | 340 | Low (provider service management tab) |
| `Frontend/src/pages/dashboards/ProviderDashboard.tsx` | Edit | 25 | Low (mount Services tab) |
| `Frontend/src/components/layout/Header.tsx` | Edit | 15 | Low (link Services navigation to catalog) |
| `Frontend/src/App.tsx` | Edit | 20 | Low (register `/services` and `/services/:id` views) |
| `Status/PROJECT_STATUS.md` | Edit | 40 | Low (status update) |

**Explicitly out of scope:**  
- Modifying legacy `./resource/` files.  
- Modifying Batch 6 payments or Batch 7 gifting engines (services can be referenced by vouchers).  
- Appointment booking calendar slots (reserved for Batch 9).

---

## Implementation Details

### Phase 1: Database Migration 019 (`services` & `service_reviews`)
**Rationale:** Creates normalized tables for healthcare service offerings and customer reviews with foreign keys, category check constraints, performance indexes, and least-privilege grants.

**Steps:**
- [x] Create `Backend/src/database/migrations/019_create_services_and_catalog_tables.sql`:
  - `services` table:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE`
    - `title VARCHAR(200) NOT NULL`
    - `slug VARCHAR(250) UNIQUE NOT NULL`
    - `description TEXT`
    - `category VARCHAR(50) NOT NULL CHECK (category IN ('hospital','clinic','pharmacy','laboratory','wellness_center','ambulance','home_care','specialist','diagnostic_center'))`
    - `subcategory VARCHAR(100)`
    - `price NUMERIC(12, 2) NOT NULL CHECK (price >= 0)`
    - `discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100)`
    - `currency VARCHAR(3) NOT NULL DEFAULT 'ETB'`
    - `duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0)`
    - `delivery_type VARCHAR(20) NOT NULL DEFAULT 'in_clinic' CHECK (delivery_type IN ('in_clinic', 'home_visit', 'virtual', 'diagnostic'))`
    - `image_url TEXT`
    - `status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived'))`
    - `is_active BOOLEAN NOT NULL DEFAULT TRUE`
    - `rejection_reason TEXT`
    - `reviewed_by UUID REFERENCES users(id)`
    - `reviewed_at TIMESTAMPTZ`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `service_reviews` table:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE`
    - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5)`
    - `review_text TEXT`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
    - `CONSTRAINT uq_service_user_review UNIQUE (service_id, user_id)`
  - Indexes:
    - `CREATE INDEX idx_services_provider_id ON services(provider_id);`
    - `CREATE INDEX idx_services_category ON services(category);`
    - `CREATE INDEX idx_services_status ON services(status);`
    - `CREATE INDEX idx_services_price ON services(price);`
    - `CREATE INDEX idx_services_is_active ON services(is_active);`
    - `CREATE INDEX idx_service_reviews_service ON service_reviews(service_id);`
  - Grants:
    - `GRANT SELECT, INSERT, UPDATE ON services, service_reviews TO ods_app;`
- [x] Create `Backend/src/database/rollbacks/rollback_019.sql`:
  - `DROP TABLE IF EXISTS service_reviews CASCADE;`
  - `DROP TABLE IF EXISTS services CASCADE;`
- [x] Run migration using `node src/database/migrate.js status` and `node scripts/migrate-as-owner.js`.

**Rollback:** Run `rollback_019.sql`.  
**Exit Criteria:** Migration 019 applies cleanly; `ods_app` has SELECT, INSERT, UPDATE and is denied DELETE.

---

### Phase 2: Service Catalog Engine (`serviceCatalogService.js`)
**Rationale:** Encapsulates query optimization, multi-facet filtering, slugification, rating math, and administrative review transitions.

**Steps:**
- [x] Create `Backend/src/services/serviceCatalogService.js`:
  - `slugify(title)`: Generates clean unique URL slugs.
  - `createService({ providerUserId, title, description, category, subcategory, price, discountPercentage, durationMinutes, deliveryType, imageUrl })`:
    - Resolves `provider_id` from `providerUserId`.
    - Inserts service in `pending` state with generated slug.
  - `updateService({ serviceId, providerUserId, updates })`:
    - Checks ownership (provider must own service).
    - If status was `rejected` or `archived`, resets to `pending` upon significant edits.
  - `getPublicCatalog({ category, subcategory, search, minPrice, maxPrice, deliveryType, sort, limit, offset })`:
    - Filters by `services.status = 'approved' AND services.is_active = TRUE AND providers.approval_status = 'approved'`.
    - Joins provider profile name, official phone, city, and aggregates review score.
  - `getServiceDetails(slugOrId)`: Returns single service with full provider info and review highlights.
  - `adminReviewService({ serviceId, adminUserId, decision, rejectionReason })`:
    - Transitions service status (`approved` or `rejected`).
    - Writes audit log (`SERVICE_APPROVED` or `SERVICE_REJECTED`).
  - `addServiceReview({ serviceId, userId, rating, reviewText })`:
    - Upserts review and recalculates average rating.

**Rollback:** Revert `serviceCatalogService.js`.  
**Exit Criteria:** Module compiles cleanly; unit queries succeed against database.

---

### Phase 3: REST API Endpoints (`routes/services.js` & `server.js`)
**Rationale:** Exposes secure REST endpoints for public catalog browsing, provider menu management, customer reviews, and admin approval.

**Steps:**
- [x] Create `Backend/src/routes/services.js`:
  - `GET /api/services`: Public search & filter.
  - `GET /api/services/categories`: Distinct categories with counts.
  - `GET /api/services/providers`: Provider directory.
  - `GET /api/services/:idOrSlug`: Public single service detail.
  - `GET /api/services/:id/reviews`: Public reviews list.
  - `POST /api/services`: Provider creates service (requires `requireAuth` + role='provider').
  - `GET /api/services/provider/my-services`: Provider service management list.
  - `PUT /api/services/:id`: Provider updates service.
  - `DELETE /api/services/:id/archive`: Provider archives service (`is_active = FALSE`).
  - `POST /api/services/:id/reviews`: Customer reviews service (requires `requireAuth` + role='customer').
- [x] Edit `Backend/src/routes/admin.js`:
  - `GET /api/admin/services/pending`: Staff/Super Admin review queue.
  - `POST /api/admin/services/:id/decision`: Moderation decision endpoint.
- [x] Mount `/api/services` in `Backend/src/server.js`.

**Rollback:** Revert routes.  
**Exit Criteria:** Endpoints return expected JSON schemas, status codes, and RBAC responses.

---

### Phase 4: Frontend Public Catalog & Directory Interface
**Rationale:** Gives clients and diaspora members a modern, dynamic, and intuitive interface to discover healthcare providers, compare services, and view pricing.

**Steps:**
- [x] Create `Frontend/src/services/serviceCatalogService.ts`:
  - Typed methods for catalog browsing, provider directory, details, reviews, and provider CRUD.
- [x] Create `Frontend/src/pages/ServicesCatalogPage.tsx`:
  - Hero banner with brand navy/gold theme and real-time search input.
  - 9 Category selector pills with icons and live item count badges.
  - Filter sidebar: Category, Delivery Modality, Price Range, and Sort order.
  - Service grid with high-impact cards: category pill, provider title, city, rating stars, price in ETB, and CTA buttons.
  - Empty state with clear filter reset.
- [x] Create `Frontend/src/pages/ServiceDetailPage.tsx`:
  - Breadcrumbs navigation (`Services / Category / Service Title`).
  - Service title, price, duration pill, modality badge, full description.
  - Provider profile card with verified badge, address, and contact.
  - "Book Appointment" (links to Batch 9 / modal) and "Gift This Service" (links to Batch 7 Gifting).
  - Customer reviews section with rating breakdown and verified customer review cards.
- [x] Update `Frontend/src/App.tsx`:
  - Register `/services` and `/services/:id` in `normalizeRoute` and `AppInner`.
- [x] Update `Frontend/src/components/layout/Header.tsx`:
  - Connect navigation link "Services" directly to `/services`.

**Rollback:** Revert frontend files.  
**Exit Criteria:** `npx tsc --noEmit` and `npm run build` pass with 0 errors.

---

### Phase 5: Provider Dashboard ("Services" Tab)
**Rationale:** Equips healthcare providers with menu authoring and pricing control tools in their existing portal.

**Steps:**
- [x] Create `Frontend/src/pages/dashboards/provider/ProviderServicesTab.tsx`:
  - Overview KPI cards: Total Services, Active Offerings, Pending Moderation, Average Rating.
  - "Add Service" modal with title, category dropdown, price, discount, duration, modality, description.
  - Service list table with status pills (`Approved` green, `Pending` amber, `Rejected` red) and toggle switches.
- [x] Mount `ProviderServicesTab` into `Frontend/src/pages/dashboards/ProviderDashboard.tsx` with sidebar navigation item `Services`.

**Rollback:** Revert provider dashboard tab.  
**Exit Criteria:** Provider can add a service and view its moderation status.

---

### Phase 6: Automated Test Suite & Regression Verification
**Rationale:** Ensures 100% test coverage of catalog filtering, provider access control, admin moderation, and overall repository stability.

**Steps:**
- [x] Create `Backend/test-batch8-endpoints.js`:
  - **T1: Migration & Security**: Verifies `services` and `service_reviews` schema and `ods_app` DELETE denial (SQLSTATE 42501).
  - **T2: Public Catalog Search & Filters**: Tests keyword search, category filtering, price filtering, and pagination.
  - **T3: Provider Service Management**: Tests service creation, slug generation, draft updates, and unapproved provider handling.
  - **T4: Admin Moderation Lifecycle**: Tests pending queue retrieval, service approval, rejection with reason, and audit logging.
  - **T5: Customer Reviews**: Tests review creation, duplicate review rejection (409/400), rating calculations, and anonymous rejection (401).
  - **T6: Cross-Tenant Protection & IDOR**: Tests that Provider B cannot modify Provider A's service (403).
- [x] Run full regression suite across Batches 3, 4, 5, 6, 7, and 8.
- [x] Run `npx tsc --noEmit` and `npm run build` in `Frontend/`.

**Rollback:** Delete `test-batch8-endpoints.js`.  
**Exit Criteria:** All tests pass with zero failures.

---

## Verification Plan

| # | Check | Command / Method | Type | Expected Result |
| :- | :--- | :--- | :--- | :--- |
| 1 | Migration 019 | `node src/database/migrate.js status` | Auto | Migration 019 applied cleanly |
| 2 | Backend Syntax Check | `node --check` across modified files | Auto | Exit code 0 |
| 3 | Batch 8 Test Suite | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch8-endpoints.js` | Auto | 24 Passed / 0 Failed |
| 4 | Batch 7 Regressions | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch7-endpoints.js` | Auto | 17 Passed / 0 Failed |
| 5 | Batch 7 Addendum | `node test-batch7-addendum.js` | Auto | 34 Passed / 0 Failed |
| 6 | Batch 7 Full Spec | `node test-batch7-full-spec.js` | Auto | 12 Passed / 0 Failed |
| 7 | Batch 6 Regressions | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch6-endpoints.js` | Auto | 16 Passed / 0 Failed |
| 8 | Batch 5 Regressions | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch5-endpoints.js` | Auto | 51 Passed / 0 Failed |
| 9 | Batch 3 Regressions | `node test-batch3-endpoints.js` | Auto | 17 Passed / 0 Failed |
| 10 | Batch 4 Regressions | `ALLOW_DESTRUCTIVE_TESTS=1 node test-batch4-endpoints.js` | Auto | 96 Passed / 0 Failed |
| 11 | TypeScript Check | `npx tsc --noEmit` in `./Frontend` | Auto | Exit code 0, zero type errors |
| 12 | Production Build | `npm run build` in `./Frontend` | Auto | Exit code 0, dist bundle generated |
| 13 | Human UI Verification | Manual browser check | 🧑 Human | Browse catalog, search by category, view service details, submit service from provider portal |

---

## Verification Checklist
- [x] All phase steps completed
- [x] Tests / manual checks pass (see Verification Plan above — 267/267 automated tests passing)
- [x] No unintended side effects on unrelated components (`git diff --stat` matches Files In Scope)
- [x] Documentation in `./Status` and `./Progress` updated at Commit Sync
- [x] This plan's checkboxes, Commit Sync Record and final Status updated at Commit Sync

---

## Risks & Deviations
| Item | Type | Handling |
| :--- | :--- | :--- |
| Unapproved providers publishing services | Risk | Mitigated: Public catalog query strictly filters `WHERE services.status = 'approved' AND providers.approval_status = 'approved'`. |
| Cross-tenant menu tampering | Risk | Mitigated: `PUT /api/services/:id` strictly checks `req.user.id === provider.user_id`. |
| Review spamming | Risk | Mitigated: Unique database constraint `(service_id, user_id)` allows at most 1 review per user per service, plus rate limiting on review creation. |

---

## Approval (human-owned — the agent leaves these blank)
**Approval status:** Approved  
**Approved by:** Human Project Owner  
**Approval phrase received:** "okey continu yehr task batch 08"  
**Plan revision approved:** Rev 1  
**Date/time approved:** 2026-10-22 12:21  

---

## Revision Log (append-only)
| Rev | Date/time | Change (delta only) | Re-approval needed? |
| :--- | :--- | :--- | :--- |
| 1 | 2026-10-21 16:30 | Initial draft for Batch 8: Service Catalog & Provider Directory. | Yes |
| 2 | 2026-10-26 10:30 | Execution completed. TypeScript resolved, 24/24 Batch 8 automated tests passing, 267/267 full regression tests passing. Status updated to Completed & Verified. | No |

---

## Commit Sync Record
| Metric | Value |
| :--- | :--- |
| **Commit Subject** | `feat(services): complete Batch 8 Service Catalog & Provider Directory with moderation queue and verified reviews` |
| **Batch 8 Tests** | 24 Passed / 0 Failed |
| **Total Repository Tests** | 267 Passed / 0 Failed |
| **TypeScript / Build** | 0 errors (`npx tsc --noEmit` & `npm run build` both exit 0) |
| **Status** | Completed & Verified |
