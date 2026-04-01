# Patient Report Test Matrix

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
