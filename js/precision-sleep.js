/* Precision Sleep v1 — qualitative driver profile + structured longitudinal checkpoints. */
(function () {
  'use strict';

  const PROFILE_TONES = new Set(['strong', 'relevant', 'quiet', 'pending']);
  let followupModal = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function profileItem(label, signal, detail, tone = 'relevant') {
    return {
      label,
      signal,
      detail,
      tone: PROFILE_TONES.has(tone) ? tone : 'relevant',
    };
  }

  function hasLimitation(data, key) {
    return Array.isArray(data.insufficientDataDomains) && data.insufficientDataDomains.some((item) => {
      if (typeof item === 'string') return item === key;
      return item && item.key === key;
    });
  }

  function buildProfile(data = {}) {
    const phenotypes = Array.isArray(data.phen) ? data.phen : [];
    const hasPhenotype = (name) => phenotypes.includes(name);
    const ahi = Number.isFinite(data.primaryAHI) ? data.primaryAHI : null;
    const bmi = Number.isFinite(data.bmi) ? data.bmi : null;
    const isi = Number.isFinite(data.isi) ? data.isi : null;
    const items = [];

    if (hasPhenotype('High Anatomical Contribution')) {
      items.push(profileItem('Airway anatomy', 'Strong signal', 'The airway exam and OSA pattern support an important anatomical contribution.', 'strong'));
    } else if (hasPhenotype('Nasal-Resistance Contributor')) {
      items.push(profileItem('Airway anatomy', 'Relevant signal', 'Nasal resistance may affect breathing and treatment tolerance.', 'relevant'));
    } else if (hasLimitation(data, 'anatomy') || hasLimitation(data, 'nasal')) {
      items.push(profileItem('Airway anatomy', 'Not fully assessed', 'Complete the airway and nasal evaluation before ruling anatomy in or out.', 'pending'));
    } else {
      items.push(profileItem('Airway anatomy', 'No dominant signal', 'The available examination does not show a dominant anatomy-driven pattern.', 'quiet'));
    }

    if (bmi == null) {
      items.push(profileItem('Weight & metabolic', 'Not assessed', 'Enter BMI to place weight-related risk in context.', 'pending'));
    } else if (bmi >= 30) {
      items.push(profileItem('Weight & metabolic', 'Likely contributor', `BMI ${bmi.toFixed(1)} supports including structured weight management in the care plan.`, 'strong'));
    } else if (bmi >= 25) {
      items.push(profileItem('Weight & metabolic', 'Potential contributor', `BMI ${bmi.toFixed(1)} may be a modifiable part of the overall OSA burden.`, 'relevant'));
    } else {
      items.push(profileItem('Weight & metabolic', 'Not prominent', `BMI ${bmi.toFixed(1)} does not suggest weight is a dominant driver.`, 'quiet'));
    }

    const patternNames = [
      hasPhenotype('Positional OSA') ? 'position' : '',
      hasPhenotype('REM-Predominant OSA') ? 'REM sleep' : '',
    ].filter(Boolean);
    const physiologyNames = [
      hasPhenotype('High Loop Gain') ? 'breathing-control instability' : '',
      hasPhenotype('Low Arousal Threshold') ? 'arousal sensitivity' : '',
      hasPhenotype('Poor Muscle Responsiveness') ? 'airway muscle responsiveness' : '',
    ].filter(Boolean);
    if (ahi == null) {
      items.push(profileItem('Breathing pattern', 'Awaiting study', 'A diagnostic sleep study is needed before classifying the breathing pattern.', 'pending'));
    } else if (patternNames.length) {
      items.push(profileItem('Breathing pattern', 'Actionable pattern', `The study shows clinically useful variation related to ${patternNames.join(' and ')}.`, 'strong'));
    } else if (physiologyNames.length) {
      items.push(profileItem('Breathing pattern', 'Supportive signal', `The available data suggest ${physiologyNames.join(' and ')}; confidence remains limited by the source data.`, 'relevant'));
    } else {
      items.push(profileItem('Breathing pattern', 'No dominant subtype', 'No strong positional, REM, or breathing-control subtype was identified.', 'quiet'));
    }

    if (isi == null) {
      items.push(profileItem('Sleep quality', 'Not assessed', 'Enter ISI to screen for clinically important insomnia symptoms.', 'pending'));
    } else if (data.hasCOMISA || isi >= 15) {
      items.push(profileItem('Sleep quality', 'Important comorbidity', `ISI ${isi} supports an insomnia pathway alongside OSA treatment.`, 'strong'));
    } else if (isi >= 8) {
      items.push(profileItem('Sleep quality', 'Mild signal', `ISI ${isi} suggests subthreshold insomnia symptoms worth monitoring.`, 'relevant'));
    } else {
      items.push(profileItem('Sleep quality', 'No major insomnia signal', `ISI ${isi} does not indicate clinically prominent insomnia symptoms.`, 'quiet'));
    }

    if (data.cpapCurrent) {
      items.push(profileItem('Treatment fit', 'Active PAP pathway', 'Use the profile to optimize PAP and address barriers rather than replace an effective therapy.', 'strong'));
    } else if (data.cpapFailed && data.cpapWillRetry) {
      items.push(profileItem('Treatment fit', 'PAP retry planned', 'A structured re-fit and barrier-focused retry is reasonable.', 'relevant'));
    } else if (data.cpapFailed || data.prefAvoidCpap) {
      items.push(profileItem('Treatment fit', 'Alternatives needed', 'Shared decision-making should prioritize suitable non-PAP options and realistic expectations.', 'strong'));
    } else {
      items.push(profileItem('Treatment fit', 'Decision pending', 'Select treatment after reviewing severity, anatomy, preferences, and safety prerequisites.', 'pending'));
    }

    if (hasPhenotype('High Hypoxic Burden')) {
      items.push(profileItem('Risk & outcomes', 'Elevated oxygen burden', 'Oxygen-related findings increase the priority of effective treatment and reassessment.', 'strong'));
    } else if (ahi == null) {
      items.push(profileItem('Risk & outcomes', 'Baseline incomplete', 'Complete diagnostic testing before establishing outcome targets.', 'pending'));
    } else if (ahi >= 30) {
      items.push(profileItem('Risk & outcomes', 'Severe OSA', `AHI ${ahi.toFixed(1)} supports timely treatment and objective efficacy follow-up.`, 'strong'));
    } else if (ahi >= 5) {
      items.push(profileItem('Risk & outcomes', 'OSA confirmed', `AHI ${ahi.toFixed(1)} provides the baseline for future treatment response.`, 'relevant'));
    } else {
      items.push(profileItem('Risk & outcomes', 'OSA not confirmed', `AHI ${ahi.toFixed(1)} requires correlation with symptoms and other sleep-study findings.`, 'quiet'));
    }

    return items;
  }

  function renderProfile(data) {
    const root = document.getElementById('precisionSleepProfile');
    if (!root) return;
    const items = buildProfile(data);
    root.innerHTML = `
      <section class="precision-profile" aria-labelledby="precisionProfileTitle">
        <div class="precision-profile-heading">
          <div>
            <div class="precision-eyebrow">Capital ENT Precision Sleep</div>
            <h2 id="precisionProfileTitle">Personalized sleep profile</h2>
          </div>
          <p>Qualitative clinical signals—not causal percentages. “Not assessed” remains visible when key data are missing.</p>
        </div>
        <div class="precision-profile-list">
          ${items.map((item) => `
            <div class="precision-profile-row" data-tone="${item.tone}">
              <div class="precision-profile-label">${escapeHtml(item.label)}</div>
              <div class="precision-profile-signal">${escapeHtml(item.signal)}</div>
              <div class="precision-profile-detail">${escapeHtml(item.detail)}</div>
            </div>`).join('')}
        </div>
      </section>`;
  }

  function formatFollowupDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return String(value || '');
    return new Date(`${value}T12:00:00`).toLocaleDateString();
  }

  function renderFollowups(patient) {
    const root = document.getElementById('followupHistory');
    if (!root) return;
    const entries = Array.isArray(patient?.followups) ? patient.followups.slice().reverse() : [];
    if (!entries.length) {
      root.innerHTML = '<p class="text-muted small mb-0">No structured follow-ups recorded yet.</p>';
      return;
    }
    root.innerHTML = entries.slice(0, 20).map((entry) => {
      const metrics = [
        entry.weight != null ? `Weight ${entry.weight} lb` : '',
        entry.ess != null ? `ESS ${entry.ess}` : '',
        entry.isi != null ? `ISI ${entry.isi}` : '',
        entry.ahi != null ? `AHI ${entry.ahi}` : '',
      ].filter(Boolean);
      return `
        <article class="precision-followup-row">
          <div class="precision-followup-date">${escapeHtml(formatFollowupDate(entry.date))}</div>
          <div>
            <strong>${escapeHtml(entry.treatment)}</strong>
            <div class="small text-muted">${escapeHtml(entry.status)} · ${escapeHtml(entry.response)} · ${escapeHtml(entry.adherence)}</div>
            ${metrics.length ? `<div class="precision-followup-metrics">${metrics.map((metric) => `<span>${escapeHtml(metric)}</span>`).join('')}</div>` : ''}
          </div>
          <div class="precision-followup-action"><span>Next</span>${escapeHtml(entry.nextAction)}</div>
        </article>`;
    }).join('');
  }

  function resetFollowupForm() {
    const form = document.getElementById('followupForm');
    form?.reset();
    const date = document.getElementById('followupDate');
    if (date) date.value = new Date().toISOString().slice(0, 10);
    const error = document.getElementById('followupFormError');
    error?.classList.add('d-none');
  }

  function optionalNumber(id) {
    const raw = document.getElementById(id)?.value;
    if (raw === '' || raw === null || raw === undefined) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function collectFollowup() {
    return {
      date: document.getElementById('followupDate').value,
      treatment: document.getElementById('followupTreatment').value,
      status: document.getElementById('followupStatus').value,
      response: document.getElementById('followupResponse').value,
      adherence: document.getElementById('followupAdherence').value,
      nextAction: document.getElementById('followupNextAction').value,
      weight: optionalNumber('followupWeight'),
      ess: optionalNumber('followupEss'),
      isi: optionalNumber('followupIsi'),
      ahi: optionalNumber('followupAhi'),
    };
  }

  async function saveFollowup() {
    const form = document.getElementById('followupForm');
    const error = document.getElementById('followupFormError');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const button = document.getElementById('btnSaveFollowup');
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving…';
    error.classList.add('d-none');
    try {
      const patient = await window.OSAWorkspace.addFollowup(collectFollowup());
      renderFollowups(patient);
      resetFollowupForm();
    } catch (err) {
      error.textContent = err.message || 'Could not save the follow-up.';
      error.classList.remove('d-none');
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  function openFollowups() {
    const patient = window.OSAWorkspace?.getCurrentPatient();
    if (!patient) return;
    resetFollowupForm();
    renderFollowups(patient);
    followupModal.show();
  }

  function init() {
    const modalEl = document.getElementById('followupModal');
    if (!modalEl || followupModal) return;
    followupModal = new bootstrap.Modal(modalEl);
    document.getElementById('btnFollowups')?.addEventListener('click', openFollowups);
    document.getElementById('btnSaveFollowup')?.addEventListener('click', saveFollowup);
  }

  document.addEventListener('osa:analysis-complete', (event) => {
    renderProfile(event.detail?.analysisData || {});
  });
  document.addEventListener('osa:workspace-ready', init, { once: true });
  if (window.OSAWorkspace) init();

  window.OSAPrecisionSleep = { buildProfile, renderProfile, renderFollowups };
})();
