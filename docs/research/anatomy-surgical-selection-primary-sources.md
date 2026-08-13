# Anatomy and surgical-selection evidence audit

**Reviewed:** 2026-08-13  
**App build reviewed:** `5964088` on `codex/precision-sleep-v1`  
**Scope:** Adult OSA surgical referral and procedure-selection logic: Friedman staging, adult tonsillectomy, palatal/pharyngeal surgery, drug-induced sleep endoscopy (DISE), nasal procedures, and maxillomandibular advancement (MMA). Hypoglossal-nerve-stimulation device labeling is discussed only where it defines a DISE requirement; the separate HGNS response audit remains authoritative for device-specific candidacy.

## Bottom line

1. **Friedman stage is procedure-specific historical context, not a general airway-localization or treatment-selection model.** Stage I is associated with better outcomes and Stage III with poorer outcomes after isolated UPPP in selected cohorts and a 2016 meta-analysis. The evidence does not show that Stage III identifies tongue-base collapse, predicts response to tongue-base surgery, or selects HGNS or MMA. The app should retain the direction of the palatal-surgery association but stop auto-routing Stage III to tongue-base surgery, HGNS, or MMA.
2. **DISE is not a universal prerequisite for all site-directed OSA surgery.** It supplies dynamic collapse information, often changes a proposed plan, and is required by current unilateral Inspire labeling to exclude complete concentric palatal collapse. However, interrater agreement is variable and evidence that DISE improves non-HGNS surgical outcomes is mixed. AASM referral guidance does not require DISE, AAO-HNS says it *may* be useful, and adult tonsillectomy trials selected visible tonsillar obstruction without a universal DISE requirement. The app should make DISE conditional on the selected procedure/device and the clinical question, while retaining it for revision or uncertain/multilevel anatomy when the clinician decides it will change management.
3. **Adult tonsillectomy has useful but selected-population evidence.** Prospective cohorts and meta-analysis support meaningful improvement in adults with enlarged tonsils, especially younger, lower-BMI patients with mild-to-moderate OSA; the TEAMUP randomized trial found modified UPPP was not more effective than tonsillectomy alone in adults with tonsil grades 2-4 and moderate-to-severe OSA at six months. These data support a tonsil-surgery consultation when tonsillar hypertrophy is a plausible dominant obstruction, not a guaranteed response and not automatic addition of expansion pharyngoplasty.
4. **Expansion pharyngoplasty and multilevel surgery require procedure-specific anatomy and counseling.** The 2007 expansion-sphincter-pharyngoplasty trial selected BMI <30, small tonsils, Friedman II/III, and lateral-wall collapse; that population is almost the opposite of the app's current Stage-I/large-tonsil trigger. The SAMS RCT supports one standardized palatal-plus-tongue operation after device-treatment failure, but it does not validate using Friedman stage or DISE to choose any individual operation.
5. **MMA is effective but cannot be selected from Friedman Stage III or DISE alone.** Meta-analysis shows large average AHI improvements, and the ERS guideline conditionally supports either MMA or CPAP based on very-low-certainty evidence. Referral should depend on a complete craniofacial/occlusal and surgical assessment, patient goals, prior treatment, operative risk, and shared decision-making. The current secondary AAFP citation should be replaced by the primary meta-analysis and ERS guideline.
6. **Nasal surgery is primarily adjunctive OSA care.** In patients with documented nasal obstruction it can improve symptoms, reduce required PAP pressure, and sometimes improve PAP use. Isolated nasal surgery generally produces little or no clinically important AHI improvement and should not become an OSA surgical-treatment rank merely because the app detects a nasal contributor.

## Evidence classification for implementation

