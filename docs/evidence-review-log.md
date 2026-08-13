# Evidence Review Log

This is the reproducible review history for the
[`Clinical Evidence Basis and Validation Register`](evidence-basis.md). Record both reviews that
change clinical logic and reviews that conclude no change is needed.

The historical entries below were reconstructed from the project's contemporaneous evidence,
audit, and deployment records. Future reviews should use the full template so the exact search
strategy, exclusions, appraisal, clinician decision, commit, and build are recorded prospectively.

## Governance history

| Event ID | Date | Change | Clinical logic effect |
|---|---|---|---|
| EG-2026-07-19 | 2026-07-19 | Created evidence-register version 1.0 with stable Logic IDs, evidence levels, explicit limitations, prospective-validation requirements, and an automated documentation-integrity check | Documentation and governance only; no clinical output changed |

## Completed reviews

| Review ID | Review date | Evidence cutoff | Scope | Sources reviewed | Conclusion | Affected Logic IDs | Code/build effect |
|---|---|---|---|---|---|---|---|
| ER-2026-08-13-COMISA-HYPOXEMIA-WEIGHT | 2026-08-13 | 2026-08-13 | COMISA screening and sequencing; conventional nocturnal hypoxemia versus event-linked hypoxic burden; weight management and tirzepatide | ISI validation and AASM insomnia guidance; Sweetman, MATRICS, and Alessi randomized trials; Azarbarzin, Trzepizur, Labarca, Esmaeili, Pinilla, and related HB sources; conventional-hypoxemia cohorts; ATS weight guidance; Sleep AHEAD; SURMOUNT-OSA; current FDA Zepbound labeling; AASM longitudinal guidance. Full method and links are in `research/comisa-hypoxemia-weight-primary-sources.md`. | Confirmed the conservative architecture: COMISA remains a screen with individualized sequencing; HB remains research context; conventional oxygen bands remain local safety triggers; weight management remains adjunctive and Zepbound OSA labeling remains distinct from general weight eligibility. Corrected source metadata and expanded rationale. Identified unsupported runtime wording for clinician signoff rather than changing output silently. | PH-07, TX-01, TX-04, SAF-03 | Documentation and source-comment correction only; no threshold, recommendation, ranking, safety action, or patient instruction changed; clinician signoff pending for runtime wording corrections |
| ER-2026-08-13-GOVERNANCE-SIGNOFF | 2026-08-13 | 2026-08-13 | Clinician decision on six local-governance policies identified by the scientific-rationale review | Previously verified sources and limitations in `research/scientific-rationale-primary-sources.md`; no new external source was required | Raymond Brown, MD approved all six policies. Five preserve current behavior. For persistent concern after a negative HSAT, PSG is now the promoted draft default; contributor-first sequencing remains available only through explicit clinician confirmation. | DX-01, DX-02, DX-04, TX-03, TX-05 | Narrow diagnostic-routing and guidance change; paired default and override regressions added; lint and 2,091 assertions passed; not deployed |
| ER-2026-08-13-SCIENTIFIC-RATIONALE | 2026-08-13 | 2026-08-13 | Prose decision rationale; adult diagnostic testing and HSAT adequacy; unilateral Inspire labeling, DISE, payer separation, response context, and objective follow-up | AASM diagnostic guideline and arousal-scoring statement; AASM HSAT position statement; Zhang 2020 and Tschopp 2021 PAT studies; FDA Inspire P130008/S090 SSED and labeling; STAR; Vanderveken 2013; Huyett 2021; ADHERE analyses; AASM surgical-referral and longitudinal-testing guidance; CMS LCD L38276; HOME pathway trial. Full source links and limitations are recorded in `research/scientific-rationale-primary-sources.md`. | Created a readable account of how data provenance, diagnostic boundaries, treatment context, guardrails, clinician confirmation, and follow-up interact. Confirmed the current diagnostic architecture and device-specific HGNS separation. Clarified that BMI above 40 is an FDA insufficient-study warning boundary in the reviewed Inspire labeling while the app's BMI 40 automatic referral boundary is local governance. Identified the symptomatic negative-HSAT nasal-first option as local governance with an explicit evidence gap. No decision threshold, treatment ranking, safety action, or patient instruction changed. | DX-01, DX-02, DX-03, DX-04, TX-02, TX-03, PAP-01, PAP-02, PAP-03 | Documentation and evidence classification only; no application code changed; lint and 2,081 regression assertions passed with exact output parity |
| ER-2026-06-11 | 2026-06-11 | 2026-06-11 | Full clinical evidence and confidence-calibration audit | Existing primary literature, guidelines, regulatory sources, and expert review documented in `citations.md` and `optimization-roadmap.md` | Several rules were directionally useful but overstated certainty. Hypoxic burden was separated from automatic urgency at moderate levels; numeric loop gain was removed; partial arousal-threshold and muscle-response confidence were reduced; HNS response percentages were removed from output. | PH-02, PH-03, PH-04, PH-07, TX-03 | Shipped in the Phase 2 confidence-calibration release; see `optimization-changelog.md` |
| ER-2026-07-15 | 2026-07-15 | 2026-07-15 | Device-specific HGNS labeling and complete concentric collapse | FDA Inspire P130008/S090; FDA Genio P240024 labeling and SSED; supporting HGNS literature in `citations.md` | Complete concentric collapse remains a device-specific contraindication for unilateral Inspire. Genio is not an automatic alternative because current US evidence and labeling do not establish safety/effectiveness in that subgroup. BMI 40 remains a local referral guardrail, not a universal device rule. | TX-03 | Device-specific logic and patient wording updated; see `phenotype-baseline-review.md` v5 |
| ER-2026-07-19 | 2026-07-19 | 2026-07-19 | Negative HSAT, arousal-based scoring, UARS terminology, nasal-first sequencing, and WatchPAT sleep staging | Kapur et al. 2017 AASM diagnostic guideline; Malhotra et al. 2018 AASM position statement; Zhang et al. 2020 WatchPAT validation; nasal-treatment evidence already cataloged in `citations.md` | AASM supports PSG rather than a second HSAT when OSA remains suspected after a negative, inconclusive, or inadequate HSAT. UARS is presented within the OSA spectrum and evaluated with PSG using arousal-based scoring. Nasal-first sequencing remains a clinician-controlled option with an explicit evidence gap. WatchPAT is not described as a recording-time-only device. | DX-01, DX-02, TX-05 | Clinician tooltips and UARS wording shipped in build `bb4d319`; patient PSG action still requires clinician selection and confirmation |
| ER-2026-07-19-NASAL | 2026-07-19 | 2026-07-19 | Predictors of symptom, sleep-quality, AHI, and PAP response after septoplasty or other nasal surgery | Carrie et al. 2023 NAIROS RCT; Stapleton et al. 2014 prospective cohort; Koutsourelakis et al. 2008 sham-controlled RCT; Camacho et al. 2015 meta-analysis; Cha et al. 2023 retrospective cohort | Baseline NOSE severity supports expectation-setting for nasal-symptom improvement and subjective sleep quality may improve when obstruction improves. It does not predict AHI response. Nasal obstruction as a dominant PAP barrier is a plausible but not externally validated PAP-response signal. No deterministic septoplasty-candidacy or AHI-response rule was added. | PH-08, TX-05 | Documentation refined and a clinician-only evidence-boundary tooltip added; patient wording and treatment ranking unchanged |
| ER-2026-07-19-SNORING | 2026-07-19 | 2026-07-19 | Isolated nasal surgery and the adult primary-snoring pathway | AAO-HNS septoplasty consensus statement 2015; AAO-HNS rhinoplasty guideline 2017; Australasian Sleep Association primary-snoring position statement 2023; AASM/AADSM oral-appliance guideline 2015; Yamasaki et al. 2020; Virkkula et al. 2006 | Subjective snoring-related quality of life may improve after functional nasal surgery, but objective acoustic evidence is mixed and AAO-HNS did not reach consensus that septoplasty reliably reduces primary snoring. Nasal treatment remains adjunctive; no automatic surgery rule was added. | PH-08, TX-06 | Clinician counseling tooltip and cautious nasal-recommendation wording added; patient treatment ranking unchanged |
| ER-2026-07-19-WATCHPAT | 2026-07-19 | 2026-07-19 | WatchPAT diagnostic accuracy, severity classification, REM and positional phenotyping, central-event signals, negative HSAT workflow, and multi-night testing | AASM diagnostic guideline 2017; Iftikhar et al. 2022; Ioachimescu et al. 2020; Massie et al. 2022; Pillar et al. 2020; Punjabi et al. 2020; Roeder et al. 2020; Fricke et al. 2026 | WatchPAT remains appropriate for many uncomplicated patients, but mild/moderate severity needs clinician-visible uncertainty. Routine multi-night testing and automatic PSG for every negative study are not supported. PSG remains the standard after a negative/inadequate HSAT when OSA suspicion persists and is preferred for guideline-defined complicated patients. | DX-01, DX-02, DX-03, PH-05, PH-06, SAF-02 | Clinician-only flags, guided PSG draft for captured complicated diagnostic cases, and phenotype-confidence caps shipped in build `d4fdd89`; patient technical warnings remain suppressed |
| ER-2026-07-19-NEXT-TEST | 2026-07-19 | 2026-07-19 | Operationalizing repeat HST versus in-lab PSG guidance | AASM diagnostic guideline 2017; Iftikhar et al. 2022; Ioachimescu et al. 2020; Punjabi et al. 2020; Roeder et al. 2020; Fricke et al. 2026 | Added the missing AASM complicating-condition inputs and a clinician-only four-state next-test hierarchy. Selective multi-night HST requires an explicit clinician variability concern and remains subordinate to PSG escalation rules. | DX-01, DX-02, DX-03, DX-04, SAF-02 | Draft guidance is visible to clinicians and MAs, remains editable, and reaches the patient only after Diagnostic Testing is selected and confirmed |
| ER-2026-07-19-PAP | 2026-07-19 | 2026-07-19 | PAP compliance downloads, residual device-reported events, leak, adherence, central signals, and follow-up testing | ATS PAP tracking statement 2013; ResMed AirSense 11 user guide; AASM PAP guideline 2019; AASM longitudinal testing guidance 2021; Reiter et al. 2016; Midelet et al. 2021; May et al. 2023; Malhotra et al. 2026 accepted manuscript | Added a clinician-only, verification-gated PAP download assistant. Usage and leak are reviewed before efficacy; P95 leak alone remains contextual; device event indices remain manufacturer-specific estimates; explicitly confirmed current symptoms and central signals prevent false reassurance; no pressure is selected or changed automatically. | PAP-01, PAP-02, PAP-03, SAF-01 | New structured input, ResMed AirView-oriented parser, editable clinician guidance, and regression scenarios; no unconfirmed guidance is sent to patients |
| ER-2026-07-19-HB | 2026-07-19 | 2026-07-19 | Event-linked hypoxic burden definition, prognostic evidence, cohort cut points, treatment interactions, and separation from conventional nocturnal hypoxemia | Azarbarzin et al. 2019; Labarca et al. 2023; Trzepizur et al. 2022; Pinilla et al. 2023; Parekh 2024; Esmaeili et al. 2023; Peker et al. 2025; Cohen et al. ATS workshop; Azarbarzin et al. 2026; Messineo et al. 2024; Bertram et al. 2026; Pengo et al. 2025 | Removed the app-created worst-metric HB composite and all low-HB treatment de-emphasis. True HB is a Moderate research signal only. ODI, T90, nadir, and area below 90% now feed a separate substantial-nocturnal-hypoxemia safety pathway. Cohort cut points are descriptive and cannot allocate treatment. | PH-07, SAF-03, TX-01, TX-02 | Clinical logic, clinician wording, patient ranking, safety tags, evidence register, and counterexample regressions updated; Raymond Brown, MD approved deployment 2026-07-19; build `8219ec0` deployed and verified with 1,414 assertions |
| ER-2026-07-19-NONPAP-PREDICTION | 2026-07-19 | 2026-07-19 | Individual treatment-response prediction for oral appliances, positional therapy, upper-airway surgery, and HGNS | AASM/AADSM oral-appliance guideline 2015; Camañes-Gonzalvo et al. 2022; Srijithesh et al. 2019; Lastra et al. 2025; Friedman et al. 2004; Choi et al. 2016; Qi et al. 2024; Green et al. 2019; Meraj et al. 2017; Vena et al. 2025; Huyett et al. 2021; Op de Beeck et al. 2021; Ji et al. 2026 | Removed app-created MAD response tiers and aggregate HGNS response tiers; separated supine-isolated from supine-predominant OSA; limited complete lateral-wall collapse to negative unilateral-HGNS response context; removed exact Friedman success percentages and general DISE prediction claims. | PH-05, TX-02, TX-03, TX-07 | 1,509 assertions passed at review; included in pilot build `e12734f`; formal clinician evidence signoff remains open |
| ER-2026-07-19-FOLLOWUP | 2026-07-19 | 2026-07-19 | Returning-patient questionnaire, repeated patient-reported outcomes, and chart-review boundary | Johns 1991 ESS development; Bastien et al. 2001 ISI validation; Stewart et al. 2004 NOSE validation; Capital ENT workflow review | Added a short, state-aware follow-up questionnaire. ESS is repeated; ISI and NOSE are conditional. Treatment use, benefit, barriers, safety changes, and current weight are captured. Patient submissions append a pending checkpoint and do not overwrite baseline clinical fields or change recommendations before clinician review. | TX-08 | 1,859 assertions passed at review; included in pilot build `e12734f`; clinician acceptance testing remains open |
| ER-2026-07-20-VISIT-CONTEXT | 2026-07-20 | 2026-07-20 | Patient-stated reason for an initial visit, MA correction, clinician confirmation, and workflow presentation | Capital ENT workflow review; no new published clinical claim introduced | Added a required plain-language visit-reason field to initial intake. It can populate or create a pending correction for visit context and may affect report emphasis or draft suggestions. It cannot select treatment or confirm the plan. The MA can correct it and the clinician remains the decision-maker. The same revision removes a duplicate clinician readiness display, makes pending tasks action-specific and navigable, and converts the clinician briefing to compact metrics and labeled rows without changing clinical thresholds. | TX-09 | Tests 230-234 and all prior regressions pass locally; 1,910 assertions passed; build `e12734f` deployed to the clinical pilot for clinician acceptance testing |
| ER-2026-07-20-AUDIT-REMEDIATION | 2026-07-20 | 2026-07-20 | Independent audit reconciliation: nondiagnostic HSAT patient wording, positional-plan consistency, uncertain cardiovascular history, report-edit integrity, terminology, and intake reload safety | Previously verified Kapur et al. 2017; Cartwright 1984; Srijithesh et al. 2019; Lastra et al. 2025; Capital ENT local workflow review. No new external clinical claim introduced. | A short home recording no longer declares confirmed OSA severity or phenotypes in the full handout. The plan draft now uses the shared positional classifier and calls persistent non-supine OSA adjunctive. Patient cardiovascular uncertainty remains an unresolved review flag. Edited reports are normalized and must be saved before PDF download; intake warns before losing answers and retains only a session-scoped recovery token. | DX-01, DX-02, PH-05, SAF-04 | Paired regressions and full suite passed 2,020 assertions; build `16cbd81` deployed for clinician acceptance testing; formal acceptance remains pending |
| ER-2026-07-19-COMISA | 2026-07-19 | 2026-07-19 | CBT-I and PAP sequencing, PAP adherence, bedtime-restriction safety, PAP-setting claims, and medication boundaries in COMISA | Sweetman et al. 2019 and 2020; Ong et al. MATRICS 2020; Alessi et al. 2021; Sweetman et al. 2023 meta-analysis; Turner et al. 2023; Zhang et al. 2026 network meta-analysis | Retained early CBT-I with individualized concurrent or sequential PAP. Removed the universal APAP, EPR, ramp, and pressure-range recipe; replaced unsafe/contraindicated sleep-restriction wording with transient-sleepiness monitoring; and withheld automated hypnotic guidance. | TX-01, SAF-01 | Clinician guidance, threshold notes, evidence documents, and paired regressions updated; 1,542 assertions passed at review; included in pilot build `e12734f`; formal clinician evidence signoff remains open |
| ER-2026-07-19-RC-STRESS | 2026-07-19 | 2026-07-19 | Combined release-candidate regression across COMISA, HB, PAP-download interpretation, limited and negative WatchPAT routing, nasal-first sequencing, conventional hypoxemia, positional OSA, oral-appliance history, and HGNS context | Previously verified primary sources and reviews listed in ER-2026-07-19-WATCHPAT, PAP, HB, NONPAP-PREDICTION, and COMISA; no new literature claim introduced | Ten cross-cutting cases found no contradictory routing, unsupported response tier, patient leakage of technical study-quality warnings, autonomous PAP action, HB-driven treatment allocation, or inappropriate reactivation of an unselected prior treatment. One communication defect in the first batch was corrected so an unspecified PAP mode remains generic rather than being labeled CPAP. | DX-01, DX-02, DX-04, PH-05, PH-07, SAF-01, SAF-03, TX-01, TX-02, TX-03, TX-05, PAP-01, PAP-02, PAP-03 | Tests 203-212 and all prior regressions passed; included in pilot build `e12734f`; clinician acceptance testing remains open |
| ER-2026-07-19-HGNS-PLAN | 2026-07-19 | 2026-07-19 | Patient communication for a clinician-confirmed HGNS-only visit plan | Previously verified FDA labeling, Kent et al. 2019, and response-context sources cataloged under TX-03; no new efficacy, eligibility, or response-prediction claim introduced | Replaced the sparse generic action with a dedicated patient module. New-device evaluation and existing-implant follow-up are separate pathways. The module explains the reason, concrete next steps, conditional testing, follow-up, and uncertainty; it does not promise candidacy, success, or a universal DISE requirement. Existing implants use objective efficacy verification and do not repeat new-device candidacy steps. | TX-03 | Tests 213-214, counterexamples in Tests 172 and 176, no-typographic-dash checks, and two rendered Today's Plan PDF pacing fixtures passed; included in pilot build `e12734f`; clinician acceptance testing remains open |

