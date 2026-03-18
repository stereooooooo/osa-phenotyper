# Personalized Sleep Report — Design Spec

## Overview

Replace the existing patient summary with a conditional, stage-aware patient report. The report adapts its content based on what data is available — from a pre-study snoring evaluation through a full post-diagnosis treatment plan. Output is a styled in-app preview with PDF download.

## Patient Stages

The report does not enumerate fixed stages. Instead, each section renders conditionally based on data presence:

- **Pre-study patient:** No sleep study data (no AHI). Report shows questionnaire findings, exam results, snoring context if relevant, and recommendation to get a sleep study.
- **Post-study patient:** Sleep study data exists. Report shows diagnosis explanation, AHI severity scale, phenotype explanations, treatment plan, and health risk context.

Stage is determined by checking whether `pahi` (WatchPAT) or `ahi` (Lab PSG) has a value.

## analysisData Contract

The `out` object in `app.js` is currently local to the form submit handler. A module-scoped variable `lastAnalysisData` must be added to `app.js` and populated at the end of the submit handler. It contains:

```javascript
lastAnalysisData = {
  // Phenotype results (from existing out object)
  phen: [],           // string[] — detected phenotype names
  why: {},            // Record<string, string[]> — phenotype → reasons
  recs: [],           // string[] — ordered recommendations

  // Demographics & exam
  sex: '',            // 'male' | 'female'
  bmi: 0,             // number
  neck: 0,            // number — neck circumference
  tonsils: 0,         // number — tonsil grade (0-4)
  ftp: 0,             // number — Friedman tongue position (1-4)
  nasalObs: false,    // boolean — nasal obstruction present
  ctSeptum: false,    // boolean — CT septal deviation
  ctTurbs: false,     // boolean — CT turbinate hypertrophy

  // Questionnaires
  ess: 0,             // number — Epworth Sleepiness Scale (0-24)
  isi: 0,             // number — Insomnia Severity Index (0-28)
  noseScore: 0,       // number — NOSE score (0-100)

  // Sleep study (null if not done)
  studyType: null,    // 'watchpat' | 'labpsg' | 'both' | null
  pahi: null,         // number | null — WatchPAT pAHI
  ahi: null,          // number | null — Lab PSG AHI
  odi: null,          // number | null
  nadir: null,        // number | null — SpO2 nadir (WatchPAT)
  nadirPsg: null,     // number | null — SpO2 nadir (Lab PSG)
  supPahi: null,      // number | null — supine pAHI
  nonSupPahi: null,   // number | null
  remPahi: null,      // number | null
  nremPahi: null,     // number | null
  ahiSup: null,       // number | null — supine AHI (Lab PSG)
  ahiNonSup: null,    // number | null
  ahiREM: null,       // number | null
  ahiNREM: null,      // number | null
  cai: null,          // number | null — central apnea index
  csr: null,          // number | null — Cheyne-Stokes respiration %
  hbAreaPH: null,     // number | null — hypoxic burden area/hr
  hbUnder90PH: null,  // number | null — time under 90% SpO2/hr
  snoreIdx: null,     // number | null — snore index (dB)
  tst: null,          // number | null — total sleep time (min)
  arInd: null,        // number | null — arousal index

  // Treatment history
  cpapCurrent: false,
  cpapFailed: false,
  cpapWillRetry: false,
  priorMAD: false,
  priorInspire: false,
  priorUPPP: false,

  // Derived
  hasCOMISA: false,   // boolean — ISI >= 15 + AHI >= 5
  subtype: '',        // 'sleepy' | 'insomnia' | 'mixed' | 'minimally-symptomatic'
  severity: '',       // 'normal' | 'mild' | 'moderate' | 'severe'
  primaryAHI: null,   // number | null — whichever AHI is primary (pahi or ahi)

  // Patient info (from form)
  patientName: '',    // string
  reportDate: '',     // string — ISO date
};
```

## Report Structure

### Header (always shown)

- Capital ENT logo (top-left, loaded from `img/logo.svg` as base64 — same file used by existing PDF exports)
- Patient name and date (top-right)
- Report title adapts:
  - Pre-study: "Your Sleep Evaluation Summary"
  - Post-study: "Your Sleep Apnea Report"

### Section A: "Why We're Recommending a Sleep Study"

**Condition:** No sleep study data exists (`primaryAHI` is null).

