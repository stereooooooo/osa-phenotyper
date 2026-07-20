# OSA Phenotyper Regression Test Matrix

## Test Profiles

### Group 1: Severity Spectrum
| # | Name | BMI | Sex | AHI | ESS | ISI | Tonsils | FTP | NOSE | Nasal | CPAP Hx | Key Features |
|---|------|-----|-----|-----|-----|-----|---------|-----|------|-------|---------|-------------|
| 1 | Pre-study snorer | 28 | M | — | 10 | 6 | 2 | III | 35 | Yes | None | No sleep study, partner-reported snoring |
| 2 | Pre-study insomniac | 24 | F | — | 7 | 20 | 1 | II | 10 | No | None | No sleep study, high ISI, normal weight |
| 3 | Normal AHI | 25 | F | 3 | 8 | 5 | 1 | II | 5 | No | None | AHI <5, minimally symptomatic |
| 4 | Mild positional | 28 | M | 8 | 12 | 6 | 2 | II | 15 | No | None | Sup 18 / Non-sup 4, positional OSA |
| 5 | Moderate classic | 32 | M | 22 | 16 | 5 | 2 | III | 10 | No | None | Sleepy, new patient, no prior treatment |
| 6 | Severe obese | 38 | M | 55 | 19 | 5 | 3 | III | 10 | No | None | Nadir 78, high HB, tonsils 3+ |
| 7 | Very severe morbid | 44 | M | 85 | 20 | 4 | 2 | IV | 15 | No | None | Nadir 68, extreme AHI |

### Group 2: CPAP History Variants
| # | Name | BMI | Sex | AHI | ESS | ISI | CPAP Hx | Key Features |
|---|------|-----|-----|-----|-----|-----|---------|-------------|
| 8 | Current CPAP user | 33 | M | 30 | 10 | 5 | Current | Already on CPAP, minimally symptomatic |
| 9 | CPAP failed, won't retry | 31 | F | 24 | 17 | 19 | Failed/No | COMISA, claustrophobia, prefers alternatives |
| 10 | CPAP failed, will retry | 30 | M | 28 | 15 | 8 | Failed/Yes | Mask issues, willing to try again |
| 11 | Prefers to avoid CPAP | 27 | M | 12 | 14 | 5 | Never tried, avoids | Mild OSA, doesn't want CPAP |

### Group 3: COMISA & Insomnia Variants
| # | Name | BMI | Sex | AHI | ESS | ISI | Key Features |
|---|------|-----|-----|-----|-----|-----|-------------|
| 12 | Pure insomnia + mild OSA | 24 | F | 7 | 6 | 22 | Severe insomnia, mild AHI, NOT sleepy |
| 13 | Sleepy COMISA | 31 | F | 24 | 17 | 19 | High ESS + high ISI, moderate OSA |
| 14 | Insomnia no OSA evidence | 23 | F | — | 5 | 24 | Pre-study, severe insomnia, no study yet |

### Group 4: Anatomy & Surgery Scenarios
| # | Name | BMI | Sex | AHI | Tonsils | FTP | Prior Tx | Key Features |
|---|------|-----|-----|-----|---------|-----|----------|-------------|
| 15 | Large tonsils, thin | 24 | M | 18 | 4 | I | None | Tonsils 4, FTP I, BMI <30 → strong tonsillectomy candidate |
| 16 | Large tonsils, obese | 34 | M | 35 | 3 | II | None | Tonsils 3, BMI 30-35 → consider tonsillectomy in multilevel |
| 17 | Prior UPPP | 30 | M | 25 | 1 | III | Prior UPPP | Already had palate surgery, persistent OSA |
| 18 | Prior MAD failed | 28 | F | 15 | 2 | II | Prior MAD | Tried oral appliance, couldn't tolerate |

### Group 5: Phenotype Edge Cases
| # | Name | Key Features |
|---|------|-------------|
| 19 | REM-predominant mild | AHI 12, REM AHI 28, NREM AHI 8, BMI 25, no positional |
| 20 | High loop gain | CSR 15%, pAHIc3 12, central-dominant pattern |
| 21 | High hypoxic burden only | AHI 20, nadir 72, HB 15, ODI 35 |
| 22 | Nasal + positional combo | NOSE 60, deviated septum, sup 32/non-sup 6, AHI 16 |
| 23 | Delta HR elevated + CVD | ΔHR 14, CVD yes, AHI 25, moderate |

### Group 6: Inspire Candidacy
| # | Name | BMI | AHI | CPAP Hx | Key Features |
|---|------|-----|-----|---------|-------------|
| 24 | Good Inspire candidate | 30 | 28 | Failed | BMI ≤40, AHI 15-100, CPAP failed, no CCC |
| 25 | Poor Inspire (BMI) | 42 | 72 | Failed | BMI >40 → not eligible |
| 26 | Interested in Inspire | 29 | 20 | None | Never tried CPAP but interested in Inspire |

### Group 7: Borderline / Edge Cases
| # | Name | Key Features |
|---|------|-------------|
| 27 | BMI 26 mild insomnia | BMI 26, ISI 12, AHI 10 — should NOT get weight loss rec |
| 28 | BMI 29.9 | Just below obesity threshold — no weight rec but what-if shows |
| 29 | AHI exactly 5 | Boundary: mild vs normal |
| 30 | AHI exactly 15 | Boundary: moderate vs mild |
| 31 | AHI exactly 30 | Boundary: severe vs moderate |

### Group 8: Clinical Logic Regression Checks
| # | Name | Key Features |
|---|------|-------------|
| 32 | Edwards low ArTH without insomnia | AHI 12, nadir 88, apnea index 3, hypopnea index 9, ISI 4 — should detect Low ArTH without automatically generating CBT-I |
| 33 | REM-heavy but low NREM burden | AHI 22, REM AHI 36, NREM AHI 8 — should be REM-predominant, not Poor Muscle Responsiveness |
| 34 | Inspire interest without PAP failure | BMI 29, AHI 24, prefInspire yes, no prior PAP failure/intolerance — should not generate INSPIRE-EVAL |
| 35 | Mild OSA without oxygen metrics | AHI 10, no ODI/nadir/T90/HB entered — should not show low-hypoxic-burden messaging |
| 36 | Obese OSA without anatomical phenotype | BMI 33, AHI 12, small tonsils, FTP II, neck normal — should still receive WEIGHT recommendation |

