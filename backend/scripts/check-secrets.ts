import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — SECRET LEAK AUDITOR            ');
console.log('========================================================\n');

// Secret signature patterns for known AI & search providers
const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'Google Gemini Token (AQ...)', regex: /AQ\.[A-Za-z0-9_-]{30,}/g },
  { name: 'Google API Key (AIzaSy...)', regex: /AIzaSy[A-Za-z0-9_-]{33}/g },
  { name: 'Groq API Key (gsk_...)', regex: /gsk_[A-Za-z0-9]{30,}/g },
  { name: 'OpenAI API Key (sk-...)', regex: /sk-(?!ant-)[A-Za-z0-9]{32,}/g },
  { name: 'Anthropic API Key (sk-ant-...)', regex: /sk-ant-[A-Za-z0-9_-]{30,}/g },
  { name: 'Tavily API Key (tvly-...)', regex: /tvly-[A-Za-z0-9_-]{20,}/g },
  { name: 'Brave API Key (BS...)', regex: /\bBS[A-Za-z0-9_-]{25,}\b/g }
];

const IGNORED_PATHS = [
  '.env',
  '.env.local',
  '.env.example',
  'check-secrets.ts',
  'node_modules',
  '.git',
  '.system_generated'
];

const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf'];

let leaksFound = 0;

try {
  // 1. Get tracked files from git
  const trackedFilesOutput = execSync('git ls-files', { encoding: 'utf-8' });
  const files = trackedFilesOutput.split(/\r?\n/).filter(f => f.trim().length > 0);

  console.log(`Scanning ${files.length} tracked files in repository...\n`);

  for (const relativeFile of files) {
    // Skip binary files and self
    if (IGNORED_PATHS.some(ignored => relativeFile.includes(ignored))) continue;
    if (BINARY_EXTENSIONS.some(ext => relativeFile.endsWith(ext))) continue;

    if (!fs.existsSync(relativeFile)) continue;
    const content = fs.readFileSync(relativeFile, 'utf-8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, lineIdx) => {
      // Skip commented-out examples or instructions that explicitly say "sk-..." placeholder
      if (line.includes('your-key-here') || line.includes('sk-ant-...')) return;

      for (const pattern of SECRET_PATTERNS) {
        // Reset lastIndex for global regex
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(line);
        if (match) {
          const secret = match[0];
          const masked = `${secret.slice(0, 4)}...${secret.slice(-3)}`;
          console.error(`❌ [SECRET LEAK] ${pattern.name} found in "${relativeFile}" at line ${lineIdx + 1}: ${masked}`);
          leaksFound++;
        }
      }
    });
  }
} catch (err: any) {
  console.error('Error running git secret scanner:', err.message);
  process.exit(1);
}

console.log('\n────────────────────────────────────────────────────────');
if (leaksFound > 0) {
  console.error(`💥 FAILURE: ${leaksFound} secret leak(s) detected in tracked codebase!`);
  console.error('Remove unmasked secrets immediately before deploying or committing.');
  process.exit(1);
} else {
  console.log('✅ PASS: 0 secret leaks detected across all tracked files.');
  console.log('🍉 Secret check clean!\n');
  process.exit(0);
}
