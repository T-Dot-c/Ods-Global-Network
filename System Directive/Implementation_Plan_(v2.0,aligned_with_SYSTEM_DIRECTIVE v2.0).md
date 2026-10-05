<!--
REUSABLE TEMPLATE — Implementation Plan (v2.0, aligned with SYSTEM_DIRECTIVE v2.0)
Bold text (**like this**) marks values to fill in per change.
Save to:   ./Progress/            (relative to project root; see Directive §4)
Filename:  YYYY-MM-DD_HHMM_<short-description>.md
Pick the form by Tier (Directive §12.4): S = use "Compact Plan (Tier S)" at the bottom; M/L = use the full plan.
Delete this comment block from the copy you create, but keep the Template Changes list here in the master.

TEMPLATE CHANGES / UPDATES  (append-only; original v1.0 fields are all kept)
 🟠 v1 "Save to <DOCS_ROOT_PATH>\Implementation Plans\"  -> ./Progress/ (matches Directive §4; removes the path conflict)
 🟠 v1 Status values -> Draft | Pending Approval | Completed @ <hash> | Abandoned (file is not rewritten between approval and Commit Sync)
 🟠 v1 Approval block -> human-owned; agent leaves fields blank (Directive §12.2)
 🟠 v1 Verification Checklist -> kept, plus a labelled Verification Plan table (Directive §14)
 🟢 Tier, Task ref, Scope Traceability, Baseline Check, Open Decisions, Files In Scope, Rollback,
    Risks & Deviations, Revision Log, Commit Sync Record, Compact Plan (Tier S)
 🟢 Original prompt is stored in revision 1 only (Directive §12.5)
-->

# Implementation Plan: **<short-description>**

**Project:** ODS Global Network
**File:** `./Progress/`**<YYYY-MM-DD_HHMM_short-description>.md**
**Task ref:** **<TASK NN, from ./Status/PROJECT_STATUS.md>**
**Tier:** **<S | M | L>**
**Created:** **<YYYY-MM-DD HHMM>**
**Status:** **<Draft | Pending Approval | Completed @ <hash> | Abandoned>**

---

## Original User Prompt (revision 1 — verbatim, stored once)
> **<Paste the user's original request here, unedited. Later revisions go in the Revision Log as deltas, not as a second copy.>**

---

## Baseline Check (read-only evidence, gathered before drafting)
| Item | Result |
| :--- | :--- |
| Current stage in `PROJECT_STATUS.md` | **<...>** |
| Branch / HEAD | **<branch> / <short-hash>** |
| Working tree | **<clean | dirty: N files — list>** (dirty and unrelated = STOP, Directive §10) |
| Sync Marker vs HEAD | **<in sync | drift: last synced <hash>>** |
| Matching earlier plan | **<path | none>** |

---

## Scope Traceability
| # | Requirement | Source (`Scope §n Line n` / brand section) | Plan step |
| :--- | :--- | :--- | :--- |
| 1 | **<...>** | **<...>** | **<Phase.Step>** |

Items with no source are labelled `NOT IN SCOPE DOC` and must appear under Open Decisions. They are not built.

---

## Action Plan (High-Level Summary)
Brief, plain-language outline of what will change, why, and the impact.

1. **<step summary>**
2. **<step summary>**
3. **<step summary>**

---

## Open Decisions (blocking — human answers before execution)
| ID | Question | Options | Agent recommendation | Decision (human fills) |
| :--- | :--- | :--- | :--- | :--- |
| OD-1 | **<...>** | **<A / B>** | **<...>** | |

*If none, write: "None."*

---

## Files In Scope
| Path (relative to root) | Action | Approx. lines changed | Risk |
| :--- | :--- | :--- | :--- |
| **`./Frontend/src/...`** | **edit in place \| create \| delete** | **<n>** | **<low \| med \| high>** |

**Explicitly out of scope:** **<files/folders that must not be touched, e.g. `./resource`, `LoginPage.tsx`>**
**Contracts preserved:** **<props / exports / API shapes that must not change>**
**New dependencies:** **<none | name + reason + `npm audit` step>**

---

## Implementation Details

