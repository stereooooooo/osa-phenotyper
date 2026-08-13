# COMISA, nocturnal hypoxemia, and weight management: primary-source review

**Review date:** 2026-08-13  
**Evidence searched through:** 2026-08-13  
**Purpose:** Targeted evidence audit for Precision Sleep clinical decision support  
**Scope:** COMISA; conventional nocturnal hypoxemia and respiratory-event-linked hypoxic burden; weight management and tirzepatide in OSA  
**Repository files audited:** `docs/evidence-basis.md`, `docs/citations.md`, `docs/evidence-review-log.md`, `js/config.js`, `js/app.js`, `js/report-shared.js`, and `js/patientReport.js`  
**Change boundary:** This review does not change application code, thresholds, recommendations, or the three release-gate evidence documents. Any resulting clinical change still requires the repository's clinical-change gate, regression scenarios, clinician approval, and a separate implementation review.

## Executive conclusions

1. **COMISA should remain an operational screen, not an automated diagnosis.** An Insomnia Severity Index (ISI) score of 15 or higher plus an apnea-hypopnea index (AHI) of 5 or higher is a reasonable local trigger for clinician review, but ISI alone does not establish chronic insomnia disorder. The strongest treatment trials enrolled patients with a confirmed insomnia disorder and generally AHI of at least 15 events/hour.
2. **CBT-I should be offered early, while CBT-I/PAP sequencing remains individualized.** Randomized trials support cognitive behavioral therapy for insomnia (CBT-I) before or alongside positive airway pressure (PAP). They do not establish one sequence for every patient, reliably predict which individual will adhere to PAP, or justify delaying urgent OSA treatment.
3. **Sleep-restriction components of CBT-I require monitoring, not blanket exclusion.** A randomized COMISA analysis found a small, transient rise in sleepiness during the first week. Marked sleepiness, safety-sensitive work, unstable psychiatric disease, and other clinical risks require clinician judgment; evidence does not support a universal ISI or Epworth Sleepiness Scale cutoff that automatically determines sequence.
4. **Conventional nocturnal hypoxemia and respiratory-event-linked hypoxic burden are related but different measurements.** ODI, oxygen nadir, and time below 90% are not substitutes for the event-linked area-under-the-desaturation-curve metric used in the foundational hypoxic-burden cohorts. Similarly named metrics can differ by event definition, baseline estimation, oximeter, sampling, artifact handling, and denominator.
5. **Hypoxic burden is prognostic observational evidence, not a validated treatment-allocation rule.** Cohort studies associate higher event-linked burden with cardiovascular outcomes. Post hoc trial analyses suggest possible effect modification, but no prospective biomarker-stratified trial validates a universal cutoff for selecting or withholding PAP or another therapy. Values such as 30, 73.1, and 87.1 must not be presented as interchangeable clinical categories.
6. **The app's conventional oxygen bands are local safety-review triggers.** Directional evidence supports concern when hypoxemia is substantial, but the exact ODI, T90, nadir, and area-below-90 cutoffs currently used by the app are not a jointly validated rule. They should stay separate from the hypoxic-burden phenotype and should not create a treatment-response prediction.
7. **Weight management is evidence-based adjunctive OSA care, but individual AHI response cannot be forecast.** Comprehensive lifestyle intervention is guideline supported. Trials show average improvement with weight loss, with wide individual variation and incomplete remission. Existing treatment should not be stopped based on weight loss alone; objective reassessment is appropriate after clinically significant weight change.
8. **Zepbound is FDA indicated for moderate-to-severe OSA in adults with obesity.** The current label requires use with a reduced-calorie diet and increased physical activity. It does not require prior PAP failure and explicitly states that the pivotal trials did not evaluate the timing or appropriateness of PAP discontinuation. Medication eligibility and safety require prescriber review.

## Evidence-class legend

| Class | Meaning in this review | Permitted use in decision support |
|---|---|---|
| Regulatory | Current FDA-approved indication, prescribing information, contraindications, and warnings | Defines labeling and medication safety boundaries; does not by itself predict individual benefit |
| Guideline / official statement | Recommendation or consensus statement from a professional society | Supports care pathways and follow-up principles within the stated population |
| Randomized trial | Prospective randomized comparison | Supports average causal treatment effects in the enrolled population; subgroup or secondary findings require caution |
| Observational cohort | Prospective or retrospective association | Supports prognostic context, not causality or treatment allocation |
| Post hoc / exploratory | Analysis not prospectively designed to validate the decision rule | Hypothesis generating; must not become a categorical eligibility or treatment-selection threshold |
| Local governance | Conservative operational boundary selected by Precision Sleep / Capital ENT | Must be labeled as local, reviewed by a clinician, and not misrepresented as a published universal cutoff |

## Reproducible search method

### Sources searched

- PubMed/MEDLINE for indexed primary studies and guidelines
- DOI and journal landing pages to verify bibliographic details
- FDA Drugs@FDA prescribing information and FDA approval announcement
- American Academy of Sleep Medicine (AASM), American Thoracic Society (ATS), and society-hosted guideline documents
- Reference lists of the primary trials and official statements to locate foundational cohorts

### Search concepts

Searches were run on 2026-08-13 using combinations of:

