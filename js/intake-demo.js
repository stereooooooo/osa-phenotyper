(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const isLocalHost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  if (!isLocalHost || params.get('demo') !== 'inspire') return;

  function dispatch(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setValue(selector, value) {
    const element = document.querySelector(selector);
    if (!element) return;
    element.value = value;
    dispatch(element);
  }

  function choose(name, value) {
    const element = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (!element) return;
    element.checked = true;
    dispatch(element);
  }

  function check(name, value) {
    const element = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (!element) return;
    element.checked = true;
    dispatch(element);
  }

  function fillDemoAnswers() {
    setValue('#visitReason', 'inspire');
    setValue('#sex', 'M');
    setValue('#heightFeet', '5');
    setValue('#heightInches', '11');
    setValue('#weight', '205');

    [1, 2, 2, 1, 2, 1, 2, 1].forEach((value, index) => choose(`ess${index + 1}`, String(value)));
    [1, 1, 1, 1, 1, 1, 2].forEach((value, index) => choose(`isi${index + 1}`, String(value)));
    [2, 1, 2, 1, 0].forEach((value, index) => choose(`nose${index + 1}`, String(value)));

    choose('nasalObs', 'yes');
    choose('snoringReported', 'yes');
    setValue('#alcoholNearBed', 'social-only');
    check('prefAvoidCPAP', 'yes');
    check('prefOpenSurgery', 'yes');
    check('prefInspire', 'yes');

    choose('priorSleepStudy', 'yes');
    setValue('#sleepStudyYear', '2025');
    choose('priorStudyType', 'home');
    check('priorTx', 'cpap');
    choose('cpapCurrent', 'no');
    choose('cpapImproved', 'no');
    choose('cpapRetry', 'no');
    check('cpapIssue', 'mask-discomfort');
    check('cpapIssue', 'claustrophobia');
    check('cpapIssue', 'no-improvement');

    choose('cvdHistory', 'no');
    choose('chronicOpioidUse', 'no');
    choose('neuromuscularRespiratoryRisk', 'no');
    choose('hypoventilationRisk', 'no');
    choose('weightInterest', 'thinking');
    choose('glp1Status', 'never');

    const button = document.getElementById('btnFillDemoAnswers');
    if (button) {
      button.textContent = 'Demo answers filled';
      button.disabled = true;
    }
    const note = document.getElementById('demoAnswerNote');
    if (note) note.textContent = 'Review any section you want, then submit the real questionnaire.';
    document.getElementById('submitBtn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function installDemoControl() {
    const runtimeBanner = document.getElementById('intakeRuntimeBanner');
    if (!runtimeBanner || document.getElementById('btnFillDemoAnswers')) return;
    const panel = document.createElement('div');
    panel.className = 'intake-demo-control';
    panel.innerHTML = `
      <div>
        <strong>Synthetic meeting demo</strong>
        <div id="demoAnswerNote">Answer a few questions manually, then fill the rest when you are ready.</div>
      </div>
      <button type="button" id="btnFillDemoAnswers">Fill remaining demo answers</button>`;
    runtimeBanner.insertAdjacentElement('afterend', panel);
    panel.querySelector('#btnFillDemoAnswers').addEventListener('click', fillDemoAnswers);
  }

  installDemoControl();
})();
