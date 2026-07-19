# Clinical Evidence Basis and Validation Register

| Field | Current value |
|---|---|
| Application | Capital ENT Precision Sleep Clinical Hub |
| Document status | Living pre-validation evidence register |
| Register version | 1.3 |
| Clinical logic reviewed through | Build `d4fdd89` |
| Last comprehensive review | 2026-06-11 |
| Last targeted review | 2026-07-19 |
| Next scheduled review | 2027-01-19, or sooner after a major guideline, regulatory, or safety update |
| Detailed source library | [`citations.md`](citations.md) |
| Review history | [`evidence-review-log.md`](evidence-review-log.md) |
| Executable scenario inventory | [`test-matrix.md`](test-matrix.md) |
| Current threshold implementation | [`../js/config.js`](../js/config.js) |

## Purpose

This document states what the app is claiming, how strongly each claim is supported, where the
logic is implemented, and what still requires clinical validation. It is intended to support:

- clinical review and safe software maintenance;
- protocol development for retrospective or prospective validation;
- transparent description of the algorithm in a manuscript;
- periodic surveillance for new evidence that may change app logic; and
- reconstruction of the exact evidence basis for any frozen study build.

This register does not establish that the app is clinically validated. The app remains a
clinician-facing decision-support tool. Its phenotype labels, confidence labels, treatment ranking,
and patient explanations must not be interpreted as independently validated diagnoses,
probabilities, or treatment prescriptions unless a row below explicitly says otherwise.

This is a structured evidence register, not a completed systematic review or formal GRADE
assessment. A manuscript that makes efficacy, diagnostic-accuracy, or predictive-performance claims
will require a prespecified search strategy, duplicate screening as appropriate, formal risk-of-bias
assessment, and statistical validation using a frozen application build.

## Evidence classification

| Level | Evidence type | Appropriate use in the app |
|---|---|---|
| E1 | Current guideline, formal position statement, or regulatory labeling | Safety boundary, eligibility rule, or standard diagnostic/treatment pathway |
| E2 | Systematic review, meta-analysis, or randomized trial | Treatment benefit, comparative effectiveness, or validated patient counseling |
| E3 | External validation study or well-designed prospective/retrospective cohort | Predictor, risk marker, or phenotype association with explicit limitations |
| E4 | Small cohort, single-center model, mechanistic study, or indirect extrapolation | Exploratory signal only; avoid deterministic or probability language |
| E5 | Local clinical consensus, workflow policy, or usability decision | Operational behavior only; label as local and do not present it as published evidence |

Evidence level describes the strongest direct support for the app's specific use, not merely the
highest-level publication cited in the same topic area. A high-quality study can still provide only
indirect support for a different threshold, population, device, or treatment sequence.

## Logic status

| Status | Meaning |
|---|---|
| Guideline aligned | Directly follows a current guideline, position statement, or regulatory rule |
| Evidence informed | Supported by clinical literature but still requires individual judgment |
| Exploratory | Composite, surrogate, or prediction logic that needs external or prospective validation |
| Local governance | Capital ENT safety or workflow policy, not a universal clinical rule |
| Inactive or future | Retained for research or future devices but not active in current output |

## Core clinical-logic register

