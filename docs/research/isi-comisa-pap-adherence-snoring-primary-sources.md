# ISI/COMISA labeling, PAP adherence predictors, and weight loss for adult snoring

**Review date:** 2026-08-13  
**Evidence searched through:** 2026-08-13  
**Purpose:** Targeted primary-source review for Precision Sleep wording and flag policy  
**Repository files audited:** `docs/evidence-basis.md`, `docs/citations.md`, `docs/evidence-review-log.md`, `js/config.js`, `js/app.js`, `js/patientReport.js`, `js/precision-sleep.js`, and `js/report-shared.js`  
**Change boundary:** This note does not change application code or the three release-gate evidence documents. Any resulting clinical wording or behavior change requires the repository's clinical-change gate, regression coverage, and clinician approval.

## Questions and bottom-line answers

### 1. What does ISI 15 or higher establish, and when can the app say COMISA?

An Insomnia Severity Index (ISI) score of 15 or higher is appropriately described as **consistent with clinically significant insomnia symptoms** or as a **positive insomnia screen**. It can also be described using the questionnaire's conventional “moderate clinical insomnia” severity band, but only if the report immediately clarifies that this is a questionnaire severity descriptor rather than a diagnosis.

ISI alone does not establish chronic insomnia disorder. Formal diagnosis requires a clinical history addressing sleep opportunity, frequency, duration, daytime impairment, and alternative explanations. Under current AASM/ICSD-3-TR criteria, chronic insomnia symptoms generally occur at least three times per week for at least three months despite adequate opportunity and circumstances for sleep.

When OSA is objectively established with AHI at least 5 and ISI is at least 15, the app can say **“COMISA screen positive”** or **“coexisting clinically significant insomnia symptoms and OSA, often called COMISA.”** It should not say that the patient definitively “has insomnia” or “has COMISA” unless a clinician has confirmed insomnia disorder or the intended label is explicitly defined as a screening phenotype.

### 2. Can the app predict PAP acceptance, adherence, or discontinuation?

No baseline factor or currently available app-created score is sufficiently validated and transportable to predict an individual's PAP behavior. Associations recur across studies, but their direction and magnitude vary with the definition of adherence, population, access, follow-up, treatment support, and time horizon.

The most actionable signal is **observed early PAP behavior**, especially objective use during the first days to weeks, together with current mask/interface problems, leak, dryness, nasal symptoms, claustrophobia, pressure intolerance, low confidence, and unresolved access barriers. Those signals should trigger prompt support, not a prediction label or treatment denial.

Baseline AHI/severity, sleepiness, age, sex, race, socioeconomic context, insomnia, depression, and physiologic traits may be associated with PAP behavior in some cohorts. None should be used alone to label a patient as a likely adherer/nonadherer, rank them away from PAP, or imply personal fault. Race and socioeconomic findings in particular are contextual signals of inequity and access barriers, not biologic traits.

### 3. Does losing 5–7 pounds reliably reduce adult snoring?

No. Weight gain and higher BMI are associated with habitual snoring, and weight management is reasonable for adults with overweight or obesity. However, no defensible universal pound or percentage threshold for snoring improvement was identified.

The apparent basis for a 5–7 pound statement is a 1995 study in 19 male heavy snorers that added weight loss to side sleeping plus nasal decongestant. Only nine participants lost at least 3 kg (6.6 lb), and snoring frequency fell in that small subgroup with a borderline result. Weight loss was not randomized or isolated, the sample was tiny, and individual response varied markedly. This cannot support the app's current “as little as 5–7 pounds can noticeably reduce snoring” claim.

## Evidence-class framework

| Class | Use in this review | Decision-support boundary |
|---|---|---|
| Official diagnostic/guideline source | Defines diagnostic criteria or recommended PAP-support practices | Can support screening and workflow language; does not create an individual prediction |
| Instrument-validation study | Establishes questionnaire reliability, severity bands, or screening performance | Supports “screen” and symptom-severity wording, not a standalone diagnosis |
| Systematic review/meta-analysis | Summarizes consistency and heterogeneity across studies | Supports directional context; study-level meta-regression is not an individual prediction model |
| Prospective/registry cohort | Identifies associations over a defined period and population | Can identify support needs; cannot establish causality or transportable risk probabilities |
| Prediction-model development/internal validation | Estimates performance in development-like data | Must not be deployed without appropriate external validation and clinical utility evidence |
| Local governance | Conservative workflow policy selected by Precision Sleep | Must be labeled local and require clinician oversight |

## Reproducible search method

