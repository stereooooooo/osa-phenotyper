# Physiology-phenotype primary-source review

## Review question

Can the current Precision Sleep inputs support patient-level labels or treatment routing for low
respiratory arousal threshold, high loop gain, poor upper-airway muscle responsiveness, or
pharyngeal collapsibility?

## Method

Targeted searches were completed on 2026-08-13 using PubMed, journal/DOI records, the official
ATS statement, and the official AASM central sleep apnea guideline. Primary physiology,
validation, reproducibility, treatment, guideline, and official-statement sources were preferred.
The app's runtime implementation, `js/config.js`, `js/phenotype-confidence.js`,
`docs/citations.md`, and the evidence register were audited against those sources.

This is a focused source review, not a completed systematic review or GRADE assessment.

## Measurement hierarchy

1. Reference laboratory physiology uses controlled CPAP dial-downs, epiglottic pressure,
   pneumotachography, ventilatory overshoot, or intramuscular genioglossus EMG. These methods
   established that OSA mechanisms vary between patients, but they are not routine clinical PSG
   summary fields. [Wellman 2011](https://doi.org/10.1152/japplphysiol.00972.2010),
   [Eckert 2013](https://doi.org/10.1164/rccm.201303-0448OC)
2. Signal-based PSG methods such as PUP estimate traits from preserved airflow and scored events.
   They are model-derived estimates with method-specific definitions and signal-quality
   requirements. LG0, LG1, and loop gain at the natural frequency are not interchangeable.
   [Terrill 2015](https://doi.org/10.1183/09031936.00062914),
   [Sands 2018](https://doi.org/10.1164/rccm.201707-1435OC),
   [Finnsson 2021](https://doi.org/10.1093/sleep/zsaa168)
3. Simple PSG summary-variable scores are screening proxies. They must not be described as direct
   trait measurements, and a published complete score cannot be truncated without separate
   validation.

The 2025 official ATS research statement concludes that widespread clinical implementation of
OSA endophenotyping is premature. It prioritizes harmonized signals and scoring, externally
validated outcome-linked thresholds, diverse-population validation, reproducibility, and
prospective endotype-informed treatment trials. It is a research roadmap, not a clinical guideline
that directs clinicians to treat anatomy first or rank therapies from unvalidated surrogates.
[ATS statement](https://doi.org/10.1164/rccm.202507-1574ST)

## Low respiratory arousal threshold

Edwards et al. measured arousal threshold with epiglottic pressure in 146 participants. At least
two of AHI below 30/h, nadir oxygen saturation above 82.5%, and hypopneas above 58.3% of events
identified a low threshold with reported sensitivity 80.4%, specificity 88.0%, and accuracy 84.1%.
This was derivation with leave-one-out internal validation, not independent external validation.
The authors identified scoring-rule, sleep-stage, supine-only, and within-person limitations and
called for independent validation. [Edwards 2014](https://doi.org/10.1164/rccm.201404-0718OC)

Decision:

- Keep the complete 3-variable Edwards score as a clinician-only exploratory screening signal.
- Do not call it a direct measurement or a validated diagnosis.
- Do not create the label from a 2-of-2 partial score when hypopnea fraction is unavailable. The
  published performance does not apply to that truncated score.
- Cap the app signal at Moderate and do not use it to rank or demote PAP, select an alternative
  treatment, or recommend a sedative-hypnotic.

## Loop gain and central or periodic-breathing signals

Validated research estimates require controlled physiology or preserved PSG signals and a
defined model. Central apnea, a device-estimated central index, and Cheyne-Stokes or periodic
breathing can reflect clinically important central breathing instability, but they are not a loop
gain measurement and do not establish one common mechanism.

The 2025 AASM central sleep apnea guideline emphasizes individualized treatment based on clinical
features, comorbidities, polysomnography, and the underlying cause. CPAP, BPAP with backup rate,
ASV, oxygen, acetazolamide, and transvenous phrenic nerve stimulation have etiology-specific,
mostly conditional recommendations. Oxygen is not a general treatment for every central signal.
BPAP without backup is discouraged for the listed CSA etiologies. The guideline's ASV statement
also supersedes the app's blanket claim that all ASV is contraindicated when LVEF is at most 45%:
the mortality signal was associated with one device that is no longer manufactured, while device
algorithms and safety data differ. [AASM CSA guideline, January 2025](https://aasm.org/wp-content/uploads/2025/02/Treatment-of-CSA-in-Adults-CPG.pdf)

Decision:

- Retire “High Loop Gain” detection from summary central or periodic-breathing fields.
- Preserve central and periodic-breathing findings as diagnostic and safety signals.
- Home-study central signals continue to promote PSG confirmation when indicated.
- Confirmed central events prompt etiologic review and clinician/sleep-specialist selection of
  therapy; they do not automatically choose fixed CPAP, oxygen, acetazolamide, or ASV.
- Remove the obsolete blanket LVEF-based ASV contraindication and automatic LVEF workup that were
  downstream of the invalid loop-gain treatment route. Device-specific safety and current labeling
  remain part of specialist selection if ASV is actually considered.

## Upper-airway muscle responsiveness

Reference measurements quantify genioglossus response to negative epiglottic pressure or model
the increase in ventilation accompanying increasing ventilatory drive. PSG-derived compensation
is itself a net airflow response rather than direct muscle activity, and validation cohorts were
small and selected. [Eckert 2013](https://doi.org/10.1164/rccm.201303-0448OC),
[Sands 2018](https://doi.org/10.1164/rccm.201707-1435OC)

A REM-to-NREM AHI ratio was included as a term in one multivariable surgical-response model, but
that does not validate it as a muscle-responsiveness measurement. Direct REM physiology found REM
worsening was driven mainly by withdrawal of ventilatory drive and did not show a REM effect on
collapsibility, baseline genioglossus activity, or responsiveness.
[Lee 2017](https://pubmed.ncbi.nlm.nih.gov/28818154/),
[Messineo 2021](https://pubmed.ncbi.nlm.nih.gov/34699338/)

Decision:

- Retire the “Poor Muscle Responsiveness” phenotype inferred from REM/NREM AHI and NREM burden.
- Remove its hypoglossal-nerve-stimulation routing consequence.
- Preserve REM-predominant OSA as a separate observed sleep-stage pattern with its existing
  sampling guardrails.

## F(hypopneas) and collapsibility

Vena et al. compared clinical PSG surrogates with physiologic collapsibility and found that
F(hypopneas), the fraction of respiratory events scored as hypopneas, carried useful association.
The reported relationship was moderate rather than a direct measurement, and event classification
depends on scoring definitions and source signals. The study does not validate the app's three
universal categories or patient-specific therapy ranking.
[Vena 2022](https://doi.org/10.1093/sleep/zsac050)

Decision:

- Retain F(hypopneas) only as clinician-facing exploratory research context when the required PSG
  event breakdown is present.
- Do not say the value proves high/moderate/low collapsibility, prioritizes anatomy-directed
  therapy, or makes MAD, positional therapy, weight loss, surgery, or HNS more likely to succeed.
- Missing apnea/hypopnea breakdown is not a clinical treatment-workup deficiency. Remove the
  recurring “endotyping incomplete” plan item and patient-facing implication.

## Implementation boundary

The supported production distinction is:

- observed clinical patterns and safety findings may guide standard evaluation;
- complete, published screening scores may be shown as explicitly exploratory clinician context;
- routine summary-field surrogates cannot become measured endotype labels, probabilities, or
  treatment rankings; and
- future raw-signal endotyping requires method-specific validation, software validation, defined
  signal-quality rules, external validation, prospective clinical-utility evidence, and clinician
  governance before activation.

## Paired regression requirements

1. Complete Edwards 2/3 or 3/3 may show a Moderate clinician-only exploratory signal; partial 2/2
   must not create the phenotype or treatment consequence.
2. Central/periodic signals must create appropriate review or PSG-confirmation guidance without a
   “High Loop Gain” label or automatic fixed-PAP/oxygen/acetazolamide/ASV route.
3. REM-heavy OSA may create REM-predominant OSA when criteria and sampling are met, but must not
   create poor muscle responsiveness or HNS routing.
4. F(hypopneas) may appear as research context but must not rank treatment; missing F(hypopneas)
   must not add an endotype-workup item.
