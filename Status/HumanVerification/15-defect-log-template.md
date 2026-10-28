# 15. Human Tester Defect Log Template

Use this document to log any discrepancies, visual defects, broken layouts, misleading texts, console errors, or unexpected behaviors found during testing.

---

## 1. Defect Severity Definitions

| Severity Level | Definition & Criteria | Example |
| :--- | :--- | :--- |
| **Blocker (S1)** | Completely prevents user from completing a core journey; data loss; money lost; security leak. | Cannot complete checkout; blank white page on login; customer accessing admin tab. |
| **Major (S2)** | Core feature works but with significant errors, broken states, or incorrect calculations. | 10-minute hold expires instantly; wrong refund amount calculated; email never arrives in Mailpit. |
| **Minor (S3)** | Feature works, but visual defect, confusing message, or poor UX causes friction. | Content cut off on mobile view; missing ETB currency symbol; button remains in loading state after success. |
| **Cosmetic (S4)** | Visual blemish, typo, slight alignment error, or brand color mismatch. | Misspelled label; uneven padding; placeholder text like "Lorem ipsum" visible. |

---

## 2. Active Defect Log Table

| Defect ID | Date | Role / Account | Page Route / URL | Steps to Reproduce | Expected Result | Actual Result | Screenshot File | Console Error / Network Code | Severity | Batch / Area | Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| *DEF-001* | *2026-10-28* | *Customer* | */services/cardiology* | *1. Open service<br>2. Click Book<br>3. Fast double-click* | *Single booking modal opens* | *Two overlapping modals opened* | *def001_double_modal.png* | *None* | *Minor* | *Batch 9* | *Open* |
| | | | | | | | | | | | |
| | | | | | | | | | | | |
| | | | | | | | | | | | |

---

## 3. Individual Defect Report Template (Copy & Paste for Complex Issues)

```markdown
### [DEF-XXX] Short Title Describing the Defect

* **Date**: YYYY-MM-DD
* **Checklist Test ID**: (e.g. CUS-BOOK-014)
* **Tested Role**: (e.g. Customer, Provider, Visitor)
* **Account Used**: (e.g. customer@123.com)
* **Page Route**: (e.g. /services/cardiology-consultation)
* **Browser & Viewport**: (e.g. Chrome 120, Desktop 1920x1080 / iPhone SE 375x667)
* **Severity**: [Blocker / Major / Minor / Cosmetic]
* **Batch / Functional Domain**: (e.g. Batch 9 / Booking Engine)

#### Steps to Reproduce
1. Navigate to ...
2. Click on ...
3. Fill in field X with ...
4. Submit form

#### Expected Result
(Describe exactly what should have appeared on screen or in Mailpit)

#### Actual Result
(Describe what actually happened: error message, white screen, incorrect number, etc.)

#### Visual Evidence & Screenshots
* Screenshot Name: `def_xxx_screenshot.png`
* (Attach or reference screenshot saved in testing notes)

#### Browser Console / Technical Diagnostics
* Console Output: `(Copy/paste any red text from F12 Console)`
* Network Status: `(e.g. HTTP 500 on /api/bookings)`

#### Suggested Fix or Notes for Developers
(Optional: note if this is copy text, CSS responsiveness, or API error)
```
