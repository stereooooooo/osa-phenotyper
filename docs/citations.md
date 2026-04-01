# OSA Phenotyper — Evidence Citations

**Purpose:** Track all clinical evidence used in the phenotyping logic, treatment recommendations, and decision-support algorithms. This document should be updated whenever new evidence is incorporated.

**Last updated:** 2026-04-01

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
| MAD responder phenotype meta-analysis (BMI, neck, age, sex) | Camañes-Gonzalvo S, et al. "Comparison of Phenotypic Characteristics Between Responders and Non-Responders." *Sleep Med Rev.* 2022;64:101644. | MAD scoring: BMI, neck, severity, age factors. Responders younger by 3-4.5 yrs, BMI 1.5-2.8 lower, neck 1-1.5cm smaller |
| MAD responder phenotype (craniofacial, BMI, severity) | Chen H, et al. "Phenotypes of Responders to MAD Therapy." *Sleep Med Rev.* 2020;49:101229. | MAD scoring factors; retracted maxilla/mandible, shorter soft palate predict response |
| Pharyngeal collapsibility + tongue position predicts 83% AHI reduction | Marques M, et al. "Structure and Severity of Pharyngeal Obstruction Determine Oral Appliance Efficacy." *J Physiol.* 2019;597(22):5399-5410. | Rationale for anatomical factors in MAD scoring |
| Loop gain predicts MAD response | Edwards BA, et al. "Upper-Airway Collapsibility and Loop Gain Predict Response to Oral Appliance Therapy." *Am J Respir Crit Care Med.* 2016;194(11):1413-1422. | High loop gain = -1 in MAD score |
| PSG phenotypes predict MAD response: positional, hypopnea-predominant, NREM, lower T90 | Camañes-Gonzalvo S, et al. "Polysomnographic Phenotypes: Predictors of Treatment Response." *Eur Arch Otorhinolaryngol.* 2025;282(1):435-449. | Positional OSA = +1; REM-predominant = -1; hypopnea-predominant = +1 (when PSG data); high HB = -1 |
| Retrognathia and mandibular retrusion predict MAD response | Hamza A, et al. "Clinical and Craniofacial Predictors of OAT Outcomes." *Sleep Med.* 2026;142:108868. | Retrognathia = +1 in MAD score; female sex = greater AHI reduction |
| MAD achieves similar QoL/BP outcomes as CPAP | Sharples LD, et al. "Meta-Analysis of RCTs of MADs and CPAP." *Sleep Med Rev.* 2016;27:108-24. | Patient report MAD description |
| MAD vs CPAP comparative efficacy | Dipalma G, et al. "Comparative Efficacy of CPAP and MADs." *J Sleep Res.* 2025;:e70192. | CPAP more effective at AHI reduction but MAD similar patient-centered outcomes |
| Follow-up sleep study essential for MAD | Lastra AC, et al. "Diagnosis and Treatment of OSA." *JAMA Intern Med.* 2025;:2837455. | Follow-up study noted in MAD rec; MAD custom-fitted starting at ~50% max advancement |
| JACC state-of-the-art: MAD for OSA across all severities | Javaheri S, et al. "Treatment of OSA and Its Impact on CV Disease, Part 2." *J Am Coll Cardiol.* 2024;84(13):1224-1240. | AASM suggests MADs across severity range; CPAP remains more efficacious at AHI reduction |
| ERS non-CPAP therapies: MAD for mild-moderate (Level A) | Marklund M, et al. "Non-CPAP Therapies in OSA: MAD Therapy." *Eur Respir J.* 2012;39(5):1241-7. | MAD recommended for mild-to-moderate; custom titratable device, start at 50% max advancement |
| ACP clinical guideline: MAD alternative to CPAP | Qaseem A, et al. "Management of OSA in Adults." *Ann Intern Med.* 2013;159(7):471-83. | MAD as alternative for CPAP-averse patients (weak recommendation, low-quality evidence) |
| MAD side effects and monitoring | Mohammadieh AM, et al. "Mandibular Advancement Splint Therapy." *Adv Exp Med Biol.* 2022;1384:373-385. | TMJ discomfort, hypersalivation, tooth pain, occlusal changes — dental monitoring required |

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
| Current FDA Inspire indication expansion (AHI 15-100, BMI ≤40, PAP/BiPAP intolerance required) | U.S. Food and Drug Administration. "Inspire Upper Airway Stimulation – P130008/S090." Approved June 8, 2023. | Hard HGNS gating: AHI 15-100, BMI ceiling 40, documented PAP failure/intolerance required, CCC remains exclusion |
| Concentric palatal collapse = HNS contraindication | Strollo PJ, et al. "Upper-Airway Stimulation for OSA." *N Engl J Med.* 2014;370(2):139-49. | DISE check: concentric collapse → HNS contraindicated |
| HNS evaluation criteria and outcomes | Kent DT, et al. "Evaluation of HNS Treatment in OSA." *JAMA Otolaryngol.* 2019;145(11):1044-1052. | HNS recommendation logic |
| Endotypic predictors of HGNS response | Op de Beeck S, Wellman A, Dieltjens M, et al. "Endotypic Mechanisms of Successful Hypoglossal Nerve Stimulation for OSA." *Am J Respir Crit Care Med.* 2021;203(6):746-755. | Higher arousal threshold and higher muscle compensation predict HGNS response; low ArTH / low muscle compensation are cautionary, not favorable |

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
| PALM phenotyping framework (Pcrit, arousal threshold, loop gain, muscle responsiveness) | Eckert DJ, et al. "Defining Phenotypic Causes of OSA." *Am J Respir Crit Care Med.* 2013;188(8):996-1004. | Core 4-phenotype framework; PALM Scale 2 IQR 19-56 supports muscle responsiveness detection at moderate AHI |
| Polysomnographic endotyping — muscle compensation validated at AHI ≥15 | Sands SA, et al. "Phenotyping Pharyngeal Pathophysiology using Polysomnography in Patients with OSA." *Am J Respir Crit Care Med.* 2018;197(9):1187-1197. | Supports lowering Poor Muscle Responsiveness threshold from AHI≥30 to AHI≥15 |
| MAD response predicted by muscle compensation at moderate AHI | Bamagoos AA, et al. "Dose-dependent effects of mandibular advancement on upper airway collapsibility and muscle function in OSA." *Sleep.* 2019;42(6):zsz049. | Clinical relevance of muscle responsiveness at AHI≥20; weaker compensation → better MAD response |
| Sleep-stage-dependent Pcrit and muscle activity | Carberry JC, et al. "Upper Airway Collapsibility and Pharyngeal Dilator Muscle Activity are Sleep Stage Dependent." *Sleep.* 2016;39(3):511-521. | Physiological basis for REM/NREM ratio as muscle responsiveness surrogate |
| Low arousal threshold identification without invasive testing | Edwards BA, et al. "Clinical Predictors of the Respiratory Arousal Threshold in OSA." *Am J Respir Crit Care Med.* 2014;190(11):1293-1300. | Edwards score drives low-ArTH phenotype detection; WatchPAT uses partial score when hypopnea fraction unavailable, PSG uses full 3-variable score |
| Positional OSA definition (supine/non-supine ratio >2, non-supine AHI <15) | Cartwright RD. "Effect of Sleep Position on Sleep Apnea Severity." *Sleep.* 1984;7(2):110-4. | Positional OSA phenotype criteria |
| REM-predominant OSA (REM/NREM ratio >2, NREM AHI <15) | Mokhlesi B, et al. "REM-Related OSA: Prevalence and Clinical Significance." *Sleep.* 2014;37(11):1883-1891. | REM-predominant phenotype criteria |

