(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const isLocalHost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  const active = isLocalHost && params.get('testMode') === 'workflow';

  if (!active) return;

  function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function actor() {
    return 'workflow-test@localhost';
  }

  function ensureBootstrapStub() {
    if (window.bootstrap) return;

    const modalInstances = new WeakMap();

    class Modal {
      constructor(el) {
        this._el = el;
        modalInstances.set(el, this);
      }

      show() {
        if (!this._el) return;
        this._el.classList.add('show');
        this._el.style.display = 'block';
        this._el.removeAttribute('aria-hidden');
      }

      hide() {
        if (!this._el) return;
        this._el.classList.remove('show');
        this._el.style.display = 'none';
        this._el.setAttribute('aria-hidden', 'true');
      }

      static getInstance(el) {
        return modalInstances.get(el) || null;
      }
    }

    class Collapse {
      constructor(el, options) {
        this._el = el;
        if (options && options.toggle) this.show();
      }

      show() {
        if (this._el) this._el.classList.add('show');
      }

      hide() {
        if (this._el) this._el.classList.remove('show');
      }
    }

    class Tooltip {
      constructor() {}
    }

    window.bootstrap = { Modal, Collapse, Tooltip };
  }

  ensureBootstrapStub();

  const store = new Map();
  let patientSeq = 1;
  let snapshotSeq = 1;
  let tokenSeq = 1;

  function patientClone(patient) {
    return clone(patient);
  }

  function getPatientOrThrow(id) {
    const patient = store.get(id);
    if (!patient) throw new Error('Patient not found');
    return patient;
  }

  function listStorePatients(includeArchived) {
    return [...store.values()]
      .filter((patient) => includeArchived || !patient.isDeleted)
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
      .map(patientClone);
  }

  function normalizeValue(value) {
    if (value === undefined) return '';
    return value;
  }

  function appendHistory(patient, field, entry) {
    if (!patient.fieldProvenanceHistory[field]) patient.fieldProvenanceHistory[field] = [];
    patient.fieldProvenanceHistory[field].push(entry);
  }

  function stampField(patient, field, value, source, event, updatedAt, updatedBy, extras) {
    patient.fieldProvenance[field] = {
      source,
      updatedAt,
      updatedBy,
    };
    appendHistory(patient, field, {
      source,
      updatedAt,
      updatedBy,
      event,
      value,
      ...(extras || {}),
    });
  }

  function applyChartChanges(patient, nextFields, source, event, updatedAt, updatedBy) {
    Object.entries(nextFields).forEach(([field, rawValue]) => {
      const value = normalizeValue(rawValue);
      const currentValue = field === 'name' || field === 'dob' || field === 'mrn'
        ? patient[field] || ''
        : Object.prototype.hasOwnProperty.call(patient.formData, field)
          ? patient.formData[field]
          : '';
      const changed = JSON.stringify(currentValue) !== JSON.stringify(value);
      if (!changed && event !== 'created') return;

      if (field === 'name' || field === 'dob' || field === 'mrn') {
        patient[field] = value || '';
      } else {
        patient.formData[field] = value;
      }

      stampField(patient, field, value, source, event, updatedAt, updatedBy);
    });
  }

  function createBasePatient(data) {
    const updatedAt = nowIso();
    const patientId = `workflow-${patientSeq++}`;
    const patient = {
      patientId,
      name: data.name || '',
      dob: data.dob || '',
      mrn: data.mrn || '',
      status: data.status || 'Initial Eval',
      milestones: Array.isArray(data.milestones) ? data.milestones.slice() : ['Initial Eval'],
      formData: {},
      version: 1,
      updatedAt,
      intakeStatus: null,
      intakeReceivedAt: null,
      intakePendingOverrides: {},
      intakePendingProvenance: {},
      intakePendingFieldCount: 0,
      intakeReviewHistory: [],
      fieldProvenance: {},
      fieldProvenanceHistory: {},
      reportSnapshots: [],
      reportSnapshotCount: 0,
      intakeTokens: [],
      isDeleted: false,
      deletedAt: null,
    };

    applyChartChanges(patient, { name: patient.name, dob: patient.dob, mrn: patient.mrn }, 'clinician', 'created', updatedAt, actor());
    applyChartChanges(patient, data.formData || {}, 'clinician', 'created', updatedAt, actor());
    return patient;
  }

  function buildSnapshot(reportSnapshot, updatedAt) {
    const analysisData = reportSnapshot.analysisData || {};
    return {
      snapshotId: `snap-${snapshotSeq++}`,
      createdAt: updatedAt,
      createdBy: actor(),
      reportDate: reportSnapshot.reportDate || analysisData.reportDate || '',
      patientReportHtml: reportSnapshot.patientReportHtml || '',
      stage: analysisData.primaryAHI === null || analysisData.primaryAHI === undefined ? 'pre-study' : 'post-study',
      severity: analysisData.severity || '',
      primaryAHI: analysisData.primaryAHI ?? null,
      phenotypes: Array.isArray(analysisData.phen) ? analysisData.phen.slice() : [],
      patientName: reportSnapshot.patientName || analysisData.patientName || '',
    };
  }

  const workflowDb = {
    init() {},
    async listPatients(includeArchived) {
      return listStorePatients(includeArchived);
    },
    async getPatient(id) {
      return patientClone(getPatientOrThrow(id));
    },
    async createPatient(data) {
      const patient = createBasePatient(data || {});
      store.set(patient.patientId, patient);
      return patientClone(patient);
    },
    async updatePatient(id, data) {
      const patient = getPatientOrThrow(id);
      if (data && data.version !== undefined && Number(data.version) !== Number(patient.version)) {
        throw new Error('Reload before saving again');
      }

      const updatedAt = nowIso();

      if (data && data.restore) {
        patient.isDeleted = false;
        patient.deletedAt = null;
        patient.updatedAt = updatedAt;
        patient.version += 1;
        return patientClone(patient);
      }

      if (data && data.reportSnapshot !== undefined) {
        const snapshot = buildSnapshot(data.reportSnapshot || {}, updatedAt);
        patient.reportSnapshots = [...(patient.reportSnapshots || []), snapshot].slice(-10);
        patient.reportSnapshotCount = patient.reportSnapshots.length;
        patient.updatedAt = updatedAt;
        patient.version += 1;
        return patientClone(patient);
      }

      if (data && Object.prototype.hasOwnProperty.call(data, 'name')) patient.name = data.name || '';
      if (data && Object.prototype.hasOwnProperty.call(data, 'dob')) patient.dob = data.dob || '';
      if (data && Object.prototype.hasOwnProperty.call(data, 'mrn')) patient.mrn = data.mrn || '';
      if (data && Object.prototype.hasOwnProperty.call(data, 'status')) patient.status = data.status || patient.status;
      if (data && Object.prototype.hasOwnProperty.call(data, 'milestones')) patient.milestones = Array.isArray(data.milestones) ? data.milestones.slice() : patient.milestones;

      applyChartChanges(patient, { name: patient.name, dob: patient.dob, mrn: patient.mrn }, 'clinician', 'chart-save', updatedAt, actor());
      applyChartChanges(patient, (data && data.formData) || {}, 'clinician', 'chart-save', updatedAt, actor());

      patient.updatedAt = updatedAt;
      patient.version += 1;
      return patientClone(patient);
    },
    async reviewIntakeChanges(id, version, review) {
      const patient = getPatientOrThrow(id);
      if (Number(version) !== Number(patient.version)) {
        throw new Error('Reload before saving again');
      }

      const updatedAt = nowIso();
      const resolutions = Array.isArray(review && review.resolutions) ? review.resolutions : [];
      resolutions.forEach((resolution) => {
        const field = resolution.field;
        const pendingValue = patient.intakePendingOverrides[field];
        if (!Object.prototype.hasOwnProperty.call(patient.intakePendingOverrides, field)) return;

        if (resolution.action === 'accept-intake') {
          applyChartChanges(patient, { [field]: pendingValue }, 'patient-intake-reviewed', 'intake-applied', updatedAt, actor());
        } else {
          appendHistory(patient, field, {
            source: 'clinician-review',
            updatedAt,
            updatedBy: actor(),
            event: 'chart-save',
            resolution: 'kept-chart',
            value: patient.formData[field],
          });
        }

        delete patient.intakePendingOverrides[field];
        delete patient.intakePendingProvenance[field];
      });

      patient.intakePendingFieldCount = Object.keys(patient.intakePendingOverrides).length;
      patient.intakeStatus = patient.intakePendingFieldCount ? 'review-needed' : 'received';
      patient.updatedAt = updatedAt;
      patient.version += 1;
      patient.intakeReviewHistory.push({
        reviewedAt: updatedAt,
        reviewedBy: actor(),
        note: (review && review.note) || '',
        resolutions: clone(resolutions),
      });
      return patientClone(patient);
    },
    async restorePatient(id) {
      return workflowDb.updatePatient(id, { restore: true, version: getPatientOrThrow(id).version });
    },
    async deletePatient(id) {
      const patient = getPatientOrThrow(id);
      patient.isDeleted = true;
      patient.deletedAt = nowIso();
      patient.updatedAt = patient.deletedAt;
      patient.version += 1;
      return patientClone(patient);
    },
    async searchPatients(query, includeArchived) {
      const needle = String(query || '').trim().toLowerCase();
      const patients = listStorePatients(includeArchived).filter((patient) => {
        return [patient.name, patient.dob, patient.mrn]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(needle));
      });
      const exactNameMatches = patients.filter((patient) => String(patient.name || '').trim().toLowerCase() === needle);
      return exactNameMatches.length ? exactNameMatches : patients;
    },
    async createIntakeToken(patientId) {
      const patient = getPatientOrThrow(patientId);
      const issuedAt = nowIso();
      const expiresAt = new Date(Date.now() + (72 * 60 * 60 * 1000)).toISOString();
      const token = `workflow-token-${tokenSeq++}`;
      const record = {
        token,
        tokenHash: `workflow-hash-${token}`,
        issuedAt,
        expiresAt,
        usedAt: null,
      };
      patient.intakeTokens.push(record);
      return { token, expiresAt };
    },
    async listIntakeTokens(patientId) {
      return clone(getPatientOrThrow(patientId).intakeTokens || []);
    },
    async revokeIntakeToken(tokenHash) {
      store.forEach((patient) => {
        patient.intakeTokens = (patient.intakeTokens || []).filter(token => token.tokenHash !== tokenHash);
      });
      return { ok: true };
    },
  };

  Object.assign(OSADatabase, workflowDb);
  Object.assign(OSAAuth, {
    init() {},
    async getIdToken() { return 'workflow-test-token'; },
    async getUserEmail() { return actor(); },
    async getUserGroups() { return ['osa-admin', 'osa-clinician']; },
    async getUserClaims() {
      return { email: actor(), 'cognito:groups': ['osa-admin', 'osa-clinician'] };
    },
    async getSession() { return { workflow: true }; },
    async isAuthenticated() { return true; },
    signOut() {},
    signIn: async () => ({ challenge: null }),
    completeNewPassword: async () => ({ challenge: null }),
    completeMfa: async () => ({}),
    beginMfaSetup: async () => 'WORKFLOW-TEST-SECRET',
    completeMfaSetup: async () => ({}),
    startIdleWatch() {},
    stopIdleWatch() {},
  });

  window.__OSA_WORKFLOW_TEST__ = {
    active: true,
    listPatients(includeArchived = true) {
      return listStorePatients(includeArchived);
    },
    getPatient(id) {
      return patientClone(getPatientOrThrow(id));
    },
    clear() {
      store.clear();
      patientSeq = 1;
      snapshotSeq = 1;
      tokenSeq = 1;
    },
    injectPendingIntake(id, overrides) {
      const patient = getPatientOrThrow(id);
      const updatedAt = nowIso();
      Object.entries(overrides || {}).forEach(([field, value]) => {
        patient.intakePendingOverrides[field] = value;
        patient.intakePendingProvenance[field] = {
          source: 'patient-intake-pending',
          updatedAt,
          updatedBy: 'workflow-intake@localhost',
        };
        appendHistory(patient, field, {
          source: 'patient-intake-pending',
          updatedAt,
          updatedBy: 'workflow-intake@localhost',
          event: 'pending-review',
          value,
        });
      });
      patient.intakePendingFieldCount = Object.keys(patient.intakePendingOverrides).length;
      patient.intakeStatus = patient.intakePendingFieldCount ? 'review-needed' : patient.intakeStatus;
      patient.intakeReceivedAt = updatedAt;
      patient.updatedAt = updatedAt;
      return patientClone(patient);
    },
  };
})();
