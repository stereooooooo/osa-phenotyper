# OSA Phenotyper — Clinician-Only Edition

This branch is the internal Capital ENT version of the OSA clinical decision-support app. It preserves the full phenotyping, recommendation, chart, and patient-report workflow while removing every patient-accessible web surface.

## Security boundary

- Cognito sign-in with mandatory software-token MFA
- Membership in `osa-clinician` or `osa-admin` required for every API route
- No public intake, magic-link, or patient-portal endpoints
- No bulk patient roster API; staff must search by name prefix, exact MRN, or exact DOB
- Search responses are limited to 10 charts and never use a DynamoDB table scan
- Individual chart reads and searches produce PHI-free audit events
- CloudFront injects an origin-verification secret, so the API Gateway hostname cannot be used to bypass the edge controls
- DynamoDB and long-retention audit logs use KMS encryption; point-in-time recovery remains enabled

The generated patient report remains available as a PDF. Staff can deliver it through the EHR or another Capital ENT-approved communication process after documenting patient approval. The app itself does not email patients.

See [docs/clinician-only-architecture.md](docs/clinician-only-architecture.md) for the architecture, operational controls, and production checklist.

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

The CloudFormation stack provisions the private S3/CloudFront application, Cognito, API Gateway, Lambda, DynamoDB, KMS, WAF, CloudTrail, and CloudWatch resources. The deployment script creates or reuses the CloudFront-to-API origin secret and publishes only the clinician application.

```sh
./infrastructure/deploy.sh admin@capitalent.com us-east-2 capital-ent-prod https://osa.example.com
```

Deployment alone does not establish HIPAA compliance. Capital ENT must also complete the documented risk analysis, workforce access procedures, incident response, device controls, backups/restore tests, and vendor/BAA review.
