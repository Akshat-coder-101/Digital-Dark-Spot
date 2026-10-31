import fs from 'fs';
import path from 'path';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — DOMAIN BAN-LIST SCANNER         ');
console.log('========================================================\n');

const BANNED_PATTERNS = [
  'scholarship',
  'eligibility',
  'renewal',
  'marksheet',
  'income limit',
  'award amount',
  'subsidy',
  'laptop',
  'nsp'
];

const BANNED_REGEX = new RegExp(`\\b(${BANNED_PATTERNS.join('|')})\\b`, 'i');

// Explicit allow-list for paths that are sample scenarios or fixtures
const ALLOWED_PATH_PATTERNS = [
  /sampleData\.ts$/,
  /fixtures[\\/]/,
  /\.json$/,
  /node_modules/,
  /dist/,
  /\.git/
];

function isAllowed(filePath: string): boolean {
  return ALLOWED_PATH_PATTERNS.some(re => re.test(filePath));
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!isAllowed(fullPath)) {
        scanDirectory(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !isAllowed(fullPath)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

const rootDir = process.cwd();
const targets = [
  path.join(rootDir, 'backend', 'src'),
  path.join(rootDir, 'frontend', 'src')
];

let filesToScan: string[] = [];
for (const t of targets) {
  filesToScan = filesToScan.concat(scanDirectory(t));
}

console.log(`Scanning ${filesToScan.length} non-fixture source files for banned domain terms...`);

interface Violation {
  file: string;
  line: number;
  word: string;
  content: string;
}

const violations: Violation[] = [];

for (const filePath of filesToScan) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(BANNED_REGEX);
    if (match) {
      violations.push({
        file: path.relative(rootDir, filePath),
        line: i + 1,
        word: match[0],
        content: line.trim()
      });
    }
  }
}

if (violations.length > 0) {
  console.error(`\n❌ [FAIL] Found ${violations.length} banned domain vocabulary violation(s):`);
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} matched "${v.word}": ${v.content.slice(0, 80)}`);
  }
  process.exit(1);
} else {
  console.log(`\n🎉 [PASS] All ${filesToScan.length} non-fixture source files are clean of banned domain vocabulary!`);
  console.log('🍉 Ban-list verification completed successfully.\n');
  process.exit(0);
}

