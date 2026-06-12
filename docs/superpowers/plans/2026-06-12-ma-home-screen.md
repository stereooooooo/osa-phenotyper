# Front-desk Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a streamlined home screen that is the app's front door — create a patient + intake link, search/open an established patient, and see the intake review queue — without disturbing the existing phenotyping chart.

**Architecture:** Two switchable views inside the existing single-page app (`#homeView` / `#chartView`), toggled by a `showView()` helper. The existing inline-IIFE logic is exposed through a `window.OSAWorkspace` contract that fires an `osa:workspace-ready` event; a new isolated `js/home.js` waits for that event and orchestrates existing `db.js` + workspace functions. No new backend endpoints; no router.

**Tech Stack:** Vanilla JS, Bootstrap 5, no build step. Existing modules: `js/db.js` (patient CRUD + tokens), the `index.html` inline `<script>` IIFE (workspace functions), `js/auth.js` (Cognito).

**Spec:** `docs/superpowers/specs/2026-06-12-ma-home-screen-design.md`

---

## Verification model (read first)

This codebase has **no JS unit-test framework**. UI behavior is verified with the preview server
(`mcp__Claude_Preview__preview_start` "osa-phenotyper" → `preview_eval` DOM assertions), syntax with
`node --check` / `npx eslint js`, and engine regressions with the headless golden master
(`bash tests/run-headless-suite.sh`). Each task below uses those mechanisms in place of unit tests.
The engine is untouched, but several tasks restructure `index.html`, so the golden master is the
regression guard (it submits the real form and reads `#clinicianReport`, so a broken form/IDs will fail it).

## Prerequisites (must be true before this feature is usable end-to-end)

- **Empty-MRN fix merged to `main` + deployed.** Branch `fix/empty-mrn-gsi-key` (commit `ef87c3c`,
  already deployed to staging) makes `createPatient` omit a blank `mrn`. Without it, the home screen's
  Create button hits a DynamoDB `ValidationException` (500). Merge + deploy it first, or test Task 5
  only against the staging backend that already has it. This plan does not re-implement that fix.
- Work on branch `feat/ma-home-screen` (already created).

## File structure

| File | Change | Responsibility |
|---|---|---|
| `index.html` | Modify | Wrap chart content in `#chartView`; add `#homeView` markup; keep modals as siblings; add `showView()` + `window.OSAWorkspace` + `osa:workspace-ready`; make `loadPatient` return a boolean; extract `generateIntakeLink()`; route auth/local-mode entry to a view; add `home.js` to script order; add a **Home** button. |
| `js/home.js` | Create | Isolated home-screen module: waits for `osa:workspace-ready`, renders + wires the review card, new-patient panel, and search panel via `OSAWorkspace` + `OSADatabase`. |
| `css/styles.css` | Modify | Home-screen layout styles (`.osa-home-*`). |

---

## Task 1: View scaffolding — `#homeView` / `#chartView` / `showView()`

**Files:**
- Modify: `index.html` (the `#appContainer` body)

> Verified DOM (review): inside `#appContainer` (opens `index.html:87`), `<main class="container my-4">`
> opens `159`, `<form id="form">` `160`, `</form>` `744`, `</main>` `754`. `#patientListModal` (`109`) is a
> sibling of `<main>`; but `#reviewDashboardModal` (`205`), `#intakeLinkModal` (`308`), `#patientPortalModal`
> (`358`), and `#patientIdBar` (`277`) sit **inside** the form. Post-form chart blocks `#patientSummary` /
> `#patientReportTrigger` / `#clinicianReport` are at ~745–753, inside `<main>`.

