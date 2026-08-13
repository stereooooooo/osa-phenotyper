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
        // The complete Edwards score is an internally validated screening classifier,
        // not a measured endotype or treatment-selection rule. Cap at Moderate.
        if (score >= T.arousal.scoreLikely && maxScore === 3) return 'Moderate';
        return 'Low';
      }
      case 'High Loop Gain': {
        // Inactive legacy label. Central and periodic-breathing findings remain
        // diagnostic/safety signals but are not loop-gain measurements.
        return 'Low';
      }
      case 'Poor Muscle Responsiveness': {
        // Inactive legacy label. REM/NREM AHI is not a validated measure of
        // upper-airway muscle compensation.
        return 'Low';
      }
      case 'Positional OSA': {
        const pr = ratio(m.sup, m.nons) ?? 0;
        // WatchPAT supplies useful position-specific estimates, but the app does
        // not capture time spent in each position and device-specific positional
        // phenotype agreement has not been established against PSG. Cap the
        // signal at Moderate when it is derived from the home-study fields.
        const hstCap = m.usesHstPositionEstimate === true;
        if(pr >= T.positional.supNonSupRatioHigh) return hstCap ? 'Moderate' : 'High';
        if(pr >= T.positional.supNonSupRatio) return 'Moderate';
        return 'Low';
      }
      case 'REM-Predominant OSA': {
        const rr = ratio(m.remAhi, m.nremAhi) ?? 0;
        // A single-night PAT REM phenotype had 0.68 sensitivity and 0.97
        // specificity versus PSG even with >=30 minutes of REM (Massie 2022).
        // Adequate REM sampling remains required, and home-derived signals are
        // capped at Moderate rather than presented as strong confirmation.
        const hstCap = m.usesHstStageEstimate === true;
        if(rr >= T.remPredominant.remNremRatioHigh && (m.nremAhi||0) < T.remPredominant.nremMaxHigh) return hstCap ? 'Moderate' : 'High';
        if(rr >= T.remPredominant.remNremRatio && (m.nremAhi||0) < T.remPredominant.nremMax) return 'Moderate';
        return 'Low';
      }
      case 'High Hypoxic Burden': {
        const hb = m.hbPH||0;
        /* Event-linked HB is promising but lacks validated clinical categories.
           Even values matching research-cohort cut points remain a Moderate
           research signal rather than a validated High-confidence phenotype. */
        if(hb >= T.hypoxicBurden.signalBoundary) return 'Moderate';
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
