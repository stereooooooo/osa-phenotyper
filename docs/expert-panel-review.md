# OSA Phenotyper — Expert Panel Clinical Review

**Review date:** March 20, 2026
**App version:** Current working copy (uncommitted changes on main, post commit 8744ce1)
**Methodology:** 31 test-matrix patients + 10 edge cases run programmatically; 4 patient reports inspected; all thresholds cross-referenced against `docs/citations.md`

---

## Panel Members

1. **Sleep Medicine Physician (SMP)** — Board-certified, 20+ years. CPAP adherence, COMISA, endotype/phenotype literature, HB-guided treatment allocation.
2. **Sleep Surgeon (SS)** — Fellowship-trained ENT. DISE, Friedman staging, HNS/Inspire, MAD candidacy, multilevel surgery.
3. **Clinical Researcher / Biostatistician (CR)** — OSA endotyping, loop gain estimation, arousal threshold prediction, collapsibility metrics.

---

## Executive Summary

The OSA Phenotyper is a **remarkably sophisticated** clinical decision-support tool that correctly implements the PALM endotyping framework, HB-guided treatment allocation (Pinilla 2023, Azarbarzin 2025), and a nuanced multi-factor MAD candidacy scoring system. The tool demonstrates strong evidence-base alignment across 68 citations and handles most clinical scenarios correctly.

**Overall assessment by reviewer:**

- **SMP:** The COMISA handling (CBT-I sequencing, sleepy-COMISA sleep restriction caution, APAP preference) is best-in-class. The HB-guided treatment allocation with three tiers (moderate/high/very-high) is clinically sound. The alternatives-first approach for mild OSA + low HB is evidence-based per Pinilla 2023. **However, phenotype-driven treatment recommendations leak into pre-study and normal-AHI patients** — this is the most critical issue.

- **SS:** Friedman staging, Ji 2026 HNS staging, and DISE integration are implemented correctly. Tonsillectomy is appropriately prioritized for Friedman Stage I and suppressed for Stage III. The MAD scoring system is comprehensive and well-calibrated. The Inspire candidacy evaluation text correctly notes the CCC contraindication in its wording, but the recommendation **still appears even when CCC is confirmed on DISE** — the system should suppress it.

- **CR:** Thresholds are well-aligned with cited evidence. The Schmickl 2022 loop gain model, Edwards 2014 ArTH score, and Vena 2022 collapsibility metrics are correctly implemented. Confidence tier logic is sound across all 9 phenotypes. The composite HB tiering using worst-of-metrics is clinically appropriate. **The Poor Muscle Responsiveness AHI ≥30 threshold is more restrictive than the PALM literature suggests** — consider lowering to AHI ≥15.

---

## Findings by Severity

### Critical Issues

#### 1. Phenotype-driven treatment recs leak into pre-study and normal-AHI patients
**Severity:** 🔴 Critical
**Tests affected:** 2, 14, Edge-2, Edge-5
**Reviewers:** SMP, SS, CR

**Finding:** When a phenotype is detected from non-AHI data (e.g., Low Arousal Threshold from ISI ≥15, Nasal Contributor from NOSE score, High Anatomical Contribution from BMI/neck/tonsils/FTP), its treatment mapping runs unconditionally via the `forEach` loop at `app.js:702`. This generates treatment recs (CPAP-OPT, NASAL-OPT, CPAP, WEIGHT, SURGALT) even for patients without a sleep study or with normal AHI.

**Examples observed:**
- **Test 2** (pre-study insomniac, ISI 20): Gets `CPAP-OPT` rec ("Optimize CPAP comfort") — patient has no OSA diagnosis and has never used CPAP.
- **Test 14** (pre-study, ISI 24): Same `CPAP-OPT` leak.
- **Edge-2** (AHI 4, ISI 15): Gets `CPAP-OPT` — normal AHI, no OSA to treat with CPAP.
- **Edge-5** (AHI 3, BMI 36, tonsils 4, FTP III): Triggers High Anatomical Contribution and gets CPAP, WEIGHT, SURGALT recs despite normal AHI.