### Group 9: Patient Report & PDF Regression Checks
| # | Name | Key Features |
|---|------|-------------|
| 37 | Pre-study report scope guardrail | Pre-study snorer with nasal obstruction — report should stay in "next steps" mode, without injected snoring-treatment recs beyond sleep-study / CBT-I / nasal support |
| 38 | CPAP-avoidant ordering | Mild OSA, prefers to avoid CPAP, has alternatives — CPAP context box should appear and CPAP should fall into Discuss rather than Start Now when alternatives exist |
| 39 | FTP handoff to patient report | Pre-study or OSA patient with FTP III/IV — Section A / exam language should explicitly mention the Friedman Tongue Position finding |
| 40 | Low-HB wording guardrail | Mild OSA with measured low hypoxic burden — report should use uncertainty-aware language ("reasonable first-line alternatives"), not "works just as well" certainty language |
| 41 | Patient PDF metadata | Exported patient PDF filename should use patient name + report date, and per-page footer date should match the report date rather than export time |
| 42 | Patient PDF pagination | Patient reports use content-driven length rather than a fixed target: typical reports should remain readable in 1–2 pages, content-rich reports may use 3+ pages, print-only compaction is accepted only when it eliminates a sparse trailing page, and irreducible sparse tails are rebalanced across the final two pages without splitting treatment cards |
| 43 | Severe COMISA patient-report focus | Severe OSA + insomnia + PAP retry + nasal/weight/alternative recommendations — summary starts CBT-I and PAP re-fitting in parallel, MAD/HNS appear only under `If PAP Remains Difficult`, checklist has no more than five actions, saline includes safe-water wording, and repetitive `What If` content is omitted |
| 44 | PAP state-aware care journey | Starting, continuing, retrying, discontinued, and preference-avoidant PAP histories should produce distinct pathway labels and should never relabel a documented retry as a first-time PAP start |
| 45 | Treatment-concept deduplication | Multiple tags for the same clinical concept should collapse by prerequisite severity; overlapping surgery/HGNS workups should render one procedure-specific prerequisite unless a device guardrail requires an independent pathway |
| 46 | Device-specific HGNS workup wording | Patient and clinician reports should describe DISE and other airway evaluation as device/procedure-specific, while retaining Inspire-specific CCC exclusion and BMI/AHI/PAP-history guardrails |
| 47 | Patient terminology before first use | The conditional `Terms used in this report` guide appears before the clinical narrative, defines every supported acronym or difficult term used later (including AHI, PAP, CBT-I, COMISA, BMI, and DISE when present), and omits unrelated terms |
| 48 | Patient handout punctuation | Generated patient handout HTML contains no em dashes, en dashes, nonbreaking hyphens, or other typographic dash characters; ranges use ASCII hyphens and prose uses natural punctuation |
| 49 | Patient report reading pace | Summary, pathway, risk callouts, contributors, and treatment cards retain comfortable spacing; pagination may add a page instead of over-compressing a content-rich report |

Normal-AHI wording check: returning post-study summaries should say the study did not show evidence of obstructive sleep apnea, not `normal sleep apnea`.

### Group 10: Intake & Data Integrity Regression Checks
| # | Name | Key Features |
|---|------|-------------|
| 43 | Intake CPAP current required | Patient selects prior CPAP in intake — form must require current-use status before submission, and backend must reject missing `currentlyUsing` |
| 44 | Intake CPAP retry required | Patient selects prior CPAP and `currently using = no` — form must require retry willingness, and backend must reject missing `retryWilling` |
| 45 | Intake token atomicity | Simulate patient-write failure after token validation — token must remain active so the patient can retry instead of losing the link |
| 46 | Stale clinician save after intake | Clinician loads patient, patient submits intake, clinician saves stale tab — save must 409 instead of silently overwriting the newer intake-backed record |
| 47 | Pending intake override staging | Intake conflicts with already-saved chart values (for example, chart says current CPAP user, intake says not current) — live form data should stay intact, conflicting fields should land in `intakePendingOverrides`, and UI should show review-needed status |
| 48 | Clear-form confirmation integrity | Clicking `New Patient` and canceling the confirmation should not drop `currentPatientId` or disconnect the loaded chart from the save target |
| 49 | Intake-only preference round-trip | Intake submits `weightLossReadiness` — the clinician form should retain and resave it instead of dropping it on the next chart save |
| 50 | Patient archive behavior | Archiving a patient should remove the record from active list/search and invalidate future load/token creation instead of hard-deleting the row |
| 51 | Canonical workflow status | Check milestones out of order in the UI — saved `status` and displayed badge should follow the defined workflow order, not the checkbox click order |

### Group 11: HIPAA & Infrastructure Regression Checks
| # | Name | Key Features |
|---|------|-------------|
| 52 | Restricted origin enforcement | API request from an origin outside `AllowedOrigins` should not receive permissive CORS headers, while allowed origins continue to work |
| 53 | MFA bootstrap flow | First admin sign-in after deployment should require new password + TOTP setup, and subsequent sign-ins should require authenticator code |
| 54 | Cognito group RBAC | Authenticated user without `osa-admin` or `osa-clinician` group should receive `403` on patient/token routes; archive should remain admin-only |
| 55 | API audit logging | HTTP API stage should emit access logs to the KMS-encrypted access-log group, and CloudTrail should capture both management and DynamoDB data-plane events |
| 56 | Safe runtime config defaults | Fresh checkout should no longer point `js/aws-config.js` or `intake.html` at production AWS endpoints until `deploy.sh` writes environment-specific values |
| 57 | HTTP API WAF limitation documented | Stack deployment should succeed without attempting an unsupported direct WAF association on the API Gateway HTTP API stage; WAF reintroduction remains a follow-up for a supported edge layer |