### ER-2026-08-13-SCIENTIFIC-RATIONALE: Diagnostic and Inspire rationale

- **Reviewer:** Codex primary-source review for Capital ENT clinician review
- **Review date and evidence cutoff:** 2026-08-13
- **Reason for review:** Create a readable, collaborator-facing explanation of how Precision Sleep
  makes decisions and verify the most clinically consequential diagnostic and Inspire boundaries
  before further evidence-system optimization.
- **Affected Logic IDs:** DX-01, DX-02, DX-03, DX-04, TX-02, TX-03, PAP-01, PAP-02, and PAP-03.
- **Official sources searched:** FDA PMA database and labeling, CMS Medicare Coverage Database,
  AASM guidelines and position statements, PubMed, PubMed Central, and the primary journals.
- **Search concepts:** adult OSA diagnostic testing, technically adequate HSAT, negative or
  inconclusive HSAT, arousal-based scoring, PAT validation, night-to-night variability, Inspire
  P130008/S090 indication and warnings, PAP intolerance, central mixed event percentage, BMI,
  DISE complete concentric collapse, lateral-wall collapse, ADHERE response associations, payer
  coverage, and objective HGNS follow-up.
- **Inclusion criteria:** Current U.S. regulatory labeling and payer policy; current or controlling
  professional guidance; pivotal or prospective device studies; multicenter cohorts; and original
  follow-up-pathway studies. Secondary summaries were not used as evidence for an app decision.
