# OSA Phenotyper — Project Guide

## What This Is
A client-side clinical decision-support tool for obstructive sleep apnea (OSA). Built for Capital ENT & Sinus Center. It takes patient demographics, exam findings, questionnaires, and sleep study data as input, then identifies OSA phenotypes, generates treatment recommendations, and produces a personalized patient report PDF.

**User:** ENT physician at Capital ENT. All clinical decisions must be evidence-based with citations tracked in `docs/citations.md`.

## Architecture
- **Vanilla JS + Bootstrap 5**, fully client-side, no build step, no server framework
- Served via `npx serve .` on port 3000 (configured in `.claude/launch.json`)
- Script load order: `config.js` → `validate.js` → `pdf-parser.js` → `questionnaire-parser.js` → `pdf-export.js` → `patientReport.js` → `app.js`
- CDNs: Bootstrap 5.3.3, Bootstrap Icons 1.11.3, Inter font, pdf.js 3.11.174 (UMD), jsPDF 2.5.1, html2canvas 1.4.1
- AWS Cognito for auth (`js/auth.js`), DynamoDB for patient storage (`js/db.js`)

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Single-page form + results UI |
| `js/app.js` | Main phenotyping engine, recommendation logic, form handler |
| `js/config.js` | All clinical thresholds (centralized) |
| `js/patientReport.js` | Patient-facing report HTML generator |
| `js/pdf-export.js` | PDF generation (html2canvas + jsPDF) |
| `js/validate.js` | Form field validation |
| `js/pdf-parser.js` | WatchPAT PDF drag-and-drop parser |
| `css/styles.css` | Main app styles |
| `css/patientReport.css` | Patient report overlay + PDF styles |

## 9 Phenotypes
High Anatomical Contribution, Low Arousal Threshold, High Loop Gain, Poor Muscle Responsiveness, Positional OSA, REM-Predominant OSA, High Hypoxic Burden, Nasal-Resistance Contributor, Elevated Delta Heart Rate

## Clinical Logic — Key Rules
- **Delta Heart Rate** is manual entry only. WatchPAT does NOT calculate it. Do NOT derive from pulse rate Max-Mean.
- **CVD alone does NOT trigger High Loop Gain** — only boosts confidence (Low → Moderate).
- **Hypoxic Burden uses composite tiering**: worst of HB area/hr, ODI, T90, nadir SpO₂. Thresholds: HB <30/30-60/>60, ODI <20/20-50/>50, T90 <5%/5-20%/>20%, nadir only severe at <75%.
- **Friedman Stage** auto-calculated from FTP + tonsils + BMI. Stage I → strong UPPP candidate. Stage III → suppress UPPP, recommend tongue base/HNS/MMA.
- **MAD candidacy scoring** based on severity, BMI, sex, neck, positional, retrognathia, loop gain, HB. Three tiers: favorable/standard/poor.
- **HNS (Inspire) staging** per Ji 2026: neck + BMI + AHI → response prediction (91%→38%). DISE concentric collapse = contraindication.
- **COMISA** (ISI ≥15 + AHI ≥5): CBT-I prioritized before CPAP (Sweetman 2019).
- **Pre-study patients** (no sleep study): only get sleep study rec + CBT-I if insomnia + nasal if obstruction. No OSA treatment recs.
- **Normal AHI (<5)**: phenotypes suppressed. Snoring pathway + UARS detection if symptomatic.
- **UARS detection**: AHI <5 + symptoms + (RDI > 1.5×AHI ≥10 OR arousal index ≥15) → recommend in-lab PSG.
- **Weight management** recs include GLP-1 agonists (Zepbound/tirzepatide). Only for BMI ≥30 (weight loss what-if shows at BMI ≥27).
- **Inspire BMI >40**: still mention Inspire but note BMI must get under 40 + insurance payer variation.

## Patient Report Structure
Conditional sections based on data presence:
- **Header**: Logo, patient name, date, adaptive title
- **Section A**: Pre-study pathway ("Why We're Recommending a Sleep Study")
- **Section B**: Understanding Your Results (AHI + severity scale + subtype)
- **Section B2**: Normal AHI findings (snoring/UARS pathway)
- **Section C**: What's Contributing (phenotype explanations, no confidence badges)
- **Section D**: Treatment Plan (CPAP context boxes, COMISA callout, Start Now / Discuss groups)
- **Section E**: First 30 Days checklist
- **Section F**: What If scenarios (weight, positional, nasal)
- **Section G**: Why This Matters (severe AHI or HB metrics)

## CPAP Handling
Four patient states with different report behavior:
1. **CPAP-failed, won't retry**: "We hear you on CPAP" box, alternatives first, CPAP last in checklist
2. **CPAP-failed, will retry**: "Giving CPAP another try" box, re-fitting checklist
3. **Prefers to avoid CPAP**: "We understand your preference" box, alternatives first
4. **Current CPAP user**: "Building on your CPAP" box

## Treatment Tag System
Recommendations use tags (e.g., `CPAP`, `MAD-FAVORABLE`, `HNS`, `CBTI`) that map to patient-friendly descriptions in `patientReport.js`. Tags starting with `CPAP-` are suppressed as standalone recs. Prior MAD suppresses all MAD-tier descriptions.

## Testing
- Test matrix: `docs/test-matrix.md` (31 scenarios)
- Test results: `docs/test-matrix-results.md`
- Use preview server to run test patients via JS eval
- Sex field is a `<select>` with values `M`/`F` (not radio with Male/Female)
- `recSeen` and `recTagMap` are module-scoped in app.js — not accessible from eval. Form `reset()` is sufficient between test runs; the submit handler clears them internally.

## Evidence & Citations
All clinical evidence is tracked in `docs/citations.md`. When adding new clinical logic:
1. Add citation to `docs/citations.md` with "How Used" column
2. Reference in code comments
3. Update thresholds in `js/config.js` with citation notes

## Git
- Remote: `https://github.com/stereooooooo/osa-phenotyper.git`
- Always push after commits to keep GitHub in sync
- Commit messages: conventional commits style with Co-Authored-By

## Common Pitfalls
- `app.js` uses `const` declarations inside the form submit handler — variables declared later in the handler cannot be referenced earlier (temporal dead zone). If adding new computed values, declare them before any code that uses them.
- The patient report overlay uses `position: fixed` — preview screenshot tools may not capture it. Use DOM inspection via `preview_eval` instead.
- `html2canvas` cannot parse modern CSS functions (`color()`, `oklch`). The PDF pipeline strips external stylesheets and uses inline `PDF_STYLES`.
