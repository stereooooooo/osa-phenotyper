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
| `intake.html` | Patient-facing intake questionnaire (magic-link access) |
| `js/app.js` | Main phenotyping engine, recommendation logic, form handler |
| `js/config.js` | All clinical thresholds (centralized) |
| `js/db.js` | Patient CRUD + intake token API methods |
| `js/auth.js` | Cognito authentication (clinician accounts) |
| `js/patientReport.js` | Patient-facing report HTML generator |
| `js/pdf-export.js` | PDF generation (html2canvas + jsPDF) |
| `js/validate.js` | Form field validation |
| `js/pdf-parser.js` | WatchPAT PDF drag-and-drop parser |
| `js/questionnaire-parser.js` | Intake questionnaire PDF parser (Doctible/IntakeQ) |
| `css/styles.css` | Main app styles |
| `css/intake.css` | Patient intake page styles |
| `css/patientReport.css` | Patient report overlay + PDF styles |
| `infrastructure/template.yaml` | CloudFormation: DynamoDB, Cognito, Lambda, API Gateway, WAF, CloudTrail |
| `infrastructure/lambda/index.mjs` | Main Lambda: patient CRUD + token management |
| `infrastructure/lambda/intake.mjs` | Intake Lambda: token validation, form submission (restricted IAM) |
| `infrastructure/deploy.sh` | AWS deployment script |

## 9 Phenotypes
High Anatomical Contribution, Low Arousal Threshold, High Loop Gain, Poor Muscle Responsiveness, Positional OSA, REM-Predominant OSA, High Hypoxic Burden, Nasal-Resistance Contributor, Elevated Delta Heart Rate

## Clinical Logic — Key Rules
- **Delta Heart Rate** is manual entry only. WatchPAT does NOT calculate it. Do NOT derive from pulse rate Max-Mean.
- **CVD alone does NOT trigger High Loop Gain** — only boosts confidence (Low → Moderate).
- **Hypoxic Burden uses composite tiering**: worst available HB, ODI, T90, and nadir tier. HB 30 is an exploratory elevated-signal boundary; HB 73 and 87 are cohort-derived high/very-high research thresholds. Moderate signals provide context only and do not independently create treatment urgency.
- **Friedman Stage** auto-calculated from FTP + tonsils + BMI. Stage I → strong UPPP candidate. Stage III → suppress UPPP, recommend tongue base/HNS/MMA.
- **MAD candidacy scoring** based on severity, BMI, sex, neck, positional, retrognathia, loop gain, HB. Three tiers: favorable/standard/poor.
- **HNS staging** per Ji 2026: neck + BMI + AHI → a qualitative response tier, not device eligibility. DISE complete concentric collapse (CCC) contraindicates unilateral Inspire. Do **not** auto-route CCC to Genio: current US Genio labeling states that safety/effectiveness in CCC are not established.
- **COMISA** (ISI ≥15 + AHI ≥5): offer CBT-I early. PAP may start concurrently or sequentially based on severity, oxygen burden, sleepiness, access, and preference; do not automatically delay urgent OSA treatment.
- **Pre-study patients** (no sleep study): only get sleep study rec + CBT-I if insomnia + nasal if obstruction. No OSA treatment recs.
- **Normal AHI (<5)**: phenotypes suppressed. Snoring pathway + UARS detection if symptomatic.
- **UARS detection**: AHI <5 + symptoms + (RDI > 1.5×AHI ≥10 OR arousal index ≥15) → recommend in-lab PSG with arousal-based scoring.
- **Weight management** recs include GLP-1 agonists (Zepbound/tirzepatide). Only for BMI ≥30 (weight loss what-if shows at BMI ≥27).
- **Nerve stim BMI >40**: above Capital ENT's current conservative HGNS referral guardrail, so no patient-facing `HNS`/`INSPIRE-EVAL` recommendation is emitted. This is an app governance rule, not a universal device contraindication. Inspire labeling extends through BMI 40; Genio safety/effectiveness above BMI 32 are not established; payer criteria vary.

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

