# Clinical Evidence Basis and Validation Register

| Field | Current value |
|---|---|
| Application | Capital ENT Precision Sleep Clinical Hub |
| Document status | Living pre-validation evidence register |
| Register version | 2.3 |
| Clinical logic reviewed through | `ER-2026-08-13-GOVERNANCE-SIGNOFF`; Raymond Brown, MD approved six local-governance policies; symptomatic negative HSAT now promotes PSG as the draft default while explicit clinician override is preserved; see [`test-matrix-results.md`](test-matrix-results.md) for current regression results |
| Last comprehensive review | 2026-06-11 |
| Last targeted review | 2026-08-13 |
| Next scheduled review | 2027-01-19, or sooner after a major guideline, regulatory, or safety update |
| Readable scientific rationale | [`scientific-rationale-and-decision-logic.md`](scientific-rationale-and-decision-logic.md) |
| Detailed source library | [`citations.md`](citations.md) |
| Targeted primary-source review | [`research/scientific-rationale-primary-sources.md`](research/scientific-rationale-primary-sources.md) |
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

For a prose explanation of how the system turns inputs into a clinician-reviewed plan, start with
[`scientific-rationale-and-decision-logic.md`](scientific-rationale-and-decision-logic.md). This
register remains the controlling claim-by-claim audit record.

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
| DX-01 | Negative, inconclusive, or inadequate HSAT | A negative HSAT with persistent symptoms or clinical concern promotes PSG as the clinician draft's recommended next diagnostic step. A clinician may explicitly confirm an independently indicated contributor-first plan; the patient handout names PSG as active only when Diagnostic Testing is selected and confirmed. A positive numerical signal from a nondiagnostic home recording remains possible rather than confirmed OSA or severity. | E1/E5 | Guideline aligned default with clinician-confirmed local override | `citations.md`, Diagnostic Testing | Contributor-first sequencing is local governance and has not been compared directly with PSG-first care; clinician confirmation can still introduce delay or variation | Default-path concordance, override reason and rate, eventual PSG yield, diagnostic delay, missed disease, and patient-report accuracy |
| DX-02 | Home-study adequacy and limited REM sampling | Short total sleep time and limited REM suppress overconfident interpretation; WatchPAT sleep and REM values remain device-derived estimates. A short home recording suppresses the patient severity scale, subtype, phenotype narrative, and definitive risk narrative until the clinician confirms the diagnostic plan. | E1/E3 | Evidence informed | `citations.md`, Diagnostic Testing and REM Predominance | AASM technical adequacy criteria are not identical to every device-specific sleep-time estimate; REM minimum is a stability guardrail | PSG discordance by recording duration and REM minutes; patient comprehension of preliminary findings |
| DX-03 | WatchPAT diagnostic and severity interpretation | Mild and moderate pAHI results receive a clinician-only category-uncertainty flag; PSG is considered selectively when reclassification would change care; routine multi-night testing is not automatic | E1/E2/E3 | Evidence informed | `citations.md`, Diagnostic Testing and Home-Study Boundaries | Device-versus-PSG discordance, night-to-night variability, and pretest probability are distinct sources of uncertainty; no validated app-specific rule quantifies an individual's misclassification probability | Agreement with PSG, treatment-decision concordance, selective-PSG yield, and missed clinically important disease |
| DX-04 | Clinician next-test guidance | Completed studies are classified into PSG recommended, PSG reasonable to consider, selective multi-night HST may be useful, or no additional diagnostic test now. Persistent concern after a negative HSAT enters PSG recommended. The module drafts but never confirms Diagnostic Testing. | E1/E2/E3/E5 | Guideline aligned with clinician signoff | `citations.md`, Diagnostic Testing and Home-Study Boundaries | The four-state hierarchy is a local workflow synthesis and has not been prospectively validated. Selective multi-night HST rests on expert consensus and heterogeneous device evidence. Patient-reported risks require clinical verification. | Guideline concordance, clinician override rate, diagnostic yield, time to treatment, missed disease, and patient-report leakage |
| PH-01 | High anatomical contribution | Composite of BMI, neck, tonsils, Friedman tongue position, and severity | E3/E5 | Exploratory | `citations.md`, OSA Phenotyping and Friedman Staging | The app's exact composite and confidence tiers have not been externally validated | Agreement with expert anatomy assessment, DISE pattern, or treatment response |
| PH-02 | Low arousal threshold | Edwards variables when available; partial WatchPAT pathway is explicitly limited signal | E3/E4 | Exploratory | `citations.md`, Arousal Threshold | The validated Edwards score requires all variables; missing apnea/hypopnea breakdown weakens inference | Agreement with PSG-derived arousal threshold or validated surrogate |
| PH-03 | Possible ventilatory instability or high loop gain | Qualitative central and periodic-breathing signal; no numeric loop-gain estimate | E4 | Exploratory | `citations.md`, Loop Gain | Central-event and CSR signals are not equivalent to measured loop gain | Agreement with PSG/PUP-derived loop gain and treatment-emergent central apnea |
| PH-04 | Poor muscle responsiveness | REM/NREM and persistent NREM burden used as an indirect surrogate | E4 | Exploratory | `citations.md`, OSA Phenotyping | Not a direct measurement of muscle compensation; confidence is capped | Agreement with PSG/PUP-derived muscle compensation or treatment response |
| PH-05 | Positional OSA | Confirmed OSA plus a supine AHI at least twice non-supine AHI identifies a positional pattern. Non-supine AHI below 5 is labeled supine-isolated; non-supine AHI 5 or higher is supine-predominant. Phenotype detection, the patient explanation, and the editable plan draft share this classifier; the draft labels supine-predominant treatment as adjunctive. WatchPAT-derived confidence is capped at Moderate. | E2/E3/E4 | Evidence informed | `citations.md`, OSA Phenotyping and Positional Therapy | The ratio does not establish adequate non-supine or non-supine REM exposure, single-night stability, adherence, or durable monotherapy response | Reproducibility, position-duration and non-supine REM adequacy, PSG agreement, adherence, draft-to-final concordance, and objectively verified response |
| PH-06 | REM-predominant OSA | REM/NREM ratio plus NREM ceiling; requires at least 30 estimated REM minutes; WatchPAT-derived confidence is capped at Moderate | E3 | Evidence informed | `citations.md`, OSA Phenotyping | Single-night PAT REM phenotyping has limited sensitivity even with adequate REM, and sleep staging is algorithmic | Agreement with PSG and stability across nights |
| PH-07 | Event-linked hypoxic burden research signal | Uses only respiratory-event-linked desaturation area divided by sleep time. The 30 %min/h boundary is exploratory; 73.1 and 87.1 are displayed only as post hoc research-cohort context. Confidence is capped at Moderate and HB alone cannot select, withhold, or rank treatment. | E2/E3 | Evidence informed, exploratory | `citations.md`, Event-Linked Hypoxic Burden | No universally validated clinical categories or prospective HB-guided treatment-allocation trial exists. WatchPAT metric methodology must be verified before assuming interchangeability with scored-event HB or HBOxi. | Reproducibility, method agreement, cardiovascular-risk discrimination, clinician interpretation, and prospective treatment interaction |
| PH-08 | Nasal-resistance contributor | NOSE score, symptoms, and structural exam findings; clinician tooltip separates expected nasal-symptom benefit from uncertain AHI response | E2/E3 | Evidence informed | `citations.md`, Nasal Obstruction and Treatment | Higher baseline NOSE predicts greater average nasal-symptom benefit, not AHI response. PAP benefit is most plausible when obstruction is the dominant barrier, but that predictor is supported by small observational cohorts and is not externally validated. | Change in NOSE, sleep quality, snoring, PAP adherence/pressure, and AHI, stratified by baseline NOSE and competing PAP barriers |
| PH-09 | Elevated delta heart rate | Manual entry pathway retained but disabled for the current device workflow | E3 | Inactive or future | `citations.md`, HB Treatment Allocation and HBOxi methods | WatchPAT pulse-rate summary must not be substituted for event-linked delta HR | Association with cardiovascular outcomes and incremental value beyond HB |
| TX-01 | COMISA sequencing and safety | ISI at least 15 plus AHI at least 5 flags an operational COMISA pattern. CBT-I is offered early; PAP may begin concurrently or sequentially based on severity, substantial nocturnal hypoxemia, sleepiness, access, and preference. High baseline ESS triggers early sleepiness and safety monitoring during bedtime restriction, not a CBT-I contraindication. PAP mode and settings remain individualized. | E2 | Evidence informed | `citations.md`, COMISA | ISI plus AHI is a screen, not a complete chronic-insomnia diagnosis. Adherence benefit varies across trials; no validated rule selects sequence, PAP mode, pressure range, or CBT-I pacing for an individual. | ISI, PAP uptake and adherence, sleepiness trajectory, safety events, patient-reported benefit, sequence chosen, and clinician override rate |
| TX-02 | Oral-appliance selection and response context | Oral appliance therapy is routed by patient preference, PAP tolerance, dental and TMJ safety, and prior response. Age, BMI, neck size, sex, severity, anatomy, and research endotypes are shown only as directional population-level context. No app-created response score, favorable/poor tier, or probability is emitted. | E1/E2/E3/E4 | Guideline aligned for treatment pathway and follow-up; evidence informed for contextual associations | `citations.md`, Oral Appliance Selection and Response Context | No externally validated, guideline-endorsed individual response rule exists; subjective benefit and objective AHI response can diverge | Objective on-treatment AHI or RDI, symptoms, adherence, adverse effects, discontinuation, and clinician override rate |
| TX-03 | HGNS candidacy and response context | Device-specific FDA eligibility and safety rules are separated from response context. Complete lateral oropharyngeal-wall collapse is a negative unilateral-HGNS response signal; partial collapse is not treated as equivalent. Ji staging, PAP pressure, demographic associations, and measured PSG endotypes cannot be counted into a success tier. A clinician-confirmed HGNS-only handout now distinguishes a new device-specific evaluation from follow-up of an existing implant: the new-device pathway explains required review, conditional testing, and uncertainty without promising eligibility or success; the existing-device pathway emphasizes use, programming, barriers, and clinician-selected objective on-therapy verification rather than repeating candidacy steps. | E1/E3/E4 | Guideline aligned for labeling; evidence informed or exploratory for response context | `citations.md`, HNS Clinical Staging and DISE Evidence | Device labels, follow-up protocols, and payer rules change; the complete-lateral-wall evidence does not create an individual probability; airflow-shape analysis requires a separately validated raw-flow algorithm unavailable from standard WatchPAT summaries; the handout structure is a local communication workflow rather than a validated care pathway | Eligibility accuracy, objective HGNS response, complete versus partial lateral-wall interaction, calibration by device, patient comprehension, completion of selected evaluation or verification steps, and clinician override rate |
| TX-04 | Weight-management and tirzepatide pathway | Weight counseling by BMI; tirzepatide discussion limited to the on-label obesity plus moderate-to-severe OSA context | E1/E2 | Guideline aligned | `citations.md`, Weight Management | Individual response varies and medication eligibility requires full clinical review | Weight change, AHI, symptoms, adverse effects, and treatment persistence |
| TX-05 | Nasal-first sequencing after a negative HSAT | PSG is promoted by default when concern persists. Nasal-first sequencing remains available only when the clinician explicitly confirms treatment of independently indicated obstruction without selecting Diagnostic Testing; the handout then describes PSG as a possible later step if symptoms persist. | E2/E5 | Clinician-approved local override informed by symptom evidence | `citations.md`, Diagnostic Testing and Nasal Obstruction and Treatment | No direct trial compares nasal-first with PSG-first diagnostic sequencing | Override reason and rate, symptom response, eventual PSG yield, diagnostic delay, missed disease, and patient preference |
| TX-06 | Primary-snoring treatment pathway after OSA is not identified | Conservative contributors are addressed first; an oral appliance remains an evidence-based option when requested; nasal surgery is presented only as an adjunct for documented obstruction with uncertain snoring response | E1/E2/E5 | Guideline aligned with local signoff workflow | `citations.md`, Primary Snoring | Partner-reported and objective snoring measures are poorly standardized; isolated nasal-surgery evidence is inconsistent and AAO-HNS did not reach consensus on septoplasty for primary snoring | Partner-reported snoring, validated SOS, objective acoustic burden, persistence, adverse effects, and treatment escalation |
| TX-07 | Upper-airway surgery response context | Friedman stage and DISE findings localize anatomy and inform procedure discussion. Stage I anatomy is supportive and Stage III is less supportive of isolated palatal surgery, but no exact success percentage or general DISE-derived response score is displayed. | E2/E3/E4/E5 | Evidence informed with local workflow | `citations.md`, Friedman Staging System, Surgical Selection, and DISE Evidence | DISE scoring has moderate interrater reliability and inconsistent predictive performance; available MMA and pharyngeal-surgery models lack external validation | Procedure-specific objective response, symptoms, complications, DISE interrater agreement, calibration, and clinician override rate |
| TX-08 | Longitudinal patient-reported follow-up | A short returning-patient questionnaire repeats ESS at each visit and conditionally repeats ISI or NOSE when the corresponding symptom or treatment remains relevant. It also captures treatment use, perceived benefit, barriers, safety changes, and current weight. Submissions are stored as pending program checkpoints and cannot overwrite baseline chart fields or alter clinical recommendations until clinician review. | E3/E5 | Evidence informed measurement with local governance | `citations.md`, Longitudinal Patient-Reported Follow-up | ESS, ISI, and NOSE are subjective instruments and changes can reflect response shift, recall, comorbidity, or measurement variability. The app-specific branching and review workflow have not been validated, and patient-reported adherence or benefit is not objective treatment efficacy. | Completion time, missingness, score change, clinician agreement, treatment-specific objective outcomes, override rate, and safety-event detection |
| TX-09 | Patient-stated visit context and clinician confirmation | The initial patient questionnaire requires a structured main reason for the visit. The answer can populate or create a pending correction for the chart's visit context and may change report emphasis or draft plan suggestions. It cannot select or confirm treatment. An MA can correct the answer, and the clinician must review and confirm today's plan. | E5 | Local governance | `citations.md`, Patient-Stated Visit Context and Clinician Confirmation | The option set is a local workflow taxonomy, may not capture multiple or changing goals, and may introduce anchoring if treated as a diagnosis or treatment request. It has not been validated for clinical outcomes or usability. | Completion time, missingness, patient-MA-clinician agreement, correction rate, suggestion override rate, inappropriate pathway activation, and patient-rated report relevance |
| SAF-01 | ASV and reduced LVEF | Suppress or warn against ASV when LVEF is 45% or lower; request missing LVEF when central-directed therapy is considered | E1/E2 | Guideline aligned safety rule | `citations.md`, CPAP Limitations and Cautions | Applies to the defined heart-failure population and therapy context | Safety-rule sensitivity and missed contraindications |
| SAF-02 | Central or periodic-breathing signals on home testing | Require in-lab confirmation before advanced central-apnea-directed treatment is finalized | E1/E3 | Guideline aligned safety rule | `citations.md`, Diagnostic Testing and CPAP Limitations | A small WatchPAT validation study found limited sensitivity for central disease; central estimates depend on the available sensor configuration | PSG confirmation rate and inappropriate advanced-treatment avoidance |
| SAF-03 | Substantial nocturnal hypoxemia | ODI >50/h, T90 >20%, nadir SpO2 <75%, or area below 90% >2/h triggers separate clinician review, timely effective treatment of confirmed OSA, consideration of non-OSA contributors, and objective confirmation of oxygen control. These metrics never create the event-linked HB phenotype. | E2/E3/E5 | Evidence informed safety boundary | `citations.md`, Event-Linked Hypoxic Burden and Conventional Nocturnal Hypoxemia | The exact app thresholds are conservative review bands rather than prospectively validated universal action thresholds; causal attribution requires clinical evaluation. | Clinician agreement, non-OSA diagnosis yield, treatment urgency, follow-up oxygen control, and false-alert rate |
| SAF-04 | Uncertain patient-reported cardiovascular history | A patient response of unsure is preserved as an unresolved cardiovascular-history flag for MA and clinician review. It is not converted to a confirmed condition, a negative history, an LVEF value, or an automatic treatment rule. | E5 | Local governance safety boundary | `citations.md`, Diagnostic Testing and Home-Study Boundaries | Patient uncertainty is nonspecific and the app does not identify which record is missing; staff must verify the history and obtain relevant records when clinically indicated. | Resolution rate, time to source verification, false-negative history avoidance, unnecessary record requests, and clinician agreement |
| PAP-01 | Clinician PAP download interpretation | Verified usage, nightly coverage, manufacturer-specific leak context, device-reported residual events, event type, symptoms, baseline nocturnal hypoxemia, and cardiovascular context are synthesized into reviewable guidance. An elevated P95 leak prompts review of duration, graph pattern, mask type, and symptoms but is not treated as confirmed sustained major leak. No pressure is selected and no setting is changed automatically. | E1/E3/E5 | Evidence informed with clinician signoff | `citations.md`, Patient Behavior and PAP Counseling | Device algorithms and report definitions vary; the 5 and 10 event-index bands and P95 leak references are contextual review triggers rather than validated universal treatment thresholds; the exact multi-signal hierarchy is a local workflow synthesis | Extraction accuracy by vendor, clinician agreement, override rate, repeat-testing yield, residual disease on reference testing, and time to effective treatment |
| PAP-02 | Symptom-download discordance | A low device-reported event index does not close the review when explicitly documented current symptoms despite PAP persist or baseline nocturnal hypoxemia was substantial. The assistant names the symptom trigger and presents oximetry or formal testing only as a conditional clinician-selected option after confirmed major leak is corrected when present. Historical ESS or prior treatment response alone cannot trigger discordance. | E1/E3 | Evidence informed | `citations.md`, Patient Behavior and PAP Counseling | Recent supporting evidence includes selected cohorts and non-PSG comparators; the optimal modality and threshold for retesting are not established | PSG or oximetry yield, symptom resolution, false reassurance, unnecessary testing, and clinician agreement |
| PAP-03 | Possible central events on PAP download | Device central index at least 5 per hour is a review signal. Guidance avoids reflex pressure escalation, adds therapy-duration and heart-failure context, requests LVEF when needed, and recommends formal confirmation when persistent, clinically important, or unexplained. | E1/E3/E5 | Guideline aligned safety boundary with local workflow | `citations.md`, Patient Behavior and PAP Counseling and CPAP Limitations and Cautions | Device central classification is not diagnostic; treatment-emergent events can resolve, but a fixed observation period must not delay evaluation of severe symptoms, hypoxemia, high burden, or cardiovascular instability | PSG confirmation, inappropriate pressure-escalation avoidance, LVEF capture, time to appropriate modality, and safety-rule sensitivity |

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
