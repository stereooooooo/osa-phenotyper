# Phenotype Baseline — Clinical Review

_Generated 2026-06-11 from the **live engine** across the 37 golden-master profiles (`tests/phenotype-matrix.html`). This is the **current behavior** the Phase 5 refactor is locking in. Review each entry for clinical correctness — the safety net proves behavior is *unchanged*, not *correct*. If anything here is wrong, we fix the engine and re-baseline **before** refactoring further._

`*-WORKUP` tags = a prerequisite step the engine inserts before that therapy is treated as final.

---

### 1. Pre-study snorer
**Patient:** M, BMI 28, **no sleep study yet**, ESS 10 / ISI 6, tonsils 2, FTP III, NOSE 35, nasal obstruction + snoring  
**Phenotypes:** _none_  
**Rec tags:** `SLEEP-STUDY, NASAL-OPT`

**Recommendations:**
- Schedule a sleep study to evaluate for obstructive sleep apnea.
- Nasal optimization (saline rinse, intranasal steroid, ENT evaluation) to improve nasal airflow.

### 2. Pre-study insomniac
**Patient:** F, BMI 24, **no study**, ESS 7 / ISI 20, tonsils 1, FTP II, NOSE 10  
**Phenotypes:** _none_  
**Rec tags:** `SLEEP-STUDY, CBTI`

**Recommendations:**
- Schedule a sleep study to evaluate for obstructive sleep apnea.
- Initiate CBT-I for insomnia symptoms while awaiting sleep study results.

### 3. Normal AHI
**Patient:** F, BMI 25, AHI 3 (normal), ESS 8 / ISI 5  
**Phenotypes:** _none_  
**Rec tags:** _none_


### 4. Mild positional
**Patient:** M, BMI 28, AHI 8 (supine 18 / non-supine 4), ESS 12  
**Phenotypes:** Positional OSA  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, OXYGEN-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, POS, CPAP, MAD-FAVORABLE, SURG`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Begin positional therapy (vibratory trainer, backpack/pillow strategies).
- Start CPAP/APAP
- Oral appliance therapy (MAD) — favorable candidate based on profile
- Surgical correction of correctable airway blockage

### 5. Moderate classic
**Patient:** M, BMI 32, AHI 22, ESS 16 (sleepy), no prior tx  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 6. Severe obese
**Patient:** M, BMI 38, AHI 55, nadir 78%, ODI 40, HB 45, T90 12%, tonsils 3, FTP III  
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, CPAP, SURGALT, WEIGHT, MAD-POOR, SURG`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Start CPAP/APAP (most effective for anatomical narrowing).
- If CPAP fails or not tolerated: mandibular-advancement device or site-directed surgery / Inspire®.
- Enroll in a structured weight-management program.
- Oral appliance therapy (MAD) — less likely to be sufficient as standalone treatment
- Surgical correction of correctable airway blockage

### 7. Very severe morbid
**Patient:** M, BMI 44, AHI 85, nadir 68%, ODI 60, HB 90, T90 25%, FTP IV  
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, CPAP, SURGALT, HB-URG, WEIGHT, MAD-POOR, SURG`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Start CPAP/APAP (most effective for anatomical narrowing).
- If CPAP fails or not tolerated: mandibular-advancement device or site-directed surgery / Inspire®.
- Hypoxic burden is in the high range where CPAP has shown cardiovascular benefit in trial cohorts — prioritize timely initiation of effective therapy.
- Enroll in a structured weight-management program.
- Oral appliance therapy (MAD) — less likely to be sufficient as standalone treatment
- Surgical correction of correctable airway blockage

### 8. Current CPAP user
**Patient:** M, BMI 33, AHI 30, **currently using CPAP**  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Continue CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.

### 9. CPAP failed, won't retry
**Patient:** F, BMI 31, AHI 24, ESS 17 / ISI 19 (COMISA), CPAP failed + claustrophobia, prefers alternatives  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD, CBTI, COMISA-PAP, COMISA-SRT-CAUTION`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Alternative PAP (BiPAP, ASV) if willing to reconsider
- Custom oral appliance (MAD)
- COMISA detected (ISI ≥ 15 + OSA): Initiate CBT-I BEFORE starting CPAP (Sweetman 2019 — sequential CBT-I then CPAP yields higher CPAP acceptance and adherence than concurrent start). Consider sleep psychology referral or FDA-cleared digital CBT-I (e.g., Pear Somryst). Target 4–6 sessions before CPAP initiation.
- Use APAP (not fixed CPAP) for COMISA patients — lower average delivered pressure improves comfort. Set EPR/flex to max (3 cmH₂O on ResMed), enable ramp for sleep-onset difficulty, use conservative pressure range (min 4–5, max 15–16 cmH₂O).
- Caution: High ESS + high ISI — full sleep restriction therapy is unsafe due to excessive daytime sleepiness. Use modified CBT-I (stimulus control + cognitive restructuring first; introduce sleep compression gradually rather than restriction).

