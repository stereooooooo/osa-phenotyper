/*  OSA Phenotyper – PALM + extras (US-English)
    Depends on: js/config.js, js/validate.js, js/report-shared.js (loaded before this file)
    ─────────────────────────────────────────────────────────────────
    WHAT'S NEW in this refactor:
    • All thresholds now sourced from OSA_CONFIG (config.js)
    • Input validation on blur + form-level blocking (validate.js)
    • Sex-specific neck circumference thresholds
    • CVD removed as standalone HLG trigger (confidence modifier only)
    • Removed silent non-supine AHI=1 default (explicit prompt instead)
    • Delta Heart Rate phenotype ready (field added in Phase 4)
--------------------------------------------------------------------*/

/* ── Utility helpers ──────────────────────────────────────────── */
function n(v){ if(v===null||v===undefined||v==='') return null; const x=+v; return (Number.isFinite(x)?x:null); }
function ratio(a,b){
  const num = n(a);
  const den = n(b);
  if (num === null || den === null) return null;
  if (den === 0) return num > 0 ? Infinity : null;
  return num / den;
}
function formatRatio(val, digits=1){
  if (val === null || val === undefined) return '—';
  if (!Number.isFinite(val)) return '∞';
  return val.toFixed(digits);
}
function yes(f,key){ return f.get(key)==='on' || f.get(key)==='Yes' || (f.getAll(key)||[]).includes('on') || (f.getAll(key)||[]).includes('Yes'); }
function exists(v){ return v!==null && v!==undefined && v!==''; }

/* ── Dedupe-able recommendations ──────────────────────────────── */
const recSeen = new Set();
const recTagMap = [];  // parallel array: [{text, tag}, ...]
function pushRec(arr, text, tag){
  const key = (tag || text.trim().toLowerCase().slice(0,60));
  if(recSeen.has(key)) return;
  recSeen.add(key);
  arr.push(text);
  recTagMap.push({ text, tag: tag || key });
}

/* ── Shorthand for threshold access ───────────────────────────── */
const T = OSA_CONFIG.thresholds;
let lastAnalysisData = null;

