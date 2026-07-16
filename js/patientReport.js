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

  /* ── Helper: AHI severity label (reads the shared cutoffs from config.js so
        the patient layer cannot drift from the clinician engine) ─────────── */
  function ahiSeverityLabel(ahi) {
    if (ahi === null || ahi === undefined) return null;
    const S = (typeof OSA_CONFIG !== 'undefined' && OSA_CONFIG.thresholds && OSA_CONFIG.thresholds.severity)
      || { mild: 5, moderate: 15, severe: 30 };
    if (ahi >= S.severe)   return 'severe';
    if (ahi >= S.moderate) return 'moderate';
    if (ahi >= S.mild)     return 'mild';
    return 'normal';
  }

  /* ── Helper: symptomatic patient with a normal HOME sleep test ──────────
     A WatchPAT / home study has fewer channels and no EEG, so it can
     under-measure milder or non-obstructive sleep-disordered breathing
     (false negative). When a symptomatic patient gets a normal home study we
     must NOT give unqualified reassurance — we mirror the clinician-side
     "Low AHI with significant symptoms" HST flag and point toward in-lab PSG.
     Reuses detectUARS for the symptom + AHI logic to avoid threshold drift. */
  function symptomaticNormalHomeTest(data) {
    const isHomeTest = data.studyType === 'watchpat' || data.studyType === 'both';
    if (!isHomeTest) return false;
    const u = OSAReportShared.detectUARS({
      ahi: data.primaryAHI,
      rdi: data.patRdi,
      arInd: data.arInd,
      ess: data.ess,
      isi: data.isi,
    });
    return u.ahi !== null && u.ahi < 5 && u.symptomatic;
  }

  /* ── Helper: HTML-encode a string ────────────────────────────────────── */
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function exists(val) {
    return val !== null && val !== undefined && val !== '';
  }

  /* Patient-facing terminology is defined before the clinical narrative. Keep
     this list conditional so a short report does not become a generic medical
     dictionary. Entries are ordered by their first appearance in the report. */
  const PATIENT_TERMINOLOGY = [
    {
      label: 'Obstructive sleep apnea (OSA)',
      patterns: [/obstructive sleep apnea/i, /\bOSA\b/],
      definition: 'The airway narrows or closes during sleep and repeatedly interrupts breathing.',
    },
    {
      label: 'AHI',
      patterns: [/\bAHI\b/, /Apnea-Hypopnea Index/i],
      definition: 'Apnea-Hypopnea Index: the average number of times breathing stops or becomes shallow per hour of sleep.',
    },
    {
      label: 'PAP',
      patterns: [/\bPAP\b/],
      definition: 'Positive airway pressure: a treatment that uses a machine and mask to deliver gentle air pressure and keep the airway open.',
    },
    {
      label: 'CPAP',
      patterns: [/\bCPAP\b/],
      definition: 'Continuous positive airway pressure: a common type of PAP treatment that keeps the airway open with air pressure.',
    },
    {
      label: 'CBT-I',
      patterns: [/\bCBT-I\b/, /Cognitive Behavioral Therapy for Insomnia/i],
      definition: 'Cognitive Behavioral Therapy for Insomnia: a structured treatment recommended early for ongoing insomnia.',
    },
    {
      label: 'COMISA',
      patterns: [/\bCOMISA\b/],
      definition: 'Insomnia and sleep apnea occurring together. The care plan needs to address both conditions.',
    },
    {
      label: 'BMI',
      patterns: [/\bBMI\b/, /body mass index/i],
      definition: 'Body mass index: a height-and-weight measure used as one factor in treatment planning.',
    },
    {
      label: 'DISE',
      patterns: [/\bDISE\b/, /drug-induced sleep endoscopy/i],
      definition: 'Drug-induced sleep endoscopy: an exam that shows where the airway collapses during sedated sleep.',
    },
    {
      label: 'REM sleep',
      patterns: [/\bREM(?:-Sleep| sleep)?\b/],
      definition: 'Rapid eye movement sleep: the dream-sleep stage when airway-supporting muscles relax more.',
    },
    {
      label: 'NREM sleep',
      patterns: [/\bNREM\b/, /non-REM/i],
      definition: 'Non-REM sleep: the sleep stages outside of REM dream sleep.',
    },
    {
      label: 'ODI',
      patterns: [/\bODI\b/, /oxygen desaturation index/i],
      definition: 'Oxygen Desaturation Index: the number of oxygen drops recorded per hour.',
    },
    {
      label: 'RDI',
      patterns: [/\bRDI\b/, /respiratory disturbance index/i],
      definition: 'Respiratory Disturbance Index: the number of breathing-related sleep disruptions per hour.',
    },
    {
      label: 'UARS',
      patterns: [/\bUARS\b/, /upper airway resistance syndrome/i],
      definition: 'Upper airway resistance syndrome: airway narrowing that disrupts sleep without meeting the usual event threshold for sleep apnea.',
    },
    {
      label: 'ASV',
      patterns: [/\bASV\b/],
      definition: 'Adaptive servo-ventilation: an advanced PAP mode that adjusts support from breath to breath.',
    },
    {
      label: 'BiPAP',
      patterns: [/\bBiPAP\b/i],
      definition: 'Bilevel positive airway pressure: PAP treatment with different pressures for breathing in and out.',
    },
    {
      label: 'PSG',
      patterns: [/\bPSG\b/],
      definition: 'Polysomnography: a detailed sleep study performed in a sleep laboratory.',
    },
    {
      label: 'Nerve stimulation',
      patterns: [/\bHNS\b/, /\bHGNS\b/, /\b(?:hypoglossal )?nerve stimulation\b/i, /nerve-stimulation/i],
      definition: 'Hypoglossal nerve stimulation (HNS or HGNS): an implanted treatment that activates tongue muscles during sleep to help keep the airway open.',
    },
    {
      label: 'TMJ',
      patterns: [/\bTMJ\b/],
      definition: 'Temporomandibular joint: the jaw joint just in front of the ear.',
    },
    {
      label: 'GLP-1 therapy',
      patterns: [/\bGLP-1\b/i],
      definition: 'A class of prescription medication that can support weight loss for eligible patients.',
    },
    {
      label: 'Friedman tongue position or stage',
      patterns: [/Friedman (?:Tongue Position|tongue position|Stage|stage)/],
      definition: 'An airway classification based on tongue position and, for the stage, tonsil size and body size. It helps guide treatment discussions.',
    },
    {
      label: 'Oxygen burden',
      patterns: [/oxygen burden/i, /hypoxic burden/i, /hypoxic-burden/i],
      definition: 'A measure of the depth and duration of oxygen drops caused by breathing interruptions during sleep.',
    },
    {
      label: 'Central breathing events or periodic breathing',
      patterns: [/central (?:breathing )?events?/i, /central sleep apnea/i, /periodic breathing/i, /central-breathing/i],
      definition: 'Breathing pauses or cycles caused by unstable breathing signals rather than only by a blocked airway.',
    },
    {
      label: 'Echocardiogram',
      patterns: [/echocardiogram/i],
      definition: 'An ultrasound test that shows how the heart is structured and how well it pumps.',
    },
    {
      label: 'Cardiovascular',
      patterns: [/cardiovascular/i],
      definition: 'Related to the heart and blood vessels.',
    },
    {
      label: 'Oral appliance',
      patterns: [/oral appliance/i, /mandibular advancement device/i],
      definition: 'A custom dental device worn during sleep that holds the lower jaw forward to help keep the airway open.',
    },
    {
      label: 'UPPP',
      patterns: [/\bUPPP\b/],
      definition: 'Uvulopalatopharyngoplasty: surgery that reshapes tissue in the palate and throat to enlarge the airway.',
    },
    {
      label: 'General anesthesia',
      patterns: [/general anesthesia/i],
      definition: 'Medication that keeps a patient fully asleep and unaware during a procedure.',
    },
    {
      label: 'Endotype',
      patterns: [/\bendotype\b/i, /endotype-based/i],
      definition: 'An underlying breathing-control or airway behavior pattern that may help match treatment.',
    },
  ];

  function reportTextFromHTML(html) {
    return String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ');
  }

  function terminologyMatchIndex(text, entry) {
    return entry.patterns.reduce((firstIndex, pattern) => {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      return match && (firstIndex < 0 || match.index < firstIndex) ? match.index : firstIndex;
    }, -1);
  }

  function renderTerminologyGuide(reportBodyHTML) {
    const reportText = reportTextFromHTML(reportBodyHTML);
    const usedTerms = PATIENT_TERMINOLOGY
      .map(entry => ({ ...entry, firstIndex: terminologyMatchIndex(reportText, entry) }))
      .filter(entry => entry.firstIndex >= 0)
      .sort((a, b) => a.firstIndex - b.firstIndex);

    if (!usedTerms.length) return '';

    const termsHTML = usedTerms.map(entry => `
      <div class="report-term">
        <dt>${esc(entry.label)}</dt>
        <dd>${esc(entry.definition)}</dd>
      </div>`).join('');

    return `
<aside class="report-terms" aria-labelledby="report-terms-heading">
  <h2 id="report-terms-heading">Terms used in this report</h2>
  <dl class="report-terms-list">${termsHTML}
  </dl>
</aside>`;
  }

  /* Patient handout writing rule: em dashes and other typographic dash
     characters are prohibited. The targeted replacements preserve natural
     sentence rhythm, and the final fallback guarantees ASCII punctuation. */
  function normalizePatientHandoutPunctuation(html) {
    return String(html || '')
      .replace(/<strong>([^<]*)\s+—\s+([^<]*)<\/strong>/g, '<strong>$1: $2</strong>')
      .replace(/<\/strong>\s*—\s*/g, '</strong>: ')
      .replace(/\s*—\s*/g, ', ')
      .replace(/[\u2010-\u2013\u2015\u2212]/g, '-');
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

  /* Patient recommendations are composed by clinical concepts, not by raw
     strings. When multiple engine rules describe the same decision, keep the
     safest/most prerequisite-aware representation. This prevents combinatorial
     scenarios from repeating or contradicting the same treatment concept. */
  const PATIENT_REC_CONCEPTS = {
    'MAD':               { concept: 'oral-appliance', rank: 10 },
    'MAD-FAVORABLE':     { concept: 'oral-appliance', rank: 20 },
    'MAD-POOR':          { concept: 'oral-appliance', rank: 30 },
    'MAD-WORKUP':        { concept: 'oral-appliance', rank: 40 },
    'MAD-SAFETY-LIMIT':  { concept: 'oral-appliance', rank: 50 },
    'HNS':               { concept: 'nerve-stimulation', rank: 10 },
    'INSPIRE-EVAL':      { concept: 'nerve-stimulation', rank: 20 },
    'HNS-WORKUP':        { concept: 'nerve-stimulation', rank: 30 },
    'SURG':              { concept: 'airway-surgery', rank: 10 },
    'SURGALT':           { concept: 'airway-surgery', rank: 20 },
    'SURGERY-WORKUP':    { concept: 'airway-surgery', rank: 30 },
    'NASAL-OPT':         { concept: 'nasal-care', rank: 20 },
    'NASAL-SURG':        { concept: 'nasal-care', rank: 10 },
    'NASAL-PRIOR':       { concept: 'nasal-care', rank: 10 },
    'NASAL-WORKUP':      { concept: 'nasal-care', rank: 30 },
  };

  function canonicalizePatientRecEntries(data) {
    const entries = getPatientFacingRecEntries(data).filter(entry => entry && entry.tag);
    const hasHnsWorkup = entries.some(entry => entry.tag === 'HNS-WORKUP');
    const hasSurgeryWorkup = entries.some(entry => entry.tag === 'SURGERY-WORKUP');
    const combinedProceduralWorkup = hasHnsWorkup && hasSurgeryWorkup && !(data && data.bmi > 40);
    let sourceEntries = entries;
    if (combinedProceduralWorkup) {
      const proceduralTags = new Set([
        'HNS', 'INSPIRE-EVAL', 'HNS-WORKUP',
        'SURG', 'SURGALT', 'SURGERY-WORKUP',
      ]);
      const insertAt = Math.max(0, entries.findIndex(entry => proceduralTags.has(entry.tag)));
      sourceEntries = entries.filter(entry => !proceduralTags.has(entry.tag));
      sourceEntries.splice(Math.min(insertAt, sourceEntries.length), 0, {
        tag: 'AIRWAY-PROCEDURE-WORKUP',
        text: 'Complete the procedure- and device-specific airway evaluation before finalizing surgery or nerve stimulation.',
      });
    }
    const selected = [];
    const conceptIndexes = new Map();
    const exactSeen = new Set();

    sourceEntries.forEach(entry => {
      const exactKey = `${entry.tag}::${entry.text || ''}`;
      if (exactSeen.has(exactKey)) return;
      exactSeen.add(exactKey);
      const rule = PATIENT_REC_CONCEPTS[entry.tag];
      if (!rule) {
        selected.push({ entry, rank: 0, concept: null });
        return;
      }

      if (!conceptIndexes.has(rule.concept)) {
        conceptIndexes.set(rule.concept, selected.length);
        selected.push({ entry, rank: rule.rank, concept: rule.concept });
        return;
      }

      const index = conceptIndexes.get(rule.concept);
      if (rule.rank > selected[index].rank) {
        selected[index] = { entry, rank: rule.rank, concept: rule.concept };
      }
    });

    return selected.map(item => item.entry);
  }

  function hasPatientRecTag(data, tag) {
    return getPatientFacingRecEntries(data).some(entry => entry && entry.tag === tag);
  }

  function anatomyContributorDescription(data) {
    const findings = [];
    const ftp = normalizeFtp(data.ftp);
    const tonsils = exists(data.tonsils) ? Number(data.tonsils) : null;
    const retrognathia = exists(data.retrognathia) ? String(data.retrognathia).trim().toLowerCase() : '';

    if (ftp >= 3) findings.push('a higher tongue position that crowds the space behind the palate');
    if (Number.isFinite(tonsils) && tonsils >= 3) findings.push('enlarged tonsils that narrow the throat');
    if (retrognathia && !['none', 'no', 'normal'].includes(retrognathia)) {
      const degree = ['mild', 'moderate', 'severe'].includes(retrognathia) ? `${retrognathia} ` : '';
      findings.push(`a ${degree}set-back lower jaw`);
    }

    if (!findings.length) {
      return 'Your airway exam suggests that anatomy contributes to narrowing during sleep. The exact treatment fit depends on the complete exam, prior treatment, and—when indicated for the procedure being considered—the collapse pattern seen during sleep endoscopy.';
    }

    const findingText = findings.length === 1
      ? findings[0]
      : `${findings.slice(0, -1).join(', ')} and ${findings[findings.length - 1]}`;
    return `Your exam shows ${findingText}. These findings can reduce airway space during sleep. A full candidacy review is still needed before choosing an anatomy-based procedure.`;
  }

  function patientCpapBarrierText(data) {
    const issueMap = {
      cpapMask: 'mask discomfort or fit',
      cpapClaustro: 'claustrophobia',
      cpapDry: 'dry mouth or dryness',
      cpapLeaks: 'mask leaks or noise',
      cpapSleep: 'trouble falling or staying asleep',
      cpapSkin: 'skin irritation',
      cpapNoImprove: 'not noticing enough improvement',
      cpapTravel: 'travel difficulty',
    };
    const issues = Array.isArray(data && data.cpapReasons)
      ? data.cpapReasons.map(key => issueMap[key]).filter(Boolean)
      : [];
    if (!issues.length) return 'the specific barrier from your first attempt';
    if (issues.length === 1) return issues[0];
    return `${issues.slice(0, -1).join(', ')} and ${issues[issues.length - 1]}`;
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
    const patientRecs = canonicalizePatientRecEntries(data);
    const hasPapPlan = patientRecs.some(entry => entry.tag === 'CPAP' || entry.tag.startsWith('CPAP-'));
    const papState = OSAReportShared.resolvePapState({
      cpapCurrent: data.cpapCurrent,
      cpapFailed: data.cpapFailed,
      cpapWillRetry: data.cpapWillRetry,
      prefAvoidCpap: data.prefAvoidCpap,
      hasPapPlan,
    });
    const preferredPath = ['starting', 'retrying', 'continuing'].includes(papState) ? 'cpap' : null;
    return OSAReportShared.buildCarePathway({
      milestones: data.milestones,
      studyType: data.studyType,
      hasStudyData: data.primaryAHI !== null && data.primaryAHI !== undefined,
      hasPatientContext: true,
      papState,
      preferredPath,
      labels: {
        eval: 'Your Evaluation',
        study: {
          psg: 'Lab Sleep Study',
          watchpat: 'Home Sleep Test',
          default: 'Sleep Study',
        },
        cpap: {
          trial: 'Starting PAP',
          retry: 'PAP Re-fit / Retry',
          current: 'Using PAP',
          completed: 'PAP Tried',
          considered: 'PAP Considered',
          followup: 'PAP Check-in',
          alternatives: 'Reviewing Alternatives',
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
     SUMMARY CARD — bottom line + one next step, shown first for every patient
     ══════════════════════════════════════════════════════════════════════════ */

  /* Short, plain-language "first action" per lead recommendation tag. */
  const NEXT_STEP_ACTIONS = {
    'CPAP': 'Get fitted for CPAP and start your therapy — we will help you find a comfortable setup.',
    'CPAP-ALT': 'Get fitted for CPAP and start your therapy — we will help you find a comfortable setup.',
    'MAD': 'See a sleep dentist about a custom oral appliance.',
    'MAD-FAVORABLE': 'See a sleep dentist about a custom oral appliance.',
    'MAD-POOR': 'Talk with your doctor about whether a custom oral appliance is a good fit for you.',
    'HNS': 'Talk with us about whether a device-specific upper-airway nerve-stimulation evaluation belongs in your plan.',
    'INSPIRE-EVAL': 'Schedule a device-specific nerve-stimulation candidacy evaluation.',
    'SURG': 'Discuss the surgical options in your plan with your ENT.',
    'SURGALT': 'Discuss the surgical options in your plan with your ENT.',
    'CBTI': 'Begin CBT-I — the structured treatment for insomnia.',
    'POS': 'Try sleeping on your side (positional therapy) as a first step.',
    'WEIGHT': 'Begin a weight-management plan with your doctor’s support.',
    'NASAL-OPT': 'Start nasal treatment to make breathing — and any therapy — easier.',
    'MILD-LIFESTYLE': 'Start with the lifestyle changes in your plan; we will recheck in a few months.',
    'SLEEP-STUDY': 'Schedule the sleep study your care team recommended.',
    'UARS-EVAL': 'Talk with your doctor about whether more detailed sleep testing is needed.',
  };

  function summaryNextStep(data) {
    const stage = getReportStage(data);
    if (stage === 'pre-study') return 'Schedule the sleep study your care team recommended.';
    const ahi = data.primaryAHI;
    if (exists(ahi) && ahi < 5) {
      return symptomaticNormalHomeTest(data)
        ? 'Talk with your doctor about whether a more detailed in-lab sleep study is the right next step.'
        : 'Review these results with your doctor and keep an eye on how you are sleeping.';
    }
    const entries = canonicalizePatientRecEntries(data);
    const hasPAPPlan = entries.some(e => e.tag === 'CPAP' || e.tag.startsWith('CPAP-'));
    // Sweetman 2019 supports early CBT-I; MATRICS (Ong 2020) supports concurrent
    // CBT-I + PAP and does not justify delaying PAP. See docs/citations.md.
    if (data.hasCOMISA && hasPAPPlan && !(data.cpapFailed && !data.cpapWillRetry)) {
      return data.cpapCurrent
        ? 'Begin CBT-I while continuing PAP, and address any mask or nasal comfort issues with your care team.'
        : data.cpapFailed && data.cpapWillRetry
          ? 'Begin CBT-I and arrange a PAP re-fitting in parallel.'
          : 'Begin CBT-I and arrange your PAP setup in parallel.';
    }
    // Established CPAP user: the action is continuity, not a new fitting.
    if (data.cpapCurrent) return 'Keep using your CPAP, and bring any comfort issues to your next visit so we can fine-tune it.';
    // Otherwise follow the report's own recommendation priority — first one the patient actually sees.
    for (const e of entries) {
      if (patientFriendlyRec(e.tag, e.text || '', data) === null) continue;  // suppressed / not shown
      if (NEXT_STEP_ACTIONS[e.tag]) return NEXT_STEP_ACTIONS[e.tag];
    }
    return 'Review your treatment plan below with your doctor and choose a first step together.';
  }

  function renderSummaryCard(data) {
    const stage = getReportStage(data);
    const ahi = data.primaryAHI;
    let finding, meaning = '';
    if (stage === 'pre-study') {
      finding = 'We are recommending a sleep study to get a clear picture of how you breathe overnight.';
    } else if (exists(ahi) && ahi < 5) {
      finding = 'Your sleep study did not find obstructive sleep apnea — your breathing was in the normal range.';
      if (symptomaticNormalHomeTest(data)) meaning = 'Because you have been having symptoms, we still want to take a closer look (see below).';
    } else {
      const sev = ahiSeverityLabel(ahi);  // mild | moderate | severe
      finding = `Your sleep study shows <strong>${sev} sleep apnea</strong>.`;
      meaning = sev === 'severe'
        ? 'At this level, treatment is important because severe OSA is associated with risks to heart health and daytime functioning.'
        : sev === 'moderate'
          ? 'It is interrupting your sleep often enough to affect your health and energy, and treatment helps.'
          : 'Even at this level, treating it can improve how rested you feel and protect your long-term health.';
    }
    const nextStep = summaryNextStep(data);
    return `
<div class="report-summary-card">
  <p class="report-summary-finding">${finding}${meaning ? ' ' + meaning : ''}</p>
  <p class="report-summary-next-step"><strong>Your most important next step:</strong> ${nextStep}</p>
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
      if (+data.primaryAHI < 5) {
        parts.push(`Your sleep study did <strong>not show evidence of obstructive sleep apnea</strong> (AHI ${Math.round(data.primaryAHI)})`);
      } else {
        const sev = ahiSeverityLabel(data.primaryAHI);
        parts.push(`Your sleep study showed <strong>${sev} sleep apnea</strong> (AHI ${Math.round(data.primaryAHI)})`);
      }
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
    const isNormalStudy = severity === 'normal';
    const ahiRound = Math.round(ahi);
    const ctx      = getVisitContext(data);

    /* — O2 nadir (best available from WatchPAT or PSG) — */
    const nadirRaw = Math.min(
      data.nadir    !== null && data.nadir    !== undefined ? +data.nadir    : 999,
      data.nadirPsg !== null && data.nadirPsg !== undefined ? +data.nadirPsg : 999
    );
    const hasNadir = nadirRaw < 999;
    const nadirNote = hasNadir
      ? ` Your lowest oxygen level during the study was <strong>${Math.round(nadirRaw)}%</strong>${nadirRaw < 80 ? ' — significantly below the usual range during sleep, which can place substantial stress on your heart and body' : nadirRaw < 88 ? ' — lower than we want to see during sleep and one reason treatment still matters' : nadirRaw < 90 ? ' — slightly below the usual range during sleep' : ''}.`
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
  ? (symptomaticNormalHomeTest(data)
      ? '<p>This result is in the <strong>normal range</strong> — fewer than 5 breathing interruptions per hour. That is a good sign. Because you have been having symptoms and this was a home sleep test, we want to take a closer look before considering things fully settled — see the note just below.</p>'
      : '<p>This result is in the <strong>normal range</strong> — fewer than 5 breathing interruptions per hour. While your breathing during sleep appears healthy, we will continue to review your full results with you.</p>')
  : `<p>This places you in the <strong>${severity} range</strong> for obstructive sleep apnea. ${
    severity === 'mild'
      ? 'Even mild sleep apnea can affect how rested you feel and, over time, may have health effects worth addressing.'
      : severity === 'moderate'
        ? 'Moderate sleep apnea has real effects on your energy, mood, and long-term heart and brain health.'
        : 'This is the level where consistent treatment matters most, and your plan below is built around that.'
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
    if (!isNormalStudy && subtype.includes('sleepy')) {
      subtypeHtml = `
<p><strong>Your Sleep Apnea Pattern: Sleepiness-Predominant</strong><br>
Many people with sleep apnea feel sleepy during the day — and your results suggest this fits you. When your breathing is interrupted repeatedly during the night, your body is briefly woken up each time to reopen the airway. Even if you don't remember these wake-ups, they fragment your sleep and prevent you from reaching the deeper, restorative stages. The result is that you feel tired even after a full night in bed. The good news: effective treatment often brings dramatic improvements in daytime energy.</p>`;
    } else if (!isNormalStudy && (subtype.includes('disturbed') || subtype.includes('comisa'))) {
      subtypeHtml = `
<p><strong>Your Sleep Apnea Pattern: COMISA (Insomnia + Sleep Apnea)</strong><br>
You have both insomnia and breathing interruptions during sleep. Your plan addresses both conditions.</p>`;
    } else if (!isNormalStudy && subtype.includes('minimal')) {
      subtypeHtml = `
<p><strong>Your Sleep Apnea Pattern: Minimally Symptomatic</strong><br>
Not everyone with sleep apnea feels tired or has obvious symptoms — and you appear to fall into this category. Even so, the repeated drops in oxygen and the strain of repeatedly reopening the airway take a quiet toll on the heart, blood pressure, and brain over time. People with untreated sleep apnea — even those who feel fine — have higher rates of high blood pressure, heart disease, and stroke. Treating sleep apnea now is an investment in your long-term health.</p>`;
    }

    const sectionTitle = isNormalStudy
      ? (ctx.isFirstVisit ? 'Understanding Your Results' : 'Your Sleep Study Summary')
      : (ctx.isFirstVisit ? 'Understanding Your Results' : 'Your Sleep Apnea Summary');

    return `
<h2>${sectionTitle}</h2>
${ahiExpl}
${ahiScale}
${subtypeHtml}
${renderSectionG(data)}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION B2 — Normal AHI: What Your Study Found (snoring/UARS pathway)
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionB2(data) {
    if (getReportStage(data) !== 'post-study') return '';
    if (data.primaryAHI === null || data.primaryAHI === undefined || data.primaryAHI >= 5) return '';

    const parts = [];
    const symptomaticHst = symptomaticNormalHomeTest(data);

    /* UARS / symptom detection (computed up front so the opening framing can react) */
    const uars = OSAReportShared.detectUARS({
      ahi: data.primaryAHI,
      rdi: data.patRdi,
      arInd: data.arInd,
      ess: data.ess,
      isi: data.isi,
    });

    /* Opening framing — avoid unqualified reassurance for a symptomatic normal home test */
    if (symptomaticHst) {
      parts.push(`<p>Your home sleep study did not find obstructive sleep apnea — your AHI (Apnea-Hypopnea Index) is <strong>${Math.round(data.primaryAHI)}</strong>, which is in the <strong>normal range</strong> (fewer than 5 breathing interruptions per hour). That part is good news.</p>`);
    } else {
      parts.push(`<p>Your sleep study did not find obstructive sleep apnea. Your AHI (Apnea-Hypopnea Index) is <strong>${Math.round(data.primaryAHI)}</strong>, which falls in the <strong>normal range</strong> (fewer than 5 breathing interruptions per hour). This is reassuring news about your breathing during sleep.</p>`);
    }

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

    /* Further-evaluation guidance. Prefer the specific UARS callout; otherwise, for a
       symptomatic normal home test, show a general "worth a closer look" caveat. Both
       point the patient toward discussing an in-lab study so a false-negative home test
       does not leave a symptomatic patient falsely reassured. */
    if (uars.isUARS) {
      parts.push(`
<div class="comisa-callout">
  <strong>Possible Upper Airway Resistance Syndrome (UARS)</strong>
  <p style="margin:0.4rem 0 0;">Although your AHI is normal, your symptoms and some patterns in your study suggest a possible condition called <strong>upper airway resistance syndrome (UARS)</strong>. In UARS, the airway narrows during sleep enough to disrupt sleep quality — causing daytime tiredness, difficulty concentrating, or poor sleep — without fully blocking airflow the way sleep apnea does. Home sleep tests can sometimes miss UARS because it requires more detailed monitoring to detect. Your doctor may recommend an in-lab sleep study for a more thorough evaluation.${uars.rdiElevated ? ` Notably, your RDI (${Math.round(uars.rdi)}) is significantly higher than your AHI (${Math.round(data.primaryAHI)}), which suggests your airway was causing partial breathing disruptions that did not meet the threshold for apnea.` : ''}</p>
</div>`);
    } else if (symptomaticHst) {
      parts.push(`
<div class="comisa-callout">
  <strong>Because you've been having symptoms, this is worth a closer look</strong>
  <p style="margin:0.4rem 0 0;">You came in with symptoms that can point to a sleep problem, and a home sleep test is a simpler study that can sometimes miss milder or different kinds of sleep-disordered breathing. A normal home test does not always rule everything out. We'd like to talk with you about whether a more detailed <strong>in-lab sleep study</strong> would help make sure nothing is being missed.</p>
</div>`);
    }

    // A symptomatic normal home test must always render this section (the caveat above is
    // the whole point); otherwise a lone "normal" paragraph is left to Section B.
    if (parts.length <= 1 && !symptomaticHst) return '';

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

  function getUnresolvedPhenotypeNotes(data) {
    if (getReportStage(data) !== 'post-study') return [];

    const domains = Array.isArray(data.insufficientDataDomains) ? data.insufficientDataDomains : [];
    const noteMap = {
      'position': 'Back-sleeping versus side-sleeping effects are not fully assessed yet because the positional data were incomplete.',
      'sleep-stage': 'Dream-sleep versus non-dream-sleep worsening is not fully assessed yet because the REM/NREM breakdown was incomplete.',
      'endotyping': 'Some of the finer breathing-control patterns still need the full apnea-versus-hypopnea breakdown before they can be interpreted confidently.',
      'anatomy': 'A fuller airway exam is still needed before anatomy-based contributors can be considered fully assessed.',
      'anatomy-partial': 'One part of the airway exam is still missing, so anatomy-based contributors may still be refined.',
      'nasal': 'Nasal contribution has not been fully assessed yet because the nasal symptom and exam data are incomplete.',
      'delta-heart-rate': 'The extra overnight heart-rate reactivity measure we sometimes use for cardiovascular-stress patterning has not been entered yet.',
    };

    return domains
      .map(domain => noteMap[domain?.key])
      .filter(Boolean);
  }

  function renderUnresolvedPhenotypeCallout(data) {
    const notes = getUnresolvedPhenotypeNotes(data);
    if (!notes.length) return '';

    return `
<div class="alert alert-warning">
  <strong>Contributing factors still being clarified</strong>
  <p style="margin:0.4rem 0 0;">Some patterns that can influence treatment choice still need fuller assessment before they should be treated as ruled in or ruled out.</p>
  <ul style="margin:0.5rem 0 0;">
    ${notes.map(note => `<li>${esc(note)}</li>`).join('')}
  </ul>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION C — What's Contributing to Your Sleep Apnea
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionC(data) {
    const riskOnlyPhenotypes = new Set(['High Hypoxic Burden', 'Elevated Delta Heart Rate']);
    const phen = (data.phen || []).filter(name => !riskOnlyPhenotypes.has(name));
    const includeWeight = exists(data.bmi) && Number(data.bmi) >= 27 && hasPatientRecTag(data, 'WEIGHT');
    if (getReportStage(data) !== 'post-study') return '';
    if (data.primaryAHI < 5) return '';  // Normal AHI handled by Section B2
    // Phase 3: the "contributing factors still being clarified" callout is suppressed from
    // the patient view (clinician-oriented, actionless for the patient).

    /* Zero phenotypes — provide context instead of blank gap */
    if (phen.length === 0 && !includeWeight) {
      const summary = 'Your sleep study confirmed obstructive sleep apnea, but your results did not point to one dominant cause among the patterns we check (such as airway shape, position, or breathing instability). This is common — for many people it is a mix of smaller factors. Your plan is still tailored to your severity and situation, and your doctor will work with you to find what helps most.';
      return `
<h2>About Your Sleep Apnea</h2>
<p>${summary}</p>`;
    }

    const iconMap = {
      'High Anatomical Contribution':  'bi-body-text',
      'Low Arousal Threshold':         'bi-alarm',
      'High Loop Gain':                'bi-arrow-repeat',
      'Poor Muscle Responsiveness':    'bi-lightning',
      'Positional OSA':                'bi-arrow-left-right',
      'REM-Predominant OSA':           'bi-moon-stars',
      'Nasal-Resistance Contributor':  'bi-wind',
    };

    const descMap = {
      'High Anatomical Contribution': anatomyContributorDescription(data),

      'Low Arousal Threshold': `Your brain wakes up easily when breathing gets hard. That sounds helpful, but it cuts short your airway muscles' chance to reopen on their own, leaving many brief, fragmented wake-ups. Treatments that steady your breathing — so the brain doesn't have to step in so often — tend to help.`,

      'High Loop Gain': `Your breathing control reacts to small changes like an over-sensitive thermostat — speeding up, then slowing too much, in an unstable cycle. Steadying that rhythm (with certain CPAP settings, positional therapy, or in some cases medication) can help smooth it out.`,

      'Poor Muscle Responsiveness': `The muscles that normally tighten to hold your airway open may respond weakly, especially during dream (REM) sleep when muscles relax most. This can shape your options — including whether a treatment that physically supports the airway is a better fit.`,

      'Positional OSA': `Your apnea is much worse on your back, where gravity pulls the tongue and throat tissue into the airway; on your side it stays more open. Positional therapy — a device or pillow that keeps you off your back — can cut your events substantially and is one of the simplest steps.`,

      'REM-Predominant OSA': `Your breathing problems cluster in REM (dream) sleep, when your brain relaxes the muscles that hold the airway open. Because REM is key for memory and mood, disruptions there affect how you feel. CPAP is particularly good at protecting REM sleep.`,

      'Nasal-Resistance Contributor': `Narrowing or blockage in your nose can make PAP or an oral appliance harder to tolerate. Nasal treatment can improve comfort and airflow, but it usually supports — rather than replaces — treatment for sleep apnea itself.`,
    };

    /* Plain-language headings shown to the patient (the clinical phenotype name stays
       in the clinician view only). Keeps the medical term out of the patient's eyeline. */
    const patientLabelMap = {
      'High Anatomical Contribution': 'The shape of your airway',
      'Low Arousal Threshold': 'You wake easily when breathing gets hard',
      'High Loop Gain': 'Your breathing control runs on a hair-trigger',
      'Poor Muscle Responsiveness': 'Your airway muscles relax too much in sleep',
      'Positional OSA': 'Worse when you sleep on your back',
      'REM-Predominant OSA': 'Worse during dream (REM) sleep',
      'Nasal-Resistance Contributor': 'Your nose adds to the problem',
    };

    const factorItems = phen.map(p => {
      const icon = iconMap[p] || 'bi-circle';
      const desc = descMap[p] || 'This is a recognized pattern in your sleep study results. Your care team will explain what this means for your specific situation.';
      return { key: p, icon, label: patientLabelMap[p] || p, desc };
    });

    if (includeWeight) {
      const bmiText = Number(data.bmi).toFixed(1);
      const weightItem = {
        key: 'Weight & metabolic health',
        icon: 'bi-activity',
        label: 'Weight is one modifiable contributor',
        desc: `At a BMI of ${bmiText}, weight likely adds to airway narrowing and sleep apnea severity. It is not the only cause. Supported weight management can reduce severity and may help other treatments work better, although the amount of improvement varies.`,
      };
      const anatomyIndex = factorItems.findIndex(item => item.key === 'High Anatomical Contribution');
      factorItems.splice(anatomyIndex >= 0 ? anatomyIndex + 1 : 0, 0, weightItem);
    }

    const items = factorItems.map(item => `
<div class="phenotype-item">
  <i class="bi ${esc(item.icon)} phenotype-icon"></i>
  <div>
    <strong>${esc(item.label)}</strong>
    <p style="margin-top:0.25rem;margin-bottom:0;">${esc(item.desc)}</p>
  </div>
</div>`).join('');

    return `
<h2>What's Contributing to Your Sleep Apnea</h2>
<p>Sleep apnea is not one-size-fits-all. These are the factors in your evaluation that may be contributing to airway blockage or treatment difficulty.</p>
${items}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION D — Your Treatment Plan
     ══════════════════════════════════════════════════════════════════════════ */

  /* ── Patient-friendly descriptions keyed by recommendation tag ── */
  const recDescriptions = {
    // SAVE + the 2023 IPD adherence meta-analysis support dose-aware language,
    // not a categorical "four hours = health protection" promise.
    'CPAP': `<strong>PAP Therapy</strong> — PAP uses gentle air pressure through a mask to keep your airway open. It is generally the most effective treatment for preventing breathing events across sleep stages and positions. Many patients notice better alertness or sleep quality with consistent use, although the timing varies.`,
    'CPAP-ALT': null,  // Merged into CPAP context — not shown as standalone
    'CPAP-PREF': null,  // Merged into CPAP context
    'CPAP-OPT': null,  // Merged into CPAP context
    'CPAP-DESENTIZE': null,  // Merged into CPAP context
    'CPAP-HUMID': null,  // Merged into CPAP context
    'CPAP-RETITRATE': null,  // Merged into CPAP context
    'CPAP-FIXED': null,  // Merged into CPAP context
    'MAD': `<strong>Oral Appliance Therapy</strong> — A sleep dentist fits a custom device that moves the lower jaw forward during sleep. It is a reasonable option for selected patients, especially when PAP is not tolerated; follow-up sleep testing is needed to confirm effectiveness.`,
    'MAD-FAVORABLE': `<strong>Oral Appliance Therapy (Favorable Profile)</strong> — Your profile includes features associated with a better response to a custom jaw-advancement device. A sleep dentist should confirm safety, and follow-up testing should measure the result.`,
    'MAD-POOR': `<strong>Oral Appliance Therapy</strong> — A custom jaw-advancement device may help, but your profile suggests it may not control your sleep apnea well enough by itself. It can still be discussed as a backup or combination option if PAP is not tolerated.`,
    'POS': `<strong>Positional Therapy</strong> — Your breathing is worse on your back. A positional device or pillow can help you stay on your side and may be used alone or with another treatment, depending on the study results.`,
    'POS-GUARD': null,  // Contextual note — appended to POS, not shown standalone
    'OXYGEN-WORKUP': `<strong>Complete Oxygen-Risk Review</strong> — Part of your sleep-study oxygen data is still incomplete or has not yet been reviewed in full. Before we call your oxygen-related risk low or move CPAP lower on the list, your care team should confirm your oxygen desaturation index (ODI), time below 90%, lowest oxygen level, and any available hypoxic-burden metrics from the full report.`,
    'POSITION-WORKUP': `<strong>Review Positional Data Before Ruling Position In or Out</strong> — Your available sleep-study report does not clearly show how your breathing changed on your back compared with your side. Before we decide that positional therapy is irrelevant, your care team may need to review the full study or repeat testing with better positional tracking.`,
    'SLEEP-STAGE-WORKUP': `<strong>Review REM-Sleep Data Before Ruling Out REM Worsening</strong> — Some patients breathe much worse during REM (dream) sleep than during the rest of the night. Your available data do not clearly separate REM from non-REM breathing yet, so REM-specific treatment decisions should stay flexible until that part of the study is confirmed.`,
    'ENDOTYPE-WORKUP': `<strong>Complete the Detailed Event Breakdown Before Final Endotype Matching</strong> — Some of the more advanced breathing-pattern estimates in sleep apnea depend on knowing how many events were full apneas versus partial obstructions (hypopneas). That breakdown is not fully available yet, so some of the finer endotype-based treatment matching still needs the detailed scoring report before it should be treated as complete.`,
    'ANATOMY-WORKUP': `<strong>Complete Airway Exam Before Finalizing Anatomy-Based Treatments</strong> — Some anatomy-based options depend on a fuller airway exam than we have documented so far. Before we commit to surgery-focused plans or decide how strong a candidate you are for certain devices, your ENT team should complete and document the key airway findings such as tonsil size, Friedman tongue position, and body-size measures used for treatment matching.`,
    'HNS-WORKUP': `<strong>Complete the Nerve-Stimulation Evaluation First</strong> — Nerve stimulation remains a possibility—not a recommendation—until prior-treatment history, AHI and central events, BMI, anatomy, current device labeling, insurance criteria, and any device-required airway evaluation are reviewed. Depending on the device and procedure being considered, that evaluation may include sleep endoscopy (DISE).`,
    'AIRWAY-PROCEDURE-WORKUP': `<strong>Complete the Procedure-Specific Airway Evaluation First</strong> — Before choosing airway surgery or nerve stimulation, your ENT team should review the complete airway exam, prior treatments, sleep-study findings, and current device or procedure requirements. That evaluation may include sleep endoscopy (DISE), depending on the option being considered.`,
    'NASAL-WORKUP': `<strong>Complete Nasal Assessment Before Ruling Nasal Treatment In or Out</strong> — A blocked or narrow nose can worsen mouth breathing and make CPAP, oral appliances, and surgery recovery harder. Because your nasal symptom and exam data are still incomplete, your ENT team should finish documenting nasal symptoms and anatomy before treating nasal contribution as absent.`,
    'MAD-WORKUP': `<strong>Confirm Oral Appliance Safety First</strong> — Before an oral appliance is finalized, a sleep dentist should confirm that your teeth, jaw movement, and jaw joints make it a safe fit. That includes checking that there is enough healthy tooth support, enough lower-jaw movement, and no major TMJ problem that would make the device hard to tolerate.`,
    'MAD-SAFETY-LIMIT': `<strong>Oral Appliance May Not Be a Safe Fit Right Now</strong> — Your current dental or jaw findings make an oral appliance less likely to be a safe or practical treatment at this stage. Problems such as limited tooth support, limited jaw movement, or significant TMJ disease can make a mandibular advancement device hard to fit or hard to tolerate. Your care team may still revisit it later if a sleep dentist feels those concerns can be addressed safely.`,
    'CENTRAL-PSG-WORKUP': `<strong>Confirm Central-Breathing Findings With a Lab Sleep Study</strong> — Your home sleep study showed breathing-instability signals that can suggest central sleep apnea or periodic breathing, but those findings are usually confirmed with a full in-lab sleep study before advanced treatments such as ASV are chosen. That extra step helps your care team make sure the pattern is truly central and that the treatment is matched safely.`,
    'ASV-SAFETY': `<strong>Confirm Heart-Function Safety Before ASV</strong> — Some advanced PAP devices, especially ASV, are only appropriate after your care team confirms that your heart function is in a safe range. If ASV comes up as an option, your sleep specialist may review a recent echocardiogram or ask for heart-function testing first.`,
    'ASV-CONTRA': `<strong>Reduced Heart Function Makes ASV Unsafe Right Now</strong> — One type of advanced PAP therapy, ASV, is not considered safe when the heart’s pumping function is reduced below the accepted safety range. If your plan still needs help for central-breathing instability, that discussion should stay with your sleep specialist and heart team rather than treating ASV as a routine option.`,
    'SURGERY-WORKUP': `<strong>Complete DISE-Guided Surgical Planning First</strong> — If surgery is being considered, your ENT team may still need a sleep endoscopy (DISE) to see exactly where your airway collapses during sleep. That helps match the procedure to the actual collapse pattern instead of guessing from symptoms alone.`,
    'HNS': `<strong>Upper-Airway Nerve Stimulation</strong> — An implanted device activates tongue muscles during sleep. It is considered only for selected patients after standard treatments have not controlled sleep apnea or could not be used. A full workup is needed because anatomy, BMI, neck size, AHI, prior treatment, and other health conditions can affect both eligibility and the chance of response.`,
    'WEIGHT': `<strong>Weight Management</strong> — Excess weight is an important modifiable contributor to sleep apnea for many people. A reduction in body weight can reduce breathing-event frequency and may improve how well other treatments work, although response varies. Your doctor can connect you with resources such as dietitians, structured programs, and other forms of medical support when appropriate.`,
    'NASAL-OPT': `<strong>Nasal Treatment</strong> — Medication, allergy care, nasal dilators, or surgery may improve airflow and treatment comfort. Nasal care usually supports rather than replaces sleep apnea treatment.`,
    'NASAL-SURG': null,  // Merged into NASAL-OPT
    'NASAL-PRIOR': null,  // Merged into NASAL-OPT
    'TONSIL': `<strong>Tonsil Surgery (Tonsillectomy)</strong> — If your tonsils are significantly enlarged, removing them can dramatically open the back of the throat and reduce or even eliminate sleep apnea in appropriate candidates. Tonsillectomy is a same-day surgical procedure performed under general anesthesia. Recovery typically takes 1–2 weeks. For patients with large tonsils, this can be one of the most impactful single-step treatments available.`,
    'CBTI': `<strong>CBT-I (Cognitive Behavioral Therapy for Insomnia)</strong> — This recommended insomnia treatment changes the habits and thoughts that keep insomnia going. It can be delivered by a trained therapist or a validated digital program.`,
    'SURGALT': `<strong>Airway Surgery</strong> — Surgery may help when the procedure is matched to the site and pattern of collapse. Your exam, prior treatment, and often a sleep endoscopy (DISE) guide that decision.`,
    'HLG-ADV': `<strong>Alternative PAP Therapy</strong> — When standard CPAP is not the best fit, other positive airway pressure devices may work better. BiPAP (bilevel) uses different pressures for breathing in and out, which some people find more comfortable. ASV (adaptive servo-ventilation) automatically adjusts to your breathing pattern and is especially helpful for certain types of breathing instability during sleep. Your sleep specialist will determine which device is right for you, and if ASV is being considered they may need to confirm that your heart function is in a safe range first.`,
    'REM-CHECK': null,  // Clinical detail — not shown as standalone
    'REM-MAD': null,  // Merged into MAD if present
    'HB-URG': null,  // Urgency note — woven into Why This Matters
    'DHR-TX': null,  // Clinical detail
    'SLEEP-STUDY': `<strong>Sleep Study</strong> — A sleep study measures your breathing, oxygen levels, heart rate, and sleep stages to get a full picture of what's happening while you sleep. Depending on your situation, this may be a home sleep test (a small device you wear overnight at home) or an in-lab study (which captures more detailed data in a monitored sleep center). The results will guide your treatment decisions.`,
    'UARS-EVAL': `<strong>Evaluation for Upper Airway Resistance Syndrome (UARS)</strong> — Your home sleep study did not show obstructive sleep apnea, but your symptoms and some patterns in your results suggest you may have a related condition called upper airway resistance syndrome (UARS). In UARS, the airway narrows enough to disrupt sleep without fully blocking airflow — which means a home test may not detect it. An in-lab sleep study with more detailed monitoring can identify this condition and guide treatment.`,
    'SNORE-ALCOHOL': `<strong>Avoid Alcohol Before Bed</strong> — Alcohol relaxes the muscles in your throat, making snoring worse and increasing the chance of airway collapse during sleep. Avoiding alcohol within 3 hours of bedtime can noticeably reduce snoring and improve sleep quality.`,
    'SNORE-LIFESTYLE': `<strong>Reducing Snoring While We Wait for Results</strong> — There are several things you can start doing now to reduce snoring. <strong>Sleep on your side</strong> — snoring is usually worse on your back because gravity pulls the tongue and soft tissues into the airway. A body pillow or positional device can help. <strong>Avoid alcohol within 3 hours of bedtime</strong> — alcohol relaxes the throat muscles, making snoring louder and more frequent. <strong>Maintain a healthy weight</strong> — even modest weight loss (as little as 5–7 pounds) can noticeably reduce snoring by decreasing tissue bulk around the airway. <strong>Stay active</strong> — regular aerobic exercise may reduce snoring independent of weight loss. <strong>Reduce sedative use</strong> — benzodiazepines and other sedating medications relax the airway and worsen snoring when possible to avoid. These steps form the foundation of snoring management and will also help with any sleep apnea treatment we recommend after your sleep study.`,
    'INSPIRE-EVAL': `<strong>Nerve-Stimulation Candidacy Evaluation</strong> — You expressed interest in an upper-airway stimulation implant. It is considered only after standard treatments have not worked well enough or could not be used. Device labeling and insurance criteria differ, so your ENT must review the complete treatment history, body-size measures, sleep-study results, anatomy, and any device-required airway evaluation before recommending a specific device.`,
    'INSPIRE-OPT': null,  // Inspire already in place — clinical detail
    'COMISA-PAP': null,  // COMISA-specific CPAP detail — merged
    'COMISA-SRT-CAUTION': null,  // Clinical detail
    'SURG': `<strong>Airway Surgery</strong> — Surgery may help when the procedure is matched to the site and pattern of collapse. Your exam, prior treatment, and often a sleep endoscopy (DISE) guide that decision.`,
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
  const suppressedTags = new Set(['POS-GUARD','REM-CHECK','REM-MAD','HB-URG','DHR-TX','ENDOTYPE-WORKUP']);
  const workupTags = new Set([
    'OXYGEN-WORKUP',
    'POSITION-WORKUP',
    'SLEEP-STAGE-WORKUP',
    'ENDOTYPE-WORKUP',
    'ANATOMY-WORKUP',
    'HNS-WORKUP',
    'AIRWAY-PROCEDURE-WORKUP',
    'NASAL-WORKUP',
    'MAD-WORKUP',
    'CENTRAL-PSG-WORKUP',
    'ASV-SAFETY',
    'SURGERY-WORKUP',
  ]);

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
    /* Above Capital ENT's current BMI 40 HGNS referral guardrail, omit the patient-facing
       option and let the clinician handle device-specific labeling/payer nuance. */
    if ((tag === 'HNS' || tag === 'INSPIRE-EVAL' || tag === 'HNS-WORKUP') && data && data.bmi > 40) {
      return null;
    }
    if (tag === 'WEIGHT' && data) {
      const lead = weightReadinessLead(data);
      const support = data.bmi >= 30
        ? 'Your doctor can connect you with resources such as dietitians, structured programs, and, for eligible patients, prescription weight-loss medications such as GLP-1 therapies (for example, Zepbound/tirzepatide).'
        : 'Your doctor can connect you with resources such as dietitians, structured programs, and other forms of medical support when appropriate.';
      return `<strong>Weight Management</strong> — ${lead}Weight loss can reduce sleep apnea severity and improve how well other treatments work, but the amount of improvement varies from person to person. ${support}`;
    }

    /* Mild + Low HB: de-emphasized CPAP description with uncertainty-aware language */
    if (tag === 'CPAP' && data && data.severity?.toLowerCase() === 'mild' && data.lowHypoxicBurden) {
      return `<strong>CPAP Therapy</strong> — CPAP is an effective treatment for sleep apnea at all severity levels. However, for mild sleep apnea with your oxygen profile, other approaches — such as an oral appliance or positional therapy — may be reasonable initial options and can provide similar patient-centered improvement for many people. CPAP remains an option if you prefer it or if other treatments don't provide enough improvement. If you do try CPAP, modern machines with auto-adjusting pressure and heated humidifiers make it much more comfortable than older models.`;
    }

    /* Enhanced CPAP description for severe patients with limited alternatives */
    if (tag === 'CPAP' && data && data.severity?.toLowerCase() === 'severe' && data.cpapFailed) {
      const limitedAlts = (data.bmi > 40) || data.hasConcentricCollapse ||
        (data.friedmanStage === 'III' || data.friedmanStage === 'IV');
      if (limitedAlts) {
        return `<strong>PAP Therapy — Why It Matters Most for You</strong> — For severe sleep apnea, PAP remains the most reliable way to prevent breathing events across sleep stages and positions. A structured retry can focus on ${esc(patientCpapBarrierText(data))}; benefits generally increase with nightly use.`;
      }
    }

    /* Soft-tissue airway surgery: honest candidacy for poor soft-tissue candidates.
       Do not promote a specific implant until the device-specific workup is complete. */
    if ((tag === 'SURGALT' || tag === 'SURG') && data) {
      const poorSoftTissue = (data.bmi > 40) ||
        data.friedmanStage === 'III' || data.friedmanStage === 'IV';
      if (poorSoftTissue) {
        const reasons = [];
        if (data.friedmanStage === 'III' || data.friedmanStage === 'IV') reasons.push('your airway anatomy (Friedman Stage ' + data.friedmanStage + ', with smaller tonsils)');
        if (data.bmi > 40) reasons.push('a BMI above 40');
        const reasonText = reasons.length <= 1 ? (reasons[0] || 'your evaluation')
          : reasons.slice(0, -1).join(' and ');
        return `<strong>Soft-Tissue Surgery — Honest Candidacy</strong> — Based on ${reasonText}, traditional palate or tonsil surgery is <strong>less likely to fully resolve</strong> your sleep apnea by itself. If PAP remains difficult, your ENT can review other approaches after considering the complete airway exam, prior-treatment history, and any procedure-specific airway evaluation.`;
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
    const canonicalRecTags = canonicalizePatientRecEntries(data);
    const isPreStudy = getReportStage(data) === 'pre-study';
    /* The pre-study evaluation section and 30-day checklist already explain
       and operationalize the sleep-study decision. Do not repeat the same
       concept as a treatment card; retain any distinct safe interim actions. */
    const recTags = isPreStudy
      ? canonicalRecTags.filter(rec => rec.tag !== 'SLEEP-STUDY')
      : canonicalRecTags;
    if (recTags.length === 0) return '';

    /* Build a deduplicated list, then present only the decisions a patient needs now. */
    const seenDescriptions = new Set();
    const allRecs = [];
    const isNormalStudy = exists(data.primaryAHI) && data.primaryAHI < 5;

    if (data.hasCOMISA) {
      const cbtiEntry = recTags.find(r => r.tag === 'CBTI');
      if (cbtiEntry) {
        const html = patientFriendlyRec('CBTI', cbtiEntry.text, data);
        if (html) { allRecs.push({ html, tag: 'CBTI' }); seenDescriptions.add(html); }
      }
    }

    for (const { text, tag } of recTags) {
      const html = patientFriendlyRec(tag, text, data);
      if (!html || seenDescriptions.has(html)) continue;
      seenDescriptions.add(html);
      allRecs.push({ html, tag });
    }

    if (allRecs.length === 0) return '';

    const isMildLowHB = data.severity?.toLowerCase() === 'mild' && data.lowHypoxicBurden;
    const isCpapAvoidant = data.prefAvoidCpap && !data.cpapFailed;
    if (data.hasCOMISA) {
      const priority = new Map([['CBTI', 0], ['CPAP', 1], ['NASAL-OPT', 2], ['WEIGHT', 3]]);
      allRecs.sort((a, b) => (priority.get(a.tag) ?? 20) - (priority.get(b.tag) ?? 20));
    }

    const hasPAPPlan = recTags.some(r => r.tag === 'CPAP' || r.tag.startsWith('CPAP-'));
    const papFirst = hasPAPPlan && !data.cpapCurrent && !isMildLowHB && !isCpapAvoidant &&
      !(data.cpapFailed && !data.cpapWillRetry);
    const backupTags = new Set(['MAD', 'MAD-FAVORABLE', 'MAD-POOR', 'HNS', 'INSPIRE-EVAL', 'SURG', 'SURGALT', 'TONSIL']);
    const backupWorkupTags = new Set(['HNS-WORKUP', 'SURGERY-WORKUP', 'AIRWAY-PROCEDURE-WORKUP', 'MAD-WORKUP', 'ANATOMY-WORKUP']);

    const conditional = papFirst
      ? allRecs.filter(rec => backupTags.has(rec.tag) || backupWorkupTags.has(rec.tag))
      : [];
    const workups = allRecs.filter(rec => workupTags.has(rec.tag) && !conditional.includes(rec));
    let actions = allRecs.filter(rec => !workupTags.has(rec.tag) && !conditional.includes(rec));

    if (isMildLowHB || isCpapAvoidant) {
      const cpap = actions.find(rec => rec.tag === 'CPAP');
      actions = actions.filter(rec => rec.tag !== 'CPAP');
      if (cpap) actions.push(cpap);
    }

    const startNow = actions.slice(0, 3);
    /* Supporting changes already become concrete checklist actions below; do not
       repeat them as a second block just because three primary therapies came first. */
    const discuss = actions.slice(3, 5).filter(rec => !['WEIGHT', 'NASAL-OPT', 'POS'].includes(rec.tag));
    const conditionalShown = conditional.slice(0, 2);
    const workupsShown = workups.slice(0, 1);

    const sectionTitle = (isPreStudy || isNormalStudy) ? 'Your Next Steps' : 'Your Treatment Plan';
    let output = `\n<h2>${sectionTitle}</h2>`;

    const limitedAlternatives = (data.bmi > 40) || data.hasConcentricCollapse ||
      (data.friedmanStage === 'III' || data.friedmanStage === 'IV');
    if (data.cpapFailed && !data.cpapWillRetry && data.severity?.toLowerCase() === 'severe' && limitedAlternatives) {
      output += `
<div class="cpap-context-box">
  <strong>An honest conversation about PAP.</strong> PAP has been difficult, including ${esc(patientCpapBarrierText(data))}, and some alternatives may be less effective for your profile. We will respect your experience while reviewing ways to improve comfort and the most appropriate non-PAP options.
</div>`;
    } else if (data.cpapFailed && !data.cpapWillRetry) {
      output += `
<div class="cpap-context-box">
  <strong>We hear you on PAP.</strong> Your first attempt was limited by ${esc(patientCpapBarrierText(data))}. Your plan leads with non-PAP options that fit your anatomy, health, and preferences.
</div>`;
    } else if (data.cpapFailed && data.cpapWillRetry) {
      output += `
<div class="cpap-context-box">
  <strong>Giving PAP another try.</strong> This attempt will focus on ${esc(patientCpapBarrierText(data))}, with backup options available if it remains difficult.
</div>`;
    } else if (data.prefAvoidCpap && !data.cpapFailed) {
      output += `
<div class="cpap-context-box">
  <strong>We understand your preference.</strong> Your plan leads with reasonable non-PAP options while keeping PAP available if you need it.
</div>`;
    } else if (data.cpapCurrent) {
      output += `
<div class="cpap-context-box">
  <strong>Building on your current PAP therapy.</strong> These recommendations support comfort and results; your follow-up will determine whether settings or equipment need adjustment.
</div>`;
    }

    if (isMildLowHB) {
      output += `
<div class="cpap-context-box" style="border-color:#86b89a;background:#edf7f0;">
  <strong>You have reasonable options beyond PAP.</strong> With mild sleep apnea and a lower-risk oxygen profile, an oral appliance, positional therapy, or weight management may be appropriate first steps when paired with follow-up assessment.
</div>`;
    }

    if (isPreStudy) {
      output += `\n<p>Before we choose a sleep apnea treatment, the next step is confirming what is happening during sleep and starting any safe support measures that can help in the meantime.</p>`;
    } else if (isNormalStudy) {
      output += `\n<p>Based on your symptoms and the patterns seen on your sleep study, these are the most helpful next steps to discuss or begin now.</p>`;
    } else {
      output += `\n<p>Start with these priorities; backup options remain conditional on your response and complete evaluation.</p>`;
    }

    if (data.hasCOMISA) {
      output += `
<div class="comisa-callout">
  <strong>You have both insomnia and sleep apnea (COMISA).</strong>
  <p style="margin:0.4rem 0 0;">CBT-I treats insomnia while PAP treats breathing. Begin both pathways together unless your clinician recommends a different sequence.</p>
</div>`;
    }

    if (startNow.length > 0) {
      output += `\n<div class="treatment-group-label">Start Now</div>`;
      startNow.forEach(rec => {
        output += `\n<div class="rec-item">${rec.html}</div>`;
      });
    }

    if (conditionalShown.length > 0) {
      output += `\n<div class="treatment-group-label">If PAP Remains Difficult</div>`;
      conditionalShown.forEach(rec => {
        output += `\n<div class="rec-item">${rec.html}</div>`;
      });
    }

    if (workupsShown.length > 0) {
      output += `\n<div class="treatment-group-label">Complete Before Finalizing Other Options</div>`;
      workupsShown.forEach(rec => {
        output += `\n<div class="rec-item">${rec.html}</div>`;
      });
    }

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
  /**
   * A focused patient checklist. The clinician report retains the full workup list;
   * this page is deliberately limited to the five actions most useful right now.
   */
  function renderSectionE(data) {
    const recTags = canonicalizePatientRecEntries(data);
    if (!recTags.length) return '';

    const tags = new Set(recTags.map(r => r.tag));
    const actions = [];
    const add = (text, priority = 5) => {
      if (!text || actions.some(item => item.text === text)) return;
      actions.push({ text, priority });
    };
    const hasPAP = tags.has('CPAP') || [...tags].some(tag => tag.startsWith('CPAP-'));
    const papFirst = hasPAP && !data.cpapCurrent &&
      !(data.cpapFailed && !data.cpapWillRetry) && !data.prefAvoidCpap &&
      !(data.severity?.toLowerCase() === 'mild' && data.lowHypoxicBurden);
    const hasNasal = tags.has('NASAL-OPT') || tags.has('NASAL-SURG') || tags.has('NASAL-PRIOR');

    if (tags.has('SLEEP-STUDY')) {
      const studyLabel = data.studyType === 'psg' ? 'in-lab sleep study' : data.studyType === 'watchpat' ? 'home sleep study' : 'sleep study';
      add(`Schedule your ${studyLabel}, then arrange a visit to review the results and choose treatment.`, 0);
    }

    if (data.hasCOMISA && tags.has('CBTI') && hasPAP && !(data.cpapFailed && !data.cpapWillRetry)) {
      const papAction = data.cpapCurrent
        ? 'continue PAP and bring any comfort problems to your care team'
        : data.cpapFailed && data.cpapWillRetry
          ? 'arrange a PAP re-fitting'
          : 'arrange your PAP setup';
      add(`Begin CBT-I with a trained therapist or validated digital program, and ${papAction} in parallel.`, 0);
    } else if (tags.has('CBTI')) {
      add('Begin CBT-I with a trained therapist or validated digital program.', 0);
    }

    if (hasPAP && !(data.hasCOMISA && tags.has('CBTI')) && !(data.cpapFailed && !data.cpapWillRetry) && !data.prefAvoidCpap) {
      if (data.cpapCurrent) {
        add('Use PAP whenever you sleep and ask your care team to address mask, pressure, dryness, or nasal comfort problems.', 0);
      } else if (data.cpapFailed && data.cpapWillRetry) {
        add('Arrange a PAP re-fitting focused on the exact barrier from your first attempt, such as mask fit, pressure, dryness, or nasal blockage.', 0);
      } else {
        add('Arrange your PAP setup and use it whenever you sleep; benefits generally increase with nightly duration.', 0);
      }
    }

    if (hasNasal) {
      // FDA nasal-irrigation safety guidance: distilled, sterile, or boiled/cooled water.
      add('Start the nasal plan recommended by your clinician. For saline rinses, use only distilled, sterile, or previously boiled and cooled water.', 1);
    }

    if (tags.has('WEIGHT')) {
      add(data.bmi >= 30
        ? 'Choose one realistic weight-management step and discuss dietitian, structured-program, or medication support if appropriate.'
        : 'Choose one realistic nutrition or activity step and ask whether structured weight-management support would help.', 2);
    }

    if (tags.has('POS')) {
      add('Use a positional device or body pillow to stay off your back, then note whether you can maintain side-sleeping.', 3);
    }

    const hasMAD = tags.has('MAD') || tags.has('MAD-FAVORABLE') || tags.has('MAD-POOR');
    if (hasMAD && !data.priorMAD && !papFirst) {
      add('Schedule a sleep-dentist consultation for a custom oral appliance and plan follow-up testing after adjustment.', 3);
    }

    const hasHNS = tags.has('HNS') || tags.has('INSPIRE-EVAL');
    if (hasHNS && !papFirst && !(data.bmi > 40)) {
      add('Discuss device-specific nerve-stimulation candidacy with your ENT, including whether the option requires sleep endoscopy (DISE).', 3);
    }

    if (tags.has('ASV-CONTRA')) {
      add('Ask your sleep and heart teams which non-ASV options are appropriate because reduced heart function can make ASV unsafe.', -1);
    } else if (tags.has('ASV-SAFETY')) {
      add('Before ASV is considered, confirm whether a recent echocardiogram or heart-function result is needed.', -1);
    } else if (tags.has('CENTRAL-PSG-WORKUP')) {
      add('Ask whether central-breathing signals from the home study should be confirmed with an in-lab study before advanced PAP is chosen.', -1);
    }

    /* If the report contains only a prerequisite workup, give the patient one clear task.
       Technical endotype workups stay in the clinician report when treatment is already underway. */
    const hasTreatmentAction = actions.length > 0;
    if (!hasTreatmentAction) {
      const workupActions = [
        ['OXYGEN-WORKUP', 'Ask your care team to review the full oxygen portion of the sleep study before oxygen-related risk is finalized.'],
        ['POSITION-WORKUP', 'Ask whether the full report captured enough back-sleeping versus side-sleeping data to guide treatment.'],
        ['SLEEP-STAGE-WORKUP', 'Ask whether the REM versus non-REM portion of the study was complete enough to guide treatment.'],
        ['ANATOMY-WORKUP', 'Schedule or complete a full airway exam before anatomy-based treatment decisions are finalized.'],
        ['HNS-WORKUP', 'Schedule the remaining device-specific nerve-stimulation workup before treating an implant as a finalized option; ask whether DISE is required for the option being considered.'],
        ['AIRWAY-PROCEDURE-WORKUP', 'Complete the remaining procedure-specific airway evaluation before choosing surgery or nerve stimulation; this may include DISE.'],
        ['NASAL-WORKUP', 'Review nasal blockage symptoms and complete a nasal exam before nasal treatment is finalized.'],
        ['MAD-WORKUP', 'Ask the sleep dentist to confirm tooth support, jaw movement, and TMJ safety before an oral appliance is finalized.'],
        ['MAD-SAFETY-LIMIT', 'Ask whether current tooth, jaw-movement, or TMJ findings make an oral appliance a poor fit.'],
        ['SURGERY-WORKUP', 'Schedule or complete a sleep endoscopy (DISE) before choosing a specific airway surgery.'],
      ];
      const match = workupActions.find(([tag]) => tags.has(tag));
      if (match) add(match[1], 0);
    }

    const isSurgicalPathway = Array.isArray(data.milestones) && data.milestones.some(m =>
      ['DISE Scheduled', 'DISE Completed', 'Surgery Scheduled', 'Post-Op'].includes(m));
    if (!isSurgicalPathway) {
      add(getReportStage(data) === 'pre-study'
        ? 'Schedule follow-up after the sleep study so you can review the results together.'
        : 'Schedule follow-up in 4–6 weeks to review progress, troubleshoot barriers, and adjust the plan.', 9);
    }

    const topFive = actions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5);
    if (!topFive.length) return '';

    return `
<h2>Your First 30 Days</h2>
<p>Focus on these steps first. Your care team can add detail as treatment progresses.</p>
<div class="checklist-group">
  ${topFive.map(item => `<div class="checklist-item"><div class="checklist-box"></div><div>${esc(item.text)}</div></div>`).join('')}
</div>`;
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
      items.push(`
<div class="whatif-item">
  <strong>What if you lost weight?</strong>
  <p style="margin:0.4rem 0 0;">Weight loss often lowers sleep apnea severity and can make other treatments work better, but the amount of improvement varies from person to person.</p>
</div>`);
    } else if (showWeight && isPreStudy) {
      items.push(`
<div class="whatif-item">
  <strong>What if you lost weight?</strong>
  <p style="margin:0.4rem 0 0;">Extra weight around the neck and throat is one of the biggest drivers of snoring and sleep apnea. Even losing 5–7 pounds can noticeably cut snoring, and it makes any future treatment work better.</p>
</div>`);
    }

    /* Positional AHI comparison */
    if (showPos) {
      const supAHI    = data.supPahi  ?? data.ahiSup    ?? null;
      const nonSupAHI = data.nonSupPahi ?? data.ahiNonSup ?? null;

      if (supAHI !== null && nonSupAHI !== null) {
        items.push(`
<div class="whatif-item">
  <strong>What if you slept on your side every night?</strong>
  <p style="margin:0.4rem 0 0;">Your breathing is much worse on your back than on your side. Sleeping on your side consistently could cut your events sharply — it's one of the simplest changes with a real payoff, and a positional device helps you keep it up overnight.</p>
</div>`);
      } else {
        items.push(`
<div class="whatif-item">
  <strong>What if you slept on your side every night?</strong>
  <p style="margin:0.4rem 0 0;">Your study showed your breathing is much worse on your back. Sleeping on your side is one of the simplest changes you can make and can sharply reduce your breathing events — a positional device helps you keep it up overnight.</p>
</div>`);
      }
    }

    /* Nasal obstruction */
    if (showNasal) {
      items.push(`
<div class="whatif-item">
  <strong>What if your nasal obstruction were treated?</strong>
  <p style="margin:0.4rem 0 0;">Treating nasal blockage can improve airflow and make PAP or an oral appliance easier to use. It usually supports rather than replaces treatment for sleep apnea itself.</p>
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

    /* Phase 3: lead with the takeaway, not a list of numbers. The specific metrics live in
       "Understanding Your Results" and the clinician report; here we give the why + the hope. */
    const oxygenBurdenNote = Array.isArray(data.phen) && data.phen.includes('High Hypoxic Burden')
      ? ' Your study also showed an elevated oxygen burden. That is a consequence of the breathing interruptions—not a cause of sleep apnea—and it increases the importance of timely, effective treatment and follow-up testing.'
      : '';
    return `
<div class="risk-summary" role="note">
  <strong>Why This Matters:</strong> Sleep apnea at this level is associated with risks to heart health and daytime functioning.${oxygenBurdenNote} Follow-up testing will confirm whether treatment is controlling the breathing events and oxygen drops.
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     FOOTER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderFooter(data) {
    /* Inline styles (not a CSS class) so the disclaimer survives the PDF pipeline,
       which strips external stylesheets. Quiet/muted by design to avoid adding to
       the report's visual density. */
    return `
<div class="report-disclaimer" style="margin-top:1.5rem;padding-top:0.85rem;border-top:1px solid #e2e8f0;font-size:0.78rem;line-height:1.55;color:#64748b;">
  This summary supports your discussion with your care team; it is not a final diagnosis or a substitute for medical advice. Review it with your doctor before making care decisions. For chest pain, severe trouble breathing, or another emergency, call 911.
</div>
`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN ENTRY POINT
     ══════════════════════════════════════════════════════════════════════════ */
  function generateReportHTML(data) {
    const reportBodySections = [
      renderSummaryCard(data),
      renderCarePathway(data),
      renderSectionA(data),
      renderSectionB(data),
      renderSectionB2(data),
      /* renderDataLimitations suppressed from the patient view (Phase 3) — these
         "what may still be refined" notes are clinician-oriented and actionless for
         the patient; the clinician report still surfaces data-completeness gaps. */
      renderSectionC(data),
      renderSectionD(data),
      renderSectionE(data),
      renderFooter(data),
    ].filter(Boolean);
    const sections = [
      renderHeader(data),
      renderTerminologyGuide(reportBodySections.join('')),
      ...reportBodySections,
    ].filter(Boolean).map((sectionHtml, index) =>
      `<section class="report-section report-section-${index + 1}">${sectionHtml}</section>`
    );
    const reportHTML = '<div class="patient-report" data-patient-name="' + esc(data.patientName || '') + '" data-report-date="' + esc(data.reportDate || '') + '">' + sections.join('') + '</div>';
    return normalizePatientHandoutPunctuation(reportHTML);
  }

  return { generateReportHTML, getReportStage };

})();
