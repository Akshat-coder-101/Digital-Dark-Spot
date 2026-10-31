import fs from 'fs';
import path from 'path';

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

const counts: Record<string, { count: number; matches: string[] }> = {};

for (const file of clientFiles) {
  if (file.endsWith('index.css')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = [
    ...(content.match(hexRegex) || []),
    ...(content.match(rgbRegex) || []),
    ...(content.match(hslRegex) || [])
  ];
  if (matches.length > 0) {
    counts[path.relative(process.cwd(), file)] = {
      count: matches.length,
      matches: Array.from(new Set(matches))
    };
  }
}

console.log(JSON.stringify(counts, null, 2));