- **Exclusion criteria:** Marketing summaries, unsourced clinical overviews, studies without a
  decision-relevant endpoint, and predictors that could not be separated from selection bias or
  translated without inventing an individual response model.
- **Key findings:** A technically adequate conventional HSAT requires at least four hours of
  adequate flow and oximetry but can still be inadequate for a specific REM, position, central, or
  hypoventilation question. PSG is the guideline-supported next study after a negative,
  inconclusive, or inadequate HSAT when concern remains. Inspire labeling, payer criteria, and local
  referral governance are distinct. The reviewed label uses AHI 15-100 and excludes more than 25%
  central plus mixed events and palatal complete concentric collapse; BMI above 40 is a warning and
  evidence boundary rather than a listed universal contraindication. Other DISE and registry
  features are response context, not a validated probability.
- **Clinical decision:** Preserve the current clinical behavior. Add a central prose rationale,
  direct source links, and explicit classification of the symptomatic negative-HSAT nasal-first
  option and BMI 40 automatic referral boundary as local governance. Do not create a new candidacy
  score, treatment rank, diagnostic threshold, or patient instruction.
- **Implementation:** Added `scientific-rationale-and-decision-logic.md` and the reproducible source
  note `research/scientific-rationale-primary-sources.md`; cross-linked the evidence register and
  citation library; corrected the citation library's description of the Inspire BMI boundary.
- **Verification result:** Documentation integrity, local-link validation, lint, and the full
  browser regression suite passed. The suite completed 2,081 assertions, including the demo,
  intake, phenotype and plan matrices, patient PDFs, and the reviewed three-page clinician guide.
  Because no application code changed, observed behavior remained exact output parity.
- **Clinician signoff status at this review:** These policies still required a decision when the
  source review closed. Raymond Brown, MD subsequently approved all six on 2026-08-13 in
  ER-2026-08-13-GOVERNANCE-SIGNOFF.

### ER-2026-08-13-GOVERNANCE-SIGNOFF: Six clinician-approved policies

- **Clinical reviewer:** Raymond Brown, MD
- **Decision date:** 2026-08-13
- **Evidence cutoff:** 2026-08-13 targeted primary-source review
- **Reason for review:** Resolve the six local or individualized clinical-policy choices identified
  in ER-2026-08-13-SCIENTIFIC-RATIONALE before expanding the evidence system.
- **Affected Logic IDs:** DX-01, DX-02, DX-04, TX-03, and TX-05.
- **Decision 1, BMI above 40:** Approved retaining BMI 40 as Capital ENT's boundary for automatic
  Inspire-pathway promotion. It remains local governance, not an FDA contraindication.
- **Decision 2, home-study sampling:** Approved the existing short-recording and decision-specific
  REM and positional sampling guardrails. The app suppresses unsupported conclusions and escalates
  when inadequate sampling could materially change care.
- **Decision 3, symptomatic negative HSAT:** Approved PSG as the promoted draft default. Treating an
  independently indicated contributor first remains available only when the clinician explicitly
  confirms that plan; it is not presented as equivalent guideline guidance.
- **Decision 4, pre-Inspire study type:** Approved a device- and payer-specific approach. A recent,
  adequate HSAT may supply the needed clinical data when allowed; the app does not impose universal
  PSG when current payer policy or the clinical question does not require it.
- **Decision 5, combined DISE and procedure:** Approved only when the additional procedure has an
  independent indication and the clinician explicitly confirms the combination. The app does not
  infer a combined procedure automatically.
- **Decision 6, post-HGNS testing:** Approved objective on-therapy verification after activation and
  optimization, with modality and timing selected for the clinical question rather than hard-coded.