- [ ] **Step 1: Move the three form-internal modals out, then wrap the chart in `#chartView`.**
  (a) Cut `#reviewDashboardModal` (≈205–307), `#intakeLinkModal` (≈308–356), and `#patientPortalModal`
  (≈358–406) and paste them between the runtime banner (`106`) and `<main>` (`159`), next to the
  already-sibling `#patientListModal` — they can't stay inside the form once it's wrapped. Leave
  `#patientIdBar` (`277`) in place (it's chart content). (b) Wrap the **entire `<main>` interior** as
  `#chartView`: insert `<div id="chartView">` right after `<main class="container my-4">` (`159`) and
  `</div>` right before `</main>` (`754`). This includes the post-form `#patientSummary`/
  `#patientReportTrigger`/`#clinicianReport`, so the toggle hides all chart content — wrapping only the
  `<form>` would leave `#clinicianReport` visible on home.

- [ ] **Step 2: Add the empty `#homeView` as a sibling of `<main>`,** between the runtime banner (`106`)
  and the moved modals:

```html
<div id="homeView" class="d-none container py-4" style="max-width: 880px;"></div>
```

- [ ] **Step 3: Add `showView()` inside the inline `<script>` IIFE** (near `showApp`, around `index.html:1404`):

```javascript
function showView(view) {
  document.getElementById('homeView').classList.toggle('d-none', view !== 'home');
  document.getElementById('chartView').classList.toggle('d-none', view !== 'chart');
}
```

- [ ] **Step 4: Verify syntax + golden master (form still intact inside the wrapper).**

Run: `node --check js/app.js && npx eslint js && bash tests/run-headless-suite.sh`
Expected: eslint clean; `Headless suite passed: 310 assertions`.

- [ ] **Step 5: Verify the toggle in the browser.** `showView` is IIFE-scoped (not global) and the contract
  isn't exposed until Task 2, so assert the `d-none` toggle directly rather than calling `showView`:

Run: `mcp__Claude_Preview__preview_start` "osa-phenotyper", then `preview_eval`:
```javascript
(() => { const home = document.getElementById('homeView'), chart = document.getElementById('chartView'); home.classList.remove('d-none'); chart.classList.add('d-none'); const r = { homeShown: !home.classList.contains('d-none'), chartHidden: chart.classList.contains('d-none') }; home.classList.add('d-none'); chart.classList.remove('d-none'); return r; })()
```
Expected: `{ homeShown: true, chartHidden: true }`.

- [ ] **Step 6: Commit.**
```bash
git add index.html
git commit -m "feat(home): scaffold homeView/chartView + showView()"
```

---

## Task 2: `loadPatient` returns success; `OSAWorkspace` contract + ready event

**Files:**
- Modify: `index.html` inline `<script>` (`loadPatient` at `index.html:1887`; new contract near end of IIFE)

- [ ] **Step 1: Make `loadPatient` report success/failure.** It currently `try { … } catch (err) { … }`
  and returns nothing. Add `return true;` as the last line of the `try` block and `return false;` as the
  last line of the `catch` block. Do not change existing behavior otherwise.

- [ ] **Step 2: Extract `generateIntakeLink(patientId)` from the `#btnGenerateIntakeLink` handler**
  (`index.html:2541-2549` — NOT `#btnIntakeLink` at `2527`, which only opens the modal). That handler calls
  `OSADatabase.createIntakeToken(patientId)` and builds `${intakeBaseUrl}?t=${result.token}` using the
  already-computed `intakeBaseUrl` (`index.html:2490`). Move that into a helper and have the handler call it:

```javascript
async function generateIntakeLink(patientId) {
  const result = await OSADatabase.createIntakeToken(patientId);
  return { link: `${intakeBaseUrl}?t=${encodeURIComponent(result.token)}`, token: result.token, expiresAt: result.expiresAt };
}
```
Use the **`t`** query param and `intakeBaseUrl` — `intake.html` reads `params.get('t')` (`intake.html:459`)
and the existing handler builds `?t=` (`index.html:2549`); `?token=` would silently produce dead links.
Returning `{ link, token, expiresAt }` lets the existing modal keep showing expiry.

- [ ] **Step 3: Add the `OSAWorkspace` contract + ready event at the very end of the inline IIFE**
  (after all functions, incl. `loadReviewDashboard`, `getReviewQueuePatients`, `showView`, `generateIntakeLink` are defined):

```javascript
window.OSAWorkspace = {
  showView,
  async openChart(patientId) {
    const ok = await loadPatient(patientId);
    if (ok) showView('chart');
    return ok;
  },
  async createWithIntakeLink({ name, dob }) {
    const patient = await OSADatabase.createPatient({ name, dob, status: 'Initial Eval', milestones: ['Initial Eval'], formData: {} });
    const { link } = await generateIntakeLink(patient.patientId);   // generateIntakeLink now returns { link, token, expiresAt }
    return { patient, link };
  },
  async getReviewQueue() {
    const patients = await OSADatabase.listPatients(false);
    return patients
      .filter(p => p.intakeStatus === 'review-needed' || p.intakeStatus === 'received')
      .sort((a, b) => (b.intakeReceivedAt || '').localeCompare(a.intakeReceivedAt || ''));
  },
  reviewModalShow() { reviewDashboardModal.show(); loadReviewDashboard(); },
};
document.dispatchEvent(new CustomEvent('osa:workspace-ready'));
```

- [ ] **Step 4: Verify syntax + golden master.**
Run: `node --check js/app.js && npx eslint js && bash tests/run-headless-suite.sh`
Expected: eslint clean; 310 assertions pass.

- [ ] **Step 5: Verify the contract exists after load (preview_eval).**
```javascript
(() => ({ ws: typeof window.OSAWorkspace, fns: window.OSAWorkspace && Object.keys(window.OSAWorkspace).sort() }))()
```
Expected: `{ ws: "object", fns: ["createWithIntakeLink","getReviewQueue","openChart","reviewModalShow","showView"] }`.

- [ ] **Step 6: Commit.**
```bash
git add index.html
git commit -m "feat(home): OSAWorkspace contract + ready event; loadPatient returns success"
```

---

## Task 3: `js/home.js` skeleton — wait for ready, render three panels

**Files:**
- Create: `js/home.js`
- Modify: `index.html` (script load order)

- [ ] **Step 1: Add `home.js` to the script order** in `index.html` immediately after `js/app.js`
  (`index.html:994`): `<script src="js/home.js"></script>`.

- [ ] **Step 2: Create `js/home.js`** with the ready-gate and a render that injects the three panel shells:

```javascript
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
    renderReviewCard();   // Task 6
    renderNewPatient();   // Task 5
    renderSearch();       // Task 4
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
```

- [ ] **Step 3: Verify lint + that home.js renders after ready.**
Run: `npx eslint js`
Then `preview_eval` (force the home view via class toggle — `showView` isn't global — then re-render): `(() => { document.getElementById('homeView').classList.remove('d-none'); window.OSAHome.render(); return { hasSearch: !!document.getElementById('homeSearch'), hasNew: !!document.getElementById('homeNewPatient') }; })()`
Expected: eslint clean; `{ hasSearch: true, hasNew: true }`.

- [ ] **Step 4: Commit.**
```bash
git add js/home.js index.html
git commit -m "feat(home): js/home.js skeleton gated on osa:workspace-ready"
```

---

## Task 4: Find-a-patient panel (name/MRN + DOB date fallback)

**Files:**
- Modify: `js/home.js` (`renderSearch`)

- [ ] **Step 1: Replace `renderSearch()`** with the search box + debounced query routing:

```javascript
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
        const norm = q.includes('/') ? q.split('/').map(s => s.padStart(2, '0')) : null; // MM/DD/YYYY -> compare to ISO
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
```

- [ ] **Step 2: Verify lint + search behaviour against staging (preview, signed in).**
Run: `npx eslint js`. Then in the signed-in preview, `preview_fill` `#homeSearchInput` with a known last name and `preview_snapshot` the results; click a row and confirm `showView` switched to chart (`preview_eval`: `document.getElementById('chartView').classList.contains('d-none')` → `false`). Also type a DOB as `MM/DD/YYYY` for a known patient and confirm they appear.
Expected: eslint clean; name/MRN and DOB-by-date both return the right patient; clicking opens the chart.

- [ ] **Step 3: Commit.**
```bash
git add js/home.js
git commit -m "feat(home): search panel (name/MRN via API, DOB via client-side date filter)"
```

---

## Task 5: New-patient panel (create + intake link, offer copy/open)

**Files:**
- Modify: `js/home.js` (`renderNewPatient`)

> Requires the empty-MRN prerequisite deployed (see Prerequisites). Until then this panel 500s on Create.

- [ ] **Step 1: Replace `renderNewPatient()`** with the form + the create/offer-both flow:

```javascript
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
```

- [ ] **Step 2: Verify lint + the full create flow (preview, signed in, prerequisite deployed).**
Run: `npx eslint js`. Then in the signed-in preview: fill name + DOB, click Create, confirm a link appears; click **Copy link & done** and confirm the panel resets (`#homeNewName` empty) and you're still on home; repeat and click **Open chart** and confirm `chartView` is shown with that patient loaded.
Expected: eslint clean; link generated; copy-done resets + stays home; open-chart switches to the chart.

- [ ] **Step 3: Commit.**
```bash
git add js/home.js
git commit -m "feat(home): new-patient panel — create + intake link, copy/open"
```

---

## Task 6: Review-queue card (submitted/actionable only)

**Files:**
- Modify: `js/home.js` (`renderReviewCard`)

- [ ] **Step 1: Replace `renderReviewCard()`** to fetch via the contract (already filtered to
  `review-needed` + `received`) and render count + top 3 + Review all:

```javascript
  async function renderReviewCard() {
    const root = document.getElementById('homeReviewCard');
    let queue = [];
    try { queue = await window.OSAWorkspace.getReviewQueue(); } catch (e) { root.innerHTML = ''; return; }
    if (!queue.length) { root.innerHTML = ''; return; } // hide when empty
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
```

> `reviewModalShow` is defined on the `OSAWorkspace` contract in Task 2 (it wraps the inline-IIFE
> `reviewDashboardModal.show()` + `loadReviewDashboard()`), so the card calls it through the contract —
> no bare inline names leak into `home.js`.

- [ ] **Step 2: Verify the card shows submitted-only + Review all opens the dashboard while home is visible.**
Run: `npx eslint js`. In the signed-in preview with at least one submitted intake: confirm the card shows the count and rows, that a `pending`-only patient does NOT appear, and that clicking **Review all** opens `#reviewDashboardModal` while `#homeView` is still visible (confirms the modal isn't trapped in a hidden `#chartView`).
Expected: eslint clean; submitted-only rows; Review all opens the dashboard from home.

- [ ] **Step 3: Commit.**
```bash
git add js/home.js index.html
git commit -m "feat(home): review-queue card (submitted/actionable only) + Review all"
```

---

## Task 7: Entry routing, Home button, retire New-Patient-as-entry, local mode

**Files:**
- Modify: `index.html` (auth/local-mode entry, nav header)

- [ ] **Step 1: Route the authed entry to home.** In `showApp()` (`index.html:1404`), after
  `appContainer.classList.remove('d-none')`, add `showView('home'); if (window.OSAHome) window.OSAHome.render();`.

- [ ] **Step 2: Local/unconfigured mode goes to the chart, and the Home button is hidden.** The
  `if (!isConfigured)` branch (`index.html:1333`) `return`s early — before `OSAWorkspace` is defined,
  before `osa:workspace-ready` is dispatched, and before nav wiring. So after it un-hides `appContainer`,
  add `showView('chart');` **and** `document.getElementById('btnHome').style.display = 'none';` — otherwise
  the Home button (added in Step 3) renders but is dead (home.js never initializes in local mode).
  `showView` is valid here (same IIFE scope; only the page-global `preview_eval` snippets can't call it).

- [ ] **Step 3: Add a Home button to the nav header** (next to `#btnReviewDashboard`, `index.html:97`):
```html
<button class="btn btn-sm osa-btn-outline-light no-print" id="btnHome"><i class="bi bi-house"></i> Home</button>
```
and wire it in the IIFE: `document.getElementById('btnHome').addEventListener('click', () => { showView('home'); if (window.OSAHome) window.OSAHome.render(); });`

- [ ] **Step 4: Keep `#btnClearForm` as the chart-level reset, relabel for clarity.** Change its text from
  `New Patient` to `New / clear` (`index.html:99`). Its existing reset handler (`index.html:1045`) is unchanged.

- [ ] **Step 5: Verify routing + golden master.**
Run: `node --check js/app.js && npx eslint js && bash tests/run-headless-suite.sh`. Then preview (signed in): confirm login lands on home; the Home button returns to home from a chart and the review count refreshes; `#btnClearForm` still resets the chart.
Expected: 310 assertions pass; login→home; Home round-trip works.

- [ ] **Step 6: Commit.**
```bash
git add index.html
git commit -m "feat(home): route auth entry to home, Home button, local-mode→chart, relabel reset"
```

---

## Task 8: Home styles + final regression pass

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Add home layout styles** (match the navy/maroon brand; keep it minimal). Append to `css/styles.css`:
```css
#homeView .card { border-color: rgba(0,0,0,.08); }
#homeView h3 { color: var(--osa-navy, #1e2f4d); }
#homeReviewCard .list-group-item { cursor: pointer; }
```
(Use existing CSS variables/classes where the app already defines them; do not introduce a new palette.)

- [ ] **Step 2: Full manual walk-through** (spec Testing section, signed in, prerequisite deployed):
  login→home; create→link→(copy-done resets & stays home | open-chart opens); search name/MRN/DOB-by-date→open;
  review card submitted-only; Review all opens dashboard from home; failed load stays on home; Home round-trip;
  local mode→chart; existing form/save/intake/portal still work; `New / clear` resets.

- [ ] **Step 3: Final regression.**
Run: `node --check js/app.js && npx eslint js && bash tests/run-headless-suite.sh`
Expected: eslint clean; 310 assertions pass.

- [ ] **Step 4: Commit.**
```bash
git add css/styles.css
git commit -m "style(home): front-desk home screen styles"
```

---

## Self-review notes

- **Spec coverage:** review card (T6), new patient + offer-both (T5), search name/MRN/DOB-fallback (T4),
  two views + showView (T1), OSAWorkspace contract + ready event + openChart-returns-success (T2), modals
  stay siblings (T1 step 1), local-mode skip + Home button + retire-as-entry + keep reset (T7), MRN
  prerequisite (Prerequisites). All covered.
- **Type/name consistency:** `OSAWorkspace.{showView, openChart, createWithIntakeLink, getReviewQueue,
  reviewModalShow}`; `OSAHome.render`; `#homeView`/`#chartView`; panel ids `homeReviewCard` /
  `homeNewPatient` / `homeSearch`. Used consistently across tasks. (T6 step 1 note instructs adding
  `reviewModalShow` to the T2 contract — apply that when executing T2 so the names match.)
- **No automated UI tests** is intentional (codebase reality); preview + eslint + golden master are the gates.
