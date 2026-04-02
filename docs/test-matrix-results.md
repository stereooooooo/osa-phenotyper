# Patient Report Test Matrix — Results
**Latest smoke test:** April 1, 2026
**Latest app version:** commit 4b9856c (`fix: add chart governance safeguards`)

---

## April 1, 2026 Post-Remediation Smoke Test

### Scope
- Executed the legacy browser harness at `tests/tests.html` in local Chrome against the current codebase.
- Ran local clinician-app smoke checks on `http://127.0.0.1:3000/index.html` with safe blank AWS config.
- Focus for this pass: non-AWS browser behavior after the audit remediation work.

### Browser Harness
- Result: **96 passed, 0 failed** of 96 assertions.
- Execution method: local static server + headless Chrome DOM run.
- Remediation during this pass:
  - Updated the harness confidence expectations to match the current Edwards-score low arousal threshold logic.
  - Updated high loop gain and high hypoxic burden expectations to the current composite/tiered model.
  - Updated sample-report assertions that were still expecting the retired low-arousal trigger path.
  - Added a browser-level validation test for required form fields.
- Conclusion: the local browser regression harness is back in sync with the remediated clinical logic and currently passes cleanly.

### Local Clinician-App Smoke Checks

#### 1. Safe defaults / local config posture
- `sex`, `tonsils`, and `ftp` loaded blank on first render.
- `Save Patient` and `Patients` controls were hidden with blank local `AWS_CONFIG`, confirming safe non-production local behavior.
- Result: **PASS**

#### 2. Required-field submit gate
- Submitted the form with required fields blank.
- Observed blocking alert with all 5 expected missing fields:
  - Patient name
  - Date of birth
  - Age
  - Sex
  - BMI
- Observed `5` invalid controls styled inline.
- Result: **PASS**

#### 3. Pre-study workflow
- Entered minimum demographic data with no sleep-study values and submitted.
- `Generate Patient Report` became available.
- Clinician report remained empty in the pre-study state.
- Result: **PASS**

#### 4. Patient report overlay
- Opened the pre-study report preview.
- Verified:
  - adaptive title `Your Sleep Evaluation Summary`
  - care pathway rendered
  - `Your Next Steps` section rendered
  - pre-study report remained patient-facing and did not render the clinician report block
- Result: **PASS**

### Not Covered In This Local Pass
- Save/archive/restore against a live AWS-backed patient record
- Intake-link generation and patient intake submission
- Persistent field-provenance display from real saved records
- Persistent report snapshot save/history from real saved records
- PDF pagination / clipping review
- MFA / RBAC / CORS / deployed infrastructure validation

### Next Testing Step
- Use a deployed environment with real AWS config and run the expanded regression matrix sections that depend on persistence, auth, intake tokens, archived-record lifecycle, provenance, and report snapshots.

---

## April 1, 2026 AWS Staging Validation

### Environment
- AWS account: `420551259537`
- Region: `us-east-2`
- Staging stack: `osa-phenotyper-capital-ent-stg-20260401b`
- API: `https://sgwvp3545f.execute-api.us-east-2.amazonaws.com`
- User pool: `us-east-2_ohn6HsKt7`

### Deployment Findings Fixed During Validation
- Fixed a CloudFormation race where `AdminUserGroupAttachment` could run before `AdminUser` existed.
- Removed the unsupported direct WAF association to the API Gateway HTTP API stage so the stack could deploy.
- Fixed clinician Lambda RBAC handling so staging auth works when API Gateway serializes or omits `cognito:groups` in non-obvious formats.

### Auth & Session Validation
- First login required password change and MFA setup.
- Software-token MFA enrollment completed successfully.
- Cognito user state after setup: `CONFIRMED`, preferred MFA `SOFTWARE_TOKEN_MFA`.
- Result: **PASS**

### AWS-Backed Persistence Smoke Checks
- `GET /patients` with the staging browser `idToken` returned `200`.
- `POST /patients` with the staging browser `idToken` returned `201`.
- `POST /patients` with the staging browser `accessToken` also returned `201` after the RBAC fixes.
- `POST /intake-tokens` returned `201` and produced a valid token + expiry timestamp.
- `GET /intake/{token}` returned `200` on the public intake route.
- `PUT /patients/{id}` with `reportSnapshot` returned `200`, incremented `version`, and persisted exactly one snapshot.
- `DELETE /patients/{id}` archived the patient and removed it from the default active list.
- `GET /patients?includeArchived=true` returned the archived patient to the admin-scoped list.
- `PUT /patients/{id}` with `{ restore: true }` restored the archived chart to the active list.
- Result: **PASS**