### Group 12: UI & Code Quality Regression Checks
| # | Name | Key Features |
|---|------|-------------|
| 58 | No silent clinical defaults | Fresh form load should leave sex, tonsils, and FTP blank until the clinician explicitly selects values |
| 59 | Required-field submit gate | Attempting to analyze with missing patient name, DOB, age, sex, or BMI should block submission, highlight fields inline, and focus the first invalid control |
| 60 | Progress-track completion semantics | Progress steps should mark complete only when the section has real entered values, not placeholder/default artifacts |

### Group 13: WatchPAT Interpretation Boundaries
| # | Name | Key Features |
|---|------|-------------|
| 61 | Mild WatchPAT category | pAHI 5-14.9 should produce clinician-only category uncertainty without invalidating the study or automatically ordering PSG |
| 62 | Moderate WatchPAT category | pAHI 15-29.9 should produce clinician-only category uncertainty; confirmation remains conditional on whether reclassification changes care |
| 63 | Severe WatchPAT counterexample | pAHI 30 or higher should not receive the mild/moderate category flag |
| 64 | PSG counterexample | Mild or moderate PSG AHI should not receive a WatchPAT-specific uncertainty flag |
| 65 | Complicated diagnostic HST | WatchPAT plus documented heart failure or stroke should show that PSG is guideline-preferred for initial diagnosis without leaking a study-quality warning into the patient handout |
| 66 | WatchPAT-derived REM and position | Strong numerical REM or positional patterns derived only from WatchPAT should be capped at Moderate signal; PSG-derived patterns may retain High signal |
| 61 | Mobile action stack | On mobile width, `Analyze / Generate Report / Save` actions should stack cleanly without clipped or side-scrolling buttons |
| 62 | Report preview dialog focus | Opening the patient report preview should move focus into the dialog, trap tab navigation within it, and return focus to the trigger on close |
| 63 | Heuristic signal wording | Clinician phenotype table should display `Signal Strength` with `Strong / Moderate / Limited signal`, plus the heuristic note, instead of validated-sounding `Confidence` labels |

### Group 13: Chart Governance & Missing-Feature Regression Checks
| # | Name | Key Features |
|---|------|-------------|
| 64 | Admin archived-list toggle | Admin enables `Show archived` in the patient list and sees archived rows with restore actions, while non-admin users never see the toggle |
| 65 | Archived patient restore | Restoring an archived chart should return it to the active list with its prior milestone-derived status, without permitting standard load/edit while still archived |
| 66 | Field provenance tracking | After clinician save and patient intake merge, loaded patient record should expose per-field provenance with source, updated timestamp, and actor for current chart values |
| 67 | Pending intake provenance | Conflicting intake fields should appear in the provenance view as pending intake changes rather than overwriting the saved chart value silently |
| 68 | Report snapshot save | Saving a report snapshot from the preview overlay should persist immutable patient-report HTML plus hashed analysis metadata, increment chart version, and append a visit entry |
| 69 | Report snapshot history | Snapshot modal should list saved snapshots newest-first, allow frozen preview of prior reports, and cap retained snapshots to the configured history limit |
| 70 | Snapshot save scope guardrail | Previewing a historical saved snapshot should disable the `Save Snapshot` action so clinicians cannot accidentally resave stale HTML as if it were the current live analysis |

### Group 14: Live Staging Validation Checks
| # | Name | Key Features |
|---|------|-------------|
| 71 | Staging intake conflict merge | Real staging intake submission with clinician-entered CPAP data plus conflicting intake responses should return `200`, preserve the clinician value in `formData`, and stage the conflicting intake value in `intakePendingOverrides` |
| 72 | Staging stale-save protection | Real staging chart save using an outdated `version` should return `409` with the reload-before-saving message |
| 73 | Staging CORS allow/deny | Allowed origin should receive `Access-Control-Allow-Origin` on GET/preflight, while a disallowed origin should receive no permissive ACAO header |
| 74 | Staging audit trail evidence | Real staging requests should appear in the API Gateway access-log group, and CloudTrail audit objects should contain DynamoDB data-plane events for patient/intake activity |
| 75 | Staging patient PDF export | Live staging-backed UI should generate a patient report PDF with the patient-based filename and a non-empty multi-page document |

### Group 15: Remaining Audit Follow-Up Checks
| # | Name | Key Features |
|---|------|-------------|
| 76 | Compact visit audit entries | Create, update, and snapshot-save events should append visit summaries with changed-field metadata instead of embedding a full `formSnapshot` copy on every visit |
| 77 | Review queue filter | Enabling `Review queue only` in the patient list should show only `review-needed` / `received` / `pending` intake statuses, sorted with actionable review items first |
| 78 | Clinician insufficient-data warning | OSA patient missing oxygen metrics, anatomy detail, or complete HNS workup should display a clinician alert that names the incomplete decision domains |
| 79 | Patient-facing data limitations callout | The patient report should render `What may still be refined` only when insufficient-data domains are present, and hide it otherwise |
| 80 | Weight-readiness personalization | When `weightLossReadiness` is `ready`, `considering`, or `not-ready`, the weight recommendation/checklist wording should adapt accordingly without leaking GLP-1 language below BMI 30 |
| 81 | Exact full-name search fast path | Searching by an exact normalized patient name should hit the `name-index` exact-match path before the broader scan fallback |
| 82 | Packaged deploy path | `deploy.sh` should package real Lambda artifacts into CloudFormation and should no longer depend on post-deploy `aws lambda update-function-code` patching |
| 83 | Shared pathway/UARS helper | Care-pathway stage generation and UARS detection should come from shared helpers consumed by both `app.js` and `patientReport.js`, with no drift between clinician and patient layers |
| 84 | Insufficient-data recommendation guardrails | Missing oxygen metrics, incomplete anatomy documentation, or incomplete HNS workup should replace premature treatment matching with prerequisite workup steps in the clinician and patient plan |
| 85 | Prefix-name search fast path | Common last-name prefix searches should use a DynamoDB prefix index before falling back to a full `contains(nameLower, :q)` scan, with an operator backfill path for older patient rows |
| 86 | CloudFront app front door | The stack should provision a private S3 + CloudFront front door for the static app, with API path behaviors for `/patients*`, `/intake-tokens*`, and `/intake/*` |
| 87 | CloudFront-scoped WAF deployment | Deploy should create/update a CloudFront WAF in `us-east-1`, scope rules to API paths, pass the ARN into the stack, and publish the app behind that protected edge layer |
| 88 | CloudFront deploy-path regression fixes | Real AWS deploy should succeed after validating artifact-bucket naming, WAF CLI payload handling, managed no-cache policy usage, and Lambda zip packaging |
| 89 | Prefix-search backfill on upgraded staging data | Existing staging patient rows should receive `nameSearchBucket` metadata through the operator backfill script so prefix search works immediately after upgrade |

