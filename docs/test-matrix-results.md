# Patient Report Test Matrix — Results
**Latest smoke test:** August 12, 2026
**Latest tested build:** local meeting candidate on `codex/precision-sleep-v1` (not deployed)
**Latest complete result:** 2,051 headless assertions passed with no failures

---

## 2026-08-12 Inspire meeting demo and presentation hierarchy

**Status at review:** local implementation and complete regression verification finished. No deployment was requested or performed.

**Result:** passed 2,051 headless assertions with no failures.

**Verified behavior:**

- a localhost-only synthetic demo covers the real patient questionnaire, pending staff review, verified synthetic WatchPAT import, clinician review, clinician guide, Today's Sleep Plan, Full Sleep Profile, and an Inspire candidacy counterexample
- demo questionnaire links remain on the current localhost origin instead of routing browser-memory tokens to the deployed intake app, and all synthetic questionnaire answers are prefilled on open
- submitted demo answers populate previously empty chart fields and the visible clinician form; only a deliberate existing-value conflict remains pending for Staff Prep review, matching the production intake merge boundary
- the questionnaire-to-app handoff no longer depends on `window.opener`; a two-tab browser test confirmed submission returns to the original localhost app when the browser opens the questionnaire with no opener reference
- demo records remain in browser memory and both patient and clinician surfaces clearly state the synthetic privacy boundary
- the patient reports lead with a plain-language finding and next step before terminology and supporting detail without removing existing clinical content
- the clinician view and clinician guide lead with treatment priorities, missing information, safety constraints, and guardrails before the complete supporting evidence
- the clinician guide supports browser preview and download
- clinician workflow markers retain readable spacing in print, and interactive tooltip/disclosure controls are flattened without browser-default button chrome
- the patient treatment-plan heading remains with its introduction and first recommendation instead of becoming an orphaned page ending
- output-parity matrices, evidence documentation, intake branching, parser integration, PAP compliance, the synthetic demo, and patient and clinician PDF pagination all pass
- visual inspection of the generated two-page patient plan and three-page clinician guide found no clipped or overlapping content
- no clinical threshold, phenotype rule, treatment rank, candidacy rule, diagnostic route, or questionnaire content changed

## 2026-07-19 Non-PAP treatment-response calibration

**Status at review:** local implementation and full regression verification complete. The combined code was subsequently deployed in pilot build `e12734f`; formal clinician evidence signoff remains open.

**Result:** passed 1,509 headless assertions with no failures.

**Verified behavior:**

- oral-appliance selection no longer emits an app-created favorable, standard, or poor response tier, score, probability, or score-driven treatment rank
- a PAP-intolerant patient who requests an oral appliance still receives the option, dental and TMJ safety review, and objective on-treatment sleep testing
- prior benefit, tolerance, and adverse effects remain more clinically important than population-level response associations
- supine-isolated OSA is distinct from supine-predominant OSA; only the isolated pattern can support possible positional monotherapy, and only after adequate non-supine and non-supine REM sampling plus objective verification
- supine-predominant OSA retains the positional phenotype but receives explicit adjunctive language because OSA persists off the back
- complete lateral oropharyngeal-wall collapse appears as negative unilateral-HGNS response context without becoming a universal contraindication or individual probability
- partial lateral-wall collapse is documented but is not treated as the same adverse predictor as complete collapse
- HGNS demographic, PAP-pressure, Ji-stage, and endotype associations are not counted into strong, good, marginal, or other aggregate response tiers
- Friedman Stage I and Stage III provide directional anatomy context without exact historical success percentages or patient-specific probabilities
- DISE remains useful for collapse localization but is not presented as a validated general surgical-response score
- legacy oral-appliance tags in saved snapshots render neutral patient wording rather than preserving an obsolete favorable or poor tier
- patient-facing reports remain free of typographic dash characters

## July 19, 2026 Event-Linked HB and Nocturnal-Hypoxemia Separation

- Removed the app-created worst-of composite that labeled HB, ODI, T90, nadir, or area below 90%
  as the same phenotype. Only an entered event-linked HB value can now create the HB research signal.
- Capped the HB signal at Moderate because no universal low/moderate/high categories are validated.
  Values 73.1 and 87.1 appear only as post hoc research-cohort context and do not allocate treatment.
- Added a separate `OXYGEN-URG` pathway for substantial conventional nocturnal hypoxemia. It asks
  the clinician to review whether OSA fully explains the finding, treat confirmed OSA effectively,
  and objectively confirm oxygen control.
- Removed `lowHypoxicBurden`, low-HB PAP de-emphasis, HB-based alternatives-first ordering, and the
  HB penalty from the exploratory MAD score.
- Added counterexamples confirming that HB 80 with otherwise reassuring oxygen metrics does not
  create conventional-hypoxemia urgency, while ODI 55 or nadir 74 cannot create the HB phenotype.
- Full headless regression suite: **1,414 assertions passed**.

> Earlier entries below preserve historical results. References to `HB-URG`, composite HB tiers,
> or low-HB treatment ordering are superseded by this review and are not current behavior.

## July 19, 2026 Clinician Next-Test Guidance

- Added clinician and patient-intake fields for chronic opioid use, neuromuscular respiratory weakness, and suspected hypoventilation. Added clinician-only designations for severe insomnia likely to compromise HSAT, suspected night-to-night variability, and decisions that require an exact severity category.
- Added a shared four-state module: PSG recommended, PSG reasonable to consider, selective multi-night HST may be useful, or no additional diagnostic testing now.
- Verified that a short study and AASM-defined complicating conditions take priority over selective multi-night HST; an adequate negative HST with persistent symptoms preserves clinician choice about PSG timing; and an uncomplicated positive study does not trigger additional testing automatically.
- Verified that MA suggestions remain drafts and that test guidance is excluded from the patient handout unless Diagnostic Testing is selected and the plan is confirmed.
- Added direct regression scenarios 186-190 and updated the intake workflow to verify the new structured data reaches the chart.
- Core logic, intake, workflow, phenotype, plan-suggestion, evidence, parser, and comprehensive-report PDF suites passed. **1,343 assertions completed successfully.** The unchanged Today's Plan PDF fixture was the only incomplete check because local headless Chrome could not initialize its Crashpad store; it did not report a layout or content assertion failure.
- Deployed clinical-pilot release `7e1bb55`.

## July 19, 2026 WatchPAT Interpretation Calibration

- Full headless regression suite: **1,335 assertions passed**.
- Verified clinician-only severity-category uncertainty for mild and moderate WatchPAT results, with severe WatchPAT and PSG counterexamples.
- Verified WatchPAT-derived REM and positional phenotypes cannot display a Strong signal solely from a single home-study pattern.
- Verified documented heart failure raises the guideline-preferred PSG interpretation signal.
- Verified the limited-quality WatchPAT patient handout does not expose technical quality or severity-category warnings.
- Routine multi-night testing and automatic PSG for every positive or negative WatchPAT were intentionally not added. The draft PSG pathway remains driven by negative or inadequate HSAT plus persistent concern, central signals, captured guideline-defined complicating conditions, or a decision that depends materially on severity reclassification.
- Deployed clinical-pilot release `d4fdd89`.

---

## July 18, 2026 Scoped iPad Intake and Guided-Plan Fixes

- Restored only the patient intake surface, not the prior patient portal. Staff generate a patient-specific 72-hour, single-use link from an authenticated chart and open that link on the clinic iPad. The handed device never needs a clinician login.
- Added a cardiovascular cascade that accepts uncertainty: cardiovascular history, prior echocardiogram, result knowledge, then numeric LVEF only when known.
- A positive cardiovascular history without a valid numeric LVEF now creates a server-derived durable `Echo / LVEF Needed` flag in the chart header and bounded search results. Saving a valid LVEF clears it.
- Intake responses are cleared from the browser and the token is removed from the address bar after successful submission.
- Closed all four guided-plan gaps from the prior audit: probable UARS now suggests diagnostic testing, home-test central signals add PSG confirmation, short/limited-REM WatchPAT results draft diagnostic confirmation instead of definitive new treatment, and severe hypoxemia adds prompt oxygen-control follow-up to the MA summary.
- Full headless regression suite: **593 assertions passed**, including the scoped-link workflow, cardiovascular cascade, unknown-result path, persistent chart/search flag, resolution after numeric LVEF documentation, and handed-device cleanup.
- Deployed clinical-pilot release `31df11f`. CloudFront serves the versioned clinician and intake assets. The invalid-token edge route returns the generic `403` response, while the direct API Gateway hostname returns `403 Forbidden` without the CloudFront origin secret.
- Verified the new intake token table is active with KMS encryption, point-in-time recovery, TTL, deletion protection, and its patient-index GSI. The restricted intake Lambda has the expected patient table, token table, and origin-secret configuration; the stack finished `UPDATE_COMPLETE`.

---

## July 18, 2026 Second Five-Scenario Guided-Plan Audit

- Added five full encounter simulations covering severe hypoxemic OSA with PAP retry, a favorable tonsillar surgical pattern, probable UARS despite normal pAHI, a short WatchPAT study with limited REM sampling, and a current BiPAP user with home-test central signals plus reduced LVEF.
- The expanded guided-plan matrix passes **149 assertions**. The complete headless suite passes **581 assertions** with no unexpected failures.
- The tonsillar surgery pathway was coherent across the MA suggestions, clinician report, and patient handout. It preserved the favorable Friedman/UPPP finding, discussed tonsil and palate surgery, and did not add an unnecessary DISE or nerve-stimulation prerequisite.
- The central-breathing safety layer also behaved correctly after analysis: the clinician and patient outputs required PSG confirmation, retained the documented BiPAP mode, and warned that ASV is unsafe with the documented LVEF. However, the MA suggestion layer proposed only `PAP management`, so the required diagnostic pathway was absent from the draft plan.
- Three other plan-drafting gaps were identified. Probable UARS generated no chart-aware suggestion even though the final engine recommended an in-lab study; severe hypoxemia produced an urgent `HB-URG` recommendation but the draft next-step summary did not mention oxygen control or prompt follow-up; and the limited-quality WatchPAT case suggested PAP plus positional therapy without reflecting the short recording and limited REM evidence in the draft.
- The limited-study disclosure boundary worked as intended: quality limitations were visible to the clinician, REM phenotyping was suppressed, and the patient handout did not label the study as bad or expose the technical quality warnings.
- No runtime clinical behavior was changed or deployed during this diagnostic audit.

---

## July 18, 2026 Guided-Plan Output Reliability Fixes

- Headless regression suite: **501 assertions passed**, including all five full guided-plan encounters.
- Replaced UTC-derived report dates with the local encounter date. The regression matrix now checks this in every guided-plan scenario, including runs after midnight UTC while the clinic remains on the prior Central calendar date.
- Made the explicit `Discuss Inspire` visit goal sufficient to activate nerve-stimulation intent. When DISE or staging is incomplete, the clinician and patient outputs now show the required HNS workup rather than leaving the treatment plan empty or prematurely calling the patient a candidate.
- Added a focused pre-study clinician report with the confirmed diagnostic plan, questionnaire and exam context, diagnostic boundary, ranked pre-diagnosis actions, and follow-up plan. It intentionally omits post-diagnosis treatment candidacy.
- Updated clinician PAP history and care-summary wording to preserve the documented APAP, CPAP, or BiPAP mode.
- Removed the hard-coded Pear Somryst example. Clinician guidance now recommends sleep psychology or a validated, currently available digital CBT-I program, supported by the AASM Emerging Technology Committee review recorded in `docs/citations.md`.
- Deployed clinical-pilot release `37a9906`. CloudFront serves the matching build identifier, and the live `app.js` SHA-256 checksum matches the tested local file.

---

## July 18, 2026 Five-Scenario Guided-Plan Audit

- Added five full encounter simulations covering current APAP with discomfort and nasal obstruction, new moderate OSA with COMISA, PAP intolerance with an oral-appliance goal, an Inspire-focused consultation, and a symptomatic pre-study evaluation.
- The new matrix passed **51 assertions**. The complete headless suite now passes **480 assertions**. It verifies the suggested pathways and rationale, one-click draft application, clinician-confirmed plan, recommendation tags, and patient-report inclusion and exclusion rules.
- Four pathways were internally coherent: current APAP correctly continued rather than restarted, CBT-I and PAP ran in parallel for COMISA, oral-appliance content stayed focused on the patient's stated goal, and the pre-study report recommended diagnostic testing without introducing OSA therapy.
- Review found a material intent-integration gap: selecting `Discuss Inspire` as the primary visit goal suggests and confirms nerve stimulation, but the clinician treatment engine emits no HNS recommendation unless the separate `Interested in Inspire` preference is also checked. The patient report can therefore name nerve stimulation in the summary without a corresponding active-treatment entry.
- Review found three additional UX/content defects: reports generated after 7 PM Central use the next UTC calendar date; the pre-study clinician-report area is blank despite a valid diagnostic plan; and the clinician summary labels a documented APAP user as `Currently using CPAP`.
- The COMISA clinician recommendation still names Pear Somryst as an FDA-cleared digital CBT-I example. The FDA clearance remains in the device database, but Pear's 2023 Chapter 11 filing makes the named operational example stale. The general evidence-based digital CBT-I recommendation remains appropriate.
- No runtime behavior was changed or deployed during this diagnostic audit.

---

## July 18, 2026 Chart-Aware Encounter Plan Drafts

- Headless regression suite: **429 assertions passed**. End-to-end coverage confirms suggestions remain unselected until staff applies them, non-suggested pathways remain available, and applying a draft requires clinician confirmation again.
- Added transparent plan suggestions derived from the reason for visit, current or prior PAP use, PAP comfort barriers, NOSE score, ISI, positional study data, BMI, and documented weight-management readiness.
- Added a one-click action that selects the suggested pathways and drafts an editable next-step summary. It adds to the plan without removing clinician-selected options and never confirms the plan automatically.
- Verified the representative current-APAP scenario suggests PAP management, nasal treatment, positional therapy, and weight management, with nasal treatment prioritized in the summary when dry mouth and meaningful obstruction are documented.
- Deployed clinical-pilot release `15c3f28`. CloudFront serves the versioned plan-suggestion asset, and its SHA-256 checksum matches the tested local file.

---

## July 18, 2026 Intent-Aware Precision Sleep Workflow

