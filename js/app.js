
/*  OSA Phenotyper logic  •  PALM + positional/REM/hypoxic burden
    US‑English wording, CSR & pAHIc inputs supported.
----------------------------------------------------------------*/

function n(v){ return isNaN(+v) ? null : +v; }
function ratio(a,b){ return (n(b) && b!==0) ? n(a)/n(b) : null; }
function yes(f,key){ return f.get(key)==='on'; }

document.getElementById('form').addEventListener('submit', e=>{
  e.preventDefault();
  const f   = new FormData(e.target);
  const res = { phen:[], why:{}, recs:[] };

  const add = (tag, reasonArr)=>{ res.phen.push(tag); res.why[tag]=reasonArr.filter(Boolean); };

  /* ── PALM ─────────────────────────────── */
  const bmi  = n(f.get('bmi'));
  const neck = n(f.get('neck'));
  const tons = n(f.get('tonsils'));
  const mall = f.get('ftp');
  const ahi  = n(f.get('ahi')) || n(f.get('pahi'));

  if([bmi>=30, neck>=17, tons>=3, mall==='III'||mall==='IV', ahi>=30].filter(Boolean).length>=3){
     add('High Anatomical Contribution',[`BMI ${bmi}`,`Neck ${neck} in`,`Tonsils ${tons}`,`Mallampati ${mall}`,`AHI ${ahi}`]);
  }

  const arInd = n(f.get('arInd'));
  const isi   = n(f.get('isi'));
  if( isi>=15 || (arInd && ahi && arInd/ahi>1.5) ){
     add('Low Arousal Threshold',[`ISI ${isi}`,`Arousal/ AHI ${(arInd/ahi).toFixed(1)}`]);
  }

  const csr   = n(f.get('csr'));
  const pahic = n(f.get('pahic'));
  if( (csr && csr>=10) || (pahic && pahic>=10) || yes(f,'cvd') ){
     add('High Loop Gain',[csr?`CSR ${csr}%`:'', pahic?`pAHIc ${pahic}`:'', yes(f,'cvd')?'CVD present':'']);
  }

  const remAhi  = n(f.get('ahiREM'))  || n(f.get('remPahi'));
  const nremAhi = n(f.get('ahiNREM')) || n(f.get('nremPahi'));
  if( ahi>=30 && remAhi && nremAhi && remAhi/nremAhi>2 ){
     add('Poor Muscle Responsiveness',[`REM/NREM ratio ${(remAhi/nremAhi).toFixed(1)}`]);
  }

  /* ── additional ───────────────────────── */
  const sup = n(f.get('ahiSup')) || n(f.get('supPahi'));
  const nons= n(f.get('ahiNonSup'));
  if( sup && nons && sup/nons>2 && nons<15 ){
     add('Positional OSA',[`Supine/Non-sup ${(sup/nons).toFixed(1)}`]);
  }

  if( remAhi && nremAhi && remAhi/nremAhi>2 && nremAhi<15 ){
     add('REM-Predominant OSA',[`REM/NREM ${(remAhi/nremAhi).toFixed(1)}`]);
  }

  const odi   = n(f.get('odi'));
  const nadir = Math.min( n(f.get('nadir'))||99 , n(f.get('nadirPsg'))||99 );
  if( (nadir && nadir<85) || (odi && odi>=40) ){
     add('High Hypoxic Burden',[`Nadir SpO₂ ${nadir}%`,`ODI4 ${odi}`]);
  }

  /* ── symptom cluster ───────────────────── */
  const ess = n(f.get('ess'));
  let subtype='Minimally‑symptomatic';
  if( ess>=15 ) subtype='Sleepy';
  else if( isi>=15 ) subtype='Disturbed‑sleep';

  /* ── recommendations map ──────────────── */
  const pushRec=r=>{ if(!res.recs.includes(r)) res.recs.push(r); };

  res.phen.forEach(p=>{
    switch(p){
      case 'High Anatomical Contribution':
        pushRec('Start CPAP/APAP (most effective for anatomical causes).');
        if(bmi>=30) pushRec('Enroll in a structured weight‑loss program.');
        pushRec('If CPAP fails: consider mandibular‑advancement device or site‑directed surgery / Inspire®.');
        break;
      case 'Low Arousal Threshold':
        pushRec('Optimize CPAP comfort (humidification, auto‑ramp, mask fit).');
        pushRec('Add CBT‑I; low‑dose sedative (e.g., trazodone) only under sleep‑specialist care.');
        break;
      case 'High Loop Gain':
        pushRec('Use fixed‑pressure CPAP and monitor for treatment‑emergent central apneas.');
        pushRec('If centrals persist: consider nocturnal O₂, acetazolamide, or ASV (contraindicated if LVEF ≤ 45 %).');
        break;
      case 'Poor Muscle Responsiveness':
        pushRec('Ensure adequate CPAP titration; evaluate for hypoglossal‑nerve stimulation if CPAP fails.');
        break;
      case 'Positional OSA':
        pushRec('Begin positional therapy (vibratory trainer / back‑pack pillow).');
        break;
      case 'REM-Predominant OSA':
        pushRec('Verify therapy is effective during REM; CPAP pressure may need to be higher in REM.');
        break;
      case 'High Hypoxic Burden':
        pushRec('Initiate effective therapy promptly to lower cardiovascular risk.');
        break;
    }
  });
  if(!res.recs.length) pushRec('Initiate CPAP/APAP (first‑line therapy for most patients).');

  /* ── patient summary ───────────────────── */
  const groupInfo={
    'Sleepy':'People in this group feel very tired during the day. Effective treatment usually improves alertness and driving safety.',
    'Disturbed‑sleep':'Your sleep is broken or restless even if you are not very sleepy in the daytime.',
    'Minimally‑symptomatic':'You do not notice many symptoms, but untreated breathing pauses can still affect long‑term health.'
  };

  let pHTML=`<h2 class="h4">Patient‑Friendly Summary</h2>
  <p>You are in the <strong>${subtype}</strong> group.<br><em>${groupInfo[subtype]}</em></p>`;

  if(res.phen.length){
    pHTML+='<h5>Main contributing factors</h5><ul>';
    const expl={
      'High Anatomical Contribution':'Your airway is relatively narrow or crowded.',
      'Low Arousal Threshold':'You wake up very easily; even small breathing disturbances can fragment sleep.',
      'High Loop Gain':'Your breathing control system is extra sensitive and can “over‑correct,” causing pauses.',
      'Poor Muscle Responsiveness':'Muscles that normally hold the airway open during sleep do not respond strongly.',
      'Positional OSA':'Problems arise mainly when you sleep on your back.',
      'REM-Predominant OSA':'Problems arise mainly during dream (REM) sleep.',
      'High Hypoxic Burden':'Your oxygen level spends a lot of time low during sleep, which can strain the heart.'
    };
    res.phen.forEach(p=>pHTML+=`<li><strong>${p}.</strong> ${expl[p]}</li>`);
    pHTML+='</ul>';
  }

  pHTML+='<h5 class="mt-3">Recommended next steps</h5><ul>';
  res.recs.slice(0,5).forEach(r=>pHTML+=`<li>${r}</li>`);
  pHTML+='</ul>';

  /* ── clinician report ───────────────────── */
  let cHTML=`<h2 class="h4">Clinician Decision Support</h2>
  <p><strong>Subtype:</strong> ${subtype} (ESS ${ess||'—'}, ISI ${isi||'—'})</p>`;

  if(res.phen.length){
    cHTML+='<p><strong>Phenotypes & triggers</strong></p><ul>';
    res.phen.forEach(p=>cHTML+=`<li>${p}: ${res.why[p].join(', ')}</li>`);
    cHTML+='</ul>';
  }

  cHTML+='<p><strong>Ranked treatment plan</strong></p><ol>';
  res.recs.forEach(r=>cHTML+=`<li>${r}</li>`);
  cHTML+='</ol>';

  document.getElementById('patientSummary').innerHTML=pHTML;
  document.getElementById('clinicianReport').innerHTML=cHTML;
  window.scrollTo({top:document.getElementById('patientSummary').offsetTop-80,behavior:'smooth'});
});
