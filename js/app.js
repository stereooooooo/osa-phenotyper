/*  ──────────────────────────────────────────────────────────────
    OSA Phenotyper logic  •  PALM  + positional/REM/hypoxic burden
    ────────────────────────────────────────────────────────────── */

function n(v){ return isNaN(+v) ? null : +v; }
function ratio(a,b){ return (n(b) && b!==0) ? n(a)/n(b) : null; }
function yes(f,key){ return f.get(key)==='on'; }

document.getElementById('form').addEventListener('submit', e=>{
  e.preventDefault();
  const f   = new FormData(e.target);
  const res = { phen:[], why:{}, recs:[] };

  /* ─── Helper to push phenotype with reasons ─── */
  const add = (tag, reasonArr)=>{ res.phen.push(tag); res.why[tag]=reasonArr; };

  /* ──────────────────────────────────────────────
     1.  PALM phenotypes
  ────────────────────────────────────────────── */
  /* P-ANATOMY */
  const bmi  = n(f.get('bmi'));
  const neck = n(f.get('neck'));
  const tons = n(f.get('tonsils'));
  const mall = f.get('ftp');                  // I-IV
  const ahi  = n(f.get('ahi')) || n(f.get('pahi'));
  const strongAnat = (bmi>=30)+(neck>=17)+(tons>=3)+(mall==='III'||mall==='IV')+(ahi>=30);
  if(strongAnat>=3){ add('High Anatomical Contribution',
      [`BMI ${bmi||'?'}`,`Neck Circ ${neck||'?'}`,`Tonsils ${tons}`,`Mallampati ${mall}`,`AHI ${ahi}`]); }

  /* A-AROUSAL THRESHOLD (LOW) */
  const arInd = n(f.get('arInd'));
  const isi   = n(f.get('isi'));
  if( isi>=15 || (arInd && ahi && arInd/ahi>1.5) ){
      add('Low Arousal Threshold', [`ISI ${isi||'—'}`,`Arousal Idx/ AHI ${(arInd/ahi).toFixed(1)}`]);
  }

  /* L-LOOP GAIN (HIGH)  – proxy using CAI + cardiovascular disease */
  const cai = n(f.get('cai'));
  if( cai>=5 || yes(f,'cvd') ){
      add('High Loop Gain', [`CAI ${cai||'—'}`, yes(f,'cvd')?'CV disease present':'' ]);
  }

  /* M-MUSCLE RESPONSIVENESS (POOR) – severe OSA with REM/Supine dependence */
  const remAhi  = n(f.get('ahiREM'))  || n(f.get('remPahi'));
  const nremAhi = n(f.get('ahiNREM')) || n(f.get('nremPahi'));
  if( ahi>=30 && remAhi && nremAhi && remAhi/nremAhi>2 ){
      add('Poor UA Muscle Responsiveness', [`REM AHI ${(remAhi)}`,`REM/NREM ratio ${(remAhi/nremAhi).toFixed(1)}`]);
  }

  /* ──────────────────────────────────────────────
     2.  Additional phenotypes
  ────────────────────────────────────────────── */
  /* Positional */
  const sup   = n(f.get('ahiSup'))   || n(f.get('supPahi'));
  const nons  = n(f.get('ahiNonSup'));
  if( sup && nons && sup/nons>2 && nons<15 ){
      add('Positional OSA', [`Supine/Non-sup ${(sup/nons).toFixed(1)}`]);
  }

  /* REM-predominant */
  if( remAhi && nremAhi && remAhi/nremAhi>2 && nremAhi<15 ){
      add('REM-Predominant OSA', [`REM/NREM ${(remAhi/nremAhi).toFixed(1)}`]);
  }

  /* High Hypoxic Burden */
  const odi   = n(f.get('odi'));
  const nadir = Math.min( n(f.get('nadir'))||99 , n(f.get('nadirPsg'))||99 );
  if( (nadir && nadir<85) || (odi && odi>=40) ){
      add('High Hypoxic Burden', [`Nadir SpO₂ ${nadir}%`,`ODI 4% ${odi||'—'}`]);
  }

  /* Symptom cluster */
  const ess = n(f.get('ess'));
  let subtype='Minimally-symptomatic';
  if( ess>=15 )        subtype='Sleepy';
  else if( isi>=15 )   subtype='Disturbed-sleep';

  /* ──────────────────────────────────────────────
     3.  Map to recommendations
  ────────────────────────────────────────────── */
  const pushRec = r=>{ if(!res.recs.includes(r)) res.recs.push(r); };

  res.phen.forEach(p=>{
    switch(p){
      case 'High Anatomical Contribution':
          pushRec('Start CPAP/APAP (gold-standard for anatomical OSA)');
          pushRec('If CPAP intolerant: mandibular advancement device (mild-mod) or site-directed surgery/hypoglossal-nerve stimulation');
          if(bmi>=30) pushRec('Structured weight-loss programme to reduce airway crowding');
          break;
      case 'Low Arousal Threshold':
          pushRec('Optimise CPAP comfort (auto-adjust, humidification, mask fit)');
          pushRec('Consider CBT-I and cautious low-dose sedative (e.g., trazodone) under sleep-specialist guidance');
          break;
      case 'High Loop Gain':
          pushRec('Consider fixed-pressure CPAP (vs APAP) and monitor for treatment-emergent centrals');
          pushRec('If centrals persist: trial oxygen or acetazolamide; escalate to ASV **unless** LVEF ≤ 45 %');
          break;
      case 'Poor UA Muscle Responsiveness':
          pushRec('Re-emphasise CPAP adherence; if CPAP fails, assess candidacy for hypoglossal-nerve stimulation');
          break;
      case 'Positional OSA':
          pushRec('Positional therapy (vibratory trainer / backpack) as first-line or adjunct');
          break;
      case 'REM-Predominant OSA':
          pushRec('Ensure therapy (CPAP/MAD) is effective throughout REM sleep—may require higher pressure settings');
          break;
      case 'High Hypoxic Burden':
          pushRec('Urgent initiation of effective therapy (usually CPAP) to mitigate cardiovascular risk');
          break;
    }
  });

  if(!res.recs.length){ pushRec('Initiate CPAP/APAP (broadly effective first-line therapy)'); }

  /* ──────────────────────────────────────────────
     4.  Build PATIENT summary (plain language)
  ────────────────────────────────────────────── */
  let pSum = `<h2 class="h4">Patient-Friendly Summary</h2>
  <p>Your sleep-apnea pattern places you in the <strong>${subtype}</strong> group.</p>`;

  if(res.phen.length){
    pSum += '<p>The main factors contributing to your breathing interruptions are:</p><ul>';
    res.phen.forEach(p=>{
      const expl = {
        'High Anatomical Contribution':'The airway is relatively narrow / crowded.',
        'Low Arousal Threshold':'You wake up very easily, so even mild events disturb sleep.',
        'High Loop Gain':'Your breathing control system is extra sensitive and can overshoot.',
        'Poor UA Muscle Responsiveness':'Muscles that normally keep the airway open don’t respond strongly enough.',
        'Positional OSA':'Events mainly occur when you sleep on your back.',
        'REM-Predominant OSA':'Events mainly occur in dream (REM) sleep.',
        'High Hypoxic Burden':'Your oxygen level spends a lot of time low during sleep.'
      }[p];
      pSum += `<li><strong>${p}</strong> – ${expl}</li>`;
    });
    pSum+='</ul>';
  }

  pSum += '<h5 class="mt-3">Recommended next steps</h5><ul>';
  res.recs.slice(0,4).forEach(r=>pSum+=`<li>${r}</li>`);
  pSum+='</ul>';

  /* ──────────────────────────────────────────────
     5.  Build CLINICIAN report
  ────────────────────────────────────────────── */
  let cSum = `<h2 class="h4">Clinician Decision Support</h2>
  <p><strong>Subtype:</strong> ${subtype} (ESS ${ess||'—'}, ISI ${isi||'—'})</p>`;

  if(res.phen.length){
    cSum += '<p><strong>Identified phenotypes & triggers</strong></p><ul>';
    res.phen.forEach(p=> cSum+=`<li>${p} → ${res.why[p].filter(Boolean).join(', ')}</li>`);
    cSum += '</ul>';
  }

  cSum += '<p><strong>Ranked treatment recommendations</strong></p><ol>';
  res.recs.forEach(r=>cSum+=`<li>${r}</li>`);
  cSum+='</ol>';

  /* ─── Inject into page ─── */
  document.getElementById('patientSummary').innerHTML   = pSum;
  document.getElementById('clinicianReport').innerHTML  = cSum;
  window.scrollTo({top:document.getElementById('patientSummary').offsetTop-80,behavior:'smooth'});
});