- Headless regression suite: **416 assertions passed**. New end-to-end coverage confirms age is calculated from DOB, current APAP is presented as continuation rather than initiation, the APAP pressure range persists into the patient report, and unselected oral-appliance and DISE prerequisites remain absent.
- Added a required visit-reason field and a clinician-confirmed end-of-visit plan. Technical candidacy remains visible to clinicians, while the patient report is generated only from pathways actually selected during the visit.
- Added APAP, CPAP, and BiPAP mode-specific settings; made the completed NOSE score the primary nasal symptom signal; prioritized nasal treatment for current PAP users with meaningful obstruction; and suppressed routine WatchPAT apnea-versus-hypopnea completeness warnings.
- Recalibrated hypoxic-burden wording so HB 30 to less than 73 is shown as an elevated research signal rather than high hypoxic burden. Removed unsupported lower-HB claims that non-PAP treatments have equivalent outcomes.
- Added first-name prefix search with an encrypted DynamoDB GSI and a rollout fallback that preserves MRN, DOB, and last-name search while the optional index is unavailable. Backfilled both existing synthetic charts and verified a count-only `jamie` query returns one match.
- CloudFormation validation passed. Deployed clinician-only clinical-pilot release `caa47b5` and verified CloudFront serves the matching versioned assets.

---

## July 16, 2026 REM Import, Quality Guardrail, And Global Report Audit

- Headless regression suite: **407 assertions passed**, including a full-parser integration test against `WatchPATReport.pdf` and an HST-to-PSG stage-data isolation check.
- Confirmed the parser imports `% REM of Sleep Time: 23.1` as a high-confidence `remPercent` field and that the value persists after chart reload.
- Added a clinician-only limited-REM flag based on reported REM percentage and total sleep time. When REM duration is below 30 minutes, the raw REM AHI remains available to the clinician, but REM phenotyping and REM-specific treatment recommendations are suppressed.
- Corrected cross-scenario report behavior: normal-AHI reports use an evaluation title, mild lower-oxygen-risk reports keep summary/pathway/checklist priorities aligned, and a general surgery preference no longer triggers an unrelated HNS workup.
- Re-rendered five synthetic reports through the production jsPDF/html2canvas path. Limited HST, normal-AHI/UARS, anatomy-forward surgery, and oral-appliance-safety scenarios each rendered in **2 pages**; the content-rich COMISA/PAP-retry/nasal scenario appropriately remained **3 pages**.
- Visually inspected all **11 PDF pages**. No clipping, overlapping content, missing terminology guide, invalid placeholders, prohibited Unicode dash characters, or scenario-specific content contradictions were found.

---

## July 16, 2026 Five-Scenario Patient Report Audit

- Headless regression suite: **371 assertions passed**.
- Corrected recommendation composition so treatment options and their prerequisite workups remain distinct. A dental, airway, or device evaluation can no longer erase the treatment choice it is meant to assess.
- Added state-aware priorities for mild PAP-avoidant patients, completed PAP trials without retry intent, and anatomy-forward patients who prefer a surgical discussion. Summary cards, treatment groups, first-30-day checklists, and care journeys now use the same active pathway.
- Added strong-anatomy contributor language, uncertainty-aware mild/minimally symptomatic wording, concise UARS follow-through, and patient-specific mild-treatment option lists.
- Kept the AHI explanation and severity scale together, expanded sparse-page selection rules, and removed unit overflow clipping that could trim the first characters of a page-leading heading.
- Re-rendered five synthetic reports through the real jsPDF/html2canvas path: severe COMISA with PAP retry (**3 pages**), mild positional OSA with PAP avoidance (**3 pages**), normal AHI with possible UARS (**2 pages**), moderate COMISA after a declined PAP retry (**4 pages**), and anatomy-forward surgical preference (**3 pages**). All 15 pages were inspected for content hierarchy, clipping, spacing, continuation labels, and contradictions.
- `pdfinfo` confirmed Letter-size output with no embedded JavaScript or encryption. Searchable-text checks confirmed all five scenario-specific priorities and found no prohibited Unicode dash characters.
- Deployed to clinician-only staging and verified CloudFront serves build `6887acb`; the live `patientReport.js` and `pdf-export.js` checksums match the tested local files.

---

## July 16, 2026 Patient Terminology Completion

- Headless regression suite: **349 assertions passed**.
- Corrected the PAP definition to describe the machine and mask accurately.
- Added conditional definitions for `Oral appliance` and `Nerve stimulation`, selected only when those concepts appear in the patient report.
- Re-rendered and visually inspected the real three-page jsPDF/html2canvas PAP-retry fixture. The expanded terminology guide remains readable, all continuation labels and content blocks are intact, and no content is clipped or crowded.
- `pdfinfo` confirmed Letter-size output with no embedded JavaScript; searchable-text checks confirmed all three updated definitions and found no prohibited Unicode dash characters.
- Deployed to clinician-only staging and verified CloudFront serves build `2846b36`; the live patient-report asset checksum matches the tested local file.

---

## July 15, 2026 Patient Report Pagination and Terminology Follow-Up

- Headless regression suite: **346 assertions passed**.
- Added a conditional `Oxygen burden` definition so the risk summary cannot introduce that concept before explaining it.
- Replaced remaining patient-facing compound jargon such as `daytime-function`, `sleep-apnea treatment`, and `first-line` with more natural plain language.
- Added a soft page-break quality rule. When normal spacing would separate the AHI severity scale from its explanation, the PDF uses a bounded compact layout that keeps the linked information together without forcing a fixed page count.
- Re-rendered the real jsPDF/html2canvas path for PAP-retry severe COMISA (**3 pages**), pre-study evaluation (**2 pages**), and maximal eight-phenotype (**4 pages**). All nine pages were inspected for clipping, spacing, continuation labels, orphaned content, and readability.
- `pdfinfo` confirmed Letter-size output with no embedded JavaScript; searchable-text checks confirmed the new terminology and continuation labels and found no prohibited Unicode dash characters.

---

## July 15, 2026 Patient Report Layout Follow-Up

- Headless regression suite: **345 assertions passed**.
- Restored predictable paragraph and section spacing in the PDF by keeping each pagination unit's child margins measurable instead of zeroing the first and last margins of every unit.
- Stacked each terminology label above its definition in both preview and PDF layouts, eliminating uneven label widths and narrow definition columns.
- Added automatic, patient-readable continuation labels when a report section crosses a page, such as `Your Sleep Apnea Summary (continued)` and `Your Treatment Plan (continued)`.
- Rechecked the real jsPDF/html2canvas path with PAP-retry severe COMISA (**3 pages**), pre-study evaluation (**2 pages**), and maximal eight-phenotype (**4 pages**) fixtures. All nine pages were rendered and inspected for spacing rhythm, clipping, page continuity, sparse tails, and orphaned content.
- `pdfinfo` confirmed Letter-size output with no embedded JavaScript; `pdftotext` confirmed searchable content and no prohibited Unicode dash characters across all three fixture PDFs.
- Deployed to clinician-only synthetic-data staging and verified CloudFront serves build `587589e`, the expanded terminology rules, and the AHI-aware continuation paginator.

---

## July 15, 2026 Patient Terminology and Reading-Pace Revision

- Headless regression suite: **345 assertions passed**.
- Added a conditional `Terms used in this report` guide before the clinical narrative. Terms are selected from the actual report, ordered by first occurrence, and defined in plain language. Coverage includes OSA, AHI, PAP/CPAP, CBT-I, COMISA, BMI, DISE, REM/NREM, ODI/RDI, UARS, ASV/BiPAP, PSG, HGNS, TMJ, GLP-1 therapy, Friedman staging, hypoxic burden, central-breathing terminology, echocardiography, cardiovascular language, mandibular advancement devices, UPPP, general anesthesia, and endotypes.
- Added a report-wide output invariant that removes em dashes, en dashes, nonbreaking hyphens, and related typographic dash characters from every patient handout branch. Prose uses commas, colons, parentheses, or semicolons, and numeric ranges use ASCII hyphens.
- Increased line height, section spacing, contributor spacing, treatment-row padding, and callout padding in both preview and PDF styles. The paginator retains content-driven length, rebalances sparse final pages with whole semantic units, and now keeps level-two and level-three headings with their first paragraph.
- Exercised the real jsPDF/html2canvas path with PAP-retry severe COMISA (**3 pages**), pre-study evaluation (**2 pages**), and maximal multi-phenotype (**3 pages**) fixtures. All eight pages were rendered and inspected for clipping, crowding, split treatment cards, malformed severity scales, sparse-tail balance, and orphaned headings.
- `pdfinfo` confirmed Letter-size output with no embedded JavaScript; `pdftotext` confirmed searchable content and no prohibited Unicode dash characters across all three fixture PDFs.
- Deployed to clinician-only synthetic-data staging and verified CloudFront serves versioned assets for build `736c31a`, including the terminology guide, punctuation safeguard, expanded spacing, and heading-aware pagination.

---

## July 15, 2026 Global Report-Composition Revision

- Headless regression suite: **334 assertions passed**.
- Replaced one-off PAP wording with a shared state model covering new start, active use, retry, discontinued therapy, and preference to avoid PAP; the Morgan-like case now reads `PAP Re-fit / Retry` instead of `Starting CPAP`.
- Patient recommendations now consolidate by clinical concept and prerequisite severity. Duplicate oral-appliance, airway-surgery, nasal, and nerve-stimulation tags cannot produce competing cards; overlapping surgery/HGNS prerequisites collapse into one procedure-specific airway evaluation unless a safety guardrail requires separate handling.
- HGNS language now preserves Inspire-specific CCC/AHI/BMI/PAP-history rules while describing DISE and other candidacy testing as device/procedure-specific rather than universally identical across systems.
- PDF length is content-driven. Normal-density output is retained by default; modest print-only compaction is accepted only when it removes a sparse page, and irreducible sparse tails are rebalanced without forcing maximal reports into an arbitrary page target.
- Exercised the real jsPDF/html2canvas path with three contrasting fixtures: PAP-retry severe COMISA (**2 pages**), pre-study evaluation (**2 balanced pages**), and maximal multi-phenotype plan (**3 pages**). All seven pages were rendered and inspected; no clipping, black/transparent page regions, orphaned headings, or malformed AHI scale text was found.
- `pdfinfo` confirmed Letter page size, no embedded JavaScript, and no encryption; `pdftotext` confirmed searchable state labels, study rationale, combined procedure workup language, and separated AHI zone labels/ranges. The current raster-plus-hidden-text stack remains untagged and is not full PDF/UA.
- Deployed to clinician-only staging and verified CloudFront serves build `a0c718b` plus the new PAP-state, concept-canonicalization, device-specific workup, and adaptive-pagination code.

---

## July 15, 2026 Patient-Report Safety and PDF Revision

- Headless regression suite: **313 assertions passed**.
- Added severe-COMISA coverage for concurrent/sequential CBT-I/PAP planning, documented PAP barriers, anatomy-specific wording, weight as a modifiable contributor, oxygen burden as an outcome/risk marker, and device-specific HGNS language.
- Exercised the real jsPDF/html2canvas export path with `tests/patient-report-pdf-fixture.html`.
- Final representative severe-COMISA report: **2 letter-size pages**, rendered and inspected page by page; no clipping, orphaned headings, split conditional-treatment group, or sparse trailing page found.
- PDF output now includes selectable/searchable text beneath the pixel-faithful visual layer, document metadata, higher-contrast pathway text, and `Page x of y` footers. The current jsPDF stack does not provide full PDF/UA tagging.
- Patient and clinician copy was recalibrated against Sweetman/MATRICS COMISA trials and current FDA Inspire/Genio labeling; citations are tracked in `docs/citations.md`.
- Deployed to clinician-only staging and verified CloudFront is serving build `186487f` and the corrected report/PDF code.

---

## April 2, 2026 Patient Report Wording Follow-Up

### Normal-AHI Care Summary Language
- Found during manual review of synthetic patient `Synthetic 05 - Lauren Patel`.
- Symptom: the returning patient summary said `Your sleep study showed normal sleep apnea (AHI 3)`, which reads as if `normal` were a subtype of OSA rather than a negative study.
- Follow-up symptom: the normal-AHI report could also render `Your Sleep Apnea Pattern: Minimally Symptomatic` with copy saying `Not everyone with sleep apnea feels tired...`, which still mislabeled a normal-AHI patient as having sleep apnea.
- Fix:
  - normal-AHI returning summaries now say the study did not show evidence of obstructive sleep apnea
  - normal-AHI reports suppress OSA-specific subtype blocks and use `Your Sleep Study Summary` as the returning heading
  - added a regression assertion so the report can no longer emit `normal sleep apnea`
  - added regression assertions so normal-AHI reports no longer emit `Your Sleep Apnea Pattern` or the `Not everyone with sleep apnea...` counseling copy
- Result:
  - **180 passed, 0 failed** of 180 assertions
- Verification:
  - `node --check js/patientReport.js`
  - `bash tests/run-headless-suite.sh`

## April 2, 2026 Patient Portal MVP Follow-Up

### Clinician-Published Patient Page
- Added a new patient portal MVP flow with:
  - clinician-side `Publish to Patient Page`
  - dedicated `portal-tokens` management
  - public `portal.html` rendering of clinician-published content only
- Verification:
  - `node --check js/db.js`
  - `node --check infrastructure/lambda/index.mjs`
  - `node --check infrastructure/lambda/intake.mjs`
  - `node --check js/workflow-test-app.js`
  - `aws cloudformation validate-template --template-body file://infrastructure/template.yaml`
  - `bash tests/run-headless-suite.sh`
- Result:
  - **187 passed, 0 failed** of 187 assertions

### Hosted Patient-Page Deploy Fix
- Found during live staging validation after the MVP deploy.
- Symptom: `https://dk259m1syu2bu.cloudfront.net/portal.html` returned S3/XML `AccessDenied` even though the public portal API route was live.
- Root cause: `infrastructure/deploy.sh` published `index.html` and `intake.html`, but not `portal.html`.
- Fix:
  - static CloudFront publishes now include `portal.html`
  - redeployed staging and verified the hosted patient page now loads through CloudFront
- Verification:
  - `bash -n infrastructure/deploy.sh`
  - `bash tests/run-headless-suite.sh`
  - `curl -sL https://dk259m1syu2bu.cloudfront.net/portal.html`
  - `curl -sL https://dk259m1syu2bu.cloudfront.net/patient-portal/not-a-real-token`
- Result:
  - hosted `portal.html` now serves the patient-page shell
  - invalid public portal tokens return the expected JSON error payload instead of an S3 object error
  - runtime config published at deploy time shows `buildId: 2f89f8d` and `deployedAt: 2026-04-02T22:50:58Z`

### Hosted Patient-Page Runtime Config Fix
- Found during manual patient-page testing after publication of a real staging chart.
- Symptom: the patient page loaded its shell but showed `This link is unavailable` with `Portal configuration is unavailable.`
- Root cause: `portal.html` checked `window.AWS_CONFIG`, but deployed `js/aws-config.js` only declared `const AWS_CONFIG = {...}`. In a classic browser script that creates a global binding, but not a `window` property.
- Fix:
  - `portal.html` now uses `typeof AWS_CONFIG !== 'undefined' ? AWS_CONFIG : (window.AWS_CONFIG || {})`
  - deploy-time `js/aws-config.js` now also appends `window.AWS_CONFIG = AWS_CONFIG`
  - re-published CloudFront staging
