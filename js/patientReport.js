'use strict';
/* ── Patient Report Generator ──────────────────────────────────────────────
   Generates patient-facing sleep report HTML.
   Exposes: PatientReport.generateReportHTML(data), PatientReport.getReportStage(data)
   Depends on: Bootstrap 5.3.3, Bootstrap Icons, Inter font
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
    const title     = stage === 'pre-study'
      ? 'Your Sleep Evaluation Summary'
      : 'Your Sleep Apnea Report';
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
    ${patName ? `<div style="font-weight:600;color:#374151;">${patName}</div>` : ''}
    ${dateStr ? `<div>${dateStr}</div>` : ''}
  </div>
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

    if (data.tonsils !== null && data.tonsils !== undefined && +data.tonsils >= 3) {
      examParts.push(`<p>Your tonsils are enlarged (size ${+data.tonsils} out of 4). Large tonsils can narrow the back of the throat and reduce the space available for airflow during sleep.</p>`);
    }
    if (data.ftp !== null && data.ftp !== undefined && +data.ftp >= 3) {
      examParts.push(`<p>Your Friedman Tongue Position score is ${+data.ftp}, which means there is limited space at the back of your tongue and throat. This is a common physical finding in people who have trouble breathing at night.</p>`);
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
<h2>Why We're Recommending a Sleep Study</h2>
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

    /* — Plain language AHI explanation — */
    const ahiExpl = `
<p>During your sleep study, we measured how often your breathing slowed down or stopped while you were asleep. This is called the <strong>Apnea-Hypopnea Index (AHI)</strong>. Your AHI is <strong>${ahiRound} events per hour</strong>, which means your breathing was interrupted about ${ahiRound} times every hour of sleep.</p>
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

    return `
