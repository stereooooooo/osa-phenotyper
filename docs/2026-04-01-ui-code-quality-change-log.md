# 2026-04-01 UI & Code Quality Change Log

## Scope
This pass addressed the remaining clinician-facing workflow and maintainability issues from the audit:

- silent default clinical values in the main form
- required fields that were only visually marked, not actually enforced
- progress-track accessibility and completion drift
- mobile action-row layout risk
- patient report preview dialog accessibility
- misleading clinician-facing "confidence" wording for heuristic phenotypes

## Changes Made

### 1. Removed silent clinical defaults
- Updated `index.html` so sex, tonsils, and Friedman Tongue Position start blank instead of defaulting to `M`, `0`, and `I`.
- Why: these were real clinical values masquerading as placeholders and could silently contaminate analysis, progress state, and saved records.

### 2. Made required-field validation real
- Updated `js/validate.js` to enforce `[required]` fields, surface inline invalid states for text/select/date fields, and keep numeric range warnings alongside hard-stop validation.
- Updated `js/app.js` to focus and scroll to the first invalid field on submit failure.
- Why: the app previously labeled core fields as required without actually blocking submission, which made incomplete analyses too easy to run.

### 3. Cleaned up progress-track semantics
- Updated `index.html` progress-track markup from clickable `div`s to semantic buttons.
- Updated progress logic so completion is based on real entered values instead of hard-coded exclusions for legacy defaults.
- Added `aria-current` management for the active section.
- Why: the previous implementation knowingly treated fake defaults as both "selected" and "not really entered," which was fragile and confusing.

### 4. Improved mobile action-row behavior
- Updated `css/styles.css` so the main clinician action row stacks cleanly on smaller screens.
- Why: large action buttons could crowd or overflow on mobile-sized layouts.

### 5. Improved report preview accessibility
- Updated `index.html` and `js/app.js` so the patient report preview has dialog semantics, moves focus into the overlay, traps tab navigation while open, and restores focus to the trigger on close.
- Why: the preview behaved visually like a modal but did not behave like one for keyboard users.

### 6. Reframed clinician heuristic labels
- Updated `js/app.js` so the phenotype table now uses `Signal Strength` with `Strong / Moderate / Limited signal`.
- Added a note clarifying that the display reflects internal heuristic support rather than a validated probability score.
- Why: the old `Confidence` wording overstated the clinical validity of the heuristic display.

### 7. Hardened reset behavior
- Updated `index.html` reset flow to clear progress-step ARIA state plus inline validation/error styling when starting a new patient.
- Why: the reset path could leave behind invalid-state styling or navigation state from the prior chart.

### 8. Fixed archive-path workspace reset scoping
- Updated `index.html` so the generic DOM reset logic lives in `resetWorkspaceUiState()`, while the patient-state reset lives inside the auth/database orchestration scope and is exposed through `window.OSAChartActions.resetWorkspaceForNewPatient`.
- Why: the archived-patient browser flow was calling a top-level reset helper that referenced `clearCurrentPatient()` from the wrong scope, which caused the real staging UI error `Failed to archive: clearCurrentPatient is not defined`.

### 9. Centralized shared report logic
- Added `js/report-shared.js` with shared helpers for care-pathway generation and UARS detection.
- Updated `js/app.js` and `js/patientReport.js` to consume those shared helpers instead of maintaining duplicate pathway/UARS rule implementations.
- Updated script load order in `index.html` and `tests/tests.html` so the shared helper loads before the report and clinician logic.
- Why: the audit correctly identified drift risk between the clinician engine and patient-report layer. Pulling the duplicated pathway/UARS logic into one shared file reduces the chance of future behavior diverging silently.

## Follow-Up Still Recommended
- Run a browser walkthrough for desktop and mobile layouts, especially the progress track and action-row stacking.
- Run keyboard-only testing across the clinician workflow and report preview.
- Consider adding automated browser tests for required-field gating and report-preview focus trapping.
