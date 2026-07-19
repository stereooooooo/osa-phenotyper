/*  Finalize Today's Plan suggestions
 *  Converts chart inputs into a transparent, editable draft for staff. Suggestions
 *  never confirm the plan and never remove a pathway selected by the clinician.
 */
(function initPlanSuggestions() {
  'use strict';

  const form = document.getElementById('form');
  const panel = document.getElementById('planSuggestionPanel');
  const list = document.getElementById('planSuggestionList');
  const status = document.getElementById('planSuggestionStatus');
  const applyButton = document.getElementById('btnApplyPlanSuggestions');
  const summaryInput = document.getElementById('planSummary');
  const confirmationInput = document.getElementById('planConfirmed');
  const confirmationMessage = document.getElementById('planConfirmationMessage');
  if (!form || !panel || !list || !status || !applyButton || !summaryInput) return;

  const PLAN_LABELS = {
    planPap: 'PAP management',
    planNasal: 'Nasal treatment',
    planPositional: 'Positional therapy',
    planWeight: 'Weight management',
    planLifestyle: 'Lifestyle / snoring measures',
    planMad: 'Oral appliance',
    planInspire: 'Nerve stimulation',
    planSurgery: 'Airway surgery',
    planCbti: 'CBT-I',
    planStudy: 'Diagnostic testing',
  };

  const PAP_COMFORT_FIELDS = {
    cpapMask: 'mask discomfort',
    cpapClaustro: 'claustrophobia',
    cpapDry: 'dry mouth',
    cpapLeaks: 'leaks or noise',
    cpapSleep: 'trouble sleeping',
    cpapSkin: 'skin irritation',
    cpapNoImprove: 'limited improvement',
    cpapTravel: 'travel difficulty',
  };

  let currentSuggestions = [];
  let refreshTimer = null;

  function fieldValue(name) {
    return form.elements.namedItem(name)?.value || '';
  }

  function numberValue(name) {
    const value = fieldValue(name);
    if (value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function checked(name) {
    return Boolean(form.elements.namedItem(name)?.checked);
  }

  function primaryStudyValues() {
    const studyType = form.querySelector('input[name="studyType"]:checked')?.value || 'watchpat';
    if (studyType === 'psg') {
      return {
        ahi: numberValue('ahi'),
        supineAhi: numberValue('ahiSup'),
        nonSupineAhi: numberValue('ahiNonSup'),
      };
    }
    return {
      ahi: numberValue('pahi'),
      supineAhi: numberValue('supPahi'),
      nonSupineAhi: numberValue('nonSupPahi'),
    };
  }

  function encounterSignals(study) {
    const studyType = form.querySelector('input[name="studyType"]:checked')?.value || 'watchpat';
    const thresholds = typeof OSA_CONFIG !== 'undefined' ? (OSA_CONFIG.thresholds || {}) : {};
    return OSAReportShared.assessEncounterSignals({
      studyType,
      ahi: study.ahi,
      rdi: studyType === 'psg' ? numberValue('rdi') : numberValue('patRdi'),
      arInd: numberValue('arInd'),
      ess: numberValue('ess'),
      isi: numberValue('isi'),
      tst: numberValue('tst'),
      remPercent: numberValue('remPercent'),
      centralIndex: numberValue('pahic'),
      csr: numberValue('csr'),
      cai: numberValue('cai'),
      hbPerHour: numberValue('hbAreaPH'),
      hbAreaUnder90: numberValue('hb90PH'),
      odi: numberValue('odi'),
      t90: numberValue('t90'),
      nadir: numberValue('nadir'),
      visitReason: fieldValue('visitReason'),
    }, thresholds);
  }

  function addSuggestion(suggestions, field, reason, action, priority, tooltip = '') {
    if (suggestions.some(item => item.field === field)) return;
    suggestions.push({ field, label: PLAN_LABELS[field], reason, action, priority, tooltip });
  }

  function noseSeverity(score) {
    if (score >= 80) return 'extreme';
    if (score >= 55) return 'severe';
    if (score >= 30) return 'moderate';
    return '';
  }

  function derivePlanSuggestions() {
    const suggestions = [];
    const visitReason = fieldValue('visitReason');
    const study = primaryStudyValues();
    const signals = encounterSignals(study);
    const osaPresent = study.ahi !== null && study.ahi >= 5;
    const papMode = fieldValue('papMode') || 'PAP';
    const currentPap = checked('cpapCurrent');
    const priorPap = checked('priorCpap');
    const retryPap = fieldValue('cpapRetry');
    const papDifficulty = fieldValue('cpapDifficulty');
    const avoidsPap = checked('prefAvoidCpap');
    const comfortIssues = Object.entries(PAP_COMFORT_FIELDS)
      .filter(([field]) => checked(field))
      .map(([, label]) => label);

    const needsDiagnosticStudy = study.ahi === null &&
      ['snoring', 'symptoms', 'new-diagnosis'].includes(visitReason);
    if (needsDiagnosticStudy) {
      const priorStudyReported = fieldValue('priorSleepStudyAnswer') === 'yes' || checked('priorSleepStudy');
      const priorStudyType = fieldValue('priorSleepStudyType');
      const priorStudyYear = fieldValue('priorSleepStudyYear');
      const studyLabel = priorStudyType === 'home' ? 'home sleep study' : priorStudyType === 'lab' ? 'in-lab sleep study' : 'prior sleep study';
      addSuggestion(
        suggestions,
        'planStudy',
        priorStudyReported
          ? `No diagnostic AHI is entered, but the patient reports a ${studyLabel}${priorStudyYear ? ` from approximately ${priorStudyYear}` : ''}.`
          : 'No diagnostic AHI is entered for this evaluation.',
        priorStudyReported
          ? 'obtain and review the prior sleep-study report, then decide whether updated testing is needed'
          : 'complete diagnostic sleep testing',
        5
      );
    }

    if (signals.uars.isUARS) {
      addSuggestion(
        suggestions,
        'planStudy',
        `AHI ${study.ahi} is below the OSA range, but symptoms and RDI/arousal data suggest possible upper airway resistance syndrome.`,
        'arrange an in-lab sleep study to evaluate possible upper airway resistance syndrome',
        5,
        'UARS refers to symptomatic sleep-disordered breathing associated with flow limitation and respiratory effort-related arousals. ICSD-3 places this presentation within OSA. In-lab PSG with arousal-based scoring can evaluate events that most home studies cannot score because they do not record EEG.'
      );
    } else if (signals.centralConfirmationNeeded) {
      addSuggestion(
        suggestions,
        'planStudy',
        'Home-study central or periodic-breathing signals require laboratory confirmation before central-directed treatment is finalized.',
        'confirm the central-breathing findings with an in-lab sleep study',
        5
      );
    } else if (signals.shortRecording) {
      addSuggestion(
        suggestions,
        'planStudy',
        `The home study recorded ${numberValue('tst')} hours, so it is not sufficiently reliable for final diagnostic or treatment decisions.`,
        'arrange an in-lab sleep study before finalizing the diagnosis or treatment plan',
        5
      );
    } else if (signals.negativeHstNeedsPsg) {
      addSuggestion(
        suggestions,
        'planStudy',
        `The home study AHI is ${study.ahi}, but the patient's persistent symptoms keep clinical concern for sleep-disordered breathing high.`,
        'decide whether to obtain an in-lab sleep study now or reassess persistent symptoms after treating another plausible contributor',
        5,
        'AASM recommends in-lab polysomnography after a negative, inconclusive, or technically inadequate home sleep apnea test when OSA remains suspected. The suggestion remains a draft: the clinician decides whether PSG is needed now or whether to reassess after treating another plausible contributor.'
      );
    }

    const papGoal = ['transfer-pap', 'pap-troubleshoot', 'restart-pap', 'precision-onboarding'].includes(visitReason);
    const newOsaPlan = visitReason === 'new-diagnosis' && osaPresent && !avoidsPap;
    const willingToRetry = priorPap && ['Yes', 'Maybe'].includes(retryPap);
    const deferNewTreatmentForShortStudy = signals.shortRecording && !currentPap && !priorPap && (study.ahi === null || study.ahi < 15);
    if (!deferNewTreatmentForShortStudy && (currentPap || papGoal || newOsaPlan || willingToRetry)) {
      let reason = currentPap ? `Currently using ${papMode}` :
        visitReason === 'restart-pap' ? 'Visit goal is to restart PAP' :
        willingToRetry ? 'Patient is willing to retry PAP' :
        papGoal ? 'PAP care is the primary visit goal' :
        `New OSA diagnosis, AHI ${study.ahi}`;
      if (comfortIssues.length) reason += `; reported ${comfortIssues.slice(0, 2).join(' and ')}`;
      else if (currentPap && papDifficulty === 'yes') reason += '; patient reports difficulty but has not identified the specific barrier';
      else if (currentPap && papDifficulty === 'no') reason += '; no current difficulty reported';
      let action = currentPap
        ? `continue ${papMode}${comfortIssues.length || papDifficulty === 'yes' ? ' and address comfort barriers' : papDifficulty === 'no' ? ' and review objective efficacy' : ' and clarify comfort and efficacy'}`
        : visitReason === 'restart-pap' || willingToRetry
          ? `restart ${papMode}`
          : `begin ${papMode} management`;
      if (signals.highHypoxicBurden) {
        action += '; arrange prompt follow-up testing to confirm breathing and oxygen control';
        reason += '; severe oxygen-burden metrics increase treatment urgency';
      }
      addSuggestion(suggestions, 'planPap', reason, action, 10);
    }

    const isi = numberValue('isi');
    if (isi !== null && isi >= 15) {
      addSuggestion(
        suggestions,
        'planCbti',
        `ISI ${isi} supports an insomnia treatment pathway.`,
        'begin cognitive behavioral therapy for insomnia',
        osaPresent ? 8 : 15
      );
    }

    const noseScore = numberValue('noseScore');
    const hasNasalObstruction = (noseScore !== null && noseScore >= 30) || checked('nasalObs');
    if (hasNasalObstruction) {
      let reason = noseScore !== null
        ? `NOSE score ${noseScore}, ${noseSeverity(noseScore)} nasal obstruction`
        : 'Patient reports nasal obstruction';
      if (currentPap && checked('cpapDry')) reason += '; dry mouth may affect PAP comfort';
      const action = currentPap
        ? `prioritize nasal treatment to improve ${papMode} comfort${checked('cpapDry') ? ' and dry mouth' : ''}`
        : 'begin nasal treatment';
      addSuggestion(suggestions, 'planNasal', reason, action, 20);
    }

    const positionalThresholds = typeof OSA_CONFIG !== 'undefined'
      ? (OSA_CONFIG.thresholds?.positional || {})
      : {};
    const minimumRatio = positionalThresholds.supNonSupRatio ?? 2;
    const maximumNonSupine = positionalThresholds.nonSupMax ?? 15;
    if (!signals.shortRecording && study.supineAhi !== null && study.nonSupineAhi !== null && study.supineAhi > 0) {
      const positional = study.nonSupineAhi === 0 ||
        (study.supineAhi / study.nonSupineAhi > minimumRatio && study.nonSupineAhi < maximumNonSupine);
      if (positional) {
        const reason = study.nonSupineAhi === 0
          ? `Respiratory events occurred only while supine, AHI ${study.supineAhi}`
          : `Supine AHI is ${(study.supineAhi / study.nonSupineAhi).toFixed(1)} times non-supine AHI (${study.supineAhi} vs ${study.nonSupineAhi})`;
        addSuggestion(suggestions, 'planPositional', reason, 'add positional therapy', 30);
      }
    }

    const bmi = numberValue('bmi');
    const weightReadiness = fieldValue('weightLossReadiness');
    if (bmi !== null && bmi >= 27 && ['ready', 'considering'].includes(weightReadiness)) {
      const readinessLabel = weightReadiness === 'ready' ? 'ready now' : 'considering weight management';
      addSuggestion(
        suggestions,
        'planWeight',
        `BMI ${bmi}; patient is ${readinessLabel}.`,
        weightReadiness === 'ready' ? 'begin supported weight management' : 'discuss supported weight-management options',
        40
      );
    }

    const alcoholNearBed = fieldValue('alcoholNearBed');
    if (['3-4', '5-plus'].includes(alcoholNearBed)) {
      addSuggestion(
        suggestions,
        'planLifestyle',
        alcoholNearBed === '5-plus'
          ? 'Alcohol is used near bedtime on 5 or more nights per week.'
          : 'Alcohol is used near bedtime on 3 to 4 nights per week.',
        'reduce or avoid alcohol within 3 hours of bedtime',
        35
      );
    }

    if (visitReason === 'oral-appliance') {
      addSuggestion(suggestions, 'planMad', 'An oral appliance is the primary visit goal.', 'complete oral-appliance evaluation', 25);
    }
    if (visitReason === 'inspire') {
      const priorHgns = checked('priorInspire');
      const hgnsHelped = fieldValue('hgnsHelped');
      const hgnsBmiMax = typeof OSA_CONFIG !== 'undefined'
        ? (OSA_CONFIG.thresholds?.hgns?.bmiMax ?? 40)
        : 40;
      // Existing devices still need management at any BMI. For a new implant,
      // do not auto-select an active nerve-stimulation pathway when the patient
      // is already above the clinic's referral guardrail. The option remains
      // available for clinician review, and weight management can be suggested.
      if (priorHgns || bmi === null || bmi <= hgnsBmiMax) {
        addSuggestion(
          suggestions,
          'planInspire',
          priorHgns
            ? `An existing nerve stimulator is in place; patient-reported benefit is ${hgnsHelped || 'uncertain'}.`
            : 'Nerve stimulation is the primary visit goal.',
          priorHgns
            ? hgnsHelped === 'no'
              ? 'interrogate and optimize the existing device and arrange objective on-therapy testing'
              : 'review use, programming, and objective efficacy of the existing device'
            : 'continue nerve-stimulation evaluation',
          25
        );
      }
    }
    if (visitReason === 'surgery') {
      addSuggestion(suggestions, 'planSurgery', 'Airway surgery is the primary visit goal.', 'continue airway-surgery evaluation', 25);
    }

    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  function buildDraftSummary(suggestions) {
    const actions = suggestions.map(item => item.action).filter(Boolean);
    if (!actions.length) return '';
    const selected = [];
    for (const action of actions) {
      const candidate = `${selected.concat(action).join('; ')}.`;
      if (candidate.length > 240) break;
      selected.push(action);
    }
    if (!selected.length) return '';
    const sentence = `${selected.join('; ')}.`;
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  function renderSuggestions() {
    currentSuggestions = derivePlanSuggestions();
    const suggestedFields = new Set(currentSuggestions.map(item => item.field));
    form.querySelectorAll('.osa-plan-option').forEach(option => {
      option.classList.toggle('is-suggested', suggestedFields.has(option.dataset.planOption));
    });

    list.replaceChildren();
    if (!currentSuggestions.length) {
      list.classList.add('d-none');
      status.textContent = 'No clear chart-based suggestions yet. All pathways remain available below.';
      applyButton.disabled = true;
      applyButton.innerHTML = '<i class="bi bi-check2-square"></i> Apply suggestions';
      return;
    }

    status.textContent = `${currentSuggestions.length} pathway${currentSuggestions.length === 1 ? '' : 's'} match the documented goals and findings.`;
    currentSuggestions.forEach(item => {
      const suggestion = document.createElement('div');
      suggestion.className = 'osa-plan-suggestion';
      const title = document.createElement('div');
      title.className = 'osa-plan-suggestion-name';
      const titleText = document.createElement('span');
      titleText.textContent = item.label;
      title.appendChild(titleText);
      if (item.tooltip) {
        const tooltip = document.createElement('button');
        tooltip.type = 'button';
        tooltip.className = 'osa-evidence-tooltip';
        tooltip.dataset.bsToggle = 'tooltip';
        tooltip.dataset.bsPlacement = 'top';
        tooltip.title = item.tooltip;
        tooltip.setAttribute('aria-label', `Why ${item.label.toLowerCase()} is suggested`);
        tooltip.innerHTML = '<i class="bi bi-info-circle" aria-hidden="true"></i>';
        title.appendChild(tooltip);
      }
      const reason = document.createElement('div');
      reason.className = 'osa-plan-suggestion-reason';
      reason.textContent = item.reason;
      suggestion.append(title, reason);
      list.appendChild(suggestion);
    });
    list.classList.remove('d-none');
    window.OSAClinicianTooltips?.initialize(list);
    applyButton.disabled = false;
    applyButton.innerHTML = `<i class="bi bi-check2-square"></i> Apply ${currentSuggestions.length} suggestion${currentSuggestions.length === 1 ? '' : 's'}`;
  }

  function applySuggestions() {
    if (!currentSuggestions.length) return;
    let changed = false;
    currentSuggestions.forEach(item => {
      const checkbox = form.elements.namedItem(item.field);
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        changed = true;
      }
    });

    if (!summaryInput.value.trim() || summaryInput.dataset.suggestionDraft === 'true') {
      const draft = buildDraftSummary(currentSuggestions);
      if (draft && summaryInput.value !== draft) {
        summaryInput.value = draft;
        summaryInput.dataset.suggestionDraft = 'true';
        summaryInput.dispatchEvent(new Event('change', { bubbles: true }));
        changed = true;
      }
    }

    if (changed && confirmationInput?.checked) confirmationInput.checked = false;
    if (confirmationMessage) {
      confirmationMessage.textContent = changed
        ? 'Suggestions applied as a draft. Review the selections and next-step summary, then confirm the plan.'
        : 'The suggested pathways are already selected. Review the plan and confirm it when ready.';
      confirmationMessage.classList.remove('d-none');
    }
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(renderSuggestions, 40);
  }

  applyButton.addEventListener('click', applySuggestions);
  summaryInput.addEventListener('input', event => {
    if (event.isTrusted) summaryInput.dataset.suggestionDraft = 'false';
  });
  form.addEventListener('input', scheduleRefresh);
  form.addEventListener('change', scheduleRefresh);
  form.addEventListener('reset', () => window.setTimeout(() => {
    delete summaryInput.dataset.suggestionDraft;
    renderSuggestions();
  }, 0));
  document.addEventListener('osa:patient-updated', renderSuggestions);

  window.OSAPlanSuggestions = {
    derive: derivePlanSuggestions,
    buildDraftSummary,
    refresh: renderSuggestions,
    apply: applySuggestions,
  };

  renderSuggestions();
})();