**Root cause:** The phenotype→treatment `forEach` at line 702 runs before the stage-aware guard at line 868. The stage-aware section (`if (ahi == null)` and `else if (ahi < 5)`) correctly limits core recs, but phenotype-triggered recs bypass this gate.

**Impact:** A clinician could see "Optimize CPAP comfort" for a patient who has never had a sleep study. This is clinically inappropriate and could confuse clinical workflow.

**Recommendation:** Gate the phenotype treatment mapping on `ahi != null && ahi >= 5`, or move the `forEach` to run only after the stage-aware section determines it's appropriate.

**Note on patient report:** The patient report correctly filters these for pre-study patients (Test 1 showed only NASAL-OPT and SLEEP-STUDY). The issue manifests primarily in the clinician report's recommendation list and internal recTags.

---

#### 2. High Anatomical Contribution triggers at normal AHI with CPAP/surgery recs
**Severity:** 🔴 Critical
**Tests affected:** Edge-5
**Reviewers:** SMP, CR

**Finding:** A patient with AHI 3 (normal) but strong anatomical flags (BMI 36, tonsils 4, FTP III) triggers High Anatomical Contribution and receives "Start CPAP/APAP (most effective for anatomical narrowing)" and "site-directed surgery / Inspire" recommendations. At AHI 3 there is no OSA to treat.

**Clinical concern:** Anatomical crowding with normal AHI may represent compensated anatomy (good muscle responsiveness keeping the airway open) or may precede future OSA development. It's appropriate to note the anatomical findings, but recommending CPAP and surgery at AHI <5 is not evidence-based.

**Recommendation:** Suppress treatment-generating phenotypes when AHI <5. Anatomical findings can be noted in the clinician report without generating treatment recs.

---

### Important Issues

#### 3. CPAP retry messaging not applied in core recommendations
**Severity:** 🟡 Important
**Tests affected:** 10
**Reviewers:** SMP

**Finding:** Test 10 (CPAP failed, will retry) shows `cpapWillRetry: true` but the CPAP rec text says "Start CPAP/APAP" — generic first-time language. The `cpapRec()` helper function at line 671 correctly handles the retry case with optimized messaging ("Retry CPAP with optimized settings, address prior issues: mask fit"), but it's only called from the High Anatomical Contribution phenotype branch. The core recommendations at line 909-917 have no `cpapWillRetry` branch.

**Impact:** For patients without High Anatomical Contribution who are retrying CPAP, the system gives generic first-time CPAP language instead of acknowledging the retry context and prior issues.

**Recommendation:** Add `cpapWillRetry` branch to core recommendations (line 909-917) matching the logic in `cpapRec()`.

---

#### 4. Inspire recommendation not suppressed when CCC confirmed on DISE
**Severity:** 🟡 Important
**Tests affected:** Edge-4
**Reviewers:** SS

**Finding:** When concentric velum collapse (degree 2) is entered on DISE, `hasConcentricCollapse` correctly becomes `true`. The `buildHGNSAssessment()` function correctly identifies this as a hard stop. However, the `INSPIRE-EVAL` rec tag is still pushed at line 824-825 because the `prefInspire` check does not gate on CCC.

**Clinician report:** The full HGNS assessment section likely explains the contraindication, but the recommendation tag "Patient interested in Inspire — evaluate candidacy" appearing alongside a confirmed CCC is contradictory.

**Recommendation:** Add `!hasConcentricCollapse` to the `prefInspire` condition at line 824.

---

#### 5. Prior MAD text says "Reassess" instead of acknowledging failure
**Severity:** 🟡 Important
**Tests affected:** 18, Edge-10
**Reviewers:** SS, SMP

**Finding:** When `priorMAD` is true, the MAD rec says "Reassess oral appliance therapy (prior trial) — evaluate fit, efficacy, or consider alternative device." While not technically wrong, the test matrix intent is that the patient **couldn't tolerate** the MAD. The current text implies MAD is still viable and just needs reassessment.

