# Issue tracker

## Linear home

- Workspace: `rbrown`
- Team: `Precision Sleep`
- Team key: `OSA`
- Project: `OSA Phenotyper`

Precision Sleep is intentionally separate from Momentum and Substrate. Do not place this product's issues on those teams.

**Setup status, 2026-08-12:** the Linear workspace is at its two-team plan limit, so the new team and project cannot be created without starting a trial, upgrading, or removing an existing team. No billing or destructive account action was authorized. The ready-to-create issue set is preserved in [`linear-backlog.md`](linear-backlog.md).

## Issue shape

Write each issue so a clinician, designer, or engineer can understand the outcome without reading the implementation first.

1. State the user and the friction or clinical risk.
2. Name the intended outcome.
3. Define observable acceptance criteria.
4. Record whether the work changes clinical logic or presentation only.
5. Link the evidence Logic ID, regression scenario, and counterexample for every clinical change.
6. Add privacy and PHI boundaries when source reports or patient data are involved.

## Workflow

- Triage: useful problem, scope not yet committed.
- Backlog: accepted and ready for prioritization.
- In Progress: active implementation or validation.
- In Review: clinician, design, code, or operational review is required.
- Done: acceptance criteria and required regression/evidence gates are complete.
- Canceled: intentionally not pursuing; preserve the reason.

Meeting polish should not silently broaden into deployment. The Inspire demo remains local until Raymond explicitly requests a hosted release.

## Current backlog themes

- Distill the clinical workspace without deleting useful source data.
- Put clinically important, evidence-based decisions before supporting detail.
- Make patient, clinician, and staff workflows self-explanatory.
- Maintain a deterministic synthetic demo from questionnaire through reports.
- Explore privacy-preserving import of non-WatchPAT sleep studies without sending PHI to AI or another external service.
