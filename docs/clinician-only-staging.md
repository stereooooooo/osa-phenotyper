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
- Browser regression suite: 291 assertions passing

Before testing, the administrator must use the temporary Cognito password, set a new unique password, and enroll an authenticator application. Do not enter real patient information during staging validation.