| Decision | Classification | Appropriate app use |
|---|---|---|
| Discuss sleep-surgeon referral for an adult with OSA, BMI <40, and PAP intolerance/unacceptance | Guideline aligned (AASM 2021, strong; low certainty) | Offer a referral discussion, not a specific procedure |
| Recommend PAP first when a major upper-airway abnormality is present and PAP has not been tried | Guideline aligned (AASM 2021, conditional; low certainty) | Preserve PAP as initial therapy unless another surgical indication or clinician judgment supports earlier referral |
| Stage I supports and Stage III cautions against **isolated UPPP/palatal surgery** | Evidence informed | Display directional context with uncertainty; do not show an individual probability |
| Stage III selects tongue-base surgery, HGNS, or MMA | Unsupported extrapolation | Remove automatic routing |
| Large tonsils support adult tonsillectomy consultation | Evidence informed; selected cohorts and one RCT | Suggest procedure-specific ENT discussion, risks, residual OSA, and objective follow-up |
| Large tonsils automatically select tonsillectomy plus expansion pharyngoplasty | Unsupported | Do not bundle the procedures; expansion techniques need their own anatomy and risk assessment |
| DISE is mandatory before every site-directed surgery | Unsupported | Replace with conditional, question-driven use |
| DISE is required for current unilateral Inspire candidacy to exclude velar CCC | Device-label aligned | Retain in the device-specific pathway |
| DISE finding generates a general surgical-success score | Unsupported | Do not calculate a score or probability |
| Documented nasal obstruction supports septoplasty/turbinate evaluation | Evidence informed for obstruction and PAP facilitation | Treat the nasal indication; avoid presenting it as OSA monotherapy |
| Friedman Stage III or routine DISE selects MMA | Unsupported | Require maxillofacial/occlusal evaluation and shared decision-making |

## Primary-source findings

### 1. Friedman staging

#### What the system was designed to do

Friedman, Ibrahim, and Joseph prospectively evaluated a staging-guided surgical protocol after earlier retrospective work. The staging system uses Friedman tongue/palate position, palatine-tonsil size, and BMI. In the 2004 protocol, Stage I patients received UPPP alone; selected Stage II and III patients received UPPP plus staged radiofrequency tongue-base reduction. At six months, Stage II success increased from 37.9% in the historical UPPP-alone cohort to 74.0% in the stage-guided protocol, while overall success increased from 40% to 59.1%.[1]

The frequently quoted isolated-UPPP group rates, reproduced in the later 134-patient analysis, were 80.6% for Stage I, 37.9% for Stage II, and 8.1% for Stage III using a definition of at least 50% AHI reduction and postoperative AHI <20.[2] These are group outcomes from one center and an older UPPP technique, not calibrated probabilities for a current individual or for other procedures.

A 2016 meta-analysis of 15 UPPP studies found Stage I was a positive predictor and Stage III a negative predictor of UPPP success. It did not validate the staging system for tongue-base surgery, HGNS, MMA, expansion pharyngoplasty, or a general multilevel-surgery algorithm.[3]

#### Important limitations

- The original studies are largely from one clinical group, use older surgical techniques, and apply heterogeneous or historical controls.
- The staging system's validated target was primarily isolated UPPP response, not localization of the obstructing structure during sleep.
- Visual input reliability is limited. In a 2018 study of 12 patients rated by 14 physicians, median kappa was 0.32 for tongue position, 0.62 for tonsil size, and 0.38 for the resulting Friedman stage.[4]
- Stage III describes high tongue position plus small tonsils (with BMI <40). That combination can warn that isolated palatal surgery is less likely to work, but it does not prove tongue-base collapse and does not distinguish among tongue-base surgery, HGNS, MMA, PAP, or other care.
- Friedman Stage IV is an original BMI-based category, but a BMI boundary does not itself identify a correctable surgical target.

#### Decision consequence

Precision Sleep may state: **"Friedman Stage I anatomy is more supportive, and Stage III less supportive, of isolated palatal surgery."** It should also state that examiner variability and procedure differences limit this context. It should not infer a lower-airway target or recommend a named nonpalatal procedure from the stage.

### 2. Adult tonsillectomy and palatal/pharyngeal surgery

#### Tonsillectomy

A 2016 systematic review/meta-analysis included 17 studies and 216 adults with enlarged tonsils. Mean AHI fell from 40.5 to 14.1 events/h. Individual-patient data were available for only 54 patients; in that subset, baseline AHI <30 was associated with higher success and cure. The authors concluded that isolated tonsillectomy can be successful especially with large tonsils and mild-to-moderate OSA.[5] The small, selected, mostly uncontrolled literature and limited individual-patient sample prevent an individual response estimate.