### Sources searched

- PubMed/MEDLINE
- AASM official guideline, clinical guidance, and ICSD-3-TR materials
- ATS official workshop/policy statements
- DOI and journal pages for bibliographic verification and full-text methods when available
- Reference lists of systematic reviews and official statements to locate foundational prospective cohorts

### Search concepts

Searches were performed on 2026-08-13 using combinations of:

- `Insomnia Severity Index 15 clinically significant insomnia validation`
- `ISI cutoff insomnia disorder structured interview sensitivity specificity`
- `COMISA definition ISI 15 AHI 5`
- `PAP CPAP acceptance adherence discontinuation predictors systematic review meta-analysis`
- `CPAP early use first week long-term adherence prospective cohort`
- `CPAP adherence prediction model external validation`
- `self efficacy beliefs mask leak nasal obstruction socioeconomic PAP adherence`
- `low respiratory arousal threshold CPAP adherence external validation`
- `weight loss adult snoring randomized trial longitudinal cohort`
- `3 kg weight loss snoring Braver Block Perri`

### Inclusion and exclusion

Included sources were official guidance, instrument-validation studies, systematic reviews/meta-analyses, primary prospective or registry cohorts, and prediction-model studies directly relevant to an app claim. Studies were not treated as individual prediction evidence unless they reported a prediction model with validation and clinically interpretable performance. Pediatric studies, non-OSA ventilation populations, opinion pieces used as sole support, conference abstracts, and weight-loss studies that did not report adult snoring were excluded from the snoring conclusion.

## Domain 1: ISI, insomnia screening, and COMISA labeling

### What the ISI measures

The seven-item ISI measures perceived insomnia symptom severity, satisfaction/distress, interference, and noticeability over a recent interval. Bastien et al. validated it as a brief screening and outcome instrument in insomnia-clinic and treatment samples. The conventional interpretive bands commonly associated with the instrument are:

- 0–7: no clinically significant insomnia;
- 8–14: subthreshold insomnia;
- 15–21: moderate clinical insomnia; and
- 22–28: severe clinical insomnia.

These bands quantify the questionnaire response. They do not independently verify chronicity, frequency, adequate sleep opportunity, or exclusion of other causes.

Morin et al. later found that an ISI cutoff of 10 optimized community case detection (86.1% sensitivity and 87.7% specificity) against their reference classification. Other structured-interview validation studies have produced different optimal thresholds in different populations. This threshold variation reinforces that 15 is a deliberately specific **clinically important symptom boundary**, not a universal diagnostic cutoff.

### Formal insomnia disorder requires more than ISI

The AASM's ICSD-3-TR materials describe chronic insomnia disorder as difficulty initiating or maintaining sleep, or waking earlier than desired, despite adequate opportunity/circumstances, with relevant daytime impairment. Symptoms generally must occur at least three times per week for at least three months. Clinical evaluation must consider short-term insomnia and other sleep, medical, psychiatric, circadian, medication, and substance-related explanations.

Accordingly:

- **Supported:** “ISI 18 is consistent with clinically significant insomnia symptoms.”
- **Supported:** “Your questionnaire falls in the conventional moderate clinical insomnia range.”
- **Supported with objective OSA:** “COMISA screen positive: clinically significant insomnia symptoms plus OSA.”
- **Not supported from ISI alone:** “You have chronic insomnia disorder.”
- **Not supported before objective OSA:** “You have COMISA.”

### Can ISI ≥15 plus AHI ≥5 be called COMISA?

Published studies frequently operationalize COMISA or “OSA with insomnia” using ISI at least 15 plus objectively diagnosed OSA. Examples include Cho et al. and Rodrigues et al.; these are research classifications, not a consensus diagnostic rule. Other COMISA studies require a diagnostic interview or use different symptom criteria and OSA thresholds. A 2026 narrative review explicitly notes that prior definitions and diagnostic workflows have been heterogeneous and proposes a more structured framework.

For Precision Sleep, the evidence-calibrated distinction is:

| Available evidence | Permitted label |
|---|---|
| ISI ≥15, no objective OSA | “Clinically significant insomnia symptoms” or “positive insomnia screen” |
| ISI ≥15 plus objectively established AHI ≥5 | “COMISA screen positive” or “coexisting clinically significant insomnia symptoms and OSA, often called COMISA” |
| Clinician-confirmed insomnia disorder plus objectively established OSA | “COMISA” or “coexisting insomnia disorder and OSA” |

