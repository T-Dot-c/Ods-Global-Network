# ODS Global Network — System Directive v2.0 (Baseline + Changes)

> **DIRECTIVE VERSION**: 2.0 — supersedes 1.0 by *addition only*. Every line of v1.0 is preserved in Part A.
> **HOW TO READ THIS FILE**: Part A = original baseline. Part B = new rules. Part C = change log and open decisions.

| Marker | Meaning |
| :--- | :--- |
| ⚪ **BASELINE** | Part A. Original v1.0 text, unchanged. |
| 🟠 **AMENDED** | A baseline rule whose effect is modified. The original text stays in place with a marker beneath it. **On conflict, the amendment wins.** |
| 🟢 **NEW** | A rule introduced in v2.0 (Part B). |

Baseline sections carrying an amendment: **§0.7, §2, §4, §5, §6.5**.

---

# PART A — ⚪ BASELINE (v1.0, unchanged)

# System Directives — ODS Global Network

> **STATUS**: ACTIVE MANDATE  
> **SCOPE**: Entire Project (`./Frontend`, `./Backend`, and all modules)  
> **AUTHORITY**: Lead Engineering Directive  
> **PATH RESOLUTION**: All paths must strictly be relative to project root (`Ods-Global-Network`). Never use absolute paths.  
> **FOLDER CONFINEMENT**: Strictly no files or folders may be created outside the 7 designated directories.

All engineering, architecture, design, and code implementations in this repository **must strictly adhere** to the directives defined in this document without exception.

---

## 0. Strict Folder Confinement
All files, assets, source code, documentation, and configurations must strictly reside within the following 7 designated directories:
1. **`./resource`** — Read-only legacy reference codebase
2. **`./Frontend`** — Main client application
3. **`./Backend`** — Main server API
4. **`./System Directive`** — Governance rules, standing instructions, and templates
5. **`./Progress`** — Implementation plans and directive outputs
6. **`./Assets`** — Official brand identity, fonts, vectors, and guidelines
7. **`./Status`** — Real-time project status and milestone tracking only when i commit to github it will update its file.

> 🟠 **AMENDED (A-01)** — Status writes are gated to Git commit/push events by the Commit Sync procedure in **§11**. Original text above is retained unchanged.

**Rule**: Never create any new folders, scratch files, or configuration files outside these 7 directories at the root level.

---

## 1. Scope & Grounding
- Ground all answers strictly in project documentation located at `./System Directive`, `./Progress`, `./Assets`, `./Status`, and `./resource`. If the docs don't cover something, state so explicitly rather than inferring or pulling in unverified external information.
- Before starting any Implementation Plan, read and apply relevant guidance from workspace skills and project directives.

---

## 2. Change Control Workflow
- **Never execute or apply changes directly.**
- All proposed work must strictly follow the 5-step lifecycle:
  $$\text{Action Plan} \longrightarrow \text{Implementation Plan} \longrightarrow \text{Human Approval} \longrightarrow \text{Execution} \longrightarrow \text{Documentation Update}$$
- **Approval Phrase**: Treat only the exact literal phrase **`"Approved: proceed"`** from the user as authorization to execute. Silence, ambiguous replies ("looks good", "ok"), or partial feedback are **not** approval.

> 🟠 **AMENDED (A-02)** — Exact phrase requirement unchanged. Approval is now bound to a specific plan revision and recorded by the human; see **§12**.

---

## 3. Action Plan Requirements
- Before drafting technical detail, outline a clear, sequential, high-level summary of the proposed workflow (what will change, why, and impact in plain terms).

---

## 4. Implementation Plan Requirements
For each Action Plan, produce a corresponding Implementation Plan using the structure in `./System Directive/implementation_plan_template.md` containing:
- **Prepended original user prompt** at the top of the file, verbatim.
- **Exact technical steps** for each phase (files, functions, commands, configs affected).
- **Verification checklist** — markdown checkboxes (`[ ]`) per task for tracking and post-execution validation.
- **Rationale** — explicit reason and impact assessment for every proposed change.

### File & Folder Convention
- Save every Implementation Plan to: **`./Progress/`**
- Filename format: `YYYY-MM-DD_HHMM_<short-description>.md`
- Example: `./Progress/2026-09-17_1600_initialize-frontend-backend.md`

> 🟠 **AMENDED (A-03)** — Tiered plans, original prompt embedded once, append-only revisions, added template sections; see **§12** and `implementation_plan_template.md` v2.

---

