# OSA Phenotyper — Optimization Changelog

All notable changes from the 2026-06 audit-driven optimization effort (and subsequent feature work) are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Newest first.

See [`optimization-roadmap.md`](optimization-roadmap.md) for the forward-looking plan and the
full findings inventory.

---

## [Post-audit feature: front-desk home screen + MRN fix] — 2026-06-12

Merged to `main`. Work beyond the original 5-phase audit roadmap — a physician-requested front-desk
feature, plus a backend bug surfaced while testing it end-to-end against the staging backend.

### Added — front-desk home screen (merge `ae143d4`)
- A streamlined **home/landing screen** — the app's front door for every user on login — with three
  focused actions: **create a patient + generate the intake link** (then *copy-link-&-done* or
  *open-chart*), a **universal search** (name / MRN, plus a client-side date-of-birth filter), and an
  **"intakes ready to review" card** (submitted/actionable only — `review-needed` + `received`, excludes
  `pending`).
- Architecture: two switchable views in the existing SPA (`#homeView` / `#chartView`) toggled by
  `showView()`; the three shared modals moved out of `<form>` to top-level siblings; the whole `<main>`
  interior wraps in `#chartView`. New isolated module `js/home.js` waits for an `osa:workspace-ready`
  event and orchestrates existing `db.js` + a new `window.OSAWorkspace` contract (`showView`, `openChart`,
  `createWithIntakeLink`, `getReviewQueue`, `reviewModalShow`). `loadPatient()` now returns success;
  `generateIntakeLink()` extracted (correct `?t=` param). The standalone "New Patient" nav entry became
  the home screen; the chart keeps a "New / clear" reset; local/unconfigured mode skips home → chart.
- Process: brainstorm → spec → spec review (caught the DOB-search gap, MRN prerequisite, modal placement) →
  plan → plan review (caught a would-be-invalid DOM wrap and a `?token`/`?t` mismatch) → built task-by-task
  via subagent-driven development (golden master 310 assertions + ESLint per task; final READY-TO-MERGE
  review). Spec: `docs/superpowers/specs/2026-06-12-ma-home-screen-design.md`; plan:
  `docs/superpowers/plans/2026-06-12-ma-home-screen.md`.