- **Implementation:** Moved `negativeHstNeedsPsg` into the PSG-recommended branch of the shared
  next-test helper; updated clinician flags, recommendations, and draft-plan language; retained the
  confirmed-plan filter that prevents an unselected test from becoming a patient instruction.
- **Regression design:** Test 250 requires the PSG-recommended default. Test 251 and existing nasal
  scenarios require the explicit nasal-first counterexample to preserve the clinician override and
  prevent false patient reporting that PSG was ordered.
- **Residual uncertainty:** The contributor-first pathway lacks direct comparative evidence. Track
  override reason, diagnostic delay, eventual PSG yield, missed disease, symptom response, and
  patient preference during validation.
- **Verification and deployment status:** Lint and all 2,091 evidence, browser, workflow, demo,
  intake, phenotype, plan, and PDF assertions passed. The change was not deployed during this
  review.

### ER-2026-07-19-NASAL: Septoplasty and nasal-surgery response predictors

- **Reviewer:** Codex evidence review for Capital ENT clinician review
- **Review date:** 2026-07-19
- **Evidence cutoff date:** 2026-07-19
- **Reason for review:** New Open Evidence synthesis supplied by the clinician; prospective
  validation planning and refinement of nasal-treatment counseling
- **Affected Logic IDs:** PH-08 and TX-05
- **Databases and official sources searched:** PubMed, PubMed Central, BMJ, European Respiratory
  Journal, and the primary Scientific Reports publication
- **Search concepts or saved search strings:** `septoplasty baseline NOSE predictor outcome`,
  `nasal surgery sleep quality NOSE PSQI`, `septoplasty sham surgery OSA AHI`, and
  `nasal surgery PAP adherence nasal obstruction barrier`
- **Inclusion criteria:** Adult studies of isolated septoplasty or functional nasal surgery that
  reported baseline predictors or changes in nasal symptoms, subjective sleep quality, AHI, PAP
  pressure, or PAP use; preference for randomized trials, systematic reviews, and primary cohorts
  with clearly defined outcomes
- **Key studies or documents added:** Carrie et al. 2023 NAIROS RCT; Stapleton et al. 2014
  prospective outcomes study; Koutsourelakis et al. 2008 sham-controlled RCT; Camacho et al. 2015
  systematic review and meta-analysis; Cha et al. 2023 retrospective cohort
- **Key studies considered but not used, with reason:** The Kang et al. SNOT-22 nomogram was not
  translated into app logic because it predicts a general sinonasal patient-reported outcome,
  lacks external validation, and does not predict AHI or PAP response. Small subgroup observations
  involving allergic rhinitis, OSA severity, nasal valve subtype, eosinophils, or acoustic
  rhinometry were not used as deterministic predictors. The supplied synthesis's reference 16
  cited the Ishii rhinoplasty guideline for a sham-controlled septoplasty result; the actual trial
  was Koutsourelakis et al. 2008, so the mismatched citation was not accepted.
- **Risk of bias or applicability concerns:** NAIROS establishes comparative nasal-symptom benefit
  but did not study OSA treatment response. Stapleton was an uncontrolled prospective cohort. The
  PAP literature includes small, selected, often uncontrolled cohorts, and Cha et al. found no
  significant overall change in autoPAP use or pressure before exploratory subgroup analysis.
  Treatment response may depend on the procedure, coexisting rhinitis, mask interface, PAP mode,
  and non-nasal adherence barriers.
- **Conclusion:** Documentation and clinician-context change only. Higher baseline NOSE severity
  can inform expected nasal-symptom improvement, and improvement in obstruction may accompany
  better subjective sleep quality. These findings must not be presented as predictors of AHI
  normalization. Nasal obstruction as the dominant PAP barrier is an exploratory treatment-response
  modifier, not a validated probability rule.
- **Code and patient-report effect:** Added a clinician-only tooltip to PH-08. No automatic surgery
  recommendation, treatment-ranking change, threshold change, or patient-report wording change.
- **Regression scenarios added or updated:** The current APAP plus severe nasal obstruction scenario
  now verifies the symptom-versus-AHI and dominant-PAP-barrier evidence boundary.
- **Clinician reviewer and decision:** Raymond Brown, MD, review pending
- **Commit:** `06c9c6d`
- **Deployed build:** `06c9c6d`
- **Next review trigger or due date:** External validation of a nasal-surgery response model; a new
  randomized trial reporting sleep-specific treatment-effect modifiers; or the next scheduled
  comprehensive evidence review

### ER-2026-07-19-SNORING: Nasal surgery in adult primary snoring

- **Reviewer:** Codex evidence review for Capital ENT clinician review
- **Review date:** 2026-07-19
- **Evidence cutoff date:** 2026-07-19
- **Reason for review:** New Open Evidence synthesis supplied by the clinician and refinement of the
  normal-AHI snoring pathway
- **Affected Logic IDs:** PH-08 and TX-06
- **Databases and official sources searched:** AAO-HNS journal publications, PubMed, PubMed Central,
  AASM, and the primary Australasian Sleep Association position statement
- **Search concepts or saved search strings:** `AAO-HNS septoplasty primary snoring consensus`,
  `functional nasal surgery snoring outcome survey`, `nasal surgery objective snoring acoustic`,
  and `primary snoring oral appliance guideline`
- **Inclusion criteria:** Adult primary-snoring or mixed snoring cohorts reporting partner,
  validated questionnaire, acoustic, or sleep-study outcomes after isolated or functional nasal
  surgery; current professional guidance for primary-snoring and oral-appliance management
- **Key studies or documents added:** Han et al. 2015 AAO-HNS consensus statement; Ishii et al. 2017
  AAO-HNS rhinoplasty guideline; Sarkis et al. 2023 Australasian Sleep Association position
  statement; Ramar et al. 2015 AASM/AADSM oral-appliance guideline; Yamasaki et al. 2020 prospective
  cohort; Virkkula et al. 2006 prospective objective-outcome study
- **Key studies considered but not used, with reason:** Carroll et al. combined nasal surgery with
  upper-airway radiofrequency ablation, so its snoring response cannot be attributed to nasal
  surgery. Koo et al. included only 15 patients and used short-term smartphone acoustic outcomes.
  Mandour et al., Li et al., Ertugay et al., and Wu et al. provide supportive or mixed cohort data
  but do not resolve the guideline-level uncertainty. Long-term septoplasty reviews establish
  durable nasal-obstruction benefit, not durable objective snoring control.
- **Risk of bias or applicability concerns:** Snoring definitions, partner reporting, questionnaires,
  recording methods, procedures, and follow-up intervals are heterogeneous. The largest long-term
  cohort measured snoring-related quality of life rather than calibrated acoustic burden and was
  not restricted to primary snoring. The AAO-HNS consensus statement records lack of consensus,
  not a recommendation against septoplasty. The Australasian position statement combines limited
  evidence with expert consensus and defines its target population more broadly than the app's
  stricter AHI-below-5 primary-snoring pathway.
- **Conclusion:** Counseling-context and wording change only. Nasal treatment can be selected for
  documented obstruction and may improve subjective snoring-related quality of life, but nasal
  surgery is adjunctive and must not be presented as reliably eliminating primary snoring. Oral
  appliance therapy remains an evidence-based option after OSA has been excluded and conservative
  measures are insufficient, subject to clinician selection and dental review.
- **Code and patient-report effect:** Added a clinician-only tooltip to the normal-AHI snoring
  pathway and changed clinician wording from "reduce snoring" to "potentially reduce snoring."
  Patient wording and treatment ranking were already appropriately conditional and were unchanged.
- **Regression scenarios added or updated:** The normal-AHI snoring, severe nasal obstruction,
  alcohol, and weight-readiness scenario now verifies the adjunctive-surgery counseling boundary
  and cautious snoring wording.