## 5. Post-Execution Governance
- After any approved change is executed (code or process), update all affected documentation in `./Status` and `./Progress` in the same session.
- Mark completed checklist items `[x]` in the persisted Implementation Plan file in `./Progress` to maintain a verifiable audit trail.

> 🟠 **AMENDED (A-04)** — "In the same session" is superseded: `./Status` and plan tracking records are written only at a Commit Sync (**§11**).

---

## 6. Directory Isolation & Responsibilities
1. **`./resource` is Strictly Read-Only**: Legacy source code for reference only. Never modify or run from here.
2. **`./Frontend` and `./Backend`**: Sole active code workspaces.
3. **`./Progress`**: Central repository for all implementation plans, phase tracking, and directive outputs.
4. **`./Assets`**: Single source of truth for brand standards, vector logos (`./Assets/brand/vector`), fonts (`./Assets/fonts`), and guidelines.
5. **`./Status`**: Real-time progress and milestone dashboard (`./Status/PROJECT_STATUS.md`).( only when i commit to github it will update its file.)

> 🟠 **AMENDED (A-01)** — Read at session start and before each plan; written only at Commit Sync (**§11**).

---

## 7. Beyond-CRUD Domain Architecture
- Standard database table editing without validation or domain logic is prohibited.
- Workflows must reflect business state transitions (Merchant KYC verification, conflict-free appointment booking, HMAC-signed payment gateways, cryptographic gift card vouchers).

---

## 8. Security & Hardening Directives
- **Zero Token Exposure**: Never pass tokens in URL query parameters. Use secure `HttpOnly` cookies.
- **Password Security**: Use `bcryptjs` with a work factor of 12 rounds minimum.
- **HMAC Signatures**: Verify all external payment webhooks (e.g., Chapa) cryptographically.
- **Mandatory RBAC**: Every non-public API endpoint must enforce authentication and role authorization.

---

# PART B — 🟢 NEW OPERATING RULES (v2.0)

> 🟢 Everything in Part B is **new in v2.0**. It extends Part A and never removes anything from it. Where a 🟠 AMENDED marker in Part A points here, the Part B rule governs.

## 🟢 §9. Source Precedence & Scope Traceability
Where sources conflict, the higher tier wins:
1. `./resource/KPIs & SCOPES ODS GLOBAL NET .txt` — the authoritative scope document.
2. `./Assets` brand guideline (`ODS_BRAND_GUIDELINE.pdf`, `BRAND_GUIDELINES.md`).
3. The rest of `./resource` — legacy reference only (§6.1).
4. Existing code in `./Frontend` and `./Backend`.

Rules:
- **Trace every requirement.** Each plan step cites its source as `Scope §<n> Line <n>` (or brand-guideline section). No source means the item is labelled `NOT IN SCOPE DOC`, listed under **Open Decisions**, and not built.
- **Never invent** copy, links, contact details, colours, categories, prices, metrics, or routes. If it is missing from the sources, ask.
- **Log deviations.** Any departure from the scope or brand documents (for example the `--color-border-dark` token drift) is recorded in the plan under **Risks & Deviations**. It is never silently kept or silently fixed.
- **Scope document is read-only** (§6.1). A needed scope change is written as a *Scope Change Request* in `./Progress/` for the human to apply. See Open Decision D-1.
- **Standing instructions.** If `./System Directive/standing_instructions.md` exists, read it at session start. On any conflict, this directive wins.

## 🟢 §10. Session Start Protocol & Status Monitoring
Read-only. Run once per session, with commands batched:
1. Read `./Status/PROJECT_STATUS.md` in full. Note **CURRENT STAGE**, the **Sync Marker** (§11.5), and **Immediate Next Steps**.
2. Run `git status --porcelain`, `git branch --show-current`, `git rev-parse --short HEAD`, and `git log -5 --oneline`.
3. If the task continues earlier work, read the newest matching plan in `./Progress/`.
4. Report in at most 10 lines: current stage, baseline state (clean or dirty, with file count), sync state (in sync or drift), and how the requested task fits the stage.

**Re-read points.** The agent re-reads the status file (a) at session start, (b) before drafting any plan, so the plan matches stage and next steps, and (c) at the start of every Commit Sync. It does not poll.

**Stop conditions.** Stop, report, and wait for the human if any of these is true:
- The working tree is dirty and the changes do not belong to the current approved plan.
- A tracked file is 0 bytes or visibly truncated.
- The status file and the repository disagree in a way the agent cannot explain.

## 🟢 §11. Status-File Write Gate — Git Commit / Push Trigger
*Amends §0.7, §5 and §6.5.*

