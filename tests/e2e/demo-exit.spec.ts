/**
 * E2E — Anonymous demo exit warning
 *
 * Covers:
 *   1. Start the fixed demo lesson.
 *   2. Progress partway through.
 *   3. Attempt to exit midway.
 *   4. See the warning that score/progress will be lost unless the user signs up.
 *
 * All state is client-side (localStorage) — no Supabase required.
 *
 * Related docs:
 *   - docs/testing-strategy.md § End-To-End Tests
 *   - docs/tasks-and-acceptance-criteria.md § Step 50
 */

import { test, expect } from '@playwright/test';

test.describe('Demo exit warning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows exit warning when leaving midway through the demo', async ({ page }) => {
    // 1. Start the demo.
    await page.getByRole('link', { name: /start demo lesson/i }).click();
    await page.waitForURL('/demo/start');
    await expect(page.locator('text=Understand the Scenario')).toBeVisible();

    // 2. Progress into the Practice phase (midway).
    await page.getByRole('button', { name: /start practice/i }).click();
    await expect(page.locator('text=Practice Chunks')).toBeVisible();

    // 3. Click "← Back to demo" to trigger the exit warning.
    await page.getByRole('button', { name: /back to demo/i }).click();

    // 4. Verify the exit modal appears with the right content.
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Leave demo?')).toBeVisible();
    await expect(
      modal.locator('text=not be saved permanently'),
    ).toBeVisible();

    // 5. Verify three options are present.
    await expect(
      page.getByRole('button', { name: /keep practicing/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /leave anyway/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /sign up to save/i }),
    ).toBeVisible();

    // 6. "Keep practicing" dismisses the modal and keeps us on the practice page.
    await page.getByRole('button', { name: /keep practicing/i }).click();
    await expect(modal).not.toBeVisible();
    // Still on the demo practice page.
    await expect(page.locator('text=Practice Chunks')).toBeVisible();
  });

  test('does not show exit warning at the very start (no progress yet)', async ({ page }) => {
    // 1. Start the demo.
    await page.getByRole('link', { name: /start demo lesson/i }).click();
    await page.waitForURL('/demo/start');

    // 2. Immediately click back — should go to /demo without warning.
    await page.getByRole('button', { name: /back to demo/i }).click();

    // Should land on the demo landing page (no modal).
    await page.waitForURL('/demo');
    await expect(page.getByText('Free Demo', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
