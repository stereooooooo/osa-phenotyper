# Product vocabulary

Use these terms consistently in the app, documentation, and Linear.

| Term | Meaning |
|---|---|
| Precision Sleep Hub | The clinician-controlled OSA care product as a whole. |
| Clinical workspace | The staff and clinician interface for finding a chart, preparing data, reviewing results, and generating reports. |
| Patient questionnaire | The patient-facing intake experience reached through a time-limited magic link. Do not call it a patient portal. |
| Visit briefing | The decision-first clinician summary: safety signals, missing information, ranked plan, and guardrails. |
| Clinician guide | The detailed clinician-facing PDF containing the visit briefing and supporting evidence. |
| Today's Sleep Plan | The concise patient action plan for the current visit. |
| Full Sleep Profile | The comprehensive patient report with results, contributors, treatment context, and education. |
| Demo mode | A localhost-only, synthetic-data, browser-memory workflow activated by `?demo=inspire`. |
| Staff prep | Review and verification of patient-submitted answers and imported study values before clinician interpretation. |
| Clinical logic | Any rule, threshold, signal strength, diagnosis, ranking, candidacy, safety behavior, routing, or patient instruction that can affect care. |
| Presentation-only change | A hierarchy, layout, navigation, or rendering change that preserves clinical inputs and outputs. |

## Product boundaries

- The EHR remains the legal medical record and owns orders, prescriptions, scheduling, billing, and narrative documentation.
- Patient submissions never directly alter clinical recommendations before staff or clinician review.
- Demo mode must never accept or retain real PHI.
- Source-report automation must expose extracted values for human verification and must not silently infer missing clinical data.