**Definitions**
- **Status files** = everything in `./Status/`, including `PROJECT_STATUS.md`.
- **Plan tracking records** = the checkbox states, Commit Sync Record and Post-Execution Notes of a plan in `./Progress/` after it is approved. See Open Decision D-2.

**Rules**
1. The agent may **read** status files at any time.
2. The agent may **write** status files and plan tracking records **only during a Commit Sync**.
3. A **Commit Sync trigger** is verified evidence from read-only git commands that a commit or push happened:
   - **Commit:** `git rev-parse --short HEAD` differs from `Last synced commit` in the Sync Marker.
   - **Push:** `git rev-parse --short origin/<branch>` differs from `Last pushed commit` in the Sync Marker.
   - **Or** the human states that a commit or push was made. The agent still confirms it with the git commands before writing.
4. **Never triggers:** finishing a step, phase or task; a passing build; the end of a session; a request such as "update the status". If asked, the agent replies that the gate is closed, names the git evidence it is waiting for, and writes nothing.
5. **Sync Marker.** The first Commit Sync inserts this block at the top of `PROJECT_STATUS.md` (insertion only, no existing line is changed). Later syncs edit it in place.
   ```
   <!-- SYNC MARKER -->
   Last synced commit: <short-hash> (<branch>) — <YYYY-MM-DD HH:MM>
   Last pushed commit: <short-hash | none>
   Last trigger: commit | push
   <!-- /SYNC MARKER -->
   ```
6. **Commit Sync procedure**
   1. Show the evidence: `git log -1 --format='%h %s'` and `git show --stat --oneline HEAD`.
   2. Map the commit's changed files to the approved plan(s). Record a milestone as complete **only** for work that appears in the commit diff and carries a ✅ VERIFIED label (§14).
   3. Update `PROJECT_STATUS.md` with minimal in-place edits: `LAST UPDATED` (date taken from the system clock, not guessed), `CURRENT STAGE`, the milestone entry with its commit hash, and the Sync Marker. Never regenerate the whole file.
   4. In the matching plan, tick only the checkboxes that have evidence, fill the **Commit Sync Record** and **Post-Execution Notes**, and set Status to `Completed @ <hash>`.
   5. Leave these edits **uncommitted** for the human's next commit. Status therefore describes commit N and lags one commit behind, by design.
7. **Push-only trigger:** update only `Last pushed commit` and any remote-sync line.
8. **Uncommitted work:** the agent keeps its running notes in chat only. When a session ends with uncommitted work, the agent states "Status not updated: awaiting commit" and lists what is pending.
9. **No secrets in records.** Credentials, seed passwords, tokens and `.env` values are never written to any Status or Progress file. Existing occurrences are flagged and their removal is proposed through a plan (§17).

## 🟢 §12. Change Control Hardening
*Extends §2 and §4.*
1. **Approval is version-bound.** `"Approved: proceed"` (exact literal, §2) authorises the plan revision it was issued against. Any substantive revision after approval needs a fresh phrase.
2. **Approval fields are human-owned.** The agent never fills `Approved by`, `Approval phrase received` or `Date/time approved`. It only refuses to execute until it sees the phrase in chat. At Commit Sync it records `Approval observed in chat: yes/no` with a short quote, in Post-Execution Notes.
3. **No self-decisions.** Open questions go in the plan's **Open Decisions** table with options and a recommendation. Execution is blocked until the human has answered each one. The agent does not choose defaults for user-visible content.
4. **Plan tiers.** The agent proposes a tier and the human may raise it. Every tier still requires the approval phrase.

   | Tier | When | Plan form |
   | :--- | :--- | :--- |
   | **S** | 1 file, about 30 changed lines or fewer, no new behaviour, no auth, data, payment or security impact | Compact plan (template §S) |
   | **M** | Several files or one new behaviour | Full template |
   | **L** | Refactors, new endpoints, migrations, dependencies, anything touching auth, payments or data | Full template plus rollback and risk sections |

5. **Original prompt once.** The verbatim prompt (§4) is stored in revision 1 only. Later revisions add a delta to the **Revision Log**, not a second copy.
6. **Plan files are append-only.** Revisions are added to the Revision Log. Regenerating or rewriting a plan file is forbidden. If a plan file is damaged or empty, the agent stops and reports (§13.9).
7. **Planning budget.** At most two planning rounds before an approval request for Tier S/M. A third round requires the agent to state why.

