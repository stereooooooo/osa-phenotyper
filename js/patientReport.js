'use strict';
/* ── Patient Report Generator ──────────────────────────────────────────────
   Generates patient-facing sleep report HTML.
   Exposes: PatientReport.generateReportHTML(data), PatientReport.getReportStage(data)
   Depends on: Bootstrap 5.3.3, Bootstrap Icons, Inter font, js/report-shared.js
   ─────────────────────────────────────────────────────────────────────────*/

var PatientReport = (() => {

  /* ── Logo pre-loading ─────────────────────────────────────────────────── */
  let logoDataURI = '';
  fetch('img/logo.svg')
    .then(r => r.text())
    .then(svg => {
      logoDataURI = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    })
    .catch(() => {});

  /* ── Helper: report stage ─────────────────────────────────────────────── */
  function getReportStage(data) {
    return (data.primaryAHI === null || data.primaryAHI === undefined) ? 'pre-study' : 'post-study';
  }

  /* ── Helper: AHI severity label ───────────────────────────────────────── */
  function ahiSeverityLabel(ahi) {
    if (ahi === null || ahi === undefined) return null;
    if (ahi >= 30) return 'severe';
    if (ahi >= 15) return 'moderate';
    if (ahi >= 5)  return 'mild';
    return 'normal';
  }

  /* ── Helper: HTML-encode a string ────────────────────────────────────── */
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function exists(val) {
    return val !== null && val !== undefined && val !== '';
  }

  function weightReadinessLead(data) {
    if (!data) return '';
    if (data.weightLossReadiness === 'ready') {
      return 'You indicated that you feel ready to work on weight management now, which gives us a good opportunity to turn that motivation into a concrete plan. ';
    }
    if (data.weightLossReadiness === 'considering') {
      return 'You indicated that you are considering weight management, so the goal is to make the next step feel realistic and supported rather than overwhelming. ';
    }
    if (data.weightLossReadiness === 'not-ready') {
      return 'You indicated that weight management is not your main focus right now, which is okay — this can stay in the background while we work on other parts of your treatment plan. ';
    }
    return '';
  }

  function normalizeFtp(ftp) {
    if (!exists(ftp)) return null;
    if (typeof ftp === 'number') return Number.isFinite(ftp) ? ftp : null;
    const raw = String(ftp).trim().toUpperCase();
    if (!raw) return null;
    if (/^\d+$/.test(raw)) return Number(raw);
    const romanMap = { I: 1, II: 2, III: 3, IV: 4 };
    return romanMap[raw] || null;
  }

  function formatFtp(ftp) {
    if (!exists(ftp)) return '';
    return String(ftp).trim().toUpperCase();
  }

  function getPatientFacingRecEntries(data) {
    const recTags = Array.isArray(data.recTags) ? data.recTags.slice() : [];
    const isPreStudy = getReportStage(data) === 'pre-study';
    if (isPreStudy) {
      return recTags.filter(r => ['SLEEP-STUDY', 'CBTI', 'NASAL-OPT'].includes(r.tag));
    }
    if (exists(data.primaryAHI) && data.primaryAHI < 5) {
      return recTags.filter(r => [
        'UARS-EVAL',
        'WEIGHT',
        'NASAL-OPT',
        'POS',
        'MAD',
        'SNORE-ALCOHOL',
        'SNORE-LIFESTYLE',
        'CBTI',
        'SLEEP-STUDY'
      ].includes(r.tag));
    }
    return recTags;
  }

  /* ── Helper: determine visit context ──────────────────────────────────── */
  function getVisitContext(data) {
    const ms = Array.isArray(data.milestones) ? data.milestones : [];
    const hasStudy = data.primaryAHI !== null && data.primaryAHI !== undefined;
    const hasTreatmentHistory = data.cpapCurrent || data.cpapFailed || data.priorMAD || data.priorUPPP || data.priorInspire;

    if (!hasStudy) return { stage: 'pre-study', isFirstVisit: true, label: 'Initial Evaluation' };

    // Has study data — check if returning
    const beyondInitial = ms.some(m => m !== 'Initial Eval');
    if (beyondInitial || hasTreatmentHistory) {
      return { stage: 'returning', isFirstVisit: false, label: 'Follow-up Visit' };
    }
    return { stage: 'new-results', isFirstVisit: true, label: 'Sleep Study Results' };
  }

  /* ── Dynamic Care Pathway Detection (patient-friendly labels) ─────── */
  function detectPatientPathway(data) {
    return OSAReportShared.buildCarePathway({
      milestones: data.milestones,
      studyType: data.studyType,
      hasStudyData: data.primaryAHI !== null && data.primaryAHI !== undefined,
      hasPatientContext: true,
      labels: {
        eval: 'Your Evaluation',
        study: {
          psg: 'Lab Sleep Study',
          watchpat: 'Home Sleep Test',
          default: 'Sleep Study',
        },
        cpap: {
          trial: 'Starting CPAP',
          followup: 'CPAP Check-in',
          ongoing: 'Ongoing Care',
        },
        surgical: {
          planning: 'Planning Your Treatment',
          dise: 'Sleep Endoscopy',
          surgery: 'Your Procedure',
          postop: 'Recovery',
          efficacy: 'Follow-up Study',
        },
        mad: {
          referral: 'Oral Appliance Referral',
          followup: 'Follow-up',
          efficacy: 'Follow-up Study',
        },
        generic: {
          planning: 'Next Steps',
          treatment: 'Your Treatment',
        },
      },
    });
  }

  /* ── Helper: format ISO date ──────────────────────────────────────────── */
  function formatDate(isoDate) {
    if (!isoDate) return '';
    const months = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const parts = isoDate.split('-');
    const yr  = parseInt(parts[0], 10);
    const mo  = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return months[mo] + ' ' + day + ', ' + yr;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HEADER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderHeader(data) {
    const stage     = getReportStage(data);
    const ctx       = getVisitContext(data);
    let title;
    if (stage === 'pre-study') {
      title = 'Your Sleep Evaluation Summary';
    } else if (ctx.isFirstVisit) {
      title = 'Your Sleep Apnea Report';
    } else {
      title = 'Your Sleep Apnea Update';
    }
    const logoImg   = logoDataURI
      ? `<img src="${logoDataURI}" alt="Capital ENT" class="report-logo">`
      : `<span style="font-weight:700;color:#1F3A5C;font-size:1.1rem;">Capital ENT</span>`;
    const dateStr   = formatDate(data.reportDate);
    const patName   = esc(data.patientName || '');

    return `
<div class="report-header">
  <div>
    ${logoImg}
    <div class="report-title" style="margin-top:0.5rem;">${esc(title)}</div>
  </div>
  <div class="report-meta">
    ${patName ? `<div class="report-patient-name">${patName}</div>` : ''}
    ${dateStr ? `<div>${dateStr}</div>` : ''}
  </div>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CARE PATHWAY BAR — Visual step indicator for the patient
     ══════════════════════════════════════════════════════════════════════════ */
  function renderCarePathway(data) {
    const ms = Array.isArray(data.milestones) ? data.milestones : [];
    if (!ms.length && !data.patientName) return '';  // no patient context → skip

    const { stages, currentIdx } = detectPatientPathway(data);

    const steps = stages.map((s, i) => {
      let cls, icon;
      if (i < currentIdx) {
        cls = 'pathway-completed';
        icon = '\u2713'; // checkmark
      } else if (i === currentIdx) {
        cls = 'pathway-active';
        icon = '\u25CF'; // filled circle
      } else {
        cls = 'pathway-upcoming';
        icon = '\u25CB'; // open circle
      }
      return `<div class="pathway-step ${cls}"><span class="pathway-icon">${icon}</span><span class="pathway-label">${s.label}</span></div>`;
    });

    return `
<div class="care-pathway">
  <div class="pathway-title">Your Care Journey</div>
  <div class="pathway-steps">${steps.join('<span class="pathway-line"></span>')}</div>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CARE SUMMARY CARD — Compact "story so far" for returning patients
     ══════════════════════════════════════════════════════════════════════════ */
  function renderCareSummary(data) {
    const ctx = getVisitContext(data);
    if (ctx.isFirstVisit) return '';  // no summary for first visit

    const parts = [];
    // AHI baseline
    if (data.primaryAHI !== null && data.primaryAHI !== undefined) {
      const sev = ahiSeverityLabel(data.primaryAHI);
      parts.push(`Your sleep study showed <strong>${sev} sleep apnea</strong> (AHI ${Math.round(data.primaryAHI)})`);
    }

    // Treatment history
    const txParts = [];
    if (data.cpapCurrent) txParts.push('currently using CPAP');
    else if (data.cpapFailed) txParts.push(data.cpapWillRetry ? 'tried CPAP (willing to retry)' : 'tried CPAP (discontinued)');
    if (data.priorMAD) txParts.push('tried an oral appliance');
    if (data.priorUPPP) txParts.push('had UPPP surgery');
    if (data.priorInspire) txParts.push('has Inspire implant');
    if (txParts.length) parts.push('You have ' + txParts.join(', '));

    if (!parts.length) return '';

    return `
<div class="care-summary-card">
  <div class="care-summary-title">Where You Are</div>
  <p>${parts.join('. ')}.</p>
  <p style="font-size:0.85rem;color:#6B7280;margin-bottom:0;">This report focuses on what's changed and what's next in your care plan.</p>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION A — Why We're Recommending a Sleep Study (pre-study only)
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionA(data) {
    if (getReportStage(data) !== 'pre-study') return '';

    const parts = [];

    /* — Questionnaire scores — */
    const questParts = [];

    /* ESS */
    if (data.ess !== null && data.ess !== undefined) {
      const ess = +data.ess;
      let essLevel, essExpl;
      if (ess >= 16) {
        essLevel = 'significant daytime sleepiness';
        essExpl  = 'This is a high score and suggests that sleepiness is noticeably affecting your daily activities.';
      } else if (ess >= 11) {
        essLevel = 'moderate daytime sleepiness';
        essExpl  = 'This score suggests you are sleepier than most people during the day and may be missing out on energy you should have.';
      } else {
        essLevel = 'mild daytime sleepiness';
        essExpl  = 'Your score is in the mild range, but when combined with other signs, it still points toward a possible sleep problem.';
      }
      questParts.push(`
<p><strong>Epworth Sleepiness Scale (ESS):</strong> Your score of <strong>${ess}</strong> indicates <strong>${essLevel}</strong>. ${essExpl} This questionnaire measures how likely you are to doze off in everyday situations.</p>`);
    }

    /* ISI */
    if (data.isi !== null && data.isi !== undefined) {
      const isi = +data.isi;
      let isiLevel, isiExpl;
      if (isi >= 22) {
        isiLevel = 'severe insomnia';
        isiExpl  = 'This level of sleep difficulty can have a serious impact on your health and daily functioning.';
      } else if (isi >= 15) {
        isiLevel = 'moderate insomnia';
        isiExpl  = 'Difficulty falling or staying asleep at this level often goes hand-in-hand with breathing problems during sleep.';
      } else if (isi >= 8) {
        isiLevel = 'mild insomnia';
        isiExpl  = 'Some sleep difficulties are present. These can become worse if an underlying sleep breathing problem is not addressed.';
      } else {
        isiLevel = 'minimal insomnia concerns';
        isiExpl  = 'Your insomnia symptoms are minimal based on this questionnaire.';
      }
      questParts.push(`
<p><strong>Insomnia Severity Index (ISI):</strong> Your score of <strong>${isi}</strong> indicates <strong>${isiLevel}</strong>. ${isiExpl} The ISI measures problems with falling asleep, staying asleep, and waking too early.</p>`);
    }

    /* NOSE */
    if (data.noseScore !== null && data.noseScore !== undefined) {
      const nose = +data.noseScore;
      let noseLevel, noseExpl;
      if (nose >= 50) {
        noseLevel = 'significant nasal obstruction';
        noseExpl  = 'This level of nasal blockage can force you to breathe through your mouth at night, which makes the airway more likely to collapse during sleep.';
      } else if (nose >= 25) {
        noseLevel = 'moderate nasal obstruction';
        noseExpl  = 'Some nasal congestion or blockage may be making it harder to breathe through your nose, especially when lying down.';
      } else {
        noseLevel = 'mild nasal symptoms';
        noseExpl  = 'Your nasal symptoms are mild, though they may still contribute to breathing difficulties during sleep.';
      }
      questParts.push(`
<p><strong>NOSE Score (Nasal Obstruction):</strong> Your score of <strong>${nose}</strong> indicates <strong>${noseLevel}</strong>. ${noseExpl} The NOSE questionnaire measures how much nasal congestion or blockage affects your breathing and sleep.</p>`);
    }

    if (questParts.length > 0) {
      parts.push(`
<h3 style="font-size:1rem;font-weight:700;color:#1F3A5C;margin-top:1.25rem;margin-bottom:0.5rem;">What Your Questionnaires Show</h3>
${questParts.join('')}`);
    }

    /* — Exam findings — */
    const examParts = [];
    const ftpNumeric = normalizeFtp(data.ftp);
    const ftpLabel = formatFtp(data.ftp);

    if (data.tonsils !== null && data.tonsils !== undefined && +data.tonsils >= 3) {
      examParts.push(`<p>Your tonsils are enlarged (size ${+data.tonsils} out of 4). Large tonsils can narrow the back of the throat and reduce the space available for airflow during sleep.</p>`);
    }
    if (ftpNumeric !== null && ftpNumeric >= 3) {
      examParts.push(`<p>Your Friedman Tongue Position score is <strong>${esc(ftpLabel || String(ftpNumeric))}</strong>, which means there is limited space at the back of your tongue and throat. This is a common physical finding in people who have trouble breathing at night.</p>`);
    }
    if (data.nasalObs) {
      examParts.push(`<p>Your exam showed signs of nasal obstruction — a physical narrowing or blockage inside the nose. When the nose is blocked, the body works harder to pull air through, which can worsen sleep-related breathing problems.</p>`);
    }
    if (data.ctSeptum) {
      examParts.push(`<p>Imaging shows a deviated nasal septum — the wall dividing your two nostrils is off-center, reducing airflow on one side.</p>`);
    }
    if (data.ctTurbs) {
      examParts.push(`<p>Imaging shows enlarged nasal turbinates — the small bony ridges inside the nose appear swollen, further narrowing the nasal passage.</p>`);
    }
    const neckThreshold = (data.sex === 'F') ? 15 : 17;
    if (data.neck !== null && data.neck !== undefined && +data.neck >= neckThreshold) {
      examParts.push(`<p>Your neck circumference of <strong>${+data.neck} inches</strong> is above the threshold associated with a higher risk of sleep apnea. Extra tissue around the neck can put pressure on the airway when you lie down.</p>`);
    }
    if (data.bmi !== null && data.bmi !== undefined && +data.bmi >= 30) {
      examParts.push(`<p>Your BMI of <strong>${(+data.bmi).toFixed(1)}</strong> is in the obese range. Excess weight, especially around the neck and chest, is one of the most common contributing factors to sleep apnea.</p>`);
    }

    if (examParts.length > 0) {
      parts.push(`
<h3 style="font-size:1rem;font-weight:700;color:#1F3A5C;margin-top:1.25rem;margin-bottom:0.5rem;">What Your Exam Shows</h3>
${examParts.join('')}`);
    }

    /* — Snoring — */
    if (data.snoringReported === true) {
      parts.push(`
<h3 style="font-size:1rem;font-weight:700;color:#1F3A5C;margin-top:1.25rem;margin-bottom:0.5rem;">About Your Snoring</h3>
<p>Snoring happens when air squeezes through a partially blocked airway during sleep, causing the tissues in your throat to vibrate. While snoring alone is not always serious, it is one of the most common signs of obstructive sleep apnea — a condition where the airway fully or partially closes during sleep, causing your body to work overtime just to breathe. A sleep study is the only reliable way to know whether snoring is a harmless habit or a sign of something that needs treatment.</p>`);
    }

    /* — Why we're recommending a sleep study — */
    parts.push(`
<h3 style="font-size:1rem;font-weight:700;color:#1F3A5C;margin-top:1.25rem;margin-bottom:0.5rem;">Why We're Recommending a Sleep Study</h3>
<p>Based on your symptoms, questionnaire scores, and physical exam, we recommend a sleep study to find out whether obstructive sleep apnea (OSA) is the cause of your sleep problems. A sleep study measures your breathing, oxygen levels, and heart rate while you sleep — usually from the comfort of your own home with a small wrist or chest device. The results will help us create a personalized plan to improve your sleep and protect your long-term health.</p>`);

    if (parts.length === 0) return '';

    return `
<h2>Your Sleep Evaluation</h2>
${parts.join('')}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION B — Understanding Your Results (post-study only)
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionB(data) {
    if (getReportStage(data) !== 'post-study') return '';

    const ahi      = data.primaryAHI;
    const severity = ahiSeverityLabel(ahi);
    const ahiRound = Math.round(ahi);
    const ctx      = getVisitContext(data);

    /* — O2 nadir (best available from WatchPAT or PSG) — */
    const nadirRaw = Math.min(
      data.nadir    !== null && data.nadir    !== undefined ? +data.nadir    : 999,
      data.nadirPsg !== null && data.nadirPsg !== undefined ? +data.nadirPsg : 999
    );
    const hasNadir = nadirRaw < 999;
    const nadirNote = hasNadir
      ? ` Your lowest oxygen level during the study was <strong>${Math.round(nadirRaw)}%</strong>${nadirRaw < 80 ? ' — significantly below normal, which puts extra strain on your heart and body' : nadirRaw < 88 ? ' — below the normal range, which can affect your heart and overall health over time' : ''}.`
      : '';

    /* — Plain language AHI explanation (visit-aware) — */
    let ahiExpl;
    if (!ctx.isFirstVisit && severity !== 'normal') {
      // Returning patient: brief reminder, not full explanation
      ahiExpl = `
<p>As a reminder, your sleep study showed an AHI of <strong>${ahiRound} events per hour</strong>, which is in the <strong>${severity} range</strong> for obstructive sleep apnea. This means your breathing was interrupted about ${ahiRound} times every hour of sleep.${nadirNote}</p>`;
    } else {
      ahiExpl = `
<p>During your sleep study, we measured how often your breathing slowed down or stopped while you were asleep. This is called the <strong>Apnea-Hypopnea Index (AHI)</strong>. Your AHI is <strong>${ahiRound} events per hour</strong>, which means your breathing was interrupted about ${ahiRound} times every hour of sleep.${nadirNote}</p>
${severity === 'normal'
  ? '<p>This result is in the <strong>normal range</strong> — fewer than 5 breathing interruptions per hour. While your breathing during sleep appears healthy, we will continue to review your full results with you.</p>'
  : `<p>This places you in the <strong>${severity} range</strong> for obstructive sleep apnea. ${
    severity === 'mild'
      ? 'Even mild sleep apnea can affect how rested you feel and, over time, may have health effects worth addressing.'
      : severity === 'moderate'
        ? 'Moderate sleep apnea has real effects on your energy, mood, and long-term heart and brain health.'
        : 'Severe sleep apnea puts significant stress on your heart, blood pressure, and overall health. Treatment can make a major difference.'
  }</p>`
}`;
    }

    /* — AHI Severity Scale visual — */
    const displayMax = 60;
    const markerPct  = Math.min(Math.max((ahi / displayMax) * 100, 0), 100).toFixed(1);
    const ahiScale   = `
<div class="ahi-scale">
  <div class="ahi-scale-bar">
    <div class="ahi-scale-zone normal"><span class="ahi-zone-label">Normal</span><span class="ahi-zone-range">&lt;5</span></div>
    <div class="ahi-scale-zone mild"><span class="ahi-zone-label">Mild</span><span class="ahi-zone-range">5–14</span></div>
    <div class="ahi-scale-zone moderate"><span class="ahi-zone-label">Moderate</span><span class="ahi-zone-range">15–29</span></div>
    <div class="ahi-scale-zone severe"><span class="ahi-zone-label">Severe</span><span class="ahi-zone-range">≥30</span></div>
  </div>
  <div class="ahi-scale-marker-row">
    <div class="ahi-scale-marker" style="left:${markerPct}%;">${ahiRound}</div>
  </div>
</div>`;

    /* — Symptom subtype description — */
    let subtypeHtml = '';
    const subtype = (data.subtype || '').toLowerCase();
    if (subtype.includes('sleepy')) {
      subtypeHtml = `
<p><strong>Your Sleep Apnea Pattern: Sleepiness-Predominant</strong><br>
Many people with sleep apnea feel sleepy during the day — and your results suggest this fits you. When your breathing is interrupted repeatedly during the night, your body is briefly woken up each time to reopen the airway. Even if you don't remember these wake-ups, they fragment your sleep and prevent you from reaching the deeper, restorative stages. The result is that you feel tired even after a full night in bed. The good news: effective treatment often brings dramatic improvements in daytime energy.</p>`;
    } else if (subtype.includes('disturbed') || subtype.includes('comisa')) {
      subtypeHtml = `
<p><strong>Your Sleep Apnea Pattern: COMISA (Insomnia + Sleep Apnea)</strong><br>
Your results show a pattern called COMISA — comorbid insomnia and obstructive sleep apnea. This means you have both difficulty sleeping (insomnia) and breathing interruptions during sleep (sleep apnea), and the two conditions can make each other worse. People with COMISA often have trouble falling asleep or staying asleep, and may feel anxious about sleep itself. Treating just one condition without addressing the other often leads to incomplete improvement. Your care plan will be designed to address both.</p>`;
    } else if (subtype.includes('minimal')) {
      subtypeHtml = `
<p><strong>Your Sleep Apnea Pattern: Minimally Symptomatic</strong><br>
Not everyone with sleep apnea feels tired or has obvious symptoms — and you appear to fall into this category. Even so, the repeated drops in oxygen and the strain of repeatedly reopening the airway take a quiet toll on the heart, blood pressure, and brain over time. People with untreated sleep apnea — even those who feel fine — have higher rates of high blood pressure, heart disease, and stroke. Treating sleep apnea now is an investment in your long-term health.</p>`;
    }

    const sectionTitle = ctx.isFirstVisit ? 'Understanding Your Results' : 'Your Sleep Apnea Summary';

    return `
<h2>${sectionTitle}</h2>
${ahiExpl}
${ahiScale}
${subtypeHtml}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION B2 — Normal AHI: What Your Study Found (snoring/UARS pathway)
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionB2(data) {
    if (getReportStage(data) !== 'post-study') return '';
    if (data.primaryAHI === null || data.primaryAHI === undefined || data.primaryAHI >= 5) return '';

    const parts = [];

    parts.push(`<p>Your sleep study did not find obstructive sleep apnea. Your AHI (Apnea-Hypopnea Index) is <strong>${Math.round(data.primaryAHI)}</strong>, which falls in the <strong>normal range</strong> (fewer than 5 breathing interruptions per hour). This is reassuring news about your breathing during sleep.</p>`);

    /* Highlight useful findings even in normal study */
    const findings = [];
    if (data.snoringReported || (data.snoreIdx && data.snoreIdx > 0)) {
      findings.push(`Your study recorded an elevated snoring level (snore index: ${data.snoreIdx || 'detected'}). While snoring is not the same as sleep apnea, it indicates partial airway narrowing during sleep that can affect sleep quality for you and your bed partner.`);
    }
    if (data.odi && data.odi >= 5) {
      findings.push(`Your oxygen desaturation index (ODI) was ${data.odi}, meaning your oxygen dropped ${data.odi} times per hour — slightly elevated even with a normal AHI. This is worth monitoring.`);
    }
    if (data.supPahi && data.nonSupPahi && data.supPahi > data.nonSupPahi * 2) {
      findings.push(`Your breathing was noticeably worse when sleeping on your back (supine AHI ${Math.round(data.supPahi)}) compared to your side (${Math.round(data.nonSupPahi)}). This positional pattern can contribute to snoring.`);
    }
    if (findings.length > 0) {
      parts.push('<h3 style="font-size:1rem;font-weight:700;color:#1F3A5C;margin-top:1.25rem;margin-bottom:0.5rem;">Notable Findings</h3>');
      findings.forEach(f => parts.push(`<p>${f}</p>`));
    }

    /* UARS detection */
    const uars = OSAReportShared.detectUARS({
      ahi: data.primaryAHI,
      rdi: data.patRdi,
      arInd: data.arInd,
      ess: data.ess,
      isi: data.isi,
    });

    if (uars.isUARS) {
      parts.push(`
<div class="comisa-callout">
  <strong>Possible Upper Airway Resistance Syndrome (UARS)</strong>
  <p style="margin:0.4rem 0 0;">Although your AHI is normal, your symptoms and some patterns in your study suggest a possible condition called <strong>upper airway resistance syndrome (UARS)</strong>. In UARS, the airway narrows during sleep enough to disrupt sleep quality — causing daytime tiredness, difficulty concentrating, or poor sleep — without fully blocking airflow the way sleep apnea does. Home sleep tests can sometimes miss UARS because it requires more detailed monitoring to detect. Your doctor may recommend an in-lab sleep study for a more thorough evaluation.${uars.rdiElevated ? ` Notably, your RDI (${Math.round(uars.rdi)}) is significantly higher than your AHI (${Math.round(data.primaryAHI)}), which suggests your airway was causing partial breathing disruptions that did not meet the threshold for apnea.` : ''}</p>
</div>`);
    }

    if (parts.length <= 1) return '';  // Just the "normal" paragraph — not enough to warrant a section

    return `\n<h2>What Your Sleep Study Found</h2>\n${parts.join('')}`;
  }

  function renderDataLimitations(data) {
    if (getReportStage(data) !== 'post-study') return '';
    const domains = Array.isArray(data.insufficientDataDomains) ? data.insufficientDataDomains : [];
    const patientNotes = domains
      .map(domain => exists(domain?.patient) ? domain.patient : '')
      .filter(Boolean);

    if (!patientNotes.length) return '';

    return `
<div class="alert alert-warning">
  <strong>What may still be refined</strong>
  <p style="margin:0.4rem 0 0;">Some parts of your treatment discussion may be refined as more information is gathered.</p>
  <ul style="margin:0.5rem 0 0;">
    ${patientNotes.map(note => `<li>${esc(note)}</li>`).join('')}
  </ul>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION C — What's Contributing to Your Sleep Apnea
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionC(data) {
    const phen = data.phen || [];
    if (getReportStage(data) !== 'post-study') return '';
    if (data.primaryAHI < 5) return '';  // Normal AHI handled by Section B2

    /* Zero phenotypes — provide context instead of blank gap */
    if (phen.length === 0) {
      return `
<h2>About Your Sleep Apnea</h2>
<p>Your sleep study confirmed obstructive sleep apnea, but your results did not show a strong pattern in the common contributing factors we test for (such as anatomical narrowing, positional dependence, or breathing instability). This is not unusual — many patients have sleep apnea caused by a combination of subtle factors rather than one dominant pattern. Your treatment plan is still tailored to your severity level and personal circumstances, and your doctor will work with you to find the most effective approach.</p>`;
    }

    const iconMap = {
      'High Anatomical Contribution':  'bi-body-text',
      'Low Arousal Threshold':         'bi-alarm',
      'High Loop Gain':                'bi-arrow-repeat',
      'Poor Muscle Responsiveness':    'bi-lightning',
      'Positional OSA':                'bi-arrow-left-right',
      'REM-Predominant OSA':           'bi-moon-stars',
      'High Hypoxic Burden':           'bi-heart-pulse',
      'Nasal-Resistance Contributor':  'bi-wind',
      'Elevated Delta Heart Rate':     'bi-activity',
    };

    const descMap = {
      'High Anatomical Contribution': `The physical structure of your airway is an important factor in your sleep apnea. This can include enlarged tonsils, a recessed jaw, excess tissue in the throat, or a narrow palate. When these features are present, the airway has less room to stay open, especially when the muscles relax during sleep. Treatments that target the airway physically — such as oral appliances, certain surgeries, or Inspire therapy — often work especially well for this pattern.`,

      'Low Arousal Threshold': `Your brain appears to wake up more easily than average when breathing becomes difficult during sleep. While this seems like it might be helpful, it actually prevents your airway muscles from having enough time to recover and reopen the airway on their own. Instead of one sustained blockage, you may experience many brief, fragmented wake-ups that disrupt sleep without you even realizing it. This pattern often responds well to treatments that stabilize breathing and reduce how often the brain needs to intervene.`,

      'High Loop Gain': `Your body's breathing control system may be set to a hair-trigger sensitivity — like a thermostat that overreacts to small changes. When your breathing slows slightly during sleep, your body may over-correct by breathing too fast, then too slow, creating an unstable cycle. This pattern is sometimes associated with a history of heart or lung conditions. Treatments that stabilize breathing rhythms, including certain CPAP settings, positional therapy, or medications in some cases, can help regulate this cycle.`,

      'Poor Muscle Responsiveness': `The muscles around your airway may not be responding as strongly as expected when breathing gets difficult. Normally, when the airway starts to close, a reflex tightens the throat muscles to help hold it open. In your case, that response may be weaker, especially during dream (REM) sleep when muscles are naturally more relaxed. This pattern can matter when we discuss treatment options, including whether therapies that physically support the airway might be a better fit.`,

      'Positional OSA': `Your sleep apnea is significantly worse when you sleep on your back. Gravity pulls the tongue and throat tissue backward when you are in the supine (back-sleeping) position, narrowing or blocking the airway. When you sleep on your side, the airway stays more open and breathing is easier. Positional therapy — using a device or pillow to encourage side-sleeping — can reduce your sleep apnea events substantially and may be one of the most straightforward parts of your treatment plan.`,

      'REM-Predominant OSA': `Your breathing problems are concentrated during REM sleep — the stage of sleep when you dream. During REM, your brain intentionally relaxes most of your body's muscles (so you don't act out your dreams), and this includes the muscles that hold the airway open. As a result, the airway is more likely to collapse during this stage. Because REM sleep is essential for memory, emotion, and mental health, disruptions to it can have an outsized impact on how you feel. CPAP therapy is particularly effective at protecting REM sleep.`,

      'High Hypoxic Burden': `Your sleep study showed significant drops in blood oxygen during the night. When the airway blocks repeatedly, the oxygen level in your blood can fall well below normal. These oxygen dips put stress on the heart, blood vessels, and brain. Over time, this pattern is associated with higher risks of high blood pressure, heart disease, and other complications. Your treatment plan will prioritize reducing these oxygen drops, and follow-up testing will confirm that your oxygen levels have normalized.`,

      'Nasal-Resistance Contributor': `Blockage or narrowing in your nasal passages is playing a role in your sleep apnea. When the nose is congested or structurally narrowed, breathing through the nose takes more effort, and the body may switch to mouth breathing during sleep. Mouth breathing bypasses the nose's ability to support the airway and makes it easier for the throat to collapse. Addressing nasal obstruction — whether with medications, nasal strips, or surgery — can improve how well other sleep apnea treatments work.`,

      'Elevated Delta Heart Rate': `Your heart rate shows larger-than-normal swings during the night, rising sharply when breathing is blocked and then dropping when the airway reopens. These repeated spikes put extra strain on the heart and blood vessels, similar to intermittent bursts of exercise throughout the night. Over years, this cardiovascular stress raises the risk of high blood pressure and heart rhythm problems. Effective sleep apnea treatment typically brings these heart rate swings back to normal, relieving this hidden burden on the heart.`,
    };

    const items = phen.map(p => {
      const icon = iconMap[p] || 'bi-circle';
      const desc = descMap[p] || 'This is a recognized pattern in your sleep study results. Your care team will explain what this means for your specific situation.';
      return `
<div class="phenotype-item">
  <i class="bi ${esc(icon)} phenotype-icon"></i>
  <div>
    <strong>${esc(p)}</strong>
    <p style="margin-top:0.25rem;margin-bottom:0;">${esc(desc)}</p>
  </div>
</div>`;
    }).join('');

    return `
<h2>What's Contributing to Your Sleep Apnea</h2>
<p>Sleep apnea is not one-size-fits-all. Your results show specific patterns that help explain why your airway has trouble staying open during sleep. Understanding these patterns allows us to choose treatments that are most likely to work for you.</p>
${items}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION D — Your Treatment Plan
     ══════════════════════════════════════════════════════════════════════════ */

  /* ── Patient-friendly descriptions keyed by recommendation tag ── */
  const recDescriptions = {
    'CPAP': `<strong>CPAP Therapy</strong> — CPAP (Continuous Positive Airway Pressure) is the most widely studied and effective treatment for obstructive sleep apnea. It uses a gentle stream of air delivered through a mask to keep your airway open while you sleep. Modern CPAP machines are quiet, compact, and have features like auto-adjusting pressure and heated humidifiers to improve comfort. Most people notice better energy and sleep quality within the first few weeks of consistent use.`,
    'CPAP-ALT': null,  // Merged into CPAP context — not shown as standalone
    'CPAP-PREF': null,  // Merged into CPAP context
    'CPAP-OPT': null,  // Merged into CPAP context
    'CPAP-DESENTIZE': null,  // Merged into CPAP context
    'CPAP-HUMID': null,  // Merged into CPAP context
    'CPAP-RETITRATE': null,  // Merged into CPAP context
    'CPAP-FIXED': null,  // Merged into CPAP context
    'MAD': `<strong>Oral Appliance Therapy</strong> — An oral appliance (also called a mandibular advancement device) is a custom-fitted mouthguard worn during sleep. It gently moves your lower jaw forward to keep the airway open. Oral appliances are a good option for many patients, especially those with mild to moderate sleep apnea, and research shows they achieve similar improvements in quality of life and blood pressure as CPAP due to better adherence. They are made by a sleep dentist and adjusted over several visits. A follow-up sleep study is recommended to confirm the appliance is working effectively.`,
    'MAD-FAVORABLE': `<strong>Oral Appliance Therapy (Favorable Candidate)</strong> — An oral appliance is a custom-fitted mouthguard worn during sleep that gently repositions your lower jaw forward to keep the airway open. Based on your profile, you are a <strong>particularly good candidate</strong> for this treatment. Research shows that patients like you — with your combination of sleep apnea severity, body type, and sleep patterns — tend to respond very well to oral appliance therapy. In fact, studies show that oral appliances achieve similar improvements in quality of life, daytime energy, and blood pressure as CPAP, largely because patients find them easier to use consistently. Your sleep dentist will custom-fit the device and adjust it over several visits, followed by a sleep study to confirm it is working.`,
    'MAD-POOR': `<strong>Oral Appliance Therapy</strong> — An oral appliance is a custom-fitted mouthguard worn during sleep that repositions the lower jaw forward to help keep the airway open. While oral appliances can help many patients, your profile suggests this treatment <strong>may not be sufficient on its own</strong> for your level of sleep apnea. Patients with more severe OSA, higher BMI, or certain breathing patterns tend to have a lower success rate with oral appliances alone. That said, an oral appliance can still play a role as part of a combined treatment approach — for example, alongside positional therapy or after weight loss. This is worth discussing with your doctor if other options are not tolerated.`,
    'POS': `<strong>Positional Therapy</strong> — Because your sleep apnea is significantly worse when sleeping on your back, changing your sleep position can make a real difference. Positional therapy devices (such as a vibrating alarm worn on the back or a specially shaped pillow) remind you to sleep on your side. For some patients, this alone can cut the number of breathing events in half or more. It is often used alongside other treatments for the best results.`,
    'POS-GUARD': null,  // Contextual note — appended to POS, not shown standalone
    'OXYGEN-WORKUP': `<strong>Complete Oxygen-Risk Review</strong> — Part of your sleep-study oxygen data is still incomplete or has not yet been reviewed in full. Before we call your oxygen-related risk low or move CPAP lower on the list, your care team should confirm your oxygen desaturation index (ODI), time below 90%, lowest oxygen level, and any available hypoxic-burden metrics from the full report.`,
    'POSITION-WORKUP': `<strong>Review Positional Data Before Ruling Position In or Out</strong> — Your available sleep-study report does not clearly show how your breathing changed on your back compared with your side. Before we decide that positional therapy is irrelevant, your care team may need to review the full study or repeat testing with better positional tracking.`,
    'SLEEP-STAGE-WORKUP': `<strong>Review REM-Sleep Data Before Ruling Out REM Worsening</strong> — Some patients breathe much worse during REM (dream) sleep than during the rest of the night. Your available data do not clearly separate REM from non-REM breathing yet, so REM-specific treatment decisions should stay flexible until that part of the study is confirmed.`,
    'ENDOTYPE-WORKUP': `<strong>Complete the Detailed Event Breakdown Before Final Endotype Matching</strong> — Some of the more advanced breathing-pattern estimates in sleep apnea depend on knowing how many events were full apneas versus partial obstructions (hypopneas). That breakdown is not fully available yet, so some of the finer endotype-based treatment matching still needs the detailed scoring report before it should be treated as complete.`,
    'ANATOMY-WORKUP': `<strong>Complete Airway Exam Before Finalizing Anatomy-Based Treatments</strong> — Some anatomy-based options depend on a fuller airway exam than we have documented so far. Before we commit to surgery-focused plans or decide how strong a candidate you are for certain devices, your ENT team should complete and document the key airway findings such as tonsil size, Friedman tongue position, and body-size measures used for treatment matching.`,
    'HNS-WORKUP': `<strong>Complete the Inspire Evaluation First</strong> — Inspire can only be judged accurately after a formal workup. That usually includes a sleep endoscopy (DISE) to watch how your airway collapses during sleep and the staging inputs used to estimate response. Until that is done, Inspire should stay in the “possible option” category rather than a finalized recommendation.`,
    'MAD-WORKUP': `<strong>Confirm Oral Appliance Safety First</strong> — Before an oral appliance is finalized, a sleep dentist should confirm that your teeth, jaw movement, and jaw joints make it a safe fit. That includes checking that there is enough healthy tooth support, enough lower-jaw movement, and no major TMJ problem that would make the device hard to tolerate.`,
    'MAD-SAFETY-LIMIT': `<strong>Oral Appliance May Not Be a Safe Fit Right Now</strong> — Your current dental or jaw findings make an oral appliance less likely to be a safe or practical treatment at this stage. Problems such as limited tooth support, limited jaw movement, or significant TMJ disease can make a mandibular advancement device hard to fit or hard to tolerate. Your care team may still revisit it later if a sleep dentist feels those concerns can be addressed safely.`,
    'CENTRAL-PSG-WORKUP': `<strong>Confirm Central-Breathing Findings With a Lab Sleep Study</strong> — Your home sleep study showed breathing-instability signals that can suggest central sleep apnea or periodic breathing, but those findings are usually confirmed with a full in-lab sleep study before advanced treatments such as ASV are chosen. That extra step helps your care team make sure the pattern is truly central and that the treatment is matched safely.`,
    'ASV-SAFETY': `<strong>Confirm Heart-Function Safety Before ASV</strong> — Some advanced PAP devices, especially ASV, are only appropriate after your care team confirms that your heart function is in a safe range. If ASV comes up as an option, your sleep specialist may review a recent echocardiogram or ask for heart-function testing first.`,
    'ASV-CONTRA': `<strong>Reduced Heart Function Makes ASV Unsafe Right Now</strong> — One type of advanced PAP therapy, ASV, is not considered safe when the heart’s pumping function is reduced below the accepted safety range. If your plan still needs help for central-breathing instability, that discussion should stay with your sleep specialist and heart team rather than treating ASV as a routine option.`,
    'SURGERY-WORKUP': `<strong>Complete DISE-Guided Surgical Planning First</strong> — If surgery is being considered, your ENT team may still need a sleep endoscopy (DISE) to see exactly where your airway collapses during sleep. That helps match the procedure to the actual collapse pattern instead of guessing from symptoms alone.`,
    'HNS': `<strong>Inspire Upper Airway Stimulation (Inspire Therapy)</strong> — Inspire is a small, implanted device that stimulates the nerve controlling the tongue muscle, keeping the airway open during sleep. Unlike CPAP, there is no mask or airflow — the device works automatically while you sleep. Inspire is FDA-approved for people who have moderate-to-severe sleep apnea, have not been helped by CPAP, and meet specific criteria. A candidacy evaluation will determine whether this option is right for you.`,
    'WEIGHT': `<strong>Weight Management</strong> — Excess weight is one of the most significant reversible risk factors for sleep apnea. Even a modest reduction in body weight — as little as 10% — can meaningfully reduce the number of breathing events per hour. Losing weight can also improve how well other treatments (like CPAP or oral appliances) work. Your doctor can connect you with resources such as dietitians, structured programs, and other forms of medical support when appropriate.`,
    'NASAL-OPT': `<strong>Nasal Treatment</strong> — Treating nasal obstruction can improve airflow and make other sleep apnea therapies work better. Depending on your anatomy, options may include nasal steroid sprays, allergy treatment, nasal dilator strips, or surgical procedures such as septoplasty (to straighten a deviated septum) or turbinate reduction (to shrink enlarged nasal tissue). Your ENT surgeon will review your specific anatomy and recommend the most appropriate approach.`,
    'NASAL-SURG': null,  // Merged into NASAL-OPT
    'NASAL-PRIOR': null,  // Merged into NASAL-OPT
    'TONSIL': `<strong>Tonsil Surgery (Tonsillectomy)</strong> — If your tonsils are significantly enlarged, removing them can dramatically open the back of the throat and reduce or even eliminate sleep apnea in appropriate candidates. Tonsillectomy is a same-day surgical procedure performed under general anesthesia. Recovery typically takes 1–2 weeks. For patients with large tonsils, this can be one of the most impactful single-step treatments available.`,
    'CBTI': `<strong>CBT-I (Cognitive Behavioral Therapy for Insomnia)</strong> — CBT-I is the gold-standard, non-medication treatment for insomnia. It works by changing the thoughts and habits that interfere with sleep — things like irregular sleep schedules, spending too much time in bed, or anxiety about sleep. CBT-I is highly effective and its benefits last long-term, unlike sleep medications. It can be done with a therapist in-person or through a validated digital program.`,
    'SURGALT': `<strong>Airway Surgery</strong> — For patients whose sleep apnea is related to the physical structure of their throat or jaw, surgical procedures can open the airway and reduce or eliminate breathing events during sleep. Options depend on your specific anatomy and may include procedures on the palate, tongue base, or jaw. A sleep endoscopy (DISE) — a brief procedure performed under light sedation — allows your ENT surgeon to see exactly where and how your airway collapses during sleep, and is used to determine which surgical approach is most appropriate for you.`,
    'HLG-ADV': `<strong>Alternative PAP Therapy</strong> — When standard CPAP is not the best fit, other positive airway pressure devices may work better. BiPAP (bilevel) uses different pressures for breathing in and out, which some people find more comfortable. ASV (adaptive servo-ventilation) automatically adjusts to your breathing pattern and is especially helpful for certain types of breathing instability during sleep. Your sleep specialist will determine which device is right for you, and if ASV is being considered they may need to confirm that your heart function is in a safe range first.`,
    'REM-CHECK': null,  // Clinical detail — not shown as standalone
    'REM-MAD': null,  // Merged into MAD if present
    'HB-URG': null,  // Urgency note — woven into Why This Matters
    'DHR-TX': null,  // Clinical detail
    'SLEEP-STUDY': `<strong>Sleep Study</strong> — A sleep study measures your breathing, oxygen levels, heart rate, and sleep stages to get a full picture of what's happening while you sleep. Depending on your situation, this may be a home sleep test (a small device you wear overnight at home) or an in-lab study (which captures more detailed data in a monitored sleep center). The results will guide your treatment decisions.`,
    'UARS-EVAL': `<strong>Evaluation for Upper Airway Resistance Syndrome (UARS)</strong> — Your home sleep study did not show obstructive sleep apnea, but your symptoms and some patterns in your results suggest you may have a related condition called upper airway resistance syndrome (UARS). In UARS, the airway narrows enough to disrupt sleep without fully blocking airflow — which means a home test may not detect it. An in-lab sleep study with more detailed monitoring can identify this condition and guide treatment.`,
    'SNORE-ALCOHOL': `<strong>Avoid Alcohol Before Bed</strong> — Alcohol relaxes the muscles in your throat, making snoring worse and increasing the chance of airway collapse during sleep. Avoiding alcohol within 3 hours of bedtime can noticeably reduce snoring and improve sleep quality.`,
    'SNORE-LIFESTYLE': `<strong>Reducing Snoring While We Wait for Results</strong> — There are several things you can start doing now to reduce snoring. <strong>Sleep on your side</strong> — snoring is usually worse on your back because gravity pulls the tongue and soft tissues into the airway. A body pillow or positional device can help. <strong>Avoid alcohol within 3 hours of bedtime</strong> — alcohol relaxes the throat muscles, making snoring louder and more frequent. <strong>Maintain a healthy weight</strong> — even modest weight loss (as little as 5–7 pounds) can noticeably reduce snoring by decreasing tissue bulk around the airway. <strong>Stay active</strong> — regular aerobic exercise may reduce snoring independent of weight loss. <strong>Reduce sedative use</strong> — benzodiazepines and other sedating medications relax the airway and worsen snoring when possible to avoid. These steps form the foundation of snoring management and will also help with any sleep apnea treatment we recommend after your sleep study.`,
    'INSPIRE-EVAL': `<strong>Inspire Candidacy Evaluation</strong> — You have expressed interest in Inspire therapy. Inspire is FDA-approved for patients with moderate-to-severe sleep apnea who have not been helped by CPAP. A candidacy evaluation involves a sleep endoscopy (DISE) to assess your airway anatomy. Your ENT surgeon will review whether Inspire is a good option for you.`,
    'INSPIRE-OPT': null,  // Inspire already in place — clinical detail
    'COMISA-PAP': null,  // COMISA-specific CPAP detail — merged
    'COMISA-SRT-CAUTION': null,  // Clinical detail
    'SURG': `<strong>Airway Surgery</strong> — For patients whose sleep apnea is related to the physical structure of their throat or jaw, surgical procedures can open the airway and reduce or eliminate breathing events during sleep. Options depend on your specific anatomy and may include procedures on the palate, tongue base, or jaw. A sleep endoscopy (DISE) — a brief procedure performed under light sedation — allows your ENT surgeon to see exactly where and how your airway collapses during sleep, and is used to determine which surgical approach is most appropriate for you.`,
    'SOFT-TISSUE-REVISION': null,  // Clinical detail
    'SOFT-TISSUE-STRONG': null,  // Merged into tonsil/surgery recs
    'SOFT-TISSUE-CONSIDER': null,
    'SOFT-TISSUE-GENERAL': null,
    'DHR-CARDS': null,  // Clinical detail
    'NASAL-SINUS-PRIOR': null,  // Clinician-only: prior sinus surgery
    'FRIEDMAN-III-ALT': null,  // Clinician-only surgical routing
    'COMBI-PRIOR': null,  // Clinician-only: prior MAD + UPPP + CPAP combo
    'SURG-PREF': null,  // Clinician-only: patient prefers surgery
    'MILD-LIFESTYLE': `<strong>Lifestyle Modifications First</strong> — Your sleep apnea is in the mild range and does not show a strong pattern pointing to one specific cause. For many patients in this situation, starting with lifestyle changes can make a meaningful difference: maintaining a healthy weight, sleeping on your side, keeping your nasal passages clear, and avoiding alcohol before bed. Your doctor may recommend a repeat sleep study in 6 to 12 months to see how these changes have affected your results before starting device-based therapy.`,
  };

  /* Tags that are sub-items of CPAP — should not render as standalone recs */
  const cpapSubTags = new Set(['CPAP-ALT','CPAP-PREF','CPAP-OPT','CPAP-DESENTIZE','CPAP-HUMID','CPAP-RETITRATE','CPAP-FIXED']);
  const nasalSubTags = new Set(['NASAL-SURG','NASAL-PRIOR']);
  const suppressedTags = new Set(['POS-GUARD','REM-CHECK','REM-MAD','HB-URG','DHR-TX']);

  /**
   * Map a rec tag to its patient-friendly HTML, or return null if it should be suppressed.
   */
  function patientFriendlyRec(tag, rawText, data) {
    if (cpapSubTags.has(tag) || nasalSubTags.has(tag) || suppressedTags.has(tag)) return null;
    /* Suppress MAD recs if patient already tried MAD */
    if ((tag === 'MAD' || tag === 'MAD-FAVORABLE' || tag === 'MAD-POOR') && data && data.priorMAD) return null;
    /* Suppress standalone CPAP rec for patients who failed CPAP and won't retry —
       the context box already acknowledges CPAP, and the checklist has a lower-priority
       "try CPAP in the future" note */
    if (tag === 'CPAP' && data && data.cpapFailed && !data.cpapWillRetry) return null;
    /* Inspire with BMI >40 context */
    if (tag === 'HNS' && data && data.bmi > 40) {
      return `<strong>Inspire Upper Airway Stimulation (Inspire Therapy)</strong> — Inspire is a small, implanted device that stimulates the nerve controlling the tongue muscle, keeping the airway open during sleep. Inspire is FDA-approved for patients with moderate-to-severe sleep apnea who have not been helped by CPAP. <strong>Important:</strong> Inspire currently requires a BMI of 40 or below (some insurance plans require an even lower BMI). Since your BMI is currently above this threshold, reaching a BMI under 40 through weight management would be the first step toward Inspire candidacy. This is a goal worth discussing with your care team.`;
    }
    if (tag === 'INSPIRE-EVAL' && data && data.bmi > 40) {
      return `<strong>Inspire Candidacy Evaluation</strong> — You are interested in Inspire therapy. Inspire is generally considered only after CPAP has not worked well enough and after a sleep endoscopy (DISE) confirms the right airway pattern. <strong>Important:</strong> your current BMI is above the FDA-supported range for Inspire, so the first step would be bringing your BMI below 40 and then reviewing candidacy with your ENT surgeon and insurer.`;
    }
    if (tag === 'WEIGHT' && data) {
      const lead = weightReadinessLead(data);
      const support = data.bmi >= 30
        ? 'Your doctor can connect you with resources such as dietitians, structured programs, and, for eligible patients, prescription weight-loss medications such as GLP-1 therapies (for example, Zepbound/tirzepatide).'
        : 'Your doctor can connect you with resources such as dietitians, structured programs, and other forms of medical support when appropriate.';
      return `<strong>Weight Management</strong> — ${lead}Excess weight is one of the most significant reversible risk factors for sleep apnea. Even a modest reduction in body weight — as little as 10% — can meaningfully reduce the number of breathing events per hour. Losing weight can also improve how well other treatments (like CPAP or oral appliances) work. ${support}`;
    }

    /* Mild + Low HB: de-emphasized CPAP description with uncertainty-aware language */
    if (tag === 'CPAP' && data && data.severity?.toLowerCase() === 'mild' && data.lowHypoxicBurden) {
      return `<strong>CPAP Therapy</strong> — CPAP is an effective treatment for sleep apnea at all severity levels. However, for mild sleep apnea with your oxygen profile, other approaches — such as an oral appliance or positional therapy — may be reasonable first-line options and can provide similar patient-centered improvement for many people. CPAP remains an option if you prefer it or if other treatments don't provide enough improvement. If you do try CPAP, modern machines with auto-adjusting pressure and heated humidifiers make it much more comfortable than older models.`;
    }

    /* Enhanced CPAP description for severe patients with limited alternatives */
    if (tag === 'CPAP' && data && data.severity?.toLowerCase() === 'severe' && data.cpapFailed) {
      const limitedAlts = (data.bmi > 40) || data.hasConcentricCollapse ||
        (data.friedmanStage === 'III' || data.friedmanStage === 'IV');
      if (limitedAlts) {
        return `<strong>CPAP Therapy — Why It Matters Most for You</strong> — We know CPAP has been difficult for you, and we take that seriously. But for your level of sleep apnea, CPAP is still the most effective treatment we have — and some of the alternatives that work well for other patients are less likely to work in your case. That's why finding a way to make CPAP work for you is so important.`
          + `<br><br>Here's why CPAP is so effective: it keeps your airway open continuously throughout the night — every breath, every sleep stage, every position. No other treatment can match that level of protection for severe sleep apnea.`
          + `<br><br>Many people struggle with CPAP at first. The most common reasons include mask discomfort, air pressure feeling too high, dry mouth, or feeling claustrophobic. The good news is that today's CPAP machines are very different from older models. Strategies that can help:`
          + `<ul style="margin:0.5rem 0;padding-left:1.5rem;">`
          + `<li><strong>Mask fitting</strong> — There are dozens of mask styles (nasal pillows, nasal masks, full-face masks). A different style can make a dramatic difference in comfort.</li>`
          + `<li><strong>Auto-adjusting pressure (APAP)</strong> — These machines start at a low pressure and only increase when needed, making it easier to fall asleep.</li>`
          + `<li><strong>Heated humidification</strong> — Reduces dry mouth, nasal congestion, and throat irritation.</li>`
          + `<li><strong>Ramp feature</strong> — Starts at very low pressure and gradually increases as you fall asleep.</li>`
          + `<li><strong>Desensitization</strong> — Wearing the mask during relaxing activities (watching TV, reading) for short periods helps your brain get used to the sensation before sleep.</li>`
          + `<li><strong>Treating nasal obstruction</strong> — If your nose is blocked, fixing that first makes CPAP much more tolerable.</li>`
          + `</ul>`
          + `We strongly encourage you to work with your sleep team on a structured CPAP retry plan. Even partial use (4+ hours per night) provides significant health protection for severe sleep apnea.`;
      }
    }

    /* Airway surgery with honest candidacy language for poor surgical candidates */
    if ((tag === 'SURGALT' || tag === 'SURG') && data) {
      const poorSurgicalCandidate = (data.bmi > 40) ||
        (data.friedmanStage === 'III' || data.friedmanStage === 'IV') ||
        data.hasConcentricCollapse;
      if (poorSurgicalCandidate) {
        let reasons = [];
        if (data.bmi > 40) reasons.push('a BMI above 40');
        if (data.friedmanStage === 'III' || data.friedmanStage === 'IV') reasons.push('your airway anatomy (Friedman Stage ' + data.friedmanStage + ')');
        if (data.hasConcentricCollapse) reasons.push('a circular (concentric) pattern of airway collapse seen on your sleep endoscopy');
        const reasonText = reasons.length === 1 ? reasons[0]
          : reasons.slice(0, -1).join(', ') + ' and ' + reasons[reasons.length - 1];
        return `<strong>Airway Surgery</strong> — For some patients, surgical procedures can open the airway and reduce sleep apnea. However, we want to be straightforward with you: based on your evaluation — specifically ${reasonText} — soft tissue surgery on the throat (such as palate or tongue base procedures) is <strong>less likely to fully resolve</strong> your sleep apnea on its own. This doesn't mean surgery has no role in your care — it may still be discussed as part of a combined approach, or to address specific findings like nasal obstruction or enlarged tonsils. But for your overall sleep apnea, other treatments (particularly CPAP) are more likely to provide reliable results. Your ENT surgeon will review the full picture with you.`;
      }
    }

    if (recDescriptions[tag] !== undefined) return recDescriptions[tag];

    /* Fallback: keyword matching for unknown tags */
    const r = rawText.toLowerCase();
    if (r.includes('oral appliance') || r.includes('mandibular')) return recDescriptions['MAD'];
    if (r.includes('positional')) return recDescriptions['POS'];
    if (r.includes('inspire') || r.includes('hypoglossal')) return recDescriptions['HNS'];
    if (r.includes('weight')) return recDescriptions['WEIGHT'];
    if (r.includes('nasal') || r.includes('septoplasty') || r.includes('turbinate')) return recDescriptions['NASAL-OPT'];
    if (r.includes('tonsil')) return recDescriptions['TONSIL'];
    if (r.includes('cbt') || r.includes('cognitive')) return recDescriptions['CBTI'];
    if (r.includes('cpap') || r.includes('pap therapy')) return recDescriptions['CPAP'];
    if (r.includes('sleep study') || r.includes('polysomnography')) return recDescriptions['SLEEP-STUDY'];
    if (r.includes('bipap') || r.includes('asv') || r.includes('alternative pap')) return recDescriptions['HLG-ADV'];
    if (r.includes('surg') || r.includes('site-directed')) return recDescriptions['SURGALT'];

    return esc(rawText);
  }

  function renderSectionD(data) {
    const recTags = getPatientFacingRecEntries(data);
    if (recTags.length === 0) return '';

    /* ── Build deduplicated, ordered rec list ── */
    const seenDescriptions = new Set();
    const allRecs = [];  // {html, tag}
    const isPreStudy = getReportStage(data) === 'pre-study';
    const isNormalStudy = exists(data.primaryAHI) && data.primaryAHI < 5;

    /* For COMISA patients: ensure CBT-I appears first */
    if (data.hasCOMISA) {
      const cbtiEntry = recTags.find(r => r.tag === 'CBTI');
      if (cbtiEntry) {
        const html = patientFriendlyRec('CBTI', cbtiEntry.text, data);
        if (html) { allRecs.push({ html, tag: 'CBTI' }); seenDescriptions.add(html); }
      }
    }

    /* Process remaining recs in order */
    for (const { text, tag } of recTags) {
      const html = patientFriendlyRec(tag, text, data);
      if (!html || seenDescriptions.has(html)) continue;
      seenDescriptions.add(html);
      allRecs.push({ html, tag });
    }

    if (allRecs.length === 0) return '';

    /* Mild + Low HB: move CPAP after alternatives so lifestyle/MAD/positional lead */
    const isMildLowHB = data.severity?.toLowerCase() === 'mild' && data.lowHypoxicBurden;
    const isCpapAvoidant = data.prefAvoidCpap && !data.cpapFailed;
    if (isMildLowHB || isCpapAvoidant) {
      const cpapIdx = allRecs.findIndex(r => r.tag === 'CPAP');
      if (cpapIdx >= 0 && cpapIdx < allRecs.length - 1) {
        const [cpapRec] = allRecs.splice(cpapIdx, 1);
        allRecs.push(cpapRec);  // move to end → falls into "Discuss" group
      }
    }

    /* ── Split into Start Now / Discuss With Your Doctor ── */
    const shouldHoldCpapForDiscuss = (isMildLowHB || isCpapAvoidant) &&
      allRecs.length > 1 &&
      allRecs[allRecs.length - 1]?.tag === 'CPAP';
    const splitAt = shouldHoldCpapForDiscuss
      ? Math.min(3, allRecs.length - 1)
      : Math.min(3, allRecs.length);
    const startNow = allRecs.slice(0, splitAt);
    const discuss  = allRecs.slice(splitAt);

    const sectionTitle = (isPreStudy || isNormalStudy) ? 'Your Next Steps' : 'Your Treatment Plan';
    let output = `\n<h2>${sectionTitle}</h2>`;

    /* ── CPAP context for non-compliant patients — BEFORE the rec list ── */
    const limitedAlternatives = (data.bmi > 40) || data.hasConcentricCollapse ||
      (data.friedmanStage === 'III' || data.friedmanStage === 'IV');
    if (data.cpapFailed && !data.cpapWillRetry && data.severity?.toLowerCase() === 'severe' && limitedAlternatives) {
      output += `
<div class="cpap-context-box">
  <strong>An honest conversation about your options.</strong> We know CPAP has been difficult for you, and we take that seriously. For your level of sleep apnea, though, CPAP provides the most reliable protection — and some alternatives that work well for other patients may be less effective in your case. That's why we want to work with you on strategies to make CPAP more comfortable, while also exploring every other option available. Your treatment plan below includes both CPAP guidance and alternative approaches.
</div>`;
    } else if (data.cpapFailed && !data.cpapWillRetry) {
      output += `
<div class="cpap-context-box">
  <strong>We hear you on CPAP.</strong> We know CPAP hasn't worked well for you in the past, and you're not alone — many people struggle with CPAP masks, pressure, or comfort. Your treatment plan below leads with non-CPAP options that may be a better fit for you. We've also included information about CPAP because it remains the most studied treatment, and CPAP technology has improved significantly in recent years. But our first goal is to find a treatment that works for your life.
</div>`;
    } else if (data.cpapFailed && data.cpapWillRetry) {
      output += `
<div class="cpap-context-box">
  <strong>Giving CPAP another try.</strong> We know CPAP was difficult for you before. Since you're open to trying again, we'll work to make this attempt different — with better mask fitting, optimized pressure settings, and strategies to address the specific issues you experienced. We've also included non-CPAP alternatives in case you decide CPAP still isn't right for you.
</div>`;
    } else if (data.prefAvoidCpap && !data.cpapFailed) {
      output += `
<div class="cpap-context-box">
  <strong>We understand your preference on CPAP.</strong> We know CPAP is not your first choice, and that's okay. Your treatment plan leads with alternatives that may work well for you. We've included information about CPAP because it remains the most effective option for certain severity levels, but we'll focus on finding a treatment that fits your preferences and lifestyle.
</div>`;
    } else if (data.cpapCurrent) {
      output += `
<div class="cpap-context-box">
  <strong>Building on your current CPAP therapy.</strong> You are already using CPAP, which is a great foundation. The recommendations below are designed to work alongside your CPAP and may help improve your results further. We'll discuss whether any adjustments to your current therapy are needed at your follow-up.
</div>`;
    }

    /* ── Mild + Low HB: alternatives-first context ── */
    if (isMildLowHB) {
      output += `
<div class="cpap-context-box" style="border-left-color: #198754;">
  <strong>Why you have good options beyond CPAP.</strong> Your sleep apnea is in the mild range, and your overnight oxygen levels stayed in a lower-risk zone. For patients with this profile, treatments like an oral appliance, positional therapy, and weight management can be reasonable first-line alternatives to CPAP, especially when they fit the patient's goals and are followed with repeat assessment. Your plan below starts with those options while keeping CPAP available if needed.
</div>`;
    }

    if (isPreStudy) {
      output += `\n<p>Before we choose a sleep apnea treatment, the next step is confirming what is happening during sleep and starting any safe support measures that can help in the meantime.</p>`;
    } else if (isNormalStudy) {
      output += `\n<p>Based on your symptoms and the patterns seen on your sleep study, these are the most helpful next steps to discuss or begin now.</p>`;
    } else {
      output += `\n<p>Based on your evaluation, your care team has put together a plan tailored to your results. These recommendations are ordered by priority.</p>`;
    }

    /* ── COMISA callout ── */
    if (data.hasCOMISA) {
      output += `
<div class="comisa-callout">
  <strong>About your insomnia and sleep apnea (COMISA)</strong>
  <p style="margin:0.4rem 0 0;">You have both insomnia and obstructive sleep apnea — a combination called COMISA (co-morbid insomnia and sleep apnea) that affects roughly 30–50% of people with OSA. These two conditions feed each other: insomnia makes it harder to fall asleep and stay asleep, and sleep apnea fragments whatever sleep you do get. Insomnia also makes it significantly harder to adjust to CPAP therapy. That's why your plan includes CBT-I (cognitive behavioral therapy for insomnia) as a priority — treating the insomnia alongside the sleep apnea leads to better outcomes for both.</p>
</div>`;
    }

    /* ── Start Now group ── */
    output += `\n<div class="treatment-group-label">Start Now</div>`;
    startNow.forEach(rec => {
      output += `\n<div class="rec-item">${rec.html}</div>`;
    });

    /* ── Discuss With Your Doctor group ── */
    if (discuss.length > 0) {
      output += `\n<div class="treatment-group-label">Discuss With Your Doctor</div>`;
      discuss.forEach(rec => {
        output += `\n<div class="rec-item">${rec.html}</div>`;
      });
    }

    return output;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION E — Your First 30 Days
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionE(data) {
    const recTags = getPatientFacingRecEntries(data);
    if (recTags.length === 0) return '';

    const tags = new Set(recTags.map(r => r.tag));
    const hasCPAP = tags.has('CPAP') || tags.has('CPAP-OPT') || tags.has('CPAP-FIXED');
    const checkItems = [];

    /* ── Detect patient pathway from milestones ── */
    const ms = Array.isArray(data.milestones) ? data.milestones : [];
    const surgicalKeys = ['DISE Scheduled', 'DISE Completed', 'Surgery Scheduled', 'Post-Op'];
    const isSurgicalPathway = surgicalKeys.some(k => ms.includes(k));
    const diseScheduled = ms.includes('DISE Scheduled');
    const diseCompleted = ms.includes('DISE Completed');
    const surgeryScheduled = ms.includes('Surgery Scheduled');
    const isEstablishedPatient = ms.some(m => m !== 'Initial Eval') ||
      data.cpapCurrent || data.cpapFailed || data.priorMAD || data.priorUPPP || data.priorInspire;

    if (tags.has('SLEEP-STUDY')) {
      const studyLabel = data.studyType === 'psg'
        ? 'in-lab sleep study'
        : data.studyType === 'watchpat'
          ? 'home sleep study'
          : 'sleep study';
      checkItems.push({ text: `Schedule your ${studyLabel} and complete it as soon as you can so we can confirm whether sleep apnea is present and choose the right treatment.`, group: 'treatment' });
    }

    if (tags.has('OXYGEN-WORKUP')) {
      checkItems.push({
        text: 'Ask your care team to review the full oxygen portion of your sleep study report so your overnight oxygen burden and cardiovascular-risk discussion can be finalized accurately.',
        group: 'treatment'
      });
    }

    if (tags.has('POSITION-WORKUP')) {
      checkItems.push({
        text: 'Ask whether the full sleep-study report captured enough back-sleeping versus side-sleeping data, and whether repeat positional tracking would change your treatment options.',
        group: 'treatment'
      });
    }

    if (tags.has('SLEEP-STAGE-WORKUP')) {
      checkItems.push({
        text: 'Ask your care team whether the REM versus non-REM portion of your study was complete enough to judge if your sleep apnea is worse during dream sleep.',
        group: 'treatment'
      });
    }

    if (tags.has('ENDOTYPE-WORKUP')) {
      checkItems.push({
        text: 'Ask whether the detailed scoring report includes the apnea-versus-hypopnea breakdown needed to fully interpret the more advanced breathing-pattern estimates in your plan.',
        group: 'treatment'
      });
    }

    if (tags.has('CENTRAL-PSG-WORKUP')) {
      const studyLabel = data.studyType === 'watchpat' ? 'home sleep study' : 'sleep study';
      checkItems.push({
        text: `Ask whether the central-breathing signals seen on your ${studyLabel} should be confirmed with an in-lab sleep study before advanced PAP options such as ASV are considered.`,
        group: 'treatment'
      });
    }

    if (tags.has('ANATOMY-WORKUP')) {
      checkItems.push({
        text: 'Schedule or complete a full airway exam with your ENT team so tonsil size, Friedman tongue position, and other anatomy findings are documented before surgery-based decisions are finalized.',
        group: 'treatment'
      });
    }

    /* CBT-I first for COMISA patients */
    if (data.hasCOMISA && tags.has('CBTI')) {
      checkItems.push({ text: 'Ask your doctor for a referral to a CBT-I therapist, or explore a validated digital CBT-I program (such as Sleepio or SomRyst) to get started right away. Starting CBT-I early can also make it easier to use CPAP or other treatments later.', group: 'everyone' });
    }

    /* CPAP — but different messaging for non-compliant/avoidant patients */
    const limitedAlts = (data.bmi > 40) || data.hasConcentricCollapse ||
      (data.friedmanStage === 'III' || data.friedmanStage === 'IV');
    if (hasCPAP) {
      if (data.cpapFailed && !data.cpapWillRetry && data.severity?.toLowerCase() === 'severe' && limitedAlts) {
        // Severe patients with limited alternatives — encourage CPAP retry
        checkItems.push({ text: 'Schedule a CPAP consultation to discuss a fresh start — ask about auto-adjusting (APAP) machines, nasal pillow masks, and heated humidification.', group: 'treatment' });
        checkItems.push({ text: 'Practice wearing the mask for 20–30 minutes during relaxing activities (TV, reading) before trying overnight use.', group: 'treatment' });
        checkItems.push({ text: 'If nasal congestion is an issue, talk to your doctor about treating it first — this can make CPAP significantly more comfortable.', group: 'treatment' });
      } else if ((data.cpapFailed && !data.cpapWillRetry) || (data.prefAvoidCpap && !data.cpapFailed)) {
        // Don't lead with CPAP setup for patients who don't want it
        // Instead, add it further down as a "consider" item
      } else if (data.severity?.toLowerCase() === 'mild' && data.lowHypoxicBurden) {
        // Mild + low HB: don't lead with CPAP — alternatives are equally effective
        // CPAP added further down as a fallback option
      } else if (data.cpapFailed && data.cpapWillRetry) {
        checkItems.push({ text: 'Schedule a CPAP re-fitting appointment — ask about newer mask styles and auto-adjusting machines that may address your prior concerns.', group: 'treatment' });
        checkItems.push({ text: 'Try wearing your mask for 20–30 minutes while watching TV or reading before your first night — this helps your brain get used to the sensation.', group: 'treatment' });
      } else if (!data.cpapFailed) {
        checkItems.push({ text: 'Schedule your CPAP setup appointment with the equipment supplier.', group: 'treatment' });
        checkItems.push({ text: 'Try wearing your mask for 20–30 minutes while watching TV or reading before your first night — this helps your brain get used to the sensation.', group: 'treatment' });
        checkItems.push({ text: 'Aim to use CPAP for at least 4 hours every night. Consistent use, even when imperfect, leads to better results over time.', group: 'treatment' });
      }
    }

    /* Oral appliance — skip if patient already tried MAD, and skip for surgical
       pathway patients unless MAD is specifically recommended (not just SURGALT) */
    const hasMADTag = tags.has('MAD') || tags.has('MAD-FAVORABLE') || tags.has('MAD-POOR');
    const hasMADFromText = recTags.some(r => r.text.toLowerCase().includes('mandibular'));
    if (!data.priorMAD && (hasMADTag || hasMADFromText) && !isSurgicalPathway) {
      checkItems.push({ text: 'Schedule a consultation with a sleep dentist to begin the process of fitting your custom oral appliance.', group: 'treatment' });
    }
    if (tags.has('MAD-WORKUP')) {
      checkItems.push({ text: 'Ask the sleep dentist to confirm that you have enough healthy tooth support, enough jaw movement, and no major TMJ issue before finalizing an oral appliance.', group: 'treatment' });
    }
    if (tags.has('MAD-SAFETY-LIMIT')) {
      checkItems.push({ text: 'Ask whether your current tooth support, jaw movement, or TMJ symptoms make an oral appliance a poor fit before treating it as a real option.', group: 'treatment' });
    }

    /* Positional */
    if (tags.has('POS')) {
      checkItems.push({ text: 'Try a positional sleep device or body pillow to help you stay off your back during sleep.', group: 'treatment' });
      checkItems.push({ text: 'Keep a brief note of what position you wake up in for one week — this will help us see how well the positional therapy is working.', group: 'treatment' });
    }

    /* Weight */
    if (tags.has('WEIGHT')) {
      const firstWeightStep = data.weightLossReadiness === 'ready'
        ? 'Choose one concrete weight-management step to start this week — for example, setting a 5–10 pound short-term goal, planning meals, or starting a regular walking routine.'
        : data.weightLossReadiness === 'considering'
          ? 'Spend a few minutes deciding what feels most realistic right now: a small nutrition change, a walking goal, or a conversation with your doctor about structured support.'
          : data.weightLossReadiness === 'not-ready'
            ? 'Write down one reason weight change could matter for your sleep or health, and one barrier you want your care team to help you work around when you are ready.'
            : 'Set a realistic short-term goal of losing 5–10 pounds and identify one dietary change you can make this week.';
      checkItems.push({ text: firstWeightStep, group: 'everyone' });
      checkItems.push({
        text: data.bmi >= 30
          ? 'Ask your doctor about a referral to a registered dietitian, a structured weight management program, or medical weight loss options such as GLP-1 medications (for eligible patients).'
          : 'Ask your doctor about a referral to a registered dietitian or a structured weight management program for added support.',
        group: 'everyone'
      });
    }

    /* Nasal */
    if (tags.has('NASAL-OPT') || tags.has('NASAL-SURG') || tags.has('NASAL-PRIOR')) {
      checkItems.push({ text: 'Begin saline nasal rinses (such as a neti pot or squeeze bottle) once or twice daily to reduce nasal inflammation and improve airflow.', group: 'everyone' });
      checkItems.push({ text: 'Schedule a follow-up appointment in 4–6 weeks to review your sleep study results, discuss your nasal anatomy and whether a procedure might help, and see how you are responding to nasal saline rinses.', group: 'everyone' });
    }

    /* Inspire — milestone-aware for surgical pathway */
    if (tags.has('HNS') || tags.has('INSPIRE-EVAL')) {
      if (data.bmi && data.bmi > 40) {
        checkItems.push({ text: 'Discuss Inspire therapy with your ENT surgeon — you will need to reach a BMI of 40 or below before a formal candidacy evaluation. Ask about weight management resources to help reach this goal.', group: 'treatment' });
      } else if (diseCompleted) {
        /* DISE already done — next step is reviewing results and scheduling surgery if candidate */
        checkItems.push({ text: 'Your sleep endoscopy (DISE) results will be reviewed with you. If the findings confirm you are a candidate for Inspire, the next step is scheduling the implant procedure.', group: 'treatment' });
      } else if (diseScheduled) {
        /* DISE is upcoming — attend the appointment */
        checkItems.push({ text: 'Attend your upcoming sleep endoscopy (DISE) appointment — this brief procedure under light sedation will allow your surgeon to see exactly how your airway behaves during sleep and determine whether Inspire is the right option for you.', group: 'treatment' });
      } else if (isSurgicalPathway) {
        /* On surgical pathway but DISE not yet scheduled — schedule it */
        checkItems.push({ text: 'Schedule a sleep endoscopy (DISE) with your ENT surgeon — this brief procedure under light sedation is needed to evaluate your airway and determine whether Inspire therapy is right for you.', group: 'treatment' });
      } else {
        /* Not on surgical pathway yet — schedule evaluation */
        checkItems.push({ text: 'Schedule an Inspire candidacy evaluation with your ENT surgeon, which includes a sleep endoscopy (DISE) to assess your airway anatomy and determine whether you qualify for the implant procedure.', group: 'treatment' });
      }
    }

    if (tags.has('HNS-WORKUP') && !tags.has('HNS') && !tags.has('INSPIRE-EVAL')) {
      if (data.bmi && data.bmi > 40) {
        checkItems.push({ text: 'If Inspire remains an interest, start by discussing weight-management support with your care team because BMI needs to be below 40 before formal candidacy can be finalized.', group: 'treatment' });
      }
      if (diseCompleted) {
        checkItems.push({ text: 'Review your completed DISE and staging results with your ENT surgeon before deciding whether Inspire is truly a good fit.', group: 'treatment' });
      } else if (diseScheduled) {
        checkItems.push({ text: 'Attend your upcoming DISE appointment so your airway pattern can be documented before any Inspire decision is made.', group: 'treatment' });
      } else {
        checkItems.push({ text: 'Schedule the remaining Inspire workup steps, including DISE and any missing staging measurements, before treating Inspire as a finalized option.', group: 'treatment' });
      }
    }

    if (tags.has('SURGERY-WORKUP') && !tags.has('HNS-WORKUP')) {
      checkItems.push({ text: 'Schedule or complete a sleep endoscopy (DISE) before choosing a specific airway surgery, so the procedure can be matched to the exact collapse pattern.', group: 'treatment' });
    }

    if (tags.has('ASV-SAFETY')) {
      checkItems.push({ text: 'If advanced PAP such as ASV is discussed, ask whether a recent echocardiogram or other heart-function result is needed before that option is considered safe.', group: 'treatment' });
    }
    if (tags.has('ASV-CONTRA')) {
      checkItems.push({ text: 'Ask whether your current heart-function result changes the plan for central-breathing instability and whether any non-ASV options or cardiology review are needed instead.', group: 'treatment' });
    }

    /* UARS */
    if (tags.has('UARS-EVAL')) {
      checkItems.push({ text: 'Ask your doctor about scheduling an in-lab overnight sleep study (polysomnography) to evaluate for upper airway resistance syndrome.', group: 'treatment' });
    }

    /* Inspire optimization (prior implant) */
    if (tags.has('INSPIRE-OPT') && data.priorInspire) {
      checkItems.push({ text: 'Schedule a follow-up with your Inspire specialist to verify device activation and optimize settings.', group: 'treatment' });
    }

    /* Hypoxic burden urgency — only for new patients who aren't already established
       in care. Established patients already have a treatment plan in motion. */
    if (tags.has('HB-URG') && !isEstablishedPatient) {
      checkItems.push({ text: 'Schedule your first treatment appointment as soon as possible — your oxygen levels during sleep need prompt attention for your heart health.', group: 'everyone' });
    }

    /* Mild lifestyle-first */
    if (tags.has('MILD-LIFESTYLE')) {
      checkItems.push({ text: 'Start with lifestyle changes: sleep on your side, maintain a healthy weight, keep your nose clear, and avoid alcohol before bed.', group: 'treatment' });
      checkItems.push({ text: 'Schedule a repeat sleep study in 6–12 months to reassess after lifestyle modifications.', group: 'treatment' });
    }

    /* CBT-I (non-COMISA — already handled above for COMISA) */
    if (!data.hasCOMISA && tags.has('CBTI')) {
      checkItems.push({ text: 'Ask your doctor for a referral to a CBT-I therapist, or explore a validated digital CBT-I program (such as Sleepio or SomRyst) to get started right away.', group: 'everyone' });
    }

    /* CPAP as lower-priority for mild + low HB patients */
    if (hasCPAP && data.severity?.toLowerCase() === 'mild' && data.lowHypoxicBurden) {
      checkItems.push({ text: 'CPAP is also an option if other treatments don\'t provide enough improvement. Ask your doctor about it at your follow-up if needed.', group: 'consider' });
    }

    /* CPAP as lower-priority for non-compliant/avoidant patients —
       but skip if severe+limitedAlts path already added detailed CPAP retry steps above */
    const alreadyHasCPAPRetry = data.cpapFailed && !data.cpapWillRetry &&
      data.severity?.toLowerCase() === 'severe' && limitedAlts;
    if (hasCPAP && !alreadyHasCPAPRetry && ((data.cpapFailed && !data.cpapWillRetry) || (data.prefAvoidCpap && !data.cpapFailed))) {
      checkItems.push({ text: 'If you are open to trying CPAP in the future, ask about newer auto-adjusting machines and mask styles — the technology has improved significantly. Treating nasal obstruction first can also make CPAP more comfortable.', group: 'consider' });
    }

    /* Follow-up — skip for surgical pathway (their next steps are DISE/surgery,
       not a generic 4-6 week follow-up). Combine with nasal if both would appear. */
    const hasNasalFollowUp = tags.has('NASAL-OPT') || tags.has('NASAL-SURG') || tags.has('NASAL-PRIOR');
    if (isSurgicalPathway) {
      /* Surgical pathway patients: next step is DISE or surgery — already covered above */
    } else if (hasNasalFollowUp) {
      /* Nasal follow-up already scheduled above — just add the timeline */
    } else {
      checkItems.push({
        text: getReportStage(data) === 'pre-study'
          ? 'Schedule a follow-up appointment after your sleep study so we can review the results together and decide on the right treatment plan.'
          : 'Schedule a follow-up appointment in 4–6 weeks to review your progress and adjust your treatment plan if needed.',
        group: 'everyone'
      });
    }

    const seenChecklistItems = new Set();
    const uniqueCheckItems = checkItems.filter(ci => {
      const key = ci.group + '::' + ci.text;
      if (seenChecklistItems.has(key)) return false;
      seenChecklistItems.add(key);
      return true;
    });

    const GROUP_META = {
      everyone:  { label: 'For Everyone',      subtitle: 'These steps are helpful regardless of which treatment you choose.' },
      treatment: { label: 'For Your Treatment', subtitle: 'These steps are specific to the treatment plan your doctor recommended.' },
      consider:  { label: 'Worth Considering',  subtitle: null }
    };
    const GROUP_ORDER = ['everyone', 'treatment', 'consider'];

    let itemsHTML = '';
    for (const groupKey of GROUP_ORDER) {
      const groupItems = uniqueCheckItems.filter(ci => ci.group === groupKey);
      if (groupItems.length === 0) continue;
      const meta = GROUP_META[groupKey];
      itemsHTML += `\n<div class="checklist-group">`;
      itemsHTML += `\n<div class="checklist-group-label">${esc(meta.label)}</div>`;
      if (meta.subtitle) {
        itemsHTML += `\n<p class="checklist-group-subtitle">${esc(meta.subtitle)}</p>`;
      }
      groupItems.forEach(ci => {
        itemsHTML += `\n<div class="checklist-item">
  <div class="checklist-box"></div>
  <div>${esc(ci.text)}</div>
</div>`;
      });
      itemsHTML += `\n</div>`;
    }

    if (!itemsHTML) return '';

    return `
<h2>Your First 30 Days</h2>
<p>Here is a practical checklist to help you get started. Check off each item as you complete it.</p>
${itemsHTML}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION F — What If…?
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionF(data) {
    const phen        = data.phen || [];
    const hasPrimAHI  = data.primaryAHI !== null && data.primaryAHI !== undefined;
    const bmi         = (data.bmi !== null && data.bmi !== undefined) ? +data.bmi : null;
    const hasPos      = phen.includes('Positional OSA');
    const hasNasal    = phen.includes('Nasal-Resistance Contributor');

    /* Check whether any what-if scenario applies */
    const isPreStudy   = !hasPrimAHI;
    const showWeight   = bmi !== null && bmi >= 27 && (hasPrimAHI || isPreStudy);
    const showPos      = hasPos;
    const showNasal    = hasNasal;

    if (!showWeight && !showPos && !showNasal) return '';

    const items = [];

    /* Weight / AHI projection (or pre-study snoring version) */
    if (showWeight && hasPrimAHI) {
      const projAHI = Math.round(data.primaryAHI * 0.70);
      items.push(`
<div class="whatif-item">
  <strong>What if you lost weight?</strong>
  <p style="margin:0.4rem 0 0;">Your current AHI is <strong>${Math.round(data.primaryAHI)}</strong>. Research shows that meaningful weight loss can reduce sleep apnea severity by about 30% or more. Based on your results, reaching a healthier weight could potentially bring your AHI down to around <strong>${projAHI}</strong> — a significant improvement. Weight loss does not guarantee a cure, but it often makes other treatments work better and reduces the strain on your heart and joints.</p>
</div>`);
    } else if (showWeight && isPreStudy) {
      items.push(`
<div class="whatif-item">
  <strong>What if you lost weight?</strong>
  <p style="margin:0.4rem 0 0;">Your BMI of <strong>${bmi.toFixed(1)}</strong> puts you in the ${bmi >= 30 ? 'obese' : 'overweight'} range. Excess weight — especially around the neck, tongue, and throat — is one of the strongest risk factors for both snoring and sleep apnea. Studies show that even modest weight loss of 5–7 pounds can reduce snoring frequency by up to 45%. Losing weight also shrinks the soft tissues that vibrate during snoring and reduces pressure on the airway when you lie down. If your sleep study does show sleep apnea, weight loss will make every other treatment — CPAP, oral appliances, surgery — work better.</p>
</div>`);
    }

    /* Positional AHI comparison */
    if (showPos) {
      const supAHI    = data.supPahi  ?? data.ahiSup    ?? null;
      const nonSupAHI = data.nonSupPahi ?? data.ahiNonSup ?? null;

      if (supAHI !== null && nonSupAHI !== null) {
        const supLabel    = ahiSeverityLabel(supAHI);
        const nonSupLabel = ahiSeverityLabel(nonSupAHI);
        items.push(`
<div class="whatif-item">
  <strong>What if you slept on your side every night?</strong>
  <p style="margin:0.4rem 0 0;">Your AHI breaks down very differently depending on position. When sleeping on your back: <strong>${Math.round(supAHI)} events/hour</strong> (${supLabel}). When sleeping on your side: <strong>${Math.round(nonSupAHI)} events/hour</strong> (${nonSupLabel}). Consistently sleeping on your side could dramatically reduce your sleep apnea severity. Positional therapy is one of the simplest changes you can make with meaningful results.</p>
</div>`);
      } else {
        items.push(`
<div class="whatif-item">
  <strong>What if you slept on your side every night?</strong>
  <p style="margin:0.4rem 0 0;">Your sleep study identified positional sleep apnea — your breathing is significantly worse when lying on your back. Sleeping consistently on your side is one of the most straightforward changes you can make, and it can dramatically reduce your breathing events. Positional therapy devices make this easier to maintain throughout the night.</p>
</div>`);
      }
    }

    /* Nasal obstruction */
    if (showNasal) {
      items.push(`
<div class="whatif-item">
  <strong>What if your nasal obstruction were treated?</strong>
  <p style="margin:0.4rem 0 0;">Nasal blockage does not cause sleep apnea on its own, but it makes the airway more vulnerable to collapse and makes other treatments harder to use effectively. Studies show that treating nasal obstruction — whether through medication, allergy management, or surgery — can improve how well CPAP and oral appliances work, and may reduce the pressure settings needed. In some cases, improved nasal breathing alone can meaningfully reduce breathing events during sleep.</p>
</div>`);
    }

    const whatIfIntro = isPreStudy
      ? 'These scenarios show how specific changes could affect your snoring and overall sleep quality — even before we have your sleep study results.'
      : 'These scenarios show how specific changes could affect your sleep apnea. They\u2019re meant to motivate and inform — not to suggest that these steps alone will resolve everything.';

    return `
<h2>What If…?</h2>
<p>${whatIfIntro}</p>
${items.join('')}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION G — Why This Matters
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionG(data) {
    const pAHI      = data.primaryAHI;
    const nadirVal  = Math.min(
      data.nadir    !== null && data.nadir    !== undefined ? +data.nadir    : 99,
      data.nadirPsg !== null && data.nadirPsg !== undefined ? +data.nadirPsg : 99
    );
    const hbArea    = (data.hbAreaPH !== null && data.hbAreaPH !== undefined) ? +data.hbAreaPH : null;
    const odiVal    = (data.odi !== null && data.odi !== undefined) ? +data.odi : null;
    const t90Val    = (data.t90 !== null && data.t90 !== undefined) ? +data.t90 : null;

    /* Trigger on severe AHI OR any HB metric in CV-risk range (updated thresholds per ISAACC/Azarbarzin 2025) */
    const triggerSevereAHI = pAHI !== null && pAHI !== undefined && +pAHI >= 30;
    const triggerHB        = hbArea !== null && hbArea >= 73;   // ISAACC: CPAP CV benefit threshold
    const triggerODI       = odiVal !== null && odiVal > 50;
    const triggerNadir     = nadirVal < 75;
    const triggerT90       = t90Val !== null && t90Val > 20;

    if (!triggerSevereAHI && !triggerHB && !triggerODI && !triggerNadir && !triggerT90) return '';

    const findings = [];
    if (triggerSevereAHI) findings.push(`a severe AHI of ${Math.round(+pAHI)} events per hour`);
    if (triggerHB)        findings.push(`a high hypoxic burden of ${hbArea.toFixed(0)} %min/hr (indicating significant cumulative low-oxygen exposure throughout the night)`);
    if (triggerODI)       findings.push(`an oxygen desaturation index (ODI) of ${odiVal} events per hour — meaning your oxygen dropped significantly ${odiVal} times every hour`);
    if (triggerNadir)     findings.push(`oxygen levels dropping to ${nadirVal}% during sleep — well below normal`);
    if (triggerT90)       findings.push(`${t90Val.toFixed(0)}% of your sleep time spent with oxygen below 90% — a level associated with increased cardiovascular strain`);

    const findingsList = findings.length === 1
      ? findings[0]
      : findings.slice(0, -1).join(', ') + ', and ' + findings[findings.length - 1];

    return `
<h2>Why This Matters</h2>
<p>Your results showed ${findingsList}. When sleep apnea is left untreated at this level, the nightly stress on your body adds up over time. Research consistently links untreated moderate-to-severe sleep apnea with higher rates of high blood pressure, heart disease, stroke, type 2 diabetes, and cognitive decline. The repeated drops in oxygen and the strain of fighting to breathe hundreds of times each night are real physical stressors — even if they happen while you're unaware of them.</p>
<p>The encouraging news is that effective treatment can improve symptoms and may reduce these risks, especially when it meaningfully controls your breathing events and oxygen drops over time. CPAP has shown the clearest cardiovascular benefit in patients with higher hypoxic burden and good adherence, and any surgical plan should be confirmed with follow-up testing rather than assumed to be curative. Addressing your sleep apnea is still one of the most important steps you can take for your long-term health, and many people notice better energy, focus, and sleep quality within weeks of starting effective treatment.</p>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     FOOTER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderFooter(data) {
    const dateStr = formatDate(data.reportDate);
    return `
<div class="report-footer">
  Prepared by Capital ENT${dateStr ? ' \u00b7 ' + dateStr : ''}
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN ENTRY POINT
     ══════════════════════════════════════════════════════════════════════════ */
  function generateReportHTML(data) {
    const sections = [
      renderHeader(data),
      renderCarePathway(data),
      renderCareSummary(data),
      renderSectionA(data),
      renderSectionB(data),
      renderSectionB2(data),
      renderDataLimitations(data),
      renderSectionC(data),
      renderSectionD(data),
      renderSectionE(data),
      renderSectionF(data),
      renderSectionG(data),
      renderFooter(data),
    ].filter(Boolean).map((sectionHtml, index) =>
      `<section class="report-section report-section-${index + 1}">${sectionHtml}</section>`
    );
    return '<div class="patient-report" data-patient-name="' + esc(data.patientName || '') + '" data-report-date="' + esc(data.reportDate || '') + '">' + sections.join('') + '</div>';
  }

  return { generateReportHTML, getReportStage };

})();