- **Clinician reviewer and decision:** Raymond Brown, MD, review pending
- **Commit:** `cec0e50`
- **Deployed build:** `cec0e50`
- **Next review trigger or due date:** Updated AAO-HNS or AASM guidance, a randomized trial of
  isolated nasal surgery with a prespecified primary-snoring endpoint, or standardized objective
  acoustic-response evidence

### ER-2026-07-19-WATCHPAT: WatchPAT interpretation and testing workflow

- **Reviewer:** Codex evidence review for Capital ENT clinician review
- **Review date:** 2026-07-19
- **Evidence cutoff date:** 2026-07-19
- **Reason for review:** Two Open Evidence syntheses supplied by the clinician raised concerns about
  WatchPAT severity misclassification and asked whether routine multi-night testing or PSG after
  every negative study should replace the current workflow.
- **Affected Logic IDs:** DX-01, DX-02, DX-03, PH-05, PH-06, and SAF-02
- **Databases and official sources searched:** AASM guideline publication, PubMed, PubMed Central,
  Journal of Clinical Sleep Medicine, Journal of Sleep Research, Chest, Thorax, European Respiratory
  Journal, and Sleep Medicine.
- **Search concepts or saved search strings:** `WatchPAT PSG severity misclassification meta-analysis`,
  `peripheral arterial tonometry mild OSA agreement`, `PAT REM OSA sensitivity specificity`,
  `WatchPAT central apnea validation`, `negative HSAT PSG AASM`, and `multi-night OSA testing
  variability Delphi`.
- **Inclusion criteria:** Adult simultaneous WatchPAT/PAT and PSG diagnostic-accuracy studies;
  systematic reviews of PAT diagnostic performance or night-to-night AHI variability; current
  professional diagnostic guidance; and studies directly evaluating REM or central phenotype
  classification. Device-independent multi-night studies were used only to characterize variability,
  not WatchPAT-specific accuracy.
- **Key studies or documents added:** Kapur et al. 2017 AASM diagnostic guideline; Iftikhar et al.
  2022 PAT meta-analysis; Ioachimescu et al. 2020 large sleep-clinic cohort; Massie et al. 2022 REM
  phenotype comparison; Pillar et al. 2020 central-apnea validation; Punjabi et al. 2020 three-night
  cohort; Roeder et al. 2020 night-to-night variability meta-analysis; and Fricke et al. 2026 Delphi
  consensus.
- **Key studies considered but not used, with reason:** AF and chronic-insomnia WatchPAT studies were
  not converted into automatic contraindications. AF is not itself listed in the 2017 AASM group for
  which PSG is recommended over HSAT, earlier AF validation was more favorable, and the newer evidence
  needs population and sensor-level reconciliation. An ISI threshold is not equivalent to the
  guideline's clinical definition of severe insomnia, so ISI alone does not bypass HSAT. The app does
  not currently collect chronic opioid use, neuromuscular respiratory weakness, or suspected
  hypoventilation, so it must not infer those conditions. Lechat et al. used a consumer under-mattress
  sensor and was not used to define a WatchPAT protocol. The Open Evidence suggestion to repeat
  WatchPAT at pAHI 3-7 was not adopted because AASM recommends PSG rather than a second HSAT when OSA
  remains suspected after a negative HSAT. Manual editing was not made a required field because its
  availability and workflow are not consistently captured.
- **Risk of bias or applicability concerns:** The PAT meta-analysis found marked heterogeneity and
  category discordance but does not provide an individual patient's probability of reclassification.
  Ioachimescu was a selected sleep-clinic cohort. REM classification was evaluated with a modified PAT
  implementation and single-night estimates. The central-apnea validation included 84 patients and
  depended on a respiratory-movement sensor. Multi-night evidence includes different devices and the
  2026 Delphi study had 13 experts, so it supports selective consideration rather than a new standard
  of care. Pretest probability modifies the meaning of a negative test, but no app-specific,
  externally validated decision rule was identified.
- **Conclusion:** Confidence and interpretation change, not wholesale replacement of WatchPAT.
  Technically adequate WatchPAT remains useful for uncomplicated adults. Mild and moderate categories
  now receive a clinician-only uncertainty flag. PSG is considered when reclassification would change
  diagnosis, eligibility, or risk assessment; after a negative or inadequate HSAT when clinical
  suspicion persists; and for captured guideline-defined complicating conditions. Routine multi-night
  WatchPAT is not recommended. Selective multi-night assessment is recorded as an emerging option for
  borderline or discordant cases, but is not automatically suggested by the app.
- **Code and patient-report effect:** Added a clinician-only WatchPAT severity-category flag; added a
  PSG-preferred flag for documented heart failure or stroke; corrected central-event wording; capped
  WatchPAT-derived REM and positional signal strength at Moderate; and added explanatory clinician
  tooltips. No patient-facing study-quality warning, automatic PSG order, or automatic multi-night
  pathway was added.
- **Regression scenarios added or updated:** Added direct tests for mild/moderate WatchPAT uncertainty,
  PSG counterexamples, heart-failure escalation, and WatchPAT-derived REM/positional confidence caps.
  The short-recording scenario verifies that the new clinician-only flag does not leak into the patient
  report.
- **Clinician reviewer and decision:** Raymond Brown, MD, review pending
- **Commit:** `d4fdd89`
- **Deployed build:** `d4fdd89`
- **Next review trigger or due date:** Updated AASM diagnostic guidance; external WatchPAT validation
  in uncomplicated and complicated ENT populations; validated position-duration requirements;
  prospective treatment-decision concordance; or standardized multi-night diagnostic thresholds.

### ER-2026-07-19-PAP: PAP compliance-download interpretation

- **Reviewer:** Codex evidence review for Capital ENT clinician review
- **Review date:** 2026-07-19
- **Evidence cutoff date:** 2026-07-19
- **Reason for review:** Open Evidence synthesis supplied by the clinician and activation of the
  previously planned PAP compliance assistant
- **Affected Logic IDs:** PAP-01, PAP-02, PAP-03, and SAF-01
- **Databases and official sources searched:** PubMed, PubMed Central, AASM, ATS, Journal of
  Clinical Sleep Medicine, and the accepted-manuscript page in Sleep
- **Search concepts or saved search strings:** `PAP device download residual AHI accuracy`,
  `manufacturer leak threshold CPAP ATS`, `persistent symptoms good CPAP download follow-up PSG`,
  `treatment emergent central sleep apnea trajectory`, and `PAP adherence four hour threshold ATS`
- **Inclusion criteria:** Adult PAP monitoring guidance, device-versus-manual or independent
  efficacy comparisons, manufacturer-comparison studies, central-event natural history, and current
  guidance on longitudinal PSG or HSAT. Pediatric-only interpretation papers were not used for adult
  decision thresholds.
- **Key studies or documents added:** Schwab et al. 2013 ATS statement; ResMed AirSense 11 user
  guide; Patil et al. 2019 AASM PAP
  guideline; Caples et al. 2021 AASM longitudinal testing guidance; Reiter et al. 2016; Midelet et al.
  2021; May et al. 2023 ATS policy statement; and Malhotra et al. 2026 accepted manuscript
- **Key studies considered but not used, with reason:** The supplied summary's absolute rule to
  intervene whenever device AHI exceeds 15 was not adopted because no validated universal action
  threshold was identified. AHI at least 10 remains a review trigger, not an automatic pressure
  change. Routine concurrent WatchPAT, cardiopulmonary coupling, oximetry, or PSG for every patient
  with a low device AHI was not adopted. Exact non-ResMed leak thresholds were deferred until report
  definitions and real deidentified examples can be verified. The four-hour metric is displayed as a
  coverage convention and not interpreted as sufficient all-night therapy.
