# Precision Sleep: Scientific Rationale and Decision Logic

| Field | Current value |
|---|---|
| Application | Capital ENT Precision Sleep Clinical Hub |
| Document status | Living clinical rationale for clinician and collaborator review |
| Scope of this version | Decision framework, diagnostic study assessment, hypoglossal nerve stimulation, oral appliance therapy, PAP optimization, COMISA, oxygen metrics, and weight management |
| Evidence cutoff | 2026-08-13 targeted review, with continuing surveillance required |
| Formal evidence register | [`evidence-basis.md`](evidence-basis.md) |
| Annotated primary-source library | [`citations.md`](citations.md) |
| Review and decision history | [`evidence-review-log.md`](evidence-review-log.md) |
| Targeted primary-source review | [`research/scientific-rationale-primary-sources.md`](research/scientific-rationale-primary-sources.md) |
| COMISA, oxygen, and weight source review | [`research/comisa-hypoxemia-weight-primary-sources.md`](research/comisa-hypoxemia-weight-primary-sources.md) |
| ISI, PAP support, and snoring source review | [`research/isi-comisa-pap-adherence-snoring-primary-sources.md`](research/isi-comisa-pap-adherence-snoring-primary-sources.md) |
| Executable scenario inventory | [`test-matrix.md`](test-matrix.md) |

## Executive summary

Precision Sleep is a clinician-facing decision-support system for obstructive sleep apnea (OSA). It
does not replace a sleep study, diagnose a physiologic endotype directly, determine insurance
coverage, or prescribe treatment without clinician review. Its purpose is narrower and more
practical: assemble information that is usually scattered across questionnaires, sleep-study
reports, physical examination, treatment history, preferences, and PAP downloads; identify
clinically important findings and missing prerequisites; and turn those findings into a structured
draft for the visit.

The system is designed around four realities of OSA care:

1. A single apnea-hypopnea index (AHI) does not fully describe the patient's disease, symptoms,
   anatomy, oxygen burden, treatment barriers, or priorities.
2. Treatment eligibility, treatment safety, expected response, and patient preference are related
   but distinct questions.
3. Many potentially useful predictors are population-level associations and are not validated as
   individual response calculators.
4. Missing or uncertain information must lower confidence, trigger verification, or suppress a
   pathway. It must never be silently interpreted as a normal finding.

Precision Sleep therefore combines guideline-aligned boundaries with evidence-informed clinical
context and explicit local workflow guardrails. The output is a draft clinician guide and a
patient-friendly explanation. The clinician confirms the interpretation and plan before either is
treated as the visit outcome.

## What this document is, and is not

This document explains the reasoning architecture in prose. It is intended to let a physician,
research collaborator, product reviewer, or clinical staff member understand how inputs become
outputs and where judgment remains necessary.

It is not a claim that Precision Sleep has been prospectively validated. It is also not a substitute
for the linked evidence register. For audit purposes:

- [`evidence-basis.md`](evidence-basis.md) defines each Logic ID, evidence level, implementation,
  limitation, and proposed validation endpoint.
- [`citations.md`](citations.md) identifies the primary source and exactly how it is used.
- [`evidence-review-log.md`](evidence-review-log.md) records searches, clinical interpretations,
  and decisions, including reviews that produced no code change.
- [`test-matrix.md`](test-matrix.md) and the automated test suite specify expected behavior and
  counterexamples.

If this narrative and the formal register differ, the formal register and current implementation
control until the discrepancy is reviewed.

## The decision framework

### 1. Establish what is known and where it came from

The app distinguishes patient-reported information, staff-entered information, imported study data,
device-download data, and clinician findings. That distinction matters. A patient can accurately
report prior CPAP intolerance or a treatment preference, but a remembered sleep-study result is not
equivalent to the original report. Similarly, an algorithm-estimated sleep stage from a home device
is not interchangeable with technician-scored polysomnography.

The first task is therefore not to generate a recommendation. It is to identify the provenance,
completeness, and clinical meaning of the available data.

### 2. Apply diagnostic and safety boundaries before treatment matching

Precision Sleep asks whether OSA is objectively established, whether the study is interpretable for
the decision at hand, and whether any finding requires escalation or verification. Examples include
an inadequate or negative home sleep apnea test despite persistent concern, possible central
events, substantial nocturnal hypoxemia, limited rapid eye movement (REM) sleep, or a
patient-reported prior study whose report is unavailable.

These boundaries can prevent a treatment pathway from becoming active. A stated interest in Inspire,
for example, can set the visit's focus but cannot substitute for documented diagnostic severity,
PAP history, device-specific eligibility review, or drug-induced sleep endoscopy (DISE).

### 3. Identify treatment-relevant features without converting them into false certainty

The app identifies interpretable patterns such as positional OSA, REM-predominant OSA, meaningful
nasal obstruction, insomnia plus OSA, substantial nocturnal hypoxemia, and anatomy that may affect
treatment discussion. It also displays selected research-oriented phenotype signals.

These signals are decision context, not standalone diagnoses or validated probabilities. A feature
may change what should be discussed, what must be verified, or how a therapy should be monitored
without proving that a particular treatment will succeed.

### 4. Generate reasonable options, then apply guardrails