### 10. CPAP failed, will retry
**Patient:** M, BMI 30, AHI 28, CPAP failed (mask), **willing to retry**  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Retry CPAP with optimized settings (patient willing). Address prior issues: mask fit.
- Custom oral appliance (MAD)

### 11. Prefers to avoid CPAP
**Patient:** M, BMI 27, AHI 12, prefers to avoid CPAP  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP, MAD, MILD-LIFESTYLE`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- CPAP/APAP (most effective option — discuss with patient given preference to avoid)
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.
- Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6–12 months before committing to device therapy.

### 12. Pure insomnia + mild OSA
**Patient:** F, BMI 24, AHI 7, ISI 22 (severe insomnia, **not** sleepy)  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP, MAD, MILD-LIFESTYLE, CBTI, COMISA-PAP`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.
- Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6–12 months before committing to device therapy.
- COMISA detected (ISI ≥ 15 + OSA): Initiate CBT-I BEFORE starting CPAP (Sweetman 2019 — sequential CBT-I then CPAP yields higher CPAP acceptance and adherence than concurrent start). Consider sleep psychology referral or FDA-cleared digital CBT-I (e.g., Pear Somryst). Target 4–6 sessions before CPAP initiation.
- Use APAP (not fixed CPAP) for COMISA patients — lower average delivered pressure improves comfort. Set EPR/flex to max (3 cmH₂O on ResMed), enable ramp for sleep-onset difficulty, use conservative pressure range (min 4–5, max 15–16 cmH₂O).

### 13. Sleepy COMISA
**Patient:** F, BMI 31, AHI 24, ESS 17 / ISI 19 (sleepy COMISA)  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD, CBTI, COMISA-PAP, COMISA-SRT-CAUTION`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD)
- COMISA detected (ISI ≥ 15 + OSA): Initiate CBT-I BEFORE starting CPAP (Sweetman 2019 — sequential CBT-I then CPAP yields higher CPAP acceptance and adherence than concurrent start). Consider sleep psychology referral or FDA-cleared digital CBT-I (e.g., Pear Somryst). Target 4–6 sessions before CPAP initiation.
- Use APAP (not fixed CPAP) for COMISA patients — lower average delivered pressure improves comfort. Set EPR/flex to max (3 cmH₂O on ResMed), enable ramp for sleep-onset difficulty, use conservative pressure range (min 4–5, max 15–16 cmH₂O).
- Caution: High ESS + high ISI — full sleep restriction therapy is unsafe due to excessive daytime sleepiness. Use modified CBT-I (stimulus control + cognitive restructuring first; introduce sleep compression gradually rather than restriction).

### 14. Insomnia, no OSA evidence
**Patient:** F, BMI 23, **no study**, ISI 24 (severe insomnia)  
**Phenotypes:** _none_  
**Rec tags:** `SLEEP-STUDY, CBTI`

**Recommendations:**
- Schedule a sleep study to evaluate for obstructive sleep apnea.
- Initiate CBT-I for insomnia symptoms while awaiting sleep study results.

### 15. Large tonsils, thin
**Patient:** M, BMI 24, AHI 18, tonsils 4, FTP I  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, NASAL-WORKUP, CPAP, MAD-FAVORABLE, SURG`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Oral appliance therapy (MAD) — favorable candidate based on profile
- Surgical correction of correctable airway blockage

