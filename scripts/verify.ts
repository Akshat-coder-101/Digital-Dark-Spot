import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  phase: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  details: string;
  durationMs: number;
}

const results: CheckResult[] = [];

function runCommand(name: string, phase: string, cmd: string): void {
  const start = Date.now();
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    const durationMs = Date.now() - start;
    results.push({
      name,
      phase,
      status: 'PASS',
      details: output.split('\n').filter(Boolean).pop()?.trim() || 'Completed successfully',
      durationMs
    });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const stderr = err.stderr || err.stdout || err.message;
    const lastLine = stderr.split('\n').filter(Boolean).pop()?.trim() || 'Command failed';
    results.push({
      name,
      phase,
      status: 'FAIL',
      details: lastLine.slice(0, 80),
      durationMs
    });
  }
}

function skipCheck(name: string, phase: string, reason: string): void {
  results.push({
    name,
    phase,
    status: 'SKIPPED',
    details: reason,
    durationMs: 0
  });
}

console.log('\n================================================================');
console.log('            DIGITAL DARK SPOT — VERIFICATION SUITE             ');
console.log('================================================================\n');

// 1. Backend Core Unit Tests
runCommand('backend_tests', 'Phase 0/1', 'npx tsx backend/test/test-hackathon-scenarios.ts');

// 2. Evaluation Suite
runCommand('evaluation', 'Phase 0/3', 'npx tsx backend/scripts/eval.ts');

// 3. Secrets Scan
runCommand('secrets_scan', 'Phase 0/8', 'npx tsx backend/scripts/check-secrets.ts');

// 4. Frontend Typecheck and Build
runCommand('frontend_typecheck_and_build', 'Phase 0/4', 'npm --prefix frontend run build');

// 5. Ban-List Scan (Phase 1)
const banListScript = path.join(process.cwd(), 'scripts', 'ban-list-scan.ts');
if (fs.existsSync(banListScript)) {
  runCommand('ban_list_scan', 'Phase 1', `npx tsx ${banListScript}`);
} else {
  skipCheck('ban_list_scan', 'Phase 1', 'Not yet reached (Phase 1 implementation)');
}

// 6. Fixture Validator (Phase 3)
const fixtureScript = path.join(process.cwd(), 'scripts', 'validate-fixtures.ts');
if (fs.existsSync(fixtureScript)) {
  runCommand('fixture_validator', 'Phase 3', `npx tsx ${fixtureScript}`);
} else {
  skipCheck('fixture_validator', 'Phase 3', 'Not yet reached (Phase 3 implementation)');
}

// 7. Route Test (Phase 4)
const routeScript = path.join(process.cwd(), 'backend', 'test', 'test-routes.ts');
if (fs.existsSync(routeScript)) {
  runCommand('route_test', 'Phase 4', `npx tsx ${routeScript}`);
} else {
  skipCheck('route_test', 'Phase 4', 'Not yet reached (Phase 4 implementation)');
}

// 8. PDF Phase Tests (Phase 6, Optional)
const pdfScript = path.join(process.cwd(), 'backend', 'test', 'test-pdf.ts');
if (fs.existsSync(pdfScript)) {
  runCommand('pdf_tests', 'Phase 6', `npx tsx ${pdfScript}`);
} else {
  skipCheck('pdf_tests', 'Phase 6', 'Not yet reached (Optional Phase 6)');
}

// Print Results Table
console.log('\n┌──────────────────────────────┬──────────┬──────────┬───────────┬────────────────────────────────────────────────────┐');
console.log('│ Check                        │ Phase    │ Status   │ Time (ms) │ Details                                            │');
console.log('├──────────────────────────────┼──────────┼──────────┼───────────┼────────────────────────────────────────────────────┤');

let anyFailed = false;
for (const r of results) {
  if (r.status === 'FAIL') anyFailed = true;
  const statusFormatted = r.status === 'PASS' ? '✅ PASS  ' : r.status === 'FAIL' ? '❌ FAIL  ' : '⏭️  SKIP  ';
  const nameCol = r.name.padEnd(28).slice(0, 28);
  const phaseCol = r.phase.padEnd(8).slice(0, 8);
  const timeCol = String(r.durationMs).padStart(9).slice(0, 9);
  const detailsCol = r.details.padEnd(50).slice(0, 50);
  console.log(`│ ${nameCol} │ ${phaseCol} │ ${statusFormatted} │ ${timeCol} │ ${detailsCol} │`);
}
console.log('└──────────────────────────────┴──────────┴──────────┴───────────┴────────────────────────────────────────────────────┘\n');

if (anyFailed) {
  console.error('❌ Verification FAILED on one or more checks.\n');
  process.exit(1);
} else {
  console.log('✅ Verification PASSED cleanly!\n');
  process.exit(0);
}
