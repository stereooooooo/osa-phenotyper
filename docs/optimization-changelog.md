# OSA Phenotyper — Optimization Changelog

All notable changes from the 2026-06 audit-driven optimization effort are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Newest first.

See [`optimization-roadmap.md`](optimization-roadmap.md) for the forward-looking plan and the
full findings inventory.

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