- `comorbid insomnia sleep apnea randomized CBT-I CPAP adherence`
- `COMISA sequential concurrent CBT-I PAP randomized trial`
- `sleep restriction therapy COMISA sleepiness safety`
- `Insomnia Severity Index validation cutoff chronic insomnia diagnosis`
- `sleep apnea hypoxic burden cardiovascular mortality area desaturation events`
- `hypoxic burden CPAP treatment effect ISAACC SAVE RICCADSA`
- `T90 20 oxygen nadir 75 obstructive sleep apnea mortality`
- `sleep apnea follow-up testing hypoxemia weight loss AASM`
- `WatchPAT hypoxic burden validation polysomnography interchangeability`
- `obstructive sleep apnea weight loss randomized trial AHI`
- `SURMOUNT-OSA tirzepatide randomized trial label FDA obstructive sleep apnea`

### Inclusion and exclusion

Included sources were primary randomized trials, primary cohort studies, current regulatory labeling, and official guidelines/statements directly relevant to an app decision. Systematic reviews were used for orientation but not as the main authority when an underlying primary source was available. Conference abstracts, marketing materials, narrative reviews, and studies without a direct bearing on a current or proposed app rule were excluded from decision support. No unpublished manufacturer algorithm or proprietary validation package was available for review.

## Domain 1: COMISA

### Definition and screening boundary

COMISA describes coexisting insomnia disorder and obstructive sleep apnea. It is a clinically useful construct, but it is not established by two numerical values alone.

- The ISI is a validated seven-item measure of perceived insomnia severity and treatment response. It is a screening and outcome instrument, not a substitute for the clinical duration, frequency, opportunity-for-sleep, daytime-impairment, and differential-diagnosis requirements of chronic insomnia disorder. **Evidence class: validation study.**
- The AASM behavioral-treatment guideline strongly recommends multicomponent CBT-I for adults with chronic insomnia disorder. It does not validate a COMISA-specific ISI/AHI formula or a universal CBT-I/PAP sequence. **Evidence class: guideline.**
- The local rule `ISI >= 15 and AHI >= 5` is therefore defensible as an **operational screen for clinician review**, not a diagnosis, phenotype probability, or prediction of CBT-I response.

### Randomized treatment evidence

| Source | Population and intervention | Supported conclusion | Not supported |
|---|---|---|---|
| Sweetman et al., 2019 | 145 adults with confirmed insomnia and AHI at least 15; four CBT-I sessions before CPAP versus treatment as usual | CBT-I before CPAP improved CPAP acceptance and increased average nightly use by 61 minutes (95% CI 9 to 113) in this trial | “Untreated insomnia is the strongest predictor of CPAP nonadherence”; guaranteed adherence improvement for an individual; application to all mild OSA screens |
| Ong et al. (MATRICS), 2020 | 121 adults randomized to sequential CBT-I then PAP, concurrent CBT-I plus PAP, or PAP alone | CBT-I improved insomnia outcomes; both sequential and concurrent delivery were reasonable | A single superior sequence; an adherence advantage for CBT-I in this trial; automated sequence selection |
| Alessi et al., 2021 | 125 veterans, predominantly older men; integrated CBT-I plus PAP-adherence coaching versus sleep education | Integrated behavioral care improved sleep and PAP use in this population | Generalization to every demographic or attribution of the effect to CBT-I alone |
| Sweetman et al., 2020 | Week-to-week sleepiness analysis during CBT-I in COMISA | Sleepiness rose modestly and transiently after the first sleep-restriction week, then returned toward baseline; monitoring is appropriate | Sleep restriction is universally unsafe in OSA; a fixed ESS cutoff that determines sequence |
| Turner et al., 2023 | Exploratory neurocognitive ancillary study in 45 COMISA participants | Supports caution and monitoring during early sleep restriction | A validated rule for who should receive PAP first or should be denied CBT-I |

### Sequencing, adherence, and safety

The combined randomized evidence supports these app-level principles:

1. Offer CBT-I early when insomnia disorder is confirmed or strongly suspected.
2. PAP may begin before, during, or after CBT-I depending on OSA severity, hypoxemia, sleepiness, occupational risk, access, preference, and clinician assessment.
3. Do not automatically delay urgent OSA treatment because insomnia is present.
4. Do not promise improved PAP adherence. Trial results are inconsistent across delivery models and populations.
5. Sleep-restriction therapy should be clinician supervised or delivered through a suitable protocol, with attention to excessive sleepiness, driving or other safety-sensitive duties, psychiatric instability, seizure risk, fall risk, and other patient-specific concerns.

The reviewed evidence does **not** permit the app to individualize:

- which sequence will produce the best adherence or symptom response for a particular patient;
- the optimal sleep window, titration, or other CBT-I prescription;
- whether a high ISI score is caused by chronic insomnia disorder, untreated OSA, insufficient sleep, circadian misalignment, medication/substance effects, mood disorder, or another condition;
- whether PAP can be safely deferred in an individual with marked sleepiness, hypoxemia, cardiopulmonary disease, or other safety concerns; or
- an individual probability of CBT-I response or PAP adherence.

### Alignment with current Precision Sleep behavior

Aligned behavior identified in the audit:

- `TX-01` describes the ISI/AHI combination as an operational COMISA screen.
- The app offers CBT-I early and allows concurrent or sequential PAP based on severity, oxygen burden, sleepiness, access, and preference.
- Elevated sleepiness generates monitoring language rather than an automatic CBT-I contraindication.
- The evidence documents correctly reject a universal sequence and individual adherence prediction.

