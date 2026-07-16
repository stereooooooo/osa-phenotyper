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
    .patient-report { margin: 0; padding: 0; max-width: none; background: transparent; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; font-size: 13px; line-height: 1.6; color: #374151; }
    .patient-report p { margin-top: 0; margin-bottom: 10px; }
    .patient-report .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1F3A5C; }
    .patient-report .report-logo { height: 44px; width: auto; }
    .patient-report .report-meta { text-align: right; font-size: 12px; color: #6B7280; }
    .patient-report .report-patient-name { font-weight: 600; color: #374151; }
    .patient-report .report-section { display: block; margin: 0; padding: 0; }
    .patient-report .report-title { font-size: 20px; font-weight: 700; color: #1F3A5C; margin-bottom: 4px; }
    .patient-report h2 { font-size: 16px; font-weight: 700; color: #1F3A5C; margin-top: 26px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #E5E7EB; }
    .report-terms { margin: 0 0 22px; padding: 11px 0 13px; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; }
    .report-terms h2 { margin: 0 0 9px; padding: 0; border: 0; font-size: 13px; }
    .report-terms-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 20px; margin: 0; }
    .report-term { display: flex; flex-direction: column; gap: 2px; break-inside: avoid; }
    .report-term dt { margin: 0; color: #1F3A5C; font-size: 10.5px; font-weight: 700; line-height: 1.4; }
    .report-term dd { margin: 0; color: #526173; font-size: 10px; line-height: 1.45; }
    .report-summary-card { margin: 0 0 22px; padding: 13px 15px; background: #eef3f8; border: 1px solid #cbd5e1; border-radius: 6px; }
    .report-summary-finding { margin: 0; color: #1a2b42; font-size: 14px; line-height: 1.58; }
    .report-summary-next-step { margin: 8px 0 0; color: #1a2b42; font-size: 13px; line-height: 1.55; }
    .report-summary-next-step strong { color: #1F3A5C; }
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
    .phenotype-item { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 18px; }
    .phenotype-icon { font-size: 18px; color: #1F3A5C; flex-shrink: 0; margin-top: 2px; }
    .treatment-group-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-top: 16px; margin-bottom: 6px; }
    .rec-item { padding: 7px 0; border-bottom: 1px solid #f3f4f6; }
    .checklist-item { display: flex; gap: 6px; align-items: flex-start; margin-bottom: 6px; }
    .checklist-box { flex-shrink: 0; width: 14px; height: 14px; border: 2px solid #9ca3af; border-radius: 2px; margin-top: 3px; }
    .checklist-group { margin-bottom: 10px; }
    .checklist-group:last-child { margin-bottom: 0; }
    .checklist-group-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-top: 16px; margin-bottom: 4px; }
    .checklist-group-label:first-of-type { margin-top: 0; }
    .checklist-group-subtitle { font-size: 11px; color: #9ca3af; margin-top: 0; margin-bottom: 6px; font-style: italic; }
    .whatif-item { background: #f0f9ff; border: 1px solid #bfd0e2; padding: 10px 12px; margin-bottom: 10px; border-radius: 6px; }
    .cpap-context-box { background: #fef3c7; border: 1px solid #e0b84f; padding: 12px 14px; margin-bottom: 15px; border-radius: 6px; font-size: 13px; }
    .comisa-callout { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 14px; margin-bottom: 15px; border-radius: 6px; font-size: 13px; }
    .risk-summary { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 14px; margin: 13px 0 17px; color: #334155; }
    .report-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #6B7280; text-align: center; }

    /* Care pathway bar */
    .care-pathway { margin: 0 0 22px; padding: 12px 16px; background: #f8fafc; border: 1px solid #E5E7EB; border-radius: 8px; }
    .pathway-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-bottom: 8px; }
    .pathway-steps { display: flex; align-items: center; justify-content: center; gap: 3px 0; flex-wrap: wrap; }
    .pathway-step { display: flex; align-items: center; gap: 4px; white-space: nowrap; font-size: 11px; font-weight: 500; padding: 3px 6px; border-radius: 16px; }
    .pathway-icon { font-size: 9px; line-height: 1; }
    .pathway-completed { color: #1F3A5C; }
    .pathway-completed .pathway-icon { color: #22c55e; }
    .pathway-active { background: #1F3A5C; color: #fff; font-weight: 600; }
    .pathway-active .pathway-icon { color: #fff; }
    .pathway-upcoming { color: #6B7280; }
    .pathway-upcoming .pathway-icon { color: #94A3B8; }
    .pathway-line { display: inline-block; width: 14px; height: 2px; background: #E5E7EB; flex-shrink: 1; min-width: 6px; }

    /* Care summary card */
    .care-summary-card { background: #f0f2f6; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
    .care-summary-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #6B7280; margin-bottom: 4px; }
    .pdf-section-continuation { margin: 0 0 14px; color: #6B7280; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    /* Each semantic unit participates in normal document rhythm. Flow-root keeps
       child margins measurable by the paginator instead of collapsing outside
       the unit. Only the first unit on a new page loses its top margin. */
    .pdf-page-unit { display: flow-root; overflow: visible; }
    .patient-report > .pdf-page-unit:first-child > :first-child { margin-top: 0 !important; }

    /* Applied only when the normal-density paginator would leave a sparse final
       page and a modest density change can remove that page. This is bounded,
       print-only compaction—not a fixed two-page rule. */
    .patient-report.pdf-report-compact { font-size: 12.25px; line-height: 1.5; }
    .patient-report.pdf-report-compact .report-header { margin-bottom: 8px; padding-bottom: 8px; }
    .patient-report.pdf-report-compact .report-logo { height: 40px; }
    .patient-report.pdf-report-compact h2 { margin-top: 10px; margin-bottom: 7px; }
    .patient-report.pdf-report-compact .report-terms { margin-bottom: 8px; padding: 6px 0 8px; }
    .patient-report.pdf-report-compact .report-terms h2 { margin-bottom: 7px; }
    .patient-report.pdf-report-compact .report-terms-list { gap: 6px 18px; }
    .patient-report.pdf-report-compact .report-term { gap: 1px; }
    .patient-report.pdf-report-compact .report-term dt { font-size: 10px; line-height: 1.3; }
    .patient-report.pdf-report-compact .report-term dd { font-size: 9.5px; line-height: 1.35; }
    .patient-report.pdf-report-compact .report-summary-card { margin-bottom: 8px; padding: 10px 13px; }
    .patient-report.pdf-report-compact .care-pathway { margin-bottom: 8px; padding: 9px 14px; }
    .patient-report.pdf-report-compact .care-summary-card { margin-bottom: 18px; padding: 10px 14px; }
    .patient-report.pdf-report-compact .ahi-scale { margin: 9px 0; }
    .patient-report.pdf-report-compact .phenotype-item { margin-bottom: 12px; }
    .patient-report.pdf-report-compact .treatment-group-label { margin-top: 12px; margin-bottom: 4px; }
    .patient-report.pdf-report-compact .rec-item { padding: 5px 0; }
    .patient-report.pdf-report-compact .cpap-context-box,
    .patient-report.pdf-report-compact .comisa-callout { padding: 10px 12px; margin-bottom: 12px; }
    .patient-report.pdf-report-compact .checklist-item { margin-bottom: 5px; }
    .patient-report.pdf-report-compact .report-disclaimer { margin-top: 16px !important; padding-top: 8px !important; }

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
    const structuredBlocks = container.querySelectorAll(
      '.report-header, .report-section, .report-terms, .report-term, .report-summary-card, .care-pathway, .care-summary-card, .ahi-scale, ' +
      '.cpap-context-box, .comisa-callout, .phenotype-item, .rec-item, .checklist-group, .checklist-item, .whatif-item, .report-footer'
    );
    const flowBlocks = container.querySelectorAll(
      'h2, h3, .treatment-group-label, .checklist-group-label, .checklist-group-subtitle, table, p, ul, ol'
    );
    const containerTop = container.getBoundingClientRect().top;
    const points = [0];

    structuredBlocks.forEach(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      const marginTop = parseFloat(styles.marginTop || '0') || 0;
      const marginBottom = parseFloat(styles.marginBottom || '0') || 0;
      const topY = Math.max(
        0,
        Math.round(((rect.top - containerTop) - marginTop) * canvasScale)
      );
      const bottomY = Math.max(
        0,
        Math.round(((rect.bottom - containerTop) + marginBottom) * canvasScale)
      );
      points.push(topY, bottomY);
    });

    flowBlocks.forEach(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      const marginBottom = parseFloat(styles.marginBottom || '0') || 0;
      const bottomY = Math.max(
        0,
        Math.round(((rect.bottom - containerTop) + marginBottom) * canvasScale)
      );
      points.push(bottomY);
    });

    return [...new Set(points)]
      .filter(point => Number.isFinite(point))
      .sort((a, b) => a - b);
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

  function createPdfRenderShell() {
    const shell = document.createElement('div');
    shell.style.cssText = "width:800px; background:white; padding:40px; font-family:'Inter','Segoe UI',system-ui,sans-serif;";
    const style = document.createElement('style');
    style.textContent = PDF_STYLES;
    shell.appendChild(style);
    return shell;
  }

  function createPatientPageShell(sourceRoot, densityClass = '') {
    const shell = createPdfRenderShell();
    const report = document.createElement('div');
    report.className = sourceRoot.className;
    if (densityClass) report.classList.add(densityClass);
    report.style.cssText = 'margin:0; padding:0; max-width:none; background:transparent;';
    if (sourceRoot.hasAttribute('data-patient-name')) {
      report.setAttribute('data-patient-name', sourceRoot.getAttribute('data-patient-name') || '');
    }
    if (sourceRoot.hasAttribute('data-report-date')) {
      report.setAttribute('data-report-date', sourceRoot.getAttribute('data-report-date') || '');
    }
    shell.appendChild(report);
    return { shell, report };
  }

  function buildPatientPageUnit(nodes, sectionLabel = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-unit';
    if (sectionLabel) wrapper.setAttribute('data-pdf-section-label', sectionLabel);
    nodes.forEach(node => wrapper.appendChild(node.cloneNode(true)));
    return wrapper;
  }

  function collectPatientReportUnits(reportRoot) {
    const units = [];
    const topLevel = [...reportRoot.children];

    topLevel.forEach(section => {
      if (!(section instanceof HTMLElement) || !section.matches('.report-section')) {
        units.push(buildPatientPageUnit([section]));
        return;
      }

      const children = [...section.children];
      const sectionLabel = section.querySelector(':scope > h2')?.textContent?.trim() || '';
      const makeUnit = nodes => buildPatientPageUnit(nodes, sectionLabel);
      let i = 0;
      while (i < children.length) {
        const child = children[i];
        if (!(child instanceof HTMLElement)) {
          units.push(makeUnit([child]));
          i++;
          continue;
        }

        if (child.matches('h2, h3')) {
          const nodes = [child];
          const trailingUnits = [];
          if (children[i + 1] instanceof HTMLElement && children[i + 1].matches('.cpap-context-box')) {
            nodes.push(children[i + 1]);
            i++;
          }
          if (children[i + 1] instanceof HTMLElement && children[i + 1].matches('.ahi-summary-block')) {
            const summaryBlock = children[i + 1];
            const summaryChildren = [...summaryBlock.children].filter(node => node instanceof HTMLElement);
            /* A new-results explanation may contain two narrative paragraphs
               plus the severity scale. If that complete block does not fit at
               the foot of page one, keep the heading with the first explanatory
               paragraph and allow the severity paragraph plus scale to follow
               as one semantic unit. Short returning-patient summaries stay whole. */
            if (summaryChildren.length >= 3) {
              nodes.push(summaryChildren[0]);
              trailingUnits.push(makeUnit(summaryChildren.slice(1)));
            } else {
              nodes.push(summaryBlock);
            }
            i++;
          }
          if (children[i + 1] instanceof HTMLElement && children[i + 1].matches('p')) {
            nodes.push(children[i + 1]);
            i++;
            /* Keep the section heading with its introductory paragraph, but
               allow each contributor card to paginate independently. Bundling
               the first full contributor card here can force a premature page
               break and leave three half-empty pages even when the report fits
               comfortably on two. */
            if (
              children[i + 1] instanceof HTMLElement &&
              children[i + 1].matches('.checklist-group')
            ) {
              const checklistGroup = children[i + 1];
              const checklistItems = [...checklistGroup.children].filter(item =>
                item instanceof HTMLElement && item.matches('.checklist-item')
              );
              if (checklistItems.length > 1 && checklistItems.length === checklistGroup.children.length) {
                const firstGroup = checklistGroup.cloneNode(false);
                firstGroup.appendChild(checklistItems[0].cloneNode(true));
                nodes.push(firstGroup);
                checklistItems.slice(1).forEach(item => {
                  const continuationGroup = checklistGroup.cloneNode(false);
                  continuationGroup.appendChild(item.cloneNode(true));
                  trailingUnits.push(makeUnit([continuationGroup]));
                });
              } else {
                nodes.push(checklistGroup);
              }
              i++;
            }
            if (
              children[i + 1] instanceof HTMLElement &&
              children[i + 1].matches('.whatif-item')
            ) {
              nodes.push(children[i + 1]);
              i++;
            }
          }
          if (children[i + 1] instanceof HTMLElement && children[i + 1].matches('.comisa-callout')) {
            nodes.push(children[i + 1]);
            i++;
          }
          units.push(makeUnit(nodes));
          trailingUnits.forEach(unit => units.push(unit));
          i++;
          continue;
        }

        if (child.matches('.treatment-group-label') && children[i + 1] instanceof HTMLElement && children[i + 1].matches('.rec-item')) {
          const nodes = [child];
          i++;
          if (children[i] instanceof HTMLElement && children[i].matches('.rec-item')) {
            nodes.push(children[i]);
            i++;
          }
          /* Keep the label with its first recommendation, then let subsequent
             recommendations paginate as semantic units. Keeping an entire
             conditional or prerequisite group together created half-empty
             pages for otherwise ordinary multi-option reports. */
          units.push(makeUnit(nodes));
          continue;
        }

        units.push(makeUnit([child]));
        i++;
      }
    });

    // Keep the closing clinical-risk note and disclaimer together so the report
    // cannot end with an orphaned disclaimer or a nearly empty final page.
    if (units.length >= 2) {
      const last = units[units.length - 1];
      const previous = units[units.length - 2];
      if (last.querySelector('.report-disclaimer') && previous.textContent.includes('Why This Matters')) {
        [...last.children].forEach(child => previous.appendChild(child.cloneNode(true)));
        units.pop();
      }
    }

    return units;
  }

  function measurePatientPagination(reportRoot, units, measureHost, pageFitLimit, densityClass = '') {
    const measure = createPatientPageShell(reportRoot, densityClass);
    measureHost.appendChild(measure.shell);
    const shellChrome = Math.ceil(measure.shell.getBoundingClientRect().height);
    const clones = units.map(unit => {
      const clone = unit.cloneNode(true);
      measure.report.appendChild(clone);
      return clone;
    });

    const reportTop = measure.report.getBoundingClientRect().top;
    const tops = clones.map(clone => clone.getBoundingClientRect().top - reportTop);
    const bottoms = clones.map(clone => clone.getBoundingClientRect().bottom - reportTop);
    measureHost.removeChild(measure.shell);

    const contentLimit = Math.max(1, pageFitLimit - shellChrome);
    const groups = [];
    let group = [];
    let groupStartIndex = 0;
    let pageStartTop = 0;
    units.forEach((unit, index) => {
      if (group.length && (bottoms[index] - pageStartTop) > contentLimit) {
        groups.push({ units: group, startIndex: groupStartIndex, endIndex: index - 1 });
        group = [];
        groupStartIndex = index;
        pageStartTop = tops[index];
      }
      group.push(unit);
    });
    if (group.length) {
      groups.push({ units: group, startIndex: groupStartIndex, endIndex: units.length - 1 });
    }

    const fills = groups.map(groupInfo => {
      const height = bottoms[groupInfo.endIndex] - tops[groupInfo.startIndex];
      return Math.max(0, Math.min(1, height / contentLimit));
    });
    return { groups, fills, densityClass, tops, bottoms, contentLimit };
  }

  function rebalanceSparsePatientTail(plan) {
    if (!plan || plan.groups.length < 2) return plan;
    const groups = plan.groups.map(group => ({ ...group, units: [...group.units] }));
    const fills = [...plan.fills];
    const lastIndex = groups.length - 1;
    const tail = groups[lastIndex];
    const previous = groups[lastIndex - 1];

    /* When a report genuinely needs multiple pages, avoid a greedy split that
       leaves the last page looking accidental. Shift whole semantic units from
       the prior page until the tail is useful, while keeping both pages under
       capacity and the prior page at least 42% full. */
    while (fills[lastIndex] < 0.5 && previous.units.length > 1) {
      const movedIndex = previous.endIndex;
      const previousEnd = movedIndex - 1;
      const prospectivePreviousFill = previousEnd >= previous.startIndex
        ? (plan.bottoms[previousEnd] - plan.tops[previous.startIndex]) / plan.contentLimit
        : 0;
      const prospectiveTailFill =
        (plan.bottoms[tail.endIndex] - plan.tops[movedIndex]) / plan.contentLimit;
      if (prospectivePreviousFill < 0.42 || prospectiveTailFill > 1) break;

      const moved = previous.units.pop();
      previous.endIndex = previousEnd;
      tail.units.unshift(moved);
      tail.startIndex = movedIndex;
      fills[lastIndex - 1] = prospectivePreviousFill;
      fills[lastIndex] = prospectiveTailFill;
    }

    return { ...plan, groups, fills };
  }

  function measureIsolatedPatientUnits(reportRoot, units, measureHost, densityClass = '') {
    const measure = createPatientPageShell(reportRoot, densityClass);
    units.forEach(unit => measure.report.appendChild(unit.cloneNode(true)));
    measureHost.appendChild(measure.shell);
    const height = Math.ceil(measure.shell.getBoundingClientRect().height);
    measureHost.removeChild(measure.shell);
    return height;
  }

  function mergePatientPagesThatActuallyFit(reportRoot, plan, measureHost, pageFitLimit) {
    if (!plan || plan.groups.length < 2) return plan;
    const groups = plan.groups.map(group => ({ ...group, units: [...group.units] }));

    /* The greedy pass measures units in one continuous document. A heading or
       label that later becomes the first unit on a page loses its top margin in
       the real page shell, so two neighboring groups can occasionally fit even
       though the continuous-flow estimate said they did not. Re-measure
       adjacent groups in an isolated page shell and merge only when the exact
       rendered height fits. Working from the tail first removes underfilled
       continuation pages without pulling the report opening out of balance. */
    let changed = true;
    while (changed && groups.length > 1) {
      changed = false;
      for (let index = groups.length - 2; index >= 0; index--) {
        const combinedUnits = [...groups[index].units, ...groups[index + 1].units];
        const combinedHeight = measureIsolatedPatientUnits(
          reportRoot,
          combinedUnits,
          measureHost,
          plan.densityClass
        );
        if (combinedHeight > pageFitLimit) continue;

        groups.splice(index, 2, {
          units: combinedUnits,
          startIndex: groups[index].startIndex,
          endIndex: groups[index + 1].endIndex,
        });
        changed = true;
        break;
      }
    }

    return { ...plan, groups };
  }

  function patientPageBreakPenalty(plan) {
    if (!plan || plan.groups.length < 2) return 0;
    return plan.groups.slice(1).reduce((penalty, groupInfo) => {
      const firstUnit = groupInfo.units[0];
      if (!firstUnit) return penalty;

      /* The severity scale explains the AHI paragraph immediately before it.
         Starting a page with the scale makes the reader look backward for its
         meaning and leaves an unnecessarily sparse prior page. This is a soft
         preference, not a hard keep-together rule, so very long summaries can
         still paginate naturally. */
      if (firstUnit.querySelector('.ahi-scale')) return penalty + 4;
      return penalty;
    }, 0);
  }

  function patientSparsePageScore(plan) {
    if (!plan || !plan.fills.length) return 0;
    return plan.fills.reduce((score, fill) => score + Math.max(0, 0.5 - fill), 0);
  }

  function paginatePatientReport(reportRoot, pageCssHeight) {
    const units = collectPatientReportUnits(reportRoot);
    const measureHost = document.createElement('div');
    measureHost.style.cssText = 'position:absolute; left:-9999px; top:0;';
    document.body.appendChild(measureHost);
    /* pageCssHeight already excludes the PDF footer and margins. Keep only a
       small rounding cushion here. The previous extra 24px reserve duplicated
       that safety margin on every page and routinely turned a two-page report
       into three half-empty pages. */
    const pageFitLimit = Math.max(1, pageCssHeight - 4);

    try {
      const normalPlan = measurePatientPagination(reportRoot, units, measureHost, pageFitLimit);
      let chosenPlan = normalPlan;
      const lastFill = normalPlan.fills[normalPlan.fills.length - 1] || 1;
      const normalSparseScore = patientSparsePageScore(normalPlan);

      /* Only try denser typography when the normal plan produces a genuinely
         sparse tail. Accept compact mode only when it removes a page; longer
         reports keep normal type and as many pages as their content requires. */
      if (normalPlan.groups.length > 1 && (lastFill < 0.42 || normalSparseScore > 0)) {
        const compactPlan = measurePatientPagination(
          reportRoot,
          units,
          measureHost,
          pageFitLimit,
          'pdf-report-compact'
        );
        const compactImprovesBalance = compactPlan.groups.length === normalPlan.groups.length &&
          patientPageBreakPenalty(compactPlan) <= patientPageBreakPenalty(normalPlan) &&
          patientSparsePageScore(compactPlan) + 0.04 < normalSparseScore;
        if (compactPlan.groups.length < normalPlan.groups.length || compactImprovesBalance) {
          chosenPlan = compactPlan;
        }
      }

      /* A modest density adjustment may improve a clinically linked page
         break even when the report still needs the same number of pages. Use
         it only when it removes a known comprehension break, such as placing
         the AHI scale on the page after its explanation. */
      if (chosenPlan === normalPlan && normalPlan.groups.length > 1) {
        const normalPenalty = patientPageBreakPenalty(normalPlan);
        if (normalPenalty > 0) {
          const compactPlan = measurePatientPagination(
            reportRoot,
            units,
            measureHost,
            pageFitLimit,
            'pdf-report-compact'
          );
          if (
            compactPlan.groups.length <= normalPlan.groups.length &&
            patientPageBreakPenalty(compactPlan) < normalPenalty
          ) {
            chosenPlan = compactPlan;
          }
        }
      }

      chosenPlan = rebalanceSparsePatientTail(chosenPlan);
      chosenPlan = mergePatientPagesThatActuallyFit(
        reportRoot,
        chosenPlan,
        measureHost,
        pageFitLimit
      );

      // ── Build the real page shells from the assignment ──
      const pages = chosenPlan.groups.map((groupInfo, pageIndex) => {
        const page = createPatientPageShell(reportRoot, chosenPlan.densityClass);
        const firstLabel = groupInfo.units[0]?.getAttribute('data-pdf-section-label') || '';
        const previousGroup = chosenPlan.groups[pageIndex - 1];
        const previousLabel = previousGroup?.units[previousGroup.units.length - 1]
          ?.getAttribute('data-pdf-section-label') || '';
        if (pageIndex > 0 && firstLabel && firstLabel === previousLabel) {
          const continuation = document.createElement('div');
          continuation.className = 'pdf-section-continuation';
          continuation.textContent = `${firstLabel} (continued)`;
          page.report.appendChild(continuation);
        }
        groupInfo.units.forEach(unit => page.report.appendChild(unit.cloneNode(true)));
        return page.shell;
      });

      return pages.length ? pages : [createPatientPageShell(reportRoot).shell];
    } finally {
      document.body.removeChild(measureHost);
    }
  }

  async function renderShellToCanvas(shell, renderHost, canvasScale) {
    renderHost.appendChild(shell);
    try {
      const shellWidth = Math.ceil(shell.scrollWidth || shell.clientWidth || 800);
      return await html2canvas(shell, {
        scale: canvasScale,
        useCORS: true,
        logging: false,
        width: shellWidth,
        windowWidth: shellWidth,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.href || '';
            if (href.includes('fonts.googleapis') || href.includes('fonts.gstatic')) return;
            link.remove();
          });
        }
      });
    } finally {
      renderHost.removeChild(shell);
    }
  }

  /* Keep the visual rendering pixel-faithful while adding selectable/searchable
     text underneath the page image. The image covers this white text completely;
     assistive tools and EHR indexers can still extract it. Full PDF/UA tagging is
     not supported by the current jsPDF/html2canvas stack. */
  function normalizeSearchablePdfText(value) {
    return String(value || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u2265/g, '>=')
      .replace(/\u2264/g, '<=')
      .replace(/\u00d7/g, 'x')
      .replace(/\u00b1/g, '+/-')
      .replace(/\u2192/g, '->')
      .replace(/\u00b7/g, '-')
      .replace(/\u00a0/g, ' ');
  }

  function addSearchableTextLayer(pdf, shell, margin, usableWidth, usableHeight) {
    const report = shell.querySelector('.patient-report');
    if (!report) return;
    const chunks = [];
    const blockSelector = 'h1, h2, h3, p, li, dt, dd, .report-header, .report-terms, .report-term, .report-summary-card, .care-summary-card, .care-pathway, .pathway-title, .pathway-step, .ahi-scale-zone, .ahi-zone-label, .ahi-zone-range, .ahi-scale-marker, .phenotype-item, .treatment-group-label, .rec-item, .cpap-context-box, .comisa-callout, .risk-summary, .checklist-item, .report-disclaimer, .pdf-section-continuation';
    const walk = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        chunks.push(node.nodeValue || '');
        return;
      }
      if (!(node instanceof HTMLElement) || node.matches('img, .bi, .pathway-icon')) return;
      const block = node.matches(blockSelector);
      if (block) chunks.push('\n');
      [...node.childNodes].forEach(walk);
      if (block) chunks.push('\n');
    };
    walk(report);
    const text = normalizeSearchablePdfText(chunks.join(''))
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!text) return;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(255, 255, 255);
    const lines = pdf.splitTextToSize(text, usableWidth);
    const lineHeightMm = 1.8;
    const maxLines = Math.max(1, Math.floor((usableHeight - 4) / lineHeightMm));
    pdf.text(lines.slice(0, maxLines), margin, margin + 3, { lineHeightFactor: 1.02 });
  }

  function finalizePdf(pdf, filename, download) {
    const result = {
      filename,
      pageCount: pdf.getNumberOfPages(),
    };
    if (download) {
      pdf.save(filename);
      return result;
    }
    return Object.assign(result, { dataUri: pdf.output('datauristring') });
  }

  async function exportFromHTML(html, filename, addFooter = false, footerDate = null, download = true) {
    if (window.OSALibs && window.OSALibs.loadPdfExport) {
      try { await window.OSALibs.loadPdfExport(); } catch (e) { /* fall through to the guard below */ }
    }
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
      // 1.5× keeps text crisp while cutting raster memory ~44% vs 2× — matters
      // most for the clinician PDF, which rasterizes the full report height.
      const canvasScale = 1.5;
      const { jsPDF } = jspdf;
      const pdf = new jsPDF('p', 'mm', 'letter');
      pdf.setProperties({
        title: 'Capital ENT Sleep Report',
        subject: 'Patient sleep evaluation and treatment summary',
        author: 'Capital ENT & Sinus Center',
        creator: 'Capital ENT Precision Sleep Clinical Hub',
      });
      if (typeof pdf.setLanguage === 'function') pdf.setLanguage('en-US');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const footerMargin = addFooter ? 8 : 0;  // Reserve space for footer text
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2 - footerMargin;
      const patientReportRoot = container.querySelector('.patient-report');

      if (patientReportRoot) {
        const sizingPage = createPatientPageShell(patientReportRoot);
        container.appendChild(sizingPage.shell);
        const pageShellWidth = Math.ceil(sizingPage.shell.scrollWidth || sizingPage.shell.clientWidth || 800);
        container.removeChild(sizingPage.shell);

        const pageCssHeight = Math.floor(usableHeight * (pageShellWidth / usableWidth));
        const patientPages = paginatePatientReport(patientReportRoot, pageCssHeight);

        for (let i = 0; i < patientPages.length; i++) {
          if (i > 0) pdf.addPage();
          const pageCanvas = await renderShellToCanvas(patientPages[i], container, canvasScale);
          const pxPerMm = pageCanvas.width / usableWidth;
          const destH = pageCanvas.height / pxPerMm;
          const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
          // Establish an opaque page background before the hidden text layer.
          // Some PDF renderers otherwise treat the unused page area as transparent.
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          addSearchableTextLayer(pdf, patientPages[i], margin, usableWidth, usableHeight);
          pdf.addImage(pageImg, 'JPEG', margin, margin, usableWidth, destH);

          if (addFooter) {
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            const footerText = 'Prepared by Capital ENT \u00B7 ' + formatPdfDate(footerDate) + ` \u00B7 Page ${i + 1} of ${patientPages.length}`;
            pdf.text(footerText, pageWidth / 2, pageHeight - 6, { align: 'center' });
          }
        }

        return finalizePdf(pdf, filename, download);
      }

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

      // Scale factor: how many canvas pixels per mm of PDF
      const pxPerMm = canvas.width / usableWidth;
      const pageHeightPx = Math.floor(usableHeight * pxPerMm);

      let srcY = 0;  // current position in canvas pixels
      let pageNum = 0;

      while (srcY < canvas.height) {
        if (pageNum > 0) pdf.addPage();

        // Find the ideal cut point for this page
        const idealEnd = Math.min(canvas.height, srcY + pageHeightPx);
        let cutY;

        if (idealEnd >= canvas.height) {
          // Last page — take everything remaining
          cutY = canvas.height;
        } else {
          // Find best break point near the ideal end
          cutY = bestBreak(breakPoints, idealEnd, srcY);
        }

        const startY = Math.max(0, Math.floor(srcY));
        const endY = Math.min(canvas.height, Math.max(startY + 1, Math.round(cutY)));
        const sliceH = endY - startY;
        if (sliceH <= 0) break;  // safety

        // Create a cropped canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext('2d');
        // Fill white background to avoid JPEG compression artifacts on partial pages
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, startY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

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

        srcY = endY;
        pageNum++;
      }

      return finalizePdf(pdf, filename, download);
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
  function exportPatientReportPDF(options = {}) {
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
    clone.removeAttribute('contenteditable');
    clone.removeAttribute('role');
    clone.removeAttribute('aria-label');
    clone.removeAttribute('aria-multiline');
    clone.removeAttribute('spellcheck');

    const patientName = clone.getAttribute('data-patient-name') ||
      clone.querySelector('.report-patient-name')?.textContent ||
      'Patient';
    const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const dateStr = clone.getAttribute('data-report-date') || new Date().toISOString().split('T')[0];
    const filename = `Sleep_Report_${safeName}_${dateStr}.pdf`;

    return exportFromHTML(clone.outerHTML, filename, true, dateStr, options.download !== false);
  }

  return { exportClinicianPDF, exportPatientReportPDF };
})();
