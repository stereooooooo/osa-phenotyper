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

## April 2, 2026 Endotype-Data Follow-Up

### 15. Expanded insufficient-data handling into detailed endotyping
- Updated `js/app.js` so missing apnea-versus-hypopnea breakdown now creates a dedicated insufficient-data domain instead of silently reading as “no endotype signal.”
- Added `ENDOTYPE-WORKUP` guardrail text to the recommendation layer so the plan explicitly says that collapsibility, full Edwards arousal-threshold scoring, and point-of-care loop-gain estimation are not yet complete when detailed event scoring is absent.
- Added a clinician-analysis caveat card in `js/app.js` that appears when detailed event scoring is missing.
- Updated `js/patientReport.js`, `tests/tests.html`, `docs/test-matrix.md`, and `docs/test-matrix-results.md` so the patient layer and executable coverage reflect that new endotype-data limitation.
- Why: one of the last pre-patient-testing risks was that missing apnea/hypopnea scoring could quietly look like a negative endotype finding. This pass pushes the insufficient-data mode farther toward “not measured means unresolved,” not “not present.”

## Remaining Gaps After Endotype-Data Follow-Up
- The insufficient-data mode is broader now, but it still is not truly universal across every phenotype and downstream treatment path.
- The app still needs a fuller CI-grade end-to-end suite beyond the current browser/report harness.

## April 2, 2026 Partial-Data And Zero-Value Follow-Up

### 16. Expanded insufficient-data handling for partial staging and thin oxygen datasets
- Updated `js/app.js` so positional and REM-specific decision support now treats partially missing datasets as unresolved, not just fully absent datasets.
- Replaced several truthy ratio checks with explicit numeric handling so legitimate `0` values in non-supine AHI or NREM AHI no longer disappear and suppress strong positional or REM-predominant signals.
- Tightened low-hypoxic-burden framing so a single normal oxygen metric no longer counts as enough evidence to de-emphasize CPAP or cardiovascular risk.
- Updated `docs/citations.md`, `tests/tests.html`, `docs/test-matrix.md`, and `docs/test-matrix-results.md` to track the new protocol and executable coverage.
- Why: before patient testing, one of the last major chart-safety risks was that partial sleep-stage / positional / oxygen data could still look falsely reassuring. This pass pushes those areas farther toward “unresolved until adequately measured.”

## Remaining Gaps After Partial-Data And Zero-Value Follow-Up
- The insufficient-data mode is broader now, but it still is not truly universal across every phenotype and downstream treatment path.
- The app still needs a fuller CI-grade end-to-end suite beyond the current browser/report harness.

## April 2, 2026 Executable Regression Runner Follow-Up

### 17. Promoted the browser harness into a repeatable command and CI workflow
- Added `tests/run-headless-suite.sh` so the browser harness can be run as a single command instead of a manual Chrome invocation.
- Added `.github/workflows/regression-harness.yml` to execute the same headless suite on pushes, pull requests, and manual workflow dispatches.
- Updated `README.md` and `docs/test-matrix-results.md` so the testing workflow is documented where future maintainers will actually look.
- Why: the app already had meaningful regression assertions, but they still depended on ad hoc manual invocation. Before real patient testing, that needed to become a repeatable gate rather than tribal knowledge.

## Remaining Gaps After Executable Regression Runner Follow-Up
- The regression harness is now a repeatable command and CI workflow, but it is still centered on browser/report assertions rather than full multi-step clinician and intake journeys.
- The insufficient-data mode is broader now, but it still is not truly universal across every phenotype and downstream treatment path.

## April 2, 2026 Identity-Provenance Follow-Up

### 18. Extended provenance history into chart identity fields
- Updated `infrastructure/lambda/index.mjs` so patient name, date of birth, and MRN are now written into `fieldProvenance` and `fieldProvenanceHistory` alongside the clinical form fields.
- Updated `index.html` so the provenance modal renders identity-field labels and current values from the chart header, not just `formData`.
- Updated `docs/test-matrix.md` and `docs/test-matrix-results.md` so identity provenance is now part of the tracked chart-governance surface.
- Why: once real pilot charts are in play, demographic edits are just as important to audit as phenotype inputs. The provenance timeline needed to cover identity fields too, not only the clinical form payload.

## Remaining Gaps After Identity-Provenance Follow-Up
- The regression harness is now a repeatable command and CI workflow, but it is still centered on browser/report assertions rather than full multi-step clinician and intake journeys.
- The insufficient-data mode is broader now, but it still is not truly universal across every phenotype and downstream treatment path.

## April 2, 2026 Workflow Smoke Suite Follow-Up

### 19. Added localhost multi-step clinician and intake smoke journeys
- Added `js/workflow-test-app.js`, a localhost-only auth/DB shim that patches `OSAAuth` and `OSADatabase` into a safe in-memory test backend when `index.html?testMode=workflow` is opened on `localhost` or `127.0.0.1`.
- Updated `index.html` to load that shim before the auth/database orchestration runs, and to treat workflow test mode as a valid configured environment even if runtime AWS config is blank.
- Guarded the inline `pdfjsLib` worker setup in `index.html` so local headless runs do not crash when the pdf.js CDN is unavailable.
- Updated `intake.html` with a localhost-only workflow mode that:
  - validates a synthetic test token without hitting AWS
  - records the mapped submission payload in memory
  - still drives the real form validation and thank-you transition