Discrepancies or wording risks requiring review:

1. **Unsupported predictor ranking:** `js/app.js` states that untreated insomnia is “the strongest predictor of CPAP non-adherence” and attributes this to Sweetman 2019. That randomized trial did not compare predictors or establish this ranking. This should not be carried into a patient or clinician claim without a source that directly supports it.
2. **Screen versus diagnosis:** Some UI/report language maps ISI bands directly to “moderate” or “severe insomnia.” ISI severity labels are conventional questionnaire descriptors, but the app should remain explicit that an ISI-positive result is a screen requiring clinical confirmation, not a chronic insomnia diagnosis.
3. **Population extrapolation:** The app screen begins at AHI 5, while the most directly relevant sequencing/adherence trials generally required AHI at least 15 and confirmed insomnia. The broader threshold can remain a conservative screen, but its treatment-effect evidence is indirect for mild OSA.
4. **Pre-study routing:** CBT-I may be shown when ISI is elevated before OSA is confirmed. This is reasonable only as insomnia-focused care pending clinical confirmation, not as proof of COMISA.

### Clinician decisions needed for COMISA

- Approve retaining `ISI >= 15 + AHI >= 5` as a local **screen**, with explicit non-diagnostic wording.
- Approve removal or replacement of the “strongest predictor” statement.
- Confirm that the app should continue offering early CBT-I while leaving concurrent versus sequential PAP to clinician judgment.
- Confirm which high-risk conditions should trigger enhanced warning language or referral rather than automated CBT-I scheduling. The evidence does not support encoding a single universal exclusion rule.

## Domain 2: conventional nocturnal hypoxemia and event-linked hypoxic burden

### Measurement concepts must remain separate

| Measure | What it captures | Principal limitations |
|---|---|---|
| Oxygen desaturation index (ODI) | Count of qualifying desaturations per hour under a specified algorithm | Varies with 3%/4% definition, baseline, device, sampling, artifact rejection, and sleep-time denominator |
| Oxygen nadir | Lowest recorded saturation | Sensitive to artifact and does not represent duration or event linkage |
| T90 | Percent or minutes of sleep/recording time below 90% | Can reflect sustained hypoxemia unrelated to discrete respiratory events; denominator and oximetry method matter |
| Area below 90% | Integrated depth and duration below a fixed 90% threshold | Not the same construct as event-linked hypoxic burden; no universal implementation was identified |
| Event-linked hypoxic burden | Sum of areas under respiratory-event-associated desaturation curves relative to an event-specific baseline, normalized by sleep time | Requires a defined event-linking and baseline algorithm; published implementations and devices are not automatically interchangeable |
| Oximetry-derived burden (`HB_Oxi`) | Event-like burden estimated from oxygen signals without scored respiratory events | Correlated with, but not identical to, scored-event burden; validation is population and method specific |

### Prognostic evidence

- Azarbarzin et al. analyzed MrOS and Sleep Heart Health Study cohorts using respiratory-event-linked desaturation area. Higher burden was associated with cardiovascular mortality after adjustment, whereas AHI was less consistently associated. This is strong **observational prognostic** evidence, not proof that reducing the metric causes benefit or that a particular cutoff selects therapy.
- Additional cohorts, including Pays de la Loire data, support associations with cardiovascular outcomes. Between-study algorithms and cut points differ.
- Esmaeili et al. reported an oximetry-derived metric correlated with scored-event burden (`r = 0.81`) and with outcomes in the Sleep Heart Health Study. Correlation and similar cohort associations do not make the two methods numerically interchangeable.
- Conventional severe hypoxemia is also prognostically concerning. A retrospective OSA cohort found T90 greater than 20% associated with hypertension, type 2 diabetes, and mortality, while a nadir below 75% identified a partially different phenotype. These were descriptive/associative boundaries, not a prospectively validated four-part safety rule.
- Oldenburg et al. found nocturnal hypoxemia associated with mortality in a stable heart-failure cohort. This supports concern in that population but does not validate a universal OSA threshold.

### Treatment allocation and causal limits

The reviewed literature does not establish a clinical hypoxic-burden treatment-allocation threshold.

- The ISAACC analysis using 73.1 was post hoc and cohort specific.
- A 2026 pooled post hoc analysis of SAVE, ISAACC, and RICCADSA used a composite “high-risk” definition that included hypoxic burden above 87.1 (the pooled third tertile) or a heart-rate-response boundary. Its treatment interaction is hypothesis generating. It does not justify withholding PAP below the cutoff, promising cardiovascular benefit above it, or treating 87.1 as a universal category.
- The app's value of 30 is an exploratory signal boundary. It is not equivalent to 73.1 or 87.1, and it does not establish causality, device eligibility, or expected treatment response.
- A 2025 individual-participant meta-analysis found that baseline uncontrolled blood pressure, but not severe nocturnal hypoxia, modified CPAP's blood-pressure effect. This is a direct caution against assuming that greater hypoxemia reliably identifies individual blood-pressure responders.
- The ATS workshop report concludes that sleep-apnea cardiovascular treatment benefit remains unsettled and calls for prospectively phenotyped trials.

Therefore the app must not infer:

