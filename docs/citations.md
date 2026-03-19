# OSA Phenotyper — Evidence Citations

**Purpose:** Track all clinical evidence used in the phenotyping logic, treatment recommendations, and decision-support algorithms. This document should be updated whenever new evidence is incorporated.

**Last updated:** 2026-03-20

---

## Hypoxic Burden & Composite Tiering

| Feature | Citation | How Used |
|---------|----------|----------|
| HB area/hr thresholds (30/60 %min/hr) | Azarbarzin A, et al. "The Hypoxic Burden of Sleep Apnoea Is a Strong Determinant of Cardiovascular Risk." *Eur Heart J.* 2019;40(14):1055-1063. | HB tier cutoffs: <30 low, 30-60 moderate, >60 severe |
| ODI as strongest HB correlator (r=0.73) | Same Azarbarzin 2019 + Zinchuk AV, et al. "Polysomnographic Phenotypes and Their Cardiovascular Implications." *Am J Respir Crit Care Med.* 2020;202(12):1701-1712. | ODI tier: <20 low, 20-50 moderate, >50 severe |
| T90 and cardiovascular risk (OR 2.70 mortality) | Oldenburg O, et al. "Sleep-Disordered Breathing in Heart Failure." *Eur J Heart Fail.* 2016;18(11):1265-1277. | T90 tier: <5% low, 5-20% moderate, >20% severe |
| Nadir SpO₂ (r=-0.70 with HB) | Azarbarzin 2019 | Nadir <75% = severe tier trigger |
| Ventilatory burden explains 78% of HB variation | Azarbarzin A, et al. "Relationship Between Arousal Intensity and Heart Rate Response to Arousal." *Sleep.* 2014;37(4):645-653. | Rationale for composite approach |

## COMISA (Co-Morbid Insomnia and Sleep Apnea)

| Feature | Citation | How Used |
|---------|----------|----------|
| CBT-I before CPAP for COMISA | Sweetman A, et al. "Cognitive and Behavioral Therapy for Insomnia Increases the Use of CPAP in OSA." *J Clin Sleep Med.* 2019;15(9):1365-1370. | CBT-I prioritized first for COMISA patients |
| COMISA prevalence 30-50% of OSA | Lack L, et al. "Comorbid Insomnia and Sleep Apnea." *Sleep Med Rev.* 2023;69:101767. | COMISA callout in patient report |
| Insomnia as strongest predictor of CPAP non-adherence | Sweetman 2019 | CBT-I sequencing rationale |

## MAD Candidacy Scoring

| Feature | Citation | How Used |
|---------|----------|----------|
| MAD responder phenotype meta-analysis (BMI, neck, age, sex) | Camañes-Gonzalvo S, et al. "Comparison of Phenotypic Characteristics Between Responders and Non-Responders." *Sleep Med Rev.* 2022;64:101644. | MAD scoring: BMI, neck, severity factors |
| MAD responder phenotype (craniofacial, BMI, severity) | Chen H, et al. "Phenotypes of Responders to MAD Therapy." *Sleep Med Rev.* 2020;49:101229. | MAD scoring factors |
| Pharyngeal collapsibility + tongue position predicts 83% AHI reduction | Marques M, et al. "Structure and Severity of Pharyngeal Obstruction Determine Oral Appliance Efficacy." *J Physiol.* 2019;597(22):5399-5410. | Rationale for anatomical factors in MAD scoring |
| Loop gain predicts MAD response | Edwards BA, et al. "Upper-Airway Collapsibility and Loop Gain Predict Response to Oral Appliance Therapy." *Am J Respir Crit Care Med.* 2016;194(11):1413-1422. | High loop gain = -1 in MAD score |
| Positional OSA predicts better MAD response (64% vs 36%) | Camañes-Gonzalvo S, et al. "Polysomnographic Phenotypes: Predictors of Treatment Response." *Eur Arch Otorhinolaryngol.* 2025;282(1):435-449. | Positional OSA = +1 in MAD score |
| Retrognathia predicts better MAD response | Hamza A, et al. "Clinical and Craniofacial Predictors of OAT Outcomes." *Sleep Med.* 2026;142:108868. | Retrognathia = +1 in MAD score |
| MAD achieves similar QoL/BP outcomes as CPAP | Sharples LD, et al. "Meta-Analysis of RCTs of MADs and CPAP." *Sleep Med Rev.* 2016;27:108-24. | Patient report MAD description |
| Follow-up sleep study essential for MAD | Lastra AC, et al. "Diagnosis and Treatment of OSA." *JAMA Intern Med.* 2025;:2837455. | Follow-up study noted in MAD rec |

## Friedman Staging System

