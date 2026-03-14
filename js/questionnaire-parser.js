/*  OSA Phenotyper – Intake Questionnaire PDF Parser
    Extracts ESS, ISI, and NOSE scores from IntakeQ-generated PDFs.
    ─────────────────────────────────────────────────────────────────
    Strategy: IntakeQ exports flat PDFs (no form fields). Selected
    radio-button values are rendered in a bold font (suffix "f3")
    while unselected options use the regular font (suffix "f1").
    Font names differ per page (g_d1_f3, g_d2_f3, etc.).

    Two formats are used:
    - Bare digits (ESS, NOSE): "0 1 2 3" — bold digit = selected
    - Labeled options (ISI): "Severe (3)" — bold label = selected
--------------------------------------------------------------------*/

const QuestionnaireParser = (() => {

  /* ── Extract text items with position + font info ──────────── */
  async function getTextItems(pdf) {
    const allItems = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      content.items.forEach(item => {
        if (!item.str.trim()) return;
        allItems.push({
          str:  item.str.trim(),
          x:    Math.round(item.transform[4]),
          y:    Math.round(item.transform[5]),
          font: item.fontName || '',
          page: p
        });
      });
    }
    return allItems;
  }

  /* ── Check if a font is the "bold/selected" font ───────────── */
  function isBoldFont(fontName) {
    // IntakeQ PDFs use g_dN_f3 for bold, g_dN_f1 for regular
    return /f3$/i.test(fontName) || /bold/i.test(fontName);
  }

  /* ── Find ESS items (bare digits 0-3) ──────────────────────── */
  function findESSItems(items) {
    // Find ESS header
    const header = items.find(it => /epworth sleepiness/i.test(it.str));
    if (!header) return [];

    // Find NOSE header to bound ESS section
    const noseHeader = items.find(it => /nose scale/i.test(it.str));

    // Get bare single digits between ESS and NOSE headers
    const digits = items.filter(it => {
      if (!/^[0-3]$/.test(it.str)) return false;
      // Must be after ESS header
      if (it.page < header.page) return false;
      if (it.page === header.page && it.y > header.y) return false;
      // Must be before NOSE header
      if (noseHeader) {
        if (it.page > noseHeader.page) return false;
        if (it.page === noseHeader.page && it.y <= noseHeader.y) return false;
      }
      // Filter out section numbers (left margin x < 45) and page numbers (bottom y < 50)
      if (it.x < 45 || it.y < 50) return false;
      return true;
    });

    // Sort: page asc, y desc (top first), x asc
    digits.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      if (Math.abs(a.y - b.y) > 5) return b.y - a.y;
      return a.x - b.x;
    });

    // Group into clusters of 4 (options 0,1,2,3)
    const groups = groupContiguous(digits, 4);

    // For each group, find the bold digit
    return groups.map(g => {
      const bold = g.find(d => isBoldFont(d.font));
      return bold ? parseInt(bold.str) : null;
    });
  }

  /* ── Find NOSE items (bare digits 0-4) ─────────────────────── */
  function findNOSEItems(items) {
    const header = items.find(it => /nose scale/i.test(it.str));
    if (!header) return [];

    // Find ISI header to bound NOSE section
    const isiHeader = items.find(it => /insomnia severity/i.test(it.str));

    const digits = items.filter(it => {
      if (!/^[0-4]$/.test(it.str)) return false;
      if (it.page !== header.page) return false;
      if (it.y > header.y) return false;
      // Must be above ISI section
      if (isiHeader && isiHeader.page === it.page && it.y <= isiHeader.y) return false;
      // Filter out section numbers and page numbers
      if (it.x < 45 || it.y < 50) return false;
      return true;
    });

    digits.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 5) return b.y - a.y;
      return a.x - b.x;
    });

    const groups = groupContiguous(digits, 5);

    return groups.map(g => {
      const bold = g.find(d => isBoldFont(d.font));
      return bold ? parseInt(bold.str) : null;
    });
  }

  /* ── Find ISI items (labeled options like "Severe (3)") ────── */
  function findISIItems(items) {
    const header = items.find(it => /insomnia severity/i.test(it.str));
    if (!header) return [];

    // Find next section header to bound ISI
    const nextSection = items.find(it =>
      it.page === header.page && it.y < header.y &&
      /weight loss|treatment|prior/i.test(it.str)
    );

    // Get all items with "(N)" pattern in the ISI zone
    const labelItems = items.filter(it => {
      if (it.page !== header.page) return false;
      if (it.y > header.y) return false;
      if (nextSection && it.y <= nextSection.y) return false;
      return /\(\d\)/.test(it.str);
    });

    // Sort by y desc (top first), then x asc
    labelItems.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 5) return b.y - a.y;
      return a.x - b.x;
    });

    // ISI question labels appear at known X positions (~45, ~224, ~404 for 3-column layout)
    // First 3 ISI items use 3-column layout with options wrapping across 2 rows
    // Remaining 4 items use full-width layout with options on one row
    // Strategy: find ALL bold items and extract their value; each bold = one answer

    const boldItems = labelItems.filter(it => isBoldFont(it.font));
    const values = [];
    boldItems.forEach(it => {
      const m = it.str.match(/\((\d)\)/);
      if (m) values.push(parseInt(m[1]));
    });

    return values;
  }

  /* ── Group contiguous digits into clusters ─────────────────── */
  function groupContiguous(digits, expectedSize) {
    if (!digits.length) return [];
    const groups = [];
    let current = [digits[0]];

    for (let i = 1; i < digits.length; i++) {
      const prev = current[current.length - 1];
      const d = digits[i];
      const sameRow = Math.abs(d.y - prev.y) <= 5 && d.page === prev.page;
      const adjacent = (d.x - prev.x) < 80;

      if (sameRow && adjacent) {
        current.push(d);
      } else {
        if (current.length >= expectedSize - 1) groups.push(current);
        current = [d];
      }
    }
    if (current.length >= expectedSize - 1) groups.push(current);

    return groups;
  }

  /* ── Find bold Yes/No/Maybe near a question header ─────────── */
  function findBoldChoice(items, headerPattern, choices) {
    const hdr = items.find(it => headerPattern.test(it.str));
    if (!hdr) return null;
    // Look for bold choice text on the same row (within 8px Y)
    const nearby = items.filter(it =>
      it.page === hdr.page &&
      Math.abs(it.y - hdr.y) < 8 &&
      isBoldFont(it.font)
    );
    for (const it of nearby) {
      for (const c of choices) {
        if (it.str.toLowerCase().includes(c.toLowerCase())) return c;
      }
    }
    return null;
  }

  /* ── Find bold checkbox-style items in a Y range ─────────── */
  function findBoldMatches(items, page, yTop, yBottom, patterns) {
    const results = [];
    const zone = items.filter(it =>
      it.page === page && it.y <= yTop && it.y >= yBottom && isBoldFont(it.font)
    );
    for (const [key, regex] of patterns) {
      if (zone.some(it => regex.test(it.str))) results.push(key);
    }
    return results;
  }

  /* ── Parse Section 8: Prior Treatment for Sleep-Disordered Breathing */
  function findTreatmentHistory(items) {
    const results = { fields: [], notFound: [] };

    // Find section header
    const hdr = items.find(it => /prior treatment/i.test(it.str));
    if (!hdr) {
      results.notFound.push('Treatment history section not found');
      return results;
    }

    const pg = hdr.page;
    const yTop = hdr.y;
    const yBottom = 40; // near page bottom

    // A. Prior treatments checkbox list
    const priorTxPatterns = [
      ['priorCpap',    /cpap|bipap/i],
      ['priorMAD',     /oral appliance|mandibular/i],
      ['priorUPPP',    /uppp|uvulopalato/i],
      ['priorJaw',     /jaw surgery/i],
      ['priorNasal',   /nasal surgery/i],
      ['priorSinus',   /sinus surgery/i],
      ['priorInspire', /inspire/i],
    ];
    const boldTx = findBoldMatches(items, pg, yTop, yBottom, priorTxPatterns);

    // Check for "None of the above"
    const noneChecked = items.some(it =>
      it.page === pg && it.y <= yTop && it.y >= yBottom &&
      /none of the above/i.test(it.str) && isBoldFont(it.font)
    );

    // Only add prior treatment checkboxes if they were found (and not "None")
    if (boldTx.length > 0 && !noneChecked) {
      boldTx.forEach(name => {
        results.fields.push({
          name, label: name.replace('prior','Prior ').replace(/([A-Z])/g,' $1').trim(),
          value: true, confidence: 'high', type: 'checkbox'
        });
      });
    }

    // B. "Have you ever used CPAP or BiPAP?" → Yes/No
    const everCpap = findBoldChoice(items, /have you ever used cpap/i, ['Yes','No']);
    if (everCpap === 'Yes') {
      // Ensure priorCpap is in results
      if (!results.fields.some(f => f.name === 'priorCpap')) {
        results.fields.push({ name: 'priorCpap', label: 'Prior CPAP use', value: true, confidence: 'high', type: 'checkbox' });
      }

      // C. Currently using?
      const current = findBoldChoice(items, /currently using cpap/i, ['Yes','No']);
      if (current) {
        results.fields.push({ name: 'cpapCurrent', label: 'Currently using CPAP', value: current === 'Yes', confidence: 'high', type: 'checkbox' });
      }

      // D. Noticed improvement?
      const helped = findBoldChoice(items, /notice any improvement/i, ['Yes','No','Unsure']);
      if (helped) {
        results.fields.push({ name: 'cpapHelped', label: 'CPAP helped?', value: helped, confidence: 'high', type: 'select' });
      }

      // E. Reasons stopped (checkbox-style)
      const reasonPatterns = [
        ['cpapMask',      /mask discomfort|poor fit/i],
        ['cpapClaustro',  /claustrophobia|anxiety/i],
        ['cpapDry',       /dry mouth|nasal dryness/i],
        ['cpapLeaks',     /leaks|noise from machine/i],
        ['cpapSleep',     /trouble falling asleep/i],
        ['cpapSkin',      /skin irritation|pressure sores/i],
        ['cpapNoImprove', /didn.t notice.*improvement|no.*improvement/i],
        ['cpapTravel',    /difficulty.*travel/i],
      ];
      // Reasons section is below "main reasons" header
      const reasonHdr = items.find(it => it.page === pg && /main reasons.*stopped/i.test(it.str));
      if (reasonHdr) {
        const retryHdr = items.find(it => it.page === pg && /open to retrying/i.test(it.str));
        const rYBottom = retryHdr ? retryHdr.y : yBottom;
        const boldReasons = findBoldMatches(items, pg, reasonHdr.y, rYBottom, reasonPatterns);
        boldReasons.forEach(name => {
          results.fields.push({ name, label: name.replace('cpap','').replace(/([A-Z])/g,' $1').trim(), value: true, confidence: 'high', type: 'checkbox' });
        });
      }

      // F. Open to retrying?
      const retry = findBoldChoice(items, /open to retrying cpap/i, ['Yes','No','Maybe']);
      if (retry) {
        results.fields.push({ name: 'cpapRetry', label: 'Open to retry CPAP', value: retry, confidence: 'high', type: 'select' });
      }
    } else if (everCpap === 'No') {
      // Explicitly record no prior CPAP
      results.notFound.push('No prior CPAP use reported');
    }

    return results;
  }

  /* ── Parse Section 5: Treatment Preferences & Goals ────────── */
  function findTreatmentPreferences(items) {
    const results = { fields: [] };

    const hdr = items.find(it => /treatment preferences|preferences.*goals/i.test(it.str));
    if (!hdr) return results;

    const pg = hdr.page;
    // Find next section header (ISI or Weight Loss)
    const nextHdr = items.find(it =>
      it.page === pg && it.y < hdr.y &&
      /insomnia severity|weight loss/i.test(it.str)
    );
    const yBottom = nextHdr ? nextHdr.y : hdr.y - 300;

    const prefPatterns = [
      ['prefAvoidCpap', /avoid cpap/i],
      ['prefSurgery',   /open to surgery/i],
      ['prefInspire',   /interested in inspire|inspire implant/i],
    ];
    const boldPrefs = findBoldMatches(items, pg, hdr.y, yBottom, prefPatterns);
    boldPrefs.forEach(name => {
      const labels = { prefAvoidCpap: 'Avoid CPAP if possible', prefSurgery: 'Open to surgery', prefInspire: 'Interested in Inspire' };
      results.fields.push({ name, label: labels[name] || name, value: true, confidence: 'high', type: 'checkbox' });
    });

    return results;
  }

  /* ── Main parse function ───────────────────────────────────── */
  async function parse(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const items = await getTextItems(pdf);

    const fields = [];
    const notFound = [];

    // ESS: 8 items, 0-3 each, total 0-24
    const essValues = findESSItems(items);
    const essValid = essValues.filter(v => v !== null);
    if (essValid.length >= 6) {
      const total = essValid.reduce((s, v) => s + v, 0);
      fields.push({
        name: 'ess',
        label: `ESS Total (${essValid.length}/8 items)`,
        value: total,
        confidence: essValid.length === 8 ? 'high' : 'medium'
      });
    } else {
      notFound.push(`ESS: only ${essValid.length}/8 items detected`);
    }

    // NOSE: 5 items, 0-4 each, ×5 = 0-100
    const noseValues = findNOSEItems(items);
    const noseValid = noseValues.filter(v => v !== null);
    if (noseValid.length >= 4) {
      const rawSum = noseValid.reduce((s, v) => s + v, 0);
      const total = rawSum * 5;
      fields.push({
        name: 'noseScore',
        label: `NOSE Score (${noseValid.length}/5 items, raw ${rawSum} × 5)`,
        value: total,
        confidence: noseValid.length === 5 ? 'high' : 'medium'
      });
    } else {
      notFound.push(`NOSE: only ${noseValid.length}/5 items detected`);
    }

    // ISI: 7 items, 0-4 each, total 0-28
    const isiValues = findISIItems(items);
    const isiValid = isiValues.filter(v => v !== null);
    if (isiValid.length >= 5) {
      const total = isiValid.reduce((s, v) => s + v, 0);
      fields.push({
        name: 'isi',
        label: `ISI Total (${isiValid.length}/7 items)`,
        value: total,
        confidence: isiValid.length === 7 ? 'high' : 'medium'
      });
    } else {
      notFound.push(`ISI: only ${isiValid.length}/7 items detected`);
    }

    // Treatment History (Section 8)
    const txHistory = findTreatmentHistory(items);
    fields.push(...txHistory.fields);
    notFound.push(...txHistory.notFound);

    // Treatment Preferences (Section 5)
    const txPrefs = findTreatmentPreferences(items);
    fields.push(...txPrefs.fields);

    return { fields, notFound };
  }

  return { parse };
})();
