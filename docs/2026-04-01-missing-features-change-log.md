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

### 8. Upgraded insufficient-data handling from warning-only to guardrails
- Updated `js/app.js` so missing oxygen data, incomplete anatomy documentation, and incomplete HNS workup now prepend prerequisite workup recommendations and suppress premature anatomy/HNS treatment matching in the displayed plan.
- Added new patient-facing workup recommendation tags in `js/patientReport.js` so the patient plan explains what still needs to be completed before those options are finalized.
- Why: a warning banner alone still left the plan reading as more final than the underlying data justified. The audit asked for a real operating mode, not just caution text.

## Remaining Gaps After Follow-Up
- This is now a partial system-wide insufficient-data mode for oxygen/anatomy/HNS decision domains, but it still is not a universal guardrail across every phenotype and every downstream recommendation.
- The review queue currently lives inside the patient list modal; it is not yet a full standalone dashboard with assignment, resolution workflow, or audit analytics.

## April 2, 2026 Treatment-Safety Follow-Up

### 9. Added explicit treatment-prerequisite guardrails
- Updated `js/app.js` so OSA plans now generate explicit safety/prerequisite checks when:
  - MAD is being considered and still needs sleep-dentist / dentition / TMJ confirmation
  - ASV is being mentioned as part of high-loop-gain / central-instability routing and still needs documented safe LVEF
  - surgery is being considered without DISE-guided target mapping
- Updated `js/patientReport.js` so those prerequisites appear as patient-facing plan items and checklist steps instead of remaining buried in clinician-only caveats.
- Updated `docs/citations.md` to explicitly track the ASV HFrEF safety guardrail and the MAD monitoring evidence already being used for dental/TMJ prerequisite messaging.
- Why: one of the remaining audit gaps was that the app still surfaced some advanced or anatomy-specific options more confidently than the underlying prerequisite workup justified. This pass makes those dependencies visible in both clinician and patient outputs.

### 10. Expanded insufficient-data guardrails beyond oxygen / anatomy / HNS
- Updated `js/app.js` so missing positional tracking and missing REM/NREM staging now generate explicit clinician caveats and patient-facing workup recommendation tags.
- Updated `js/patientReport.js` so those gaps appear as clear `POSITION-WORKUP` and `SLEEP-STAGE-WORKUP` explanations plus checklist steps.
- Expanded `tests/tests.html`, `docs/test-matrix.md`, and `docs/test-matrix-results.md` to cover the new positional and REM-stage guardrails.
- Why: the audit correctly called out that missing data was still too easy to interpret as an absent phenotype. This pushes the app further toward a true insufficient-data operating mode by making “not measured” read differently from “not present.”

### 11. Added explicit intake-review resolution workflow and provenance timeline
- Updated `infrastructure/lambda/index.mjs` so clinician chart updates can now process a dedicated `intakeReview` payload with explicit per-field decisions:
  - accept patient intake value into the chart
  - keep the existing clinician-entered chart value
- Added durable `fieldProvenanceHistory` storage across create, clinician save, patient intake merge, and clinician intake-review resolution paths.
- Added capped `intakeReviewHistory` entries so the chart records who reviewed pending intake changes, when, and which fields were accepted vs kept.
- Updated `index.html` with:
  - a dedicated `Review Intake` button in the patient bar
  - review actions directly from the patient-list review queue
  - a dedicated intake-review modal with per-field accept/keep decisions
  - a richer provenance modal that now shows current chart value, pending intake value, and a compact field timeline
- Updated `js/db.js` with a dedicated `reviewIntakeChanges()` API wrapper for the new clinician review path.
- Why: the previous workflow still required clinicians to infer resolution by editing form fields and re-saving. The audit called for a real review workflow and durable provenance, so this pass makes review decisions explicit, persistent, and inspectable later.

## Remaining Gaps After Intake-Review Follow-Up
- The review workflow is now explicit and persistent, but it still does not have assignment, escalation, or audit analytics across multiple clinicians.
- `fieldProvenanceHistory` now captures durable field timelines for chart-form fields, but it does not yet cover every non-form chart attribute (for example, patient identity fields or derived report metadata) as a unified longitudinal history.

