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
| ER-2026-06-11 | 2026-06-11 | 2026-06-11 | Full clinical evidence and confidence-calibration audit | Existing primary literature, guidelines, regulatory sources, and expert review documented in `citations.md` and `optimization-roadmap.md` | Several rules were directionally useful but overstated certainty. Hypoxic burden was separated from automatic urgency at moderate levels; numeric loop gain was removed; partial arousal-threshold and muscle-response confidence were reduced; HNS response percentages were removed from output. | PH-02, PH-03, PH-04, PH-07, TX-03 | Shipped in the Phase 2 confidence-calibration release; see `optimization-changelog.md` |
| ER-2026-07-15 | 2026-07-15 | 2026-07-15 | Device-specific HGNS labeling and complete concentric collapse | FDA Inspire P130008/S090; FDA Genio P240024 labeling and SSED; supporting HGNS literature in `citations.md` | Complete concentric collapse remains a device-specific contraindication for unilateral Inspire. Genio is not an automatic alternative because current US evidence and labeling do not establish safety/effectiveness in that subgroup. BMI 40 remains a local referral guardrail, not a universal device rule. | TX-03 | Device-specific logic and patient wording updated; see `phenotype-baseline-review.md` v5 |
| ER-2026-07-19 | 2026-07-19 | 2026-07-19 | Negative HSAT, arousal-based scoring, UARS terminology, nasal-first sequencing, and WatchPAT sleep staging | Kapur et al. 2017 AASM diagnostic guideline; Malhotra et al. 2018 AASM position statement; Zhang et al. 2020 WatchPAT validation; nasal-treatment evidence already cataloged in `citations.md` | AASM supports PSG rather than a second HSAT when OSA remains suspected after a negative, inconclusive, or inadequate HSAT. UARS is presented within the OSA spectrum and evaluated with PSG using arousal-based scoring. Nasal-first sequencing remains a clinician-controlled option with an explicit evidence gap. WatchPAT is not described as a recording-time-only device. | DX-01, DX-02, TX-05 | Clinician tooltips and UARS wording shipped in build `bb4d319`; patient PSG action still requires clinician selection and confirmation |

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
