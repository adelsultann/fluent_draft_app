/**
 * Responsive UI QA — Screenshot capture script
 *
 * Takes full-page screenshots of key pages at 5 viewport widths:
 * 375, 390, 768, 1024, 1440
 *
 * Usage: npx playwright test --config= playwright.config.ts
 *   or:  npx tsx scripts/capture-responsive-screenshots.ts
 *   or:  node scripts/capture-responsive-screenshots.mjs
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { name: 'mobile-sm', width: 375, height: 812 },
  { name: 'mobile-md', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop-sm', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

const PAGES = [
  '/demo',
  '/demo/start',
  '/signup',
  '/login',
  '/onboarding',
];

const OUT_DIR = path.join('docs', 'qa', 'screenshots');

(async () => {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    for (const pagePath of PAGES) {
      const safeName = (pagePath.replace(/\//g, '-').replace(/^-/, '') || 'home');
      const filePath = path.join(OUT_DIR, `${safeName}-${vp.name}.png`);

      try {
        await page.goto(`http://localhost:3000${pagePath}`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });
        // Clear localStorage to avoid demo state conflicts
        await page.evaluate(() => localStorage.clear());
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`  OK  ${safeName} @ ${vp.name} (${vp.width}x${vp.height})`);
      } catch (err) {
        console.log(`  SKIP ${safeName} @ ${vp.name}: ${err.message.split('\n')[0]}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nDone. ${PAGES.length * VIEWPORTS.length} screenshots attempted.`);
  console.log(`Output: ${OUT_DIR}/`);
})();