## 🟢 §13. Execution Constraints
1. **Edit in place** with minimal, targeted patches. Whole-file rewrites of existing files are forbidden unless the plan lists them as their own phase (Tier L).
2. **Keep contracts.** Component props, exported names and API shapes stay unchanged unless the plan says otherwise.
3. **Stay in the plan.** Touch only files listed in **Files In Scope**. Needing another file means stop, add a Revision Log entry, and get re-approval.
4. **No new dependencies, folders or config files** unless the plan lists them (§0 still applies).
5. **Project tooling only** (`npm run build`, `tsc`, project scripts). No global installs and no driver or binary downloads. If a tool is missing, report it.
6. **Stay inside the repo.** Do not read IDE session logs, home directories, or other projects. Needing information outside the repo means ask.
7. **Git is read-only for the agent** (`status`, `diff`, `log`, `show`, `rev-parse`). Commands that write or discard (`commit`, `push`, `reset`, `checkout --`, `clean`, `stash`, `rebase`, `merge`) run only when the human explicitly instructs them. See Open Decision D-3.
8. **Unexpected state = stop.** Extra dirty files, missing files, failing baseline builds and surprising diffs are reported before any further edit.
9. **No silent repair.** If the agent damages a file or finds one damaged, it reports immediately with the cause and proposes the fix as a plan item.
10. **Destructive operations** (delete, move, overwrite) are listed in the plan by path before approval.

## 🟢 §14. Verification & Evidence Standard
Every verification item carries exactly one label:

| Label | Meaning |
| :--- | :--- |
| ✅ **VERIFIED** | The agent ran it and shows the raw output. |
| ⚠️ **NOT VERIFIED** | Not run, or could not be run. The reason is stated. |
| 🧑 **HUMAN-TEST REQUIRED** | Browser, visual, keyboard or screen-reader checks. Only the human can mark these passed. |

**Evidence pack** for each execution report:
1. `git diff --stat`.
2. Targeted `grep` checks with raw output.
3. `npx tsc --noEmit` and `npm run build` (tail of the output).
4. Lint and tests, if the project has them.
5. The list of NOT VERIFIED and HUMAN-TEST items.
6. Files touched compared with files planned.

**Rules**
- No `[x]` without an evidence line. No "PASS" for anything the agent did not execute.
- If the agent cannot run a browser, it says so and lists the manual steps for the human.
- The same command with unchanged inputs is not run twice in one round.

## 🟢 §15. Communication & Efficiency
- Report **deltas** only: what changed since the last report. Do not repeat tables that already live in a file; give the path.
- Report format: **Done / Evidence / Not verified / Needs from you**.
- Ask all clarifying questions in **one** batch.
- Read large files by line range once and locate content with grep. Do not re-read the same range.
- No unrequested extras ("while I was there"). Observations go to a **Noticed, not changed** list.
- When a plan is finished or the session has grown long, suggest a fresh session and a short handoff drawn from `PROJECT_STATUS.md`, rather than carrying the whole history forward.

## 🟢 §16. Engineering Standards
- **Tokens only:** colours, spacing and typography come from `./Frontend/src/styles/tokens.css`. No hard-coded hex values. Token deviations are logged (§9).
- **No emoji in UI code.** Use `lucide-react` icons per `./Assets/BRAND_GUIDELINES.md`.
- **Interaction styles in CSS** (`:hover`, `:focus-visible`), not JavaScript style mutation.
- **Accessibility:** WCAG AA; disclosure-pattern menus; `Escape` restores focus to the trigger; visible focus rings.
- **Structure:** prefer data-driven config over copy-pasted blocks, and typed unions over magic strings. A file over about 500 lines is flagged in the plan with a split proposal. It is not split unprompted.
- **No non-functional controls** ship unless the scope document lists them.
- **Definition of Done:** `tsc` has 0 errors, the build exits 0, lint and tests pass where they exist, no unrelated file changed, and HUMAN-TEST items are reported by the human.

## 🟢 §17. Security Additions
*Extends §8.*
- **No secrets anywhere:** not in code, docs, `./Status`, `./Progress`, logs or chat. Use placeholders. Never print or commit `.env` values.
- **Flag existing exposures.** Seeded default credentials appear in `./Status/PROJECT_STATUS.md` (Task 02). The agent flags this at the first opportunity and proposes redaction through a plan. See Open Decision D-4.
- New endpoints ship with input bounds, RBAC (§8), and a stated test approach.
- Adding a dependency needs a plan entry and `npm audit` output.