A prospective multi-institutional study enrolled 202 adults scheduled for tonsillectomy, but only 19 adults with OSA entered the final analysis. They were young (mean 27.9 years), overweight (mean BMI 29.6), commonly Friedman Stage I, and had median tonsil size 3; mean AHI fell from 18.0 to 3.2.[6] This supports a selected tonsillar-obstruction pathway but has major selection and sample-size limitations.

The TEAMUP blinded randomized clinical trial compared tonsillectomy alone with modified UPPP in 93 adults with tonsil grades 2-4 and moderate-to-severe OSA. At six months, AHI fell 56% after tonsillectomy and 43% after modified UPPP; the between-group difference was small and not considered clinically meaningful. Modified UPPP was not more effective, and the investigators concluded that the less extensive tonsillectomy could be considered in this selected population.[7] Residual OSA was common: mean postoperative AHI remained 24.7 after tonsillectomy and 28.0 after modified UPPP.

AAO-HNS position statements describe tonsillectomy as appropriate first-line treatment for select adults when hypertrophied tonsils are the primary obstruction, but these are professional position statements rather than GRADE clinical-practice guidelines and cite mainly small observational studies.[8]

**Implementation boundary:** Visible tonsil grades 3-4, clinician judgment that tonsils are a dominant obstruction, treatment history, symptoms/severity, operative risk, and patient preference can support a tonsillectomy consultation. Neither tonsil grade nor Friedman stage should promise control. Objective postoperative testing remains important because residual OSA occurs.

#### Palatal and multilevel surgery

In a 45-patient randomized trial, expansion sphincter pharyngoplasty (ESP) outperformed traditional UPPP by the study's success definition, but enrollment required a very selected pattern: BMI <30, small tonsils, Friedman Stage II/III, Fujita type I, and lateral pharyngeal-wall collapse.[9] These data do not support appending ESP automatically to tonsillectomy in a Stage-I patient with large tonsils.

The SAMS multicenter randomized trial enrolled 102 symptomatic adults with moderate-to-severe OSA, BMI <38, and failed or refused CPAP and, when appropriate, mandibular advancement therapy. A standardized modified UPPP plus tongue radiofrequency operation reduced AHI and Epworth Sleepiness Scale more than ongoing medical management at six months. Mean AHI nevertheless remained 20.8, serious surgery-related adverse events occurred, and the authors called the trial preliminary and requested replication and longer-term safety/effectiveness data.[10] SAMS supports a carefully selected multilevel surgical option after conventional-treatment failure; it does not validate the app's specific target-selection rules.

AASM's 2021 guideline addresses **when to discuss referral**, not which operation to perform. It strongly recommends discussing sleep-surgeon referral with adults who have OSA, BMI <40, and PAP intolerance or unacceptance, but emphasizes that discussion need not result in referral and does not exclude other alternatives. It conditionally recommends PAP as initial therapy before surgical referral when major tonsillar or maxillomandibular abnormalities are present, while allowing clinician judgment and other surgical indications.[11]

### 3. DISE

#### What DISE can do

DISE can show dynamic sites, degrees, and patterns of collapse under sedation and can reveal findings not apparent on awake examination. In a 38-patient trial it changed the proposed surgical plan in 62% of cases.[12] In a larger comparison of 162 patients, agreement between DISE and awake-method plans was good for the broad choice of isolated oropharyngeal versus multilevel surgery (kappa 0.61), but agreement for specific hypopharyngeal/laryngeal structures was poor and DISE changed many lower-airway recommendations.[13]

This supports DISE when the answer is expected to change a procedure or when anatomy is uncertain, multilevel, recurrent, or previously operated. It does not establish that every change improves outcomes.

#### Reliability and outcome prediction

Reliability varies by level and scoring task. Kezirian et al.'s prospective 108-patient study reported higher agreement for presence of palatal/hypopharyngeal obstruction (kappa 0.76/0.79) than for degree (weighted kappa 0.60/0.44) or individual structures (kappa 0.42-0.71).[14] A 2024 five-rater study of 123 recordings found only fair-to-moderate agreement: VOTE kappa 0.32-0.59 and PTLTbE kappa 0.23-0.49.[15] Sedation protocol, depth, maneuver, visibility, classification, and reader training affect interpretation.

