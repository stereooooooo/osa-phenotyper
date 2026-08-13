(function () {
  'use strict';

  const isLocalHost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  if (!isLocalHost || !window.__OSA_DEMO_MODE__) return;

  const state = {
    mainPatientId: null,
    safetyPatientId: null,
  };

  const WATCHPAT_FIELDS = [
    ['age', 'Age', '48'], ['sex', 'Sex', 'M'], ['bmi', 'BMI', '28.6'],
    ['neck', 'Neck Circ (in)', '16.5'], ['ess', 'Epworth (ESS)', '12'],
    ['pahi', 'pAHI (overall)', '28'], ['remPahi', 'pAHI REM', '32'],
    ['nremPahi', 'pAHI NREM', '27'], ['odi', 'ODI 4%', '25'],
    ['patRdi', 'PAT RDI', '30'], ['pahic', 'pAHIc 3%', '0.8'],
    ['pahic4', 'pAHIc 4%', '0.4'], ['csr', '% CSR', '0'],
    ['nadir', 'Min SpO2 (%)', '83'], ['hbAreaPH', 'HB per hour', '24'],
    ['hbUnder90PH', 'Area <90% per hour', '0.6'], ['tst', 'Total Sleep Time (hrs)', '6.2'],
    ['remPercent', 'REM sleep (%)', '22'], ['supPahi', 'Supine pAHI', '31'],
    ['nonSupPahi', 'Non-Supine pAHI', '26'], ['snoreIdx', 'Snoring (dB mean)', '47'],
  ].map(([name, label, value]) => ({ name, label, value, confidence: 'high' }));

  function totalScale(scale) {
    return Object.values(scale || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function mapIntakeToFormData(data) {
    const height = Number(data.heightInches || 0);
    const weight = Number(data.weightLbs || 0);
    const bmi = height > 0 ? Math.round(((weight * 703) / (height * height)) * 10) / 10 : '';
    const prior = data.priorTreatments || {};
    const outcomes = data.treatmentOutcomes || {};
    const cardiovascular = data.cardiovascularHistory || {};
    const cpap = data.cpapHistory || null;
    const formData = {
      visitReason: data.visitReason || '',
      sex: data.sex || '',
      bmi,
      ess: totalScale(data.ess),
      isi: totalScale(data.isi),
      noseScore: totalScale(data.nose) * 5,
      nasalObs: data.nasalObs ? 'on' : '',
      snoringReported: data.snoringReported ? 'on' : '',
      alcoholNearBed: data.alcoholNearBed || '',
      prefAvoidCpap: data.preferences?.avoidCpap ? 'on' : '',
      prefSurgery: data.preferences?.openToSurgery ? 'on' : '',
      prefInspire: data.preferences?.interestedInInspire ? 'on' : '',
      priorUPPP: prior.uppp ? 'on' : '',
      priorNasal: prior.nasalSurgery ? 'on' : '',
      priorSinus: prior.sinusSurgery ? 'on' : '',
      priorJaw: prior.jawSurgery ? 'on' : '',
      priorInspire: prior.inspire ? 'on' : '',
      priorMAD: prior.mad ? 'on' : '',
      priorSleepStudy: data.sleepStudyHistory?.historyAnswer === 'yes' ? 'on' : '',
      priorSleepStudyAnswer: data.sleepStudyHistory?.historyAnswer || '',
      priorSleepStudyType: data.sleepStudyHistory?.studyType || '',
      priorSleepStudyYear: data.sleepStudyHistory?.approximateYear || '',
      madHelped: outcomes.mad?.helped || '',
      madTolerated: outcomes.mad?.tolerated || '',
      cvd: cardiovascular.hasCvd ? 'on' : '',
      cvdHistoryAnswer: cardiovascular.historyAnswer || '',
      echoHistory: cardiovascular.echoHistory || '',
      echoResultKnowledge: cardiovascular.resultKnowledge || '',
      chronicOpioidUse: data.sleepTestingRisks?.chronicOpioidUse || '',
      neuromuscularRespiratoryRisk: data.sleepTestingRisks?.neuromuscularRespiratoryRisk || '',
      hypoventilationRisk: data.sleepTestingRisks?.hypoventilationRisk || '',
      weightLossReadiness: data.weightLossReadiness || '',
      glp1Status: data.glp1History?.status || '',
    };

    if (cpap?.priorCpap) {
      Object.assign(formData, {
        priorCpap: 'on',
        cpapCurrent: cpap.currentlyUsing ? 'on' : '',
        cpapHelped: cpap.helped || '',
        cpapRetry: cpap.retryWilling || '',
        cpapDifficulty: cpap.hasDifficulty || '',
      });
      const reasonFields = {
        mask: 'cpapMask', claustrophobia: 'cpapClaustro', dryMouth: 'cpapDry',
        leaks: 'cpapLeaks', troubleSleeping: 'cpapSleep', skinIrritation: 'cpapSkin',
        noImprovement: 'cpapNoImprove', travel: 'cpapTravel',
      };
      (cpap.reasonsStopped || []).forEach(reason => {
        if (reasonFields[reason]) formData[reasonFields[reason]] = 'on';
      });
    }
    return formData;
  }

  function updateDemoStatus(message) {
    const status = document.getElementById('osaDemoStatus');
    if (status) status.textContent = message;
  }

  function installGuide() {
    if (document.getElementById('osaDemoGuide')) return;
    const guide = document.createElement('aside');
    guide.id = 'osaDemoGuide';
    guide.className = 'osa-demo-guide';
    guide.setAttribute('aria-label', 'Synthetic demo guide');
    guide.innerHTML = `
      <div class="osa-demo-guide__intro">
        <strong>Demo</strong>
        <span id="osaDemoStatus">Morgan Lee is ready for the patient questionnaire.</span>
      </div>
      <div class="osa-demo-guide__steps">
        <button type="button" class="btn btn-sm btn-primary" data-demo-action="questionnaire">1. Patient questionnaire</button>
        <button type="button" class="btn btn-sm btn-outline-primary" data-demo-action="prep">2. Staff review</button>
        <button type="button" class="btn btn-sm btn-outline-primary" data-demo-action="clinician">3. Clinician review</button>
        <button type="button" class="btn btn-sm btn-outline-primary" data-demo-action="reports">4. Reports</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-demo-action="counterexample">Safety counterexample</button>
      </div>`;
    const app = document.getElementById('appContainer');
    app?.insertAdjacentElement('afterbegin', guide);

    guide.addEventListener('click', async event => {
      const action = event.target.closest('[data-demo-action]')?.dataset.demoAction;
      if (!action) return;
      if (action === 'questionnaire') {
        document.getElementById('btnIntakeLink')?.click();
      } else if (action === 'prep') {
        window.OSAWorkspaceView?.setMode('prep');
        document.getElementById('sleepStudyWatchpat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateDemoStatus('Staff review: the prior WatchPAT results are already entered and ready for clinician review.');
      } else if (action === 'clinician') {
        window.OSAWorkspaceView?.setMode('clinician');
        document.getElementById('clinicianBriefing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (action === 'reports') {
        window.OSAWorkspaceView?.setMode('clinician');
        document.getElementById('analysisActions')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (action === 'counterexample' && state.safetyPatientId) {
        await window.OSAWorkspace.openChart(state.safetyPatientId);
        window.OSAWorkspaceView?.setMode('clinician');
        updateDemoStatus('Safety case: complete concentric collapse should block unilateral Inspire. Generate reports to show the guardrail.');
      }
    });
  }

  async function seedDemo() {
    installGuide();
    const documentedWatchpat = Object.fromEntries(
      WATCHPAT_FIELDS.map(field => [field.name, field.value])
    );
    const main = await OSADatabase.createPatient({
      name: 'LEE, Morgan', dob: '1978-05-14', mrn: 'DEMO-001', status: 'Study Reviewed',
      milestones: ['Initial Eval', 'Study Reviewed'],
      formData: {
        ...documentedWatchpat,
        visitReason: 'inspire', tonsils: '2', ftp: 'III', neck: '16.5',
        retrognathia: 'mild', ctTurbs: 'on', studyType: 'watchpat',
        alcoholNearBed: 'none',
        planInspire: 'on', planConfirmed: 'on',
        planSummary: 'Complete DISE and the device-specific Inspire candidacy evaluation; if proceeding, perform turbinate reduction during the same anesthetic.',
      },
    });
    const safety = await OSADatabase.createPatient({
      name: 'DEMO, Safety Boundary', dob: '1970-02-18', mrn: 'DEMO-CCC', status: 'Treatment Planning',
      milestones: ['Initial Eval', 'HST Complete', 'DISE Completed'],
      formData: {
        visitReason: 'inspire', sex: 'M', bmi: '31', neck: '17', tonsils: '2', ftp: 'III',
        studyType: 'watchpat', pahi: '26', remPahi: '34', nremPahi: '22', odi: '22', nadir: '85',
        tst: '6.1', remPercent: '21', priorCpap: 'on', cpapCurrent: '', cpapHelped: 'No',
        cpapRetry: 'No', prefInspire: 'on', vDeg: '2', vPat: 'Concentric',
      },
    });
    state.mainPatientId = main.patientId;
    state.safetyPatientId = safety.patientId;
    await window.OSAWorkspace.openChart(main.patientId);
    window.OSAWorkspaceView?.setMode('clinician');
  }

  async function handleDemoIntakeSubmission(data) {
    if (!data || data.type !== 'osa-demo-intake-submitted') return;
    const patientId = window.__OSA_WORKFLOW_TEST__?.resolveIntakePatientId(data.token) || state.mainPatientId;
    if (!patientId || data.questionnaireType !== 'intake') return;
    const pending = mapIntakeToFormData(data.payload || {});
    // The chart already contains the actual WatchPAT report. Keep the demo
    // focused on those documented results rather than separately presenting
    // the patient's recollection of that same study or an unrelated weight
    // conversation during this Inspire-focused encounter.
    ['priorSleepStudy', 'priorSleepStudyAnswer', 'priorSleepStudyType', 'priorSleepStudyYear',
      'weightLossReadiness', 'glp1Status'].forEach(field => delete pending[field]);
    window.__OSA_WORKFLOW_TEST__.injectIntakeSubmission(patientId, pending);
    await window.OSAWorkspace.openChart(patientId);
    window.OSAWorkspaceView?.setMode('prep');
    updateDemoStatus('Questionnaire received. Staff can review patient-reported changes alongside the documented WatchPAT results.');
  }

  window.addEventListener('message', async event => {
    if (event.origin !== window.location.origin) return;
    await handleDemoIntakeSubmission(event.data);
  });

  window.addEventListener('storage', async event => {
    if (event.key !== 'osa-demo-intake-submission' || !event.newValue) return;
    try {
      await handleDemoIntakeSubmission(JSON.parse(event.newValue));
    } catch (_) { /* malformed demo-only browser storage is ignored */ }
  });

  document.addEventListener('osa:workspace-ready', () => {
    seedDemo().catch(error => updateDemoStatus(`Demo setup failed: ${error.message}`));
  }, { once: true });

  window.OSAInspireDemo = Object.freeze({
    getMainPatientId: () => state.mainPatientId,
    getSafetyPatientId: () => state.safetyPatientId,
  });
})();
