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
const agents = read('AGENTS.md');
const claude = read('CLAUDE.md');

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

for (const [name, contents] of [['AGENTS.md', agents], ['CLAUDE.md', claude]]) {
  for (const requiredPath of ['docs/evidence-basis.md', 'docs/citations.md', 'docs/evidence-review-log.md']) {
    check(contents.includes(requiredPath), `${name} must require maintenance of ${requiredPath}.`);
  }
  check(contents.includes('an AI summary is not evidence'), `${name} must require primary-source verification.`);
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
