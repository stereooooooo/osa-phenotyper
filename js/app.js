/*  OSA Phenotyper – PALM + extras (US-English)
    WHAT'S NEW (no input/layout changes):
    • Confidence meter per phenotype (+ "Why this?" drawers)
    • CPAP readiness/adherence risk badge
    • What-if counseling (−10% weight, septoplasty done, side-sleeping)
    • Surgical pathway helper (uses CT + nasal flags; shows DISE when present)
    • Contraindication guardrails (HLG → ASV caution / LVEF check)
    • Positional therapy mini-plan
    • Richer Sleepy/Disturbed/Minimal explainer
    • First 30 days checklist (personalized)
    • Edge-case nudge when Non-supine AHI defaulted
    • Referral note snippets (Dentist / ENT / Cardiology)
    • Print handout button (patient section only)
--------------------------------------------------------------------*/

function n(v){ return isNaN(+v) ? null : +v; }
function ratio(a,b){ return (n(b) && b!==0) ? n(a)/n(b) : null; }
function yes(f,key){ return f.get(key)==='on' || f.get(key)==='Yes' || (f.getAll(key)||[]).includes('on') || (f.getAll(key)||[]).includes('Yes'); }
function exists(v){ return v!==null && v!==undefined && v!==''; }

/* simple dedupe-able recommendations */
const recSeen = new Set();
function pushRec(arr, text, tag){
  const key = (tag || text.trim().toLowerCase().slice(0,40));
  if(recSeen.has(key)) return;
  recSeen.add(key);
  arr.push(text);
}

/* confidence helper */
function confidenceFor(tag, ctx){
  const {reasons, metrics} = ctx; // metrics carries raw values
  const count = reasons.filter(Boolean).length;

  switch(tag){
    case 'High Anatomical Contribution': {
      const strong = ((metrics.bmi||0)>=35) + ((metrics.neck||0)>=17.5) + ((metrics.tons||0)>=3) + (['III','IV'].includes(metrics.mall)?1:0) + ((metrics.ahi||0)>=30);
      if(strong>=4) return 'High';
      if(strong>=2) return 'Moderate';
      return 'Low';
    }
    case 'Low Arousal Threshold': {
      const arRatio = (metrics.arInd && metrics.ahi) ? (metrics.arInd/metrics.ahi) : 0;
      if((metrics.isi||0)>=22 || arRatio>=1.8) return 'High';
      if((metrics.isi||0)>=15 || arRatio>=1.3) return 'Moderate';
      return 'Low';
    }
    case 'High Loop Gain': {
      if((metrics.csr||0)>=20 || (metrics.pahic||0)>=20) return 'High';
      if((metrics.csr||0)>=10 || (metrics.pahic||0)>=10 || metrics.cvd) return 'Moderate';
      return 'Low';
    }
    case 'Poor Muscle Responsiveness': {
      const remNrem = (metrics.remAhi && metrics.nremAhi) ? (metrics.remAhi/metrics.nremAhi) : 0;
      if((metrics.ahi||0)>=30 && remNrem>2.5) return 'High';
      if(remNrem>2) return 'Moderate';
      return 'Low';
    }
    case 'Positional OSA': {
      const pr = (metrics.sup && metrics.nons) ? (metrics.sup/metrics.nons) : 0;
      if(pr>=3 && (metrics.nons||0)<10) return 'High';
      if(pr>=2 && (metrics.nons||0)<15) return 'Moderate';
      return 'Low';
    }
    case 'REM-Predominant OSA': {
      const rr = (metrics.remAhi && metrics.nremAhi) ? (metrics.remAhi/metrics.nremAhi) : 0;
      if(rr>=3 && (metrics.nremAhi||0)<10) return 'High';
      if(rr>=2 && (metrics.nremAhi||0)<15) return 'Moderate';
      return 'Low';
    }
    case 'High Hypoxic Burden': {
      if((metrics.nadir||100)<80 || (metrics.odi||0)>=60) return 'High';
      if((metrics.nadir||100)<85 || (metrics.odi||0)>=40) return 'Moderate';
      return 'Low';
    }
    case 'Nasal-Resistance Contributor': {
      const flags = (metrics.nasalSeptum?1:0) + (metrics.nasalTurbs?1:0) + (metrics.rhinitisSev?1:0);
      if(flags>=2) return 'High';
      if(flags===1) return 'Moderate';
      return 'Low';
    }
    default: return 'Moderate';
  }
}

