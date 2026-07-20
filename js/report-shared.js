'use strict';
/* ── Shared report / pathway helpers ──────────────────────────────────────
   Shared by js/patientReport.js and js/app.js to reduce rule drift.
   Exposes: OSAReportShared.buildCarePathway(), OSAReportShared.detectUARS(),
   OSAReportShared.assessEncounterSignals(), OSAReportShared.buildNextTestGuidance()
   ─────────────────────────────────────────────────────────────────────── */

var OSAReportShared = (() => {
  function exists(value) {
    return value !== null && value !== undefined && value !== '';
  }

  function detectUARS({ ahi, rdi, arInd, ess, isi }) {
    const ahiVal = Number.isFinite(+ahi) ? +ahi : null;
    const rdiVal = Number.isFinite(+rdi) ? +rdi : null;
    const arIndVal = Number.isFinite(+arInd) ? +arInd : null;
    const essVal = Number.isFinite(+ess) ? +ess : null;
    const isiVal = Number.isFinite(+isi) ? +isi : null;

    const rdiElevated = exists(rdiVal) && exists(ahiVal) && rdiVal > ahiVal * 1.5 && rdiVal >= 10;
    const symptomatic = (exists(essVal) && essVal >= 10) || (exists(isiVal) && isiVal >= 10);
    const isUARS = exists(ahiVal) && ahiVal < 5 && symptomatic && (rdiElevated || (exists(arIndVal) && arIndVal >= 15));

    return {
      isUARS,
      rdiElevated,
      symptomatic,
      ahi: ahiVal,
      rdi: rdiVal,
      arInd: arIndVal,
    };
  }

  /* Positional OSA is defined by a supine AHI at least twice the
     non-supine AHI. A non-supine AHI below 5 is a supine-isolated pattern;
     persistent OSA off the back is supine-predominant and makes positional
     therapy adjunctive. This classification does not prove monotherapy will
     work because the app does not capture adequate non-supine time or
     non-supine REM exposure. Srijithesh 2019; Lastra 2025. */
  function classifyPositionalPattern({ supineAhi, nonSupineAhi, ratioThreshold = 2 } = {}) {
    const supine = Number.isFinite(+supineAhi) && +supineAhi >= 0 ? +supineAhi : null;
    const nonSupine = Number.isFinite(+nonSupineAhi) && +nonSupineAhi >= 0 ? +nonSupineAhi : null;
    if (supine === null || nonSupine === null) {
      return { evaluable: false, positional: false, type: 'unresolved', ratio: null, monotherapyPotential: false };
    }
    const ratio = nonSupine === 0 ? (supine > 0 ? Infinity : null) : supine / nonSupine;
    const positional = ratio !== null && ratio >= ratioThreshold;
    const type = !positional ? 'non-positional' : nonSupine < 5 ? 'supine-isolated' : 'supine-predominant';
    return {
      evaluable: true,
      positional,
      type,
      ratio,
      supineAhi: supine,
      nonSupineAhi: nonSupine,
      monotherapyPotential: positional && nonSupine < 5,
    };
  }

  /* Shared encounter signals used by the MA plan draft and the final clinical
     analysis. This keeps diagnostic and safety escalation rules from appearing
     only after the plan has already been drafted. */
  function assessEncounterSignals({
    studyType = 'watchpat',
    ahi,
    rdi,
    arInd,
    ess,
    isi,
    tst,
    remPercent,
    centralIndex,
    csr,
    cai,
    hbPerHour,
    hbAreaUnder90,
    odi,
    t90,
    nadir,
    visitReason,
    heartFailure = false,
    strokeHistory = false,
    chronicOpioidUse = false,
    neuromuscularRespiratoryRisk = false,
    hypoventilationRisk = false,
    severeInsomniaCompromisesHst = false,
  } = {}, thresholds = {}) {
    const numberOrNull = value => (value !== '' && value !== null && value !== undefined && Number.isFinite(+value)) ? +value : null;
    const ahiVal = numberOrNull(ahi);
    const tstVal = numberOrNull(tst);
    const remPercentVal = numberOrNull(remPercent);
    const centralIndexVal = numberOrNull(centralIndex);
    const csrVal = numberOrNull(csr);
    const caiVal = numberOrNull(cai);
    const hbVal = numberOrNull(hbPerHour);
    const hb90Val = numberOrNull(hbAreaUnder90);
    const odiVal = numberOrNull(odi);
    const t90Val = numberOrNull(t90);
    const nadirVal = numberOrNull(nadir);
    const hst = thresholds.hstValidity || {};
    const hb = thresholds.hypoxicBurden || {};
    const oxygen = thresholds.nocturnalHypoxemia || {};
    const loopGain = thresholds.loopGain || {};
    const isHomeStudy = studyType === 'watchpat' || studyType === 'both';
    const isHomeStudyOnly = studyType === 'watchpat';
    const remMinutes = tstVal !== null && remPercentVal !== null
      ? tstVal * 60 * (remPercentVal / 100)
      : null;
    const shortRecording = isHomeStudy && tstVal !== null && tstVal < (hst.tstWarning ?? 4);
    const inadequateRecording = isHomeStudy && tstVal !== null && tstVal < (hst.tstDanger ?? 2);
    const limitedRemSampling = isHomeStudy && remMinutes !== null && remMinutes < (hst.remMinimumMinutes ?? 30);
    const centralPercent = centralIndexVal !== null && ahiVal !== null && ahiVal > 0
      ? (centralIndexVal / ahiVal) * 100
      : null;
    const centralSignal = isHomeStudy && (
      (centralPercent !== null && centralPercent > (hst.centralPctWarning ?? 25)) ||
      (csrVal !== null && csrVal >= (loopGain.csr ?? 15))
    );
    const hasPsgCentralConfirmation = studyType === 'psg' || (studyType === 'both' && caiVal !== null);
    const uars = detectUARS({ ahi: ahiVal, rdi, arInd, ess, isi });
    const normalHomeStudy = isHomeStudyOnly && ahiVal !== null && ahiVal < 5;
    // Simultaneous WatchPAT/PSG comparisons show the weakest severity-category
    // agreement in the mild and moderate ranges. This is an interpretation
    // boundary, not a declaration that a technically adequate study is invalid
    // (Iftikhar et al., 2022; Ioachimescu et al., 2020).
    const watchpatSeverityUncertain = isHomeStudyOnly && ahiVal !== null && ahiVal >= 5 && ahiVal < 30;
    // AASM recommends PSG rather than HSAT for initial diagnosis when defined
    // complicating conditions are present. Only conditions captured explicitly
    // by the current app are evaluated here; do not infer the others.
    const psgPreferredReasons = [
      heartFailure ? 'significant cardiorespiratory disease' : '',
      strokeHistory ? 'history of stroke or TIA' : '',
      chronicOpioidUse ? 'chronic opioid use' : '',
      neuromuscularRespiratoryRisk ? 'possible respiratory muscle weakness' : '',
      hypoventilationRisk ? 'awake hypoventilation or suspected sleep-related hypoventilation' : '',
      severeInsomniaCompromisesHst ? 'severe insomnia likely to compromise home testing' : '',
    ].filter(Boolean);
    const psgPreferredComorbidity = isHomeStudyOnly && psgPreferredReasons.length > 0;
    // Fatigue is not interchangeable with sleep propensity, so the clinician's
    // symptom-focused visit selection also counts as persistent concern even
    // when the Epworth score is below 10. Isolated snoring does not.
    const persistentClinicalConcern = uars.symptomatic || visitReason === 'symptoms';
    // AASM diagnostic-testing guideline: after one negative, inconclusive, or
    // technically inadequate HSAT, obtain PSG when OSA concern remains rather
    // than treating another home result as definitive (Kapur et al., 2017).
    const negativeHstNeedsPsg = normalHomeStudy && persistentClinicalConcern;
    const nondiagnosticHstNeedsPsg = isHomeStudyOnly && shortRecording;
    // Keep event-linked HB separate from conventional oxygen metrics. HB cohort
    // cut points are research context, not validated treatment thresholds.
    const hypoxicBurdenSignal = hbVal !== null && hbVal >= (hb.signalBoundary ?? 30);
    const hbIsaaccCohortContext = hbVal !== null && hbVal >= (hb.isaaccCohortContext ?? 73.1);
    const hbPooledTrialContext = hbVal !== null && hbVal >= (hb.pooledTrialContext ?? 87.1);
    const severeNocturnalHypoxemia =
      (odiVal !== null && odiVal > (oxygen.odiSevere ?? 50)) ||
      (nadirVal !== null && nadirVal < (oxygen.nadirSevere ?? 75)) ||
      (t90Val !== null && t90Val > (oxygen.t90Severe ?? 20)) ||
      (hb90Val !== null && hb90Val > (oxygen.areaUnder90Severe ?? 2));

    return {
      uars,
      isHomeStudy,
      normalHomeStudy,
      watchpatSeverityUncertain,
      psgPreferredComorbidity,
      psgPreferredReasons,
      persistentClinicalConcern,
      remMinutes,
      shortRecording,
      inadequateRecording,
      limitedRemSampling,
      negativeHstNeedsPsg,
      nondiagnosticHstNeedsPsg,
      centralPercent,
      centralSignal,
      centralConfirmationNeeded: centralSignal && !hasPsgCentralConfirmation,
      hypoxicBurdenSignal,
      hbIsaaccCohortContext,
      hbPooledTrialContext,
      severeNocturnalHypoxemia,
    };
  }

  /* Clinician-only next-test guidance. This deliberately separates test
     interpretation from the finalized plan: it never selects planStudy and it
     is not patient-facing unless the clinician later confirms diagnostic
     testing. AASM 2017 supplies the PSG escalation rules; selective multi-night
     HST is an emerging option for suspected night-to-night variability, not a
     routine replacement for PSG (Fricke et al., 2026 Delphi consensus). */
  function buildNextTestGuidance(input = {}, thresholds = {}) {
    const signals = input.signals || assessEncounterSignals(input, thresholds);
    const numberOrNull = value => (value !== '' && value !== null && value !== undefined && Number.isFinite(+value)) ? +value : null;
    const ahi = numberOrNull(input.ahi);
    const hasCompletedStudy = ahi !== null || input.studyType === 'psg' || input.studyType === 'both';
    if (!hasCompletedStudy) return null;

    const psgReasons = [];
    if (signals.inadequateRecording || signals.shortRecording) psgReasons.push('the home study was technically inadequate or too short for a reliable decision');
    if (signals.centralConfirmationNeeded) psgReasons.push('central or periodic-breathing signals require laboratory confirmation');
    if (signals.uars?.isUARS) psgReasons.push('arousal-based scoring is needed to evaluate possible upper airway resistance syndrome');
    if (signals.psgPreferredComorbidity) psgReasons.push(...signals.psgPreferredReasons);

    if (psgReasons.length) {
      return {
        state: 'psg-recommended',
        label: 'PSG recommended',
        title: 'In-lab polysomnography is recommended',
        reason: psgReasons.join('; '),
        action: 'Review the indication, draft diagnostic testing if it fits today\'s decision, and obtain clinician confirmation before it appears in the patient plan.',
        evidence: 'AASM recommends in-lab polysomnography after a negative, inconclusive, or technically inadequate home test and instead of home testing when specified complicating conditions are present.',
      };
    }

    const considerReasons = [];
    if (signals.negativeHstNeedsPsg) considerReasons.push('the home study is negative, but symptoms or clinical concern remain unexplained');
    if (input.severityPrecisionNeeded && signals.watchpatSeverityUncertain) considerReasons.push('a different mild-versus-moderate severity category would materially change management, eligibility, or risk assessment');
    if (input.ahiRdiDiscordanceConcern) considerReasons.push('AHI and RDI are substantially discordant and the result does not fit the clinical picture');
    if (signals.limitedRemSampling && input.severityPrecisionNeeded) considerReasons.push('REM sampling is limited and REM-specific severity would change management');

    if (considerReasons.length) {
      return {
        state: 'psg-consider',
        label: 'Consider PSG',
        title: 'In-lab polysomnography is reasonable to consider',
        reason: considerReasons.join('; '),
        action: signals.negativeHstNeedsPsg
          ? 'Decide whether to obtain PSG now or first treat another plausible contributor, such as nasal obstruction, then reassess persistent symptoms. Confirm the choice before patient reporting.'
          : 'Decide whether laboratory confirmation would change today\'s management enough to justify testing, then confirm or dismiss the draft suggestion.',
        evidence: 'AASM supports PSG when suspicion remains after a negative home test. WatchPAT severity agreement is weakest in mild and moderate OSA, which supports selective rather than automatic confirmation.',
      };
    }

    if (input.nightVariabilityConcern && signals.isHomeStudy) {
      return {
        state: 'multi-night-hst',
        label: 'Selective multi-night HST',
        title: 'Selective multi-night home testing may be useful',
        reason: 'The clinician marked meaningful night-to-night variability as a concern, and no current feature makes PSG the preferred test.',
        action: 'If chosen, use the same validated device for approximately three valid nights and review both the average and range. Use PSG instead when excluding disease or another sleep disorder requires greater diagnostic detail.',
        evidence: 'Recent expert consensus supports selective multi-night home testing for suspected variability or borderline, incongruent results, but not routine multi-night testing for every patient.',
      };
    }

    return {
      state: 'no-additional-test',
      label: 'No additional test now',
      title: 'No additional diagnostic testing is indicated now',
      reason: 'The current study and chart inputs do not trigger a repeat-HST or PSG escalation rule.',
      action: 'Proceed with the clinician-confirmed care plan. Reassess testing if symptoms, weight, treatment response, or the clinical question later become discordant with the current result.',
      evidence: 'This is a rule-based workflow conclusion, not proof that future testing will never be needed.',
    };
  }

  /* A single PAP-state vocabulary is shared by the clinician and patient
     reports. Keep presentation labels downstream; this helper only resolves
     the clinical/workflow state so copy cannot drift between surfaces. */
  function resolvePapState({
    cpapCurrent = false,
    cpapFailed = false,
    cpapWillRetry = false,
    prefAvoidCpap = false,
    hasPapPlan = false,
  } = {}) {
    if (cpapCurrent) return 'continuing';
    if (cpapFailed && cpapWillRetry) return 'retrying';
    if (cpapFailed) return 'discontinued';
    if (prefAvoidCpap) return 'avoiding';
    if (hasPapPlan) return 'starting';
    return 'not-planned';
  }

  function buildCarePathway({
    milestones,
    studyType,
    hasStudyData,
    hasPatientContext,
    labels,
    papState = 'not-planned',
    preferredPath = null,
  }) {
    const ms = Array.isArray(milestones) ? milestones : [];
    const studyLabel = studyType === 'psg'
      ? labels.study.psg
      : studyType === 'watchpat'
        ? labels.study.watchpat
        : labels.study.default;

    const surgicalKeys = ['DISE Scheduled', 'DISE Completed', 'Surgery Scheduled', 'Post-Op'];
    const cpapKeys = ['CPAP Trial', 'CPAP Follow-up'];
    const madKeys = ['MAD Referred', 'MAD Follow-up'];

    let detectedPath = 'generic';
    if (surgicalKeys.some(key => ms.includes(key))) detectedPath = 'surgical';
    else if (cpapKeys.some(key => ms.includes(key))) detectedPath = 'cpap';
    else if (madKeys.some(key => ms.includes(key))) detectedPath = 'mad';
    else if (['cpap', 'surgical', 'mad'].includes(preferredPath)) detectedPath = preferredPath;

    const stages = [
      { id: 'eval', label: labels.eval, keys: ['Initial Eval'] },
      { id: 'study', label: studyLabel, keys: ['Study Ordered', 'Study Reviewed'] },
    ];

    if (detectedPath === 'cpap') {
      const trialLabel = ({
        retrying: labels.cpap.retry,
        continuing: labels.cpap.current,
        discontinued: labels.cpap.completed,
        avoiding: labels.cpap.considered,
      })[papState] || labels.cpap.trial;
      const followupLabel = ['discontinued', 'avoiding'].includes(papState)
        ? (labels.cpap.alternatives || labels.cpap.followup)
        : labels.cpap.followup;
      stages.push({ id: 'cpap-trial', label: trialLabel || labels.cpap.trial, keys: ['CPAP Trial'] });
      stages.push({ id: 'cpap-followup', label: followupLabel, keys: ['CPAP Follow-up'] });
      stages.push({ id: 'ongoing', label: labels.cpap.ongoing, keys: [] });
    } else if (detectedPath === 'surgical') {
      stages.push({ id: 'planning', label: labels.surgical.planning, keys: ['Treatment Plan'] });
      if (ms.includes('DISE Scheduled') || ms.includes('DISE Completed')) {
        stages.push({ id: 'dise', label: labels.surgical.dise, keys: ['DISE Scheduled', 'DISE Completed'] });
      }
      stages.push({ id: 'surgery', label: labels.surgical.surgery, keys: ['Surgery Scheduled'] });
      stages.push({ id: 'postop', label: labels.surgical.postop, keys: ['Post-Op'] });
      if (ms.includes('Efficacy Study')) {
        stages.push({ id: 'efficacy', label: labels.surgical.efficacy, keys: ['Efficacy Study'] });
      }
    } else if (detectedPath === 'mad') {
      stages.push({ id: 'mad-referral', label: labels.mad.referral, keys: ['MAD Referred'] });
      stages.push({ id: 'mad-followup', label: labels.mad.followup, keys: ['MAD Follow-up'] });
      if (ms.includes('Efficacy Study')) {
        stages.push({ id: 'efficacy', label: labels.mad.efficacy, keys: ['Efficacy Study'] });
      }
    } else {
      stages.push({ id: 'planning', label: labels.generic.planning, keys: ['Treatment Plan'] });
      stages.push({ id: 'treatment', label: labels.generic.treatment, keys: [] });
    }

    let currentIdx = -1;
    stages.forEach((stage, index) => {
      if (stage.keys.some(key => ms.includes(key))) currentIdx = index;
    });

    if (ms.includes('New Sleep Study')) currentIdx = 1;

    const studyStageIdx = stages.findIndex(stage => stage.id === 'study');
    if (hasStudyData && studyStageIdx >= 0 && currentIdx <= studyStageIdx) {
      currentIdx = Math.min(studyStageIdx + 1, stages.length - 1);
    }

    /* A documented failed/declined trial means the trial itself is no longer
       the active step, even when the historical CPAP Trial milestone is the
       latest checked box. Advance to the alternatives/review stage. */
    if (detectedPath === 'cpap' && ['discontinued', 'avoiding'].includes(papState)) {
      const followupIdx = stages.findIndex(stage => stage.id === 'cpap-followup');
      if (followupIdx >= 0) currentIdx = Math.max(currentIdx, followupIdx);
    }

    if (currentIdx < 0 && hasPatientContext) currentIdx = 0;

    return { stages, currentIdx, detectedPath };
  }

  return {
    buildCarePathway,
    detectUARS,
    classifyPositionalPattern,
    assessEncounterSignals,
    buildNextTestGuidance,
    resolvePapState,
  };
})();