**In patient report:** The `priorMAD` flag suppresses MAD descriptions, which is correct. But the clinician rec list still suggests reassessment.

**Recommendation:** Differentiate between "prior MAD tried, not tolerated" and "prior MAD tried, partially effective." If the intent is intolerance, the rec should say "Prior MAD not tolerated — consider alternative approaches (Inspire, surgery, positional therapy)."

---

#### 6. Test 11 — prefAvoidCpap partially handled
**Severity:** 🟡 Important (improved from prior review)
**Tests affected:** 11
**Reviewers:** SMP

**Finding:** The previous review flagged this as "not acknowledged." Now, the core rec correctly shows "CPAP/APAP (most effective option — discuss with patient given preference to avoid)." The preference IS acknowledged in the rec text. However, the patient report does NOT show a CPAP context box for "prefers to avoid" — only the 4 CPAP history states (failed-refused, failed-retry, current, avoid) generate context boxes. Test 11's patient report should show the "We understand your preference" context box.

**Current behavior confirmed:** `prefAvoidCpap: true` and positional therapy is first rec, CPAP is second. The ordering is correct (alternatives before CPAP), but the patient report context box is missing.

**Recommendation:** Verify patient report CPAP context box logic for `prefAvoidCpap` patients who have never tried CPAP.

---

### Minor Issues

#### 7. Nadir SpO₂ display anomaly in clinician report
**Severity:** 🟢 Minor
**Observation:** Edge-9 (HB boundary test) showed "Nadir SpO₂ 99%" in the clinician report key numbers. This happens because no nadir value was entered in the test input — the display defaults to the `nadir ?? 100` fallback in the confidence function (line 83), then the key numbers grid shows whatever `nadir` variable resolves to. When nadir is not entered, the key numbers section should either omit the metric or show "—".

**Recommendation:** Only display nadir in key numbers when `exists(nadir)` is true (it may already be gated — this may be test-runner artifact).

---

#### 8. MAD score doesn't account for prior MAD failure
**Severity:** 🟢 Minor
**Tests affected:** 18, Edge-10
**Reviewers:** SS

**Finding:** The MAD candidacy score for Test 18 (prior MAD failed) is `score: 4, tier: "favorable"`. While the `priorMAD` flag correctly routes to the "reassess" rec and suppresses MAD descriptions in the patient report, the **MAD score itself** doesn't account for prior failure. A patient who already failed MAD showing "favorable" on the MAD score is confusing for clinicians.

**Recommendation:** Either suppress MAD score display when `priorMAD` is true, or add a note: "Prior MAD trial — score reflects profile suitability, not accounting for prior experience."

---

#### 9. "Surgical correction of correctable airway blockage" always appears
**Severity:** 🟢 Minor
**Tests affected:** Most tests
**Reviewers:** SS

**Finding:** The generic `SURG` rec ("Surgical correction of correctable airway blockage") appears for almost every patient, including mild OSA with no anatomical findings (Test 27: BMI 26, no phenotypes, AHI 10). For patients without clear surgical targets, this rec adds noise.

**Recommendation:** Consider gating `SURG` on anatomical phenotype presence, or Friedman stage, or DISE findings, rather than including it as a default for all AHI ≥5 patients.

---

## Phenotype-by-Phenotype Assessment

### 1. High Anatomical Contribution
**Detection:** 3/5 flags from BMI ≥30, neck M≥17/F≥16, tonsils ≥3, FTP III/IV, AHI ≥30.
**SMP:** Appropriate criteria. The 3/5 threshold prevents false positives from a single flag.
**SS:** Correctly auto-calculates Friedman Stage from FTP + tonsils + BMI. Stage I triggers strong tonsillectomy rec. Stage III suppresses UPPP and redirects to tongue base/HNS/MMA. ✅
**CR:** Confidence function uses higher thresholds (BMI ≥35, neck M≥17.5/F≥16.5) for high confidence. ✅
**Issue:** Triggers at AHI <5 — see Critical Issue #2.

