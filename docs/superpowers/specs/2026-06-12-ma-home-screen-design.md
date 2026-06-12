# Front-desk Home Screen — Design Spec

**Date:** 2026-06-12
**Status:** Approved (design); pending implementation plan
**Branch:** `feat/ma-home-screen`

## Problem

On login, every user lands directly on the ~2,400-line phenotyping form. For the
front-desk / MA workflow — register a new patient and send them the intake
questionnaire, or look up an established patient — this is heavy and unfocused.
The two things staff do most at check-in are buried behind modal buttons.

## Goal

A simple **home screen** that is the app's front door for everyone, offering exactly
two primary actions plus a safety-net queue:

1. **Create a new patient** (name + DOB) and generate the intake link.
2. **Find an established patient** and open their chart.
3. **See intakes ready to review** (patients who submitted their questionnaire).

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Audience | **Everyone** lands here on login; it becomes the app's home. No roles. |
| Layout | **Balanced** — review-queue banner on top, then two equal action panels. |
| New-patient outcome | **Offer both** — after Create, show *Copy link & done* and *Open chart*. |
| New-patient save timing | **Save immediately on Create** (matches today's `createPatient`). |
| Search | **One box** (name / MRN / DOB). Name/MRN via `searchPatients`; DOB via a client-side `listPatients` + date filter (single-clinic scale, no backend change). Click row → open chart. |
| Review queue | **Surface it** — count + most-recent few + *Review all*. |

## Non-goals (out of scope)

- No roles/permissions (the app only has `osa-admin` / `osa-clinician`; the home screen is identical for all).
- No changes to the phenotyping form/chart itself, or to `intake.html`.
- No separate page or client-side router — this stays a single-page app.
- No new backend endpoints — reuse existing `db.js` methods.

## Prerequisites / dependencies

- **Empty-MRN fix must land first.** The home screen's primary action creates a patient with no
  MRN. On `main` today, `createPatient` still writes `mrn: ''`, which DynamoDB rejects (the
  `mrn-index` GSI key can't be empty → `ValidationException` / HTTP 500). The fix is on branch
  `fix/empty-mrn-gsi-key` (deployed to staging, PR pending) and **must be merged to `main` and
  deployed** before this feature ships, or the home's Create button fails on first use. This
  feature does not re-implement that fix.

## Architecture — two views in the existing SPA

`#appContainer` currently shows the form immediately. Introduce two switchable views inside it:

- **`#homeView`** (new) — the front-desk screen.
- **`#chartView`** — the existing **form + patient bar only**, wrapped unchanged.
- **Shared modals stay top-level siblings** of `#homeView`/`#chartView` — NOT descendants of
  `#chartView`. The review-dashboard, patient-list, intake-link, and portal modals must be
  reachable from home (e.g. *Review all* opens the review dashboard while home is visible); a
  `d-none` on a parent view would hide a modal nested inside it. They are already top-level in
  `index.html` today — keep them there.

A small `showView('home' | 'chart')` toggles only `#homeView`/`#chartView` visibility (CSS
`d-none`); modals are unaffected. No router.

- Login (auth success) → `showView('home')` and render home.
- Create / open-from-search / open-from-review → `loadPatient(...)` then `showView('chart')`.
- A **Home** button in the chart header → `showView('home')` and re-render home (so the
  review-queue count and any new patients refresh).

State (`currentPatientId`, etc.) is untouched; we only show/hide containers.

## Components — new module `js/home.js`

One isolated module owns the home screen and orchestrates **existing** functions; it
reimplements nothing. It is added to the script load order after `app.js`.

### Review-queue card
- Reads the same data source as the Review Queue modal (the intake-review dashboard fetch), but
  **filtered to submitted/actionable statuses only** — `review-needed` + `received`. Excludes
  `pending` (intake link sent but not yet filled out), even though the dashboard's
  `REVIEW_QUEUE_STATUSES` includes it. The card label is "ready to review," so it must not list
  patients who haven't submitted.
- Shows: count badge, the most recent **3** submissions (name · submitted-time), and *Review all*.
- Row click → `loadPatient(id)` → chart. *Review all* → opens the existing Review Queue dashboard (the current modal).
- Empty state: hide the card entirely (no clutter when nothing is waiting).

### New-patient panel
- Inputs: patient name, date of birth.
- **Create + intake link** button:
  1. Validate name + DOB (reuse existing required-field checks).
  2. `createPatient({ name, dob, ... })` — saves immediately. (MRN omitted → handled by the
     separate `fix/empty-mrn-gsi-key` Lambda fix; home screen doesn't collect MRN at create.)
  3. `createIntakeToken(patientId)` → magic-link URL.
  4. Show the link inline with two buttons:
     - **Copy link & done** → copy URL, clear the panel, stay on home (ready for next patient).
     - **Open chart** → `loadPatient(patientId)` → chart.
- Errors (validation, save, token) surface inline on the panel.

### Find-a-patient panel
- One search input (placeholder: "Search name, MRN, or date of birth").
- Debounced input, routed by query shape:
  - **Looks like a date** (e.g. `MM/DD/YYYY` or `YYYY-MM-DD`) → `listPatients()` once, then filter
    by `dob` in the browser. The backend `searchPatients` has no DOB path, so DOB is handled
    client-side; acceptable at single-clinic scale.
  - **Otherwise** → `searchPatients(query)` (existing MRN-exact → name-exact → name-prefix paths).
- Render result rows (name · DOB · MRN). Row click → `loadPatient(id)` → chart.
- States: empty (hint text), no-results, error (inline retry).

## Reused existing functions (no new plumbing)

| Need | Existing function (file) |
|---|---|
| Create patient (save-on-create) | `OSADatabase.createPatient` (`js/db.js`) |
| Generate intake link | `OSADatabase.createIntakeToken` (`js/db.js`) + intake-link modal logic (`index.html`) |
| Search patients | `OSADatabase.searchPatients` (`js/db.js`); rendering pattern from `loadPatientList()` (`index.html`) |
| Open a chart | `loadPatient(id)` (`index.html` inline script) |
| Review-queue data | the Review Dashboard fetch (`index.html` inline script) |

## Changes to existing code

- **`index.html`**: wrap the current form/patient-bar region in `#chartView`; add `#homeView`
  markup; add the **Home** button to the chart header; on auth success call `showView('home')`.
- **Expose a hook with an explicit lifecycle + error contract** — `window.OSAWorkspace`:
  - Assigned from inside the existing inline IIFE once its functions are ready, and it fires a
    ready signal (e.g. an `osa:workspace-ready` event). `js/home.js` **waits for that signal**
    before binding the home UI — "load after `app.js`" is not sufficient, because the functions
    live in the inline IIFE that runs after `app.js`.
  - Surface: `openChart(patientId)` (wraps `loadPatient` and **returns a success boolean / throws** —
    today `loadPatient` swallows errors, so the wrapper must report failure), `createWithIntakeLink({name, dob})`,
    `getReviewQueue()`, `showView(view)`.
  - **home.js switches to the chart only on a successful load** — never on a swallowed error.
- **Local/unconfigured mode**: when the backend isn't configured, the app already hides DB-dependent
  buttons and shows the form. In that mode, **skip home → go straight to the chart** (home's
  create/search/review all require the DB).
- **Nav + reset**: home header stays minimal (brand · Staging · user/logout). The **chart** header
  gains **Home** and keeps **Review queue** + **Patients**. The standalone **New Patient** nav button
  is retired as the home entry point, but the **chart keeps a "New patient / clear workspace" action**
  (the current `btnClearForm` reset path) so a clinician can reset the chart without going home.
- **`js/home.js`**: new module; add to the script load order.

## Error handling

Reuse existing patterns. Name/DOB validation and the save-error path surface inline on the
New-patient panel (the empty-MRN `ValidationException` is handled by the prerequisite fix, not
here). Search and intake-link failures show a small inline retry message. The `openChart` wrapper
returns failure on a bad load, so home **stays put rather than switching to a broken chart**. No
silent failures.

## Testing

Front-end UI with no automated harness (the golden-master suite covers the phenotyping
engine, which is untouched here). Verification is manual via the preview server + clinic
walk-through:

1. Login → lands on Home (when the backend is configured).
2. New patient: name + DOB → Create → link appears → **Copy link & done** clears + stays home; **Open chart** opens the chart.
3. Search: name and MRN return the right patient; a DOB typed as `MM/DD/YYYY` also returns them (client-side date fallback). Click → chart opens.
4. Review card: shows only submitted intakes (`review-needed` + `received`), not `pending` links; click a row → opens that patient.
5. **Review all** from home opens the review dashboard (confirms modals aren't trapped in a hidden `#chartView`).
6. A failed patient load keeps you on Home (the `openChart` success contract), not a broken chart.
7. Home button from a chart → returns to Home, counts refreshed.
8. Local/unconfigured mode → skips home, lands on the chart.
9. Regression: existing form/save/intake/portal flows still work from the chart view, and the chart-level "New patient / clear workspace" reset still works.

## Resolved during review (2026-06-12)

- **DOB search**: client-side `listPatients` + date filter (single-clinic scale); no backend change.
- **Review card**: submitted/actionable only (`review-needed` + `received`), exclude `pending`.
- **Modal placement**: shared modals stay top-level siblings, not inside `#chartView`.
- **Workspace contract**: `OSAWorkspace` ready-signal + `openChart` returns success/throws.
- **MRN dependency**: `fix/empty-mrn-gsi-key` merged + deployed is a hard prerequisite.
- **Local mode**: skip home → chart when the backend is unconfigured.
- **Reset path**: chart keeps a "New patient / clear workspace" action.

## Future (not in this build)

- Optional: a role distinction (true MA vs physician) if the practice later wants different surfaces.
- Optional: surface "today's schedule" or recent patients on home.
