# 2026-04-01 Intake & Data Integrity Change Log

## Purpose
Track intake-system and patient-record integrity fixes made after the audit, including why each change was necessary.

## Changes

### `intake.html`
- Added explicit CPAP-history validation for `currently using CPAP` and `would you retry CPAP` when prior CPAP is selected.
Why: the prior intake allowed a partially answered CPAP history that the app later interpreted as "CPAP failed and not willing to retry," which could change recommendations incorrectly.

- Added dedicated error IDs for the CPAP questions and the weight-interest question.
Why: duplicate error IDs made the weight-management error target ambiguous, and the CPAP questions previously had no specific validation target.

- Reworked the progress bar to count required sections accurately and track optional sections separately.
Why: sections 6 and 7 were always marked complete even when untouched, which overstated progress.

- Moved CPAP-detail reset logic into a dedicated helper and clear the retry answer when "currently using CPAP" changes back to `Yes`.
Why: hidden CPAP subfields should not leave stale answers behind.

- Intake submit now surfaces API `error` messages as well as `message`.
Why: the server already returns structured error text, but the page was ignoring it.

### `infrastructure/lambda/intake.mjs`
- Added server-side CPAP-history validation so `currentlyUsing` is required and `retryWilling` is required when the patient is not currently using CPAP.
Why: the UI validation alone is not enough for a public intake endpoint.

- Added `attribute_exists(tokenHash)` to failed-attempt increments.
Why: invalid token guesses should not create junk rows in the token table.

- Replaced the old token-burn-then-patient-update flow with a transactional write across the token and patient record.
Why: a failed patient update should no longer consume the patient's one-time intake link.

- Added merge logic that auto-fills empty chart fields from intake but stages conflicting values in `intakePendingOverrides` instead of silently overwriting saved chart data.
Why: patient intake should not clobber existing clinician-entered data without review.

- Intake writes now increment patient-record version numbers and track applied vs pending-review field counts.
Why: intake submissions need to participate in optimistic concurrency and make review state visible.

- Intake validation now rejects archived patients at both link-validation and submission time.
Why: archived charts should not continue to accept new patient intake through old magic links.

### `infrastructure/lambda/index.mjs`
- Added patient-record versioning on create and optimistic-concurrency checks on update.
Why: two tabs or an intake submission plus a stale clinician save should not silently overwrite each other.

- Added reconciliation logic for `intakePendingOverrides`.
Why: when a clinician reviews a pending intake conflict and saves matching values, the override should clear instead of lingering forever.

- Normalized milestone arrays into canonical workflow order and now derive `status` from that ordered list.
Why: the old UI treated "last checked box" as the active status, which meant clicking milestones out of order could show the wrong workflow state.

- Replaced hard delete with archive semantics and excluded archived records from active list/search/token creation.
Why: patient deletion should be recoverable for chart governance, and archived patients should no longer behave like active records.

### `index.html`
- Added client-side tracking of `currentPatientVersion` and passed it with saves.
Why: the frontend has to participate in the optimistic-concurrency contract for the backend check to work.

- Added an intake-review alert that lists conflicting pending intake fields and values.
Why: once conflicts are staged instead of auto-applied, the clinician needs a visible prompt to reconcile them.

- Updated the intake-status badge to distinguish `review-needed`, `received`, and `reviewed`.
Why: the clinician should be able to scan whether intake needs action.

- Moved `clearCurrentPatient()` into the confirmed clear-form path and removed the capture-phase workaround.
Why: canceling "New Patient" previously dropped the active patient ID anyway, which could redirect the next save to a new record.

- Added a clinician-facing `weightLossReadiness` field so the intake-only preference round-trips through load/save.
Why: without a matching form field, that intake response was silently dropped on the next clinician save.

- Added a shared workspace-reset helper and changed the patient-list action from hard delete language to archive language.
Why: archiving the active patient should clear the live workspace cleanly, and the UI should match the backend’s non-destructive behavior.

### `infrastructure/template.yaml`
- Expanded the intake Lambda IAM policy to allow patient `GetItem` and cross-table `TransactWriteItems`.
Why: the safer merge and atomic token/patient write path require one minimal patient read and one atomic write.

### `docs/test-matrix.md`
- Added Group 10 intake/data-integrity regression cases.
Why: the old matrix had strong clinical and report coverage but not enough around public intake, token lifecycle, or stale-save conflicts.

## Verification
- `node --check infrastructure/lambda/index.mjs`
- `node --check infrastructure/lambda/intake.mjs`
- Inline script syntax parse for `index.html` and `intake.html`

## Remaining Follow-Up
- Browser walkthrough of the intake UI to confirm the new CPAP validation/error states.
- End-to-end verification against a live deployed stack for the DynamoDB transaction/IAM path and the stale-save 409 behavior.
