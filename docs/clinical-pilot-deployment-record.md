# Precision Sleep Clinical Pilot Deployment Record

**Current decision:** NO GO for real PHI until the remaining human and synthetic-workflow gates below are complete.  
**Environment:** Isolated clinician-only clinical pilot  
**Pilot URL:** https://d3fgk3yvbi0jvr.cloudfront.net  
**Approved code candidate:** `10eeffb`  
**Stack:** `osa-phenotyper-capital-ent-precision-sleep-pilot`  
**AWS region:** `us-east-2` (CloudFront WAF resources in `us-east-1`)  
**Initial administrator:** `drbrown@capitalent.com`  
**Deployment date:** 2026-07-16

This record documents technical verification. It is not a declaration of HIPAA compliance and does not replace Capital ENT's organizational risk analysis, policies, training, or approval.

## Isolation and data state

- [x] Dedicated CloudFront distribution and private versioned web bucket
- [x] Dedicated Cognito user pool and groups
- [x] Dedicated KMS-encrypted DynamoDB patient table
- [x] Dedicated KMS key, Lambda, API, logs, alarms, CloudTrail, audit bucket, and WAF
- [x] Patient table contained zero items at initial acceptance
- [x] Runtime configuration identifies the environment as `CLINICAL PILOT`
- [x] Existing synthetic-only staging distribution and table were not used

## Hosted technical acceptance

- [x] CloudFormation stack status `UPDATE_COMPLETE`
- [x] Stack termination protection enabled
- [x] DynamoDB deletion protection enabled
- [x] Cognito deletion protection enabled
- [x] Cognito MFA configuration `ON`; 12-character complex password policy
- [x] Access and ID tokens expire after 15 minutes; refresh token after one day
- [x] CloudFront distribution deployed with the pilot WAF attached
- [x] HTTPS response includes HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff`
- [x] CORS permits only `https://d3fgk3yvbi0jvr.cloudfront.net`
- [x] Unauthenticated CloudFront and direct API patient-search requests return `401`
- [x] Public `intake.html` and `portal.html` requests return `403`
- [x] WAF rate limit and AWS managed common/SQL injection rules are active for `/patients`
- [x] WAF request sampling disabled; aggregate CloudWatch metrics remain enabled
- [x] Lambda DynamoDB IAM permits only `GetItem`, `PutItem`, `UpdateItem`, and `Query`; no `Scan`
- [x] DynamoDB uses the pilot KMS key, on-demand billing, 35-day point-in-time recovery, and retained-resource policies
- [x] Private web and audit buckets block all public access and have versioning enabled
- [x] Audit bucket uses the pilot KMS key and a seven-year lifecycle
- [x] CloudTrail is multi-region, logging, uses log-file validation, and records pilot DynamoDB data events
- [x] Lambda and API log groups use the pilot KMS key and 2,557-day retention
- [x] API access logs omit request bodies, authorization headers, query strings, and search values
- [x] Public-CDN dependencies removed; live Bootstrap, icons, Cognito, PDF.js, jsPDF, html2canvas, and Inter assets return `200` from the pilot origin
- [x] Local headless regression suite passed 411 assertions

## Operational evidence

- [x] Regional alarms deployed for authorization failures, Lambda errors, API 5xx responses, and unexpected request volume
- [x] CloudFront/WAF blocked-request alarm deployed
- [x] All alarms initially reported `OK`
- [x] CloudTrail delivered encrypted audit files to the dedicated audit bucket
- [x] A PHI-free API access-log event was retrieved and contained only request ID, source IP, time, route, status, response length, and integration status
- [x] Confirm the regional SNS email subscription (`raymondbrown@gmail.com`)
- [x] Confirm the CloudFront/WAF SNS email subscription (`drbrown@capitalent.com`)
- [ ] Send and receive one PHI-free regional test alarm
- [ ] Send and receive one PHI-free WAF test alarm

Both PHI-free test alarms were sent and returned to `OK`. Receipt in the destination mailboxes still requires human confirmation.

## Required synthetic rehearsal

- [x] Complete the initial administrator password change and software-token MFA enrollment
- [ ] Create an individual non-admin clinician account and verify MFA
- [x] Create one unmistakably synthetic patient chart
- [x] Save, search, reload, edit, and re-analyze the chart
- [x] Generate clinician and patient reports
- [x] Edit the patient report, save/reopen a snapshot, and download its PDF
- [x] Save and reopen a structured follow-up
- [x] Archive and restore as an administrator
- [ ] Verify a clinician cannot use administrator-only archive/restore actions
- [x] Retrieve the synthetic create/read/update/archive audit evidence
- [x] Restore the synthetic table to a temporary DynamoDB table using PITR, verify the item, and remove the temporary restore table
- [ ] Rehearse the approved EHR report-upload and downtime workflows

### Synthetic rehearsal evidence, 2026-07-16

- Synthetic chart: `SYNTHETIC PILOT, Avery`, MRN `SYN-PILOT-001`, patient ID `cdf0ca29-1216-4424-9a14-4e9aa5aa75a7`
- Exact-MRN search and reload preserved the clinical form values.
- Clinician and patient reports generated. The patient report was edited, saved as a snapshot, reopened, and exported as `Sleep_Report_SYNTHETIC_PILOT_Avery_2026-07-16.pdf`.
- One structured PAP follow-up was saved and reopened with status, response, adherence, next action, weight, ESS, ISI, and repeat AHI intact.
- Administrator archive removed the record from active search, `Show archived` displayed it with an `Archived` status, and administrator restore returned it to the active list with its original Treatment Plan status.
- The restored record retained one report snapshot and one follow-up. Its visit history attributed `Created`, `Data updated`, `Report snapshot saved`, `Follow-up recorded`, `Archived`, and `Restored` to `drbrown@capitalent.com`.
- CloudWatch recorded PHI-free `patient_search` and `patient_record_viewed` events. CloudTrail recorded the corresponding DynamoDB `PutItem`, `GetItem`, and `UpdateItem` data events under the pilot Lambda role, including the soft-archive update.
- PITR restored the source table as temporary table `osa-patients-capital-ent-precision-sleep-pilot-restore-drill-20260716` at `2026-07-16T11:59:14.733-05:00`. The restored table was KMS encrypted and contained the expected synthetic chart and saved report snapshot. The follow-up was recorded after the selected restore time and was therefore correctly absent. The temporary table was deleted after verification.

## Required organizational approval

- [ ] Retain evidence that the Capital ENT AWS BAA applies to this AWS account
- [ ] Review and sign `docs/clinical-pilot-risk-analysis.md`
- [ ] Approve pilot users, managed devices, remote-access practices, EHR delivery, retention, downtime, and incident workflows
- [ ] Name clinical, privacy/security, technical, and backup technical owners
- [ ] Approve the limited cohort and first-PHI date
- [ ] Sign `docs/pilot-go-live-checklist.md`

## Stop conditions

Use the normal EHR workflow and stop the pilot immediately for wrong-patient data, unreliable persistence, unauthorized role access, PHI in an unapproved surface, unavailable MFA/monitoring/recovery, or a material clinical-report defect.