### 16. Large tonsils, obese
**Patient:** M, BMI 34, AHI 35, tonsils 3, FTP II  
**Phenotypes:** High Anatomical Contribution  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, NASAL-WORKUP, CPAP, SURGALT, WEIGHT, MAD-POOR, SURG`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP (most effective for anatomical narrowing).
- If CPAP fails or not tolerated: mandibular-advancement device or site-directed surgery / Inspire®.
- Enroll in a structured weight-management program.
- Oral appliance therapy (MAD) — less likely to be sufficient as standalone treatment
- Surgical correction of correctable airway blockage

### 17. Prior UPPP
**Patient:** M, BMI 30, AHI 25, **prior UPPP**, tonsils 1, FTP III  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 18. Prior MAD failed
**Patient:** F, BMI 28, AHI 15, **prior MAD** (couldn't tolerate)  
**Phenotypes:** _none_  
**Rec tags:** `SURGERY-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, NASAL-WORKUP, CPAP, MAD, SURG`

**Recommendations:**
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Prior oral appliance trial not tolerated — consider alternative approaches (Inspire, positional therapy, surgery) rather than repeat MAD trial
- Surgical correction of correctable airway blockage

### 19. REM-predominant mild
**Patient:** F, BMI 25, AHI 12, REM 28 / NREM 8  
**Phenotypes:** REM-Predominant OSA  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, REM-CHECK, REM-MAD, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Verify treatment efficacy during REM; pressure may need to be higher in REM.
- Oral appliance therapy is a reasonable alternative/adjunct in REM-predominant OSA.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.

### 20. High loop gain
**Patient:** M, BMI 29, AHI 25, CSR 15%, pAHIc 12 (central-dominant)  
**Phenotypes:** High Loop Gain  
**Rec tags:** `MAD-WORKUP, CENTRAL-PSG-WORKUP, ASV-SAFETY, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP-FIXED, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Because the central-breathing instability was inferred from a home sleep test, confirm it on in-lab PSG before finalizing ASV or other central-directed therapy.
- If ASV is being considered, confirm LVEF is above 45% first because ASV is contraindicated in reduced ejection fraction heart failure.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Favor fixed-pressure CPAP initially; monitor for treatment-emergent central apneas.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 21. High hypoxic burden only
**Patient:** M, BMI 30, AHI 20, nadir 72%, HB 15, ODI 35  
**Phenotypes:** High Hypoxic Burden  
**Rec tags:** `MAD-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, HB-URG, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Hypoxic burden is in the high range where CPAP has shown cardiovascular benefit in trial cohorts — prioritize timely initiation of effective therapy.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 22. Nasal + positional combo
**Patient:** M, BMI 28, AHI 16, NOSE 60, supine 32 / non-supine 6, nasal obstruction  
**Phenotypes:** Positional OSA, Nasal-Resistance Contributor  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, OXYGEN-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, POS, NASAL-OPT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Begin positional therapy (vibratory trainer, backpack/pillow strategies).
- Nasal optimization (saline rinse, intranasal steroid, ENT evaluation) can improve airflow and CPAP/MAD tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.

### 23. Delta HR elevated + CVD
**Patient:** M, BMI 30, AHI 25, ΔHR 14, CVD  
**Phenotypes:** Elevated Delta Heart Rate  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, DHR-TX, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Elevated autonomic reactivity detected. Effective OSA therapy typically reduces heart rate surges. Monitor BP and CV risk factors.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 24. Good Inspire candidate
**Patient:** M, BMI 30, AHI 28, CPAP failed, interested in Inspire  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, HNS-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete the Inspire/HGNS workup with DISE and all required staging inputs before finalizing candidacy or expected response.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Alternative PAP (BiPAP, ASV) if willing to reconsider
- Custom oral appliance (MAD)

### 25. Poor Inspire (BMI)
**Patient:** M, BMI 42, AHI 72, CPAP failed, interested in Inspire  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, HNS-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete the Inspire/HGNS workup with DISE and all required staging inputs before finalizing candidacy or expected response.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Alternative PAP (BiPAP, ASV) if willing to reconsider
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.

### 26. Interested in Inspire
**Patient:** M, BMI 29, AHI 20, interested in Inspire (no CPAP trial)  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, HNS-WORKUP, NASAL-WORKUP, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete the Inspire/HGNS workup with DISE and all required staging inputs before finalizing candidacy or expected response.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 27. BMI 26 mild insomnia
**Patient:** M, BMI 26, AHI 10, ISI 12  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP, MAD, MILD-LIFESTYLE`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.
- Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6–12 months before committing to device therapy.

