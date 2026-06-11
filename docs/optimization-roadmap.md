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
| 2 | Right-size cutting-edge clinical claims (concern #2) | ☐ Pending |
| 3 | Simplify the patient report (concern #1) | ☐ Pending |
| 4 | Polish — performance, accessibility, security hardening | ☐ Pending |
| 5 | Structural hardening — code, tests, config | ☐ Pending |

---

## Phase 1 — Patient safety & trust ✅ DONE

Shipped 2026-06-11 on branch `phase-1-safety-fixes`. See changelog for detail.

- [x] **Normal-HST false reassurance** (CRITICAL) — `js/patientReport.js` Sections B/B2
- [x] **No patient disclaimer** (high) — `js/patientReport.js` `renderFooter`
- [x] **Portal CSP/referrer/robots headers** (medium) — `portal.html`, `infrastructure/deploy.sh`
- [x] **Uncommitted working tree** (medium) — committed as `5c96727`

---

## Phase 2 — Right-size cutting-edge clinical claims (concern #2) ☐

Goal: keep the features, but make confidence match the evidence. Convert research-grade
*markers* and population *split-points* from deterministic treatment *triggers* into supporting
*context*. Citations are real; this is calibration, not removal.

- [ ] **Hypoxic burden drives treatment urgency beyond the evidence** (high) —
  `js/app.js:1101-1117, 1215-1217, 1785-1834`, `js/config.js:64-79`. "High Hypoxic Burden"
  fires on any single moderate-range oxygen metric and emits "start therapy promptly to reduce
  cardiovascular risk." The 73.1 cut is the ISAACC cohort *median*, the 30 an Azarbarzin tertile —
  neither a validated action threshold. **Fix:** demote to supportive context; stop emitting an
  urgency rec from one moderate metric; soften "Strong CPAP Indication"; caveat that the cutoffs
  are population-derived; reconsider the "low HB → CPAP may harm" framing for non-ACS patients.
- [ ] **Loop-gain estimate uses a fabricated 0.50 intercept** (high) — `js/app.js:984-989, 1068-1083`.
  Schmickl 2022 published the two coefficients but no intercept; the guessed 0.50 dominates the
  realistic range and determines the binary "High Loop Gain" label (which drives CPAP advice, the
  ASV pathway, and −1 in the MAD score). **Fix:** present loop gain as a qualitative
  ventilatory-instability flag, or a low-confidence research estimate with no hard 0.7 cutoff.
- [ ] **Edwards arousal-threshold run as 2-of-3 from WatchPAT** (medium) — `js/app.js:991-1009, 1055-1061`.
  Drops the hypopnea-fraction variable the published 84% accuracy depends on, still labels
  "Moderate" confidence. **Fix:** downgrade to "Low / incomplete (2 of 3 inputs)" or require all 3.
- [ ] **"Poor Muscle Responsiveness" inferred from REM/NREM ratio** (medium) — `js/app.js:1085-1091`.
  An unvalidated surrogate for a PSG-derived trait. **Fix:** reframe as an inferred hypothesis;
  never let confidence reach "High" without PSG inputs.
- [ ] **Ji 2026 HNS staging drops the comorbidity variable** (medium) — `js/app.js:1251-1268`.
  Uses 3 of 4 inputs but emits the paper's exact "91% → 38%" rates from a single-center, C=0.68,
  unvalidated model. **Fix:** add the comorbidity input or show a qualitative tier; add the
  single-center/validation caveat.
- [ ] **Patient "Why This Matters" calls HB ≥73 definitively "high"** (low) — `js/patientReport.js:1349-1372`.
  **Fix:** descriptive phrasing tied to the number, not the categorical "high."

---

## Phase 3 — Simplify the patient report (concern #1) ☐

Goal: lead with the bottom line, cut density, translate jargon. Measured today: ~1,900 words,
6 sections, up to 8 colored callouts, Flesch-Kincaid grade 10–13 (one passage at 18.8).

- [ ] **No "bottom line + one next step" summary** (high) — `js/patientReport.js:1389-1408`.
  **Fix:** add a `renderSummaryCard()` right after the header for all patients: one plain-language
  finding sentence + one highlighted "Your most important next step." < 40 words.
- [ ] **Raw phenotype names shown as bold headings** (high) — `js/patientReport.js:636-647`.
  "Low Arousal Threshold" / "High Loop Gain" mean nothing (or the wrong thing) to a patient.
  **Fix:** `patientLabelMap` → plain-language headings; keep clinical names clinician-only.
- [ ] **"Why This Matters" dumps 5 metrics in one grade-18 sentence** (high) — `js/patientReport.js:1358-1372`.
  Includes `%min/hr`, a research unit. **Fix:** 2–3 short sentences, lead with the takeaway, drop
  raw numbers from the patient view.
- [ ] **Clinician uncertainty/workup callouts rendered to patients** (medium) — `js/patientReport.js:531-581`.
  **Fix:** suppress from patient view or collapse to one line ("your doctor will go over a few
  remaining details with you").
- [ ] **Cumulative callout-box overload** (medium) — `js/patientReport.js:1389-1408`, `css/patientReport.css`.
  Six competing colored-box styles; flat hierarchy. **Fix:** density budget (≤3–4 callouts, one
  strong color reserved for the summary); make What-If and full phenotype detail collapsible.
- [ ] **What-If / phenotype paragraphs long and number-heavy** (low) — `js/patientReport.js:1280-1322, 616-633`.
  **Fix:** ≤2 sentences and ≤1 number per what-if; cap phenotype descriptions ~40 words; show top
  2–3 contributors with the rest behind a toggle.

---

## Phase 4 — Polish: performance, accessibility, security hardening ☐

### 4a · Performance
- [ ] **880 KB of PDF-only libs load render-blocking on every page open** (high) — `index.html:932-940`.
  pdf.js + jsPDF + html2canvas (~250 KB gzip) load even when no PDF is touched. **Fix:** lazy-load
  on first PDF drop / first export click (~15-line helper); or at minimum add `defer`.
- [ ] **Paginator interleaves DOM writes and rect reads in a loop** (medium) — `js/pdf-export.js:342-356`.
  **Fix:** measure all heights in one pass, then assign pages from cached numbers.
- [ ] **Clinician PDF rasterizes the whole report as one tall canvas** (medium) — `js/pdf-export.js:446-512`.
  **Fix:** reuse the per-page shell rendering already used for the patient PDF; consider scale 1.5.
- [ ] **No preconnect/dns-prefetch hints on index.html** (low) — `index.html:7-9` (portal.html has them).
- [ ] **CDN libs not self-hosted / no SRI** (low) — `index.html:7-11, 932-940`. **Fix:** self-host
  the pinned files or add `integrity`+`crossorigin`; unlocks offline + a service-worker cache.

### 4b · Accessibility & clinician UX
- [ ] **All 9 collapsible headers are non-keyboard-accessible `<div>`s** (high) —
  `index.html:458,579,594,617,664,703`, `js/app.js:1997,2008,2019`. Collapsed decision-support
  sections (MAD/HNS candidacy, follow-up) are unreachable without a mouse. **Fix:** convert to
  `<button>` (matches the prior progress-track fix) with `aria-controls`.
- [ ] **pAHI/ODI/nadir show a "required" asterisk but aren't enforced** (medium) —
  `index.html:672-674`, `js/validate.js:117`. **Fix:** make the marker honest (drop it + add a
  hint, or gate enforcement on "study reviewed").
- [ ] **Intake validation errors not announced to screen readers** (medium) — `intake.html` validation
  summary + per-field errors. **Fix:** `role="alert"`/`aria-live`, `aria-invalid`, focus first error.
- [ ] **ESS/ISI/NOSE radios are bare numbers to screen readers** (low) — `intake.html` build* funcs.
- [ ] **Clinician form ~116 controls, all expanded, no "fast path" hint** (low) — `index.html:443-728`.
- [ ] **Intake progress bar lacks progressbar semantics** (low) — `intake.html:44-49, 821-836`.

### 4c · Security hardening (audit downgraded the portal Referer claim; these remain)
- [ ] **Rate limiting depends on an optional WAF; no API-Gateway throttle; portal endpoint uncovered**
  (medium) — `infrastructure/template.yaml:679-691`, `infrastructure/deploy.sh:103-150`. **Fix:** add
  `ThrottlingRateLimit`/`BurstLimit` as an always-on backstop; extend WAF scope to `/patient-portal/`.
- [ ] **Intake Lambda IAM is broader than documented** (medium) — `infrastructure/template.yaml:430-449`.
  Grants GetItem/UpdateItem on the whole table (code, not IAM, enforces "formData only"). **Fix:**
  tighten the policy or correct the docs (CLAUDE.md / HIPAA change-log).
- [ ] **`esc()` doesn't escape single quotes** (low) — `js/patientReport.js:34-41`. Safe today; latent.
  **Fix:** add `.replace(/'/g, '&#39;')`.
- [ ] **Cognito tokens in localStorage** (low) — `js/auth.js`. **Fix:** add SRI to CDN tags + a CSP on
  `index.html` to reduce blast radius; accept as a no-build-SPA tradeoff.
- [ ] **Portal token is long-lived (180 d) and reusable in the URL** (low, residual) — `infrastructure/lambda/intake.mjs`.
  **Fix:** shorten lifetime; consider delivering via URL fragment / POST. (Note: the audit's
  cross-origin Referer-leak claim was **refuted** — modern browsers strip the query string.)

---

## Phase 5 — Structural hardening: code, tests, config ☐

- [ ] **Unit tests replicate `app.js` logic instead of importing it** (high) — `tests/tests.html:50-145`.
  A real phenotype-trigger regression would pass all green tests. **Fix:** extract the pure
  phenotyping function(s) and have tests call the real engine; automate the 31-profile test matrix
  against the live form.
- [ ] **1,260-line form-submit god function** (high) — `js/app.js:870-2130`. Tangles parsing, clinical
  logic, treatment mapping, and rendering (with the documented temporal-dead-zone trap). **Fix:**
  extract `detectPhenotypes()`, `mapTreatments()`, and a renderer.
- [ ] **Core thresholds hardcoded outside config.js** (high) — `js/app.js:1310-1339, 1495-1535`,
  `js/patientReport.js:25-31`. MAD score, HST flags, and the patient-side AHI-severity tiers are
  magic numbers; `patientReport.js` can drift from `config.js`. **Fix:** move into `config.js`;
  have `ahiSeverityLabel()` read `OSA_CONFIG`.
- [ ] **CPAP-issue label map duplicated 3× with a drift** (medium) — `js/app.js:1148, 1393, 1976`
  ("prior inefficacy" vs "inefficacy"). **Fix:** hoist one `CPAP_ISSUE_LABELS` constant.
- [ ] **Blanket `*.pdf` gitignore is fragile** (low) — `.gitignore`. Safe today; **Fix:** move real
  sample/PHI files into a single ignored `private/` dir + keep `*.pdf` as a backstop.
- [ ] **CI passes by grepping a rendered string; no linter** (low) — `.github/workflows/`,
  `tests/run-headless-suite.sh:84-99`. **Fix:** add ESLint (`no-use-before-define` catches TDZ);
  emit a machine-readable result and key CI off that.

---

## Strengths to preserve (do not "fix")

Warm patient tone and CPAP-state handling · the AHI severity color-bar · layered treatment safety
guardrails (SERVE-HF ASV block, MAD dentition/TMJ, central-events-require-PSG, DISE-before-surgery) ·
robust null-safety (blank AHI → pre-study, never "normal") · the whole KMS/PITR/CloudTrail/MFA/JWT
security posture · zero-free-text intake (kills the stored-XSS class) · real CI · no PHI committed.