## Weight Management

| Feature | Citation | How Used |
|---------|----------|----------|
| Tirzepatide FDA approval for moderate-severe OSA in adults with obesity | U.S. Food and Drug Administration. "FDA Approves First Medication for Obstructive Sleep Apnea." December 20, 2024. | Patient-facing GLP-1/Zepbound mention is gated to BMI ≥30 rather than generic weight counseling |
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
| Edwards ArTH clinical score (AHI <30, nadir >82.5%, hypopnea fraction >58.3%) | Edwards BA, et al. "Clinical Predictors of the Respiratory Arousal Threshold." *Am J Respir Crit Care Med.* 2014;190(11):1293-300. | Edwards ArTH Score: 2/3 variables from WatchPAT, full 3/3 from Lab PSG with apnea/hypopnea indices. Score ≥2 = 84% accuracy for low ArTH |
| Automated ArTH quantification from PSG | Sands SA, et al. "Quantifying the Arousal Threshold Using Polysomnography." *Sleep.* 2018;41(1):zsx183. | Reference for PUP method (R=0.79 vs esophageal pressure) |
| ArTH reliability across nights (ICC 0.83-0.90) | Strassberger C, et al. "Night-to-Night Variability of PSG-Derived Endotypic Traits." *Chest.* 2023;163(5):1266-1278. | Validates reliability of ArTH estimation |
| ArTH reliability in elderly (ICC 0.83-0.90) | Tolbert TM, et al. "Night-to-Night Reliability of OSA Pathophysiologic Mechanisms." *Sleep.* 2023;46(8):zsad058. | Confirms ArTH reproducibility |
| Low ArTH predicts poor CPAP adherence (62% lower) | Zinchuk A, et al. "Low Respiratory Arousal Threshold Among Male Veterans With OSA." *J Clin Sleep Med.* 2018;14(5):809-817. | Clinician awareness: low ArTH patients may need MAD/sedative-hypnotics over CPAP |
| Low ArTH unfavorable shift in PAP compliance over time | Wu H, et al. "Low Arousal Threshold Is Associated With Unfavorable Shift of PAP Compliance." *Sleep Breath.* 2021;25(2):887-895. | Supports alternatives-first approach for low ArTH patients |

