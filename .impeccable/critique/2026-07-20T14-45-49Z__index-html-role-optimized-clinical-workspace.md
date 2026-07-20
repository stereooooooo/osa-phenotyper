---
target: index.html role-optimized clinical workspace
total_score: 24
p0_count: 0
p1_count: 4
timestamp: 2026-07-20T14-45-49Z
slug: index-html-role-optimized-clinical-workspace
---
# Role-Optimized Clinical Workspace Critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Strong pilot, save, preparation, suggestion, and report feedback, but no persistent dirty state or focused edit status. |
| 2 | Match System / Real World | 3 | Clinical language and visit structure are strong; MA Prep still exposes several clinician-owned judgments. |
| 3 | User Control and Freedom | 2 | Views and collapsible sections help, but Edit data silently enters Full Chart with no local return path. |
| 4 | Consistency and Standards | 3 | Cohesive controls and predictable cards, with some conflicting meanings for complete, prepared, and not documented. |
| 5 | Error Prevention | 2 | Validation and clinician confirmation are strong; false completion states and reports from unsaved changes create avoidable risk. |
| 6 | Recognition Rather Than Recall | 3 | The briefing and suggestions reduce recall until editing removes the briefing context. |
| 7 | Flexibility and Efficiency | 2 | Imports and role views accelerate work, but there are no shortcuts, jump-to-next-incomplete, sticky completion actions, or focused correction path. |
| 8 | Aesthetic and Minimalist Design | 2 | Clinician Review is focused; MA Prep and Full Chart remain repetitive and dense. |
| 9 | Error Recovery | 2 | Conflict handling preserves data, but interruption recovery, unsaved-change warning, and draft restoration are absent. |
| 10 | Help and Documentation | 2 | Inline notes exist, but role-specific completion guidance and sign-in help are limited. |
| **Total** |  | **24/40** | **Acceptable, with significant workflow improvements needed** |

## Anti-Patterns Verdict

### LLM assessment

The product does not immediately look like generic AI healthcare software. The restrained Capital ENT palette, explicit pilot boundary, cautious clinical language, provenance, source verification, and clinician confirmation feel deliberate. The residual product slop is structural: repeated Bootstrap cards, identical icon and crimson-underline headers, tiny uppercase labels, and a long administrative form rhythm that gives unlike tasks equal visual weight.

### Deterministic scan

The bundled detector returned one `em-dash-overuse` warning for `index.html`. It is a false positive: the counted 25 glyphs are empty-choice sentinels in select menus rather than prose cadence. No actionable AI-pattern finding remained. The detector did not catch the programmatic-label failures found in browser inspection.

### Visual overlay

Mutable script injection was unavailable in the selected browser binding, so no reliable user-visible overlay was created. Browser evidence came from the deployed sign-in surface plus the exact build in browser-memory workflow mode.

## Overall Impression

Clinician Review is a meaningful improvement. It cuts the working surface roughly in half and produces a useful clinical briefing. The largest remaining opportunity is to turn the three views into a true handoff workflow. Today, MA Prep does not have a trustworthy definition of done, and a clinician correction falls back into the densest possible Full Chart experience.

## What Is Working

1. Clinician Review reduced the measured surface from about 3.7 viewports in Full Chart to about 1.8 viewports while preserving demographics, questionnaire scores, study findings, treatment history, and unresolved items.
2. PAP and DISE are contextually surfaced instead of permanently occupying the clinician workflow.
3. Plan suggestions reduce eleven pathways to a small explained draft, preserve clinician editing, and require explicit confirmation.

## Cognitive Load

Five of eight checklist items fail, which is high cognitive load overall.

- Single focus: passes in Clinician Review, weaker in MA Prep.
- Chunking: fails because MA Prep exposes large milestones, history, safety, and study groups together.
- Grouping: passes; related controls are generally colocated.
- Visual hierarchy: passes in Clinician Review, weaker in Prep.
- One thing at a time: fails because Prep mixes import, verification, interpretation, milestone maintenance, and save.
- Minimal choices: fails with 14 milestones, 11 plan pathways, and large treatment and metric sets.
- Working memory: fails when Edit data removes the briefing context.
- Progressive disclosure: fails in Prep even though PAP and DISE are contextual in Clinician Review.

Measured at a 1452 by 940 viewport:

- Clinician Review: about 1,679 pixels, 1.79 viewports, 39 visible controls.
- MA / Nurse Prep: about 2,691 pixels, 2.86 viewports, 125 visible controls and 126 tab stops.
- Full Chart after a targeted edit: about 3,503 pixels, 3.73 viewports, 158 visible controls.

## Priority Issues

### [P1] Readiness and handoff states are not trustworthy

The MA progress rail marks a section complete when any tracked field has a value. A sparse chart can therefore show every Prep step as complete. The clinician briefing can say Prepared for review while also displaying undocumented treatment preferences, PAP history, compliance data, cardiovascular history, and study domains. Expected clinician work such as confirming today's plan is counted as an unresolved preparation item.