### Follow-Up Fix Found During Live Intake Testing
- The first fully valid staging intake submission surfaced a real server bug: the intake Lambda returned `500` with CloudWatch `ValidationException` once the transactional merge path executed.
- Root cause: the patient-side `TransactWriteItems` update expression in `infrastructure/lambda/intake.mjs` was receiving unused `:used` / `:active` expression values that only belonged to the token-side update.
- Remediation: removed the unused values, packaged the Lambda, and redeployed `osa-intake-api-capital-ent-stg-20260401b` directly to staging.
- Result after redeploy: **PASS**

### Remaining Staging Checks Completed
- Live intake submit with canonical `weightLossReadiness = ready` returned `200`.
- Conflict staging behaved correctly: clinician `formData.cpapCurrent` stayed `on`, while conflicting intake values landed in `intakePendingOverrides` as `cpapCurrent = ""` and `age = 38`.
- Intake provenance behaved correctly: `cpapRetry` and `weightLossReadiness` were applied with `patient-intake` provenance, while `cpapCurrent` remained `clinician`.
- Stale-save protection behaved correctly: first save returned `200`, second save with the stale `version` returned `409` and the reload-before-saving message.
- CORS behaved correctly on staging:
  - Allowed origin `http://127.0.0.1:3000` received `access-control-allow-origin` on both GET and OPTIONS.
  - Disallowed origin `https://evil.example` received no permissive ACAO header on GET or OPTIONS.
- API Gateway access logs were present in `/aws/apigateway/osa-phenotyper-capital-ent-stg-20260401b`, including the intentional `400`, the pre-fix `500`, and the post-fix `200`.
- CloudTrail audit objects were present in `s3://osa-audit-logs-capital-ent-stg-20260401b-420551259537/...`, and sampled records included DynamoDB `PutItem`, `UpdateItem`, `GetItem`, `Scan`, and `TransactWriteItems` events from both patient and intake Lambdas.
- Patient PDF export from the staging-backed UI saved `/Users/raymondbrown/Downloads/Sleep_Report_PDF_Export_QA_2026-04-02.pdf`.
- PDF verification:
  - producer `jsPDF 2.5.1`
  - `5` pages
  - `2868864` bytes
  - letter-sized pages

### Remaining Gaps After This Staging Pass
- Browser automation for the patient-list archive/restore buttons remains flaky because Chrome + AppleScript dialog handling can stall the scripted UI path. During manual browser testing, that path also exposed a frontend scoping bug (`clearCurrentPatient is not defined`) in the archive reset helper; the scope fix is now patched locally in `index.html`, but the archive button still needs one final browser re-check after reload.
- Full visual review of PDF pagination/clipping needed a fresh re-export after the latest local patch. Screenshot QA on April 1, 2026 showed real break defects in the prior export build:
  - a phenotype section starting with clipped fragments at the top of page 2
  - treatment paragraphs splitting across pages mid-rec-item
  - `Your First 30 Days` and `What If…?` headers orphaning from their checklist/card content
- Local remediation is now patched in `js/pdf-export.js` and `js/patientReport.js`:
  - patient-report pages are built as separate DOM shells instead of relying on whole-report canvas slicing
  - screen-only `.patient-report` margin/padding is reset during PDF measurement so the measured layout matches the rendered layout
  - a fit buffer and stronger semantic grouping were added for phenotype, checklist, and what-if blocks
- Re-check result on April 1, 2026: **PASS**
  - Generated a fresh patient PDF through the live export code path and captured the artifact at `tests/artifacts/Sleep_Report_PDF_Pagination_QA_Fix2_2026-04-02.pdf`.
  - Verified rendered pages from that new artifact:
    - page 2 no longer starts with clipped carry-over fragments
    - treatment recommendations no longer split mid-rec-item at the prior failing boundary
    - `Your First 30 Days` starts with its heading, intro, and first checklist group together
    - `What If…?` starts with its heading and scenario cards together on the final page

---

**Run date:** March 19, 2026
**App version:** commit cca8d97 (HB revamp + T90)

---

## Group 1: Severity Spectrum

