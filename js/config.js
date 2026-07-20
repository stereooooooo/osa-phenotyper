/*  OSA Phenotyper – Centralized Configuration
    All phenotype detection thresholds, confidence tiers, and validation
    ranges live here so every module draws from one source of truth.
--------------------------------------------------------------------*/

const OSA_CONFIG = {

  /* ── Feature toggles ─────────────────────────────────────────── */
  /* deltaHeartRate: the current sleep-study device cannot measure ΔHR, so the
     whole ΔHR pathway (form field, phenotype, recommendation, follow-up) is
     disabled. The detection/confidence/threshold code is all retained — flip
     this to `true` to re-enable it when device support exists. */
  features: {
    deltaHeartRate: false,
    clinicianOnly: true,
    remoteIntake: false,
    patientPortal: false,
    bulkPatientList: false
  },

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
      nonSupIsolatedMax:  5     // <5 identifies a potential supine-isolated pattern; monotherapy still requires confirmation
    },

    remPredominant: {
      remNremRatio:       2.0,
      remNremRatioHigh:   3.0,
      nremMax:            15,
      nremMaxHigh:        10
    },

    hypoxicBurden: {
      // Event-linked hypoxic burden (HB) is the desaturation area attributable to
      // respiratory events divided by sleep time, in %min/h. It is not interchangeable
      // with ODI, T90, nadir SpO2, or area below 90%. No universally validated clinical
      // low/moderate/high categories exist. These values are retained only to describe
      // research-cohort context, never as stand-alone treatment-allocation thresholds.
      // See Azarbarzin 2019; Pinilla 2023; Esmaeili 2023; ATS workshop 2024; Parekh 2026.
      signalBoundary:          30,    // exploratory app signal; cohort-derived, not a clinical category
      isaaccCohortContext:     73.1,  // post hoc ISAACC subgroup cut point, descriptive only
      pooledTrialContext:      87.1,  // pooled post hoc trial subgroup cut point, descriptive only
    },

    nocturnalHypoxemia: {
      // Conventional oxygen metrics remain separate from event-linked HB. These
      // review bands identify substantial nocturnal hypoxemia that warrants clinical
      // attention; they do not create the HB phenotype and do not prove OSA causality.
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
      noseMild:       30,       // clinically meaningful obstruction threshold (Lipan & Most 2013)
      noseSevere:     55,       // severe range: 55-75 (Lipan & Most 2013)
      noseBorderline: 25        // mild symptom range: 5-25
    },

    // HGNS (hypoglossal nerve stimulation) app-level referral thresholds.
    // CCC is device-specific: it contraindicates unilateral Inspire. Current US
    // Genio labeling states that safety/effectiveness in CCC is not established,
    // so CCC must never auto-route a patient to Genio. FDA P130008/S090;
    // FDA P240024 patient labeling and SSED (2025).
    hgns: {
      ahiMin:           15,    // FDA lower bound (Inspire 15-100; Genio FDA range is 15-65)
      ahiMax:           100,   // FDA upper limit (Inspire)
      bmiMax:           40,    // Capital ENT referral guardrail aligned to Inspire's expanded labeling; not universal. Genio safety/effectiveness is not established above BMI 32; payer criteria vary.
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

    // Exploratory MAD response-context factors. These app-created cut points
    // summarize population-level associations only. They must not create an
    // individual response probability, candidacy tier, or treatment ranking.
    // Evidence: Camañes-Gonzalvo 2022, Edwards 2016, Hamza 2026.
    madCandidacy: {
      ahiMild:         5,    // mild OSA, supportive population association
      ahiModerate:     15,   // moderate OSA, supportive population association
      ahiSevere:       30,   // severe OSA, cautionary for complete control by OAT alone
      bmiLow:          28,   // lower BMI, supportive population association
      bmiHigh:         35,   // higher BMI, cautionary population association
      neckFemale:      14,   // smaller-neck context (in), female
      neckMale:        16,   // smaller-neck context (in), male
      hypopneaHigh:    70,   // hypopnea-predominant research context
      hypopneaLow:     50,   // apnea-predominant research context
      ageYoung:        50,   // younger-age research context
      ageOld:          65    // older-age research context
    },

    // Home sleep test (WatchPAT) validity-flag thresholds
    hstValidity: {
      tstDanger:        2,    // TST <2 hrs → danger (inadequate recording)
      tstWarning:       4,    // TST <4 hrs → warning (short recording)
      remMinimumMinutes: 30,  // REM-specific phenotype comparisons require >=30 min REM when stage duration is known (Mokhlesi 2012; ERS review 2024)
      ahiRdiRatioLow:   0.5,  // pAHI/PAT-RDI <0.5 → AHI–RDI discrepancy warning
      tstRemCapture:    5,    // TST <5 hrs + REM AHI 0 → no-REM-captured warning
      ahiLowSymptom:    5,    // AHI <5 …
      essSignificant:   10,   // … with ESS ≥10 → possible false-negative warning
      centralPctDanger: 50,   // central % >50 → danger (predominantly central)
      centralPctWarning: 25,  // central % >25 → warning (significant central)
      csrElevated:      15,   // CSR >15% …
      centralPctLow:    15    // … with central % <15 → CSR-artifact info flag
    },

    // Clinician-only PAP download interpretation. These are review triggers,
    // not autonomous setting-change rules. Device-reported event indices and
    // leak definitions vary by manufacturer. A P95 leak above a reference is a
    // screening signal, not proof of sustained major leak. ATS 2013; ResMed
    // AirSense 11 user guide; AASM 2021 longitudinal testing guidance; Reiter 2016.
    papCompliance: {
      deviceAhiContext: 5,       // 5-<10: interpret with symptoms, leak, event type, and nightly coverage
      deviceAhiReview: 10,       // >=10: clinician review trigger after leak/data-quality assessment
      centralIndexReview: 5,     // possible central-event signal; device estimate requires clinical context
      insuranceFourHourPct: 70,  // common CMS coverage metric, not a biologic efficacy threshold
      partialNightGapHours: 1,   // local workflow flag when average PAP use trails reported sleep by >=1 hour
      resmedLeakP95Nasal: 24,    // L/min P95 screening reference, not a sustained-leak diagnosis; ATS 2013
      resmedLeakP95FullFace: 36, // L/min P95 screening reference, not a sustained-leak diagnosis; ATS 2013
      treatmentEmergentWindowDays: 90 // context window only; never delays urgent evaluation
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
      remPercent: { min: 0,   max: 100 },
      snoreIdx:   { min: 0,   max: 500 },
      hbAreaPH:   { min: 0,   max: 200,  warnMax: 100 },
      hbUnder90PH:{ min: 0,   max: 100,  warnMax: 50  },
      t90:        { min: 0,   max: 100,  warnMax: 50  },
      cpapPressure:{ min: 4,   max: 25,   warnMax: 20  },
      papMinPressure:{ min: 4, max: 25,   warnMax: 20  },
      papMaxPressure:{ min: 4, max: 25,   warnMax: 20  },
      papCpapPressure:{ min: 4, max: 25,  warnMax: 20  },
      papEpapPressure:{ min: 4, max: 25,  warnMax: 20  },
      papIpapPressure:{ min: 4, max: 30,  warnMax: 25  },
      papReportDays:{ min: 1, max: 365 },
      papNightsUsed:{ min: 0, max: 365 },
      papNightsFourHours:{ min: 0, max: 365 },
      papAverageUseHours:{ min: 0, max: 24 },
      papUsualSleepHours:{ min: 0, max: 24 },
      papDeviceAhi:{ min: 0, max: 100, warnMax: 50 },
      papDeviceCai:{ min: 0, max: 100, warnMax: 30 },
      papDeviceOai:{ min: 0, max: 100, warnMax: 50 },
      papLeakValue:{ min: 0, max: 250, warnMax: 150 },
      papLeakThreshold:{ min: 0, max: 250, warnMax: 150 },
      papPressure95:{ min: 0, max: 30, warnMax: 25 },
      papPeriodicBreathingPct:{ min: 0, max: 100, warnMax: 30 },
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
      },
      {
        id: 'apap_min_max',
        fields: ['papMinPressure', 'papMaxPressure'],
        check: (vals) => vals.papMinPressure >= vals.papMaxPressure,
        message: 'APAP minimum pressure must be lower than the maximum pressure.'
      },
      {
        id: 'bipap_epap_ipap',
        fields: ['papEpapPressure', 'papIpapPressure'],
        check: (vals) => vals.papEpapPressure >= vals.papIpapPressure,
        message: 'BiPAP EPAP must be lower than IPAP.'
      },
      {
        id: 'pap_used_gt_report_days',
        fields: ['papNightsUsed', 'papReportDays'],
        check: (vals) => vals.papNightsUsed > vals.papReportDays,
        message: 'PAP nights used cannot exceed the number of report days.'
      },
      {
        id: 'pap_four_hours_gt_used',
        fields: ['papNightsFourHours', 'papNightsUsed'],
        check: (vals) => vals.papNightsFourHours > vals.papNightsUsed,
        message: 'PAP nights with at least 4 hours cannot exceed nights used.'
      },
      {
        id: 'pap_event_components_gt_total',
        fields: ['papDeviceCai', 'papDeviceOai', 'papDeviceAhi'],
        check: (vals) => vals.papDeviceCai + vals.papDeviceOai > vals.papDeviceAhi + 1,
        message: 'PAP central plus obstructive indices exceed the total device event index. Verify the report fields and units.'
      }
    ]
  }
};
