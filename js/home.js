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

  async function renderReviewCard() {
    const root = document.getElementById('homeReviewCard');
    let queue = [];
    try { queue = await window.OSAWorkspace.getReviewQueue(); } catch (e) { root.innerHTML = ''; return; }
    if (!queue.length) { root.innerHTML = ''; return; }
    const rows = queue.slice(0, 3).map(p => `
      <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-id="${escapeHtml(p.patientId)}">
        <span>${escapeHtml(p.name || '')}<small class="text-muted ms-2">submitted ${escapeHtml((p.intakeReceivedAt || '').slice(0, 10))}</small></span>
        <i class="bi bi-chevron-right"></i></button>`).join('');
    root.innerHTML = `
      <div class="alert alert-info d-flex align-items-center mb-2">
        <i class="bi bi-clipboard-check me-2"></i><strong>Intakes ready to review</strong>
        <span class="badge bg-primary ms-2">${queue.length}</span>
        <button type="button" id="homeReviewAll" class="btn btn-link btn-sm ms-auto p-0">Review all <i class="bi bi-arrow-right"></i></button>
      </div>
      <div class="list-group mb-1">${rows}</div>`;
    root.querySelectorAll('.list-group-item[data-id]').forEach(b =>
      b.addEventListener('click', () => window.OSAWorkspace.openChart(b.dataset.id)));
    document.getElementById('homeReviewAll').addEventListener('click', () => window.OSAWorkspace.reviewModalShow());
  }
  function renderNewPatient() {
    const box = document.getElementById('homeNewPatient');
    box.innerHTML = `
      <h3 class="h6 mb-2"><i class="bi bi-person-plus me-1"></i>New patient</h3>
      <label class="form-label small mb-1">Patient name</label>
      <input type="text" id="homeNewName" class="form-control mb-2" placeholder="Last, First" autocomplete="off">
      <label class="form-label small mb-1">Date of birth</label>
      <input type="date" id="homeNewDob" class="form-control mb-3">
      <button type="button" id="homeCreateBtn" class="btn btn-primary w-100"><i class="bi bi-link-45deg me-1"></i>Create + intake link</button>
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
      const { patient, link } = await window.OSAWorkspace.createWithIntakeLink({ name, dob });
      result.innerHTML = `
        <div class="input-group input-group-sm mb-2"><input type="text" class="form-control" id="homeNewLink" value="${escapeHtml(link)}" readonly></div>
        <div class="d-flex gap-2">
          <button type="button" id="homeCopyDone" class="btn btn-success btn-sm flex-fill"><i class="bi bi-clipboard-check me-1"></i>Copy link &amp; done</button>
          <button type="button" id="homeOpenChart" class="btn btn-outline-secondary btn-sm flex-fill">Open chart</button>
        </div>`;
      document.getElementById('homeCopyDone').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(link); } catch (e) { document.getElementById('homeNewLink').select(); }
        window.OSAHome.render();
      });
      document.getElementById('homeOpenChart').addEventListener('click', () => window.OSAWorkspace.openChart(patient.patientId));
    } catch (err) {
      result.innerHTML = '<p class="text-danger small mb-0">Could not create the patient. Check the connection and try again.</p>';
    } finally {
      btn.disabled = false; btn.innerHTML = '<i class="bi bi-link-45deg me-1"></i>Create + intake link';
    }
  }
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