| ID | App decision or output | Current implementation | Level | Status | Primary evidence location | Principal limitation | Candidate validation endpoint |
|---|---|---|---|---|---|---|---|
| DX-01 | Negative, inconclusive, or inadequate HSAT | Clinician flag and draft diagnostic-testing pathway; patient handout names PSG as ordered only after clinician selection and confirmation | E1 | Guideline aligned with local signoff workflow | `citations.md`, Diagnostic Testing | Treating another plausible contributor before PSG is individualized sequencing and has not been directly compared with PSG-first care | Expert agreement on PSG timing; missed clinically important sleep-disordered breathing |
| DX-02 | Home-study adequacy and limited REM sampling | Short total sleep time and limited REM suppress overconfident interpretation; WatchPAT sleep and REM values remain device-derived estimates | E1/E3 | Evidence informed | `citations.md`, Diagnostic Testing and REM Predominance | AASM technical adequacy criteria are not identical to every device-specific sleep-time estimate; REM minimum is a stability guardrail | PSG discordance by recording duration and REM minutes |
| DX-03 | WatchPAT diagnostic and severity interpretation | Mild and moderate pAHI results receive a clinician-only category-uncertainty flag; PSG is considered selectively when reclassification would change care; routine multi-night testing is not automatic | E1/E2/E3 | Evidence informed | `citations.md`, Diagnostic Testing and Home-Study Boundaries | Device-versus-PSG discordance, night-to-night variability, and pretest probability are distinct sources of uncertainty; no validated app-specific rule quantifies an individual's misclassification probability | Agreement with PSG, treatment-decision concordance, selective-PSG yield, and missed clinically important disease |
| PH-01 | High anatomical contribution | Composite of BMI, neck, tonsils, Friedman tongue position, and severity | E3/E5 | Exploratory | `citations.md`, OSA Phenotyping and Friedman Staging | The app's exact composite and confidence tiers have not been externally validated | Agreement with expert anatomy assessment, DISE pattern, or treatment response |
| PH-02 | Low arousal threshold | Edwards variables when available; partial WatchPAT pathway is explicitly limited signal | E3/E4 | Exploratory | `citations.md`, Arousal Threshold | The validated Edwards score requires all variables; missing apnea/hypopnea breakdown weakens inference | Agreement with PSG-derived arousal threshold or validated surrogate |
| PH-03 | Possible ventilatory instability or high loop gain | Qualitative central and periodic-breathing signal; no numeric loop-gain estimate | E4 | Exploratory | `citations.md`, Loop Gain | Central-event and CSR signals are not equivalent to measured loop gain | Agreement with PSG/PUP-derived loop gain and treatment-emergent central apnea |
| PH-04 | Poor muscle responsiveness | REM/NREM and persistent NREM burden used as an indirect surrogate | E4 | Exploratory | `citations.md`, OSA Phenotyping | Not a direct measurement of muscle compensation; confidence is capped | Agreement with PSG/PUP-derived muscle compensation or treatment response |
| PH-05 | Positional OSA | Supine/non-supine ratio plus non-supine AHI ceiling; WatchPAT-derived confidence is capped at Moderate | E3/E4 | Evidence informed | `citations.md`, OSA Phenotyping | The app does not capture time in each position, night-to-night exposure varies, and WatchPAT positional phenotype agreement has not been specifically validated against PSG | Reproducibility, position-duration adequacy, PSG agreement, and response to positional therapy |
| PH-06 | REM-predominant OSA | REM/NREM ratio plus NREM ceiling; requires at least 30 estimated REM minutes; WatchPAT-derived confidence is capped at Moderate | E3 | Evidence informed | `citations.md`, OSA Phenotyping | Single-night PAT REM phenotyping has limited sensitivity even with adequate REM, and sleep staging is algorithmic | Agreement with PSG and stability across nights |
| PH-07 | Elevated or high hypoxic burden | Composite of HB, ODI, T90, and nadir; moderate tier is context only, high tier can increase urgency | E2/E3 | Evidence informed with exploratory composite | `citations.md`, Hypoxic Burden | Cohort thresholds are population-derived and are not universal guideline cutoffs; the exact worst-metric composite is app-specific | Cardiovascular-risk discrimination, treatment response, and calibration |
| PH-08 | Nasal-resistance contributor | NOSE score, symptoms, and structural exam findings; clinician tooltip separates expected nasal-symptom benefit from uncertain AHI response | E2/E3 | Evidence informed | `citations.md`, Nasal Obstruction and Treatment | Higher baseline NOSE predicts greater average nasal-symptom benefit, not AHI response. PAP benefit is most plausible when obstruction is the dominant barrier, but that predictor is supported by small observational cohorts and is not externally validated. | Change in NOSE, sleep quality, snoring, PAP adherence/pressure, and AHI, stratified by baseline NOSE and competing PAP barriers |
| PH-09 | Elevated delta heart rate | Manual entry pathway retained but disabled for the current device workflow | E3 | Inactive or future | `citations.md`, HB Treatment Allocation and HBOxi methods | WatchPAT pulse-rate summary must not be substituted for event-linked delta HR | Association with cardiovascular outcomes and incremental value beyond HB |
| TX-01 | COMISA sequencing | CBT-I is offered early; PAP may begin concurrently or sequentially based on severity, oxygen burden, sleepiness, access, and preference | E2 | Evidence informed | `citations.md`, COMISA | Adherence benefit varies across trials; urgent OSA treatment should not be delayed | ISI, PAP uptake/adherence, sleepiness, and patient-reported benefit |
| TX-02 | MAD candidacy tier | Composite score using severity, BMI, age, sex, neck, position, anatomy, and available endotype signals | E3/E4 | Exploratory | `citations.md`, MAD Candidacy | Individual predictors are supported, but the exact point score and tier cutoffs are app-created | Discrimination and calibration for MAD response and discontinuation |
| TX-03 | HGNS candidacy and response context | Device-specific FDA eligibility and safety rules are separated from a qualitative, unvalidated response tier | E1/E4 | Guideline aligned for labeling; exploratory for response prediction | `citations.md`, HNS Clinical Staging | Device labels and payer rules change; the Ji model is single-center and incompletely represented | Eligibility accuracy and response prediction by device |
| TX-04 | Weight-management and tirzepatide pathway | Weight counseling by BMI; tirzepatide discussion limited to the on-label obesity plus moderate-to-severe OSA context | E1/E2 | Guideline aligned | `citations.md`, Weight Management | Individual response varies and medication eligibility requires full clinical review | Weight change, AHI, symptoms, adverse effects, and treatment persistence |
| TX-05 | Nasal-first sequencing after a negative HSAT | Available only through clinician judgment and plan confirmation; PSG remains a possible later step if symptoms persist | E2/E5 | Local governance informed by symptom evidence | `citations.md`, Diagnostic Testing and Nasal Obstruction and Treatment | No direct trial compares nasal-first with PSG-first diagnostic sequencing | Resolution of symptoms, eventual PSG yield, delay to diagnosis, and patient preference |
| TX-06 | Primary-snoring treatment pathway after OSA is not identified | Conservative contributors are addressed first; an oral appliance remains an evidence-based option when requested; nasal surgery is presented only as an adjunct for documented obstruction with uncertain snoring response | E1/E2/E5 | Guideline aligned with local signoff workflow | `citations.md`, Primary Snoring | Partner-reported and objective snoring measures are poorly standardized; isolated nasal-surgery evidence is inconsistent and AAO-HNS did not reach consensus on septoplasty for primary snoring | Partner-reported snoring, validated SOS, objective acoustic burden, persistence, adverse effects, and treatment escalation |
| SAF-01 | ASV and reduced LVEF | Suppress or warn against ASV when LVEF is 45% or lower; request missing LVEF when central-directed therapy is considered | E1/E2 | Guideline aligned safety rule | `citations.md`, CPAP Limitations and Cautions | Applies to the defined heart-failure population and therapy context | Safety-rule sensitivity and missed contraindications |
| SAF-02 | Central or periodic-breathing signals on home testing | Require in-lab confirmation before advanced central-apnea-directed treatment is finalized | E1/E3 | Guideline aligned safety rule | `citations.md`, Diagnostic Testing and CPAP Limitations | A small WatchPAT validation study found limited sensitivity for central disease; central estimates depend on the available sensor configuration | PSG confirmation rate and inappropriate advanced-treatment avoidance |