### Group 16: Hosted CloudFront Browser Validation
| # | Name | Key Features |
|---|------|-------------|
| 90 | Hosted clinician auth onboarding | CloudFront-hosted app should support first sign-in, new-password challenge, TOTP setup, and authenticated app entry without falling back to localhost behavior |
| 91 | Hosted patient load + re-analyze | Loading a saved patient from the hosted patient list should repopulate required patient-info fields and allow immediate re-analysis without manual re-entry |
| 92 | Hosted snapshot save persistence | Clicking `Save Snapshot` from the hosted patient-report overlay should persist `reportSnapshots` / `reportSnapshotCount` on the patient row |
| 93 | Hosted intake thank-you flow | Public intake page should progress from valid token → active form → successful submission → thank-you state after the backend merge completes |
| 94 | Hosted PDF export gesture | Hosted patient-report preview should produce a downloaded PDF from a real browser gesture on the CloudFront app surface |
| 95 | Hosted snapshot WAF body-size allowance | CloudFront WAF should allow authenticated clinician snapshot `PUT /patients/:id` requests that carry patient-report HTML payloads large enough for normal saved reports |

### Group 17: Treatment Safety Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 96 | Oral appliance prerequisite guardrail | OSA reports that surface MAD should also surface sleep-dentist / dentition / TMJ prerequisite messaging rather than presenting MAD as fully finalized |
| 97 | ASV heart-function guardrail | Alternative PAP / ASV messaging should explicitly require heart-function review before ASV is treated as safe to pursue |
| 98 | DISE surgery-planning guardrail | Surgery-forward plans without DISE should add a DISE planning prerequisite before site-directed surgery is treated as finalized |

### Group 18: Expanded Insufficient-Data Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 99 | Positional-data limitation guardrail | OSA reports without positional tracking should state that positional relevance is still unresolved rather than implying side-sleeping has been ruled out |
| 100 | REM-stage limitation guardrail | OSA reports without REM/NREM staging should state that REM-specific worsening is still unresolved rather than implying REM predominance has been ruled out |

### Group 19: Intake Review Workflow & Provenance Timeline
| # | Name | Key Features |
|---|------|-------------|
| 101 | Explicit intake review modal | A chart with `intakePendingOverrides` should expose a dedicated `Review Intake` workflow from the patient bar, alert banner, and review-queue patient list actions instead of relying on implicit manual form edits |
| 102 | Intake accept/keep persistence | Applying field-by-field review decisions should require an explicit decision per pending field, persist accepted values into `formData`, clear or retain the remaining pending set appropriately, increment `version`, and stamp `intakeReviewHistory` |
| 103 | Field provenance timeline history | Field provenance view should show current chart value, pending intake value, and a compact timeline sourced from durable `fieldProvenanceHistory` entries rather than only the latest source stamp |

### Group 20: Intake Review Dashboard
| # | Name | Key Features |
|---|------|-------------|
| 104 | Dedicated review dashboard surface | Clinician navbar should expose a standalone `Review Queue` dashboard that loads without using the patient-list toggle and summarizes `review-needed`, `received`, and `pending` counts |
| 105 | Dashboard queue actions | Review dashboard rows should support `Open` and `Review` actions that load the chart and, for actionable conflicts, open the intake-review modal directly |

### Group 21: Home-Test Central Confirmation Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 106 | WatchPAT central-confirmation prerequisite | When advanced central-directed therapy would be inferred from WatchPAT central/CSR signals, the plan should prepend a PSG confirmation step and suppress the advanced central-treatment recommendation until lab confirmation is available |

### Group 22: Explicit Safety Inputs
| # | Name | Key Features |
|---|------|-------------|
| 107 | Documented MAD safety limitation | When tooth support is poor, protrusion is limited, or TMJ disease is severe, MAD should be suppressed as a live option and replaced with a limitation/safety explanation rather than a generic workup note |
| 108 | Documented ASV contraindication | When LVEF is documented at 45% or below, ASV-specific routing should be suppressed and replaced with a contraindication-style alert rather than a generic “check LVEF” reminder |

### Group 23: Broader Insufficient-Data Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 109 | Missing apnea/hypopnea breakdown | When the detailed apnea-versus-hypopnea scoring is unavailable, the plan should surface an endotype-workup caveat rather than implying collapsibility, full arousal-threshold, or loop-gain interpretation is complete |

### Group 24: Partial-Data And Zero-Value Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 110 | Partial positional dataset | If either supine AHI or non-supine AHI is missing, the app should treat positional status as unresolved and surface a positional-workup caveat rather than implying non-positional disease |
| 111 | Partial REM/NREM dataset | If either REM AHI or NREM AHI is missing, the app should treat REM-specific worsening as unresolved and surface a sleep-stage workup caveat rather than implying it is absent |
| 112 | Zero-value ratio handling | Legitimate `0` values in non-supine AHI or NREM AHI should still behave as real data rather than disappearing behind truthy checks |
| 113 | Thin oxygen profile | A single oxygen metric should not be treated as a complete overnight oxygen profile or used to characterize oxygen-related severity as low |

### Group 25: Identity Provenance Timeline
| # | Name | Key Features |
|---|------|-------------|
| 114 | Identity-field provenance | Name, DOB, and MRN edits should appear in the same provenance timeline as clinical form fields so demographic chart changes remain auditable during pilot testing |

