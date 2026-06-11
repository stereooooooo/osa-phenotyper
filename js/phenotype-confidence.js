/*  OSA Phenotyper – Phenotype signal-strength (confidence) scoring
    ─────────────────────────────────────────────────────────────────
    Single source of truth for the phenotype confidence heuristic, shared by
    js/app.js (clinician engine) and tests/tests.html so the logic is no longer
    replicated between the engine and its tests. Depends only on config.js
    (the OSA_CONFIG global), never on app.js — so it is safe to load first.

    NOTE: this is a heuristic support signal, NOT a validated probability.
    Phase 2 of the 2026-06 audit right-sized several of these tiers; see
    docs/citations.md "Phase 2 confidence-calibration changes".
--------------------------------------------------------------------*/
(function (global) {
  'use strict';

  function n(v){ if(v===null||v===undefined||v==='') return null; const x=+v; return (Number.isFinite(x)?x:null); }
  function ratio(a,b){
    const num = n(a);
    const den = n(b);
    if (num === null || den === null) return null;
    if (den === 0) return num > 0 ? Infinity : null;
    return num / den;
  }
  function exists(v){ return v!==null && v!==undefined && v!==''; }

  function confidenceFor(tag, ctx){
    const T = OSA_CONFIG.thresholds;
    const m = ctx.metrics;
    switch(tag){
      case 'High Anatomical Contribution': {
        const neckHigh = m.sex === 'F' ? T.anatomical.neckHigh.female : T.anatomical.neckHigh.male;
        const strong =
          ((m.bmi||0) >= T.anatomical.bmiHigh ? 1 : 0) +
          ((m.neck||0) >= neckHigh ? 1 : 0) +
          ((m.tons||0) >= T.anatomical.tonsils ? 1 : 0) +
          (T.anatomical.ftp.includes(m.mall) ? 1 : 0) +
          ((m.ahi||0) >= T.anatomical.ahiSevere ? 1 : 0);
        if(strong >= 4) return 'High';
        if(strong >= 2) return 'Moderate';
        return 'Low';
      }
      case 'Low Arousal Threshold': {
        const score = m.edwardsArTHScore || 0;
        const maxScore = m.edwardsArTHMaxScore || 0;
        // Full 3-variable Edwards score carries the published 84% accuracy (Edwards 2014).
        if (score >= T.arousal.scoreLikely && maxScore === 3) return score === 3 ? 'High' : 'Moderate';
        // Partial 2-of-3 (hypopnea fraction unavailable, e.g. routine WatchPAT): the validated
        // accuracy does NOT apply to the truncated score — report as low-confidence/incomplete.
        if (score >= T.arousal.scoreLikely && maxScore === 2) return 'Low';
        return 'Low';
      }
      case 'High Loop Gain': {
        // Qualitative ventilatory-instability flag (no numeric estimate). Driven only by the
        // central / periodic-breathing signals the study reports; capped at Moderate because
        // these are supportive signals, not a validated loop-gain measurement.
        const supportCount =
          ((m.csr||0) >= T.loopGain.csr ? 1 : 0) +
          ((m.pahic3||0) >= T.loopGain.pahic3 ? 1 : 0) +
          ((m.pahic4||0) >= T.loopGain.pahic4 ? 1 : 0) +
          ((m.cai||0) >= T.loopGain.pahic3 ? 1 : 0);
        const strong =
          ((m.csr||0) >= T.loopGain.csrHigh ? 1 : 0) +
          ((m.pahic3||0) >= T.loopGain.pahic3High ? 1 : 0) +
          ((m.pahic4||0) >= T.loopGain.pahic4High ? 1 : 0);
        if(supportCount >= 2 && strong >= 1) return 'Moderate';
        if(supportCount >= 2) return m.cvd ? 'Moderate' : 'Low';
        if(supportCount >= 1 && m.cvd) return 'Low';
        return 'Low';
      }
      case 'Poor Muscle Responsiveness': {
        const remNrem = ratio(m.remAhi, m.nremAhi) ?? 0;
        const nrem = exists(m.nremAhi) ? m.nremAhi : 0;
        // Inferred from the REM/NREM event distribution — a surrogate, not a measured
        // pharyngeal-muscle trait. Capped at Moderate confidence (Sands 2018 validated muscle
        // compensation via PSG airflow/Pcrit, not via a REM/NREM ratio).
        if((m.ahi||0) >= T.muscleResponse.ahiMin && remNrem > T.muscleResponse.remNremRatio && nrem >= T.muscleResponse.nremFloor) return 'Moderate';
        return 'Low';
      }
      case 'Positional OSA': {
        const pr = ratio(m.sup, m.nons) ?? 0;
        if(pr >= T.positional.supNonSupRatioHigh && (m.nons||0) < T.positional.nonSupMaxHigh) return 'High';
        if(pr >= T.positional.supNonSupRatio && (m.nons||0) < T.positional.nonSupMax) return 'Moderate';
        return 'Low';
      }
      case 'REM-Predominant OSA': {
        const rr = ratio(m.remAhi, m.nremAhi) ?? 0;
        if(rr >= T.remPredominant.remNremRatioHigh && (m.nremAhi||0) < T.remPredominant.nremMaxHigh) return 'High';
        if(rr >= T.remPredominant.remNremRatio && (m.nremAhi||0) < T.remPredominant.nremMax) return 'Moderate';
        return 'Low';
      }
      case 'High Hypoxic Burden': {
        const hb = m.hbPH||0, hb90 = m.hb90PH||0, odi = m.odi||0, nad = m.nadir??100, tBelow90 = m.t90||0;
        /* High confidence: HB area ≥73 (ISAACC CPAP benefit threshold) OR other metrics in severe range */
        if(hb >= T.hypoxicBurden.hbPerHourHigh || odi > T.hypoxicBurden.odiSevere || nad < T.hypoxicBurden.nadirSevere || tBelow90 > T.hypoxicBurden.t90Severe || hb90 > T.hypoxicBurden.areaUnder90Severe) return 'High';
        /* Moderate tier: any single metric in moderate range (nadir excluded — only triggers at severe) */
        if(hb >= T.hypoxicBurden.hbPerHour || odi >= T.hypoxicBurden.odi || tBelow90 >= T.hypoxicBurden.t90 || hb90 > T.hypoxicBurden.areaUnder90) return 'Moderate';
        return 'Low';
      }
      case 'Nasal-Resistance Contributor': {
        const nose = m.noseScore || 0;
        const hasCT = m.ctSeptum || m.ctTurbs;
        if(nose >= T.nasal.noseSevere || (nose >= T.nasal.noseMild && hasCT)) return 'High';
        if(nose >= T.nasal.noseMild || m.nasalObs || hasCT) return 'Moderate';
        if(nose >= T.nasal.noseBorderline) return 'Low';
        return 'Low';
      }
      case 'Elevated Delta Heart Rate': {
        const dhr = m.dhr || 0;
        if(dhr >= T.deltaHeartRate.dhrHigh) return 'High';
        if(dhr >= T.deltaHeartRate.dhr) return 'Moderate';
        if(dhr >= T.deltaHeartRate.dhrBorderline) return 'Low';
        return 'Low';
      }
      default: return 'Moderate';
    }
  }

  global.OSAPhenotype = { confidenceFor };
})(typeof window !== 'undefined' ? window : this);
