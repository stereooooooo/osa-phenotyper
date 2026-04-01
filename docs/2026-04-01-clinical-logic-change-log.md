# Clinical Logic Change Log

**Date:** 2026-04-01

## Scope

This log tracks the April 1, 2026 clinical-logic remediation pass focused on phenotype detection, HGNS gating, low-hypoxic-burden handling, and weight-management messaging.

## Changes Made

### `/Users/raymondbrown/Documents/Health & Medical/OSA & Sleep Research/OSA Phenotype App/js/config.js`

- Replaced the old insomnia/arousal-ratio low-arousal-threshold thresholds with Edwards-score thresholds (`AHI <30`, `nadir >82.5%`, `hypopnea fraction >58.3%`, score `>=2`).
  Why: the prior config encoded a proxy model that did not match the cited Edwards literature.

- Added explicit loop-gain estimate thresholds (`0.7` high, `0.6` borderline) and documented CSR / central-event metrics as supportive signals rather than primary triggers.
  Why: the app had split logic between central-event thresholds and a separate clinician loop-gain estimate, which created contradictory outputs.

- Added NREM floor thresholds to poor-muscle-responsiveness detection.
  Why: the old REM/NREM rule could co-fire with REM-predominant OSA off the same signal and overcall muscle dysfunction when NREM burden was low.

### `/Users/raymondbrown/Documents/Health & Medical/OSA & Sleep Research/OSA Phenotype App/js/app.js`

- Reworked `confidenceFor()` so Low ArTH now keys off the Edwards score, High Loop Gain keys off the Schmickl estimate plus supportive central/CSR context, and Poor Muscle Responsiveness requires persistent NREM burden.
  Why: confidence labels were previously tied to outdated or internally inconsistent heuristics.

- Moved the Edwards ArTH calculation into the main phenotype pipeline and used it to drive Low ArTH detection.
  Why: the phenotype engine was using insomnia and arousal-index shortcuts instead of the cited score.

- Suppressed all phenotypes until OSA is actually confirmed (`AHI >= 5`).
  Why: normal-AHI and pre-study patients could previously accumulate PALM/anatomic phenotypes that were clinically meaningless and could leak into downstream recommendations.

- Changed High Loop Gain detection to use the loop-gain estimate as the primary signal, with central/CSR markers as supporting context only.
  Why: the app could previously show “not high loop gain” in the phenotype table while simultaneously showing a high loop-gain estimate in clinician analysis.

- Tightened Poor Muscle Responsiveness so it no longer fires on REM-heavy cases with low NREM burden.
  Why: the old logic overlapped too heavily with REM-predominant OSA.

- Removed automatic CBT-I recommendations from every Low ArTH phenotype and limited CBT-I from that branch to patients who actually have clinically significant insomnia (`ISI >= 15`).
  Why: low arousal threshold is not synonymous with insomnia, and the previous rule could recommend CBT-I to non-insomniac patients.

- Limited phenotype-driven HNS recommendations to patients with documented PAP failure and qualifying AHI range.
  Why: the old muscle-responsiveness branch could surface Inspire for CPAP-naive patients and even tag CPAP-titration advice as `HNS`.

- Added a stage-aware obesity/weight-management recommendation for OSA patients with `BMI >= 30`, independent of the anatomical phenotype.
  Why: weight management was previously tied too tightly to the anatomical branch and could be missed in obese patients without strong anatomic flags.

- Hardened HGNS eligibility so lack of documented PAP failure/intolerance is now a hard stop, corrected the “optimal AHI” wording to match STAR vs current FDA ranges, and changed low arousal threshold / low muscle compensation from favorable to cautionary HGNS factors.
  Why: the prior HGNS assessment and rec layer could contradict the evidence and still push Inspire evaluation when eligibility criteria were not met.

- Made Ji 2026 HNS staging return “insufficient data” when neck/BMI/sex inputs are missing instead of silently assigning a favorable stage.
  Why: incomplete data should not produce falsely reassuring response estimates.

- Required actual oxygen data before setting `lowHypoxicBurden` or showing low-HB alternatives-first notes.
  Why: the old logic treated “no high-HB phenotype detected” as equivalent to “documented low hypoxic burden,” even when no oxygen metrics were entered.

### `/Users/raymondbrown/Documents/Health & Medical/OSA & Sleep Research/OSA Phenotype App/js/patientReport.js`

- Softened the patient-facing Poor Muscle Responsiveness description so it no longer implies Inspire is specifically indicated or highly effective on that phenotype alone.
  Why: the prior language overstated certainty relative to the evidence.

- Split generic weight-management language from GLP-1/Zepbound language, and gated medication-specific wording to `BMI >= 30`.
  Why: the old generic `WEIGHT` tag could expose GLP-1 messaging even in non-obese patients, including snoring-only pathways.

- Added BMI-aware handling for `INSPIRE-EVAL` so BMI-above-40 patients are told weight reduction below 40 is required before formal candidacy review.
  Why: the app should still mention Inspire when relevant, but only with the correct gating context.

### `/Users/raymondbrown/Documents/Health & Medical/OSA & Sleep Research/OSA Phenotype App/docs/citations.md`

- Updated the evidence file to reflect the current FDA Inspire indication, the FDA tirzepatide/Zepbound OSA approval, the corrected Edwards low-ArTH citation, and the Op de Beeck endotype predictors for HGNS response.
  Why: the code was moving faster than the evidence file, which made the protocol harder to audit.

- Clarified that Schmickl is the app’s primary loop-gain estimate and that central/periodic-breathing signals are supportive rather than standalone triggers.
  Why: this matches the updated code and prevents future drift.

### `/Users/raymondbrown/Documents/Health & Medical/OSA & Sleep Research/OSA Phenotype App/docs/test-matrix.md`

- Added regression scenarios for Edwards low ArTH without insomnia, REM-heavy cases with low NREM burden, Inspire interest without PAP failure, missing oxygen metrics, and obesity without strong anatomic phenotype.
  Why: these are the exact edge cases that previously produced misleading logic or are now protected by the new rules.

## Verification Performed

- `node --check js/app.js`
- `node --check js/patientReport.js`

## Still Recommended

- Run the expanded clinical test matrix in-browser and capture updated expected outputs.
- Add an executable regression harness for the phenotype engine so clinical-rule drift is caught before release.