The 2019 blinded multicenter cohort included 275 adults without enlarged tonsils who underwent pharyngeal surgery after clinical DISE. Overall response was 41% by the study's stricter definition; DISE interrater kappas were 0.40-0.60 by structure. Oropharyngeal lateral-wall obstruction was associated with lower odds of response, but the selected retrospective cohort, heterogeneous operations, and treatment-confounding prevent a general response algorithm.[16]

A 2017 101-patient TORS/multilevel case series found that individual VOTE/NOHL degrees and additive scores did not predict improvement, success, or cure; multivariable DISE variables did not predict success.[17] A 2024 systematic review of eight studies and 880 patients found mixed evidence that DISE improves surgical outcomes.[18]

#### Indications and the universal-prerequisite question

- The AASM 2021 surgical-referral guideline does not prescribe DISE before surgery.[11]
- AAO-HNS says DISE *may* be useful in determining an adult OSA surgical plan, wording that is explicitly conditional.[19]
- French SFORL adult DISE guidance used GRADE and reached recommendations about indication, technique, interpretation, and management, but 19 of 30 recommendations were low-evidence and the abstract does not justify a universal requirement.[20]
- Adult tonsillectomy studies and TEAMUP selected clinically visible tonsillar hypertrophy without establishing DISE as a prerequisite.[5-7]
- DISE remains required when current device labeling makes a specific finding part of candidacy, most notably exclusion of complete concentric palatal collapse for unilateral Inspire. That device-specific requirement must not be generalized to all surgery or every HGNS system.

**Implementation boundary:** Replace "Complete DISE-guided surgical planning first" with a conditional question such as: **"Does the selected procedure or unresolved/revision anatomy require DISE to map collapse before the plan is finalized?"** Retain a firm DISE prerequisite only for a device or procedure whose current labeling/protocol requires it, or when the clinician explicitly selects DISE as the next step.

### 4. Nasal obstruction, septoplasty, and inferior turbinate surgery

In a 2015 systematic review/meta-analysis of 18 studies (279 patients), isolated nasal surgery reduced mean therapeutic PAP pressure from 11.6 to 9.5 cm H2O. Objective use data were available for only 33 patients, and most adherence evidence was subjective or short-term.[21]

A 2022 systematic review of 21 studies found that isolated nasal surgery did not significantly improve AHI in most studies; any pooled AHI decrease was small and not clinically relevant as OSA treatment success. Symptoms may improve, and patients with obstruction or PAP difficulty may benefit.[22] AAO-HNS likewise describes nasal surgery as a beneficial **adjunct**, with usually modest AHI impact and possible PAP-compliance benefit.[19]

**Implementation boundary:** Septoplasty or turbinate reduction can be discussed for documented symptomatic/anatomic nasal obstruction and may facilitate PAP or other therapy. The app should not use a nasal-contributor phenotype by itself to rank generic "surgical correction" as an OSA treatment, and patient material should not imply that inferior turbinate reduction treats pharyngeal collapse. A clinician-confirmed combined DISE plus turbinate procedure remains coherent when each component has its own explicit indication.

### 5. MMA

A 2016 individual-patient-data meta-analysis included 45 mostly observational studies and 518 patients. Mean AHI reduction was about 80%; 85.5% met the study's surgical-success definition and 38.5% met cure, while many patients had undergone prior OSA surgery. Heterogeneous studies, selection, publication bias, and absence of randomized comparison limit prediction for an individual.[23]

The 2021 ERS guideline identified only one 50-patient RCT comparing maxillomandibular osteotomy with auto-CPAP. Both reduced AHI substantially at one year, with no significant difference in change. ERS therefore conditionally suggested either option, explicitly grading the evidence very low.[24]

MMA changes the facial skeletal framework and requires assessment beyond the app's current routine OSA fields: skeletal and occlusal anatomy, dentition, feasible advancement/rotation, aesthetic and functional goals, perioperative risk, surgeon expertise, and patient preference. Friedman Stage III can make isolated palatal surgery less attractive, but it neither establishes a craniofacial indication nor ranks MMA above PAP, HGNS, or other options. DISE can add context in some practices but is not a validated MMA-selection rule.

## Current-app claim audit