- Verification:
  - `bash -n infrastructure/deploy.sh`
  - `bash tests/run-headless-suite.sh`
  - `curl -sL https://dk259m1syu2bu.cloudfront.net/js/aws-config.js`
  - `curl -sL https://dk259m1syu2bu.cloudfront.net/portal.html`
- Result:
  - hosted runtime config now exposes both `AWS_CONFIG` and `window.AWS_CONFIG`
  - hosted `portal.html` contains the repaired runtime lookup path
  - staging was republished at `2026-04-02T23:19:14Z`

### Patient-Page Presentation And Mobile Follow-Up
- Found during manual patient-page review of a real published staging chart.
- Symptoms:
  - the page looked like a desktop report nested inside another desktop report
  - the embedded report duplicated its own header/footer inside the portal shell
  - the presentation was not yet optimized for the phone-first patient use case
- Fix:
  - added an at-a-glance overview rail above the report with care stage, study result, and review timing
  - improved hero hierarchy and publication metadata treatment
  - hid the duplicate inner report header/footer inside the portal page
  - widened and restyled the embedded report inside the portal shell
  - added mobile-specific spacing, typography, and pathway/report overrides in `portal.html`
- Verification:
  - `node --check .portal-inline-check.js` (temporary extracted portal script)
  - `bash tests/run-headless-suite.sh`
- Result:
  - **190 passed, 0 failed** of 190 assertions
  - workflow smoke now verifies the overview rail, study summary, and hidden duplicate header

## April 2, 2026 Hosted Intake-Link Follow-Up

### Intake-Link URL Regression
- Found during real staging validation: clinician-generated intake links were using `/intake` on the hosted CloudFront app.
- Symptom: patients opening the copied intake link saw an S3/XML `AccessDenied` page instead of the intake questionnaire.
- Root cause: the clinician app always built links from `window.location.origin + '/intake'`, which was correct for local `serve` testing but wrong for the CloudFront/S3 front door.
- Fix:
  - hosted / public links now use the configured app URL and `/intake.html`
  - workflow-test mode still uses localhost-friendly `/intake`
- Verification:
  - `bash tests/run-headless-suite.sh`
  - result: **178 passed, 0 failed** of 178 assertions
- Follow-up still required: redeploy staging so newly generated clinician intake links use the repaired hosted path.

## April 2, 2026 CloudFront Staging Redeploy And Hosted Pilot Smoke

### Redeploy
- Re-ran `./infrastructure/deploy.sh raymondbrown@gmail.com us-east-2 capital-ent-stg-20260401b https://dk259m1syu2bu.cloudfront.net,http://127.0.0.1:3000,http://localhost:3000`.
- CloudFormation reported no template drift and refreshed the static app publish plus CloudFront invalidation.
- Verified live runtime config at `https://dk259m1syu2bu.cloudfront.net/js/aws-config.js`:
  - `deploymentEnvironment: staging`
  - `deploymentLabel: STAGING`
  - `buildId: 1a11170`
  - `deployedAt: 2026-04-02T20:22:42Z`

### Hosted Smoke Checklist
- Passed: clinician sign-in on CloudFront staging with MFA challenge.
- Passed: visible runtime label, non-production banner, and runtime footer metadata after sign-in.
- Passed: exact-name patient search on the hosted patient-list modal for `CloudFront QA, Staging`.
- Passed: hosted patient load correctly repopulated `patientName`, `patientDob`, and `patientMrn`.
- Passed: hosted patient save persisted a chart change (`weightLossReadiness = considering`) and refreshed the `Last saved` timestamp.
- Passed: hosted clinician analysis submit regenerated the clinician report and restored the `Generate Patient Report` trigger.
- Passed: hosted patient-report overlay rendered real report content for `CloudFront QA, Staging` including the uncertainty callout section.
- Passed: hosted `Save Snapshot` persisted to DynamoDB on the live staging record:
  - `reportSnapshotCount` increased to `3`
  - patient `version` increased to `10`
  - new snapshot `createdAt = 2026-04-02T20:30:02.044Z`
- Confirmed on the same staged chart that prior intake-review history and field-provenance history remain present after the redeploy.

### Remaining Manual Validation
- Hosted PDF export still needs one trusted manual browser click after the `1a11170` redeploy. Browser automation can focus/click the control, but it is not reliable evidence that Chrome treated the action as a true user download gesture.
- Hosted intake-link generation and public intake submit were already live-validated on the current ancestry before this runtime-labeling deploy, and the `1a11170` change set did not modify the intake backend path. Even so, re-running one manual hosted intake-link/send/submit cycle is still recommended before the first live patient pilot day.

### Conclusion
- The current CloudFront staging surface is on the intended `1a11170` build and passed the core hosted clinician workflow needed for a supervised clinical pilot: auth, save/load/search, analysis, patient-report preview, and snapshot persistence.
- The remaining pre-pilot runtime checks are now operational rather than code-driven: one trusted manual PDF download confirmation and one final hosted intake-link cycle.

## April 2, 2026 Executable Harness Expansion

### Multi-Step Workflow Smoke Follow-Up
- Added a localhost-only clinician workflow test shim in:
  - `js/workflow-test-app.js`
  - `index.html`
- Added localhost workflow test handling in:
  - `intake.html`
- Added a new headless smoke page in:
  - `tests/workflow-smoke.html`
- Expanded the runner in:
  - `tests/run-headless-suite.sh`
  - `.github/workflows/regression-harness.yml`
- Added executable workflow coverage for:
  - clinician save through the real patient bar + in-memory chart backend
  - clinician analysis through the real `Generate Reports` submit path
  - patient-report overlay open + snapshot save
  - live-form insufficient-data resubmit coverage for `ANATOMY-WORKUP`, `HNS-WORKUP`, and `OXYGEN-WORKUP`
  - clear-form + patient-list reload continuity
  - exact-name patient search through the real patient-list modal
  - archive + archived-list restore through the real patient-list modal
- review-dashboard surfacing of a pending intake chart
- explicit intake-review accept/keep persistence + provenance/review-history checks
- public intake form token validation + submit-to-thank-you transition
- clinician runtime badge + non-production banner visibility
- intake runtime metadata + non-production banner visibility
- Result: **177 passed, 0 failed** of 177 assertions.
- Verification method:
  - `node --check js/workflow-test-app.js`
  - extracted inline script parse checks for `index.html` and `intake.html`
  - `bash -n tests/run-headless-suite.sh`
  - `bash tests/run-headless-suite.sh`
- Conclusion: the regression harness is no longer limited to report-layer/browser assertions. It now executes real multi-step clinician and intake journeys on localhost using the production UI surfaces with a safe in-memory backend, including end-to-end insufficient-data resubmits and runtime-environment labeling checks that match pilot-safety expectations.

### Runtime Environment Labeling Follow-Up
- Added deploy-time runtime metadata fields in:
  - `js/aws-config.js`
  - `infrastructure/deploy.sh`
  - `intake.html`
- Added visible clinician runtime UI in:
  - `index.html`
  - `css/styles.css`
- Added visible intake runtime UI in:
  - `intake.html`
  - `css/intake.css`
- Added executable workflow assertions for:
  - main-app `WORKFLOW TEST` runtime badge
  - main-app non-production banner
  - intake runtime metadata
  - intake non-production banner
- Verification method:
  - `node --check /tmp/osa-index-inline.js`
  - `node --check /tmp/osa-intake-inline.js`
  - `bash -n infrastructure/deploy.sh`
  - `bash tests/run-headless-suite.sh`
- Conclusion: staging, pilot, local, and workflow-test sessions now have explicit runtime labeling on both clinician and patient-facing surfaces, which materially reduces the risk of confusing a validation environment with production during clinical pilot work.

### Universal Phenotype-Uncertainty Follow-Up
- Expanded the insufficient-data assessment in:
  - `js/app.js`
- Expanded the patient-facing phenotype uncertainty handling in:
  - `js/patientReport.js`
- Expanded executable regression coverage in:
  - `tests/tests.html`
- Added verification for:
  - unresolved phenotype callout rendering in Section C
  - safer zero-phenotype summary wording when nasal or autonomic-stress inputs are still missing
  - `NASAL-WORKUP` patient-plan explanation and checklist step
- Result: **166 passed, 0 failed** of 166 assertions.
- Verification method:
  - `node --check js/app.js`
  - `node --check js/patientReport.js`
  - `bash -n tests/run-headless-suite.sh`
  - `bash tests/run-headless-suite.sh`
- Conclusion: this pass stops incomplete nasal, partial-airway-exam, and missing delta-heart-rate inputs from sounding like negative phenotype findings in the patient report, while keeping the full clinician/intake smoke harness green.

### Home-Test Central Confirmation Follow-Up
- Added source/syntax verification for the new WatchPAT central-confirmation guardrail in:
  - `js/app.js`
  - `js/patientReport.js`
  - `docs/citations.md`
- Added executable patient-report coverage for:
  - `CENTRAL-PSG-WORKUP` explanation rendering
  - `CENTRAL-PSG-WORKUP` checklist step generation
- Result: **130 passed, 0 failed** of 130 assertions.
- Verification method:
  - `node --check js/app.js`
  - `node --check js/patientReport.js`
  - headless Chrome DOM run against `http://127.0.0.1:3000/tests/tests.html`
- Conclusion: WatchPAT-derived central / CSR signals now behave as a PSG-confirmation prerequisite before advanced central-directed therapy is finalized, and the patient-report regression harness covers the new guardrail.

### Explicit Safety-Input Follow-Up
- Added source/syntax verification for the new clinician-entered safety inputs and their downstream guardrails in:
  - `index.html`
  - `js/app.js`
  - `js/patientReport.js`
  - `docs/citations.md`
- Added executable patient-report coverage for:
  - `MAD-SAFETY-LIMIT` explanation rendering
  - `MAD-SAFETY-LIMIT` checklist step generation
  - `ASV-CONTRA` explanation rendering
  - `ASV-CONTRA` checklist step generation
- Result: **134 passed, 0 failed** of 134 assertions.
- Verification method:
  - `node --check js/app.js`
  - `node --check js/patientReport.js`
  - extracted inline script parse check via `node --check /tmp/osa-index-inline.js`
  - headless Chrome DOM run against `http://127.0.0.1:3000/tests/tests.html`
- Conclusion: the app now distinguishes explicit safety limitations from unresolved workup for MAD and ASV pathways, and the patient-report regression harness covers the new guardrails.

### Endotype-Data Follow-Up
- Added source/syntax verification for the expanded endotype-data limitation handling in:
  - `js/app.js`
  - `js/patientReport.js`
- Result: **136 passed, 0 failed** of 136 assertions.
- Added executable patient-report coverage for:
  - `ENDOTYPE-WORKUP` explanation rendering
  - `ENDOTYPE-WORKUP` checklist step generation
- Verification method:
  - `node --check js/app.js`
  - `node --check js/patientReport.js`
  - headless Chrome DOM run against `http://127.0.0.1:3000/tests/tests.html`
- Conclusion: missing apnea-versus-hypopnea scoring now reads as incomplete endotyping rather than absent endotype signal, and the report-layer regression harness covers the new guardrail.

### Partial-Data And Zero-Value Follow-Up
- Added source/syntax verification for the broader partial-data and zero-value safety handling in:
  - `js/app.js`
  - `js/patientReport.js`
  - `docs/citations.md`
- Added executable coverage for:
  - positional-confidence handling when non-supine AHI is `0`
  - REM-predominant handling when NREM AHI is `0`
  - oxygen-data sufficiency guardrails before low-hypoxic-burden framing
- Result: **140 passed, 0 failed** of 140 assertions.
- Verification method:
  - `node --check js/app.js`
  - `node --check js/patientReport.js`
  - headless Chrome DOM run against `http://127.0.0.1:3000/tests/tests.html`
- Conclusion: partial REM/positional datasets now read as unresolved rather than negative, legitimate `0` values are preserved as real phenotype data, and low-hypoxic-burden framing now requires more than a single oxygen metric.

### Executable Regression Runner Follow-Up
- Added a repeatable local runner at `tests/run-headless-suite.sh`.
- Added CI workflow wiring in `.github/workflows/regression-harness.yml`.
- Result: local runner passes against the current harness ✅
- Verification method:
  - `tests/run-headless-suite.sh`
  - headless Chrome summary: **140 passed, 0 failed** of 140 assertions
- Conclusion: the browser regression harness is now a runnable command and CI entrypoint instead of a manual one-off step.

### Identity-Provenance Follow-Up
- Added source/syntax verification for the expanded identity-field provenance handling in:
  - `infrastructure/lambda/index.mjs`
  - `index.html`
- Verified behaviors in source:
  - patient `name`, `dob`, and `mrn` now enter `fieldProvenance`
  - patient `name`, `dob`, and `mrn` now append to `fieldProvenanceHistory`
  - provenance modal now renders identity labels and current chart values alongside form fields
- Verification method:
  - `node --check infrastructure/lambda/index.mjs`
  - extracted inline script parse check via `node --check /tmp/osa-index-inline.js`
- Conclusion: demographic chart edits are now covered by the same provenance timeline used for clinical form fields, reducing one of the last chart-governance blind spots before pilot testing.

### Intake Review Workflow Follow-Up
- Added source/syntax verification for the new intake-review workflow and provenance timeline changes in:
  - `infrastructure/lambda/index.mjs`
  - `infrastructure/lambda/intake.mjs`
  - `js/db.js`
  - `index.html`
- Result: backend and inline-frontend syntax checks passed ✅
- Verification method:
  - `node --check infrastructure/lambda/index.mjs`
  - `node --check infrastructure/lambda/intake.mjs`
  - extracted inline script parse check via `node --check /tmp/osa-index-inline.js`
- Verified behaviors in source:
  - dedicated `Review Intake` entry points from the patient bar, alert banner, and review-queue patient list action
  - dedicated `OSADatabase.reviewIntakeChanges()` API path
  - explicit per-field `accept-intake` / `keep-chart` resolution payloads
  - persistent `fieldProvenanceHistory` and `intakeReviewHistory`
  - provenance modal now renders current chart value, pending intake value, and compact timeline history
- Conclusion: the explicit intake-review resolution workflow and durable field-timeline plumbing are implemented, syntax-clean, and now covered by the localhost workflow smoke suite. Live AWS-backed validation remains a separate layer.

### Intake Review Dashboard Follow-Up
- Added source/syntax verification for the new dedicated review-dashboard surface in `index.html`.
- Verified behaviors in source:
  - dedicated navbar `Review Queue` entry point
  - standalone dashboard summary counts for `review-needed`, `received`, and `pending`
  - direct `Open` and `Review` row actions from the dashboard
  - local-mode hide behavior for the dashboard when AWS auth/DB is not configured