AHI at least 5 is the conventional objective OSA floor, but symptom context and diagnostic provenance still matter. The strongest COMISA treatment trials generally enrolled confirmed insomnia disorder with AHI at least 15. Therefore, the app's AHI 5 boundary is appropriate for screening and coordination, not for inferring a treatment effect or sequence in mild OSA.

### Exact recommended app wording

**Clinician result header, unconfirmed insomnia disorder:**

> COMISA screen positive: ISI {score} is consistent with clinically significant insomnia symptoms, and the sleep study confirms OSA. Confirm insomnia frequency, duration, daytime impact, sleep opportunity, and other causes before documenting chronic insomnia disorder.

**Patient report, unconfirmed insomnia disorder:**

> Your questionnaire shows clinically significant insomnia symptoms, and your sleep study shows sleep apnea. These often occur together and are sometimes called COMISA. Your clinician will confirm the insomnia diagnosis and help decide how to address both problems.

**Questionnaire score explanation:**

> Your ISI score of {score} falls in the {moderate/severe} symptom range. This is a screening result, not a diagnosis by itself.

**Clinician-confirmed case:**

> You have insomnia disorder and obstructive sleep apnea occurring together, called COMISA.

Avoid the unqualified statements “You have both insomnia and sleep apnea” and “Your Sleep Apnea Pattern: COMISA” when the only insomnia evidence is ISI.

### Current-app audit

Aligned:

- `js/config.js` and `TX-01` define ISI at least 15 plus AHI at least 5 as an operational COMISA screen rather than a diagnosis.
- The clinician recommendation at `js/app.js` uses “COMISA screen positive.”
- The release-gate evidence basis states that duration/frequency criteria still require confirmation.

Wording discrepancies:

1. `js/app.js` uses “Moderate insomnia” or “Severe insomnia” in the COMISA guardrail without consistently stating that these are ISI symptom ranges.
2. `js/patientReport.js` says “You have both insomnia and breathing interruptions during sleep” and “You have both insomnia and sleep apnea (COMISA).” If ISI is the only insomnia evidence, this overstates a screening result as a confirmed diagnosis.
3. The patient subtype heading “Your Sleep Apnea Pattern: COMISA” should say “Your screening pattern: insomnia symptoms plus sleep apnea” unless clinician confirmation is separately captured.
4. The terminology guide defines COMISA as “Insomnia and sleep apnea occurring together,” which is accurate for confirmed COMISA but does not disclose the screen/diagnosis boundary in an ISI-only report.

## Domain 2: PAP acceptance, adherence, and discontinuation

### The outcomes are different

The app and evidence documents should not use “acceptance,” “initiation,” “adherence,” and “discontinuation” interchangeably:

- **Acceptance/uptake:** agreeing to obtain or trial PAP.
- **Initiation:** actually starting home PAP.
- **Early use:** objective behavior during the first days or weeks.
- **Adherence:** usage over a defined period; definitions vary substantially.
- **Persistence/discontinuation:** continued treatment or device return/cessation over months to years.

A factor associated with initial acceptance may not predict use among people who start therapy, and a factor associated with three-month hours may not predict multi-year discontinuation.

### What systematic reviews and official guidance support

Weaver's 2022 review emphasizes that adherence definitions vary and that many univariate associations have uncertain clinical magnitude; relatively few analyses compare predictors in multivariable frameworks. Kasetti et al.'s 2024 systematic review of pretreatment beliefs/cognitions found 21 studies, of which 62% were rated poor quality. Self-efficacy, outcome expectations, perceived benefits/barriers, and health value were recurrent signals, but evidence was too sparse and heterogeneous for an individual prediction rule.

A 2026 study-level meta-analysis of 136 CPAP randomized trials (8,827 participants) found higher trial-level baseline AHI associated with more nightly CPAP use, while trial-level age, sex distribution, BMI, ESS, and follow-up were not significant. This is ecological meta-regression across trials, not a patient-level model. It cannot assign an individual adherence probability or establish AHI as a reason to withhold PAP in milder disease.

The AASM PAP guideline provides the strongest actionable policy: education before PAP initiation, behavioral and/or troubleshooting support early in treatment, and telemonitoring-guided intervention during the initial period improve adherence on average. These interventions are useful without first labeling a patient high risk.

### Predictor evidence by category