- **Risk of bias or applicability concerns:** Device algorithms, mask leak definitions, event
  exclusions, and report periods vary by manufacturer and software version. Reiter was a
  single-center waveform-rescoring study. Malhotra was retrospective, compared ResMed flow-based
  estimates with cardiopulmonary coupling rather than PSG, and arose from a selected telemedicine
  cohort. Treatment-emergent central events often resolve, but published observation windows do not
  justify delaying urgent evaluation in a clinically unstable patient.
- **Conclusion:** Logic and safety-context change. The assistant must verify all extracted values,
  assess all-night coverage and leak before efficacy, treat device AHI as contextual, avoid reflex
  pressure escalation with central signals, and consider independent testing when explicitly confirmed
  current symptoms or oxygen risk disagree with apparently reassuring data. An elevated P95 leak alone
  is an upper-tail screening signal, not proof of sustained major leak. It never selects a pressure or
  changes a setting.
- **Code and patient-report effect:** Added structured PAP download inputs, an initial ResMed AirView
  parser, manufacturer-aware leak context, clinician classifications, suggested review steps, and a
  clinician disposition/note. P95 leak above a reference remains contextual unless corroborated by an
  explicit large-leak flag or clinical pattern. Symptom discordance requires a current-on-PAP answer,
  names the selected symptoms, and cannot be inferred from a historical ESS or prior treatment response.
  Nothing reaches the patient report without later clinician-confirmed plan integration.
- **Regression scenarios added or updated:** PAP download scenarios cover stable therapy, explicitly
  confirmed major leak, elevated P95 leak without sustained-leak evidence, partial-night use, explicit
  current symptoms despite a low device index, historical symptoms that must not create discordance,
  and a central-event signal with reduced or missing LVEF context.
- **Clinician reviewer and decision:** Raymond Brown, MD, review pending
- **Initial commit:** `525c740`
- **AirView parser calibration:** `c7b1ab3`
- **P95 leak and explicit symptom refinement:** `27b42ec`
- **Deployed build:** `27b42ec`
- **Next review trigger or due date:** AASM or ATS update; validated manufacturer-specific report
  definitions; prospective PSG comparison; external validation of a PAP-download action algorithm;
  or the next scheduled comprehensive review

### ER-2026-07-19-HB: Event-linked hypoxic burden and conventional hypoxemia

- **Reviewer:** Codex evidence review for Capital ENT clinician review
- **Review date:** 2026-07-19
- **Evidence cutoff date:** 2026-07-19
- **Reason for review:** New Open Evidence synthesis supplied by the clinician and recognition that
  the app conflated event-linked HB with ODI, T90, nadir SpO2, and area below 90%
- **Affected Logic IDs:** PH-07, SAF-03, TX-01, and TX-02
- **Databases and official sources searched:** Primary publications in European Heart Journal,
  American Journal of Respiratory and Critical Care Medicine, Annals of the American Thoracic
  Society, European Respiratory Journal, Chest, Hypertension, Journal of Clinical Hypertension,
  and the ATS workshop report
- **Search concepts or saved search strings:** `sleep apnea specific hypoxic burden definition`,
  `hypoxic burden cardiovascular mortality`, `hypoxic burden treatment interaction CPAP ISAACC`,
  `pooled trial hypoxic burden 87.1`, `HBOxi validation`, and `hypoxic burden blood pressure response`
- **Inclusion criteria:** Adult OSA studies defining or validating event-linked HB; independent
  cardiovascular cohorts; post hoc treatment-interaction analyses; method papers; professional
  workshop guidance; and studies testing whether HB predicts blood-pressure response
- **Key studies or documents added:** Azarbarzin et al. 2019; Trzepizur et al. 2022; Labarca et al.
  2023; Pinilla et al. 2023; Esmaeili et al. 2023; Parekh 2024; Cohen et al. ATS workshop; Peker et
  al. 2025; Messineo et al. 2024; Pengo et al. 2025; Azarbarzin et al. 2026; Bertram et al. 2026
- **Key studies considered but not used, with reason:** Cohort medians and tertiles at 60.7, 73.1,
  and 87.1 %min/h were not adopted as clinical categories because they were distribution-based and
  population-specific. The nonsignificant low-HB harm trend in ISAACC was not used to move PAP down
  the plan. Post hoc CPAP treatment interactions were not treated as individual guarantees. HBOxi
  was not assumed interchangeable with scored-event HB or the WatchPAT-reported field without method
  verification. Pediatric evidence was not used for adult thresholds.
- **Risk of bias or applicability concerns:** Cardiovascular associations are observational. The
  treatment-allocation findings are post hoc analyses of selected cardiovascular trial populations,
  not prospective HB-stratified trials. HB methods and scoring windows vary. Blood-pressure response
  evidence is mixed. No professional guideline endorses universal HB categories or action cutoffs.
- **Conclusion:** Logic and safety change. Event-linked HB is kept as a distinct continuous research
  metric with an exploratory 30 %min/h signal boundary and Moderate confidence cap. Values 73.1 and
  87.1 are descriptive research context only. Conventional oxygen metrics cannot create the HB
  phenotype. Substantial conventional nocturnal hypoxemia gets a separate safety pathway.
- **Code and patient-report effect:** Removed automatic HB-based cardiovascular-benefit claims,
  `HB-URG`, the worst-metric HB composite, low-HB clinician notes, low-HB PAP de-emphasis, and the HB
  adjustment from the app-created MAD score. Added clinician tooltips, research-context language,
  `OXYGEN-URG`, non-OSA differential wording, and conditional objective oxygen follow-up.
- **Regression scenarios added or updated:** Actual HB 80 produces a Moderate HB research signal but
  no conventional-hypoxemia urgency. ODI 55 or nadir 74 produces the separate oxygen safety signal but
  cannot create the HB phenotype. HB cohort context alone does not trigger patient-facing urgency, and
  reassuring oxygen metrics no longer move PAP down a mild-OSA plan.
- **Clinician reviewer and decision:** Raymond Brown, MD, approved for deployment 2026-07-19
- **Commit:** `72fe762` clinical implementation; `8219ec0` clinician approval metadata
- **Deployed build:** `8219ec0`, verified 2026-07-19 with 1,414 regression assertions
- **Next review trigger or due date:** Prospective HB-stratified treatment trial; AASM, ATS, ERS, or
  AHA guidance endorsing clinical categories; validated WatchPAT HB-method documentation; external
  validation of HBOxi implementation; or the next scheduled comprehensive review

### ER-2026-07-19-NONPAP-PREDICTION: Non-PAP treatment-response prediction

- **Reviewer:** Codex evidence review for Capital ENT clinician review
- **Review date:** 2026-07-19
- **Evidence cutoff date:** 2026-07-19
- **Reason for review:** Open Evidence synthesis supplied by the clinician raised concern that the
  app was converting exploratory response associations into individualized candidacy tiers and
  treatment ranking.
- **Affected Logic IDs:** PH-05, TX-02, TX-03, and TX-07
- **Databases and official sources searched:** AASM and AADSM guideline publications, PubMed,
  PubMed Central, Cochrane, European Respiratory Journal, Journal of Clinical Sleep Medicine,
  Laryngoscope, and FDA device labeling already reviewed under ER-2026-07-15.
- **Search concepts or saved search strings:** `oral appliance response predictors external
  validation guideline`, `supine isolated positional therapy monotherapy non-supine REM`, `DISE
  upper airway surgery prediction meta-analysis`, `lateral wall collapse hypoglossal nerve
  stimulation efficacy`, and `HGNS response model external validation`.
- **Inclusion criteria:** Current professional guidance; systematic reviews or meta-analyses;
  prospective or multicenter validation cohorts; and primary studies directly evaluating objective
  treatment response. Regulatory eligibility evidence was kept separate from response prediction.