- Added `tests/workflow-smoke.html` to exercise real UI journeys:
  - clinician save
  - clinician analyze + report preview
  - snapshot save
  - patient-list reload
  - exact-name patient search
  - archive + restore through the patient-list modal
  - review-dashboard / intake-review resolution
  - public intake submit-to-thank-you
- Expanded `tests/run-headless-suite.sh` so the repeatable command and CI workflow now execute both the core regression harness and the new workflow smoke harness.
- Updated `README.md`, `docs/test-matrix.md`, and `docs/test-matrix-results.md` so the broader automated coverage is documented where future maintainers will look.
- Why: one of the last major pilot-readiness gaps was that the automated suite still proved mostly rules and report rendering, not actual clinician/patient journeys. This pass turns the real UI surfaces into executable smoke paths without requiring live AWS for every regression run.

## Remaining Gaps After Workflow Smoke Suite Follow-Up
- The automated coverage is broader now, but it still is not a full production-grade end-to-end suite against the live AWS environment.
- The insufficient-data mode is broader now, but it still is not truly universal across every phenotype and downstream treatment path.

## April 2, 2026 Universal-Phenotype Uncertainty Follow-Up

### 20. Stopped unresolved phenotype inputs from reading like negative findings
- Updated `js/app.js` so `buildInsufficientDataAssessment()` now also tracks:
  - `anatomy-partial` when one key airway-exam field is still missing
  - `nasal` when no nasal symptom/exam data are documented
  - `delta-heart-rate` when cardiovascular disease is present but manual delta heart rate has not been entered
- Updated `js/app.js` so the insufficient-data guardrail layer now prepends a `NASAL-WORKUP` item when nasal contribution has not actually been assessed.
- Updated `js/patientReport.js` so Section C now renders a dedicated `Contributing factors still being clarified` callout whenever phenotype-relevant domains remain unresolved, instead of letting the report read like those patterns were ruled out.
- Updated the Section C zero-phenotype branch in `js/patientReport.js` so it no longer says the common contributing patterns were simply absent when some of them were never fully assessed.
- Updated `tests/tests.html` with executable assertions covering:
  - unresolved-phenotype callout rendering in Section C
  - safer zero-phenotype summary wording
  - the new `NASAL-WORKUP` patient-plan + checklist behavior
- Updated `docs/test-matrix.md` and `docs/test-matrix-results.md` so the new uncertainty behavior is part of the tracked audit/test surface.
- Why: one of the remaining clinical-testing risks was that incomplete nasal, anatomy, or autonomic-stress inputs could still sound like reassuring negatives in the patient-facing phenotype explanation. This pass pushes the tool farther toward “not assessed means unresolved,” which is much safer for real pilot use.

## Remaining Gaps After Universal-Phenotype Uncertainty Follow-Up
- The insufficient-data mode is broader now, but it is still not literally universal across every phenotype and every downstream recommendation path.
- The automated suite is strong locally, but it still is not a full live-AWS production-grade end-to-end suite.

## April 2, 2026 Hosted Intake-Review Completion Follow-Up

### 21. Fixed final-step hosted intake review completion
- Updated `infrastructure/lambda/index.mjs` so the intake-review completion path no longer includes an unused `:reviewNeeded` expression value when the final pending field is resolved and the record transitions to `reviewed`.
- This bug surfaced only during live CloudFront staging validation: the last pending-field review request returned `500`, and CloudWatch showed a DynamoDB `ValidationException`.
- After the fix and redeploy, the same hosted review-completion request succeeded, cleared pending overrides, incremented `version`, appended `intakeReviewHistory`, and stamped `fieldProvenanceHistory` with the clinician-review resolution.
- The same hosted-validation pass also closed the last open insufficient-data staging check: after a full CloudFront reload, the live patient report correctly rendered `OXYGEN-WORKUP`, `ANATOMY-WORKUP`, and `HNS-WORKUP` together on a real re-analysis scenario, confirming the earlier missing oxygen workup was a stale-tab artifact rather than a code defect.
- Updated `docs/test-matrix.md` and `docs/test-matrix-results.md` to track:
  - hosted exact-name search validation on migrated staging data
  - hosted intake-review completion after the DynamoDB expression fix
  - live end-to-end insufficient-data recommendation substitution on the hosted app
- Why: the intake review workflow was implemented and locally covered, but a real staging chart still found a last-mile failure exactly where clinicians would expect to finalize patient-submitted conflicts.

## Remaining Gaps After Hosted Intake-Review Completion Follow-Up
- The hosted exact-name search path and hosted intake-review completion path are now proven on staging, but broader live-AWS clinician journeys still need periodic reruns as production hardening continues.
- The insufficient-data mode is broader now, but it is still not literally universal across every phenotype and every downstream recommendation path.
