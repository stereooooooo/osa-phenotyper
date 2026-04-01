/*  OSA Phenotyper – PDF Export
    Generates downloadable PDF handouts using jsPDF + html2canvas.
    Depends on: jsPDF and html2canvas loaded via CDN.
--------------------------------------------------------------------*/

const OSAPdfExport = (() => {

  /* ── Logo preload ─────────────────────────────────────────── */
  let logoDataURI = '';
  fetch('img/logo.svg')
    .then(r => r.text())
    .then(svg => { logoDataURI = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); })
    .catch(() => { /* logo will be omitted if fetch fails */ });

  /**
   * Strip UI-only elements (buttons, no-print) from cloned HTML.
   */
  function cleanHTMLForPdf(innerHTML) {
    const tmp = document.createElement('div');
    tmp.innerHTML = innerHTML;
    // Remove the patient report buttons wrapper
    const btns = tmp.querySelector('#patientReportButtons');
    if (btns) btns.remove();
    // Remove any other no-print elements
    tmp.querySelectorAll('.no-print').forEach(el => el.remove());
    // Remove <details> wrappers but keep content open for PDF
    tmp.querySelectorAll('details').forEach(d => {
      d.setAttribute('open', '');
    });
    return tmp.innerHTML;
  }

  function formatPdfDate(isoDate) {
    if (!isoDate) {
      return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    const parts = String(isoDate).split('-');
    if (parts.length !== 3) {
      const parsed = new Date(isoDate);
      return Number.isNaN(parsed.getTime())
        ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    const [year, month, day] = parts.map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime())
      ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /**
   * Inline PDF styles — injected into the container so html2canvas
   * can render them without needing external stylesheets (which may
   * contain modern CSS functions like color() that html2canvas can't parse).
   */
  const PDF_STYLES = `
    * { box-sizing: border-box; }
    body, div, p, h1, h2, h3, h4, h5, h6, ul, ol, li, table, tr, td, th, details, summary {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
    .table th, .table td { padding: 6px 8px; border: 1px solid #dee2e6; font-size: 13px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
    .table thead th { background: #1F3A5C; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 600; }
    .table-sm th, .table-sm td { padding: 4px 6px; }
    .table-bordered th, .table-bordered td { border: 1px solid #dee2e6; }
    .table-borderless th, .table-borderless td { border: none; }
    .osa-report-table thead th { background: #1F3A5C; color: #fff; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .bg-success { background-color: #198754; color: #fff; }
    .bg-warning { background-color: #ffc107; color: #212529; }
    .bg-danger { background-color: #dc3545; color: #fff; }
    .bg-info { background-color: #0dcaf0; color: #212529; }
    .bg-secondary { background-color: #6c757d; color: #fff; }
    .text-success { color: #198754; }
    .text-danger { color: #dc3545; }
    .text-muted { color: #6c757d; }
    .small { font-size: 0.85em; }
    .alert { padding: 10px 14px; border-radius: 6px; margin-bottom: 10px; }
    .alert-success { background: #d1e7dd; border: 1px solid #badbcc; }
    .alert-warning { background: #fff3cd; border: 1px solid #ffecb5; }
    .alert-danger { background: #f8d7da; border: 1px solid #f5c2c7; }
    .alert-info { background: #cff4fc; border: 1px solid #b6effb; }
    .alert-secondary { background: #e2e3e5; border: 1px solid #d3d6d8; }
    .card { border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 12px; }
    .card-header { background: #f8f9fa; padding: 8px 14px; font-weight: 600; font-size: 14px; border-bottom: 1px solid #dee2e6; border-radius: 8px 8px 0 0; }
    .card-body { padding: 14px; }
    .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 16px; } .mt-4 { margin-top: 24px; }
    .mb-0 { margin-bottom: 0; } .mb-2 { margin-bottom: 8px; }
    .me-1 { margin-right: 4px; } .me-2 { margin-right: 8px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    ul, ol { padding-left: 20px; }
    li { margin-bottom: 4px; }
    details[open] summary { margin-bottom: 6px; }
    strong { font-weight: 700; }

    /* Clinician metrics row */
    .osa-clin-metrics-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
    .osa-clin-metric { display: flex; flex-direction: column; align-items: center; padding: 8px 10px; border-radius: 6px; background: #f8f9fa; border: 1px solid #e9ecef; min-width: 85px; flex: 1 1 85px; max-width: 130px; }
    .osa-clin-metric-val { font-size: 18px; font-weight: 700; line-height: 1.2; }
    .osa-clin-metric-lbl { font-size: 10px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.02em; margin-top: 2px; text-align: center; white-space: nowrap; }

    /* Ranked treatment plan */
    .osa-clin-rec { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; margin-bottom: 5px; border-radius: 5px; font-size: 13px; line-height: 1.5; background: #f8f9fa; border-left: 3px solid #dee2e6; }
    .osa-clin-rec.osa-rec-priority { background: #f0f2f6; border-left-color: #1F3A5C; }
    .osa-clin-rec-num { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; border-radius: 50%; background: #1F3A5C; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

    /* HGNS table */
    #hgnsAssessment .table { table-layout: fixed; }
    #hgnsAssessment .table td:first-child { width: 180px; vertical-align: top; }
    #hgnsAssessment .table td:last-child { vertical-align: top; }

    /* Confidence badges */
    .osa-conf-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }

    /* Section title */
    .osa-section-title { color: #1F3A5C; font-weight: 700; border-bottom: 2px solid #C8102E; padding-bottom: 4px; display: inline-block; }

    /* Patient report styles for PDF */
    .patient-report { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; font-size: 14px; line-height: 1.65; color: #374151; }
    .patient-report .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #1F3A5C; }
    .patient-report .report-logo { height: 48px; width: auto; }
    .patient-report .report-meta { text-align: right; font-size: 12px; color: #6B7280; }
    .patient-report .report-patient-name { font-weight: 600; color: #374151; }
    .patient-report .report-title { font-size: 20px; font-weight: 700; color: #1F3A5C; margin-bottom: 4px; }
    .patient-report h2 { font-size: 16px; font-weight: 700; color: #1F3A5C; margin-top: 24px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #E5E7EB; }
    .ahi-scale { margin: 16px 0; }
    .ahi-scale-bar { display: flex; height: 40px; border-radius: 6px; overflow: hidden; }
    .ahi-scale-zone { display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 600; color: #fff; gap: 1px; }
    .ahi-zone-label { font-size: 10px; line-height: 1; }
    .ahi-zone-range { font-size: 8px; line-height: 1; opacity: 0.85; }
    .ahi-scale-zone.normal { background: #22c55e; flex: 5; }
    .ahi-scale-zone.mild { background: #eab308; flex: 10; color: #374151; }
    .ahi-scale-zone.moderate { background: #f97316; flex: 15; }
    .ahi-scale-zone.severe { background: #ef4444; flex: 30; }
    .ahi-scale-marker-row { position: relative; height: 24px; margin-top: 4px; }
    .ahi-scale-marker { position: absolute; transform: translateX(-50%); text-align: center; font-size: 11px; font-weight: 700; color: #1F3A5C; }
    .phenotype-item { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
    .phenotype-icon { font-size: 18px; color: #1F3A5C; flex-shrink: 0; margin-top: 2px; }
    .treatment-group-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-top: 16px; margin-bottom: 6px; }
    .rec-item { padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
    .checklist-item { display: flex; gap: 6px; align-items: flex-start; margin-bottom: 6px; }
    .checklist-box { flex-shrink: 0; width: 14px; height: 14px; border: 2px solid #9ca3af; border-radius: 2px; margin-top: 3px; }
    .checklist-group-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-top: 16px; margin-bottom: 4px; }
    .checklist-group-label:first-of-type { margin-top: 0; }
    .checklist-group-subtitle { font-size: 11px; color: #9ca3af; margin-top: 0; margin-bottom: 6px; font-style: italic; }
    .whatif-item { background: #f0f9ff; border-left: 3px solid #1F3A5C; padding: 10px 12px; margin-bottom: 10px; border-radius: 0 6px 6px 0; }
    .cpap-context-box { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 10px 12px; margin-bottom: 12px; border-radius: 0 6px 6px 0; font-size: 13px; }
    .comisa-callout { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 12px; margin-bottom: 12px; border-radius: 6px; font-size: 13px; }
    .report-footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9ca3af; text-align: center; }

    /* Care pathway bar */
    .care-pathway { margin: 0 0 20px; padding: 12px 16px; background: #f8fafc; border: 1px solid #E5E7EB; border-radius: 8px; }
    .pathway-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-bottom: 8px; }
    .pathway-steps { display: flex; align-items: center; justify-content: center; gap: 3px 0; flex-wrap: wrap; }
    .pathway-step { display: flex; align-items: center; gap: 4px; white-space: nowrap; font-size: 11px; font-weight: 500; padding: 3px 6px; border-radius: 16px; }
    .pathway-icon { font-size: 9px; line-height: 1; }
    .pathway-completed { color: #1F3A5C; }
    .pathway-completed .pathway-icon { color: #22c55e; }
    .pathway-active { background: #1F3A5C; color: #fff; font-weight: 600; }
    .pathway-active .pathway-icon { color: #fff; }
    .pathway-upcoming { color: #c4c8cf; }
    .pathway-upcoming .pathway-icon { color: #d1d5db; }
    .pathway-line { display: inline-block; width: 14px; height: 2px; background: #E5E7EB; flex-shrink: 1; min-width: 6px; }

    /* Care summary card */
    .care-summary-card { background: #f0f2f6; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
    .care-summary-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #6B7280; margin-bottom: 4px; }
  `;

  /**
   * Render an HTML string to a PDF and trigger download.
   * @param {string} html - The HTML content to render
   * @param {string} filename - Download filename
   */
  /**
   * Find safe page-break points by scanning DOM element boundaries.
   * Returns an array of y-positions (in canvas pixels) where it's safe to cut.
   * Prefers breaks between block-level elements (h2, p, div, etc.).
   */
  function findBreakPoints(container, canvasScale) {
    // Collect bottom-edges of all block-level children and their nested blocks
    const breakable = container.querySelectorAll(
      'h2, h3, p, table, thead, tbody, tr, div.rec-item, div.phenotype-item, div.checklist-item, div.whatif-item, ' +
      'div.cpap-context-box, div.comisa-callout, div.treatment-group-label, div.checklist-group-label, p.checklist-group-subtitle, ' +
      'div.report-header, div.care-pathway, div.care-summary-card, div.ahi-scale, div.report-footer'
    );
    const containerTop = container.getBoundingClientRect().top;
    const points = [];

    breakable.forEach(el => {
      const rect = el.getBoundingClientRect();
      // The bottom of this element (relative to container top) is a safe break point
      const bottomY = (rect.bottom - containerTop) * canvasScale;
      // The top of this element is also a candidate (break before the element)
      const topY = (rect.top - containerTop) * canvasScale;
      points.push(topY, bottomY);
    });

    // Deduplicate and sort
    return [...new Set(points)].sort((a, b) => a - b);
  }

  /**
   * Given a target cut position and a list of safe break points,
   * find the best break point that doesn't exceed the target by too much.
   * Prefers the largest break point that fits within the page.
   */
  function bestBreak(breakPoints, targetY, minY) {
    // Find the largest break point that is <= targetY and > minY
    let best = minY;
    for (const bp of breakPoints) {
      if (bp <= minY) continue;
      if (bp <= targetY) best = bp;
      else break;  // sorted, so no more candidates
    }
    // If no good break found (e.g., a single element taller than a page), fall back to target
    if (best <= minY) return targetY;
    return best;
  }

  async function exportFromHTML(html, filename, addFooter = false, footerDate = null) {
    if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
      alert('PDF export libraries not loaded. Please check your internet connection.');
      return;
    }

    // Create off-screen container with injected styles
    const container = document.createElement('div');
    container.style.cssText = "position:absolute; left:-9999px; top:0; width:800px; background:white; padding:40px; font-family:'Inter','Segoe UI',system-ui,sans-serif;";
    container.innerHTML = `<style>${PDF_STYLES}</style>${html}`;
    document.body.appendChild(container);

    try {
      const canvasScale = 2;

      // Collect break points from the DOM before html2canvas renders
      const breakPoints = findBreakPoints(container, canvasScale);

      const canvas = await html2canvas(container, {
        scale: canvasScale,
        useCORS: true,
        logging: false,
        width: 800,
        windowWidth: 800,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.href || '';
            if (href.includes('fonts.googleapis') || href.includes('fonts.gstatic')) return;
            link.remove();
          });
        }
      });

      const { jsPDF } = jspdf;
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const footerMargin = addFooter ? 8 : 0;  // Reserve space for footer text
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2 - footerMargin;

      // Scale factor: how many canvas pixels per mm of PDF
      const pxPerMm = canvas.width / usableWidth;
      const pageHeightPx = usableHeight * pxPerMm;

      let srcY = 0;  // current position in canvas pixels
      let pageNum = 0;

      while (srcY < canvas.height) {
        if (pageNum > 0) pdf.addPage();

        // Find the ideal cut point for this page
        const idealEnd = srcY + pageHeightPx;
        let cutY;

        if (idealEnd >= canvas.height) {
          // Last page — take everything remaining
          cutY = canvas.height;
        } else {
          // Find best break point near the ideal end
          cutY = bestBreak(breakPoints, idealEnd, srcY);
        }

        const sliceH = cutY - srcY;
        if (sliceH <= 0) break;  // safety

        // Create a cropped canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext('2d');
        // Fill white background to avoid JPEG compression artifacts on partial pages
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        const destH = sliceH / pxPerMm;  // height in mm
        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(pageImg, 'JPEG', margin, margin, usableWidth, destH);

        // Per-page footer
        if (addFooter) {
          pdf.setFontSize(8);
          pdf.setTextColor(156, 163, 175);
          const footerText = 'Prepared by Capital ENT \u00B7 ' + formatPdfDate(footerDate);
          pdf.text(footerText, pageWidth / 2, pageHeight - 6, { align: 'center' });
        }

        srcY = cutY;
        pageNum++;
      }

      pdf.save(filename);
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Build and export the clinician decision-support PDF.
   */
  function exportClinicianPDF() {
    const reportEl = document.getElementById('clinicianReport');
    if (!reportEl || !reportEl.innerHTML.trim()) {
      alert('Generate reports first before exporting.');
      return;
    }

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const logoImg = logoDataURI
      ? `<img src="${logoDataURI}" style="height:36px; width:auto;" alt="Capital ENT">`
      : '';

    const cleanedContent = cleanHTMLForPdf(reportEl.innerHTML);

    const html = `
      <div style="font-size:13px; line-height:1.5; color:#333; word-wrap:break-word; overflow-wrap:break-word;">
        <div style="display:flex; align-items:center; gap:14px; border-bottom:3px solid #1F3A5C; padding-bottom:10px; margin-bottom:16px;">
          ${logoImg}
          <div>
            <h1 style="margin:0; font-size:20px; color:#1F3A5C; word-spacing:0.15em; letter-spacing:0.01em;">Clinician Decision Support</h1>
            <p style="margin:4px 0 0; font-size:12px; color:#666;">Capital ENT &amp; Sinus Center &bull; ${date}</p>
          </div>
        </div>
        ${cleanedContent}
        <hr style="margin-top:24px;">
        <p style="font-size:10px; color:#999; margin-top:10px;">
          Generated by OSA Phenotyper &bull; ${date}
        </p>
      </div>
    `;

    return exportFromHTML(html, `OSA-Clinician-Report-${new Date().toISOString().slice(0,10)}.pdf`);
  }

  /**
   * Build and export the new patient report PDF from overlay content.
   */
  function exportPatientReportPDF() {
    const el = document.getElementById('reportPreviewContent');
    if (!el) return;

    const reportEl = el.querySelector('.patient-report');
    if (!reportEl) {
      alert('Generate the patient report first.');
      return;
    }

    const clone = reportEl.cloneNode(true);
    // Remove any no-print elements from clone
    clone.querySelectorAll('.no-print').forEach(n => n.remove());

    const patientName = clone.getAttribute('data-patient-name') ||
      clone.querySelector('.report-patient-name')?.textContent ||
      'Patient';
    const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const dateStr = clone.getAttribute('data-report-date') || new Date().toISOString().split('T')[0];
    const filename = `Sleep_Report_${safeName}_${dateStr}.pdf`;

    return exportFromHTML(clone.outerHTML, filename, true, dateStr);
  }

  return { exportClinicianPDF, exportPatientReportPDF };
})();
