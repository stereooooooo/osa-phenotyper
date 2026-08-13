# Linear triage labels

## Type labels

Every issue should have exactly one type label.

| Label | Use |
|---|---|
| `bug` | Existing behavior is broken, unsafe, or materially inconsistent with its specification. |
| `feature` | A new user capability or workflow. |
| `improvement` | A clearer, faster, more reliable, or more usable version of existing behavior. |
| `research` | Evidence gathering, workflow discovery, or a technical spike with no committed product behavior. |

## Workflow and risk labels

Add any that materially change review or prioritization.

| Label | Use |
|---|---|
| `meeting-ready` | Required for the next external working demo. |
| `clinical-evidence` | Changes or validates a clinical claim, rule, ranking, or patient instruction. |
| `usability` | Reduces cognitive load, navigation burden, or training requirements. |
| `privacy` | Involves PHI boundaries, data handling, local processing, access, retention, or disclosure. |
| `patient-facing` | Changes the questionnaire, Today's Sleep Plan, or Full Sleep Profile. |
| `clinician-facing` | Changes the visit briefing, clinician guide, or clinical interpretation workspace. |
| `staff-workflow` | Changes chart preparation, intake review, import, verification, or handoff. |

`clinical-evidence` invokes the complete evidence documentation and clinician-review gate. A layout-only issue must explicitly say that it preserves clinical outputs and include parity regression coverage.
