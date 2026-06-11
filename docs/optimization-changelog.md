# OSA Phenotyper — Optimization Changelog

All notable changes from the 2026-06 audit-driven optimization effort are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Newest first.

See [`optimization-roadmap.md`](optimization-roadmap.md) for the forward-looking plan and the
full findings inventory.

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