### Group 26: Local Workflow Smoke Journeys
| # | Name | Key Features |
|---|------|-------------|
| 115 | Local clinician save/analyze/report/snapshot | On localhost workflow test mode, the real `index.html` UI should allow saving a chart, generating reports, opening the patient report overlay, and saving a snapshot through the in-memory chart backend |
| 116 | Local patient reload via list modal | After clearing the form, reopening the saved chart through the patient-list modal should repopulate patient identity fields and allow chart continuity checks without AWS |
| 117 | Local intake review dashboard journey | Injected pending intake conflicts should surface in the standalone `Review Queue` dashboard, open the intake-review modal, and persist explicit accept/keep decisions into chart state and provenance history |
| 118 | Local patient intake thank-you journey | On localhost workflow test mode, the real `intake.html` UI should validate a workflow token, accept a full questionnaire submission, persist the mapped payload, and transition to the thank-you state |

### Group 27: Universal Phenotype-Uncertainty Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 119 | Zero-phenotype with unresolved contributors | When OSA is confirmed but phenotype-relevant inputs such as nasal assessment or delta-heart-rate entry are still missing, Section C should say contributors are still being clarified instead of implying the common patterns were ruled out |
| 120 | Nasal workup from missing nasal assessment | When nasal contribution has not actually been assessed, the plan should prepend a `NASAL-WORKUP` step with a patient-friendly explanation and checklist reminder instead of silently treating the nasal phenotype as absent |

### Group 28: Hosted Search And Intake Review Validation
| # | Name | Key Features |
|---|------|-------------|
| 121 | Hosted exact-name search fast path | Authenticated CloudFront search should return the expected migrated staging patient via the exact-name path after `nameSearchBucket` backfill, without falling back to a broken or empty result |
| 122 | Hosted intake-review completion | Completing the final pending intake-review decision through the hosted API path should clear pending overrides, append review/provenance history, increment `version`, and avoid DynamoDB expression-value failures |

### Group 29: Runtime Environment Labeling
| # | Name | Key Features |
|---|------|-------------|
| 123 | Clinician runtime labeling | The main app should visibly label the current environment and build metadata, and show a non-production banner in workflow-test / local / staging / pilot modes so staging cannot be mistaken for production during clinical validation |
| 124 | Intake runtime labeling | The patient intake surface should show matching runtime metadata and a non-production banner outside production so pilot/staging intake links are visibly distinguishable from the production patient-facing flow |

### Group 30: Patient Portal MVP (historical, removed from current v1)
These scenarios describe the earlier comprehensive platform and are intentionally not active in the clinician-controlled v1.
| # | Name | Key Features |
|---|------|-------------|
| 125 | Clinician patient-page publication | From the report overlay, clinicians should be able to publish the reviewed patient report into a patient-facing portal record without exposing the live chart or requiring a separate manual artifact upload |
| 126 | Patient-page link management | The patient bar should expose a dedicated patient-page link workflow that only becomes shareable after publication and maintains separate portal tokens from intake tokens |
| 127 | Public patient-page rendering | `portal.html` should render only the latest clinician-published patient-facing content for a valid token, while unpublished/invalid links stay in safe non-disclosive states |
| 128 | Local patient-page smoke journey | On localhost workflow test mode, the executable smoke suite should cover publish → link generation → portal page render as one end-to-end flow |
| 129 | Patient-page presentation and mobile layout | Published patient pages should surface an at-a-glance summary above the report, avoid duplicated inner report chrome, and keep the embedded report readable on narrow screens |

### Group 31: Synthetic Patient Wording Calibration
| # | Name | Key Features |
|---|------|-------------|
| 130 | Moderate oxygen-language calibration | Moderate-range oxygen abnormalities on a real-looking post-study chart should use action-oriented but non-alarmist patient wording, especially for nadir and hypoxic-burden explanations |
| 131 | Treatment-plan workup separation | When first-line therapies and prerequisite workup tags coexist, the patient plan should lead with actual therapies and move prerequisite workup items into a separate bucket instead of letting them dominate `Start Now` |

### Group 32: Study-Quality And Cross-Scenario Report Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 132 | WatchPAT REM percentage import | The PDF parser should read the explicitly labeled `% REM of Sleep Time` value, map it to `remPercent`, persist it with the chart, and reproduce the known 23.1% value from the repository WatchPAT fixture |
| 133 | Limited REM phenotype guardrail | When reported REM percentage and total sleep time yield less than 30 minutes of REM, the clinician report should flag limited REM sampling while REM-predominant phenotypes and REM-specific treatment tags stay suppressed |
| 134 | Mild alternative-first consistency | For mild OSA with a lower-risk oxygen profile, the summary, care journey, treatment order, and first-30-day checklist should lead with the selected alternative instead of simultaneously requiring immediate PAP setup |
| 135 | Normal-AHI report identity | A normal-AHI report should use `Your Sleep Evaluation Summary` rather than labeling the patient handout as a sleep apnea report |
| 136 | Surgery preference without HNS routing | A general preference to discuss airway surgery should not create an HNS workup unless Inspire or another nerve-stimulation pathway is actually referenced |
| 137 | Adaptive patient-PDF pagination | Semantic contributor units and bounded compact styling should remove sparse third pages when a report fits safely on two, while genuinely content-rich reports retain additional pages |
| 138 | HST-to-PSG stage-data isolation | When a chart switches to PSG or combined testing, stale hidden HST REM percentage and duration values must not suppress valid PSG REM/NREM indices |
| 139 | Second five-scenario safety and PDF matrix | Adequate REM-predominant OSA, home-study central signals with reduced LVEF, very severe hypoxic OSA above BMI 40 after PAP failure, current PAP with nasal obstruction, and pre-study insomnia/snoring should all preserve their distinct safety, staging, terminology, and treatment-plan behavior; the central-safety PDF should remain within a readable two-to-three-page pacing range |