- Verification method:
  - extracted inline script parse check via `node --check /tmp/osa-index-inline.js`
  - source review of `loadReviewDashboard()` and shared queue-ranking helpers
- Conclusion: the intake review queue is no longer limited to the patient-list toggle, and the localhost workflow smoke suite now covers the dashboard open/review path. Live AWS-backed validation remains a separate layer.

### Treatment Safety Guardrails Follow-Up
- Re-ran the local browser harness after adding executable coverage for:
  - oral-appliance prerequisite messaging
  - ASV heart-function safety messaging
  - DISE-before-surgery prerequisite messaging
- Re-ran it again after widening the insufficient-data guardrails to cover:
  - missing positional tracking
  - missing REM/NREM staging
- Result at that stage: **128 passed, 0 failed** of 128 assertions.
- Execution method: headless Chrome DOM run against `http://127.0.0.1:3000/tests/tests.html`.
- Added executable assertions for:
  - `MAD-WORKUP` patient explanation + checklist step
  - `ASV-SAFETY` patient explanation + checklist step
  - `SURGERY-WORKUP` patient explanation + checklist step
  - `POSITION-WORKUP` patient explanation + checklist step
  - `SLEEP-STAGE-WORKUP` patient explanation + checklist step
- Conclusion: the report-layer regression harness now covers both the new treatment-prerequisite guardrails and the broader missing-data guardrails, and remains green.

### Scope
- Re-ran the local browser harness at `tests/tests.html` after adding executable patient-report regression coverage for:
  - insufficient-data callout rendering
  - weight-readiness personalization
  - BMI-based GLP-1 language guardrails
- Re-ran the harness again after extracting shared care-pathway / UARS helpers into `js/report-shared.js`.

### Browser Harness
- Result: **112 passed, 0 failed** of 112 assertions.
- Execution method: headless Chrome DOM run against `http://127.0.0.1:3000/tests/tests.html`.
- Added executable assertions for:
  - `What may still be refined` rendering only when `insufficientDataDomains` exist
  - readiness-specific weight language for `ready`, `considering`, and `not-ready`
  - no GLP-1 language below BMI 30, with GLP-1 language preserved at BMI 30+
- Added executable assertions for:
  - shared UARS detection behavior
  - shared care-pathway stage generation
- Conclusion: the local executable harness now covers a wider slice of the recent audit follow-up work and remains green.

---

## April 1, 2026 Post-Remediation Smoke Test

### Scope
- Executed the legacy browser harness at `tests/tests.html` in local Chrome against the current codebase.
- Ran local clinician-app smoke checks on `http://127.0.0.1:3000/index.html` with safe blank AWS config.
- Focus for this pass: non-AWS browser behavior after the audit remediation work.

### Browser Harness
- Result: **96 passed, 0 failed** of 96 assertions.
- Execution method: local static server + headless Chrome DOM run.
- Remediation during this pass:
  - Updated the harness confidence expectations to match the current Edwards-score low arousal threshold logic.
  - Updated high loop gain and high hypoxic burden expectations to the current composite/tiered model.
  - Updated sample-report assertions that were still expecting the retired low-arousal trigger path.
  - Added a browser-level validation test for required form fields.
- Conclusion: the local browser regression harness is back in sync with the remediated clinical logic and currently passes cleanly.

### Local Clinician-App Smoke Checks

#### 1. Safe defaults / local config posture
- `sex`, `tonsils`, and `ftp` loaded blank on first render.
- `Save Patient` and `Patients` controls were hidden with blank local `AWS_CONFIG`, confirming safe non-production local behavior.
- Result: **PASS**

#### 2. Required-field submit gate
- Submitted the form with required fields blank.
- Observed blocking alert with all 5 expected missing fields:
  - Patient name
  - Date of birth
  - Age
  - Sex
  - BMI
- Observed `5` invalid controls styled inline.
- Result: **PASS**

#### 3. Pre-study workflow
- Entered minimum demographic data with no sleep-study values and submitted.
- `Generate Patient Report` became available.
- Clinician report remained empty in the pre-study state.
- Result: **PASS**

#### 4. Patient report overlay
- Opened the pre-study report preview.
- Verified:
  - adaptive title `Your Sleep Evaluation Summary`
  - care pathway rendered
  - `Your Next Steps` section rendered
  - pre-study report remained patient-facing and did not render the clinician report block
- Result: **PASS**

### Not Covered In This Local Pass
- Save/archive/restore against a live AWS-backed patient record
- Intake-link generation and patient intake submission
- Persistent field-provenance display from real saved records
- Persistent report snapshot save/history from real saved records
- PDF pagination / clipping review
- MFA / RBAC / CORS / deployed infrastructure validation

### Next Testing Step
- Use a deployed environment with real AWS config and run the expanded regression matrix sections that depend on persistence, auth, intake tokens, archived-record lifecycle, provenance, and report snapshots.

---

## April 1, 2026 AWS Staging Validation

### Environment
- AWS account: `420551259537`
- Region: `us-east-2`
- Staging stack: `osa-phenotyper-capital-ent-stg-20260401b`
- API: `https://sgwvp3545f.execute-api.us-east-2.amazonaws.com`
- User pool: `us-east-2_ohn6HsKt7`

### Deployment Findings Fixed During Validation
- Fixed a CloudFormation race where `AdminUserGroupAttachment` could run before `AdminUser` existed.
- Removed the unsupported direct WAF association to the API Gateway HTTP API stage so the stack could deploy.
- Fixed clinician Lambda RBAC handling so staging auth works when API Gateway serializes or omits `cognito:groups` in non-obvious formats.

### Auth & Session Validation
- First login required password change and MFA setup.
- Software-token MFA enrollment completed successfully.
- Cognito user state after setup: `CONFIRMED`, preferred MFA `SOFTWARE_TOKEN_MFA`.
- Result: **PASS**

### AWS-Backed Persistence Smoke Checks
- `GET /patients` with the staging browser `idToken` returned `200`.
- `POST /patients` with the staging browser `idToken` returned `201`.
- `POST /patients` with the staging browser `accessToken` also returned `201` after the RBAC fixes.
- `POST /intake-tokens` returned `201` and produced a valid token + expiry timestamp.
- `GET /intake/{token}` returned `200` on the public intake route.
- `PUT /patients/{id}` with `reportSnapshot` returned `200`, incremented `version`, and persisted exactly one snapshot.
- `DELETE /patients/{id}` archived the patient and removed it from the default active list.
- `GET /patients?includeArchived=true` returned the archived patient to the admin-scoped list.
- `PUT /patients/{id}` with `{ restore: true }` restored the archived chart to the active list.
- Result: **PASS**

### Follow-Up Fix Found During Live Intake Testing
- The first fully valid staging intake submission surfaced a real server bug: the intake Lambda returned `500` with CloudWatch `ValidationException` once the transactional merge path executed.
- Root cause: the patient-side `TransactWriteItems` update expression in `infrastructure/lambda/intake.mjs` was receiving unused `:used` / `:active` expression values that only belonged to the token-side update.
- Remediation: removed the unused values, packaged the Lambda, and redeployed `osa-intake-api-capital-ent-stg-20260401b` directly to staging.
- Result after redeploy: **PASS**

### Remaining Staging Checks Completed
- Live intake submit with canonical `weightLossReadiness = ready` returned `200`.
- Conflict staging behaved correctly: clinician `formData.cpapCurrent` stayed `on`, while conflicting intake values landed in `intakePendingOverrides` as `cpapCurrent = ""` and `age = 38`.
- Intake provenance behaved correctly: `cpapRetry` and `weightLossReadiness` were applied with `patient-intake` provenance, while `cpapCurrent` remained `clinician`.
- Stale-save protection behaved correctly: first save returned `200`, second save with the stale `version` returned `409` and the reload-before-saving message.
- CORS behaved correctly on staging:
  - Allowed origin `http://127.0.0.1:3000` received `access-control-allow-origin` on both GET and OPTIONS.
  - Disallowed origin `https://evil.example` received no permissive ACAO header on GET or OPTIONS.
- API Gateway access logs were present in `/aws/apigateway/osa-phenotyper-capital-ent-stg-20260401b`, including the intentional `400`, the pre-fix `500`, and the post-fix `200`.
- CloudTrail audit objects were present in `s3://osa-audit-logs-capital-ent-stg-20260401b-420551259537/...`, and sampled records included DynamoDB `PutItem`, `UpdateItem`, `GetItem`, `Scan`, and `TransactWriteItems` events from both patient and intake Lambdas.
- Patient PDF export from the staging-backed UI saved `/Users/raymondbrown/Downloads/Sleep_Report_PDF_Export_QA_2026-04-02.pdf`.
- PDF verification:
  - producer `jsPDF 2.5.1`
  - `5` pages
  - `2868864` bytes
  - letter-sized pages

### Remaining Gaps After This Staging Pass
- Browser automation for the patient-list archive/restore buttons remains flaky because Chrome + AppleScript dialog handling can stall the scripted UI path. During manual browser testing, that path also exposed a frontend scoping bug (`clearCurrentPatient is not defined`) in the archive reset helper; the scope fix is now patched locally in `index.html`, but the archive button still needs one final browser re-check after reload.
- Full visual review of PDF pagination/clipping needed a fresh re-export after the latest local patch. Screenshot QA on April 1, 2026 showed real break defects in the prior export build:
  - a phenotype section starting with clipped fragments at the top of page 2
  - treatment paragraphs splitting across pages mid-rec-item
  - `Your First 30 Days` and `What If…?` headers orphaning from their checklist/card content
- Local remediation is now patched in `js/pdf-export.js` and `js/patientReport.js`:
  - patient-report pages are built as separate DOM shells instead of relying on whole-report canvas slicing
  - screen-only `.patient-report` margin/padding is reset during PDF measurement so the measured layout matches the rendered layout
  - a fit buffer and stronger semantic grouping were added for phenotype, checklist, and what-if blocks
- Re-check result on April 1, 2026: **PASS**
  - Generated a fresh patient PDF through the live export code path and captured the artifact at `tests/artifacts/Sleep_Report_PDF_Pagination_QA_Fix2_2026-04-02.pdf`.
  - Verified rendered pages from that new artifact:
    - page 2 no longer starts with clipped carry-over fragments
    - treatment recommendations no longer split mid-rec-item at the prior failing boundary
    - `Your First 30 Days` starts with its heading, intro, and first checklist group together
    - `What If…?` starts with its heading and scenario cards together on the final page

---

**Run date:** March 19, 2026
**App version:** commit cca8d97 (HB revamp + T90)

---

## Group 1: Severity Spectrum

### Test 1: Pre-study Snorer
**Report Title:** Your Sleep Evaluation Summary
**AHI:** n/a (no study)
**Sections:** Why We're Recommending a Sleep Study, Treatment Plan, First 30 Days, What If
**Phenotypes:** none
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** Nasal Treatment, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, saline rinses, nasal follow-up, 4-6wk follow-up
**What-If:** What if your nasal obstruction were treated?
**Why This Matters:** no
**⚠️ ISSUES:** Pre-study patient getting CPAP/MAD/surgery recs even though no OSA diagnosis yet. Should only show sleep study recommendation. Treatment Plan section should not appear for pre-study patients without a diagnosis.

---

### Test 2: Pre-study Insomniac
**Report Title:** Your Sleep Evaluation Summary
**AHI:** n/a
**Sections:** Why We're Recommending a Sleep Study, Treatment Plan, First 30 Days
**Phenotypes:** none
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CBT-I, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, CBT-I referral, 4-6wk follow-up
**What-If:** none
**Why This Matters:** no
**⚠️ ISSUES:** Same issue as Test 1 — CPAP/MAD/surgery recs appearing without OSA diagnosis. CBT-I is appropriate here. CPAP and surgery are not.

---

### Test 3: Normal AHI (pAHI 3)
**Report Title:** Your Sleep Apnea Report
**AHI:** 3 (marker displayed)
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days
**Phenotypes:** REM-Predominant OSA
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Oral Appliance Therapy, Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, 4-6wk follow-up
**What-If:** none
**Why This Matters:** no
**⚠️ ISSUES:** AHI 3 is normal — should NOT have "Your Sleep Apnea Report" title or treatment recs. REM-predominant phenotype triggering on AHI 3 (REM 5 / NREM 2 = ratio 2.5) is technically correct by ratio but clinically meaningless at this severity. Should be suppressed when AHI < 5.

---

### Test 4: Mild Positional (pAHI 8)
**Report Title:** Your Sleep Apnea Report
**AHI:** 8
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If
**Phenotypes:** Positional OSA
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** Positional Therapy, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, positional device, position tracking, 4-6wk follow-up
**What-If:** What if you lost weight? (AHI 8→6), What if you slept on your side? (sup 18 vs non-sup 4)
**Why This Matters:** no
**✅ Notes:** Positional detected correctly. Weight loss what-if showing even though BMI is 28 (overweight, not obese) — appropriate since threshold is BMI ≥ 27.

---

### Test 5: Moderate Classic (pAHI 22)
**Report Title:** Your Sleep Apnea Report
**AHI:** 22
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, weight goal, dietitian referral, 4-6wk follow-up
**What-If:** What if you lost weight? (AHI 22→15)
**Why This Matters:** no
**✅ Notes:** HB area 35 triggers HB phenotype (moderate tier). Weight management correctly recommended for BMI 32.

---

### Test 6: Severe Obese (pAHI 55)
**Report Title:** Your Sleep Apnea Report
**AHI:** 55
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If, Why This Matters
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden, Elevated Delta Heart Rate
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**What-If:** What if you lost weight? (AHI 55→39)
**Why This Matters:** yes ✅
**✅ Notes:** Why This Matters correctly fires (AHI ≥30 + HB >60 + T90 >20%). Delta HR phenotype triggers at ΔHR 10.

---

### Test 7: Very Severe Morbid (pAHI 85)
**Report Title:** Your Sleep Apnea Report
**AHI:** 85
**Sections:** Understanding Your Results, What's Contributing, Treatment Plan, First 30 Days, What If, Why This Matters
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden, Elevated Delta Heart Rate
**CPAP Context:** none
**COMISA:** no
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**What-If:** What if you lost weight? (AHI 85→59)
**Why This Matters:** yes ✅
**✅ Notes:** All severe metrics firing correctly. HB 120, T90 40%, ODI 75, nadir 68 — all in severe range.

---

## Group 2: CPAP History Variants