| Factor | Evidence summary | Modifiability | Appropriate app use |
|---|---|---|---|
| Objective use in first days/weeks | Most consistent predictor of later use across cohorts; later prediction partly reflects persistence of an already observed behavior | Yes, through rapid support; also an outcome already underway | High-priority “early support needed” trigger; never label inevitable failure |
| Mask/interface discomfort, leak, dryness, congestion, pressure intolerance, claustrophobia | Recurrent associations with poorer use; ATS mask workshop and prospective studies support active troubleshooting | Often modifiable | Specific barrier flag and action checklist |
| Self-efficacy, perceived benefit, outcome expectations, treatment concerns | Recurrent but heterogeneously measured; some factors emerge mainly after PAP experience | Modifiable | Ask directly and offer education/motivational/problem-solving support; no probability |
| Short home trial and titration experience | Associated with acceptance and later use in selected cohorts | Modifiable | Offer acclimation and reassess experience |
| Access, cost, socioeconomic and social context | Associated with uptake/use in several cohorts; heavily confounded by structural factors | Potentially modifiable at system level | Resource/access flag; never encode race or income as biologic nonadherence risk |
| OSA severity/AHI and sleepiness | Often associated with acceptance/use, but inconsistent across cohorts and meta-analyses | Nonmodifiable baseline context; symptoms can improve | Context only; no adherence tier |
| Age and sex | Direction varies by population and outcome | Nonmodifiable | Do not use as a risk flag |
| Race/ethnicity | Observed disparities likely reflect access, environment, discrimination, trust, and structural inequity | Not a biologic predictor | Never use race to predict adherence; assess remediable barriers directly |
| Insomnia/depression/anxiety | Associations vary; COMISA trials show CBT-I may help insomnia and sometimes PAP use | Potentially treatable | Screen and treat because clinically important, not because it is the “strongest predictor” |
| Nasal resistance/obstruction | Plausible and sometimes associated with tolerance; response to treatment is heterogeneous | Often modifiable | Flag documented symptoms/barrier for targeted treatment; do not promise adherence improvement |
| Low respiratory arousal threshold/endotypes | Selected observational cohorts report association; methods and populations are limited and not externally validated for individual prediction | Not an established clinical adherence target | Research context only; do not route away from PAP or toward sedative medication |

### Acceptance and discontinuation cohorts

In a cohort of 188 adults with moderate-to-severe OSA, higher AHI, satisfaction with titration, initial intention, and a short home trial were associated with CPAP acceptance; among acceptors, first-two-week use and fewer global PAP problems predicted six-month adherence. This usefully demonstrates that acceptance and adherence have different determinants, but it is a single cohort and not an externally validated score.

Large registry studies report associations between persistence and age, sex, AHI, ESS, BMI, comorbidities, humidifier use, and socioeconomic context. Directions are not fully consistent between Sweden, France, VA cohorts, and clinic populations. Device return, insurance claims, reimbursement cessation, and downloaded hours are also different outcomes.

The most reproducible clinical implication is to avoid waiting: PAP-use patterns become apparent early, and prompt identification of low use or barriers creates an opportunity for support. A recent multicenter cohort found 98% of three-month nonadherent patients were already nonadherent at one month, and early behavior explained much of later status in its validation dataset. This supports early outreach, not deterministic forecasting.

### Prediction models and external validation

Several small studies report apparently high internally validated AUCs, but development samples are small, selected, and vulnerable to overfitting. Wang et al. derived baseline and three-week scores in only 76 Chinese patients and explicitly called for external validation. An “Adherence Index” derived from sleep-depth and gas-exchange measures was developed in a severe-OSA referral cohort; independent transportability and clinical utility were not established.

A 2024 multidimensional prediction review reported internal validation in only 18% of reviewed studies and external validation in only one. A large single-system VA comparison of machine-learning approaches used a held-out internal validation set but found no model clinically useful from baseline EHR variables; adding 30-day PAP data improved performance, although that data overlap conceptually with the 90-day outcome. The VA authors explicitly stated that external validation in a non-VA population is necessary.

No externally validated, guideline-endorsed baseline adherence model suitable for Precision Sleep deployment was identified. Therefore:

- do not emit “high/low likelihood of PAP adherence”;
- do not use an adherence score to rank PAP below alternatives;
- do not treat early low use as futility;
- do use early objective use and specific barriers to prioritize outreach and troubleshooting; and
- measure whether app-triggered support improves usage rather than assuming the predictor itself is causal.

### Exact recommended app wording

**Before PAP begins:**

> PAP use is difficult to predict before treatment. The patient has documented factors that may need extra support: {specific barriers}. Provide education, interface fitting or acclimation, and a clear early follow-up plan.

**After PAP begins and objective use is low:**