### Test 1: Pre-study Snorer
**Report Title:** Your Sleep Evaluation Summary
**AHI:** n/a (no study)
**Sections:** Why We're Recommending a Sleep Study, Treatment Plan, First 30 Days, What If
**Phenotypes:** none
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** Nasal Treatment, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, saline rinses, nasal follow-up, 4-6wk follow-up
**What-If:** What if your nasal obstruction were treated?
**Why This Matters:** no
**⚠️ ISSUES:** Pre-study patient getting CPAP/MAD/surgery recs even though no OSA diagnosis yet. Should only show sleep study recommendation. Treatment Plan section should not appear for pre-study patients without a diagnosis.

---

### Test 2: Pre-study Insomniac
**Report Title:** Your Sleep Evaluation Summary
**AHI:** n/a
**Sections:** Why We're Recommending a Sleep Study, Treatment Plan, First 30 Days
**Phenotypes:** none
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CBT-I, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, CBT-I referral, 4-6wk follow-up
**What-If:** none
**Why This Matters:** no
**⚠️ ISSUES:** Same issue as Test 1 — CPAP/MAD/surgery recs appearing without OSA diagnosis. CBT-I is appropriate here. CPAP and surgery are not.

---

### Test 3: Normal AHI (pAHI 3)
**Report Title:** Your Sleep Apnea Report
**AHI:** 3 (marker displayed)
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days
**Phenotypes:** REM-Predominant OSA
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Oral Appliance Therapy, Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, 4-6wk follow-up
**What-If:** none
**Why This Matters:** no
**⚠️ ISSUES:** AHI 3 is normal — should NOT have "Your Sleep Apnea Report" title or treatment recs. REM-predominant phenotype triggering on AHI 3 (REM 5 / NREM 2 = ratio 2.5) is technically correct by ratio but clinically meaningless at this severity. Should be suppressed when AHI < 5.

---

### Test 4: Mild Positional (pAHI 8)
**Report Title:** Your Sleep Apnea Report
**AHI:** 8
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If
**Phenotypes:** Positional OSA
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** Positional Therapy, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, positional device, position tracking, 4-6wk follow-up
**What-If:** What if you lost weight? (AHI 8→6), What if you slept on your side? (sup 18 vs non-sup 4)
**Why This Matters:** no
**✅ Notes:** Positional detected correctly. Weight loss what-if showing even though BMI is 28 (overweight, not obese) — appropriate since threshold is BMI ≥ 27.

---

### Test 5: Moderate Classic (pAHI 22)
**Report Title:** Your Sleep Apnea Report
**AHI:** 22
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, weight goal, dietitian referral, 4-6wk follow-up
**What-If:** What if you lost weight? (AHI 22→15)
**Why This Matters:** no
**✅ Notes:** HB area 35 triggers HB phenotype (moderate tier). Weight management correctly recommended for BMI 32.

---

### Test 6: Severe Obese (pAHI 55)
**Report Title:** Your Sleep Apnea Report
**AHI:** 55
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If, Why This Matters
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden, Elevated Delta Heart Rate
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**What-If:** What if you lost weight? (AHI 55→39)
**Why This Matters:** yes ✅
**✅ Notes:** Why This Matters correctly fires (AHI ≥30 + HB >60 + T90 >20%). Delta HR phenotype triggers at ΔHR 10.

---

### Test 7: Very Severe Morbid (pAHI 85)
**Report Title:** Your Sleep Apnea Report
**AHI:** 85
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If, Why This Matters
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden, Elevated Delta Heart Rate
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**What-If:** What if you lost weight? (AHI 85→59)
**Why This Matters:** yes ✅
**✅ Notes:** All severe metrics firing correctly. HB 120, T90 40%, ODI 75, nadir 68 — all in severe range.

---

## Group 2: CPAP History Variants

### Test 8: Current CPAP User (pAHI 30)
**Report Title:** Your Sleep Apnea Report
**AHI:** 30
**CPAP Context:** "Building on your current CPAP therapy." ✅
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Why This Matters:** yes (AHI 30 + HB 40 moderate)
**✅ Notes:** CPAP context box correctly shows "building on" message.

---

### Test 9: CPAP Failed COMISA (pAHI 24)
**Report Title:** Your Sleep Apnea Report
**AHI:** 24
**CPAP Context:** "We hear you on CPAP." ✅
**COMISA:** yes ✅
**Phenotypes:** Low Arousal Threshold, High Hypoxic Burden, Nasal-Resistance Contributor
**Recs (Start Now):** CBT-I (first! ✅), Nasal Treatment, Inspire
**Recs (Discuss):** CPAP Therapy, Oral Appliance Therapy, Airway Surgery
**Checklist:** CBT-I first ✅, sleep dentist, saline rinses, nasal follow-up, CPAP gentle mention last ✅, follow-up
**What-If:** Weight loss, nasal treatment
**Why This Matters:** no
**✅ Notes:** COMISA handling is excellent. CBT-I prioritized, CPAP acknowledged but de-emphasized.
**⚠️ NOTE:** HB phenotype triggered with ODI 20 (moderate tier) even though HB area not provided. This is correct behavior.