### Test 8: Current CPAP User (pAHI 30)
**Report Title:** Your Sleep Apnea Report
**AHI:** 30
**CPAP Context:** "Building on your current CPAP therapy." ✅
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Why This Matters:** yes (AHI 30 + HB 40 moderate)
**✅ Notes:** CPAP context box correctly shows "building on" message.

---

### Test 9: CPAP Failed COMISA (pAHI 24)
**Report Title:** Your Sleep Apnea Report
**AHI:** 24
**CPAP Context:** "We hear you on CPAP." ✅
**COMISA:** yes ✅
**Phenotypes:** Low Arousal Threshold, High Hypoxic Burden, Nasal-Resistance Contributor
**Recs (Start Now):** CBT-I (first! ✅), Nasal Treatment, Inspire
**Recs (Discuss):** CPAP Therapy, Oral Appliance Therapy, Airway Surgery
**Checklist:** CBT-I first ✅, sleep dentist, saline rinses, nasal follow-up, CPAP gentle mention last ✅, follow-up
**What-If:** Weight loss, nasal treatment
**Why This Matters:** no
**✅ Notes:** COMISA handling is excellent. CBT-I prioritized, CPAP acknowledged but de-emphasized.
**⚠️ NOTE:** HB phenotype triggered with ODI 20 (moderate tier) even though HB area not provided. This is correct behavior.

---

### Test 10: CPAP Failed Will Retry (pAHI 28)
**Report Title:** Your Sleep Apnea Report
**AHI:** 28
**CPAP Context:** "Giving CPAP another try." ✅
**Recs (Start Now):** CPAP Therapy, Oral Appliance Therapy, Airway Surgery
**Checklist:** CPAP re-fitting ✅ (not generic setup), mask desensitization, sleep dentist, follow-up
**✅ Notes:** Correctly shows retry messaging and re-fitting checklist item instead of generic "schedule CPAP setup."

---

### Test 11: Prefers to Avoid CPAP (pAHI 12)
**Report Title:** Your Sleep Apnea Report
**AHI:** 12
**CPAP Context:** none
**Phenotypes:** Positional OSA
**Recs (Start Now):** Positional Therapy, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CPAP setup, mask desensitization, CPAP 4hr goal...
**⚠️ ISSUES:** Patient prefers to avoid CPAP, but report doesn't acknowledge this preference. CPAP is still listed in Start Now with standard checklist items. Should have similar handling to CPAP-failed patients — acknowledge the preference and lead with alternatives.

---

## Group 3: COMISA & Insomnia Variants

### Test 12: Pure Insomnia + Mild OSA (pAHI 7, ISI 22)
**Report Title:** Your Sleep Apnea Report
**AHI:** 7
**Phenotypes:** Low Arousal Threshold, REM-Predominant OSA
**COMISA:** yes ✅ (ISI 22 + AHI ≥5)
**Recs (Start Now):** CBT-I (first! ✅), CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** CBT-I first ✅, CPAP setup, mask desensitization, CPAP 4hr goal, sleep dentist, follow-up
**✅ Notes:** COMISA correctly detected. CBT-I prioritized.

---

### Test 13: Sleepy COMISA (pAHI 24, ESS 17, ISI 19)
**Report Title:** Your Sleep Apnea Report
**AHI:** 24
**COMISA:** yes ✅
**Phenotypes:** Low Arousal Threshold, High Hypoxic Burden, Nasal-Resistance Contributor
**Recs (Start Now):** CBT-I (first! ✅), Nasal Treatment, CPAP Therapy
**Recs (Discuss):** Oral Appliance Therapy, Airway Surgery
**✅ Notes:** Sleepy COMISA handled correctly — CBT-I first despite high ESS.

---

### Test 14: Pre-study Severe Insomnia (ISI 24, no study)
**Report Title:** Your Sleep Evaluation Summary
**AHI:** n/a
**Recs (Start Now):** CBT-I, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**⚠️ ISSUES:** Same pre-study issue as Tests 1-2. CBT-I is appropriate. CPAP/MAD/surgery should not appear without OSA diagnosis.

---

## Group 4: Anatomy & Surgery Scenarios

### Test 15: Large Tonsils Thin (Tonsils 4, FTP I, BMI 24)
**Report Title:** Your Sleep Apnea Report
**AHI:** 18
**Phenotypes:** none
**Recs (Start Now):** Tonsil Surgery (Tonsillectomy) ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**✅ Notes:** Tonsillectomy correctly appears as first rec for thin patient with grade 4 tonsils and FTP I.

---

### Test 16: Large Tonsils Obese (Tonsils 3, BMI 34)
**Report Title:** Your Sleep Apnea Report
**AHI:** 35
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Tonsil Surgery, Oral Appliance Therapy
**Why This Matters:** yes ✅
**✅ Notes:** Tonsillectomy still present but in "Discuss" — appropriate for obese patient where tonsillectomy alone less likely curative.

---

### Test 17: Prior UPPP (pAHI 25)
**Report Title:** Your Sleep Apnea Report
**AHI:** 25
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs (Start Now):** CPAP Therapy, Weight Management, Airway Surgery
**Recs (Discuss):** Oral Appliance Therapy
**✅ Notes:** Prior UPPP acknowledged in clinician report. Patient report doesn't specifically mention prior surgery history — may want to add context.

---

### Test 18: Prior MAD Failed (pAHI 15)
**Report Title:** Your Sleep Apnea Report
**AHI:** 15
**Phenotypes:** Positional OSA
**Recs (Start Now):** Positional Therapy, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**⚠️ ISSUES:** Oral Appliance Therapy still recommended even though patient already tried and failed MAD. Report should acknowledge prior MAD and adjust accordingly.

---

## Group 5: Phenotype-Specific

### Test 19: REM-Predominant Mild (pAHI 12, REM 28/NREM 8)
**Report Title:** Your Sleep Apnea Report
**AHI:** 12
**Phenotypes:** REM-Predominant OSA ✅
**Recs:** CPAP, Oral Appliance, Airway Surgery
**✅ Notes:** REM-predominant correctly detected (ratio 3.5, NREM < 15).

---

### Test 20: High Loop Gain (CSR 15%, pAHIc 12)
**Report Title:** Your Sleep Apnea Report
**AHI:** 20
**Phenotypes:** High Loop Gain ✅
**Recs (Start Now):** Alternative PAP Therapy ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**✅ Notes:** High Loop Gain detected. Alternative PAP (BiPAP/ASV) correctly prioritized over standard CPAP.

---

### Test 21: High Hypoxic Burden (HB 65, ODI 35, nadir 72, T90 22%)
**Report Title:** Your Sleep Apnea Report
**AHI:** 20
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden ✅
**Recs:** CPAP, Weight Management, Airway Surgery, Oral Appliance
**Why This Matters:** yes ✅
**✅ Notes:** HB in severe range (>60). Why This Matters fires correctly. Multiple severe-tier metrics (HB >60, ODI >50 — actually 35, so no, T90 >20% yes, nadir <75 yes).

---

### Test 22: Nasal + Positional Combo (NOSE 60, sup 32/non-sup 6)
**Report Title:** Your Sleep Apnea Report
**AHI:** 16
**Phenotypes:** Positional OSA ✅, Nasal-Resistance Contributor ✅
**Recs (Start Now):** Positional Therapy, Nasal Treatment, CPAP Therapy
**Recs (Discuss):** Oral Appliance Therapy, Airway Surgery
**What-If:** Weight loss, side sleeping (sup 32 vs non-sup 6), nasal treatment
**✅ Notes:** Both phenotypes correctly detected. All three what-if scenarios present. Comprehensive combo handling.

---

### Test 23: Delta HR + CVD (ΔHR 14, CVD yes)
**Report Title:** Your Sleep Apnea Report
**AHI:** 25
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden, Elevated Delta Heart Rate ✅
**Recs:** CPAP, Weight Management, Airway Surgery, Oral Appliance
**✅ Notes:** Delta HR phenotype triggers at 14 (≥10 threshold). CVD present as confidence modifier.

---

## Group 6: Inspire Candidacy

### Test 24: Good Inspire Candidate (CPAP failed, BMI 30, pAHI 28)
**Report Title:** Your Sleep Apnea Report
**AHI:** 28
**CPAP Context:** "We hear you on CPAP." ✅
**Phenotypes:** High Hypoxic Burden
**Recs (Start Now):** Inspire ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**Checklist:** sleep dentist, CPAP gentle mention, follow-up
**✅ Notes:** Inspire correctly prioritized for CPAP-failed patient with interest. No Inspire checklist item though.
**⚠️ NOTE:** Missing "Schedule a formal Inspire candidacy evaluation" in checklist — HNS tag may not be in recTags.

---

### Test 25: Poor Inspire BMI >40 (BMI 42, pAHI 72)
**Report Title:** Your Sleep Apnea Report
**AHI:** 72
**CPAP Context:** "We hear you on CPAP." ✅
**Phenotypes:** High Anatomical Contribution, Positional OSA, High Hypoxic Burden, Elevated Delta Heart Rate
**Recs (Start Now):** Weight Management, Positional Therapy, CPAP Therapy
**Recs (Discuss):** Oral Appliance Therapy, Airway Surgery
**Why This Matters:** yes ✅
**✅ Notes:** Inspire correctly NOT recommended (BMI >40 exclusion). Weight management prioritized.

---

### Test 26: Inspire-Curious No CPAP Trial (pAHI 20)
**Report Title:** Your Sleep Apnea Report
**AHI:** 20
**Recs (Start Now):** Inspire ✅, CPAP Therapy, Oral Appliance Therapy
**Recs (Discuss):** Airway Surgery
**✅ Notes:** Inspire appears because patient expressed interest (prefInspire). CPAP still recommended alongside.

---

## Group 7: Borderline Values

### Test 27: BMI 26, Mild Insomnia (ISI 12, pAHI 10)
**Report Title:** Your Sleep Apnea Report
**AHI:** 10
**Phenotypes:** none
**Recs:** CPAP, Oral Appliance, Airway Surgery
**No weight rec ✅** (BMI 26 < 30 threshold)
**No what-if weight section** — actually BMI 26 < 27 what-if threshold, so no what-if either ✅
**COMISA:** no ✅ (ISI 12 < 15)
**✅ Notes:** Borderline values handled correctly. No inappropriate weight or insomnia recommendations.

---

### Test 28: BMI 29.9 (pAHI 18)
**Report Title:** Your Sleep Apnea Report
**AHI:** 18
**Recs:** CPAP, Oral Appliance, Airway Surgery
**No weight rec ✅** (BMI 29.9 < 30)
**What-If:** What if you lost weight? (AHI 18→13) ✅ (BMI ≥27 triggers what-if)
**✅ Notes:** Correctly no weight management rec but what-if still shows since BMI ≥ 27.

---

### Test 29: AHI Exactly 5
**Report Title:** Your Sleep Apnea Report
**AHI:** 5
**Phenotypes:** Positional OSA
**Recs:** Positional Therapy, CPAP, Oral Appliance, Airway Surgery
**✅ Notes:** AHI 5 correctly classified as mild (≥5). Positional detected (sup 8 / non-sup 3, ratio 2.67).

---

### Test 30: AHI Exactly 15
**Report Title:** Your Sleep Apnea Report
**AHI:** 15
**Phenotypes:** none
**Recs:** CPAP, Oral Appliance, Airway Surgery
**What-If:** Weight loss (AHI 15→11)
**✅ Notes:** AHI 15 correctly classified as moderate (≥15).

---

### Test 31: AHI Exactly 30
**Report Title:** Your Sleep Apnea Report
**AHI:** 30
**Phenotypes:** High Anatomical Contribution, High Hypoxic Burden
**Recs:** CPAP, Weight Management, Airway Surgery, Oral Appliance
**Why This Matters:** yes ✅
**✅ Notes:** AHI 30 correctly classified as severe (≥30). Why This Matters fires.

---

## Summary of Issues Found

### Critical
1. **Tests 1, 2, 14: Pre-study patients get treatment recs** — Patients without a sleep study are receiving CPAP, MAD, and surgery recommendations. The Treatment Plan and First 30 Days sections should not appear (or should only show "Get a sleep study" and CBT-I if insomnia present).

2. **Test 3: Normal AHI gets treatment recs** — AHI of 3 should not generate CPAP/MAD/surgery recommendations or phenotypes. REM-predominant triggers on clinically meaningless ratio at AHI < 5.

### Moderate
3. **Test 11: Prefers-to-avoid-CPAP not acknowledged** — Patient who prefers to avoid CPAP doesn't get the same contextual handling as CPAP-failed patients. Should have a context box and alternative prioritization.

4. **Test 18: Prior MAD failure not reflected** — Oral Appliance Therapy still recommended even though the patient already tried and couldn't tolerate it.

5. **Test 24: Missing Inspire checklist item** — Good Inspire candidate doesn't get "Schedule Inspire candidacy evaluation" in checklist.

### Minor
6. **Tests 1, 2, 14: Pre-study patients could benefit from clearer "next step is a sleep study" framing** rather than treatment plans.

7. **Some pre-study edge cases** around when treatment sections should/shouldn't render need tightening.

---

## April 2, 2026 Follow-Up Targeted Checks

- `node --check js/app.js` ✅
- `node --check js/patientReport.js` ✅
- `node --check infrastructure/lambda/index.mjs` ✅
- Inline script extraction + `node --check` for `index.html` ✅

### Group 15 Spot Checks

### Test 78: Clinician insufficient-data warning
**Status:** targeted code-path verification complete
**Result:** `js/app.js` now emits insufficient-data domains for:
- missing oxygen metrics
- incomplete anatomy documentation (BMI / tonsils / FTP)
- incomplete HNS workup (missing DISE and/or Ji staging inputs)

### Test 79: Patient-facing data limitations callout
**Status:** targeted render probe complete
**Result:** generated patient-report HTML rendered `What may still be refined` only when `insufficientDataDomains` were present ✅

### Test 80: Weight-readiness personalization
**Status:** targeted render probes complete
**Ready now case:** patient-report HTML included `feel ready to work on weight management now` ✅
**Considering case:** patient-report HTML included `you are considering weight management` ✅
**BMI guardrail:** BMI 29 render did **not** include `GLP-1 therapies` ✅

### Open From This Follow-Up
- Compact visit-audit payload shape was later confirmed through live hosted `GET /patients/:id` inspection on staging patient `9e4ba353-ba4f-464c-8bf1-af765748451a`, which returned compact visit entries plus the expected provenance/review metadata.

### Test 82: Packaged deploy path
**Status:** static verification complete
**Result:** `infrastructure/template.yaml` now packages the shared `infrastructure/lambda/` directory for both functions, and `infrastructure/deploy.sh` now uses `aws cloudformation package` instead of post-deploy `aws lambda update-function-code` patching ✅
**Verification:** `bash -n infrastructure/deploy.sh` passed, and repo grep confirmed no remaining `ZipFile` placeholder Lambdas or `update-function-code` deploy step.
**Live follow-up:** real staging deploy confirmed the packaged-template path works end to end after switching away from single-file Lambda artifacts, which had failed with `Could not unzip uploaded file` during the first live attempt ✅

