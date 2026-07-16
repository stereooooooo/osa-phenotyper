const fs = require('fs');
const path = require('path');
const vm = require('vm');
const originalLog = console.log;
const originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
console.log = originalLog;
console.warn = originalWarn;

const repoRoot = path.resolve(__dirname, '..');
const parserSource = fs.readFileSync(path.join(repoRoot, 'js', 'pdf-parser.js'), 'utf8');
const context = vm.createContext({
  console,
  pdfjsLib,
  window: {},
  document: { addEventListener() {} },
});
vm.runInContext(`${parserSource}\nglobalThis.__watchPatParser = WatchPATParser;`, context);

(async () => {
  const buffer = fs.readFileSync(path.join(repoRoot, 'WatchPATReport.pdf'));
  const file = {
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  };
  const parsed = await context.__watchPatParser.parse(file);
  const remPercent = parsed.fields.find(field => field.name === 'remPercent');
  if (!remPercent || remPercent.value !== '23.1' || remPercent.confidence !== 'high') {
    throw new Error(`Expected high-confidence REM sleep percentage 23.1, got ${JSON.stringify(remPercent)}`);
  }
  process.stdout.write('1\n');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