---

### Test 10: CPAP Failed Will Retry (pAHI 28)
**Report Title:** Your Sleep Apnea Report
**AHI:** 28
**CPAP Context:** "Giving CPAP another try." ✅
**Recs (Start Now):** CPAP Therapy, Oral Appliance Therapy, Airway Surgery
**Checklist:** CPAP re-fitting ✅ (not generic setup), mask desensitization, sleep dentist, follow-up
**✅ Notes:** Correctly shows retry messaging and re-fitting checklist item instead of generic "schedule CPAP setup."

---

### Test 11: Prefers to Avoid CPAP (pAHI 12)
**Report Title:** Your Sleep Apnea Report
**AHI:** 12
**CPAP Context:** none
**Phenotypes:** Positional OSA
**Recs (Start Now):** Positional Therapy, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal...
**⚠️ ISSUES:** Patient prefers to avoid CPAP, but report doesn't acknowledge this preference. CPAP is still listed in Start Now with standard checklist items. Should have similar handling to CPAP-failed patients — acknowledge the preference and lead with alternatives.

---

## Group 3: COMISA & Insomnia Variants

### Test 12: Pure Insomnia + Mild OSA (pAHI 7, ISI 22)
**Report Title:** Your Sleep Apnea Report
**AHI:** 7
**Phenotypes:** Low Arousal Threshold, REM-Predominant OSA
**COMISA:** yes ✅ (ISI 22 + AHI ≥5)
**Recs (Start Now):** CBT-I (first! ✅), CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CBT-I first ✅, CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, follow-up
**✅ Notes:** COMISA correctly detected. CBT-I prioritized.

---

### Test 13: Sleepy COMISA (pAHI 24, ESS 17, ISI 19)
**Report Title:** Your Sleep Apnea Report
**AHI:** 24
**COMISA:** yes ✅
**Phenotypes:** Low Arousal Threshold, High Hypoxic Burden, Nasal-Resistance Contributor
**Recs (Start Now):** CBT-I (first! ✅), Nasal Treatment, CPAP Therapy
**Recs (Discuss):** Oral Appliance Therapy, Airway Surgery
**✅ Notes:** Sleepy COMISA handled correctly — CBT-I first despite high ESS.

---

### Test 14: Pre-study Severe Insomnia (ISI 24, no study)
**Report Title:** Your Sleep Evaluation Summary
**AHI:** n/a
**Recs (Start Now):** CBT-I, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**⚠️ ISSUES:** Same pre-study issue as Tests 1-2. CBT-I is appropriate. CPAP/MAD/surgery should not appear without OSA diagnosis.

---

## Group 4: Anatomy & Surgery Scenarios

### Test 15: Large Tonsils Thin (Tonsils 4, FTP I, BMI 24)
**Report Title:** Your Sleep Apnea Report
**AHI:** 18
**Phenotypes:** none
**Recs (Start Now):** Tonsil Surgery (Tonsillectomy) ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**✅ Notes:** Tonsillectomy correctly appears as first rec for thin patient with grade 4 tonsils and FTP I.

---

### Test 16: Large Tonsils Obese (Tonsils 3, BMI 34)
**Report Title:** Your Sleep Apnea Report
**AHI:** 35
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Tonsil Surgery, Oral Appliance Therapy
**Why This Matters:** yes ✅
**✅ Notes:** Tonsillectomy still present but in "Discuss" — appropriate for obese patient where tonsillectomy alone less likely curative.

---

### Test 17: Prior UPPP (pAHI 25)
**Report Title:** Your Sleep Apnea Report
**AHI:** 25
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**✅ Notes:** Prior UPPP acknowledged in clinician report. Patient report doesn't specifically mention prior surgery history — may want to add context.

---

### Test 18: Prior MAD Failed (pAHI 15)
**Report Title:** Your Sleep Apnea Report
**AHI:** 15
**Phenotypes:** Positional OSA
**Recs (Start Now):** Positional Therapy, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**⚠️ ISSUES:** Oral Appliance Therapy still recommended even though patient already tried and failed MAD. Report should acknowledge prior MAD and adjust accordingly.

---

## Group 5: Phenotype-Specific