### Test 83: Shared pathway/UARS helper
**Status:** executable harness coverage complete
**Result:** browser harness assertions now verify shared UARS detection and shared care-pathway generation through `js/report-shared.js` ✅
**Verification:** local headless Chrome run of `tests/tests.html` returned `118 passed / 0 failed`.

### Test 84: Insufficient-data recommendation guardrails
**Status:** local + live browser verification complete
**Result:** `js/app.js` now converts incomplete oxygen/anatomy/HNS decision domains into prerequisite workup steps (`OXYGEN-WORKUP`, `ANATOMY-WORKUP`, `HNS-WORKUP`) and suppresses premature HNS / anatomy-matched treatment output in the displayed plan ✅
**Verification:**
- `node --check js/app.js` passed
- static source verification confirms `applyInsufficientDataGuardrails()` and the new workup tags are present in `js/app.js`
- local browser harness assertions confirm the patient-report layer renders patient-friendly explanations and checklist steps for all three workup tags
- localhost workflow smoke suite now drives a real form resubmit and asserts `ANATOMY-WORKUP`, `HNS-WORKUP`, and `OXYGEN-WORKUP` through `OSAReportState`
- fresh hosted CloudFront browser verification on patient `CloudFront QA, Staging` confirmed that, after a full page reload and re-login, a live resubmit with:
  - incomplete airway exam (`tonsils`, `ftp` blank)
  - Inspire interest enabled
  - only one oxygen metric remaining (`nadir = 82`, ODI/T90/HB blank)
  rendered all three patient-facing workup substitutions:
  - `Complete Airway Exam Before Finalizing Anatomy-Based Treatments`
  - `Complete the Inspire Evaluation First`
  - `Complete Oxygen-Risk Review`
**Finding:** none. The earlier hosted oxygen miss was a stale-tab artifact rather than a code-path failure.

### Test 85: Prefix-name search fast path
**Status:** static + live hosted verification complete
**Result:** patient create/update now persist `nameSearchBucket`, `infrastructure/template.yaml` now defines `name-prefix-index`, `searchPatients()` now queries that index before falling back to a broad scan, and `infrastructure/backfill-name-search-bucket.sh` provides an operator path to migrate older rows ✅
**Verification:**
- `node --check infrastructure/lambda/index.mjs` passed
- `bash -n infrastructure/backfill-name-search-bucket.sh` passed
- static source verification confirms the new `name-prefix-index` GSI and prefix query path
- later live hosted verification in Test 121 confirmed `GET /patients/search?q=CloudFront%20QA%2C%20Staging` returned the expected migrated staging chart after backfill

### Test 86: CloudFront app front door
**Status:** live staging verification complete
**Result:** `infrastructure/template.yaml` now provisions a private app bucket, CloudFront origin access control, CloudFront distribution, and API path behaviors for `/patients*`, `/intake-tokens*`, and `/intake/*` ✅
**Verification:**
- static source verification confirms `WebAppBucket`, `WebAppOriginAccessControl`, `WebAppDistribution`, and `WebAppApiOriginRequestPolicy`
- `aws cloudformation validate-template --template-body file://infrastructure/template.yaml --region us-east-2` passed
- live staging deploy created CloudFront distribution `E1D4NMECBXWVX3` with app URL `https://dk259m1syu2bu.cloudfront.net`
- `curl -sIL https://dk259m1syu2bu.cloudfront.net` returned `200`
- `curl -sL https://dk259m1syu2bu.cloudfront.net | rg -o "<title>[^<]+</title>" -m 1` returned `OSA Phenotyper • Capital ENT`
- `curl -sL https://dk259m1syu2bu.cloudfront.net/patients` returned `{"message":"Unauthorized"}`, confirming the API path is routed through CloudFront to API Gateway
- `curl -sL https://dk259m1syu2bu.cloudfront.net/js/aws-config.js` confirmed runtime `apiUrl` is the CloudFront URL
- `curl -sL https://dk259m1syu2bu.cloudfront.net/intake.html` confirmed patient intake `data-api-url` points to CloudFront ✅

### Test 87: CloudFront-scoped WAF deployment
**Status:** live staging verification complete
**Result:** `infrastructure/deploy.sh` now creates or updates a CloudFront-scope WAF in `us-east-1`, scopes the rules down to API paths, passes the resulting ARN into CloudFormation, uploads the static app to S3, and invalidates the CloudFront distribution ✅
**Verification:**
- `bash -n infrastructure/deploy.sh` passed
- static source verification confirms `ensure_cloudfront_waf()`, scoped `/patients` + `/intake-tokens` + `/intake/` WAF rules, stack parameter wiring, `aws s3 sync`, and CloudFront invalidation
- `aws cloudformation validate-template --template-body file://infrastructure/template.yaml --region us-east-2` passed
- real staging deploy updated the CloudFront-scope WAF in `us-east-1`, associated it to the new distribution, published the static app, and completed CloudFront invalidation ✅

### Test 88: CloudFront deploy-path regression fixes
**Status:** live staging verification complete
**Result:** the first real CloudFront staging deploy exposed four deploy-path bugs, and all were remediated in source before the final successful deploy ✅
**Fixes applied:**
- artifact bucket naming was shortened to satisfy S3 bucket length rules
- WAF CLI calls now use `--cli-binary-format raw-in-base64-out`, and the WAF description string was simplified to satisfy WAF validation
- the explicit app-bucket name was removed to avoid retained-bucket collisions during rollback/retry cycles
- API paths now use AWS managed CloudFront policy `CachingDisabled` instead of the rejected custom zero-TTL cache policy
- Lambda packaging now zips the shared `infrastructure/lambda/` directory instead of uploading raw `.mjs` files
**Verification:**
- `aws cloudformation package --template-file infrastructure/template.yaml --s3-bucket osa-artifacts-capital-ent-stg-420551259537-us-east-2 --output-template-file /tmp/osa-phenotyper-package-check.yaml --region us-east-2` passed
- final live deploy completed with stack status `UPDATE_COMPLETE`
- final deploy outputs:
  - app URL `https://dk259m1syu2bu.cloudfront.net`
  - distribution `E1D4NMECBXWVX3`
  - site bucket `osa-phenotyper-capital-ent-stg-202604-webappbucket-knm1r1oehkzt`

### Test 89: Prefix-search backfill on upgraded staging data
**Status:** live staging verification complete
**Result:** existing staging rows were missing `nameSearchBucket`, and the operator backfill successfully populated the new prefix-search metadata on all six rows ✅
**Verification:**
- pre-backfill direct scan showed existing rows with `nameLower` but no `nameSearchBucket`
- `./infrastructure/backfill-name-search-bucket.sh osa-patients-capital-ent-stg-20260401b us-east-2` completed with `Updated rows: 6`
- post-backfill direct scan confirmed `nameSearchBucket = "s"` on all six existing staging rows

### Test 90: Hosted clinician auth onboarding
**Status:** live browser verification complete
**Result:** CloudFront-hosted clinician auth passed ✅
**Verification:**
- created staging-only admin test user `staging.ui.test.20260402@example.com`
- hosted login advanced through `NEW_PASSWORD_REQUIRED`
- hosted login then advanced through `MFA_SETUP`
- manual setup key was rendered in the browser, TOTP verification succeeded, and the authenticated app shell loaded with `userEmail = staging.ui.test.20260402@example.com`

### Test 91: Hosted patient load + re-analyze
**Status:** live browser verification complete
**Result:** passed after fix ✅
**Verification:**
- hosted save succeeded for patient `CloudFront QA, Staging` / MRN `CF-STG-20260402`
- hosted patient list showed the saved chart and allowed it to be reloaded
- initial hosted regression was traced to `loadPatient()` setting chart-identity fields before `form.reset()`
- after moving reset/populate ahead of those fields and redeploying, hosted reload repopulated `patientName`, `patientDob`, `patientMrn`, and the clinical fields together
- hosted re-analysis then ran without manual re-entry
**Finding:** none.

### Test 92: Hosted snapshot save persistence
**Status:** live browser verification complete
**Result:** passed after edge-rule fix ✅
**Verification:**
- hosted patient-report overlay opened successfully for `CloudFront QA, Staging`
- initial failure was narrowed to CloudFront WAF managed body inspection on legitimate patient-report HTML
- direct authenticated snapshot-sized `PUT` verified the backend update path itself was healthy once the edge block was removed
- after downgrading both `SizeRestrictions_BODY` and `CrossSiteScripting_BODY` to count and redeploying, the real hosted `Save Snapshot` button succeeded
- direct DynamoDB check on patient `9e4ba353-ba4f-464c-8bf1-af765748451a` after the hosted click showed `reportSnapshotCount = 2` and `version = 7`
**Finding:** none.

### Test 93: Hosted intake thank-you flow
**Status:** live browser verification complete
**Result:** passed ✅
**Verification:**
- valid staging token endpoint check passed through CloudFront: `GET /intake/<token>` returned `{\"valid\":true,\"firstName\":\"Staging\",...}`
- hosted intake page loaded correctly when opened with the expected `?t=` query parameter and rendered the active form with greeting name `Staging`
- demographics and all required ESS / ISI / NOSE / nasal / snoring / weight-interest inputs were successfully filled in the hosted form
- backend transaction succeeded:
  - token status changed to `used`
  - `usedAt` was populated
  - patient `intakeStatus` became `review-needed`
  - staging patient row received `formData.ess = 8`, `formData.isi = 7`, `formData.noseScore = 50`, `formData.weightLossReadiness = ready`
  - `intakePendingOverrides.bmi = 31.6` was staged as expected
- instrumented rerun confirmed the page transitions into `stateThankYou` and strips the token from the URL after success
**Finding:** none. The earlier “stuck on submitting” read was a false negative caused by observing the hidden submit button state instead of the active state screen.

### Test 94: Hosted PDF export gesture
**Status:** live browser verification complete
**Result:** passed ✅
**Verification:**
- hosted patient-report preview opened successfully from the CloudFront app
- synthetic DOM clicks on `Download PDF` did not produce a file, which appears to be expected because Chrome can block non-user-gesture downloads
- final verification used a native OS-level mouse click on the hosted `Download PDF` button in the live CloudFront report overlay
- Chrome saved a fresh duplicate-named artifact at `/Users/raymondbrown/Downloads/Sleep_Report_CloudFront_QA_Staging_2026-04-02 (1).pdf`
- `pdfinfo` on that artifact confirmed:
  - producer `jsPDF 2.5.1`
  - creation date `Thu Apr 2 09:57:16 2026 CDT`
  - `4` pages
  - `2243993` bytes
  - letter-sized pages
**Finding:** none.

### Test 95: Hosted snapshot WAF body-size allowance
**Status:** live browser + direct API verification complete
**Result:** passed ✅
**Verification:**
- authenticated `PUT /patients/:id` with a snapshot-sized HTML body now passes through CloudFront instead of returning a WAF `403`
- real hosted snapshot-save UI now persists through the same edge path
**Finding:** none.

### Test 121: Hosted exact-name search fast path
**Status:** live hosted API verification complete
**Result:** passed ✅
**Verification:**
- extracted a real CloudFront-hosted clinician `idToken` from the authenticated browser session for staging user `staging.qa.20260402@example.com`
- `GET https://dk259m1syu2bu.cloudfront.net/patients/search?q=CloudFront%20QA%2C%20Staging` returned the expected single chart:
  - `patientId = 9e4ba353-ba4f-464c-8bf1-af765748451a`
  - `mrn = CF-STG-20260402`
  - `intakeStatus = review-needed`
  - `intakePendingFieldCount = 1`
  - `reportSnapshotCount = 2`
- direct `GET /patients/9e4ba353-ba4f-464c-8bf1-af765748451a` confirmed the same row also carries migrated search metadata (`nameSearchBucket`) and the compact visit/provenance payload expected after the audit refactors
**Finding:** none. This closes the remaining live proof for the exact-name hosted search path on upgraded staging data.

### Test 122: Hosted intake-review completion
**Status:** live hosted API verification complete
**Result:** passed after fix ✅
**Verification:**
- authenticated `PUT https://dk259m1syu2bu.cloudfront.net/patients/9e4ba353-ba4f-464c-8bf1-af765748451a` with body:
  - `{"version":7,"intakeReview":{"note":"Staging validation keep-chart decision","resolutions":[{"field":"bmi","action":"keep-chart"}]}}`
- initial live request returned `500 {"error":"Internal server error"}`
- CloudWatch tail of `/aws/lambda/osa-patients-api-capital-ent-stg-20260401b` showed a DynamoDB `ValidationException`
- source fix in `infrastructure/lambda/index.mjs` stopped sending `:reviewNeeded` in `ExpressionAttributeValues` when the final pending field is resolved and the record is transitioning to `reviewed`
- after redeploy, the same hosted request succeeded and returned:
  - `intakeStatus = reviewed`
  - `intakePendingFieldCount = 0`
  - `version = 8`
  - appended `intakeReviewHistory`
  - appended `fieldProvenanceHistory.bmi` entry with `source = clinician-review` and `resolution = kept-chart`
  - appended compact visit entry `action = Intake review completed`
**Finding:** fixed. The hosted intake-review path now completes cleanly when the last pending field is resolved instead of failing on an unused DynamoDB expression value.

### Test 130: Moderate oxygen-language calibration
**Status:** local executable regression + staging synthetic-chart review complete
**Result:** passed ✅
**Verification:**
- reviewed published synthetic-patient outputs for moderate OSA and severe OSA staging charts to compare wording against the actual oxygen profile
- updated Section B nadir wording so moderate-range nadirs now read as `lower than we want to see during sleep and one reason treatment still matters`
- updated the `High Hypoxic Burden` phenotype explanation to use `meaningful drops in blood oxygen` and follow-up language that stays probabilistic rather than promising normalization
- executable regression now checks that moderate nadir wording avoids the old `can affect your heart and overall health over time` phrasing and that the phenotype explanation avoids `fall well below normal`
**Finding:** fixed. The patient-facing oxygen narrative is now better calibrated for moderate synthetic cases without removing the seriousness of clearly high-risk patterns.

### Test 131: Treatment-plan workup separation
**Status:** local executable regression + staging synthetic-chart review complete
**Result:** passed ✅
**Verification:**
- reviewed published treatment plans for synthetic moderate and severe OSA charts and confirmed workup tags such as DISE / Inspire / endotype review were crowding out first-line therapy in `Start Now`
- updated `js/patientReport.js` to classify prerequisite tags into a dedicated `Complete Before Finalizing Other Options` group
- executable regression now checks that `Start Now` appears before the new workup bucket and that therapies such as CPAP/CBT-I render before workup-only items
**Finding:** fixed. Patient plans now lead with near-term treatment actions while still keeping prerequisite workup steps visible and understandable.

