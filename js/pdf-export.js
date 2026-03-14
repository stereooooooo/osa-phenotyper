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
  `;

  /**
   * Render an HTML string to a PDF and trigger download.
   * @param {string} html - The HTML content to render
   * @param {string} filename - Download filename
   */
  async function exportFromHTML(html, filename) {
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
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 800,
        windowWidth: 800,
        onclone: (clonedDoc) => {
          // Remove external stylesheets that use modern CSS functions
          // (color(), oklch, color-mix) which html2canvas cannot parse.
          // Keep Google Fonts so font rendering works correctly.
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
      const usableWidth = pageWidth - margin * 2;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      // Multi-page support
      let yOffset = 0;
      const usableHeight = pageHeight - margin * 2;

      while (yOffset < imgHeight) {
        if (yOffset > 0) pdf.addPage();

        // Calculate source crop for this page
        const srcY = (yOffset / imgHeight) * canvas.height;
        const srcH = Math.min((usableHeight / imgHeight) * canvas.height, canvas.height - srcY);
        const destH = Math.min(usableHeight, imgHeight - yOffset);

        // Create a cropped canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcH;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(pageImg, 'JPEG', margin, margin, usableWidth, destH);

        yOffset += usableHeight;
      }

      pdf.save(filename);
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Build and export the patient-friendly PDF handout.
   */
  function exportPatientPDF() {
    const summaryEl = document.getElementById('patientSummary');
    if (!summaryEl || !summaryEl.innerHTML.trim()) {
      alert('Generate reports first before exporting.');
      return;
    }

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const cleanedContent = cleanHTMLForPdf(summaryEl.innerHTML);

    const logoImg = logoDataURI
      ? `<img src="${logoDataURI}" style="height:40px; width:auto;" alt="Capital ENT">`
      : '';

    const html = `
      <div style="font-size:14px; line-height:1.6; color:#333;">
        <div style="display:flex; align-items:center; gap:16px; border-bottom:3px solid #1F3A5C; padding-bottom:12px; margin-bottom:20px;">
          ${logoImg}
          <div>
            <h1 style="margin:0; font-size:22px; color:#1F3A5C;">Personalized Sleep Report</h1>
            <p style="margin:4px 0 0; font-size:13px; color:#666;">Capital ENT &amp; Sinus Center &bull; ${date}</p>
          </div>
        </div>
        ${cleanedContent}
        <hr style="margin-top:30px;">
        <p style="font-size:11px; color:#999; margin-top:12px;">
          Generated by OSA Phenotyper. This report is for educational purposes and does not replace clinical judgment.
        </p>
      </div>
    `;

    return exportFromHTML(html, `OSA-Patient-Report-${new Date().toISOString().slice(0,10)}.pdf`);
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

  return { exportPatientPDF, exportClinicianPDF };
})();