### Test 19: REM-Predominant Mild (pAHI 12, REM 28/NREM 8)
**Report Title:** Your Sleep Apnea Report
**AHI:** 12
**Phenotypes:** REM-Predominant OSA ✅
**Recs:** CPAP, Oral Appliance, Airway Surgery
**✅ Notes:** REM-predominant correctly detected (ratio 3.5, NREM < 15).

---

### Test 20: High Loop Gain (CSR 15%, pAHIc 12)
**Report Title:** Your Sleep Apnea Report
**AHI:** 20
**Phenotypes:** High Loop Gain ✅
**Recs (Start Now):** Alternative PAP Therapy ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**✅ Notes:** High Loop Gain detected. Alternative PAP (BiPAP/ASV) correctly prioritized over standard CPAP.

---

### Test 21: High Hypoxic Burden (HB 65, ODI 35, nadir 72, T90 22%)
**Report Title:** Your Sleep Apnea Report
**AHI:** 20
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden ✅
**Recs:** CPAP, Weight Management, Airway Surgery, Oral Appliance
**Why This Matters:** yes ✅
**✅ Notes:** HB in severe range (>60). Why This Matters fires correctly. Multiple severe-tier metrics (HB >60, ODI >50 — actually 35, so no, T90 >20% yes, nadir <75 yes).

---

### Test 22: Nasal + Positional Combo (NOSE 60, sup 32/non-sup 6)
**Report Title:** Your Sleep Apnea Report
**AHI:** 16
**Phenotypes:** Positional OSA ✅, Nasal-Resistance Contributor ✅
**Recs (Start Now):** Positional Therapy, Nasal Treatment, CPAP Therapy
**Recs (Discuss):** Oral Appliance Therapy, Airway Surgery
**What-If:** Weight loss, side sleeping (sup 32 vs non-sup 6), nasal treatment
**✅ Notes:** Both phenotypes correctly detected. All three what-if scenarios present. Comprehensive combo handling.

---

### Test 23: Delta HR + CVD (ΔHR 14, CVD yes)
**Report Title:** Your Sleep Apnea Report
**AHI:** 25
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden, Elevated Delta Heart Rate ✅
**Recs:** CPAP, Weight Management, Airway Surgery, Oral Appliance
**✅ Notes:** Delta HR phenotype triggers at 14 (≥10 threshold). CVD present as confidence modifier.

---

## Group 6: Inspire Candidacy

### Test 24: Good Inspire Candidate (CPAP failed, BMI 30, pAHI 28)
**Report Title:** Your Sleep Apnea Report
**AHI:** 28
**CPAP Context:** "We hear you on CPAP." ✅
**Phenotypes:** High Hypoxic Burden
**Recs (Start Now):** Inspire ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** sleep dentist, CPAP gentle mention, follow-up
**✅ Notes:** Inspire correctly prioritized for CPAP-failed patient with interest. No Inspire checklist item though.
**⚠️ NOTE:** Missing "Schedule a formal Inspire candidacy evaluation" in checklist — HNS tag may not be in recTags.

---

### Test 25: Poor Inspire BMI >40 (BMI 42, pAHI 72)
**Report Title:** Your Sleep Apnea Report
**AHI:** 72
**CPAP Context:** "We hear you on CPAP." ✅
**Phenotypes:** High Anatomical Contribution, Positional OSA, High Hypoxic Burden, Elevated Delta Heart Rate
**Recs (Start Now):** Weight Management, Positional Therapy, CPAP Therapy
**Recs (Discuss):** Oral Appliance Therapy, Airway Surgery
**Why This Matters:** yes ✅
**✅ Notes:** Inspire correctly NOT recommended (BMI >40 exclusion). Weight management prioritized.

---

### Test 26: Inspire-Curious No CPAP Trial (pAHI 20)
**Report Title:** Your Sleep Apnea Report
**AHI:** 20
**Recs (Start Now):** Inspire ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**✅ Notes:** Inspire appears because patient expressed interest (prefInspire). CPAP still recommended alongside.

---

## Group 7: Borderline Values

### Test 27: BMI 26, Mild Insomnia (ISI 12, pAHI 10)
**Report Title:** Your Sleep Apnea Report
**AHI:** 10
**Phenotypes:** none
**Recs:** CPAP, Oral Appliance, Airway Surgery
**No weight rec ✅** (BMI 26 < 30 threshold)
**No what-if weight section** — actually BMI 26 < 27 what-if threshold, so no what-if either ✅
**COMISA:** no ✅ (ISI 12 < 15)
**✅ Notes:** Borderline values handled correctly. No inappropriate weight or insomnia recommendations.

