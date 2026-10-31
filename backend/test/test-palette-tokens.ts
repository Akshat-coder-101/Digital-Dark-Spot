import fs from 'fs';
import path from 'path';

function getLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrast(c1: string, c2: string): number {
  const l1 = getLuminance(c1);
  const l2 = getLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — PALETTE & TOKEN VERIFIER       ');
console.log('========================================================\n');

// 1. Contrast Ratios Verification
const dark = {
  bg: '#0A0B0F',
  surface: '#11131A',
  surface2: '#171A24',
  border: '#232838',
  text: '#ECEEF4',
  textMuted: '#9AA1B5',
  structure: '#2F5BFF',
  structureText: '#7C9BFF',
  signal: '#C6F432',
  signalInk: '#0A0B0F',
  conflict: '#FFB020',
  gap: '#FF5C8A',
  stale: '#8A92AD'
};

const light = {
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  surface2: '#EEF0F7',
  border: '#DDE1EC',
  text: '#0A0B0F',
  textMuted: '#4A5168',
  structure: '#1F46E5',
  structureText: '#1F46E5',
  signal: '#C6F432',
  signalInk: '#0A0B0F',
  conflict: '#FFB020',
  gap: '#D6246E',
  stale: '#5F6785'
};

const contrastChecks = [
  // Dark theme checks (standard text/pairs >= 4.5, focus ring >= 3.0)
  { name: 'Dark: text on bg', ratio: getContrast(dark.text, dark.bg), min: 4.5 },
  { name: 'Dark: muted on bg', ratio: getContrast(dark.textMuted, dark.bg), min: 4.5 },
  { name: 'Dark: structure-text on bg', ratio: getContrast(dark.structureText, dark.bg), min: 4.5 },
  { name: 'Dark: signal-ink on signal', ratio: getContrast(dark.signalInk, dark.signal), min: 4.5 },
  { name: 'Dark: gap on bg', ratio: getContrast(dark.gap, dark.bg), min: 4.5 },
  { name: 'Dark: stale on bg', ratio: getContrast(dark.stale, dark.bg), min: 4.5 },
  { name: 'Dark: conflict on bg', ratio: getContrast(dark.conflict, dark.bg), min: 4.5 },
  { name: 'Dark: focus ring (structureText on bg)', ratio: getContrast(dark.structureText, dark.bg), min: 3.0 },

  // Light theme checks
  { name: 'Light: text on bg', ratio: getContrast(light.text, light.bg), min: 4.5 },
  { name: 'Light: muted on bg', ratio: getContrast(light.textMuted, light.bg), min: 4.5 },
  { name: 'Light: structure on bg', ratio: getContrast(light.structure, light.bg), min: 4.5 },
  { name: 'Light: structure-text on bg', ratio: getContrast(light.structureText, light.bg), min: 4.5 },
  { name: 'Light: signal-ink on signal', ratio: getContrast(light.signalInk, light.signal), min: 4.5 },
  { name: 'Light: gap on bg', ratio: getContrast(light.gap, light.bg), min: 4.5 },
  { name: 'Light: stale on bg', ratio: getContrast(light.stale, light.bg), min: 4.5 },
  { name: 'Light: text on conflict', ratio: getContrast(light.text, light.conflict), min: 4.5 },
  { name: 'Light: focus ring (structure on bg)', ratio: getContrast(light.structure, light.bg), min: 3.0 },
];

let contrastFailures = 0;
console.log('--- Contrast Checks (WCAG AA) ---');
for (const check of contrastChecks) {
  const pass = check.ratio >= check.min;
  if (!pass) contrastFailures++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${check.name.padEnd(40)}: ${check.ratio.toFixed(2)}:1 (min ${check.min}:1)`);
}

// 2. Scan client source files for forbidden raw color literals
// Rules: No hex, rgb( or hsl( literals in client source outside index.css and SVG using currentColor
console.log('\n--- Client Source Color Literal Audit ---');
function walk(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        walk(full, fileList);
      }
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      fileList.push(full);
    }
  }
  return fileList;
}

const clientDir = path.resolve(process.cwd(), 'frontend', 'src');
const clientFiles = walk(clientDir);

const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const rgbRegex = /rgba?\([^)]+\)/g;
const hslRegex = /hsla?\([^)]+\)/g;

let literalViolations: { file: string; match: string }[] = [];

for (const file of clientFiles) {
  // Allow tokens file: index.css
  if (file.endsWith('index.css')) continue;

  const content = fs.readFileSync(file, 'utf8');
  
  // Find all hex literals
  const hexMatches = content.match(hexRegex) || [];
  for (const match of hexMatches) {
    literalViolations.push({ file: path.relative(process.cwd(), file), match });
  }

  // Find all rgb/rgba
  const rgbMatches = content.match(rgbRegex) || [];
  for (const match of rgbMatches) {
    literalViolations.push({ file: path.relative(process.cwd(), file), match });
  }

  // Find all hsl/hsla
  const hslMatches = content.match(hslRegex) || [];
  for (const match of hslMatches) {
    literalViolations.push({ file: path.relative(process.cwd(), file), match });
  }
}

console.log(`Found ${literalViolations.length} color literal violations in client source outside index.css.`);
if (literalViolations.length > 0) {
  console.log('Sample violations:');
  literalViolations.slice(0, 10).forEach(v => console.log(`  ${v.file}: ${v.match}`));
}

if (contrastFailures > 0 || literalViolations.length > 0) {
  console.error(`\n❌ Palette test FAILED: ${contrastFailures} contrast failures, ${literalViolations.length} literal violations.`);
  process.exit(1);
} else {
  console.log('\n✅ All contrast ratios and token literal checks PASSED cleanly!');
  process.exit(0);
}

