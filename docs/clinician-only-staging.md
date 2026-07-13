# Clinician-Only Staging Environment

Deployed July 13, 2026. This environment is for synthetic test records only and is not approved for production PHI.

- App: `https://d1gettihxhsi19.cloudfront.net`
- Region: `us-east-2`
- CloudFormation stack: `osa-phenotyper-capital-ent-clinician-stg`
- DynamoDB table: `osa-patients-capital-ent-clinician-stg`
- Cognito pool: `us-east-2_ZyHaWT9Tj`
- Initial administrator: `drbrown@capitalent.com`

## Deployment verification

- Stack status: `UPDATE_COMPLETE`
- Patient-table item count: `0`
- DynamoDB KMS encryption: enabled
- Cognito software-token MFA: required
- Administrator status: forced password change before first use
- API routes: five clinician routes, all using JWT authorization
- Public intake and patient-portal assets/routes: absent
- Direct API calls without a JWT: rejected
- Lambda calls without the CloudFront origin secret: `403 Forbidden`
- CloudTrail: actively logging with no current delivery error
- CloudFront: WAF attached; HSTS, anti-framing, no-referrer, MIME-sniffing, and XSS-protection headers enabled
- Browser regression suite: 292 assertions passing

Before testing, the administrator must use the temporary Cognito password, set a new unique password, and enroll an authenticator application. Do not enter real patient information during staging validation.

## Live acceptance test

Completed July 13, 2026 while signed in as `drbrown@capitalent.com`, using only the synthetic record `Acceptance, Synthetic` (`STG-ACCEPT-001`).

- Created a chart from the clinician home screen and reopened it through bounded patient search
- Entered and saved fictional clinical data
- Generated the clinician report and patient-facing report preview
- Saved one immutable report snapshot
- Archived the chart and confirmed it disappeared from active search
- Found the chart with **Show archived**, restored it, and confirmed its status returned to `Initial Eval`
- Verified directly in DynamoDB that `isDeleted` is absent after restore and `reportSnapshotCount` remains `1`
- Current synthetic table item count: `1`

Two defects surfaced during the live workflow and were fixed, tested, deployed, and rechecked:

- Home chart creation now unwraps the API response before opening the new chart (`d3af10a`)
- Archived bounded search no longer sends an unused DynamoDB expression value (`98fe717`)

Acceptance result: **PASS** for the create, search, save, report, snapshot, archive, and restore workflow. Staging remains restricted to synthetic data and is not approved for production PHI.
