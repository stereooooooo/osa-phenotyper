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
