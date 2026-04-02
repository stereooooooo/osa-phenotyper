/**
 * OSA Phenotyper – Patient Database API Module
 * Communicates with the Lambda/API Gateway backend.
 *
 * Exposes: window.OSADatabase
 */
const OSADatabase = (function () {
  'use strict';

  let apiUrl = '';

  function init(config) {
    apiUrl = config.apiUrl.replace(/\/$/, '');
  }

  /* ── Fetch wrapper with auth ─────────────────────────────── */
  async function apiFetch(path, options = {}) {
    const token = await OSAAuth.getIdToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    const res = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const raw = await res.text();
    let data = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }
    }
    if (!res.ok) {
      const fallback = (data.raw && !/^\s*</.test(data.raw))
        ? data.raw.trim().slice(0, 200)
        : '';
      throw new Error(data.error || data.message || fallback || `API error ${res.status}`);
    }
    return data;
  }

  /* ── CRUD Operations ─────────────────────────────────────── */

  async function listPatients(includeArchived = false) {
    const suffix = includeArchived ? '?includeArchived=true' : '';
    return apiFetch(`/patients${suffix}`);
  }

  async function getPatient(id) {
    return apiFetch(`/patients/${encodeURIComponent(id)}`);
  }

  async function createPatient(data) {
    return apiFetch('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async function updatePatient(id, data) {
    return apiFetch(`/patients/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async function restorePatient(id) {
    return apiFetch(`/patients/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ restore: true }),
    });
  }

  async function deletePatient(id) {
    return apiFetch(`/patients/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async function searchPatients(query, includeArchived = false) {
    const archivedParam = includeArchived ? '&includeArchived=true' : '';
    return apiFetch(`/patients/search?q=${encodeURIComponent(query)}${archivedParam}`);
  }

  /* ── Intake Token Operations ─────────────────────────────── */

  /**
   * Generate a single-use intake link for a patient.
   * Returns { token, expiresAt }.
   */
  async function createIntakeToken(patientId) {
    return apiFetch('/intake-tokens', {
      method: 'POST',
      body: JSON.stringify({ patientId }),
    });
  }

  /**
   * List active/used/expired tokens for a patient (for revocation UI).
   */
  async function listIntakeTokens(patientId) {
    return apiFetch(`/intake-tokens/${encodeURIComponent(patientId)}`);
  }

  /**
   * Revoke an active intake token.
   */
  async function revokeIntakeToken(tokenHash) {
    return apiFetch(`/intake-tokens/${encodeURIComponent(tokenHash)}`, {
      method: 'DELETE',
    });
  }

  /* ── Form Data Helpers ───────────────────────────────────── */

  /**
   * Serialize the entire form into a plain object for storage.
   */
  function serializeForm(formEl) {
    const fd = new FormData(formEl);
    const data = {};
    for (const [key, val] of fd.entries()) {
      // Handle multiple values (checkboxes with same name)
      if (data[key] !== undefined) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(val);
      } else {
        data[key] = val;
      }
    }
    // Explicitly capture unchecked checkboxes as false
    formEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      if (!cb.name) return;
      if (data[cb.name] === undefined) data[cb.name] = false;
      else if (data[cb.name] === 'on') data[cb.name] = true;
    });
    return data;
  }

  /**
   * Populate the form from a stored data object.
   */
  function populateForm(formEl, data) {
    if (!data || typeof data !== 'object') return;

    Object.entries(data).forEach(([name, val]) => {
      const els = formEl.querySelectorAll(`[name="${name}"]`);
      if (!els.length) return;

      els.forEach((el) => {
        if (el.type === 'checkbox') {
          el.checked = val === true || val === 'on' || val === 'true';
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.type === 'radio') {
          el.checked = el.value === val;
          if (el.checked) el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.value = val ?? '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    // Trigger CPAP details visibility
    const cpapCb = formEl.querySelector('[name="priorCpap"]');
    if (cpapCb) cpapCb.dispatchEvent(new Event('change', { bubbles: true }));

    // Trigger study type visibility
    const checkedStudy = formEl.querySelector('[name="studyType"]:checked');
    if (checkedStudy) checkedStudy.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return {
    init,
    listPatients,
    getPatient,
    createPatient,
    updatePatient,
    restorePatient,
    deletePatient,
    searchPatients,
    createIntakeToken,
    listIntakeTokens,
    revokeIntakeToken,
    serializeForm,
    populateForm,
  };
})();
