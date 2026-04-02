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
| 42 | Patient PDF pagination | Long patient report with care pathway, checklist groups, and multiple what-if cards — page breaks should prefer section/card boundaries, avoid splitting mid-rec-item, and keep `Your First 30 Days` / `What If…?` headings with their first block |

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