## Loop Gain

| Feature | Citation | How Used |
|---------|----------|----------|
| High loop gain predicts residual OSA on PAP (OR 2.17-3.31) | Eschbach E, et al. "Loop Gain Predicts Residual Sleep Apnoea Among People Using PAP." *Thorax.* 2026;:thorax-2025-223878. | Guardrail: monitor for treatment-emergent centrals on PAP |
| Breath-holding to estimate loop gain (AUC 0.92) | Messineo L, et al. "Breath-Holding as a Means to Estimate Loop Gain." *J Physiol.* 2018;596(17):4043-4056. | Reference for clinic-based LG assessment |
| Point-of-care LG prediction model (r=0.48, AUC 0.73) | Schmickl CN, et al. "Point-of-Care Prediction Model of Loop Gain." *BMC Pulm Med.* 2022;22(1):158. | Primary high-loop-gain estimate when apnea/hypopnea indices are available: LG = 0.0016×AHI − 0.0019×Hyp% |
| LG quantification from PSG (correlation with CPAP dial-down r=0.63) | Terrill PI, et al. "Quantifying the Ventilatory Control Contribution to Sleep Apnoea." *Eur Respir J.* 2015;45(2):408-18. | Reference for PUP-estimated loop gain |
| Self-similarity for periodic breathing detection (AUC 0.82-0.85) | Oppersma E, et al. "Algorithm for Automatic Detection of Self-Similarity." *Sleep.* 2021;44(4):zsaa215. | Reference: automated LG detection from RIP signals |
| CPAP-associated acute respiratory instability prediction | Nassi TE, et al. "Morphological Prediction of CPAP Associated Acute Respiratory Instability." *Ann Am Thorac Soc.* 2024. | Central / periodic-breathing markers are supportive signals only when full LG estimate is unavailable; not used as standalone trigger |
| Automated LG from RIP signals (dynamical modeling) | Nassi T, et al. "Unravelling Sleep Apnea Dynamics: Quantifying Loop Gain Using Dynamical Modelling." *Sleep.* 2025;:zsaf213. | Reference: fully automated LG estimation (future) |
| Scalable PUP endotype estimation (PUPpy) | Finnsson E, et al. "A Scalable Method of Determining Physiological Endotypes." *Sleep.* 2021;44(1):zsaa168. | Reference: cloud-based endotype estimation tool |

## Collapsibility