### 2. Low Arousal Threshold
**Detection:** ISI ≥15 OR ArI/AHI ratio >1.3.
**SMP:** ISI ≥15 as proxy for low ArTH is well-supported (insomnia correlates with arousal instability). The ArI/AHI ratio >1.3 is from Eckert 2013. ✅
**CR:** Edwards ArTH score (AHI <30, nadir >82.5%, F(hyp) >58.3%) is correctly implemented as supplemental clinician information (not a trigger). Score ≥2 = 84% accuracy per Edwards 2014. ✅
**Issue:** Triggers at AHI <5 and pre-study — see Critical Issue #1.

### 3. High Loop Gain
**Detection:** CSR ≥10% OR pAHIc3 ≥10 OR pAHIc4 ≥5.
**SMP:** CVD correctly excluded as standalone trigger (modifier only). ASV LVEF >45% guardrail present in both rec text and clinician guardrails. ✅
**CR:** Schmickl 2022 model (`LG = 0.50 + 0.0016×AHI − 0.0019×F(hyp)`) correctly implemented and displayed when PSG apnea/hypopnea indices available. AUC 0.73 for LG >0.7 cited correctly. ✅
**Edge-6:** CSR 9% + CVD correctly does NOT trigger loop gain. CVD only modifies confidence when loop gain is already triggered. ✅

### 4. Poor Muscle Responsiveness
**Detection:** AHI ≥30 AND REM/NREM ratio >2.0.
**SMP:** Correctly recommends Inspire for CPAP-failed patients with this phenotype ("electrical stimulation bypasses failed muscle activation"). ✅
**CR:** ⚠️ The AHI ≥30 requirement is **more restrictive than the PALM literature suggests**. Eckert 2013 identified poor muscle responsiveness at varying AHI levels. The threshold means this phenotype never triggers for mild-moderate OSA, even when REM/NREM ratios clearly indicate muscle dysfunction. Consider lowering to AHI ≥15 to match the clinical reality that REM-dominant muscle collapse can be relevant at moderate severity.

### 5. Positional OSA
**Detection:** Sup/Non-sup ratio >2.0 AND non-sup AHI <15. Gated on AHI ≥5. ✅
**SMP:** Correctly has severity guardrail: AHI ≥30 triggers "positional therapy alone may be insufficient." ✅
**SS:** Correctly generates positional therapy rec. At severe AHI, recommends combining with MAD or surgery. ✅
**CR:** Thresholds from Cartwright 1984, Mador 2005. High confidence at ratio ≥3.0 AND non-sup <10. ✅
**Edge-1:** Correctly suppressed at AHI 4.9 (gate at AHI ≥5). ✅

### 6. REM-Predominant OSA
**Detection:** REM/NREM ratio >2.0 AND NREM AHI <15. Gated on AHI ≥5. ✅
**SMP:** Correctly recommends verifying treatment efficacy during REM. ✅
**CR:** Thresholds from Mokhlesi 2014. Previously triggered at AHI <5 (old test results) — now correctly gated. ✅
**Edge-1:** Correctly suppressed at AHI 4.9. ✅

### 7. High Hypoxic Burden
**Detection:** Composite — ANY of HB ≥30, ODI ≥20, nadir <75, T90 ≥5%, Area<90 >0.5.
**SMP:** Three-tier treatment allocation (moderate 30-73, high ≥73/ISAACC, very-high ≥87/pooled 2025) correctly implemented. The HB <73 alternatives-first approach and patient report "good options beyond CPAP" messaging is excellently evidence-based per Pinilla 2023 and Peker 2025. ✅
**CR:** Confidence function correctly: HB ≥73 = High confidence, 30-73 = Moderate, <30 = Low. Nadir only triggers at severe level (<75%) per Azarbarzin 2019. ODI as strongest correlator (r=0.73) is reflected in its independent trigger role. ✅
**Edge-9:** HB 72 = Moderate confidence, HB 73 = High confidence (ISAACC threshold). Boundary correctly handled. ✅