### 28. BMI 29.9
**Patient:** M, BMI 29.9, AHI 15  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 29. AHI exactly 5
**Patient:** M, BMI 28, AHI 5 (boundary)  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP, MAD, MILD-LIFESTYLE`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.
- Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6–12 months before committing to device therapy.

### 30. AHI exactly 15
**Patient:** M, BMI 30, AHI 15 (boundary)  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 31. AHI exactly 30
**Patient:** M, BMI 32, AHI 30 (boundary)  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.

### 32. Edwards low ArTH, no insomnia
**Patient:** M, BMI 27, AHI 12, nadir 88%, apnea idx 3 / hypopnea idx 9, ISI 4  
**Phenotypes:** Low Arousal Threshold  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP-OPT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Optimize CPAP comfort (humidification, auto-ramp, mask fit, desensitization).
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.

### 33. REM-heavy, low NREM burden
**Patient:** M, BMI 28, AHI 22, REM 36 / NREM 8  
**Phenotypes:** REM-Predominant OSA  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, REM-CHECK, REM-MAD, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Verify treatment efficacy during REM; pressure may need to be higher in REM.
- Oral appliance therapy is a reasonable alternative/adjunct in REM-predominant OSA.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 34. Inspire interest, no PAP failure
**Patient:** M, BMI 29, AHI 24, interested in Inspire, **no prior PAP failure**  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, HNS-WORKUP, NASAL-WORKUP, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete the Inspire/HGNS workup with DISE and all required staging inputs before finalizing candidacy or expected response.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD)

### 35. Mild OSA, no oxygen metrics
**Patient:** M, BMI 28, AHI 10, no oxygen metrics entered  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, CPAP, MAD, MILD-LIFESTYLE`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.
- Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6–12 months before committing to device therapy.

### 36. Obese OSA, no anatomical phenotype
**Patient:** M, BMI 33, AHI 12, tonsils 1, FTP II, neck normal  
**Phenotypes:** _none_  
**Rec tags:** `MAD-WORKUP, SURGERY-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, SLEEP-STAGE-WORKUP, ENDOTYPE-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD-FAVORABLE, SURG, MILD-LIFESTYLE`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Complete DISE-guided surgical planning before finalizing a specific airway procedure target.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review REM/NREM staging data before concluding that REM-specific worsening is absent.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Oral appliance therapy (MAD) — favorable candidate based on profile
- Surgical correction of correctable airway blockage
- Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6–12 months before committing to device therapy.

### 37. Poor muscle responsiveness
**Patient:** M, BMI 30, AHI 40, REM 40 / NREM 18 (NREM-heavy burden)  
**Phenotypes:** Poor Muscle Responsiveness  
**Rec tags:** `MAD-WORKUP, OXYGEN-WORKUP, POSITION-WORKUP, ENDOTYPE-WORKUP, ANATOMY-WORKUP, NASAL-WORKUP, WEIGHT, CPAP, MAD`

**Recommendations:**
- Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.
- Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.
- Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.
- Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.
- Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.
- Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.
- Enroll in a structured weight-management program.
- Start CPAP/APAP
- Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.
