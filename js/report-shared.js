'use strict';
/* ── Shared report / pathway helpers ──────────────────────────────────────
   Shared by js/patientReport.js and js/app.js to reduce rule drift.
   Exposes: OSAReportShared.buildCarePathway(), OSAReportShared.detectUARS()
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
    resolvePapState,
  };
})();