### Test 139: Second five-scenario safety and PDF matrix
**Status:** local executable engine, content, and visual PDF validation complete
**Result:** passed after one global pagination fix ✅
**Scenarios:**
- adequately sampled REM-predominant mild OSA retained the REM phenotype and REM-specific treatment logic
- WatchPAT central/periodic-breathing signals with LVEF 40% required in-lab confirmation, suppressed advanced ASV routing, and displayed the ASV contraindication
- very severe OSA with marked hypoxic burden, BMI 44, prior PAP failure, and Inspire interest retained urgent weight/anatomy planning while withholding patient-facing nerve-stimulation candidacy
- a current PAP user with substantial nasal obstruction continued PAP and received nasal optimization without retry/setup language
- a pre-study patient with severe insomnia, snoring, and nasal obstruction received sleep-study, CBT-I, and nasal steps without an OSA diagnosis or OSA treatment recommendation
**Verification:**
- all five scenario audits passed expected-text, forbidden-text, phenotype/tag, clinician-safety, terminology-guide, Unicode-dash, and invalid-placeholder checks
- all 13 initially generated pages were rendered and inspected; no clipping, overlap, missing text, or hierarchy failure was found
- the central-safety report exposed a greedy-pagination edge case that created two underfilled continuation pages
- `js/pdf-export.js` now re-measures adjacent semantic groups in an isolated page shell and merges them only when the exact rendered height fits
- the central-safety report remains within a readable two-to-three-page range across browser rendering variations; genuinely content-rich reports retain additional pages rather than compressing text
- the permanent headless PDF regression asserts the central-safety fixture remains within that bounded pacing range
- complete headless suite passed after the change
**Finding:** fixed. Cross-scenario clinical behavior remained intact, and the pagination improvement applies globally rather than depending on a patient-specific exception.

### Tests 150-152: Visit-specific patient action plans
**Status:** local executable content, workflow, and PDF regression complete
**Result:** passed ✅
**Verification:**
- the current-APAP scenario expands the PAP comfort and nasal modules because those are the highest-priority documented barriers
- weight and positional pathways remain visible as compact supporting actions rather than creating an overlong handout
- the pre-study snoring scenario preserves diagnostic uncertainty, recommends completion of the sleep study, includes interim side-sleeping advice, and surfaces only clinician-confirmed nasal, alcohol, and weight actions
- alcohol counseling appears only when the structured near-bedtime alcohol field and lifestyle pathway support it
- all generated action plans are normalized to remove typographic dash characters
- the content-rich action-plan PDF regression remains within the intended one-to-two-page boundary
- full headless suite passed with 619 assertions
**Finding:** none. The new output is a concise encounter plan and does not replace or lengthen the existing comprehensive Precision Sleep Profile.

### Tests 153-160: Progressive patient intake history
**Status:** local executable workflow, branching, syntax, and visual-layout regression complete
**Result:** passed ✅
**Verification:**
- the uncomplicated pathway keeps prior-study, PAP, oral-appliance, surgery, nerve-stimulator, cardiovascular-detail, and GLP-1 detail panels hidden when they do not apply
- loud, frequent, or bothersome snoring replaces the overly broad occasional-snoring wording
- the alcohol selector now includes occasional or social-event use
- prior sleep-study history captures optional year and home-versus-lab location
- current PAP users identify CPAP/APAP, BiPAP, or unsure, then answer a difficulty gate before any problem checklist appears; PAP pressure is absent from the patient form
- oral appliance benefit/tolerance/TMJ or dental barriers, surgery outcomes, and nerve-stimulator outcome/year are captured conditionally
- cardiovascular subtype selection distinguishes hypertension from heart failure and other conditions; isolated hypertension without an echo no longer creates a blanket LVEF warning
- GLP-1 history conditionally captures medication, effectiveness, and structured problems
- new fields map through the restricted intake Lambda into named clinician-chart fields; Node syntax checks and JavaScript lint pass
- local visual rendering confirms tighter header, section, field, and conditional-panel spacing without shrinking touch targets
- full headless suite passed with 655 assertions
**Finding:** none. The questionnaire is more comprehensive for complex patients while the uncomplicated history path remains deliberately short.

### Tests 161-164: Intake layout and clinical-use integration
**Status:** local executable layout, clinical-routing, content, syntax, and regression testing complete
**Result:** passed ✅
**Verification:**
- the About You controls now use a compact responsive grid; sex, feet, inches, and weight share a baseline at tablet and desktop widths, and the two height selectors have equal dimensions
- the nerve-stimulator outcome prompt and answer controls align in one compact row, while implant year remains a bounded optional field below it; both sections stack cleanly on narrow screens
- current PAP difficulty changes troubleshooting and objective-data review guidance even when the patient does not select a specific barrier
- MAD adverse effects and tolerance history now feed the clinician recommendation and treatment-safety context when a retrial is considered
- prior throat, nasal, sinus, and jaw surgery outcomes change reassessment or revision-planning language rather than merely appearing as historical facts
- existing nerve-stimulator benefit and implant year change optimization, interrogation, and on-therapy testing guidance rather than triggering a new-device candidacy pathway
- a reported prior sleep study changes the pre-study pathway to obtain and review the actual report before deciding whether repeat testing is needed
- structured GLP-1 barriers now appear in relevant clinician context and patient counseling
- patient-reported history remains decision context and a routing input; objective study, exam, and safety findings still control phenotype and treatment eligibility logic
- full headless suite passed with 697 assertions
**Finding:** fixed. Newly collected history now has bounded clinical consequences throughout the app, and the intake layout no longer leaves the paired controls visually unbalanced.

### Tests 165-173: Treatment-history outcome and chart-state guardrails
**Status:** local executable clinical-routing, report-content, state-isolation, syntax, and regression testing complete
**Result:** passed after three personalization fixes ✅
**Verification:**
- new-chart reset clears hidden derived PAP pressure, prior-study answer, and LVEF follow-up state before every scenario
- prior MAD intolerance now appears as a clinical limitation rather than being obscured by a favorable physiologic profile score; the patient report names the documented barrier before another trial
- failed throat surgery now produces outcome-aware operative-report, current-anatomy, and DISE guidance instead of generic surgical workup language or an automatic revision recommendation
- prior-study retrieval in a heart-failure patient preserves the Echo/LVEF Needed flag and does not assume that another sleep study is automatically required
- a fresh five-scenario batch covered stable current CPAP with a prior GLP-1 cost barrier, successful prior MAD, successful prior throat surgery with recurrence, helpful existing HGNS, and an unavailable prior lab study with isolated hypertension
- stable CPAP stayed in continuation and objective-efficacy review without comfort-troubleshooting language; the prior tirzepatide benefit and cost barrier remained visible in weight counseling
- successful MAD produced continue-or-retitrate guidance and on-treatment verification; successful prior throat surgery preserved its historical benefit while retaining safe re-evaluation before another target
- helpful existing HGNS stayed in the existing-device optimization pathway and excluded new-device candidacy staging and DISE language
- isolated hypertension appeared as cardiovascular context without an Echo/LVEF Needed flag
- patient handouts and action plans in all scenarios remained free of typographic dash characters
- full headless suite passed with 889 assertions
**Finding:** fixed. Treatment history now changes routing in both directions: failure creates barrier-specific reassessment, while benefit creates continuation and efficacy-verification guidance. No additional clinical or report-personalization errors were found in the fresh five-scenario batch.

### Tests 174-178: Mixed current-therapy and prior-treatment stress tests
**Status:** local executable clinical-routing, clinician-report, patient-report, action-plan, syntax, and regression testing complete
**Result:** passed after four global improvements ✅
**Scenarios and findings:**
- current APAP with severe recurrent nasal obstruction after previously helpful nasal surgery correctly retained PAP and nasal pathways; the action plan now explicitly reassesses recurrent or residual blockage instead of treating the prior operation as either irrelevant or an automatic reason for revision
- oral-appliance interest after helpful jaw surgery correctly remained available but required a sleep-dentist exam; the comprehensive report and action plan now name bite (occlusion), tooth support, jaw movement, and jaw-joint review
- an existing HGNS device without benefit plus residual AHI 48, nadir 72%, T90 21%, and high hypoxic burden excluded new-device candidacy and DISE language; the action plan now calls for prompt objective on-therapy testing because the severe breathing and oxygen findings require timely confirmation of effective treatment
- current APAP mask/leak difficulty and current effective semaglutide with digestive side effects stayed as separate PAP and weight-management pathways; the clinician and patient outputs preserved the exact barriers and did not invent nasal treatment or suggest autonomous pressure changes
- heart failure with documented LVEF 55% and WatchPAT central signals required in-lab confirmation while continuing BiPAP review; documented LVEF is now visible in clinician decision context, the LVEF follow-up flag remained cleared, and ASV contraindication language stayed suppressed
- all five cases preserved the no-typographic-dash patient-handout rule
- full headless suite passed with 1,017 assertions
**Finding:** fixed. The mixed cases are becoming more stable: the remaining defects were missing personalization and visibility, not contradictory phenotype calculations or unsafe treatment selection. No unresolved issue remained after the final rerun.

### Tests 179-183: Treatment-safety and diagnostic-boundary stress tests
**Status:** local executable plan-suggestion, clinical-routing, clinician-report, patient-report, action-plan, syntax, and full regression testing complete
**Result:** passed after three global safety and communication fixes ✅
**Scenarios and findings:**
- an oral-appliance request with severe TMJ disease, limited dentition, and limited mandibular protrusion correctly suppressed favorable, standard, poor, and incomplete-workup MAD pathways; the action plan now asks whether an appliance is a poor or potentially unsafe fit and prohibits finalization without a sleep-dentist safety determination
- PAP intolerance with Inspire interest and BMI 42 exposed an MA-layer defect that still auto-selected nerve stimulation above the Capital ENT BMI 40 referral guardrail; new-device suggestions and HNS workup are now gated above that guardrail while existing implanted devices remain eligible for management and optimization
- hypoxic burden 63 remained elevated context but correctly stayed below the evidence-linked high tier of 73, so it did not receive the `HB-URG` cardiovascular-benefit tag
- normal AHI with bothersome snoring, severe nasal obstruction, frequent near-bedtime alcohol, and weight readiness stayed outside the OSA pathway; the clinician view now explicitly labels `Normal study by AHI` and `Snoring pathway` while the patient plan contains only relevant symptom-directed actions
- severe insomnia with moderate OSA in a stable current APAP user added CBT-I and objective PAP efficacy review without re-fitting, retry, or new-start language
- current BiPAP with WatchPAT central signals, heart failure, and unknown LVEF retained BiPAP review, required in-lab confirmation, and withheld a definitive ASV contraindication; the missing echocardiogram is now visible in both the clinician report and the patient action plan
- every patient-facing output retained the no-typographic-dash rule
- full headless suite passed with 1,148 assertions
**Finding:** fixed. The new defects were cross-layer safety gaps: treatment eligibility was correct in the analysis engine but not consistently reflected in MA suggestions and encounter handouts. Those layers now share the same guardrails, and no unresolved issue remained after the final rerun.

### Test 184: Normal HST with snoring and persistent fatigue
**Status:** local executable shared-signal, MA-plan, clinician-report, patient-report, action-plan, syntax, lint, and full regression testing complete
**Result:** passed after one cross-layer diagnostic-boundary fix ✅
**Verification:**
- a symptom-focused visit with snoring, fatigue or unrefreshing sleep, AHI 3, adequate recording time, low Epworth score, and no qualifying RDI/arousal pattern now auto-suggests Diagnostic Testing rather than relying on a clinician-only warning
- the recommendation uses a dedicated `NEG-HST-PSG` tag and specifies in-lab polysomnography without mislabeling the patient as having UARS or OSA
- the clinician report identifies a negative home sleep test with persistent symptoms and recommends in-lab PSG
- the comprehensive patient report explains that the home study did not fully explain the symptoms, while Today's Plan gives a direct in-lab scheduling step
- fatigue can activate the rule through the symptom-focused visit reason even when Epworth sleep propensity is below 10
- the existing adequate normal-HST case with isolated bothersome snoring, ESS 8, and no persistent-symptom visit goal remains on nasal, lifestyle, and weight pathways without unnecessary PSG or PAP routing
- short or otherwise nondiagnostic home-study paths now specify in-lab PSG before diagnosis or treatment is finalized, consistent with the AASM diagnostic-testing guideline
- patient-facing output remains free of typographic dash characters
- full headless suite passed with 1,171 assertions
**Finding:** fixed. The prior implementation communicated concern in portions of the reports but did not reliably convert that concern into the MA's active diagnostic plan. All output layers now consume the same negative-HST follow-up signal.

### Test 185: Normal HST with structural nasal obstruction and a clinician-confirmed nasal-first plan
**Status:** local clinician-plan, patient-report, action-plan, syntax, lint, and full regression testing complete
**Result:** passed after adding an explicit patient-handout sign-off boundary ✅
**Verification:**
- a symptom-focused normal HST with severe nasal obstruction and a deviated septum continues to show the clinician-side negative-HST alert and a draft Diagnostic Testing suggestion
- the physical-exam UI now exposes the existing deviated-septum and turbinate-hypertrophy inputs so structural nasal findings can actually reach the analysis engine
- when the clinician confirms Nasal Treatment without Diagnostic Testing, `NEG-HST-PSG` is excluded from the confirmed patient recommendations
- the patient report does not say that an in-lab study was ordered or instruct the patient to schedule one
- the patient report instead says that an in-lab study may be considered later if snoring, fatigue, disrupted sleep, or other concerns persist after the selected treatment
- the report identifies the deviated septum and explains that nasal treatment can improve nasal breathing and may improve snoring or subjective sleep quality, while improvement in sleep-study breathing measurements is less predictable
- Today's Plan contains the clinician-selected nasal actions and no lab-study module
- when Diagnostic Testing is selected and confirmed in the companion negative-HST scenario, the active in-lab study instructions remain present
- patient-facing output remains free of typographic dash characters
- full headless suite passed with 1,200 assertions
**Finding:** fixed. Diagnostic concern remains visible to the clinical team, but the patient-facing plan now follows the clinician's confirmed pathway and clearly distinguishes an active lab-study decision from a possible later step.