## April 2, 2026 Intake-Dashboard Follow-Up

### 12. Added a dedicated intake review dashboard
- Updated `index.html` so the clinician navbar now exposes a dedicated `Review Queue` dashboard separate from the patient-list modal.
- Added a standalone review-dashboard modal with:
  - queue summary counts for `review-needed`, `received`, and `pending`
  - a dedicated list of actionable intake charts
  - one-click `Open` and `Review` actions for each queue item
- Reused the queue-ranking logic so the dedicated dashboard and patient-list filter stay aligned on which charts are most actionable first.
- Why: the audit gap was no longer just “can clinicians review a single pending chart,” but “can they reliably find all intake work that needs attention.” Pulling this into its own surface reduces hunting through the patient list and makes the workflow feel like a real operational queue instead of a hidden toggle.

## Remaining Gaps After Intake-Dashboard Follow-Up
- The app now has a standalone intake review dashboard, but it still does not support assignment, escalation, SLA tracking, or cross-clinician audit analytics.
- `fieldProvenanceHistory` still focuses on chart-form fields rather than every chart attribute as one unified longitudinal record.

## April 2, 2026 Central-Confirmation Follow-Up

### 13. Added a WatchPAT central-confirmation safety guardrail
- Updated `js/app.js` so WatchPAT- or mixed-study central/CSR signals no longer let the advanced central-directed pathway (`HLG-ADV`) stand on their own when PSG confirmation is still missing.
- Added a new `CENTRAL-PSG-WORKUP` treatment-safety tag that:
  - prepends an in-lab PSG confirmation step
  - suppresses premature ASV / central-directed treatment routing until confirmation is available
- Updated `js/patientReport.js` so the patient plan explains why a lab sleep study may still be needed before advanced PAP such as ASV is chosen.
- Updated `docs/citations.md`, `tests/tests.html`, `docs/test-matrix.md`, and `docs/test-matrix-results.md` so the protocol and regression coverage reflect the new guardrail.
- Why: the audit still had a structural safety gap around advanced central-apnea-directed treatment being inferred too directly from home-test central signals. This pass makes WatchPAT central data behave like a screening/workup trigger rather than a final routing decision.

## Remaining Gaps After Central-Confirmation Follow-Up
- The app now guards one important home-test central-instability pathway, but it still does not provide a universal contraindication/safety data model across every surgery, HGNS, PAP-alternative, and central-apnea scenario.
- `fieldProvenanceHistory` still focuses on chart-form fields rather than every chart attribute as one unified longitudinal record.

## April 2, 2026 Explicit Safety-Input Follow-Up

### 14. Added clinician-entered MAD and ASV safety inputs
- Updated `index.html` so the treatment-history card now captures:
  - documented LVEF
  - MAD tooth-support status
  - MAD protrusion adequacy
  - TMJ status
- Updated `js/app.js` so these inputs change the recommendation layer in a data-aware way:
  - documented poor dentition / limited protrusion / severe TMJ suppresses MAD as a live option and replaces it with `MAD-SAFETY-LIMIT`
  - documented LVEF ≤45 suppresses ASV-specific routing and replaces it with `ASV-CONTRA`
  - missing or cautionary findings still use prerequisite-style workup alerts instead of false certainty
- Updated `js/patientReport.js` so the patient plan distinguishes between:
  - “needs more safety review”
  - “currently a poor / unsafe fit”
- Updated `docs/citations.md`, `tests/tests.html`, `docs/test-matrix.md`, and `docs/test-matrix-results.md` to track the new safety-capture rules and executable regression coverage.
- Why: the audit gap was no longer just missing reminder text. The app needed a way to represent documented safety limitations separately from unreviewed prerequisites so treatment options could be suppressed when they are explicitly unsafe or poor fits.

## Remaining Gaps After Explicit Safety-Input Follow-Up
- Safety capture is broader now, but it still is not a universal contraindication model across every surgery, HGNS, and PAP-alternative workflow.
- The app still needs a fuller CI-grade end-to-end suite beyond the current report-layer/browser harness.