> Early PAP use is below the agreed treatment goal. Early patterns often continue unless barriers are addressed, but they do not determine long-term success. Review mask fit/leak, nasal or oral symptoms, pressure comfort, sleep opportunity, insomnia, confidence, perceived benefit, and access; intervene and recheck objective data promptly.

**Patient-facing:**

> Many PAP problems can be improved. Your early use helps the care team know where support is needed; it does not mean you have failed treatment.

**Insomnia/PAP relationship:**

> Insomnia can make PAP adaptation more difficult for some people. Treat the insomnia and address PAP barriers early; research does not identify insomnia as a universal or strongest predictor of PAP use.

### Current-app audit

Aligned:

- The PAP assistant reviews objective usage and specific modifiable barriers, and it keeps device-reported leak/residual-event limitations visible.
- The app recommends early education, troubleshooting, and objective follow-up.
- COMISA sequencing is individualized rather than automatically delaying PAP.

Discrepancies and policy risks:

1. **Unsupported superlative:** `js/app.js` states, “Untreated insomnia is the strongest predictor of CPAP non-adherence (Sweetman 2019).” Sweetman 2019 was a randomized CBT-I intervention trial, not a predictor comparison. The statement should be replaced with the calibrated insomnia wording above.
2. **Low-arousal-threshold overreach in evidence library:** `docs/citations.md` says low arousal threshold predicts “62% lower” adherence and that patients “may need MAD/sedative-hypnotics over CPAP.” Zinchuk 2018 found lower odds of regular CPAP use only in a nonobese subgroup of male veterans, using a surrogate arousal-threshold score and a noncontinuous adherence classification. It does not validate treatment ranking or medication routing.
3. **“Alternatives-first” overreach:** The adjacent citation states low arousal threshold supports an alternatives-first approach. No externally validated decision rule was identified. Endotype information should remain exploratory context and must not determine PAP candidacy or adherence expectation.
4. **Potential inequity:** Demographic associations should not become automated flags. The app should capture direct access, cost, housing/sleep-environment, language, digital-access, and support barriers if it intends to help resolve them.

## Domain 3: weight loss and adult snoring

### Direct interventional evidence

Braver, Block, and Perri studied 20 asymptomatic men who snored heavily; 19 completed a six-month weight-loss program after previously being tested with side sleeping plus nasal decongestant. Twelve lost any weight, and nine lost at least 3 kg. In those nine, snores per hour fell from 320 to 176 with a borderline `p = 0.0496`. Three participants who lost an average 7.6 kg had near elimination of snoring, while other participants responded less.

This study does not establish a 3 kg threshold because:

- weight loss was not randomized;
- the analysis was a very small post hoc subgroup;
- weight loss was added to two other interventions;
- only men with heavy snoring were included;
- the outcome was a single repeat-night snoring frequency measure; and
- there was marked individual variability.

The finding is directional support that weight loss may reduce snoring in some adults, not evidence that 5–7 lb is a minimum effective dose or that improvement is noticeable for an individual.

### Longitudinal association

A 10-year follow-up of 2,668 Swedish men found weight gain associated with future habitual snoring after adjustment for prior snoring and age, with smoking also relevant in younger men. This supports weight as a contributor but does not prove that reversing a given number of kilograms reverses snoring. Cross-sectional studies likewise show more snoring with overweight/obesity but cannot establish a treatment threshold.

Randomized weight-management trials in OSA (Sleep AHEAD, MIMOSA, INTERAPNEA, and others) show average AHI and cardiometabolic improvements with weight loss. Those OSA outcomes cannot be substituted for an objective primary-snoring response, and their percentage-weight-loss strata do not validate a snoring threshold.

Official weight-management and primary-snoring guidance supports healthy weight and addressing contributors in adults with overweight or obesity. It does not specify a pound threshold at which snoring will improve.

### Exact recommended app wording

**Patient-facing, overweight or obesity present:**

> If you have overweight or obesity, weight management may reduce snoring and can improve sleep apnea and overall health. The amount of snoring improvement varies, and no specific number of pounds guarantees a response.

**Patient-facing, weight status unavailable or normal:**

> Weight is only one possible contributor to snoring. Your clinician can help identify whether weight management is relevant for you.

**Clinician-facing:**

> Higher weight and weight gain are associated with snoring, but evidence does not support an individual pound or percentage threshold for snoring improvement. Track weight and snoring separately and reassess OSA objectively when clinically indicated.

Avoid:

- “Even losing 5–7 pounds can noticeably reduce snoring.”
- “Any weight loss will reduce snoring.”
- “Weight loss makes any future treatment work better.”

### Current-app audit

