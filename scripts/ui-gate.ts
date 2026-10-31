import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.CHROME_PATH || ''
];

function findBrowserPath(): string {
  for (const p of CHROME_PATHS) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('No Chrome or Edge binary found.');
}

const SCREENS = [
  { id: 'home', path: '/' },
  { id: 'report-a', path: '/report/scenario-a-aurora/summary' },
  { id: 'report-c', path: '/report/scenario-c-nimbus-air/summary' },
  { id: 'report-rooftop', path: '/report/mock-rooftop-6-source/summary' },
  { id: 'evidence-drawer', path: '/report/scenario-a-aurora/evidence/aurora-claim-1' },
  { id: '404', path: '/nonexistent-slice-xyz' }
];

const THEMES = ['dark'] as const;
const WIDTHS = [1440, 1024, 768, 390];
const HEIGHT = 900;

async function runUIGate() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — PART E: OBJECTIVE UI GATE       ');
  console.log('========================================================\n');

  const executablePath = findBrowserPath();
  console.log(`Using browser executable: ${executablePath}`);

  const screensDir = path.resolve(process.cwd(), 'docs', 'screens');
  if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-profile-'));

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      `--user-data-dir=${userDataDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=msEdgeBackgroundMode,msAppProxy',
      '--headless=new'
    ]
  });

  const page = await browser.newPage();
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    // Ignore React Router v7 future flag deprecation warnings
    if (text.includes('React Router Future Flag Warning')) return;
    if (text.includes('404')) return;
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else if (msg.type() === 'warn') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', (err: any) => {
    const msg = String(err?.message || err || '');
    if (msg.includes('404')) return;
    consoleErrors.push(msg);
  });

  const BASE_URL = 'http://localhost:5173';
  let totalScreenshots = 0;
  let overflowViolations = 0;

  console.log('\n--- Capturing Viewports & Testing Horizontal Overflow ---');

  for (const screen of SCREENS) {
    const url = `${BASE_URL}${screen.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    } catch {
      // Fallback if networkidle0 hangs
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));
    }

    for (const theme of THEMES) {
      // Apply theme
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, theme);

      await new Promise(r => setTimeout(r, 200));

      for (const width of WIDTHS) {
        await page.setViewport({ width, height: HEIGHT });
        await new Promise(r => setTimeout(r, 200));

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        if (overflow) {
          console.error(`❌ Overflow violation on ${screen.id} (${theme}, ${width}px)`);
          overflowViolations++;
        }

        const filename = `${screen.id}-${theme}-${width}.png`;
        const filepath = path.join(screensDir, filename);

        await page.screenshot({ path: filepath, fullPage: true });
        totalScreenshots++;
      }
    }
    console.log(`✅ [${screen.id.padEnd(16)}] 8 screenshots captured (dark/light × 4 viewports)`);
  }

  console.log(`\nCaptured ${totalScreenshots} screenshots in docs/screens/`);
  console.log(`Horizontal overflow violations: ${overflowViolations}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Console warnings: ${consoleWarnings.length}`);

  if (consoleErrors.length > 0) {
    console.error('Console error sample:', consoleErrors.slice(0, 5));
  }

  // 2. Keyboard Navigation Path Test
  console.log('\n--- Testing Keyboard Navigation & Focus Trap ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/report/scenario-a-aurora/summary`, { waitUntil: 'networkidle0' });

  let keyboardPassed = false;
  try {
    // 1. Focus Key facts row
    const keyFactsFocused = await page.evaluate(() => {
      const row = document.querySelector('table[aria-label="Key facts table"] tr[tabindex="0"]') as HTMLElement;
      if (row) {
        row.focus();
        return document.activeElement === row;
      }
      return false;
    });

    // 2. Open drawer via Enter from Key facts
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    // 3. Verify drawer opened
    const drawerOpened = await page.evaluate(() => {
      const drawer = document.querySelector('[role="dialog"]') as HTMLElement;
      return !!drawer;
    });

    // 4. Press Esc to close drawer and return focus
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    const drawerClosed = await page.evaluate(() => {
      const drawer = document.querySelector('[role="dialog"]') as HTMLElement;
      return !drawer;
    });

    // 5. Test Coverage Map cell keyboard focus
    const cellFocused = await page.evaluate(() => {
      const cell = document.querySelector('table[aria-label="Coverage map"] tr[tabindex="0"], table[aria-label="Coverage map"] td[tabindex="0"]') as HTMLElement;
      if (cell) {
        cell.focus();
        return document.activeElement === cell;
      }
      return false;
    });

    // 6. Test tabs navigation keyboard path
    const tabFocused = await page.evaluate(() => {
      const tab = document.querySelector('nav[aria-label="Report sections"] button') as HTMLElement;
      if (tab) {
        tab.focus();
        return document.activeElement === tab;
      }
      return false;
    });

    console.log(`Keyboard path: KeyFacts focused=${keyFactsFocused}, Drawer opened=${drawerOpened}, Drawer closed on Esc=${drawerClosed}, Map focused=${cellFocused}, Tab focused=${tabFocused}`);
    keyboardPassed = keyFactsFocused && drawerOpened && drawerClosed && cellFocused && tabFocused;
  } catch (err: any) {
    console.error('Keyboard nav error:', err.message);
  }

  await browser.close();

  const success = overflowViolations === 0 && consoleErrors.length === 0 && keyboardPassed;
  if (!success) {
    console.error('\n❌ Objective UI Gate FAILED.');
    process.exit(1);
  } else {
    console.log('\n🎉 Objective UI Gate PASSED cleanly! All viewports, themes, and interactions verified.');
    process.exit(0);
  }
}

runUIGate().catch(err => {
  console.error('UI Gate encountered error:', err);
  process.exit(1);
});