Content:
- Plain-language summary of questionnaire scores (ESS, ISI, NOSE) with context for what each means
- Exam findings in patient-friendly terms (tonsil size, Friedman tongue position, nasal obstruction)
- If snoring is reported (snoreIdx > 0 OR partner-reported snoring from questionnaire context): dedicated paragraph explaining what snoring is, why it can indicate sleep-disordered breathing, and why a sleep study is the logical next step
- Brief explanation of what a sleep study involves

**Pre-study pathway:** The existing form validation requires sleep study fields for submission. To support pre-study patients, the form validation in `app.js` (around lines 430-465) must be updated to allow submission when the study type section is left empty. The analysis pipeline should detect the absence of study data and skip phenotyping, returning a minimal `out` object with only exam/questionnaire data.

### Section B: "Understanding Your Results"

**Condition:** Sleep study data exists (`primaryAHI` is not null).

Content:
- AHI value with plain-language severity explanation ("Your breathing was interrupted about X times per hour during sleep. This is considered [severity].")
- **AHI Severity Scale visual** (see Visual section below)
- Symptom subtype explanation (Sleepy / Insomnia / Mixed / Minimally-symptomatic) based on ESS and ISI values

### Section C: "What's Contributing to Your Sleep Apnea"

**Condition:** At least one phenotype detected (`phen` array is non-empty).

Content:
- Each detected phenotype rendered as a short, patient-friendly paragraph
- Phenotype icons included for visual anchoring
- No confidence badges (clinician-facing only)
- Explanations connect findings to the patient's experience where possible

### Section D: "Your Treatment Plan"

**Condition:** Recommendations exist (`recs` array is non-empty).

Content:
- Recommendations in patient-friendly prose
- Grouped by priority: first 3 recommendations are "Start Now" actions; remaining are "Discuss With Your Doctor" items. If 3 or fewer total, all are "Start Now."
- CPAP readiness context woven in where relevant (based on cpapCurrent, cpapFailed, cpapWillRetry, priorMAD, priorInspire flags)

### Section E: "Your First 30 Days"

**Condition:** Recommendations exist.

Content:
- Checklist format tailored to the patient's specific recommendations
- Concrete, actionable items (not generic advice)
- Extracted/refactored from existing checklist logic in `app.js` (lines ~933-974)

### Section F: "What If...?"

**Condition:** Any of: BMI >= 27 (weight loss scenario), Positional OSA phenotype present (positional scenario), or Nasal-Resistance Contributor phenotype present (nasal scenario).

Content:
- Scenario-based guidance refactored from existing what-if logic in `app.js` (lines ~964-974)
- Patient-friendly framing

### Section G: "Why This Matters"

**Condition:** Any of: primaryAHI >= 30, SpO2 nadir < 85, or hbAreaPH >= 10.

Content:
- Brief, non-alarming explanation of health implications
- Framed positively: "Treatment can significantly improve..."
- No scare tactics

## AHI Severity Scale Visual

Horizontal bar divided into four color-coded zones:

| Zone | Range | Color |
|------|-------|-------|
| Normal | < 5 | Green |
| Mild | 5-14 | Yellow |
| Moderate | 15-29 | Orange |
| Severe | >= 30 | Red |

- Patient's AHI value shown with a marker/arrow pointing to the correct position
- Number displayed at the marker
- Below the bar: "Your AHI of [X] falls in the [severity] range."
- Implementation: Pure HTML/CSS, no canvas or SVG. Marker position calculated as percentage, capped at a display max (e.g., 60) so the scale doesn't stretch for extreme values.
- Renders correctly in both HTML preview and PDF export (html2canvas compatible).

## Tone and Reading Level

- Target: 8th-grade reading level
- No unexplained medical jargon. If a term is used, it's immediately defined.
- Numbers given context ("28 times per hour" not just "AHI of 28")
- Findings connected to patient experience where possible
- Tone is reassuring but honest — not alarming, not dismissive

## Content Generation

All report text is generated by deterministic template functions. No runtime AI generation.

Each section has a template function that receives the relevant data slice and returns an HTML string. Dynamic values (AHI, scores, phenotype names) are inserted into pre-written prose.

The existing patient summary logic in `app.js` (lines ~900-1101) — including CPAP readiness prose, checklist items, what-if scenarios, and phenotype explanations — should be extracted and refactored into `patientReport.js`. This is a migration of existing content, not greenfield writing.

## Preview and PDF Flow

### User Flow

1. Clinician fills out the form and clicks "Analyze" (existing flow, unchanged)
2. Results appear as they do today (clinician report)
3. A **"Generate Patient Report"** button appears in the results area
4. Clicking it opens a **full-screen preview overlay** — the styled report rendered as HTML
5. Two buttons at the top: **"Download PDF"** and **"Close Preview"**
6. "Download PDF" triggers the html2canvas + jsPDF pipeline on the overlay content
7. "Close Preview" dismisses the overlay, returning to the clinician results