| Feature | Citation | How Used |
|---------|----------|----------|
| F(hypopneas) as collapsibility surrogate (r=-0.46 vs Pcrit) | Vena D, et al. "Clinical PSG Methods for Estimating Pharyngeal Collapsibility." *Sleep.* 2022;45(6):zsac050. | F(hyp) <50% → high collapsibility displayed on clinician report when PSG apnea/hypopnea indices entered |
| Discriminating collapsibility severity (AUC 0.96 score) | Genta PR, et al. "Discriminating the Severity of Pharyngeal Collapsibility." *J Clin Sleep Med.* 2020;16(9):1531-1537. | Reference: waist circ + NREM OAI/AHI + apnea duration + REM AHI score |
| PUP-estimated Vpassive (R=0.67 vs CPAP-derived Pcrit) | Sands SA, et al. "Phenotyping Pharyngeal Pathophysiology Using PSG." *Am J Respir Crit Care Med.* 2018;197(9):1187-1197. | Reference for PUP collapsibility estimation |

## HB Treatment Allocation

| Feature | Citation | How Used |
|---------|----------|----------|
| HB ≥73.1 %min/h: CPAP reduces CV events (HR 0.57) | Pinilla L, et al. "Hypoxic Burden to Guide CPAP Treatment Allocation." *Eur Respir J.* 2023;62(6):2300828. | Clinician report: "High HB — CPAP CV benefit" alert; HB area/hr high threshold (73) |
| HB <73.1: CPAP trend toward harm (HR 1.33, NS) | Same Pinilla 2023 (ISAACC) | Low HB clinician caution note; mild OSA alternatives-first pathway |
| Low HB: comparable outcomes with CPAP vs alternatives | Same Pinilla 2023 | Patient report: alternatives before CPAP; "good options beyond CPAP" context box |
| HB ≥87.1 %min/h: high-risk OSA (pooled multi-trial) | Azarbarzin A, et al. "Cardiovascular Benefit of CPAP According to High-Risk OSA." *Eur Heart J.* 2025;:ehaf447. | HB area/hr very-high threshold (87); "Very High HB" clinician alert |
| High AHI + low HB ≠ CV risk; only HB predicts MACCEs | Peker Y, et al. "Hypoxic Burden Is Associated With CV Events: RICCADSA Cohort." *Chest.* 2025;:S0012-3692(25)05023-8. | Moderate OSA + low HB clinician note; validates alternatives-first approach |
| ΔHR + HB synergy: HR 3.50 for fatal CVD | Azarbarzin A, et al. "Sleep Apnea-Specific Pulse-Rate Response Predicts CV Morbidity and Mortality." *Am J Respir Crit Care Med.* 2021;203(12):1546-1555. | Composite ΔHR + HB CV risk flag in clinician report |
| ΔHRoxi derivable from pulse oximetry | Blanchard M, et al. "Heart Rate Response and CV Risk During OSA." *Eur Respir J.* 2025;65(5):2401883. | Future: automated ΔHR from oximetry (not yet implemented) |
| HB predicts major adverse CV events (HR 1.21) | Trzepizur W, et al. "Sleep Apnea-Specific Hypoxic Burden and Risk of CV Events." *Am J Respir Crit Care Med.* 2022;205(1):108-117. | HB severity tiering rationale |
| ATS 2025: endotype triage framework | Tolbert TM, et al. "Translating Endophenotyping of Adult OSA to the Clinic." *Am J Respir Crit Care Med.* 2025;211(9):1562-1583. | ATS triage note; future: hierarchical endotype assessment |
| Stepwise endotype-guided combination therapy (95% success) | Aishah A, et al. "Stepwise Targeted Combination Therapy for OSA." *Ann Am Thorac Soc.* 2023;20(9):1316-1325. | Reference only (proof-of-concept, not yet clinical standard) |

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
| Stepwise endotype-guided combination therapy (95% AHI<10 without CPAP) | Aishah A, et al. "Stepwise Add-on and Endotype-Informed Targeted Combination Therapy." *Ann Am Thorac Soc.* 2023;20(9):1316-1325. | Reference only: proof-of-concept for precision OSA treatment |

## HBOxi & Automated Endotype Methods

