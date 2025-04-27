
// -------- Enhanced summary engine --------
function num(v){return parseFloat(v)||0;}
function yes(form,name){return form.get(name)==='on';}

document.getElementById('form').addEventListener('submit',e=>{
 e.preventDefault();
 const f=new FormData(e.target);

 /* --- Phenotype detection --- */
 const phen=[], why={};
 const nadir=Math.min(num(f.get('nadir')),num(f.get('nadirPsg')));
 const odi=num(f.get('odi'));
 if( (nadir && nadir<85) || (odi && odi>=40) ){
     phen.push('High Hypoxic Burden');
     why['High Hypoxic Burden']=[`Min SpO₂ ${nadir||'?'}%`,`ODI 4% ${odi||'?'}`];
 }

 const ess=num(f.get('ess')), isi=num(f.get('isi'));
 let subtype='Minimally Symptomatic';
 if(ess>=15){ subtype='Sleepy'; }
 else if(isi>=15){ subtype='Disturbed‑sleep'; }

 /* --- Recommendations --- */
 const recs=[];
 if(phen.includes('High Hypoxic Burden')){
   recs.push('Start CPAP or another effective therapy as soon as possible to reduce oxygen drops.');
   if(yes(f,'cvd')) recs.push('Optimise cardiovascular risk factors (blood pressure, lipids, weight) in parallel.');
 }
 if(!recs.length) recs.push('CPAP/APAP remains the most effective first‑line treatment for most patients.');

 /* ---------- Patient‑friendly summary ---------- */
 let pHTML=`<h2 class="h4 mb-3">Patient‑Friendly Summary</h2>`;
 pHTML+=`<p>Your answers place you in the <strong>${subtype}</strong> group of sleep‑apnea patients.</p>`;
 if(subtype==='Sleepy') pHTML+='<p>Treating sleep‑apnea often improves daytime alertness and driving safety.</p>';
 if(subtype==='Disturbed‑sleep') pHTML+='<p>Combining airway therapy with insomnia coaching (CBT‑I) can help you sleep through the night.</p>';

 if(phen.length){
   pHTML+='<h5>Key contributing factors</h5>';
   phen.forEach(p=>{
     let expl=(p==='High Hypoxic Burden')?'Your oxygen level spends extra time low at night, which can strain the heart and blood vessels.':'';
     pHTML+=`<div class="alert alert-primary"><strong>${p}:</strong> ${expl}</div>`;
   });
 }

 pHTML+='<h5 class="mt-3">Recommended next steps</h5><ul>';
 recs.forEach(r=>pHTML+=`<li>${r}</li>`);
 pHTML+='</ul>';

 document.getElementById('patientSummary').innerHTML=pHTML;

 /* ---------- Clinician report ---------- */
 let cHTML=`<h2 class="h4">Clinician Decision Support</h2>`;
 cHTML+=`<p><strong>Symptom subtype:</strong> ${subtype} (ESS ${ess||'—'}, ISI ${isi||'—'})</p>`;
 if(phen.length){
   cHTML+='<p><strong>Phenotype triggers</strong></p><ul>';
   phen.forEach(p=>cHTML+=`<li>${p} – ${why[p].join(', ')}</li>`);
   cHTML+='</ul>';
 }
 cHTML+='<p><strong>Recommendations</strong></p><ol>';
 recs.forEach(r=>cHTML+=`<li>${r}</li>`);
 cHTML+='</ol>';

 document.getElementById('clinicianReport').innerHTML=cHTML;

 window.scrollTo({top:document.getElementById('patientSummary').offsetTop-80,behavior:'smooth'});
});
