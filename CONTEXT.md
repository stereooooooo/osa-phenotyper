# Current context

## Focus

Prepare a polished, working Precision Sleep Hub demo for an informal Inspire Sleep discussion on 2026-08-13. The demo must show the real patient questionnaire, staff preparation, clinician review, clinician guide PDF, Today's Sleep Plan, Full Sleep Profile, and one candidacy counterexample. No slide deck is needed.

## Current implementation

- Demo mode is available only on localhost with `?demo=inspire`.
- All demo records are synthetic and stored only in browser memory.
- The questionnaire itself is unchanged; demo mode opens it on the same localhost origin with synthetic answers already filled so the presenter can review and submit without completing every field manually. Submission returns through a same-origin, browser-only handoff that works even when the questionnaire tab has no opener, queues the patient-reported answers for Staff Review, and preserves the documented study results.
- Morgan's chart starts with documented moderate WatchPAT results. The questionnaire adds CPAP intolerance and Inspire interest; turbinate hypertrophy is documented on exam. Both clinician and patient outputs name the confirmed next step as drug-induced sleep endoscopy (DISE) plus inferior turbinate reduction during the same anesthetic, while keeping final Inspire candidacy conditional on the DISE findings.
- The four numbered demo steps always reopen Morgan before continuing, so visiting the optional safety counterexample cannot accidentally produce the meeting handouts for the contraindication case.
- The patient reports begin with a plain-language finding and next step before supporting terminology and detail.
- The clinician results and clinician guide begin with a decision-first visit briefing before technical evidence.
- The clinician guide can be previewed in the browser or downloaded.
- The safety counterexample demonstrates that complete concentric collapse blocks unilateral Inspire candidacy.

## Run the demo

```bash
npx serve . -l 3000
```

Open `http://127.0.0.1:3000/index.html?demo=inspire` and follow the four-step guide bar from left to right. The separate safety counterexample is optional.

## Guardrails

- Never use real PHI in demo mode.
- Do not deploy this branch unless Raymond explicitly requests it.
- This polish is presentation-only. Do not modify clinical thresholds, ranking, candidacy, diagnostic routing, or questionnaire content without invoking the clinical evidence gate.
- The deferred non-WatchPAT import should favor local PDF text extraction, deterministic vendor adapters, and local OCR for scanned reports. Every extracted value must be source-linked and verified before use; no PHI may be sent to generative AI.

## Next handoff

The Linear workspace is currently at its two-team plan limit. After Raymond chooses whether to start a trial, upgrade, or make another team slot available, create the dedicated `Precision Sleep` team and `OSA Phenotyper` project from `docs/agents/linear-backlog.md`. Then use observations from the Inspire meeting to prioritize the next usability pass.