| Feature | Citation | How Used |
|---------|----------|----------|
| Automated HBOxi from SpO₂ (r=0.81 vs manual HB) | Esmaeili N, et al. "Hypoxic Burden Based on Automatically Identified Desaturations." *Ann Am Thorac Soc.* 2023;20(11):1633-1641. | Reference: validates automated HB without manual scoring |
| ΔHRoxi from pulse oximetry (HR 1.42-1.72 for MACEs) | Blanchard M, et al. "Heart Rate Response and CV Risk During OSA." *Eur Respir J.* 2025;65(5):2401883. | Reference: automated ΔHR derivation (future). Currently manual entry only from WatchPAT/PSG |
| Deep learning arousal detection from ECG (AUC 0.93) | Li A, et al. "A Deep Learning-Based Algorithm for Detection of Cortical Arousal." *Sleep.* 2020;43(12):zsaa120. | Reference: future automated arousal detection |
| Arousal detection from RIP signals (ICC 0.74) | Finnsson E, et al. "Detecting Arousals and Sleep From Respiratory Inductance Plethysmography." *Sleep Breath.* 2025;29(2):155. | Reference: future automated arousal detection from HST signals |

## CPAP Limitations & Cautions

| Feature | Citation | How Used |
|---------|----------|----------|
| Mild OSA: limited clinical relevance of CPAP | McNicholas WT, et al. "Mild OSA: Clinical Relevance and Approaches to Management." *Lancet Respir Med.* 2016;4(10):826-834. | Supports alternatives-first approach for mild OSA |
| TECSA pathophysiology and risk factors | Zeineddine S, Badr MS. "Treatment-Emergent Central Apnea: Physiologic Mechanisms." *Chest.* 2021;159(6):2449-2457. | Reference for TECSA risk in high loop gain patients |
| TECSA trajectories on CPAP (resolves in most, persists in ~5%) | Liu D, et al. "Trajectories of Emergent Central Sleep Apnea During CPAP Therapy." *Chest.* 2017;152(4):751-760. | Guardrail: monitor for treatment-emergent centrals on CPAP |
| TECSA management (ASV, adaptive servo) | Morgenthaler TI, et al. "NIV Medicare Access: Central Sleep Apnea Technical Expert Panel." *Chest.* 2021;160(5):e419-e425. | Reference: CSA/TECSA treatment pathways |
| TECSA review and classification | Zhang J, et al. "Treatment-Emergent Central Sleep Apnea: A Unique Sleep-Disordered Breathing." *Chin Med J.* 2020;133(22):2721-2730. | Reference: TECSA phenotyping |
| AHA scientific statement: OSA and CV disease | Yeghiazarians Y, et al. "OSA and Cardiovascular Disease." *Circulation.* 2021;144(3):e56-e67. | CV risk framing; HB should be incorporated into trial designs |
| ATS/AHA consensus: CPAP for CV risk benefit controversy | Cohen O, et al. "The Great Controversy of OSA Treatment for CV Risk Benefit." *Ann Am Thorac Soc.* 2024. | Context for nuanced CPAP recommendation; HB-guided treatment allocation |
| RICCADSA: HB predicts CV events, AHI alone does not | Peker Y, et al. "Hypoxic Burden Is Associated With CV Events: RICCADSA Cohort." *Chest.* 2025. | High AHI + low HB ≠ CV risk; validates HB-guided approach |
| Multi-trial pooled: CPAP CV benefit in high-risk OSA (HB≥87) | Azarbarzin A, et al. "CV Benefit of CPAP According to High-Risk OSA." *Eur Heart J.* 2025;:ehaf447. | HB ≥87 threshold for very high CV risk; strongest CPAP indication |
| ISAACC: HB-guided CPAP allocation; low HB trend toward harm (HR 1.33) | Pinilla L, et al. "Hypoxic Burden to Guide CPAP Treatment Allocation." *Eur Respir J.* 2023;62(6):2300828. | HB ≥73 = CPAP benefit; HB <73 = alternatives equally effective |

---

## Adding New Citations

When incorporating new clinical evidence:
1. Add the citation to the appropriate section above
2. Note the specific feature/threshold it supports in "How Used"
3. Reference the citation in code comments where the logic is implemented
4. Update the "Last updated" date at the top of this document
