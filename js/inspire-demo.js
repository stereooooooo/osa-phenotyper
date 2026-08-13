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
    ['pahi', 'pAHI (overall)', '28'], ['remPahi', 'pAHI REM', '41'],
    ['nremPahi', 'pAHI NREM', '23'], ['odi', 'ODI 4%', '25'],
    ['patRdi', 'PAT RDI', '31'], ['pahic', 'pAHIc 3%', '0.8'],
    ['pahic4', 'pAHIc 4%', '0.4'], ['csr', '% CSR', '0'],
    ['nadir', 'Min SpO2 (%)', '83'], ['hbAreaPH', 'HB per hour', '36'],
    ['hbUnder90PH', 'Area <90% per hour', '1.1'], ['tst', 'Total Sleep Time (hrs)', '6.2'],
    ['remPercent', 'REM sleep (%)', '22'], ['supPahi', 'Supine pAHI', '39'],
    ['nonSupPahi', 'Non-Supine pAHI', '16'], ['snoreIdx', 'Snoring (dB mean)', '47'],
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
        <button type="button" class="btn btn-sm btn-outline-primary" data-demo-action="prep">2. Staff prep</button>
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
        document.getElementById('pdfImportSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  function installSyntheticImport() {
    const status = document.getElementById('pdfStatus');
    if (!status || document.getElementById('btnDemoWatchpat')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'btnDemoWatchpat';
    button.className = 'btn btn-sm btn-outline-primary mt-2';
    button.innerHTML = '<i class="bi bi-stars"></i> Review synthetic WatchPAT values';
    status.insertAdjacentElement('afterend', button);
    button.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('osa:demo-watchpat', {
        detail: { fields: WATCHPAT_FIELDS, notFound: [] },
      }));
    });
  }

  async function seedDemo() {
    installGuide();
    installSyntheticImport();
    const main = await OSADatabase.createPatient({
      name: 'LEE, Morgan', dob: '1978-05-14', mrn: 'DEMO-001', status: 'Initial Eval',
      milestones: ['Initial Eval'],
      formData: {
        visitReason: 'inspire', tonsils: '2', ftp: 'III', neck: '16.5',
        retrognathia: 'mild', alcoholNearBed: 'none',
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

  window.addEventListener('message', async event => {
    if (event.origin !== window.location.origin || event.data?.type !== 'osa-demo-intake-submitted') return;
    const patientId = window.__OSA_WORKFLOW_TEST__?.resolveIntakePatientId(event.data.token) || state.mainPatientId;
    if (!patientId || event.data.questionnaireType !== 'intake') return;
    const pending = mapIntakeToFormData(event.data.payload || {});
    window.__OSA_WORKFLOW_TEST__.injectIntakeSubmission(patientId, pending);
    await window.OSAWorkspace.openChart(patientId);
    window.OSAWorkspaceView?.setMode('prep');
    updateDemoStatus('Questionnaire received. Staff can review patient-reported changes, then import the synthetic sleep study.');
  });

  document.addEventListener('osa:workspace-ready', () => {
    seedDemo().catch(error => updateDemoStatus(`Demo setup failed: ${error.message}`));
  }, { once: true });

  window.OSAInspireDemo = Object.freeze({
    getMainPatientId: () => state.mainPatientId,
    getSafetyPatientId: () => state.safetyPatientId,
  });
})();
