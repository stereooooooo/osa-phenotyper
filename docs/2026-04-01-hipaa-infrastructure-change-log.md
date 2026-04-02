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