## Patient Intake System
- **Magic-link tokens**: Staff generates a 72-hour, single-use token via "Intake Link" button → copies URL → sends to patient via HIPAA-compliant channel
- **Token security**: 256-bit random tokens, SHA-256 hashed before DB storage, 5-attempt lockout, single-use enforcement
- **Intake page** (`intake.html`): Standalone, zero third-party scripts, CSP headers, `Referrer-Policy: no-referrer`
- **Separate Lambda** (`intake.mjs`) with a least-privilege role (`IntakeLambdaRole`) scoped to the patient + questionnaire-token tables only: it can `GetItem`/`UpdateItem`/`TransactWriteItems` on those two tables (no `Scan`/`Query`/`DeleteItem`, no access to any other table). DynamoDB IAM cannot scope permissions to a single attribute, so the **application code**, not the IAM policy, limits reads and writes to the explicit intake-merge and pending-follow-up attributes through `ProjectionExpression` and named update expressions.
- **Field mapping**: Initial intake maps responses to exact `formData` keys used by `app.js` and `populateForm()`. Follow-up questionnaires append a `patientSubmitted` checkpoint with `reviewStatus: pending`; they must never overwrite baseline `formData` or alter clinical recommendations before clinician review. Boolean intake fields use `'on'`/`''` to match HTML checkbox behavior.
- **Audit**: CloudTrail logs all DynamoDB data-plane events, CloudWatch logs retained 7 years (2557 days), no PHI in any log
- **HIPAA**: Full compliance checklist in `docs/plans/staged-bubbling-cosmos.md`. All AWS services are HIPAA-eligible with active BAA.
- **WAF**: Rate limiting (100 req/5min/IP) + AWS managed rule groups on intake endpoints
- **Token table**: `osa-intake-tokens-*` with DynamoDB TTL auto-cleanup, KMS encryption, PITR

## Evidence & Citations
The evidence system has three linked documents:
- `docs/evidence-basis.md`: manuscript-oriented clinical-logic register, evidence level, limitations, and validation targets
- `docs/citations.md`: detailed primary-source library and exact "How Used" descriptions
- `docs/evidence-review-log.md`: reproducible literature-review and decision history

### Required clinical-change gate

Maintenance of all three evidence documents is a release requirement, not optional follow-up.
A clinical change is incomplete and must not be deployed until its evidence documentation and
regression coverage are updated in the same commit or pull-request series.

This gate applies to any change that can affect phenotype detection, signal strength, a threshold,
treatment ranking, candidacy, safety behavior, diagnostic routing, clinician guidance, patient
education, or an input used by those decisions. It also applies when new evidence changes the level
of certainty but does not change the visible recommendation.

For every clinical change:
1. Identify or create the Logic ID in `docs/evidence-basis.md`.
2. Verify the primary publication, guideline, or regulatory source; an AI summary is not evidence.
3. Add or update `docs/citations.md`, including exact use and limitations.
4. Classify the logic as guideline aligned, evidence informed, exploratory, local governance, or inactive/future.
5. Reference the evidence in code comments and update `js/config.js` threshold notes.
6. Add a regression scenario and a plausible counterexample.
7. Record the review and conclusion, including no-change reviews, in `docs/evidence-review-log.md`.
8. Require clinician review before deploying any change that can alter diagnosis, treatment ranking, safety messaging, or patient instructions.
9. Update the evidence-register review date and reviewed build after verification.

If a code refactor is asserted to have no clinical effect, evidence documents do not need new
clinical claims, but regression testing must demonstrate output parity. Literature surveillance
that produces no logic change must still be recorded in `docs/evidence-review-log.md`.

## Git
- Remote: `https://github.com/stereooooooo/osa-phenotyper.git`
- Always push after commits to keep GitHub in sync
- Commit messages: conventional commits style with Co-Authored-By

## Common Pitfalls
- `app.js` uses `const` declarations inside the form submit handler — variables declared later in the handler cannot be referenced earlier (temporal dead zone). If adding new computed values, declare them before any code that uses them.
- The patient report overlay uses `position: fixed` — preview screenshot tools may not capture it. Use DOM inspection via `preview_eval` instead.
- `html2canvas` cannot parse modern CSS functions (`color()`, `oklch`). The PDF pipeline strips external stylesheets and uses inline `PDF_STYLES`.