1. `js/patientReport.js` says “even modest weight loss (as little as 5–7 pounds) can noticeably reduce snoring.” This is not defensible from the direct evidence.
2. A second patient-report passage says, “Even losing 5–7 pounds can noticeably cut snoring, and it makes any future treatment work better.” Both the fixed threshold and universal treatment-enhancement claim should be removed or substantially qualified.
3. The release-gate evidence basis correctly states that no fixed weight change predicts AHI or snoring response. Runtime wording is therefore currently misaligned with the documented evidence boundary.

## Recommended policy decisions

| Decision | Recommendation | Rationale |
|---|---|---|
| ISI terminology | Approve “clinically significant insomnia symptoms” for ISI ≥15 | Accurate screening language without diagnosing disorder |
| COMISA terminology | Use “COMISA screen positive” for ISI ≥15 plus objective AHI ≥5; reserve unqualified COMISA for clinician-confirmed insomnia disorder | Matches heterogeneous literature and protects the screen/diagnosis boundary |
| ISI severity bands | If “moderate/severe insomnia” is shown, append “symptom range on the ISI; screening result” | Preserves useful severity context without overstatement |
| PAP prediction | Do not create a baseline adherence probability or favorable/poor tier | No transportable externally validated model identified |
| PAP support flags | Permit flags only for observed early low use and documented, potentially remediable barriers | Strongest actionable evidence and least stigmatizing use |
| Demographic variables | Do not flag race, sex, age, or socioeconomic status as adherence risk | Inconsistent/confounded and inequitable; assess direct barriers instead |
| Low arousal threshold | Remove treatment-ranking and adherence-prediction language; retain research context only | Selected observational subgroup evidence, no validated individual rule |
| Insomnia superlative | Remove “strongest predictor of CPAP non-adherence” | Sweetman 2019 does not support it, and broader evidence is heterogeneous |
| Weight/snoring threshold | Remove 5–7 lb claim and use nonquantified “may reduce snoring” language when weight management is relevant | Direct evidence is too small and confounded for a threshold |

## Limitations

- This was a targeted review, not a de novo systematic review with duplicate screening.
- PAP studies use heterogeneous adherence definitions, time horizons, devices, healthcare systems, and levels of support.
- Prediction-model reporting is inconsistent, and apparent internal performance often does not establish calibration, transportability, fairness, or clinical utility.
- Early PAP use is partly an early measurement of the eventual behavior rather than a pretreatment causal predictor.
- COMISA studies use heterogeneous insomnia and OSA definitions. The 2026 proposed diagnostic workflow is a narrative proposal, not an adopted international consensus standard.
- Direct adult snoring/weight-loss intervention evidence is sparse and old. Absence of a validated threshold does not mean weight management lacks broader health or OSA benefits.

## Primary and official sources

### ISI and COMISA