- an individual's cardiovascular event risk from a burden category;
- a causal cardiovascular benefit from lowering hypoxic burden;
- whether PAP, nerve stimulation, surgery, an oral appliance, or weight treatment will normalize oxygen burden;
- a treatment rank or eligibility decision from hypoxic burden alone; or
- equivalence between a WatchPAT-reported value and values produced by the published research algorithms without method-specific validation.

### WatchPAT and method interchangeability

A 2026 retrospective peripheral arterial tonometry home-study paper calculated hypoxic burden in 1,171 patients using custom software, second-by-second WatchPAT exports, identified 4% desaturation events, and a triangular approximation. It derived cohort-specific cut points (16.6 and 29.5 for AHI-category discrimination) and percentile bands (8.1 and 40.1). Important limitations are:

- the implementation was custom and not the current commercial WatchPAT automated output;
- the internal comparator was pAHI from the same device, not simultaneous polysomnography event-linked burden;
- it did not validate prediction of clinical outcomes or treatment response;
- the cohort required at least four hours of sleep and may not generalize to short or artifact-limited studies; and
- authors acknowledged oximeter and method variation.

This source supports feasibility of deriving a burden-like metric from PAT-HSAT signals. It does **not** validate numerical interchangeability with the Azarbarzin method, `HB_Oxi`, another laboratory's implementation, or a commercial WatchPAT report. The app should store method/provenance when available and avoid silently combining unlike values.

### Follow-up oxygen verification

The AASM longitudinal-management guidance states that follow-up PSG may be used to reassess sleep-related hypoxemia or hypoventilation after treatment and that PSG or HSAT may assess response to non-PAP interventions. This supports a clinician-directed objective verification pathway when baseline oxygen abnormalities are material or when treatment changes could leave residual OSA.

It does not specify that every abnormal ODI, T90, nadir, or burden value requires the same test or interval. Choice of PSG, HSAT, PAP download, overnight oximetry, capnography, or cardiopulmonary evaluation depends on the suspected mechanism, therapy, comorbidity, and whether a diagnostic-quality respiratory assessment is needed. Oximetry alone cannot verify all forms of residual sleep-disordered breathing.

### Alignment with current Precision Sleep behavior

Aligned behavior identified in the audit:

- `PH-07` correctly restricts hypoxic burden to an event-linked input.
- ODI, T90, nadir, and area below 90% feed a separate substantial-nocturnal-hypoxemia safety pathway and cannot create the hypoxic-burden phenotype.
- The app labels 30 as exploratory and 73.1/87.1 as cohort context rather than treatment thresholds.
- Current documentation rejects causal interpretation, treatment ranking, and automated cardiovascular risk prediction.
- Current logic recommends reassessment of oxygen control rather than assuming treatment success.

Source-verified discrepancies requiring correction in the evidence system before a future release:

1. **Conventional-hypoxemia bibliography:** The current citation row attributes the T90/nadir bands to “Zinchuk et al., AJRCCM 2020;202(12):1701-1712” and “Oldenburg et al., Eur J Heart Fail 2016;18(11):1265-1277.” The directly relevant T90 greater than 20% and nadir below 75% paper is *Sleep and Breathing* 2019, DOI `10.1007/s11325-019-01860-0`. The verified Oldenburg paper is *European Heart Journal* 2016;37(21):1695-1703, DOI `10.1093/eurheartj/ehv624`. The current bibliographic details should not be retained without independent verification.
2. **Exact safety bands:** `ODI > 50`, `T90 > 20%`, `nadir < 75%`, and `area below 90% > 2/h` operate as one local trigger set, but no primary study validating that combined rule was identified. T90 20% and nadir 75% have observational context; the exact ODI 50 and area-below-90 2/h boundaries should be documented as local governance unless a direct validation source is supplied.
3. **Date error:** `js/config.js` references “Parekh 2026.” The verified review is Parekh et al. 2024, DOI `10.1097/MCP.0000000000001122`.
4. **Device provenance:** The existence of a PAT-HSAT research implementation must not be used to infer that current commercial WatchPAT hypoxic-burden values use the same algorithm or thresholds.

### Clinician decisions needed for hypoxemia and burden

- Approve keeping 30 as an explicitly exploratory signal with no treatment-allocation function, or deactivate it until method-specific validation is available.
- Approve retaining the current conventional oxygen bands as conservative local safety-review triggers, with a clear statement that they are not a published joint rule.
- Decide whether an abnormal local safety trigger should always generate an explicit objective oxygen-control follow-up item, and which modalities should be available for clinician selection.
- Require capture/display of source device, burden algorithm/version, desaturation definition, and denominator before cross-study comparison when those data are available.
- Approve repair of the conventional-hypoxemia bibliography and Parekh publication year in a future evidence-gated change.

## Domain 3: weight management in OSA

### Lifestyle and weight-loss outcome evidence

- The ATS guideline recommends a comprehensive lifestyle intervention, including reduced-calorie diet, exercise or increased physical activity, and behavioral counseling, for adults with OSA who are overweight or obese. Pharmacotherapy and bariatric evaluation are considered for selected patients after individualized review. **Evidence class: guideline.**
- In the Sleep AHEAD randomized trial of adults with type 2 diabetes and OSA, intensive lifestyle intervention produced greater weight loss and an adjusted AHI reduction of 9.7 events/hour at one year compared with control. Long-term follow-up showed a durable relationship between weight change and OSA severity, but no statistically significant between-group AHI difference at year 10 and no universal remission. **Evidence class: randomized trial with long-term follow-up.**
- A randomized trial in mild OSA found that intensive lifestyle intervention and weight reduction improved OSA on average. **Evidence class: randomized trial.**
- The Wisconsin Sleep Cohort found that 10% weight loss was associated with an approximately 26% decrease in AHI. This was an observational population average and must not be converted into an individual calculator or promise. **Evidence class: observational cohort.**

