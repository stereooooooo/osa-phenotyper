(function initRoleOptimizedWorkspace() {
  'use strict';

  const STORAGE_KEY_PREFIX = 'osa-workspace-mode';
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
  const diseLauncherLabel = document.getElementById('btnOpenDiseLabel');
  const diseColumn = document.getElementById('diseColumn');
  const physicalExamColumn = document.getElementById('physicalExamColumn');
  const prepReadinessList = document.getElementById('prepReadinessList');
  const prepHandoffSummary = document.getElementById('prepHandoffSummary');
  const prepHandoffStatus = document.getElementById('prepHandoffStatus');
  const prepHandoffMeta = document.getElementById('prepHandoffMeta');
  const prepReadyButton = document.getElementById('btnMarkPrepReady');
  const sourceReviewToggle = document.getElementById('maSourceReviewToggle');
  const chartStateBar = document.getElementById('chartStateBar');
  const chartStateTitle = document.getElementById('chartStateTitle');
  const chartStateDetail = document.getElementById('chartStateDetail');
  const chartStateIcon = document.getElementById('chartStateIcon');
  const stickySaveButton = document.getElementById('btnStickySave');
  const mainSaveButton = document.getElementById('btnSavePatient');
  const focusedEditBar = document.getElementById('focusedEditBar');
  const focusedEditTitle = document.getElementById('focusedEditTitle');
  const focusedEditReturn = document.getElementById('btnFocusedEditReturn');
  const focusedEditSaveReturn = document.getElementById('btnFocusedEditSaveReturn');
  let papForcedOpen = false;
  let diseForcedOpen = false;
  let renderQueued = false;
  let currentUserScope = '';
  let focusedEdit = null;
  let returnAfterSave = false;
  let dirty = false;
  let saving = false;
  let saveError = '';
  let lastSavedAt = '';
  let hydrating = false;

  if (!form || !chartView) return;

  function storageKey() {
    return currentUserScope ? `${STORAGE_KEY_PREFIX}:${currentUserScope.toLowerCase()}` : '';
  }

  function getStoredMode() {
    try {
      const key = storageKey();
      if (!key) return 'clinician';
      const saved = window.localStorage.getItem(key);
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

  function hasValue(nameOrId) {
    const element = control(nameOrId);
    if (!element) return false;
    if (element.type === 'checkbox' || element.type === 'radio') return element.checked;
    return String(element.value || '').trim() !== '';
  }

  function anyValue(names) {
    return names.some(hasValue);
  }

  function sourceReviewComplete() {
    return value('maSourceReviewComplete') === 'on' || Boolean(sourceReviewToggle?.checked);
  }

  function getSectionStatus(section) {
    const visitReason = value('visitReason');
    const studyType = selectedStudyType();
    const preStudyVisit = ['snoring', 'symptoms'].includes(visitReason);
    const primaryStudyReady = studyType === 'psg'
      ? hasValue('ahi')
      : studyType === 'both'
        ? hasValue('ahi') || hasValue('pahi')
        : hasValue('pahi');
    const anyStudyValue = anyValue([
      'pahi', 'odi', 'nadir', 'supPahi', 'nonSupPahi', 'remPahi', 'nremPahi',
      'remPercent', 't90', 'patRdi', 'tst', 'ahi', 'ahiSup', 'ahiNonSup', 'ahiREM',
      'ahiNREM', 'cai', 'arInd', 'nadirPsg', 'odiPsg'
    ]);
    const treatmentStarted = anyValue([
      'priorCpap', 'cpapCurrent', 'cpapHelped', 'cpapDifficulty', 'priorUPPP',
      'priorNasal', 'priorSinus', 'priorJaw', 'priorInspire', 'priorMAD',
      'priorSleepStudy', 'prefAvoidCpap', 'prefSurgery', 'prefInspire',
      'weightLossReadiness', 'alcoholNearBed', 'glp1Status', 'echoHistory',
      'chronicOpioidUse', 'neuromuscularRespiratoryRisk', 'hypoventilationRisk'
    ]);
    const questionnaireStarted = anyValue(['ess', 'isi', 'noseScore', 'nasalObs', 'snoringReported']);
    const examStarted = anyValue(['tonsils', 'ftp', 'retrognathia', 'ctDev', 'ctTurbs']);
    const examReady = hasValue('tonsils') && hasValue('ftp');
    const diseStarted = hasDiseData();

    const states = {
      demographics: {
        state: hasValue('patientDob') && hasValue('sex') && hasValue('bmi') ? 'ready' : anyValue(['patientDob', 'age', 'sex', 'bmi', 'neck']) ? 'in-progress' : 'not-started',
      },
      treatment: {
        state: sourceReviewComplete() ? 'ready' : treatmentStarted ? 'in-progress' : 'not-started',
      },
      questionnaires: {
        state: hasValue('ess') || sourceReviewComplete() ? 'ready' : questionnaireStarted ? 'in-progress' : 'not-started',
      },
      'sleep-study': {
        state: primaryStudyReady ? 'ready' : !anyStudyValue && preStudyVisit ? 'not-required' : anyStudyValue ? 'in-progress' : 'not-started',
      },
      'pap-review': {
        state: hasPapReportData() ? (checked('papValuesVerified') ? 'ready' : 'in-progress') : 'not-started',
      },
      exam: { state: examReady ? 'ready' : examStarted ? 'in-progress' : 'not-started' },
      imaging: { state: hasDiseData() ? 'ready' : diseStarted ? 'in-progress' : 'not-started' },
    };
    const result = states[section] || { state: 'not-started' };
    const labels = {
      'not-started': 'Not started',
      'in-progress': 'In progress',
      ready: 'Ready',
      'not-required': 'Not needed',
    };
    return { ...result, label: labels[result.state] };
  }

  function getReadiness() {
    const tasks = [];
    const addTask = (id, label, state, detail, action = {}) => tasks.push({ id, label, state, detail, ...action });
    const identityMissing = [];
    if (!document.getElementById('patientName')?.value.trim()) identityMissing.push('patient name');
    if (!document.getElementById('patientDob')?.value) identityMissing.push('date of birth');
    if (!value('visitReason')) identityMissing.push('reason for visit');
    const identityLabel = identityMissing.length === 1 && identityMissing[0] === 'reason for visit'
      ? 'Add reason for visit'
      : identityMissing.length
        ? 'Complete patient details'
        : 'Patient and visit complete';
    addTask('identity', identityLabel, identityMissing.length ? 'blocked' : 'ready', identityMissing.length ? `Missing ${identityMissing.join(', ')}` : 'Identity and visit goal documented', {
      target: identityMissing.includes('patient name') || identityMissing.includes('date of birth') ? '#cardPatientInfo' : '#cardVisitContext'
    });

    const demographicsMissing = [];
    if (!value('sex')) demographicsMissing.push('sex');
    if (!value('bmi')) demographicsMissing.push('BMI');
    addTask('demographics', demographicsMissing.length ? 'Complete core demographics' : 'Core demographics complete', demographicsMissing.length ? 'blocked' : 'ready', demographicsMissing.length ? `Missing ${demographicsMissing.join(', ')}` : 'Sex, BMI, and derived age available', { target: '#cardDemographics' });

    const questionnaireReady = hasValue('ess') || sourceReviewComplete();
    addTask('questionnaire', questionnaireReady ? 'Questionnaire reviewed' : 'Review questionnaire', questionnaireReady ? 'ready' : 'blocked', questionnaireReady ? (hasValue('ess') ? 'ESS documented' : 'Blank scores verified as intentional') : 'ESS not entered or verified as intentionally unavailable', { target: '#cardQuestionnaires' });

    const studyState = getSectionStatus('sleep-study');
    addTask('study', ['ready', 'not-required'].includes(studyState.state) ? 'Sleep study reviewed' : 'Review sleep study', ['ready', 'not-required'].includes(studyState.state) ? 'ready' : 'blocked', studyState.state === 'not-required' ? 'No study expected for this pre-study visit' : studyState.state === 'ready' ? 'Primary study metric documented' : 'Primary AHI or pAHI is missing', { target: '#studyTypeSelector' });

    addTask('source', sourceReviewComplete() ? 'Imported information confirmed' : 'Confirm imported information', sourceReviewComplete() ? 'ready' : 'blocked', sourceReviewComplete() ? 'Questionnaire, history, and imported values reviewed' : 'Review imported values and confirm that remaining blanks are intentional', { action: 'source-review' });

    const intakeConflict = !document.getElementById('btnReviewIntake')?.classList.contains('d-none');
    const followupPending = !document.getElementById('followupReviewBadge')?.classList.contains('d-none');
    addTask('conflicts', intakeConflict ? 'Review patient questionnaire changes' : followupPending ? 'Review follow-up questionnaire' : 'Questionnaire changes resolved', intakeConflict || followupPending ? 'blocked' : 'ready', intakeConflict ? 'Patient intake changes need review' : followupPending ? 'Follow-up questionnaire needs review' : 'No unresolved intake or follow-up conflicts', { action: intakeConflict ? 'review-intake' : followupPending ? 'review-followup' : '' });

    const warnings = [];
    if (!document.getElementById('lvefNeededBadge')?.classList.contains('d-none') || value('lvefFollowupNeeded') === 'on') warnings.push('Echo or LVEF remains a clinician-visible follow-up item');
    const blockers = tasks.filter(task => task.state === 'blocked');
    return { tasks, blockers, warnings, ready: blockers.length === 0 };
  }

  function setHiddenValue(name, nextValue, { emit = false } = {}) {
    const element = control(name);
    if (!element || element.value === nextValue) return;
    element.value = nextValue;
    if (emit) element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString([], {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  }

  function handoffIsCurrent() {
    return value('maPrepStatus') === 'ready' && getReadiness().ready;
  }

  function updatePrepHandoff() {
    if (!prepReadinessList || !prepHandoffSummary || !prepHandoffStatus) return;
    const readiness = getReadiness();
    const handoffReady = handoffIsCurrent();
    const stateIcon = state => state === 'ready'
      ? '<i class="bi bi-check-circle-fill" aria-hidden="true"></i>'
      : '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>';

    prepReadinessList.innerHTML = readiness.tasks.map(task => `
      <button type="button" class="osa-prep-readiness-item osa-prep-readiness-item--${task.state}" data-readiness-task="${escapeHtml(task.id)}">
        <span class="osa-prep-readiness-item__icon">${stateIcon(task.state)}</span>
        <span><strong>${escapeHtml(task.label)}</strong><small>${escapeHtml(task.detail)}</small></span>
      </button>`).join('');

    if (handoffReady) {
      prepHandoffStatus.textContent = 'Ready for clinician';
      prepHandoffStatus.dataset.state = 'ready';
      prepHandoffSummary.textContent = 'Required preparation is complete and the chart has been handed off.';
    } else if (readiness.ready) {
      prepHandoffStatus.textContent = 'Ready to hand off';
      prepHandoffStatus.dataset.state = 'review';
      prepHandoffSummary.textContent = 'Preparation checks are complete. Mark the chart ready to create a saved handoff.';
    } else {
      prepHandoffStatus.textContent = `${readiness.blockers.length} item${readiness.blockers.length === 1 ? '' : 's'} remaining`;
      prepHandoffStatus.dataset.state = 'blocked';
      prepHandoffSummary.textContent = 'Complete the required preparation items before clinician handoff.';
    }

    if (sourceReviewToggle) sourceReviewToggle.checked = sourceReviewComplete();
    if (prepReadyButton) {
      prepReadyButton.disabled = !readiness.ready || saving || handoffReady;
      prepReadyButton.innerHTML = handoffReady
        ? '<i class="bi bi-check-circle"></i> Handoff saved'
        : '<i class="bi bi-person-check"></i> Mark ready and save';
    }

    const preparedBy = value('maPrepPreparedBy');
    const preparedAt = formatTimestamp(value('maPrepReadyAt'));
    prepHandoffMeta.textContent = preparedBy && preparedAt
      ? `Prepared by ${preparedBy}, ${preparedAt}`
      : readiness.warnings.join(' ');
  }

  function metric(label, detail, unit = '') {
    if (detail === '') return '';
    return `<div class="osa-briefing-metric"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(detail)}${unit ? `<small>${escapeHtml(unit)}</small>` : ''}</dd></div>`;
  }

  function detailRow(label, detail, options = {}) {
    const tone = options.tone ? ` osa-briefing-detail--${options.tone}` : '';
    return `<div class="osa-briefing-detail${tone}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(detail)}</dd></div>`;
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
      if (diseLauncherLabel) diseLauncherLabel.textContent = hasDiseData() ? 'Review DISE findings' : 'Open DISE fields';
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

    const symptomFacts = [];
    if (checked('snoringReported')) symptomFacts.push('Loud or bothersome snoring');
    if (checked('nasalObs')) symptomFacts.push('Nasal obstruction');

    const studyType = selectedStudyType();
    const watchpatStudy = studyType === 'watchpat' || studyType === 'both';
    const psgStudy = studyType === 'psg' || studyType === 'both';
    const studyHasMetrics = watchpatStudy
      ? anyValue(['pahi', 'odi', 'nadir', 'tst', 'remPercent'])
      : anyValue(['ahi', 'odiPsg', 'nadirPsg', 'cai']);

    const papMode = value('papMode') || value('papReviewMode') || 'PAP';
    let papStatus = 'No prior PAP documented';
    if (checked('cpapCurrent')) {
      papStatus = `Currently using ${papMode}`;
    } else if (checked('priorCpap')) {
      papStatus = 'Prior PAP trial, not currently using';
    }
    if (value('cpapDifficulty') === 'yes') papStatus += ', difficulty reported';

    const priorTreatmentMap = [
      ['priorMAD', 'oral appliance'],
      ['priorUPPP', 'throat surgery'],
      ['priorNasal', 'nasal surgery'],
      ['priorSinus', 'sinus surgery'],
      ['priorJaw', 'jaw surgery'],
      ['priorInspire', 'nerve stimulator']
    ];
    const priorTreatments = priorTreatmentMap.filter(([name]) => checked(name)).map(([, label]) => label);
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

    const readiness = getReadiness();
    const prepIssues = readiness.blockers;
    const clinicianTasks = [];
    if (!value('tonsils') || !value('ftp')) clinicianTasks.push('Complete physical exam');
    if (!checked('planConfirmed')) clinicianTasks.push('Confirm today\'s plan');
    if (!document.getElementById('lvefNeededBadge')?.classList.contains('d-none') || value('lvefFollowupNeeded') === 'on') clinicianTasks.push('Resolve echo or LVEF follow-up');

    const hasPreparedData = Boolean(visitReason || symptomFacts.length || studyHasMetrics || checked('priorCpap'));
    const handoffReady = handoffIsCurrent();
    briefingStatus.textContent = handoffReady
      ? 'MA handoff complete'
      : !hasPreparedData
        ? 'Awaiting visit preparation'
        : readiness.ready
          ? 'Preparation complete, handoff not saved'
          : `${prepIssues.length} prep item${prepIssues.length === 1 ? '' : 's'} remaining`;
    briefingStatus.classList.toggle('osa-briefing-status--ready', handoffReady);

    const visitHeading = visitReason || 'Reason for visit not yet entered';
    const visitSubheading = visitDetail || joinOrFallback(identity, 'Demographics not yet complete');
    const prepHtml = prepIssues.length
      ? prepIssues.slice(0, 6).map(item => `<button type="button" class="osa-attention-chip" data-readiness-task="${escapeHtml(item.id)}"><i class="bi bi-arrow-right-circle"></i>${escapeHtml(item.label)}</button>`).join('')
      : handoffReady
        ? '<span class="osa-attention-clear"><i class="bi bi-check-circle"></i> MA preparation handed off</span>'
        : '<span class="osa-attention-chip"><i class="bi bi-circle-fill"></i> Handoff not yet saved</span>';
    const clinicianTaskHtml = clinicianTasks.length
      ? clinicianTasks.map(item => {
          const target = item === 'Complete physical exam' ? '#cardPhysicalExam' : item === 'Confirm today\'s plan' ? '#cardVisitPlan' : '#cardTreatment';
          return `<button type="button" class="osa-clinician-task-chip" data-jump-target="${target}"><i class="bi bi-arrow-right-circle"></i>${escapeHtml(item)}</button>`;
        }).join('')
      : '<span class="osa-attention-clear"><i class="bi bi-check-circle"></i> No remaining clinician tasks</span>';
    const handoffMeta = value('maPrepPreparedBy') && value('maPrepReadyAt')
      ? `Prepared by ${value('maPrepPreparedBy')}, ${formatTimestamp(value('maPrepReadyAt'))}`
      : 'No saved MA handoff yet';

    briefingContent.innerHTML = `
      <div class="osa-briefing-lead">
        <div>
          <span class="osa-briefing-patient">${escapeHtml(patientName)}</span>
          <h3>${escapeHtml(visitHeading)}</h3>
          <p>${escapeHtml(visitSubheading)}</p>
        </div>
        <div class="osa-briefing-review-groups">
          <div><span class="osa-briefing-review-label">MA preparation</span><div class="osa-briefing-attention">${prepHtml}</div><small>${escapeHtml(handoffMeta)}</small></div>
          <div><span class="osa-briefing-review-label">Clinician decisions</span><div class="osa-briefing-attention">${clinicianTaskHtml}</div></div>
        </div>
      </div>
      <div class="osa-briefing-sections">
        <section>
          <div class="osa-briefing-section-title">
            <h3>Symptoms and questionnaire</h3>
            <button type="button" class="osa-briefing-edit" data-workspace-edit-target="#cardQuestionnaires">Edit data</button>
          </div>
          <dl class="osa-briefing-metrics">
            ${metric('ESS', value('ess'))}
            ${metric('ISI', value('isi'))}
            ${metric('NOSE', value('noseScore'))}
          </dl>
          <dl class="osa-briefing-details">
            ${detailRow('Symptoms', joinOrFallback(symptomFacts, 'None documented'))}
            ${detailRow('Preferences', joinOrFallback(preferenceFacts, 'None documented'))}
          </dl>
        </section>
        <section>
          <div class="osa-briefing-section-title">
            <h3>Sleep study</h3>
            <button type="button" class="osa-briefing-edit" data-workspace-edit-target="#studyTypeSelector">Edit data</button>
          </div>
          <div class="osa-briefing-study-type">${escapeHtml(studyType === 'watchpat' ? 'WatchPAT home study' : studyType === 'psg' ? 'In-lab sleep study' : 'Home and in-lab studies')}</div>
          <dl class="osa-briefing-metrics">
            ${metric(watchpatStudy ? 'pAHI' : 'AHI', watchpatStudy ? value('pahi') : value('ahi'))}
            ${metric('ODI', watchpatStudy ? value('odi') : value('odiPsg'))}
            ${metric('Oxygen nadir', watchpatStudy ? value('nadir') : value('nadirPsg'), '%')}
            ${metric('Sleep time', watchpatStudy ? value('tst') : '', ' h')}
            ${metric('REM sleep', watchpatStudy ? value('remPercent') : '', '%')}
            ${metric('Central index', psgStudy ? value('cai') : '')}
          </dl>
          ${studyHasMetrics ? '' : '<p class="osa-briefing-empty">No sleep study metrics entered</p>'}
          <dl class="osa-briefing-details">
            ${detailRow('Testing context', joinOrFallback(safetyFlags, 'No special selection risks documented'), { tone: safetyFlags.length ? 'attention' : '' })}
          </dl>
        </section>
        <section>
          <div class="osa-briefing-section-title">
            <h3>Treatment history</h3>
            <button type="button" class="osa-briefing-edit" data-workspace-edit-target="#cardTreatment">Edit data</button>
          </div>
          <dl class="osa-briefing-details osa-briefing-details--treatment">
            ${detailRow('PAP status', papStatus)}
            ${detailRow('Other prior treatment', priorTreatments.length ? priorTreatments.join(', ') : 'None documented')}
            ${detailRow('PAP download', papFacts.length ? papFacts.join(', ') : 'Not entered', { tone: papFacts.length ? 'info' : '' })}
            ${detailRow('Safety history', cardiovascular.length ? cardiovascular.join(', ') : 'No cardiovascular condition selected')}
          </dl>
        </section>
      </div>
      <div class="osa-briefing-handoff">
        <div><strong>Clinician workflow</strong><span>Review the handoff, make focused corrections, complete the exam, and confirm today\'s plan.</span></div>
        ${hasPapReportData()
          ? '<button type="button" class="btn btn-outline-primary btn-sm" data-open-pap-review><i class="bi bi-clipboard2-pulse"></i> Review PAP data</button>'
          : ''}
      </div>`;
  }

  const focusedEditGroups = {
    '#cardPatientInfo': {
      title: 'Complete patient details',
      selectors: ['#cardPatientInfo'],
    },
    '#cardVisitContext': {
      title: 'Add reason for visit',
      selectors: ['#cardVisitContext'],
    },
    '#cardDemographics': {
      title: 'Complete core demographics',
      selectors: ['#cardDemographics'],
    },
    '#cardQuestionnaires': {
      title: 'Correct questionnaire data',
      selectors: ['#cardQuestionnaires'],
    },
    '#studyTypeSelector': {
      title: 'Correct sleep-study data',
      selectors: ['#studyTypeSelector', '#sleepStudyWatchpat', '#sleepStudyPSG'],
    },
    '#cardTreatment': {
      title: 'Correct treatment history',
      selectors: ['#cardTreatment'],
    },
    '#cardPhysicalExam': {
      title: 'Complete physical exam',
      selectors: ['#clinicalEntrySection'],
    },
    '#cardVisitPlan': {
      title: 'Confirm today\'s plan',
      selectors: ['#cardVisitPlan'],
    },
  };

  const focusedHideSelectors = [
    '#progressTrack', '#prepHandoffPanel', '#pdfImportSection', '#clinicianBriefing',
    '#cardPatientInfo', '#cardVisitContext', '#cardDemographics', '#cardTreatment',
    '#workspaceContextTools', '#cardPapCompliance', '#clinicalEntrySection',
    '#cardQuestionnaires', '#studyTypeSelector', '#sleepStudyWatchpat', '#sleepStudyPSG',
    '#cardVisitPlan', '#analysisActions', '#patientSummary', '#precisionSleepProfile',
    '#patientReportTrigger', '#clinicianReport'
  ];

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  function applyFocusedEditVisibility() {
    if (!focusedEdit) {
      if (focusedEditBar) focusedEditBar.hidden = true;
      chartView.removeAttribute('data-focused-edit');
      return;
    }
    chartView.dataset.focusedEdit = 'true';
    if (focusedEditBar) focusedEditBar.hidden = false;
    focusedHideSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) element.hidden = true;
    });
    focusedEdit.group.selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) element.hidden = false;
    });
  }

  function startFocusedEdit(targetSelector, trigger) {
    const group = focusedEditGroups[targetSelector];
    if (!group) return;
    focusedEdit = {
      group,
      targetSelector,
      returnScrollY: window.scrollY,
      trigger,
    };
    if (focusedEditTitle) focusedEditTitle.textContent = group.title;
    setMode('full', { skipPersist: true });
    const target = document.querySelector(targetSelector);
    const collapse = target?.querySelector('.collapse');
    if (collapse && !collapse.classList.contains('show') && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(collapse, { toggle: false }).show();
    }
    window.requestAnimationFrame(() => target?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start'
    }));
  }

  function exitFocusedEdit() {
    if (!focusedEdit) return;
    const returnScrollY = focusedEdit.returnScrollY;
    const trigger = focusedEdit.trigger;
    focusedEdit = null;
    returnAfterSave = false;
    setMode('clinician', { skipPersist: true });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: returnScrollY, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      trigger?.focus?.({ preventScroll: true });
    });
  }

  function updateChartState() {
    if (!chartStateBar || !chartStateTitle || !chartStateDetail || !chartStateIcon) return;
    let state = 'clean';
    let title = lastSavedAt ? 'All changes saved' : 'No unsaved changes';
    let detail = lastSavedAt ? `Saved ${formatTimestamp(lastSavedAt)}` : 'Open or create a chart to begin.';
    let icon = 'bi-cloud-check';
    if (saving) {
      state = 'saving';
      title = 'Saving chart';
      detail = 'Keeping this chart open until the save completes.';
      icon = 'bi-arrow-repeat';
    } else if (saveError) {
      state = 'error';
      title = 'Save failed';
      detail = saveError;
      icon = 'bi-exclamation-triangle';
    } else if (dirty) {
      state = 'dirty';
      title = 'Unsaved chart changes';
      detail = 'Save before generating reports, changing charts, or signing out.';
      icon = 'bi-cloud-slash';
    }
    chartStateBar.dataset.state = state;
    chartStateTitle.textContent = title;
    chartStateDetail.textContent = detail;
    chartStateIcon.className = `bi ${icon}`;
    if (stickySaveButton) {
      stickySaveButton.disabled = saving || !dirty;
      stickySaveButton.hidden = !mainSaveButton;
    }
    if (focusedEditSaveReturn) focusedEditSaveReturn.disabled = saving;
    updatePrepHandoff();
  }

  function markDirty() {
    dirty = true;
    saveError = '';
    updateChartState();
  }

  function markClean(timestamp = '') {
    dirty = false;
    saving = false;
    saveError = '';
    lastSavedAt = timestamp || new Date().toISOString();
    updateChartState();
  }

  function confirmDiscard(action = 'continue') {
    if (!dirty) return true;
    return window.confirm(`Discard unsaved chart changes and ${action}?`);
  }

  function invalidateHandoffAfterPrepEdit(event) {
    if (currentMode !== 'prep' || value('maPrepStatus') !== 'ready') return;
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.type === 'hidden' || target === sourceReviewToggle) return;
    setHiddenValue('maPrepStatus', 'in-progress');
    setHiddenValue('maPrepReadyAt', '');
    setHiddenValue('maPrepPreparedBy', '');
  }

  function humanizeControlName(name) {
    return String(name || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^./, character => character.toUpperCase());
  }

  function ensureAccessibleNames() {
    const controls = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, button'));
    controls.forEach((element, index) => {
      if (element.matches('button') && element.textContent.trim()) return;
      if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.labels?.length) return;
      if (!element.id) element.id = `osa-control-${element.name || index}`;
      const nearbyLabel = element.closest('.col-4, .col-6, .col-md-3, .col-md-4, .col-md-6, .col-12, td')?.querySelector(':scope > .form-label');
      if (nearbyLabel && !nearbyLabel.htmlFor) {
        nearbyLabel.htmlFor = element.id;
        return;
      }
      const label = element.dataset.label
        || element.getAttribute('placeholder')
        || humanizeControlName(element.name || element.id)
        || 'Clinical form control';
      element.setAttribute('aria-label', label);
    });
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
    updatePrepHandoff();
    buildBriefing();
    applyFocusedEditVisibility();
    updateChartState();
  }

  function setMode(mode, options = {}) {
    if (!VALID_MODES.has(mode)) return;
    currentMode = mode;
    if (!options.skipPersist) {
      try {
        const key = storageKey();
        if (key) window.localStorage.setItem(key, mode);
      } catch (_) {}
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
    window.requestAnimationFrame(() => target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }));
  }

  function openPapReview() {
    papForcedOpen = true;
    updatePapVisibility();
    if (papCollapse && !papCollapse.classList.contains('show') && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(papCollapse, { toggle: false }).show();
    }
    window.requestAnimationFrame(() => papCard?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }));
  }

  function openDise() {
    diseForcedOpen = true;
    if (currentMode === 'prep') setMode('full', { skipPersist: true });
    updateDiseVisibility();
    const collapse = document.getElementById('collapseImaging');
    if (collapse && !collapse.classList.contains('show') && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(collapse, { toggle: false }).show();
    }
    window.requestAnimationFrame(() => document.getElementById('cardImaging')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }));
  }

  function activateReadinessTask(taskId, trigger) {
    const task = getReadiness().tasks.find(item => item.id === taskId);
    if (!task) return;
    if (task.action === 'source-review') {
      setMode('prep');
      expandAndScroll('#prepHandoffPanel');
      window.requestAnimationFrame(() => sourceReviewToggle?.focus({ preventScroll: true }));
      return;
    }
    if (task.action === 'review-intake') {
      document.getElementById('btnReviewIntake')?.click();
      return;
    }
    if (task.action === 'review-followup') {
      document.getElementById('btnFollowups')?.click();
      return;
    }
    if (task.target) startFocusedEdit(task.target, trigger);
  }

  function openClinicianTask(targetSelector, trigger) {
    if (focusedEditGroups[targetSelector]) {
      startFocusedEdit(targetSelector, trigger);
      return;
    }
    setMode('full', { skipPersist: true });
    expandAndScroll(targetSelector);
  }

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    window.queueMicrotask(() => {
      renderQueued = false;
      updatePapVisibility();
      updateDiseVisibility();
      updatePrepHandoff();
      buildBriefing();
      updateChartState();
    });
  }

  document.querySelectorAll('[data-workspace-mode-button]').forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.workspaceModeButton));
  });
  papLauncher?.addEventListener('click', openPapReview);
  diseLauncher?.addEventListener('click', openDise);
  prepReadinessList?.addEventListener('click', event => {
    const taskButton = event.target.closest('[data-readiness-task]');
    if (taskButton) activateReadinessTask(taskButton.dataset.readinessTask, taskButton);
  });
  briefingContent?.addEventListener('click', event => {
    const papButton = event.target.closest('[data-open-pap-review]');
    if (papButton) {
      openPapReview();
      return;
    }
    const readinessButton = event.target.closest('[data-readiness-task]');
    if (readinessButton) {
      activateReadinessTask(readinessButton.dataset.readinessTask, readinessButton);
      return;
    }
    const clinicianTask = event.target.closest('[data-jump-target]');
    if (clinicianTask) {
      openClinicianTask(clinicianTask.dataset.jumpTarget, clinicianTask);
      return;
    }
    const editButton = event.target.closest('[data-workspace-edit-target]');
    if (!editButton) return;
    startFocusedEdit(editButton.dataset.workspaceEditTarget, editButton);
  });

  sourceReviewToggle?.addEventListener('change', () => {
    setHiddenValue('maSourceReviewComplete', sourceReviewToggle.checked ? 'on' : '', { emit: true });
  });

  prepReadyButton?.addEventListener('click', () => {
    const readiness = getReadiness();
    if (!readiness.ready) return;
    setHiddenValue('maSourceReviewComplete', sourceReviewToggle?.checked ? 'on' : '');
    setHiddenValue('maPrepStatus', 'ready');
    setHiddenValue('maPrepReadyAt', new Date().toISOString());
    setHiddenValue('maPrepPreparedBy', document.getElementById('userEmail')?.textContent?.trim() || 'Authorized staff');
    markDirty();
    mainSaveButton?.click();
  });

  focusedEditReturn?.addEventListener('click', exitFocusedEdit);
  focusedEditSaveReturn?.addEventListener('click', () => {
    if (!dirty) {
      exitFocusedEdit();
      return;
    }
    returnAfterSave = true;
    mainSaveButton?.click();
  });
  stickySaveButton?.addEventListener('click', () => mainSaveButton?.click());

  function handleFormEdit(event) {
    if (hydrating) {
      queueRender();
      return;
    }
    if (event.target?.id === 'maSourceReviewToggle') {
      setHiddenValue('maSourceReviewComplete', event.target.checked ? 'on' : '');
    }
    invalidateHandoffAfterPrepEdit(event);
    if (event.target?.id !== 'maSourceReviewComplete') markDirty();
    queueRender();
  }
  form.addEventListener('input', handleFormEdit);
  form.addEventListener('change', handleFormEdit);
  form.addEventListener('submit', event => {
    const hasPersistedChart = Boolean(window.OSAWorkspace?.getCurrentPatient?.());
    if (!dirty || !hasPersistedChart) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    saveError = 'Save the chart before generating reports so the report matches the stored record.';
    updateChartState();
    stickySaveButton?.focus();
  }, true);

  form.addEventListener('reset', () => {
    papForcedOpen = false;
    diseForcedOpen = false;
    focusedEdit = null;
    window.setTimeout(() => {
      dirty = false;
      saving = false;
      saveError = '';
      lastSavedAt = '';
      queueRender();
    }, 0);
  });
  document.addEventListener('osa:patient-hydration-start', () => {
    hydrating = true;
  });
  document.addEventListener('osa:patient-hydration-end', event => {
    hydrating = false;
    markClean(event.detail?.patient?.updatedAt || '');
  });
  document.addEventListener('osa:patient-updated', () => {
    papForcedOpen = false;
    diseForcedOpen = false;
    queueRender();
  });
  document.addEventListener('osa:save-start', () => {
    saving = true;
    saveError = '';
    updateChartState();
  });
  document.addEventListener('osa:save-success', event => {
    markClean(event.detail?.patient?.updatedAt || '');
    if (returnAfterSave) exitFocusedEdit();
  });
  document.addEventListener('osa:save-error', event => {
    saving = false;
    dirty = true;
    saveError = event.detail?.message || 'The chart could not be saved. Try again.';
    updateChartState();
  });
  document.addEventListener('osa:user-context', event => {
    currentUserScope = String(event.detail?.email || '').trim();
    setMode(getStoredMode(), { skipPersist: true });
  });
  window.addEventListener('beforeunload', event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  window.OSAWorkspaceView = Object.freeze({
    setMode,
    getMode: () => currentMode,
    openPapReview,
    openDise,
    refresh: queueRender,
    isPapContextual: () => isDirectPapVisit() || hasPapReportData(),
  });

  window.OSAReadiness = Object.freeze({
    getSectionStatus,
    getReadiness,
    refresh: queueRender,
  });

  window.OSAChartState = Object.freeze({
    isDirty: () => dirty,
    markDirty,
    markClean,
    confirmDiscard,
  });

  ensureAccessibleNames();
  setMode(currentMode, { skipPersist: true });
})();