### 8. Nasal-Resistance Contributor
**Detection:** NOSE ≥25 OR nasalObs OR ctSeptum OR ctTurbs.
**SS:** Correctly accounts for prior nasal surgery (NASAL-PRIOR rec) and prior sinus surgery (NASAL-SINUS-PRIOR rec). CT-confirmed structural findings correctly add NASAL-SURG rec. ✅
**CR:** NOSE ≥25 threshold from Stewart 2004. High confidence at ≥50 or ≥25+CT. Low confidence at ≥15 (borderline). ✅

### 9. Elevated Delta Heart Rate
**Detection:** ΔHR ≥10 bpm. Confidence: ≥15 High, ≥10 Moderate, ≥7 Low.
**SMP:** ΔHR + HB synergy (HR 3.50 for fatal CVD, Azarbarzin 2021) is implemented in the clinician report. Cardiology coordination correctly triggered for high ΔHR + CVD. ✅
**CR:** Manual entry enforced (correctly NOT derived from pulse rate Max-Mean). Thresholds from Azarbarzin 2021. ✅

---

## Threshold Validation Summary

| Phenotype | Config Value | Citation | Alignment |
|-----------|-------------|----------|-----------|
| Anatomical BMI | ≥30 | WHO obesity class I | ✅ Correct |
| Anatomical neck | M≥17 / F≥16 | Friedman 2002 | ✅ Correct |
| Anatomical minCriteria | 3 of 5 | Clinical judgment | ✅ Reasonable |
| Arousal ISI | ≥15 / ≥22 | Morin 2011 cutoffs | ✅ Correct |
| Arousal ArI/AHI | >1.3 / >1.8 | Eckert 2013 | ✅ Correct |
| Loop Gain CSR | ≥10% / ≥20% | Javaheri 2017 | ✅ Correct |
| Loop Gain pAHIc3 | ≥10 / ≥20 | WatchPAT-derived | ✅ Reasonable |
| Muscle Response AHI min | ≥30 | PALM (Eckert 2013) | ⚠️ Consider ≥15 |
| Muscle Response REM/NREM | >2.0 / >2.5 | Clinical consensus | ✅ Correct |
| Positional ratio | >2.0 / >3.0 | Cartwright 1984 | ✅ Correct |
| Positional non-sup max | <15 / <10 | Mador 2005 | ✅ Correct |
| REM-predominant ratio | >2.0 / >3.0 | Mokhlesi 2014 | ✅ Correct |
| REM-predominant NREM max | <15 / <10 | Mokhlesi 2014 | ✅ Correct |
| HB area/hr moderate | ≥30 | Azarbarzin 2019 | ✅ Correct |
| HB area/hr high (ISAACC) | ≥73 | Pinilla 2023 | ✅ Correct |
| HB area/hr very high | ≥87 | Azarbarzin 2025 | ✅ Correct |
| ODI moderate/severe | ≥20 / >50 | Azarbarzin 2019 | ✅ Correct |
| T90 moderate/severe | ≥5% / >20% | Oldenburg 2016 | ✅ Correct |
| Nadir severe-only | <75% | Azarbarzin 2019 | ✅ Correct |
| DHR trigger | ≥10 bpm | Azarbarzin 2021 | ✅ Correct |
| DHR high | ≥15 bpm | Azarbarzin 2021 | ✅ Correct |
| Nasal NOSE | ≥25 / ≥50 | Stewart 2004 | ✅ Correct |
| HNS AHI range | 15-100 | FDA/STAR/ADHERE | ✅ Correct |
| HNS BMI max | ≤40 | FDA | ✅ Correct |
| HNS neck thresholds | F>14 / M>16 | Ji 2026 | ✅ Correct |
| COMISA | ISI ≥15 + AHI ≥5 | Sweetman 2019 | ✅ Correct |
| Severity mild/mod/sev | 5 / 15 / 30 | AASM standard | ✅ Correct |

---