These data support offering weight management as adjunctive care. They do not support telling an individual that a specific number of pounds will improve snoring, reduce AHI by a fixed percentage, eliminate another therapy, or produce remission.

### Tirzepatide and SURMOUNT-OSA

The SURMOUNT-OSA program comprised two 52-week, double-blind randomized trials totaling 469 adults with obesity and moderate-to-severe OSA:

- Study 1 enrolled participants unable or unwilling to use PAP.
- Study 2 enrolled participants using PAP; PAP was withdrawn for seven days before efficacy sleep assessments.
- Participants received maximally tolerated tirzepatide 10 or 15 mg weekly or placebo, alongside a reduced-calorie diet and increased physical activity.
- Mean treatment differences in AHI were approximately -20.0 and -23.8 events/hour in the two trials; mean percentage weight changes were approximately -17.7% and -19.6% with tirzepatide versus -1.6% and -2.3% with placebo.
- Type 2 diabetes was excluded, and follow-up was 52 weeks. The trial does not establish lifetime durability, comparative effectiveness against airway therapies, a rule for PAP discontinuation, or an individual response probability.

**Evidence class: phase 3 randomized trials.**

### Current FDA indication and safety boundary

The current FDA prescribing information reviewed on 2026-08-13 indicates Zepbound (tirzepatide) to treat moderate-to-severe OSA in adults with obesity, in combination with a reduced-calorie diet and increased physical activity. For OSA, the recommended maintenance dosage is 10 mg or 15 mg once weekly after dose escalation.

Important labeling boundaries include:

- OSA indication requires **adult obesity and moderate-to-severe OSA**. The separate chronic-weight-management indication also includes some adults with overweight plus a weight-related condition; that broader weight indication must not be misrepresented as the OSA indication.
- Prior PAP failure is not an FDA prerequisite.
- The label states that the pivotal trials did not evaluate the timing or appropriateness of stopping PAP. PAP or another active treatment should not be automatically stopped because tirzepatide is started or weight is lost.
- Contraindications include a personal or family history of medullary thyroid carcinoma, multiple endocrine neoplasia syndrome type 2, and serious hypersensitivity to tirzepatide or excipients.
- Warnings/precautions include severe gastrointestinal adverse reactions; volume-depletion acute kidney injury; gallbladder disease; pancreatitis; hypersensitivity; hypoglycemia with insulin or insulin secretagogues; diabetic retinopathy complications in patients with type 2 diabetes; suicidal behavior or ideation; pulmonary aspiration during general anesthesia or deep sedation; and fetal harm. It is not recommended in severe gastroparesis.
- Concomitant use with another tirzepatide-containing product or any GLP-1 receptor agonist is not recommended.

This is medication-level clinical decision making. The app may identify a discussion pathway but cannot clear contraindications, choose a dose, manage interactions, predict tolerability, or substitute for prescriber review. Tirzepatide is a dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist; calling it only a “GLP-1” drug is convenient shorthand but pharmacologically incomplete.

### Objective follow-up after weight change

The AASM longitudinal guidance states that follow-up PSG or HSAT may be used after clinically significant weight gain or loss. This supports objective reassessment rather than assuming AHI has changed in proportion to weight. The specific timing and modality depend on baseline severity, oxygen burden, symptoms, current treatment, and whether changing therapy is contemplated.

No reviewed source permits the app to predict:

- an individual's AHI or oxygen-burden reduction from a planned amount of weight loss;
- which patient will achieve OSA remission;
- the magnitude or durability of tirzepatide response for a particular patient;
- whether PAP, nerve stimulation, an oral appliance, or surgery can be stopped; or
- whether a patient is medically eligible for tirzepatide without full prescriber review.

### Alignment with current Precision Sleep behavior

Aligned behavior identified in the audit:

- The app recommends weight management at BMI 30 or higher and limits its named Zepbound OSA pathway to AHI at least 15, consistent with the labeled OSA population.
- Weight loss is presented as adjunctive, and the evidence documents reject an individual AHI-response formula.
- Weight-readiness and treatment progress are considered in follow-up.

Discrepancies or wording risks requiring review:

1. **Unsupported “5-7 pounds” claim:** `js/patientReport.js` states that “Even losing 5-7 pounds can noticeably cut snoring” in pre-study/snoring content. No primary source reviewed here validates that fixed amount or an individual snoring response. The claim should be removed, softened to a non-quantified association, or directly sourced before reuse.
2. **Incomplete drug-class terminology:** Patient-facing references to “GLP-1 therapies (for example, Zepbound/tirzepatide)” may imply that tirzepatide is a GLP-1-only agonist. “Incretin-based medication such as tirzepatide, a dual GIP/GLP-1 receptor agonist” is more accurate when detail is clinically useful.
3. **Brand/indication separation:** Historical references to Mounjaro and Zepbound are understandable because both contain tirzepatide, but only Zepbound carries the OSA indication. Decision-support text should not imply that Mounjaro is FDA approved for OSA.
4. **Objective reassessment:** Current follow-up emphasizes weight-management progress and generic treatment effectiveness. When clinically significant weight change could alter OSA management, the plan should clearly prompt clinician-directed objective reassessment before de-escalating treatment.
5. **What-if BMI threshold:** A generic weight-management what-if may begin at BMI 27 under the chronic-weight-management pathway, but named OSA treatment with Zepbound requires obesity plus moderate-to-severe OSA. These pathways should remain visibly distinct.

