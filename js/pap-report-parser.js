/* Clinician PAP compliance report parser.
 * Initial supported layout: ResMed AirView compliance and therapy reports.
 * Parsing is client-side. No source PDF or raw extracted text is stored.
 */
(function exposePapReportParser(global) {
  'use strict';

  const FIELDS = [
    { name: 'papManufacturer', label: 'Manufacturer', type: 'select' },
    { name: 'papReportModel', label: 'Device / model', type: 'text' },
    { name: 'papMode', label: 'PAP mode', type: 'select' },
    { name: 'papReportEndDate', label: 'Report end date', type: 'date' },
    { name: 'papReportDays', label: 'Report days', type: 'number' },
    { name: 'papNightsUsed', label: 'Nights used', type: 'number' },
    { name: 'papNightsFourHours', label: 'Nights at least 4 hours', type: 'number' },
    { name: 'papAverageUseHours', label: 'Average use, hours', type: 'number' },
    { name: 'papDeviceAhi', label: 'Device-reported event index', type: 'number' },
    { name: 'papDeviceCai', label: 'Device-reported central index', type: 'number' },
    { name: 'papDeviceOai', label: 'Device-reported obstructive index', type: 'number' },
    { name: 'papPressure95', label: '95th percentile pressure', type: 'number' },
    { name: 'papLeakValue', label: '95th percentile leak', type: 'number' },
    { name: 'papLeakMetric', label: 'Leak metric', type: 'select' },
    { name: 'papPeriodicBreathingPct', label: 'Periodic breathing / CSR', type: 'number' },
  ];

  function add(results, name, value, confidence = 'high') {
    if (value === null || value === undefined || value === '') return;
    const meta = FIELDS.find(field => field.name === name);
    if (!meta || results.some(field => field.name === name)) return;
    results.push({ ...meta, value: String(value), confidence });
  }

  function decimalHours(hours, minutes) {
    const h = Number(hours || 0);
    const m = Number(minutes || 0);
    return (h + (m / 60)).toFixed(1);
  }

  function toIsoDate(month, day, year) {
    const fullYear = String(year).length === 2 ? Number(`20${year}`) : Number(year);
    const date = new Date(Date.UTC(fullYear, Number(month) - 1, Number(day)));
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  function section(text, startPattern, endPattern) {
    const start = text.search(startPattern);
    if (start < 0) return '';
    const tail = text.slice(start);
    const end = endPattern ? tail.slice(1).search(endPattern) : -1;
    return end >= 0 ? tail.slice(0, end + 1) : tail.slice(0, 1000);
  }

  function parseText(rawText) {
    const text = String(rawText || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
    const results = [];

    if (/resmed|airview|airsense|aircurve/i.test(text)) add(results, 'papManufacturer', 'resmed');
    else if (/dreamstation|respironics|philips/i.test(text)) add(results, 'papManufacturer', 'philips', 'medium');
    else if (/fisher\s*(?:&|and)\s*paykel|sleepstyle/i.test(text)) add(results, 'papManufacturer', 'fisher-paykel', 'medium');
    else if (/löwenstein|loewenstein|prisma/i.test(text)) add(results, 'papManufacturer', 'lowenstein', 'medium');
    else if (/devilbiss|intellipap/i.test(text)) add(results, 'papManufacturer', 'devilbiss', 'medium');

    const modelMatch = text.match(/\b((?:AirSense|AirCurve)\s+(?:10|11)\s+[A-Za-z][A-Za-z0-9 ]{0,30}?)(?=\s+(?:Serial|Device|Mode|Therapy|Report|Usage)|[\r\n]|$)/i);
    if (modelMatch) add(results, 'papReportModel', modelMatch[1].trim().replace(/\s+/g, ' '));

    if (/\bAutoSet\b|\bAPAP\b|Min(?:imum)?\s+Pressure[\s:]+[\d.]+[\s\S]{0,120}Max(?:imum)?\s+Pressure/i.test(text)) {
      add(results, 'papMode', 'APAP', 'medium');
    } else if (/\b(?:BiLevel|BiPAP|VPAP|VAuto)\b/i.test(text)) {
      add(results, 'papMode', 'BiPAP', 'medium');
    } else if (/\bCPAP\b|Set\s+Pressure/i.test(text)) {
      add(results, 'papMode', 'CPAP', 'medium');
    }

    const periodMatch = text.match(/(?:Report\s+(?:period|range)|Data\s+date\s+range|Date\s+range)?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\s*(?:-|to|through)\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/i);
    if (periodMatch) add(results, 'papReportEndDate', toIsoDate(periodMatch[4], periodMatch[5], periodMatch[6]), 'medium');

    const usageDays = text.match(/Usage\s+days\s+(\d+)\s*\/\s*(\d+)\s+days?/i);
    if (usageDays) {
      add(results, 'papNightsUsed', usageDays[1]);
      add(results, 'papReportDays', usageDays[2]);
    }

    const fourHours = text.match(/(?:>=|≥|&gt;=)\s*4\s*hours?\s+(\d+)\s+days?/i) ||
      text.match(/Days?\s+(?:with|at least)\s+(?:>=|≥)?\s*4\s*hours?\s*[:]?\s*(\d+)/i);
    if (fourHours) add(results, 'papNightsFourHours', fourHours[1]);

    const averageUse = text.match(/Average\s+usage\s*\((?:days\s+used|used\s+days)\)\s*(\d+)\s*hours?\s*(\d+)?\s*minutes?/i) ||
      text.match(/Average\s+(?:daily\s+)?usage\s*[:]?\s*(\d+)\s*(?:h|hours?)\s*(\d+)?\s*(?:m|minutes?)?/i);
    if (averageUse) add(results, 'papAverageUseHours', decimalHours(averageUse[1], averageUse[2]));

    const eventSection = section(text, /Events?\s+per\s+hour|Therapy\s+efficacy|AHI/i, /Leaks?|Pressure|Usage/);
    const ahiMatch = eventSection.match(/\bAHI\s*[:]?\s*([\d.]+)/i) || text.match(/\bAHI\s*[:]?\s*([\d.]+)/i);
    if (ahiMatch) add(results, 'papDeviceAhi', ahiMatch[1]);
    const centralMatch = eventSection.match(/\bCentral(?:\s+AI|\s+index)?\s*[:]?\s*([\d.]+)/i) || text.match(/\bCentral(?:\s+AI|\s+index)?\s*[:]?\s*([\d.]+)/i);
    if (centralMatch) add(results, 'papDeviceCai', centralMatch[1]);
    const obstructiveMatch = eventSection.match(/\bObstructive(?:\s+AI|\s+index)?\s*[:]?\s*([\d.]+)/i) || text.match(/\bObstructive(?:\s+AI|\s+index)?\s*[:]?\s*([\d.]+)/i);
    if (obstructiveMatch) add(results, 'papDeviceOai', obstructiveMatch[1]);

    const leakSection = section(text, /Leaks?\s*(?:-|:)?\s*(?:L\/min)?/i, /Events?\s+per\s+hour|Pressure|Usage/);
    const leak95 = leakSection.match(/95th\s+percentile\s*[:]?\s*([\d.]+)/i);
    if (leak95) {
      add(results, 'papLeakValue', leak95[1]);
      add(results, 'papLeakMetric', 'p95');
    }

    const pressureSection = section(text, /Pressure\s*(?:-|:)?\s*(?:cmH2O|cmH₂O)?/i, /Leaks?|Events?\s+per\s+hour|Usage/);
    const pressure95 = pressureSection.match(/95th\s+percentile\s*[:]?\s*([\d.]+)/i);
    if (pressure95) add(results, 'papPressure95', pressure95[1]);

    const periodicMatch = text.match(/(?:Cheyne[- ]Stokes\s+respiration|Periodic\s+breathing)[^%\r\n]{0,80}\(?\s*([\d.]+)\s*%/i);
    if (periodicMatch) add(results, 'papPeriodicBreathingPct', periodicMatch[1], 'medium');

    const found = new Set(results.map(field => field.name));
    return {
      fields: results,
      notFound: FIELDS.filter(field => !found.has(field.name)).map(field => field.label),
    };
  }

  async function extractPageText(page) {
    const content = await page.getTextContent();
    const items = content.items.filter(item => String(item.str || '').trim());
    const rows = [];
    items.forEach(item => {
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      let row = rows.find(candidate => Math.abs(candidate.y - y) < 3);
      if (!row) { row = { y, items: [] }; rows.push(row); }
      row.items.push({ x, str: item.str });
    });
    rows.sort((a, b) => b.y - a.y);
    return rows.map(row => {
      row.items.sort((a, b) => a.x - b.x);
      return row.items.map(item => item.str).join(' ');
    }).join('\n');
  }

  async function parse(file) {
    if (global.OSALibs?.loadPdfParsing) await global.OSALibs.loadPdfParsing();
    if (typeof global.pdfjsLib === 'undefined') throw new Error('PDF parsing library is unavailable.');
    const pdf = await global.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      pages.push(await extractPageText(await pdf.getPage(pageNumber)));
    }
    return parseText(pages.join('\n'));
  }

  global.PapReportParser = Object.freeze({ FIELDS, parse, parseText });
})(typeof window !== 'undefined' ? window : globalThis);
