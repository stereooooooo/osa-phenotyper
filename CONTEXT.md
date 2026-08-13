# Current context

## Focus

Prepare a polished, working Precision Sleep Hub demo for an informal Inspire Sleep discussion on 2026-08-13. The demo must show the real patient questionnaire, staff preparation, clinician review, clinician guide PDF, Today's Sleep Plan, Full Sleep Profile, and one candidacy counterexample. No slide deck is needed.

## Current implementation

- Demo mode is available only on localhost with `?demo=inspire`.
- All demo records are synthetic and stored only in browser memory.
- The questionnaire itself is unchanged; demo mode opens it on the same localhost origin with synthetic answers already filled so the presenter can review and submit without completing every field manually. Submission applies answers to empty chart fields and leaves only a deliberate conflicting value for Staff Prep review, matching production intake semantics.
- A synthetic WatchPAT import uses the real review-and-apply modal.
- The patient reports begin with a plain-language finding and next step before supporting terminology and detail.
- The clinician results and clinician guide begin with a decision-first visit briefing before technical evidence.
- The clinician guide can be previewed in the browser or downloaded.
- The safety counterexample demonstrates that complete concentric collapse blocks unilateral Inspire candidacy.

## Run the demo

```bash
npx serve . -l 3000
```

Open `http://127.0.0.1:3000/index.html?demo=inspire` and follow the five-step guide bar from left to right.

## Guardrails

- Never use real PHI in demo mode.
- Do not deploy this branch unless Raymond explicitly requests it.
- This polish is presentation-only. Do not modify clinical thresholds, ranking, candidacy, diagnostic routing, or questionnaire content without invoking the clinical evidence gate.
- The deferred non-WatchPAT import should favor local PDF text extraction, deterministic vendor adapters, and local OCR for scanned reports. Every extracted value must be source-linked and verified before use; no PHI may be sent to generative AI.

## Next handoff

The Linear workspace is currently at its two-team plan limit. After Raymond chooses whether to start a trial, upgrade, or make another team slot available, create the dedicated `Precision Sleep` team and `OSA Phenotyper` project from `docs/agents/linear-backlog.md`. Then use observations from the Inspire meeting to prioritize the next usability pass.
