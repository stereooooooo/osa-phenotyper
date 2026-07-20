# Capital ENT Precision Sleep — v1

## Product decision

V1 is a clinician-controlled operating layer for an OSA-centered Precision Sleep pilot. It keeps the validated phenotyping and report engine, adds a qualitative six-domain profile, structured longitudinal follow-ups, and narrowly scoped single-use new-patient and follow-up questionnaires. It does not add patient accounts or a patient portal, replace the EHR, or launch every future sleep service. Patient-submitted follow-ups remain pending until clinician review and do not overwrite baseline chart data.

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

## Near-term clinical product roadmap

### 1. Visit-specific patient action plans

Add a concise **Today's Sleep Plan** that can be printed or sent through an approved patient communication channel after each visit. It is separate from the more comprehensive Precision Sleep Profile and is assembled from clinician-confirmed pathways rather than every technically eligible treatment.

The first release is limited to five reusable education modules:

1. Pending sleep study and interim snoring measures
2. PAP comfort and continued-use support
3. Nasal care
4. Weight, alcohol, and lifestyle measures
5. Positional measures

Only the one or two highest-priority modules are expanded. Other confirmed actions remain visible as a compact checklist. The clinician can edit the generated plan before saving or exporting it.

### 2. PAP compliance report assistant

Add a clinician-only workflow for uploading a PAP compliance PDF and receiving evidence-based, reviewable decision support. Begin with the single report format most commonly used by Capital ENT, then add vendors only after real deidentified examples demonstrate reliable extraction.

**Implementation status (2026-07-19):** Initial clinician-only workflow started. It supports structured manual entry, a verification-gated ResMed AirView-oriented PDF parser, manufacturer-aware leak context, explicit current-on-PAP symptom discordance, central-event safety context, and editable clinician disposition. The parser has been checked against an AirView 4.51 compliance plus therapy report and captures configured APAP range, usage, pressure percentile, source-report leak threshold, leak, residual event components, and periodic breathing. An elevated P95 leak is treated as a prompt to inspect duration, nightly pattern, mask type, and symptoms rather than proof of sustained major leak. Expansion to other vendors and patient education remains gated on safely redacted report examples and clinician validation.

The first release should:

- Extract device, mode, pressure settings, usage, residual device-reported AHI, leak, pressure percentiles, and central-event or periodic-breathing fields when present.
- Show every extracted value for staff verification before analysis or chart storage.
- Combine verified device data with symptoms, treatment barriers, baseline study data, nasal findings, cardiovascular safety inputs, and the reason for the visit.
- Classify the review as effective and tolerated, adherence barrier, leak or data-quality concern, possible residual obstruction, possible central-event concern, unexplained persistent symptoms, or need for formal titration/additional testing.
- Produce clinician suggestions and patient education only after clinician confirmation.
- Never change PAP settings automatically or treat manufacturer-reported residual AHI and leak values as interchangeable across vendors.

For the initial low-cost architecture, the source PDF is parsed locally in the authenticated clinician's browser and discarded when review is complete. It is not uploaded to AWS or retained by the app. Only clinician-verified structured values and review metadata are stored with the chart. If source-report retention is added later, it will require a separate encrypted, access-controlled AWS workflow with explicit retention and deletion rules.

Later phases may add longitudinal comparisons, additional report formats, and vendor integrations. Direct device-cloud integrations are intentionally deferred because they add cost, security review, vendor contracts, and operational complexity.

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