## Regression Check: Previously Known Issues

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Pre-study patients get treatment recs (Tests 1,2,14) | ⚠️ Partially fixed | Patient report is fixed (Test 1 correctly shows only NASAL-OPT + SLEEP-STUDY). Clinician recTags still leak CPAP-OPT for ISI-triggered Low ArTH (Tests 2, 14). |
| 2 | Normal AHI gets phenotype/treatment recs (Test 3) | ✅ Fixed | REM-predominant correctly suppressed at AHI <5. No phenotypes, no recs for Test 3. |
| 3 | Prefers-to-avoid-CPAP not acknowledged (Test 11) | ✅ Mostly fixed | Rec text now says "discuss with patient given preference to avoid." CPAP context box in patient report may still be missing for never-tried+avoid patients. |
| 4 | Prior MAD failure not reflected (Test 18) | ⚠️ Partial | Clinician rec says "Reassess" rather than acknowledging intolerance. Patient report correctly suppresses MAD descriptions. |
| 5 | Missing Inspire checklist item (Test 24) | ✅ Requires verification | INSPIRE-EVAL tag is generated. Checklist rendering depends on patient report logic. |

---

## Clinical Strengths (What the Tool Gets Right)

1. **HB-guided treatment allocation** is state-of-the-art. The three-tier system (moderate/high/very-high) with differentiated CPAP messaging is evidence-based and clinically nuanced. The alternatives-first approach for mild OSA + low HB per Pinilla 2023 is excellent.

2. **COMISA handling** is best-in-class. CBT-I is correctly prioritized first, APAP preferred over fixed CPAP, sleepy-COMISA sleep restriction caution is present, and the patient report COMISA callout is clear and actionable.

3. **MAD candidacy scoring** is comprehensive. The 12+ factor system (severity, BMI, sex, neck, positional, REM, loop gain, HB, retrognathia, hypopnea fraction, age) with evidence citations for each factor is impressive.

4. **Patient report quality** is outstanding. Phenotype descriptions are accurate and accessible. The CPAP context boxes correctly adapt to 4 patient states. The "Why This Matters" section for severe cases with HB data is compelling. The "What If" scenarios are motivational without being misleading.

5. **Friedman staging + HNS Ji 2026 staging** are correctly implemented with automatic calculation and appropriate surgical routing.

6. **Sleep study quality flags** are comprehensive (TST, AHI-RDI discrepancy, missing REM, central apnea component, CSR inconsistency, missing positional data).

7. **CVD correctly handled as confidence modifier only** for loop gain — not a standalone trigger. This was a prior issue that is now properly resolved.

---

## Prioritized Action Items

### Must Fix
1. **Gate phenotype treatment mapping on AHI ≥5** — Prevent CPAP-OPT, WEIGHT, SURGALT, and other treatment recs from appearing for pre-study and normal-AHI patients. The `forEach` at line 702 should check `exists(ahi) && ahi >= 5`.
2. **Suppress High Anatomical Contribution treatment recs at AHI <5** — Detecting anatomical crowding is fine, but generating CPAP/surgery recs at normal AHI is inappropriate.

### Should Fix
3. **Add `cpapWillRetry` branch to core recommendations** (lines 909-917) — Match the retry-aware messaging in `cpapRec()`.
4. **Gate `INSPIRE-EVAL` on `!hasConcentricCollapse`** — Don't recommend Inspire evaluation when CCC is confirmed.
5. **Differentiate prior MAD intolerance from suboptimal** — Adjust clinician rec language when prior MAD is marked.

### Consider
6. **Lower Poor Muscle Responsiveness AHI threshold to ≥15** — The PALM literature supports detection at moderate AHI levels.
7. **Gate generic `SURG` rec on anatomical findings** — Reduce noise for mild/moderate patients without anatomical phenotype.
8. **Suppress MAD score display when `priorMAD` is true** — Avoid confusing "favorable" score for prior MAD failure.
9. **Verify patient report CPAP context box for `prefAvoidCpap` never-tried patients**.

---

*This review was conducted by evaluating 41 test scenarios (31 matrix + 10 edge cases), inspecting 4 patient reports, cross-referencing all thresholds against 68 citations in `docs/citations.md`, and reviewing the complete clinical logic in `js/app.js` (1569 lines) and `js/config.js` (209 lines).*