### Group 33: Guided-Plan Edge-Case Audit
| # | Name | Key Features |
|---|------|-------------|
| 140 | Severe hypoxemia with PAP retry | Severe OSA, substantial nocturnal hypoxemia, PAP comfort barriers, nasal obstruction, and weight readiness should produce a focused PAP-retry plan while preserving the `OXYGEN-URG` safety recommendation in both clinician and patient outputs |
| 141 | Favorable tonsillar surgery pathway | A non-obese, Friedman Stage I patient with 4+ tonsils and PAP intolerance who requests surgery should receive an airway-surgery draft and tonsil/palate counseling without an unrelated HNS or universal DISE prerequisite |
| 142 | Probable UARS plan suggestion | Normal pAHI with marked symptoms and PAT RDI elevation should surface diagnostic testing in the MA suggestion layer, not only after the clinician manually selects a plan and runs the analysis |
| 143 | Limited WatchPAT plan restraint | A three-hour study with very little REM should keep quality flags clinician-facing, suppress REM phenotyping, and make the chart-aware plan draft reflect the need for caution before presenting treatment pathways as definitive |
| 144 | BiPAP central-safety plan integration | Current BiPAP use with substantial WatchPAT central signals and LVEF at or below 45% should add PSG confirmation to the MA draft, retain BiPAP wording, and suppress unsafe ASV routing |

### Group 34: Scoped iPad Intake and Cardiac Record Follow-up
| # | Name | Key Features |
|---|------|-------------|
| 145 | Clinic iPad intake boundary | Staff can generate a 72-hour, single-use patient questionnaire link without signing the clinician workspace into the handed device; no portal or patient roster route is exposed |
| 146 | Cardiovascular questionnaire cascade | A cardiovascular-history answer reveals the echocardiogram question; a prior echo reveals result knowledge; exact LVEF is requested only when the patient knows it |
| 147 | Unknown LVEF accepted safely | A patient can report that the echo result is unknown without guessing a number; the backend derives and persists an Echo/LVEF Needed flag |
| 148 | LVEF follow-up resolution | The chart and bounded search display the flag until a valid numeric LVEF is saved, then clear it automatically |
| 149 | Handed-device cleanup | After successful submission, the token is consumed, removed from the address bar, and questionnaire values are cleared from the browser DOM |

### Group 35: Visit-Specific Patient Action Plans
| # | Name | Key Features |
|---|------|-------------|
| 150 | Current APAP comfort plan | A current APAP user with mask, leak, dryness, nasal, weight, and positional pathways should receive expanded PAP and nasal modules, with weight and positional actions kept compact and no new-start or autonomous pressure-change language |
| 151 | Pre-study snoring plan | A patient awaiting a sleep study with snoring, severe nasal symptoms, BMI 29, weight readiness, and frequent alcohol near bedtime should receive a diagnostic-boundary explanation, interim side-sleeping advice, expanded nasal instructions, and compact confirmed weight/alcohol actions without an OSA diagnosis |
| 152 | Bounded action-plan PDF | The most content-rich first-release action plan should remain within one or two PDF pages while preserving readable spacing, terminology definitions, and the no-typographic-dash rule |

### Group 36: Progressive Patient Intake History
| # | Name | Key Features |
|---|------|-------------|
| 153 | Uncomplicated snoring fast path | A patient without prior studies, treatments, cardiovascular disease, or GLP-1 exposure should complete the history portion with a few core selections while every irrelevant detail branch stays hidden |
| 154 | Clinically relevant snoring and alcohol choices | The snoring question should specify loud, frequent, or bothersome snoring, and alcohol frequency should include occasional or social-event use between never and weekly use |
| 155 | Prior sleep-study history | A prior-study answer should conditionally capture an optional approximate year and home-versus-lab location without asking patients to reproduce study metrics |
| 156 | Current PAP progressive disclosure | Current PAP users should identify CPAP/APAP, BiPAP, or unsure, then answer whether they have difficulty before seeing the PAP problem checklist; patient pressure settings should not be requested |
| 157 | Prior treatment outcomes | Oral appliance history should capture benefit, tolerance, and dental/TMJ barriers; selected throat, nasal, sinus, and jaw surgeries should capture sleep/snoring benefit; nerve stimulation should capture benefit and optional implant year |
| 158 | Cardiovascular differentiation and LVEF flag | Cardiovascular history should distinguish hypertension from heart failure, arrhythmia, coronary disease, stroke, and valve disease; an LVEF-record flag should be limited to heart-failure history or a known prior echo without a documented numeric result |
| 159 | GLP-1 medication history | Current or prior GLP-1 use should reveal medication, weight response, and structured problem choices while never/unsure responses stay on the short path |
| 160 | Intake-to-chart persistence | New study, PAP mode, treatment outcome, cardiovascular subtype, and GLP-1 fields should survive validation and map to named clinician-chart fields with provenance-compatible values |

### Group 37: Intake Layout And Clinical-Use Integration
| # | Name | Key Features |
|---|------|-------------|
| 161 | Demographic control alignment | Sex, feet, inches, and weight controls should share a consistent baseline at tablet and desktop widths; the paired height controls should have equal dimensions and preserve full-width mobile stacking |
| 162 | Nerve-stimulator detail alignment | The benefit question and answer controls should align as one compact row, with the optional implant-year field bounded below and all controls retaining touch-friendly sizing |
| 163 | Patient-reported treatment history routing | PAP difficulty, MAD barriers, prior surgery outcomes, and existing nerve-stimulator outcome/year should alter clinician recommendations, safety context, plan suggestions, and patient wording without independently changing objective phenotype or eligibility rules |
| 164 | Prior-study and GLP-1 context routing | A reported prior sleep study should prompt report retrieval before automatic repeat testing, while specific GLP-1 problems should appear in clinically relevant counseling and the patient action plan |

