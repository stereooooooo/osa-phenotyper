/* Clinician-only home screen — new chart creation and bounded patient search. */
(function () {
  'use strict';

  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  function render() {
    const root = document.getElementById('homeView');
    if (!root) return;
    root.innerHTML = `
      <header class="precision-home-heading">
        <div class="precision-eyebrow">Capital ENT Precision Sleep</div>
        <h1>Clinical workspace</h1>
        <p>Open a patient to assess the drivers of OSA, build a treatment plan, and track response over time.</p>
      </header>
      <div class="precision-home-workspace">
        <section id="homeNewPatient" aria-labelledby="homeNewPatientTitle"></section>
        <section id="homeSearch" aria-labelledby="homeSearchTitle"></section>
      </div>`;
    renderNewPatient();
    renderSearch();
  }
  function renderNewPatient() {
    const box = document.getElementById('homeNewPatient');
    box.innerHTML = `
      <h2 class="h5 mb-1" id="homeNewPatientTitle">Start a chart</h2>
      <p class="small text-muted mb-3">Use for a new Precision Sleep evaluation.</p>
      <label class="form-label small mb-1" for="homeNewName">Patient name</label>
      <input type="text" id="homeNewName" class="form-control mb-2" placeholder="Last, First" autocomplete="off">
      <label class="form-label small mb-1" for="homeNewDob">Date of birth</label>
      <input type="date" id="homeNewDob" class="form-control mb-3">
      <button type="button" id="homeCreateBtn" class="btn btn-primary w-100"><i class="bi bi-person-plus me-1"></i>Create patient chart</button>
      <div id="homeNewResult" class="mt-2"></div>`;
    document.getElementById('homeCreateBtn').addEventListener('click', onCreate);
  }

  async function onCreate() {
    const name = document.getElementById('homeNewName').value.trim();
    const dob = document.getElementById('homeNewDob').value;
    const result = document.getElementById('homeNewResult');
    if (!name || !dob) { result.innerHTML = '<p class="text-danger small mb-0">Name and date of birth are required.</p>'; return; }
    const btn = document.getElementById('homeCreateBtn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const { patient } = await window.OSAWorkspace.createPatient({ name, dob });
      result.innerHTML = `
        <div class="alert alert-success py-2 small mb-2">Patient chart created.</div>
        <button type="button" id="homeOpenChart" class="btn btn-outline-primary btn-sm w-100">Open chart</button>`;
      document.getElementById('homeOpenChart').addEventListener('click', () => window.OSAWorkspace.openChart(patient.patientId));
    } catch (err) {
      result.innerHTML = '<p class="text-danger small mb-0">Could not create the patient. Check the connection and try again.</p>';
    } finally {
      btn.disabled = false; btn.innerHTML = '<i class="bi bi-person-plus me-1"></i>Create patient chart';
    }
  }
  const DATE_RE = /^\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*$/;
  let searchTimer = null;

  function renderSearch() {
    const box = document.getElementById('homeSearch');
    box.innerHTML = `
      <h2 class="h5 mb-1" id="homeSearchTitle">Continue care</h2>
      <p class="small text-muted mb-3">Search directly; the app never exposes a bulk patient roster.</p>
      <label class="visually-hidden" for="homeSearchInput">Search name, MRN, or date of birth</label>
      <input type="text" id="homeSearchInput" class="form-control" placeholder="Search name, MRN, or date of birth" autocomplete="off">
      <div id="homeSearchResults" class="mt-2"></div>`;
    document.getElementById('homeSearchInput').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const q = e.target.value.trim();
      searchTimer = setTimeout(() => runSearch(q), 250);
    });
  }

  async function runSearch(q) {
    const out = document.getElementById('homeSearchResults');
    if (!q) { out.innerHTML = '<p class="text-muted small mb-0">Type a name, MRN, or DOB.</p>'; return; }
    out.innerHTML = '<p class="text-muted small mb-0">Searching…</p>';
    try {
      const normalizedQuery = DATE_RE.test(q) && q.includes('/')
        ? (() => { const parts = q.split('/').map(s => s.padStart(2, '0')); return `${parts[2]}-${parts[0]}-${parts[1]}`; })()
        : q;
      const results = await OSADatabase.searchPatients(normalizedQuery, false);
      renderResults(results);
    } catch (err) {
      out.innerHTML = '<p class="text-danger small mb-0">Search failed. <a href="#" id="homeSearchRetry">Retry</a></p>';
      document.getElementById('homeSearchRetry').addEventListener('click', (ev) => { ev.preventDefault(); runSearch(q); });
    }
  }

  function renderResults(results) {
    const out = document.getElementById('homeSearchResults');
    if (!results.length) { out.innerHTML = '<p class="text-muted small mb-0">No matches.</p>'; return; }
    out.innerHTML = '';
    results.slice(0, 10).forEach(p => {
      const row = el(`<button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center w-100 text-start border rounded mb-1 px-2 py-1">
        <span><strong>${escapeHtml(p.name || '')}</strong><br><small class="text-muted">DOB ${escapeHtml(p.dob || '—')}${p.mrn ? ' · MRN ' + escapeHtml(p.mrn) : ''}</small></span>
        <i class="bi bi-chevron-right"></i></button>`);
      row.addEventListener('click', () => window.OSAWorkspace.openChart(p.patientId));
      out.appendChild(row);
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function init() { render(); }
  if (window.OSAWorkspace) init();
  else document.addEventListener('osa:workspace-ready', init, { once: true });

  window.OSAHome = { render };
})();
