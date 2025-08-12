/*  OSA Phenotyper – PALM + extras (US-English)
    - Confidence meter per phenotype (+ "Why this?" drawers)
    - CPAP readiness/adherence risk badge
    - What-if counseling (−10% weight, septoplasty, side-sleeping)
    - Surgical pathway helper (CT + nasal flags; DISE hint)
    - Contraindication guardrails (HLG → ASV caution / LVEF check)
    - Positional therapy mini-plan
    - Richer Sleepy/Disturbed/Minimal explainer
    - Edge-case nudge when Non-supine AHI defaulted
    - Referral note snippets (Dentist / ENT / Cardiology)
    - Print handout button (patient section only)
    - WatchPAT extras accepted: Hypoxic Burden (total/per hr), AUC<90, pAHIc 3% & 4%
*/

'use strict';

/* ---------- tiny helpers ---------- */
function n(v){ return (v===null||v===undefined||v==='') ? null : (isNaN(+v) ? null : +v); }
function yes(f,key){ return f.get(key)==='on' || f.get(key)==='Yes' || (f.getAll(key)||[]).includes('on') || (f.getAll(key)||[]).includes('Yes'); }
function exists(v){ return v!==null && v!==undefined && v!==''; }

/* ---------- deduped recs ---------- */
const recSeen = new Set();
function pushRec(arr, text, tag){
  const key = (tag || text.trim().toLowerCase().slice(0, 64));
  if(recSeen.has(key)) return;
  recSeen.add(key);
  arr.push(text);
}

/* ---------- confidence helper ---------- */
function confidenceFor(tag, ctx){
  const m = ctx.metrics || {};
  switch(tag){
    case 'High Anatomical Contribution': {
      const strong =
        ((m.bmi||0) >= 35) +
        ((m.neck||0) >= 17.5) +
        ((m.tons||0) >= 3) +
        (['III','IV'].includes(m.mall) ? 1 : 0) +
        ((m.ahi||0) >= 30);
      if (strong >= 4) return 'High';
      if (strong >= 2) return 'Moderate';
      return 'Low';
    }
    case 'Low Arousal Threshold': {
      const arRatio = (m.arInd && m.ahi) ? (m.arInd/m.ahi) : 0;
      if ((m.isi||0) >= 22 || arRatio >= 1.8) return 'High';
      if ((m.isi||0) >= 15 || arRatio >= 1.3) return 'Moderate';
      return 'Low';
    }
    case 'High Loop Gain': {
      if ((m.csr||0) >= 20 || (m.pahic3||0) >= 20 || (m.pahic4||0) >= 20) return 'High';
      if ((m.csr||0) >= 10 || (m.pahic3||0) >= 10 || (m.pahic4||0) >= 10 || m.cvd) return 'Moderate';
      return 'Low';
    }
    case 'Poor Muscle Responsiveness': {
      const remNrem = (m.remAhi && m.nremAhi) ? (m.remAhi/m.nremAhi) : 0;
      if ((m.ahi||0) >= 30 && remNrem > 2.5) return 'High';
      if (remNrem > 2) return 'Moderate';
      return 'Low';
    }
    case 'Positional OSA': {
      const pr = (m.sup && m.nons) ? (m.sup/m.nons) : 0;
      if (pr >= 3 && (m.nons||0) < 10) return 'High';
      if (pr >= 2 && (m.nons||0) < 15) return 'Moderate';
      return 'Low';
    }
    case 'REM-Predominant OSA': {
      const rr = (m.remAhi && m.nremAhi) ? (m.remAhi/m.nremAhi) : 0;
      if (rr >= 3 && (m.nremAhi||0) < 10) return 'High';
      if (rr >= 2 && (m.nremAhi||0) < 15) return 'Moderate';
      return 'Low';
    }
    case 'High Hypoxic Burden': {
      const hbHit = (m.hbPerHr||0) >= 5 || (m.hbTotal||0) >= 30 || (m.areaU90||0) >= 1;
      if (hbHit || (m.nadir||100) < 80 || (m.odi||0) >= 60) return 'High';
      if ((m.nadir||100) < 85 || (m.odi||0) >= 40) return 'Moderate';
      return 'Low';
    }
    case 'Nasal-Resistance Contributor': {
      const flags = (m.nasalSeptum?1:0) + (m.nasalTurbs?1:0) + (m.rhinitisSev?1:0);
      if (flags >= 2) return 'High';
      if (flags === 1) return 'Moderate';
      return 'Low';
    }
    default: return 'Moderate';
  }
}