### Group 38: Treatment-History Outcome And Chart-State Guardrails
| # | Name | Key Features |
|---|------|-------------|
| 165 | New-chart hidden-state reset | Starting or hydrating a chart clears derived hidden PAP pressure, prior-study answer, and LVEF follow-up values so one patient's state cannot affect the next analysis |
| 166 | Prior MAD intolerance routing | Prior jaw-joint pain, bite change, dental problems, or poor fit should limit the clinical appropriateness of another oral appliance trial even when population-level associations are supportive; the app should not produce an individual response tier |
| 167 | Failed prior throat and nasal surgery | A prior operation without benefit should prompt operative-report review, current-anatomy reassessment, and DISE-guided target mapping rather than an automatic revision recommendation |
| 168 | Prior-study retrieval with unknown LVEF | A patient with heart failure, a prior echo, and no documented LVEF should retain an Echo/LVEF Needed flag while the unavailable prior sleep-study report is requested |
| 169 | Stable current CPAP with prior GLP-1 cost barrier | Current CPAP without comfort difficulty should remain a continuation and efficacy-review pathway, while an effective prior GLP-1 trial stopped for cost receives specific coverage-aware weight counseling |
| 170 | Successful prior MAD | A helpful, tolerable prior oral appliance should prompt continuation or retitration and on-treatment verification, without intolerance warnings or generic new-device language |
| 171 | Successful prior throat surgery with recurrence | Prior benefit followed by recurrent symptoms or OSA should be acknowledged while operative-report review, current anatomy, and DISE still precede selection of another surgical target |
| 172 | Helpful existing HGNS | An existing helpful hypoglossal nerve stimulator should remain in an optimization and objective-efficacy pathway without new-device candidacy staging or DISE prerequisites |
| 173 | Hypertension-only cardiac history | Isolated hypertension without heart failure or a prior echo should appear as clinical context but should not create an unnecessary LVEF-record request |

### Group 39: Mixed Current-Therapy And Prior-Treatment Stress Tests
| # | Name | Key Features |
|---|------|-------------|
| 174 | Recurrent nasal obstruction after prior benefit | A current APAP user with severe recurrent nasal symptoms after previously helpful nasal surgery should continue APAP, receive nasal treatment, and be reassessed for recurrent or residual blockage rather than automatically routed to revision surgery |
| 175 | Oral appliance planning after jaw surgery | Prior helpful jaw surgery should not automatically exclude an oral appliance, but the clinician and patient plans should require sleep-dentist review of bite, tooth support, jaw movement, and jaw-joint health |
| 176 | Existing HGNS with severe residual hypoxic OSA | An existing nerve stimulator without benefit plus severe residual breathing and oxygen abnormalities should trigger prompt programming, use review, and objective on-therapy testing while preserving weight-management support and excluding new-device candidacy workup |
| 177 | Current APAP plus GLP-1 adverse effects | PAP mask and leak problems and a current effective GLP-1 medication with digestive side effects should remain separate, specific management pathways without inventing nasal obstruction or recommending autonomous pressure changes |
| 178 | Heart failure with documented preserved LVEF and central HST signals | A current BiPAP user with LVEF 55% and central home-study signals should receive in-lab confirmation and continued BiPAP review without an unresolved-LVEF flag, ASV contraindication, or premature central-directed treatment |

### Group 40: Treatment-Safety And Diagnostic-Boundary Stress Tests
| # | Name | Key Features |
|---|------|-------------|
| 179 | Oral appliance request with severe TMJ and limited dentition | Severe jaw-joint disease, limited tooth support, and limited protrusion should suppress positive MAD candidacy language and require a safety determination before any appliance is finalized |
| 180 | Inspire interest above the clinic BMI guardrail | A PAP-intolerant patient with BMI 42 should not receive an automatically selected nerve-stimulation pathway or HNS workup; weight management remains available and elevated-but-not-high-tier hypoxic burden should not receive an urgent evidence-linked tag |
| 181 | Normal AHI with snoring, nasal obstruction, alcohol, and weight readiness | AHI below 5 should remain outside the OSA treatment pathway while producing a clearly labeled snoring pathway with nasal, alcohol, and supported-weight actions |
| 182 | COMISA in a stable current APAP user | Severe insomnia plus moderate OSA should add CBT-I while continuing APAP and requesting objective compliance data, without new-PAP or re-fitting language |
| 183 | Central home-study signals with heart failure and unknown LVEF | Current BiPAP should continue while central findings receive in-lab confirmation; the clinician report and patient action plan should surface the missing echocardiogram without declaring ASV contraindicated before LVEF is known |

### Group 41: Negative Home-Study Follow-up
| # | Name | Key Features |
|---|------|-------------|
| 184 | Normal HST with snoring and persistent fatigue | A normal AHI after a technically adequate home study should still route to in-lab PSG when the encounter remains symptom-focused, even if the Epworth score is low and RDI/arousal data do not meet the more specific UARS rule; an uncomplicated normal-study snoring case should remain outside that pathway |
| 185 | Normal HST with severe nasal obstruction and a clinician-confirmed nasal-first plan | The clinician view should retain the negative-HST diagnostic flag and PSG draft suggestion, but a patient handout should not order or schedule PSG when the clinician confirms nasal treatment without Diagnostic Testing; it should describe in-lab testing only as a possible later step if symptoms persist |

### Group 41: Clinician Next-Test Guidance

| # | Scenario | Expected |
|---|----------|----------|
| 186 | Short symptomatic WatchPAT | The clinician module should label PSG recommended and draft, but not confirm, Diagnostic Testing |
| 187 | Adequate negative WatchPAT with persistent symptoms | The module should say PSG is reasonable to consider and preserve the clinician's option to treat another plausible contributor first |
| 188 | Explicit night-to-night variability concern without a PSG-preferred condition | The module should offer selective multi-night HST, approximately three valid nights with the same device, without presenting it as routine care |
| 189 | Adequate uncomplicated positive WatchPAT | The module should state that no additional diagnostic test is indicated now |
| 190 | WatchPAT with chronic opioid use, respiratory muscle weakness, hypoventilation concern, or clinician-designated severe insomnia | The module should identify the documented reason and recommend PSG; patient questionnaire answers remain subject to clinical verification |

### Group 42: Event-Linked HB and Conventional Hypoxemia Separation

