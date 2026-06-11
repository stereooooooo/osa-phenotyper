/*  OSA Phenotyper – Centralized Configuration
    All phenotype detection thresholds, confidence tiers, and validation
    ranges live here so every module draws from one source of truth.
--------------------------------------------------------------------*/

const OSA_CONFIG = {

  /* ── Phenotype Detection & Confidence Thresholds ─────────────── */
  thresholds: {

    anatomical: {
      bmi:            30,       // trigger (WHO obesity class I)
      bmiHigh:        35,       // high-confidence (class II+)
      neck:           { male: 17, female: 16 },   // inches; Friedman 2002
      neckHigh:       { male: 17.5, female: 16.5 },
      tonsils:        3,        // Friedman grading ≥3
      ftp:            ['III','IV'],  // Friedman Tongue Position
      ahiSevere:      30,
      minCriteria:    3         // of 5 flags must be met
    },

    arousal: {
      ahiMax:         30,       // Edwards 2014: AHI <30
      nadirMin:       82.5,     // Edwards 2014: nadir SpO2 >82.5%
      hypFraction:    58.3,     // Edwards 2014: hypopnea fraction >58.3%
      scoreLikely:    2         // Score >=2 indicates likely low arousal threshold
    },

    loopGain: {
      // DEPRECATED (Phase 2, 2026-06): the numeric loop-gain point estimate was removed.
      // The Schmickl 2022 regression has no published intercept and only AUC 0.73, so a
      // per-patient point estimate over-implied precision. Loop gain is now a QUALITATIVE
      // "possible ventilatory instability" flag driven by the central/periodic-breathing
      // signals below (CSR, pAHIc, CAI). estimateHigh/estimateBorderline are retained only
      // for reference and are no longer used by the engine.
      estimateHigh:   0.7,      // [deprecated] Schmickl 2022: LG >0.7 = high
      estimateBorderline: 0.6,  // [deprecated] borderline instability
      csr:            10,       // central/periodic-breathing signal (Cheyne-Stokes %)
      csrHigh:        20,
      pahic3:         10,       // central-event signal (pAHIc 3%)
      pahic3High:     20,
      pahic4:         5,        // central-event signal (pAHIc 4%)
      pahic4High:     10,
      supportMin:     2         // ≥2 central signals → flag possible ventilatory instability
      // NOTE: CVD remains a confidence modifier only — not a primary trigger
    },

    muscleResponse: {
      ahiMin:             15,   // Lowered from 30; Eckert 2013 PALM IQR 19-56, Sands 2018 validated at AHI≥15
      ahiHigh:            30,   // High confidence only at AHI≥30 (original PALM severe range)
      remNremRatio:       2.0,
      remNremRatioHigh:   2.5,
      nremFloor:          15,   // Avoid co-firing with REM-predominant OSA (NREM AHI <15)
      nremFloorHigh:      20
    },

    positional: {
      supNonSupRatio:     2.0,  // Cartwright 1984, Mador 2005
      supNonSupRatioHigh: 3.0,
      nonSupMax:          15,
      nonSupMaxHigh:      10
    },

    remPredominant: {
      remNremRatio:       2.0,
      remNremRatioHigh:   3.0,
      nremMax:            15,
      nremMaxHigh:        10
    },

    hypoxicBurden: {
      // Composite tiering: worst metric determines tier.
      // IMPORTANT (Phase 2, 2026-06): these cutoffs are POPULATION-DERIVED, not
      // guideline-endorsed action thresholds. 30 is an Azarbarzin 2019 tertile boundary;
      // 73 is the ISAACC cohort median (post-hoc ACS subgroup). HB is a cardiovascular-risk
      // MARKER. A single MODERATE metric flags the phenotype as supportive CONTEXT only —
      // it no longer drives a treatment-urgency recommendation. Urgency / CV framing is
      // reserved for the HIGH tier (hbPerHourHigh / severe-range metrics), where trial
      // evidence for CPAP CV benefit exists. See app.js hbHighTier.
      hbPerHour:          30,   // %min/hr — moderate (phenotype CONTEXT trigger; Azarbarzin tertile)
      hbPerHourHigh:      73,   // %min/hr — high tier; ISAACC: CPAP reduces CV events above this (HR 0.57)
      hbPerHourSevere:    87,   // %min/hr — pooled 2025: high-risk OSA definition (Azarbarzin 2025)
      odi:                20,   // ODI — moderate threshold (strongest HB correlator, r=0.73)
      odiSevere:          50,   // ODI — severe threshold
      nadir:              75,   // SpO₂ % — only triggers at severe level (< 75%)
      nadirSevere:        75,   // SpO₂ % — severe (weaker standalone predictor; Zinchuk 2020)
      t90:                5,    // % time below 90% SpO₂ — moderate threshold
      t90Severe:          20,   // % — severe (OR 2.70 mortality; OR 2.95 HTN)
      areaUnder90:        0.5,  // %min/hr under 90% SpO₂ (kept for backward compat)
      areaUnder90Severe:  2,
    },

    collapsibility: {
      fHypHigh:       50,   // F(hypopneas) <50% → high collapsibility (Vena 2022)
      fHypModerate:   70,   // F(hypopneas) 50-70% → moderate; >70% → low
      lgHighThreshold: 0.7  // Loop gain >0.7 = high (Schmickl 2022, AUC 0.73)
    },

    deltaHeartRate: {
      dhr:            10,       // bpm; Azarbarzin 2021 Eur Heart J
      dhrHigh:        15,
      dhrVeryHigh:    25,
      dhrBorderline:  7         // low confidence
    },

    nasal: {
      noseMild:       25,       // NOSE score ≥25 triggers phenotype (Stewart 2004)
      noseSevere:     50,       // high confidence threshold
      noseBorderline: 15        // low confidence
    },

    // HGNS (Inspire) candidacy thresholds
    hgns: {
      ahiMin:           15,    // FDA lower bound
      ahiMax:           100,   // FDA upper limit
      bmiMax:           40,    // FDA absolute ceiling
      bmiIdeal:         35,    // STAR/ADHERE favorable cutoff
      bmiStar:          32,    // original STAR criterion
      papLow:           8,     // cmH₂O; Lee 2019 — 92% success rate below this
      papHigh:          12,    // above this correlates with worse outcomes
      centralPct:       25,    // central apnea >25% of total = exclusion
      supNonSupRatio:   2.0    // supine-predominant threshold
    },

    // Symptom subtype classification
    subtype: {
      sleepyEss:      15,
      disturbedIsi:   15
    },

    // AHI severity labels (also read by patientReport.js ahiSeverityLabel)
    severity: {
      mild:           5,
      moderate:       15,
      severe:         30
    },

    // MAD (oral appliance) candidacy scoring factors & tier cutoffs
    // Evidence: Camañes-Gonzalvo 2022/2025, Chen 2020, Edwards 2016, Hamza 2026
    madCandidacy: {
      ahiMild:         5,    // AHI 5–<15 → +2 (mild, favorable)
      ahiModerate:     15,   // AHI 15–<30 → +1 (moderate)
      ahiSevere:       30,   // AHI ≥30 → −2 (severe, unfavorable)
      bmiLow:          28,   // BMI <28 → +1
      bmiHigh:         35,   // BMI ≥35 → −1
      neckFemale:      14,   // smaller-neck threshold (in), female → +1
      neckMale:        16,   // smaller-neck threshold (in), male → +1
      hypopneaHigh:    70,   // F(hypopneas) >70 → +1 (hypopnea-predominant)
      hypopneaLow:     50,   // F(hypopneas) <50 → −1 (apnea-predominant)
      ageYoung:        50,   // age <50 → +1
      ageOld:          65,   // age ≥65 → −1
      scoreFavorable:  3,    // score ≥3 → favorable
      scorePoor:       0     // score <0 → poor
    },

    // Home sleep test (WatchPAT) validity-flag thresholds
    hstValidity: {
      tstDanger:        2,    // TST <2 hrs → danger (inadequate recording)
      tstWarning:       4,    // TST <4 hrs → warning (short recording)
      ahiRdiRatioLow:   0.5,  // pAHI/PAT-RDI <0.5 → AHI–RDI discrepancy warning
      tstRemCapture:    5,    // TST <5 hrs + REM AHI 0 → no-REM-captured warning
      ahiLowSymptom:    5,    // AHI <5 …
      essSignificant:   10,   // … with ESS ≥10 → possible false-negative warning
      centralPctDanger: 50,   // central % >50 → danger (predominantly central)
      centralPctWarning: 25,  // central % >25 → warning (significant central)
      csrElevated:      15,   // CSR >15% …
      centralPctLow:    15    // … with central % <15 → CSR-artifact info flag
    }
  },

  /* ── Input Validation Ranges ─────────────────────────────────── */
  validation: {
    ranges: {
      age:        { min: 1,   max: 120,  warnMin: 18,  warnMax: 100 },
      bmi:        { min: 10,  max: 80,   warnMin: 15,  warnMax: 60  },
      neck:       { min: 8,   max: 30,   warnMin: 10,  warnMax: 25  },
      ess:        { min: 0,   max: 24  },
      isi:        { min: 0,   max: 28  },
      pahi:       { min: 0,   max: 200,  warnMax: 150 },
      ahi:        { min: 0,   max: 200,  warnMax: 150 },
      supPahi:    { min: 0,   max: 200,  warnMax: 150 },
      nonSupPahi: { min: 0,   max: 200,  warnMax: 150 },
      remPahi:    { min: 0,   max: 200,  warnMax: 150 },
      nremPahi:   { min: 0,   max: 200,  warnMax: 150 },
      ahiSup:     { min: 0,   max: 200,  warnMax: 150 },
      ahiNonSup:  { min: 0,   max: 200,  warnMax: 150 },
      ahiREM:     { min: 0,   max: 200,  warnMax: 150 },
      ahiNREM:    { min: 0,   max: 200,  warnMax: 150 },
      patRdi:     { min: 0,   max: 200,  warnMax: 150 },
      odi:        { min: 0,   max: 200,  warnMax: 120 },
      nadir:      { min: 0,   max: 100,  warnMin: 40  },
      nadirPsg:   { min: 0,   max: 100,  warnMin: 40  },
      csr:        { min: 0,   max: 100 },
      pahic:      { min: 0,   max: 100 },
      pahic4:     { min: 0,   max: 100 },
      cai:        { min: 0,   max: 100 },
      arInd:      { min: 0,   max: 200,  warnMax: 100 },
      tst:        { min: 0,   max: 24,   warnMin: 2, warnMax: 14 },
      snoreIdx:   { min: 0,   max: 500 },
      hbAreaPH:   { min: 0,   max: 200,  warnMax: 100 },
      hbUnder90PH:{ min: 0,   max: 100,  warnMax: 50  },
      t90:        { min: 0,   max: 100,  warnMax: 50  },
      cpapPressure:{ min: 4,   max: 25,   warnMax: 20  },
      dhr:        { min: 0,   max: 60,   warnMax: 40  },
      dhrPsg:     { min: 0,   max: 60,   warnMax: 40  },
      noseScore:  { min: 0,   max: 100 },
      apneaIndex: { min: 0,   max: 200,  warnMax: 120 },
      hypopneaIndex: { min: 0, max: 200, warnMax: 120 },
      odiPsg:     { min: 0,   max: 200,  warnMax: 120 },
      hbAreaPHpsg:{ min: 0,   max: 200,  warnMax: 100 },
      t90Psg:     { min: 0,   max: 100,  warnMax: 50  }
    },

    // Cross-field plausibility checks (run after individual field validation)
    crossField: [
      {
        id: 'nonSup_gt_sup',
        fields: ['nonSupPahi', 'supPahi'],
        check: (vals) => vals.nonSupPahi > vals.supPahi,
        message: 'Non-supine AHI exceeds supine AHI — unusual, please verify.'
      },
      {
        id: 'nonSup_gt_sup_psg',
        fields: ['ahiNonSup', 'ahiSup'],
        check: (vals) => vals.ahiNonSup > vals.ahiSup,
        message: 'Non-supine AHI exceeds supine AHI — unusual, please verify.'
      },
      {
        id: 'rem_nrem_vs_overall',
        fields: ['remPahi', 'nremPahi', 'pahi'],
        check: (vals) => {
          if (!vals.pahi) return false;
          return (vals.remPahi < vals.pahi * 0.3 && vals.nremPahi < vals.pahi * 0.3);
        },
        message: 'Both REM and NREM pAHI are well below overall pAHI — please verify.'
      },
      {
        id: 'sup_nonsup_vs_overall',
        fields: ['supPahi', 'nonSupPahi', 'pahi'],
        check: (vals) => {
          if (!vals.pahi || !vals.supPahi || !vals.nonSupPahi) return false;
          // If both positional values are much higher than overall, data may be swapped
          return (vals.supPahi > vals.pahi * 2 && vals.nonSupPahi > vals.pahi * 2);
        },
        message: 'Both supine and non-supine pAHI exceed overall pAHI by >2x — possible data entry error.'
      },
      {
        id: 'rem_nrem_vs_overall_psg',
        fields: ['ahiREM', 'ahiNREM', 'ahi'],
        check: (vals) => {
          if (!vals.ahi) return false;
          return (vals.ahiREM && vals.ahiNREM && vals.ahiREM < vals.ahi * 0.3 && vals.ahiNREM < vals.ahi * 0.3);
        },
        message: 'Both REM and NREM AHI are well below overall AHI (Lab PSG) — please verify.'
      }
    ]
  }
};
