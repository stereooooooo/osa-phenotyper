/*  OSA Phenotyper – WatchPAT PDF Parser
    Extracts sleep study metrics from WatchPAT report PDFs using pdf.js.
    Entirely client-side — no patient data leaves the browser.
    Depends on: pdf.js loaded via CDN (pdfjsLib global)
--------------------------------------------------------------------*/

const WatchPATParser = (() => {

  /* ── Field definitions ──────────────────────────────────────── */
  // Each field maps to a form input name, with a label for the review modal.
  // Extraction is done via section-aware logic, not simple regex, because
  // the WatchPAT report uses tabular layouts with duplicate labels across pages.

  const FIELDS = [
    // Page 1 — Patient Info
    { name: 'age',        label: 'Age',            section: 'patient' },
    { name: 'sex',        label: 'Sex',            section: 'patient' },
    { name: 'bmi',        label: 'BMI',            section: 'patient' },
    { name: 'neck',       label: 'Neck Circ (in)', section: 'patient' },
    { name: 'ess',        label: 'Epworth (ESS)',  section: 'patient' },

    // Page 2 — Respiratory Indices (All Night column)
    { name: 'pahi',       label: 'pAHI (overall)',    section: 'respiratory' },
    { name: 'remPahi',    label: 'pAHI REM',          section: 'respiratory' },
    { name: 'nremPahi',   label: 'pAHI NREM',         section: 'respiratory' },
    { name: 'odi',        label: 'ODI 4%',            section: 'respiratory' },
    { name: 'patRdi',     label: 'PAT RDI',           section: 'respiratory' },
    { name: 'pahic',      label: 'pAHIc 3%',          section: 'respiratory' },
    { name: 'pahic4',     label: 'pAHIc 4%',          section: 'respiratory' },
    { name: 'csr',        label: '% CSR',             section: 'respiratory' },

    // Page 2 — Oxygen & Hypoxic Burden
    { name: 'nadir',      label: 'Min SpO\u2082 (%)',     section: 'oxygen' },
    { name: 'hbAreaPH',   label: 'HB per hour',           section: 'hypoxic' },
    { name: 'hbUnder90PH',label: 'Area <90% per hour',    section: 'hypoxic' },

    // Page 2 — Sleep Time
    { name: 'tst',        label: 'Total Sleep Time (hrs)', section: 'sleep' },

    // Page 4 — Body Position Statistics
    { name: 'supPahi',    label: 'Supine pAHI',      section: 'position' },
    { name: 'nonSupPahi', label: 'Non-Supine pAHI',  section: 'position' },

    // Page 4 — Snoring
    { name: 'snoreIdx',   label: 'Snoring (dB mean)', section: 'snoring' },
  ];

  /**
   * Parse a WatchPAT PDF file and return extracted values.
   * @param {File} file - The PDF file to parse
   * @returns {Promise<{fields: Array, raw: string}>}
   *   fields: Array of {name, label, value, confidence}
   *   raw: full extracted text for debugging
   */
  async function parse(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('pdf.js library not loaded. Please check your internet connection.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Position-aware text extraction: group items by Y-row, sort by X within each row.
    // This prevents pdf.js from mixing text from different table columns.
    function extractPageText(content) {
      const items = content.items.filter(it => it.str.trim());
      if (!items.length) return '';
      // Group by Y coordinate (within 3px tolerance)
      const rows = [];
      items.forEach(item => {
        const y = Math.round(item.transform[5]);
        const x = item.transform[4];
        let row = rows.find(r => Math.abs(r.y - y) < 3);
        if (!row) { row = { y, items: [] }; rows.push(row); }
        row.items.push({ str: item.str, x });
      });
      // Sort rows top-to-bottom (higher Y = higher on page in PDF coords)
      rows.sort((a, b) => b.y - a.y);
      // Sort items left-to-right within each row
      return rows.map(r => {
        r.items.sort((a, b) => a.x - b.x);
        return r.items.map(it => it.str).join(' ');
      }).join('  ');
    }

    // Extract text from all pages
    const pageTexts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = extractPageText(content);
      pageTexts.push(text);
    }

    const allText = pageTexts.join('\n\n--- PAGE BREAK ---\n\n');
    const results = [];

    // ── Page 1: Patient Info ───────────────────────────────────
    const p1 = pageTexts[0] || '';

    const ageMatch = p1.match(/Age:\s*(\d+)/i);
    if (ageMatch) results.push({ name: 'age', label: 'Age', value: ageMatch[1], confidence: 'high' });

    const genderMatch = p1.match(/Gender:\s*(Male|Female)/i);
    if (genderMatch) results.push({ name: 'sex', label: 'Sex', value: genderMatch[1] === 'Male' ? 'M' : 'F', confidence: 'high' });

    const bmiMatch = p1.match(/BMI:\s*([\d.]+)/i);
    if (bmiMatch) results.push({ name: 'bmi', label: 'BMI', value: bmiMatch[1], confidence: 'high' });

    const neckMatch = p1.match(/Neck\s*Circ\.?:?\s+(\d[\d.]*)/i);
    if (neckMatch) results.push({ name: 'neck', label: 'Neck Circ (in)', value: neckMatch[1], confidence: 'high' });

    const essMatch = p1.match(/Epworth:?\s*(\d+)/i);
    if (essMatch) results.push({ name: 'ess', label: 'Epworth (ESS)', value: essMatch[1], confidence: 'high' });

    // ── Page 2: Respiratory Indices ─────────────────────────────
    const p2 = pageTexts[1] || '';

    // Respiratory table rows: label, Total Events, REM, NREM, All Night
    // pdf.js extracts table cells as space-separated on one line
    const respPatterns = [
      { regex: /pAHI\s*3\s*%:?\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
        fields: [
          { name: 'pahi',     label: 'pAHI (overall)', col: 4 },
          { name: 'remPahi',  label: 'pAHI REM',       col: 2 },
          { name: 'nremPahi', label: 'pAHI NREM',      col: 3 },
        ]
      },
      { regex: /ODI\s*4\s*%:?\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
        fields: [{ name: 'odi', label: 'ODI 4%', col: 4 }]
      },
      { regex: /pRDI:?\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
        fields: [{ name: 'patRdi', label: 'PAT RDI', col: 4 }]
      },
      { regex: /pAHIc\s*3\s*%:?\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
        fields: [{ name: 'pahic', label: 'pAHIc 3%', col: 4 }]
      },
      { regex: /pAHIc\s*4\s*%:?\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
        fields: [{ name: 'pahic4', label: 'pAHIc 4%', col: 4 }]
      },
    ];

    respPatterns.forEach(pat => {
      const m = p2.match(pat.regex);
      if (m) {
        pat.fields.forEach(f => {
          results.push({ name: f.name, label: f.label, value: m[f.col], confidence: 'high' });
        });
      }
    });

    // % CSR — single value, not a table row with 4 columns
    const csrMatch = p2.match(/%\s*CSR:?\s+([\d.]+)/i);
    if (csrMatch) results.push({ name: 'csr', label: '% CSR', value: csrMatch[1], confidence: 'high' });

    // ── Page 2: Oxygen Saturation ──────────────────────────────
    // pdf.js extracts labels grouped then values: "Mean:  Minimum:  Maximum: 94  86  99"
    // The O2 sat section comes before Pulse Rate section
    const o2Section = p2.split(/Pulse Rate/i)[0] || p2;
    // Try format: "Mean: X Minimum: Y Maximum: Z" (inline values)
    let o2MinMatch = o2Section.match(/Minimum:\s+(\d[\d.]*)\s+Maximum/i);
    if (!o2MinMatch) {
      // Try format: labels grouped then values: "Mean:  Minimum:  Maximum: N1  N2  N3"
      o2MinMatch = o2Section.match(/Mean:\s+Minimum:\s+Maximum:\s*(\d[\d.]*)\s+(\d[\d.]*)\s+(\d[\d.]*)/i);
      if (o2MinMatch) {
        // Groups: 1=Mean, 2=Minimum, 3=Maximum
        results.push({ name: 'nadir', label: 'Min SpO\u2082 (%)', value: o2MinMatch[2], confidence: 'high' });
      }
    } else {
      results.push({ name: 'nadir', label: 'Min SpO\u2082 (%)', value: o2MinMatch[1], confidence: 'high' });
    }

    // ── Page 2: Hypoxic Burden ─────────────────────────────────
    // pdf.js may produce:
    //   Format A: "Desaturation area under SpO2 baseline  164  37" (label then TST, Per hour)
    //   Format B: "Area under 90% SpO2  Desaturation area under SpO2 baseline  TST  Per hour  3  1  164  37"
    //             (both labels, then header, then all 4 values: Area90-TST, Area90-PH, Desat-TST, Desat-PH)
    const hbDesatMatch = p2.match(/Desaturation\s+area\s+under\s+SpO2\s+baseline\s+(\d[\d.]*)\s+(\d[\d.]*)/i);
    if (hbDesatMatch) {
      results.push({ name: 'hbAreaPH', label: 'HB per hour', value: hbDesatMatch[2], confidence: 'high' });
    }

    const hb90Match = p2.match(/Area\s+under\s+90\s*%?\s*SpO2\s+(\d[\d.]*)\s+(\d[\d.]*)/i);
    if (hb90Match) {
      results.push({ name: 'hbUnder90PH', label: 'Area <90% per hour', value: hb90Match[2], confidence: 'high' });
    }

    // Format B fallback: labels grouped, then "TST  Per hour" header, then 4 numbers
    if (!hbDesatMatch || !hb90Match) {
      const hbBlock = p2.match(/Area\s+under\s+90\s*%?\s*SpO2\s+Desaturation\s+area\s+under\s+SpO2\s+baseline\s+TST\s+Per\s+hour\s+(\d[\d.]*)\s+(\d[\d.]*)\s+(\d[\d.]*)\s+(\d[\d.]*)/i);
      if (hbBlock) {
        // Groups: 1=Area90-TST, 2=Area90-PerHour, 3=Desat-TST, 4=Desat-PerHour
        if (!hb90Match) results.push({ name: 'hbUnder90PH', label: 'Area <90% per hour', value: hbBlock[2], confidence: 'high' });
        if (!hbDesatMatch) results.push({ name: 'hbAreaPH', label: 'HB per hour', value: hbBlock[4], confidence: 'high' });
      }
    }

    // ── Page 2: Total Sleep Time ───────────────────────────────
    // Direct format: "Total Sleep Time  4 hrs, 32 min"
    let tstMatch = p2.match(/Total\s+Sleep\s+Time\s+(\d+)\s*hrs?,?\s*(\d+)\s*min/i);
    if (tstMatch) {
      const hrs = parseInt(tstMatch[1]) + parseInt(tstMatch[2]) / 60;
      results.push({ name: 'tst', label: 'Total Sleep Time (hrs)', value: hrs.toFixed(1), confidence: 'high' });
    } else {
      // Grouped format: labels then values with "X hrs, Y min" appearing twice
      // (Total Recording Time, then Total Sleep Time). We want the second one.
      const hrsMinAll = [...p2.matchAll(/(\d+)\s*hrs?,?\s*(\d+)\s*min/gi)];
      if (hrsMinAll.length >= 2) {
        // Second match = Total Sleep Time
        const m = hrsMinAll[1];
        const hrs = parseInt(m[1]) + parseInt(m[2]) / 60;
        results.push({ name: 'tst', label: 'Total Sleep Time (hrs)', value: hrs.toFixed(1), confidence: 'high' });
      } else if (hrsMinAll.length === 1) {
        const m = hrsMinAll[0];
        const hrs = parseInt(m[1]) + parseInt(m[2]) / 60;
        results.push({ name: 'tst', label: 'Total Sleep Time (hrs)', value: hrs.toFixed(1), confidence: 'low' });
      }
    }

    // ── Page 4: Body Position Statistics ───────────────────────
    const p4 = pageTexts[3] || '';

    // Position table: "pAHI 3%: Supine Prone Right Left Non-Supine"
    // Values: "52.9 29.5 13.3 22.6 22.1"
    const posMatch = p4.match(/pAHI\s*3\s*%:?\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
    if (posMatch) {
      results.push({ name: 'supPahi', label: 'Supine pAHI', value: posMatch[1], confidence: 'high' });
      results.push({ name: 'nonSupPahi', label: 'Non-Supine pAHI', value: posMatch[5], confidence: 'high' });
    }

    // ── Page 4: Snoring Mean ───────────────────────────────────
    const snoreMatch = p4.match(/Mean:\s*([\d.]+)\s*dB/i);
    if (snoreMatch) results.push({ name: 'snoreIdx', label: 'Snoring (dB mean)', value: snoreMatch[1], confidence: 'high' });

    // ── Identify fields not found ──────────────────────────────
    const foundNames = new Set(results.map(r => r.name));
    const notFound = FIELDS.filter(f => !foundNames.has(f.name)).map(f => f.label);

    return { fields: results, notFound, raw: allText };
  }

  return { parse, FIELDS };
})();


/* ── Drop Zone & Review Modal UI ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('pdfDropZone');
  const fileInput = document.getElementById('pdfFileInput');
  const status = document.getElementById('pdfStatus');

  if (!dropZone || !fileInput) return;

  // Click to browse
  dropZone.addEventListener('click', (e) => {
    if (e.target === fileInput || e.target.tagName === 'LABEL') return;
    fileInput.click();
  });

  // Drag & drop events
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') handlePdfFile(file);
    else status.innerHTML = '<span class="text-danger">Please drop a PDF file.</span>';
  });

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handlePdfFile(fileInput.files[0]);
  });

  async function handlePdfFile(file) {
    status.innerHTML = '<span class="text-primary"><i class="bi bi-hourglass-split"></i> Parsing PDF...</span>';

    try {
      const result = await WatchPATParser.parse(file);
      showReviewModal(result);
      status.innerHTML = `<span class="text-success"><i class="bi bi-check-circle"></i> ${result.fields.length} fields extracted.</span>`;
    } catch (err) {
      console.error('PDF parse error:', err);
      status.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle"></i> Error: ${err.message}</span>`;
    }
  }

  function showReviewModal(result) {
    const tbody = document.querySelector('#pdfReviewTable tbody');
    tbody.innerHTML = '';

    result.fields.forEach((f, i) => {
      const confIcon = f.confidence === 'high'
        ? '<i class="bi bi-check-circle-fill text-success"></i>'
        : '<i class="bi bi-exclamation-triangle-fill text-warning"></i>';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="form-check-input" data-idx="${i}" checked></td>
        <td>${f.label}</td>
        <td><input type="text" class="form-control form-control-sm" data-idx="${i}" value="${f.value}" style="width:100px;"></td>
        <td>${confIcon} <small>${f.confidence}</small></td>
      `;
      tbody.appendChild(tr);
    });

    const notFoundDiv = document.getElementById('pdfNotFound');
    if (result.notFound.length) {
      notFoundDiv.innerHTML = `<strong>Not found (enter manually):</strong> ${result.notFound.join(', ')}`;
    } else {
      notFoundDiv.innerHTML = '<span class="text-success">All fields extracted successfully.</span>';
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('pdfReviewModal'));
    modal.show();

    // Wire Apply button
    const btnApply = document.getElementById('btnApplyPdf');
    const handler = () => {
      applyPdfValues(result.fields, tbody);
      modal.hide();
      btnApply.removeEventListener('click', handler);
    };
    btnApply.addEventListener('click', handler);
  }

  function applyPdfValues(fields, tbody) {
    const form = document.getElementById('form');
    let count = 0;

    tbody.querySelectorAll('tr').forEach((tr, i) => {
      const checkbox = tr.querySelector('input[type="checkbox"]');
      const valueInput = tr.querySelector('input[type="text"]');
      if (!checkbox.checked) return;

      const field = fields[i];
      const value = valueInput.value;
      const formEl = form.querySelector(`[name="${field.name}"]`);
      if (!formEl) return;

      if (formEl.tagName === 'SELECT') {
        // Match option by value
        const opt = Array.from(formEl.options).find(o => o.value === value);
        if (opt) { formEl.value = value; count++; }
      } else {
        formEl.value = value;
        count++;
      }

      // Green flash animation
      formEl.classList.add('pdf-filled');
      setTimeout(() => formEl.classList.remove('pdf-filled'), 1500);
    });

    // Also auto-select WatchPAT study type if not already
    const wpRadio = document.getElementById('stWatchpat');
    if (wpRadio && !wpRadio.checked) {
      wpRadio.checked = true;
      wpRadio.dispatchEvent(new Event('change'));
    }

    const status = document.getElementById('pdfStatus');
    if (status) status.innerHTML = `<span class="text-success"><i class="bi bi-check-circle"></i> ${count} fields applied to form.</span>`;
  }
});
