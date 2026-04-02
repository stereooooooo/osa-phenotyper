# 2026-04-01 HIPAA & Infrastructure Change Log

## Purpose
Track HIPAA-compliance and infrastructure/security fixes made after the audit, including why each change was necessary.

## Changes

### `infrastructure/template.yaml`
- Added explicit `AllowedOrigins`, `AdminGroupName`, and `ClinicianGroupName` parameters.
Why: wildcard CORS and implicit role assumptions were too permissive for a production clinical app.

- Changed Cognito MFA from optional to required and added Cognito groups plus initial admin-group attachment.
Why: clinician accounts should require MFA, and API access should be gated by explicit role membership instead of any valid JWT.

- Added KMS coverage for Lambda log groups, API Gateway access logs, CloudTrail, and the audit-log S3 bucket.
Why: the previous stack encrypted DynamoDB with KMS but left other audit/logging stores on weaker or inconsistent defaults.

- Enabled HTTP API access logs and detailed metrics on the default stage.
Why: the prior stack had no API Gateway access-log trail, leaving a major audit gap.

- Expanded CloudTrail to include management events, global service events, and multi-region trail behavior.
Why: DynamoDB data-plane logging alone was not a complete audit record for a HIPAA review.

- Retained the patient, token, and audit-log data stores on stack teardown/replacement, and kept the intake Web ACL resource defined in infrastructure.
Why: audit-critical stores should survive stack churn, and the WAF policy itself is still part of the intended edge-security design.

- Removed unnecessary `DeleteItem` permissions from the main Lambda role.
Why: the backend now archives records instead of hard-deleting them, so the broader IAM action was no longer justified.

- Added an explicit dependency from the initial admin group attachment to both the admin user and admin group resources.
Why: a real CloudFormation staging deploy exposed a race where `AWS::Cognito::UserPoolUserToGroupAttachment` could execute before the seeded admin user existed, causing the entire stack creation to roll back.

- Removed the direct `AWS::WAFv2::WebACLAssociation` from the HTTP API stage.
Why: live AWS deployment validation showed that the current API Gateway v2 HTTP API stage ARN is not a supported WAF association target. The app can now deploy for staging/testing, but full WAF enforcement will require a different front door design such as API Gateway REST or CloudFront.

### `infrastructure/lambda/index.mjs`
- Replaced wildcard origin handling with origin allow-list reflection plus stricter response headers (`no-store`, HSTS, `nosniff`).
Why: the previous API would respond to any browser origin and did not explicitly harden cache/transport behavior.

- Added Cognito-group RBAC checks on all clinician routes, with archive restricted to the admin group.
Why: authentication alone is not adequate access control for patient CRUD and token-management operations.

- Hardened Cognito group parsing to accept JSON-array strings as well as native arrays / comma-delimited strings.
Why: live staging testing showed API Gateway JWT claims can present `cognito:groups` as a serialized JSON array, which caused valid admin users to be rejected with `403 Forbidden`.

- Added a Cognito `AdminListGroupsForUser` fallback when JWT group claims are absent from the API Gateway event.
Why: live staging validation still produced authenticated requests with missing group claims, so the clinician API now resolves RBAC from the user pool directly when necessary instead of denying valid users.

- Normalized bracketed / quoted group tokens (for example `[osa-admin]`) before RBAC comparison.
Why: staging validation indicated that API Gateway can pass group claims in a wrapper format that is neither a native array nor valid JSON, so simple comma splitting still left authorized users blocked.

- Removed raw error-message logging from the top-level Lambda catch path.
Why: generic error-type logging reduces the chance of PHI or token details leaking through exception messages.

### `infrastructure/lambda/intake.mjs`
- Replaced wildcard origin handling with the same allow-list reflection and stricter no-cache/security headers used by the clinician API.
Why: the public intake endpoint should be origin-restricted and resistant to browser caching just like the authenticated API.

- Preserved the generic error posture while keeping the archived-patient and transaction-conflict protections from the previous pass.
Why: the intake endpoint still needs to avoid information leakage even as security enforcement gets tighter.

