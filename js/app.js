document.getElementById('form').addEventListener('submit',e=>{
 e.preventDefault();
 const fd=new FormData(e.target);
 const odi=parseFloat(fd.get('odi')||0);
 const nadir=parseFloat(fd.get('nadir')||fd.get('nadirPsg')||100);
 const ess=parseFloat(fd.get('ess')||0), isi=parseFloat(fd.get('isi')||0);
 const phen=[];
 if(nadir<85||odi>=40)phen.push('High Hypoxic Burden');
 let subtype='Minimally Symptomatic';
 if(ess>=15)subtype='Sleepy';
 else if(isi>=15)subtype='Disturbed‑sleep';
 let pat=`<h2 class="h4 mb-3">Patient‑Friendly Summary</h2><p>Symptom group: <strong>${subtype}</strong>.</p>`;
 if(phen.includes('High Hypoxic Burden'))pat+=`<div class="alert alert-primary"><strong>High Hypoxic Burden:</strong> Frequent oxygen drops increase cardiovascular risk. Starting effective therapy (usually CPAP) promptly is important.</div>`;
 document.getElementById('patientSummary').innerHTML=pat;
});