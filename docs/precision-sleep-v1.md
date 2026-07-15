# Capital ENT Precision Sleep — v1

## Product decision

V1 is a clinician-only operating layer for an OSA-centered Precision Sleep pilot. It keeps the validated phenotyping and report engine, adds a qualitative six-domain profile, and adds structured longitudinal follow-ups. It does not attempt to replace the EHR or launch every future sleep service.

## Interface thesis

- **Visual thesis:** calm, clinician-grade workspace with Capital ENT branding, one primary action color, and the patient's current care state as the focus.
- **Content plan:** start or find a chart → complete the existing evaluation → generate the Precision Sleep profile and reports → record follow-up checkpoints.
- **Interaction thesis:** direct search instead of a patient roster; immediate home-to-chart movement; longitudinal detail appears only when the clinician opens Follow-ups.

## Included in v1

1. Existing OSA clinical evaluation, phenotype engine, safety guardrails, recommendations, and patient/clinician reports
2. A patient-facing **Personalized Sleep Profile** organized into:
   - Airway anatomy
   - Weight and metabolic factors
   - Breathing pattern
   - Sleep quality
   - Treatment fit
   - Risk and outcomes
3. Calibrated qualitative labels rather than fabricated causal percentages or star scores
4. Structured follow-up checkpoints containing pathway, status, response, adherence, next action, and optional weight/ESS/ISI/AHI
5. Up to 20 retained follow-up entries per chart, with workforce identity and timestamps added by the server
6. Existing immutable report snapshots and clinician-only bounded patient search

## Explicitly excluded

- Patient portal, patient login, public links, or in-app messaging
- Scheduling, billing, prescriptions, orders, or narrative medical notes
- Wearable integrations and automated device feeds
- Generative-AI clinical recommendations or report prose
- Broad evaluation of narcolepsy, parasomnias, RLS, and other non-OSA sleep disorders
- Automated referral marketplace or partner portal
- Causal percentage estimates for OSA drivers

The EHR remains the legal medical record and owns communication, documentation, orders, prescriptions, scheduling, and billing.

## Pilot workflow

1. Find or create the patient's chart.
2. Enter/import the baseline sleep evaluation and save it.
3. Generate reports and review the six-domain profile with the patient.
4. Save a report snapshot when a report is used clinically.
5. Document the full encounter and orders in the EHR.
6. At each follow-up, record one structured checkpoint in the hub and update the evaluation when source clinical data change.
7. Use repeat ESS, ISI, weight, and AHI when available to show response over time.

## Pilot success measures

For the first 20–30 patients, track:

- Percentage receiving a report snapshot
- Percentage with a follow-up checkpoint within 90 days
- Treatment pathway selected
- Patient response and adherence at follow-up
- Change in ESS, ISI, weight, and AHI when available
- Median clinician time required to complete the hub workflow
- Missing or confusing fields reported by the clinician

Do not add features during the initial cohort unless a defect blocks safe use. Record requests in a backlog and review them after the cohort.

## PHI go-live boundary

The existing clinician-only staging environment remains synthetic-data-only. Current patients may be entered only after a separate PHI-approved pilot environment passes the production controls in `docs/clinician-only-architecture.md`, including individual accounts with MFA, managed devices, monitoring alarms, tested recovery/audit retrieval, written operating procedures, and final security review.

## V1 completion criteria

- Baseline chart create/search/save/load works
- Existing phenotype analysis and reports remain regression-clean
- Six-domain profile renders with missing-data states
- Structured follow-up saves, reloads, and retains server-side audit identity
- Archive/restore and report snapshots remain intact
- Pilot runbook and PHI deployment gate are documented