## Rules for interpreting the register

1. An evidence level applies to the stated app use, not to the topic in general.
2. Composite scores created by the app remain exploratory even when every component has published support.
3. Population-derived thresholds must not be described as universal clinical cutoffs.
4. Device labeling, payer requirements, and local referral guardrails must remain visibly separate.
5. Missing data should reduce confidence or suppress a conclusion, never be interpreted as a negative finding.
6. Patient-facing reports may simplify language but must not increase certainty beyond the clinician view.
7. Clinician confirmation is part of the intervention and must be described as such in any validation study.

## Evidence surveillance protocol

Perform a structured review at least every six months during the pilot, before freezing a research
version, and within 30 days of a major AASM, ATS, FDA, or device-label update that may affect the
app. Prioritize primary sources and current official documents.

Minimum sources:

- PubMed/MEDLINE;
- AASM guidelines, position statements, and scoring updates;
- ATS and major sleep-medicine society statements;
- FDA device and drug databases, including supplements and safety communications;
- high-quality systematic reviews and major randomized or external-validation studies; and
- device-specific validation literature when a metric is device derived.

For every review, record the search date, cutoff date, databases, search concepts, inclusion
criteria, relevant new studies, appraisal, effect on logic, affected IDs, code commit, and build in
[`evidence-review-log.md`](evidence-review-log.md). An AI-generated evidence summary may help find
papers but is not itself evidence. Verify the primary publication, guideline, or regulatory source
before changing logic.