### Clinician decisions needed for weight management

- Approve removal or qualification of the fixed “5-7 pounds” snoring statement.
- Approve dual GIP/GLP-1 terminology and explicit separation of the Zepbound OSA indication from general chronic-weight-management eligibility.
- Decide what constitutes “clinically significant” weight change for generating an objective reassessment prompt; the newer AASM guidance intentionally does not impose one universal percentage.
- Confirm that the app will never recommend stopping PAP or another active treatment without objective reassessment and clinician review.
- Confirm whether medication contraindication/warning capture belongs in the app or should remain a prescriber-only checkpoint. A partial automated screen must not be portrayed as medication clearance.

## Consolidated discrepancy and action matrix

| Priority | Finding | Evidence classification | Recommended disposition |
|---|---|---|---|
| High | Current conventional-hypoxemia citation details appear incorrect | Source-verification defect | Repair `docs/citations.md` and linked evidence entries in a future evidence-gated change |
| High | “Untreated insomnia is the strongest predictor of CPAP non-adherence” is not supported by Sweetman 2019 | Unsupported clinical claim | Remove or replace with a narrower statement that insomnia may complicate PAP use and that trial effects vary |
| High | “5-7 pounds” can noticeably reduce snoring is not supported by the reviewed primary evidence | Unsupported individualized quantitative claim | Remove the number or add an appropriate direct source and limitations |
| High | Commercial WatchPAT hypoxic-burden interchangeability has not been established | Method/provenance uncertainty | Do not compare against research cutoffs unless the algorithm and validation are confirmed |
| Medium | Exact conventional oxygen trigger set is presented with literature context but is not a validated joint rule | Local governance | Label every exact boundary as local conservative safety review, not prognosis or treatment allocation |
| Medium | ISI/AHI rule can be mistaken for a diagnosis | Local screen extrapolated beyond strongest trial population | Preserve as screen only; require clinician confirmation and distinguish mild-OSA extrapolation |
| Medium | Weight follow-up does not always surface objective OSA reassessment after meaningful weight change | Guideline-alignment opportunity | Add a clinician-directed PSG/HSAT reassessment prompt before therapy de-escalation |
| Low | Parekh publication year is listed as 2026 | Bibliographic defect | Correct to 2024 |
| Low | Tirzepatide is described under GLP-1 shorthand | Terminology precision | Prefer dual GIP/GLP-1 receptor agonist and distinguish brands/indications |

## Required clinician sign-off before implementation

1. Retain the COMISA rule as a screen, not a diagnosis.
2. Retain individualized CBT-I/PAP sequencing and sleepiness/safety monitoring.
3. Remove the unsupported CPAP-adherence predictor ranking.
4. Decide whether to retain HB 30 as an exploratory local signal or deactivate it pending method-specific validation.
5. Decide whether to retain the conventional oxygen bands as local safety triggers and define the follow-up action they should prompt.
6. Require burden-method provenance before numerical comparison across systems.
7. Remove or qualify the “5-7 pounds” snoring claim.
8. Add objective reassessment after clinically significant weight change before treatment de-escalation.
9. Keep tirzepatide eligibility, dosing, contraindication, and warning review under clinician/prescriber control.

## Limitations of this review

- This was a targeted review, not a formal systematic review or meta-analysis.
- Several hypoxic-burden algorithms are implemented in research software or proprietary products. Public descriptions may not be sufficient to reproduce every value.
- Cardiovascular-outcome analyses are heterogeneous in cohort, event scoring, PAP adherence, burden definition, and endpoint. Cut points should not be transported between studies without prospective validation.
- COMISA trials differ in insomnia confirmation, OSA severity, behavioral intervention, PAP support, and population; they do not establish individual treatment selection.
- Weight-loss studies differ in baseline diabetes status, OSA severity, intervention intensity, treatment use, and duration. Group means do not predict individual outcomes.
- FDA labeling can change. The current prescribing information must be rechecked at implementation and at each evidence review.

## Primary and official sources

### COMISA