1. Bastien CH, Vallières A, Morin CM. Validation of the Insomnia Severity Index as an outcome measure for insomnia research. *Sleep Medicine*. 2001;2(4):297-307. DOI: [10.1016/S1389-9457(00)00065-4](https://doi.org/10.1016/S1389-9457(00)00065-4). [PubMed](https://pubmed.ncbi.nlm.nih.gov/11438246/).
2. Morin CM, Belleville G, Bélanger L, Ivers H. The Insomnia Severity Index: psychometric indicators to detect insomnia cases and evaluate treatment response. *Sleep*. 2011;34(5):601-608. DOI: [10.1093/sleep/34.5.601](https://doi.org/10.1093/sleep/34.5.601). [PubMed](https://pubmed.ncbi.nlm.nih.gov/21532953/).
3. American Academy of Sleep Medicine. ICSD-3-TR insomnia diagnostic criteria materials. [AASM draft criteria PDF](https://aasm.org/wp-content/uploads/2022/05/ICSD-3-TR-Insomnia-Draft.pdf); [AASM provider fact sheet](https://aasm.org/wp-content/uploads/2022/07/ProviderFS-Insomnia.pdf).
4. Wong ML, Lau KNT, Espie CA, Luik AI, Kyle SD, Lau EYY. Psychometric properties of the Sleep Condition Indicator and Insomnia Severity Index in the evaluation of insomnia disorder. *Sleep Medicine*. 2017;33:76-81. DOI: [10.1016/j.sleep.2016.05.019](https://doi.org/10.1016/j.sleep.2016.05.019). [PubMed](https://pubmed.ncbi.nlm.nih.gov/28449911/).
5. Cho YW, Kim KT, Moon HJ, et al. Comorbid insomnia with obstructive sleep apnea: clinical characteristics and risk factors. *Journal of Clinical Sleep Medicine*. 2018;14(3):409-417. DOI: [10.5664/jcsm.6988](https://doi.org/10.5664/jcsm.6988). [PubMed](https://pubmed.ncbi.nlm.nih.gov/29458695/).
6. Rodrigues MM, et al. Respiratory arousal threshold among patients with isolated sleep apnea and with comorbid insomnia. *Scientific Reports*. 2023;13. DOI: [10.1038/s41598-023-34002-4](https://doi.org/10.1038/s41598-023-34002-4). [PubMed](https://pubmed.ncbi.nlm.nih.gov/37169833/).
7. Zhang Y, Kushida CA. New definition, diagnostic criteria, and diagnostic workflows for patients with suspected COMISA. *Sleep Medicine*. 2026;142:108871. DOI: [10.1016/j.sleep.2026.108871](https://doi.org/10.1016/j.sleep.2026.108871). [PubMed](https://pubmed.ncbi.nlm.nih.gov/41780436/). Narrative proposal; included to document current definitional heterogeneity, not as a binding consensus standard.

### PAP acceptance, adherence, and discontinuation

8. Patil SP, Ayappa IA, Caples SM, Kimoff RJ, Patel SR, Harrod CG. Treatment of adult obstructive sleep apnea with positive airway pressure: an American Academy of Sleep Medicine clinical practice guideline. *Journal of Clinical Sleep Medicine*. 2019;15(2):335-343. DOI: [10.5664/jcsm.7640](https://doi.org/10.5664/jcsm.7640). [Open full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC6374094/).
9. Weaver TE. Best predictors of continuous positive airway pressure adherence. *Sleep Medicine Clinics*. 2022;17(4):587-595. DOI: [10.1016/j.jsmc.2022.07.005](https://doi.org/10.1016/j.jsmc.2022.07.005). [PubMed](https://pubmed.ncbi.nlm.nih.gov/36333078/).
10. Kasetti P, Husain NF, Skinner TC, et al. Personality traits and pre-treatment beliefs and cognitions predicting patient adherence to continuous positive airway pressure: a systematic review. *Sleep Medicine Reviews*. 2024;74:101910. DOI: [10.1016/j.smrv.2024.101910](https://doi.org/10.1016/j.smrv.2024.101910). [PubMed](https://pubmed.ncbi.nlm.nih.gov/38471433/).
11. Benning L, Bousraou Z, Bradicich M, Ulrich S, Schwarz EI. Adherence to CPAP in randomized controlled trials in obstructive sleep apnoea: a meta-analysis and investigation of predictors. *Journal of Clinical Medicine*. 2026;15(9):3264. DOI: [10.3390/jcm15093264](https://doi.org/10.3390/jcm15093264). [PubMed](https://pubmed.ncbi.nlm.nih.gov/42122998/).
12. Genta PR, Kaminska M, Edwards BA, et al. The importance of mask selection on continuous positive airway pressure outcomes for obstructive sleep apnea: an official American Thoracic Society workshop report. *Annals of the American Thoracic Society*. 2020;17(10):1177-1185. DOI: [10.1513/AnnalsATS.202007-864ST](https://doi.org/10.1513/AnnalsATS.202007-864ST). [PubMed](https://pubmed.ncbi.nlm.nih.gov/33000960/).
13. Jiang T, Wang Z, Wu Y, et al. Acceptance of and six-month adherence to continuous positive airway pressure in patients with moderate to severe obstructive sleep apnea. *Clinical Respiratory Journal*. 2021;15:56-64. DOI: [10.1111/crj.13269](https://doi.org/10.1111/crj.13269). [PubMed](https://pubmed.ncbi.nlm.nih.gov/32939997/).
14. Budhiraja R, Parthasarathy S, Drake CL, et al. Early CPAP use identifies subsequent adherence to CPAP therapy. *Sleep*. 2007;30(3):320-324. [PubMed](https://pubmed.ncbi.nlm.nih.gov/17425228/).
15. Ye L, Pack AI, Maislin G, et al. Predictors of continuous positive airway pressure use during the first week of treatment. *Journal of Sleep Research*. 2012;21(4):419-426. [Open full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC4476292/).
16. Palm A, Grote L, Theorell-Haglöw J, et al. Factors influencing adherence to continuous positive airway pressure treatment in obstructive sleep apnea and mortality associated with treatment failure: a national registry-based cohort study. *Sleep Medicine*. 2018;51:85-91. DOI: [10.1016/j.sleep.2018.06.007](https://doi.org/10.1016/j.sleep.2018.06.007). [PubMed](https://pubmed.ncbi.nlm.nih.gov/30103074/).
17. Pépin JL, Bailly S, Rinder P, et al. CPAP therapy termination rates by OSA phenotype: a French nationwide database analysis. *Journal of Clinical Medicine*. 2021;10. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33804319/).
18. Simon-Tuval T, Reuveni H, Greenberg-Dotan S, Oksenberg A, Tal A, Tarasiuk A. Low socioeconomic status is a risk factor for CPAP acceptance among adult OSAS patients requiring treatment. *Sleep*. 2009;32(4):545-552. DOI: [10.1093/sleep/32.4.545](https://doi.org/10.1093/sleep/32.4.545). [PubMed](https://pubmed.ncbi.nlm.nih.gov/19413149/).
19. Billings ME, Auckley D, Benca R, et al. Race and residential socioeconomics as predictors of CPAP adherence. *Sleep*. 2011. [PubMed](https://pubmed.ncbi.nlm.nih.gov/22131602/).
20. Wang Y, Gao W, Sun M, Chen B. Pre- and in-therapy predictive score models of adult OSAS patients with poor adherence pattern on nCPAP therapy. *Patient Preference and Adherence*. 2015;9:715-723. [Open full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC4455858/).
21. Younes M, et al. Adherence Index: sleep depth and nocturnal hypoventilation predict long-term adherence with positive airway pressure therapy in severe obstructive sleep apnea. *Journal of Clinical Sleep Medicine*. 2022. [Open full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC9340588/).
22. Comparison of machine-learning approaches for positive airway pressure adherence prediction in a veteran cohort. [PubMed](https://pubmed.ncbi.nlm.nih.gov/41424513/); [open full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC12713837/). Internal held-out validation only; authors state non-VA external validation is needed.
23. Multidimensional prediction of continuous positive airway pressure adherence. *Sleep Medicine*. 2024. [Journal page](https://www.sciencedirect.com/science/article/pii/S1389945724003897). Review finding: internal validation was uncommon and external validation was reported in only one reviewed study.
24. Zinchuk A, Edwards BA, Jeon S, et al. Prevalence, associated clinical features, and impact on continuous positive airway pressure use of a low respiratory arousal threshold among male United States veterans with obstructive sleep apnea. *Journal of Clinical Sleep Medicine*. 2018;14(5):809-817. DOI: [10.5664/jcsm.7112](https://doi.org/10.5664/jcsm.7112). [PubMed](https://pubmed.ncbi.nlm.nih.gov/29734986/).
25. Six early CPAP-usage behavioural patterns determine peak CPAP adherence and permit tailored intervention in patients with obstructive sleep apnoea. 2025. [PubMed](https://pubmed.ncbi.nlm.nih.gov/40015971/).

### Weight and adult snoring

26. Braver HM, Block AJ, Perri MG. Treatment for snoring: combined weight loss, sleeping on side, and nasal spray. *Chest*. 1995;107(5):1283-1288. DOI: [10.1378/chest.107.5.1283](https://doi.org/10.1378/chest.107.5.1283). [PubMed](https://pubmed.ncbi.nlm.nih.gov/7750319/).
27. Lindberg E, Taube A, Janson C, Gislason T, Svärdsudd K, Boman G. A 10-year follow-up of snoring in men. *Chest*. 1998;114(4):1048-1055. [PubMed](https://pubmed.ncbi.nlm.nih.gov/9792576/).
28. Hudgel DW, Patel SR, Ahasic AM, et al. The role of weight management in the treatment of adult obstructive sleep apnea: an official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine*. 2018;198(6):e70-e87. DOI: [10.1164/rccm.201807-1326ST](https://doi.org/10.1164/rccm.201807-1326ST). [ATS full guideline PDF](https://www.thoracic.org/statements/resources/sleep-medicine/weight-mgmt-in-osa-treatment.pdf).
29. Sarkis LM, Jones AC, Ng A, et al. Australasian Sleep Association position statement on consensus and evidence based treatment for primary snoring. *Respirology*. 2023;28(2):110-119. DOI: [10.1111/resp.14443](https://doi.org/10.1111/resp.14443). [PubMed](https://pubmed.ncbi.nlm.nih.gov/36617387/).

All links were accessed or verified on 2026-08-13. The newest PAP prediction literature should be reassessed before any model is deployed, and app claims should continue to be reviewed against direct primary evidence rather than a predictor review's narrative ranking.
