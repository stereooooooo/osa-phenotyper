/* Clinician-only PAP compliance guidance.
 * Evidence boundary: ATS 2013 PAP tracking statement; AASM 2021 longitudinal
 * testing guidance; AASM 2019 PAP guideline; Reiter 2016 residual-event study.
 * This module never selects a pressure or changes device settings.
 */
(function exposePapComplianceAssistant(global) {
  'use strict';

  const DEFAULTS = {
    deviceAhiContext: 5,
    deviceAhiReview: 10,
    centralIndexReview: 5,
    insuranceFourHourPct: 70,
    partialNightGapHours: 1,
    resmedLeakP95Nasal: 24,
    resmedLeakP95FullFace: 36,
    treatmentEmergentWindowDays: 90,
  };

  const REPORT_FIELDS = [
    'papManufacturer', 'papReportModel', 'papReportEndDate', 'papReportDays',
    'papNightsUsed', 'papNightsFourHours', 'papAverageUseHours',
    'papMinPressure', 'papMaxPressure',
    'papDeviceAhi', 'papDeviceCai', 'papDeviceOai', 'papPressure95', 'papLeakValue',
    'papLeakThreshold', 'papLeakMetric', 'papPeriodicBreathingPct',
  ];

  const CLINICAL_CONTEXT_FIELDS = [
    'papUsualSleepHours', 'papMaskType', 'papLargeLeakFlag', 'papTherapyStartDate',
    'papPersistentSymptoms', 'papSymptomSleepiness', 'papSymptomUnrefreshed',
    'papSymptomBreathing', 'papSymptomFragmented', 'papSymptomHeadache',
    'papSymptomOther', 'papSymptomOtherText', 'papNewCvdEvent',
  ];

  const CURRENT_SYMPTOM_LABELS = Object.freeze({
    papSymptomSleepiness: 'daytime sleepiness',
    papSymptomUnrefreshed: 'fatigue or unrefreshing sleep',
    papSymptomBreathing: 'snoring, gasping, or witnessed pauses',
    papSymptomFragmented: 'insomnia or fragmented sleep',
    papSymptomHeadache: 'morning headaches',
    papSymptomOther: 'another current concern',
  });

  function numberOrNull(value) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function yes(value) { return value === true || value === 'yes' || value === 'on'; }

  function daysSince(value, nowValue) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    const now = nowValue ? new Date(nowValue) : new Date();
    if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) return null;
    return Math.max(0, Math.round((now.getTime() - date.getTime()) / 86400000));
  }

  function roundPercent(numerator, denominator) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
    return Math.round((numerator / denominator) * 100);
  }

  function currentSymptomLabels(data) {
    if (data.papPersistentSymptoms !== 'yes') return [];
    const labels = Object.entries(CURRENT_SYMPTOM_LABELS)
      .filter(([field]) => field !== 'papSymptomOther')
      .filter(([field]) => yes(data[field]))
      .map(([, label]) => label);
    const other = String(data.papSymptomOtherText || '').trim();
    if (yes(data.papSymptomOther) || other) labels.push(other || CURRENT_SYMPTOM_LABELS.papSymptomOther);
    return labels;
  }

  function leakAssessment(data, thresholds) {
    const value = numberOrNull(data.papLeakValue);
    const reportThreshold = numberOrNull(data.papLeakThreshold);
    const manufacturer = data.papManufacturer || '';
    const metric = data.papLeakMetric || '';
    const mask = data.papMaskType || '';
    if (data.papLargeLeakFlag === 'yes') {
      return { state: 'concern', label: 'Leak concern', detail: 'The source report flags large leak.' };
    }
    if (value === null) {
      return { state: 'unknown', label: 'Leak not characterized', detail: 'Enter the report leak metric or document the report large-leak flag.' };
    }
    if (reportThreshold !== null && metric === 'p95') {
      return value > reportThreshold
        ? { state: 'screening', label: 'Elevated P95 leak signal', detail: `The 95th percentile leak is ${value} L/min, above the source report reference of ${reportThreshold} L/min. P95 alone does not show whether leak was sustained.` }
        : { state: 'acceptable', label: 'Leak below report threshold', detail: `The 95th percentile leak is ${value} L/min, below the source report threshold of ${reportThreshold} L/min.` };
    }
    if (manufacturer !== 'resmed' || metric !== 'p95') {
      return {
        state: data.papLargeLeakFlag === 'no' ? 'not-flagged' : 'unknown',
        label: data.papLargeLeakFlag === 'no' ? 'No report-level leak flag' : 'Vendor-specific interpretation needed',
        detail: `Recorded leak is ${value} L/min. A numeric threshold is not applied because the manufacturer or leak definition is not configured.`,
      };
    }
    const nasalThreshold = thresholds.resmedLeakP95Nasal;
    const fullFaceThreshold = thresholds.resmedLeakP95FullFace;
    if (mask === 'full-face') {
      return value > fullFaceThreshold
        ? { state: 'screening', label: 'Elevated P95 leak signal', detail: `ResMed 95th percentile leak ${value} L/min exceeds the ${fullFaceThreshold} L/min full-face-mask reference. P95 alone does not establish sustained major leak.` }
        : { state: 'acceptable', label: 'Leak below reference', detail: `ResMed 95th percentile leak ${value} L/min is below the ${fullFaceThreshold} L/min full-face-mask reference.` };
    }
    if (mask === 'nasal' || mask === 'pillows') {
      return value > nasalThreshold
        ? { state: 'screening', label: 'Elevated P95 leak signal', detail: `ResMed 95th percentile leak ${value} L/min exceeds the ${nasalThreshold} L/min nasal-interface reference. P95 alone does not establish sustained major leak.` }
        : { state: 'acceptable', label: 'Leak below reference', detail: `ResMed 95th percentile leak ${value} L/min is below the ${nasalThreshold} L/min nasal-interface reference.` };
    }
    if (value > fullFaceThreshold) {
      return { state: 'screening', label: 'Elevated P95 leak signal', detail: `ResMed 95th percentile leak ${value} L/min exceeds both mask-type references. Confirm the interface and review the leak pattern before deciding whether treatment is needed.` };
    }
    if (value > nasalThreshold) {
      return { state: 'mask-needed', label: 'Leak interpretation needs mask type', detail: `ResMed 95th percentile leak ${value} L/min is above the nasal reference but below the full-face reference.` };
    }
    return { state: 'acceptable', label: 'Leak below reference', detail: `ResMed 95th percentile leak ${value} L/min is below the configured mask references.` };
  }

  function analyze(input = {}, context = {}, thresholdOverrides = {}) {
    const thresholds = { ...DEFAULTS, ...thresholdOverrides };
    const reportDays = numberOrNull(input.papReportDays);
    const nightsUsed = numberOrNull(input.papNightsUsed);
    const nightsFourHours = numberOrNull(input.papNightsFourHours);
    const averageUse = numberOrNull(input.papAverageUseHours);
    const usualSleep = numberOrNull(input.papUsualSleepHours);
    const deviceAhi = numberOrNull(input.papDeviceAhi);
    const deviceCai = numberOrNull(input.papDeviceCai);
    const deviceOai = numberOrNull(input.papDeviceOai);
    const periodicBreathing = numberOrNull(input.papPeriodicBreathingPct);
    const setMinPressure = numberOrNull(input.papMinPressure);
    const setMaxPressure = numberOrNull(input.papMaxPressure);
    const pressure95 = numberOrNull(input.papPressure95);
    const usedPct = roundPercent(nightsUsed, reportDays);
    const fourHourPct = roundPercent(nightsFourHours, reportDays);
    const partialNight = averageUse !== null && usualSleep !== null && usualSleep - averageUse >= thresholds.partialNightGapHours;
    // Discordance requires an explicit current-on-PAP symptom assessment. A
    // historical ESS or prior "CPAP did not help" response is not enough to
    // establish that symptoms persist during the report period. AASM 2021.
    const persistentSymptoms = input.papPersistentSymptoms === 'yes';
    const symptomLabels = currentSymptomLabels(input);
    const centralConcern = deviceCai !== null && deviceCai >= thresholds.centralIndexReview;
    const leak = leakAssessment(input, thresholds);
    const confirmedMajorLeak = leak.state === 'concern';
    const elevatedP95Leak = leak.state === 'screening';
    const earlyTherapyDays = daysSince(input.papTherapyStartDate, context.now);
    const earlyTherapy = earlyTherapyDays !== null && earlyTherapyDays <= thresholds.treatmentEmergentWindowDays;
    const highBaselineOxygenRisk = yes(context.highBaselineOxygenRisk);
    const newCvdEvent = input.papNewCvdEvent === 'yes';
    const recommendations = [];
    const cautions = [
      'Device-reported event indices are proprietary flow-based estimates and are not interchangeable with polysomnography AHI.',
      'Do not interpret a pressure percentile as a prescribed setting or change settings without clinician review.',
    ];
    const classifications = [];

    if (usedPct !== null || fourHourPct !== null || averageUse !== null) {
      const details = [];
      if (usedPct !== null) details.push(`used on ${usedPct}% of report nights`);
      if (fourHourPct !== null) details.push(`${fourHourPct}% of nights reached 4 hours`);
      if (averageUse !== null) details.push(`${averageUse.toFixed(1)} average hours on used nights`);
      classifications.push({
        key: 'usage',
        state: partialNight || (usedPct !== null && usedPct < 70) ? 'attention' : 'context',
        label: partialNight ? 'Partial-night treatment likely' : 'Usage documented',
        detail: details.join('; '),
      });
      if (fourHourPct !== null) {
        cautions.push(`${fourHourPct}% at 4 hours ${fourHourPct >= thresholds.insuranceFourHourPct ? 'meets' : 'does not meet'} the commonly used insurance adherence threshold. This is a coverage metric, not proof of all-night treatment efficacy.`);
      }
      if (partialNight) recommendations.push(`Average PAP use is ${Math.max(0, usualSleep - averageUse).toFixed(1)} hours shorter than reported sleep time. Address removal during the night and aim for PAP during all sleep.`);
    } else {
      classifications.push({ key: 'usage', state: 'unknown', label: 'Usage not entered', detail: 'Usage is required before efficacy can be interpreted confidently.' });
    }

    classifications.push({ key: 'leak', ...leak });
    if (confirmedMajorLeak) {
      recommendations.push('The source report explicitly identifies major leak. Address mask seal, interface condition, mouth leak, dryness, and nasal obstruction, then reassess the device event index.');
      cautions.push('High leak can impair pressure delivery and make the device-reported event index less reliable.');
    } else if (elevatedP95Leak) {
      recommendations.push('Review the nightly leak graph or time in large leak, mask type, and leak-related symptoms. An elevated P95 value alone can reflect intermittent leak or mask adjustment and does not prove sustained major leak.');
      cautions.push('A P95 leak value summarizes the upper tail of the leak distribution. It does not report the duration or continuity of large leak.');
    } else if (leak.state === 'mask-needed') {
      recommendations.push('Confirm whether the patient uses a nasal or full-face interface before classifying the ResMed leak value.');
    } else if (leak.state === 'unknown') {
      recommendations.push('Confirm the manufacturer-specific leak definition or the report large-leak flag before using the numeric leak value for decisions.');
    }

    if (setMinPressure !== null || setMaxPressure !== null || pressure95 !== null) {
      const pressureDetails = [];
      if (setMinPressure !== null && setMaxPressure !== null) pressureDetails.push(`configured range ${setMinPressure}-${setMaxPressure} cm H2O`);
      else if (setMinPressure !== null) pressureDetails.push(`configured minimum ${setMinPressure} cm H2O`);
      else if (setMaxPressure !== null) pressureDetails.push(`configured maximum ${setMaxPressure} cm H2O`);
      if (pressure95 !== null) pressureDetails.push(`95th percentile ${pressure95} cm H2O`);
      const nearUpperLimit = setMaxPressure !== null && pressure95 !== null && pressure95 >= setMaxPressure - 0.5;
      let pressureLabel = 'Pressure context';
      let pressureDetail = pressureDetails.join('; ');
      if (setMaxPressure !== null && pressure95 !== null) {
        const gap = Math.max(0, setMaxPressure - pressure95);
        pressureLabel = nearUpperLimit ? 'Pressure near configured upper limit' : 'Pressure below configured upper limit';
        pressureDetail = nearUpperLimit
          ? `${pressureDetails.join('; ')}. This percentile is near the configured maximum and requires clinical context.`
          : `${pressureDetails.join('; ')}. The P95 pressure is ${gap.toFixed(1)} cm H2O below the maximum, so this percentile alone does not suggest that the upper limit is constraining therapy.`;
      }
      classifications.push({
        key: 'pressure',
        state: nearUpperLimit && deviceAhi !== null && deviceAhi >= thresholds.deviceAhiReview && !centralConcern ? 'attention' : 'context',
        label: pressureLabel,
        detail: pressureDetail,
      });
      if (nearUpperLimit && deviceAhi !== null && deviceAhi >= thresholds.deviceAhiReview && !centralConcern && !confirmedMajorLeak) {
        recommendations.push('Residual obstructive events are elevated while the 95th percentile pressure is near the configured maximum. After confirming leak and nightly coverage, review whether the pressure range is constraining therapy or whether formal titration is preferable.');
      }
    }

    if (deviceAhi === null) {
      classifications.push({ key: 'events', state: 'unknown', label: 'Residual events not entered', detail: 'Enter the device-reported event index and any available event-type breakdown.' });
    } else if (deviceAhi >= thresholds.deviceAhiReview) {
      classifications.push({ key: 'events', state: 'attention', label: 'Residual-event review needed', detail: `Device-reported event index is ${deviceAhi.toFixed(1)} per hour.` });
      if (centralConcern) {
        recommendations.push('Do not reflexively increase pressure. Review the central-event signal, leak, treatment timing, heart failure, opioid exposure, altitude, and other contributors; use formal testing when the pattern persists or remains unexplained.');
      } else if (confirmedMajorLeak) {
        recommendations.push('Repeat the efficacy review after correcting the confirmed major leak before deciding whether pressure or modality changes are appropriate.');
      } else if (elevatedP95Leak) {
        recommendations.push('Before changing pressure or modality, determine whether the elevated P95 leak represents sustained or recurrent clinically important leak.');
      } else if (deviceOai !== null && (deviceCai === null || deviceOai > deviceCai)) {
        recommendations.push('The available event breakdown is predominantly obstructive. After confirming nightly coverage and leak, review the current mode, pressure range, mask, position, and weight; consider clinician-directed optimization or formal titration if needed.');
      } else {
        recommendations.push('Review event composition and waveform detail before deciding whether the next step is clinician-directed optimization or formal titration.');
      }
    } else if (deviceAhi >= thresholds.deviceAhiContext) {
      classifications.push({ key: 'events', state: persistentSymptoms ? 'attention' : 'context', label: 'Intermediate residual-event range', detail: `Device-reported event index is ${deviceAhi.toFixed(1)} per hour and requires clinical context.` });
      if (!persistentSymptoms) recommendations.push('If the patient feels well and leak and nightly coverage are acceptable, monitor rather than treating this value as an automatic setting-change threshold.');
    } else {
      const eventDetails = [`device-reported event index ${deviceAhi.toFixed(1)} per hour`];
      if (deviceCai !== null) eventDetails.push(`central index ${deviceCai.toFixed(1)}`);
      if (deviceOai !== null) eventDetails.push(`obstructive index ${deviceOai.toFixed(1)}`);
      classifications.push({ key: 'events', state: 'reassuring', label: 'Low device-reported event indices', detail: `${eventDetails.join('; ')}. These are reassuring device estimates, not PSG measurements.` });
    }

    if (persistentSymptoms) {
      const symptomDetail = symptomLabels.length
        ? `Explicitly documented current symptoms: ${symptomLabels.join(', ')}.`
        : 'Current symptoms despite PAP were explicitly documented, but the symptom type was not selected.';
      classifications.push({
        key: 'symptom-discordance',
        state: deviceAhi !== null && deviceAhi < thresholds.deviceAhiContext ? 'discordant' : 'attention',
        label: deviceAhi !== null && deviceAhi < thresholds.deviceAhiContext ? 'Symptoms and download are discordant' : 'Current symptoms despite PAP',
        detail: symptomDetail,
      });
      if (confirmedMajorLeak) {
        recommendations.push('Reassess the documented symptoms after correcting the confirmed major leak. If symptoms remain unexplained and the result would change management, consider clinician-selected overnight oximetry or formal follow-up sleep testing.');
      } else if (elevatedP95Leak) {
        recommendations.push('First determine whether the elevated P95 leak represents sustained clinically important leak. Address it if confirmed, then reassess the documented symptoms. Consider overnight oximetry or formal follow-up testing only if symptoms remain unexplained and the result would change management.');
      } else {
        recommendations.push('Confirm all-night PAP use and reassess the documented symptoms and other possible causes. Consider overnight oximetry or formal follow-up sleep testing only if symptoms remain unexplained and the result would change management.');
      }
    }

    if (centralConcern || (periodicBreathing !== null && periodicBreathing > 0)) {
      const centralDetails = [];
      if (deviceCai !== null) centralDetails.push(`central index ${deviceCai.toFixed(1)}`);
      if (periodicBreathing !== null) centralDetails.push(`periodic breathing ${periodicBreathing.toFixed(1)}%`);
      classifications.push({ key: 'central', state: centralConcern ? 'attention' : 'context', label: centralConcern ? 'Possible central-event concern' : 'Periodic-breathing signal present', detail: centralDetails.join('; ') });
      cautions.push('Device-classified central events and periodic breathing are screening signals. Confirm clinically important or persistent findings with appropriate testing.');
      if (earlyTherapy) cautions.push(`PAP began approximately ${earlyTherapyDays} days ago. Treatment-emergent central events often improve over the first weeks to months, but this observation window must not delay evaluation of severe symptoms, hypoxemia, high central burden, or cardiovascular instability.`);
      if (yes(context.heartFailure) && numberOrNull(context.lvef) === null) recommendations.push('Obtain the most recent echocardiogram and numeric LVEF before advanced central-apnea therapy is considered.');
      if (numberOrNull(context.lvef) !== null && numberOrNull(context.lvef) <= 45) cautions.push('Documented LVEF is 45% or lower. ASV safety restrictions apply in the relevant systolic heart-failure population.');
    }

    if (newCvdEvent) {
      classifications.push({ key: 'cvd', state: 'attention', label: 'New cardiovascular event', detail: 'Follow-up sleep testing may be appropriate if it would change management.' });
      recommendations.push('Reassess PAP efficacy and consider follow-up PSG or HSAT after the new cardiovascular event. Prefer PSG when device data are unexplained or central events are suspected.');
    }
    if (highBaselineOxygenRisk && deviceAhi !== null && deviceAhi < thresholds.deviceAhiContext) {
      recommendations.push('The baseline study showed important oxygen burden. A low device-reported event index does not confirm oxygen normalization; consider overnight oximetry or another on-therapy efficacy assessment when clinically appropriate.');
    }

    const needsAction = classifications.some(item => ['attention', 'discordant', 'concern'].includes(item.state));
    if (!recommendations.length && deviceAhi !== null && !persistentSymptoms && !newCvdEvent) {
      recommendations.push('Continue current PAP with routine clinical follow-up. Routine repeat sleep testing is not indicated solely from an asymptomatic, reassuring download.');
    }
    return {
      status: needsAction ? 'review' : 'stable',
      classifications,
      recommendations: [...new Set(recommendations)],
      cautions: [...new Set(cautions)],
      derived: { usedPct, fourHourPct, partialNight, persistentSymptoms, symptomLabels, centralConcern, leakState: leak.state },
    };
  }

  function initUi() {
    const document = global.document;
    if (!document) return;
    const form = document.getElementById('form');
    const panel = document.getElementById('papComplianceGuidance');
    const verify = document.getElementById('papValuesVerified');
    const analyzeButton = document.getElementById('btnAnalyzePap');
    const fileInput = document.getElementById('papReportFileInput');
    const dropZone = document.getElementById('papReportDropZone');
    const status = document.getElementById('papReportStatus');
    const modeReview = document.getElementById('papReviewMode');
    const minPressureReview = document.getElementById('papReviewMinPressure');
    const maxPressureReview = document.getElementById('papReviewMaxPressure');
    const persistentSymptoms = document.getElementById('papPersistentSymptoms');
    const symptomDetails = document.getElementById('papPersistentSymptomDetails');
    if (!form || !panel || !verify || !analyzeButton || !fileInput || !dropZone) return;

    let parsedFields = [];

    function escapeHtml(value) {
      const div = document.createElement('div');
      div.textContent = String(value ?? '');
      return div.innerHTML;
    }

    function formObject() {
      const data = {};
      const fd = new FormData(form);
      for (const [key, value] of fd.entries()) data[key] = value;
      form.querySelectorAll('input[type="checkbox"][name]').forEach(input => { data[input.name] = input.checked; });
      return data;
    }

    function contextObject(data) {
      const pahi = numberOrNull(data.pahi);
      const ahi = numberOrNull(data.ahi);
      const baselineAhi = pahi ?? ahi;
      return {
        heartFailure: data.cvdHeartFailure,
        lvef: data.lvef,
        highBaselineOxygenRisk: numberOrNull(data.hbAreaPH) >= 73 || numberOrNull(data.odi) >= 50 ||
          numberOrNull(data.t90) >= 20 || (numberOrNull(data.nadir) !== null && numberOrNull(data.nadir) < 75) ||
          (baselineAhi !== null && baselineAhi >= 30 && numberOrNull(data.nadir) !== null && numberOrNull(data.nadir) < 80),
      };
    }

    function stateClass(state) {
      if (['attention', 'discordant', 'concern'].includes(state)) return 'text-bg-warning';
      if (['acceptable', 'reassuring'].includes(state)) return 'text-bg-success';
      if (state === 'screening') return 'text-bg-info';
      return 'text-bg-secondary';
    }

    function updateSymptomDetails() {
      symptomDetails?.classList.toggle('d-none', persistentSymptoms?.value !== 'yes');
    }

    function render() {
      if (!verify.checked) {
        panel.classList.add('d-none');
        panel.innerHTML = '';
        analyzeButton.disabled = true;
        return;
      }
      analyzeButton.disabled = false;
      const data = formObject();
      const thresholds = global.OSA_CONFIG?.thresholds?.papCompliance || {};
      const result = analyze(data, contextObject(data), thresholds);
      const cards = result.classifications.map(item => `
        <div class="pap-guidance-item">
          <div class="d-flex align-items-center gap-2 flex-wrap"><span class="badge ${stateClass(item.state)}">${escapeHtml(item.label)}</span></div>
          <div class="small mt-1">${escapeHtml(item.detail)}</div>
        </div>`).join('');
      const recommendations = result.recommendations.map(item => `<li>${escapeHtml(item)}</li>`).join('');
      const cautions = result.cautions.map(item => `<li>${escapeHtml(item)}</li>`).join('');
      panel.innerHTML = `
        <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
          <h6 class="mb-0"><i class="bi bi-clipboard2-pulse"></i> PAP Download Guidance</h6>
          <span class="badge ${result.status === 'review' ? 'text-bg-warning' : 'text-bg-success'}">${result.status === 'review' ? 'Clinician review needed' : 'No major concern identified'}</span>
        </div>
        <div class="pap-guidance-grid">${cards}</div>
        <div class="row g-3 mt-1">
          <div class="col-lg-7"><div class="fw-semibold small text-uppercase mb-1">Suggested review steps</div><ol class="small mb-0 ps-3">${recommendations}</ol></div>
          <div class="col-lg-5"><div class="fw-semibold small text-uppercase mb-1">Interpretation limits</div><ul class="small mb-0 ps-3">${cautions}</ul></div>
        </div>`;
      panel.classList.remove('d-none');
    }

    function clearVerification() {
      verify.checked = false;
      render();
    }

    function syncReviewMode() {
      if (modeReview) modeReview.value = form.elements.namedItem('papMode')?.value || '';
      if (minPressureReview) minPressureReview.value = form.elements.namedItem('papMinPressure')?.value || '';
      if (maxPressureReview) maxPressureReview.value = form.elements.namedItem('papMaxPressure')?.value || '';
    }

    function reviewRows(fields, notFound) {
      parsedFields = fields;
      const tbody = document.querySelector('#papReportReviewTable tbody');
      tbody.innerHTML = fields.map((field, index) => `
        <tr>
          <td><input class="form-check-input pap-report-apply" type="checkbox" data-index="${index}" checked aria-label="Apply ${escapeHtml(field.label)}"></td>
          <td>${escapeHtml(field.label)}</td>
          <td><input class="form-control form-control-sm pap-report-value" data-index="${index}" value="${escapeHtml(field.value)}"></td>
          <td><span class="badge ${field.confidence === 'high' ? 'text-bg-success' : 'text-bg-warning'}">${escapeHtml(field.confidence)}</span></td>
        </tr>`).join('');
      document.getElementById('papReportNotFound').textContent = notFound.length ? `Not extracted: ${notFound.join(', ')}. Enter these manually if available.` : '';
      global.bootstrap.Modal.getOrCreateInstance(document.getElementById('papReportReviewModal')).show();
    }

    async function handleFile(file) {
      if (!file || file.type !== 'application/pdf') {
        status.innerHTML = '<span class="text-danger">Choose a PDF file.</span>';
        return;
      }
      status.innerHTML = '<span class="text-muted"><span class="spinner-border spinner-border-sm me-1"></span>Reading report...</span>';
      try {
        const parsed = await global.PapReportParser.parse(file);
        if (!parsed.fields.length) {
          status.innerHTML = '<span class="text-warning">No supported fields were recognized. Enter the report manually.</span>';
          return;
        }
        status.innerHTML = `<span class="text-success">Found ${parsed.fields.length} values. Verify before applying.</span>`;
        reviewRows(parsed.fields, parsed.notFound || []);
      } catch (error) {
        status.innerHTML = `<span class="text-danger">Could not read this report: ${escapeHtml(error.message)}</span>`;
      } finally {
        fileInput.value = '';
      }
    }

    REPORT_FIELDS.forEach(name => {
      const control = form.elements.namedItem(name);
      control?.addEventListener('input', event => {
        if (name === 'papMinPressure' || name === 'papMaxPressure') syncReviewMode();
        if (event.isTrusted) clearVerification();
      });
      control?.addEventListener('change', event => {
        if (name === 'papMinPressure' || name === 'papMaxPressure') syncReviewMode();
        if (event.isTrusted) clearVerification();
      });
    });
    CLINICAL_CONTEXT_FIELDS.forEach(name => {
      const control = form.elements.namedItem(name);
      control?.addEventListener('input', () => {
        if (name === 'papPersistentSymptoms') updateSymptomDetails();
        if (verify.checked) render();
      });
      control?.addEventListener('change', () => {
        if (name === 'papPersistentSymptoms') updateSymptomDetails();
        if (verify.checked) render();
      });
    });
    form.elements.namedItem('papMode')?.addEventListener('change', event => {
      syncReviewMode();
      if (event.isTrusted) clearVerification();
    });
    modeReview?.addEventListener('change', () => {
      const mode = form.elements.namedItem('papMode');
      if (mode) {
        mode.value = modeReview.value;
        mode.dispatchEvent(new Event('change', { bubbles: true }));
      }
      clearVerification();
    });
    [[minPressureReview, 'papMinPressure'], [maxPressureReview, 'papMaxPressure']].forEach(([reviewControl, fieldName]) => {
      reviewControl?.addEventListener('input', () => {
        const sourceControl = form.elements.namedItem(fieldName);
        if (sourceControl) {
          sourceControl.value = reviewControl.value;
          sourceControl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        clearVerification();
      });
    });
    verify.addEventListener('change', render);
    analyzeButton.addEventListener('click', render);
    fileInput.addEventListener('change', event => handleFile(event.target.files?.[0]));
    ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('drag-over'); }));
    dropZone.addEventListener('drop', event => handleFile(event.dataTransfer.files?.[0]));

    document.getElementById('btnApplyPapReport')?.addEventListener('click', () => {
      document.querySelectorAll('.pap-report-apply:checked').forEach(checkbox => {
        const index = Number(checkbox.dataset.index);
        const field = parsedFields[index];
        const value = document.querySelector(`.pap-report-value[data-index="${index}"]`)?.value ?? field.value;
        const control = form.elements.namedItem(field.name);
        if (!control) return;
        control.value = value;
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
      });
      clearVerification();
      status.innerHTML = '<span class="text-success">Values applied. Confirm them against the report, then mark them reviewed.</span>';
      global.bootstrap.Modal.getInstance(document.getElementById('papReportReviewModal'))?.hide();
    });

    form.addEventListener('reset', () => setTimeout(() => {
      syncReviewMode();
      updateSymptomDetails();
      panel.classList.add('d-none');
      panel.innerHTML = '';
      status.textContent = '';
      analyzeButton.disabled = true;
    }, 0));
    document.addEventListener('osa:patient-updated', () => setTimeout(() => { syncReviewMode(); updateSymptomDetails(); render(); }, 0));
    syncReviewMode();
    updateSymptomDetails();
    render();
  }

  const api = Object.freeze({ analyze, leakAssessment, thresholds: DEFAULTS });
  global.PapComplianceAssistant = api;
  if (global.document) {
    global.document.addEventListener('osa:workspace-ready', initUi, { once: true });
    if (global.OSAWorkspace) initUi();
  }
})(typeof window !== 'undefined' ? window : globalThis);