1. Bastien CH, Vallières A, Morin CM. Validation of the Insomnia Severity Index as an outcome measure for insomnia research. *Sleep Medicine*. 2001;2(4):297-307. DOI: [10.1016/S1389-9457(00)00065-4](https://doi.org/10.1016/S1389-9457(00)00065-4). [PubMed](https://pubmed.ncbi.nlm.nih.gov/11438246/).
2. Sweetman A, Lack L, Catcheside PG, et al. Cognitive and behavioral therapy for insomnia increases the use of continuous positive airway pressure therapy in obstructive sleep apnea participants with comorbid insomnia: a randomized clinical trial. *Sleep*. 2019;42(12):zsz178. DOI: [10.1093/sleep/zsz178](https://doi.org/10.1093/sleep/zsz178). [PubMed](https://pubmed.ncbi.nlm.nih.gov/31403168/).
3. Ong JC, Crawford MR, Dawson SC, et al. A randomized controlled trial of CBT-I and PAP for obstructive sleep apnea and comorbid insomnia: main outcomes from the MATRICS study. *Sleep*. 2020;43(9):zsaa041. DOI: [10.1093/sleep/zsaa041](https://doi.org/10.1093/sleep/zsaa041). [PubMed](https://pubmed.ncbi.nlm.nih.gov/32170307/).
4. Alessi CA, Fung CH, Dzierzewski JM, et al. Randomized controlled trial of an integrated approach to treating insomnia and improving the use of positive airway pressure therapy in veterans with comorbid insomnia disorder and obstructive sleep apnea. *Sleep*. 2021;44(4):zsaa235. DOI: [10.1093/sleep/zsaa235](https://doi.org/10.1093/sleep/zsaa235). [PubMed](https://pubmed.ncbi.nlm.nih.gov/33221910/).
5. Sweetman A, Lack L, Catcheside PG, et al. The effect of cognitive and behavioral therapy for insomnia on week-to-week changes in sleepiness and sleep parameters in patients with comorbid insomnia and sleep apnea: a randomized controlled trial. *Sleep*. 2020;43(7):zsaa002. DOI: [10.1093/sleep/zsaa002](https://doi.org/10.1093/sleep/zsaa002).
6. Turner AD, et al. Neurocognitive functioning before and after cognitive behavioral therapy for insomnia in patients with comorbid insomnia and sleep apnea. *Sleep*. 2023;46(9):zsad128. DOI: [10.1093/sleep/zsad128](https://doi.org/10.1093/sleep/zsad128). [PubMed](https://pubmed.ncbi.nlm.nih.gov/37148183/).
7. Edinger JD, Arnedt JT, Bertisch SM, et al. Behavioral and psychological treatments for chronic insomnia disorder in adults: an American Academy of Sleep Medicine clinical practice guideline. *Journal of Clinical Sleep Medicine*. 2021;17(2):255-262. DOI: [10.5664/jcsm.8986](https://doi.org/10.5664/jcsm.8986). [PubMed](https://pubmed.ncbi.nlm.nih.gov/33164742/).
8. Qaseem A, Kansagara D, Forciea MA, Cooke M, Denberg TD. Management of chronic insomnia disorder in adults: a clinical practice guideline from the American College of Physicians. *Annals of Internal Medicine*. 2016;165(2):125-133. DOI: [10.7326/M15-2175](https://doi.org/10.7326/M15-2175). [PubMed](https://pubmed.ncbi.nlm.nih.gov/27136449/).

### Hypoxemia and hypoxic burden

9. Azarbarzin A, Sands SA, Stone KL, et al. The hypoxic burden of sleep apnoea predicts cardiovascular disease-related mortality: the Osteoporotic Fractures in Men Study and the Sleep Heart Health Study. *European Heart Journal*. 2019;40(14):1149-1157. DOI: [10.1093/eurheartj/ehy624](https://doi.org/10.1093/eurheartj/ehy624). [PubMed](https://pubmed.ncbi.nlm.nih.gov/30376054/).
10. Trzepizur W, Blanchard M, Ganem T, et al. Sleep apnea-specific hypoxic burden, symptom subtypes, and risk of cardiovascular events and all-cause mortality. *American Journal of Respiratory and Critical Care Medicine*. 2022;205(1):108-117. DOI: [10.1164/rccm.202105-1274OC](https://doi.org/10.1164/rccm.202105-1274OC).
11. Labarca G, Dreyse J, Salas C, et al. A validation study of the sleep apnea-specific hypoxic burden as a cardiovascular risk marker. *American Journal of Respiratory and Critical Care Medicine*. 2023. DOI: [10.1164/rccm.202209-1808OC](https://doi.org/10.1164/rccm.202209-1808OC).
12. Esmaeili N, et al. An oxygen desaturation-based measure of sleep apnea severity and its association with cardiovascular mortality. *Annals of the American Thoracic Society*. 2023. DOI: [10.1513/AnnalsATS.202303-248OC](https://doi.org/10.1513/AnnalsATS.202303-248OC). [PubMed](https://pubmed.ncbi.nlm.nih.gov/37531573/).
13. Pinilla L, et al. Hypoxic burden to guide CPAP treatment allocation in patients with obstructive sleep apnoea: a post hoc study of the ISAACC trial. *European Respiratory Journal*. 2023. DOI: [10.1183/13993003.00828-2023](https://doi.org/10.1183/13993003.00828-2023).
14. Pooled RICCADSA, ISAACC, and SAVE post hoc analysis. *European Heart Journal*. 2026. DOI: [10.1093/eurheartj/ehaf447](https://doi.org/10.1093/eurheartj/ehaf447). [PubMed](https://pubmed.ncbi.nlm.nih.gov/40794640/).
15. Do T90 and SaO2 nadir identify a different phenotype in obstructive sleep apnea? *Sleep and Breathing*. 2019;23(3):1007-1010. DOI: [10.1007/s11325-019-01860-0](https://doi.org/10.1007/s11325-019-01860-0). [PubMed](https://pubmed.ncbi.nlm.nih.gov/31081538/).
16. Oldenburg O, Wellmann B, Buchholz A, et al. Nocturnal hypoxaemia is associated with increased mortality in stable heart failure patients. *European Heart Journal*. 2016;37(21):1695-1703. DOI: [10.1093/eurheartj/ehv624](https://doi.org/10.1093/eurheartj/ehv624). [Journal page](https://academic.oup.com/eurheartj/article/37/21/1695/2887705).
17. Caples SM, Anderson WM, Calero K, Howell M, Hashmi SD. Use of polysomnography and home sleep apnea tests for the longitudinal management of obstructive sleep apnea in adults: an American Academy of Sleep Medicine clinical guidance statement. *Journal of Clinical Sleep Medicine*. 2021;17(6):1287-1293. DOI: [10.5664/jcsm.9240](https://doi.org/10.5664/jcsm.9240). [PubMed](https://pubmed.ncbi.nlm.nih.gov/33704050/).
18. Pengo MF, et al. Effect of CPAP therapy on blood pressure in patients with obstructive sleep apnoea: an individual patient data meta-analysis. *European Respiratory Journal*. 2025. DOI: [10.1183/13993003.00837-2024](https://doi.org/10.1183/13993003.00837-2024). [PubMed](https://pubmed.ncbi.nlm.nih.gov/39401854/).
19. Parekh A. Hypoxic burden: definitions, pathophysiological concepts, methods of evaluation, and clinical relevance. *Current Opinion in Pulmonary Medicine*. 2024;30(6):600-606. DOI: [10.1097/MCP.0000000000001122](https://doi.org/10.1097/MCP.0000000000001122). [PubMed](https://pubmed.ncbi.nlm.nih.gov/39229876/).
20. ATS Workshop Report: The Great Controversy of Obstructive Sleep Apnea Treatment for Cardiovascular Risk Benefit. *Annals of the American Thoracic Society*. DOI: [10.1513/AnnalsATS.202409-981ST](https://doi.org/10.1513/AnnalsATS.202409-981ST). [Open manuscript](https://escholarship.org/content/qt6gh842bj/qt6gh842bj.pdf).
21. Hypoxic burden based on peripheral arterial tonometry home sleep apnea testing and its association with OSA severity. *Sleep Science and Practice*. 2026. DOI: [10.1186/s41606-026-00174-x](https://doi.org/10.1186/s41606-026-00174-x). [Journal page](https://link.springer.com/article/10.1186/s41606-026-00174-x).

### Weight management and tirzepatide

22. Hudgel DW, Patel SR, Ahasic AM, et al. The role of weight management in the treatment of adult obstructive sleep apnea: an official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine*. 2018;198(6):e70-e87. DOI: [10.1164/rccm.201807-1326ST](https://doi.org/10.1164/rccm.201807-1326ST). [ATS executive summary PDF](https://www.thoracic.org/statements/resources/sleep-medicine/weight-mgmt-in-osa-treatment-exec-summ.pdf).
23. Foster GD, Borradaile KE, Sanders MH, et al. A randomized study on the effect of weight loss on obstructive sleep apnea among obese patients with type 2 diabetes: the Sleep AHEAD study. *Archives of Internal Medicine*. 2009;169(17):1619-1626. DOI: [10.1001/archinternmed.2009.266](https://doi.org/10.1001/archinternmed.2009.266). [PubMed](https://pubmed.ncbi.nlm.nih.gov/19786682/).
24. Kuna ST, Reboussin DM, Borradaile KE, et al. Effects of weight loss on obstructive sleep apnea severity: ten-year results of the Sleep AHEAD study. *American Journal of Respiratory and Critical Care Medicine*. 2021;203(2):221-229. DOI: [10.1164/rccm.201912-2511OC](https://doi.org/10.1164/rccm.201912-2511OC). [PubMed](https://pubmed.ncbi.nlm.nih.gov/32721163/).
25. Tuomilehto HPI, Seppä JM, Partinen MM, et al. Lifestyle intervention with weight reduction: first-line treatment in mild obstructive sleep apnea. *American Journal of Respiratory and Critical Care Medicine*. 2009;179(4):320-327. DOI: [10.1164/rccm.200805-669OC](https://doi.org/10.1164/rccm.200805-669OC). [PubMed](https://pubmed.ncbi.nlm.nih.gov/19011153/).
26. Peppard PE, Young T, Palta M, Dempsey J, Skatrud J. Longitudinal study of moderate weight change and sleep-disordered breathing. *JAMA*. 2000;284(23):3015-3021. DOI: [10.1001/jama.284.23.3015](https://doi.org/10.1001/jama.284.23.3015). [PubMed](https://pubmed.ncbi.nlm.nih.gov/11122588/).
27. Malhotra A, Grunstein RR, Fietze I, et al. Tirzepatide for the treatment of obstructive sleep apnea and obesity. *New England Journal of Medicine*. 2024;391:1193-1205. DOI: [10.1056/NEJMoa2404881](https://doi.org/10.1056/NEJMoa2404881). [PubMed](https://pubmed.ncbi.nlm.nih.gov/38912654/).
28. U.S. Food and Drug Administration. Zepbound (tirzepatide) prescribing information, current label reviewed 2026-08-13. [FDA label PDF](https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/217806s042lbl.pdf).
29. U.S. Food and Drug Administration. FDA approves first medication for obstructive sleep apnea. 2024-12-20. [FDA announcement](https://www.fda.gov/news-events/press-announcements/fda-approves-first-medication-obstructive-sleep-apnea).

All URLs were accessed or verified on 2026-08-13. DOI links are preferred as persistent identifiers; FDA labeling should be rechecked for the latest revision before implementation.