## 🟢 §18. Git & Baseline Hygiene
- Each task starts from a **clean tree**. A branch per task (`task-NN-<slug>`) is recommended; the human creates it.
- `./Progress` and `./Status` are tracked. At Commit Sync the agent reports any untracked file in them.
- Recommended one-time plan items: `.gitattributes` for line endings, and lint, format and test tooling.
- At the end of an execution the agent supplies a **suggested commit message** (text only) that references the plan filename. The human commits.

---

# PART C — 🟠🟢 CHANGES / UPDATES

> Append-only. Add new entries at the bottom of each table. Existing entries are never edited or removed.

## C.1 Version history
| Version | Date | Summary |
| :--- | :--- | :--- |
| 1.0 | before 2026-09-30 | Baseline: folder confinement, grounding, change control, plan requirements, post-execution governance, isolation, domain architecture, security. |
| **2.0** | **2026-09-30** | **Baseline preserved. Adds commit/push status gate, session-start protocol, scope traceability, hardened change control, execution and evidence standards.** |

## C.2 Amendments to baseline rules
| ID | Baseline clause | Change | Reason |
| :--- | :--- | :--- | :--- |
| 🟠 **A-01** | §0.7, §6.5 | Status writes happen only at a Commit Sync (§11). | Removes intermediate status writes; makes git the audit anchor. |
| 🟠 **A-02** | §2 | Approval phrase unchanged. Approval is bound to a plan revision and is human-recorded (§12.1–12.2). | The approval record was previously agent-writable. |
| 🟠 **A-03** | §4 | Tiered plans, prompt embedded once, append-only revisions (§12.4–12.6). | Cuts repeated full-plan rewrites and about six planning rounds per component. |
| 🟠 **A-04** | §5 | "In the same session" is replaced by "at Commit Sync" (§11). | Resolves the conflict between §5 and §0.7/§6.5. |

## C.3 New rules
| ID | Rule | Origin |
| :--- | :--- | :--- |
| 🟢 **N-01** | §9 Source precedence and scope traceability | Scope-first workflow; invented-content risk |
| 🟢 **N-02** | §10 Session start protocol and status monitoring | Unstable baseline (uncommitted lines from an earlier session) |
| 🟢 **N-03** | §11 Status-File Write Gate | Requested rule |
| 🟢 **N-04** | §12.3 No self-decisions; blocking Open Decisions | Agent decided before being asked |
| 🟢 **N-05** | §13 Execution constraints | Whole-file rewrites, silent repair, IDE-log reading |
| 🟢 **N-06** | §14 Verification labels and evidence pack | Boxes ticked for tests never run |
| 🟢 **N-07** | §15 Communication and efficiency | Duplicate commands, repeated tables |
| 🟢 **N-08** | §16 Engineering standards | Task 04/05 outcomes; hover-in-JS; magic strings |
| 🟢 **N-09** | §17 Security additions | Seed credentials present in the status file |
| 🟢 **N-10** | §18 Git and baseline hygiene | Untracked audit files; branch-per-task |

## C.4 Key text changes (diff view, display only)
The `-` lines below are **still present, unchanged, in Part A**. The diff only shows how the effective rule now reads.

```diff
 ## 5. Post-Execution Governance
-- After any approved change is executed (code or process), update all affected documentation in `./Status` and `./Progress` in the same session.
+- After any approved change is executed, update `./Progress` plan records and `./Status` ONLY during a Commit Sync (§11), triggered by a verified git commit or push.
 - Mark completed checklist items `[x]` in the persisted Implementation Plan file in `./Progress` to maintain a verifiable audit trail.
+- Mark `[x]` only where an evidence line exists (§14), and only at Commit Sync.

 ## 6.5 ./Status
+ ./Status is READ at session start and before each plan; WRITTEN only at Commit Sync.
```

## C.5 Open decisions for the human owner
| ID | Decision | Current default in v2.0 |
| :--- | :--- | :--- |
| **D-1** | May the agent append an "Update / Changes" section to `./resource/KPIs & SCOPES ODS GLOBAL NET .txt`? | **No.** `./resource` stays read-only (§6.1); scope changes go to `./Progress/` as Scope Change Requests. |
| **D-2** | Does the commit gate also cover plan checkboxes and notes, or only `./Status`? | **Both** are gated (§11). Relax §11 definitions if you want live ticking. |
| **D-3** | May the agent run git write commands? | **No**, unless you instruct it (§13.7). |
| **D-4** | Redact the seeded admin credentials from `PROJECT_STATUS.md`? | **Flag and propose** via a plan (§17). |
