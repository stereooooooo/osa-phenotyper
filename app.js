// placeholder logic – reuse your existing phenotype engine
document.getElementById('phenotypeForm').addEventListener('submit', e => {
  e.preventDefault();
  // Grab values
  const form = new FormData(e.target);
  const pahi = Number(form.get('pahi')||0);
  const odi = Number(form.get('odi')||0);
  const nadir = Number(form.get('nadir')||100);
  const cvd = form.get('cvd')==='on';

  const phenotypes = [];

  if ( (nadir < 85) || (odi >= 40) ) {
    phenotypes.push('High Hypoxic Burden');
  }

  // Build patient summary
  let html = `<h2 class="h4 mb-3">Patient‑Friendly Summary</h2>`;
  html += `<p>Your data suggest: <strong>${phenotypes.join(', ') || 'No major risk phenotypes detected'}</strong>.</p>`;

  if (phenotypes.includes('High Hypoxic Burden')) {
    html += `<div class="alert alert-primary"><strong>High Hypoxic Burden:</strong> Your oxygen levels drop significantly during sleep, which increases cardiovascular risk. Starting <strong>CPAP</strong> or another effective therapy quickly is very important.</div>`;
  }

  document.getElementById('patientSummary').innerHTML = html;
  document.getElementById('patientSummary').classList.remove('d-none');
});