| Current location/behavior | Assessment | Recommended disposition |
|---|---|---|
| `js/app.js` calculates Friedman I-IV from FTP, tonsils, and BMI | Formula matches the historical framework | Retain as anatomic context; add input reliability and procedure-specific boundary |
| `SOFT-TISSUE-STRONG`: Stage I plus large tonsils -> "tonsillectomy with or without expansion pharyngoplasty" | Tonsillectomy discussion is supported; automatic palatal-procedure bundling is not | Prefer "tonsillectomy consultation; decide whether palatal work is indicated after procedure-specific exam" |
| `SOFT-TISSUE-CONSIDER` branch | With the current conditions it appears unreachable: large tonsils + FTP I/II calculates Stage I, not II | Remove or rewrite deliberately during implementation rather than preserving dead clinical logic |
| `FRIEDMAN-III-ALT`: Stage III -> tongue-base surgery, HGNS, or MMA based on DISE/candidacy | Unsupported cross-procedure extrapolation | Remove auto-routing; retain only caution against isolated palatal surgery and request comprehensive procedure-specific evaluation |
| Any "High Anatomical Contribution" phenotype can trigger generic surgery | Exact composite is unvalidated; BMI, neck, and severe AHI do not identify a correctable target | Do not use the composite as a surgical trigger. Require a documented target, preference/referral indication, or clinician-confirmed plan |
| PAP-intolerant high-anatomy pathway lists MAD, site-directed surgery, or nerve stimulation together | Reasonable options for discussion, but no ranking is established by the phenotype | Phrase as shared-decision alternatives after separate eligibility/safety review |
| Surgery guardrail mandates DISE for all surgery tags except a non-obese Stage-I large-tonsil case | Overbroad. The exception is directionally sensible, but the universal default is not guideline based | Make DISE conditional on device/procedure requirement, unresolved multilevel anatomy, revision, or clinician-selected question |
| Prior UPPP revision text requires DISE | Stronger than direct evidence, but defensible as conservative local workflow for altered/uncertain anatomy | Classify as local governance, say DISE "may be useful/selected" rather than evidence-mandated unless clinician confirms it |
| Prior MAD + UPPP + CPAP text says revision has "diminishing returns" and prioritizes Inspire, weight, or advanced surgery | No cited rule supports this ranking | Remove blanket diminishing-returns claim and automatic priority; review prior operations, current anatomy, residual disease, and all eligible options |
| Nasal obstruction plus exam automatically creates `NASAL-SURG` | Reasonable evaluation for structural obstruction | Explicitly tie surgery to nasal symptoms/anatomy and PAP facilitation, not OSA cure |
| A nasal contributor helps trigger generic `SURG` | Risks presenting nasal surgery as active OSA treatment | Separate nasal procedure discussion from pharyngeal OSA surgery |
| Patient report: surgery works when matched to collapse and DISE often guides it | Broadly reasonable | Change "often"/prerequisite copy to conditional, procedure-specific wording |
| Patient report Stage I copy promotes "tonsil and palate surgery consultation" | Tonsil consultation is supported; routine palate addition is less certain, especially after TEAMUP | Lead with tonsillectomy; add palatal surgery only if separate exam/planning supports it |
| `docs/citations.md` cites AAFP for "MMA achieves ~80% AHI reduction" | Secondary and insufficient for release-gate evidence | Replace with Zaghi 2016 primary meta-analysis and ERS 2021 guideline; preserve observational/very-low-certainty limits |
| `docs/evidence-basis.md` TX-07 says Friedman and DISE localize anatomy and inform procedure discussion | Too broad for Friedman and potentially too strong for DISE | Friedman provides palatal-response context; DISE observes sedated dynamic collapse but does not create a validated general response score |

## Concrete implementation recommendations

### Highest priority

1. **Retire Stage-III procedure auto-routing.** Replace `FRIEDMAN-III-ALT` with clinician-only language: "Friedman Stage III is less supportive of isolated palatal surgery. Reassess all relevant airway levels and compare eligible treatments; stage alone does not select tongue-base surgery, HGNS, or MMA."
2. **Make DISE conditional rather than universal.** In the surgery safety guardrail, require a documented clinical question. Use firm wording for a clinician-confirmed DISE plan and current unilateral-Inspire evaluation; otherwise say DISE may be useful when anatomy is uncertain, multilevel, revision, or procedure-specific.
3. **Separate tonsillectomy from palatal expansion.** Large tonsils can create a tonsillectomy consultation. Do not automatically add expansion pharyngoplasty. The clinician should decide whether palatal surgery adds value based on lateral-wall/palatal anatomy and procedure-specific assessment.
4. **Stop using the High Anatomical Contribution composite as a generic surgery trigger.** Keep it as an exploratory contributor if desired, but require an actual correctable anatomic target or a guideline-aligned referral discussion.

