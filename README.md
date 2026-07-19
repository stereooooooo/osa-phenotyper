# OSA Phenotyper — Clinician Hub with Scoped Patient Intake

This branch is the internal Capital ENT version of the OSA clinical decision-support app. The clinical workspace and patient reports remain clinician-controlled. Its only patient-accessible surface is a narrowly scoped, patient-specific intake questionnaire.

## Security boundary

- Cognito sign-in with mandatory software-token MFA
- Membership in `osa-clinician` or `osa-admin` required for every chart, search, and intake-link-management route
- Patient intake uses a 256-bit random, SHA-256-hashed, single-use token that expires after 72 hours; the intake Lambda cannot search, list, archive, or delete charts
- No patient account, patient portal, reusable report page, or bulk patient endpoint
- No bulk patient roster API; staff must search by name prefix, exact MRN, or exact DOB
- Search responses are limited to 10 charts and never use a DynamoDB table scan
- Individual chart reads and searches produce PHI-free audit events
- CloudFront injects an origin-verification secret, so the API Gateway hostname cannot be used to bypass the edge controls
- DynamoDB and long-retention audit logs use KMS encryption; point-in-time recovery remains enabled

The generated patient report remains available as a PDF. Staff can deliver it through the EHR or another Capital ENT-approved communication process after documenting patient approval. The app itself does not email patients or host patient reports.

For a clinic iPad, staff open a newly generated intake link on the iPad and hand the patient only that questionnaire. Staff must never sign the clinician workspace into a device handed to a patient. After submission, the token is consumed, the URL token is removed, and the completed form is cleared from the browser.

See [docs/clinician-only-architecture.md](docs/clinician-only-architecture.md) for the architecture, operational controls, and production checklist.

## Clinical evidence and future validation

The clinical evidence system is intentionally separate from the software change log:

- [Clinical Evidence Basis and Validation Register](docs/evidence-basis.md) states each core claim,
  evidence level, implementation status, limitation, and candidate validation endpoint.
- [Evidence Citation Library](docs/citations.md) contains the detailed primary sources and explains
  exactly how each source is used.
- [Evidence Review Log](docs/evidence-review-log.md) records literature searches, no-change
  decisions, logic changes, affected rule IDs, commits, and deployed builds.

The app is decision support and has not yet been formally clinically validated. Any research study
should freeze the app build, evidence-register version, output templates, and analysis plan before
enrollment.

## Local development

Serve the repository on localhost and open `index.html`. The project is vanilla JavaScript and has no build step.

```sh
npx serve . -l 3000
```

Run lint and the browser regression suites before deployment:

```sh
npm run lint
bash tests/run-headless-suite.sh
```

## AWS deployment

The CloudFormation stack provisions the private S3/CloudFront application, Cognito, API Gateway, separate clinician and restricted-intake Lambdas, DynamoDB, KMS, WAF, CloudTrail, and CloudWatch resources. The deployment script creates or reuses the CloudFront-to-API origin secret and publishes the clinician application plus the standalone intake page.

```sh
./infrastructure/deploy.sh admin@capitalent.com us-east-2 capital-ent-prod https://osa.example.com
```

Deployment alone does not establish HIPAA compliance. Capital ENT must also complete the documented risk analysis, workforce access procedures, incident response, device controls, backups/restore tests, and vendor/BAA review.