Potential pathways are generated from the documented diagnosis, symptoms, anatomy, prior treatment,
safety inputs, and preferences. The app then removes, defers, or qualifies options that lack required
data or conflict with a safety boundary. Patient preference can elevate a reasonable option for
discussion, but cannot override a contraindication or manufacture eligibility.

### 5. Align the draft with the purpose of today's visit

The patient's stated goal and the clinician-confirmed plan affect emphasis. This prevents the report
from becoming a generic list of every therapy used for OSA. Visit context changes presentation and
workflow; it does not change the underlying diagnostic facts.

### 6. Require clinician confirmation

Precision Sleep drafts. The clinician decides. Before the final patient handout is generated, the
clinician can correct source data, select or remove proposed pathways, document missing prerequisites,
and confirm the next step. This signoff is a clinical safety control and part of the intended
intervention, not an administrative afterthought.

### 7. Close the loop with objective follow-up

Treatment selection and treatment success are separate decisions. When appropriate, the system
recommends objective verification after treatment rather than inferring efficacy from subjective
improvement alone. Symptoms, adherence, adverse effects, and patient priorities remain important,
but do not replace on-treatment physiologic assessment when it is clinically indicated.

## Evidence hierarchy and rule precedence

Precision Sleep uses the following hierarchy for a specific clinical use:

| Evidence or rule type | Appropriate role in the app |
|---|---|
| Current regulatory labeling and high-priority safety guidance | Device-specific contraindications, labeled population, or safety boundary |
| Current professional guideline or formal clinical guidance | Diagnostic routing, treatment pathway, follow-up, and standard-of-care guardrail |
| Systematic review, meta-analysis, or randomized trial | Treatment benefit and comparative-effectiveness context |
| External validation study or well-designed cohort | Directional predictor or risk marker, with population and method limitations |
| Small cohort, single-center model, or mechanistic study | Exploratory context only |
| Local clinical governance | Workflow, referral, communication, or safety policy, explicitly identified as local |

The evidence hierarchy does not erase scope. A high-quality paper about one population, device, or
outcome cannot automatically justify a threshold for another. Regulatory labeling, payer coverage,
professional guidance, and local referral policy are maintained as separate concepts. A patient may
be within a device label but outside a payer policy, or within both while still being a poor clinical
choice after individualized review.

When rules conflict, contraindications and safety boundaries take priority over treatment matching.
Missing prerequisites defer a recommendation. Exploratory predictors never override guideline or
regulatory requirements.

## Four questions that must remain separate

The app deliberately separates four questions that are often blended during a brief visit:

| Question | Example in an Inspire evaluation |
|---|---|
| Is the treatment pathway reasonable to discuss? | The patient has documented OSA, cannot tolerate PAP, and is interested in an implanted option. |
| Are the required eligibility and safety elements present? | Study severity and event type are documented; device labeling is reviewed; DISE does not show complete concentric collapse. |
| Is there context that may affect response? | DISE pattern, anatomy, and selected clinical associations may inform counseling, but do not produce an individual success probability. |
| Is this the confirmed plan today? | The clinician confirms the next procedure, additional testing, alternative treatment, or deferral. |

The same separation applies to oral appliances, PAP, surgery, weight management, and positional
therapy.

## How missing and uncertain data behave

Precision Sleep follows an asymmetric uncertainty rule:

- A documented positive finding may activate a signal or safety review.
- An explicitly documented negative finding may reduce concern when the source is appropriate.
- An absent, unreadable, patient-recalled, or technically uncertain value remains unresolved.
- Unresolved data can reduce confidence, add a caveat, request verification, or defer a pathway.
- Unresolved data cannot be converted into a normal result or favorable candidacy feature.

This is especially important when a patient brings an outside sleep-study report, recalls a prior
diagnosis without the report, or provides a device summary that lacks the raw information needed for
a particular inference.

## Decision area 1: sleep-study adequacy and diagnostic routing

### Clinical question

Does the available study adequately establish the diagnosis and characterize the disease for the
decision being considered, or should the clinician obtain the original report, repeat testing, or
use in-laboratory polysomnography (PSG)?

### Inputs considered

- study type and device;
- total recording or estimated sleep time;
- AHI or peripheral arterial tonometry AHI (pAHI), respiratory disturbance index, and event type;
- oxygen nadir, time below 90%, oxygen desaturation index, and other available oxygen measures;
- estimated REM and body-position exposure when those subtypes matter;
- technical-quality flags and completeness of the imported report;
- symptoms and pretest concern;
- heart failure, prior stroke, chronic opioid use, neuromuscular respiratory weakness,
  hypoventilation concern, severe insomnia that compromises home testing, and other conditions that
  can change test selection; and
- whether the result is documented from the source report or only reported from memory.

### Evidence basis

The American Academy of Sleep Medicine (AASM) diagnostic guideline supports PSG after a single
negative, inconclusive, or technically inadequate home sleep apnea test when clinical concern
persists, and favors PSG over home testing in specified complicating conditions. Arousal-based
scoring guidance matters when symptoms and an AHI based only on desaturation-associated events are
discordant. These guideline-level uses are distinct from newer device-comparison, night-to-night
variability, and multi-night-testing literature, which informs uncertainty but does not automatically
require repeat testing for every patient.

