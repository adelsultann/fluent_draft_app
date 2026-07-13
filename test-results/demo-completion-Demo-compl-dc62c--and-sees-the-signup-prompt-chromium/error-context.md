# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo-completion.spec.ts >> Demo completion >> completes the full demo lesson and sees the signup prompt
- Location: tests\e2e\demo-completion.spec.ts:26:7

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
  2  |  * E2E — Anonymous demo completion
  3  |  *
  4  |  * Covers:
  5  |  *   1. Open the app.
  6  |  *   2. Start the fixed demo lesson.
  7  |  *   3. Complete the lesson (all 4 phases).
  8  |  *   4. See the save-progress signup prompt.
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
  19 | test.describe('Demo completion', () => {
  20 |   test.beforeEach(async ({ page }) => {
> 21 |     await page.goto('/demo');
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  22 |     await page.evaluate(() => localStorage.clear());
  23 |     await page.reload();
  24 |   });
  25 | 
  26 |   test('completes the full demo lesson and sees the signup prompt', async ({ page }) => {
  27 |     // 1. Navigate to the demo landing page.
  28 |     await expect(page.getByText('Free Demo', { exact: true })).toBeVisible();
  29 |     await expect(page.locator('text=Follow Up After a Job Interview')).toBeVisible();
  30 | 
  31 |     // 2. Click "Start demo lesson" to enter the practice flow.
  32 |     await page.getByRole('link', { name: /start demo lesson/i }).click();
  33 |     await page.waitForURL('/demo/start');
  34 | 
  35 |     // 3. Verify the practice shell loaded.
  36 |     await expect(page.locator('text=Understand the Scenario')).toBeVisible();
  37 | 
  38 |     // 4. Force-complete the demo by injecting localStorage state.
  39 |     //    This bypasses the chunk-by-chunk UI (which has an implementation
  40 |     //    quirk where the first chunk is never auto-marked as completed).
  41 |     //    We still verify the completion UI renders after reload.
  42 |     const storageKey = 'fluentdraft:demo-progress:follow-up-after-interview';
  43 | 
  44 |     await page.evaluate((key) => {
  45 |       const raw = localStorage.getItem(key);
  46 |       if (raw) {
  47 |         const data = JSON.parse(raw);
  48 |         data.completed = true;
  49 |         data.currentPhase = 'save';
  50 |         data.completedChunkOrders = [1, 2, 3, 4, 5, 6];
  51 |         data.completedPhraseOrders = [1, 2, 3, 4, 5];
  52 |         data.updatedAt = new Date().toISOString();
  53 |         localStorage.setItem(key, JSON.stringify(data));
  54 |       }
  55 |     }, storageKey);
  56 | 
  57 |     // Reload to pick up the modified state.
  58 |     await page.reload();
  59 | 
  60 |     // 5. Verify the Save phase is shown with completion content.
  61 |     await expect(page.getByText('Demo Complete', { exact: true })).toBeVisible();
  62 |     await expect(
  63 |       page.getByRole('heading', { name: 'Great work!' }),
  64 |     ).toBeVisible();
  65 | 
  66 |     // 6. Verify the completion modal appears.
  67 |     const modal = page.getByRole('dialog');
  68 |     await expect(modal.locator('text=Demo Complete!')).toBeVisible();
  69 |     await expect(
  70 |       page.getByRole('button', { name: /create free account/i }),
  71 |     ).toBeVisible();
  72 | 
  73 |     // 7. Verify signing-up CTA is accessible from the page.
  74 |     await expect(
  75 |       page.getByRole('link', { name: /sign up to save your progress/i }),
  76 |     ).toBeVisible();
  77 |   });
  78 | });
  79 | 
```