### `js/auth.js`
- Added Cognito claim/group helpers and a full software-token MFA setup flow (`MFA_SETUP`) in addition to the existing TOTP challenge flow.
Why: once MFA is required at the user-pool level, the first-login onboarding path must support authenticator setup instead of only code verification.

- Fixed idle-timeout listener cleanup so repeat sign-in/sign-out cycles do not accumulate multiple document-level listeners.
Why: repeated auth cycles should not leave stale global listeners behind.

### `index.html`
- Added an MFA setup screen and wired login/new-password flows to branch into TOTP enrollment when Cognito requires it.
Why: the clinician app needs a usable first-login path after MFA is enforced.

- Added client-side admin-group awareness and hid the archive action for non-admin users.
Why: archive is now server-enforced as admin-only, and the UI should not advertise controls that the user cannot use.

### `intake.html`
- Removed the committed production API default and added an explicit “page not configured” failure state when `data-api-url` is blank.
Why: a fresh checkout should not point the public intake page at production AWS by default.

- Tightened the committed CSP default to same-origin `connect-src`.
Why: the source tree should default to the safest posture, with deploy-time environment wiring adding the actual API origin.

### `js/aws-config.js`
- Replaced committed production Cognito/API values with safe blank defaults.
Why: local development and source control should not default to production infrastructure endpoints.

### `infrastructure/deploy.sh`
- Made allowed origins an explicit deployment input and passed them through to CloudFormation.
Why: CORS origin control should be an intentional deployment decision, not a wildcard default.

- Added generation of Cognito group names in `js/aws-config.js` and deploy-time patching of `intake.html` for API URL + CSP `connect-src`.
Why: runtime files now need environment-specific origin and group context, but the committed source should stay production-neutral.

- Removed the best-effort WAF association step and updated the operator guidance to include MFA setup on first sign-in.
Why: WAF association is now declarative, and the deploy instructions need to match the new auth requirements.

### `docs/test-matrix.md`
- Added Group 11 HIPAA/infrastructure regression cases.
Why: the matrix previously covered clinical logic, reporting, and intake integrity but not core security/compliance behavior.

## Verification
- `node --check infrastructure/lambda/index.mjs`
- `node --check infrastructure/lambda/intake.mjs`
- `node --check js/auth.js`
- Inline script syntax parse for `index.html` and `intake.html`
- `bash -n infrastructure/deploy.sh`
- Live CloudFormation failure inspection in AWS (`AdminUserGroupAttachment` attempted before `AdminUser` existed)

## Remaining Follow-Up
- CloudFormation deployment validation against a real AWS account to confirm the new KMS key policy, API access logs, and CloudTrail settings all apply cleanly.
- First-login MFA bootstrap test against the real Cognito user pool to confirm the `MFA_SETUP` callback behavior matches the deployed library/runtime combination.
- Decide whether archive/restore should get a dedicated admin-only UI instead of the current one-way archive action.
- Reintroduce WAF protection through a supported edge layer for the intake/API surface, likely by moving to API Gateway REST or fronting the app/API with CloudFront.

## April 2, 2026 Follow-Up

### `infrastructure/lambda/index.mjs`
- Added an exact full-name lookup on the existing `name-index` before falling back to the slower `contains(nameLower, :q)` scan path.
Why: the original patient search ignored the existing `name-index` entirely. This does not fix partial-name scalability, but it removes unnecessary full-table scans for exact full-name searches while a broader search redesign remains pending.

### `infrastructure/template.yaml`
- Replaced inline placeholder Lambda `ZipFile` stubs with packageable `lambda/` source paths for both Lambda functions.
Why: the stack should reference the actual application code instead of creating placeholder Lambdas that must be mutated afterward, and the packaged deploy path needs real zip archives instead of raw single-file uploads.

### `infrastructure/deploy.sh`
- Reworked deployment to create/reuse an artifact bucket, run `aws cloudformation package`, and deploy the packaged template instead of calling `aws lambda update-function-code` after stack creation.
Why: the old flow left the deployed stack in a partially real / partially placeholder state until a second imperative patch step completed. Packaging real Lambda artifacts into the CloudFormation deploy path closes that audit gap and makes deployments more reproducible.