### Phase 1: **<phase name>**
**Rationale:** **<Why this change is needed and its expected impact — scope, risk, dependencies.>**

**Steps:**
- [ ] **<exact action — file/function/command/config affected>**
- [ ] **<step 2>**
- [ ] **<step 3>**

**Rollback:** **<how to undo this phase, e.g. `git restore <file>` run by the human>**

### Phase 2: **<phase name>**
**Rationale:** **<...>**

**Steps:**
- [ ] **<step 1>**
- [ ] **<step 2>**

**Rollback:** **<...>**

*(Duplicate the Phase block above for additional phases.)*

---

## Verification Plan
| # | Check | Command / method | Type | Result (filled at Commit Sync) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Type check | `npx tsc --noEmit` | Auto | ✅ / ⚠️ **+ evidence ref** |
| 2 | Production build | `npm run build` | Auto | |
| 3 | Scope/grep check | **`grep ...`** | Auto | |
| 4 | Lint / tests | **<if configured>** | Auto | |
| 5 | Keyboard, focus, responsive | **<manual steps>** | 🧑 Human | *(human reports)* |

Labels: ✅ VERIFIED (agent ran it, output shown) · ⚠️ NOT VERIFIED (state why) · 🧑 HUMAN-TEST REQUIRED (only the human marks pass).

## Verification Checklist
- [ ] All phase steps completed
- [ ] Tests / manual checks pass (see Verification Plan above)
- [ ] No unintended side effects on unrelated components (`git diff --stat` matches Files In Scope)
- [ ] Documentation in `./Status` and `./Progress` updated **at Commit Sync only** (Directive §11)
- [ ] This plan's checkboxes, Commit Sync Record and final Status updated **at Commit Sync only**

---

## Risks & Deviations
| Item | Type (risk \| deviation from scope/brand) | Handling |
| :--- | :--- | :--- |
| **<...>** | **<...>** | **<logged \| mitigated \| accepted by human>** |

---

## Approval (human-owned — the agent leaves these blank)
**Approval status:** Pending
**Approved by:**
**Approval phrase received:** *(must match the directive: `"Approved: proceed"`)*
**Plan revision approved:** **<rev n>**
**Date/time approved:**

---

## Revision Log (append-only)
| Rev | Date/time | Change (delta only) | Re-approval needed? |
| :--- | :--- | :--- | :--- |
| 1 | **<YYYY-MM-DD HHMM>** | Initial draft | Yes |

---

## Commit Sync Record (filled only at a Commit Sync, Directive §11)
**Trigger:** **<commit | push>**
**Commit:** **<short-hash> on <branch>**
**Files in commit vs. Files In Scope:** **<match | differences listed>**
**Checkboxes ticked (with evidence):** **<n of n>**
**`PROJECT_STATUS.md` updated:** **<yes | no>**
**Suggested commit message:** **<`taskNN: <summary> (plan: <filename>)`>**

## Post-Execution Notes
**<Fill in at Commit Sync — what actually happened, deviations from plan, follow-up items, "Noticed, not changed" list.>**
**Approval observed in chat:** **<yes/no + short quote>**

---
---

## Compact Plan (Tier S)
*Use for a single file and about 30 changed lines or fewer, with no new behaviour and no auth, data, payment or security impact. Still requires the exact approval phrase.*

# Implementation Plan (Tier S): **<short-description>**
**Task ref:** **<TASK NN>** · **Created:** **<YYYY-MM-DD HHMM>** · **Status:** **<Pending Approval | Completed @ <hash>>**

**Original User Prompt (verbatim):**
> **<...>**

**Change:** **<one or two sentences: what and why>**
**Source:** **<Scope §n Line n | brand section>**
**File:** **`<path>`** — **edit in place**, about **<n>** lines; contracts unchanged.
**Steps:**
- [ ] **<exact action>**

**Verify:** `npx tsc --noEmit` · `npm run build` · **<grep/manual check>** (label each ✅ / ⚠️ / 🧑)
**Approval (human):** Approved by: ____ · Phrase: ____ · Date/time: ____
**Commit Sync Record:** *(filled at commit/push only)* commit: ____ · suggested message: ____