/* ── Signal-strength helper (heuristic support, not validated probability) ── */
function confidenceFor(tag, ctx){
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
      if (score >= T.arousal.scoreLikely && maxScore === 3) return score === 3 ? 'High' : 'Moderate';
      if (score >= T.arousal.scoreLikely && maxScore === 2) return 'Moderate';
      return 'Low';
    }
    case 'High Loop Gain': {
      const lg = m.lgEstimate;
      const supportCount =
        ((m.csr||0) >= T.loopGain.csr ? 1 : 0) +
        ((m.pahic3||0) >= T.loopGain.pahic3 ? 1 : 0) +
        ((m.pahic4||0) >= T.loopGain.pahic4 ? 1 : 0) +
        ((m.cai||0) >= T.loopGain.pahic3 ? 1 : 0);
      if(exists(lg) && lg >= T.loopGain.estimateHigh) return supportCount >= 1 ? 'High' : 'Moderate';
      if(exists(lg) && lg >= T.loopGain.estimateBorderline) return supportCount >= 1 || m.cvd ? 'Moderate' : 'Low';
      if(supportCount >= 2) return m.cvd ? 'High' : 'Moderate';
      if(supportCount >= 1 && m.cvd) return 'Moderate';
      return 'Low';
    }
    case 'Poor Muscle Responsiveness': {
      const remNrem = ratio(m.remAhi, m.nremAhi) ?? 0;
      const nrem = exists(m.nremAhi) ? m.nremAhi : 0;
      /* High confidence: persistent NREM burden + strong REM/NREM skew */
      if((m.ahi||0) >= T.muscleResponse.ahiHigh && remNrem > T.muscleResponse.remNremRatioHigh && nrem >= T.muscleResponse.nremFloorHigh) return 'High';
      /* Moderate: AHI≥15 validated by Sands 2018, Bamagoos 2019 */
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

/* ── AHI severity label helper ────────────────────────────────── */
function ahiSeverity(ahi) {
  if (!exists(ahi) || ahi < T.severity.mild) return null;
  if (ahi >= T.severity.severe)   return 'Severe';
  if (ahi >= T.severity.moderate) return 'Moderate';
  return 'Mild';
}

function buildInsufficientDataAssessment(ctx) {
  if (!ctx || !ctx.osaConfirmed) return [];

  const domains = [];

  if (!ctx.oxygenCompositeSufficient) {
    const metricCount = ctx.oxygenMetricCount || 0;
    const hasPartialOxygenData = metricCount > 0;
    domains.push({
      key: 'oxygen',
      clinician: hasPartialOxygenData
        ? `Only ${metricCount} oxygen-burden metric${metricCount === 1 ? '' : 's'} entered (ODI, T90, nadir, or hypoxic burden area). Low-hypoxic-burden framing and cardiovascular-risk de-emphasis should stay unavailable until fuller oxygen data are reviewed.`
        : 'No oxygen-burden metrics entered (ODI, T90, nadir, or hypoxic burden area). Cardiovascular risk stratification and low-hypoxic-burden treatment de-emphasis should be treated as unavailable.',
      patient: hasPartialOxygenData
        ? 'Only part of your overnight oxygen data is available so far, so we should not yet assume the oxygen-related risk is low or move CPAP lower on the list based on incomplete oxygen information.'
        : 'We still need fuller overnight oxygen information to judge how strongly your sleep apnea affected oxygen levels and long-term risk.',
    });
  }

  if (!exists(ctx.sup) || !exists(ctx.nons)) {
    const positionalMissing = [];
    if (!exists(ctx.sup)) positionalMissing.push('supine AHI');
    if (!exists(ctx.nons)) positionalMissing.push('non-supine AHI');
    domains.push({
      key: 'position',
      clinician: `Positional tracking is incomplete (${positionalMissing.join(', ')} missing). Do not treat the absence of a positional phenotype as evidence that side-sleeping will not matter.`,
      patient: 'Your sleep study did not clearly compare back-sleeping with side-sleeping, so we cannot yet tell how much body position changes your sleep apnea.',
    });
  }

  if (!exists(ctx.remAhi) || !exists(ctx.nremAhi)) {
    const sleepStageMissing = [];
    if (!exists(ctx.remAhi)) sleepStageMissing.push('REM AHI');
    if (!exists(ctx.nremAhi)) sleepStageMissing.push('NREM AHI');
    domains.push({
      key: 'sleep-stage',
      clinician: `REM/NREM staging data are incomplete (${sleepStageMissing.join(', ')} missing). REM-predominant OSA and REM-specific treatment needs cannot be assessed reliably.`,
      patient: 'Your available sleep-study data did not clearly separate dream sleep from non-dream sleep, so we cannot yet tell whether your breathing is especially worse during REM sleep.',
    });
  }

  if (!exists(ctx.fHypopneas)) {
    domains.push({
      key: 'endotyping',
      clinician: 'Apnea/hypopnea breakdown is unavailable. Collapsibility estimate, full Edwards arousal-threshold scoring, and point-of-care loop-gain estimation are incomplete; do not treat the absence of those endotypes as exclusion.',
      patient: 'Some of the more detailed breathing-pattern estimates still need a fuller breakdown of how many events were apneas versus hypopneas, so a few parts of your endotype-based treatment matching may still be refined.',
    });
  }

  const anatomyMissing = [];
  if (!exists(ctx.bmi)) anatomyMissing.push('BMI');
  if (!exists(ctx.tons)) anatomyMissing.push('tonsil size');
  if (!exists(ctx.mall)) anatomyMissing.push('Friedman tongue position');
  if (anatomyMissing.length >= 2) {
    domains.push({
      key: 'anatomy',
      clinician: `Upper-airway anatomy is incompletely documented (${anatomyMissing.join(', ')} missing). Anatomy-driven phenotypes and surgery/MAD matching should be deferred until the exam is completed.`,
      patient: 'Some parts of your throat exam are still missing, so anatomy-based treatment options should stay provisional until your airway exam is completed.',
    });
  }

  const hnsReferenced = ctx.prefInspire || ctx.prefSurgery || (Array.isArray(ctx.recTags) && ctx.recTags.some(rec => ['HNS', 'INSPIRE-EVAL', 'INSPIRE-OPT'].includes(rec.tag)));
  if (hnsReferenced && (!ctx.hasDISEData || ctx.hnsStage?.insufficient)) {
    const hnsMissing = [];
    if (!ctx.hasDISEData) hnsMissing.push('DISE');
    if (ctx.hnsStage?.insufficient) hnsMissing.push(...(ctx.hnsStage.missing || []));
    const deduped = [...new Set(hnsMissing)];
    domains.push({
      key: 'hns-workup',
      clinician: `Inspire/HGNS workup is incomplete (${deduped.join(', ')} missing). HNS candidacy and expected response should be deferred until the workup is completed.`,
      patient: 'If Inspire or other airway procedures are being considered, more evaluation is still needed before those options can be judged accurately.',
    });
  }

  return domains;
}

function buildTreatmentSafetyAssessment(ctx) {
  if (!ctx || !ctx.osaConfirmed) return [];

  const tags = new Set(
    (Array.isArray(ctx.recTags) ? ctx.recTags : [])
      .map(rec => rec?.tag)
      .filter(Boolean)
  );
  const alerts = [];

  // MAD safety checks remain clinician prerequisites even when phenotype matching is favorable.
  const madReferenced = ['MAD', 'MAD-FAVORABLE', 'MAD-POOR', 'REM-MAD'].some(tag => tags.has(tag));
  if (madReferenced && !ctx.priorMAD) {
    const madContraReasons = [];
    const madCautionNotes = [];

    if (ctx.madDentition === 'limited') madContraReasons.push('limited tooth support / dentition');
    if (ctx.madProtrusion === 'limited') madContraReasons.push('limited mandibular protrusion');
    if (ctx.madTmj === 'severe') madContraReasons.push('active or severe TMJ dysfunction');
    if (ctx.madTmj === 'mild') madCautionNotes.push('a history of TMJ symptoms still warrants sleep-dentist review');
    if (ctx.priorJaw) madCautionNotes.push('prior jaw surgery still warrants occlusal review');

    if (madContraReasons.length) {
      alerts.push({
        key: 'mad-safety-limit',
        clinician: `Oral appliance therapy is currently a poor or potentially unsafe fit because of ${madContraReasons.join(', ')}. Reframe MAD as limited/unfavorable unless a sleep-dentist evaluation changes that assessment.`,
        patient: 'Your current jaw or dental findings make an oral appliance less likely to be a safe or practical fit right now, so your care team should not treat it as a finalized option until that is reviewed carefully.',
      });
    } else if (!ctx.madDentition || !ctx.madProtrusion || !ctx.madTmj || madCautionNotes.length) {
      alerts.push({
        key: 'mad-workup',
        clinician: `Before finalizing oral appliance therapy, confirm adequate dentition, adequate mandibular protrusion, and absence of severe TMJ dysfunction${madCautionNotes.length ? `; ${madCautionNotes.join('; ')}` : ''}.`,
        patient: 'If an oral appliance is being considered, a sleep-dentist exam is still needed to confirm that your teeth, jaw movement, and jaw joints make it a safe fit.',
      });
    }
  }

  // ASV requires preserved or documented-safe systolic function (SERVE-HF guardrail).
  if (tags.has('HLG-ADV')) {
    if (exists(ctx.lvef) && ctx.lvef <= 45) {
      alerts.push({
        key: 'asv-contra',
        clinician: `Documented LVEF ${ctx.lvef}% is at or below the SERVE-HF safety threshold. Suppress ASV-specific routing and treat persistent central-instability management as specialist review territory instead.`,
        patient: 'Your documented heart-pumping function is below the safety range for ASV, so that device should not be treated as a routine option in your plan unless a specialist says otherwise.',
      });
    } else if (!exists(ctx.lvef)) {
      alerts.push({
        key: 'asv-safety',
        clinician: 'If ASV is being considered, document LVEF >45% first. ASV is contraindicated in HFrEF with LVEF \u226445%.',
        patient: 'If an advanced PAP device such as ASV is being considered, your care team may need to confirm your heart function first because not every PAP device is safe for every heart condition.',
      });
    }
  }

  // WatchPAT-derived central/CSR signals can raise suspicion for central instability,
  // but PSG remains the confirmation step before central-apnea-directed therapy is finalized.
  const hasHomeStudyCentralSignals =
    (ctx.studyType === 'watchpat' || ctx.studyType === 'both') &&
    [ctx.csr, ctx.pahic3, ctx.pahic4].some(exists);
  const hasPSGCentralConfirmation =
    ctx.studyType === 'psg' ||
    ((ctx.studyType === 'both' || ctx.studyType === 'psg') && exists(ctx.cai));
  if (tags.has('HLG-ADV') && hasHomeStudyCentralSignals && !hasPSGCentralConfirmation) {
    alerts.push({
      key: 'central-psg-workup',
      clinician: 'WatchPAT-derived central or periodic-breathing signals should be confirmed with in-lab PSG before choosing central-apnea-directed therapy such as ASV, oxygen, or acetazolamide.',
      patient: 'Your home sleep study suggested some breathing-instability patterns that may need a full in-lab sleep study before advanced central-apnea treatments are chosen.',
    });
  }

  // DISE remains the planning prerequisite before final site-directed airway surgery selection.
  const surgeryReferenced = ctx.prefSurgery || [
    'SURG',
    'SURGALT',
    'SURG-PREF',
    'SOFT-TISSUE-REVISION',
    'SOFT-TISSUE-STRONG',
    'SOFT-TISSUE-CONSIDER',
    'SOFT-TISSUE-GENERAL',
    'FRIEDMAN-III-ALT',
  ].some(tag => tags.has(tag));
  if (surgeryReferenced && !ctx.hasDISEData) {
    alerts.push({
      key: 'surgery-workup',
      clinician: 'Before finalizing site-directed airway surgery, complete DISE to map the collapse pattern and target levels.',
      patient: 'If surgery is being considered, a sleep endoscopy (DISE) may still be needed to show exactly where your airway collapses before choosing the procedure.',
    });
  }

  return alerts;
}

function applyInsufficientDataGuardrails(recEntries, insufficientDataDomains) {
  const entries = Array.isArray(recEntries) ? recEntries.map(entry => ({
    text: entry?.text || '',
    tag: entry?.tag || '',
  })) : [];
  if (!entries.length || !Array.isArray(insufficientDataDomains) || !insufficientDataDomains.length) {
    return entries;
  }

  const domainKeys = new Set(
    insufficientDataDomains
      .map(domain => domain?.key)
      .filter(Boolean)
  );
  const suppressedTags = new Set();
  const prependedEntries = [];
  const guardedEntries = [];

  if (domainKeys.has('oxygen')) {
    prependedEntries.push({
      text: 'Review the full sleep-study oxygen metrics (ODI, T90, nadir, and hypoxic burden when available) before labeling cardiovascular risk as low or de-emphasizing CPAP.',
      tag: 'OXYGEN-WORKUP',
    });
  }

  if (domainKeys.has('position')) {
    prependedEntries.push({
      text: 'Review positional tracking or repeat the study with positional data before concluding that sleep position does not matter.',
      tag: 'POSITION-WORKUP',
    });
  }

  if (domainKeys.has('sleep-stage')) {
    prependedEntries.push({
      text: 'Review REM/NREM staging data before concluding that REM-specific worsening is absent.',
      tag: 'SLEEP-STAGE-WORKUP',
    });
  }

  if (domainKeys.has('endotyping')) {
    prependedEntries.push({
      text: 'Review the detailed apnea-versus-hypopnea scoring before treating collapsibility, arousal-threshold, or loop-gain estimates as complete.',
      tag: 'ENDOTYPE-WORKUP',
    });
  }

  if (domainKeys.has('anatomy')) {
    [
      'TONSIL',
      'SURG',
      'SURGALT',
      'SURG-PREF',
      'FRIEDMAN-III-ALT',
      'SOFT-TISSUE-REVISION',
      'SOFT-TISSUE-STRONG',
      'SOFT-TISSUE-CONSIDER',
      'SOFT-TISSUE-GENERAL',
      'HNS',
      'INSPIRE-EVAL',
    ].forEach(tag => suppressedTags.add(tag));

    prependedEntries.push({
      text: 'Complete the upper-airway anatomy exam (BMI, tonsil size, and Friedman tongue position) before finalizing surgery- or anatomy-matched therapy recommendations.',
      tag: 'ANATOMY-WORKUP',
    });
  }

  if (domainKeys.has('hns-workup')) {
    ['HNS', 'INSPIRE-EVAL'].forEach(tag => suppressedTags.add(tag));
    prependedEntries.push({
      text: 'Complete the Inspire/HGNS workup with DISE and all required staging inputs before finalizing candidacy or expected response.',
      tag: 'HNS-WORKUP',
    });
  }

  const hasGenericMad = entries.some(entry => entry.tag === 'MAD');
  let addedGuardedMad = false;

  entries.forEach((entry) => {
    if (!entry.text || !entry.tag) return;

    if (domainKeys.has('anatomy') && (entry.tag === 'MAD-FAVORABLE' || entry.tag === 'MAD-POOR')) {
      if (!hasGenericMad && !addedGuardedMad) {
        guardedEntries.push({
          text: 'Custom oral appliance (MAD) remains a possible option, but candidacy should be finalized after a complete airway exam.',
          tag: 'MAD',
        });
        addedGuardedMad = true;
      }
      return;
    }

    if (suppressedTags.has(entry.tag)) return;
    guardedEntries.push(entry);
  });

  const seen = new Set();
  return [...prependedEntries, ...guardedEntries].filter((entry) => {
    const key = `${entry.tag}::${entry.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyTreatmentSafetyGuardrails(recEntries, safetyAlerts) {
  const entries = Array.isArray(recEntries) ? recEntries.map(entry => ({
    text: entry?.text || '',
    tag: entry?.tag || '',
  })) : [];
  if (!entries.length || !Array.isArray(safetyAlerts) || !safetyAlerts.length) {
    return entries;
  }

  const safetyKeys = new Set(
    safetyAlerts
      .map(alert => alert?.key)
      .filter(Boolean)
  );
  const prependedEntries = [];
  const suppressedTags = new Set();

  if (safetyKeys.has('mad-workup')) {
    prependedEntries.push({
      text: 'Before finalizing oral appliance therapy, have a sleep dentist confirm adequate dentition, jaw movement, and TMJ safety.',
      tag: 'MAD-WORKUP',
    });
  }

  if (safetyKeys.has('mad-safety-limit')) {
    ['MAD', 'MAD-FAVORABLE', 'MAD-POOR', 'REM-MAD'].forEach(tag => suppressedTags.add(tag));
    prependedEntries.push({
      text: 'Current dental or jaw findings make an oral appliance a limited or potentially unsafe option until a sleep-dentist review says otherwise.',
      tag: 'MAD-SAFETY-LIMIT',
    });
  }

  if (safetyKeys.has('central-psg-workup')) {
    suppressedTags.add('HLG-ADV');
    prependedEntries.push({
      text: 'Because the central-breathing instability was inferred from a home sleep test, confirm it on in-lab PSG before finalizing ASV or other central-directed therapy.',
      tag: 'CENTRAL-PSG-WORKUP',
    });
  }

  if (safetyKeys.has('asv-safety')) {
    prependedEntries.push({
      text: 'If ASV is being considered, confirm LVEF is above 45% first because ASV is contraindicated in reduced ejection fraction heart failure.',
      tag: 'ASV-SAFETY',
    });
  }

  if (safetyKeys.has('asv-contra')) {
    suppressedTags.add('HLG-ADV');
    prependedEntries.push({
      text: 'Documented reduced ejection fraction makes ASV unsafe right now, so persistent central-breathing treatment should stay in specialist-review territory rather than a routine recommendation.',
      tag: 'ASV-CONTRA',
    });
  }

  if (safetyKeys.has('surgery-workup')) {
    [
      'SOFT-TISSUE-REVISION',
      'SOFT-TISSUE-STRONG',
      'SOFT-TISSUE-CONSIDER',
      'SOFT-TISSUE-GENERAL',
      'FRIEDMAN-III-ALT',
    ].forEach(tag => suppressedTags.add(tag));

    prependedEntries.push({
      text: 'Complete DISE-guided surgical planning before finalizing a specific airway procedure target.',
      tag: 'SURGERY-WORKUP',
    });
  }

  const seen = new Set();
  return [...prependedEntries, ...entries.filter(entry => !suppressedTags.has(entry.tag))].filter((entry) => {
    const key = `${entry.tag}::${entry.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── Print CSS injection ──────────────────────────────────────── */
(function ensurePrintStyles(){
  const style = document.createElement('style');
  style.type='text/css';
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      .patient-report, .patient-report * { visibility: visible !important; }
      .patient-report { position: absolute; left: 0; top: 0; width: 100%; padding: 1rem; }
      .no-print { display: none !important; }
      h2, h3, h4, h5 { page-break-after: avoid; }
      ul, ol { page-break-inside: avoid; }
    }
  `;
  document.head.appendChild(style);
})();

/* ── Attach live validation ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  if (form) OSAValidation.attachLiveValidation(form);
});

/* ── HGNS (Inspire) Candidacy Assessment ─────────────────────── */
/**
 * Builds an evidence-based HGNS candidacy assessment from patient data.
 * Returns a structured result object used to render the clinician report section.
 */
function buildHGNSAssessment(ctx) {
  const H = T.hgns;
  const result = {
    eligible: null,           // true / false / null (insufficient data)
    eligibilityIssues: [],    // strings explaining why not eligible
    favorable: [],            // { factor, detail, cite }
    unfavorable: [],          // { factor, detail, cite }
    assessment: '',           // summary label
    assessmentDetail: '',     // prose explanation
    priorInspire: false       // redirect to optimization
  };

  const {
    ahi, bmi, sex, sup, nons, cpapFailed, prefAvoidCpap, priorInspire,
    vDeg, vPat, oDeg, oPat, tDeg, tPat,
    pahic3, pahic4, csr, cai, cpapPressure,
    phenotypes, hasDISEData
  } = ctx;

  // ── Prior Inspire shortcut ──
  if (priorInspire) {
    result.priorInspire = true;
    result.assessment = 'Prior Inspire — optimize existing device';
    result.assessmentDetail = 'Patient already has an Inspire implant. Focus on verifying activation, optimizing voltage and timing settings, and ensuring adequate adherence. Re-evaluate with a sleep study on-therapy if symptoms persist.';
    return result;
  }

  // ── Eligibility checks ──
  if (!exists(ahi)) {
    result.eligible = null;
    result.assessment = 'Insufficient data';
    result.assessmentDetail = 'AHI is required to assess HGNS candidacy. Enter sleep study data and regenerate.';
    return result;
  }

  let eligible = true;

  if (ahi < H.ahiMin) {
    eligible = false;
    result.eligibilityIssues.push(`AHI ${ahi} is below the minimum threshold of ${H.ahiMin} (FDA indication requires AHI ≥ ${H.ahiMin}).`);
  }
  if (ahi > H.ahiMax) {
    result.eligibilityIssues.push(`AHI ${ahi} exceeds the FDA-approved upper limit of ${H.ahiMax}. Very high AHI correlates with more severe collapse patterns less responsive to tongue protrusion alone.`);
    eligible = false;
  }
  if (exists(bmi) && bmi > H.bmiMax) {
    eligible = false;
    result.eligibilityIssues.push(`BMI ${bmi} exceeds the FDA ceiling of ${H.bmiMax}. Anatomical constraints at this BMI level typically limit HGNS effectiveness.`);
  }
  if (!cpapFailed) {
    eligible = false;
    result.eligibilityIssues.push(
      prefAvoidCpap
        ? 'Patient prefers to avoid CPAP, but HGNS generally requires documented PAP failure or intolerance before candidacy evaluation.'
        : 'HGNS is indicated only after documented PAP failure or intolerance. No PAP failure/intolerance is documented.'
    );
  }

  // Central apnea proportion
  let centralPct = null;
  if (exists(cai) && exists(ahi) && ahi > 0) {
    centralPct = (cai / ahi) * 100;
  } else if (exists(pahic3) && exists(ahi) && ahi > 0) {
    centralPct = (pahic3 / ahi) * 100;
  }
  if (centralPct !== null && centralPct > H.centralPct) {
    eligible = false;
    result.eligibilityIssues.push(`Central apnea index is ${centralPct.toFixed(0)}% of total AHI, exceeding the ${H.centralPct}% threshold. HGNS targets obstructive events; predominantly central apnea requires a different approach.`);
  }

  // CCC at velum — strongest DISE contraindication
  const hasCCC = (vDeg === '2' && vPat === 'Concentric');
  if (hasCCC) {
    eligible = false;
    result.eligibilityIssues.push('Complete concentric collapse (CCC) at the velum on DISE. This is the primary anatomical contraindication for HGNS — tongue protrusion cannot open a circumferentially collapsing soft palate.');
  }

  result.eligible = eligible;

  // ── If clearly ineligible on hard criteria, stop early ──
  if (!eligible && result.eligibilityIssues.length > 0) {
    // Still evaluate factors for educational value, but set assessment
    result.assessment = 'Not a candidate';
    result.assessmentDetail = 'This patient does not currently meet HGNS eligibility criteria. See specific issues above.';
  }

  // ── Favorable factors ──
  if (exists(bmi)) {
    if (bmi <= H.bmiStar) {
      result.favorable.push({ factor: 'BMI ≤ 32', detail: `BMI ${bmi} is within the original STAR trial criterion. Lower BMI strongly predicts treatment success.`, cite: 'Strollo 2014; ADHERE registry' });
    } else if (bmi <= H.bmiIdeal) {
      result.favorable.push({ factor: 'BMI ≤ 35', detail: `BMI ${bmi} is within the expanded real-world ADHERE range. ADHERE data shows 8.5% decrease in odds of success per unit BMI increase.`, cite: 'Heiser 2019 ADHERE' });
    } else if (bmi <= H.bmiMax) {
      result.unfavorable.push({ factor: 'BMI 35–40', detail: `BMI ${bmi} is above the ideal range. Patients with BMI 32–35 had 75% lower odds of treatment response vs ≤ 32 (OR 0.25). Effectiveness at this BMI depends heavily on absence of CCC on DISE.`, cite: 'Washington Univ. cohort; Steffen 2022' });
    }
  }

  if (exists(ahi)) {
    if (ahi >= 20 && ahi <= 50) {
      result.favorable.push({ factor: 'AHI in optimal range', detail: `AHI ${ahi} is within the original STAR trial range of 20–50, where the strongest efficacy data exists. FDA approval now covers AHI 15–100.`, cite: 'Strollo 2014 STAR; FDA P130008/S090' });
    } else if (ahi >= H.ahiMin && ahi < 20) {
      result.favorable.push({ factor: 'AHI in lower supported range', detail: `AHI ${ahi} meets the current FDA lower bound (15–100), though it sits below the original STAR lower cut point of 20. Shared decision-making should rely more heavily on anatomy, PAP history, and DISE findings in this range.`, cite: 'FDA P130008/S090; Strollo 2014 STAR' });
    } else if (ahi > 50 && ahi <= 65) {
      result.favorable.push({ factor: 'AHI in supported range', detail: `AHI ${ahi} is within the FDA-approved range (15–100). ADHERE registry data supports efficacy up to AHI 65 with strong evidence.`, cite: 'Thaler 2020 ADHERE' });
    } else if (ahi > 65 && ahi <= H.ahiMax) {
      result.unfavorable.push({ factor: 'AHI > 65', detail: `AHI ${ahi} is within the FDA-approved range (15–100) but exceeds the ADHERE evidence base (15–65). Higher AHI correlates with more severe collapse patterns that may be less responsive to tongue protrusion alone. Limited outcome data in this range.`, cite: 'ADHERE registry; FDA labeling' });
    } else if (ahi > H.ahiMax) {
      result.unfavorable.push({ factor: 'AHI > 100', detail: `AHI ${ahi} exceeds the FDA-approved upper limit of 100. Very high AHI correlates with severe multilevel collapse less responsive to tongue protrusion.`, cite: 'FDA labeling' });
    }
  }

  if (sex === 'F') {
    result.favorable.push({ factor: 'Female sex', detail: 'Female sex is a positive predictor of HGNS success in ADHERE registry data. Women tend to have lower BMI, less severe collapsibility, and favorable collapse anatomy.', cite: 'ADHERE registry' });
  }

  // DISE factors
  if (hasDISEData) {
    if (!hasCCC) {
      result.favorable.push({ factor: 'No CCC at velum', detail: 'Absence of complete concentric collapse at the velum is the most critical DISE-based positive predictor. STAR Phase II showed success in 8/10 patients with AP velum collapse vs < 50% with CCC.', cite: 'Vanderveken 2017; Kezirian 2020' });
    }

    // Tongue base AP complete collapse — positive predictor
    if (tDeg === '2' && tPat === 'AP') {
      result.favorable.push({ factor: 'Complete tongue base AP collapse', detail: 'Complete anteroposterior tongue base collapse on DISE is a positive predictor — this is the exact obstruction pattern that HGNS-driven tongue protrusion is designed to resolve.', cite: 'Huyett 2021 multicenter DISE study' });
    } else if (tDeg === '1' && tPat === 'AP') {
      result.favorable.push({ factor: 'Partial tongue base AP collapse', detail: 'Anteroposterior tongue base collapse, even partial, is a favorable pattern for HGNS.', cite: 'Huyett 2021' });
    }

    // Oropharyngeal lateral wall collapse — negative
    if (oPat === 'Lateral' && (oDeg === '1' || oDeg === '2')) {
      result.unfavorable.push({ factor: 'Lateral oropharyngeal collapse', detail: `${oDeg === '2' ? 'Complete' : 'Partial'} lateral wall collapse at the oropharynx. Lateral wall collapse is a negative predictor — tongue advancement does not address lateral pharyngeal wall narrowing.`, cite: 'Grillet 2024 systematic review' });
    }

    // Oropharyngeal concentric collapse — negative
    if (oPat === 'Concentric' && oDeg === '2') {
      result.unfavorable.push({ factor: 'Complete oropharyngeal concentric collapse', detail: 'Complete concentric collapse at the oropharynx is a negative predictor of HGNS success, similar in mechanism to palatal CCC.', cite: 'Grillet 2024 systematic review' });
    }
  } else {
    // No DISE data entered
    result.unfavorable.push({ factor: 'DISE not performed', detail: 'Drug-induced sleep endoscopy is required before HGNS implantation. DISE findings — particularly the presence or absence of CCC at the velum — are the most direct anatomical predictor of response.', cite: 'FDA label; Vanderveken 2017' });
  }

  // Therapeutic CPAP pressure
  if (exists(cpapPressure)) {
    if (cpapPressure < H.papLow) {
      result.favorable.push({ factor: 'Low therapeutic pressure', detail: `Therapeutic PAP of ${cpapPressure} cmH₂O is below ${H.papLow}. The low-pressure group (<8 cmH₂O) achieved 92% HGNS response rate vs 44% in the high-pressure group (p < 0.01). Low PAP implies less severe collapsibility — favorable endotypic terrain.`, cite: 'Lee 2019 JCSM' });
    } else if (cpapPressure >= H.papHigh) {
      result.unfavorable.push({ factor: 'High therapeutic pressure', detail: `Therapeutic PAP of ${cpapPressure} cmH₂O suggests more severe or anatomically fixed collapsibility. Higher pressures correlate with lower HGNS response rates.`, cite: 'Lee 2019 JCSM' });
    }
  }

  // Supine-predominant OSA — always comment when positional data is available
  if (exists(sup) && exists(nons)) {
    if (nons > 0) {
      const supRatio = sup / nons;
      if (supRatio >= H.supNonSupRatio && nons < 10) {
        result.unfavorable.push({ factor: 'Supine-predominant OSA', detail: `Supine/non-supine ratio is ${supRatio.toFixed(1)}x. Only 39% of supine-predominant patients achieved treatment response vs 78% overall. Supine-dependent anatomy may involve multilevel collapse that HGNS alone cannot resolve.`, cite: 'ADHERE adjusted analysis' });
      } else {
        result.favorable.push({ factor: 'No supine predominance', detail: `Supine/non-supine AHI ratio is ${supRatio.toFixed(1)}x (supine ${sup}, non-supine ${nons}). OSA is not position-dependent, which is favorable — supine-predominant patients have significantly lower HGNS response rates (39% vs 78%).`, cite: 'ADHERE adjusted analysis' });
      }
    } else if (nons === 0 && sup > 0) {
      result.unfavorable.push({ factor: 'Exclusively supine OSA', detail: `All obstructive events occur in the supine position (non-supine AHI is 0). Strongly position-dependent anatomy may involve multilevel collapse that HGNS alone cannot resolve. Only 39% of supine-predominant patients achieved treatment response.`, cite: 'ADHERE adjusted analysis' });
    }
  }

  // Endotype-based factors — always comment when WatchPAT CSR/central data is available
  if (phenotypes.includes('High Loop Gain')) {
    result.unfavorable.push({ factor: 'High loop gain phenotype', detail: 'Elevated ventilatory loop gain indicates central/neurochemical breathing instability. HGNS targets anatomical obstruction; patients with high loop gain have predominantly non-anatomical pathophysiology and are less likely to respond.', cite: 'Op de Beeck 2021 AJRCCM' });
  } else if (exists(csr) || exists(pahic3) || exists(cai)) {
    // CSR/central data available but no high loop gain detected — favorable
    const csrNote = exists(csr) ? `CSR ${csr}%` : '';
    const centralNote = exists(pahic3) ? `central AHI ${pahic3}` : exists(cai) ? `CAI ${cai}` : '';
    const details = [csrNote, centralNote].filter(Boolean).join(', ');
    result.favorable.push({ factor: 'No high loop gain', detail: `No elevated ventilatory loop gain detected (${details}). Low loop gain indicates predominantly anatomical rather than central/neurochemical OSA — the phenotype most responsive to HGNS, which works by mechanically opening the airway.`, cite: 'Op de Beeck 2021 AJRCCM' });
  }
  if (phenotypes.includes('Low Arousal Threshold')) {
    result.unfavorable.push({ factor: 'Low arousal threshold', detail: 'Endotyped HGNS responders had higher respiratory arousal thresholds. A low arousal threshold is not a formal contraindication, but it should be treated as a cautionary rather than favorable signal.', cite: 'Op de Beeck 2021 AJRCCM' });
  }
  if (phenotypes.includes('Poor Muscle Responsiveness')) {
    result.unfavorable.push({ factor: 'Low muscle compensation', detail: 'Endotyped HGNS responders demonstrated higher upper-airway muscle compensation. Reduced compensation therefore tempers expectations rather than strengthening candidacy.', cite: 'Op de Beeck 2021 AJRCCM' });
  }

  // ── Overall assessment ──
  if (result.assessment === '') {
    // Only set if not already set by hard-stop criteria
    const favCount = result.favorable.length;
    const unfavCount = result.unfavorable.filter(u => u.factor !== 'DISE not performed').length;
    const dise_missing = !hasDISEData;

    if (dise_missing && eligible) {
      result.assessment = 'Potentially eligible — DISE required';
      result.assessmentDetail = `Based on available data (${favCount} favorable, ${unfavCount} unfavorable factors), this patient may be a candidate for HGNS. Drug-induced sleep endoscopy is required before final determination — the presence or absence of complete concentric collapse at the velum is the single most important predictor.`;
    } else if (eligible && unfavCount === 0 && favCount >= 2) {
      result.assessment = 'Strong candidate';
      result.assessmentDetail = `This patient has ${favCount} favorable factors and no significant unfavorable findings. The evidence supports a high likelihood of HGNS success (STAR trial: 66% overall success with Sher criteria; higher in patients with multiple favorable predictors).`;
    } else if (eligible && favCount > unfavCount) {
      result.assessment = 'Good candidate';
      result.assessmentDetail = `This patient has ${favCount} favorable and ${unfavCount} unfavorable factors. The balance of evidence supports HGNS candidacy, though the unfavorable factors should be weighed in shared decision-making.`;
    } else if (eligible && unfavCount >= favCount && favCount > 0) {
      result.assessment = 'Candidate with caveats';
      result.assessmentDetail = `This patient meets basic eligibility but has ${unfavCount} unfavorable factors against ${favCount} favorable. Consider whether the unfavorable factors are modifiable (e.g., weight loss may shift BMI favorably) and discuss realistic expectations with the patient (~30% of well-selected patients still do not achieve success criteria).`;
    } else if (eligible) {
      result.assessment = 'Marginal candidate';
      result.assessmentDetail = 'This patient meets basic eligibility criteria but has limited favorable predictors. Consider optimizing modifiable factors before proceeding.';
    }
  }

  return result;
}

/**
 * Renders the HGNS assessment as HTML for the clinician report.
 */
function renderHGNSHTML(hgns) {
  if (!hgns) return '';

  // Prior Inspire redirect
  if (hgns.priorInspire) {
    return `
      <div class="card mt-3" id="hgnsAssessment">
        <div class="card-header"><i class="bi bi-cpu"></i> HGNS (Inspire) Assessment</div>
        <div class="card-body">
          <div class="alert alert-info mb-0">
            <strong><i class="bi bi-info-circle"></i> ${hgns.assessment}</strong>
            <p class="mb-0 mt-1">${hgns.assessmentDetail}</p>
          </div>
        </div>
      </div>`;
  }

  // Insufficient data
  if (hgns.eligible === null) {
    return `
      <div class="card mt-3" id="hgnsAssessment">
        <div class="card-header"><i class="bi bi-cpu"></i> HGNS (Inspire) Candidacy Assessment</div>
        <div class="card-body">
          <div class="alert alert-secondary mb-0">
            <strong>${hgns.assessment}</strong>
            <p class="mb-0 mt-1">${hgns.assessmentDetail}</p>
          </div>
        </div>
      </div>`;
  }

  // Assessment badge
  const badgeMap = {
    'Strong candidate':                 'bg-success',
    'Good candidate':                   'bg-success',
    'Candidate with caveats':           'bg-warning text-dark',
    'Marginal candidate':               'bg-warning text-dark',
    'Not a candidate':                  'bg-danger',
    'Potentially eligible — DISE required': 'bg-info text-dark'
  };
  const badgeClass = badgeMap[hgns.assessment] || 'bg-secondary';

  // Eligibility section
  let eligHTML = '';
  if (hgns.eligibilityIssues.length > 0) {
    eligHTML = `
      <div class="alert ${hgns.eligible ? 'alert-warning' : 'alert-danger'} py-2">
        <strong>${hgns.eligible ? 'Eligibility warnings:' : 'Eligibility issues:'}</strong>
        <ul class="mb-0 mt-1">${hgns.eligibilityIssues.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`;
  } else {
    eligHTML = `<p class="text-success"><i class="bi bi-check-circle-fill"></i> <strong>Meets basic eligibility criteria</strong> (AHI range, BMI, CPAP intolerance)</p>`;
  }

  // Favorable factors
  let favHTML = '';
  if (hgns.favorable.length > 0) {
    favHTML = `
      <h6 class="mt-2 text-success"><i class="bi bi-plus-circle"></i> Favorable Factors (${hgns.favorable.length})</h6>
      <table class="table table-sm">
        <tbody>${hgns.favorable.map(f => `<tr><td style="width:200px;"><strong>${f.factor}</strong></td><td>${f.detail} <span class="text-muted small">[${f.cite}]</span></td></tr>`).join('')}</tbody>
      </table>`;
  }

  // Unfavorable factors
  let unfavHTML = '';
  if (hgns.unfavorable.length > 0) {
    unfavHTML = `
      <h6 class="mt-2 text-danger"><i class="bi bi-dash-circle"></i> Unfavorable Factors (${hgns.unfavorable.length})</h6>
      <table class="table table-sm">
        <tbody>${hgns.unfavorable.map(f => `<tr><td style="width:200px;"><strong>${f.factor}</strong></td><td>${f.detail} <span class="text-muted small">[${f.cite}]</span></td></tr>`).join('')}</tbody>
      </table>`;
  }

  // Citations
  const allCites = [
    'Strollo PJ Jr, Soose RJ, Maurer JT, et al. Upper-airway stimulation for obstructive sleep apnea. <em>N Engl J Med.</em> 2014;370(2):139–149.',
    'Heiser C, Steffen A, Boon M, et al. Post-approval upper airway stimulation predictors of treatment effectiveness in the ADHERE registry. <em>Eur Respir J.</em> 2019;53(1):1801405.',
    'Thaler E, Schwab R, Maurer J, et al. Results of the ADHERE upper airway stimulation registry. <em>Laryngoscope.</em> 2020;130(5):1333–1338.',
    'Op de Beeck S, Wellman A, Dieltjens M, et al. Endotypic mechanisms of successful hypoglossal nerve stimulation for OSA. <em>Am J Respir Crit Care Med.</em> 2021;203(6):746–755.',
    'Lee CH, Seay EG, Walters BK, et al. Therapeutic PAP level predicts response to hypoglossal nerve stimulation. <em>J Clin Sleep Med.</em> 2019;15(8):1165–1172.',
    'Huyett P, Kent DT, D\'Agostino MA, et al. Drug-induced sleep endoscopy and hypoglossal nerve stimulation outcomes. <em>Laryngoscope.</em> 2021;131(7):1676–1682.',
    'Grillet E, et al. Baseline characteristics associated with HNS treatment outcomes: a systematic review. <em>Life.</em> 2024;14(9):1129.'
  ];

  return `
    <div class="card mt-3" id="hgnsAssessment">
      <div class="card-header"><i class="bi bi-cpu"></i> HGNS (Inspire) Candidacy Assessment</div>
      <div class="card-body">
        ${eligHTML}
        ${favHTML}
        ${unfavHTML}
        <div class="alert ${hgns.eligible ? (badgeClass.includes('success') ? 'alert-success' : badgeClass.includes('warning') ? 'alert-warning' : 'alert-info') : 'alert-danger'} mt-3">
          <strong><span class="badge ${badgeClass} me-2">${hgns.assessment}</span></strong>
          <p class="mb-0 mt-1">${hgns.assessmentDetail}</p>
        </div>
        <details class="mt-2">
          <summary class="small text-muted" style="cursor:pointer;"><i class="bi bi-book"></i> Evidence citations</summary>
          <ol class="small mt-1">${allCites.map(c => `<li>${c}</li>`).join('')}</ol>
        </details>
      </div>
    </div>`;
}

/* ── Form submission handler ──────────────────────────────────── */
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();

  /* ── Validation gate ────────────────────────────────────────── */
  const { errors, warnings } = OSAValidation.validateForm(e.target);
  const alertBox = document.getElementById('validationAlerts');
  const firstInvalid = errors.find(err => err.element)?.element || null;

  if (errors.length > 0) {
    if (alertBox) {
      alertBox.innerHTML = `<div class="alert alert-danger"><strong>Please fix these errors:</strong><ul>${errors.map(e => `<li><strong>${e.field}:</strong> ${e.message}</li>`).join('')}</ul></div>`;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return; // block submission
  }

  if (warnings.length > 0 && alertBox) {
    alertBox.innerHTML = `<div class="alert alert-warning"><strong>Plausibility warnings:</strong><ul>${warnings.map(w => `<li>${w.field ? `<strong>${w.field}:</strong> ` : ''}${w.message}</li>`).join('')}</ul><small>Reports generated despite warnings. Please verify flagged values.</small></div>`;
  } else if (alertBox) {
    alertBox.innerHTML = '';
  }

  /* ── Proceed with phenotyping ───────────────────────────────── */
  recSeen.clear();
  recTagMap.length = 0;
  const f = new FormData(e.target);

  const out = { phen:[], why:{}, recs:[] };
  const add = (tag, reason) => {
    if(!out.phen.includes(tag)){ out.phen.push(tag); out.why[tag] = reason.filter(Boolean); }
  };

  /* ─── INPUTS ────────────────────────────────────────────────── */
  const sex   = f.get('sex');   // M or F
  const bmi   = n(f.get('bmi'));
  const neck  = n(f.get('neck'));
  const tons  = n(f.get('tonsils'));
  const mall  = f.get('ftp'); // Friedman Tongue Position
  const retrognathia = f.get('retrognathia') || '';  // '' | 'mild' | 'moderate'

  const ahi   = n(f.get('ahi')) ?? n(f.get('pahi'));
  const arInd = n(f.get('arInd'));
  const isi   = n(f.get('isi'));
  const ess   = n(f.get('ess'));

  const csr     = n(f.get('csr'));
  const pahic3  = n(f.get('pahic')) ?? n(f.get('pahic3'));
  const pahic4  = n(f.get('pahic4'));
  const cai     = n(f.get('cai'));
  const cvd     = yes(f,'cvd');

  /* ─── TREATMENT HISTORY & PREFERENCES ─────────────────────── */
  const priorCpap     = yes(f,'priorCpap');
  const cpapCurrent   = yes(f,'cpapCurrent');
  const cpapHelped    = f.get('cpapHelped') || '';   // Yes/No/Unsure/''
  const cpapRetry     = f.get('cpapRetry')  || '';   // Yes/No/Maybe/''
  const cpapReasons   = ['cpapMask','cpapClaustro','cpapDry','cpapLeaks','cpapSleep','cpapSkin','cpapNoImprove','cpapTravel'].filter(k => yes(f,k));
  const priorUPPP     = yes(f,'priorUPPP');
  const priorNasal    = yes(f,'priorNasal');
  const priorSinus    = yes(f,'priorSinus');
  const priorJaw      = yes(f,'priorJaw');
  const priorInspire  = yes(f,'priorInspire');
  const priorMAD      = yes(f,'priorMAD');
  const prefAvoidCpap = yes(f,'prefAvoidCpap');
  const prefSurgery   = yes(f,'prefSurgery');
  const prefInspire   = yes(f,'prefInspire');
  const weightLossReadiness = f.get('weightLossReadiness') || '';
  const lvef = n(f.get('lvef'));
  const madDentition = f.get('madDentition') || '';
  const madProtrusion = f.get('madProtrusion') || '';
  const madTmj = f.get('madTmj') || '';

  // Derived flags
  const cpapFailed    = priorCpap && !cpapCurrent;
  const cpapRefused   = cpapFailed && cpapRetry === 'No';
  const cpapWillRetry = cpapFailed && (cpapRetry === 'Yes' || cpapRetry === 'Maybe');

  const remAhi  = n(f.get('ahiREM'))  ?? n(f.get('remPahi'));
  const nremAhi = n(f.get('ahiNREM')) ?? n(f.get('nremPahi'));

  const sup     = n(f.get('ahiSup'))   ?? n(f.get('supPahi'));
  const nons    = n(f.get('ahiNonSup'))?? n(f.get('nonSupPahi'));
  const nonSupProvided = exists(n(f.get('ahiNonSup'))) || exists(n(f.get('nonSupPahi')));

  const odi   = n(f.get('odi')) ?? n(f.get('odiPsg'));
  const nadirRaw = n(f.get('nadir'));
  const nadirPsg = n(f.get('nadirPsg'));
  const nadir = exists(nadirRaw) || exists(nadirPsg) ? Math.min( nadirRaw??99 , nadirPsg??99 ) : null;

  const hbPH     = n(f.get('hbAreaPH')) ?? n(f.get('hbAreaPHpsg'));
  const hb90PH   = n(f.get('hbUnder90PH'));
  const t90      = n(f.get('t90')) ?? n(f.get('t90Psg'));

  const dhr      = n(f.get('dhr')) ?? n(f.get('dhrPsg')); // Delta Heart Rate (manual entry or from PSG)

  /* ─── PSG-SPECIFIC: Apnea/Hypopnea breakdown ─────────────── */
  const apneaIndex    = n(f.get('apneaIndex'));
  const hypopneaIndex = n(f.get('hypopneaIndex'));
  // F(hypopneas) = hypopneas / (apneas + hypopneas) — Vena 2022
  const fHypopneas = (exists(apneaIndex) && exists(hypopneaIndex) && (apneaIndex + hypopneaIndex) > 0)
    ? (hypopneaIndex / (apneaIndex + hypopneaIndex)) * 100
    : null;

  /* ── Collapsibility estimate from F(hypopneas) (Vena 2022) ── */
  /* F_hyp <50% (more apneas) → high collapsibility → anatomy-directed therapy
     F_hyp ≥50% (mostly hypopneas) → mild-moderate collapsibility → non-CPAP may work */
  const collapsibility = exists(fHypopneas)
    ? (fHypopneas < 50 ? 'high' : fHypopneas < 70 ? 'moderate' : 'low')
    : null;

  /* ── Loop Gain point-of-care estimate (Schmickl 2022) ── */
  /* LG1 = intercept + 0.0016 × AHI − 0.0019 × Hypopnea%  (r=0.48, AUC 0.73 for LG>0.7)
     Intercept ~0.50 estimated from model calibration (typical LG range 0.2–0.8) */
  const lgEstimate = (exists(ahi) && exists(fHypopneas))
    ? Math.max(0, 0.50 + 0.0016 * ahi - 0.0019 * fHypopneas)
    : null;

  /* ── Edwards ArTH Score (Edwards 2014) ──────────────────── */
  /* 3-variable clinical prediction of low arousal threshold:
     AHI <30 (+1), Nadir SpO₂ >82.5% (+1), Hypopnea fraction >58.3% (+1)
     Score ≥2 = likely low arousal threshold (84% accuracy) */
  const edwardsArTH = (() => {
    if (!exists(ahi)) return null;
    let score = 0;
    const details = [];
    if (ahi < T.arousal.ahiMax) { score++; details.push(`AHI ${ahi} <${T.arousal.ahiMax}`); }
    if (exists(nadir) && nadir > T.arousal.nadirMin) { score++; details.push(`nadir ${nadir}% >${T.arousal.nadirMin}%`); }
    const hypFractionAvailable = exists(fHypopneas);
    if (hypFractionAvailable) {
      if (fHypopneas > T.arousal.hypFraction) { score++; details.push(`F(hyp) ${fHypopneas.toFixed(0)}% >${T.arousal.hypFraction}%`); }
      else { details.push(`F(hyp) ${fHypopneas.toFixed(0)}% ≤${T.arousal.hypFraction}%`); }
    }
    const maxScore = hypFractionAvailable ? 3 : 2;
    const prediction = score >= T.arousal.scoreLikely ? 'Likely low ArTH' : score === 1 ? 'Possible low ArTH' : 'Low ArTH unlikely';
    return { score, maxScore, prediction, details, partial: !hypFractionAvailable };
  })();

  /* nasal signals */
  const noseScore = n(f.get('noseScore'));
  const nasalObs  = yes(f,'nasalObs');
  const ctSeptum  = yes(f,'ctDev');
  const ctTurbs   = yes(f,'ctTurbs');

  const oxygenMetricCount = [hbPH, hb90PH, odi, t90, nadir].filter(exists).length;
  const oxygenMetricsAvailable = oxygenMetricCount > 0;
  const oxygenCompositeSufficient = oxygenMetricCount >= 2;
  const osaConfirmed = exists(ahi) && ahi >= 5;

  /* pack context for confidence meters */
  const ctxBase = {
    sex, bmi, neck, tons, mall, ahi, arInd, isi, ess, csr, cvd,
    remAhi, nremAhi, sup, nons, odi, nadir,
    hbPH, hb90PH, t90, noseScore, nasalObs, ctSeptum, ctTurbs, pahic3, pahic4, cai, dhr,
    fHypopneas, lgEstimate,
    edwardsArTHScore: edwardsArTH?.score ?? 0,
    edwardsArTHMaxScore: edwardsArTH?.maxScore ?? 0
  };

  /* Sex-specific neck threshold */
  const neckThreshold = (sex === 'F') ? T.anatomical.neck.female : T.anatomical.neck.male;

  /* ─── PHENOTYPES (suppressed until OSA is confirmed) ──────── */
  if (osaConfirmed) {
    const anatFlags = [
      bmi >= T.anatomical.bmi,
      neck >= neckThreshold,
      tons >= T.anatomical.tonsils,
      T.anatomical.ftp.includes(mall),
      ahi >= T.anatomical.ahiSevere
    ].filter(Boolean).length;

    if(anatFlags >= T.anatomical.minCriteria){
      add('High Anatomical Contribution',[
        exists(bmi)?`BMI ${bmi}`:'',
        exists(neck)?`Neck ${neck} in`:'',
        exists(tons)?`Tonsils ${tons}`:'',
        mall?`FTP ${mall}`:'',
        exists(ahi)?`AHI ${ahi}`:''
      ]);
    }

    if(edwardsArTH && edwardsArTH.score >= T.arousal.scoreLikely){
      add('Low Arousal Threshold',[
        `Edwards ${edwardsArTH.score}/${edwardsArTH.maxScore}`,
        ...edwardsArTH.details,
        edwardsArTH.partial ? 'Hypopnea fraction unavailable' : ''
      ]);
    }

    const loopGainSupportCount =
      ((csr||0) >= T.loopGain.csr ? 1 : 0) +
      ((pahic3||0) >= T.loopGain.pahic3 ? 1 : 0) +
      ((pahic4||0) >= T.loopGain.pahic4 ? 1 : 0) +
      ((cai||0) >= T.loopGain.pahic3 ? 1 : 0);
    const highLoopGainDetected =
      (exists(lgEstimate) && lgEstimate >= T.loopGain.estimateHigh) ||
      (exists(lgEstimate) && lgEstimate >= T.loopGain.estimateBorderline && loopGainSupportCount >= 1) ||
      (!exists(lgEstimate) && loopGainSupportCount >= 2);
    const remStageRatio = ratio(remAhi, nremAhi);
    const supNonSupRatio = ratio(sup, nons);
    if(highLoopGainDetected){
      add('High Loop Gain',[
        exists(lgEstimate)?`LG≈${lgEstimate.toFixed(2)}`:'',
        csr?`CSR ${csr}%`:'',
        exists(pahic3)?`pAHIc 3% ${pahic3}/h`:'',
        exists(pahic4)?`pAHIc 4% ${pahic4}/h`:'',
        exists(cai)?`CAI ${cai}/h`:'',
        cvd?'CVD present (confidence modifier only)':''
      ]);
    }

    if( ahi >= T.muscleResponse.ahiMin &&
        exists(remStageRatio) &&
        exists(nremAhi) &&
        nremAhi >= T.muscleResponse.nremFloor &&
        remStageRatio > T.muscleResponse.remNremRatio ){
      add('Poor Muscle Responsiveness',[`REM/NREM ${formatRatio(remStageRatio)}`, `NREM AHI ${nremAhi}`, `AHI ${ahi}`]);
    }

    if( exists(supNonSupRatio) && exists(nons) && supNonSupRatio > T.positional.supNonSupRatio && nons < T.positional.nonSupMax ){
      add('Positional OSA',[`Sup/Non-sup ${formatRatio(supNonSupRatio)}`, `Non-sup AHI ${nons}`]);
    }

    if( exists(remStageRatio) && exists(nremAhi) && remStageRatio > T.remPredominant.remNremRatio && nremAhi < T.remPredominant.nremMax ){
      add('REM-Predominant OSA',[`REM/NREM ${formatRatio(remStageRatio)}`, `NREM AHI ${nremAhi}`]);
    }

    /* Composite HB: trigger if ANY metric is in moderate+ range.
       Nadir only triggers at severe level (<75%) — weaker standalone predictor than
       duration/frequency metrics (Azarbarzin 2019, Zinchuk 2020). */
    const hbTrigger = (exists(hbPH) && hbPH >= T.hypoxicBurden.hbPerHour) ||
                      (exists(odi) && odi >= T.hypoxicBurden.odi) ||
                      (exists(nadir) && nadir < T.hypoxicBurden.nadirSevere) ||
                      (exists(t90) && t90 >= T.hypoxicBurden.t90) ||
                      (exists(hb90PH) && hb90PH > T.hypoxicBurden.areaUnder90);
    if(hbTrigger){
      add('High Hypoxic Burden',[
        exists(hbPH)?`HB/hr ${hbPH}`:'',
        exists(hb90PH)?`Area<90/hr ${hb90PH}`:'',
        exists(t90)?`T90 ${t90}%`:'',
        exists(odi)?`ODI ${odi}`:'',
        exists(nadir)?`Nadir SpO₂ ${nadir}%`:''
      ]);
    }

    if( (noseScore && noseScore >= T.nasal.noseMild) || nasalObs || ctSeptum || ctTurbs ){
      add('Nasal-Resistance Contributor',[
        noseScore ? `NOSE score ${noseScore}/100` : '',
        nasalObs ? 'Patient-reported nasal obstruction' : '',
        ctSeptum ? 'CT: deviated septum' : '',
        ctTurbs ? 'CT: turbinate hypertrophy' : ''
      ]);
    }

    // Delta Heart Rate (Phase 4 field — only triggers if the input exists)
    if( dhr && dhr >= T.deltaHeartRate.dhr ){
      add('Elevated Delta Heart Rate',[
        `ΔHR ${dhr} bpm`,
        cvd ? 'CVD present' : ''
      ]);
    }
  }

  /* ─── TREATMENT MAPPING (treatment-history-aware) ──────────── */
  const recs = out.recs;

  // Helper: build a CPAP-aware recommendation for anatomical contribution
  function cpapRec() {
    if (cpapCurrent) {
      pushRec(recs,'Continue current CPAP/APAP therapy; optimize settings based on phenotype findings.','CPAP');
    } else if (cpapFailed && cpapRefused) {
      pushRec(recs,'Prior CPAP trial unsuccessful \u2014 prioritize alternatives: mandibular-advancement device, site-directed surgery, or Inspire\u00AE.','CPAP-ALT');
    } else if (cpapWillRetry) {
      const issues = cpapReasons.map(r => {
        const map = {cpapMask:'mask fit',cpapClaustro:'claustrophobia',cpapDry:'dryness',cpapLeaks:'leaks/noise',cpapSleep:'sleep onset',cpapSkin:'skin irritation',cpapNoImprove:'prior inefficacy',cpapTravel:'travel'};
        return map[r] || r;
      }).join(', ');
      pushRec(recs,`Retry CPAP with optimized settings (patient willing). Address prior issues${issues ? ': ' + issues : ''}.`,'CPAP');
    } else if (prefAvoidCpap) {
      pushRec(recs,'Patient prefers to avoid CPAP \u2014 lead with MAD, positional therapy, or surgical options. CPAP remains most effective for severe OSA; discuss if alternatives are insufficient.','CPAP-PREF');
    } else {
      pushRec(recs,'Start CPAP/APAP (most effective for anatomical narrowing).','CPAP');
    }
  }

  // Helper: CPAP-intolerance-specific comfort recs
  function cpapComfortRecs() {
    if (cpapReasons.includes('cpapMask') || cpapReasons.includes('cpapClaustro')) {
      pushRec(recs,'CPAP desensitization program and mask refit may address prior mask/claustrophobia complaints.','CPAP-DESENTIZE');
    }
    if (cpapReasons.includes('cpapDry')) {
      pushRec(recs,'Heated humidification and chin strap may address prior dryness complaints.','CPAP-HUMID');
    }
    if (cpapReasons.includes('cpapNoImprove')) {
      pushRec(recs,'Verify prior CPAP was adequately titrated; consider repeat titration study.','CPAP-RETITRATE');
    }
  }

  /* Phenotype-driven treatment recs only apply when OSA is confirmed (AHI ≥ 5) */
  if (exists(ahi) && ahi >= 5) out.phen.forEach(p => {
    switch(p){
      case 'High Anatomical Contribution':
        cpapRec();
        if((!cpapFailed && !prefAvoidCpap) || cpapWillRetry) {
          pushRec(recs,'If CPAP fails or not tolerated: mandibular-advancement device or site-directed surgery / Inspire\u00AE.','SURGALT');
        }
        if(cpapFailed && cpapReasons.length) cpapComfortRecs();
        break;
      case 'Low Arousal Threshold':
        if(cpapCurrent || (!cpapFailed && !prefAvoidCpap)) {
          pushRec(recs,'Optimize CPAP comfort (humidification, auto-ramp, mask fit, desensitization).','CPAP-OPT');
        }
        if(exists(isi) && isi >= 15) {
          pushRec(recs,'Initiate CBT-I (cognitive behavioral therapy for insomnia) before or concurrent with PAP therapy. Untreated insomnia is the strongest predictor of CPAP non-adherence (Sweetman 2019). Consider sleep psychology referral or FDA-cleared digital CBT-I (e.g., Pear Somryst).','CBTI');
        }
        break;
      case 'High Loop Gain':
        if(cpapCurrent || (!cpapFailed && !prefAvoidCpap)) {
          pushRec(recs,'Favor fixed-pressure CPAP initially; monitor for treatment-emergent central apneas.','CPAP-FIXED');
        }
        pushRec(recs,'If centrals persist: consider nocturnal oxygen, acetazolamide, or ASV (only if LVEF > 45%).','HLG-ADV');
        break;
      case 'Poor Muscle Responsiveness':
        if(cpapFailed && exists(ahi) && ahi >= T.hgns.ahiMin && ahi <= T.hgns.ahiMax) {
          pushRec(recs,'Hypoglossal-nerve stimulation (Inspire\u00AE) may be worth discussing for poor muscle responsiveness when PAP intolerance is documented and anatomy is favorable.','HNS');
        }
        break;
      case 'Positional OSA':
        pushRec(recs,'Begin positional therapy (vibratory trainer, backpack/pillow strategies).','POS');
        if(ahi >= T.severity.severe){
          if(cpapFailed) {
            pushRec(recs,'Positional therapy alone may be insufficient at this severity; combine with MAD or surgical approach.','POS-GUARD');
          } else {
            pushRec(recs,'Positional therapy alone may be insufficient at this severity; use as adjunct to CPAP.','POS-GUARD');
          }
        }
        break;
      case 'REM-Predominant OSA':
        pushRec(recs,'Verify treatment efficacy during REM; pressure may need to be higher in REM.','REM-CHECK');
        pushRec(recs,'Oral appliance therapy is a reasonable alternative/adjunct in REM-predominant OSA.','REM-MAD');
        break;
      case 'High Hypoxic Burden':
        pushRec(recs,'Start effective therapy promptly to reduce cardiovascular risk.','HB-URG');
        break;
      case 'Nasal-Resistance Contributor':
        pushRec(recs,'Nasal optimization (saline rinse, intranasal steroid, ENT evaluation) can improve airflow and CPAP/MAD tolerance.','NASAL-OPT');
        if(ctSeptum || ctTurbs){
          pushRec(recs,'Imaging confirms structural nasal obstruction. Consider septoplasty and/or turbinate reduction.','NASAL-SURG');
        }
        if(priorNasal) {
          pushRec(recs,'Prior nasal surgery noted \u2014 reassess for residual obstruction or consider revision.','NASAL-PRIOR');
        }
        if(priorSinus) {
          pushRec(recs,'Prior sinus surgery noted \u2014 evaluate for recurrent sinusitis or persistent inflammation contributing to nasal obstruction.','NASAL-SINUS-PRIOR');
        }
        break;
      case 'Elevated Delta Heart Rate':
        pushRec(recs,'Elevated autonomic reactivity detected. Effective OSA therapy typically reduces heart rate surges. Monitor BP and CV risk factors.','DHR-TX');
        if(dhr >= T.deltaHeartRate.dhrHigh && cvd){
          pushRec(recs,'Consider cardiology coordination given high autonomic reactivity and existing cardiovascular disease.','DHR-CARDS');
        }
        break;
    }
  }); /* end phenotype treatment forEach */

  /* ─── FRIEDMAN STAGE (auto-calculated) ────────────────────── */
  /* Friedman 2004: FTP + tonsils + BMI → surgical candidacy tier */
  const friedmanStage = (() => {
    if (!exists(tons) || !mall) return null;
    if (exists(bmi) && bmi >= 40) return 'IV';
    const lowTongue = (mall === 'I' || mall === 'II');
    const largeTonsils = (tons >= 3);
    if (lowTongue && largeTonsils) return 'I';
    if (lowTongue || largeTonsils) return 'II';
    return 'III';
  })();

  /* ─── Ji 2026 HNS CLINICAL SEVERITY STAGING ─────────────── */
  const hnsStage = (() => {
    if (!exists(ahi) || ahi < 15) return null;
    const missing = [];
    if (!sex) missing.push('sex');
    if (!exists(neck)) missing.push('neck circumference');
    if (!exists(bmi)) missing.push('BMI');
    if (missing.length) return { insufficient: true, missing, details: [] };
    let unfavorable = 0;
    const details = [];
    const neckThreshHNS = (sex === 'F') ? 14 : 16;
    if (exists(neck) && neck > neckThreshHNS) { unfavorable++; details.push(`neck >${neckThreshHNS}"`); }
    if (exists(bmi) && bmi >= 30) { unfavorable++; details.push('BMI ≥30'); }
    if (ahi > 30) { unfavorable++; details.push('AHI >30'); }
    const stage = unfavorable === 0 ? 'I' : unfavorable === 1 ? 'II' : unfavorable === 2 ? 'III' : 'IV';
    const responseRate = unfavorable === 0 ? 91 : unfavorable === 1 ? 68 : unfavorable === 2 ? 50 : 38;
    return { stage, responseRate, unfavorable, details };
  })();

  /* ─── DISE concentric collapse check ────────────────────── */
  const _vPat = f.get('vPat') || '';
  const _vDeg = n(f.get('vDeg'));
  const hasConcentricCollapse = _vPat.toLowerCase().includes('concentric') && _vDeg >= 2;

  /* Soft-tissue surgery: tonsillectomy +/- expansion pharyngoplasty (adult) */
  const ftpIorII = (mall==='I' || mall==='II');
  const highAnat = out.phen.includes('High Anatomical Contribution');
  if(exists(tons) && tons >= T.anatomical.tonsils){
    if(priorUPPP) {
      pushRec(recs,'Prior UPPP noted \u2014 consider revision pharyngoplasty or alternative surgical targets based on DISE findings.','SOFT-TISSUE-REVISION');
    } else if(friedmanStage === 'I'){
      pushRec(recs,`Strongly consider tonsillectomy +/- expansion pharyngoplasty (Friedman Stage I: FTP ${mall}, Tonsils ${tons}, BMI ${bmi?.toFixed(1)} — ~80% UPPP success rate).`,'SOFT-TISSUE-STRONG');
    } else if(friedmanStage === 'II' && ftpIorII){
      pushRec(recs,`Consider tonsillectomy +/- expansion pharyngoplasty as part of multilevel plan (Friedman Stage II — intermediate success rate ~37-74%).`,'SOFT-TISSUE-CONSIDER');
    } else if(highAnat && ftpIorII){
      pushRec(recs,'Consider tonsillectomy +/- expansion pharyngoplasty based on anatomic crowding and large tonsils.','SOFT-TISSUE-GENERAL');
    }
  }
  /* Friedman Stage III: recommend tongue base procedures / HNS / MMA instead of UPPP */
  if(friedmanStage === 'III' && exists(ahi) && ahi >= 15){
    pushRec(recs,'Friedman Stage III (high tongue position, small tonsils) — UPPP unlikely to succeed. Consider tongue base surgery, HNS (Inspire), or MMA depending on DISE findings and candidacy.','FRIEDMAN-III-ALT');
  }

  /* Prior treatment-aware Inspire recommendation */
  if(priorInspire) {
    pushRec(recs,'Inspire\u00AE already in place \u2014 verify activation and optimize settings.','INSPIRE-OPT');
  } else if(prefInspire && !priorInspire && cpapFailed && exists(ahi) && ahi >= T.hgns.ahiMin && ahi <= T.hgns.ahiMax && !hasConcentricCollapse) {
    const inspireEvalText = exists(bmi) && bmi > T.hgns.bmiMax
      ? `Patient interested in Inspire\u00AE \u2014 current BMI ${bmi.toFixed(1)} is above the FDA-supported range. Weight reduction below 40 and payer-specific review would be required before formal candidacy evaluation.`
      : 'Patient interested in Inspire\u00AE \u2014 evaluate candidacy (documented PAP intolerance, AHI 15\u2013100, BMI \u2264 40, no concentric palatal collapse).';
    pushRec(recs,inspireEvalText,'INSPIRE-EVAL');
  }

  /* ─── MAD CANDIDACY SCORING ─────────────────────────────── */
  /* Evidence-based factors: Camañes-Gonzalvo 2022, Chen 2020, Edwards 2016, Marques 2019 */
  const madScore = (() => {
    let score = 0;
    const factors = [];
    /* OSA severity: mild-moderate favorable, severe unfavorable */
    if (exists(ahi) && ahi >= 5 && ahi < 15) { score += 2; factors.push('mild OSA'); }
    else if (exists(ahi) && ahi >= 15 && ahi < 30) { score += 1; factors.push('moderate OSA'); }
    else if (exists(ahi) && ahi >= 30) { score -= 2; factors.push('severe OSA'); }
    /* BMI: <28 favorable, ≥35 unfavorable */
    if (exists(bmi) && bmi < 28) { score += 1; factors.push('lower BMI'); }
    else if (exists(bmi) && bmi >= 35) { score -= 1; factors.push('higher BMI'); }
    /* Female: better response rates */
    if (sex === 'F') { score += 1; factors.push('female'); }
    /* Smaller neck: responders avg 1-1.5cm smaller */
    const neckThresh = sex === 'F' ? 14 : 16;
    if (exists(neck) && neck < neckThresh) { score += 1; factors.push('smaller neck'); }
    /* Positional OSA: 64% vs 36% response rate */
    if (out.phen.includes('Positional OSA')) { score += 1; factors.push('positional OSA'); }
    /* REM-predominant: NREM-OSA responds better */
    if (out.phen.includes('REM-Predominant OSA')) { score -= 1; factors.push('REM-predominant'); }
    /* High loop gain: lower collapsibility predicts better response */
    if (out.phen.includes('High Loop Gain')) { score -= 1; factors.push('high loop gain'); }
    /* High HB: lower T90 predicts better response */
    if (out.phen.includes('High Hypoxic Burden')) { score -= 1; factors.push('high hypoxic burden'); }
    /* Retrognathia: mandibular retrusion independently predicts better MAD response (Hamza 2026) */
    if (retrognathia) { score += 1; factors.push('retrognathia'); }
    /* Hypopnea-predominant: better MAD response than apnea-predominant (Camañes-Gonzalvo 2025) */
    if (exists(fHypopneas) && fHypopneas > 70) { score += 1; factors.push('hypopnea-predominant'); }
    else if (exists(fHypopneas) && fHypopneas < 50) { score -= 1; factors.push('apnea-predominant'); }
    /* Age: younger patients respond better (3-4.5 yr mean difference, Camañes-Gonzalvo 2022, Chen 2020) */
    const age = n(f.get('age'));
    if (exists(age) && age < 50) { score += 1; factors.push('younger age'); }
    else if (exists(age) && age >= 65) { score -= 1; factors.push('older age'); }
    /* tier: favorable (≥3), standard (0-2), poor (< 0) */
    const tier = score >= 3 ? 'favorable' : score < 0 ? 'poor' : 'standard';
    return { score, tier, factors };
  })();

  /* ─── STAGE-AWARE CORE RECOMMENDATIONS ───────────────────── */
  if (ahi == null) {
    /* PRE-STUDY: Only recommend sleep study + CBT-I if insomnia */
    pushRec(recs,'Schedule a sleep study to evaluate for obstructive sleep apnea.','SLEEP-STUDY');
    if (exists(isi) && isi >= 15) {
      pushRec(recs,'Initiate CBT-I for insomnia symptoms while awaiting sleep study results.','CBTI');
    }
    if (nasalObs || ctSeptum || ctTurbs || (noseScore && noseScore >= T.nasal.noseMild)) {
      pushRec(recs,'Nasal optimization (saline rinse, intranasal steroid, ENT evaluation) to improve nasal airflow.','NASAL-OPT');
    }
  } else if (ahi < 5) {
    /* NORMAL AHI: Check for snoring pathway and UARS */
    const hasSnoring = exists(n(f.get('snoreIdx'))) && n(f.get('snoreIdx')) > 0;
    const rdi = n(f.get('patRdi'));
    const uars = OSAReportShared.detectUARS({ ahi, rdi, arInd, ess, isi });

    if (uars.isUARS) {
      pushRec(recs,'Possible UARS (upper airway resistance syndrome) — consider in-lab polysomnography with esophageal pressure monitoring for definitive evaluation.','UARS-EVAL');
    }
    if (hasSnoring || (exists(n(f.get('snoringReported'))) || yes(f,'snoringReported'))) {
      /* Snoring-specific recommendations */
      if (bmi >= 27) pushRec(recs,'Weight management can reduce snoring intensity and frequency.','WEIGHT');
      if (nasalObs || ctSeptum || ctTurbs || (noseScore && noseScore >= T.nasal.noseMild)) {
        pushRec(recs,'Nasal optimization to improve nasal airflow and reduce snoring.','NASAL-OPT');
      }
      pushRec(recs,'Positional therapy — snoring is often worse on your back.','POS');
      pushRec(recs,'Custom oral appliance (MAD) can reduce snoring by repositioning the jaw.','MAD');
      pushRec(recs,'Avoid alcohol within 3 hours of bedtime — alcohol relaxes throat muscles and worsens snoring.','SNORE-ALCOHOL');
    }
    if (exists(isi) && isi >= 15) {
      pushRec(recs,'Initiate CBT-I for insomnia symptoms.','CBTI');
    }
  } else {
    /* AHI ≥ 5: Standard OSA core trio (treatment-history-aware) */

    if (exists(bmi) && bmi >= T.anatomical.bmi) {
      pushRec(recs,'Enroll in a structured weight-management program.','WEIGHT');
    }

    /* Fix #4: priorMAD + priorUPPP combination — limited remaining options */
    if (priorMAD && priorUPPP && cpapFailed) {
      pushRec(recs,'Prior MAD, UPPP, and CPAP trials documented. Further surgical revision has diminishing returns. Prioritize Inspire evaluation (if eligible), aggressive weight management, or advanced multilevel surgical planning based on DISE.','COMBI-PRIOR');
    }

    if(cpapCurrent) {
      pushRec(recs,'Continue CPAP/APAP','CPAP');
    } else if(cpapRefused) {
      pushRec(recs,'Alternative PAP (BiPAP, ASV) if willing to reconsider','CPAP');
    } else if(cpapWillRetry) {
      const issues = cpapReasons.map(r => {
        const map = {cpapMask:'mask fit',cpapClaustro:'claustrophobia',cpapDry:'dryness',cpapLeaks:'leaks/noise',cpapSleep:'sleep onset',cpapSkin:'skin irritation',cpapNoImprove:'prior inefficacy',cpapTravel:'travel'};
        return map[r] || r;
      }).join(', ');
      pushRec(recs,`Retry CPAP with optimized settings (patient willing). Address prior issues${issues ? ': ' + issues : ''}.`,'CPAP');
    } else if(prefAvoidCpap && !priorCpap) {
      pushRec(recs,'CPAP/APAP (most effective option \u2014 discuss with patient given preference to avoid)','CPAP');
    } else {
      pushRec(recs,'Start CPAP/APAP','CPAP');
    }
    /* Fix #1: Wire prefSurgery — boost surgical recs if patient prefers surgery */
    if (prefSurgery && !priorUPPP) {
      pushRec(recs,'Patient open to surgical options \u2014 consider DISE-guided surgical planning.','SURG-PREF');
    }
    if(priorMAD) {
      pushRec(recs,'Prior oral appliance trial not tolerated \u2014 consider alternative approaches (Inspire, positional therapy, surgery) rather than repeat MAD trial','MAD');
    } else if(priorJaw) {
      /* Fix #1: Wire priorJaw — prior jaw surgery affects MAD candidacy */
      pushRec(recs,'Prior jaw surgery noted \u2014 MAD candidacy requires careful dental evaluation of occlusal changes','MAD');
    } else if(madScore.tier === 'favorable') {
      pushRec(recs,'Oral appliance therapy (MAD) \u2014 favorable candidate based on profile','MAD-FAVORABLE');
    } else if(madScore.tier === 'poor') {
      pushRec(recs,'Oral appliance therapy (MAD) \u2014 less likely to be sufficient as standalone treatment','MAD-POOR');
    } else {
      pushRec(recs,'Custom oral appliance (MAD)','MAD');
    }
    /* Only recommend generic surgery when anatomical findings are present */
    const hasAnatomicalPhenotype = out.phen.includes('High Anatomical Contribution');
    const hasNasalPhenotype = out.phen.includes('Nasal-Resistance Contributor');
    const hasDISEEntry = [f.get('vDeg'), f.get('oDeg'), f.get('tDeg'), f.get('eDeg')].some(d => d && d !== '0');
    if (hasAnatomicalPhenotype || hasNasalPhenotype || hasDISEEntry || friedmanStage === 'I' || friedmanStage === 'II') {
      pushRec(recs,'Surgical correction of correctable airway blockage','SURG');
    }

    /* Fix #3: Mild AHI (5-14) with no phenotypes — lifestyle-first approach */
    if (ahi >= 5 && ahi < 15 && out.phen.length === 0) {
      pushRec(recs,'Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6\u201312 months before committing to device therapy.','MILD-LIFESTYLE');
    }
  }

  /* ─── COMISA (Co-Morbid Insomnia and Sleep Apnea) ─────── */
  const hasCOMISA = exists(isi) && isi >= 15 && exists(ahi) && ahi >= 5;
  const sleepyCOMISA = hasCOMISA && exists(ess) && ess >= 15;   // high daytime sleepiness + insomnia
  if (hasCOMISA) {
    // CBTi-FIRST sequencing per Sweetman 2019 RCT: sequential CBTi → CPAP yields higher acceptance/adherence
    pushRec(recs, 'COMISA detected (ISI \u2265 15 + OSA): Initiate CBT-I BEFORE starting CPAP (Sweetman 2019 — sequential CBT-I then CPAP yields higher CPAP acceptance and adherence than concurrent start). Consider sleep psychology referral or FDA-cleared digital CBT-I (e.g., Pear Somryst). Target 4–6 sessions before CPAP initiation.', 'CBTI');
    // APAP preferred over fixed CPAP for COMISA
    pushRec(recs, 'Use APAP (not fixed CPAP) for COMISA patients — lower average delivered pressure improves comfort. Set EPR/flex to max (3 cmH₂O on ResMed), enable ramp for sleep-onset difficulty, use conservative pressure range (min 4–5, max 15–16 cmH₂O).', 'COMISA-PAP');
    // Sleep restriction safety caveat for sleepy COMISA
    if (sleepyCOMISA) {
      pushRec(recs, 'Caution: High ESS + high ISI — full sleep restriction therapy is unsafe due to excessive daytime sleepiness. Use modified CBT-I (stimulus control + cognitive restructuring first; introduce sleep compression gradually rather than restriction).', 'COMISA-SRT-CAUTION');
    }
  }

  /* ─── SYMPTOM SUBTYPE ────────────────────────────────────── */
  let subtype = 'Minimally-symptomatic';
  if(ess >= T.subtype.sleepyEss) subtype = 'Sleepy';
  else if(isi >= T.subtype.disturbedIsi) subtype = 'Disturbed-sleep';

  const groupInfo = {
    'Sleepy': 'You feel very sleepy during the day. Treating OSA usually improves alertness, mood, and driving safety within weeks.',
    'Disturbed-sleep': hasCOMISA
      ? 'Your sleep is broken or restless \u2014 you have both insomnia and obstructive sleep apnea, a combination called COMISA (comorbid insomnia and obstructive sleep apnea). These two conditions feed off each other, so treating insomnia first with CBT-I and then adding a breathing device gives you the best chance at lasting improvement.'
      : 'Your sleep is broken or restless even if you are not very sleepy in the day. Treating the breathing problem and insomnia together works best.',
    'Minimally-symptomatic': 'You may not notice many symptoms, but repeated breathing pauses can strain the heart and brain over time.'
  };


  // Patient-facing report is now generated by PatientReport.generateReportHTML()
  // via the "Generate Patient Report" overlay button.

  const sevLabel = ahiSeverity(ahi);

  // Phenotype icons (Bootstrap Icons) — used by clinician confTable
  const phenIcons = {
    'High Anatomical Contribution': 'bi-body-text',
    'Low Arousal Threshold':        'bi-alarm',
    'High Loop Gain':               'bi-arrow-repeat',
    'Poor Muscle Responsiveness':   'bi-lightning',
    'Positional OSA':               'bi-arrow-left-right',
    'REM-Predominant OSA':          'bi-moon-stars',
    'High Hypoxic Burden':          'bi-heart-pulse',
    'Nasal-Resistance Contributor': 'bi-wind',
    'Elevated Delta Heart Rate':    'bi-activity'
  };

  // Signal-strength badges — used by clinician phenotype table
  const confBadge = (conf) => {
    if (conf === 'High')     return '<span class="badge bg-danger">Strong signal</span>';
    if (conf === 'Moderate') return '<span class="badge bg-warning text-dark">Moderate signal</span>';
    return '<span class="badge bg-secondary">Limited signal</span>';
  };

  const hasLowAr = out.phen.includes('Low Arousal Threshold');


  /* ─── HST Validity Assessment ────────────────────────────── */
  const hstFlags = [];
  const tst = n(f.get('tst'));
  const patRdi = n(f.get('patRdi'));

  // 1. Total sleep time assessment
  if (exists(tst)) {
    if (tst < 2) {
      hstFlags.push({ severity: 'danger', flag: 'Inadequate recording time', detail: `TST ${tst} hrs is critically short (<2 hrs). AHI is likely unreliable. <strong>Recommend repeat HST or in-lab PSG.</strong>` });
    } else if (tst < 4) {
      hstFlags.push({ severity: 'warning', flag: 'Short recording time', detail: `TST ${tst} hrs is below the 4-hour minimum recommended for reliable HST interpretation. AHI may underestimate true severity — consider repeat HST or in-lab PSG, especially if clinical suspicion is high.` });
    }
  }

  // 2. AHI–RDI discrepancy (may indicate signal artifact or scoring issues)
  if (exists(ahi) && exists(patRdi) && patRdi > 0) {
    const ahiRdiRatio = ahi / patRdi;
    if (ahiRdiRatio < 0.5) {
      hstFlags.push({ severity: 'warning', flag: 'Large AHI–RDI discrepancy', detail: `pAHI (${ahi}) is less than half the PAT RDI (${patRdi}). A large gap may indicate significant RERAs (respiratory effort-related arousals) or signal quality issues. Consider in-lab PSG if clinical picture is inconsistent.` });
    }
  }

  // 3. Missing REM data
  if (exists(ahi) && !exists(remAhi)) {
    hstFlags.push({ severity: 'info', flag: 'Incomplete REM staging data', detail: 'REM AHI is not available. REM-predominant OSA cannot be assessed reliably until REM versus non-REM breathing is fully reported. Consider in-lab PSG if REM-related symptoms (vivid dreams, morning headaches) are present.' });
  } else if (exists(ahi) && !exists(nremAhi)) {
    hstFlags.push({ severity: 'info', flag: 'Incomplete REM staging data', detail: 'NREM AHI is not available. REM-predominant OSA cannot be assessed reliably until REM versus non-REM breathing is fully reported.' });
  } else if (exists(tst) && exists(remAhi) && exists(nremAhi) && tst < 5 && remAhi === 0) {
    hstFlags.push({ severity: 'warning', flag: 'No REM sleep captured', detail: `REM AHI is 0 with TST of only ${tst} hrs. REM sleep may not have occurred during this short recording. AHI may underestimate true severity if OSA is REM-predominant. Consider repeat study.` });
  }

  // 4. Low AHI despite high symptom burden — possible false negative
  if (exists(ahi) && ahi < 5 && exists(ess) && ess >= 10) {
    hstFlags.push({ severity: 'warning', flag: 'Low AHI with significant symptoms', detail: `AHI ${ahi} is normal/minimal despite ESS ${ess} (significant sleepiness). HSTs can underestimate AHI due to limited channels and no EEG. Consider in-lab PSG to evaluate for UARS (upper airway resistance syndrome) or first-night effect.` });
  }

  // 5. High central apnea component — confirm with lab PSG
  if (exists(pahic3) && exists(ahi) && ahi > 0) {
    const centralPct = (pahic3 / ahi) * 100;
    if (centralPct > 50) {
      hstFlags.push({ severity: 'danger', flag: 'Predominantly central apnea', detail: `Central apnea index is ${centralPct.toFixed(0)}% of total AHI. WatchPAT central event scoring has limitations — <strong>recommend in-lab PSG with EEG</strong> to confirm central vs obstructive classification before treatment planning.` });
    } else if (centralPct > 25) {
      hstFlags.push({ severity: 'warning', flag: 'Significant central apnea component', detail: `Central apnea index is ${centralPct.toFixed(0)}% of total AHI. WatchPAT uses PAT signal attenuation to differentiate central from obstructive events, which has lower specificity than EEG-based scoring. Consider in-lab PSG for confirmation if central-dominant phenotype affects treatment choice (e.g., ASV vs CPAP).` });
    }
  }

  // 6. High CSR without high central AHI — possible scoring artifact
  if (exists(csr) && csr > 15 && exists(pahic3) && exists(ahi) && ahi > 0 && (pahic3/ahi)*100 < 15) {
    hstFlags.push({ severity: 'info', flag: 'Elevated CSR with low central AHI', detail: `CSR ${csr}% is elevated but central AHI is low relative to total. This pattern may indicate Cheyne-Stokes respiration during wakefulness or signal artifact. Correlate with clinical history (heart failure, stroke).` });
  }

  // 7. Missing positional data limits phenotyping
  if (!exists(sup) || !exists(nons)) {
    const positionalMissing = [];
    if (!exists(sup)) positionalMissing.push('supine AHI');
    if (!exists(nons)) positionalMissing.push('non-supine AHI');
    hstFlags.push({ severity: 'info', flag: 'Incomplete positional data', detail: `${positionalMissing.join(' and ')} ${positionalMissing.length === 1 ? 'is' : 'are'} not available. Positional OSA cannot be assessed reliably. If the patient reports position-dependent symptoms or snoring, consider repeat study with positional tracking.` });
  }

  // Build HST validity HTML
  const hstValidityHTML = hstFlags.length ? `
    <div class="alert ${hstFlags.some(f=>f.severity==='danger') ? 'alert-danger' : hstFlags.some(f=>f.severity==='warning') ? 'alert-warning' : 'alert-info'} mt-2 mb-3">
      <strong><i class="bi bi-exclamation-triangle me-1"></i>Sleep Study Quality Flags</strong>
      <ul class="mb-0 mt-1">${hstFlags.map(f => {
        const icon = f.severity === 'danger' ? 'bi-x-circle-fill text-danger' : f.severity === 'warning' ? 'bi-exclamation-triangle-fill text-warning' : 'bi-info-circle-fill text-info';
        return `<li><i class="bi ${icon} me-1"></i><strong>${f.flag}:</strong> ${f.detail}</li>`;
      }).join('')}</ul>
    </div>` : '';

  /* ─── Clinician Decision Support ──────────────────────────── */

  const confTable = out.phen.map(tag => {
    const conf = confidenceFor(tag,{reasons: out.why[tag], metrics: ctxBase});
    const icon = phenIcons[tag] || 'bi-circle';
    return `<tr><td><i class="bi ${icon} me-1"></i>${tag}</td><td>${confBadge(conf)}</td><td><small>${out.why[tag].filter(Boolean).join(', ')||'\u2014'}</small></td></tr>`;
  }).join('');

  const guardrails = [];
  if(out.phen.includes('High Loop Gain')){
    guardrails.push('If considering ASV, confirm LVEF > 45% (contraindicated in HFrEF \u226445%).');
  }
  if(out.phen.includes('High Hypoxic Burden')){
    guardrails.push('Prioritize timely initiation of effective therapy due to CV-risk association with hypoxic burden.');
  }
  if(out.phen.includes('Positional OSA') && ahi >= T.severity.severe){
    guardrails.push('Positional therapy alone may be insufficient at this AHI severity; consider as adjunct to PAP.');
  }
  if(out.phen.includes('Elevated Delta Heart Rate') && cvd){
    guardrails.push('Elevated \u0394HR with existing CVD \u2014 consider cardiology monitoring and aggressive PAP adherence targets.');
  }
  if(hasCOMISA){
    const comisaSeverity = isi >= 22 ? 'Severe insomnia' : 'Moderate insomnia';
    let comisaBullets = `<strong>COMISA — ${comisaSeverity} (ISI ${isi}) + OSA</strong>
      <ul class="mb-1 mt-1">
        <li>Start CBT-I first (4–6 sessions), then initiate CPAP <small class="text-muted">(Sweetman 2019 RCT)</small></li>
        <li>Use APAP over fixed CPAP; set EPR/flex to max, enable ramp (min 4–5, max 15–16)</li>
        <li>Avoid sedative-hypnotics as monotherapy (worsen OSA); if hypnotic bridge needed, ensure concurrent PAP</li>`;
    if(sleepyCOMISA){
      comisaBullets += `<li class="text-danger"><strong>CAUTION:</strong> High ESS (${ess}) + high ISI — full sleep restriction contraindicated. Use stimulus control + cognitive restructuring first; introduce sleep compression gradually</li>`;
    }
    comisaBullets += `</ul>`;
    guardrails.push(comisaBullets);
  }

  const surgTargets = [];
  if(ctSeptum || ctTurbs) surgTargets.push('Nasal: septum/turbinates');
  // Build actual DISE VOTE summary if data was entered
  const vDeg = f.get('vDeg'), oDeg = f.get('oDeg'), tDeg = f.get('tDeg'), eDeg = f.get('eDeg');
  const vPat = f.get('vPat'), oPat = f.get('oPat'), tPat = f.get('tPat'), ePat = f.get('ePat');
  const hasDISEData = [vDeg, oDeg, tDeg, eDeg].some(d => d && d !== '0');
  if(hasDISEData){
    const voteSummary = [
      vDeg && vDeg!=='0' ? `V:${vDeg}${vPat && vPat!=='\u2014' ? '/'+vPat : ''}` : null,
      oDeg && oDeg!=='0' ? `O:${oDeg}${oPat && oPat!=='\u2014' ? '/'+oPat : ''}` : null,
      tDeg && tDeg!=='0' ? `T:${tDeg}${tPat && tPat!=='\u2014' ? '/'+tPat : ''}` : null,
      eDeg && eDeg!=='0' ? `E:${eDeg}${ePat && ePat!=='\u2014' ? '/'+ePat : ''}` : null,
    ].filter(Boolean).join(' ');
    if(voteSummary) surgTargets.push(`DISE VOTE: ${voteSummary}`);
  }
  if(out.phen.includes('High Anatomical Contribution') && !surgTargets.length) surgTargets.push('Pharyngeal levels per exam/DISE as indicated');

  // Build DISE VOTE table if data was entered
  let diseTable = '';
  if (hasDISEData) {
    diseTable = `
    <div class="table-responsive mt-2">
      <table class="table table-sm table-bordered" style="max-width:400px;">
        <thead><tr><th>Site</th><th>Degree</th><th>Pattern</th></tr></thead>
        <tbody>
          ${vDeg && vDeg!=='0' ? `<tr><td>Velum</td><td>${vDeg}</td><td>${vPat && vPat!=='\u2014' ? vPat : '\u2014'}</td></tr>` : ''}
          ${oDeg && oDeg!=='0' ? `<tr><td>Oropharynx</td><td>${oDeg}</td><td>${oPat && oPat!=='\u2014' ? oPat : '\u2014'}</td></tr>` : ''}
          ${tDeg && tDeg!=='0' ? `<tr><td>Tongue Base</td><td>${tDeg}</td><td>${tPat && tPat!=='\u2014' ? tPat : '\u2014'}</td></tr>` : ''}
          ${eDeg && eDeg!=='0' ? `<tr><td>Epiglottis</td><td>${eDeg}</td><td>${ePat && ePat!=='\u2014' ? ePat : '\u2014'}</td></tr>` : ''}
        </tbody>
      </table>
    </div>`;
  }

  const surgHelper = surgTargets.length ? `<p><strong>Surgical targets (if pursuing intervention):</strong> ${surgTargets.join('; ')}.</p>${diseTable}` : '';

  const supRatio = formatRatio(ratio(sup, nons));
  const coreNums  = [
    `AHI: ${exists(ahi)?ahi:'\u2014'}${sevLabel ? ' ('+sevLabel+')' : ''}`,
    `REM AHI: ${exists(remAhi)?remAhi:'\u2014'}`,
    `NREM AHI: ${exists(nremAhi)?nremAhi:'\u2014'}`,
    `Sup/Non-sup: ${supRatio}`,
    `Nadir SpO\u2082: ${exists(nadir)?nadir+'%':'\u2014'}`,
    `HB/hr: ${exists(hbPH)?hbPH:'\u2014'}`,
    `Area<90/hr: ${exists(hb90PH)?hb90PH:'\u2014'}`,
    `T90: ${exists(t90)?t90+'%':'\u2014'}`
  ].join(' | ');
  const phenStr   = out.phen.join(', ') || '\u2014';
  const nasalStr  = out.phen.includes('Nasal-Resistance Contributor') ? `Nasal obstruction present${noseScore ? ` (NOSE ${noseScore}/100)` : ''}${ctSeptum ? ', CT: deviated septum' : ''}${ctTurbs ? ', CT: turbinate hypertrophy' : ''}.` : '\u2014';

  const noteDentist = `Reason for referral: mandibular advancement device (MAD) evaluation.\nSummary: ${coreNums}\nPhenotypes: ${phenStr}\nNotes: Consider REM-predominant/positional involvement if listed. Coordinate titration and follow-up HSAT/PSG.`;
  const noteENT     = `Reason for referral: nasal/airway surgery evaluation.\nSummary: ${coreNums}\nPhenotypes: ${phenStr}\nNasal: ${nasalStr}\nNotes: Septum/turbinates may improve airflow and PAP/MAD tolerance; assess palate/pharyngeal collapse per DISE if available.`;
  const noteCards   = `Reason for FYI/coordination: OSA with cardiovascular considerations.\nSummary: ${coreNums}\nPhenotypes: ${phenStr}\nNotes: If High Loop Gain persists with TECSA, consider O\u2082/acetazolamide; ASV only if LVEF > 45%.`;

  const followUps = [];
  if(hasCOMISA) followUps.push(`<strong>COMISA follow-up</strong><ul class="mb-0 mt-1"><li>Reassess ISI at 4–6 weeks post-CBT-I</li><li>Initiate APAP after CBT-I course (typically 4–6 sessions)</li><li>If insomnia persists despite CBT-I → in-person sleep psychology</li><li>Monitor CPAP adherence at 1, 4, and 12 weeks (insomnia = top predictor of abandonment)</li><li>Reassess insomnia subtype (sleep-onset vs. maintenance) to guide PAP comfort settings</li></ul>`);
  if(hasLowAr && !hasCOMISA) followUps.push('CPAP comfort review in 2\u20134 weeks; CBT-I progress.');
  if(out.phen.includes('Positional OSA')) followUps.push('Reassess after 2\u20134 weeks of positional therapy with HSAT/WatchPAT.');
  if(out.phen.includes('Nasal-Resistance Contributor')) followUps.push('Nasal obstruction follow-up; repeat sleep testing after nasal treatment as needed.');
  if(out.phen.includes('Elevated Delta Heart Rate')) followUps.push('Recheck pulse rate variability on follow-up sleep study after therapy initiation.');
  if (recTagMap.some(r => r.tag === 'WEIGHT')) {
    if (weightLossReadiness === 'ready') {
      followUps.push('Weight-management follow-up in 4\u20136 weeks to reinforce current motivation, review early progress, and escalate support if needed.');
    } else if (weightLossReadiness === 'considering') {
      followUps.push('Revisit weight-management readiness at follow-up and use shared decision-making to choose between lifestyle, dietitian, and medication-supported options.');
    } else if (weightLossReadiness === 'not-ready') {
      followUps.push('Weight management remains clinically relevant, but revisit it briefly and without pressure at follow-up rather than making it the sole focus today.');
    }
  }
  followUps.push('Therapy effectiveness check (adherence, residual AHI/ODI, symptoms) at 4\u20138 weeks.');

  /* ─── HGNS (Inspire) Candidacy Assessment ───────────────────── */
  const cpapPressure = n(f.get('cpapPressure'));
  const hgnsCtx = {
    ahi, bmi, sex, sup, nons,
    cpapFailed, prefAvoidCpap, priorInspire,
    vDeg: f.get('vDeg'), vPat: f.get('vPat'),
    oDeg: f.get('oDeg'), oPat: f.get('oPat'),
    tDeg: f.get('tDeg'), tPat: f.get('tPat'),
    pahic3, pahic4, csr,
    cai,
    cpapPressure,
    phenotypes: out.phen,
    hasDISEData
  };
  const hgnsResult = buildHGNSAssessment(hgnsCtx);
  const hgnsHTML = renderHGNSHTML(hgnsResult);
  const insufficientDataDomains = buildInsufficientDataAssessment({
    osaConfirmed,
    oxygenMetricsAvailable,
    oxygenMetricCount,
    oxygenCompositeSufficient,
    sup,
    nons,
    remAhi,
    nremAhi,
    fHypopneas,
    bmi,
    tons,
    mall,
    prefInspire,
    prefSurgery,
    recTags: recTagMap,
    hasDISEData,
    hnsStage,
  });
  const insufficientDataHTML = insufficientDataDomains.length ? `
    <div class="alert alert-warning mt-2 mb-3">
      <strong><i class="bi bi-exclamation-triangle me-1"></i>Insufficient Data Caveats</strong>
      <ul class="mb-0 mt-1">${insufficientDataDomains.map(domain => `<li>${domain.clinician}</li>`).join('')}</ul>
    </div>` : '';
  const treatmentSafetyChecks = buildTreatmentSafetyAssessment({
    osaConfirmed,
    recTags: recTagMap,
    priorMAD,
    priorJaw,
    prefSurgery,
    hasDISEData,
    studyType: f.get('studyType') || null,
    csr,
    pahic3,
    pahic4,
    cai,
    lvef,
    madDentition,
    madProtrusion,
    madTmj,
  });
  const treatmentSafetyHTML = treatmentSafetyChecks.length ? `
    <div class="alert alert-warning mt-2 mb-3">
      <strong><i class="bi bi-shield-exclamation me-1"></i>Treatment Safety Checks</strong>
      <ul class="mb-0 mt-1">${treatmentSafetyChecks.map(alert => `<li>${alert.clinician}</li>`).join('')}</ul>
    </div>` : '';
  const insufficientGuardedRecEntries = applyInsufficientDataGuardrails(
    recTagMap.map(r => ({ text: r.text, tag: r.tag })),
    insufficientDataDomains
  );
  const guardedRecEntries = applyTreatmentSafetyGuardrails(
    insufficientGuardedRecEntries,
    treatmentSafetyChecks
  );
  const guardedRecTexts = guardedRecEntries.map(entry => entry.text);

  /* ── Key numbers with color coding ─────────────────────────── */
  const keyNumItems = [];

  if (exists(ahi)) {
    const ahiColor = ahi >= 30 ? '#dc3545' : ahi >= 15 ? '#fd7e14' : ahi >= 5 ? '#ffc107' : '#198754';
    const ahiArrow = ahi >= 30 ? '\u2191\u2191' : ahi >= 15 ? '\u2191' : '';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${ahiColor}">${ahiArrow} ${ahi}</span><span class="osa-clin-metric-lbl">AHI${sevLabel ? ' \u2014 '+sevLabel : ''}</span></div>`);
  }
  if (exists(nadir)) {
    const nadColor = nadir < 80 ? '#dc3545' : nadir < 88 ? '#fd7e14' : '#198754';
    const nadArrow = nadir < 80 ? '\u2193\u2193' : nadir < 88 ? '\u2193' : '';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${nadColor}">${nadArrow} ${nadir}%</span><span class="osa-clin-metric-lbl">Nadir SpO\u2082</span></div>`);
  }
  if (exists(odi)) {
    const odiColor = odi >= 30 ? '#dc3545' : odi >= 15 ? '#fd7e14' : '#198754';
    const odiArrow = odi >= 30 ? '\u2191\u2191' : odi >= 15 ? '\u2191' : '';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${odiColor}">${odiArrow} ${odi}</span><span class="osa-clin-metric-lbl">ODI 4%</span></div>`);
  }
  if (exists(sup) && exists(nons) && nons > 0) {
    const sRatio = (sup/nons).toFixed(1);
    const supColor = sRatio >= 2.0 ? '#fd7e14' : '#6c757d';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${supColor}">${sRatio}x</span><span class="osa-clin-metric-lbl">Sup / Non-sup</span></div>`);
  }
  if (exists(remAhi)) {
    const remColor = remAhi >= 30 ? '#dc3545' : remAhi >= 15 ? '#fd7e14' : '#6c757d';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${remColor}">${remAhi}</span><span class="osa-clin-metric-lbl">REM AHI</span></div>`);
  }
  if (exists(hbPH)) {
    const hbColor = hbPH >= 10 ? '#dc3545' : hbPH >= 5 ? '#fd7e14' : '#6c757d';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${hbColor}">${hbPH}</span><span class="osa-clin-metric-lbl">HB / hr</span></div>`);
  }
  if (exists(hb90PH)) {
    const a90Color = hb90PH >= 2 ? '#dc3545' : hb90PH >= 1 ? '#fd7e14' : '#6c757d';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${a90Color}">${hb90PH}</span><span class="osa-clin-metric-lbl">Area &lt;90% / hr</span></div>`);
  }
  if (exists(t90)) {
    const t90Color = t90 > 20 ? '#dc3545' : t90 >= 5 ? '#fd7e14' : '#6c757d';
    keyNumItems.push(`<div class="osa-clin-metric"><span class="osa-clin-metric-val" style="color:${t90Color}">${t90}%</span><span class="osa-clin-metric-lbl">T90</span></div>`);
  }

  const keyNumsGrid = keyNumItems.length
    ? `<div class="osa-clin-metrics-row">${keyNumItems.join('')}</div>`
    : '';

  /* ── HB Treatment Allocation (Pinilla 2023, Azarbarzin 2025, Peker 2025) ── */
  const hbTreatmentNote = (() => {
    // Three-tier HB CV risk using updated evidence:
    // Very high (≥87 %min/h): pooled 2025 high-risk OSA — strongest CPAP indication
    // High (≥73 %min/h): ISAACC — CPAP reduces CV events (HR 0.57)
    // Moderate (30–73): phenotype detected but below CPAP CV benefit threshold
    // Also check non-HB-area metrics that indicate severe hypoxemia
    const veryHighHB = exists(hbPH) && hbPH >= T.hypoxicBurden.hbPerHourSevere;
    const highHB = exists(hbPH) && hbPH >= T.hypoxicBurden.hbPerHourHigh;
    const severeOther = (exists(odi) && odi > T.hypoxicBurden.odiSevere) || (exists(t90) && t90 > T.hypoxicBurden.t90Severe) || (exists(nadir) && nadir < T.hypoxicBurden.nadirSevere);

    // ΔHR + HB synergy (Azarbarzin 2021): high ΔHR + high HB = HR 3.50 for fatal CVD
    const highDHR = exists(dhr) && dhr >= T.deltaHeartRate.dhr;
    const synergy = (highHB || severeOther) && highDHR;

    if (veryHighHB || (highHB && severeOther)) {
      const triggers = [];
      if (veryHighHB) triggers.push(`HB ${hbPH.toFixed(0)} %min/h (≥87 pooled threshold)`);
      else if (highHB) triggers.push(`HB ${hbPH.toFixed(0)} %min/h (≥73 ISAACC threshold)`);
      if (exists(odi) && odi > T.hypoxicBurden.odiSevere) triggers.push(`ODI ${odi} (>50)`);
      if (exists(t90) && t90 > T.hypoxicBurden.t90Severe) triggers.push(`T90 ${t90}% (>20%)`);
      if (exists(nadir) && nadir < T.hypoxicBurden.nadirSevere) triggers.push(`nadir ${nadir}% (<75%)`);
      return `<div class="alert alert-danger mt-2 py-2 px-3"><strong>Very High Hypoxic Burden — Strong CPAP Indication</strong><ul class="mb-1 mt-1"><li><strong>Triggers:</strong> ${triggers.join('; ')}</li><li>High-risk OSA per pooled multi-trial analysis <small class="text-muted">(Azarbarzin 2025)</small></li><li>CPAP significantly reduces CV events in this group — strongly prioritize effective PAP</li>${synergy ? '<li class="text-danger"><strong>ΔHR + HB synergy:</strong> HR 3.50 for fatal CVD — highest-risk phenotype, urgent treatment <small class="text-muted">(Azarbarzin 2021)</small></li>' : ''}</ul></div>`;
    }
    if (highHB || severeOther) {
      const triggers = [];
      if (highHB) triggers.push(`HB ${hbPH.toFixed(0)} %min/h (≥73 ISAACC threshold)`);
      if (exists(odi) && odi > T.hypoxicBurden.odiSevere) triggers.push(`ODI ${odi} (>50)`);
      if (exists(t90) && t90 > T.hypoxicBurden.t90Severe) triggers.push(`T90 ${t90}% (>20%)`);
      if (exists(nadir) && nadir < T.hypoxicBurden.nadirSevere) triggers.push(`nadir ${nadir}% (<75%)`);
      return `<div class="alert alert-danger mt-2 py-2 px-3"><strong>High Hypoxic Burden — CPAP CV Benefit</strong><ul class="mb-1 mt-1"><li><strong>Triggers:</strong> ${triggers.join('; ')}</li><li>Above thresholds where CPAP reduces CV events (HR 0.57) <small class="text-muted">(Pinilla 2023)</small></li><li>HB (not AHI alone) predicts MACCEs (HR 1.87) <small class="text-muted">(RICCADSA / Peker 2025)</small></li><li>Prioritize effective PAP therapy for CV risk reduction</li>${synergy ? '<li class="text-danger"><strong>ΔHR + HB synergy:</strong> HR 3.50 for fatal CVD <small class="text-muted">(Azarbarzin 2021)</small></li>' : ''}</ul></div>`;
    }
    return '';
  })();

  /* ── Low HB — Alternatives Equally Effective / CPAP Caution (Pinilla 2023) ── */
  const mildLowHbNote = (() => {
    const lowHB = oxygenCompositeSufficient && !out.phen.includes('High Hypoxic Burden');
    if (!lowHB || !exists(ahi) || ahi < 5) return '';

    const isMild = ahi < 15;
    if (isMild) {
      return `<div class="alert alert-success mt-2 py-2 px-3"><strong>Mild OSA + Low Hypoxic Burden</strong><ul class="mb-1 mt-1"><li>CPAP and non-CPAP treatments (MAD, positional, weight loss) show comparable outcomes <small class="text-muted">(Pinilla 2023)</small></li><li>Patient preference should guide selection — alternatives are strong first-line</li><li><small class="text-muted">Note: ISAACC low-HB patients on CPAP trended toward increased CV events (HR 1.33, NS) — supports alternatives-first approach</small></li></ul></div>`;
    }
    // Moderate OSA + low HB: still worth noting
    if (ahi < 30) {
      return `<div class="alert alert-info mt-2 py-2 px-3"><strong>Moderate OSA + Low Hypoxic Burden</strong><ul class="mb-1 mt-1"><li>HB below CV-risk threshold <small class="text-muted">(Pinilla 2023, Peker 2025)</small></li><li>High AHI with low HB is not associated with MACCEs — only high HB predicts CV events <small class="text-muted">(RICCADSA)</small></li><li>Non-CPAP alternatives reasonable; shared decision-making appropriate</li></ul></div>`;
    }
    return '';
  })();

  /* ── ATS 2025 Triage Note ──────────────────────────────── */
  const atsTriage = (() => {
    const hasAnat = out.phen.includes('High Anatomical Contribution');
    const hasNonanat = out.phen.includes('Low Arousal Threshold') || out.phen.includes('High Loop Gain') || out.phen.includes('Poor Muscle Responsiveness');
    if (hasAnat && hasNonanat) {
      return `<div class="alert alert-info mt-2 py-2 px-3"><strong>ATS 2025 Triage: Anatomy + Nonanatomic Endotypes</strong><ul class="mb-0 mt-1"><li>Address collapsibility (anatomy) first</li><li>ArTH / LG targeting unlikely to succeed if airway is highly collapsible</li></ul></div>`;
    }
    return '';
  })();

  /* ── Treatment plan with numbered badges ─────────────────── */
  const rankedPlan = guardedRecTexts.map((r, i) => {
    const priority = i === 0 ? ' osa-rec-priority' : '';
    return `<div class="osa-clin-rec${priority}"><span class="osa-clin-rec-num">${i+1}</span><span>${r}</span></div>`;
  }).join('');

  /* ── Care Pathway Bar (clinician report) ──────────────── */
  const milestones = [...document.querySelectorAll('#patientMilestones input:checked')].map(cb => cb.value);

  const studyTypeVal = document.querySelector('input[name="studyType"]:checked')?.value;
  const { stages: careStages, currentIdx: currentStageIdx } = OSAReportShared.buildCarePathway({
    milestones,
    studyType: studyTypeVal,
    hasStudyData: exists(ahi),
    hasPatientContext: Boolean(document.getElementById('patientName')?.value),
    labels: {
      eval: 'Evaluation',
      study: {
        psg: 'Lab Sleep Study',
        watchpat: 'Home Sleep Test',
        default: 'Sleep Study',
      },
      cpap: {
        trial: 'CPAP Trial',
        followup: 'CPAP Follow-up',
        ongoing: 'Ongoing',
      },
      surgical: {
        planning: 'Treatment Planning',
        dise: 'DISE',
        surgery: 'Surgery',
        postop: 'Post-Op',
        efficacy: 'Efficacy Study',
      },
      mad: {
        referral: 'MAD Referral',
        followup: 'MAD Follow-up',
        efficacy: 'Efficacy Study',
      },
      generic: {
        planning: 'Treatment Planning',
        treatment: 'Treatment',
      },
    },
  });

  const pathwayHTML = currentStageIdx >= 0 ? `<div class="osa-care-pathway mb-3">${careStages.map((s, i) => {
    const state = i < currentStageIdx ? 'completed' : i === currentStageIdx ? 'active' : 'upcoming';
    const completedKeys = s.keys.filter(k => milestones.includes(k));
    const icon = state === 'completed' ? '<i class="bi bi-check-circle-fill"></i>' : state === 'active' ? '<i class="bi bi-circle-fill"></i>' : '<i class="bi bi-circle"></i>';
    return `<div class="osa-pathway-step osa-pathway-${state}" title="${completedKeys.length ? completedKeys.join(', ') : s.label}">${icon}<span>${s.label}</span></div>`;
  }).join('<div class="osa-pathway-connector"></div>')}</div>` : '';

  /* ── Care Summary Card (clinician report) ────────────── */
  // Only show when there's meaningful context (milestones or treatment history)
  const hasTxHistory = cpapCurrent || cpapFailed || prefAvoidCpap || priorMAD || priorUPPP || priorInspire;
  const careSummaryParts = [];
  if ((milestones.length || hasTxHistory) && exists(ahi)) careSummaryParts.push(`AHI ${ahi} (${sevLabel || 'normal'})`);
  if (cpapCurrent) careSummaryParts.push('Current CPAP user');
  else if (cpapFailed) careSummaryParts.push(`CPAP tried (${cpapWillRetry ? 'will retry' : 'discontinued'})`);
  else if (prefAvoidCpap) careSummaryParts.push('Prefers to avoid CPAP');
  if (priorMAD) careSummaryParts.push('Prior MAD');
  if (priorUPPP) careSummaryParts.push('Prior UPPP');
  if (priorInspire) careSummaryParts.push('Prior Inspire');
  if (weightLossReadiness === 'ready') careSummaryParts.push('Ready for weight management');
  else if (weightLossReadiness === 'considering') careSummaryParts.push('Considering weight management');
  else if (weightLossReadiness === 'not-ready') careSummaryParts.push('Not ready for weight management');
  if (hasCOMISA) careSummaryParts.push('COMISA');
  if (milestones.length) careSummaryParts.push(`Stage: ${milestones[milestones.length - 1]}`);

  const careSummaryHTML = careSummaryParts.length ? `<div class="osa-care-summary mb-3"><i class="bi bi-clipboard2-pulse me-2"></i>${careSummaryParts.join(' · ')}</div>` : '';

  /* ── Build collapsible clinical analysis content ──────── */
  const clinAnalysisParts = [];
  if (edwardsArTH && out.phen.includes('Low Arousal Threshold'))
    clinAnalysisParts.push(`<div class="alert alert-info py-2 px-3 mb-2"><strong>Edwards ArTH Score: ${edwardsArTH.score}/${edwardsArTH.maxScore}</strong> — ${edwardsArTH.prediction} (${edwardsArTH.details.join(', ')})${edwardsArTH.partial ? ' <small class="text-muted">[Hypopnea fraction unavailable from WatchPAT — score based on 2 of 3 variables. Enter Apnea Index + Hypopnea Index in Lab PSG section for full score.]</small>' : ''}</div>`);
  if (!exists(fHypopneas)) {
    clinAnalysisParts.push('<div class="alert alert-secondary py-2 px-3 mb-2"><strong>Detailed Endotyping Incomplete</strong> <small class="text-muted">(Vena 2022; Edwards 2014; Schmickl 2022)</small><ul class="mb-0 mt-1"><li>Apnea/hypopnea breakdown not entered</li><li>Collapsibility estimate and point-of-care loop gain estimate remain incomplete</li><li>Low-arousal-threshold scoring may be partial rather than fully scored</li></ul></div>');
  }
  if (exists(fHypopneas)) {
    const collLabel = collapsibility === 'high' ? 'High' : collapsibility === 'moderate' ? 'Moderate' : 'Low';
    const collImplication = collapsibility === 'high' ? 'Anatomy-directed therapy (CPAP, surgery, HNS) prioritized' : collapsibility === 'low' ? 'Non-CPAP therapies (MAD, positional, weight loss) more likely to succeed' : 'Mixed pattern — both anatomic and nonanatomic therapies may be effective';
    clinAnalysisParts.push(`<div class="alert alert-${collapsibility === 'high' ? 'warning' : 'info'} py-2 px-3 mb-2"><strong>Collapsibility: ${collLabel}</strong> <small class="text-muted">(Vena 2022)</small><ul class="mb-0 mt-1"><li>F(hypopneas) = ${fHypopneas.toFixed(0)}%</li><li>${collImplication}</li></ul></div>`);
  }
  if (exists(lgEstimate)) {
    const lgLevel = lgEstimate >= T.loopGain.estimateHigh ? 'High' : lgEstimate >= T.loopGain.estimateBorderline ? 'Borderline' : 'Low';
    const lgAction = lgEstimate >= T.loopGain.estimateHigh ? '<li>Consider O₂ or acetazolamide</li><li>Monitor for treatment-emergent centrals</li>' : lgEstimate >= T.loopGain.estimateBorderline ? '<li>Monitor for residual events on therapy</li>' : '';
    clinAnalysisParts.push(`<div class="alert alert-${lgEstimate >= T.loopGain.estimateHigh ? 'warning' : 'info'} py-2 px-3 mb-2"><strong>Loop Gain: ${lgLevel} (LG ≈ ${lgEstimate.toFixed(2)})</strong> <small class="text-muted">(Schmickl 2022)</small>${lgAction ? `<ul class="mb-0 mt-1">${lgAction}</ul>` : ''}</div>`);
  }
  if (hbTreatmentNote) clinAnalysisParts.push(hbTreatmentNote.replace(/mt-2/g, 'mb-2'));
  if (atsTriage) clinAnalysisParts.push(atsTriage.replace(/mt-2/g, 'mb-2'));
  if (mildLowHbNote) clinAnalysisParts.push(mildLowHbNote.replace(/mt-2/g, 'mb-2'));

  /* ── Build collapsible treatment candidacy content ───── */
  const txCandidacyParts = [];
  if (friedmanStage)
    txCandidacyParts.push(`<div class="alert alert-${friedmanStage === 'I' ? 'success' : friedmanStage === 'II' ? 'info' : friedmanStage === 'III' ? 'warning' : 'danger'} py-2 px-3 mb-2"><strong>Friedman Stage ${friedmanStage}</strong> (FTP ${mall || '?'}, Tonsils ${exists(tons)?tons:'?'}, BMI ${exists(bmi)?bmi.toFixed(1):'?'}) — ${friedmanStage === 'I' ? 'Favorable UPPP candidate (~80% success)' : friedmanStage === 'II' ? 'Intermediate surgical candidate (~37-74%)' : friedmanStage === 'III' ? 'Poor UPPP candidate (~8%) — consider tongue base surgery, HNS, or MMA' : 'Generally excluded from soft tissue surgery (BMI ≥40 or skeletal deformity)'}</div>`);
  if (hnsStage) {
    if (hnsStage.insufficient) {
      txCandidacyParts.push(`<div class="alert alert-secondary py-2 px-3 mb-2"><strong>HNS Response Prediction (Ji 2026)</strong> — Insufficient data. Enter ${hnsStage.missing.join(', ')} to generate a stage-based response estimate.${hasConcentricCollapse ? ' <span class="badge bg-danger">DISE: Concentric collapse — HNS contraindicated</span>' : ''}</div>`);
    } else {
      txCandidacyParts.push(`<div class="alert alert-${hnsStage.stage === 'I' ? 'success' : hnsStage.stage === 'II' ? 'info' : 'warning'} py-2 px-3 mb-2"><strong>HNS Response Prediction (Ji 2026): Stage ${hnsStage.stage}</strong> — Est. ${hnsStage.responseRate}% response rate${hnsStage.details.length ? ' (unfavorable: ' + hnsStage.details.join(', ') + ')' : ' (all favorable)'}${hasConcentricCollapse ? ' <span class="badge bg-danger">DISE: Concentric collapse — HNS contraindicated</span>' : ''}</div>`);
    }
  }
  txCandidacyParts.push(`<div class="alert alert-${priorMAD ? 'secondary' : madScore.tier === 'favorable' ? 'success' : madScore.tier === 'poor' ? 'secondary' : 'light'} py-2 px-3 mb-2"><strong>MAD Candidacy: ${madScore.tier.charAt(0).toUpperCase() + madScore.tier.slice(1)}</strong> (score ${madScore.score})${priorMAD ? ' — <em>Prior MAD trial; score reflects profile suitability only</em>' : ''} — Factors: ${madScore.factors.join(', ')}<br><small class="text-muted"><strong>Before prescribing MAD, verify:</strong> adequate dentition, no severe TMJ dysfunction, mandibular protrusion ≥6mm${priorJaw ? ', prior jaw surgery occlusal assessment' : ''}</small></div>`);
  if (surgHelper) txCandidacyParts.push(surgHelper);
  if (hgnsHTML) txCandidacyParts.push(`<div class="mt-2">${hgnsHTML}</div>`);

  /* ── Summary badges for collapsed headers ───────────── */
  const analysisBadges = [
    exists(fHypopneas) ? `Collapsibility: ${collapsibility}` : null,
    exists(lgEstimate) ? `Loop Gain: ${lgEstimate.toFixed(2)}` : null,
    edwardsArTH && out.phen.includes('Low Arousal Threshold') ? `Low Arousal Threshold (${edwardsArTH.score}/${edwardsArTH.maxScore} criteria)` : null,
    hbTreatmentNote ? 'Hypoxic burden note' : null,
  ].filter(Boolean);

  const candidacyBadges = [
    friedmanStage ? `Friedman ${friedmanStage}` : null,
    priorMAD ? `MAD: ${madScore.tier} (prior trial)` : `MAD: ${madScore.tier}`,
    hnsStage && !hnsStage.insufficient ? `Inspire: ${hnsStage.responseRate}% response (Stage ${hnsStage.stage})` : hnsStage?.insufficient ? 'Inspire: staging incomplete' : null,
  ].filter(Boolean);

  let cHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 no-print">
      <h2 class="h4 osa-section-title mb-0">Clinician Decision Support</h2>
      <button class="btn btn-outline-success btn-sm" id="btnDownloadClinicianPdf"><i class="bi bi-file-earmark-pdf"></i> Download PDF</button>
    </div>
    ${pathwayHTML}
    ${careSummaryHTML}
    <p class="mb-2"><strong>Subtype:</strong> ${subtype} (ESS ${exists(ess)?ess:'\u2014'}, ISI ${exists(isi)?isi:'\u2014'})</p>
    ${cpapFailed ? `<p class="mb-2"><strong>CPAP History:</strong> Prior trial ${cpapHelped === 'Yes' ? '(helped but discontinued)' : cpapHelped === 'No' ? '(did not help)' : '(efficacy unclear)'} — ${cpapWillRetry ? 'willing to retry' : 'not willing to retry'}${cpapReasons.length ? '. Issues: ' + cpapReasons.map(r => ({cpapMask:'mask fit',cpapClaustro:'claustrophobia',cpapDry:'dryness',cpapLeaks:'leaks/noise',cpapSleep:'sleep onset',cpapSkin:'skin irritation',cpapNoImprove:'inefficacy',cpapTravel:'travel'}[r]||r)).join(', ') : ''}</p>` : cpapCurrent ? '<p class="mb-2"><strong>CPAP History:</strong> Currently using CPAP</p>' : ''}
    ${keyNumsGrid}
    ${hstValidityHTML}
    ${insufficientDataHTML}
    ${treatmentSafetyHTML}
    ${out.phen.length ? `
      <div class="table-responsive mt-3">
        <table class="table table-sm align-middle osa-report-table">
          <thead><tr><th>Phenotype</th><th>Signal Strength</th><th>Triggers</th></tr></thead>
          <tbody>${confTable}</tbody>
        </table>
        <p class="small text-muted mb-0">Signal strength reflects internal rule support and should not be interpreted as a validated probability score.</p>
      </div>` : ''
    }

    <h5 class="mt-3 mb-2">Treatment Plan</h5>
    ${rankedPlan}
    ${guardrails.length?`<div class="alert alert-warning mt-3 mb-2"><strong>Guardrails</strong>${guardrails.map(g => g.startsWith('<strong>') ? `<div class="mt-2">${g}</div>` : `<ul class="mb-1"><li>${g}</li></ul>`).join('')}</div>`:''}

    ${clinAnalysisParts.length ? `
    <div class="osa-clin-section mt-3">
      <div class="osa-clin-section-header" data-bs-toggle="collapse" data-bs-target="#clinAnalysis" aria-expanded="false">
        <span><i class="bi bi-graph-up me-2"></i>Clinical Analysis</span>
        <span class="osa-clin-section-badges">${analysisBadges.map(b => `<span class="badge bg-light text-dark border">${b}</span>`).join(' ')}</span>
        <i class="bi bi-chevron-down osa-collapse-icon ms-auto"></i>
      </div>
      <div class="collapse" id="clinAnalysis">
        <div class="osa-clin-section-body">${clinAnalysisParts.join('')}</div>
      </div>
    </div>` : ''}

    <div class="osa-clin-section mt-2">
      <div class="osa-clin-section-header" data-bs-toggle="collapse" data-bs-target="#txCandidacy" aria-expanded="false">
        <span><i class="bi bi-clipboard2-check me-2"></i>Treatment Candidacy</span>
        <span class="osa-clin-section-badges">${candidacyBadges.map(b => `<span class="badge bg-light text-dark border">${b}</span>`).join(' ')}</span>
        <i class="bi bi-chevron-down osa-collapse-icon ms-auto"></i>
      </div>
      <div class="collapse" id="txCandidacy">
        <div class="osa-clin-section-body">${txCandidacyParts.join('')}</div>
      </div>
    </div>

    <div class="osa-clin-section mt-2">
      <div class="osa-clin-section-header" data-bs-toggle="collapse" data-bs-target="#clinFollowup" aria-expanded="false">
        <span><i class="bi bi-calendar-check me-2"></i>Follow-up Plan</span>
        <span class="osa-clin-section-badges">${[
          hasCOMISA ? 'COMISA protocol' : null,
          out.phen.includes('Positional OSA') ? 'Positional recheck' : null,
          `${followUps.length} items`,
        ].filter(Boolean).map(b => `<span class="badge bg-light text-dark border">${b}</span>`).join(' ')}</span>
        <i class="bi bi-chevron-down osa-collapse-icon ms-auto"></i>
      </div>
      <div class="collapse" id="clinFollowup">
        <div class="osa-clin-section-body">${followUps.map(x => x.startsWith('<strong>') ? `<div class="mb-2">${x}</div>` : `<ul class="mb-1"><li>${x}</li></ul>`).join('')}</div>
      </div>
    </div>
  `;

  // ── Populate analysis data for patient report ──
  lastAnalysisData = {
    phen: out.phen,
    why: out.why,
    recs: guardedRecTexts,
    recTags: guardedRecEntries,
    sex, bmi, neck,
    tonsils: tons,
    ftp: mall || null,
    nasalObs, ctSeptum, ctTurbs,
    ess, isi, noseScore,
    studyType: f.get('studyType') || null,
    pahi: n(f.get('pahi')),
    ahi,
    odi,
    nadir: n(f.get('nadir')),
    nadirPsg: n(f.get('nadirPsg')),
    supPahi: n(f.get('supPahi')),
    nonSupPahi: n(f.get('nonSupPahi')),
    remPahi: n(f.get('remPahi')),
    nremPahi: n(f.get('nremPahi')),
    ahiSup: n(f.get('ahiSup')),
    ahiNonSup: n(f.get('ahiNonSup')),
    ahiREM: n(f.get('ahiREM')),
    ahiNREM: n(f.get('ahiNREM')),
    cai: n(f.get('cai')),
    csr,
    hbAreaPH: hbPH,
    hbUnder90PH: hb90PH,
    t90,
    snoreIdx: n(f.get('snoreIdx')),
    tst: n(f.get('tst')),
    arInd,
    cpapCurrent,
    cpapFailed,
    cpapWillRetry,
    cpapHelped,
    prefAvoidCpap,
    priorMAD,
    priorJaw,
    priorInspire,
    priorUPPP,
    prefSurgery,
    hasCOMISA,
    lvef,
    madDentition,
    madProtrusion,
    madTmj,
    madScore,
    friedmanStage,
    hnsStage,
    hasConcentricCollapse,
    retrognathia,
    subtype,
    severity: ahiSeverity(ahi) || 'normal',
    primaryAHI: ahi,
    patRdi: n(f.get('patRdi')),
    patientName: (document.getElementById('patientName')?.value || '').trim(),
    reportDate: new Date().toISOString().split('T')[0],
    snoringReported: yes(f, 'snoringReported') || (n(f.get('snoreIdx')) != null && n(f.get('snoreIdx')) > 0),
    lowHypoxicBurden: oxygenCompositeSufficient && !out.phen.includes('High Hypoxic Burden'),
    oxygenMetricsAvailable,
    insufficientDataDomains,
    treatmentSafetyChecks,
    apneaIndex,
    hypopneaIndex,
    fHypopneas,
    collapsibility,
    lgEstimate,
    dhr,
    milestones: [...document.querySelectorAll('#patientMilestones input:checked')].map(cb => cb.value),
    studyType: document.querySelector('input[name="studyType"]:checked')?.value || null,
    cpapPressure: n(f.get('cpapPressure')),
    weightLossReadiness,
    age: n(f.get('age')),
  };

  // Show the Generate Patient Report button
  const triggerEl = document.getElementById('patientReportTrigger');
  if (triggerEl) triggerEl.style.display = '';

  /* Render */
  const isPreStudy = ahi == null;
  const clinEl = document.getElementById('clinicianReport');
  if (isPreStudy) {
    // Pre-study patients: no sleep data → skip clinician report, show only patient report trigger
    clinEl.innerHTML = '';
  } else {
    clinEl.innerHTML = cHTML;
    /* Wire clinician PDF download button */
    const btnCliPdf = document.getElementById('btnDownloadClinicianPdf');
    if(btnCliPdf) btnCliPdf.addEventListener('click', ()=> OSAPdfExport.exportClinicianPDF());
  }

  /* Smooth scroll to results area */
  const scrollTarget = isPreStudy ? triggerEl : clinEl;
  if (scrollTarget) window.scrollTo({ top: scrollTarget.offsetTop - 80, behavior:'smooth' });
});

// ── Patient Report Overlay ──────────────────────────────────────
const reportOverlay = document.getElementById('reportOverlay');
const reportCloseButton = document.getElementById('btnCloseReport');
const saveReportSnapshotButton = document.getElementById('btnSaveReportSnapshot');
let lastReportTrigger = null;

function getReportFocusableElements() {
  if (!reportOverlay) return [];
  return [...reportOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.disabled && el.offsetParent !== null);
}

function openReportOverlay(triggerEl) {
  if (!lastAnalysisData || !reportOverlay) return;
  lastReportTrigger = triggerEl || document.activeElement;
  const html = PatientReport.generateReportHTML(lastAnalysisData);
  openReportOverlayFromHtml(html, triggerEl, true);
}

function openReportOverlayFromHtml(html, triggerEl, allowSnapshotSave = false) {
  if (!reportOverlay) return;
  lastReportTrigger = triggerEl || document.activeElement;
  document.getElementById('reportPreviewContent').innerHTML = html;
  reportOverlay.classList.add('active');
  document.body.classList.add('report-preview-open');
  if (saveReportSnapshotButton) saveReportSnapshotButton.disabled = !allowSnapshotSave;
  window.setTimeout(() => reportCloseButton?.focus(), 0);
}

function closeReportOverlay() {
  if (!reportOverlay) return;
  reportOverlay.classList.remove('active');
  document.body.classList.remove('report-preview-open');
  const returnFocusEl = lastReportTrigger instanceof HTMLElement ? lastReportTrigger : document.getElementById('btnGenerateReport');
  returnFocusEl?.focus();
}

document.getElementById('btnGenerateReport')?.addEventListener('click', (e) => {
  openReportOverlay(e.currentTarget);
});

document.getElementById('btnSaveReportSnapshot')?.addEventListener('click', async (e) => {
  if (!lastAnalysisData || !window.OSAChartActions?.saveReportSnapshot) return;
  const currentHtml = document.getElementById('reportPreviewContent')?.innerHTML || '';
  await window.OSAChartActions.saveReportSnapshot({
    analysisData: lastAnalysisData,
    patientReportHtml: currentHtml,
    reportDate: lastAnalysisData.reportDate,
    patientName: lastAnalysisData.patientName,
    triggerEl: e.currentTarget,
  });
});

reportCloseButton?.addEventListener('click', () => {
  closeReportOverlay();
});

document.getElementById('btnDownloadReportPdf')?.addEventListener('click', () => {
  if (typeof OSAPdfExport !== 'undefined' && OSAPdfExport.exportPatientReportPDF) {
    OSAPdfExport.exportPatientReportPDF();
  }
});

document.addEventListener('keydown', (e) => {
  if (!reportOverlay?.classList.contains('active')) return;

  if (e.key === 'Escape') {
    closeReportOverlay();
    return;
  }

  if (e.key === 'Tab') {
    const focusable = getReportFocusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

window.OSAReportState = {
  getLastAnalysisData: () => lastAnalysisData,
  openHtmlSnapshot: (html, triggerEl) => openReportOverlayFromHtml(html, triggerEl, false),
  closePreview: () => closeReportOverlay(),
};