### Tests 201-202: COMISA sequencing and bedtime-restriction safety
**Status:** local clinical-routing, clinician-report, patient-report, action-plan, syntax, evidence-integrity, and full regression testing complete
**Result:** passed after evidence-calibration changes ✅
**Verification:**
- both sleepy and non-sleepy COMISA scenarios offer CBT-I early and preserve individualized concurrent or sequential PAP based on OSA urgency, access, and preference
- COMISA no longer prescribes APAP over fixed CPAP, maximum expiratory pressure relief, ramp, or a universal pressure range; mode and settings are tied to documented barriers and objective PAP data
- the high-ESS scenario explains that bedtime restriction can briefly increase sleepiness during the first week and calls for driving and safety-sensitive-duty review plus clinician-adjusted pacing
- the lower-ESS counterexample receives no automatic bedtime-restriction warning, confirming that insomnia severity alone does not create a safety alert
- neither scenario labels CBT-I or bedtime restriction unsafe or contraindicated
- medication remains outside automatic app routing; clinician guidance requires individualized review rather than recommending a hypnotic or triple-therapy pathway
- patient-facing recommendations remain limited to the clinician-confirmed CBT-I and PAP plan and contain no technical setting or medication instructions
- the full headless suite passed with **1,542 assertions**
**Finding:** fixed. The app now reflects the consistent evidence for treating insomnia in COMISA while preserving uncertainty about PAP adherence, sequencing, individual PAP settings, and the short-term safety implications of bedtime restriction.

### Tests 203-207: Combined release-candidate clinical stress test
**Status:** local plan-suggestion, clinician-report, PAP-guidance, patient-report, action-plan, evidence-integrity, and full regression testing complete
**Result:** passed after one patient-instruction specificity fix ✅
**Scenarios and findings:**
- sleepy COMISA with severe OSA and event-linked HB 80 correctly activated clinician-confirmed CBT-I and PAP in parallel; high ESS produced first-week sleepiness, driving, and safety-sensitive-duty monitoring; HB remained research context and did not create conventional-hypoxemia urgency or change treatment rank
- an asymptomatic current APAP user with historical ESS 18, device event index 1.2, central index 0.2, P95 leak 42, and P95 pressure 14.4 within a 13-17 range remained stable; historical sleepiness did not create symptom-download discordance, P95 leak remained a screening signal, low device indices were labeled reassuring, and no mask or pressure change was prescribed
- a three-hour WatchPAT with 5% estimated REM, pAHI 11, severe nasal symptoms, and a deviated septum produced clinician-only short-recording and limited-REM warnings plus Diagnostic Testing and Nasal Treatment suggestions; definitive PAP, positional, and HGNS pathways were withheld, and the patient report did not describe the study as bad or expose technical quality language
- a young lower-BMI patient requesting an oral appliance with supine-isolated mild OSA and adequate dental safety inputs received oral-appliance and positional options plus objective verification; supportive characteristics did not become favorable/poor tiers or an individual response probability
- an HGNS inquiry with BMI 34, larger neck, AHI 35, and partial lateral-wall collapse retained basic referral and exploratory factor-level context; partial collapse was not treated as complete collapse and mixed factors did not become strong, good, or marginal response labels
**Output review:**
- all five suggested-plan sets, editable summaries, confirmed-plan fields, recommendation tags, clinician cautions, patient inclusions and exclusions, and no-typographic-dash checks passed
- the first run's five failures were examined against the rendered output; four were overly specific test phrases that did not match accurate existing labels
- one genuine communication defect was found: when no PAP mode had been chosen, Today's Sleep Plan defaulted to CPAP. The renderer now preserves generic PAP wording until APAP, CPAP, or BiPAP is documented
- the five-scenario focused run passed 137 scenario assertions, and the complete headless suite passed **1,679 assertions**
**Finding:** fixed. The combined candidate is internally consistent across the clinician, MA, PAP-guidance, and patient layers. No unresolved clinical-routing or safety defect was found in this batch. Clinician review and deployment remain pending.

### Tests 208-212: Second predeployment boundary test
**Status:** local plan-suggestion, clinician-report, PAP-guidance, patient-report, action-plan, evidence-integrity, and full regression testing complete
**Result:** passed without a clinical-logic change ✅
**Scenarios and findings:**
- an adequate negative WatchPAT with persistent fatigue, severe nasal obstruction, and a deviated septum preserved the clinician-side PSG concern and draft Diagnostic Testing suggestion; after the clinician confirmed nasal treatment alone, the patient report described PSG only as a possible later step and did not claim that an in-lab study had been ordered
- severe OSA with ODI 58, nadir 72%, T90 23%, and event-linked HB 18 activated `OXYGEN-URG`, prioritized PAP, and required objective confirmation of oxygen control; the event-linked HB phenotype and research-cohort language remained absent
- a symptomatic current BiPAP user with device event index 13, central index 8, periodic breathing 7%, heart failure, and missing numeric LVEF received central-event review, PSG confirmation, and echocardiogram retrieval; the app did not recommend reflex pressure escalation and did not label ASV contraindicated without the LVEF
- a patient with prior MAD failure, intolerance, TMJ pain, and bite change who now requested HGNS retained that history in the clinician view; the confirmed plan contained only nerve-stimulation evaluation and did not reactivate MAD therapy or expose oral-appliance finalization instructions to the patient
- mild supine-predominant OSA with non-supine AHI 6.3 retained PAP plus positional therapy; both clinician and patient outputs explicitly stated that position is an adjunct because OSA persists off the back
**Output review:**
- the initial focused run passed 130 assertions and failed two expectations in the HGNS case
- inspection showed both failures were incorrect expectations, not app defects: selected-plan filtering appropriately removed `MAD-SAFETY-LIMIT` and current-TMJ treatment language when oral-appliance therapy was not selected, while preserving the prior failure history
- after correcting the test expectations, the focused five-case plan matrix passed all 132 assertions
- the HGNS-only Today's Sleep Plan is clinically correct but visually sparse because nerve-stimulation evaluation currently renders as a supporting action rather than an expanded module; this was added to the UX roadmap and is not a safety blocker
- the complete headless suite passed **1,825 assertions**
**Finding:** no unresolved clinical-routing or safety issue. The second batch confirms that clinician signoff, independent oxygen-versus-HB logic, central-event safeguards, competing-treatment history, and positional adjunct wording remain coherent when combined. Deployment remains pending clinician review.

### Tests 213-214: Dedicated HGNS Today's Sleep Plan
**Status:** local patient-content, terminology, counterexample, syntax, rendered-PDF pacing, and full regression testing complete
**Result:** passed after replacing the sparse supporting action with a dedicated module ✅
**Verification:**
- a clinician-confirmed HGNS-only visit for a patient without an implant now renders a full module with the reason for evaluation, device-specific review inputs, conditional DISE or updated testing, procedure and programming expectations, follow-up testing, alternatives, and an explicit statement that evaluation does not promise eligibility or treatment success
- the conditional terminology guide defines nerve stimulation, PAP, and DISE before those terms appear in the clinical narrative
- existing implanted devices use a separate follow-up pathway that reviews model, activation, nightly use, programming, comfort or technical barriers, and objective on-therapy efficacy rather than repeating new-device candidacy steps
- an existing device reported as helpful remains in continuation and verification; a device reported as unhelpful moves to reassessment; severe residual breathing or oxygen findings make objective verification prompt without creating an autonomous programming or treatment change
- the generic one-line nerve-stimulation fallback no longer appears when the dedicated module is active
- patient-facing output remains free of typographic dash characters
- both the established PAP plan and the new HGNS-only plan remain within the accepted one-to-two-page rendered PDF range
- the complete headless suite passed **1,845 assertions**
**Finding:** fixed. The HGNS-only handout now matches the detail and visual hierarchy of the other major plan modules while preserving device-specific uncertainty and clinician control. No clinical threshold or eligibility rule changed. Clinician review and deployment remain pending.

### Tests 215-219: Returning-patient iPad follow-up
**Status:** local workflow, security-boundary, branching, clinician-review, syntax, lint, and full regression testing complete
**Result:** passed after adding the dedicated follow-up workflow ✅
**Verification:**
- the initial questionnaire directly captures regular opioid use, neuromuscular breathing weakness, and hypoventilation concern; the three interpretive sleep-study-selection checkboxes remain explicitly clinician assessments
- staff can generate separate single-use links for a new-patient intake or a follow-up questionnaire without signing the clinician workspace into the handed iPad
- the follow-up fast path does not repeat demographics or prior-treatment history and always captures ESS, treatment use, benefit, barriers, safety changes, and the primary goal for the visit
- PAP fields appear only for current PAP; ISI and NOSE are repeated only when corresponding symptoms or treatments make them relevant; omitted scales remain null rather than becoming false zeroes
- a patient submission appends a structured checkpoint with Review needed status, does not overwrite baseline chart fields, and can be marked reviewed by an authorized clinician
- the complete headless suite passed **1,859 assertions**
**Finding:** implemented locally. This is a workflow and longitudinal-measurement change, not a new diagnostic or treatment rule. Clinician review and deployment remain pending.

### Tests 220-224: Role-optimized clinical workspace
**Status:** local workflow, responsive visual, accessibility-state, syntax, output-parity, and full regression testing complete
**Result:** passed after replacing the monolithic default chart with role-optimized views ✅
**Verification:**
- Clinician Review is the default and presents a concise visit briefing followed by clinician-owned exam and plan work instead of the complete raw intake form
- MA / Nurse Prep emphasizes patient identity, visit reason, source imports, demographics, treatment history, questionnaires, and sleep-study verification while keeping clinician exam, plan confirmation, and report generation out of its primary flow
- Full Chart preserves every control, so the view switch does not create a permissions boundary or lock either role out of the other workflow
- a large PAP Compliance Review stays hidden during an unrelated visit with no imported PAP data, while a persistent launcher can reveal it; PAP-focused visits and existing download data surface it automatically
- DISE remains hidden when unrelated, allowing the physical exam to use the full clinician workspace width, but surgery or nerve-stimulation context, existing DISE data, and an explicit launcher reveal it
- the clinician briefing updates from current form state and provides direct Edit data paths to the underlying source sections
- the selected mode is reflected through `aria-pressed`, uses visible keyboard focus, respects reduced motion, and stores only a non-PHI display preference
- visual inspection at a 1440-pixel desktop viewport confirmed clearer hierarchy and substantially less initial density in both Clinician Review and MA / Nurse Prep
- no phenotype, threshold, diagnostic-routing, treatment-ranking, patient-language, or report-generation logic changed
- the complete headless suite passed **1,879 assertions**
**Finding:** implemented locally. The workflow is now progressive and role-aware without fragmenting the chart or changing clinical output. Clinician approval and deployment remain pending.

### Tests 225-229: MA handoff and P1 workflow safeguards
**Status:** local workflow-state, persistence, focused-edit, accessibility, responsive visual, syntax, lint, and full regression testing complete
**Result:** passed after implementing the saved MA handoff and all four P1 workflow fixes ✅
**Verification:**
- readiness remains blocked until required identity, demographics, questionnaire review, study-source context, explicit source review, and pending-conflict checks are resolved
- the MA can complete handoff while the clinician plan remains unconfirmed; the handoff stores preparer and time and appears separately from clinician decisions in the briefing
- changing a source field in Prep after handoff automatically returns the handoff to in progress, while clinician-owned exam or plan work does not falsely invalidate MA completion
- briefing Edit data actions open a focused correction surface for only the selected questionnaire, study, or treatment-history section and restore the prior clinician position after return
- unsaved, saving, saved, and error states remain visible; a persisted chart with unsaved data cannot generate a mismatched report and can be saved from the persistent action bar
- dirty-state guards cover chart switching, sign-out, and page exit without altering source values or clinical output
- workspace preference is stored per authenticated staff email, and every interactive form control has a programmatic accessible name
- a 1440-pixel populated MA view confirmed clear readiness hierarchy, compact state labels, usable spacing, and a persistent save action without obscuring the form
- the complete headless suite passed **1,899 assertions**
**Finding:** fixed and deployed in clinical-pilot build `dfca26e`. MA preparation now ends in a trustworthy saved handoff, clinician corrections no longer require navigating the entire chart, and report generation cannot silently outrun chart persistence. No phenotype, threshold, diagnostic-routing, treatment-ranking, or patient-report logic changed.

### Tests 230-234: Actionable readiness and scan-friendly briefing
**Status:** local workflow, intake-mapping, clinician-control, accessibility, syntax, lint, and full regression testing complete
**Result:** passed after the clinician and MA workflow refinement ✅
**Verification:**
- Clinician Review has one readiness surface in Visit Briefing; the duplicate top-level item count is confined to MA / Nurse Prep
- vague pending labels were replaced by the exact missing action, and every task opens or focuses the control required to resolve it
- questionnaire, sleep-study, and treatment-history summaries use compact metrics and labeled rows for faster review while retaining focused source correction
- PAP compliance and DISE launchers use identical typography and remain available without crowding unrelated visits
- initial patient intake now asks a required, plain-language main reason for the visit; the MA can correct the mapped chart value
- the patient-stated reason can influence visit emphasis or draft suggestions but cannot select or confirm treatment
- all clinical thresholds and phenotype logic remain unchanged
- the complete headless suite passed **1,910 assertions**
**Finding:** fixed locally. The change reduces duplicate status messaging, turns readiness into an actionable checklist, and moves visit context upstream to the patient without surrendering MA correction or clinician plan ownership. Clinician approval and deployment remain pending.

### Tests 235-241: Independent audit remediation
**Status:** local clinical-routing, patient-language, workflow-integrity, intake-state, evidence-documentation, and full regression testing complete
**Result:** passed after reconciling the independent audit findings ✅
**Verification:**
- a short three-hour WatchPAT with pAHI 7 now presents a possible sleep apnea signal without declaring mild OSA, confirmed OSA, a subtype, causal phenotype, or definitive risk; the clinician-confirmed diagnostic plan remains the next step
- adequate positive studies retain confirmed severity and treatment behavior, providing the diagnostic counterexample
- an exact supine/non-supine ratio of 2.0 now behaves consistently across phenotype detection, draft suggestions, and patient explanation; non-supine AHI 8 is adjunctive, while a 1.99 ratio and a normal overall AHI do not activate positional OSA
- patient-reported cardiovascular uncertainty reaches the chart as an unresolved safety flag without becoming confirmed disease or a treatment rule
- APAP, IPAP, and EPAP are defined conditionally before use; duplicate UPPP terminology is removed
- clinician edits containing typographic dash characters are normalized before snapshot/PDF, and edited downloads require a saved final snapshot
- validated intake removes the bearer token from the address bar, keeps only session-scoped reload recovery, warns before losing entered answers, and clears recovery state after submission
- every generated full report and Today's Sleep Plan in the scenario matrix remains free of typographic dash characters
- the complete headless suite passed **2,020 assertions** locally; clinician acceptance and deployment remain pending
**Finding:** the patient-safety contradiction and related consistency gaps are fixed locally. No deferred infrastructure defense-in-depth item was included in this clinical remediation candidate.
