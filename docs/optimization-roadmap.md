# OSA Phenotyper — Optimization Roadmap

**Origin:** Full multi-agent audit, 2026-06-11 (7 dimensions, adversarial verification).
**Companion:** [`optimization-changelog.md`](optimization-changelog.md) records what has shipped.

This is a living document. Work the phases **in order**; check items off and move them to the
changelog as they ship. Every item carries its severity, location, and recommended fix.

---

## Overall verdict

Solid platform (graded **B−**). Security architecture and the clinical engine's input-handling
are genuinely strong. Problems cluster where the physician expected: the **patient-facing output**
(too dense) and the **confidence-calibration of cutting-edge logic** (presented as settled).

**40 findings:** 1 critical · 11 high · 16 medium · 12 low.

| Dimension | Grade | Crit | High | Med | Low |
|-----------|:-----:|:----:|:----:|:---:|:---:|
| Patient comprehension (concern #1) | C | – | 3 | 2 | 1 |
| Clinical evidence & currency (concern #2) | C+ | – | 2 | 3 | 1 |
| Clinical safety | C− | 1 | 1 | 2 | 1 |
| Clinician UX & accessibility | B− | – | 1 | 2 | 3 |
| Performance & speed | B | – | 1 | 2 | 2 |
| Code quality & testing | B− | – | 3 | 2 | 2 |
| Security & HIPAA | B+ | – | – | 3 | 2 |

---

## Phase status

| Phase | Theme | Status |
|------|-------|--------|
| 1 | Patient safety & trust | ✅ Done (`phase-1-safety-fixes`) |
| 2 | Right-size cutting-edge clinical claims (concern #2) | ✅ Done (`phase-1-safety-fixes`) |
| 3 | Simplify the patient report (concern #1) | ✅ Done (`phase-1-safety-fixes`) |
| 4 | Polish — performance, accessibility, security hardening | ✅ Done (`phase-1-safety-fixes`) |
| 5 | Structural hardening — code, tests, config | ✅ Part 1 + Part 2 (god-function teardown) done (`phase-1-safety-fixes`) |

---

## Phase 1 — Patient safety & trust ✅ DONE

Shipped 2026-06-11 on branch `phase-1-safety-fixes`. See changelog for detail.

- [x] **Normal-HST false reassurance** (CRITICAL) — `js/patientReport.js` Sections B/B2
- [x] **No patient disclaimer** (high) — `js/patientReport.js` `renderFooter`
- [x] **Portal CSP/referrer/robots headers** (medium) — `portal.html`, `infrastructure/deploy.sh`
- [x] **Uncommitted working tree** (medium) — committed as `5c96727`

---

## Phase 2 — Right-size cutting-edge clinical claims (concern #2) ✅ DONE

Shipped 2026-06-11 on branch `phase-1-safety-fixes`. Calibration, not removal — features kept,
confidence right-sized. Physician chose the conservative option on each fork (decouple HB urgency
from the moderate tier; drop the loop-gain number for a qualitative flag; qualitative Ji tiers).
See changelog and `docs/citations.md` "Phase 2 confidence-calibration changes" for detail.

- [x] **Hypoxic burden urgency decoupled from the moderate tier** (high) — `js/app.js`, `js/config.js`.
  Single moderate metric → supportive context only; urgency/CV framing + patient heart-urgency line
  gated on new `hbHighTier` (≥73 / severe-range). Population-derived caveat added; low-HB harm
  implication removed.
- [x] **Loop-gain numeric estimate removed → qualitative flag** (high) — `js/app.js`, `js/config.js`.
  No more fabricated 0.50 intercept; flag now driven by central/periodic-breathing signals only,
  capped at Moderate.
- [x] **Edwards 2-of-3 partial → Low confidence** (medium) — `js/app.js`.
- [x] **Poor muscle responsiveness capped at Moderate** (medium) — `js/app.js`.
- [x] **Ji HNS staging → qualitative tiers + validation caveat** (medium) — `js/app.js`.
- [x] **Patient Section G HB wording softened** (low) — `js/patientReport.js`.

---

## Phase 3 — Simplify the patient report (concern #1) ✅ DONE

Shipped 2026-06-11 on branch `phase-1-safety-fixes`. Physician chose plain-language headings,
"lead + lean" (summary card + trim, all sections kept, PDF-friendly), and suppress clinician
uncertainty callouts. All in `js/patientReport.js`. See changelog for detail.

- [x] **Bottom-line summary card** added at the top for every patient (`renderSummaryCard` /
  `summaryNextStep`) — finding + one CPAP-state-aware next step.
- [x] **Phenotype headings → plain language** via `patientLabelMap`; clinical names clinician-only.
- [x] **"Why This Matters" rewritten** to two short paragraphs, no metric dump.
- [x] **Clinician uncertainty callouts suppressed** from the patient view (`renderDataLimitations`
  and the unresolved-phenotype callout).
- [x] **What-if trimmed** (≤2 sentences / ≤1 number; dropped projected-AHI) and **phenotype
  descriptions trimmed** (~75 → ~50 words).
- [~] Cumulative callout-box overload — partially addressed (summary card as the single strong
  anchor + 2 callouts suppressed). Minor residual: returning patients see the finding ~3× in the
  first screen (summary card + "Where You Are" + Section B). Deferred polish.

---

## Phase 4 — Polish: performance, accessibility, security hardening ✅ DONE

Shipped 2026-06-11 on branch `phase-1-safety-fixes`. Physician forks: clinician-PDF scale-down
(defer the full per-page refactor), code the infra changes + correct the IAM docs (deploy later),
CSP **and** SRI on `index.html`, and both optional items. See the changelog for detail and verification.

> **Infra items are committed but not yet deployed** — they take effect on the next
> `infrastructure/deploy.sh` run. Review the throttle thresholds against real clinic load first.

### 4a · Performance
- [x] **880 KB of PDF-only libs load render-blocking on every page open** (high) — lazy-loaded via
  `window.OSALibs` (pdf.js on first PDF drop; jsPDF + html2canvas on first export). `index.html`,
  `js/pdf-parser.js`, `js/questionnaire-parser.js`, `js/pdf-export.js`.
- [x] **Paginator interleaves DOM writes and rect reads in a loop** (medium) — `js/pdf-export.js`.
  Now one write pass + one batched read pass + arithmetic page assignment (same greedy fit).
- [x] **Clinician PDF rasterizes the whole report as one tall canvas** (medium) — `canvasScale` 2 → 1.5
  (~44% less raster memory). Full per-page refactor deferred to Phase 5 (physician choice).
- [x] **No preconnect/dns-prefetch hints on index.html** (low) — added (fonts + jsdelivr).
- [x] **CDN libs not self-hosted / no SRI** (low) — SHA-384 `integrity`+`crossorigin` on all CDN tags
  (2 CSS, 2 static JS, 3 lazy-loaded PDF libs). Self-hosting not pursued (no-build constraint).

### 4b · Accessibility & clinician UX
- [x] **All 9 collapsible headers are non-keyboard-accessible `<div>`s** (high) — converted to
  `<button type="button">` + `aria-controls` (6 static in `index.html`, 3 dynamic in `js/app.js`);
  CSS strips UA button chrome while preserving the exact look + a focus ring (`css/styles.css`).
- [x] **pAHI/ODI/nadir show a "required" asterisk but aren't enforced** (medium) — asterisk dropped
  + honest hint added; range validation unchanged (`index.html`).
- [x] **Intake validation errors not announced to screen readers** (medium) — `role="alert"` +
  `aria-live`, dynamic count, focus to summary, `aria-invalid`+`aria-describedby` per field (`intake.html`).
- [x] **ESS/ISI/NOSE radios are bare numbers to screen readers** (low) — per-radio `aria-label`
  (value + meaning) + real question text on each radiogroup (`intake.html`).
- [x] **Clinician form ~116 controls, all expanded, no "fast path" hint** (low) — minimum-fields hint
  added at the top of the form (`index.html`).
- [x] **Intake progress bar lacks progressbar semantics** (low) — `role="progressbar"` +
  `aria-valuemin/max/now/valuetext`, synced in `updateProgress()` (`intake.html`).

### 4c · Security hardening (audit downgraded the portal Referer claim; these remain)
- [x] **Rate limiting depends on an optional WAF; no API-Gateway throttle; portal endpoint uncovered**
  (medium) — always-on stage throttle backstop added (`template.yaml`); all 3 CloudFront WAF rules
  extended to `/patient-portal/` (`deploy.sh`). **Committed, not deployed.**
- [x] **Intake Lambda IAM is broader than documented** (medium) — docs corrected (`CLAUDE.md`, HIPAA
  change-log). Tightening rejected: DynamoDB IAM can't scope to an attribute; app code enforces it.
- [x] **`esc()` doesn't escape single quotes** (low) — added `.replace(/'/g, '&#39;')` (`js/patientReport.js`).
- [x] **Cognito tokens in localStorage** (low) — mitigated with a scoped CSP + SRI on `index.html`
  (accepted as a no-build-SPA tradeoff).
- [x] **Portal token is long-lived (180 d) and reusable in the URL** (low, residual) — shortened to
  90 days (`infrastructure/lambda/index.mjs`). **Committed, not deployed.**

---

## Phase 5 — Structural hardening: code, tests, config ✅

Part 1 shipped 2026-06-11 on branch `phase-1-safety-fixes`. Physician chose: build the golden-master
safety net + the low-risk wins now, **defer the full god-function teardown** to a verified part 2.
See the changelog for detail.

- [x] **Unit tests replicate `app.js` logic instead of importing it** (high) — fixed two ways:
  (a) `confidenceFor()` extracted to `js/phenotype-confidence.js`, imported by both `app.js` and
  `tests/tests.html` (replica + its dead `ratio` removed); (b) new `tests/phenotype-matrix.html`
  golden-master suite drives the **real** engine across 37 phenotyping profiles (all 9 phenotypes
  covered) and locks current phenotype/recommendation + clinician-HTML output (199 → 310 assertions).
- [x] **~1,287-line form-submit god function** (high) — `js/app.js` form-submit handler. **Part 2
  COMPLETE.** Torn down into four top-level functions, each proven byte-identical via the golden master's
  before/after `{phen,why,tags,recs,clinicianHtml}` diff across all 37 profiles + 310 assertions:
  `detectPhenotypes(m,T)` (incr 1), `buildHstFlags(m,T)` (incr 2), `mapTreatments(f,m,T)` (incr 3 — the
  ~325-line recommendation mapping; killed the module-scoped `recSeen`/`recTagMap` dedup → local, returns
  `{recs, recTags, …staging/scoring}`), and `buildClinicianReport(f,m,T)` (incr 4 — the ~545-line clinician
  renderer; builds the whole `cHTML`, returns `{cHTML, subtype, guardedRecTexts, guardedRecEntries,
  insufficientDataDomains, treatmentSafetyChecks}`). The net was extended to cover the clinician HTML first.
  The submit handler is now a ~317-line orchestrator (gather inputs → detect → map → render → store →
  display). Inputs/return sets were locked by static analysis (string-aware free-var + after-cut usage),
  so completeness holds for unexercised paths too, not just the 37 profiles.
- [x] **Core thresholds hardcoded outside config.js** (high) — added `thresholds.madCandidacy` +
  `thresholds.hstValidity` to `config.js` and rewired the MAD-scoring + HST-flag logic to read
  them; `patientReport.js ahiSeverityLabel()` now reads `OSA_CONFIG.thresholds.severity`.
- [x] **CPAP-issue label map duplicated 3× with a drift** (medium) — hoisted one
  `CPAP_ISSUE_LABELS` constant; drift resolved to "prior inefficacy".
- [ ] **Blanket `*.pdf` gitignore is fragile** (low) — **deferred** (already double-ignored via
  `Test Data/` + `*.pdf`; near-zero marginal safety).
- [~] **CI passes by grepping a rendered string; no linter** (low) — **ESLint added**
  (`eslint.config.mjs`, focused on `no-use-before-define`/TDZ + correctness rules; `npm run lint` +
  CI step; caught a real duplicate-key bug on first run). Machine-readable test output **deferred**.

---

## Strengths to preserve (do not "fix")

Warm patient tone and CPAP-state handling · the AHI severity color-bar · layered treatment safety
guardrails (SERVE-HF ASV block, MAD dentition/TMJ, central-events-require-PSG, DISE-before-surgery) ·
robust null-safety (blank AHI → pre-study, never "normal") · the whole KMS/PITR/CloudTrail/MFA/JWT
security posture · zero-free-text intake (kills the stored-XSS class) · real CI · no PHI committed.