### `infrastructure/template.yaml`
- Added a `name-prefix-index` GSI on `nameSearchBucket + nameLower`.
Why: exact-name lookups alone still left common last-name prefix searches falling back to a table scan. The new index gives the app a scalable prefix path before the broad fallback scan.

### `infrastructure/lambda/index.mjs`
- Added `nameSearchBucket` persistence on patient create/update and routed prefix searches through the new `name-prefix-index` before the legacy `contains(nameLower, :q)` scan.
Why: the audit item was not fully closed while partial searches still depended on a full scan. This keeps the old fallback for compatibility, but makes normal chart search substantially less expensive for new and updated records.

### `infrastructure/backfill-name-search-bucket.sh`
- Added an operator backfill script to populate `nameSearchBucket` and normalized `nameLower` on existing patient rows after the new prefix-search index is deployed.
Why: new and edited rows will pick up the prefix index automatically, but older rows otherwise would not benefit until they happened to be touched again.

## April 2, 2026 CloudFront + WAF Front-Door Pass

### `infrastructure/template.yaml`
- Added a private `WebAppBucket`, CloudFront origin access control, CloudFront distribution, and API cache/origin-request policies so the static clinician app and intake page can be served through CloudFront while `/patients*`, `/intake-tokens*`, and `/intake/*` route to API Gateway.
Why: the audited app needed a real AWS-hosted front door instead of relying on a local server or an outdated GitHub Pages demo, and the WAF story needed a supported edge layer rather than an unsupported HTTP API attachment.

- Replaced the old unused regional WAF resource with a `CloudFrontWebAclArn` parameter and CloudFront `WebACLId` attachment point.
Why: CloudFront-scoped WAFs must live in `us-east-1`, so the stack needed a clean way to accept the edge WAF ARN while keeping the application infrastructure in the clinic region.

### `infrastructure/deploy.sh`
- Added deploy-time creation/update of a CloudFront-scoped WAF in `us-east-1`, scoped its rules down to the dynamic API paths, and passed that ARN into the main stack deploy.
Why: the original rate-limit rules were appropriate for intake/API endpoints but would have been too aggressive for every static asset on the site. Scoping the WAF to API paths preserves protection without throttling normal page loads.

- Added static-site publishing to the private app bucket and CloudFront invalidation after deploy.
Why: CloudFront hosting is only real once the static app actually gets uploaded to the origin and invalidated at the edge.

- Changed generated runtime config and intake runtime wiring to use the CloudFront app URL instead of the direct API Gateway URL.
Why: the browser should go through the supported edge layer by default so WAF and CloudFront behaviors actually protect the live app.

## Verification
- `bash -n infrastructure/deploy.sh`
- `aws cloudformation validate-template --template-body file://infrastructure/template.yaml --region us-east-2`

## Remaining Follow-Up
- Run one real staging deploy through the new CloudFront/WAF path and confirm:
  - WAF create/update succeeds in `us-east-1`
  - CloudFront associates with the provided WAF ARN
  - static asset publishing and invalidation succeed
  - the hosted app works through the CloudFront URL for sign-in, CRUD, intake, and report export

## April 2, 2026 Live CloudFront Staging Deploy

### `infrastructure/deploy.sh`
- Shortened and normalized the generated artifact-bucket name.
Why: the first live packaged deploy failed because the generated S3 artifact bucket name exceeded AWS naming limits.

- Added `--cli-binary-format raw-in-base64-out` to CloudFront WAF create/update calls and simplified the generated WAF description text.
Why: the first live WAF create/update attempts failed because the CLI treated JSON `SearchString` fields as binary without the raw mode flag, and the original description string violated the WAF description regex.

- Added `RuleActionOverride`s that downgrade `AWSManagedRulesCommonRuleSet` `SizeRestrictions_BODY` and `CrossSiteScripting_BODY` from block to count for the CloudFront API-path WAF.
Why: clinician report snapshots send legitimate patient-report HTML in authenticated `PUT /patients/:id` requests, and the managed body-size plus HTML/XSS body rules were falsely blocking those saves at the edge before the request could ever reach the Lambda/API layer.