| # | Scenario | Expected |
|---|----------|----------|
| 191 | Event-linked HB 80 %min/h with otherwise reassuring conventional oxygen metrics | Creates a Moderate HB research signal and ISAACC cohort-context note, but no conventional-hypoxemia urgency or automatic treatment allocation |
| 192 | ODI 55/h or nadir SpO2 74% with HB below the research boundary | Creates the separate substantial-nocturnal-hypoxemia safety pathway but cannot create the event-linked HB phenotype |
| 193 | HB at a 73.1 or 87.1 research-cohort cut point | Clinician wording identifies the post hoc cohort context and explicitly states that the value is not a validated clinical category, treatment guarantee, or stand-alone allocation rule |
| 194 | Mild OSA with reassuring oxygen metrics and a selected PAP plan | Reassuring oxygen metrics do not automatically move PAP down the patient plan; treatment order follows the clinician-confirmed plan, symptoms, anatomy, preferences, and other clinical factors |

### Group 43: Non-PAP Response-Prediction Calibration

| # | Scenario | Expected |
|---|----------|----------|
| 195 | PAP-intolerant patient requesting an oral appliance | The option remains available, but the app emits generic `MAD`, no favorable/poor response tier or probability, and requires dental safety plus objective follow-up testing |
| 196 | Supine-isolated OSA | A supine/non-supine ratio of at least 2 with non-supine AHI below 5 is labeled supine-isolated; positional monotherapy is described as possible only after adequate non-supine, including REM, sampling and objective verification |
| 197 | Supine-predominant OSA | A positional ratio with non-supine AHI 5 or higher remains a positional phenotype, but positional therapy is explicitly adjunctive because OSA persists off the back |
| 198 | HGNS referral with complete lateral oropharyngeal-wall collapse | Complete collapse appears as negative unilateral-HGNS response context without becoming a universal contraindication, individual probability, or aggregate response tier |
| 199 | HGNS referral with partial lateral oropharyngeal-wall collapse | Partial collapse is documented but is not relabeled as the same validated adverse predictor as complete collapse |
| 200 | Stage I tonsillar anatomy and surgical interest | Friedman stage supports anatomy-directed discussion without an exact historical success percentage, a patient-specific probability, or a general DISE response score |

### Group 44: COMISA Sequencing And Safety Calibration

| # | Scenario | Expected |
|---|----------|----------|
| 201 | Moderate OSA, clinically important insomnia, and high baseline sleepiness | Offer CBT-I early with concurrent or sequential PAP according to urgency and preference. High ESS produces first-week sleepiness, driving, and safety-sensitive-duty monitoring, not unsafe or contraindicated wording. COMISA alone does not prescribe APAP, EPR, ramp, or a pressure range. |
| 202 | Moderate OSA and clinically important insomnia without substantial daytime sleepiness | Offer CBT-I and PAP without the high-sleepiness monitoring alert. PAP mode and settings remain individualized, providing a counterexample to both universal COMISA PAP settings and an automatic bedtime-restriction warning. |

### Group 45: Combined Release-Candidate Stress Test

| # | Scenario | Expected |
|---|----------|----------|
| 203 | Sleepy COMISA, severe OSA, and event-linked HB 80 with conventional oxygen metrics below the substantial-hypoxemia bands | CBT-I and PAP remain active in parallel; bedtime-restriction monitoring appears; HB is research context only and cannot create `OXYGEN-URG` or independently change treatment rank. |
| 204 | Current APAP with historical ESS 18, explicit absence of current PAP symptoms, device event index 1.2, P95 leak 42, and P95 pressure 14.4 within a 13-17 range | Device events remain reassuring, historical sleepiness does not create symptom-download discordance, P95 leak remains a screening signal rather than a sustained-leak diagnosis, and no pressure change is recommended. |
| 205 | Three-hour WatchPAT with 5% estimated REM plus severe nasal obstruction | Clinician output flags the short/low-REM study and suggests diagnostic testing plus nasal care; patient output avoids technical quality criticism and no definitive PAP, positional, or HGNS treatment is activated. |
| 206 | Young lower-BMI patient requesting an oral appliance with supine-isolated mild OSA and adequate dental safety inputs | Oral appliance and positional options remain available with objective verification, but favorable associations do not become a response tier or probability. |
| 207 | HGNS inquiry with BMI 34, larger neck, AHI 35, and partial lateral-wall collapse | Eligibility and exploratory factor-level context remain visible; partial collapse is not treated as complete collapse and mixed associations do not become strong/good/marginal response labels. |

### Group 46: Second Predeployment Boundary Test

| # | Scenario | Expected |
|---|----------|----------|
| 208 | Adequate negative WatchPAT with persistent fatigue, severe nasal obstruction, and deviated septum; clinician confirms nasal treatment without Diagnostic Testing | Clinician concern and draft PSG guidance remain visible, but the patient report follows the confirmed nasal-first plan, describes PSG only as a possible later step, and does not say that an in-lab study was ordered. |
| 209 | Severe OSA with ODI 58, nadir 72%, T90 23%, and event-linked HB 18 | Conventional-hypoxemia safety guidance activates independently; event-linked HB phenotype and research-context wording remain absent; PAP is prioritized and objective oxygen control is required. |
| 210 | Symptomatic current BiPAP user with device event index 13, device central index 8, periodic breathing 7%, heart failure, and missing numeric LVEF | Clinician review, central-event safeguards, PSG confirmation, and echocardiogram retrieval activate; the app does not reflexively increase pressure or state that ASV is contraindicated without the LVEF. |
| 211 | Prior failed and intolerable oral appliance with TMJ pain and bite change, now requesting HGNS | Prior barriers remain visible as decision history, but the active confirmed plan contains nerve-stimulation evaluation only and does not reactivate oral-appliance therapy, response tiers, or safety-finalization instructions for an unselected pathway. |
| 212 | Mild supine-predominant OSA with non-supine AHI 6.3 | PAP and positional therapy remain available, but patient and clinician outputs explicitly present positioning as an adjunct because OSA persists off the back. |