### Preview Overlay

- Full-screen overlay with white background, centered content area (max-width ~750px for letter-size feel)
- Styled identically to what the PDF will look like
- Scrollable for multi-page content
- Sticky top bar with "Download PDF" and "Close Preview" buttons
- When overlay opens: page behind is scroll-locked (overflow: hidden on body)
- When overlay closes: scroll lock removed, focus returns to "Generate Patient Report" button

### PDF Specifications

- Letter size (8.5 x 11 inches), portrait orientation
- Capital ENT logo top-left of first page
- Patient name and date top-right of first page
- Footer on each page: "Prepared by Capital ENT - [date]" — this requires extending the existing page-slicing logic in `exportFromHTML()` to draw footer text on each jsPDF page after the image slice is placed. This is a non-trivial addition to the PDF pipeline.
- Multi-page with proper pagination
- Uses existing `exportFromHTML()` approach in `js/pdf-export.js` as a starting point

## File Architecture

### New Files

**`js/patientReport.js`**
- `generateReportHTML(analysisData)` — main entry point. Takes full analysis result, returns complete styled HTML string
- `getReportStage(data)` — returns 'pre-study' or 'post-study' based on primaryAHI presence
- Section template functions: `renderSectionA(data)` through `renderSectionG(data)`, each returning HTML string or empty string if condition not met
- `renderAHIScale(ahiValue)` — returns AHI severity scale HTML
- `renderHeader(patientName, date, stage)` — returns header HTML with logo and title
- Content extracted/refactored from existing patient summary logic in `app.js`

**`css/patientReport.css`**
- Report-specific styles scoped to `.patient-report` container
- Print-friendly styling
- AHI scale bar styles
- Overlay styles (full-screen, sticky toolbar, scroll lock)

### Modified Files

**`index.html`**
- Add preview overlay container (hidden div at end of body)
- Add "Generate Patient Report" button in results area
- Add patient name input field (if not already present)
- Add `<script src="js/patientReport.js"></script>`
- Add `<link rel="stylesheet" href="css/patientReport.css">`

**`js/app.js`**
- Add module-scoped `let lastAnalysisData = null;`
- At end of submit handler, populate `lastAnalysisData` with the full data contract above
- Update form validation to allow submission without sleep study data (pre-study pathway)
- Wire "Generate Patient Report" button: call `generateReportHTML(lastAnalysisData)`, inject into overlay, show overlay
- Wire "Close Preview" button: hide overlay, restore scroll, return focus
- Remove old patient summary generation code (lines ~900-1101) and `#patientSummary` rendering
- Note: `js/ui.js` does not exist. All UI wiring is in `app.js`, following existing patterns.

**`js/pdf-export.js`**
- Add `exportPatientReportPDF()` function that targets the report overlay content
- Extend page-slicing logic to support per-page footer text
- Remove old `exportPatientPDF()` function (its DOM target `#patientSummary` will no longer exist)

### No New Dependencies

Uses existing html2canvas + jsPDF. AHI scale is pure HTML/CSS. All template logic is vanilla JavaScript.

## Data Flow

```
Form submission
  -> existing analysis pipeline (app.js)
  -> out object produced (phen, why, recs)
  -> lastAnalysisData populated with out + raw metrics + derived fields
  -> stored in module-scoped variable

"Generate Patient Report" click
  -> generateReportHTML(lastAnalysisData) called
  -> getReportStage() checks primaryAHI
  -> each section template checks its condition
  -> conditional sections return HTML or empty string
  -> full HTML assembled and returned
  -> injected into overlay, overlay shown (body scroll-locked)

"Download PDF" click
  -> exportPatientReportPDF() called
  -> html2canvas renders overlay content
  -> jsPDF creates multi-page PDF with per-page footers
  -> browser download triggered

"Close Preview" click
  -> overlay hidden, scroll restored, focus returned to button
```

## What This Replaces

The existing patient summary (built in `app.js` lines ~900-1101, rendered into `#patientSummary`) is replaced by this report. The old summary code, its DOM container, and the old `exportPatientPDF()` function will be removed. There is one patient-facing output, not two.

## Out of Scope

- Email functionality (PDF is emailed separately by the clinician)
- Treatment timeline visual (deferred — too many treatment-specific variations)
- Runtime AI text generation
- On-screen interactive report (no tooltips, collapsible sections, etc.)
- Follow-up visit tracking