### `infrastructure/template.yaml`
- Removed the explicit `WebAppBucket` name.
Why: repeated rollback retries were leaving retained app buckets behind, which made redeployments fragile and increased the chance of bucket-name collisions during cleanup.

- Replaced the custom no-cache API cache policy with AWS managed CloudFront policy `CachingDisabled`.
Why: live CloudFront deployment rejected the custom zero-TTL cache policy combinations during staging retries. Using the AWS-managed no-cache policy is simpler and matches the intent of the API path behaviors.

- Switched both Lambda `Code` definitions from individual `.mjs` files to the packageable `lambda/` directory.
Why: `aws cloudformation package` uploaded the single-file paths as raw objects, which caused live Lambda updates to fail with `Could not unzip uploaded file`.

### `infrastructure/backfill-name-search-bucket.sh`
- Ran the staging name-search metadata backfill against `osa-patients-capital-ent-stg-20260401b`.
Why: the upgraded staging stack already had existing patient rows, and they needed `nameSearchBucket` populated before the new prefix-search path would work for older charts.

## Verification
- `aws cloudformation validate-template --template-body file://infrastructure/template.yaml --region us-east-2`
- `aws cloudformation package --template-file infrastructure/template.yaml --s3-bucket osa-artifacts-capital-ent-stg-420551259537-us-east-2 --output-template-file /tmp/osa-phenotyper-package-check.yaml --region us-east-2`
- Live staging deploy succeeded through `./infrastructure/deploy.sh raymondbrown@gmail.com us-east-2 capital-ent-stg-20260401b http://127.0.0.1:3000,http://localhost:3000`
- CloudFront distribution created: `E1D4NMECBXWVX3`
- App URL serving audited app: `https://dk259m1syu2bu.cloudfront.net`
- `curl -sL https://dk259m1syu2bu.cloudfront.net/patients` returned `{"message":"Unauthorized"}` via the CloudFront API path
- `curl -sL https://dk259m1syu2bu.cloudfront.net/js/aws-config.js` confirmed runtime `apiUrl` points to the CloudFront URL
- `curl -sL https://dk259m1syu2bu.cloudfront.net/intake.html` confirmed `data-api-url` and CSP `connect-src` include the CloudFront URL
- `./infrastructure/backfill-name-search-bucket.sh osa-patients-capital-ent-stg-20260401b us-east-2`
- Direct DynamoDB verification confirmed `nameSearchBucket` was populated on the six existing staging rows

## Remaining Follow-Up
- Run a browser-level clinician sign-in and CRUD pass through `https://dk259m1syu2bu.cloudfront.net` now that the CloudFront front door is live.
- Re-run the patient intake and report-export staging checks through the CloudFront-hosted app surface rather than the prior localhost-hosted frontend.
- Hosted snapshot persistence has now been reverified successfully after the WAF body-rule override expansion.

## April 2, 2026 Pilot-Readiness Deploy Validation

### `docs/test-matrix-results.md`
- Recorded the hosted CloudFront smoke pass against build `1a11170`, including:
  - runtime/footer label confirmation
  - hosted sign-in with MFA
  - hosted save/load/search
  - hosted clinician analysis
  - hosted patient-report preview
  - hosted snapshot persistence with DynamoDB confirmation
- Why: once the app moved from audit remediation into pilot preparation, the most important remaining proof was that the real hosted surface worked on the exact build that would be shown to clinicians.

### `docs/pilot-go-live-checklist.md`
- Added a concrete pre-patient pilot checklist covering hosted smoke gates, access, fallback workflow, stop conditions, and day-of-pilot operations.
- Why: a tool can be technically improved yet still not be operationally safe to put in front of patients. The clinic needed a concrete go/no-go checklist, not just code-level changes.

### `docs/production-hosting-plan.md`
- Added a production-hosting plan covering the target CloudFront/WAF/S3/API/Cognito topology, domain/TLS work, production rollout steps, monitoring, recovery, and rollback.
- Why: staging validation is not the same as production readiness. The remaining work needed to be written down as an execution plan instead of staying implicit in prior audit notes.