**Fix:** Build one shared tri-state readiness model: Not started, In progress, Ready for review. Define section-specific minimum and required sets; show missing-item counts; distinguish Verified none from Not documented; separate MA prep needs, clinician decisions, and optional or deferred items. Add an explicit Ready for clinician review handoff with preparer and timestamp.

### [P1] Focused clinician corrections become a Full Chart detour

The tested Edit data action silently changed the workspace to Full Chart, landed more than 2,000 pixels down, left the workspace toolbar roughly two viewports above, and provided no return control. The clinician must remember the clinical question while navigating a 158-control surface.

**Fix:** Use a focused inline editor or side panel for the selected source module. If Full Chart remains necessary, add a sticky context bar naming the edit and providing Save and return to Clinician Review, restore prior scroll and focus, and announce the workspace change.

### [P1] Core controls lack reliable programmatic labels

Browser inspection found 38 of 103 rendered MA inputs, selects, and textareas without a standard programmatic name, plus unlabeled Tonsil Size, FTP, and Retrognathia controls in Clinician Review. Anonymous numeric sleep-study inputs slow and endanger keyboard, screen-reader, and voice-control use. Several small muted text combinations also fall below 4.5 to 1 contrast.

**Fix:** Give every control a stable ID and bound label, add explicit accessible names to icon-only buttons, raise tiny labels to a legible size and contrast, manage focus after view changes and report generation, and add a zero-unlabeled-control regression gate.

### [P1] Interruption recovery and chart/report persistence are unclear

MA Save sits at the bottom of a three-viewport surface. The Saved confirmation lasts two seconds, while the durable timestamp is offscreen near the top. No persistent dirty state, unsaved-change warning, or recoverable draft was found. Reports can be generated from unsaved state, so the report may not match the persisted chart.

**Fix:** Add a sticky state bar with Unsaved changes, Saving, and Saved at time; warn before chart switch, sign-out, reload, or navigation; preserve a recoverable draft; require a current save before report generation or label the report as containing unsaved changes; record the chart version used for generation.

### [P2] MA Prep is still a full-chart data wall

Prep removes exam, DISE, plan confirmation, reports, and unrelated PAP review, but still presents 125 controls over nearly three viewports. Common intake work competes with rare treatment outcomes, LVEF details, MAD safety, clinician testing judgments, and 18 WatchPAT metrics.

**Fix:** Make Prep a visit-reason-aware task queue. Keep identity, visit reason, imports, unresolved source conflicts, core questionnaires, and required study metrics in the primary path. Reveal prior-treatment outcomes only when selected, move clinician judgments to Clinician Review, collapse advanced study metrics, and replace 14 milestone checkboxes with a compact current-stage control plus history.

### [P2] The generated-report handoff hides the next action

After Generate Reports, programmatic scrolling positions the clinician report under the fixed header while the Today's Sleep Plan and Full Sleep Profile buttons sit just above the visible area.

**Fix:** Move patient-report actions into the generated clinician-report header or use a sticky post-generation action bar. Standardize scroll offsets with `scroll-margin-top` for the fixed navbar.

## Persona Red Flags

### Morgan, MA or nurse preparer

- Cannot explicitly signal that preparation is complete.
- Sees clinician-owned plan confirmation as an unresolved preparation item.
- Must scan rare safety and prior-treatment details to decide what can be skipped.
- Has only a bottom Save action and a non-sticky progress rail.
- Maintains 14 historical milestone checkboxes during current-visit preparation.

### Dr. Chen, clinician

- Receives a strong briefing until a single correction is needed.
- Edit data loses the briefing and jumps into Full Chart.
- Cannot immediately see who prepared and verified the chart or when.
- Can generate a report without synchronizing chart persistence.
- Ends on a long report rather than a concise saved, confirmed, patient-ready state.

### Sam, accessibility-dependent clinical user

- Encounters anonymous comboboxes and numeric sleep-study inputs.
- Sees small muted labels with sub-AA contrast.
- Progress completion relies heavily on color.
- Tooltip help is often hover-dependent.
- Workspace switches and programmatic scrolling do not reliably manage focus or reduced motion.

## Minor Observations

- Generated clinician copy contained a visible double period in one diagnostic sentence.
- Sign Out is icon-only and needs an explicit accessible name.
- The role-switch helper explains access but not when each view should be used.
- The patient identity row can accumulate too many horizontal actions.
- No cardiovascular condition selected can mean either verified negative or not documented.
- Save Patient would be clearer as Save chart changes.
- The MA progress rail is not sticky and measured hundreds of pixels above the viewport during study entry.

## Questions to Consider

1. What exact contract makes MA preparation done, and which missing data should block handoff versus remain optional?
2. Should clinicians ever need to enter Full Chart for a single correction?
3. Should any report be downloadable when the current chart has unsaved changes?
4. Which five WatchPAT fields deserve first-order prominence?
5. Should each authenticated user open directly into a role default rather than inheriting a global browser preference?
