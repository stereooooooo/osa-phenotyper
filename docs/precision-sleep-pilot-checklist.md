# Precision Sleep v1 — Current-Patient Pilot Checklist

Use this checklist for a limited 20-30 patient pilot. A separate clinician-only `CLINICAL PILOT`
environment is deployed at `https://d3fgk3yvbi0jvr.cloudfront.net` with technical candidate build
`16cbd81`. The older staging environment remains synthetic-data-only. The pilot remains **NO GO for
real PHI** until every mandatory organizational and remaining workflow gate is approved.

## Before any PHI

- [x] Deploy a separate `CLINICAL PILOT` stack, patient table, Cognito pool, logs, and CloudFront distribution.
- [ ] Confirm every AWS service in the pilot data flow is covered by the Capital ENT AWS BAA.
- [ ] Complete and document the HIPAA security risk analysis for the pilot workflow.
- [ ] Complete the controls in `docs/clinician-only-architecture.md` under **Required production controls outside the code**.
- [ ] Create individual accounts only for pilot clinicians/staff; require and test MFA.
- [ ] Restrict pilot access to managed Capital ENT devices and approved remote-access practices.
- [ ] Configure and test alarms for authentication failures, API errors, WAF blocks, and unexpected request volume.
- [ ] Confirm both regional and CloudFront/WAF SNS email subscriptions; receive one PHI-free test alert.
- [x] Test one DynamoDB recovery and one audit-log retrieval.
- [x] Confirm all browser libraries, fonts, and PDF workers load from the private app origin; no public CDN is allowed by CSP.
- [x] Confirm the only anonymous patient route is the scoped intake endpoint; verify 72-hour expiry, one-time use, revocation, rate limiting, origin-secret enforcement, and no patient portal/report route.
- [ ] Configure clinic iPads as managed devices and train staff never to sign the clinician workspace into a handed device.
- [x] Confirm the footer reads `CLINICAL PILOT` and shows technical candidate build `16cbd81`.
- [ ] Obtain clinical, privacy/security, and operational approval to begin the limited cohort.

## One synthetic rehearsal

- [x] Create, find, save, and reload one synthetic chart.
- [x] Generate clinician and patient reports.
- [x] Save and reopen a report snapshot.
- [x] Save and reopen one structured follow-up.
- [x] Archive and restore the synthetic chart as an administrator.
- [ ] Confirm a clinician cannot perform administrator-only archive/restore actions.
- [ ] Confirm the EHR report-delivery workflow and downtime fallback.
- [ ] Confirm ordinary email is not the default report-delivery path.

## Per-patient workflow

1. Verify the patient in the EHR before creating or opening the hub chart.
2. Search by exact MRN, DOB, or name; confirm two identifiers before editing.
3. Save the baseline evaluation and review missing-data warnings.
4. Generate the profile and reports; apply clinician judgment before using recommendations.
5. Save the report snapshot when the report is discussed or distributed.
6. Upload the reviewed patient report through the EHR's approved workflow.
7. Complete the official note, orders, prescriptions, and communication in the EHR.
8. At follow-up, record one structured checkpoint and update source clinical data when appropriate.

## Feature freeze

- Pilot target: 20–30 current sleep patients.
- Do not add requested enhancements during the cohort unless a defect blocks safe use.
- Record requests in a backlog with no patient identifiers.
- Review the backlog and pilot measures only after the cohort is complete.

## Pilot review

- [ ] Report snapshot completion rate
- [ ] Follow-up completion within 90 days
- [ ] Treatment-pathway distribution
- [ ] Response and adherence distribution
- [ ] ESS, ISI, weight, and AHI changes when available
- [ ] Median clinician time in the hub
- [ ] Defects, confusing fields, and missing workflow steps
- [ ] Security, access, alert, and audit events
- [ ] Decision: stop, revise, extend pilot, or launch the branded program

## Stop immediately if

- The wrong chart is displayed or data appears under the wrong patient.
- Saved data or follow-ups cannot be reliably reloaded.
- Any workforce member can access data or actions outside their role.
- PHI appears in an unapproved channel, log, issue, email, or browser surface.
- Monitoring, recovery, authentication, or the EHR fallback is unavailable during the pilot.