- **Key studies or documents added:** Ramar et al. 2015; Camañes-Gonzalvo et al. 2022; Srijithesh
  et al. 2019; Lastra et al. 2025; Qi et al. 2024; Green et al. 2019; Meraj et al. 2017; Vena et al.
  2025; Huyett et al. 2021; Op de Beeck et al. 2021; and Ji et al. 2026. Friedman et al. 2004 and
  Choi et al. 2016 were reclassified as directional anatomic context rather than individual
  probability sources.
- **Key studies considered but not used, with reason:** Internally cross-validated MAD endotype and
  machine-learning models were not implemented because they lack adequate external validation and
  require measurements not available from routine WatchPAT summaries. The Vena airflow-shape
  algorithm was not implemented because it requires raw unfiltered nasal-pressure signals and a
  separately validated analytic pipeline. The internally validated MMA model and Ji HGNS staging
  model were not converted to probabilities. OSPREY proximal-HGNS results were not generalized to
  other devices because response predictors and device-specific labeling differ.
- **Risk of bias or applicability concerns:** Oral-appliance response definitions and devices vary,
  subjective benefit can diverge from objective control, and most individual predictors have small
  effects. Positional response depends on body-position and non-supine REM exposure, adherence, and
  durability. DISE has moderate interrater reliability and inconsistent predictive performance
  across surgical procedures. Complete lateral-wall collapse evidence is most applicable to
  unilateral HGNS and does not define a universal contraindication or an individual probability.
- **Conclusion:** Clinical confidence and treatment-ranking change. Keep evidence-based treatment
  options and safety gates, but remove unvalidated response tiers. Oral-appliance factors are
  contextual only. Supine-isolated OSA may support positional monotherapy only after adequate
  non-supine, including REM, sampling and objective verification; supine-predominant OSA receives
  adjunctive language. Friedman stage and DISE localize anatomy without exact success predictions.
  HGNS response context is not aggregated, and partial lateral-wall collapse is not equated with
  complete collapse.
- **Code and patient-report effect:** Removed app-created MAD favorable/poor output and MAD-based
  treatment ranking; neutralized legacy snapshot wording; replaced HGNS strong/good/marginal tiers
  with eligibility plus uncertainty; removed HGNS scoring from clinical endotype surrogates;
  separated complete from partial lateral-wall collapse; removed exact Friedman response rates; and
  made positional-treatment wording depend on isolated versus predominant disease.
- **Regression scenarios added or updated:** Updated oral-appliance request, prior intolerance,
  prior success, and tonsillar-surgery scenarios. Added paired supine-isolated and
  supine-predominant scenarios, paired complete and partial lateral-wall HGNS scenarios, and direct
  positional-classification counterexamples. The full headless suite passed 1,509 assertions.
- **Clinician reviewer and decision:** Raymond Brown, MD, review pending
- **Commit:** `1c1c6cf`
- **Deployed build:** `e12734f` clinical-pilot acceptance build; formal clinician evidence signoff remains open
- **Next review trigger or due date:** External validation of an individual oral-appliance, surgery,
  or HGNS response model; validated commercial raw-airflow implementation; updated AASM, AADSM, or
  surgical guidance; device-label change; or the next scheduled comprehensive review.

### ER-2026-07-19-COMISA: CBT-I and PAP sequencing in COMISA

- **Reviewer:** Codex evidence review for Capital ENT clinician review
- **Review date:** 2026-07-19
- **Evidence cutoff date:** 2026-07-19
- **Reason for review:** Open Evidence synthesis supplied by the clinician identified divergent PAP-
  adherence findings, bedtime-restriction safety data, and newer comparative evidence that required
  review of the app's COMISA wording.
- **Affected Logic IDs:** TX-01 and SAF-01
- **Databases and official sources searched:** PubMed, PubMed Central, Sleep, Journal of Sleep
  Research, Sleep Medicine Reviews, and the University of Adelaide primary-publication record.
- **Search concepts or saved search strings:** `COMISA CBT-I PAP randomized sequential concurrent`,
  `Sweetman zsz178`, `MATRICS zsaa041`, `COMISA bedtime restriction sleepiness zsaa002`, `integrated
  CBT-I PAP adherence veterans zsaa235`, and `COMISA network meta-analysis 102301`.
- **Inclusion criteria:** Randomized trials directly comparing CBT-I and PAP sequences or integrated
  delivery; systematic review or meta-analysis of CBT-I in COMISA; and primary safety analyses of
  bedtime restriction. Review articles and the supplied AI synthesis were used to locate sources,
  not as evidence.
- **Key studies or documents added:** Sweetman et al. 2019 COMSIA RCT; Ong et al. 2020 MATRICS RCT;
  Sweetman et al. 2020 week-to-week sleepiness analysis; Alessi et al. 2021 integrated CBT-I and PAP-
  adherence RCT; Sweetman et al. 2023 systematic review and meta-analysis; Turner et al. 2023
  exploratory MATRICS neurocognitive analysis; and Zhang et al. 2026 network meta-analysis.
- **Key studies considered but not used, with reason:** The probabilistic ranking of PAP plus CBT-I
  plus eszopiclone was not implemented because direct evidence was limited and a network ranking does
  not establish an individual medication recommendation. Insomnia subtype and psychiatric-comorbidity
  sequence suggestions were not automated because available trials were not powered to validate those
  treatment-effect modifiers. The app does not infer that CBT-I alone is an OSA treatment from small
  AHI-change studies.
- **Risk of bias or applicability concerns:** COMSIA and MATRICS disagree on PAP-adherence benefit.
  The integrated trial was conducted in older, predominantly male veterans. The bedtime-restriction
  safety result showed a small, transient mean ESS increase and does not exclude uncommon individual
  safety problems. The Turner analysis involved only 45 participants and was exploratory. The 2026
  network meta-analysis ranked heterogeneous interventions and had limited direct evidence for some
  combinations.
- **Conclusion:** Logic and safety-language change. Continue offering CBT-I early and individualize
  concurrent versus sequential PAP rather than making CBT-I a prerequisite. Remove the unsupported
  universal APAP, maximum EPR, ramp, and pressure-range recipe. High ESS prompts early monitoring,
  driving and safety-sensitive-duty review, and clinician-adjusted CBT-I pacing rather than labeling
  bedtime restriction unsafe or contraindicated. Do not automate hypnotic selection.
- **Code and patient-report effect:** Clinician recommendations, guardrails, follow-up wording,
  configuration notes, and evidence documentation changed. The patient report continues to recommend
  only the clinician-confirmed CBT-I and PAP plan and does not expose technical PAP-setting or
  medication advice.
- **Regression scenarios added or updated:** Added paired sleepy and non-sleepy COMISA scenarios.
  They require individualized PAP language, prohibit the prior universal setting recipe, and confirm
  that only the high-ESS case receives transient-sleepiness and safety monitoring. The full headless
  suite passed 1,542 assertions.
- **Clinician reviewer and decision:** Raymond Brown, MD, review pending
- **Commit:** `063d108`
- **Deployed build:** `e12734f` clinical-pilot acceptance build; formal clinician evidence signoff remains open
- **Next review trigger or due date:** AASM, ATS, or VA/DoD COMISA-specific sequencing guidance;
  adequately powered treatment-effect-modifier trial; validated safety algorithm for bedtime
  restriction; major PAP-adherence RCT; or the next scheduled comprehensive review.

### ER-2026-07-20-AUDIT-REMEDIATION: Independent audit reconciliation

