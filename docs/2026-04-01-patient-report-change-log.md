# 2026-04-01 Patient Report & PDF Change Log

## Purpose
Track report-layer and export-layer fixes made after the audit, including why each change was necessary.

## Changes

### `js/patientReport.js`
- Preserved Friedman Tongue Position as the original Roman numeral and added normalization in the report layer.
Why: the prior `Number(mall)` handoff converted `I`/`II`/`III`/`IV` into `null`, so high FTP findings never reached the patient report.

- Added patient-facing recommendation filtering for pre-study and normal-AHI patients.
Why: the report should defensively honor the protocol even if future clinical-rule changes accidentally leak OSA treatment tags into pre-study or normal-study reports.

- Removed report-time mutation of `recTags`.
Why: rendering should be read-only; mutating shared recommendation state creates duplicate-risk and makes repeat renders/export behavior harder to trust.

- Changed pre-study and normal-study Section D heading to `Your Next Steps`.
Why: `Your Treatment Plan` overstated certainty before OSA is confirmed or when the sleep study is normal.

- Added CPAP de-prioritization logic for CPAP-avoidant patients and strengthened the mild/low-HB de-prioritization behavior so CPAP falls into the lower-priority group when alternatives exist.
Why: the old report acknowledged CPAP preference but could still leave CPAP in `Start Now`, which contradicted the intended patient messaging.

- Added a sleep-study checklist item and a pre-study-specific follow-up item in Section E, plus checklist deduplication and empty-section suppression.
Why: pre-study reports need actionable next steps, not a mostly empty "First 30 Days" section or duplicate checklist entries.

- Softened low-hypoxic-burden and `Why This Matters` language.
Why: the previous copy overstated certainty about equivalence to CPAP and about surgical/cardiovascular outcome benefits.

### `js/pdf-export.js`
- Switched patient PDF filename generation from a brittle `.report-meta strong` lookup to report-level metadata attributes, with a visible fallback class.
Why: the patient name was rendered in a `<div>`, so many exports defaulted to `Patient` in the filename.

- Made per-page footer dates use the report date when available.
Why: exported footer dates should reflect the report snapshot, not the download timestamp.

- Expanded page-break candidate selectors to include care-pathway, care-summary, checklist subtitle, and table-related blocks.
Why: long reports were more likely to split cards and grouped content at awkward boundaries.

- Reworked patient-report pagination to build page-sized DOM shells, reset screen-only `.patient-report` margin/padding during PDF measurement, and add a fit buffer plus stronger semantic grouping for checklist and what-if sections.
Why: screenshot QA showed the old export path was still clipping through treatment paragraphs, checklist blocks, and what-if cards because the paginator was measuring with the on-screen report CSS but rendering with the stripped PDF CSS. That mismatch let content overrun the page and split inside patient-facing blocks.

### `js/app.js`
- Changed the patient-report data handoff from `Number(mall)` to the original `mall` value.
Why: the report needs the original Friedman Tongue Position value to render correctly.

### `css/patientReport.css`
- Added a dedicated `.report-patient-name` style.
Why: the patient name is now a real structural element that is shared by the on-screen report and PDF export metadata lookup.

### `docs/citations.md`
- Updated the low-hypoxic-burden "How Used" notes to require measured oxygen data and to keep patient-facing alternatives-first language probabilistic.
Why: the report wording was more certain than the evidence supports.

### `docs/test-matrix.md`
- Added Group 9 patient report / PDF regression cases.
Why: the prior matrix covered clinical logic more heavily than report rendering, CPAP ordering, and export metadata/pagination behavior.

## Verification
- `node --check js/patientReport.js`
- `node --check js/pdf-export.js`
- `node --check js/app.js`
- Manual screenshot review of broken exported PDF pages supplied during staging QA.
- Fresh local export artifact review of `tests/artifacts/Sleep_Report_PDF_Pagination_QA_Fix2_2026-04-02.pdf`, including rendered page images for pages 1–5.

## Remaining Follow-Up
- Browser-level re-check of archive/restore remains separate, but the patient-report PDF pagination fix has now been re-exported and visually confirmed locally.

## April 2, 2026 Follow-Up

### `js/patientReport.js`
- Added a patient-facing `What may still be refined` alert when the clinician analysis flags missing oxygen data, incomplete anatomy documentation, or incomplete HNS workup.
Why: the report needed a visible caution layer so incomplete inputs do not read like fully settled conclusions.

- Personalized weight-management recommendation and checklist wording based on `weightLossReadiness`, while preserving GLP-1 language only for BMI `>= 30`.
Why: the intake collected readiness data, but the report was still ignoring it and giving the same weight-management framing to ready, ambivalent, and not-ready patients.
