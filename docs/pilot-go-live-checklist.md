# Clinical Pilot Go-Live Checklist

Use this checklist before the first real patient is entered into the clinician-only Precision Sleep Hub. This is a supervised limited-pilot approval, not a claim of zero risk or blanket HIPAA compliance.

## Pilot identification

- Approved pilot URL: ____________________
- Approved build: ____________________
- Stack name: `osa-phenotyper-capital-ent-precision-sleep-pilot`
- Intended cohort: 20-30 current Capital ENT sleep patients
- Clinical owner: ____________________
- Security/privacy owner: ____________________
- Technical owner: ____________________
- Backup technical owner: ____________________
- Approved first-PHI date: ____________________

## Mandatory go/no-go gates

- [ ] Separate pilot CloudFront distribution, Cognito pool, DynamoDB table, KMS key, logs, and WAF are deployed.
- [ ] Runtime banner reads `CLINICAL PILOT`; footer build matches the approved commit.
- [ ] Capital ENT retains evidence that the AWS BAA covers the pilot AWS account.
- [ ] The system-specific risk analysis has been reviewed and signed.
- [ ] Capital ENT has approved the pilot users, managed devices, remote-access path, EHR delivery path, downtime workflow, and incident process.
- [ ] Every workforce account is individual and has verified MFA; no shared login exists.
- [ ] Admin membership is limited and reviewed.
- [ ] Regional and WAF alert email subscriptions are confirmed and a PHI-free test alert was received.
- [ ] One synthetic DynamoDB restore drill and one audit-log retrieval are documented.
- [ ] The complete synthetic workflow rehearsal below passes.

Any unchecked mandatory gate means **NO GO for real PHI**.

## Hosted security acceptance

- [ ] CloudFront serves HTTPS only with HSTS, anti-framing, no-referrer, and MIME-sniffing protections.
- [ ] WAF is attached and API rate limiting is active.
- [ ] The default API Gateway hostname rejects a request that lacks the CloudFront origin secret.
- [ ] CloudFront `/patients` and `/patients/search` reject requests without a valid Cognito token.
- [ ] CORS allows only the pilot CloudFront origin.
- [ ] There is no bulk patient-list route; searches remain bounded to 10 results.
- [ ] Lambda IAM has no DynamoDB `Scan` permission.
- [ ] DynamoDB uses the pilot KMS key and PITR is enabled.
- [ ] CloudTrail is logging management plus DynamoDB data events with log validation.
- [ ] Lambda and API logs use the configured retention and KMS encryption.
- [ ] No patient content or search value appears in sample logs or alert messages.
- [ ] No public intake, patient portal, magic link, or anonymous API route is deployed.
- [ ] Production HTML and CSP contain no public JavaScript, CSS, font, or PDF-worker CDN.

## Synthetic clinician workflow rehearsal

- [ ] Sign in as an administrator with MFA.
- [ ] Sign in as a non-admin clinician with MFA.
- [ ] Create a clearly labeled synthetic chart.
- [ ] Save, find, reload, and re-analyze the chart.
- [ ] Generate clinician and patient reports.
- [ ] Edit the patient report, save a snapshot, reopen it, and manually download the PDF.
- [ ] Save and reopen one structured follow-up.
- [ ] Archive and restore the synthetic chart as an administrator.
- [ ] Confirm the clinician cannot perform administrator-only archive/restore actions.
- [ ] Confirm record-view, search, write, snapshot, and archive/restore activity can be found in the audit trail.
- [ ] Remove the synthetic chart or retain it with an unmistakable `SYNTHETIC` identifier according to the approved test-data procedure.

## Clinical workflow agreement

- [ ] Verify the patient in the EHR and confirm two identifiers before editing a hub chart.
- [ ] Treat unresolved-data flags as required clinical review, not fields to bypass.
- [ ] Review every recommendation and patient report before use.
- [ ] Do not use the hub as the sole basis for surgery, device candidacy, or prescribing.
- [ ] Save a report snapshot when a report is discussed or distributed.
- [ ] Upload reviewed reports through the approved EHR workflow.
- [ ] Complete the official note, orders, prescriptions, and communication in the EHR.
- [ ] Do not put patient identifiers in GitHub, ordinary issue trackers, or unapproved support messages.

## Monitoring and support

- [ ] A named owner reviews alarms and WAF false positives during the pilot.
- [ ] A named owner performs account lockout and MFA-reset support.
- [ ] A named owner reviews access at least quarterly and immediately disables separated workforce users.
- [ ] Pilot staff know how to report a suspected privacy/security incident immediately.
- [ ] Pilot staff know the EHR-based downtime fallback and will not delay care because the hub is unavailable.

## Stop conditions

Stop the live pilot and revert to the normal EHR workflow if any of these occur:

- Wrong chart, wrong-patient data, or corrupted persistence is observed.
- Saved charts, snapshots, or structured follow-ups cannot be reliably reloaded.
- Any workforce member can access records or actions outside the approved role.
- PHI appears in a log, alert, issue tracker, email, browser asset request, or another unapproved channel.
- MFA, monitoring, recovery, audit retrieval, or the EHR fallback is unavailable.
- A material report or clinical-logic defect could affect patient care.
- The runtime label or build does not match the approved pilot release.

## Final authorization

- [ ] GO
- [ ] NO GO
- [ ] GO with documented exceptions

Exceptions or compensating controls: __________________________________________

Clinical owner signature: ____________________  Date: __________

Security/privacy owner signature: ____________________  Date: __________

Technical owner signature: ____________________  Date: __________