<h2>Understanding Your Results</h2>
${ahiExpl}
${ahiScale}
${subtypeHtml}`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SECTION C — What's Contributing to Your Sleep Apnea
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSectionC(data) {
    const phen = data.phen || [];
    if (phen.length === 0 || getReportStage(data) !== 'post-study') return '';

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

      'Poor Muscle Responsiveness': `The muscles around your airway are not responding as strongly as expected when breathing gets difficult. Normally, when the airway starts to close, a reflex tightens the throat muscles to hold it open. In your case, this reflex may be weaker, especially during dream (REM) sleep when muscles are naturally more relaxed. Inspire therapy — a small implant that stimulates the airway nerve — is specifically designed to address this pattern and can be very effective.`,

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
    'MAD': `<strong>Oral Appliance Therapy</strong> — An oral appliance (also called a mandibular advancement device) is a custom-fitted mouthguard worn during sleep. It gently moves your lower jaw forward to keep the airway open. Oral appliances are a great option for people who find CPAP uncomfortable, have mild to moderate sleep apnea, or whose sleep apnea is strongly related to their jaw or throat anatomy. They are made by a sleep dentist and adjusted over several visits.`,
    'POS': `<strong>Positional Therapy</strong> — Because your sleep apnea is significantly worse when sleeping on your back, changing your sleep position can make a real difference. Positional therapy devices (such as a vibrating alarm worn on the back or a specially shaped pillow) remind you to sleep on your side. For some patients, this alone can cut the number of breathing events in half or more. It is often used alongside other treatments for the best results.`,
    'POS-GUARD': null,  // Contextual note — appended to POS, not shown standalone
    'HNS': `<strong>Inspire Upper Airway Stimulation (Inspire Therapy)</strong> — Inspire is a small, implanted device that stimulates the nerve controlling the tongue muscle, keeping the airway open during sleep. Unlike CPAP, there is no mask or airflow — the device works automatically while you sleep. Inspire is FDA-approved for people who have moderate-to-severe sleep apnea, have not been helped by CPAP, and meet specific criteria. A candidacy evaluation will determine whether this option is right for you.`,
    'WEIGHT': `<strong>Weight Management</strong> — Excess weight is one of the most significant reversible risk factors for sleep apnea. Even a modest reduction in body weight — as little as 10% — can meaningfully reduce the number of breathing events per hour. Losing weight can also improve how well other treatments (like CPAP or oral appliances) work. Your doctor can connect you with resources including dietitians, structured programs, or medical weight loss options.`,
    'NASAL-OPT': `<strong>Nasal Treatment</strong> — Treating nasal obstruction can improve airflow and make other sleep apnea therapies work better. Depending on your anatomy, options may include nasal steroid sprays, allergy treatment, nasal dilator strips, or surgical procedures such as septoplasty (to straighten a deviated septum) or turbinate reduction (to shrink enlarged nasal tissue). Your ENT surgeon will review your specific anatomy and recommend the most appropriate approach.`,
    'NASAL-SURG': null,  // Merged into NASAL-OPT
    'NASAL-PRIOR': null,  // Merged into NASAL-OPT
    'TONSIL': `<strong>Tonsil Surgery (Tonsillectomy)</strong> — If your tonsils are significantly enlarged, removing them can dramatically open the back of the throat and reduce or even eliminate sleep apnea in appropriate candidates. Tonsillectomy is a same-day surgical procedure performed under general anesthesia. Recovery typically takes 1–2 weeks. For patients with large tonsils, this can be one of the most impactful single-step treatments available.`,
    'CBTI': `<strong>CBT-I (Cognitive Behavioral Therapy for Insomnia)</strong> — CBT-I is the gold-standard, non-medication treatment for insomnia. It works by changing the thoughts and habits that interfere with sleep — things like irregular sleep schedules, spending too much time in bed, or anxiety about sleep. CBT-I is highly effective and its benefits last long-term, unlike sleep medications. It can be done with a therapist in-person or through a validated digital program.`,
    'SURGALT': `<strong>Airway Surgery</strong> — For patients whose sleep apnea is related to the physical structure of their throat or jaw, surgical procedures can open the airway and reduce or eliminate breathing events during sleep. Options depend on your specific anatomy and may include procedures on the palate, tongue base, or jaw. Your ENT surgeon will discuss which approach, if any, is appropriate for your situation.`,
    'HLG-ADV': `<strong>Alternative PAP Therapy</strong> — When standard CPAP is not the best fit, other positive airway pressure devices may work better. BiPAP (bilevel) uses different pressures for breathing in and out, which some people find more comfortable. ASV (adaptive servo-ventilation) automatically adjusts to your breathing pattern and is especially helpful for certain types of breathing instability during sleep. Your sleep specialist will determine which device is right for you.`,
    'REM-CHECK': null,  // Clinical detail — not shown as standalone
    'REM-MAD': null,  // Merged into MAD if present
    'HB-URG': null,  // Urgency note — woven into Why This Matters
    'DHR-TX': null,  // Clinical detail
    'SLEEP-STUDY': `<strong>Sleep Study</strong> — A sleep study measures your breathing, oxygen levels, heart rate, and sleep stages to get a full picture of what's happening while you sleep. Depending on your situation, this may be a home sleep test (a small device you wear overnight at home) or an in-lab study (which captures more detailed data in a monitored sleep center). The results will guide your treatment decisions.`,
  };

  /* Tags that are sub-items of CPAP — should not render as standalone recs */
  const cpapSubTags = new Set(['CPAP-ALT','CPAP-PREF','CPAP-OPT','CPAP-DESENTIZE','CPAP-HUMID','CPAP-RETITRATE','CPAP-FIXED']);
  const nasalSubTags = new Set(['NASAL-SURG','NASAL-PRIOR']);
  const suppressedTags = new Set(['POS-GUARD','REM-CHECK','REM-MAD','HB-URG','DHR-TX']);

  /**
   * Map a rec tag to its patient-friendly HTML, or return null if it should be suppressed.
   */
  function patientFriendlyRec(tag, rawText) {
    if (cpapSubTags.has(tag) || nasalSubTags.has(tag) || suppressedTags.has(tag)) return null;
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
    const recTags = data.recTags || [];
    if (recTags.length === 0) return '';

    /* ── Build deduplicated, ordered rec list ── */
    const seenDescriptions = new Set();
    const allRecs = [];  // {html, tag}

    /* For COMISA patients: ensure CBT-I appears first */
    if (data.hasCOMISA) {
      const cbtiEntry = recTags.find(r => r.tag === 'CBTI');
      if (cbtiEntry) {
        const html = patientFriendlyRec('CBTI', cbtiEntry.text);
        if (html) { allRecs.push({ html, tag: 'CBTI' }); seenDescriptions.add(html); }
      }
    }

    /* Process remaining recs in order */
    for (const { text, tag } of recTags) {
      const html = patientFriendlyRec(tag, text);
      if (!html || seenDescriptions.has(html)) continue;
      seenDescriptions.add(html);
      allRecs.push({ html, tag });
    }

    if (allRecs.length === 0) return '';

    /* ── Split into Start Now / Discuss With Your Doctor ── */
    const splitAt = Math.min(3, allRecs.length);
    const startNow = allRecs.slice(0, splitAt);
    const discuss  = allRecs.slice(splitAt);

    let output = `\n<h2>Your Treatment Plan</h2>`;

    /* ── CPAP context for non-compliant patients — BEFORE the rec list ── */
    if (data.cpapFailed && !data.cpapWillRetry) {
      output += `
<div class="cpap-context-box">
  <strong>We hear you on CPAP.</strong> We know CPAP hasn't worked well for you in the past, and you're not alone — many people struggle with CPAP masks, pressure, or comfort. Your treatment plan below leads with non-CPAP options that may be a better fit for you. We've also included information about CPAP because it remains the most studied treatment, and CPAP technology has improved significantly in recent years. But our first goal is to find a treatment that works for your life.
</div>`;
    } else if (data.cpapFailed && data.cpapWillRetry) {
      output += `
<div class="cpap-context-box">
  <strong>Giving CPAP another try.</strong> We know CPAP was difficult for you before. Since you're open to trying again, we'll work to make this attempt different — with better mask fitting, optimized pressure settings, and strategies to address the specific issues you experienced. We've also included non-CPAP alternatives in case you decide CPAP still isn't right for you.
</div>`;
    } else if (data.cpapCurrent) {
      output += `
<div class="cpap-context-box">
  <strong>Building on your current CPAP therapy.</strong> You are already using CPAP, which is a great foundation. The recommendations below are designed to work alongside your CPAP and may help improve your results further. We'll discuss whether any adjustments to your current therapy are needed at your follow-up.
</div>`;
    }

    output += `\n<p>Based on your evaluation, your care team has put together a plan tailored to your results. These recommendations are ordered by priority.</p>`;

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
    const recTags = data.recTags || [];
    if (recTags.length === 0) return '';

    const tags = new Set(recTags.map(r => r.tag));
    const hasCPAP = tags.has('CPAP') || tags.has('CPAP-OPT') || tags.has('CPAP-FIXED');
    const checkItems = [];

    /* CBT-I first for COMISA patients */
    if (data.hasCOMISA && tags.has('CBTI')) {
      checkItems.push('Ask your doctor for a referral to a CBT-I therapist, or explore a validated digital CBT-I program (such as Sleepio or SomRyst) to get started right away. Starting CBT-I early can also make it easier to use CPAP or other treatments later.');
    }

    /* CPAP — but different messaging for non-compliant patients */
    if (hasCPAP) {
      if (data.cpapFailed && !data.cpapWillRetry) {
        // Don't lead with CPAP setup for patients who don't want it
        // Instead, add it further down as a "consider" item
      } else if (data.cpapFailed && data.cpapWillRetry) {
        checkItems.push('Schedule a CPAP re-fitting appointment — ask about newer mask styles and auto-adjusting machines that may address your prior concerns.');
        checkItems.push('Try wearing your mask for 20–30 minutes while watching TV or reading before your first night — this helps your brain get used to the sensation.');
      } else if (!data.cpapFailed) {
        checkItems.push('Schedule your CPAP setup appointment with the equipment supplier.');
        checkItems.push('Try wearing your mask for 20–30 minutes while watching TV or reading before your first night — this helps your brain get used to the sensation.');
        checkItems.push('Aim to use CPAP for at least 4 hours every night. Consistent use, even when imperfect, leads to better results over time.');
      }
    }

    /* Oral appliance */
    if (tags.has('MAD') || tags.has('SURGALT') || recTags.some(r => r.text.toLowerCase().includes('mandibular'))) {
      checkItems.push('Schedule a consultation with a sleep dentist to begin the process of fitting your custom oral appliance.');
    }

    /* Positional */
    if (tags.has('POS')) {
      checkItems.push('Try a positional sleep device or body pillow to help you stay off your back during sleep.');
      checkItems.push('Keep a brief note of what position you wake up in for one week — this will help us see how well the positional therapy is working.');
    }

    /* Weight */
    if (tags.has('WEIGHT')) {
      checkItems.push('Set a realistic short-term goal of losing 5–10 pounds and identify one dietary change you can make this week.');
      checkItems.push('Ask your doctor about a referral to a registered dietitian or a structured weight management program.');
    }

    /* Nasal */
    if (tags.has('NASAL-OPT') || tags.has('NASAL-SURG') || tags.has('NASAL-PRIOR')) {
      checkItems.push('Begin saline nasal rinses (such as a neti pot or squeeze bottle) once or twice daily to reduce nasal inflammation and improve airflow.');
      checkItems.push('Schedule a follow-up appointment to discuss your nasal anatomy and whether a procedure might help.');
    }

    /* Inspire */
    if (tags.has('HNS')) {
      checkItems.push('Schedule a formal Inspire candidacy evaluation with your ENT surgeon to determine whether you qualify for the implant procedure.');
    }

    /* CBT-I (non-COMISA — already handled above for COMISA) */
    if (!data.hasCOMISA && tags.has('CBTI')) {
      checkItems.push('Ask your doctor for a referral to a CBT-I therapist, or explore a validated digital CBT-I program (such as Sleepio or SomRyst) to get started right away.');
    }

    /* CPAP as lower-priority for non-compliant patients */
    if (hasCPAP && data.cpapFailed && !data.cpapWillRetry) {
      checkItems.push('If you are open to trying CPAP again in the future, ask about newer auto-adjusting machines and mask styles — the technology has improved significantly. Treating nasal obstruction first can also make CPAP more comfortable.');
    }

    /* Always add follow-up */
    checkItems.push('Schedule a follow-up appointment in 4–6 weeks to review your progress and adjust your treatment plan if needed.');

    const items = checkItems.map(item => `
<div class="checklist-item">
  <div class="checklist-box"></div>
  <div>${esc(item)}</div>
</div>`).join('');

    return `
<h2>Your First 30 Days</h2>
<p>Here is a practical checklist to help you get started. Check off each item as you complete it.</p>
${items}`;
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
    const showWeight   = bmi !== null && bmi >= 27 && hasPrimAHI;
    const showPos      = hasPos;
    const showNasal    = hasNasal;

    if (!showWeight && !showPos && !showNasal) return '';

    const items = [];

    /* Weight / AHI projection */
    if (showWeight) {
      const projAHI = Math.round(data.primaryAHI * 0.70);
      items.push(`
<div class="whatif-item">
  <strong>What if you lost weight?</strong>
  <p style="margin:0.4rem 0 0;">Your current AHI is <strong>${Math.round(data.primaryAHI)}</strong>. Research shows that meaningful weight loss can reduce sleep apnea severity by about 30% or more. Based on your results, reaching a healthier weight could potentially bring your AHI down to around <strong>${projAHI}</strong> — a significant improvement. Weight loss does not guarantee a cure, but it often makes other treatments work better and reduces the strain on your heart and joints.</p>
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

    return `
<h2>What If…?</h2>
<p>These scenarios show how specific changes could affect your sleep apnea. They're meant to motivate and inform — not to suggest that these steps alone will resolve everything.</p>
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

    /* Trigger on severe AHI OR any HB metric in severe range */
    const triggerSevereAHI = pAHI !== null && pAHI !== undefined && +pAHI >= 30;
    const triggerHB        = hbArea !== null && hbArea > 60;
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
<p>The encouraging news is that effective treatment can significantly reduce these risks. Studies show that consistent CPAP use or successful surgical treatment brings blood pressure down, reduces cardiovascular events, and improves memory and mood. Addressing your sleep apnea is one of the most impactful steps you can take for your long-term health — and most people notice meaningful improvements in how they feel within weeks of starting treatment.</p>`;
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
      renderSectionA(data),
      renderSectionB(data),
      renderSectionC(data),
      renderSectionD(data),
      renderSectionE(data),
      renderSectionF(data),
      renderSectionG(data),
      renderFooter(data),
    ];
    return '<div class="patient-report">' + sections.join('') + '</div>';
  }

  return { generateReportHTML, getReportStage };

})();
