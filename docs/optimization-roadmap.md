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