### Next priority

5. Replace the current MMA citation and routing with ERS/Zaghi evidence. Add needed inputs or keep MMA at a referral-discussion level rather than a recommendation.
6. Keep nasal surgery separate: treat obstruction and facilitate PAP; never imply it is expected to control pharyngeal OSA.
7. Replace "diminishing returns" and other prior-treatment ranking claims with reassessment language unless a procedure-specific source supports them.
8. Add explicit clinician signoff before any named operation is promoted into the patient plan. The algorithm can draft a consultation or workup; the clinician selects the operation.

### Regression scenarios and counterexamples

1. **Stage III, no demonstrated lower-airway target:** Stage III must caution against isolated palatal surgery but must not emit tongue-base surgery, HGNS, MMA, or mandatory DISE.
2. **Stage III plus retrognathia:** May prompt maxillofacial evaluation, but still no MMA recommendation or probability without full craniofacial/occlusal assessment.
3. **Grade 4 tonsils, prior PAP intolerance, no DISE:** May draft a tonsillectomy consultation without a universal DISE prerequisite; do not automatically add expansion pharyngoplasty.
4. **Grade 2 tonsils, moderate/severe OSA:** TEAMUP-compatible counseling should acknowledge that tonsillectomy alone may be considered in selected patients, while residual OSA and follow-up testing remain explicit.
5. **BMI/neck/severity create High Anatomical Contribution but no correctable exam target:** Must not trigger generic airway surgery.
6. **Severe nasal obstruction/turbinate hypertrophy with OSA:** Nasal procedure can treat obstruction and support PAP, but must not replace active OSA treatment without objective verification.
7. **Revision after prior throat surgery:** Review operative report and current anatomy; DISE may be selected if it will answer a planning question, but the app must not claim evidence makes it universally mandatory.
8. **Clinician-confirmed unilateral Inspire evaluation:** Preserve device-required DISE/CCC boundary independently of the general surgery rule.
9. **Clinician-confirmed combined DISE plus inferior turbinate reduction:** Preserve the exact confirmed plan while explaining that DISE maps collapse and turbinate reduction treats nasal obstruction; do not imply the nasal procedure treats palatal/tongue collapse.

## Search method

Searches were run on 2026-08-13 in PubMed/PMC and official AASM, AAO-HNS, ERS, and FDA domains. Reference lists of included primary studies and guidelines were used to locate original derivation, randomized trials, reliability studies, and official statements. Search strings included combinations of:

- `Friedman staging obstructive sleep apnea UPPP prospective validation`
- `Friedman stage interexaminer agreement`
- `adult tonsillectomy obstructive sleep apnea prospective meta-analysis randomized`
- `TEAMUP tonsillectomy modified UPPP randomized`
- `expansion sphincter pharyngoplasty randomized`
- `multilevel upper airway surgery SAMS randomized`
- `drug induced sleep endoscopy interrater reliability VOTE`
- `DISE surgical outcomes multicenter cohort systematic review`
- `AASM surgical consultation guideline adult OSA`
- `AAO-HNS tonsillectomy nasal surgery UPPP position statement`
- `ERS non-CPAP guideline maxillomandibular osteotomy`
- `MMA obstructive sleep apnea individual patient data meta-analysis`
- `isolated nasal surgery OSA CPAP pressure adherence`

Priority was given to clinical-practice guidelines, randomized trials, prospective cohorts, blinded multicenter cohorts, and systematic reviews/meta-analyses. Narrative reviews, payer policies, and commercial pages were excluded as decision evidence. AAO-HNS position statements were retained as official professional-society context but were not treated as equivalent to a GRADE clinical-practice guideline. Because procedure techniques, scoring definitions, and selection criteria vary substantially, pooled group response rates were not converted into individual probabilities.

## References

