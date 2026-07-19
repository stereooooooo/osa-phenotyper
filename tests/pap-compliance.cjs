const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console, Date });
vm.runInContext(`${fs.readFileSync(path.join(root, 'js/config.js'), 'utf8')}\n;globalThis.OSA_CONFIG = OSA_CONFIG;`, context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/pap-report-parser.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/pap-compliance.js'), 'utf8'), context);

const assistant = context.PapComplianceAssistant;
const parser = context.PapReportParser;
const thresholds = context.OSA_CONFIG.thresholds.papCompliance;
let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed += 1;
}

function includes(items, phrase) {
  return items.some(item => String(item).toLowerCase().includes(phrase.toLowerCase()));
}

// 1. Comfortable, all-night ResMed use with low leak and low device event index.
const stable = assistant.analyze({
  papManufacturer: 'resmed', papReportDays: 30, papNightsUsed: 29,
  papNightsFourHours: 28, papAverageUseHours: 7.1, papUsualSleepHours: 7.4,
  papDeviceAhi: 1.8, papDeviceCai: 0.2, papDeviceOai: 1.1,
  papLeakValue: 8, papLeakMetric: 'p95', papMaskType: 'nasal',
  papPersistentSymptoms: 'no', papNewCvdEvent: 'no',
}, {}, thresholds);
assert(stable.status === 'stable', 'Stable therapy should not be escalated.');
assert(includes(stable.recommendations, 'routine repeat sleep testing is not indicated'), 'Stable therapy should suppress routine retesting.');
assert(stable.derived.fourHourPct === 93, 'Four-hour percentage should be calculated.');

// 2. High leak plus elevated residual events: fix leak before interpreting efficacy.
const leakFirst = assistant.analyze({
  papManufacturer: 'resmed', papReportDays: 30, papNightsUsed: 30,
  papNightsFourHours: 29, papAverageUseHours: 7, papUsualSleepHours: 7.2,
  papDeviceAhi: 12, papDeviceCai: 0.5, papDeviceOai: 10,
  papLeakValue: 42, papLeakMetric: 'p95', papMaskType: 'full-face',
  papPersistentSymptoms: 'yes',
}, {}, thresholds);
assert(leakFirst.derived.leakState === 'concern', 'High ResMed full-face leak should be flagged.');
assert(includes(leakFirst.recommendations, 'address mask seal'), 'Leak correction should be recommended first.');
assert(includes(leakFirst.recommendations, 'after leak correction'), 'Elevated events should be reassessed after leak correction.');

// 3. Device looks effective while treatment covers only part of the sleep period.
const partialNight = assistant.analyze({
  papManufacturer: 'resmed', papReportDays: 30, papNightsUsed: 25,
  papNightsFourHours: 10, papAverageUseHours: 3.8, papUsualSleepHours: 7.5,
  papDeviceAhi: 2.4, papLeakValue: 5, papLeakMetric: 'p95', papMaskType: 'nasal',
  papPersistentSymptoms: 'no',
}, {}, thresholds);
assert(partialNight.derived.partialNight === true, 'Average use should be compared with usual sleep duration.');
assert(partialNight.status === 'review', 'Partial-night therapy should require review despite low device AHI.');
assert(includes(partialNight.recommendations, 'during all sleep'), 'Guidance should target all-night use.');

// 4. Persistent symptoms despite low device index: prevent false reassurance.
const discordant = assistant.analyze({
  papManufacturer: 'resmed', papReportDays: 30, papNightsUsed: 30,
  papNightsFourHours: 30, papAverageUseHours: 7.4, papUsualSleepHours: 7.5,
  papDeviceAhi: 2.1, papLeakValue: 4, papLeakMetric: 'p95', papMaskType: 'nasal',
  papPersistentSymptoms: 'yes',
}, {}, thresholds);
assert(discordant.status === 'review', 'Persistent symptoms should override a falsely reassuring device index.');
assert(discordant.classifications.some(item => item.state === 'discordant'), 'Symptom-download discordance should be explicit.');
assert(includes(discordant.recommendations, 'independent on-therapy assessment'), 'Independent assessment should be considered, not automatically ordered.');

// 5. Early central-event signal with heart failure and missing LVEF.
const central = assistant.analyze({
  papManufacturer: 'resmed', papReportDays: 30, papNightsUsed: 29,
  papNightsFourHours: 28, papAverageUseHours: 6.8, papUsualSleepHours: 7,
  papDeviceAhi: 13, papDeviceCai: 8, papDeviceOai: 2,
  papLeakValue: 6, papLeakMetric: 'p95', papMaskType: 'nasal',
  papPeriodicBreathingPct: 7, papTherapyStartDate: '2026-06-20', papPersistentSymptoms: 'yes',
}, { heartFailure: true, lvef: '', now: '2026-07-19T12:00:00Z' }, thresholds);
assert(central.derived.centralConcern === true, 'Device central index at least 5 should trigger review.');
assert(includes(central.recommendations, 'do not reflexively increase pressure'), 'Central signals should block reflex pressure escalation.');
assert(includes(central.recommendations, 'numeric LVEF'), 'Missing LVEF should be requested when central-directed therapy may be considered.');
assert(includes(central.cautions, 'first weeks to months'), 'Early treatment-emergent central context should be explained without a rigid delay.');

// Vendor boundaries: do not apply ResMed numeric leak thresholds to another vendor.
const otherVendor = assistant.analyze({
  papManufacturer: 'fisher-paykel', papLeakValue: 30, papLeakMetric: 'p95',
  papDeviceAhi: 3, papPersistentSymptoms: 'no',
}, {}, thresholds);
assert(otherVendor.derived.leakState === 'unknown', 'Non-ResMed leak should remain vendor-specific without a report flag.');

// Initial ResMed AirView parser fixture.
const parsed = parser.parseText(`
  ResMed AirView AirSense 11 AutoSet Serial number 12345
  Report period 06/20/2026 - 07/19/2026
  Usage days 29/30 days (97%)
  >= 4 hours 28 days (93%)
  Average usage (days used) 6 hours 48 minutes
  Pressure - cmH2O Median: 8.2 95th percentile: 10.8 Maximum: 11.8
  Leaks - L/min Median: 1.0 95th percentile: 8.4 Maximum: 14.0
  Events per hour AI: 1.6 HI: 0.4 AHI: 2.0
  Apnea Index Central: 0.3 Obstructive: 1.2 Unknown: 0.1
  Cheyne-Stokes respiration 0 minutes (0%)
`);
const values = Object.fromEntries(parsed.fields.map(field => [field.name, field.value]));
assert(values.papManufacturer === 'resmed', 'Parser should detect ResMed.');
assert(values.papReportDays === '30' && values.papNightsUsed === '29', 'Parser should extract usage numerator and denominator.');
assert(values.papAverageUseHours === '6.8', 'Parser should convert average use to decimal hours.');
assert(values.papDeviceAhi === '2.0' && values.papDeviceCai === '0.3', 'Parser should extract event indices.');
assert(values.papLeakValue === '8.4' && values.papPressure95 === '10.8', 'Parser should keep leak and pressure sections separate.');

process.stdout.write(String(passed));
