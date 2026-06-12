/* Front-desk home screen — waits for the workspace contract, then renders + wires
   the review queue, new-patient, and search panels. Orchestrates existing functions only. */
(function () {
  'use strict';

  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  function render() {
    const root = document.getElementById('homeView');
    if (!root) return;
    root.innerHTML = `
      <div id="homeReviewCard"></div>
      <div class="row g-3 mt-1">
        <div class="col-md-6"><div class="card h-100"><div class="card-body" id="homeNewPatient"></div></div></div>
        <div class="col-md-6"><div class="card h-100"><div class="card-body" id="homeSearch"></div></div></div>
      </div>`;
    renderReviewCard();
    renderNewPatient();
    renderSearch();
  }

  // Stubs replaced in later tasks
  function renderReviewCard() {}
  function renderNewPatient() { document.getElementById('homeNewPatient').textContent = 'New patient'; }
  const DATE_RE = /^\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*$/;
  let searchTimer = null;

  function renderSearch() {
    const box = document.getElementById('homeSearch');
    box.innerHTML = `
      <h3 class="h6 mb-2"><i class="bi bi-search me-1"></i>Find a patient</h3>
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
      let results;
      if (DATE_RE.test(q)) {
        const all = await OSADatabase.listPatients(false);
        const norm = q.includes('/') ? q.split('/').map(s => s.padStart(2, '0')) : null;
        const iso = norm ? `${norm[2]}-${norm[0]}-${norm[1]}` : q;
        results = all.filter(p => (p.dob || '') === iso);
      } else {
        results = await OSADatabase.searchPatients(q, false);
      }
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
    results.slice(0, 12).forEach(p => {
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
