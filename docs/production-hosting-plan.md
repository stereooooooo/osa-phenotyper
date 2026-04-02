# Production Hosting Plan

## Goal
Move the OSA Phenotyper from a validated staging deployment to a production-hosted environment suitable for real clinical use under Capital ENT & Sinus Center control.

This plan assumes the current staging architecture remains the baseline:
- private S3 app origin
- CloudFront front door
- CloudFront-scoped WAF
- API Gateway + Lambda + DynamoDB
- Cognito authentication
- KMS-backed data stores and logs

## Current State
- Staging stack: `osa-phenotyper-capital-ent-stg-20260401b`
- Staging app URL: `https://dk259m1syu2bu.cloudfront.net`
- Staging region: `us-east-2`
- Current validated staging build: `1a11170`
- Current edge pattern: CloudFront routes static assets from S3 and dynamic API paths to API Gateway, with WAF attached at CloudFront

## Target Production Topology
1. Route 53
   - Production DNS under a Capital ENT controlled domain such as `app.capitalent.com`
2. ACM
   - Public certificate in `us-east-1` for the CloudFront-served domain
3. CloudFront
   - Primary front door for static app plus API path routing
   - Attached CloudFront-scope WAF
4. Private S3 app bucket
   - Origin access control only
   - No public website hosting
5. API Gateway
   - Regional API origin behind CloudFront path behaviors
6. Cognito
   - Separate production user pool and app client
   - MFA required
7. Lambda
   - Separate production functions and IAM roles
8. DynamoDB
   - Separate production patient and intake-token tables
   - PITR enabled
9. Audit / logging
   - CloudTrail, CloudWatch log groups, API access logs, WAF logs, alarm routing

## Recommended Domain Model
- Primary app: `app.capitalent.com`
- Intake surface:
  - Preferred: `app.capitalent.com/intake.html`
  - Optional later split: `intake.capitalent.com` if you want a dedicated patient-facing hostname

## Production Rollout Steps

### 1. Provision Production Stack
- Create a production stack name such as `osa-phenotyper-capital-ent-prod`.
- Use production-only DynamoDB tables, Cognito pool, KMS keys, and audit buckets.
- Do not reuse staging tables, user pools, or app buckets.

### 2. Lock Production Origins
- Restrict `AllowedOrigins` to the real production domain only.
- Keep staging and localhost origins out of the production stack.
- Verify the intake page CSP and `connect-src` point only at the production CloudFront domain.

### 3. Provision Production Identity
- Seed at least:
  - one admin account
  - two clinician accounts
  - one backup admin
- Confirm `osa-admin` and `osa-clinician` memberships.
- Require MFA enrollment before production access is granted.

### 4. Wire DNS And TLS
- Create or delegate the production DNS record in Route 53.
- Request ACM certificate in `us-east-1`.
- Attach certificate to the production CloudFront distribution.
- Validate HSTS and HTTPS-only access.

### 5. Configure Monitoring
- CloudWatch alarms for:
  - Lambda errors
  - API 5xx spikes
  - WAF blocks above baseline
  - Cognito sign-in anomalies
- Define who receives alarm notifications.
- Confirm CloudTrail and API access logs are retained per policy.

### 6. Validate Backup And Recovery
- Confirm DynamoDB PITR is enabled.
- Confirm CloudTrail / audit bucket retention.
- Perform one table restore drill in non-production using the same template settings.
- Document how to rotate a Cognito password or reset MFA if a clinician loses access.

### 7. Publish Production Frontend
- Deploy from a tagged commit, not an untracked local working tree.
- Record:
  - git commit SHA
  - stack name
  - CloudFront distribution ID
  - deployment timestamp
  - runtime footer metadata
- Verify runtime label shows `PRODUCTION`, not `STAGING`.

### 8. Production Acceptance Test
Run this against the real production URL before any live patient:
- clinician sign-in + MFA
- patient create/save/load/search
- report preview
- snapshot save
- trusted manual PDF download
- intake-link generation
- public intake submission
- intake review accept/keep
- archive + restore

## Production Guardrails
- No GitHub Pages usage for the production app.
- No localhost-only origins in production config.
- No clinician access until MFA is verified.
- No patient pilot use until the production runtime label and build metadata are visible in the footer and banner behavior is correct.
- No production deploy without a rollback target commit and named operator.

## Rollback Plan
1. Keep the previous production commit SHA documented before each deploy.
2. Re-run `infrastructure/deploy.sh` from that prior commit if the new build fails acceptance.
3. Invalidate CloudFront after rollback publish.
4. Announce the rollback to pilot staff immediately.
5. Use the clinical fallback workflow until the production acceptance test is green again.

## Operational Owners
- Clinical owner: ENT physician pilot lead
- Technical owner: deployment / AWS owner
- Security owner: account / logging / audit owner
- Support owner: clinician account + MFA reset owner

## Production Readiness Exit Criteria
- [ ] Production stack deployed from a tagged commit
- [ ] Production domain and ACM certificate live
- [ ] Production-only CORS and CSP confirmed
- [ ] MFA enforced for all production clinicians
- [ ] Production smoke checklist passes
- [ ] Rollback owner and procedure documented
- [ ] Audit/log monitoring owner assigned
- [ ] Pilot clinical owner signs off after supervised UAT
