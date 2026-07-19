# Capital ENT Precision Sleep Clinical Pilot Risk Analysis

**Status:** Technical draft for clinical, privacy/security, and operational review  
**System:** Clinician-only Precision Sleep Hub  
**Intended use:** Limited, physician-supervised pilot with current Capital ENT sleep patients  
**Not included:** Patient login/account, patient portal, hosted patient report, email delivery, billing, prescribing, scheduling, or the official encounter note. A patient-specific, single-use intake questionnaire is included.

This document supports, but does not replace, Capital ENT's organization-wide HIPAA security risk analysis. HHS requires the analysis to cover all electronic PHI the organization creates, receives, maintains, or transmits, including workforce devices and downstream EHR/report-delivery workflows.

Authoritative references:

- [HHS Summary of the HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [HHS Guidance on Risk Analysis](https://www.hhs.gov/hipaa/for-professionals/security/guidance/guidance-risk-analysis/index.html)
- [HHS Guidance on HIPAA and Cloud Computing](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html)
- [AWS HIPAA Eligible Services Reference](https://aws.amazon.com/compliance/hipaa-eligible-services-reference/)
- [AWS Architecting for HIPAA Security and Compliance](https://docs.aws.amazon.com/whitepapers/latest/architecting-hipaa-security-and-compliance-on-aws/architecting-hipaa-security-and-compliance-on-aws.pdf)

## Scope and data flow

```text
Managed Capital ENT device
  -> CloudFront and WAF
  -> Cognito sign-in with mandatory software-token MFA
  -> API Gateway JWT authorization
  -> Lambda origin-secret and role enforcement
  -> KMS-encrypted DynamoDB patient table with PITR

Clinician-reviewed patient PDF
  -> downloaded by authorized staff
  -> uploaded through the existing EHR workflow
```

The app stores patient identifiers, structured sleep-history and exam inputs, sleep-study values, generated report snapshots, provenance, and limited structured follow-up checkpoints. The EHR remains the legal record for notes, orders, prescriptions, scheduling, billing, and patient communication.

## Technical inventory

| Component | Purpose | PHI posture |
|---|---|---|
| Private S3 and CloudFront | Clinician web application | Static code only; bucket blocks public access |
| AWS WAF | Edge filtering and rate limiting | Aggregate request metadata only |
| Cognito | Individual workforce authentication and MFA | Workforce identity, no patient clinical data |
| API Gateway | Authorized patient API | No request bodies in access logs |
| Lambda | Validation, role checks, bounded patient operations | Processes PHI in memory; application logs must not contain PHI |
| DynamoDB | Patient chart and report snapshots | Customer-managed KMS encryption, PITR, retained on stack deletion |
| CloudWatch | Lambda/API logs, metrics, alarms | Structured operational events; no patient content or search values |
| CloudTrail and encrypted S3 | AWS management and DynamoDB data-event audit | Resource and access metadata; seven-year configured retention |
| SNS | Operational alarm notification | Alarm/resource names and aggregate counts only; no PHI |

All browser libraries, fonts, and PDF workers are fixed-version same-origin assets. Public CDNs are not permitted by the clinician application's content security policy.

## Risk register

Likelihood and impact are qualitative pilot estimates and must be reviewed by Capital ENT's designated security official.

| Risk | Inherent likelihood / impact | Existing or planned safeguards | Residual risk / required action |
|---|---|---|---|
| Stolen workforce password | Medium / High | Individual accounts, 12-character complex passwords, mandatory MFA, 15-minute tokens, one-day refresh token | Low-Medium. Test MFA reset and prompt account disablement; review users quarterly. |
| Malicious or compromised authorized account | Low-Medium / High | Role groups, bounded search, no roster/list route, result limit 10, no DynamoDB Scan permission, record-view/search audit events | Medium. Named owner reviews access/audit events and removes unnecessary admin access. |
| Direct API or edge bypass | Medium / High | CloudFront-injected origin secret, JWT authorizer, Lambda origin verification, group authorization, CORS restriction, WAF, API throttling | Low. Verify direct API hostname returns 403 and unauthenticated CloudFront API calls return 401/403 after each deployment. |
| Third-party browser code compromise | Low-Medium / High | Fixed dependencies are self-hosted from the private app origin; CSP disallows public script/style/font CDNs | Low. Treat dependency updates as controlled releases and review upstream security notices. |
| Large-scale patient enumeration/exfiltration | Medium / High | No bulk endpoint, exact/prefix bounded search only, maximum 10 results, no Scan IAM permission, WAF and volume alarms | Low-Medium. Confirm search constraints and alarms during acceptance testing. |
| Stolen or reused patient intake link | Medium / Medium | 256-bit random token, SHA-256 hash at rest, 72-hour expiry, five-attempt lockout, single-use transactional consumption, no chart/list route, CloudFront origin verification, WAF rate limit | Low-Medium. Train staff to generate links only for the correct open chart and revoke unused links. |
| Residual questionnaire data on a handed clinic iPad | Medium / Medium | Token removed from URL and form controls cleared immediately after successful submission; used token cannot reopen intake | Low. Use managed iPads with screen lock and a staff hand-back/reset procedure. |
| Wrong-patient selection or data entry | Medium / High | Exact MRN/DOB/name search, identity fields visible, optimistic concurrency, provenance, immutable report snapshots | Medium. Workflow requires two identifiers before editing or exporting; stop pilot on any wrong-chart event. |
| Lost, stolen, or unmanaged endpoint | Medium / High | Application MFA and no local app database | Medium-High until Capital ENT attests managed-device encryption, screen lock, patching, endpoint protection, remote wipe, and approved remote access. |
| PHI exposed through logs or alerts | Low-Medium / High | API logs exclude bodies and authorization headers; search audit excludes search text; SNS alarms contain only aggregate operational metadata | Low. Verify sample logs before first PHI and after material code changes. |
| Data corruption or deletion | Low / High | KMS encryption, DynamoDB PITR, retained table on stack deletion, version checks | Low-Medium. Complete and document a synthetic restore drill before first PHI. |
| Application or AWS outage | Medium / Medium-High | Serverless multi-AZ managed services; EHR remains system of record | Low-Medium. Train downtime fallback and do not delay care because the hub or PDF export is unavailable. |
| Patient report sent through an unapproved channel | Medium / High | App does not store delivery addresses or send reports; EHR is the default delivery path | Medium. Written policy and staff training remain required; ordinary email is not the default. |
| Clinical recommendation is incomplete or misapplied | Medium / High | Decision-support labeling, missing-data guardrails, clinician-only detailed report, editable patient report, clinician review before export | Medium. Physician remains responsible for final decision and EHR documentation; stop on material logic defect. |
| Audit/monitoring failure goes unnoticed | Medium / High | CloudTrail data events, long-retention logs, authorization/Lambda/API/volume/WAF alarms | Low-Medium after email subscriptions are confirmed and a test alert plus audit retrieval are documented. |
| Configuration drift or wrong environment | Medium / High | Separate stack/table/pool, visible `CLINICAL PILOT` banner, build ID, versioned assets, deployment record | Low. Verify URL, label, build, resource names, and empty/synthetic table before approval. |

## Required administrative and physical decisions

The following cannot be completed by application code and remain go-live blockers until a named Capital ENT owner signs them:

- Confirm the active AWS BAA applies to the account used for the pilot and retain evidence in the compliance file.
- Designate the HIPAA security official and pilot privacy/security reviewer.
- Approve the limited pilot purpose, cohort size, users, retention, EHR delivery path, and downtime workflow.
- Attest that every pilot device and remote-access path meets Capital ENT security policy.
- Approve workforce onboarding, quarterly access review, termination/offboarding, MFA reset, and incident-reporting procedures.
- Confirm breach assessment and notification procedures include this application.
- Decide whether a third-party penetration test is required before the limited pilot or before broader production launch, and document the rationale.

## Technical acceptance evidence required before PHI

- Separate pilot stack, Cognito pool, DynamoDB table, KMS key, logs, WAF, and CloudFront distribution.
- Runtime label is `CLINICAL PILOT` and build matches the approved commit.
- Only intended same-origin static assets are published. The standalone intake page and `/intake/{token}` route are present; no patient portal or hosted-report route exists.
- Intake tokens are single-use, expire as configured, can be revoked, and cannot retrieve a patient roster or report.
- MFA verified for every account; group membership and admin scope reviewed.
- Direct API bypass, unauthenticated access, CORS, search-bound, and role restrictions tested.
- Operational email subscriptions confirmed and a PHI-free test alarm received.
- Synthetic create/search/save/reload/report/snapshot/follow-up/archive/restore rehearsal completed.
- DynamoDB PITR restore drill and CloudTrail/CloudWatch audit retrieval completed with synthetic data.
- EHR report upload and downtime fallback rehearsed.

## Preliminary determination

The technical architecture is suitable for a limited clinician-only pilot once the outstanding operational evidence and Capital ENT approvals above are completed. It must not be described as zero-risk or as automatically HIPAA compliant merely because it runs on HIPAA-eligible AWS services under a BAA.

## Sign-off

- Clinical owner: ____________________  Date: __________
- Security/privacy owner: ____________________  Date: __________
- Technical owner: ____________________  Date: __________
- Approved first-PHI date: __________
- Exceptions and compensating controls: ______________________________________
