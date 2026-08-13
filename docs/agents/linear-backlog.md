# Linear backlog ready for import

Create these under the dedicated `Precision Sleep` team and `OSA Phenotyper` project after the workspace plan permits another team.

## Completed on the meeting branch

### Build the synthetic questionnaire-to-report demo journey

- Type: `feature`
- Labels: `meeting-ready`, `patient-facing`, `staff-workflow`, `clinician-facing`, `privacy`
- Outcome: demonstrate the real questionnaire, staff verification, clinician review, both patient reports, and clinician guide without PHI or a deployment dependency.
- Acceptance: localhost-only `?demo=inspire`; synthetic browser-memory data; real intake form; documented moderate WatchPAT fixture; DISE-first Inspire pathway with secondary turbinate reduction; candidacy counterexample; automated smoke coverage.

### Distill the patient-report opening hierarchy

- Type: `improvement`
- Labels: `meeting-ready`, `usability`, `patient-facing`
- Outcome: patients see the main finding and next step before terminology and supporting detail without removing existing education.
- Acceptance: plain-language orientation precedes the terminology guide; no unexplained acronyms appear there; full and concise reports retain their existing clinical content; parity and PDF tests pass.

### Put treatment priorities first in the clinician guide

- Type: `improvement`
- Labels: `meeting-ready`, `usability`, `clinician-facing`
- Outcome: clinicians encounter safety signals, missing information, ranked actions, and guardrails before supporting technical evidence.
- Acceptance: decision-first briefing appears before supporting evidence; complete detail remains available; clinician PDF supports browser preview and download; pagination regression passes.

### Demonstrate an Inspire candidacy safety counterexample

- Type: `improvement`
- Labels: `meeting-ready`, `clinician-facing`, `clinical-evidence`
- Outcome: show that the tool promotes important negative candidacy information rather than merely generating favorable recommendations.
- Acceptance: the synthetic complete-concentric-collapse chart exercises the existing unilateral Inspire guardrail; no eligibility rule changes; existing clinical matrix remains green.

## Backlog

### Import non-WatchPAT home sleep-study reports without exposing PHI to AI

- Type: `research`
- Labels: `privacy`, `staff-workflow`, `clinical-evidence`
- Outcome: reduce manual transcription for outside sleep studies while keeping source documents on the local device and every extracted value reviewable.
- Explore: local PDF text extraction; deterministic vendor-specific adapters; local OCR for scanned reports; per-value source highlighting and confidence; required human verification before chart use.
- Exclude: generative-AI upload, cloud OCR without an approved HIPAA architecture and BAA, silent inference of missing fields, or direct recommendation changes from unverified values.
- Exit criteria: representative deidentified format inventory, field schema, threat model, extraction benchmark, failure modes, and a clinician-approved verification prototype.

### Observe and simplify staff and clinician workflows after the demo

- Type: `research`
- Labels: `usability`, `staff-workflow`, `clinician-facing`
- Outcome: identify the next highest-value reductions in navigation burden and training time using observed tasks rather than adding another global redesign.
- Acceptance: capture role, task, hesitation, redundant step, safety relevance, and proposed progressive-disclosure change; prioritize without deleting source data; separate presentation work from clinical-logic changes.