| Feature | Citation | How Used |
|---------|----------|----------|
| Friedman staging (FTP + tonsils + BMI) | Friedman M, et al. "Staging of OSA/Hypopnea Syndrome." *Laryngoscope.* 2004;114(3):454-9. | Auto-calculated Friedman Stage I-IV |
| Friedman stage I predicts UPPP success (~80%) | Same Friedman 2004 | Stage I → strong tonsillectomy/UPPP rec |
| Meta-analysis: Stage I positive predictor, Stage III negative | Choi JH, et al. "Predicting Outcomes After UPPP." *Otolaryngol Head Neck Surg.* 2016;155(6):904-913. | Stage III → suppress UPPP, recommend alternatives |

## HNS (Inspire) Clinical Staging

| Feature | Citation | How Used |
|---------|----------|----------|
| Ji 2026 clinical severity staging (neck + BMI + AHI) | Ji J, et al. "Clinical Severity Staging System and Response to HNS." *JAMA Otolaryngol.* 2026;:2844563. | HNS Stage I-IV with response rate prediction (91%→38%) |
| HNS FDA criteria (AHI 15-65, BMI ≤32-35) | Hassan F, Kaplish N. "Hypoglossal Nerve Stimulator: A Novel Treatment Approach." *Chest.* 2021;160(4):1406-1412. | HNS candidacy gating |
| Concentric palatal collapse = HNS contraindication | Strollo PJ, et al. "Upper-Airway Stimulation for OSA." *N Engl J Med.* 2014;370(2):139-49. | DISE check: concentric collapse → HNS contraindicated |
| HNS evaluation criteria and outcomes | Kent DT, et al. "Evaluation of HNS Treatment in OSA." *JAMA Otolaryngol.* 2019;145(11):1044-1052. | HNS recommendation logic |

## Surgical Selection

| Feature | Citation | How Used |
|---------|----------|----------|
| SAMS trial: multilevel surgery vs medical management | MacKay S, et al. "Effect of Multilevel Upper Airway Surgery." *JAMA.* 2020;324(12):1168-1179. | Surgical recommendation rationale |
| MMA achieves ~80% AHI reduction | Gawrys B, et al. "OSA in Adults: Common Questions." *Am Fam Physician.* 2024;110(1):27-36. | MMA recommendation for skeletal candidates |
| DISE improves surgical success (51→86%) | Huntley C, et al. "Preoperative DISE Improves Surgical Approach." *Ann Otol Rhinol Laryngol.* 2017;126(6):478-482. | DISE-guided surgical routing |
| AASM surgical referral guidelines | Kent D, et al. "Referral of Adults With OSA for Surgical Consultation." *J Clin Sleep Med.* 2021;17(12):2499-2505. | Surgical referral criteria |

## OSA Phenotyping (Core Algorithm)

| Feature | Citation | How Used |
|---------|----------|----------|
| PALM phenotyping framework (Pcrit, arousal threshold, loop gain, muscle responsiveness) | Eckert DJ, et al. "Defining Phenotypic Causes of OSA." *Am J Respir Crit Care Med.* 2013;188(8):996-1004. | Core 4-phenotype framework |
| Low arousal threshold identification without invasive testing | Edwards BA, et al. "Clinical Predictors of the Oxygen Desaturation Index and AHI in OSA." *Eur Respir J.* 2016;48(1):142-150. | Arousal threshold phenotype detection |
| Positional OSA definition (supine/non-supine ratio >2, non-supine AHI <15) | Cartwright RD. "Effect of Sleep Position on Sleep Apnea Severity." *Sleep.* 1984;7(2):110-4. | Positional OSA phenotype criteria |
| REM-predominant OSA (REM/NREM ratio >2, NREM AHI <15) | Mokhlesi B, et al. "REM-Related OSA: Prevalence and Clinical Significance." *Sleep.* 2014;37(11):1883-1891. | REM-predominant phenotype criteria |

## Weight Management

| Feature | Citation | How Used |
|---------|----------|----------|
| GLP-1 agonists (tirzepatide) for OSA weight loss | Multiple emerging RCTs 2024-2025 | Zepbound/tirzepatide mentioned in weight management rec |
| 10% weight loss → meaningful AHI reduction | Peppard PE, et al. "Longitudinal Study of Moderate Weight Change and SDB." *JAMA.* 2000;284(23):3015-21. | Weight loss what-if projection (30% AHI reduction) |

## UARS (Upper Airway Resistance Syndrome)

| Feature | Citation | How Used |
|---------|----------|----------|
| UARS identification via RDI/AHI discrepancy | Guilleminault C, et al. "Upper Airway Resistance Syndrome." *Proc Am Thorac Soc.* 2008;5(2):274-82. | UARS detection: RDI > 1.5x AHI + symptoms |
| In-lab PSG for UARS diagnosis | Same Guilleminault 2008 | Recommendation for in-lab study |

## Endotyping Framework (PALM Scale)