### Fixed
- **Empty-MRN save 500** (PR #2, deployed to staging) — `createPatient`/`updatePatient` now omit a blank
  `mrn` (keeping the `mrn-index` GSI sparse) instead of writing `mrn: ''`, which DynamoDB rejects as an
  empty key attribute. The UI treats MRN as optional; this aligns the backend.
- **"Open" did nothing from the home view** (`613ec59`) — regression from the view split: the existing
  patient-list and review-dashboard "Open" handlers loaded the patient into the now-hidden `#chartView`
  without switching to it. `loadPatient()` now calls `showView('chart')` on success — fixes every entry
  point in one place.

### Deployment status
- The **backend** change-set (Lambda/API/CloudFront config + the MRN fix + Phase 4 throttle) is deployed
  to the **staging** stack. The **hosted CloudFront frontend is NOT yet updated** (still the April-3 build,
  `aws-config.js` buildId `2f89f8d`) — all this work runs on `main` / localhost only until a `deploy.sh`
  static-site sync ships it to the hosted URL.

---

## [Clinical-logic refinements — physician review of the baseline] — 2026-06-11

Branch: `phase-1-safety-fixes`. Driven by the ENT physician's review of `docs/phenotype-baseline-review.md`.
These are deliberate **behavior changes** (not refactors), so the golden-master baseline was
re-captured to lock the new intended output, and the review doc was regenerated for sign-off.
Physician decisions: full rec redesign · Zepbound at BMI ≥30 + AHI ≥15 (FDA-label) · keep HB cutoffs.

### Changed — recommendation engine (`js/app.js`)
- **Ranked the clinician plan by clinical suitability** (`REC_PRIORITY`/`recPriority`): leads with
  first-line therapy (CPAP / CBT-I-for-COMISA / strong-airway surgery / positional / weight) and
  sorts every `*-WORKUP` prerequisite caveat **last**, so the plan no longer opens with a wall of
  "before finalizing X, do Y."
- **Gated the data-completeness workups** (`buildInsufficientDataAssessment`): the oxygen / position /
  sleep-stage / endotyping / nasal caveats now only fire at moderate-severe (AHI ≥15), and the
  anatomy caveat only when surgery/Inspire is actually on the table (a surgical rec exists or the
  patient prefers surgery/Inspire). Mild patients get a clean options list. (Example #4, mild
  positional: 9 tags with 5 leading workups → `CPAP, positional, MAD, [check dentition]`.)
- **Demoted MAD for poor candidates**: severe/poor-tier patients no longer get a MAD line in the
  main plan (the tier assessment stays in the Treatment Candidacy card as a fallback); CPAP-retry
  patients keep MAD only as a low-ranked option.
- **Generic surgery requires a real indication**: Friedman II only leads to a surgery rec at
  moderate-severe AHI (Friedman I / anatomical findings / DISE still always qualify) — mild OSA is
  no longer steered toward surgery + DISE.
- **DISE is no longer a blanket prerequisite** (physician follow-up): a non-obese Friedman-I patient
  with 3-4+ tonsils proceeds to tonsillectomy ± expansion pharyngoplasty without a DISE caveat (the
  obstruction site is obvious). The specific tonsillectomy rec is no longer suppressed for those
  patients. DISE stays required for obese patients (multilevel risk) and Friedman II/III / tongue-base
  / HNS planning. (#15 thin Friedman-I now leads with the tonsillectomy rec, no DISE caveat; #16
  obese Friedman-I keeps it.)

### Changed — weight management (`js/app.js`, `docs/citations.md`)
- **Explicit Zepbound/GLP-1 evaluation** named in the clinician rec for obesity (BMI ≥30) with
  moderate-to-severe OSA (AHI ≥15), citing SURMOUNT-OSA (Malhotra, NEJM 2024) / the Dec-2024 FDA
  approval. Mild obese OSA keeps generic weight counseling.

### Removed (toggle) — Delta Heart Rate (`js/config.js`, `js/app.js`, `index.html`)
- The current device can't measure ΔHR, so the whole ΔHR pathway is disabled behind a single
  `OSA_CONFIG.features.deltaHeartRate` flag (default `false`): parsing returns `null` (disabling the
  phenotype, rec, confidence, follow-up, and HB-synergy), the CVD-missing-ΔHR caveat is gated off,
  and the form fields are hidden via a `data-feature` toggle. All detection/threshold code is
  retained — flip the flag to re-enable.

### Verification
- 310 assertions pass; ESLint clean. Intended effects spot-checked per profile (mild → clean plan;
  obese moderate-severe → Zepbound; very severe → no MAD; prefInspire → anatomy/HNS workup retained;
  ΔHR profile → no phenotype). Sanity: every OSA patient still gets CPAP; workups always sort last.
  A workflow-smoke regression (anatomy workup over-gated for a prefInspire patient) was caught and
  fixed before re-baselining.

---

## [Phase 5 (part 2, increment 4) — extract buildClinicianReport(); teardown COMPLETE] — 2026-06-11

Branch: `phase-1-safety-fixes`. Final increment of the god-function teardown — the clinician renderer,
the largest remaining block.

### Changed — extract buildClinicianReport(f, m, T)
- Moved the ~545-line clinician-report renderer (symptom subtype → care pathway → key-number grid →
  HST/insufficient-data/safety alerts → phenotype table → ranked treatment plan → guardrails →
  collapsible Clinical Analysis / Treatment Candidacy / Follow-up sections → the full `cHTML` string)
  out of the submit handler into a top-level function. It reads the milestones/studyType/patientName
  DOM controls directly (as before) and **returns** `{cHTML, subtype, guardedRecTexts,
  guardedRecEntries, insufficientDataDomains, treatmentSafetyChecks}` — the only region-computed values
  the handler still needs. `lastAnalysisData` consumes them by the same names, so that block was left
  byte-for-byte unchanged.
- **The submit handler is now a ~317-line orchestrator** (was ~1,287): gather inputs → `detectPhenotypes`
  → `mapTreatments` → compute assessments → `buildClinicianReport` → store `lastAnalysisData` → render.

### Method — locking the contract without guesswork
- The 61 inputs were derived by a **string/comment/template-aware free-variable scan** of the region
  (so HTML/English text inside template literals is ignored but `${…}` expressions are kept), and the
  6-value return set by an **after-cut usage scan** (every region-declared name referenced past the cut).
  Both are path-independent, so input/return completeness holds even on code paths the 37 profiles don't
  exercise — not just the exercised ones.

### Verification
- 310 assertions pass; ESLint clean; `node --check` valid.
- **Byte-for-byte proof:** every profile's `{phen, why, tags, recs, clinicianHtml}` is **identical across
  all 37 profiles** before/after. The 545-line body was moved as an untouched string slice (provably
  verbatim); a byte-identical result also confirms the 61-input list is complete (any missing input would
  throw a ReferenceError and fail every profile).

### Follow-up — removed pre-existing dead code (separate chore commit)
- The 3-lens adversarial review flagged dead code the verbatim move had carried into
  `buildClinicianReport`: `groupInfo` and the referral-note cluster (`coreNums`/`phenStr`/`nasalStr` →
  `noteDentist`/`noteENT`/`noteCards`, plus the `supRatio` they fed). All were declared but only fed each
  other — never reaching `cHTML` or the return (dead in the original handler too). Removed (27 lines).
  Behavior-neutral (pure const declarations); verified **byte-identical** across all 37 profiles + 310
  assertions, which independently proves the code was unreachable.

### Result — Phase 5 part 2 (god-function teardown) is complete
The 1,287-line `app.js` form-submit handler is now four focused top-level functions
(`detectPhenotypes`, `buildHstFlags`, `mapTreatments`, `buildClinicianReport`) plus a thin orchestrator,
every increment verified byte-identical against the live-engine golden master.

---

## [Phase 5 (part 2, increment 3) — extract mapTreatments()] — 2026-06-11

Branch: `phase-1-safety-fixes`. The riskiest seam of the teardown — the recommendation engine, which
previously mutated **module-scoped** dedup state (`recSeen`/`recTagMap`) shared with the rest of the
handler.

### Changed — extract mapTreatments(f, m, T)
- Moved the ~325-line recommendation-mapping block (the `pushRec` loop, phenotype-driven treatment
  `switch`, Friedman/HNS staging, soft-tissue + Inspire surgical staging, MAD candidacy scoring, the
  stage-aware core trio, and COMISA) out of the submit handler into a top-level **pure** function.
- **Killed the module-scoped dedup state.** `mapTreatments` now owns a **local** `seen` Set /
  `recTags` array / `pushRec` (identical key logic: `tag || text.trim().toLowerCase().slice(0,60)`)
  and **returns** `{recs, recTags, friedmanStage, hnsStage, madScore, hasConcentricCollapse,
  hasCOMISA, sleepyCOMISA}`. The module `recSeen`/`recTagMap`/`pushRec` declarations and the handler's
  per-submit `recSeen.clear()`/`recTagMap.length = 0` reset were deleted; the 4 downstream consumers
  (the WEIGHT follow-up check, `buildInsufficientDataAssessment`, `buildTreatmentSafetyAssessment`,
  `applyInsufficientDataGuardrails`) were repointed to the returned `recTags`.

### Verification
- 310 assertions pass; ESLint clean (`no-use-before-define`/TDZ); `node --check` valid.
- **Byte-for-byte proof:** captured every profile's `{phen, why, tags, recs, clinicianHtml}` before
  and after — `diff` is **identical across all 37 profiles**, including the full rendered clinician
  report (which embeds every recommendation text, in ranked order). The 326-line body was moved as an
  untouched string slice, so the move is provably verbatim; only the dedup-localization wrapper changed.

---

## [Phase 5 (part 2, increment 2) — net coverage + extract buildHstFlags()] — 2026-06-11

Branch: `phase-1-safety-fixes`. Per the chosen path ("net-strengthen, then continue").

### Tests — strengthened the net for renderer/treatment extractions
- The golden master asserted phenotypes + recommendation *tags* but not the rendered HTML. Added
  the clinician report HTML to the capture so the before/after snapshot now diffs `{phen, why,
  tags, clinicianHtml}` per profile — covering recommendation *text*, surgical-staging display, HST
  flags, and the full clinician renderer. 34/37 profiles carry HTML (3 pre-study correctly skip it).

### Changed — extract buildHstFlags()
- Moved the 7-check home-sleep-test validity-flag logic (~55 lines) out of the submit handler into
  a pure `buildHstFlags(metrics, T)`; the handler builds an explicit metrics object and renders the
  returned flags.

### Verification
- 310 assertions pass; ESLint clean. Before/after snapshot **byte-identical across all 37 profiles**
  including the clinician HTML (the HST flags render into it).

---

## [Phase 5 (part 2, increment 1) — Extract detectPhenotypes()] — 2026-06-11

Branch: `phase-1-safety-fixes`. First increment of the deferred god-function teardown — the
lowest-risk seam (pure phenotype logic), done now that the golden master can verify it.

### Changed
- **Extracted `detectPhenotypes(metrics, T)`** as a top-level pure function (no DOM, no shared
  state) out of the 1,287-line form-submit handler. The 9-phenotype detection block (~93 lines) is
  replaced by a 13-line call that passes an explicit metrics object and assigns `out.phen`/`out.why`
  from the result; the now-dead `add` helper was removed from the handler.

### Tests
- **Strengthened the golden master first** (prerequisite): the 36 profiles exercised 8 of 9
  phenotypes — added profile 37 (Poor Muscle Responsiveness: AHI 40, REM/NREM > 2, NREM ≥ 15, the
  one path with no coverage). Suite 310 assertions. Added `why` to the capture dump.

### Verification
- 310 assertions pass; ESLint clean; app.js syntax valid.
- **Byte-for-byte proof:** captured every profile's `{phen, why, tags}` before and after the
  extraction — `diff` is **identical across all 37 profiles**, including the reason strings (e.g.
  the `cvd`-only-in-the-loop-gain-reason case). The extraction changes structure, not behavior.

---

## [Phase 5 (part 1) — Structural hardening: tests, config, dedup, lint] — 2026-06-11

Branch: `phase-1-safety-fixes`. Behavior-preserving refactors of the clinical engine, each
verified against a new golden-master safety net. Physician chose: build the safety net + the
low-risk wins now and **defer the full 1,287-line god-function teardown** to a dedicated,
golden-master-verified follow-up. (Infra-polish call deferred to me: ESLint in, machine-readable
CI + gitignore reorg deferred.)

### Added — golden-master safety net (`tests/phenotype-matrix.html`)
- **Live-engine characterization suite.** Drives the real `index.html` engine in workflow-test
  mode (iframe → fill form → submit → read `OSAReportState.getLastAnalysisData()`) across the 36
  phenotyping profiles from `docs/test-matrix.md` (Groups 1–8: severity spectrum, CPAP variants,
  COMISA, anatomy/surgery, phenotype edge cases, Inspire, boundaries, clinical-logic regressions).
  It locks the **current** phenotype list + ordered recommendation-tag output for each profile, with
  a per-profile **freshness guard** (asserts `lastAnalysisData.patientName` matches the profile, so a
  future silent validation break reads stale data and fails loudly instead of passing on a
  coincidental empty-phenotype match). 108 assertions. Wired into `tests/run-headless-suite.sh` as a
  third suite. Suite total: 199 → **307**.

### Changed — de-replicated the engine from its tests (`js/phenotype-confidence.js` new)
- **`confidenceFor()` is now a single source of truth.** The ~90-line phenotype confidence
  heuristic was an exact copy in both `js/app.js` and `tests/tests.html` (a real drift hazard —
  the audit's #1 code-quality finding). Extracted to a new shared module loaded before both;
  `app.js` and `tests.html` now alias the real function, so a logic change is *exercised by the
  tests* instead of silently passing. Removed the replica + its dead `ratio` copy from `tests.html`.

### Changed — centralized hardcoded thresholds into `js/config.js`
- Added `thresholds.madCandidacy` (13 MAD scoring factors/cutoffs) and `thresholds.hstValidity`
  (10 home-sleep-test validity-flag thresholds); rewired the `app.js` MAD-scoring IIFE and HST
  flag logic to read them. All 23 references verified to resolve to keys with values identical to
  the original literals (MAD tags are covered by the golden master; the HST flags aren't, so this
  was cross-checked programmatically).
- **`patientReport.js ahiSeverityLabel()` now reads `OSA_CONFIG.thresholds.severity`** instead of
  hardcoding 5/15/30, so the patient layer can no longer drift from the clinician engine.

### Changed — deduplicated the CPAP issue-label map (`js/app.js`)
- Hoisted one `CPAP_ISSUE_LABELS` constant; replaced the 3 inline copies and resolved the wording
  drift (`'inefficacy'` → `'prior inefficacy'`, matching the other two copies).

### Added — focused ESLint (`eslint.config.mjs`, `package.json`, CI)
- Minimal flat config scoped to `js/`: `no-use-before-define` (the temporal-dead-zone guard the
  audit called for) + zero-false-positive correctness rules. `npm run lint` script + a CI lint step
  (Node setup) ahead of the browser suite. On first run it **caught a real latent bug** — a
  duplicate `studyType` key in the `lastAnalysisData` object (`app.js`); removed the dead first key
  (kept the runtime winner → no behavior change). Lint is green.

### Deferred to Phase 5 (part 2)
- The **god-function teardown** (`detectPhenotypes()` / `mapTreatments()` / renderer extraction
  from the 1,287-line submit handler). The golden master now de-risks this; it should be done as a
  series of small, golden-master-verified increments. Also deferred: machine-readable CI output,
  the `gitignore → private/` reorg, and migrating `n`/`ratio`/`exists` to a shared util.

### Verification
- Both prior suites + the new matrix pass (**307 assertions**); ESLint clean. Live app boots with
  no console errors; shared `OSAPhenotype`, `madCandidacy`, `hstValidity` all present.
- Every refactor confirmed behavior-preserving: the golden master's phenotype/recommendation
  output is byte-identical before and after, and the `confidenceFor` unit tests (now against the
  real shared function) pass.
- **Adversarial review** (16 agents, 5 fidelity dimensions): the `confidenceFor` extraction and
  threshold centralization were confirmed byte-identical (zero findings); the review surfaced one
  real robustness gap — the matrix could read stale data on a silent validation failure — fixed
  with the freshness guard above and **proven** with a negative test (blanking a required field on
  one profile makes that profile fail loudly, 3 failures, rest green).

---

## [Phase 4 — Polish: performance, accessibility, security hardening] — 2026-06-11

Branch: `phase-1-safety-fixes`. Physician chose: lower the clinician-PDF raster scale (defer the
full per-page refactor), code the infra-security changes now + correct the IAM docs (deploy later),
add both a CSP **and** SRI to `index.html`, and include both optional items (shorten portal token,
add the clinician fast-path hint).

### Performance (`index.html`, `js/pdf-export.js`, `js/pdf-parser.js`, `js/questionnaire-parser.js`)
- **Lazy-load the ~880 KB of PDF-only libraries.** pdf.js, jsPDF, and html2canvas no longer load
  on every page open. A ~30-line `window.OSALibs` loader injects pdf.js on the first PDF drop
  (`parse()` in both parsers) and jsPDF + html2canvas on the first export (`exportFromHTML`).
  Both call sites already guarded on `typeof … === 'undefined'`, so the change is additive. Verified
  in the preview: on load `pdfjsLib`/`jspdf`/`html2canvas` are all `undefined`; parsing a real
  WatchPAT PDF lazy-loads pdf.js and extracts 18 fields; export lazy-loads the other two.
- **Paginator no longer thrashes layout.** `paginatePatientReport` previously appended each unit and
  read `getBoundingClientRect()` in the same loop (one forced reflow per unit). Now it does one write
  pass (stack all units), one batched read pass (cache every top/bottom), then assigns pages from the
  cached numbers — preserving the same greedy fit and the single-oversized-unit guard. Verified
  equivalent multi-page splitting via the live export pipeline (18×300px → 6 pages; small → 1 page;
  one 4000px unit → 1 page).
- **Clinician PDF raster scale 2 → 1.5** (`canvasScale`), ~44% less raster memory on the
  full-report canvas with no layout/pagination change. (Full per-page refactor deferred to Phase 5.)
- **Added `preconnect` hints** for `fonts.googleapis.com`, `fonts.gstatic.com`, and `cdn.jsdelivr.net`
  (parity with `portal.html`).

### Accessibility (`index.html`, `js/app.js`, `css/styles.css`, `intake.html`)
- **All 9 collapsible section headers are now keyboard-accessible `<button>`s.** The 6 static
  card headers (`index.html`) and 3 dynamic clinician-analysis headers (`js/app.js`) changed from
  clickable `<div>` to `<button type="button">` with `aria-controls`; Bootstrap collapse and
  `aria-expanded` work unchanged. New CSS strips the UA button chrome (border, appearance) while
  preserving the exact card-header / clin-section look — verified computed-style-identical to the
  unconverted headers (white bg, navy 700-weight text, 0.95rem, crimson `::after` accent, 1px
  divider) plus a `:focus-visible` ring.
- **Honest sleep-study field markers.** Dropped the misleading "required" asterisk from pAHI / ODI /
  Min SpO₂ (never enforced, and enforcing would break the pre-study pathway) and added an
  "enter what's available from the study" hint. Range validation on those fields is unchanged.
- **Intake validation now announced to screen readers.** The summary gained `role="alert"` +
  `aria-live="assertive"` + `tabindex="-1"`; on failure it shows a dynamic count, receives focus,
  and each errored field/radiogroup gets `aria-invalid="true"` + `aria-describedby` to its message
  (cleared on the next attempt). Verified: empty submit → 27 fields flagged, focus on the summary.
- **ESS/ISI/NOSE radios** now expose meaningful `aria-label`s ("0 — Would never doze", per-question
  ISI scales) and each radiogroup carries the full question text instead of "ESS question N".
- **Intake progress bar** gained `role="progressbar"` + `aria-valuemin/max/now` + `aria-valuetext`,
  kept in sync by `updateProgress()`.
- **Clinician fast-path hint** added at the top of the 116-field form: the minimum fields (Age, Sex,
  BMI, one sleep-study metric) needed for a result.

### Security hardening (`index.html`, `js/patientReport.js`, `infrastructure/*`, `CLAUDE.md`, HIPAA change-log)
- **CSP on `index.html`** (parity with `portal.html`/`intake.html`), scoped to the CDNs, Cognito,
  and the API origin, with `worker-src` + `connect-src` allowances for the pdf.js worker. Verified
  non-breaking: page boots, Bootstrap/Cognito/fonts load, PDF parse + export run, zero violations.
- **SRI on all CDN tags.** SHA-384 `integrity` + `crossorigin` on the 2 CSS links, the 2 static
  scripts, and the 3 lazy-loaded PDF libs (hashes computed from the pinned files; Bootstrap's match
  the official published values). Together with the CSP these shrink the blast radius of the
  Cognito-tokens-in-localStorage XSS risk.
- **`esc()` now escapes single quotes** (`'` → `&#39;`) — latent-only today, but removes the gap.
- **Infra (committed, not deployed — needs a `deploy.sh` run):** always-on API-Gateway stage throttle
  backstop (`ThrottlingRateLimit: 200`/`Burst: 400`); extended all 3 CloudFront WAF rule scopes to
  cover the public `/patient-portal/` route (WAF JSON re-validated, 3 rules × 4 paths); portal-token
  lifetime 180 → 90 days. See the HIPAA change-log for rationale and deploy notes.
- **IAM doc correction.** `CLAUDE.md` overstated the intake Lambda's IAM as "only UpdateItem on
  formData." Corrected to reality (`GetItem`/`UpdateItem`/`TransactWriteItems` on the patient +
  token tables; attribute scoping is enforced in application code, not IAM, since DynamoDB IAM
  can't scope to an attribute). Tightening the policy was considered and rejected as impractical.

### Verification
- Both headless suites pass (199 assertions); no console errors on `index.html` or `intake.html`.
- Live preview drove: lazy-load state on page open, real WatchPAT PDF parse under the new CSP,
  PDF export lazy-load, paginator page-count equivalence, header button toggle + computed-style
  parity + focus ring, asterisk removal, both hints, intake radio/progressbar/validation a11y.
- `deploy.sh` shell syntax + generated WAF JSON validated; `template.yaml` throttle added to the
  always-on stage default route settings.

---

## [Phase 3 — Simplify the patient report] — 2026-06-11

Branch: `phase-1-safety-fixes` · Concern #1 (too information-dense / hard to understand).
Physician chose: plain-language phenotype headings, "lead + lean" (summary card + trim, keep all
sections, PDF-friendly with no collapsing), and suppress clinician uncertainty callouts.
All changes in `js/patientReport.js`.

### Added
- **Bottom-line summary card** at the very top of every report (`renderSummaryCard`): one plain
  sentence stating the finding, one on what it means, and a highlighted "Your most important next
  step." The next step derives from the report's real recommendation priority (`summaryNextStep` →
  `getPatientFacingRecEntries`), is CPAP-state-aware, and handles pre-study / normal / symptomatic-
  home-test cases (the last integrates the Phase 1 false-reassurance caveat).

### Changed
- **Phenotype headings → plain language.** Section C now shows "Worse when you sleep on your back",
  "You wake easily when breathing gets hard", etc. via a `patientLabelMap`; the raw clinical name
  ("Positional OSA", "Low Arousal Threshold") stays in the clinician view only.
- **"Why This Matters" rewritten** from a single grade-18, 5-metric run-on into two short
  plain-language paragraphs that lead with the takeaway and drop the raw numbers (AHI/ODI/%min/hr).
- **What-if scenarios trimmed** to ≤2 sentences / ≤1 number each; dropped the re-stated projected
  AHI ("bring your AHI down to around N") and the back-vs-side event-count dump.
- **Phenotype descriptions trimmed** from ~75–85 words to ~45–55 words each (clinical meaning
  preserved; the plain heading now carries the "what").

### Removed (from the patient view)
- The clinician-oriented **"What may still be refined"** (`renderDataLimitations`) and **"Contributing
  factors still being clarified"** (unresolved-phenotype) callouts — actionless for patients; the
  clinician report still surfaces data-completeness gaps.

### Tests (`tests/tests.html`)
- Updated 5 patient-report regression assertions to the new behavior (callouts suppressed, new HB
  wording, new zero-phenotype summary). These are real `patientReport.js` tests (not replicated).

### Verification
- Rendered the live report for moderate / severe / pre-study / normal-symptomatic / 5-phenotype
  patients: summary card sits right after the header, all phenotype headings plain (no raw clinical
  names leak), clinician callouts gone, Why-This-Matters number-free, what-if projections dropped.
- Densest case (5 phenotypes) dropped from a ~1,887-word baseline to ~1,317 (~30%), and the
  bottom-line-first structure is the larger UX win. Both suites pass (199); no console errors.
- Known minor: returning patients see the finding ~3× in the first screen (summary card +
  "Where You Are" + Section B) — reinforcing, deferred.

---

## [Phase 2 — Right-size cutting-edge clinical claims] — 2026-06-11

Branch: `phase-1-safety-fixes` · Concern #2 (logic too "cutting edge"). Calibration, not removal —
features kept, confidence right-sized to match the evidence. Physician chose the conservative
option on each of the three judgment-call forks.

### Changed — clinical logic (`js/app.js`, `js/config.js`)
- **Hypoxic burden decoupled from the moderate tier.** A single moderate-range metric (HB ≥30,
  ODI ≥20, T90 ≥5%) now flags the phenotype as *supportive context only* — it no longer emits the
  "start therapy promptly for cardiovascular risk" rec, the treatment guardrail, or the patient
  "heart health" urgency line. Those are gated on a new `hbHighTier` (HB ≥73 / severe-range
  metrics), where CPAP CV-benefit evidence exists. Clinician CV alerts gained a "thresholds are
  population-derived, not guideline-endorsed" caveat. The low-HB note no longer implies CPAP harm.
- **Loop gain → qualitative flag.** Removed the numeric estimate built on a fabricated 0.50
  intercept (Schmickl 2022 has no published intercept; AUC 0.73). Now a "possible/suspected
  ventilatory instability" flag driven only by central/periodic-breathing signals (CSR, pAHIc, CAI),
  capped at Moderate confidence. A patient with no central signals no longer gets the phenotype.
- **Edwards arousal threshold:** partial 2-of-3 path (WatchPAT, no hypopnea fraction) downgraded
  from Moderate to **Low** confidence; the 84% accuracy is documented as applying to the full score.
- **Poor muscle responsiveness:** capped at Moderate (inferred surrogate, no High path).
- **Ji HNS (Inspire) staging:** exact response percentages (91%→38%) replaced with qualitative
  candidacy tiers ("more/less favorable") + a single-center, n=119, C=0.68, needs-validation caveat.
- **Patient report Section G:** softened the categorical "high hypoxic burden of N %min/hr" to plain
  descriptive language (drops the research unit).

### Changed — tests (`tests/tests.html`)
- Updated the replicated `confidenceFor` copy and its assertions (arousal, loop gain, muscle
  responsiveness) to match the new logic, so the suite reflects reality until Phase 5 removes the
  replication. (Net +1 assertion.)

### Evidence
- `docs/citations.md` — added a "Phase 2 confidence-calibration changes" section documenting the
  rationale for each change against the cited evidence.

### Verification
- Real-engine `confidenceFor` checked directly: loop gain capped at Moderate (former high-estimate
  patient with no central signals now → Low), arousal partial → Low, muscle → Moderate.
- Drove the live form through 5 scenarios: moderate-HB (context only, no urgency) vs high-HB
  (urgency + caveat), loop gain with/without central signals, and Ji qualitative tier — all correct.
- Both headless suites pass (199 assertions); no console/runtime errors.

---

## [Phase 1 — Patient safety & trust] — 2026-06-11

Branch: `phase-1-safety-fixes` · Commits: `5c96727` (pre-existing feature work), `606d123` (safety fixes)

### Fixed
- **False-reassurance on a normal home sleep test (CRITICAL).** A symptomatic patient
  (ESS ≥ 10 or ISI ≥ 10) with a normal WatchPAT/home study no longer receives an
  unconditional "this is reassuring news" message. Patient-report Sections B and B2 now
  show a "worth a closer look" caveat recommending discussion of an in-lab PSG, mirroring
  the existing clinician-side HST validity flag (`app.js` "Low AHI with significant
  symptoms"). Scoped to home tests only — asymptomatic patients and in-lab (PSG) studies
  keep appropriate reassurance. Reuses `OSAReportShared.detectUARS` so the symptom
  thresholds cannot drift. (`js/patientReport.js`)

### Added
- **Patient-facing disclaimer** on every patient report, PDF export, and portal view:
  "not a final diagnosis… review with your doctor… call 911 in an emergency." Inline-styled
  in `renderFooter` so it survives the PDF pipeline's stylesheet stripping. (`js/patientReport.js`)

### Security
- **Patient portal hardening.** Added `Content-Security-Policy`, `referrer: no-referrer`,
  and `robots: noindex, nofollow` meta tags to `portal.html` (matching `intake.html`), plus
  a `deploy.sh` step that templates the portal CSP `connect-src` per environment.
  (`portal.html`, `infrastructure/deploy.sh`)

### Repo hygiene
- Committed ~1,000 lines of pre-existing, uncommitted patient-portal/intake feature work that
  was at risk in the working tree (commit `5c96727`).

### Verification
- All four report scenarios (symptomatic-home, asymptomatic-home, symptomatic-in-lab,
  severe-OSA) confirmed correct via the live `generateReportHTML`.
- Portal CSP verified non-breaking (Google Fonts + Bootstrap load, no CSP violations).
- Both headless suites pass (198 assertions); no regressions.

---

## How to use this file
- One section per phase (or per shipped batch).
- Record file-level scope, the commit/branch, and the verification evidence.
- Move items from the roadmap to here as they ship; keep severities for traceability.
