# Clinical Pilot Go-Live Checklist

## Purpose
Use this checklist before the first real patient is entered into the OSA Phenotyper pilot workflow at Capital ENT & Sinus Center.

This is a supervised pilot checklist, not a production sign-off. The tool remains clinical decision support and does not replace physician judgment.

## Pilot Scope
- Pilot environment: `STAGING` / CloudFront-hosted validation surface
- Current validated build: `1a11170`
- Current staging URL: `https://dk259m1syu2bu.cloudfront.net`
- Intended pilot use: physician-supervised clinical testing with limited patient volume and an agreed fallback workflow

## Go / No-Go Gates
- [ ] Latest staging redeploy completed and runtime footer shows the expected build ID.
- [ ] CloudFront sign-in works for at least one clinician and one admin account.
- [ ] MFA is enrolled and verified for every pilot clinician account.
- [ ] Patient save/load/search works on the hosted surface.
- [ ] Patient-report preview works on the hosted surface.
- [ ] Snapshot save works on the hosted surface.
- [ ] One trusted manual `Download PDF` click works on the hosted surface after the latest deploy.
- [ ] One hosted intake-link generation and public intake submission cycle is re-run after the latest deploy.
- [ ] One intake-review accept/keep cycle is re-run after the latest deploy.
- [ ] Pilot staff know the fallback workflow if the app is unavailable.
- [ ] Pilot staff know how to report defects and who owns triage.

## Environment And Access
- [ ] Pilot uses the intended hosted URL only, not GitHub Pages and not an old bookmarked MVP link.
- [ ] Runtime banner clearly reads `STAGING` or the approved pilot label.
- [ ] `osa-admin` and `osa-clinician` group memberships are reviewed and current.
- [ ] No shared clinician logins are used.
- [ ] At least one admin account is available for archive/restore and intake-review escalation.
- [ ] Test accounts are separated from real patient accounts in the pilot plan.

## Clinical Safety Checks
- [ ] The physician understands that unresolved-data guardrails are expected behavior, not bugs to work around.
- [ ] The physician knows where to see provenance and intake-review history before relying on patient-submitted values.
- [ ] The physician knows where to find saved report snapshots.
- [ ] The physician agrees not to use the app as the sole source for final surgical/device decisions when prerequisite workup is still flagged.
- [ ] The physician agrees to document final treatment decisions independently in the chart / EMR.

## Pilot Workflow Rehearsal
- [ ] Create a new hosted patient chart.
- [ ] Save the chart.
- [ ] Reload the chart from the patient list.
- [ ] Generate clinician analysis.
- [ ] Open the patient report preview.
- [ ] Save a report snapshot.
- [ ] Download a PDF manually.
- [ ] Generate an intake link.
- [ ] Submit the intake link from a separate browser session.
- [ ] Review one intake conflict with both `accept-intake` and `keep-chart` decisions.
- [ ] Confirm provenance history updates after review.

## Patient Communication Workflow
- [ ] Intake links are only sent through an approved secure communication channel.
- [ ] Pilot clinicians know that the intake link is single-use and expires after 72 hours.
- [ ] Staff have a standard message for resending or regenerating an expired intake link.
- [ ] Patient-facing PDFs are reviewed before being handed out or uploaded.

## Monitoring And Audit
- [ ] A named owner checks CloudWatch / CloudTrail / API access logs during the pilot window.
- [ ] A named owner checks for WAF false positives during the pilot window.
- [ ] A named owner reviews snapshot persistence and intake-review activity if any pilot issue is reported.
- [ ] A named owner is responsible for account lockout / MFA reset support.

## Fallback Workflow
- [ ] If the app is unavailable, clinicians revert to the standard sleep-medicine workflow and documented clinical judgment.
- [ ] If PDF export fails, clinicians do not delay care; they use the clinician analysis plus manual documentation and retry the PDF later.
- [ ] If intake submission fails, staff can complete the chart manually during the visit.
- [ ] If provenance or intake review looks wrong, clinicians should treat the conflicting field as unresolved and verify it directly with the patient or source study.

## Stop Conditions
Stop the live pilot and revert to fallback workflow if any of these occur:
- [ ] Authentication failure blocks multiple clinicians.
- [ ] Saved charts do not reload reliably.
- [ ] Patient-report snapshots fail to persist.
- [ ] PDF export fails on a real trusted browser click after a fresh deploy.
- [ ] Intake submissions or intake reviews behave inconsistently on real pilot patients.
- [ ] The runtime label is missing or the wrong environment is shown.
- [ ] Any evidence suggests PHI exposure, wrong-patient loading, or corrupted chart persistence.

## Day-Of-Pilot Runbook
1. Confirm the hosted URL and runtime label before the first patient.
2. Log in and verify the clinician account plus MFA.
3. Open one non-patient test chart and verify load/save quickly.
4. Use the app only in supervised physician workflow.
5. Save a snapshot for any patient-facing report that is handed out or used in discussion.
6. Log any defect immediately with the patient MRN removed from the issue text unless the report channel is explicitly secure.
7. Review the pilot issue queue at the end of the day.

## Recommended Pilot Sign-Off
- Pilot clinical owner:
- Pilot technical owner:
- Backup technical owner:
- Date approved for first live patient:
- Notes / exceptions:
