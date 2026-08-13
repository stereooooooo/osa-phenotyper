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
function escapeHtml(value){
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* Clinician-only evidence explanations. Keep these sparse: use them for
   interpretation boundaries or unfamiliar concepts, not basic sleep terms. */
function clinicianEvidenceTooltip(text, label = 'Why this matters') {
  return `<button type="button" class="osa-evidence-tooltip" data-bs-toggle="tooltip" data-bs-placement="top" title="${escapeHtml(text)}" aria-label="${escapeHtml(label)}"><i class="bi bi-info-circle" aria-hidden="true"></i></button>`;
}

function initializeClinicalTooltips(root = document) {
  if (!root || !window.bootstrap?.Tooltip) return;
  root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
    window.bootstrap.Tooltip.getOrCreateInstance(element);
  });
}

window.OSAClinicianTooltips = {
  button: clinicianEvidenceTooltip,
  initialize: initializeClinicalTooltips,
};

/* ── Shorthand for threshold access ───────────────────────────── */
const T = OSA_CONFIG.thresholds;
/* Feature toggle — ΔHR disabled (device can't measure it); see config.js. */
const DHR_ENABLED = !!(OSA_CONFIG.features && OSA_CONFIG.features.deltaHeartRate);
let lastAnalysisData = null;

/* ── Signal-strength helper — extracted to js/phenotype-confidence.js so the
   heuristic is the single source of truth shared with tests/tests.html
   (loaded before app.js). ── */
const confidenceFor = OSAPhenotype.confidenceFor;

/* ── CPAP intolerance reason → display label (single source of truth) ─────── */
const CPAP_ISSUE_LABELS = {
  cpapMask: 'mask fit',
  cpapClaustro: 'claustrophobia',
  cpapDry: 'dryness',
  cpapLeaks: 'leaks/noise',
  cpapSleep: 'sleep onset',
  cpapSkin: 'skin irritation',
  cpapNoImprove: 'prior inefficacy',
  cpapTravel: 'travel'
};

/* ── Clinician recommendation ranking (lower = higher in the plan) ──────────
   Leads with the most actionable first-line therapy for the patient and sorts
   prerequisite workup caveats last so they don't crowd the plan. Unlisted tags
   get a mid priority; any *-WORKUP tag sorts last. (Clinical review 2026-06.) */
const REC_PRIORITY = {
  'SLEEP-STUDY': 2,
  'NEG-HST-PSG': 3,
  'CBTI': 5, 'COMISA-PAP': 6, 'COMISA-SRT-CAUTION': 7,
  'OXYGEN-URG': 8,
  'CPAP': 10, 'CPAP-FIXED': 10, 'CPAP-OPT': 11,
  'TONSIL': 15, 'SOFT-TISSUE-STRONG': 16, 'FRIEDMAN-III-ALT': 17,
  'NASAL-OPT': 12,
  'POS': 20,
  'WEIGHT': 25,
  'SURG': 30, 'SURGALT': 31, 'SURG-PREF': 32, 'SOFT-TISSUE-CONSIDER': 33, 'SOFT-TISSUE-GENERAL': 34, 'SOFT-TISSUE-REVISION': 35,
  'HNS': 40, 'INSPIRE-EVAL': 41, 'INSPIRE-OPT': 42,
  'ASV-SAFETY': 45,
  'MAD-FAVORABLE': 50, 'MAD': 51, 'MAD-POOR': 52,
  'MILD-LIFESTYLE': 60,
  'DHR-TX': 62, 'DHR-CARDS': 63
};
function recPriority(tag) {
  if (!tag) return 70;
  if (/-WORKUP$/.test(tag)) return 90;            // prerequisite caveats sort last
  return REC_PRIORITY[tag] != null ? REC_PRIORITY[tag] : 70;
}

const VISIT_REASON_LABELS = {
  'snoring': 'Snoring concern',
  'symptoms': 'Symptoms and possible sleep apnea',
  'new-diagnosis': 'Review new diagnosis or sleep study',
  'transfer-pap': 'Transfer or establish PAP care',
  'pap-troubleshoot': 'Improve PAP comfort or results',
  'restart-pap': 'Restart PAP',
  'oral-appliance': 'Discuss an oral appliance',
  'inspire': 'Discuss nerve stimulation',
  'surgery': 'Discuss airway surgery',
  'non-pap': 'Discuss non-PAP options',
  'precision-onboarding': 'Established patient joining Precision Sleep',
  'follow-up': 'Sleep apnea follow-up or other goal',
};

const PLAN_FIELD_TO_TAGS = {
  planPap: ['CPAP', 'CPAP-ALT', 'CPAP-PREF', 'CPAP-OPT', 'CPAP-DESENTIZE', 'CPAP-HUMID', 'CPAP-RETITRATE', 'CPAP-FIXED', 'COMISA-PAP', 'COMISA-SRT-CAUTION', 'HLG-ADV', 'ASV-CONTRA'],
  planNasal: ['NASAL-OPT', 'NASAL-SURG', 'NASAL-PRIOR', 'NASAL-SINUS-PRIOR'],
  planPositional: ['POS', 'POS-GUARD'],
  planWeight: ['WEIGHT'],
  planLifestyle: ['SNORE-ALCOHOL', 'SNORE-LIFESTYLE', 'MILD-LIFESTYLE'],
  planMad: ['MAD', 'MAD-FAVORABLE', 'MAD-POOR', 'REM-MAD'],
  planInspire: ['HNS', 'INSPIRE-EVAL', 'INSPIRE-OPT'],
  planSurgery: ['SURG', 'SURGALT', 'SURG-PREF', 'TONSIL', 'SOFT-TISSUE-REVISION', 'SOFT-TISSUE-STRONG', 'SOFT-TISSUE-CONSIDER', 'SOFT-TISSUE-GENERAL', 'FRIEDMAN-III-ALT', 'COMBI-PRIOR'],
  planCbti: ['CBTI'],
  planStudy: ['SLEEP-STUDY', 'UARS-EVAL', 'NEG-HST-PSG'],
};

const PLAN_FIELD_LABELS = {
  planPap: 'PAP management',
  planNasal: 'nasal treatment',
  planPositional: 'positional therapy',
  planWeight: 'weight management',
  planLifestyle: 'lifestyle / snoring measures',
  planMad: 'oral appliance',
  planInspire: 'nerve stimulation',
  planSurgery: 'airway surgery',
  planCbti: 'CBT-I',
  planStudy: 'diagnostic testing',
};

function buildEncounterContext(f, patientState = {}) {
  const visitReason = f.get('visitReason') || '';
  const selectedPlanFields = Object.keys(PLAN_FIELD_TO_TAGS).filter(field => yes(f, field));
  return {
    visitReason,
    visitReasonLabel: VISIT_REASON_LABELS[visitReason] || 'Not documented',
    visitReasonNote: String(f.get('visitReasonNote') || '').trim(),
    planConfirmed: yes(f, 'planConfirmed'),
    planObserve: yes(f, 'planObserve'),
    planSummary: String(f.get('planSummary') || '').trim(),
    selectedPlanFields,
    cpapCurrent: Boolean(patientState.cpapCurrent),
    prefAvoidCpap: Boolean(patientState.prefAvoidCpap),
    prefSurgery: Boolean(patientState.prefSurgery),
    prefInspire: Boolean(patientState.prefInspire),
  };
}

function filterRecommendationsForEncounter(entries, encounter) {
  const source = Array.isArray(entries) ? entries : [];
  // Preserve legacy snapshots and the existing synthetic matrix. The live form
  // requires a visit reason, so real encounters always use the intent-aware path.
  if (!encounter.visitReason && !encounter.planConfirmed) return source;
  const alwaysKeep = new Set(['OXYGEN-URG', 'DHR-TX', 'DHR-CARDS', 'MILD-LIFESTYLE', 'SNORE-ALCOHOL']);
  const allowed = new Set(alwaysKeep);

  const addPlan = field => (PLAN_FIELD_TO_TAGS[field] || []).forEach(tag => allowed.add(tag));

  if (encounter.planConfirmed) {
    encounter.selectedPlanFields.forEach(addPlan);
  } else {
    // Before the clinician finalizes today's plan, show only first-line and low-risk
    // supporting pathways. Do not turn technical candidacy into an active MAD,
    // surgery, or nerve-stimulation plan without an explicit visit goal.
    ['planNasal', 'planPositional', 'planWeight', 'planLifestyle', 'planCbti', 'planStudy'].forEach(addPlan);
    if (encounter.cpapCurrent || ['new-diagnosis', 'transfer-pap', 'pap-troubleshoot', 'restart-pap', 'precision-onboarding'].includes(encounter.visitReason)) addPlan('planPap');
    if (encounter.visitReason === 'oral-appliance') addPlan('planMad');
    if (encounter.visitReason === 'inspire' || encounter.prefInspire) addPlan('planInspire');
    if (encounter.visitReason === 'surgery' || encounter.prefSurgery) addPlan('planSurgery');
    if (encounter.visitReason === 'non-pap' || encounter.prefAvoidCpap) {
      addPlan('planMad');
      addPlan('planSurgery');
    }
  }

  return source.filter(entry => allowed.has(entry.tag));
}

/* ── AHI severity label helper ────────────────────────────────── */
function ahiSeverity(ahi) {
  if (!exists(ahi) || ahi < T.severity.mild) return null;
  if (ahi >= T.severity.severe)   return 'Severe';
  if (ahi >= T.severity.moderate) return 'Moderate';
  return 'Mild';
}

function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildInsufficientDataAssessment(ctx) {
  if (!ctx || !ctx.osaConfirmed) return [];

  const domains = [];

  /* Gate data-completeness caveats so they don't crowd a mild patient's plan:
     risk/endotype workups only matter at moderate-severe (AHI ≥15); the anatomy
     workup only when a surgical/anatomy therapy is actually being recommended. */
  const moderateSevere = exists(ctx.ahi) && ctx.ahi >= T.severity.moderate;
  /* Anatomy workup is relevant when surgery/HNS is actually on the table — a
     surgical rec was generated OR the patient is pursuing surgery/Inspire. */
  const surgRecommended = (!ctx.planConfirmed && (ctx.prefSurgery || ctx.prefInspire)) || (Array.isArray(ctx.recTags) && ctx.recTags.some(r =>
    ['SURG','SURGALT','SURG-PREF','TONSIL','FRIEDMAN-III-ALT','SOFT-TISSUE-REVISION','SOFT-TISSUE-STRONG','SOFT-TISSUE-CONSIDER','SOFT-TISSUE-GENERAL','HNS','INSPIRE-EVAL'].includes(r.tag)));

  if (!ctx.oxygenCompositeSufficient && moderateSevere) {
    const metricCount = ctx.oxygenMetricCount || 0;
    const hasPartialOxygenData = metricCount > 0;
    domains.push({
      key: 'oxygen',
      clinician: hasPartialOxygenData
        ? `Only ${metricCount} oxygen metric${metricCount === 1 ? '' : 's'} entered. Review available ODI, T90, nadir, area below 90%, and event-linked hypoxic burden as distinct measures before characterizing the oxygen profile.`
        : 'No overnight oxygen metrics entered. Oxygen-related severity and possible non-OSA hypoxemia cannot be assessed from the current record.',
      patient: hasPartialOxygenData
        ? 'Only part of your overnight oxygen information is available so far. Your care team should review the complete study before describing how strongly breathing interruptions affected oxygen levels.'
        : 'We still need the overnight oxygen information from your sleep study to understand how breathing interruptions affected oxygen levels.',
    });
  }

  if ((!exists(ctx.sup) || !exists(ctx.nons)) && moderateSevere) {
    const positionalMissing = [];
    if (!exists(ctx.sup)) positionalMissing.push('supine AHI');
    if (!exists(ctx.nons)) positionalMissing.push('non-supine AHI');
    domains.push({
      key: 'position',
      clinician: `Positional tracking is incomplete (${positionalMissing.join(', ')} missing). Do not treat the absence of a positional phenotype as evidence that side-sleeping will not matter.`,
      patient: 'Your sleep study did not clearly compare back-sleeping with side-sleeping, so we cannot yet tell how much body position changes your sleep apnea.',
    });
  }

  if ((!exists(ctx.remAhi) || !exists(ctx.nremAhi)) && moderateSevere) {
    const sleepStageMissing = [];
    if (!exists(ctx.remAhi)) sleepStageMissing.push('REM AHI');
    if (!exists(ctx.nremAhi)) sleepStageMissing.push('NREM AHI');
    domains.push({
      key: 'sleep-stage',
      clinician: `REM/NREM staging data are incomplete (${sleepStageMissing.join(', ')} missing). REM-predominant OSA and REM-specific treatment needs cannot be assessed reliably.`,
      patient: 'Your available sleep-study data did not clearly separate dream sleep from non-dream sleep, so we cannot yet tell whether your breathing is especially worse during REM sleep.',
    });
  }

  const detailedEventBreakdownExpected = ctx.studyType === 'psg' || ctx.studyType === 'both';
  if (!exists(ctx.fHypopneas) && moderateSevere && detailedEventBreakdownExpected) {
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
  if (anatomyMissing.length >= 2 && surgRecommended) {
    domains.push({
      key: 'anatomy',
      clinician: `Upper-airway anatomy is incompletely documented (${anatomyMissing.join(', ')} missing). Anatomy-driven phenotypes and surgery/MAD matching should be deferred until the exam is completed.`,
      patient: 'Some parts of your throat exam are still missing, so anatomy-based treatment options should stay provisional until your airway exam is completed.',
    });
  } else if (anatomyMissing.length === 1 && surgRecommended) {
    domains.push({
      key: 'anatomy-partial',
      clinician: `Upper-airway anatomy documentation is still missing ${anatomyMissing[0]}. Do not treat the absence of an anatomy-driven phenotype as exclusion until the airway exam is completed.`,
      patient: 'One part of your throat exam is still missing, so anatomy-based treatment matching may still be refined after the rest of your airway exam is documented.',
    });
  }

  const hasNasalAssessment =
    exists(ctx.noseScore) ||
    Boolean(ctx.nasalObs) ||
    Boolean(ctx.ctSeptum) ||
    Boolean(ctx.ctTurbs);
  if (!hasNasalAssessment && moderateSevere) {
    domains.push({
      key: 'nasal',
      clinician: 'Nasal symptom/exam data are absent (NOSE score, nasal-obstruction history, or nasal anatomy findings). Do not treat the absence of a nasal-resistance phenotype as exclusion.',
      patient: 'We do not yet have a full nasal symptom or exam assessment entered, so we cannot yet tell how much your nose may be contributing to sleep-related breathing problems or treatment tolerance.',
    });
  }

  if ((OSA_CONFIG.features && OSA_CONFIG.features.deltaHeartRate) && ctx.cvd && !exists(ctx.dhr)) {
    domains.push({
      key: 'delta-heart-rate',
      clinician: 'Manual delta heart rate has not been entered. If cardiovascular-stress phenotyping matters for this patient, do not treat the absence of elevated delta heart rate as exclusion.',
      patient: 'We have not yet entered the extra overnight heart-rate reactivity measure we sometimes use to estimate cardiovascular stress from sleep apnea, so that part of your risk picture may still be refined.',
    });
  }

  const hnsReferenced = (!ctx.planConfirmed && ctx.prefInspire) || (Array.isArray(ctx.recTags) && ctx.recTags.some(rec => ['HNS', 'INSPIRE-EVAL', 'INSPIRE-OPT'].includes(rec.tag)));
  const hnsOutsideReferralGuardrail = exists(ctx.bmi) && ctx.bmi > T.hgns.bmiMax;
  // An already implanted patient needs device optimization and objective
  // on-therapy assessment, not a new-implant candidacy workup. DISE is only
  // reintroduced if the clinician later pursues revision or a different device.
  if (hnsReferenced && !ctx.priorInspire && !hnsOutsideReferralGuardrail && (!ctx.hasDISEData || ctx.hnsStage?.insufficient)) {
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
  } else if (madReferenced && ctx.priorMAD && ctx.madTolerated === 'no' && Array.isArray(ctx.madProblems) && ctx.madProblems.length) {
    const problemLabels = {
      madProblemTmj: 'TMJ pain',
      madProblemTeeth: 'tooth or dental problems',
      madProblemBite: 'bite changes',
      madProblemDiscomfort: 'general discomfort or poor fit',
    };
    const barriers = ctx.madProblems.map(problem => problemLabels[problem] || problem);
    alerts.push({
      key: 'mad-prior-barrier',
      clinician: `A prior oral appliance was not tolerated because of ${barriers.join(', ')}. Do not repeat the same pathway without sleep-dentist review and a plan to address the specific barrier.`,
      patient: `Your previous oral appliance caused ${barriers.join(', ')}. Your care team should address that specific problem before asking you to try a similar appliance again.`,
    });
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

  // DISE remains the planning prerequisite before final site-directed airway surgery selection —
  // EXCEPT a clear tonsillar case (Friedman Stage I, 3-4+ tonsils, non-obese): the obstruction site
  // is obvious, so tonsillectomy +/- expansion pharyngoplasty proceeds without DISE. Obesity keeps
  // the DISE prerequisite (higher multilevel-collapse risk). (Clinical review 2026-06.)
  const surgeryReferenced = (!ctx.planConfirmed && ctx.prefSurgery) || [
    'SURG',
    'SURGALT',
    'SURG-PREF',
    'SOFT-TISSUE-REVISION',
    'SOFT-TISSUE-STRONG',
    'SOFT-TISSUE-CONSIDER',
    'SOFT-TISSUE-GENERAL',
    'FRIEDMAN-III-ALT',
  ].some(tag => tags.has(tag));
  const clearTonsillarSurgery = ctx.friedmanStage === 'I' && exists(ctx.tons) && ctx.tons >= T.anatomical.tonsils && exists(ctx.bmi) && ctx.bmi < T.anatomical.bmi;
  if (surgeryReferenced && !ctx.hasDISEData && !clearTonsillarSurgery) {
    const priorSurgeryDidNotHelp = ctx.priorUPPP && ctx.priorUPPPHelped === 'no';
    const priorSurgeryHelped = ctx.priorUPPP && ctx.priorUPPPHelped === 'yes';
    alerts.push({
      key: 'surgery-workup',
      clinician: priorSurgeryDidNotHelp
        ? 'Prior throat surgery did not clearly improve sleep or snoring. Before selecting revision surgery or a different airway target, review the operative report and current anatomy and complete DISE-guided collapse mapping. Avoid assuming that revision alone will improve OSA.'
        : priorSurgeryHelped
          ? 'Prior throat surgery helped, but symptoms or OSA may have recurred. Review the operative report and current anatomy and complete DISE-guided collapse mapping before selecting revision surgery or a different airway target.'
        : 'Before finalizing site-directed airway surgery, complete DISE to map the collapse pattern and target levels.',
      patient: priorSurgeryDidNotHelp
        ? 'Because prior throat surgery did not clearly help, your care team should review what was done and reassess your current airway before choosing another procedure. A sleep endoscopy (DISE) may be needed to map where the airway now collapses.'
        : priorSurgeryHelped
          ? 'Because prior throat surgery helped before symptoms or sleep apnea returned, your care team should review what was done and reassess your current airway before choosing another procedure. A sleep endoscopy (DISE) may be needed to map where the airway now collapses.'
        : 'If surgery is being considered, a sleep endoscopy (DISE) may still be needed to show exactly where your airway collapses before choosing the procedure.',
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
      text: 'Review the full sleep-study oxygen profile. Keep ODI, T90, nadir, area below 90%, and event-linked hypoxic burden separate rather than combining them into one category.',
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
      text: 'Complete the device-specific HGNS workup, including any required DISE and staging inputs, before finalizing candidacy or expected response.',
      tag: 'HNS-WORKUP',
    });
  }

  if (domainKeys.has('nasal')) {
    prependedEntries.push({
      text: 'Complete a nasal symptom and airway review before ruling nasal treatment in or out or assuming it will not affect treatment tolerance.',
      tag: 'NASAL-WORKUP',
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

    const surgeryAlert = safetyAlerts.find(alert => alert?.key === 'surgery-workup');
    prependedEntries.push({
      text: surgeryAlert?.clinician || 'Complete DISE-guided surgical planning before finalizing a specific airway procedure target.',
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

/* ── HGNS (Inspire / Genio) Candidacy Assessment ─────────────── */
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
    ahi, bmi, sex, sup, nons, cpapFailed, prefAvoidCpap, priorInspire, hgnsHelped, hgnsImplantYear,
    vDeg, vPat, oDeg, oPat, tDeg, tPat,
    pahic3, pahic4, csr, cai, cpapPressure,
    phenotypes, hasDISEData
  } = ctx;

  // ── Prior Inspire shortcut ──
  if (priorInspire) {
    result.priorInspire = true;
    const implantTiming = hgnsImplantYear ? `, implanted approximately ${hgnsImplantYear}` : '';
    result.assessment = 'Existing HGNS device: assess and optimize';
    result.assessmentDetail = hgnsHelped === 'yes'
      ? `Patient reports benefit from the existing hypoglossal nerve stimulator${implantTiming}. Verify current settings, nightly use, and objective on-therapy efficacy.`
      : hgnsHelped === 'no'
        ? `Patient reports no clear benefit from the existing hypoglossal nerve stimulator${implantTiming}. Confirm activation and nightly use, interrogate and optimize settings, and obtain on-therapy testing before abandoning the device pathway.`
        : `Benefit from the existing hypoglossal nerve stimulator${implantTiming} is uncertain. Confirm activation, nightly use, settings, and objective on-therapy efficacy.`;
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
    result.eligibilityIssues.push(`BMI ${bmi} exceeds Capital ENT's current HGNS referral guardrail of ${H.bmiMax}. Device labeling, evidence limits, and payer criteria differ; reassess after weight reduction or specialist review rather than describing this as a universal device contraindication.`);
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

  // CCC at the velum is device-specific. It contraindicates unilateral Inspire.
  // Current US Genio labeling says safety/effectiveness in CCC is not established,
  // so the app must not auto-route a CCC patient to Genio. FDA P130008/S090;
  // FDA Genio P240024 patient labeling and SSED (2025).
  const hasCCC = (vDeg === '2' && vPat === 'Concentric');
  if (hasCCC) {
    result.unfavorable.push({ factor: 'Complete concentric collapse (velum)', detail: 'Velar CCC on DISE contraindicates unilateral Inspire. Do not automatically substitute Genio: current US Genio labeling states that safety and effectiveness in CCC have not been established. Review current device-specific labeling and other anatomical treatment options.', cite: 'FDA Inspire P130008/S090; FDA Genio P240024 (2025)' });
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
      result.favorable.push({ factor: 'BMI within original trial range', detail: `BMI ${bmi} is within the original STAR trial criterion. Lower BMI is associated with better average outcomes, but it does not predict individual success.`, cite: 'Strollo 2014; ADHERE registry' });
    } else if (bmi <= H.bmiIdeal) {
      result.favorable.push({ factor: 'BMI within registry range', detail: `BMI ${bmi} is within a commonly studied real-world range. Higher BMI is associated with lower average response, without a validated individual-response cutoff.`, cite: 'Heiser 2019 ADHERE' });
    } else if (bmi <= H.bmiMax) {
      result.unfavorable.push({ factor: 'BMI 35–40', detail: `BMI ${bmi} is above the range with the strongest response data. Higher BMI lowers expected response and payer criteria may be stricter. Inspire labeling extends through BMI 40; current US Genio labeling says safety and effectiveness above BMI 32 have not been established.`, cite: 'FDA Inspire P130008/S090; FDA Genio P240024 (2025)' });
    }
  }

  if (exists(ahi)) {
    if (ahi >= 20 && ahi <= 50) {
      result.favorable.push({ factor: 'AHI within original trial range', detail: `AHI ${ahi} is within the original STAR trial range of 20–50. This describes the evidence base, not an optimal-response category. FDA approval now covers AHI 15–100.`, cite: 'Strollo 2014 STAR; FDA P130008/S090' });
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
      result.favorable.push({ factor: 'Female sex association', detail: 'Female sex was associated with better average outcomes in registry data, but it is not a validated individual predictor and should not determine candidacy.', cite: 'ADHERE registry' });
  }

  // DISE factors
  if (hasDISEData) {
    if (!hasCCC) {
      result.favorable.push({ factor: 'No velar CCC documented', detail: 'Absence of complete concentric collapse satisfies an Inspire-specific anatomic requirement. It does not by itself predict success.', cite: 'FDA Inspire labeling' });
    }

    // Tongue base AP complete collapse — positive predictor
    if (tDeg === '2' && tPat === 'AP') {
      result.favorable.push({ factor: 'Complete tongue base AP collapse', detail: 'Complete anteroposterior tongue base collapse on DISE is a positive predictor — this is the exact obstruction pattern that HGNS-driven tongue protrusion is designed to resolve.', cite: 'Huyett 2021 multicenter DISE study' });
    } else if (tDeg === '1' && tPat === 'AP') {
      result.favorable.push({ factor: 'Partial tongue base AP collapse', detail: 'Anteroposterior tongue base collapse, even partial, is a favorable pattern for HGNS.', cite: 'Huyett 2021' });
    }

    // Oropharyngeal lateral wall collapse — negative
    if (oPat === 'Lateral' && oDeg === '2') {
      result.unfavorable.push({ factor: 'Complete lateral oropharyngeal-wall collapse', detail: 'Complete lateral-wall collapse on DISE is associated with meaningfully lower unilateral HGNS efficacy. It is a response-context factor, not a universal contraindication.', cite: 'Vena 2025 ERJ prospective cohort' });
    } else if (oPat === 'Lateral' && oDeg === '1') {
      result.favorable.push({ factor: 'Partial lateral-wall collapse', detail: 'The strongest prospective adverse evidence applies to complete lateral-wall collapse. Partial collapse should be documented but not relabeled as the same validated negative predictor.', cite: 'Vena 2025 ERJ' });
    }

    // Oropharyngeal concentric collapse — negative
    if (oPat === 'Concentric' && oDeg === '2') {
      result.unfavorable.push({ factor: 'Complete oropharyngeal concentric collapse', detail: 'Complete concentric collapse at the oropharynx is a negative predictor of HGNS success, similar in mechanism to palatal CCC.', cite: 'Grillet 2024 systematic review' });
    }
  } else {
    // No DISE data entered
    result.unfavorable.push({ factor: 'Device-specific airway evaluation incomplete', detail: 'Drug-induced sleep endoscopy is required for some HGNS devices and remains useful for defining collapse anatomy and expected response. Confirm the current device-specific evaluation requirements before final candidacy is assigned.', cite: 'FDA device-specific labeling; Vanderveken 2017' });
  }

  // Therapeutic CPAP pressure
  if (exists(cpapPressure)) {
    if (cpapPressure < H.papLow) {
      result.favorable.push({ factor: 'Lower therapeutic PAP pressure', detail: `Therapeutic PAP of ${cpapPressure} cmH₂O is directionally associated with less collapsible anatomy in observational data. This is not a validated response threshold.`, cite: 'Lee 2019 JCSM' });
    } else if (cpapPressure >= H.papHigh) {
      result.unfavorable.push({ factor: 'High therapeutic pressure', detail: `Therapeutic PAP of ${cpapPressure} cmH₂O suggests more severe or anatomically fixed collapsibility. Higher pressures correlate with lower HGNS response rates.`, cite: 'Lee 2019 JCSM' });
    }
  }

  // Supine-predominant OSA — always comment when positional data is available
  if (exists(sup) && exists(nons)) {
    if (nons > 0) {
      const supRatio = sup / nons;
      if (supRatio >= H.supNonSupRatio && nons < 10) {
        result.unfavorable.push({ factor: 'Supine-predominant OSA', detail: `Supine/non-supine ratio is ${supRatio.toFixed(1)}x. Observational data associate supine predominance with lower HGNS response, but no validated individual threshold is available.`, cite: 'ADHERE adjusted analysis' });
      } else {
        result.favorable.push({ factor: 'No supine predominance', detail: `Supine/non-supine AHI ratio is ${supRatio.toFixed(1)}x (supine ${sup}, non-supine ${nons}). This avoids one observationally adverse pattern but does not predict success.`, cite: 'ADHERE adjusted analysis' });
      }
    } else if (nons === 0 && sup > 0) {
      result.unfavorable.push({ factor: 'Exclusively supine OSA', detail: 'All recorded obstructive events occurred supine. Consider whether positional therapy and positional sampling affect the need for an implant; this pattern does not independently predict an individual HGNS result.', cite: 'ADHERE adjusted analysis' });
    }
  }

  // PSG-derived endotypes remain research context only. The app's WatchPAT and
  // clinical surrogates are not interchangeable with the measured traits used
  // in the STAR secondary analysis, so they must not score HGNS response.

  // ── Overall assessment ──
  if (result.assessment === '') {
    // Only set if not already set by hard-stop criteria
    const dise_missing = !hasDISEData;

    if (dise_missing && eligible) {
      result.assessment = 'Basic referral criteria appear met; device-specific workup incomplete';
      result.assessmentDetail = 'Confirm the current device-specific airway-evaluation requirements before final eligibility is determined. Response associations shown below are contextual and must not be counted into a success score.';
    } else if (eligible) {
      result.assessment = 'Basic referral criteria appear met; individual response remains uncertain';
      result.assessmentDetail = 'Current evidence does not support an externally validated multivariable response score. Review device-specific eligibility, complete lateral-wall collapse, other anatomy, patient goals, and alternatives without converting the number of listed factors into a probability.';
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
        <div class="card-header"><i class="bi bi-cpu"></i> HGNS (Inspire / Genio) Assessment</div>
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
        <div class="card-header"><i class="bi bi-cpu"></i> HGNS (Inspire / Genio) Candidacy Assessment</div>
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
    'Not a candidate':                  'bg-danger',
    'Basic referral criteria appear met; device-specific workup incomplete': 'bg-info text-dark',
    'Basic referral criteria appear met; individual response remains uncertain': 'bg-info text-dark'
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
    eligHTML = `<p class="text-success"><i class="bi bi-check-circle-fill"></i> <strong>Basic referral criteria appear met</strong> (AHI range, local BMI guardrail, PAP intolerance). Confirm device-specific labeling, central-event burden, airway requirements, and payer criteria.</p>`;
  }

  // Favorable factors
  let favHTML = '';
  if (hgns.favorable.length > 0) {
    favHTML = `
      <h6 class="mt-2 text-primary"><i class="bi bi-info-circle"></i> Supportive or descriptive context</h6>
      <table class="table table-sm">
        <tbody>${hgns.favorable.map(f => `<tr><td style="width:200px;"><strong>${f.factor}</strong></td><td>${f.detail} <span class="text-muted small">[${f.cite}]</span></td></tr>`).join('')}</tbody>
      </table>`;
  }

  // Unfavorable factors
  let unfavHTML = '';
  if (hgns.unfavorable.length > 0) {
    unfavHTML = `
      <h6 class="mt-2 text-warning"><i class="bi bi-exclamation-triangle"></i> Cautionary response context</h6>
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
      <div class="card-header"><i class="bi bi-cpu"></i> HGNS (Inspire / Genio) Candidacy Assessment</div>
      <div class="card-body">
        ${eligHTML}
        <div class="alert alert-light border py-2"><strong>Interpretation boundary:</strong> No guideline-endorsed or externally validated multivariable HGNS response score is available. Do not count the contextual factors below into a probability. Complete lateral oropharyngeal-wall collapse on DISE is associated with lower unilateral HGNS efficacy. Airflow-shape prediction requires raw, unfiltered nasal-pressure data and a validated algorithm; it must not be inferred from a standard WatchPAT report.</div>
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

/* ── Phenotype detection — pure function extracted from the submit handler.
   `m` is a metrics object of already-parsed/computed inputs; `T` is the
   thresholds. Returns { phen: [tags], why: {tag: [reason strings]} } with no
   DOM access or shared state. Behavior verified byte-identical against
   tests/phenotype-matrix.html (all 9 phenotypes + reason strings). ── */
function detectPhenotypes(m, T){
  const phen = [];
  const why = {};
  const add = (tag, reason) => {
    if(!phen.includes(tag)){ phen.push(tag); why[tag] = reason.filter(Boolean); }
  };

  const anatFlags = [
    m.bmi >= T.anatomical.bmi,
    m.neck >= m.neckThreshold,
    m.tons >= T.anatomical.tonsils,
    T.anatomical.ftp.includes(m.mall),
    m.ahi >= T.anatomical.ahiSevere
  ].filter(Boolean).length;

  if(anatFlags >= T.anatomical.minCriteria){
    add('High Anatomical Contribution',[
      exists(m.bmi)?`BMI ${m.bmi}`:'',
      exists(m.neck)?`Neck ${m.neck} in`:'',
      exists(m.tons)?`Tonsils ${m.tons}`:'',
      m.mall?`FTP ${m.mall}`:'',
      exists(m.ahi)?`AHI ${m.ahi}`:''
    ]);
  }

  if(m.edwardsArTH && m.edwardsArTH.score >= T.arousal.scoreLikely){
    add('Low Arousal Threshold',[
      `Edwards ${m.edwardsArTH.score}/${m.edwardsArTH.maxScore}`,
      ...m.edwardsArTH.details,
      m.edwardsArTH.partial ? 'Hypopnea fraction unavailable' : ''
    ]);
  }

  /* Qualitative loop-gain flag: ≥2 central / periodic-breathing signals suggest possible
     ventilatory instability (no numeric estimate; see config.js loopGain note). */
  const highLoopGainDetected = m.loopGainSupportCount >= T.loopGain.supportMin;
  const remStageRatio = ratio(m.remAhi, m.nremAhi);
  const supNonSupRatio = ratio(m.sup, m.nons);
  if(highLoopGainDetected){
    add('High Loop Gain',[
      m.csr?`CSR ${m.csr}%`:'',
      exists(m.pahic3)?`pAHIc 3% ${m.pahic3}/h`:'',
      exists(m.pahic4)?`pAHIc 4% ${m.pahic4}/h`:'',
      exists(m.cai)?`CAI ${m.cai}/h`:'',
      m.cvd?'CVD present (confidence modifier only)':''
    ]);
  }

  if( m.ahi >= T.muscleResponse.ahiMin &&
      exists(remStageRatio) &&
      exists(m.nremAhi) &&
      m.nremAhi >= T.muscleResponse.nremFloor &&
      remStageRatio > T.muscleResponse.remNremRatio ){
    add('Poor Muscle Responsiveness',[`REM/NREM ${formatRatio(remStageRatio)}`, `NREM AHI ${m.nremAhi}`, `AHI ${m.ahi}`, 'inferred surrogate (not a measured trait)']);
  }

  const positionalPattern = OSAReportShared.classifyPositionalPattern({
    supineAhi: m.sup,
    nonSupineAhi: m.nons,
    ratioThreshold: T.positional.supNonSupRatio,
  });
  if(positionalPattern.positional){
    add('Positional OSA',[
      `Sup/Non-sup ${formatRatio(positionalPattern.ratio)}`,
      `Non-sup AHI ${m.nons}`,
      positionalPattern.type === 'supine-isolated' ? 'Supine-isolated pattern' : 'Supine-predominant pattern',
    ]);
  }

  if( exists(remStageRatio) && exists(m.nremAhi) && remStageRatio > T.remPredominant.remNremRatio && m.nremAhi < T.remPredominant.nremMax ){
    add('REM-Predominant OSA',[`REM/NREM ${formatRatio(remStageRatio)}`, `NREM AHI ${m.nremAhi}`]);
  }

  /* True event-linked HB only. ODI, T90, nadir SpO2, and area below 90%
     remain separate conventional oxygen metrics and cannot create this
     phenotype (Azarbarzin 2019; ATS workshop 2024). */
  const hbTrigger = exists(m.hbPH) && m.hbPH >= T.hypoxicBurden.signalBoundary;
  if(hbTrigger){
    add('High Hypoxic Burden',[
      exists(m.hbPH)?`HB/hr ${m.hbPH}`:'',
      'Research-context signal; no validated clinical category'
    ]);
  }

  if( (m.noseScore && m.noseScore >= T.nasal.noseMild) || m.nasalObs || m.ctSeptum || m.ctTurbs ){
    add('Nasal-Resistance Contributor',[
      m.noseScore ? `NOSE score ${m.noseScore}/100` : '',
      m.nasalObs ? 'Patient-reported nasal obstruction' : '',
      m.ctSeptum ? 'Exam: deviated septum' : '',
      m.ctTurbs ? 'Exam: turbinate hypertrophy' : ''
    ]);
  }

  // Delta Heart Rate (Phase 4 field — only triggers if the input exists)
  if( m.dhr && m.dhr >= T.deltaHeartRate.dhr ){
    add('Elevated Delta Heart Rate',[
      `ΔHR ${m.dhr} bpm`,
      m.cvd ? 'CVD present' : ''
    ]);
  }

  return { phen, why };
}

/* ── Home sleep test (WatchPAT) validity flags — pure function extracted from
   the submit handler. `m` is the study metrics; `T` the thresholds. Returns the
   flag array (the caller renders it). Verified byte-identical via the clinician
   HTML diff in tests/phenotype-matrix.html. ── */
function buildHstFlags(m, T){
  const HST = T.hstValidity;
  const flags = [];
  if (m.studyType === 'psg') return flags;
  const signals = OSAReportShared.assessEncounterSignals({
    studyType: m.studyType || 'watchpat', ahi: m.ahi, rdi: m.patRdi, ess: m.ess,
    isi: m.isi, visitReason: m.visitReason,
    tst: m.tst, remPercent: m.remPercent, centralIndex: m.pahic3,
    csr: m.csr, hbPerHour: m.hbPH, hbAreaUnder90: m.hb90PH,
    odi: m.odi, t90: m.t90, nadir: m.nadir,
    heartFailure: m.heartFailure,
    strokeHistory: m.strokeHistory,
    chronicOpioidUse: m.chronicOpioidUse,
    neuromuscularRespiratoryRisk: m.neuromuscularRespiratoryRisk,
    hypoventilationRisk: m.hypoventilationRisk,
    severeInsomniaCompromisesHst: m.severeInsomniaCompromisesHst,
  }, T);

  // 1. Total sleep time assessment
  if (exists(m.tst)) {
    if (signals.inadequateRecording) {
      flags.push({ severity: 'danger', flag: 'Inadequate recording time', detail: `TST ${m.tst} hrs is critically short (<2 hrs). Treat this home study as nondiagnostic and <strong>obtain in-lab PSG before finalizing the diagnosis or treatment plan.</strong>` });
    } else if (signals.shortRecording) {
      flags.push({ severity: 'warning', flag: 'Short recording time', detail: `TST ${m.tst} hrs is below the 4-hour minimum recommended for reliable HST interpretation. This home study should be treated as nondiagnostic; in-lab PSG is recommended before the diagnosis or treatment plan is finalized.` });
    }
  }

  // REM-specific comparisons are unstable when too little REM sleep was
  // observed. Keep the raw stage indices visible to the clinician, but flag
  // that REM phenotype and REM-specific treatment conclusions were suppressed.
  if (signals.limitedRemSampling) {
    const percentText = exists(m.remPercent) ? `${m.remPercent}%` : 'a small percentage';
    flags.push({
      severity: 'warning',
      flag: 'Limited REM sampling',
      detail: `REM sleep was ${percentText} of total sleep (approximately ${Math.round(m.remMinutes)} minutes). This is below the 30 minutes commonly required for a confident REM-versus-NREM comparison. REM-specific phenotype and treatment conclusions were suppressed.`,
    });
  }

  // WatchPAT is clinically useful, but simultaneous-comparison studies show
  // poor agreement with PSG for mild and moderate severity categories. Keep
  // this clinician-only so a technically adequate study is not described to
  // the patient as "bad" or automatically routed to PSG.
  if (signals.watchpatSeverityUncertain) {
    const category = m.ahi < T.severity.moderate ? 'mild' : 'moderate';
    flags.push({
      severity: 'info',
      flag: 'WatchPAT severity-category uncertainty',
      detail: `pAHI ${m.ahi} is in the ${category} range. WatchPAT and in-lab PSG show poor agreement for mild and moderate severity categories. Interpret this as an estimated category alongside symptoms, oxygen data, anatomy, and treatment goals. Consider PSG when a different severity category would materially change diagnosis, treatment eligibility, or risk assessment.`,
      tooltip: 'In a 17-study meta-analysis of 1,318 simultaneous recordings, severity agreement was weakest for mild and moderate OSA (Cohen kappa 0.29 and 0.25). At AHI 5, pooled sensitivity was high but specificity was only 43%. This supports contextual interpretation and selective confirmation, not automatic rejection of every WatchPAT result.',
    });
  }

  if (signals.psgPreferredComorbidity) {
    const conditions = signals.psgPreferredReasons.join(', ');
    flags.push({
      severity: 'warning',
      flag: 'PSG preferred for diagnostic testing',
      detail: `The chart documents: ${conditions}. AASM guidance recommends in-lab PSG rather than HSAT for initial OSA diagnosis in this setting. Review whether this home result is sufficient for the current decision or needs laboratory confirmation.`,
      tooltip: 'The AASM diagnostic-testing guideline recommends PSG rather than HSAT for significant cardiorespiratory disease, possible respiratory muscle weakness, awake or suspected sleep-related hypoventilation, chronic opioid use, history of stroke, and severe insomnia. This flag does not automatically invalidate prior treatment response when the current decision does not depend on diagnostic reclassification.',
    });
  }

  // 2. AHI–RDI discrepancy (may indicate signal artifact or scoring issues)
  if (exists(m.ahi) && exists(m.patRdi) && m.patRdi > 0) {
    const ahiRdiRatio = m.ahi / m.patRdi;
    if (ahiRdiRatio < HST.ahiRdiRatioLow) {
      flags.push({ severity: 'warning', flag: 'Large AHI–RDI discrepancy', detail: `pAHI (${m.ahi}) is less than half the PAT RDI (${m.patRdi}). A large gap may indicate significant RERAs (respiratory effort-related arousals) or signal quality issues. Consider in-lab PSG if clinical picture is inconsistent.` });
    }
  }

  // 3. Missing REM data
  if (exists(m.ahi) && !exists(m.remAhi)) {
    flags.push({ severity: 'info', flag: 'Incomplete REM staging data', detail: 'REM AHI is not available. REM-predominant OSA cannot be assessed reliably until REM versus non-REM breathing is fully reported. Consider in-lab PSG if REM-related symptoms (vivid dreams, morning headaches) are present.' });
  } else if (exists(m.ahi) && !exists(m.nremAhi)) {
    flags.push({ severity: 'info', flag: 'Incomplete REM staging data', detail: 'NREM AHI is not available. REM-predominant OSA cannot be assessed reliably until REM versus non-REM breathing is fully reported.' });
  } else if (exists(m.tst) && exists(m.remAhi) && exists(m.nremAhi) && m.tst < HST.tstRemCapture && m.remAhi === 0) {
    flags.push({ severity: 'warning', flag: 'No REM sleep captured', detail: `REM AHI is 0 with TST of only ${m.tst} hrs. REM sleep may not have occurred during this short recording. AHI may underestimate true severity if OSA is REM-predominant. Consider repeat study.` });
  }

  // 4. Low AHI despite high symptom burden — possible false negative
  if (signals.negativeHstNeedsPsg) {
    const symptomContext = exists(m.ess) && m.ess >= HST.essSignificant
      ? `ESS ${m.ess} indicates ongoing sleepiness`
      : 'the symptom-focused visit indicates ongoing fatigue, unrefreshing sleep, or other clinical concern';
    flags.push({
      severity: 'warning',
      flag: 'Negative home sleep test with persistent symptoms',
      detail: `AHI ${m.ahi} is in the normal range, but ${symptomContext}. A home study can miss milder or different sleep-disordered breathing. If clinical suspicion remains after the full evaluation, AASM guidance supports in-lab PSG; the clinician should decide whether to test now or reassess after treating another plausible contributor.`,
      tooltip: 'AASM recommends in-lab polysomnography after a negative, inconclusive, or technically inadequate home sleep apnea test when OSA remains suspected; simply repeating another home test is generally not recommended. Most home tests cannot score EEG arousals or respiratory effort-related arousals. Treating another plausible contributor first is an individualized sequencing decision, not a proven substitute for PSG.',
    });
  }

  // 5. High central apnea component — confirm with lab PSG
  if (exists(m.pahic3) && exists(m.ahi) && m.ahi > 0) {
    const centralPct = (m.pahic3 / m.ahi) * 100;
    if (centralPct > HST.centralPctDanger) {
      flags.push({ severity: 'danger', flag: 'Predominantly central apnea', detail: `Central apnea index is ${centralPct.toFixed(0)}% of total AHI. WatchPAT central-event classification has limited validation. <strong>Obtain in-lab PSG with respiratory-effort and sleep-stage channels</strong> to characterize central versus obstructive events before central-apnea-directed treatment planning.` });
    } else if (centralPct > HST.centralPctWarning) {
      flags.push({ severity: 'warning', flag: 'Significant central apnea component', detail: `Central apnea index is ${centralPct.toFixed(0)}% of total AHI. WatchPAT estimates central events using peripheral arterial tone plus respiratory-movement signals when the chest sensor is available. In-lab PSG should confirm the pattern if it would change treatment, such as ASV versus CPAP.` });
    }
  }

  // 6. High CSR without high central AHI — possible scoring artifact
  if (exists(m.csr) && m.csr > HST.csrElevated && exists(m.pahic3) && exists(m.ahi) && m.ahi > 0 && (m.pahic3/m.ahi)*100 < HST.centralPctLow) {
    flags.push({ severity: 'info', flag: 'Elevated CSR with low central AHI', detail: `CSR ${m.csr}% is elevated but central AHI is low relative to total. This pattern may indicate Cheyne-Stokes respiration during wakefulness or signal artifact. Correlate with clinical history (heart failure, stroke).` });
  }

  // 7. Missing positional data limits phenotyping
  if (!exists(m.sup) || !exists(m.nons)) {
    const positionalMissing = [];
    if (!exists(m.sup)) positionalMissing.push('supine AHI');
    if (!exists(m.nons)) positionalMissing.push('non-supine AHI');
    flags.push({ severity: 'info', flag: 'Incomplete positional data', detail: `${positionalMissing.join(' and ')} ${positionalMissing.length === 1 ? 'is' : 'are'} not available. Positional OSA cannot be assessed reliably. If the patient reports position-dependent symptoms or snoring, consider repeat study with positional tracking.` });
  }

  return flags;
}

/* ── Treatment mapping — pure function extracted from the submit handler.
   Builds the ranked recommendation list with its OWN dedup state (no module
   globals) plus the derived staging/scoring values the renderer consumes.
   `f` is the FormData, `m` the metrics/flags bundle, `T` the thresholds.
   Verified byte-identical via the clinician-HTML diff in
   tests/phenotype-matrix.html. ── */
function mapTreatments(f, m, T){
  const {
    phen, sex, bmi, neck, tons, mall, ahi, isi, ess, arInd, cvd, dhr, sup, nons,
    noseScore, nasalObs, ctSeptum, ctTurbs, retrognathia, fHypopneas, severeNocturnalHypoxemia,
    negativeHstNeedsPsg,
    priorCpap, cpapCurrent, cpapFailed, cpapRefused, cpapWillRetry, cpapReasons, cpapDifficulty, papMode,
    prefAvoidCpap, prefSurgery, prefInspire,
    priorUPPP, priorNasal, priorSinus, priorJaw, priorMAD, priorInspire, madHelped, madTolerated, madProblems,
    priorUPPPHelped, priorNasalHelped, priorSinusHelped, hgnsHelped, hgnsImplantYear,
    priorSleepStudyAnswer, priorSleepStudyYear, priorSleepStudyType,
  } = m;
  const out = { phen };
  const recs = [];
  const recTags = [];
  const seen = new Set();
  function pushRec(arr, text, tag){
    const key = (tag || text.trim().toLowerCase().slice(0,60));
    if(seen.has(key)) return;
    seen.add(key);
    arr.push(text);
    recTags.push({ text, tag: tag || key });
  }

  // Helper: build a CPAP-aware recommendation for anatomical contribution
  function cpapRec() {
    if (cpapCurrent) {
      const device = papMode === 'BiPAP' ? 'BiPAP' : papMode === 'APAP' ? 'APAP' : papMode === 'CPAP' ? 'CPAP' : 'PAP';
      if (cpapDifficulty === 'yes') {
        const issues = cpapReasons.map(r => CPAP_ISSUE_LABELS[r] || r).join(', ');
        pushRec(recs,`Continue current ${device} therapy and address reported difficulty${issues ? `: ${issues}` : ' with focused troubleshooting'}. Review adherence, leak, residual AHI, and comfort before changing treatment modality.`,'CPAP');
      } else if (cpapDifficulty === 'unsure') {
        pushRec(recs,`Continue current ${device} therapy while clarifying comfort, adherence, leak, and residual AHI from the compliance report.`,'CPAP');
      } else {
        pushRec(recs,`Continue current ${device} therapy; review objective efficacy and adherence at follow-up.`,'CPAP');
      }
    } else if (cpapFailed && cpapRefused) {
      pushRec(recs,'Prior CPAP trial unsuccessful — prioritize appropriate alternatives such as a mandibular-advancement device, site-directed surgery, or a device-specific nerve-stimulation evaluation when criteria are met.','CPAP-ALT');
    } else if (cpapWillRetry) {
      const issues = cpapReasons.map(r => {
        const map = CPAP_ISSUE_LABELS;
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
          pushRec(recs,'If CPAP fails or is not tolerated: consider a mandibular-advancement device, site-directed surgery, or device-specific nerve-stimulation evaluation when eligibility criteria are met.','SURGALT');
        }
        if(cpapFailed && cpapReasons.length) cpapComfortRecs();
        break;
      case 'Low Arousal Threshold':
        if(cpapCurrent || (!cpapFailed && !prefAvoidCpap)) {
          pushRec(recs,'Optimize CPAP comfort (humidification, auto-ramp, mask fit, desensitization).','CPAP-OPT');
        }
        if(exists(isi) && isi >= 15) {
          pushRec(recs,'Initiate CBT-I (cognitive behavioral therapy for insomnia) before or concurrent with PAP therapy. Untreated insomnia is the strongest predictor of CPAP non-adherence (Sweetman 2019). Consider a sleep psychology referral or a validated digital CBT-I program when appropriate and available.','CBTI');
        }
        break;
      case 'High Loop Gain':
        if(cpapCurrent || (!cpapFailed && !prefAvoidCpap)) {
          pushRec(recs,'Favor fixed-pressure CPAP initially; monitor for treatment-emergent central apneas.','CPAP-FIXED');
        }
        pushRec(recs,'If centrals persist: consider nocturnal oxygen, acetazolamide, or ASV (only if LVEF > 45%).','HLG-ADV');
        break;
      case 'Poor Muscle Responsiveness':
        if(cpapFailed && exists(ahi) && ahi >= T.hgns.ahiMin && ahi <= T.hgns.ahiMax && !(exists(bmi) && bmi > T.hgns.bmiMax)) {
          pushRec(recs,'A device-specific hypoglossal-nerve stimulation evaluation may be considered after documented PAP intolerance. Final candidacy depends on AHI, central-event burden, BMI, DISE pattern, current labeling, and payer criteria.','HNS');
        }
        break;
      case 'Positional OSA':
        {
          const positionalPattern = OSAReportShared.classifyPositionalPattern({
            supineAhi: sup,
            nonSupineAhi: nons,
            ratioThreshold: T.positional.supNonSupRatio,
          });
          if (positionalPattern.type === 'supine-isolated') {
            pushRec(recs,'Consider positional therapy. The non-supine AHI is below 5, so monotherapy may be possible only after confirming adequate non-supine sleep including REM and verifying control with follow-up testing.','POS');
          } else {
            pushRec(recs,`Use positional therapy as an adjunct. OSA persists off the back (non-supine AHI ${exists(nons) ? nons : 'not fully characterized'}), so position alone should not be assumed to control disease.`,'POS');
            pushRec(recs,'Positional therapy is adjunctive because clinically important OSA persists during non-supine sleep.','POS-GUARD');
          }
        }
        break;
      case 'REM-Predominant OSA':
        pushRec(recs,'Verify treatment efficacy during REM; pressure may need to be higher in REM.','REM-CHECK');
        pushRec(recs,'Oral appliance therapy is a reasonable alternative/adjunct in REM-predominant OSA.','REM-MAD');
        break;
      case 'High Hypoxic Burden':
        // Event-linked HB is retained as research context. Post hoc treatment
        // interactions do not justify automatic treatment allocation.
        break;
      case 'Nasal-Resistance Contributor':
        pushRec(recs,'Nasal optimization (saline rinse, intranasal steroid, ENT evaluation) can improve airflow and CPAP/MAD tolerance.','NASAL-OPT');
        if(ctSeptum || ctTurbs){
          pushRec(recs,'Nasal exam confirms structural obstruction. Consider septoplasty and/or turbinate reduction.','NASAL-SURG');
        }
        if(priorNasal) {
          const outcome = priorNasalHelped === 'yes'
            ? 'It previously helped, so assess for recurrent or residual obstruction.'
            : priorNasalHelped === 'no'
              ? 'The patient reports no sleep or snoring benefit, so reassess the current obstruction site and avoid assuming revision alone will improve OSA.'
              : 'Clarify the prior response and reassess for residual obstruction.';
          pushRec(recs,`Prior nasal surgery noted. ${outcome}`,'NASAL-PRIOR');
        }
        if(priorSinus) {
          const outcome = priorSinusHelped === 'yes'
            ? 'It previously helped, so evaluate for recurrent inflammation or obstruction.'
            : priorSinusHelped === 'no'
              ? 'The patient reports no sleep or snoring benefit, so separate persistent nasal symptoms from OSA treatment expectations.'
              : 'Clarify the prior response and evaluate for recurrent inflammation or obstruction.';
          pushRec(recs,`Prior sinus surgery noted. ${outcome}`,'NASAL-SINUS-PRIOR');
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

  if (exists(ahi) && ahi >= 5 && severeNocturnalHypoxemia) {
    pushRec(recs,'Substantial nocturnal hypoxemia warrants timely clinician review, effective treatment of confirmed OSA, evaluation for contributors not fully explained by OSA when appropriate, and objective confirmation of oxygen control.','OXYGEN-URG');
  }

  /* ─── FRIEDMAN STAGE (auto-calculated) ────────────────────── */
  /* Friedman 2004: FTP + tonsils + BMI provide historical anatomic context,
     not an individualized surgical-response probability. */
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
    // Published staging context only. The Ji 2026 model is single-center
    // (n=119, C=0.68), lacks external validation, and uses comorbidity burden,
    // which this implementation does not fully represent.
    return { stage, unfavorable, details };
  })();

  /* ─── DISE concentric collapse check ────────────────────── */
  const _vPat = f.get('vPat') || '';
  const _vDeg = n(f.get('vDeg'));
  const hasConcentricCollapse = _vPat.toLowerCase().includes('concentric') && _vDeg >= 2;

  /* Soft-tissue surgery: tonsillectomy +/- expansion pharyngoplasty (adult) */
  const ftpIorII = (mall==='I' || mall==='II');
  const highAnat = out.phen.includes('High Anatomical Contribution');
  if (priorUPPP) {
    const response = priorUPPPHelped === 'yes'
      ? 'Prior throat surgery helped, but symptoms or OSA may have recurred.'
      : priorUPPPHelped === 'no'
        ? 'Prior throat surgery did not clearly improve sleep or snoring.'
        : 'The response to prior throat surgery is uncertain.';
    pushRec(recs,`${response} Review the operative report and current anatomy before considering revision pharyngoplasty or alternative DISE-directed targets.`,'SOFT-TISSUE-REVISION');
  } else if(exists(tons) && tons >= T.anatomical.tonsils){
    if(friedmanStage === 'I'){
      pushRec(recs,'Consider tonsillectomy with or without expansion pharyngoplasty. Friedman Stage I anatomy is associated with better palatal-surgery outcomes, but it does not provide an individualized success probability.','SOFT-TISSUE-STRONG');
    } else if(friedmanStage === 'II' && ftpIorII){
      pushRec(recs,'Consider tonsillectomy with or without expansion pharyngoplasty as part of an anatomy-directed plan. Friedman Stage II provides context but does not predict an individual outcome.','SOFT-TISSUE-CONSIDER');
    } else if(highAnat && ftpIorII){
      pushRec(recs,'Consider tonsillectomy +/- expansion pharyngoplasty based on anatomic crowding and large tonsils.','SOFT-TISSUE-GENERAL');
    }
  }
  /* Friedman Stage III: recommend tongue base procedures / HNS / MMA instead of UPPP */
  if(friedmanStage === 'III' && exists(ahi) && ahi >= 15){
    pushRec(recs,'Friedman Stage III (high tongue position, small tonsils) — isolated palatal surgery is unlikely to succeed. Consider tongue-base surgery, device-specific hypoglossal-nerve stimulation evaluation, or MMA depending on DISE findings and candidacy.','FRIEDMAN-III-ALT');
  }

  /* Prior treatment-aware Inspire recommendation */
  if(priorInspire) {
    const implantTiming = hgnsImplantYear ? ` (implanted approximately ${hgnsImplantYear})` : '';
    const response = hgnsHelped === 'yes'
      ? 'The patient reports benefit. Continue the existing device pathway and verify current efficacy, nightly use, and settings.'
      : hgnsHelped === 'no'
        ? 'The patient reports no clear benefit. Confirm activation and nightly use, interrogate and optimize the device, and obtain on-therapy testing before moving to another modality.'
        : 'Benefit is uncertain. Confirm activation, nightly use, settings, and objective on-therapy efficacy.';
    pushRec(recs,`Hypoglossal nerve stimulator already in place${implantTiming}. ${response}`,'INSPIRE-OPT');
  } else if(prefInspire && !priorInspire && cpapFailed && exists(ahi) && ahi >= T.hgns.ahiMin && ahi <= T.hgns.ahiMax && !(exists(bmi) && bmi > T.hgns.bmiMax)) {
    /* Device-specific evaluation only. CCC contraindicates unilateral Inspire;
       current US Genio labeling does not establish safety/effectiveness in CCC. */
    const inspireEvalText = hasConcentricCollapse
      ? 'Patient is interested in upper-airway nerve stimulation. DISE shows complete concentric collapse, which contraindicates unilateral Inspire. Do not automatically route to Genio: current US labeling does not establish Genio safety or effectiveness in CCC. Review current device-specific labeling and alternative anatomical treatments.'
      : `Patient is interested in upper-airway nerve stimulation. Complete a device-specific candidacy evaluation including documented PAP intolerance, AHI and central-event burden, BMI, DISE pattern, and payer criteria.${exists(bmi) && bmi > 32 ? ' Current US Genio labeling does not establish safety or effectiveness above BMI 32.' : ''}`;
    pushRec(recs,inspireEvalText,'INSPIRE-EVAL');
  }

  /* ─── ORAL-APPLIANCE RESPONSE CONTEXT ───────────────────── */
  /* Population-level associations only. No externally validated individual
     response rule supports a point score, tier, probability, or plan ranking.
     Ramar 2015; Camañes-Gonzalvo 2022; Hamza 2026. */
  const madResponseContext = (() => {
    const supportive = [];
    const cautionary = [];
    const MAD = T.madCandidacy;
    if (exists(ahi) && ahi >= MAD.ahiMild && ahi < MAD.ahiSevere) supportive.push(ahi < MAD.ahiModerate ? 'mild OSA' : 'moderate OSA');
    else if (exists(ahi) && ahi >= MAD.ahiSevere) cautionary.push('severe OSA');
    if (exists(bmi) && bmi < MAD.bmiLow) supportive.push('lower BMI');
    else if (exists(bmi) && bmi >= MAD.bmiHigh) cautionary.push('higher BMI');
    if (sex === 'F') supportive.push('female sex');
    const neckThresh = sex === 'F' ? MAD.neckFemale : MAD.neckMale;
    if (exists(neck) && neck < neckThresh) supportive.push('smaller neck');
    if (out.phen.includes('Positional OSA')) supportive.push('positional pattern');
    if (out.phen.includes('REM-Predominant OSA')) cautionary.push('REM-predominant pattern');
    // Do not reuse the app's qualitative ventilatory-instability flag here. It
    // is not interchangeable with the measured loop gain used in MAD studies.
    if (retrognathia) supportive.push('mandibular retrusion');
    if (exists(fHypopneas) && fHypopneas > MAD.hypopneaHigh) supportive.push('hypopnea-predominant pattern');
    else if (exists(fHypopneas) && fHypopneas < MAD.hypopneaLow) cautionary.push('apnea-predominant pattern');
    const age = n(f.get('age'));
    if (exists(age) && age < MAD.ageYoung) supportive.push('younger age');
    else if (exists(age) && age >= MAD.ageOld) cautionary.push('older age');
    return { supportive, cautionary };
  })();

  /* ─── STAGE-AWARE CORE RECOMMENDATIONS ───────────────────── */
  if (ahi == null) {
    /* PRE-STUDY: Only recommend sleep study + CBT-I if insomnia */
    if (priorSleepStudyAnswer === 'yes') {
      const studyWhere = priorSleepStudyType === 'home' ? 'home sleep study' : priorSleepStudyType === 'lab' ? 'in-lab sleep study' : 'prior sleep study';
      const studyWhen = priorSleepStudyYear ? ` from approximately ${priorSleepStudyYear}` : '';
      pushRec(recs,`Obtain and review the ${studyWhere}${studyWhen}. Decide whether updated testing is needed based on the prior results, current symptoms, treatment history, and interval health or weight changes.`,'SLEEP-STUDY');
    } else {
      pushRec(recs,'Schedule a sleep study to evaluate for obstructive sleep apnea.','SLEEP-STUDY');
    }
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
      // Malhotra et al. 2018: use PSG with arousal-based scoring to capture
      // respiratory effort-related arousals that most HSATs cannot score.
      pushRec(recs,'Possible UARS (upper airway resistance syndrome): consider in-lab polysomnography with arousal-based scoring for definitive evaluation.','UARS-EVAL');
    } else if (negativeHstNeedsPsg) {
      pushRec(recs,'Negative home sleep apnea test with persistent symptoms or clinical concern: consider in-lab polysomnography if suspicion remains. The clinician may test now or first treat another plausible contributor and reassess persistent symptoms.','NEG-HST-PSG');
    }
    if (hasSnoring || (exists(n(f.get('snoringReported'))) || yes(f,'snoringReported'))) {
      /* Snoring-specific recommendations */
      if (bmi >= 27) pushRec(recs,'Weight management can reduce snoring intensity and frequency.','WEIGHT');
      if (nasalObs || ctSeptum || ctTurbs || (noseScore && noseScore >= T.nasal.noseMild)) {
        // TX-06: nasal treatment is adjunctive for primary snoring. Subjective
        // snoring may improve, but objective acoustic results are mixed and
        // AAO-HNS did not reach consensus that septoplasty reliably reduces
        // primary snoring (Han 2015; Ishii 2017; Virkkula 2006; Sarkis 2023).
        pushRec(recs,'Nasal optimization to improve nasal airflow and potentially reduce snoring.','NASAL-OPT');
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
      if (exists(ahi) && ahi >= T.severity.moderate) {
        /* Obesity + moderate-to-severe OSA → name the on-label GLP-1 option.
           Tirzepatide (Zepbound) FDA-approved for OSA in adults with obesity,
           SURMOUNT-OSA / FDA Dec 2024 (see docs/citations.md). */
        pushRec(recs,'Enroll in structured weight management. For obesity with moderate-to-severe OSA, evaluate a GLP-1/tirzepatide (Zepbound) — FDA-approved for OSA in adults with obesity (SURMOUNT-OSA, 2024).','WEIGHT');
      } else {
        pushRec(recs,'Enroll in a structured weight-management program.','WEIGHT');
      }
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
        const map = CPAP_ISSUE_LABELS;
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
    if(priorMAD && madHelped === 'yes' && madTolerated === 'yes') {
      pushRec(recs,'Prior oral appliance was helpful and tolerated. Consider continuing or retitrating it, and verify control with an on-treatment sleep study.','MAD');
    } else if(priorMAD && madTolerated === 'no') {
      const barrierLabels = { madProblemTmj: 'TMJ pain', madProblemTeeth: 'tooth or dental problems', madProblemBite: 'bite changes', madProblemDiscomfort: 'general discomfort or poor fit' };
      const barriers = madProblems.map(problem => barrierLabels[problem] || problem);
      pushRec(recs,`Prior oral appliance was not tolerated${barriers.length ? ` because of ${barriers.join(', ')}` : ''}. Address the documented dental or TMJ barrier before reconsidering it, and prioritize appropriate alternatives.`,'MAD');
    } else if(priorMAD && madHelped === 'no') {
      pushRec(recs,'Prior oral appliance did not provide a clear benefit. Verify whether it was adequately fitted and titrated before repeating it, and consider other treatment pathways.','MAD');
    } else if(priorMAD) {
      pushRec(recs,'Prior oral appliance trial documented. Clarify effectiveness, tolerance, fitting, and titration before deciding whether to continue or repeat it.','MAD');
    } else if(priorJaw) {
      /* Fix #1: Wire priorJaw — prior jaw surgery affects MAD candidacy */
      pushRec(recs,'Prior jaw surgery noted \u2014 MAD candidacy requires careful dental evaluation of occlusal changes','MAD');
    } else if (!cpapCurrent && (ahi < T.severity.severe || prefAvoidCpap || cpapFailed)) {
      pushRec(recs,'Consider a custom, titratable oral appliance when the patient prefers an alternative to PAP or cannot tolerate PAP. Population-level response associations are not reliable enough to rank this option for an individual; confirm efficacy with follow-up sleep testing.','MAD');
    }
    /* Only recommend generic surgery when anatomical findings are present */
    const hasAnatomicalPhenotype = out.phen.includes('High Anatomical Contribution');
    const hasNasalPhenotype = out.phen.includes('Nasal-Resistance Contributor');
    const hasDISEEntry = [f.get('vDeg'), f.get('oDeg'), f.get('tDeg'), f.get('eDeg')].some(d => d && d !== '0');
    /* Generic surgery as a lead option requires a real surgical indication —
       an anatomical/nasal phenotype, DISE findings, a strong Friedman-I airway,
       or Friedman II at moderate-severe AHI. Mild OSA without those isn't led
       toward surgery/DISE (clinical review). */
    if (hasAnatomicalPhenotype || hasNasalPhenotype || hasDISEEntry || friedmanStage === 'I' || (friedmanStage === 'II' && exists(ahi) && ahi >= T.severity.moderate)) {
      pushRec(recs,'Surgical correction of correctable airway blockage','SURG');
    }

    /* Fix #3: Mild AHI (5-14) with no phenotypes — lifestyle-first approach */
    if (ahi >= 5 && ahi < 15 && out.phen.length === 0) {
      pushRec(recs,'Very mild sleep apnea with no clear phenotype pattern. Consider initial lifestyle modifications (weight loss if overweight, positional changes, nasal care, alcohol avoidance) with repeat sleep study in 6\u201312 months before committing to device therapy.','MILD-LIFESTYLE');
    }
  }

  /* ─── COMISA (Co-Morbid Insomnia and Sleep Apnea) ─────── */
  const hasCOMISA = exists(isi) && isi >= T.comisa.isiScreen && exists(ahi) && ahi >= T.comisa.ahiFloor;
  const sleepyCOMISA = hasCOMISA && exists(ess) && ess >= T.comisa.sleepyEss;
  if (hasCOMISA) {
    // Offer CBT-I early. Sweetman 2019 supports CBT-I before PAP; MATRICS (Ong
    // 2020) found insomnia benefit from both sequential and concurrent CBT-I,
    // without a PAP-adherence difference. Alessi 2021 supports an integrated
    // CBT-I plus adherence program. No trial validates a universal PAP mode,
    // pressure range, ramp, or pressure-relief recipe specifically for COMISA.
    pushRec(recs, 'COMISA screen positive (ISI \u2265 15 + OSA): offer CBT-I early and start or continue PAP concurrently or sequentially based on OSA severity, substantial nocturnal hypoxemia, sleepiness, access, and patient preference. Do not delay effective OSA therapy when clinical urgency is high (Sweetman 2019; Ong/MATRICS 2020; Alessi 2021).', 'CBTI');
    pushRec(recs, 'Individualize PAP mode and settings to the patient and objective PAP data. Address the documented barrier with interface fitting, humidification, ramp, pressure relief, desensitization, or pressure review as appropriate; COMISA alone does not establish APAP over fixed CPAP or a specific pressure range.', 'COMISA-PAP');
    // Sweetman 2020 found a small, transient ESS increase after the first week
    // of bedtime restriction that returned to baseline thereafter. High ESS is
    // a monitoring signal, not evidence that CBT-I is unsafe or contraindicated.
    if (sleepyCOMISA) {
      pushRec(recs, 'CBT-I sleepiness monitoring: high baseline ESS and insomnia warrant close follow-up when bedtime restriction begins. Explain that sleepiness can briefly increase during the first week; assess driving and other safety-sensitive duties, and let the treating CBT-I clinician adjust the pace or use sleep compression when needed.', 'COMISA-SRT-CAUTION');
    }
  }

  return { recs, recTags, friedmanStage, hnsStage, madResponseContext, hasConcentricCollapse, hasCOMISA, sleepyCOMISA };
}

/* ── Clinician report renderer — pure-ish function extracted from the submit
   handler. Builds the entire `cHTML` clinician decision-support report from the
   analysis context. `f` is the FormData, `m` the metrics/flags/derived bundle,
   `T` the thresholds; it reads the milestones/studyType/patientName DOM controls
   directly (same as inline). Returns { cHTML } plus the few computed values the
   handler still stores in lastAnalysisData. Verified byte-identical via the
   clinicianHtml diff in tests/phenotype-matrix.html. ── */
function buildClinicianReport(f, m, T){
  const {
    ahi, bmi, cai, collapsibility, cpapCurrent, cpapFailed, cpapHelped, cpapReasons, cpapDifficulty,
    cpapWillRetry, csr, ctSeptum, ctTurbs, ctxBase, cvd, dhr, edwardsArTH, ess, fHypopneas,
    friedmanStage, hasCOMISA, hasConcentricCollapse, hb90PH, hbPH, hnsStage,
    isi, loopGainSupportCount, lvef, madDentition, madProtrusion, madResponseContext, madTmj, mall,
    nadir, nasalObs, nons, noseScore, nremAhi, odi, osaConfirmed, out,
    oxygenCompositeSufficient, oxygenMetricCount, oxygenMetricsAvailable, pahic3, pahic4,
    prefAvoidCpap, prefInspire, prefSurgery, priorInspire, priorJaw, priorMAD, priorUPPP, priorNasal, priorSinus,
    madHelped, madTolerated, madProblems, priorUPPPHelped, priorNasalHelped, priorSinusHelped, priorJawHelped,
    hgnsHelped, hgnsImplantYear, priorSleepStudyAnswer, priorSleepStudyYear, priorSleepStudyType,
    cvdConditions, lvefFollowupNeeded, glp1Status, glp1Medication, glp1Effective, glp1Issues,
    recTags, remAhi, remMinutes, remPercent, sex, sleepyCOMISA, sup, t90, tons, weightLossReadiness,
    encounter, nextTestGuidance, diagnosticSignals, chronicOpioidUse, neuromuscularRespiratoryRisk,
    hypoventilationRisk, severeInsomniaCompromisesHst,
  } = m;
  const studyType = f.get('studyType') || null;

  /* ─── SYMPTOM SUBTYPE ────────────────────────────────────── */
  let subtype = 'Minimally-symptomatic';
  if(ess >= T.subtype.sleepyEss) subtype = 'Sleepy';
  else if(isi >= T.subtype.disturbedIsi) subtype = 'Disturbed-sleep';

  // Patient-facing report is now generated by PatientReport.generateReportHTML()
  // via the "Generate Patient Report" overlay button.

  const sevLabel = ahiSeverity(ahi);

  // Phenotype icons (Bootstrap Icons) — used by clinician confTable
  const phenIcons = {
    'High Anatomical Contribution': 'bi-lungs',
    'Low Arousal Threshold':        'bi-alarm',
    'High Loop Gain':               'bi-arrow-repeat',
    'Poor Muscle Responsiveness':   'bi-lightning',
    'Positional OSA':               'bi-person-standing',
    'REM-Predominant OSA':          'bi-moon-stars',
    'High Hypoxic Burden':          'bi-heart-pulse',
    'Nasal-Resistance Contributor': 'bi-wind',
    'Elevated Delta Heart Rate':    'bi-activity'
  };

  // PH-08 evidence boundary: baseline NOSE severity predicts average nasal-symptom
  // benefit after septoplasty, not AHI response. PAP benefit is most plausible when
  // nasal obstruction is the dominant adherence barrier (Carrie 2023; Stapleton
  // 2014; Koutsourelakis 2008; Cha 2023; see docs/citations.md).
  const phenEvidenceTooltips = {
    'High Hypoxic Burden': 'This signal uses event-linked hypoxic burden, the oxygen-desaturation area attributable to respiratory events divided by sleep time. It is not ODI, T90, or oxygen nadir. Higher values are associated with cardiovascular risk in observational cohorts, but no universal clinical categories or stand-alone treatment thresholds have been validated.',
    'Nasal-Resistance Contributor': 'Higher baseline NOSE severity predicts a larger average improvement in nasal symptoms after septoplasty, but it does not reliably predict AHI improvement. Nasal surgery is most likely to improve PAP use when nasal obstruction is the dominant barrier; evidence for this PAP predictor comes from small observational cohorts.',
    'Positional OSA': 'Position-specific WatchPAT values are useful directional signals, but the app does not capture minutes spent supine and non-supine, and WatchPAT positional phenotype agreement has not been specifically validated against PSG. Home-derived positional confidence is therefore capped at Moderate.',
    'REM-Predominant OSA': 'With at least 30 minutes of REM, single-night PAT home testing showed high specificity (0.97) but limited sensitivity (0.68) for REM-predominant OSA versus PSG. The app suppresses the phenotype with limited REM sampling and caps a home-derived signal at Moderate.',
  };

  // Signal-strength badges — used by clinician phenotype table
  const confBadge = (conf) => {
    if (conf === 'High')     return '<span class="badge bg-danger">Strong signal</span>';
    if (conf === 'Moderate') return '<span class="badge bg-warning text-dark">Moderate signal</span>';
    return '<span class="badge bg-secondary">Limited signal</span>';
  };

  /* ─── HST Validity Assessment ────────────────────────────── */
  const hstFlags = buildHstFlags({
    studyType,
    tst: n(f.get('tst')), patRdi: n(f.get('patRdi')),
    ahi, remAhi, nremAhi, remPercent, remMinutes, ess, isi, pahic3, csr, sup, nons,
    visitReason: encounter.visitReason,
    snoringReported: yes(f, 'snoringReported'),
    heartFailure: cvdConditions.includes('cvdHeartFailure'),
    strokeHistory: cvdConditions.includes('cvdStroke'),
    chronicOpioidUse,
    neuromuscularRespiratoryRisk,
    hypoventilationRisk,
    severeInsomniaCompromisesHst,
  }, T);

  // Build HST validity HTML
  const hstValidityHTML = hstFlags.length ? `
    <div class="alert ${hstFlags.some(f=>f.severity==='danger') ? 'alert-danger' : hstFlags.some(f=>f.severity==='warning') ? 'alert-warning' : 'alert-info'} mt-2 mb-3">
      <strong><i class="bi bi-exclamation-triangle me-1"></i>Sleep Study Quality Flags</strong>
      ${clinicianEvidenceTooltip('Quality flags identify limitations or unresolved questions that may change interpretation. They are not diagnoses, and they do not select the final treatment plan.', 'How to use sleep study quality flags')}
      <ul class="mb-0 mt-1">${hstFlags.map(f => {
        const icon = f.severity === 'danger' ? 'bi-x-circle-fill text-danger' : f.severity === 'warning' ? 'bi-exclamation-triangle-fill text-warning' : 'bi-info-circle-fill text-info';
        const tooltip = f.tooltip ? clinicianEvidenceTooltip(f.tooltip, `Why ${f.flag.toLowerCase()} matters`) : '';
        return `<li><i class="bi ${icon} me-1"></i><strong>${f.flag}:</strong>${tooltip} ${f.detail}</li>`;
      }).join('')}</ul>
    </div>` : '';

  const nextTestGuidanceHTML = nextTestGuidance ? `
    <section class="osa-next-test-guidance osa-next-test-guidance--${escapeHtml(nextTestGuidance.state)}" aria-label="Next test guidance">
      <div class="osa-next-test-guidance__kicker">Next test guidance <span>${escapeHtml(nextTestGuidance.label)}</span></div>
      <div class="osa-next-test-guidance__body">
        <div>
          <h3>${escapeHtml(nextTestGuidance.title)}</h3>
          <p>${escapeHtml(nextTestGuidance.reason)}.</p>
        </div>
        <div class="osa-next-test-guidance__action"><strong>Clinician action</strong><span>${escapeHtml(nextTestGuidance.action)}</span></div>
      </div>
      <details><summary>Evidence and interpretation</summary><p>${escapeHtml(nextTestGuidance.evidence)}</p></details>
    </section>` : '';

  /* ─── Clinician Decision Support ──────────────────────────── */

  const confTable = out.phen.map(tag => {
    const conf = confidenceFor(tag,{reasons: out.why[tag], metrics: ctxBase});
    const icon = phenIcons[tag] || 'bi-circle';
    const displayTag = tag === 'High Hypoxic Burden' ? 'Event-Linked Hypoxic Burden Signal' : tag;
    const evidenceTooltip = phenEvidenceTooltips[tag]
      ? clinicianEvidenceTooltip(phenEvidenceTooltips[tag], `Evidence context for ${displayTag}`)
      : '';
    return `<tr><td><i class="bi ${icon} me-1"></i>${displayTag}${evidenceTooltip}</td><td>${confBadge(conf)}</td><td><small>${out.why[tag].filter(Boolean).join(', ')||'\u2014'}</small></td></tr>`;
  }).join('');

  const guardrails = [];
  if(out.phen.includes('High Loop Gain')){
    guardrails.push('If considering ASV, confirm LVEF > 45% (contraindicated in HFrEF \u226445%).');
  }
  if(diagnosticSignals?.hbIsaaccCohortContext){
    guardrails.push(`Event-linked HB ${hbPH} %min/h matches a cut point used in post hoc research cohorts. This is prognostic context, not a validated clinical category or stand-alone reason to select, withhold, or rank a treatment.`);
  }
  if(diagnosticSignals?.severeNocturnalHypoxemia){
    guardrails.push('Substantial conventional nocturnal hypoxemia is present. Review whether OSA fully explains it, treat confirmed OSA effectively, and objectively confirm oxygen control; do not relabel ODI, T90, or nadir as hypoxic burden.');
  }
  const positionalPattern = OSAReportShared.classifyPositionalPattern({
    supineAhi: sup,
    nonSupineAhi: nons,
    ratioThreshold: T.positional.supNonSupRatio,
  });
  if(out.phen.includes('Positional OSA') && positionalPattern.type === 'supine-predominant'){
    guardrails.push(`Supine-predominant OSA: non-supine AHI ${nons} remains diagnostic. Positional therapy is adjunctive and should not be presented as monotherapy.`);
  } else if(out.phen.includes('Positional OSA') && positionalPattern.type === 'supine-isolated'){
    guardrails.push('Supine-isolated pattern: positional monotherapy may be considered only after confirming adequate non-supine sleep, including non-supine REM when available, and verifying treatment efficacy objectively.');
  }
  if(out.phen.includes('Elevated Delta Heart Rate') && cvd){
    guardrails.push('Elevated \u0394HR with existing CVD \u2014 consider cardiology monitoring and aggressive PAP adherence targets.');
  }
  if(hasCOMISA){
    const comisaSeverity = isi >= 22 ? 'Severe insomnia' : 'Moderate insomnia';
    let comisaBullets = `<strong>COMISA screen positive: ${comisaSeverity} (ISI ${isi}) plus OSA</strong>
      <ul class="mb-1 mt-1">
        <li>Offer CBT-I early; begin or continue PAP concurrently or sequentially based on OSA severity, substantial nocturnal hypoxemia, access, and patient preference <small class="text-muted">(Sweetman 2019; MATRICS 2020; Alessi 2021)</small></li>
        <li>Do not delay effective OSA treatment when severe disease, substantial hypoxemia, or safety-sensitive sleepiness creates urgency</li>
        <li>Individualize PAP mode and settings using the patient's barriers and objective download data; COMISA alone does not select APAP, fixed CPAP, or a pressure range</li>
        <li>Medication is not an automatic app recommendation. Any hypnotic use requires individualized review of respiratory risk, comorbidities, interactions, falls or impairment risk, and the concurrent OSA plan</li>`;
    if(sleepyCOMISA){
      comisaBullets += `<li class="text-warning"><strong>MONITOR:</strong> ESS ${ess} indicates substantial baseline sleepiness. Bedtime restriction can briefly increase sleepiness during the first week; assess driving and safety-sensitive duties and let the treating CBT-I clinician adjust pace or use sleep compression when needed <small class="text-muted">(Sweetman 2020)</small></li>`;
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

  const followUps = [];
  if(hasCOMISA) followUps.push(`<strong>COMISA follow-up</strong><ul class="mb-0 mt-1"><li>Reassess ISI 4–6 weeks after CBT-I begins</li><li>Start or continue PAP on the individualized concurrent/sequential plan</li><li>If insomnia persists despite CBT-I, arrange in-person sleep psychology review</li><li>Monitor PAP adherence and efficacy early, then at clinically appropriate intervals</li><li>Reassess sleep-onset and sleep-maintenance symptoms to clarify treatment targets and response</li></ul>`);
  if(out.phen.includes('Positional OSA')) followUps.push('Objectively reassess positional-therapy efficacy after an adequate trial; long-term adherence and progression to non-positional OSA remain concerns.');
  if(out.phen.includes('Nasal-Resistance Contributor')) followUps.push('Nasal obstruction follow-up; repeat sleep testing after nasal treatment as needed.');
  if(out.phen.includes('Elevated Delta Heart Rate')) followUps.push('Recheck pulse rate variability on follow-up sleep study after therapy initiation.');
  if (recTags.some(r => r.tag === 'WEIGHT')) {
    if (weightLossReadiness === 'ready') {
      followUps.push('Weight-management follow-up in 4\u20136 weeks to reinforce current motivation, review early progress, and escalate support if needed.');
    } else if (weightLossReadiness === 'considering') {
      followUps.push('Revisit weight-management readiness at follow-up and use shared decision-making to choose between lifestyle, dietitian, and medication-supported options.');
    } else if (weightLossReadiness === 'not-ready') {
      followUps.push('Weight management remains clinically relevant, but revisit it briefly and without pressure at follow-up rather than making it the sole focus today.');
    }
  }
  followUps.push('Therapy effectiveness check (adherence, residual AHI/ODI, symptoms) at 4\u20138 weeks.');

  /* ─── HGNS (Inspire / Genio) Candidacy Assessment ───────────── */
  const papMode = f.get('papMode') || '';
  const cpapPressure = papMode === 'CPAP' ? n(f.get('papCpapPressure')) : n(f.get('cpapPressure'));
  const hgnsCtx = {
    ahi, bmi, sex, sup, nons,
    cpapFailed, prefAvoidCpap, priorInspire, hgnsHelped, hgnsImplantYear,
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
    ahi,
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
    noseScore,
    nasalObs,
    ctSeptum,
    ctTurbs,
    dhr,
    cvd,
    prefInspire,
    prefSurgery,
    planConfirmed: encounter.planConfirmed,
    recTags,
    priorInspire,
    hasDISEData,
    hnsStage,
    studyType,
  });
  const insufficientDataHTML = insufficientDataDomains.length ? `
    <div class="alert alert-warning mt-2 mb-3">
      <strong><i class="bi bi-exclamation-triangle me-1"></i>Insufficient Data Caveats</strong>
      <ul class="mb-0 mt-1">${insufficientDataDomains.map(domain => `<li>${domain.clinician}</li>`).join('')}</ul>
    </div>` : '';
  const treatmentSafetyChecks = buildTreatmentSafetyAssessment({
    osaConfirmed,
    friedmanStage,
    tons,
    bmi,
    recTags,
    priorMAD,
    priorJaw,
    prefSurgery,
    planConfirmed: encounter.planConfirmed,
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
    madTolerated,
    madProblems,
    priorUPPP,
    priorUPPPHelped,
  });
  const treatmentSafetyHTML = treatmentSafetyChecks.length ? `
    <div class="alert alert-warning mt-2 mb-3">
      <strong><i class="bi bi-shield-exclamation me-1"></i>Treatment Safety Checks</strong>
      <ul class="mb-0 mt-1">${treatmentSafetyChecks.map(alert => `<li>${alert.clinician}</li>`).join('')}</ul>
    </div>` : '';
  const insufficientGuardedRecEntries = applyInsufficientDataGuardrails(
    recTags.map(r => ({ text: r.text, tag: r.tag })),
    insufficientDataDomains
  );
  const guardedRecEntries = applyTreatmentSafetyGuardrails(
    insufficientGuardedRecEntries,
    treatmentSafetyChecks
  );
  /* Rank the plan by clinical priority (stable sort preserves insertion order
     within a tier); leads with first-line therapy, workup caveats last. */
  guardedRecEntries.sort((a, b) => recPriority(a.tag) - recPriority(b.tag));
  const guardedRecTexts = guardedRecEntries.map(entry => entry.text);

  if (!exists(ahi)) {
    const selectedPlanLabels = encounter.selectedPlanFields.map(field => PLAN_FIELD_LABELS[field]).filter(Boolean);
    if (encounter.planObserve) selectedPlanLabels.push('observe / follow up');
    const contextItems = [
      exists(ess) ? `ESS ${ess}${ess >= 15 ? ', significant daytime sleepiness' : ''}` : null,
      exists(isi) ? `ISI ${isi}${isi >= 15 ? ', clinically meaningful insomnia symptoms' : ''}` : null,
      exists(noseScore) ? `NOSE ${noseScore}${noseScore >= 30 ? ', meaningful nasal obstruction' : ''}` : nasalObs ? 'Nasal obstruction reported' : null,
      exists(bmi) ? `BMI ${bmi.toFixed(1)}` : null,
      mall ? `Friedman tongue position ${mall}` : null,
      exists(tons) ? `Tonsils ${tons}` : null,
      priorSleepStudyAnswer === 'yes' ? `Prior sleep study reported${priorSleepStudyType === 'home' ? ', home study' : priorSleepStudyType === 'lab' ? ', in-lab study' : ''}${priorSleepStudyYear ? `, approximately ${priorSleepStudyYear}` : ''}` : null,
      cvdConditions.length ? `Cardiovascular history: ${cvdConditions.map(condition => ({
        cvdHypertension: 'hypertension', cvdCad: 'coronary disease or prior MI', cvdHeartFailure: 'heart failure or cardiomyopathy',
        cvdArrhythmia: 'atrial fibrillation or arrhythmia', cvdStroke: 'stroke or TIA', cvdValve: 'valve disease',
        cvdOther: 'other cardiovascular disease', cvdUnsure: 'diagnosis uncertain'
      })[condition] || condition).join(', ')}` : null,
    ].filter(Boolean);
    const preStudyPlan = guardedRecTexts.length
      ? guardedRecTexts.map((text, index) => `<div class="osa-clin-rec${index === 0 ? ' osa-rec-priority' : ''}"><span class="osa-clin-rec-num">${index + 1}</span><span>${text}</span></div>`).join('')
      : '<p class="text-muted mb-0">No active pre-study pathway is selected.</p>';
    const cHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 no-print">
        <h2 class="h4 osa-section-title mb-0">Clinician Decision Support</h2>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-success btn-sm" id="btnPreviewClinicianPdf"><i class="bi bi-eye"></i> Preview clinician guide</button>
          <button class="btn btn-outline-success btn-sm" id="btnDownloadClinicianPdf"><i class="bi bi-download"></i> Download PDF</button>
        </div>
      </div>
      <div class="osa-care-summary mb-3"><i class="bi bi-clipboard2-pulse me-2"></i>Pre-study evaluation${contextItems.length ? ` · ${contextItems.join(' · ')}` : ''}</div>
      <div class="alert ${encounter.planConfirmed ? 'alert-success' : 'alert-info'} py-2 px-3 mb-3">
        <div><strong>Visit goal:</strong> ${escapeHtml(encounter.visitReasonLabel)}${encounter.visitReasonNote ? `, ${escapeHtml(encounter.visitReasonNote)}` : ''}</div>
        <div><strong>${encounter.planConfirmed ? 'Confirmed plan' : 'Planning status'}:</strong> ${encounter.planConfirmed ? escapeHtml(selectedPlanLabels.join(', ') || 'No active pathway selected') : 'Pre-visit decision support. Confirm today\'s plan before generating the patient handout.'}</div>
        ${encounter.planSummary ? `<div><strong>Most important next step:</strong> ${escapeHtml(encounter.planSummary)}</div>` : ''}
      </div>
      <div class="alert alert-secondary py-2 px-3 mb-3"><strong>Diagnostic boundary:</strong> OSA is not yet confirmed. Keep PAP, oral appliance, nerve stimulation, and airway surgery outside the active plan until diagnostic results are reviewed, unless another established diagnosis provides a separate indication.</div>
      ${lvefFollowupNeeded ? '<div class="alert alert-warning py-2 px-3 mb-3"><strong>Echo/LVEF Needed:</strong> Heart failure/cardiomyopathy or a prior echocardiogram was reported without a documented left ventricular ejection fraction. Request the latest echocardiogram before advanced PAP or cardiopulmonary treatment decisions that depend on systolic function.</div>' : ''}
      <section class="osa-clin-priority-brief mb-3">
        <p class="osa-clin-priority-label">Treatment priorities</p>
        <h5 class="mb-2">Plan Before Diagnosis</h5>
        ${preStudyPlan}
      </section>
      <div class="osa-clin-section mt-3">
        <div class="osa-clin-section-header" aria-expanded="true"><span><i class="bi bi-calendar-check me-2"></i>Follow-up Plan</span></div>
        <div class="osa-clin-section-body"><ul class="mb-0"><li>${priorSleepStudyAnswer === 'yes' ? 'Obtain and review the actual prior sleep-study report, then decide whether updated testing is needed.' : 'Review the sleep-study result with the patient.'}</li><li>Update phenotype, treatment candidacy, and the confirmed plan only after diagnostic data are available.</li></ul></div>
      </div>`;
    return { cHTML, subtype, guardedRecTexts, guardedRecEntries, insufficientDataDomains, treatmentSafetyChecks };
  }

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
    const hbColor = hbPH >= T.hypoxicBurden.signalBoundary
        ? '#fd7e14'
        : '#6c757d';
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

  /* ── Event-linked HB research context and conventional hypoxemia ── */
  const hbTreatmentNote = (() => {
    const notes = [];
    if (exists(hbPH) && hbPH >= T.hypoxicBurden.signalBoundary) {
      const cohortContext = diagnosticSignals?.hbPooledTrialContext
        ? 'This value matches the 87.1 %min/h subgroup cut point used in a pooled post hoc trial analysis.'
        : diagnosticSignals?.hbIsaaccCohortContext
          ? 'This value matches the 73.1 %min/h subgroup cut point used in the post hoc ISAACC analysis.'
          : 'This value exceeds the app\'s exploratory research-signal boundary of 30 %min/h.';
      notes.push(`<div class="alert alert-info mt-2 py-2 px-3"><strong>Event-Linked Hypoxic Burden: Research Context</strong><ul class="mb-1 mt-1"><li>HB ${hbPH.toFixed(1)} %min/h</li><li>${cohortContext}</li><li>Higher HB is associated with cardiovascular risk in observational cohorts, but no universal clinical categories or stand-alone treatment thresholds are validated.</li><li>Do not use this value alone to select, withhold, or rank PAP or an alternative treatment.</li></ul></div>`);
    }
    if (diagnosticSignals?.severeNocturnalHypoxemia) {
      const triggers = [];
      const oxygen = T.nocturnalHypoxemia;
      if (exists(odi) && odi > oxygen.odiSevere) triggers.push(`ODI ${odi} (>50/h)`);
      if (exists(t90) && t90 > oxygen.t90Severe) triggers.push(`T90 ${t90}% (>20%)`);
      if (exists(nadir) && nadir < oxygen.nadirSevere) triggers.push(`nadir SpO2 ${nadir}% (<75%)`);
      if (exists(hb90PH) && hb90PH > oxygen.areaUnder90Severe) triggers.push(`area below 90% ${hb90PH}/h (>2)`);
      notes.push(`<div class="alert alert-danger mt-2 py-2 px-3"><strong>Substantial Nocturnal Hypoxemia</strong><ul class="mb-1 mt-1"><li><strong>Triggers:</strong> ${triggers.join('; ')}</li><li>These conventional oxygen metrics are clinically important, but they are not event-linked hypoxic burden.</li><li>Treat confirmed OSA effectively, consider contributors not fully explained by OSA, and objectively confirm oxygen control.</li></ul></div>`);
    }
    return notes.join('');
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
  const rankedPlan = guardedRecEntries.map((entry, i) => {
    const priority = i === 0 ? ' osa-rec-priority' : '';
    const tooltip = entry.tag === 'UARS-EVAL'
      ? clinicianEvidenceTooltip('UARS refers to symptomatic sleep-disordered breathing associated with flow limitation and respiratory effort-related arousals. ICSD-3 places this presentation within OSA. In-lab PSG with arousal-based scoring can evaluate events that most home studies cannot score because they do not record EEG.', 'Why possible UARS requires arousal-based scoring')
      : '';
    return `<div class="osa-clin-rec${priority}"><span class="osa-clin-rec-num">${i+1}</span><span>${entry.text}${tooltip}</span></div>`;
  }).join('');

  /* ── Care Pathway Bar (clinician report) ──────────────── */
  const milestones = [...document.querySelectorAll('#patientMilestones input:checked')].map(cb => cb.value);

  const studyTypeVal = document.querySelector('input[name="studyType"]:checked')?.value;
  const carePapState = OSAReportShared.resolvePapState({
    cpapCurrent,
    cpapFailed,
    cpapWillRetry,
    prefAvoidCpap,
    hasPapPlan: guardedRecEntries.some(entry => entry.tag === 'CPAP' || entry.tag.startsWith('CPAP-')),
  });
  const { stages: careStages, currentIdx: currentStageIdx } = OSAReportShared.buildCarePathway({
    milestones,
    studyType: studyTypeVal,
    hasStudyData: exists(ahi),
    hasPatientContext: Boolean(document.getElementById('patientName')?.value),
    papState: carePapState,
    labels: {
      eval: 'Evaluation',
      study: {
        psg: 'Lab Sleep Study',
        watchpat: 'Home Sleep Test',
        default: 'Sleep Study',
      },
      cpap: {
        trial: 'CPAP Trial',
        retry: 'PAP Re-fit / Retry',
        current: 'Using PAP',
        completed: 'PAP Tried',
        considered: 'PAP Considered',
        followup: 'CPAP Follow-up',
        alternatives: 'Alternatives Review',
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
  const hasTxHistory = cpapCurrent || cpapFailed || prefAvoidCpap || priorMAD || priorUPPP || priorNasal || priorSinus || priorJaw || priorInspire;
  const careSummaryParts = [];
  if ((milestones.length || hasTxHistory) && exists(ahi)) careSummaryParts.push(`AHI ${ahi} (${sevLabel || 'normal'})`);
  if (cpapCurrent) careSummaryParts.push(`Current ${papMode || 'PAP'} user`);
  else if (cpapFailed) careSummaryParts.push(`CPAP tried (${cpapWillRetry ? 'will retry' : 'discontinued'})`);
  else if (prefAvoidCpap) careSummaryParts.push('Prefers to avoid CPAP');
  if (priorMAD) careSummaryParts.push('Prior MAD');
  if (priorUPPP) careSummaryParts.push('Prior throat surgery');
  if (priorNasal) careSummaryParts.push('Prior nasal surgery');
  if (priorSinus) careSummaryParts.push('Prior sinus surgery');
  if (priorJaw) careSummaryParts.push('Prior jaw surgery');
  if (priorInspire) careSummaryParts.push('Existing nerve stimulator');
  if (weightLossReadiness === 'ready') careSummaryParts.push('Ready for weight management');
  else if (weightLossReadiness === 'considering') careSummaryParts.push('Considering weight management');
  else if (weightLossReadiness === 'not-ready') careSummaryParts.push('Not ready for weight management');
  if (hasCOMISA) careSummaryParts.push('COMISA');
  if (milestones.length) careSummaryParts.push(`Stage: ${milestones[milestones.length - 1]}`);

  const careSummaryHTML = careSummaryParts.length ? `<div class="osa-care-summary mb-3"><i class="bi bi-clipboard2-pulse me-2"></i>${careSummaryParts.join(' · ')}</div>` : '';
  const historyContextParts = [];
  if (priorSleepStudyAnswer === 'yes') {
    const type = priorSleepStudyType === 'home' ? 'home study' : priorSleepStudyType === 'lab' ? 'in-lab study' : 'study type unknown';
    historyContextParts.push(`Prior sleep study reported: ${type}${priorSleepStudyYear ? `, approximately ${priorSleepStudyYear}` : ''}. Review the actual report before relying on its diagnosis or severity.`);
  }
  if (cpapCurrent) {
    const difficulty = cpapDifficulty === 'yes'
      ? `difficulty reported${cpapReasons.length ? ` (${cpapReasons.map(reason => CPAP_ISSUE_LABELS[reason] || reason).join(', ')})` : ''}`
      : cpapDifficulty === 'no' ? 'no current difficulty reported' : 'current difficulty uncertain';
    historyContextParts.push(`Current ${papMode || 'PAP'}: ${difficulty}.`);
  }
  if (priorMAD) {
    const problemLabels = { madProblemTmj: 'TMJ pain', madProblemTeeth: 'dental problems', madProblemBite: 'bite change', madProblemDiscomfort: 'discomfort or poor fit' };
    const barriers = madProblems.map(problem => problemLabels[problem] || problem);
    historyContextParts.push(`Prior oral appliance: benefit ${madHelped || 'unknown'}, tolerance ${madTolerated || 'unknown'}${barriers.length ? `, barriers: ${barriers.join(', ')}` : ''}.`);
  }
  const surgeryHistory = [
    priorUPPP ? ['throat surgery', priorUPPPHelped] : null,
    priorNasal ? ['nasal surgery', priorNasalHelped] : null,
    priorSinus ? ['sinus surgery', priorSinusHelped] : null,
    priorJaw ? ['jaw surgery', priorJawHelped] : null,
  ].filter(Boolean).map(([label, helped]) => `${label}: ${helped || 'response unknown'}`);
  if (surgeryHistory.length) historyContextParts.push(`Prior surgery response: ${surgeryHistory.join('; ')}.`);
  if (priorInspire) {
    historyContextParts.push(`Existing hypoglossal nerve stimulator${hgnsImplantYear ? `, implanted approximately ${hgnsImplantYear}` : ''}: benefit ${hgnsHelped || 'unknown'}.`);
  }
  if (cvdConditions.length) {
    const conditionLabels = {
      cvdHypertension: 'hypertension', cvdCad: 'coronary disease or prior MI', cvdHeartFailure: 'heart failure or cardiomyopathy',
      cvdArrhythmia: 'atrial fibrillation or arrhythmia', cvdStroke: 'stroke or TIA', cvdValve: 'valve disease', cvdOther: 'other cardiovascular disease', cvdUnsure: 'diagnosis uncertain'
    };
    historyContextParts.push(`Cardiovascular history: ${cvdConditions.map(condition => conditionLabels[condition] || condition).join(', ')}.`);
  }
  if (exists(lvef)) {
    historyContextParts.push(`Documented LVEF: ${lvef}%.`);
  }
  if (glp1Status === 'current' || glp1Status === 'previous') {
    const medicationLabels = { semaglutide: 'semaglutide', tirzepatide: 'tirzepatide', liraglutide: 'liraglutide', other: 'other GLP-1 medication', unsure: 'GLP-1 medication unknown' };
    const issueLabels = { glp1IssueNone: 'no significant problems', glp1IssueDigestive: 'digestive side effects', glp1IssueCost: 'cost or coverage', glp1IssueOther: 'other issue' };
    historyContextParts.push(`GLP-1 history: ${glp1Status}, ${medicationLabels[glp1Medication] || 'medication unknown'}, weight benefit ${glp1Effective || 'unknown'}${glp1Issues.length ? `, ${glp1Issues.map(issue => issueLabels[issue] || issue).join(', ')}` : ''}.`);
  }
  const historyContextHTML = historyContextParts.length ? `
    <div class="alert alert-light border py-2 px-3 mb-3">
      <strong>Patient-reported treatment history and decision context</strong>
      <ul class="mb-0 mt-1">${historyContextParts.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </div>` : '';
  const selectedPlanLabels = encounter.selectedPlanFields.map(field => PLAN_FIELD_LABELS[field]).filter(Boolean);
  if (encounter.planObserve) selectedPlanLabels.push('observe / follow up');
  const nasalExamFindings = [
    ctSeptum ? 'deviated septum' : '',
    ctTurbs ? 'turbinate hypertrophy' : '',
  ].filter(Boolean);
  const encounterPlanHTML = `
    <div class="alert ${encounter.planConfirmed ? 'alert-success' : 'alert-info'} py-2 px-3 mb-3">
      <div><strong>Visit goal:</strong> ${escapeHtml(encounter.visitReasonLabel)}${encounter.visitReasonNote ? `, ${escapeHtml(encounter.visitReasonNote)}` : ''}</div>
      <div><strong>${encounter.planConfirmed ? 'Confirmed plan' : 'Planning status'}:</strong> ${encounter.planConfirmed ? escapeHtml(selectedPlanLabels.join(', ') || 'No active treatment selected') : 'Pre-visit decision support. Confirm today\'s plan before generating the patient handout.'}</div>
      ${encounter.planSummary ? `<div><strong>Most important next step:</strong> ${escapeHtml(encounter.planSummary)}</div>` : ''}
    </div>`;
  const normalStudyContextHTML = exists(ahi) && ahi < T.severity.mild ? `
    <div class="alert alert-success py-2 px-3 mb-3">
      <strong>Normal study by AHI:</strong> The AHI of ${ahi} is below the diagnostic threshold for obstructive sleep apnea.
      ${encounter.visitReason === 'snoring' || yes(f, 'snoringReported') ? `<div><strong>Snoring pathway:</strong>${clinicianEvidenceTooltip('AAO-HNS did not reach consensus that septoplasty reliably reduces primary snoring. Prospective cohorts report improvement in subjective snoring-related quality of life, but objective acoustic findings are mixed. Treat nasal surgery as an adjunct for documented obstruction and counsel that snoring may persist.', 'Evidence context for nasal treatment of primary snoring')} Address nasal airflow, sleep position, alcohol near bedtime, weight when relevant, and other symptom drivers without activating an OSA treatment pathway.</div>` : ''}
      ${nasalExamFindings.length ? `<div><strong>Nasal exam:</strong> ${escapeHtml(nasalExamFindings.join(', '))}.</div>` : ''}
    </div>` : '';
  const lvefFollowupHTML = lvefFollowupNeeded ? `
    <div class="alert alert-warning py-2 px-3 mb-3">
      <strong>Echo/LVEF Needed:</strong> Heart failure/cardiomyopathy or a prior echocardiogram was reported without a documented left ventricular ejection fraction. Request the latest echocardiogram before advanced PAP or cardiopulmonary treatment decisions that depend on systolic function.
    </div>` : '';

  /* ── Build collapsible clinical analysis content ──────── */
  const clinAnalysisParts = [];
  if (edwardsArTH && !edwardsArTH.partial && out.phen.includes('Low Arousal Threshold'))
    clinAnalysisParts.push(`<div class="alert alert-info py-2 px-3 mb-2"><strong>Edwards ArTH Score: ${edwardsArTH.score}/${edwardsArTH.maxScore}</strong> — ${edwardsArTH.prediction} (${edwardsArTH.details.join(', ')})${edwardsArTH.partial ? ' <small class="text-muted">[Hypopnea fraction unavailable from WatchPAT — score based on 2 of 3 variables. Enter Apnea Index + Hypopnea Index in Lab PSG section for full score.]</small>' : ''}</div>`);
  if (!exists(fHypopneas) && (studyType === 'psg' || studyType === 'both')) {
    clinAnalysisParts.push('<div class="alert alert-secondary py-2 px-3 mb-2"><strong>Detailed Endotyping Incomplete</strong> <small class="text-muted">(Vena 2022; Edwards 2014; Schmickl 2022)</small><ul class="mb-0 mt-1"><li>Apnea/hypopnea breakdown not entered</li><li>Collapsibility estimate and point-of-care loop gain estimate remain incomplete</li><li>Low-arousal-threshold scoring may be partial rather than fully scored</li></ul></div>');
  }
  if (exists(fHypopneas)) {
    const collLabel = collapsibility === 'high' ? 'High' : collapsibility === 'moderate' ? 'Moderate' : 'Low';
    const collImplication = collapsibility === 'high' ? 'Anatomy-directed therapy (CPAP, surgery, HNS) prioritized' : collapsibility === 'low' ? 'Non-CPAP therapies (MAD, positional, weight loss) more likely to succeed' : 'Mixed pattern — both anatomic and nonanatomic therapies may be effective';
    clinAnalysisParts.push(`<div class="alert alert-${collapsibility === 'high' ? 'warning' : 'info'} py-2 px-3 mb-2"><strong>Collapsibility: ${collLabel}</strong> <small class="text-muted">(Vena 2022)</small><ul class="mb-0 mt-1"><li>F(hypopneas) = ${fHypopneas.toFixed(0)}%</li><li>${collImplication}</li></ul></div>`);
  }
  if (loopGainSupportCount >= 1) {
    const lgSuspected = loopGainSupportCount >= T.loopGain.supportMin;
    const lgSignals = [
      csr ? `Cheyne-Stokes / periodic breathing ${csr}%` : '',
      exists(pahic3) ? `pAHIc 3% ${pahic3}/h` : '',
      exists(pahic4) ? `pAHIc 4% ${pahic4}/h` : '',
      exists(cai) ? `CAI ${cai}/h` : '',
    ].filter(Boolean).map(s => `<li>${s}</li>`).join('');
    const lgAction = lgSuspected ? '<li>If centrals persist on therapy: consider O₂ or acetazolamide (confirm with in-lab PSG first)</li>' : '';
    clinAnalysisParts.push(`<div class="alert alert-${lgSuspected ? 'warning' : 'info'} py-2 px-3 mb-2"><strong>Ventilatory instability (loop gain): ${lgSuspected ? 'suspected' : 'possible'}</strong> <small class="text-muted">(qualitative — central/periodic-breathing signals; no validated point estimate)</small><ul class="mb-0 mt-1">${lgSignals}${lgAction}</ul></div>`);
  }
  if (hbTreatmentNote) clinAnalysisParts.push(hbTreatmentNote.replace(/mt-2/g, 'mb-2'));
  if (atsTriage) clinAnalysisParts.push(atsTriage.replace(/mt-2/g, 'mb-2'));

  /* ── Build collapsible treatment candidacy content ───── */
  const txCandidacyParts = [];
  if (friedmanStage)
    txCandidacyParts.push(`<div class="alert alert-${friedmanStage === 'I' ? 'success' : friedmanStage === 'II' ? 'info' : 'warning'} py-2 px-3 mb-2"><strong>Friedman Stage ${friedmanStage}</strong> (FTP ${mall || '?'}, Tonsils ${exists(tons)?tons:'?'}, BMI ${exists(bmi)?bmi.toFixed(1):'?'}) — ${friedmanStage === 'I' ? 'Anatomy is more supportive of palatal or tonsil surgery.' : friedmanStage === 'II' ? 'Intermediate anatomic context; procedure selection requires the complete airway evaluation.' : friedmanStage === 'III' ? 'Isolated palatal surgery is less likely to control OSA; evaluate other airway levels and treatment modalities.' : 'The staging system does not provide a reliable individualized response estimate in this anatomy.'}<br><small class="text-muted">Friedman stage is an evidence-informed anatomic framework, not a validated patient-specific probability. DISE can localize collapse when indicated, but DISE findings do not form a validated general surgical-response score.</small></div>`);
  if (hnsStage && !priorInspire) {
    const cccBadge = hasConcentricCollapse ? ' <span class="badge bg-warning text-dark">DISE: CCC — Inspire contraindicated; Genio evidence/labeling not established for CCC</span>' : '';
    const bmiBadge = exists(bmi) && bmi > T.hgns.bmiMax ? ' <span class="badge bg-danger">BMI >40 — above current Capital ENT HGNS referral guardrail</span>' : '';
    if (hnsStage.insufficient) {
      txCandidacyParts.push(`<div class="alert alert-secondary py-2 px-3 mb-2"><strong>Exploratory HGNS response context (Ji 2026)</strong> — Insufficient data. Enter ${hnsStage.missing.join(', ')} to describe the published staging context.${cccBadge}${bmiBadge}</div>`);
    } else {
      txCandidacyParts.push(`<div class="alert alert-light py-2 px-3 mb-2"><strong>Exploratory HGNS response context — Ji Stage ${hnsStage.stage}</strong>${hnsStage.details.length ? ' (published adverse features represented: ' + hnsStage.details.join(', ') + ')' : ' (no published adverse features represented)'}<br><small class="text-muted">This single-center staging model had modest discrimination (C=0.68), is not externally validated, and cannot assign candidacy or an individual response probability. Confirm eligibility and response-relevant anatomy separately using current device labeling and the device-specific workup.</small>${cccBadge}${bmiBadge}</div>`);
    }
  }
  const madBarrierLabels = { madProblemTmj: 'TMJ pain', madProblemTeeth: 'dental problems', madProblemBite: 'bite changes', madProblemDiscomfort: 'discomfort or poor fit' };
  const madBarrierText = madProblems.map(problem => madBarrierLabels[problem] || problem).join(', ');
  const priorMadStatus = priorMAD
    ? madTolerated === 'no'
      ? ` <span class="badge bg-warning text-dark">Clinically limited by prior intolerance${madBarrierText ? `: ${escapeHtml(madBarrierText)}` : ''}</span>`
      : madHelped === 'no'
        ? ' <span class="badge bg-secondary">No clear prior benefit</span>'
        : madHelped === 'yes' && madTolerated === 'yes'
          ? ' <span class="badge bg-success">Prior benefit and tolerance reported</span>'
          : ' <span class="badge bg-secondary">Prior response incomplete</span>'
    : '';
  const madSupportive = madResponseContext.supportive?.length ? escapeHtml(madResponseContext.supportive.join(', ')) : 'none captured';
  const madCautionary = madResponseContext.cautionary?.length ? escapeHtml(madResponseContext.cautionary.join(', ')) : 'none captured';
  txCandidacyParts.push(`<div class="alert alert-${priorMAD && madTolerated === 'no' ? 'warning' : priorMAD ? 'secondary' : 'light'} py-2 px-3 mb-2"><strong>${priorMAD ? 'Prior oral appliance and response context' : 'Oral appliance response context'}</strong>${priorMadStatus}<br><small><strong>No validated individual response score is available.</strong> Population-level studies report directional associations, but these do not establish candidacy or predict this patient's result. Supportive associations captured: ${madSupportive}. Cautionary associations captured: ${madCautionary}. Treatment choice should follow preference, PAP tolerance, dental safety, and objective follow-up testing.</small><br><small class="text-muted"><strong>Before prescribing an oral appliance, verify:</strong> adequate dentition, no severe TMJ dysfunction, mandibular protrusion ≥6mm${priorJaw ? ', prior jaw surgery occlusal assessment' : ''}</small></div>`);
  if (surgHelper) txCandidacyParts.push(surgHelper);
  if (hgnsHTML) txCandidacyParts.push(`<div class="mt-2">${hgnsHTML}</div>`);

  /* ── Summary badges for collapsed headers ───────────── */
  const analysisBadges = [
    exists(fHypopneas) ? `Collapsibility: ${collapsibility}` : null,
    loopGainSupportCount >= 1 ? `Loop gain: ${loopGainSupportCount >= T.loopGain.supportMin ? 'suspected' : 'possible'}` : null,
    edwardsArTH && out.phen.includes('Low Arousal Threshold') ? `Low Arousal Threshold (${edwardsArTH.score}/${edwardsArTH.maxScore} criteria)` : null,
    hbTreatmentNote ? 'Oxygen and HB context' : null,
  ].filter(Boolean);

  const candidacyBadges = [
    friedmanStage ? `Friedman ${friedmanStage}` : null,
    priorMAD ? `Oral appliance: prior trial${madTolerated === 'no' ? ' (intolerance)' : ''}` : 'Oral appliance: response uncertain',
    priorInspire ? 'HGNS: existing device' : hnsStage && !hnsStage.insufficient ? `HGNS: Ji Stage ${hnsStage.stage} (exploratory)` : hnsStage?.insufficient ? 'HGNS: staging context incomplete' : null,
  ].filter(Boolean);

  let cHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 no-print">
      <h2 class="h4 osa-section-title mb-0">Clinician Decision Support</h2>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-success btn-sm" id="btnPreviewClinicianPdf"><i class="bi bi-eye"></i> Preview clinician guide</button>
        <button class="btn btn-outline-success btn-sm" id="btnDownloadClinicianPdf"><i class="bi bi-download"></i> Download PDF</button>
      </div>
    </div>
    ${pathwayHTML}
    ${careSummaryHTML}
    ${encounterPlanHTML}
    ${normalStudyContextHTML}
    <section class="osa-clin-priority-brief mb-3">
      <p class="osa-clin-priority-label">Treatment priorities</p>
      ${lvefFollowupHTML}
      ${insufficientDataHTML}
      ${treatmentSafetyHTML}
      <h5 class="mb-2">Prioritized plan</h5>
      ${rankedPlan}
      ${guardrails.length?`<div class="alert alert-warning mt-3 mb-2"><strong>Guardrails</strong>${guardrails.map(g => g.startsWith('<strong>') ? `<div class="mt-2">${g}</div>` : `<ul class="mb-1"><li>${g}</li></ul>`).join('')}</div>`:''}
    </section>
    <h5 class="osa-clin-supporting-title mt-3 mb-2">Supporting evidence</h5>
    ${historyContextHTML}
    <p class="mb-2"><strong>Subtype:</strong> ${subtype} (ESS ${exists(ess)?ess:'\u2014'}, ISI ${exists(isi)?isi:'\u2014'})</p>
    ${cpapFailed ? `<p class="mb-2"><strong>PAP History:</strong> Prior trial ${cpapHelped === 'Yes' ? '(helped but discontinued)' : cpapHelped === 'No' ? '(did not help)' : '(efficacy unclear)'} — ${cpapWillRetry ? 'willing to retry' : 'not willing to retry'}${cpapReasons.length ? '. Issues: ' + cpapReasons.map(r => (CPAP_ISSUE_LABELS[r]||r)).join(', ') : ''}</p>` : cpapCurrent ? `<p class="mb-2"><strong>PAP History:</strong> Currently using ${papMode || 'PAP'}</p>` : ''}
    ${keyNumsGrid}
    ${hstValidityHTML}
    ${nextTestGuidanceHTML}
    ${out.phen.length ? `
      <div class="table-responsive mt-3">
        <table class="table table-sm align-middle osa-report-table">
          <thead><tr><th>Phenotype</th><th>Signal Strength</th><th>Triggers</th></tr></thead>
          <tbody>${confTable}</tbody>
        </table>
        <p class="small text-muted mb-0">Signal strength reflects internal rule support and should not be interpreted as a validated probability score.</p>
      </div>` : ''
    }

    ${clinAnalysisParts.length ? `
    <div class="osa-clin-section mt-3">
      <button type="button" class="osa-clin-section-header" data-bs-toggle="collapse" data-bs-target="#clinAnalysis" aria-expanded="false" aria-controls="clinAnalysis">
        <span><i class="bi bi-graph-up me-2"></i>Clinical Analysis</span>
        <span class="osa-clin-section-badges">${analysisBadges.map(b => `<span class="badge bg-light text-dark border">${b}</span>`).join(' ')}</span>
        <i class="bi bi-chevron-down osa-collapse-icon ms-auto"></i>
      </button>
      <div class="collapse" id="clinAnalysis">
        <div class="osa-clin-section-body">${clinAnalysisParts.join('')}</div>
      </div>
    </div>` : ''}

    <div class="osa-clin-section mt-2">
      <button type="button" class="osa-clin-section-header" data-bs-toggle="collapse" data-bs-target="#txCandidacy" aria-expanded="false" aria-controls="txCandidacy">
        <span><i class="bi bi-clipboard2-check me-2"></i>Treatment Candidacy</span>
        <span class="osa-clin-section-badges">${candidacyBadges.map(b => `<span class="badge bg-light text-dark border">${b}</span>`).join(' ')}</span>
        <i class="bi bi-chevron-down osa-collapse-icon ms-auto"></i>
      </button>
      <div class="collapse" id="txCandidacy">
        <div class="osa-clin-section-body">${txCandidacyParts.join('')}</div>
      </div>
    </div>

    <div class="osa-clin-section mt-2">
      <button type="button" class="osa-clin-section-header" data-bs-toggle="collapse" data-bs-target="#clinFollowup" aria-expanded="false" aria-controls="clinFollowup">
        <span><i class="bi bi-calendar-check me-2"></i>Follow-up Plan</span>
        <span class="osa-clin-section-badges">${[
          hasCOMISA ? 'COMISA protocol' : null,
          out.phen.includes('Positional OSA') ? 'Positional recheck' : null,
          `${followUps.length} items`,
        ].filter(Boolean).map(b => `<span class="badge bg-light text-dark border">${b}</span>`).join(' ')}</span>
        <i class="bi bi-chevron-down osa-collapse-icon ms-auto"></i>
      </button>
      <div class="collapse" id="clinFollowup">
        <div class="osa-clin-section-body">${followUps.map(x => x.startsWith('<strong>') ? `<div class="mb-2">${x}</div>` : `<ul class="mb-1"><li>${x}</li></ul>`).join('')}</div>
      </div>
    </div>
  `;

  return { cHTML, subtype, guardedRecTexts, guardedRecEntries, insufficientDataDomains, treatmentSafetyChecks };
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
  const f = new FormData(e.target);
  const studyType = f.get('studyType') || null;

  const out = { phen:[], why:{}, recs:[] };  // phen/why populated by detectPhenotypes() below

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
  const cvd     = yes(f,'cvd') || ['cvdHypertension','cvdCad','cvdHeartFailure','cvdArrhythmia','cvdStroke','cvdValve','cvdOther'].some(key => yes(f, key));

  /* ─── TREATMENT HISTORY & PREFERENCES ─────────────────────── */
  const priorCpap     = yes(f,'priorCpap');
  const cpapCurrent   = yes(f,'cpapCurrent');
  const cpapHelped    = f.get('cpapHelped') || '';   // Yes/No/Unsure/''
  const cpapRetry     = f.get('cpapRetry')  || '';   // Yes/No/Maybe/''
  const cpapDifficulty = (f.get('cpapDifficulty') || '').toLowerCase();
  const cpapReasons   = ['cpapMask','cpapClaustro','cpapDry','cpapLeaks','cpapSleep','cpapSkin','cpapNoImprove','cpapTravel'].filter(k => yes(f,k));
  const priorUPPP     = yes(f,'priorUPPP');
  const priorNasal    = yes(f,'priorNasal');
  const priorSinus    = yes(f,'priorSinus');
  const priorJaw      = yes(f,'priorJaw');
  const priorInspire  = yes(f,'priorInspire');
  const priorMAD      = yes(f,'priorMAD');
  const madHelped     = (f.get('madHelped') || '').toLowerCase();
  const madTolerated  = (f.get('madTolerated') || '').toLowerCase();
  const madProblems   = ['madProblemTmj','madProblemTeeth','madProblemBite','madProblemDiscomfort'].filter(key => yes(f, key));
  const priorUPPPHelped = (f.get('priorUPPPHelped') || '').toLowerCase();
  const priorNasalHelped = (f.get('priorNasalHelped') || '').toLowerCase();
  const priorSinusHelped = (f.get('priorSinusHelped') || '').toLowerCase();
  const priorJawHelped = (f.get('priorJawHelped') || '').toLowerCase();
  const hgnsHelped = (f.get('hgnsHelped') || '').toLowerCase();
  const hgnsImplantYear = n(f.get('hgnsImplantYear'));
  const priorSleepStudyAnswer = (f.get('priorSleepStudyAnswer') || '').toLowerCase();
  const priorSleepStudyYear = n(f.get('priorSleepStudyYear'));
  const priorSleepStudyType = (f.get('priorSleepStudyType') || '').toLowerCase();
  const visitReason   = f.get('visitReason') || '';
  const prefAvoidCpap = yes(f,'prefAvoidCpap');
  const prefSurgery   = yes(f,'prefSurgery') || visitReason === 'surgery';
  const prefInspire   = yes(f,'prefInspire') || visitReason === 'inspire';
  const weightLossReadiness = f.get('weightLossReadiness') || '';
  const glp1Status = f.get('glp1Status') || '';
  const glp1Medication = f.get('glp1Medication') || '';
  const glp1Effective = f.get('glp1Effective') || '';
  const glp1Issues = ['glp1IssueNone','glp1IssueDigestive','glp1IssueCost','glp1IssueOther'].filter(key => yes(f, key));
  const cvdConditions = ['cvdHypertension','cvdCad','cvdHeartFailure','cvdArrhythmia','cvdStroke','cvdValve','cvdOther','cvdUnsure'].filter(key => yes(f, key));
  const chronicOpioidUse = f.get('chronicOpioidUse') || '';
  const neuromuscularRespiratoryRisk = f.get('neuromuscularRespiratoryRisk') || '';
  const hypoventilationRisk = f.get('hypoventilationRisk') || '';
  const severeInsomniaCompromisesHst = yes(f, 'severeInsomniaCompromisesHst');
  const nightVariabilityConcern = yes(f, 'nightVariabilityConcern');
  const severityPrecisionNeeded = yes(f, 'severityPrecisionNeeded');
  const lvef = n(f.get('lvef'));
  const lvefFollowupNeeded = yes(f, 'lvefFollowupNeeded') ||
    ((cvdConditions.includes('cvdHeartFailure') || (f.get('echoHistory') || '').toLowerCase() === 'yes') && !exists(lvef));
  const madDentition = f.get('madDentition') || '';
  const madProtrusion = f.get('madProtrusion') || '';
  const madTmj = f.get('madTmj') || '';

  // Derived flags
  const cpapFailed    = priorCpap && !cpapCurrent;
  const cpapRefused   = cpapFailed && cpapRetry === 'No';
  const cpapWillRetry = cpapFailed && (cpapRetry === 'Yes' || cpapRetry === 'Maybe');
  const encounter = buildEncounterContext(f, { cpapCurrent, prefAvoidCpap, prefSurgery, prefInspire });

  const psgRemAhi = n(f.get('ahiREM'));
  const hstRemAhi = n(f.get('remPahi'));
  const remAhi  = psgRemAhi ?? hstRemAhi;
  const nremAhi = n(f.get('ahiNREM')) ?? n(f.get('nremPahi'));
  const tst = n(f.get('tst'));
  const remPercent = studyType === 'psg' ? null : n(f.get('remPercent'));
  const usesHstStageEstimate = !exists(psgRemAhi) && exists(hstRemAhi) && ['watchpat', 'both'].includes(studyType);
  const remMinutes = usesHstStageEstimate && exists(tst) && exists(remPercent) ? tst * 60 * remPercent / 100 : null;
  const remStageAdequate = !exists(remMinutes) || remMinutes >= T.hstValidity.remMinimumMinutes;
  const remAhiForPhenotyping = remStageAdequate ? remAhi : null;
  const nremAhiForPhenotyping = remStageAdequate ? nremAhi : null;

  const sup     = n(f.get('ahiSup'))   ?? n(f.get('supPahi'));
  const nons    = n(f.get('ahiNonSup'))?? n(f.get('nonSupPahi'));
  const usesHstPositionEstimate = !exists(n(f.get('ahiSup'))) && !exists(n(f.get('ahiNonSup'))) &&
    exists(n(f.get('supPahi'))) && exists(n(f.get('nonSupPahi'))) && ['watchpat', 'both'].includes(studyType);
  const nonSupProvided = exists(n(f.get('ahiNonSup'))) || exists(n(f.get('nonSupPahi')));

  const odi   = n(f.get('odi')) ?? n(f.get('odiPsg'));
  const nadirRaw = n(f.get('nadir'));
  const nadirPsg = n(f.get('nadirPsg'));
  const nadir = exists(nadirRaw) || exists(nadirPsg) ? Math.min( nadirRaw??99 , nadirPsg??99 ) : null;

  const hbPH     = n(f.get('hbAreaPH')) ?? n(f.get('hbAreaPHpsg'));
  const hb90PH   = n(f.get('hbUnder90PH'));
  const t90      = n(f.get('t90')) ?? n(f.get('t90Psg'));

  const dhr      = DHR_ENABLED ? (n(f.get('dhr')) ?? n(f.get('dhrPsg'))) : null; // Delta Heart Rate (disabled via feature flag → null disables the whole ΔHR pathway)

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

  /* ── Loop Gain: qualitative only (no numeric estimate) ──
     The Schmickl 2022 regression (LG = β·AHI − β·Hyp%) has NO published intercept and
     only r=0.48 / AUC 0.73, so a per-patient point estimate over-implies precision and
     was removed (Phase 2, 2026-06). Possible ventilatory instability is now flagged
     qualitatively from the central / periodic-breathing signals below (see
     loopGainSupportCount). */

  /* ── Edwards ArTH Score (Edwards 2014) ──────────────────── */
  /* 3-variable clinical prediction of low arousal threshold:
     AHI <30 (+1), Nadir SpO₂ >82.5% (+1), Hypopnea fraction >58.3% (+1)
     Score ≥2 of 3 = likely low ArTH (84% accuracy). NOTE: that validated accuracy applies
     to the FULL 3-variable score. When the hypopnea fraction is unavailable (routine
     WatchPAT), a 2-of-3 partial score is computed and reported at LOW confidence — the 84%
     figure does not carry to the truncated score. */
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
    fHypopneas, studyType, usesHstStageEstimate, usesHstPositionEstimate,
    edwardsArTHScore: edwardsArTH?.score ?? 0,
    edwardsArTHMaxScore: edwardsArTH?.maxScore ?? 0
  };

  /* Shared diagnostic and oxygen signals. Event-linked HB research context and
     conventional nocturnal hypoxemia remain separate by design. */
  const diagnosticSignals = OSAReportShared.assessEncounterSignals({
    studyType, ahi, rdi: n(f.get('patRdi')), arInd, ess, isi,
    tst: n(f.get('tst')), remPercent, centralIndex: pahic3, csr, cai,
    hbPerHour: hbPH, hbAreaUnder90: hb90PH, odi, t90, nadir,
    visitReason,
    heartFailure: cvdConditions.includes('cvdHeartFailure'),
    strokeHistory: cvdConditions.includes('cvdStroke'),
    chronicOpioidUse: chronicOpioidUse === 'yes',
    neuromuscularRespiratoryRisk: neuromuscularRespiratoryRisk === 'yes',
    hypoventilationRisk: hypoventilationRisk === 'yes',
    severeInsomniaCompromisesHst,
  }, T);
  const patRdi = n(f.get('patRdi'));
  const ahiRdiDiscordanceConcern = studyType === 'watchpat' && exists(ahi) && exists(patRdi) && patRdi > 0 && (ahi / patRdi) < T.hstValidity.ahiRdiRatioLow;
  const nextTestGuidance = OSAReportShared.buildNextTestGuidance({
    studyType, ahi, signals: diagnosticSignals,
    severityPrecisionNeeded, nightVariabilityConcern, ahiRdiDiscordanceConcern,
  }, T);
  const severeNocturnalHypoxemia = diagnosticSignals.severeNocturnalHypoxemia;

  /* Central / periodic-breathing signal count → qualitative loop-gain flag. */
  const loopGainSupportCount =
    ((csr||0)    >= T.loopGain.csr    ? 1 : 0) +
    ((pahic3||0) >= T.loopGain.pahic3 ? 1 : 0) +
    ((pahic4||0) >= T.loopGain.pahic4 ? 1 : 0) +
    ((cai||0)    >= T.loopGain.pahic3 ? 1 : 0);

  /* Sex-specific neck threshold */
  const neckThreshold = (sex === 'F') ? T.anatomical.neck.female : T.anatomical.neck.male;

  /* ─── PHENOTYPES (suppressed until OSA is confirmed) ──────── */
  if (osaConfirmed) {
    const detected = detectPhenotypes({
      bmi, neck, neckThreshold, tons, mall, ahi,
      edwardsArTH,
      loopGainSupportCount, csr, pahic3, pahic4, cai, cvd,
      remAhi: remAhiForPhenotyping, nremAhi: nremAhiForPhenotyping, sup, nons,
      hbPH, odi, nadir, t90, hb90PH,
      noseScore, nasalObs, ctSeptum, ctTurbs, dhr
    }, T);
    out.phen = detected.phen;
    out.why = detected.why;
  }

  /* ─── TREATMENT MAPPING (delegated to mapTreatments — pure fn) ─── */
  const {
    recTags: generatedRecTags, friedmanStage, hnsStage, madResponseContext,
    hasConcentricCollapse, hasCOMISA, sleepyCOMISA,
  } = mapTreatments(f, {
    phen: out.phen,
    sex, bmi, neck, tons, mall, ahi, isi, ess, arInd, cvd, dhr, sup, nons,
    noseScore, nasalObs, ctSeptum, ctTurbs, retrognathia, fHypopneas, severeNocturnalHypoxemia,
    negativeHstNeedsPsg: diagnosticSignals.negativeHstNeedsPsg,
    priorCpap, cpapCurrent, cpapFailed, cpapRefused, cpapWillRetry, cpapReasons, cpapDifficulty,
    papMode: f.get('papMode') || '',
    prefAvoidCpap, prefSurgery, prefInspire,
    priorUPPP, priorNasal, priorSinus, priorJaw, priorMAD, priorInspire, madHelped, madTolerated, madProblems,
    priorUPPPHelped, priorNasalHelped, priorSinusHelped, hgnsHelped, hgnsImplantYear,
    priorSleepStudyAnswer, priorSleepStudyYear, priorSleepStudyType,
  }, T);
  const recTags = filterRecommendationsForEncounter(generatedRecTags, encounter);
  const recTexts = recTags.map(entry => entry.text);
  out.recs = recTexts;

  /* ─── CLINICIAN REPORT (delegated to buildClinicianReport — renderer) ─── */
  const {
    cHTML, subtype, guardedRecTexts, guardedRecEntries,
    insufficientDataDomains, treatmentSafetyChecks,
  } = buildClinicianReport(f, {
    ahi, bmi, cai, collapsibility, cpapCurrent, cpapFailed, cpapHelped, cpapReasons,
    cpapWillRetry, csr, ctSeptum, ctTurbs, ctxBase, cvd, dhr, edwardsArTH, ess, fHypopneas,
    friedmanStage, hasCOMISA, hasConcentricCollapse, hb90PH, hbPH, hnsStage,
    isi, loopGainSupportCount, lvef, madDentition, madProtrusion, madResponseContext, madTmj, mall,
    nadir, nasalObs, nons, noseScore, nremAhi, odi, osaConfirmed, out,
    oxygenCompositeSufficient, oxygenMetricCount, oxygenMetricsAvailable, pahic3, pahic4,
    prefAvoidCpap, prefInspire, prefSurgery, priorInspire, priorJaw, priorMAD, priorUPPP,
    priorNasal, priorSinus, cpapDifficulty, madHelped, madTolerated, madProblems,
    priorUPPPHelped, priorNasalHelped, priorSinusHelped, priorJawHelped, hgnsHelped, hgnsImplantYear,
    priorSleepStudyAnswer, priorSleepStudyYear, priorSleepStudyType, cvdConditions, lvefFollowupNeeded,
    glp1Status, glp1Medication, glp1Effective, glp1Issues,
    recTags, remAhi, remMinutes, remPercent, sex, sleepyCOMISA, sup, t90, tons, weightLossReadiness,
    encounter, nextTestGuidance, diagnosticSignals,
    chronicOpioidUse: chronicOpioidUse === 'yes',
    neuromuscularRespiratoryRisk: neuromuscularRespiratoryRisk === 'yes',
    hypoventilationRisk: hypoventilationRisk === 'yes',
    severeInsomniaCompromisesHst,
  }, T);

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
    pahi: n(f.get('pahi')),
    ahi,
    odi,
    nadir: n(f.get('nadir')),
    nadirPsg: n(f.get('nadirPsg')),
    supPahi: n(f.get('supPahi')),
    nonSupPahi: n(f.get('nonSupPahi')),
    remPahi: n(f.get('remPahi')),
    nremPahi: n(f.get('nremPahi')),
    remPercent,
    remMinutes,
    remStageAdequate,
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
    tst,
    arInd,
    cpapCurrent,
    cpapFailed,
    cpapWillRetry,
    cpapHelped,
    cpapDifficulty,
    cpapReasons,
    prefAvoidCpap,
    priorMAD,
    madHelped,
    madTolerated,
    madProblems,
    priorJaw,
    priorJawHelped,
    priorInspire,
    hgnsHelped,
    hgnsImplantYear,
    priorUPPP,
    priorUPPPHelped,
    priorNasal,
    priorNasalHelped,
    priorSinus,
    priorSinusHelped,
    priorSleepStudyAnswer,
    priorSleepStudyYear,
    priorSleepStudyType,
    prefSurgery,
    hasCOMISA,
    lvef,
    madDentition,
    madProtrusion,
    madTmj,
    madResponseContext,
    friedmanStage,
    hnsStage,
    hasConcentricCollapse,
    retrognathia,
    subtype,
    severity: ahiSeverity(ahi) || 'normal',
    primaryAHI: ahi,
    patRdi: n(f.get('patRdi')),
    patientName: (document.getElementById('patientName')?.value || '').trim(),
    reportDate: localIsoDate(),
    snoringReported: yes(f, 'snoringReported') || (n(f.get('snoreIdx')) != null && n(f.get('snoreIdx')) > 0),
    hypoxicBurdenSignal: diagnosticSignals.hypoxicBurdenSignal,
    hbIsaaccCohortContext: diagnosticSignals.hbIsaaccCohortContext,
    hbPooledTrialContext: diagnosticSignals.hbPooledTrialContext,
    severeNocturnalHypoxemia,
    oxygenMetricsAvailable,
    negativeHstNeedsPsg: diagnosticSignals.negativeHstNeedsPsg,
    nondiagnosticHstNeedsPsg: diagnosticSignals.nondiagnosticHstNeedsPsg,
    nextTestGuidance,
    insufficientDataDomains,
    treatmentSafetyChecks,
    apneaIndex,
    hypopneaIndex,
    fHypopneas,
    collapsibility,
    dhr,
    milestones: [...document.querySelectorAll('#patientMilestones input:checked')].map(cb => cb.value),
    studyType,
    cpapPressure: n(f.get('cpapPressure')),
    weightLossReadiness,
    glp1Status,
    glp1Medication,
    glp1Effective,
    glp1Issues,
    cvdConditions,
    lvefFollowupNeeded,
    alcoholNearBed: f.get('alcoholNearBed') || '',
    age: n(f.get('age')),
    visitReason: encounter.visitReason,
    visitReasonLabel: encounter.visitReasonLabel,
    visitReasonNote: encounter.visitReasonNote,
    planConfirmed: encounter.planConfirmed,
    planObserve: encounter.planObserve,
    planSummary: encounter.planSummary,
    selectedPlanFields: encounter.selectedPlanFields,
    papMode: f.get('papMode') || '',
    papMinPressure: n(f.get('papMinPressure')),
    papMaxPressure: n(f.get('papMaxPressure')),
    papCpapPressure: n(f.get('papCpapPressure')),
    papEpapPressure: n(f.get('papEpapPressure')),
    papIpapPressure: n(f.get('papIpapPressure')),
  };

  // Show the Generate Patient Report button
  const triggerEl = document.getElementById('patientReportTrigger');
  if (triggerEl) triggerEl.style.display = '';

  /* Render */
  const clinEl = document.getElementById('clinicianReport');
  clinEl.innerHTML = cHTML;
  initializeClinicalTooltips(clinEl);
  /* Wire clinician PDF download button */
  const btnCliPdf = document.getElementById('btnDownloadClinicianPdf');
  if(btnCliPdf) btnCliPdf.addEventListener('click', ()=> OSAPdfExport.exportClinicianPDF());
  const btnPreviewCliPdf = document.getElementById('btnPreviewClinicianPdf');
  if(btnPreviewCliPdf) btnPreviewCliPdf.addEventListener('click', ()=> OSAPdfExport.previewClinicianPDF());

  document.dispatchEvent(new CustomEvent('osa:analysis-complete', {
    detail: { analysisData: lastAnalysisData },
  }));

  /* Smooth scroll to results area */
  const scrollTarget = clinEl;
  if (scrollTarget) window.scrollTo({ top: scrollTarget.offsetTop - 80, behavior:'smooth' });
});

// ── Patient Report Overlay ──────────────────────────────────────
const reportOverlay = document.getElementById('reportOverlay');
const reportCloseButton = document.getElementById('btnCloseReport');
const saveReportSnapshotButton = document.getElementById('btnSaveReportSnapshot');
const reportEditButton = document.getElementById('btnEditReport');
const reportResetButton = document.getElementById('btnResetReportEdits');
const reportEditStatus = document.getElementById('reportEditStatus');
const reportPreviewContent = document.getElementById('reportPreviewContent');
const reportPreviewTitle = document.getElementById('reportPreviewTitle');
let lastReportTrigger = null;
let reportOriginalHtml = '';
let reportHasEdits = false;
let reportIsEditing = false;
let reportEditsSaved = false;

function setReportEditStatus(message) {
  if (reportEditStatus) reportEditStatus.textContent = message;
}

function getEditableReportRoot() {
  return reportPreviewContent?.querySelector('.patient-report') || null;
}

function getCleanReportPreviewHtml() {
  if (!reportPreviewContent) return '';
  const clone = reportPreviewContent.cloneNode(true);
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
    el.removeAttribute('aria-multiline');
    el.removeAttribute('spellcheck');
  });
  const cleanHtml = clone.innerHTML;
  return typeof PatientReport?.normalizePatientHandoutPunctuation === 'function'
    ? PatientReport.normalizePatientHandoutPunctuation(cleanHtml)
    : cleanHtml;
}

function setReportEditing(enabled, options = {}) {
  const root = getEditableReportRoot();
  reportIsEditing = Boolean(enabled && root);
  reportOverlay?.classList.toggle('report-editing', reportIsEditing);

  if (root) {
    if (reportIsEditing) {
      root.setAttribute('contenteditable', 'true');
      root.setAttribute('role', 'textbox');
      root.setAttribute('aria-label', 'Editable patient report');
      root.setAttribute('aria-multiline', 'true');
      root.setAttribute('spellcheck', 'true');
    } else {
      root.removeAttribute('contenteditable');
      root.removeAttribute('role');
      root.removeAttribute('aria-label');
      root.removeAttribute('aria-multiline');
      root.removeAttribute('spellcheck');
    }
  }

  if (reportEditButton) {
    reportEditButton.setAttribute('aria-pressed', reportIsEditing ? 'true' : 'false');
    reportEditButton.innerHTML = reportIsEditing
      ? '<i class="bi bi-check-lg"></i> Done Editing'
      : '<i class="bi bi-pencil"></i> Edit Report';
  }
  if (reportResetButton) reportResetButton.disabled = !reportHasEdits;

  if (!options.keepStatus) {
    setReportEditStatus(reportIsEditing
      ? 'Editing is on. Save the final version before PDF download.'
      : reportHasEdits
        ? 'Edited preview. Save a snapshot to keep it in the chart.'
        : 'Review before saving or downloading.');
  }
  if (reportIsEditing && options.focus !== false) window.setTimeout(() => root?.focus(), 0);
}

function getReportFocusableElements() {
  if (!reportOverlay) return [];
  return [...reportOverlay.querySelectorAll('button, [href], input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.disabled && el.offsetParent !== null);
}

function openReportOverlay(triggerEl, reportKind = 'profile') {
  if (!lastAnalysisData || !reportOverlay) return;
  const confirmation = document.getElementById('planConfirmed');
  const message = document.getElementById('planConfirmationMessage');
  const currentSelections = Object.keys(PLAN_FIELD_TO_TAGS).filter(field => document.querySelector(`[name="${field}"]`)?.checked);
  if (document.getElementById('planObserve')?.checked) currentSelections.push('planObserve');

  const showPlanMessage = text => {
    if (message) {
      message.textContent = text;
      message.classList.remove('d-none');
    }
    document.getElementById('cardVisitPlan')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!confirmation?.checked) {
    showPlanMessage('Confirm the plan reviewed with the patient before generating the patient report.');
    return;
  }
  if (!currentSelections.length) {
    showPlanMessage('Select at least one active pathway, or select Observe / follow up.');
    return;
  }

  const analyzedSelections = [...(lastAnalysisData.selectedPlanFields || [])];
  if (lastAnalysisData.planObserve) analyzedSelections.push('planObserve');
  if (!lastAnalysisData.planConfirmed || currentSelections.sort().join('|') !== analyzedSelections.sort().join('|')) {
    showPlanMessage('The plan changed after the last analysis. Click Generate Reports again, then open the patient report.');
    return;
  }
  message?.classList.add('d-none');
  lastReportTrigger = triggerEl || document.activeElement;
  const isTodayPlan = reportKind === 'today-plan';
  const html = isTodayPlan
    ? PatientReport.generateTodayPlanHTML(lastAnalysisData)
    : PatientReport.generateReportHTML(lastAnalysisData);
  openReportOverlayFromHtml(html, triggerEl, true, reportKind);
}

function openReportOverlayFromHtml(html, triggerEl, allowSnapshotSave = false, reportKind = 'saved') {
  if (!reportOverlay) return;
  lastReportTrigger = triggerEl || document.activeElement;
  reportOriginalHtml = html;
  reportHasEdits = false;
  reportEditsSaved = false;
  if (reportPreviewContent) reportPreviewContent.innerHTML = html;
  if (reportPreviewTitle) {
    reportPreviewTitle.textContent = reportKind === 'today-plan'
      ? "Today's Sleep Plan preview"
      : reportKind === 'profile'
        ? 'Full Sleep Profile preview'
        : 'Saved patient report preview';
  }
  reportOverlay.classList.add('active');
  document.body.classList.add('report-preview-open');
  if (saveReportSnapshotButton) saveReportSnapshotButton.disabled = !allowSnapshotSave;
  setReportEditing(false, { focus: false });
  window.setTimeout(() => reportCloseButton?.focus(), 0);
}

function closeReportOverlay(options = {}) {
  if (!reportOverlay) return false;
  if (reportHasEdits && !reportEditsSaved && !options.force) {
    const discard = window.confirm('This report has edits that are not saved to the chart. Close and discard them?');
    if (!discard) return false;
  }
  setReportEditing(false, { focus: false, keepStatus: true });
  reportOverlay.classList.remove('active');
  document.body.classList.remove('report-preview-open');
  const returnFocusEl = lastReportTrigger instanceof HTMLElement ? lastReportTrigger : document.getElementById('btnGenerateTodayPlan');
  returnFocusEl?.focus();
  return true;
}

document.getElementById('btnGenerateReport')?.addEventListener('click', (e) => {
  openReportOverlay(e.currentTarget, 'profile');
});

document.getElementById('btnGenerateTodayPlan')?.addEventListener('click', (e) => {
  openReportOverlay(e.currentTarget, 'today-plan');
});

reportEditButton?.addEventListener('click', () => {
  setReportEditing(!reportIsEditing);
});

reportResetButton?.addEventListener('click', () => {
  if (!reportHasEdits || !reportPreviewContent) return;
  if (!window.confirm('Reset all clinician edits and restore the generated report?')) return;
  reportPreviewContent.innerHTML = reportOriginalHtml;
  reportHasEdits = false;
  reportEditsSaved = false;
  setReportEditing(false, { focus: false });
  setReportEditStatus('Generated report restored.');
});

reportPreviewContent?.addEventListener('input', () => {
  if (!reportIsEditing) return;
  reportHasEdits = true;
  reportEditsSaved = false;
  if (reportResetButton) reportResetButton.disabled = false;
  setReportEditStatus('Editing is on. Save the final version before PDF download.');
});

/* Prevent pasted web content from bringing foreign fonts, colors, or hidden
   elements into a clinical handout. The clinician can still revise all text. */
reportPreviewContent?.addEventListener('paste', (event) => {
  if (!reportIsEditing) return;
  event.preventDefault();
  const plainText = event.clipboardData?.getData('text/plain') || '';
  document.execCommand('insertText', false, plainText);
});

async function saveCurrentReportSnapshot(triggerEl) {
  if (!lastAnalysisData || !window.OSAChartActions?.saveReportSnapshot) return;
  setReportEditing(false, { focus: false, keepStatus: true });
  const currentHtml = getCleanReportPreviewHtml();
  const savedPatient = await window.OSAChartActions.saveReportSnapshot({
    analysisData: lastAnalysisData,
    patientReportHtml: currentHtml,
    reportDate: lastAnalysisData.reportDate,
    patientName: lastAnalysisData.patientName,
    triggerEl,
  });
  if (!savedPatient) return false;
  reportEditsSaved = true;
  setReportEditStatus(reportHasEdits
    ? 'Edited report snapshot saved to the chart.'
    : 'Report snapshot saved to the chart.');
  return true;
}

document.getElementById('btnSaveReportSnapshot')?.addEventListener('click', async (e) => {
  await saveCurrentReportSnapshot(e.currentTarget);
});

reportCloseButton?.addEventListener('click', () => {
  closeReportOverlay();
});

document.getElementById('btnDownloadReportPdf')?.addEventListener('click', async () => {
  if (typeof OSAPdfExport !== 'undefined' && OSAPdfExport.exportPatientReportPDF) {
    setReportEditing(false, { focus: false, keepStatus: true });
    if (reportHasEdits && !reportEditsSaved) {
      const saveAndDownload = window.confirm('This edited report has not been saved to the chart. Save the final version and download it now?');
      if (!saveAndDownload) return;
      const saved = await saveCurrentReportSnapshot(document.getElementById('btnDownloadReportPdf'));
      if (!saved) return;
    }
    const result = await OSAPdfExport.exportPatientReportPDF();
    if (result) {
      setReportEditStatus(reportHasEdits
        ? 'PDF downloaded with the saved clinician edits.'
        : 'PDF downloaded.');
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (!reportOverlay?.classList.contains('active')) return;

  if (e.key === 'Escape') {
    if (reportIsEditing) {
      setReportEditing(false);
      reportEditButton?.focus();
      return;
    }
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
  isEditingPreview: () => reportIsEditing,
  hasUnsavedPreviewEdits: () => reportHasEdits && !reportEditsSaved,
  getPreviewHtml: () => getCleanReportPreviewHtml(),
};
