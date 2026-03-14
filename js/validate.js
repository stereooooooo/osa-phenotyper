/*  OSA Phenotyper – Input Validation
    Provides per-field range checks and cross-field plausibility warnings.
    Depends on: js/config.js (must be loaded first)
--------------------------------------------------------------------*/

const OSAValidation = (() => {

  const ranges = OSA_CONFIG.validation.ranges;
  const crossChecks = OSA_CONFIG.validation.crossField;

  /**
   * Validate a single field value.
   * @param {string} name  – form field name (must match a key in ranges)
   * @param {*} value      – raw input value (string or number)
   * @returns {{ valid: boolean, error: string|null, warning: string|null }}
   */
  function validateField(name, value) {
    const result = { valid: true, error: null, warning: null };
    const rule = ranges[name];
    if (!rule) return result;                    // no rule → always valid

    if (value === '' || value === null || value === undefined) return result; // blank is OK (optional)

    const num = Number(value);
    if (isNaN(num)) {
      result.valid = false;
      result.error = 'Must be a number.';
      return result;
    }

    // Hard range (blocks submission)
    if (num < rule.min || num > rule.max) {
      result.valid = false;
      result.error = `Value must be ${rule.min}–${rule.max}.`;
      return result;
    }

    // Soft range (warning only)
    if (rule.warnMin !== undefined && num < rule.warnMin) {
      result.warning = `Unusually low (${num}). Please verify.`;
    } else if (rule.warnMax !== undefined && num > rule.warnMax) {
      result.warning = `Unusually high (${num}). Please verify.`;
    }

    return result;
  }

  /**
   * Run all cross-field plausibility checks.
   * @param {FormData|object} data – FormData or plain object with field values
   * @returns {Array<{id: string, message: string}>}
   */
  function validateCrossField(data) {
    const warnings = [];
    const get = (key) => {
      if (data instanceof FormData) {
        const v = data.get(key);
        return (v === '' || v === null) ? null : Number(v);
      }
      return data[key] ?? null;
    };

    crossChecks.forEach(rule => {
      const vals = {};
      let allPresent = true;
      rule.fields.forEach(f => {
        const v = get(f);
        if (v === null || isNaN(v)) allPresent = false;
        vals[f] = v;
      });
      if (allPresent && rule.check(vals)) {
        warnings.push({ id: rule.id, message: rule.message });
      }
    });

    return warnings;
  }

  /**
   * Validate entire form. Returns { errors: [...], warnings: [...] }
   * errors block submission; warnings show a confirmation.
   */
  function validateForm(formEl) {
    const errors = [];
    const warnings = [];
    const data = new FormData(formEl);

    // Per-field checks
    for (const name of Object.keys(ranges)) {
      const value = data.get(name);
      if (value === null || value === '') continue;
      const result = validateField(name, value);
      if (!result.valid) {
        errors.push({ field: name, message: result.error });
      } else if (result.warning) {
        warnings.push({ field: name, message: result.warning });
      }
    }

    // Cross-field checks
    const crossWarnings = validateCrossField(data);
    warnings.push(...crossWarnings);

    return { errors, warnings };
  }

  /* ── Live validation on form inputs ────────────────────────── */

  function attachLiveValidation(formEl) {
    const inputs = formEl.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        const name = input.name;
        const value = input.value;
        clearFieldState(input);

        if (value === '') return;

        const result = validateField(name, value);

        if (!result.valid) {
          setFieldError(input, result.error);
        } else if (result.warning) {
          setFieldWarning(input, result.warning);
        }
      });

      // Clear on focus for fresh typing
      input.addEventListener('focus', () => clearFieldState(input));
    });
  }

  function setFieldError(input, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-warning');
    input.setAttribute('aria-invalid', 'true');
    let fb = input.parentElement.querySelector('.invalid-feedback');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      input.parentElement.appendChild(fb);
    }
    fb.textContent = message;
  }

  function setFieldWarning(input, message) {
    input.classList.add('is-warning');
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    let fb = input.parentElement.querySelector('.warning-feedback');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'warning-feedback';
      input.parentElement.appendChild(fb);
    }
    fb.textContent = message;
  }

  function clearFieldState(input) {
    input.classList.remove('is-invalid', 'is-warning');
    input.removeAttribute('aria-invalid');
    const inv = input.parentElement.querySelector('.invalid-feedback');
    const warn = input.parentElement.querySelector('.warning-feedback');
    if (inv) inv.remove();
    if (warn) warn.remove();
  }

  return { validateField, validateCrossField, validateForm, attachLiveValidation };

})();
