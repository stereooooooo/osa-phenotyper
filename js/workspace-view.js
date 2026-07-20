(function initRoleOptimizedWorkspace() {
  'use strict';

  const STORAGE_KEY = 'osa-workspace-mode';
  const VALID_MODES = new Set(['prep', 'clinician', 'full']);
  const PAP_VISIT_REASONS = new Set(['transfer-pap', 'pap-troubleshoot', 'restart-pap']);
  const form = document.getElementById('form');
  const chartView = document.getElementById('chartView');
  const papCard = document.getElementById('cardPapCompliance');
  const papCollapse = document.getElementById('collapsePapCompliance');
  const briefingContent = document.getElementById('clinicianBriefingContent');
  const briefingStatus = document.getElementById('clinicianBriefingStatus');
  const papLauncher = document.getElementById('btnOpenPapReview');
  const papLauncherLabel = document.getElementById('btnOpenPapReviewLabel');
  const diseLauncher = document.getElementById('btnOpenDise');
  const diseColumn = document.getElementById('diseColumn');
  const physicalExamColumn = document.getElementById('physicalExamColumn');
  let papForcedOpen = false;
  let diseForcedOpen = false;
  let renderQueued = false;

  if (!form || !chartView) return;

  function getStoredMode() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return VALID_MODES.has(saved) ? saved : 'clinician';
    } catch (_) {
      return 'clinician';
    }
  }

  let currentMode = getStoredMode();

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function control(nameOrId) {
    return form.elements.namedItem(nameOrId) || document.getElementById(nameOrId);
  }

  function value(nameOrId) {
    const element = control(nameOrId);
    return element ? String(element.value || '').trim() : '';
  }

  function checked(nameOrId) {
    return Boolean(control(nameOrId)?.checked);
  }

  function selectedLabel(nameOrId) {
    const element = control(nameOrId);
    if (!element || element.tagName !== 'SELECT' || !element.value) return '';
    return element.options[element.selectedIndex]?.textContent?.trim() || element.value;
  }

  function selectedStudyType() {
    return form.querySelector('input[name="studyType"]:checked')?.value || 'watchpat';
  }

  function fact(label, detail, options = {}) {
    const tone = options.tone ? ` osa-briefing-fact--${options.tone}` : '';
    const detailHtml = options.html ? detail : escapeHtml(detail);
    return `<li class="osa-briefing-fact${tone}"><span>${escapeHtml(label)}</span><strong>${detailHtml}</strong></li>`;
  }

  function joinOrFallback(items, fallback) {
    return items.length ? items.join(', ') : fallback;
  }

  function hasPapReportData() {
    return [
      'papManufacturer', 'papReportModel', 'papReportEndDate', 'papReportDays',
      'papNightsUsed', 'papAverageUseHours', 'papDeviceAhi', 'papPressure95',
      'papLeakValue', 'papReviewDecision'
    ].some(name => value(name) !== '') || checked('papValuesVerified');
  }

  function isDirectPapVisit() {
    return PAP_VISIT_REASONS.has(value('visitReason'));
  }

  function shouldShowPapCard() {
    if (currentMode === 'full') return true;
    return papForcedOpen || isDirectPapVisit() || hasPapReportData();
  }

  function hasDiseData() {
    const degreePresent = ['vDeg', 'oDeg', 'tDeg', 'eDeg'].some(name => Number(value(name)) > 0);
    const patternPresent = ['vPat', 'oPat', 'tPat', 'ePat'].some(name => ['AP', 'Lateral', 'Concentric'].includes(value(name)));
    return degreePresent || patternPresent;
  }

  function isDiseVisit() {
    return ['inspire', 'surgery'].includes(value('visitReason')) || checked('prefInspire') || checked('prefSurgery');
  }

  function updateDiseVisibility() {
    if (!diseColumn || !physicalExamColumn) return;
    const showDise = currentMode === 'full' || diseForcedOpen || isDiseVisit() || hasDiseData();
    diseColumn.hidden = currentMode === 'prep' || !showDise;
    physicalExamColumn.classList.toggle('col-md-4', showDise);
    physicalExamColumn.classList.toggle('col-md-12', !showDise);
    if (diseLauncher) {
      diseLauncher.innerHTML = hasDiseData()
        ? '<i class="bi bi-images"></i> Review DISE findings'
        : '<i class="bi bi-images"></i> Open DISE fields';
      diseLauncher.classList.toggle('btn-outline-primary', hasDiseData() || isDiseVisit());
      diseLauncher.classList.toggle('btn-outline-secondary', !hasDiseData() && !isDiseVisit());
    }
  }

  function updatePapVisibility() {
    const showCard = shouldShowPapCard();
    if (papCard) papCard.hidden = !showCard;

    const hasReport = hasPapReportData();
    if (papLauncherLabel) {
      papLauncherLabel.textContent = hasReport
        ? 'Review PAP compliance report'
        : 'Add PAP compliance report';
    }
    if (papLauncher) {
      papLauncher.classList.toggle('btn-outline-primary', hasReport || isDirectPapVisit());
      papLauncher.classList.toggle('btn-outline-secondary', !hasReport && !isDirectPapVisit());
    }

    const papStep = document.querySelector('.osa-progress-step[data-section="pap-review"]');
    if (papStep) papStep.hidden = currentMode === 'prep' ? !showCard : false;
  }

  function buildBriefing() {
    if (!briefingContent || !briefingStatus) return;

    const patientName = document.getElementById('patientName')?.value.trim() || 'New patient chart';
    const age = value('age');
    const sex = selectedLabel('sex');
    const bmi = value('bmi');
    const neck = value('neck');
    const visitReason = selectedLabel('visitReason');
    const visitDetail = value('visitReasonNote');

    const identity = [];
    if (age) identity.push(`Age ${age}`);
    if (sex) identity.push(sex);
    if (bmi) identity.push(`BMI ${bmi}`);
    if (neck) identity.push(`Neck ${neck} in`);

    const questionnaireFacts = [];
    if (value('ess')) questionnaireFacts.push(`ESS ${value('ess')}`);
    if (value('isi')) questionnaireFacts.push(`ISI ${value('isi')}`);
    if (value('noseScore')) questionnaireFacts.push(`NOSE ${value('noseScore')}`);
    if (checked('snoringReported')) questionnaireFacts.push('Loud or bothersome snoring reported');
    if (checked('nasalObs')) questionnaireFacts.push('Nasal obstruction reported');

    const studyType = selectedStudyType();
    const studyFacts = [];
    if (studyType === 'watchpat' || studyType === 'both') {
      if (value('pahi')) studyFacts.push(`WatchPAT pAHI ${value('pahi')}`);
      if (value('odi')) studyFacts.push(`ODI ${value('odi')}`);
      if (value('nadir')) studyFacts.push(`oxygen nadir ${value('nadir')}%`);
      if (value('tst')) studyFacts.push(`recorded sleep ${value('tst')} h`);
      if (value('remPercent')) studyFacts.push(`REM ${value('remPercent')}%`);
    }
    if (studyType === 'psg' || studyType === 'both') {
      if (value('ahi')) studyFacts.push(`Lab AHI ${value('ahi')}`);
      if (value('odiPsg')) studyFacts.push(`lab ODI ${value('odiPsg')}`);
      if (value('nadirPsg')) studyFacts.push(`lab oxygen nadir ${value('nadirPsg')}%`);
      if (value('cai')) studyFacts.push(`central index ${value('cai')}`);
    }

    const papMode = value('papMode') || value('papReviewMode') || 'PAP';
    const treatmentFacts = [];
    if (checked('cpapCurrent')) {
      treatmentFacts.push(`Currently using ${papMode}`);
    } else if (checked('priorCpap')) {
      treatmentFacts.push('Prior PAP trial, not currently using');
    } else {
      treatmentFacts.push('No prior PAP documented');
    }
    if (value('cpapDifficulty') === 'yes') treatmentFacts.push('Current PAP difficulty reported');

    const priorTreatmentMap = [
      ['priorMAD', 'oral appliance'],
      ['priorUPPP', 'throat surgery'],
      ['priorNasal', 'nasal surgery'],
      ['priorSinus', 'sinus surgery'],
      ['priorJaw', 'jaw surgery'],
      ['priorInspire', 'nerve stimulator']
    ];
    const priorTreatments = priorTreatmentMap.filter(([name]) => checked(name)).map(([, label]) => label);
    if (priorTreatments.length) treatmentFacts.push(`Prior: ${priorTreatments.join(', ')}`);

    const preferenceFacts = [];
    if (checked('prefAvoidCpap')) preferenceFacts.push('prefers to avoid PAP');
    if (checked('prefSurgery')) preferenceFacts.push('open to surgery');
    if (checked('prefInspire')) preferenceFacts.push('interested in nerve stimulation');
    if (value('weightLossReadiness')) preferenceFacts.push(`weight management: ${selectedLabel('weightLossReadiness').toLowerCase()}`);

    const cardiovascular = [
      ['cvdHypertension', 'hypertension'],
      ['cvdCad', 'coronary disease or MI'],
      ['cvdHeartFailure', 'heart failure or cardiomyopathy'],
      ['cvdArrhythmia', 'AF or arrhythmia'],
      ['cvdStroke', 'stroke or TIA'],
      ['cvdValve', 'valve disease'],
      ['cvdOther', 'other cardiovascular history'],
      ['cvdUnsure', 'cardiovascular history uncertain']
    ].filter(([name]) => checked(name)).map(([, label]) => label);

    const safetyFlags = [];
    if (cardiovascular.length) safetyFlags.push(`Cardiovascular: ${cardiovascular.join(', ')}`);
    [
      ['chronicOpioidUse', 'Regular opioid use'],
      ['neuromuscularRespiratoryRisk', 'Neuromuscular breathing weakness'],
      ['hypoventilationRisk', 'Hypoventilation concern']
    ].forEach(([name, label]) => {
      if (value(name) === 'yes') safetyFlags.push(label);
      if (value(name) === 'unsure') safetyFlags.push(`${label} not yet verified`);
    });
    if (checked('severeInsomniaCompromisesHst')) safetyFlags.push('Severe insomnia may compromise home testing');
    if (checked('nightVariabilityConcern')) safetyFlags.push('Night-to-night variability suspected');
    if (checked('severityPrecisionNeeded')) safetyFlags.push('Exact severity may change management');

    const papFacts = [];
    if (hasPapReportData()) {
      if (value('papAverageUseHours')) papFacts.push(`${value('papAverageUseHours')} average hours used`);
      if (value('papDeviceAhi')) papFacts.push(`device event index ${value('papDeviceAhi')}`);
      if (value('papDeviceCai')) papFacts.push(`central index ${value('papDeviceCai')}`);
      if (value('papLargeLeakFlag') === 'yes') papFacts.push('source report flags large leak');
      if (checked('papValuesVerified')) papFacts.push('source values verified');
    }

    const attention = [];
    const missingIdentity = !document.getElementById('patientDob')?.value || !sex || !bmi;
    if (!visitReason) attention.push('Reason for visit not selected');
    if (missingIdentity) attention.push('Core demographics incomplete');
    if (!value('tonsils') || !value('ftp')) attention.push('Physical exam not complete');
    if (!checked('planConfirmed')) attention.push('Today\'s plan not confirmed');
    if (!document.getElementById('followupReviewBadge')?.classList.contains('d-none')) attention.push('Follow-up questionnaire needs review');
    if (!document.getElementById('lvefNeededBadge')?.classList.contains('d-none') || value('lvefFollowupNeeded') === 'on') attention.push('Echo or LVEF result needed');
    if (!document.getElementById('btnReviewIntake')?.classList.contains('d-none')) attention.push('Intake conflicts need review');

    const hasPreparedData = Boolean(visitReason || questionnaireFacts.length || studyFacts.length || checked('priorCpap'));
    briefingStatus.textContent = !hasPreparedData
      ? 'Awaiting visit preparation'
      : attention.length
        ? `${attention.length} item${attention.length === 1 ? '' : 's'} for review`
        : 'Prepared for review';
    briefingStatus.classList.toggle('osa-briefing-status--ready', hasPreparedData && attention.length === 0);

    const visitHeading = visitReason || 'Reason for visit not yet entered';
    const visitSubheading = visitDetail || joinOrFallback(identity, 'Demographics not yet complete');
    const attentionHtml = attention.length
      ? attention.slice(0, 6).map(item => `<span class="osa-attention-chip"><i class="bi bi-circle-fill"></i>${escapeHtml(item)}</span>`).join('')
      : '<span class="osa-attention-clear"><i class="bi bi-check-circle"></i> No unresolved preparation items</span>';

    briefingContent.innerHTML = `
      <div class="osa-briefing-lead">
        <div>
          <span class="osa-briefing-patient">${escapeHtml(patientName)}</span>
          <h3>${escapeHtml(visitHeading)}</h3>
          <p>${escapeHtml(visitSubheading)}</p>
        </div>
        <div class="osa-briefing-attention" aria-label="Items for review">${attentionHtml}</div>
      </div>
      <div class="osa-briefing-sections">
        <section>
          <div class="osa-briefing-section-title">
            <h3>Symptoms and questionnaire</h3>
            <button type="button" class="osa-briefing-edit" data-workspace-edit-target="#cardQuestionnaires">Edit data</button>
          </div>
          <ul>
            ${fact('Patient report', joinOrFallback(questionnaireFacts, 'No questionnaire findings entered'))}
            ${fact('Preferences', joinOrFallback(preferenceFacts, 'No treatment preferences documented'))}
          </ul>
        </section>
        <section>
          <div class="osa-briefing-section-title">
            <h3>Sleep study</h3>
            <button type="button" class="osa-briefing-edit" data-workspace-edit-target="#studyTypeSelector">Edit data</button>
          </div>
          <ul>
            ${fact('Study findings', joinOrFallback(studyFacts, 'No sleep study metrics entered'))}
            ${fact('Testing context', joinOrFallback(safetyFlags, 'No special sleep-test selection risks documented'), { tone: safetyFlags.length ? 'attention' : '' })}
          </ul>
        </section>
        <section>
          <div class="osa-briefing-section-title">
            <h3>Treatment history</h3>
            <button type="button" class="osa-briefing-edit" data-workspace-edit-target="#cardTreatment">Edit data</button>
          </div>
          <ul>
            ${fact('Treatment', treatmentFacts.join('; '))}
            ${fact('PAP download', papFacts.length ? papFacts.join('; ') : 'No compliance report entered', { tone: papFacts.length ? 'info' : '' })}
            ${fact('Safety history', cardiovascular.length ? cardiovascular.join(', ') : 'No cardiovascular condition selected')}
          </ul>
        </section>
      </div>
      <div class="osa-briefing-handoff">
        <div><strong>Clinician tasks</strong><span>Complete the exam, resolve highlighted items, and confirm today\'s plan.</span></div>
        ${hasPapReportData()
          ? '<button type="button" class="btn btn-outline-primary btn-sm" data-open-pap-review><i class="bi bi-clipboard2-pulse"></i> Review PAP data</button>'
          : ''}
      </div>`;
  }

  function applyModeVisibility() {
    chartView.dataset.workspaceMode = currentMode;
    document.querySelectorAll('[data-workspace-modes]').forEach(element => {
      const modes = String(element.dataset.workspaceModes || '').split(',');
      element.hidden = !modes.includes(currentMode);
    });

    document.querySelectorAll('[data-workspace-mode-button]').forEach(button => {
      const active = button.dataset.workspaceModeButton === currentMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const submitButton = document.querySelector('#analysisActions button[type="submit"]');
    if (submitButton) submitButton.hidden = currentMode === 'prep';
    const saveButton = document.getElementById('btnSavePatient');
    if (saveButton) saveButton.classList.toggle('btn-lg', currentMode !== 'prep');

    document.querySelectorAll('.osa-progress-step[data-section="exam"], .osa-progress-step[data-section="imaging"]').forEach(step => {
      step.hidden = currentMode === 'prep';
    });

    updatePapVisibility();
    updateDiseVisibility();
    buildBriefing();
  }

  function setMode(mode, options = {}) {
    if (!VALID_MODES.has(mode)) return;
    currentMode = mode;
    if (!options.skipPersist) {
      try { window.localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
    }
    applyModeVisibility();
    document.dispatchEvent(new CustomEvent('osa:workspace-mode-changed', { detail: { mode } }));
  }

  function expandAndScroll(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const collapse = target.querySelector('.collapse');
    if (collapse && !collapse.classList.contains('show') && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(collapse, { toggle: false }).show();
    }
    window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function openPapReview() {
    papForcedOpen = true;
    updatePapVisibility();
    if (papCollapse && !papCollapse.classList.contains('show') && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(papCollapse, { toggle: false }).show();
    }
    window.requestAnimationFrame(() => papCard?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function openDise() {
    diseForcedOpen = true;
    if (currentMode === 'prep') setMode('full', { skipPersist: true });
    updateDiseVisibility();
    const collapse = document.getElementById('collapseImaging');
    if (collapse && !collapse.classList.contains('show') && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(collapse, { toggle: false }).show();
    }
    window.requestAnimationFrame(() => document.getElementById('cardImaging')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    window.queueMicrotask(() => {
      renderQueued = false;
      updatePapVisibility();
      updateDiseVisibility();
      buildBriefing();
    });
  }

  document.querySelectorAll('[data-workspace-mode-button]').forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.workspaceModeButton));
  });
  papLauncher?.addEventListener('click', openPapReview);
  diseLauncher?.addEventListener('click', openDise);
  briefingContent?.addEventListener('click', event => {
    const papButton = event.target.closest('[data-open-pap-review]');
    if (papButton) {
      openPapReview();
      return;
    }
    const editButton = event.target.closest('[data-workspace-edit-target]');
    if (!editButton) return;
    setMode('full', { skipPersist: true });
    expandAndScroll(editButton.dataset.workspaceEditTarget);
  });

  form.addEventListener('input', queueRender);
  form.addEventListener('change', queueRender);
  form.addEventListener('reset', () => {
    papForcedOpen = false;
    diseForcedOpen = false;
    window.setTimeout(queueRender, 0);
  });
  document.addEventListener('osa:patient-updated', () => {
    papForcedOpen = false;
    diseForcedOpen = false;
    queueRender();
  });

  window.OSAWorkspaceView = Object.freeze({
    setMode,
    getMode: () => currentMode,
    openPapReview,
    openDise,
    refresh: queueRender,
    isPapContextual: () => isDirectPapVisit() || hasPapReportData(),
  });

  setMode(currentMode, { skipPersist: true });
})();
