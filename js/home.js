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
  function renderSearch() { document.getElementById('homeSearch').textContent = 'Find a patient'; }

  function init() { render(); }
  if (window.OSAWorkspace) init();
  else document.addEventListener('osa:workspace-ready', init, { once: true });

  window.OSAHome = { render };
})();