## Evidence-change workflow

Every clinical-logic change must complete all of the following in the same pull request or commit
series:

1. identify the affected Logic ID, or add a new ID here;
2. add or update the primary source in [`citations.md`](citations.md), including how it is used and its limitation;
3. classify the evidence level and logic status;
4. update the code comment and any threshold note in `js/config.js`;
5. add a regression scenario covering the intended behavior and a plausible counterexample;
6. add an entry to [`evidence-review-log.md`](evidence-review-log.md);
7. update the reviewed build after verification; and
8. obtain clinician review before deployment when the change can alter diagnosis, treatment ranking, safety messaging, or patient instructions.

## Prospective validation data requirements

A formal study should preserve the following for each encounter without relying on the mutable
current version of the application:

- immutable app build ID and evidence-register version;
- raw entered values, source type, units, and missingness before derived calculations;
- study device and report version;
- every phenotype and signal-strength output;
- every recommendation and safety flag before clinician modification;
- the clinician's selected plan, overrides, and optional reason for override;
- an independent reference assessment from a prespecified expert panel;
- patient comprehension, usefulness, and decisional-conflict measures;
- staff data-entry time, correction rate, and extraction errors;
- treatment chosen, adherence, adverse events, symptoms, and follow-up sleep metrics; and
- prespecified exclusions, missing-data handling, and subgroup definitions.

The study data dictionary should use the Logic IDs above so that analyses remain interpretable if
the production app changes during enrollment.

## Candidate study sequence

### Stage 1: Retrospective and expert-panel validation

- Primary question: Does the frozen app produce clinically acceptable phenotypes, safety flags,
  and treatment options from existing de-identified cases?
- Candidate outcomes: agreement, weighted kappa, safety-rule sensitivity, false reassurance,
  inappropriate recommendation rate, and expert-rated usefulness.
- Important design feature: reviewers should assess cases without seeing the app output first.

### Stage 2: Prospective silent-mode validation

- Run the app without letting its output influence care until the clinician records an independent
  assessment.
- Compare app output, independent clinician assessment, and adjudicated expert reference.
- Measure extraction accuracy and missing-data behavior before evaluating clinical agreement.

### Stage 3: Clinical utility and implementation study

- Candidate outcomes: visit time, staff workload, documentation completeness, clinician override
  rate, patient understanding, treatment uptake, adherence, symptoms, and safety events.
- Freeze the intervention build and patient-report templates for the study period. Treat later
  software changes as a new intervention version.

Predictive claims such as MAD response, HGNS response, cardiovascular-risk discrimination, or
treatment benefit require outcome-based validation and should not be considered established by
agreement with expert opinion alone.
