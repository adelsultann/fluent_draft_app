# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo-exit.spec.ts >> Demo exit warning >> does not show exit warning at the very start (no progress yet)
- Location: tests\e2e\demo-exit.spec.ts:65:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/demo", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * E2E — Anonymous demo exit warning
  3  |  *
  4  |  * Covers:
  5  |  *   1. Start the fixed demo lesson.
  6  |  *   2. Progress partway through.
  7  |  *   3. Attempt to exit midway.
  8  |  *   4. See the warning that score/progress will be lost unless the user signs up.
  9  |  *
  10 |  * All state is client-side (localStorage) — no Supabase required.
  11 |  *
  12 |  * Related docs:
  13 |  *   - docs/testing-strategy.md § End-To-End Tests
  14 |  *   - docs/tasks-and-acceptance-criteria.md § Step 50
  15 |  */
  16 | 
  17 | import { test, expect } from '@playwright/test';
  18 | 
  19 | test.describe('Demo exit warning', () => {
  20 |   test.beforeEach(async ({ page }) => {
> 21 |     await page.goto('/demo');
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  22 |     await page.evaluate(() => localStorage.clear());
  23 |     await page.reload();
  24 |   });
  25 | 
  26 |   test('shows exit warning when leaving midway through the demo', async ({ page }) => {
  27 |     // 1. Start the demo.
  28 |     await page.getByRole('link', { name: /start demo lesson/i }).click();
  29 |     await page.waitForURL('/demo/start');
  30 |     await expect(page.locator('text=Understand the Scenario')).toBeVisible();
  31 | 
  32 |     // 2. Progress into the Practice phase (midway).
  33 |     await page.getByRole('button', { name: /start practice/i }).click();
  34 |     await expect(page.locator('text=Practice Chunks')).toBeVisible();
  35 | 
  36 |     // 3. Click "← Back to demo" to trigger the exit warning.
  37 |     await page.getByRole('button', { name: /back to demo/i }).click();
  38 | 
  39 |     // 4. Verify the exit modal appears with the right content.
  40 |     const modal = page.getByRole('dialog');
  41 |     await expect(modal).toBeVisible();
  42 |     await expect(modal.locator('text=Leave demo?')).toBeVisible();
  43 |     await expect(
  44 |       modal.locator('text=not be saved permanently'),
  45 |     ).toBeVisible();
  46 | 
  47 |     // 5. Verify three options are present.
  48 |     await expect(
  49 |       page.getByRole('button', { name: /keep practicing/i }),
  50 |     ).toBeVisible();
  51 |     await expect(
  52 |       page.getByRole('button', { name: /leave anyway/i }),
  53 |     ).toBeVisible();
  54 |     await expect(
  55 |       page.getByRole('button', { name: /sign up to save/i }),
  56 |     ).toBeVisible();
  57 | 
  58 |     // 6. "Keep practicing" dismisses the modal and keeps us on the practice page.
  59 |     await page.getByRole('button', { name: /keep practicing/i }).click();
  60 |     await expect(modal).not.toBeVisible();
  61 |     // Still on the demo practice page.
  62 |     await expect(page.locator('text=Practice Chunks')).toBeVisible();
  63 |   });
  64 | 
  65 |   test('does not show exit warning at the very start (no progress yet)', async ({ page }) => {
  66 |     // 1. Start the demo.
  67 |     await page.getByRole('link', { name: /start demo lesson/i }).click();
  68 |     await page.waitForURL('/demo/start');
  69 | 
  70 |     // 2. Immediately click back — should go to /demo without warning.
  71 |     await page.getByRole('button', { name: /back to demo/i }).click();
  72 | 
  73 |     // Should land on the demo landing page (no modal).
  74 |     await page.waitForURL('/demo');
  75 |     await expect(page.getByText('Free Demo', { exact: true })).toBeVisible();
  76 |     await expect(page.getByRole('dialog')).not.toBeVisible();
  77 |   });
  78 | });
  79 | 
```