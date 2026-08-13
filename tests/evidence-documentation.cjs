const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let assertions = 0;

function check(condition, message) {
  if (!condition) throw new Error(message);
  assertions += 1;
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  check(fs.existsSync(absolutePath), `Missing evidence artifact: ${relativePath}`);
  return fs.readFileSync(absolutePath, 'utf8');
}

const evidence = read('docs/evidence-basis.md');
const citations = read('docs/citations.md');
const reviewLog = read('docs/evidence-review-log.md');
const rationale = read('docs/scientific-rationale-and-decision-logic.md');
const phase2Research = read('docs/research/comisa-hypoxemia-weight-primary-sources.md');
const agents = read('AGENTS.md');
const claude = read('CLAUDE.md');
const intakeLambda = read('infrastructure/lambda/intake.mjs');

const logicIds = [...evidence.matchAll(/\|\s*((?:DX|PH|TX|SAF)-\d{2})\s*\|/g)].map(match => match[1]);
const uniqueLogicIds = new Set(logicIds);
check(logicIds.length >= 16, 'Core evidence register unexpectedly lost Logic ID rows.');
check(uniqueLogicIds.size === logicIds.length, 'Core evidence register contains duplicate Logic IDs.');

const loggedLogicIds = [...reviewLog.matchAll(/\b(?:DX|PH|TX|SAF)-\d{2}\b/g)].map(match => match[0]);
check(loggedLogicIds.length > 0, 'Evidence review log does not reference any Logic IDs.');
loggedLogicIds.forEach(id => check(uniqueLogicIds.has(id), `Evidence review log references unknown Logic ID ${id}.`));

check(evidence.includes('Living pre-validation evidence register'), 'Evidence register must state its pre-validation status.');
check(evidence.includes('not a completed systematic review'), 'Evidence register must distinguish itself from a systematic review.');
check(evidence.includes('Prospective validation data requirements'), 'Evidence register must retain the prospective validation requirements.');
check(citations.includes('[`evidence-basis.md`](evidence-basis.md)'), 'Citation library must link to the evidence register.');
check(citations.includes('[`evidence-review-log.md`](evidence-review-log.md)'), 'Citation library must link to the review log.');
check(rationale.includes('## Decision area 5: insomnia plus OSA (COMISA)'), 'Scientific rationale must explain COMISA decisions.');
check(rationale.includes('## Decision area 6: conventional nocturnal hypoxemia and event-linked hypoxic burden'), 'Scientific rationale must separate oxygen constructs.');
check(rationale.includes('## Decision area 7: weight management and tirzepatide'), 'Scientific rationale must explain weight and tirzepatide decisions.');
check(phase2Research.includes('COMISA should remain an operational screen'), 'Phase 2 source review must preserve COMISA as a screen.');
check(phase2Research.includes('Hypoxic burden is prognostic observational evidence, not a validated treatment-allocation rule'), 'Phase 2 source review must prohibit HB treatment allocation.');
check(phase2Research.includes('Zepbound is FDA indicated for moderate-to-severe OSA in adults with obesity'), 'Phase 2 source review must preserve the labeled Zepbound OSA population.');
check(reviewLog.includes('ER-2026-08-13-COMISA-HYPOXEMIA-WEIGHT'), 'Review log must record the targeted phase 2 review.');
check(citations.includes('10.1007/s11325-019-01860-0'), 'Conventional hypoxemia citation must retain the verified Labarca DOI.');
check(citations.includes('10.1093/eurheartj/ehv624'), 'Conventional hypoxemia citation must retain the verified Oldenburg DOI.');
check(
  /historyAnswer === 'unsure'[\s\S]{0,180}formData\.cvdUnsure = 'on'/.test(intakeLambda),
  'Uncertain patient cardiovascular history must remain visible as an unresolved chart safety flag.'
);

for (const [name, contents] of [['AGENTS.md', agents], ['CLAUDE.md', claude]]) {
  for (const requiredPath of ['docs/evidence-basis.md', 'docs/citations.md', 'docs/evidence-review-log.md']) {
    check(contents.includes(requiredPath), `${name} must require maintenance of ${requiredPath}.`);
  }
  check(contents.includes('an AI summary is not evidence'), `${name} must require primary-source verification.`);
  check(contents.includes('Maintenance of all three evidence documents is a release requirement'), `${name} must make evidence maintenance a release gate.`);
  check(contents.includes('must not be deployed'), `${name} must block deployment of undocumented clinical changes.`);
  check(contents.includes('Literature surveillance'), `${name} must require logging no-change evidence reviews.`);
}

for (const relativePath of ['README.md', 'docs/evidence-basis.md', 'docs/evidence-review-log.md', 'docs/citations.md']) {
  const contents = read(relativePath);
  for (const match of contents.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    const target = path.resolve(root, path.dirname(relativePath), href.split('#')[0]);
    check(fs.existsSync(target), `${relativePath} contains a broken local link: ${href}`);
  }
}

console.log(assertions);