/* ---------- print styles (patient handout only) ---------- */
(function ensurePrintStyles(){
  var style = document.createElement('style');
  style.type='text/css';
  style.textContent =
    '@media print {' +
      'body * { visibility: hidden !important; }' +
      '#patientSummary, #patientSummary * { visibility: visible !important; }' +
      '#patientSummary { position: absolute; left: 0; top: 0; width: 100%; padding: 1rem; }' +
      '.no-print { display: none !important; }' +
      'h2, h3, h4, h5 { page-break-after: avoid; }' +
      'ul, ol { page-break-inside: avoid; }' +
    '}';
  document.head.appendChild(style);
})();

/* =================================================================== */
/* =======================  MAIN SUBMIT LOGIC  ======================= */
/* =================================================================== */
window.runPhenotyper = function(ev){
  recSeen.clear();
  var form = ev.target;
  var f = new FormData(form);

  var out = { phen:[], why:{}, recs:[] };
  function add(tag, reasons){
    if (out.phen.indexOf(tag) === -1){
      out.phen.push(tag);
      out.why[tag] = (reasons||[]).filter(Boolean);
    }
  }

  /* -------- inputs -------- */
  var bmi   = n(f.get('bmi'));
  var neck  = n(f.get('neck'));
  var tons  = n(f.get('tonsils'));
  var mall  = f.get('ftp');

  var ahi   = n(f.get('ahi')) || n(f.get('pahi'));
  var arInd = n(f.get('arInd'));
  var isi   = n(f.get('isi'));
  var ess   = n(f.get('ess'));

  var csr     = n(f.get('csr'));
  var pahic3  = n(f.get('pahic3')) || n(f.get('pahic')); // support old name
  var pahic4  = n(f.get('pahic4'));
  var cvd     = yes(f,'cvd');

  var remAhi  = n(f.get('ahiREM'))  || n(f.get('remPahi'));
  var nremAhi = n(f.get('ahiNREM')) || n(f.get('nremPahi'));

  var sup     = n(f.get('ahiSup'))   || n(f.get('supPahi'));
  var nonsIn  = n(f.get('ahiNonSup'))|| n(f.get('nonSupPahi'));
  var nonSupProvided = exists(n(f.get('ahiNonSup'))) || exists(n(f.get('nonSupPahi')));
  var nons    = (nonsIn===null ? 1 : nonsIn); // default if blank

  var odi   = n(f.get('odi'));
  var nadir = Math.min( n(f.get('nadir'))||99 , n(f.get('nadirPsg'))||99 );

  // New WatchPAT metrics (optional)
  var hbTotal  = n(f.get('hbTotal'))   || n(f.get('hypoxicBurdenTotal'));
  var hbPerHr  = n(f.get('hbPerHour')) || n(f.get('hbPerHr')) || n(f.get('hbph'));
  var areaU90  = n(f.get('au90'))      || n(f.get('areaUnder90')) || n(f.get('areaBelow90'));
  // (desaturation event count under 90% not used in logic but safe to parse)
  var desatUnder90Cnt = n(f.get('desatUnder90')) || n(f.get('eventsUnder90'));

  // Nasal signals
  var rhinitisVal = (f.get('rhinitis')||'').toLowerCase();
  var rhinitisSev = (rhinitisVal==='moderate' || rhinitisVal==='severe');
  var nasalSeptum = (f.get('septum')==='Yes') || yes(f,'ctSeptum') || yes(f,'ctDeviatedSeptum') || yes(f,'ctDev');
  var nasalTurbs  = yes(f,'ctTurbs') || yes(f,'ctTurbinateHypertrophy');

  var ctxBase = {
    bmi, neck, tons, mall, ahi, arInd, isi, ess,
    csr, pahic3, pahic4, cvd,
    remAhi, nremAhi, sup, nons,
    odi, nadir, hbTotal, hbPerHr, areaU90,
    nasalSeptum, nasalTurbs, rhinitisSev
  };

  /* -------- PALM traits -------- */
  var anatHits = 0;
  if (exists(bmi) && bmi>=30) anatHits++;
  if (exists(neck) && neck>=17) anatHits++;
  if (exists(tons) && +tons>=3) anatHits++;
  if (mall==='III' || mall==='IV') anatHits++;
  if (exists(ahi) && ahi>=30) anatHits++;
  if (anatHits>=3){
    add('High Anatomical Contribution', [
      exists(bmi)?('BMI '+bmi):'',
      exists(neck)?('Neck '+neck+' in'):'',
      exists(tons)?('Tonsils '+tons):'',
      mall?('Mallampati '+mall):'',
      exists(ahi)?('AHI '+ahi):''
    ]);
  }

  if ((exists(isi) && isi>=15) || (exists(arInd) && exists(ahi) && (arInd/ahi)>1.3)){
    add('Low Arousal Threshold', [
      exists(isi)?('ISI '+isi):'',
      (exists(arInd)&&exists(ahi))?('Arousal/AHI '+(arInd/ahi).toFixed(1)):''
    ]);
  }

  if ((exists(csr) && csr>=10) || (exists(pahic3) && pahic3>=10) || (exists(pahic4) && pahic4>=10) || cvd){
    add('High Loop Gain', [
      exists(csr)?('CSR '+csr+'%'):'',
      exists(pahic3)?('pAHIc 3% '+pahic3):'',
      exists(pahic4)?('pAHIc 4% '+pahic4):'',
      cvd?'Cardiovascular disease present':''
    ]);
  }

  if (exists(ahi) && ahi>=30 && exists(remAhi) && exists(nremAhi) && (remAhi/nremAhi)>2){
    add('Poor Muscle Responsiveness', [
      'REM/NREM '+(remAhi/nremAhi).toFixed(1),
      'AHI '+ahi
    ]);
  }

  /* -------- additional phenotypes -------- */
  if (exists(sup) && exists(nons) && (sup/nons)>2 && nons<15){
    add('Positional OSA', [
      'Sup/Non-sup '+(sup/nons).toFixed(1),
      'Non-sup AHI '+nons
    ]);
  }
  if (exists(remAhi) && exists(nremAhi) && (remAhi/nremAhi)>2 && nremAhi<15){
    add('REM-Predominant OSA', [
      'REM/NREM '+(remAhi/nremAhi).toFixed(1),
      'NREM AHI '+nremAhi
    ]);
  }

  var hbTriggers = [];
  if (exists(hbPerHr) && hbPerHr>=5) hbTriggers.push('HB/hr '+hbPerHr);
  if (exists(hbTotal) && hbTotal>=30) hbTriggers.push('HB total '+hbTotal);
  if (exists(areaU90) && areaU90>0)   hbTriggers.push('Area under 90% '+areaU90);
  if (exists(nadir) && nadir<85)      hbTriggers.push('Nadir SpO₂ '+nadir+'%');
  if (exists(odi) && odi>=40)         hbTriggers.push('ODI4 '+odi);
  if (hbTriggers.length){
    add('High Hypoxic Burden', hbTriggers);
  }

  if (nasalSeptum || nasalTurbs || rhinitisSev){
    add('Nasal-Resistance Contributor', [
      nasalSeptum?'Deviated septum':'',
      nasalTurbs?'Turbinate hypertrophy':'',
      rhinitisSev?('Rhinitis '+(f.get('rhinitis')||'')):''
    ]);
  }

  /* -------- treatment mapping -------- */
  var recs = out.recs;
  function mapPhen(p){
    switch(p){
      case 'High Anatomical Contribution':
        pushRec(recs,'Start CPAP/APAP (most effective for anatomical narrowing).','CPAP');
        if (exists(bmi) && bmi>=30) pushRec(recs,'Enroll in a structured weight-management program.','WEIGHT');
        pushRec(recs,'If CPAP fails or not tolerated: mandibular-advancement device or site-directed surgery / Inspire®.','SURGALT');
        break;
      case 'Low Arousal Threshold':
        pushRec(recs,'Optimize CPAP comfort (humidification, auto-ramp, mask fit, desensitization).','CPAP-OPT');
        pushRec(recs,'Add CBT-I for insomnia; consider low-dose sedative under specialist supervision.','CBTI');
        break;
      case 'High Loop Gain':
        pushRec(recs,'Favor fixed-pressure CPAP initially; monitor for treatment-emergent central apneas.','CPAP-FIXED');
        pushRec(recs,'If centrals persist: consider nocturnal oxygen, acetazolamide, or ASV (only if LVEF > 45%).','HLG-ADV');
        break;
      case 'Poor Muscle Responsiveness':
        pushRec(recs,'Ensure adequate CPAP titration; consider hypoglossal-nerve stimulation if CPAP fails.','HNS');
        break;
      case 'Positional OSA':
        pushRec(recs,'Begin positional therapy (vibratory trainer, backpack/pillow strategies).','POS');
        break;
      case 'REM-Predominant OSA':
        pushRec(recs,'Verify treatment efficacy during REM; pressure may need to be higher in REM.','REM-CHECK');
        pushRec(recs,'Oral appliance therapy is a reasonable alternative/adjunct in REM-predominant OSA.','REM-MAD');
        break;
      case 'High Hypoxic Burden':
        pushRec(recs,'Start effective therapy promptly to reduce cardiovascular risk.','HB-URG');
        break;
      case 'Nasal-Resistance Contributor':
        pushRec(recs,'Septoplasty and/or turbinate reduction can improve airflow and CPAP/MAD tolerance.','NASAL-SURG');
        break;
      default: break;
    }
  }
  for (var i=0;i<out.phen.length;i++) mapPhen(out.phen[i]);

  // Force core trio
  pushRec(recs,'Start CPAP/APAP','CPAP');
  pushRec(recs,'Custom oral appliance (MAD)','MAD');
  pushRec(recs,'Surgical correction of correctable airway blockage','SURG');

  /* -------- symptom subtype -------- */
  var subtype = 'Minimally-symptomatic';
  if (exists(ess) && ess>=15) subtype = 'Sleepy';
  else if (exists(isi) && isi>=15) subtype = 'Disturbed-sleep';

  var groupInfo = {
    'Sleepy': 'You feel very sleepy during the day. Treating OSA usually improves alertness, mood, and driving safety within weeks.',
    'Disturbed-sleep': 'Your sleep is broken or restless even if you are not very sleepy in the day. Treating the breathing problem and insomnia together works best.',
    'Minimally-symptomatic': 'You may not notice many symptoms, but repeated breathing pauses can strain the heart and brain over time.'
  };

  /* -------- patient summary -------- */
  var phenotypeExplain = {
    'High Anatomical Contribution':'Your airway is relatively narrow or crowded (weight, tongue/tonsils, palate shape).',
    'Low Arousal Threshold':'You wake up very easily; even small breathing changes can disrupt sleep.',
    'High Loop Gain':'Your breathing control system is extra sensitive and can “over-correct,” causing pauses.',
    'Poor Muscle Responsiveness':'Muscles that normally hold the airway open do not respond strongly during sleep.',
    'Positional OSA':'Breathing problems occur mainly when you sleep on your back.',
    'REM-Predominant OSA':'Breathing problems occur mainly in dream (REM) sleep.',
    'High Hypoxic Burden':'Your oxygen level spends a lot of time low during sleep, which can strain the heart.',
    'Nasal-Resistance Contributor':'Nasal blockage increases airflow resistance and can worsen snoring or CPAP comfort.'
  };

  var phenListHTML = '';
  for (var p=0;p<out.phen.length;p++){
    var tag = out.phen[p];
    var conf = confidenceFor(tag,{metrics: ctxBase});
    var whyArr = out.why[tag] || [];
    var whyHTML = (whyArr.length ? ('<details class="mt-1"><summary>Why this?</summary><small>'+ whyArr.join('; ') +'</small></details>') : '');
    phenListHTML += '<li><strong>'+tag+'</strong> <span class="badge bg-secondary">'+conf+' confidence</span><br>'+ (phenotypeExplain[tag]||'') + whyHTML + '</li>';
  }

  var borderlineNote = (subtype==='Minimally-symptomatic' && exists(ess) && ess>=12)
    ? ('<p class="text-muted">Your Epworth score ('+ess+') is near the “sleepy” range; many people feel noticeably more alert after starting therapy.</p>')
    : '';

  var hasLowAr = out.phen.indexOf('Low Arousal Threshold')>-1;
  var hasNasal = out.phen.indexOf('Nasal-Resistance Contributor')>-1;
  var readiness = 'Ready to start now';
  var readinessDetail = 'No major barriers predicted.';
  if (hasLowAr || hasNasal){
    readiness = 'Optimize comfort first';
    readinessDetail = (hasLowAr?'light, fragmented sleep (low arousal threshold)':'') +
                      (hasLowAr && hasNasal?' + ':'') +
                      (hasNasal?'nasal blockage':'') +
                      '. Work on comfort/airflow to boost success.';
  }
  var readinessBadge =
    '<span class="badge '+
    (readiness==='Ready to start now'?'bg-success':'bg-warning text-dark')+
    '">'+readiness+'</span>';

  var checklist = [];
  if (hasNasal) checklist.push('Daily saline rinse; consider intranasal steroid; ENT follow-up about septoplasty/turbinate reduction.');
  if (hasLowAr){
    checklist.push('Start CBT-I or brief behavioral insomnia therapy; consistent sleep/wake schedule.');
    checklist.push('Mask desensitization: wear mask while reading/TV for 15–30 min/day before bed.');
  }
  if (out.phen.indexOf('Positional OSA')>-1) checklist.push('Trial a positional therapy device or backpack/pillow solution for 2–4 weeks.');
  if (out.phen.indexOf('High Hypoxic Burden')>-1) checklist.push('Prioritize timely start of effective therapy to protect the heart.');
  if (exists(bmi) && bmi>=27) checklist.push('Begin weight-management plan; even ~10% weight loss can meaningfully reduce OSA severity.');
  checklist.push('Avoid alcohol and sedatives near bedtime; aim for side-sleeping when possible.');

  var checklistHTML = '<ul>' + checklist.map(function(i){ return '<li>'+i+'</li>'; }).join('') + '</ul>';

  var whatIfHTML =
    '<ul>' +
      '<li><strong>Lose 10% body weight:</strong> OSA severity often drops meaningfully; anatomical contribution may lessen.</li>' +
      '<li><strong>Septoplasty/turbinate surgery:</strong> improves nasal airflow and CPAP/MAD comfort; rarely cures OSA alone.</li>' +
      '<li><strong>Use a side-sleeping device:</strong> positional OSA typically improves; verify on a follow-up study.</li>' +
    '</ul>';

  var posPlan = (out.phen.indexOf('Positional OSA')>-1)
    ? ('<div class="mt-2"><strong>Positional plan:</strong><ul><li>Use a vibratory trainer or backpack/pillow method nightly for 2–4 weeks.</li><li>Recheck response with a home sleep test or device report focusing on non-supine vs supine.</li></ul></div>')
    : '';

  var nasalNote = (out.phen.indexOf('Nasal-Resistance Contributor')>-1)
    ? ('<p class="mt-2"><em>Nasal surgery doesn’t usually cure OSA, but it can reduce snoring, improve sleep quality, and make CPAP or oral appliances more comfortable.</em></p>')
    : '';

  var posNudge = (!nonSupProvided && exists(sup))
    ? ('<div class="alert alert-info mt-2">Positional result used a default non-supine AHI of 1 because none was entered. Please confirm on a future study.</div>')
    : '';

  var pHTML =
    '<div class="d-flex justify-content-between align-items-center">' +
      '<h2 class="h4 mb-2">Patient-Friendly Summary</h2>' +
      '<button class="btn btn-outline-primary btn-sm no-print" id="btnPrintHandout">Print handout</button>' +
    '</div>' +
    '<p>You are in the <strong>'+subtype+'</strong> group. <br><em>'+groupInfo[subtype]+'</em></p>' +
    borderlineNote +
    '<p><strong>CPAP readiness:</strong> '+readinessBadge+' <small class="text-muted"> '+readinessDetail+'</small></p>' +
    (out.phen.length ? ('<h5 class="mt-3">Main contributing factors</h5><ul>'+phenListHTML+'</ul>') : '') +
    nasalNote +
    posPlan +
    '<h5 class="mt-3">Recommended next steps</h5>' +
    '<ul>'+ out.recs.slice(0,8).map(function(r){ return '<li>'+r+'</li>'; }).join('') +'</ul>' +
    '<h5 class="mt-3">Your first 30 days</h5>' +
    checklistHTML +
    '<h5 class="mt-3">What if…?</h5>' +
    whatIfHTML +
    posNudge;

  /* -------- clinician decision support -------- */
  var confTable = '';
  for (var c=0;c<out.phen.length;c++){
    var t = out.phen[c];
    var conf = confidenceFor(t,{metrics: ctxBase});
    confTable += '<tr><td>'+t+'</td><td>'+conf+'</td><td><small>'+(out.why[t]||[]).join(', ')||'—'+'</small></td></tr>';
  }

  var guardrails = [];
  if (out.phen.indexOf('High Loop Gain')>-1) guardrails.push('If considering ASV, confirm LVEF > 45% (contraindicated in HFrEF ≤45%).');
  if (out.phen.indexOf('High Hypoxic Burden')>-1) guardrails.push('Prioritize timely initiation of effective therapy due to CV-risk association with hypoxic burden.');

  var supRatio = (exists(sup) && exists(nons)) ? (sup/nons).toFixed(1) : '—';
  var coreNums  = 'AHI: ' + (exists(ahi)?ahi:'—') +
                  ' | REM AHI: ' + (exists(remAhi)?remAhi:'—') +
                  ' | NREM AHI: ' + (exists(nremAhi)?nremAhi:'—') +
                  ' | Sup/Non-sup: ' + supRatio +
                  ' | Nadir SpO₂: ' + (exists(nadir)?(nadir+'%'):'—');
  var phenStr   = out.phen.join(', ') || '—';
  var nasalStr  = (out.phen.indexOf('Nasal-Resistance Contributor')>-1) ? 'Nasal obstruction present (septum/turbinates/rhinitis).' : '—';

  var noteDentist = 'Reason for referral: mandibular advancement device (MAD) evaluation.\nSummary: '+coreNums+'\nPhenotypes: '+phenStr+'\nNotes: Consider REM-predominant/positional involvement if listed. Coordinate titration and follow-up HSAT/PSG.';
  var noteENT     = 'Reason for referral: nasal/airway surgery evaluation.\nSummary: '+coreNums+'\nPhenotypes: '+phenStr+'\nNasal: '+nasalStr+'\nNotes: Septum/turbinates may improve airflow and PAP/MAD tolerance; assess palate/pharyngeal collapse per DISE if available.';
  var noteCards   = 'Reason for FYI/coordination: OSA with cardiovascular considerations.\nSummary: '+coreNums+'\nPhenotypes: '+phenStr+'\nNotes: If High Loop Gain persists with TECSA, consider O₂/acetazolamide; ASV only if LVEF > 45%.';

  var followUps = [];
  if (hasLowAr) followUps.push('CPAP comfort review in 2–4 weeks; CBT-I progress.');
  if (out.phen.indexOf('Positional OSA')>-1) followUps.push('Reassess after 2–4 weeks of positional therapy with HSAT/WatchPAT.');
  if (out.phen.indexOf('Nasal-Resistance Contributor')>-1) followUps.push('Post-septoplasty/turbinate check and repeat sleep testing as needed.');
  followUps.push('Therapy effectiveness check (adherence, residual AHI/ODI, symptoms) at 4–8 weeks.');

  var cHTML =
    '<h2 class="h4">Clinician Decision Support</h2>' +
    '<p><strong>Subtype:</strong> '+subtype+' (ESS '+(exists(ess)?ess:'—')+', ISI '+(exists(isi)?isi:'—')+')</p>' +
    '<p><strong>Key numbers:</strong> '+coreNums+'</p>' +
    (out.phen.length ?
      ('<div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Phenotype</th><th>Confidence</th><th>Triggers</th></tr></thead><tbody>'+confTable+'</tbody></table></div>') : ''
    ) +
    '<p><strong>Ranked treatment plan</strong></p>' +
    '<ol>'+recs.map(function(r){ return '<li>'+r+'</li>'; }).join('') +'</ol>' +
    (guardrails.length?('<div class="alert alert-warning mt-2"><strong>Guardrails:</strong> <ul>'+guardrails.map(function(g){return '<li>'+g+'</li>';}).join('')+'</ul></div>'):'') +
    ( (nasalSeptum||nasalTurbs) ? '<p><strong>Surgical targets (if pursuing intervention):</strong> Nasal: septum/turbinates.</p>' : '' ) +
    '<h5 class="mt-3">Referral notes</h5>' +
    '<div class="row g-2">' +
      '<div class="col-md-4"><button class="btn btn-outline-secondary btn-sm w-100 no-print" data-copy="dentist">Copy Dentist (MAD)</button></div>' +
      '<div class="col-md-4"><button class="btn btn-outline-secondary btn-sm w-100 no-print" data-copy="ent">Copy ENT</button></div>' +
      '<div class="col-md-4"><button class="btn btn-outline-secondary btn-sm w-100 no-print" data-copy="cards">Copy Cardiology</button></div>' +
    '</div>' +
    '<textarea id="refNoteBuffer" class="form-control mt-2 no-print" rows="6" placeholder="Referral note will appear here when you click one of the buttons." readonly></textarea>' +
    '<h5 class="mt-3">Follow-up</h5>' +
    '<ul>'+followUps.map(function(x){ return '<li>'+x+'</li>'; }).join('') +'</ul>';

  document.getElementById('patientSummary').innerHTML = pHTML;
  document.getElementById('clinicianReport').innerHTML = cHTML;

  // Print button
  var btnPrint = document.getElementById('btnPrintHandout');
  if (btnPrint){ btnPrint.addEventListener('click', function(){ window.print(); }); }

  // Referral copiers
  var buffer = document.getElementById('refNoteBuffer');
  var btns = document.querySelectorAll('[data-copy]');
  for (var b=0;b<btns.length;b++){
    (function(btn){
      btn.addEventListener('click', function(){
        var kind = btn.getAttribute('data-copy');
        var txt = (kind==='dentist') ? noteDentist : (kind==='ent') ? noteENT : noteCards;
        buffer.value = txt;
        if (navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(txt).catch(function(){ /* ignore */ });
        } else {
          buffer.select();
          try { document.execCommand('copy'); } catch(e){}
        }
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function(){ btn.textContent = original; }, 1200);
      });
    })(btns[b]);
  }

  // Smooth scroll
  var target = document.getElementById('patientSummary');
  if (target && target.offsetTop){
    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
  }
};

/* =================================================================== */
/* ====================  SAFE FORM WIRING ON LOAD  =================== */
/* =================================================================== */
(function wireSubmit(){
  function init(){
    var form = document.getElementById('form');
    if (!form){
      console.error('[Phenotyper] #form not found. Check index.html id.');
      return;
    }
    if (form.__phenotyperWired) return;
    form.__phenotyperWired = true;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      try { window.runPhenotyper(e); }
      catch(err){
        console.error('[Phenotyper] submit failed:', err);
        alert('Oops—something went wrong. See console for details.');
      }
    });
    console.log('[Phenotyper] submit handler wired');
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