1. Friedman M, Ibrahim H, Joseph NJ. Staging of obstructive sleep apnea/hypopnea syndrome: a guide to appropriate treatment. *Laryngoscope.* 2004;114(3):454-459. doi:[10.1097/00005537-200403000-00013](https://doi.org/10.1097/00005537-200403000-00013). [PubMed](https://pubmed.ncbi.nlm.nih.gov/15091218/)
2. Friedman M, Vidyasagar R, Bliznikas D, Joseph N. Does severity of obstructive sleep apnea/hypopnea syndrome predict uvulopalatopharyngoplasty outcome? *Laryngoscope.* 2005;115(12):2109-2113. doi:[10.1097/01.MLG.0000181505.11902.F7](https://doi.org/10.1097/01.MLG.0000181505.11902.F7). [PubMed](https://pubmed.ncbi.nlm.nih.gov/16369152/)
3. Choi JH, Cho SH, Kim SN, Suh JD, Cho JH. Predicting outcomes after uvulopalatopharyngoplasty for adult obstructive sleep apnea: a meta-analysis. *Otolaryngol Head Neck Surg.* 2016;155(6):904-913. doi:[10.1177/0194599816661481](https://doi.org/10.1177/0194599816661481). [PubMed](https://pubmed.ncbi.nlm.nih.gov/27484230/)
4. Bäck LJ, et al. Low inter-examiner agreement of the Friedman staging system indicating limited value in patient selection. *Eur Arch Otorhinolaryngol.* 2018. [PubMed PMID 29663113](https://pubmed.ncbi.nlm.nih.gov/29663113/)
5. Camacho M, Li D, Kawai M, et al. Tonsillectomy for adult obstructive sleep apnea: a systematic review and meta-analysis. *Laryngoscope.* 2016;126(9):2176-2186. doi:[10.1002/lary.25931](https://doi.org/10.1002/lary.25931). [PubMed](https://pubmed.ncbi.nlm.nih.gov/27005314/)
6. Senchak AJ, et al. The effect of tonsillectomy alone in adult obstructive sleep apnea. *Otolaryngol Head Neck Surg.* 2015;152(5):969-973. doi:[10.1177/0194599815575721](https://doi.org/10.1177/0194599815575721). [PubMed](https://pubmed.ncbi.nlm.nih.gov/25820584/)
7. Sundman J, Nerfeldt P, Fehrm J, et al. Effectiveness of tonsillectomy vs modified uvulopalatopharyngoplasty in patients with tonsillar hypertrophy and obstructive sleep apnea: the TEAMUP randomized clinical trial. *JAMA Otolaryngol Head Neck Surg.* 2022;148(12):1173-1181. doi:[10.1001/jamaoto.2022.3432](https://doi.org/10.1001/jamaoto.2022.3432). [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9634593/)
8. American Academy of Otolaryngology-Head and Neck Surgery. [Position Statement: Tonsillectomy and OSAs](https://www.entnet.org/resource/position-statment-tonsillectomy-and-osas/). Revised 2021.
9. Pang KP, Woodson BT. Expansion sphincter pharyngoplasty: a new technique for the treatment of obstructive sleep apnea. *Otolaryngol Head Neck Surg.* 2007;137(1):110-114. doi:[10.1016/j.otohns.2007.03.014](https://doi.org/10.1016/j.otohns.2007.03.014). [PubMed](https://pubmed.ncbi.nlm.nih.gov/17599576/)
10. MacKay S, Carney AS, Catcheside PG, et al. Effect of multilevel upper airway surgery vs medical management on the apnea-hypopnea index and patient-reported daytime sleepiness among patients with moderate or severe obstructive sleep apnea: the SAMS randomized clinical trial. *JAMA.* 2020;324(12):1168-1179. doi:[10.1001/jama.2020.14265](https://doi.org/10.1001/jama.2020.14265). [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7489419/)
11. Kent D, Stanley J, Aurora RN, et al. Referral of adults with obstructive sleep apnea for surgical consultation: an American Academy of Sleep Medicine clinical practice guideline. *J Clin Sleep Med.* 2021;17(12):2499-2505. doi:[10.5664/jcsm.9592](https://doi.org/10.5664/jcsm.9592). [AASM summary](https://aasm.org/wp-content/uploads/2022/03/Referral_OSA_Surgical_Consultation_Guideline_at_a_Glance.pdf)
12. Gillespie MB, Reddy RP, White DR, et al. A trial of drug-induced sleep endoscopy in the surgical management of sleep-disordered breathing. *Laryngoscope.* 2013;123(1):277-282. [PubMed PMID 22952110](https://pubmed.ncbi.nlm.nih.gov/22952110/)
13. Aktas O, Erdur O, Cirik AA, Kayhan FT. Surgical planning after sleep versus awake techniques in patients with obstructive sleep apnea. *Laryngoscope.* 2014. [PubMed PMID 24382820](https://pubmed.ncbi.nlm.nih.gov/24382820/)
14. Kezirian EJ, White DP, Malhotra A, et al. Interrater reliability of drug-induced sleep endoscopy. *Arch Otolaryngol Head Neck Surg.* 2010;136(4):393-397. doi:[10.1001/archoto.2010.26](https://doi.org/10.1001/archoto.2010.26). [PubMed](https://pubmed.ncbi.nlm.nih.gov/20403857/)
15. Kastoer C, et al. Interrater reliability of different scoring systems for drug-induced sleep endoscopy. *Sleep Breath.* 2024. doi:[10.1007/s11325-024-03190-2](https://doi.org/10.1007/s11325-024-03190-2). [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11606994/)
16. Green KK, Kent DT, D'Agostino MA, et al. Drug-induced sleep endoscopy and surgical outcomes: a multicenter cohort study. *Laryngoscope.* 2019;129(3):761-770. doi:[10.1002/lary.27655](https://doi.org/10.1002/lary.27655). [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8357533/)
17. Meraj TS, et al. Does drug-induced sleep endoscopy predict surgical success in transoral robotic multilevel surgery in obstructive sleep apnea? *Laryngoscope.* 2017;127(4):971-976. doi:[10.1002/lary.26255](https://doi.org/10.1002/lary.26255). [PubMed](https://pubmed.ncbi.nlm.nih.gov/27796047/)
18. Di Bari M, Colombo G, Giombi F, et al. The effect of drug-induced sleep endoscopy on surgical outcomes for obstructive sleep apnea: a systematic review. *Sleep Breath.* 2024;28(2):859-867. doi:[10.1007/s11325-023-02931-z](https://doi.org/10.1007/s11325-023-02931-z). [PubMed](https://pubmed.ncbi.nlm.nih.gov/37851322/)
19. American Academy of Otolaryngology-Head and Neck Surgery. [Position Statement: Treatment of Obstructive Sleep Apnea](https://www.entnet.org/resource/position-statement-treatment-of-obstructive-sleep-apnea/). Revised 2021.
20. Bastier PL, et al. Guidelines of the French Society of ENT (SFORL): drug-induced sleep endoscopy in adult obstructive sleep apnea syndrome. *Eur Ann Otorhinolaryngol Head Neck Dis.* 2022. [PubMed PMID 35871981](https://pubmed.ncbi.nlm.nih.gov/35871981/)
21. Camacho M, Riaz M, Capasso R, et al. The effect of nasal surgery on continuous positive airway pressure device use and therapeutic treatment pressures: a systematic review and meta-analysis. *Sleep.* 2015;38(2):279-286. doi:[10.5665/sleep.4414](https://doi.org/10.5665/sleep.4414). [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4288609/)
22. Schoustra E, et al. The role of isolated nasal surgery in obstructive sleep apnea therapy: a systematic review. *Brain Sci.* 2022;12(11):1446. doi:[10.3390/brainsci12111446](https://doi.org/10.3390/brainsci12111446). [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9688553/)
23. Zaghi S, Holty JEC, Certal V, et al. Maxillomandibular advancement for treatment of obstructive sleep apnea: a meta-analysis. *JAMA Otolaryngol Head Neck Surg.* 2016;142(1):58-66. doi:[10.1001/jamaoto.2015.2678](https://doi.org/10.1001/jamaoto.2015.2678). [PubMed](https://pubmed.ncbi.nlm.nih.gov/26606321/)
24. Randerath W, Verbraecken J, de Raaff CAL, et al. European Respiratory Society guideline on non-CPAP therapies for obstructive sleep apnoea. *Eur Respir Rev.* 2021;30(162):210200. doi:[10.1183/16000617.0200-2021](https://doi.org/10.1183/16000617.0200-2021). [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9489103/)