---

### Test 28: BMI 29.9 (pAHI 18)
**Report Title:** Your Sleep Apnea Report
**AHI:** 18
**Recs:** CPAP, Oral Appliance, Airway Surgery
**No weight rec ✅** (BMI 29.9 < 30)
**What-If:** What if you lost weight? (AHI 18→13) ✅ (BMI ≥27 triggers what-if)
**✅ Notes:** Correctly no weight management rec but what-if still shows since BMI ≥ 27.

---

### Test 29: AHI Exactly 5
**Report Title:** Your Sleep Apnea Report
**AHI:** 5
**Phenotypes:** Positional OSA
**Recs:** Positional Therapy, CPAP, Oral Appliance, Airway Surgery
**✅ Notes:** AHI 5 correctly classified as mild (≥5). Positional detected (sup 8 / non-sup 3, ratio 2.67).

---

### Test 30: AHI Exactly 15
**Report Title:** Your Sleep Apnea Report
**AHI:** 15
**Phenotypes:** none
**Recs:** CPAP, Oral Appliance, Airway Surgery
**What-If:** Weight loss (AHI 15→11)
**✅ Notes:** AHI 15 correctly classified as moderate (≥15).

---

### Test 31: AHI Exactly 30
**Report Title:** Your Sleep Apnea Report
**AHI:** 30
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs:** CPAP, Weight Management, Airway Surgery, Oral Appliance
**Why This Matters:** yes ✅
**✅ Notes:** AHI 30 correctly classified as severe (≥30). Why This Matters fires.

---

## Summary of Issues Found

### Critical
1. **Tests 1, 2, 14: Pre-study patients get treatment recs** — Patients without a sleep study are receiving CPAP, MAD, and surgery recommendations. The Treatment Plan and First 30 Days sections should not appear (or should only show "Get a sleep study" and CBT-I if insomnia present).

2. **Test 3: Normal AHI gets treatment recs** — AHI of 3 should not generate CPAP/MAD/surgery recommendations or phenotypes. REM-predominant triggers on clinically meaningless ratio at AHI < 5.

### Moderate
3. **Test 11: Prefers-to-avoid-CPAP not acknowledged** — Patient who prefers to avoid CPAP doesn't get the same contextual handling as CPAP-failed patients. Should have a context box and alternative prioritization.

4. **Test 18: Prior MAD failure not reflected** — Oral Appliance Therapy still recommended even though the patient already tried and couldn't tolerate it.

5. **Test 24: Missing Inspire checklist item** — Good Inspire candidate doesn't get "Schedule Inspire candidacy evaluation" in checklist.

### Minor
6. **Tests 1, 2, 14: Pre-study patients could benefit from clearer "next step is a sleep study" framing** rather than treatment plans.

7. **Some pre-study edge cases** around when treatment sections should/shouldn't render need tightening.

---

## April 2, 2026 Follow-Up Targeted Checks

- `node --check js/app.js` ✅
- `node --check js/patientReport.js` ✅
- `node --check infrastructure/lambda/index.mjs` ✅
- Inline script extraction + `node --check` for `index.html` ✅

### Group 15 Spot Checks

### Test 78: Clinician insufficient-data warning
**Status:** targeted code-path verification complete
**Result:** `js/app.js` now emits insufficient-data domains for:
- missing oxygen metrics
- incomplete anatomy documentation (BMI / tonsils / FTP)
- incomplete HNS workup (missing DISE and/or Ji staging inputs)

### Test 79: Patient-facing data limitations callout
**Status:** targeted render probe complete
**Result:** generated patient-report HTML rendered `What may still be refined` only when `insufficientDataDomains` were present ✅

### Test 80: Weight-readiness personalization
**Status:** targeted render probes complete
**Ready now case:** patient-report HTML included `feel ready to work on weight management now` ✅
**Considering case:** patient-report HTML included `you are considering weight management` ✅
**BMI guardrail:** BMI 29 render did **not** include `GLP-1 therapies` ✅

### Open From This Follow-Up
- Review-queue behavior still needs one browser-level walkthrough of the new `Review queue only` toggle.
- Compact visit-audit entries still need one live save/load inspection against a real patient row to confirm the stored visit payload shape end to end.
- Exact full-name `name-index` search is now implemented, but it still needs one exercised request against a populated dataset to confirm the exact-match fast path before scan fallback.