/* inject minimal print CSS so only patient handout prints nicely */
(function ensurePrintStyles(){
  const style = document.createElement('style');
  style.type='text/css';
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #patientSummary, #patientSummary * { visibility: visible !important; }
      #patientSummary { position: absolute; left: 0; top: 0; width: 100%; padding: 1rem; }
      .no-print { display: none !important; }
      h2, h3, h4, h5 { page-break-after: avoid; }
      ul, ol { page-break-inside: avoid; }
    }
  `;
  document.head.appendChild(style);
})();

document.getElementById('form').addEventListener('submit', e=>{
  e.preventDefault();
  recSeen.clear();
  const f = new FormData(e.target);

  const out = { phen:[], why:{}, recs:[] };
  const add = (tag, reason) => {
    if(!out.phen.includes(tag)){ out.phen.push(tag); out.why[tag] = reason.filter(Boolean); }
  };

  /* ─── INPUTS ────────────────────────────────────────────────── */
  const bmi   = n(f.get('bmi'));
  const neck  = n(f.get('neck'));
  const tons  = n(f.get('tonsils'));
  const mall  = f.get('ftp'); // Mallampati/Friedman Tongue Position field used in app

  const ahi   = n(f.get('ahi')) || n(f.get('pahi'));
  const arInd = n(f.get('arInd'));
  const isi   = n(f.get('isi'));
  const ess   = n(f.get('ess'));

  const csr   = n(f.get('csr'));                    // % Cheyne–Stokes Respiration (WatchPAT)
  const pahic = n(f.get('pahic'));                  // central pAHI (3% criterion on WatchPAT)
  const cvd   = yes(f,'cvd');                       // CVD yes/no (hypertension/CAD etc.)

  const remAhi  = n(f.get('ahiREM'))  || n(f.get('remPahi'));
  const nremAhi = n(f.get('ahiNREM')) || n(f.get('nremPahi'));

  const sup     = n(f.get('ahiSup'))   || n(f.get('supPahi'));
  let   nons    = n(f.get('ahiNonSup'))|| n(f.get('nonSupPahi'));
  const nonSupProvided = exists(n(f.get('ahiNonSup'))) || exists(n(f.get('nonSupPahi')));
  if(nons===null) nons = 1; // default when blank

  const odi   = n(f.get('odi'));
  const nadir = Math.min( n(f.get('nadir'))||99 , n(f.get('nadirPsg'))||99 );

  /* nasal signals */
  const rhinitis = (f.get('rhinitis')||'').toLowerCase(); // none/mild/moderate/severe
  const rhinitisSev = (rhinitis==='moderate' || rhinitis==='severe');
  const nasalSeptum = (f.get('septum')==='Yes') || yes(f,'ctSeptum') || yes(f,'ctDeviatedSeptum');
  const nasalTurbs  = yes(f,'ctTurbs') || yes(f,'ctTurbinateHypertrophy');

  /* pack context for confidence meters */
  const ctxBase = {
    bmi, neck, tons, mall, ahi, arInd, isi, ess, csr, pahic, cvd, remAhi, nremAhi, sup, nons, odi, nadir,
    nasalSeptum, nasalTurbs, rhinitisSev
  };

  /* ─── PALM TRAITS ───────────────────────────────────────────── */
  if([bmi>=30, neck>=17, tons>=3, mall==='III'||mall==='IV', ahi>=30].filter(Boolean).length>=3){
    add('High Anatomical Contribution',[`BMI ${bmi||'—'}`,`Neck ${neck||'—'} in`,exists(tons)?`Tonsils ${tons}`:'',mall?`Mallampati ${mall}`:'',exists(ahi)?`AHI ${ahi}`:'']);
  }
  if( isi>=15 || (arInd && ahi && (arInd/ahi)>1.3) ){
    add('Low Arousal Threshold',[`ISI ${isi||'—'}`, (arInd&&ahi)?`Arousal/AHI ${(arInd/ahi).toFixed(1)}` : '']);
  }
  if( (csr && csr>=10) || (pahic && pahic>=10) || cvd ){
    add('High Loop Gain',[ csr?`CSR ${csr}%`:'', pahic?`pAHIc ${pahic}`:'', cvd?'Cardiovascular disease present':'' ]);
  }
  if( (ahi>=30) && remAhi && nremAhi && (remAhi/nremAhi)>2 ){
    add('Poor Muscle Responsiveness',[`REM/NREM ${(remAhi/nremAhi).toFixed(1)}`, `AHI ${ahi}`]);
  }

  /* ─── ADDITIONAL PHENOTYPES ───────────────────────────────── */
  if( sup && nons && (sup/nons)>2 && nons<15 ){
    add('Positional OSA',[`Sup/Non-sup ${(sup/nons).toFixed(1)}`, `Non-sup AHI ${nons}`]);
  }
  if( remAhi && nremAhi && (remAhi/nremAhi)>2 && nremAhi<15 ){
    add('REM-Predominant OSA',[`REM/NREM ${(remAhi/nremAhi).toFixed(1)}`, `NREM AHI ${nremAhi}`]);
  }
  if( (exists(nadir) && nadir<85) || (odi && odi>=40) ){
    add('High Hypoxic Burden',[exists(nadir)?`Nadir SpO₂ ${nadir}%`:'', exists(odi)?`ODI4 ${odi}`:'']);
  }
  if( nasalSeptum || nasalTurbs || rhinitisSev ){
    add('Nasal-Resistance Contributor',[
      nasalSeptum?'Deviated septum':'',
      nasalTurbs?'Turbinate hypertrophy':'',
      rhinitisSev?`Rhinitis ${f.get('rhinitis')}`:''
    ]);
  }

  /* ─── TREATMENT MAPPING ───────────────────────────────────── */
  const recs = out.recs;
  // Map by phenotype, tag key enables dedupe against the core trio
  out.phen.forEach(p=>{
    switch(p){
      case 'High Anatomical Contribution':
        pushRec(recs,'Start CPAP/APAP (most effective for anatomical narrowing).','CPAP');
        if(bmi>=30) pushRec(recs,'Enroll in a structured weight-management program.','WEIGHT');
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
    }
  });

  /* Ensure the core trio is always present (deduped by tag) */
  pushRec(recs,'Start CPAP/APAP','CPAP');
  pushRec(recs,'Custom oral appliance (MAD)','MAD');
  pushRec(recs,'Surgical correction of correctable airway blockage','SURG');

  /* ─── SYMPTOM SUBTYPE ────────────────────────────────────── */
  let subtype='Minimally-symptomatic';
  if(ess>=15) subtype='Sleepy';
  else if(isi>=15) subtype='Disturbed-sleep';

  const groupInfo={
    'Sleepy': 'You feel very sleepy during the day. Treating OSA usually improves alertness, mood, and driving safety within weeks.',
    'Disturbed-sleep': 'Your sleep is broken or restless even if you are not very sleepy in the day. Treating the breathing problem and insomnia together works best.',
    'Minimally-symptomatic': 'You may not notice many symptoms, but repeated breathing pauses can strain the heart and brain over time.'
  };

  /* ─── Build Patient-Friendly Summary ─────────────────────── */
  const phenotypeExplain = {
    'High Anatomical Contribution':'Your airway is relatively narrow or crowded (weight, tongue/tonsils, palate shape).',
    'Low Arousal Threshold':'You wake up very easily; even small breathing changes can disrupt sleep.',
    'High Loop Gain':'Your breathing control system is extra sensitive and can “over-correct,” causing pauses.',
    'Poor Muscle Responsiveness':'Muscles that normally hold the airway open do not respond strongly during sleep.',
    'Positional OSA':'Breathing problems occur mainly when you sleep on your back.',
    'REM-Predominant OSA':'Breathing problems occur mainly in dream (REM) sleep.',
    'High Hypoxic Burden':'Your oxygen level spends a lot of time low during sleep, which can strain the heart.',
    'Nasal-Resistance Contributor':'Nasal blockage increases airflow resistance and can worsen snoring or CPAP comfort.'
  };

  /* confidence badges & "why" drawers */
  const phenList = out.phen.map(tag=>{
    const conf = confidenceFor(tag,{reasons: out.why[tag], metrics: ctxBase});
    const why  = out.why[tag].filter(Boolean).length ? `<details class="mt-1"><summary>Why this?</summary><small>${out.why[tag].filter(Boolean).join('; ')}</small></details>` : '';
    return `<li><strong>${tag}</strong> <span class="badge bg-secondary">${conf} confidence</span><br>${phenotypeExplain[tag]||''}${why}</li>`;
  }).join('');

  /* borderline-sleepy clarifier */
  const borderlineNote = (subtype==='Minimally-symptomatic' && ess>=12) ?
    `<p class="text-muted">Your Epworth score (${ess}) is near the “sleepy” range; many people feel noticeably more alert after starting therapy.</p>` : '';

  /* CPAP readiness badge */
  const hasLowAr = out.phen.includes('Low Arousal Threshold');
  const hasNasal = out.phen.includes('Nasal-Resistance Contributor');
  let readiness = 'Ready to start now';
  let readinessDetail = 'No major barriers predicted.';
  if(hasLowAr || hasNasal){
    readiness = 'Optimize comfort first';
    readinessDetail = [
      hasLowAr?'light, fragmented sleep (low arousal threshold)':'',
      hasNasal?'nasal blockage':''
    ].filter(Boolean).join(' + ') + '. Work on comfort/airflow to boost success.';
  }
  const readinessBadge = `<span class="badge ${readiness==='Ready to start now'?'bg-success':'bg-warning text-dark'}">${readiness}</span>`;

  /* 30-day checklist (personalized) */
  const checklist = [];
  if(hasNasal){
    checklist.push('Daily saline rinse; consider intranasal steroid; ENT follow-up about septoplasty/turbinate reduction.');
  }
  if(hasLowAr){
    checklist.push('Start CBT-I or brief behavioral insomnia therapy; consistent sleep/wake schedule.');
    checklist.push('Mask desensitization: wear mask while reading/TV for 15–30 min/day before bed.');
  }
  if(out.phen.includes('Positional OSA')){
    checklist.push('Trial a positional therapy device or backpack/pillow solution for 2–4 weeks.');
  }
  if(out.phen.includes('High Hypoxic Burden')){
    checklist.push('Prioritize timely start of effective therapy to protect the heart.');
  }
  if(bmi>=27){
    checklist.push('Begin weight-management plan; even ~10% weight loss can meaningfully reduce OSA severity.');
  }
  checklist.push('Avoid alcohol and sedatives near bedtime; aim for side-sleeping when possible.');
  const checklistHTML = checklist.length ? `<ul>${checklist.map(i=>`<li>${i}</li>`).join('')}</ul>` : '';

  /* What-if counseling (informational, no model change) */
  const whatIfHTML = `
    <ul>
      <li><strong>Lose 10% body weight:</strong> OSA severity often drops meaningfully; anatomical contribution may lessen.</li>
      <li><strong>Septoplasty/turbinate surgery:</strong> improves nasal airflow and CPAP/MAD comfort; rarely cures OSA alone.</li>
      <li><strong>Use a side-sleeping device:</strong> positional OSA typically improves; verify on a follow-up study.</li>
    </ul>`;

  /* Positional therapy mini-plan */
  const posPlan = out.phen.includes('Positional OSA') ? `
    <div class="mt-2">
      <strong>Positional plan:</strong>
      <ul>
        <li>Use a vibratory trainer or backpack/pillow method nightly for 2–4 weeks.</li>
        <li>Recheck response with a home sleep test or device report focusing on non-supine vs supine.</li>
      </ul>
    </div>` : '';

  /* Nasal optimization note */
  const nasalNote = out.phen.includes('Nasal-Resistance Contributor') ? `
    <p class="mt-2"><em>Nasal surgery doesn’t usually cure OSA, but it can reduce snoring, improve sleep quality,
    and make CPAP or oral appliances more comfortable.</em></p>` : '';

  /* Edge-case nudge if we defaulted non-supine */
  const posNudge = (!nonSupProvided && exists(sup)) ? `
    <div class="alert alert-info mt-2">Positional result used a default non-supine AHI of 1 because none was entered. Please confirm on a future study.</div>` : '';

  /* Patient handout HTML */
  let pHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <h2 class="h4 mb-2">Patient-Friendly Summary</h2>
      <button class="btn btn-outline-primary btn-sm no-print" id="btnPrintHandout">Print handout</button>
    </div>
    <p>You are in the <strong>${subtype}</strong> group. <br><em>${groupInfo[subtype]}</em></p>
    ${borderlineNote}
    <p><strong>CPAP readiness:</strong> ${readinessBadge} <small class="text-muted"> ${readinessDetail}</small></p>
    ${out.phen.length ? `<h5 class="mt-3">Main contributing factors</h5><ul>${phenList}</ul>` : ''}
    ${nasalNote}
    ${posPlan}
    <h5 class="mt-3">Recommended next steps</h5>
    <ul>${recs.slice(0,8).map(r=>`<li>${r}</li>`).join('')}</ul>
    <h5 class="mt-3">Your first 30 days</h5>
    ${checklistHTML}
    <h5 class="mt-3">What if…?</h5>
    ${whatIfHTML}
    ${posNudge}
  `;

  /* ─── Clinician Decision Support ──────────────────────────── */

  // confidence table for clinicians
  const confTable = out.phen.map(tag=>{
    const conf = confidenceFor(tag,{reasons: out.why[tag], metrics: ctxBase});
    return `<tr><td>${tag}</td><td>${conf}</td><td><small>${out.why[tag].filter(Boolean).join(', ')||'—'}</small></td></tr>`;
  }).join('');

  // guardrails
  const guardrails = [];
  if(out.phen.includes('High Loop Gain')){
    guardrails.push('If considering ASV, confirm LVEF > 45% (contraindicated in HFrEF ≤45%).');
  }
  if(out.phen.includes('High Hypoxic Burden')){
    guardrails.push('Prioritize timely initiation of effective therapy due to CV-risk association with hypoxic burden.');
  }

  // surgical pathway helper (based on nasal + generic anatomy; DISE text appears if present)
  const surgTargets = [];
  if(nasalSeptum || nasalTurbs) surgTargets.push('Nasal: septum/turbinates');
  // Look for DISE/VOTE fields if present (graceful fallback)
  const hasDISE = Array.from(f.keys()).some(k=>/^vote|^dise/i.test(k));
  if(hasDISE) surgTargets.push('DISE/VOTE: see entered levels/patterns');
  if(out.phen.includes('High Anatomical Contribution') && !surgTargets.length) surgTargets.push('Pharyngeal levels per exam/DISE as indicated');

  const surgHelper = surgTargets.length ? `
    <p><strong>Surgical targets (if pursuing intervention):</strong> ${surgTargets.join('; ')}.</p>` : '';

  // referral notes
  const supRatio = (sup && nons) ? (sup/nons).toFixed(1) : '—';
  const coreNums  = `AHI: ${exists(ahi)?ahi:'—'} | REM AHI: ${exists(remAhi)?remAhi:'—'} | NREM AHI: ${exists(nremAhi)?nremAhi:'—'} | Sup/Non-sup: ${supRatio} | Nadir SpO₂: ${exists(nadir)?nadir+'%':'—'}`;
  const phenStr   = out.phen.join(', ') || '—';
  const nasalStr  = out.phen.includes('Nasal-Resistance Contributor') ? 'Nasal obstruction present (septum/turbinates/rhinitis).' : '—';

  const noteDentist = `Reason for referral: mandibular advancement device (MAD) evaluation.\nSummary: ${coreNums}\nPhenotypes: ${phenStr}\nNotes: Consider REM-predominant/positional involvement if listed. Coordinate titration and follow-up HSAT/PSG.`;
  const noteENT     = `Reason for referral: nasal/airway surgery evaluation.\nSummary: ${coreNums}\nPhenotypes: ${phenStr}\nNasal: ${nasalStr}\nNotes: Septum/turbinates may improve airflow and PAP/MAD tolerance; assess palate/pharyngeal collapse per DISE if available.`;
  const noteCards   = `Reason for FYI/coordination: OSA with cardiovascular considerations.\nSummary: ${coreNums}\nPhenotypes: ${phenStr}\nNotes: If High Loop Gain persists with TECSA, consider O₂/acetazolamide; ASV only if LVEF > 45%.`;

  // follow-up prompts
  const followUps = [];
  if(hasLowAr) followUps.push('CPAP comfort review in 2–4 weeks; CBT-I progress.');
  if(out.phen.includes('Positional OSA')) followUps.push('Reassess after 2–4 weeks of positional therapy with HSAT/WatchPAT.');
  if(out.phen.includes('Nasal-Resistance Contributor')) followUps.push('Post-septoplasty/turbinate check and repeat sleep testing as needed.');
  followUps.push('Therapy effectiveness check (adherence, residual AHI/ODI, symptoms) at 4–8 weeks.');

  let cHTML = `
    <h2 class="h4">Clinician Decision Support</h2>
    <p><strong>Subtype:</strong> ${subtype} (ESS ${exists(ess)?ess:'—'}, ISI ${exists(isi)?isi:'—'})</p>
    <p><strong>Key numbers:</strong> ${coreNums}</p>
    ${out.phen.length ? `
      <div class="table-responsive">
        <table class="table table-sm align-middle">
          <thead><tr><th>Phenotype</th><th>Confidence</th><th>Triggers</th></tr></thead>
          <tbody>${confTable}</tbody>
        </table>
      </div>` : ''
    }
    <p><strong>Ranked treatment plan</strong></p>
    <ol>${recs.map(r=>`<li>${r}</li>`).join('')}</ol>
    ${guardrails.length?`<div class="alert alert-warning mt-2"><strong>Guardrails:</strong> <ul>${guardrails.map(g=>`<li>${g}</li>`).join('')}</ul></div>`:''}
    ${surgHelper}
    <h5 class="mt-3">Referral notes</h5>
    <div class="row g-2">
      <div class="col-md-4"><button class="btn btn-outline-secondary btn-sm w-100 no-print" data-copy="dentist">Copy Dentist (MAD)</button></div>
      <div class="col-md-4"><button class="btn btn-outline-secondary btn-sm w-100 no-print" data-copy="ent">Copy ENT</button></div>
      <div class="col-md-4"><button class="btn btn-outline-secondary btn-sm w-100 no-print" data-copy="cards">Copy Cardiology</button></div>
    </div>
    <textarea id="refNoteBuffer" class="form-control mt-2 no-print" rows="6" placeholder="Referral note will appear here when you click one of the buttons." readonly></textarea>
    <h5 class="mt-3">Follow-up</h5>
    <ul>${followUps.map(x=>`<li>${x}</li>`).join('')}</ul>
  `;

  /* Render */
  document.getElementById('patientSummary').innerHTML = pHTML;
  document.getElementById('clinicianReport').innerHTML = cHTML;

  /* Wire print button */
  const btnPrint = document.getElementById('btnPrintHandout');
  if(btnPrint) btnPrint.addEventListener('click', ()=> window.print());

  /* Referral note copier */
  const buffer = document.getElementById('refNoteBuffer');
  document.querySelectorAll('[data-copy]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const kind = btn.getAttribute('data-copy');
      let txt = '';
      if(kind==='dentist') txt = noteDentist;
      if(kind==='ent')     txt = noteENT;
      if(kind==='cards')   txt = noteCards;
      buffer.value = txt;
      buffer.select(); buffer.setSelectionRange(0, 99999);
      try { document.execCommand('copy'); } catch(e){}
      btn.textContent = 'Copied!';
      setTimeout(()=>btn.textContent = btn.getAttribute('data-copy')==='dentist'?'Copy Dentist (MAD)':btn.getAttribute('data-copy')==='ent'?'Copy ENT':'Copy Cardiology', 1200);
    });
  });

  /* Smooth scroll to patient section */
  window.scrollTo({ top: document.getElementById('patientSummary').offsetTop - 80, behavior:'smooth' });
});