- **Reviewer:** Codex implementation review with independent Claude audit findings supplied by Raymond Brown, MD
- **Review date:** 2026-07-20
- **Evidence cutoff date:** 2026-07-20
- **Reason for review:** Independent pre-pilot audit identified one patient-facing contradiction and several logic, workflow, and governance inconsistencies.
- **Affected Logic IDs:** DX-01, DX-02, PH-05, and SAF-04
- **Databases and official sources searched:** No new search was required. The remediation applies the already verified AASM diagnostic-testing guideline and positional-therapy sources cataloged in `citations.md`.
- **Search concepts or saved search strings:** Not applicable; implementation-concordance review against the frozen evidence library.
- **Inclusion criteria:** Existing primary guidelines and reviews already approved for nondiagnostic HSAT routing and positional OSA; local workflow policies for unresolved patient history and clinician-controlled report distribution.
- **Key studies or documents added:** None.
- **Key studies considered but not used, with reason:** None. The audit did not introduce a new clinical claim or threshold.
- **Risk of bias or applicability concerns:** The WatchPAT short-recording cutoff remains an app guardrail rather than a device-universal adequacy definition. The positional ratio does not prove adequate positional sampling or monotherapy response. Patient-reported cardiovascular uncertainty is nonspecific.
- **Conclusion:** Logic-concordance and safety change. A positive numerical signal from a nondiagnostic home recording remains visible but cannot be presented as a confirmed diagnosis, severity category, phenotype, or risk tier. All positional outputs use one inclusive ratio boundary and preserve the isolated-versus-predominant distinction. An unsure cardiovascular response remains unresolved for staff review.
- **Code and patient-report effect:** The full handout suppresses definitive severity, subtype, phenotype, and risk sections for a short nondiagnostic home recording. The editable plan draft uses `classifyPositionalPattern()` and labels supine-predominant positional therapy as adjunctive. The intake mapper preserves cardiovascular uncertainty. Workflow-only changes normalize clinician edits before persistence/PDF, prompt to save edited reports before download, define APAP/IPAP/EPAP, warn before intake-answer loss, and retain a session-scoped recovery token after the URL is cleaned.
- **Regression scenarios added or updated:** Updated the short three-hour WatchPAT scenario; added exact 2.0 positional-boundary and 1.99 counterexample scenarios; added full-report punctuation checks across the plan matrix; added uncertain-cardiovascular mapping, edited-snapshot normalization, and intake recovery-state checks. The complete headless suite passed 2,020 assertions locally.
- **Clinician reviewer and decision:** Raymond Brown, MD authorized deployment for clinician testing; formal acceptance pending
- **Commit:** This audit-remediation change set; exact hash recorded in Git history
- **Deployed build:** `16cbd81`, verified on the clinical pilot 2026-07-20
- **Next review trigger or due date:** Clinician acceptance; any AASM diagnostic-testing update; externally validated WatchPAT adequacy rule; or validated positional-treatment selection rule.

### ER-2026-08-13-COMISA-HYPOXEMIA-WEIGHT: Targeted rationale expansion

- **Reviewer:** Codex primary-source review for Capital ENT clinician review
- **Review date and evidence cutoff:** 2026-08-13
- **Reason for review:** Continue optimizing the decision evidence after the diagnostic and Inspire
  review, while preserving current application behavior until new clinical policies are approved.
- **Affected Logic IDs:** PH-07, TX-01, TX-04, and SAF-03.
- **Sources searched:** PubMed/MEDLINE, FDA Drugs@FDA labeling, AASM and ATS guidance, DOI and
  journal records, and reference lists of the decision-relevant primary sources.
- **Search concepts:** COMISA CBT-I/PAP sequencing and safety; ISI diagnostic limits; event-linked
  hypoxic burden, ODI, T90, nadir, and method interchangeability; weight intervention and objective
  reassessment; SURMOUNT-OSA; and current tirzepatide labeling.
- **Inclusion criteria:** Primary randomized trials, primary outcome cohorts, current regulatory
  labeling, and official professional guidance directly relevant to a current or proposed app use.
- **Key findings:** ISI at least 15 plus AHI at least 5 is defensible only as a local screen. CBT-I
  should be offered early, but no universal PAP sequence or individual adherence prediction is
  supported. Conventional oxygen metrics, scored-event HB, and oximetry-derived burden must remain
  separate; the app's exact safety trigger set is local. Weight management is adjunctive, and the
  Zepbound OSA indication is adults with obesity and moderate-to-severe OSA, alongside diet and
  activity. Objective reassessment is appropriate before treatment de-escalation after meaningful
  weight change.
- **Source corrections:** Replaced an incorrect conventional-hypoxemia bibliography with Labarca
  2019 and the correct Oldenburg 2016 *European Heart Journal* citation; corrected Parekh to 2024;
  and updated the Zepbound label link to the current FDA file reviewed 2026-08-13.
- **Runtime discrepancies found:** Sweetman 2019 does not support calling untreated insomnia the
  “strongest predictor” of PAP nonadherence. The fixed “5-7 pounds can noticeably reduce snoring”
  statement was not supported by the audited primary evidence. Some report language can also make
  the numerical COMISA screen sound like a confirmed insomnia diagnosis, and tirzepatide shorthand
  should distinguish dual GIP/GLP-1 pharmacology and the Zepbound OSA indication from Mounjaro and
  general weight-management eligibility.
- **Conclusion:** Documentation and source correction only in this review. Preserve current
  thresholds and routing. Do not silently alter clinician or patient guidance; bring the identified
  wording, provenance, and follow-up policies to the clinician for signoff.
- **Code and patient-report effect:** No executable behavior or output changed. Only a source-year
  comment in `js/config.js` was corrected.
- **Regression scenarios:** Existing COMISA, HB, conventional-hypoxemia, and weight scenarios remain
  controlling. New paired wording and follow-up regressions are required in the same change set if
  the pending runtime corrections are approved.
- **Clinician reviewer and decision:** Raymond Brown, MD, pending on the new runtime wording and
  follow-up decisions. Prior 2026-07-19 HB behavior approval remains in force.
- **Commit and deployed build:** To be recorded after verification; not deployed.
- **Next review trigger:** Clinician signoff; FDA label or AASM/ATS guidance change; validated
  commercial burden-method comparison; prospective HB-guided treatment trial; or the next scheduled
  review.

## Review template

Copy this section for each future targeted or comprehensive review.

### ER-YYYY-MM-DD: Short topic

- **Reviewer:**
- **Review date:**
- **Evidence cutoff date:**
- **Reason for review:** scheduled, guideline update, regulatory change, safety signal, new study, or pre-study freeze
- **Affected Logic IDs:**
- **Databases and official sources searched:**
- **Search concepts or saved search strings:**
- **Inclusion criteria:**
- **Key studies or documents added:**
- **Key studies considered but not used, with reason:**
- **Risk of bias or applicability concerns:**
- **Conclusion:** no change, documentation only, confidence change, threshold change, logic change, or safety change
- **Code and patient-report effect:**
- **Regression scenarios added or updated:**
- **Clinician reviewer and decision:**
- **Commit:**
- **Deployed build:**
- **Next review trigger or due date:**

## Suggested recurring search concepts

Adapt these concepts to PubMed syntax and combine them with adult OSA terms:

- phenotype, endotype, Pcrit, loop gain, arousal threshold, and muscle compensation;
- hypoxic burden, ventilatory burden, delta heart rate, cardiovascular outcomes, and treatment interaction;
- positional OSA and REM-predominant OSA definitions and treatment response;
- mandibular advancement response predictors and external validation;
- hypoglossal nerve stimulation eligibility, device labeling, predictors, and complete concentric collapse;
- COMISA, CBT-I timing, PAP adherence, and insomnia outcomes;
- nasal obstruction, septoplasty, turbinate surgery, snoring, PAP pressure, and PAP adherence;
- negative HSAT, false negative, arousal-based scoring, RERAs, UARS, and polysomnography;
- tirzepatide, GLP-1 therapy, weight loss, OSA outcomes, and adverse effects; and
- PAP download interpretation, residual AHI, leak, pressure optimization, central apnea, and treatment escalation.

For regulatory or guideline topics, search the official FDA or professional-society source directly
in addition to PubMed.
