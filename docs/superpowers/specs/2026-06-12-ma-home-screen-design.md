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
| Search | **One box** matching name / MRN / DOB, live results, click to open chart. |
| Review queue | **Surface it** — count + most-recent few + *Review all*. |

## Non-goals (out of scope)

- No roles/permissions (the app only has `osa-admin` / `osa-clinician`; the home screen is identical for all).
- No changes to the phenotyping form/chart itself, or to `intake.html`.
- No separate page or client-side router — this stays a single-page app.
- No new backend endpoints — reuse existing `db.js` methods.

## Architecture — two views in the existing SPA

`#appContainer` currently shows the form immediately. Introduce two switchable views inside it:

- **`#homeView`** (new) — the front-desk screen.
- **`#chartView`** — the existing form + patient bar + modals, wrapped unchanged.

A small `showView('home' | 'chart')` toggles visibility (CSS `d-none`); no router.

- Login (auth success) → `showView('home')` and render home.
- Create / open-from-search / open-from-review → `loadPatient(...)` then `showView('chart')`.
- A **Home** button in the chart header → `showView('home')` and re-render home (so the
  review-queue count and any new patients refresh).

State (`currentPatientId`, etc.) is untouched; we only show/hide containers.

## Components — new module `js/home.js`

One isolated module owns the home screen and orchestrates **existing** functions; it
reimplements nothing. It is added to the script load order after `app.js`.

### Review-queue card
- Reads the same data source as the Review Queue modal (the intake-review dashboard fetch).
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
- Debounced input → `searchPatients(query)` → render result rows (name · DOB · MRN).
- Row click → `loadPatient(id)` → chart.
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
- **Expose a hook**: a small `window.OSAWorkspace` API (`loadPatient`, the create+link flow,
  `showView`, review-queue fetch) so `js/home.js` can call logic that currently lives in
  `index.html`'s inline `<script>`. This is a modest, surgical exposure — not a rewrite.
- **Nav**: home header stays minimal (brand · Staging · user/logout). The **chart** header gains
  **Home** and keeps **Review queue** + **Patients** (full list). The standalone **New Patient**
  nav button is retired (the home screen is now the new-patient entry point).
- **`js/home.js`**: new module; add to the script load order.

## Error handling

Reuse existing patterns. Name/DOB validation and the save-error path (including the MRN
ValidationException fix shipped separately) surface inline on the New-patient panel. Search
and intake-link failures show a small inline retry message. No silent failures.

## Testing

Front-end UI with no automated harness (the golden-master suite covers the phenotyping
engine, which is untouched here). Verification is manual via the preview server + clinic
walk-through:

1. Login → lands on Home.
2. New patient: name + DOB → Create → link appears → **Copy link & done** clears + stays home; **Open chart** opens the chart.
3. Search: type name / MRN / DOB → results → click → chart opens with that patient.
4. Review card: shows pending count + rows → click → opens that patient.
5. Home button from a chart → returns to Home, counts refreshed.
6. Regression: existing form/save/intake/portal flows still work from the chart view.

## Open items / future (not in this build)

- Optional: a role distinction (true MA vs physician) if the practice later wants different surfaces.
- Optional: surface "today's schedule" or recent patients on home.