The same guideline defines a technically adequate conventional home study as at least four hours of
adequate flow and oximetry during a recording attempt that includes the habitual sleep period. That
is a minimum acquisition boundary, not proof that REM sleep, body position, central breathing,
hypoventilation, or every decision-relevant feature was adequately sampled.

Peripheral arterial tonometry studies estimate sleep and sleep stage algorithmically. Published
validation and meta-analytic data support clinical utility while also showing imperfect agreement
with PSG, particularly around mild and moderate severity categories. Precision Sleep therefore
flags category uncertainty where it could matter rather than declaring all such studies invalid.

Key sources are the [AASM diagnostic-testing guideline](https://doi.org/10.5664/jcsm.6506),
[AASM arousal-based scoring statement](https://doi.org/10.5664/jcsm.7234), and a prospective
[WatchPAT sleep-stage and respiratory-event validation study](https://doi.org/10.5664/jcsm.8278).
The complete targeted review, including limitations and accessed dates, is in
[`research/scientific-rationale-primary-sources.md`](research/scientific-rationale-primary-sources.md).

### Current decision behavior

For a completed study, the diagnostic module drafts one of four clinician-facing states:

1. **PSG recommended.** A guideline-level reason or major unresolved safety concern makes
   in-laboratory evaluation the preferred next test.
2. **PSG reasonable to consider.** The study may be usable, but a recognized limitation could
   materially change diagnosis, severity, eligibility, or risk assessment.
3. **Selective multi-night home testing may be useful.** Night-to-night variability is relevant and
   the patient remains appropriate for a home pathway, but this is not a routine default.
4. **No additional diagnostic test now.** The current study is adequate for the present decision and
   no specific escalation signal is identified.

This module never orders a test or confirms the diagnostic plan on its own.

One local workflow distinction remains visible: for a symptomatic negative home test, the app now
promotes the AASM-supported PSG pathway as the recommended draft default. The clinician can still
explicitly confirm treatment of a separate, independently indicated contributor and reassess. That
nasal-first alternative is a clinician-approved local override with an explicit evidence gap; it is
not presented as equivalent guideline guidance.

### Examples of important distinctions

| Finding | What the app can conclude | What it cannot conclude |
|---|---|---|
| Prior study reported, report unavailable | OSA history and severity are not yet verified; obtain and review the source report or select updated testing | That the remembered severity is accurate or sufficient for device eligibility |
| Negative or nondiagnostic home test with persistent concern | PSG is generally the appropriate escalation | That symptoms are explained by the negative home result |
| Short home recording | Confidence may be limited; key conclusions can be suppressed pending review | That a short device-estimated sleep time proves the patient slept too little for every clinical purpose |
| Mild or moderate WatchPAT pAHI | Category uncertainty may warrant selective PSG if reclassification changes care | That WatchPAT is categorically inaccurate or that PSG is mandatory for every result |
| Limited estimated REM sleep | A REM-specific conclusion may be unstable or suppressed | That absence of observed REM disease proves absence of REM-related OSA |
| Possible central events on home testing | Central disease requires appropriate clinical review and often PSG confirmation before advanced treatment | A definitive central sleep apnea diagnosis or measured loop gain |
| Marked conventional hypoxemia | Prompt review of OSA treatment and non-OSA contributors; confirm oxygen control | Event-linked hypoxic burden, or the cause of hypoxemia, from conventional oxygen summaries alone |

### Key limitations and validation needs

The app's four-state hierarchy is a local workflow synthesis, not a validated diagnostic model.
Home-test technical criteria vary by device, and an algorithm-estimated sleep time is not identical
to PSG total sleep time. Multi-night testing evidence does not establish that repeated home testing
improves outcomes in every population. Validation should measure agreement with expert reviewers,
PSG yield, changes in treatment decisions, missed clinically important disease, clinician overrides,
and time to effective treatment.

## Decision area 2: Inspire and other hypoglossal nerve stimulation pathways

### Clinical question

For a patient interested in hypoglossal nerve stimulation (HGNS), what must be verified before a
device-specific candidacy decision, what factors inform counseling, and what is the clearest next
step?

### The intended workflow

Precision Sleep treats Inspire evaluation as a staged process:

1. **Confirm the diagnostic foundation.** Review the actual sleep-study results, severity, event
   composition, date, and adequacy. Patient recall alone is insufficient.
2. **Document prior PAP experience.** Establish whether PAP was tried, whether it was ineffective or
   not tolerated, what barriers occurred, and whether optimization or retrial is reasonable.
3. **Review device-specific labeling, safety, and local referral boundaries.** These are not assumed
   to be identical to payer coverage.
4. **Assess anatomy, including DISE when required.** For unilateral Inspire, complete concentric
   collapse at the soft palate is a contraindicating finding under the applicable labeling. Other
   collapse patterns may affect counseling but must not be converted into unsupported probabilities.
5. **Address clinically relevant associated problems.** Nasal obstruction, weight, insomnia, and
   other issues may be treated concurrently or sequentially when appropriate. They do not replace
   the core HGNS evaluation.
6. **Confirm the next action.** Examples include obtaining a missing study, ordering updated testing,
   scheduling DISE, combining DISE with an appropriate nasal procedure, choosing another therapy,
   or continuing evaluation after prerequisites are met.
7. **After implantation, evaluate a different question.** Use, programming, comfort, symptoms, and
   objective on-therapy effectiveness replace preimplant candidacy as the focus.

### Eligibility is device-specific

The 2023 U.S. Inspire labeling reviewed for this version includes patients age 22 or older with AHI
15 to 100, documented PAP failure or intolerance, no more than 25% central plus mixed events, and no
complete concentric collapse at the soft palate. It also contains a distinct indication for selected
patients age 18 to 21. BMI above 40 is described as an insufficient-study warning boundary, not as a
listed universal contraindication. The exact current label must be checked at the time of care. The
Capital ENT automatic referral boundary of BMI 40 is local governance, and payer rules may be
narrower than both.

The app must therefore describe the source of a boundary:

- **Regulatory label:** whether use falls within the manufacturer's FDA-authorized labeling.
- **Payer policy:** whether a specific plan is likely to cover evaluation or implantation.
- **Local governance:** whether the practice will automatically advance a referral within its own
  safety and workflow policy.
- **Clinical judgment:** whether the expected benefits, alternatives, burdens, and risks make the
  treatment reasonable for this person.

No one category substitutes for the others.

Primary sources for this distinction are the FDA
[P130008/S090 Summary of Safety and Effectiveness Data](https://www.accessdata.fda.gov/cdrh_docs/pdf13/P130008S090b.pdf),
the associated [Inspire implant labeling](https://www.accessdata.fda.gov/cdrh_docs/pdf13/P130008S090C.pdf),
and the current [FDA PMA record](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?PMANumber=P130008&SupplementNumber=&start_search=1).
For comparison, the reviewed Medicare
[local coverage determination](https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?lcdId=38276)
uses narrower documentation, AHI, BMI, study-type, and timing criteria. That policy controls payment
in its defined jurisdiction and effective period; it is not the FDA label or a universal clinical
contraindication.

### DISE and response context

DISE directly visualizes dynamic upper-airway collapse under drug-induced sleep. Its established
role in the unilateral Inspire pathway is to identify complete concentric palatal collapse. DISE can
also provide useful anatomic context, including lateral oropharyngeal-wall collapse, but the evidence
does not support a universal app-generated success score.

Precision Sleep applies the following constraints:

- complete concentric collapse is not treated as an ordinary negative predictor; it is a
  device-specific exclusion for unilateral Inspire under the applicable labeling;
- complete lateral oropharyngeal-wall collapse may be presented as negative unilateral-HGNS response
  context, while partial collapse is not treated as equivalent;
- staging systems, PAP pressure, demographics, or research endotypes may support a qualitative
  discussion but are not added together into a response tier or probability;
- standard WatchPAT summaries cannot identify DISE collapse pattern or replace DISE; and
- a finding that limits one device does not automatically establish eligibility for another device.

The evidence chain includes the [STAR pivotal study](https://doi.org/10.1056/NEJMoa1308659), the
early [DISE selection study](https://doi.org/10.5664/jcsm.2658), and a larger multicenter
[DISE outcome-context cohort](https://doi.org/10.1002/lary.29396). The pivotal study demonstrates
group-level efficacy in a selected population; the observational DISE literature does not create a
calibrated individual response probability.

### What the output should communicate

A useful clinician guide should make the hierarchy obvious:

- whether required diagnostic information is present;
- whether PAP intolerance or failure is adequately documented;
- the current device-specific eligibility and safety questions;
- the next concrete step, such as DISE;
- concurrent but secondary issues, such as nasal obstruction; and
- what remains uncertain until the evaluation is completed.

For a patient with documented moderate-to-severe OSA, PAP intolerance, interest in Inspire, and
inferior turbinate hypertrophy, a clinician-confirmed plan may appropriately state **DISE plus
inferior turbinate reduction** when that combined procedure is the actual next step. The report must
still avoid implying that scheduling DISE guarantees Inspire candidacy or treatment success.

Objective verification after a non-PAP intervention is supported by the
[AASM longitudinal testing guidance](https://doi.org/10.5664/jcsm.9240). A small randomized
[HGNS follow-up pathway trial](https://doi.org/10.5664/jcsm.10712) supports selective home efficacy
testing, but does not establish one universal follow-up protocol.

### Key limitations and validation needs

Regulatory labels and payer policies change. DISE scoring has interrater variability, and published
response associations are device- and cohort-specific. The app does not have raw airflow data or a
validated physiologic model that can estimate individual response. Validation should examine
eligibility accuracy, missed contraindications, clinician override rate, agreement on DISE
interpretation, completion of the selected next step, objective HGNS outcomes, and calibration by
device rather than combining all HGNS systems.

## Decision area 3: oral appliance therapy

### Clinical question

When is an oral appliance a reasonable treatment pathway, what safety information is required, and
how should likely response be discussed without overstating prediction?

### Guideline-aligned pathway

The AASM and American Academy of Dental Sleep Medicine guideline supports a custom, titratable oral
appliance for adults with OSA who are intolerant of PAP or prefer an alternate therapy, with qualified
dental oversight and objective follow-up testing. This establishes a treatment pathway. It does not
establish a reliable individual response score.

Primary guideline: [Ramar et al., 2015](https://doi.org/10.5664/jcsm.4858). The population-level
response associations are summarized in the annotated library and include the
[Camañes-Gonzalvo et al. systematic review and meta-analysis](https://doi.org/10.1016/j.smrv.2022.101644).

Precision Sleep therefore routes oral appliance discussion primarily using:

- patient preference;
- PAP tolerance and prior treatment history;
- dental support and ability to retain an appliance;
- mandibular protrusion and practical fit considerations;
- temporomandibular joint symptoms and other dental safety issues;
- prior oral-appliance response or intolerance; and
- willingness to complete objective on-treatment assessment.

### Response associations are not candidacy tiers

Published studies and meta-analyses describe average associations between oral-appliance response
and factors such as age, BMI, neck circumference, sex, baseline severity, positional pattern, and
anatomy. The findings are heterogeneous, often cohort-specific, and insufficiently calibrated for
individual prediction.

The app may present a careful statement such as “this feature has been associated with response in
some populations.” It must not label a patient a favorable or poor responder, calculate a success
percentage, rank oral appliance therapy above another treatment from those associations alone, or
deny a guideline-supported trial when the pathway is otherwise appropriate.

### Follow-up is part of the treatment decision

Subjective improvement does not guarantee physiologic control. The treatment plan should include
dental follow-up for fit and adverse effects, assessment of symptoms and adherence, and objective
sleep testing with the appliance when clinically appropriate. Persistent symptoms, adverse dental
effects, or incomplete control should trigger reassessment rather than an assumption of success.

### Key limitations and validation needs

There is no guideline-endorsed, externally validated Precision Sleep oral-appliance response model.
The app's value is in consistent pathway identification, safety screening, counseling, and follow-up,
not prediction. Validation should measure objective on-treatment AHI or respiratory disturbance
index, symptoms, adherence, adverse effects, discontinuation, clinician overrides, and whether the
app improves completion of objective verification.

## Decision area 4: PAP download interpretation and optimization

### Clinical question

For a current PAP user, is use sufficient across the entire sleep period, are leak or residual-event
signals interpretable, what barriers can be addressed, and when is independent on-treatment
assessment reasonable?

### Verify the input before interpreting it

PAP usage is generally measured reliably, but leak and residual respiratory-event metrics are not
standardized across manufacturers. Precision Sleep first identifies the device, date range, metric
definitions, mask context, and whether the values were imported or manually entered. A percentile
leak value is not the same as sustained large leak, and a device-reported event index is not identical
to PSG-scored AHI.

### Separate coverage convention from clinical exposure

The commonly used threshold of at least four hours on 70% of nights is a coverage convention, not a
biologic threshold for adequate treatment. The app can display it for administrative context while
separately asking how much of the patient's actual sleep period is treated. Counseling emphasizes
PAP use whenever the patient sleeps, including naps, because benefit generally increases with greater
nightly exposure.

### Structured troubleshooting

Precision Sleep maps documented barriers to specific discussion points instead of producing generic
“improve compliance” advice:

- mask fit, discomfort, displacement, or skin injury;
- dry mouth, nasal dryness, congestion, or rainout;
- possible mouth leak or mask-type mismatch;
- pressure intolerance, air hunger, aerophagia, or difficulty exhaling;
- claustrophobia, insomnia, or difficulty acclimating;
- travel, equipment access, cleaning, or supply problems; and
- persistent sleepiness, snoring, witnessed events, or other symptoms despite reported use.

Education, behavioral support, troubleshooting, and telemonitoring-guided intervention are supported
components of PAP care. The app proposes categories for review; it does not directly change pressure
or prescribe a mode.

### Support needs are not an adherence prediction

No transportable, externally validated baseline model was identified that can reliably predict an
individual patient's PAP acceptance, use, or discontinuation. Baseline severity, sleepiness,
insomnia, demographics, and exploratory endotypes have heterogeneous associations and must not
create a favorable/poor PAP tier or move a patient away from PAP.

Observed use during the first days and weeks is the strongest practical signal once treatment has
started, although it is partly an early measurement of the eventual behavior rather than a causal
predictor. Precision Sleep therefore uses a clinician-only support-needs flag when active or planned
PAP intersects with documented, potentially remediable barriers. The flag names the barrier,
recommends education and targeted troubleshooting, and prompts early review of objective use, leak,
residual events, comfort, and perceived benefit. It explicitly says the finding is not a prediction
that PAP will fail. Race, sex, age, socioeconomic labels, and endotype surrogates cannot create the
flag. Access barriers should be assessed directly and addressed as system needs rather than encoded
as patient traits.

The central sources are the [AASM PAP guideline](https://doi.org/10.5664/jcsm.7640), the
[American Thoracic Society PAP-tracking statement](https://doi.org/10.1164/rccm.201307-1282ST), and
the [ATS policy statement on the four-hour adherence threshold](https://doi.org/10.1164/rccm.202210-1846ST).

### Interpreting leak and residual events

Manufacturer-specific leak references can identify a value that deserves review. They do not prove
treatment failure in isolation. The clinician should consider the nightly graph, duration above the
reference, mask type, symptoms, and whether leak makes device-estimated events less reliable.

Similarly, a low device-reported residual index is reassuring only when symptoms and other data
agree. An elevated residual or central index is a review signal, not a definitive diagnosis. Central
events, unexplained device data, or symptom-download discordance may justify waveform review,
oximetry, or formal on-treatment testing after correctable problems such as major leak are addressed.

Routine repeat PSG or home testing is not recommended for every asymptomatic patient doing well on
PAP. Independent reassessment is selective and clinician-confirmed.

### Key limitations and validation needs

PAP algorithms, metric definitions, and leak references vary across devices and software versions.
The app cannot infer raw waveform findings from summary values and does not have authority to change
device settings. Validation should measure agreement with expert download review, resolution of
identified barriers, change in whole-sleep-period usage, symptoms, independent residual disease or
hypoxemia when tested, inappropriate retesting, and clinician override rate.

## Decision area 5: insomnia plus OSA (COMISA)

### Clinical question

When clinically important insomnia symptoms coexist with OSA, how should the app identify the
pattern, present cognitive behavioral therapy for insomnia (CBT-I), and sequence insomnia and OSA
treatment without converting a questionnaire result into a diagnosis or delaying urgent care?

### The app uses an operational screen, not an insomnia diagnosis

The Insomnia Severity Index (ISI) is a validated symptom and outcome questionnaire. ISI at least 15
is the conventional moderate-to-severe insomnia-symptom range and is appropriately described as
clinically significant insomnia symptoms. It does not by itself establish the duration, frequency,
adequate opportunity for sleep, daytime consequences, or differential diagnosis required for
chronic insomnia disorder. Precision Sleep uses ISI at least 15 plus objectively established AHI at
least 5 as a COMISA screening phenotype. The app may say “COMISA screen positive” or “clinically
significant insomnia symptoms and OSA, often called COMISA,” while clinician confirmation remains
required before chronic insomnia disorder is documented.

This distinction is especially important because the most directly relevant sequencing trials
generally enrolled participants with confirmed insomnia and moderate-to-severe OSA. Extending the
screen to mild OSA is a conservative workflow choice, not a claim that the trial populations and
effects are identical.

### What the randomized trials support

The available randomized evidence supports offering CBT-I early, either before PAP or alongside it:

- Sweetman et al. found that CBT-I before CPAP improved acceptance and average nightly use in the
  enrolled population.
- MATRICS found better insomnia outcomes with CBT-I plus PAP, but no significant PAP-adherence
  advantage and no significant difference between sequential and concurrent CBT-I delivery.
- An integrated trial in veterans supports combining insomnia treatment with practical PAP support,
  but its population and multicomponent intervention limit broad extrapolation.

These trials do not identify one best sequence for every patient. OSA severity, substantial
nocturnal hypoxemia, sleepiness, driving or safety-sensitive work, access, prior treatment,
preference, and clinician assessment determine whether PAP begins before, during, or after CBT-I.
Insomnia should not automatically delay effective treatment when OSA urgency is high.

An early sleep-restriction component can temporarily increase sleepiness. The evidence supports
monitoring and individualized pacing, not a blanket contraindication or a universal ESS cutoff.
The app does not prescribe a sleep window, choose a digital or clinician-delivered CBT-I protocol,
or automate hypnotic selection.

### What Precision Sleep must not claim

The app cannot determine the cause of an elevated ISI, predict an individual's CBT-I response,
predict PAP adherence, or claim that untreated insomnia is the strongest predictor of PAP
nonadherence. The Sweetman 2019 randomized trial did not compare predictors and does not support
that ranking. Clinician and patient wording therefore separates a screening phenotype from a formal
insomnia diagnosis and treats insomnia as a potentially modifiable support need, not evidence of
PAP failure.

### Key limitations and validation needs

COMISA trials differ in diagnostic confirmation, OSA severity, intervention delivery, PAP support,
and population. Validation should measure clinician confirmation of the screen, sequence chosen,
ISI change, PAP uptake and whole-sleep-period use, sleepiness trajectory, safety events, patient
understanding, and clinician override rate.

## Decision area 6: conventional nocturnal hypoxemia and event-linked hypoxic burden

### Clinical question

How should the app use oxygen findings to identify a safety concern or add prognostic context while
avoiding false equivalence between different metrics, causal claims, or unsupported treatment
allocation?

### Three questions, not one oxygen score

Precision Sleep keeps three concepts separate:

1. **Conventional oxygen metrics:** oxygen desaturation index (ODI), oxygen nadir, time below 90%
   (T90), and area below 90%. These describe different aspects of intermittent or sustained
   nocturnal hypoxemia and vary with the device, scoring rule, denominator, and artifact handling.
2. **Respiratory-event-linked hypoxic burden:** the summed area under desaturation curves attributed
   to scored respiratory events and normalized by sleep time. This is the construct used in the
   foundational cardiovascular-outcome cohorts.
3. **Oximetry-derived burden methods:** algorithms that estimate burden from the oxygen signal
   without the same scored-event linkage. They may correlate with event-linked burden but are not
   automatically numerically interchangeable.

A low or absent value in one construct cannot be used to declare another normal. Method provenance
must be known before a value is compared with a published research cutoff. In particular, a
commercial WatchPAT value must not be assumed equivalent to a custom published algorithm merely
because both are called hypoxic burden.

### Prognostic context does not establish treatment allocation

Observational cohorts associate higher event-linked hypoxic burden with cardiovascular outcomes.
Post hoc trial analyses have explored whether burden modifies treatment effect, but no prospective
biomarker-stratified trial validates a universal threshold for selecting, withholding, or ranking
PAP or another OSA treatment.

Precision Sleep therefore treats:

- 30 %min/h as an exploratory app signal boundary;
- 73.1 and 87.1 as descriptive, post hoc cohort or pooled-trial context only; and
- the entire event-linked pathway as a research signal whose confidence is capped at Moderate.

These values are not low, moderate, or high clinical categories. Hypoxic burden cannot determine
eligibility, promise cardiovascular benefit, or suppress treatment below a cutoff.

### Conventional oxygen bands are local safety review triggers

ODI above 50/hour, T90 above 20%, nadir below 75%, or area below 90% above 2/hour currently triggers
a separate substantial-nocturnal-hypoxemia review pathway. The T90 and nadir boundaries have
directional cohort context, but the four-part trigger set is not a prospectively validated joint
rule. It is a conservative local safety boundary.

The resulting action is deliberately broader than “treat OSA harder.” It asks the clinician to
review study quality, begin or expedite effective treatment for confirmed OSA when appropriate,
consider non-OSA contributors such as cardiopulmonary disease or hypoventilation, and objectively
confirm oxygen control. The metrics do not prove that OSA is the sole cause.

### Key limitations and validation needs

Oximeters, averaging times, event definitions, denominators, and burden algorithms vary. Published
thresholds are cohort- and method-specific. Validation should measure source and method agreement,
false-alert rate, non-OSA diagnosis yield, clinician response, objective follow-up oxygen control,
and whether the research signal adds information without causing inappropriate treatment ranking.

## Decision area 7: weight management and tirzepatide

### Clinical question

When should weight management be part of the OSA plan, when is the Zepbound OSA indication relevant,
and what follow-up is needed before reducing another active OSA treatment?

### Weight management is adjunctive and individualized

Excess adiposity is an important contributor to OSA for many patients, but it is not the only cause.
Guideline-supported care includes comprehensive lifestyle intervention for patients with overweight
or obesity. Randomized and longitudinal studies show average improvement in AHI with weight loss,
with substantial individual variation and incomplete remission. Precision Sleep must not predict a
fixed AHI or snoring improvement from a specified number of pounds.

Higher weight and weight gain are associated with habitual snoring, and a very small multimodal
study provides directional evidence that weight loss may reduce snoring in some adults. It does not
establish that losing 5-7 pounds reliably improves snoring or define a minimum effective amount.
Patient guidance therefore says weight management may reduce snoring when overweight or obesity is
present, while explicitly noting that response varies and no number of pounds guarantees benefit.

The weight pathway should be non-stigmatizing, consider readiness and prior treatment, and remain
compatible with PAP, an oral appliance, surgery, nerve stimulation, positional treatment, and
other appropriate care. Weight management does not become a reason to delay effective OSA treatment
when immediate control is needed.

### The OSA-specific Zepbound indication is narrower than general weight management

Current U.S. prescribing information indicates Zepbound (tirzepatide) for moderate-to-severe OSA in
adults with obesity, in combination with a reduced-calorie diet and increased physical activity.
This differs from the separate chronic-weight-management indication, which also covers some adults
with overweight and a weight-related condition. Only Zepbound carries the OSA indication; a history
of Mounjaro use can be documented because it contains tirzepatide, but Mounjaro must not be described
as FDA approved for OSA.

SURMOUNT-OSA demonstrated substantial average improvements in AHI and weight over 52 weeks in adults
with obesity and moderate-to-severe OSA. It did not establish an individual response probability,
long-term durability, comparative superiority to airway therapy, or a rule for stopping PAP. The
FDA label explicitly notes that the pivotal trials did not evaluate the timing or appropriateness
of PAP discontinuation.

Medication eligibility, contraindications, dosing, interactions, monitoring, and tolerability
remain prescriber decisions. Tirzepatide is a dual GIP/GLP-1 receptor agonist; “GLP-1” alone is
common shorthand but pharmacologically incomplete.

### Objective reassessment closes the loop

When clinically significant weight change could alter OSA management, clinician-directed PSG or
HSAT is appropriate before de-escalating treatment. The AASM longitudinal guidance intentionally
does not impose one universal weight-change percentage or testing schedule. Baseline severity,
oxygen findings, symptoms, current treatment, and the contemplated decision should determine timing
and modality.

### Key limitations and validation needs

Weight-loss trials vary in population, diabetes status, OSA severity, treatment use, intervention,
and duration. Medication labeling changes and full safety assessment is outside the app's current
input set. Validation should measure weight and AHI change, symptoms, adverse effects, persistence,
objective reassessment before de-escalation, clinician overrides, and whether patients understand
that group averages do not guarantee remission.

## Cross-cutting phenotype signals

Precision Sleep includes nine phenotype or contributor labels: high anatomical contribution, low
arousal-threshold signal, possible ventilatory instability or high-loop-gain signal, poor muscle
responsiveness signal, positional OSA, REM-predominant OSA, event-linked hypoxic-burden signal, nasal
resistance contributor, and elevated delta heart rate.

They do not all have the same evidentiary status. Positional and REM patterns are study-derived
classifications with sampling constraints. Nasal obstruction is a treatment-relevant contributor.
Several physiology-oriented labels are exploratory surrogates rather than direct measurements. The
event-linked hypoxic-burden pathway is kept separate from conventional nocturnal hypoxemia, and
delta heart rate is manual or inactive for device workflows that do not provide the required metric.

The phenotype layer should answer “what might matter when discussing treatment or follow-up?” It
should not answer “what treatment is guaranteed to work?”

## How clinician and patient reports differ

The clinician guide preserves source detail, caveats, safety flags, competing pathways, and the
rationale for the draft. Its highest-priority content should be the visit goal, confirmed plan, most
important next step, and any unresolved prerequisite that could change care.

The patient report uses the same confirmed facts but reduces jargon, defines necessary terms, and
focuses on the agreed plan and immediate actions. It may simplify the explanation; it may not increase
certainty, omit a material prerequisite, or turn a conditional pathway into a promise.

Both reports are downstream of clinician confirmation. Presentation logic cannot create a diagnosis,
eligibility determination, or treatment recommendation that the clinical pipeline did not support.

## Known limitations

1. Precision Sleep has not yet completed prospective clinical validation.
2. Some phenotype signals use indirect clinical surrogates rather than direct physiologic
   measurement.
3. Treatment-response studies often have heterogeneous definitions, selected populations, and
   limited external validation.
4. Home-study and PAP-device algorithms are proprietary and may change.
5. Imported report accuracy depends on source quality and correct field mapping.
6. Payer policies and device labeling may change faster than the app's scheduled evidence review.
7. The clinician-confirmation workflow reduces automation risk but can still be affected by data
   entry error, anchoring, alert fatigue, or incomplete review.
8. Clear communication and workflow efficiency are expected benefits, not yet established clinical
   outcomes.

## Validation roadmap

The initial validation program should evaluate the decision-support system before attempting to
claim patient-outcome benefit:

1. **Retrospective technical validation:** field accuracy, source provenance, missing-data behavior,
   reproducibility, and parity between decision state and both reports.
2. **Blinded expert review:** agreement on diagnostic escalation, treatment pathways, contraindication
   detection, and priority of the next step, including plausible counterexamples.
3. **Prospective silent-mode evaluation:** run the app without exposing recommendations; compare its
   draft with actual clinician decisions and outcomes.
4. **Prospective workflow evaluation:** measure review time, missed information, override rate,
   comprehension, completion of next steps, and inappropriate pathway activation.
5. **Treatment-specific outcome validation:** use objective on-treatment outcomes and prespecified
   subgroups; do not infer predictive performance from treatment selection alone.

Any future claim of diagnostic accuracy, calibrated response prediction, or improved clinical
outcome will require a frozen build, prespecified analysis, appropriate comparator, and independent
validation.

## Implementation map

| Clinical function | Primary implementation |
|---|---|
| Central thresholds and threshold notes | [`js/config.js`](../js/config.js) |
| Study-quality signals and next-test guidance | [`js/report-shared.js`](../js/report-shared.js) |
| Phenotype detection, treatment mapping, guardrails, clinician report | [`js/app.js`](../js/app.js) |
| PAP download interpretation | [`js/pap-compliance.js`](../js/pap-compliance.js) |
| Patient-facing report generation | [`js/patientReport.js`](../js/patientReport.js) |
| Formal logic register | [`evidence-basis.md`](evidence-basis.md) |
| Exact source use and limitations | [`citations.md`](citations.md) |
| Review decisions and surveillance | [`evidence-review-log.md`](evidence-review-log.md) |
| Targeted source reviews for this narrative | [`research/scientific-rationale-primary-sources.md`](research/scientific-rationale-primary-sources.md); [`research/comisa-hypoxemia-weight-primary-sources.md`](research/comisa-hypoxemia-weight-primary-sources.md); [`research/isi-comisa-pap-adherence-snoring-primary-sources.md`](research/isi-comisa-pap-adherence-snoring-primary-sources.md) |
| Regression scenarios and counterexamples | [`test-matrix.md`](test-matrix.md) |

## Planned chapters

Later versions should add the same level of reasoning detail for positional and REM-predominant OSA,
nasal treatment, upper-airway surgery, primary snoring and upper-airway resistance syndrome,
longitudinal follow-up, and validation governance.

## Maintenance rule

This narrative must be updated whenever a clinical change alters diagnostic routing, phenotype
detection, treatment ranking, candidacy, safety behavior, clinician guidance, patient instructions,
or the meaning of an input. Every such change must also update the formal evidence register,
annotated citation library, evidence review log, threshold notes where applicable, and regression
coverage in the same change series. An AI-generated summary is not evidence; the underlying primary
source must be verified.
