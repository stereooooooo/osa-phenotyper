# 2026-04-01 Missing Features Change Log

## Scope
This pass focused on the highest-value production-hardening gaps that remained after the clinical, report, intake, infrastructure, and UI remediation passes:

- archive lifecycle was one-way
- chart fields did not preserve durable provenance
- generated patient reports were preview/download only, not frozen in the chart
- there was no clinician-facing surface for reviewing provenance or saved snapshots

## Changes Made

### 1. Added archive restore workflow
- Updated `infrastructure/lambda/index.mjs` so archived patients can be restored through the existing patient update route with admin-only enforcement.
- Updated `js/db.js` and `index.html` so admins can toggle archived records in the patient list and restore them from the UI.
- Why: archive without restore is safer than hard delete, but it still falls short of real chart lifecycle management.

### 2. Added per-field chart provenance
- Added `fieldProvenance` storage on patient records in `infrastructure/lambda/index.mjs`.
- Clinician saves now stamp field provenance as `clinician`, and intake-applied values now stamp provenance as `patient-intake` in `infrastructure/lambda/intake.mjs`.
- Added pending provenance metadata for unresolved intake conflicts (`patient-intake-pending`).
- Added a clinician-facing provenance modal in `index.html`.
- Why: clinicians need to know whether a value came from chart entry, patient intake, or a still-pending intake conflict before trusting it in decision support.

### 3. Added frozen report snapshots
- Added capped `reportSnapshots` persistence in `infrastructure/lambda/index.mjs` with:
  - immutable snapshot IDs
  - saved patient-report HTML
  - hashed report HTML
  - hashed analysis payload
  - saved-by / saved-at metadata
  - capped retention (latest 5 snapshots)
- Added chart-side snapshot save from the report preview overlay in `index.html` and `js/app.js`.
- Added a snapshot history modal with preview support in `index.html`.
- Why: report previews and ad hoc PDF downloads are not enough for medical-record integrity; clinicians need a frozen chart artifact they can return to later.

### 4. Added snapshot-preview guardrail
- Updated `js/app.js` so historical frozen snapshots can be previewed in the same overlay, but the `Save Snapshot` action is disabled while viewing a historical snapshot.
- Why: without that guardrail, the UI could falsely imply that a saved historical report was still the current live analysis.

## Regression Coverage Updated
- Added Group 13 to `docs/test-matrix.md` covering:
  - archived-list / restore behavior
  - field provenance
  - pending intake provenance
  - report snapshot save/history
  - frozen snapshot preview guardrails

## Remaining Gaps
- There is still no fully executable end-to-end regression suite for the full phenotype engine and clinician workflow.
- There is still no full per-field source history timeline; provenance currently reflects latest known source, not every prior source transition.
- There is still no dedicated "insufficient data" operating mode that systematically downgrades all phenotype/treatment outputs when key domains are missing.
- Report snapshots are stored on the patient item with capped retention; a future production design may still warrant a dedicated snapshot table if record volume or artifact size grows.

## April 2, 2026 Follow-Up Hardening

### 5. Added a lightweight intake review queue filter
- Updated `index.html` so the patient-list modal can switch into `Review queue only` mode and sort actionable intake statuses (`review-needed`, `received`, `pending`) to the top.
- Surfaced pending-field counts directly in the patient list by expanding the list/search projections in `infrastructure/lambda/index.mjs`.
- Why: pending intake conflicts existed in the data model, but clinicians still lacked a fast way to focus on charts that needed review.

### 6. Added explicit insufficient-data warnings
- Updated `js/app.js` to generate clinician-facing insufficient-data alerts when oxygen metrics are missing, anatomy is incompletely documented, or HNS workup remains incomplete.
- Updated `js/patientReport.js` to add a patient-facing `What may still be refined` callout when those limitations affect interpretation.
- Why: the app still needed a clear warning layer so missing data no longer feels like a silent green light for fully confident phenotype-driven decisions.

### 7. Expanded the executable regression harness
- Updated `tests/tests.html` to load the real patient-report generator and assert:
  - insufficient-data callout rendering
  - weight-readiness personalization
  - BMI-based GLP-1 wording guardrails
- Re-ran the local browser harness and recorded the new `103 passed / 0 failed` result in `docs/test-matrix-results.md`.
- Why: the audit correctly called out that docs-only matrices were not enough for a daily clinical decision-support tool. This still is not a full end-to-end CI suite, but it materially improves executable coverage of recent audit fixes.

## Remaining Gaps After Follow-Up
- This is still a warning/callout layer, not a full system-wide insufficient-data mode with automatic suppression or downgrading of all downstream recommendations.
- The review queue currently lives inside the patient list modal; it is not yet a full standalone dashboard with assignment, resolution workflow, or audit analytics.