| Feature | Citation | How Used |
|---------|----------|----------|
| PALM scale (Pcrit, ArTH, LG, UAMR) — 4 endotypes | Eckert DJ, et al. "Defining Phenotypic Causes of OSA." *Am J Respir Crit Care Med.* 2013;188(8):996-1004. | Core phenotyping framework |
| ATS 2025 research statement — clinical translation roadmap | Tolbert TM, et al. "Research Priorities for Translating Endophenotyping." *Am J Respir Crit Care Med.* 2025;211(9):1562-1583. | ATS triage note: address collapsibility first before nonanatomic endotypes |
| Collapsibility-first triage approach | Same Tolbert 2025 | Clinician report: "address anatomy first" when both anatomic + nonanatomic endotypes present |

## Arousal Threshold

| Feature | Citation | How Used |
|---------|----------|----------|
| Edwards ArTH clinical score (AHI <30, nadir >82.5%, hypopnea fraction >58.3%) | Edwards BA, et al. "Clinical Predictors of the Respiratory Arousal Threshold." *Am J Respir Crit Care Med.* 2014;190(11):1293-300. | Edwards ArTH Score on clinician report (2/3 variables from WatchPAT) |
| Automated ArTH quantification from PSG | Sands SA, et al. "Quantifying the Arousal Threshold Using Polysomnography." *Sleep.* 2018;41(1):zsx183. | Reference for PUP method |

## Loop Gain

| Feature | Citation | How Used |
|---------|----------|----------|
| High loop gain predicts residual OSA on PAP (OR 2.17-3.31) | Eschbach E, et al. "Loop Gain Predicts Residual Sleep Apnoea Among People Using PAP." *Thorax.* 2026;:thorax-2025-223878. | Guardrail: monitor for treatment-emergent centrals on PAP |
| Breath-holding to estimate loop gain | Messineo L, et al. "Breath-Holding as a Means to Estimate Loop Gain." *J Physiol.* 2018;596(17):4043-4056. | Reference for future loop gain assessment |

## HB Treatment Allocation

| Feature | Citation | How Used |
|---------|----------|----------|
| High HB identifies CPAP cardiovascular benefit (HR 0.57) | Pinilla L, et al. "Hypoxic Burden to Guide CPAP Treatment Allocation." *Eur Respir J.* 2023;62(6):2300828. | Clinician report: "High HB — CPAP cardiovascular benefit" alert |
| Low HB: comparable outcomes with CPAP vs alternatives | Same Pinilla 2023 | Mild OSA + low HB: clinician report note that treatment allocation doesn't significantly affect outcomes; patient report reorders alternatives before CPAP; "good options beyond CPAP" context box |
| HB predicts major adverse CV events (HR 1.21) | Trzepizur W, et al. "Sleep Apnea-Specific Hypoxic Burden and Risk of CV Events." *Am J Respir Crit Care Med.* 2022;205(1):108-117. | HB severity tiering rationale |

## Symptom Clusters

| Feature | Citation | How Used |
|---------|----------|----------|
| 3 clinical phenotypes (disturbed sleep, minimally symptomatic, excessively sleepy) | Ye L, et al. "The Different Clinical Faces of OSA: A Cluster Analysis." *Eur Respir J.* 2014;44(6):1600-7. | Symptom subtype classification |
| 5-cluster international validation (SAGIC consortium) | Keenan BT, et al. "Recognizable Clinical Subtypes of OSA Across International Sleep Centers." *Sleep.* 2018;41(3):zsx214. | Expanded subtype framework reference |
| Phenotypic subtypes and precision medicine synthesis | Zinchuk A, Yaggi HK. "Phenotypic Subtypes of OSA." *Chest.* 2020;157(2):403-420. | Comprehensive phenotype review |

## DISE Evidence

| Feature | Citation | How Used |
|---------|----------|----------|
| DISE-guided surgery outcomes — systematic review | Shah SJ, et al. "Association Between DISE Findings and Surgical Outcomes." *Otolaryngol Head Neck Surg.* 2025;:ohn.70018. | DISE-guided surgical routing validation |
| DISE surgical failure predictors — meta-analysis | Qi Y, et al. "Surgical Failure Guided by DISE." *Eur Arch Otorhinolaryngol.* 2024;281(7):3333-3343. | Concentric collapse contraindication evidence |

## Endotype-Treatment Matching

| Feature | Citation | How Used |
|---------|----------|----------|
| Clinical translation of endotypes | Edwards BA, et al. "Sleep Apnea Endotypes and Their Implications for Clinical Practice." *Sleep Med.* 2025;126:260-266. | Framework for endotype → treatment mapping |
| CVD and sleep-disordered breathing review | Cowie MR, et al. "Sleep Disordered Breathing and Cardiovascular Disease: JACC Review." *J Am Coll Cardiol.* 2021;78(6):608-624. | Cardiovascular risk framing in Why This Matters section |

---

## Adding New Citations

When incorporating new clinical evidence:
1. Add the citation to the appropriate section above
2. Note the specific feature/threshold it supports in "How Used"
3. Reference the citation in code comments where the logic is implemented
4. Update the "Last updated" date at the top of this document
