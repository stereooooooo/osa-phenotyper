
# OSA Phenotyper v8 – requested quick‑adds

### New inputs
* **Cardiovascular disease** (yes/no) under Medical History.
* **Snoring Index** (events/hr) in WatchPAT section.

### New logic / messaging
* **High Hypoxic Burden** phenotype now shows a blue card in the Patient Summary with CV‑risk language and CPAP‑urgency bullet.  
  *Triggered when Min SpO₂ < 85 % or ODI ≥ 40 (simple proxy until full HB calculator arrives).*
* **Symptom subtype** derived from questionnaires:  
  *Sleepy* (ESS ≥ 15) → extra counselling sentence.  
  *Disturbed‑sleep* (ISI ≥ 15).  
  *Minimally Symptomatic* otherwise.

### No HB or ΔHR calculators yet — placeholders only.

### Chart governance hardening
* **Archived patients can now be restored** by admins from the patient list.
* **Field provenance** is tracked on saved chart data so clinicians can see whether values came from manual chart entry, patient intake, or a pending intake conflict.
* **Patient report snapshots** can be saved into the chart as frozen artifacts with hash metadata and replayed later from snapshot history.

### Regression testing
* **Executable browser harness:** run `tests/run-headless-suite.sh` to start a local static server, execute both the core regression suite and the multi-step workflow smoke suite in headless Chrome, and fail fast if any assertions break.
* **Source-of-truth matrix:** scenario coverage is tracked in `docs/test-matrix.md`, with the latest smoke-test outcomes in `docs/test-matrix-results.md`.
* **CI hook:** `.github/workflows/regression-harness.yml` runs the same headless browser harness on `main`, pull requests, and manual workflow dispatches.
* **Local workflow test mode:** `tests/workflow-smoke.html` drives the real `index.html` and `intake.html` surfaces on localhost using a safe in-memory auth/DB shim, so save/load/review/snapshot/intake-submit paths can be exercised without AWS.

### Pilot-readiness safeguards
* **Visible runtime labeling:** the clinician app and intake page now render environment/build metadata plus a non-production banner so staging, pilot, workflow-test, and local sessions are clearly distinguishable from production.
* **Deploy-time metadata injection:** `infrastructure/deploy.sh` now writes environment label, build ID, deploy time, and stack context into the runtime config / intake page during deployment.

### Pilot launch docs
* **Pilot checklist:** `docs/pilot-go-live-checklist.md` is the concrete pre-patient checklist for the first supervised live pilot day.
* **Production hosting plan:** `docs/production-hosting-plan.md` maps the AWS / CloudFront / WAF / domain work needed to move from staging validation to a real production-hosted deployment.
