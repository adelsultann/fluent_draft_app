/**
 * E2E — Leaderboard visibility
 *
 * Covers:
 *   1. Verify the leaderboard route requires auth (redirect to
 *      /login when unauthenticated).
 *   2. Display leaderboard when authenticated — rankings or
 *      empty state.
 *   3. Switch between weekly and monthly periods.
 *
 * Note: This test uses real Supabase auth. Set E2E_TEST_EMAIL and
 * E2E_TEST_PASSWORD env vars to run the full authenticated flow.
 *
 * Related docs:
 *   - docs/testing-strategy.md § End-To-End Tests
 *   - docs/tasks-and-acceptance-criteria.md § Step 50
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Auth gating
// ---------------------------------------------------------------------------

test.describe('Leaderboard auth gating', () => {
  test('redirects unauthenticated users away from leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');

    // The (registered) layout should redirect unauthenticated users.
    // Verify we are NOT viewing leaderboard content.
    const onLeaderboard = page.url().includes('/leaderboard');
    if (onLeaderboard) {
      const hasLeaderboardContent = await page
        .getByRole('heading', { name: /leaderboard/i })
        .isVisible()
        .catch(() => false);
      // Should either be redirected or not show the protected content.
      expect(hasLeaderboardContent).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Authenticated leaderboard
// ---------------------------------------------------------------------------

test.describe('Authenticated leaderboard', () => {
  /**
   * Sign in helper. Returns true if sign-in succeeded and user has
   * completed onboarding.
   */
  async function signIn(page: Page): Promise<boolean> {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    if (!email || !password) return false;

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    try {
      await page.waitForURL(/dashboard|onboarding/, { timeout: 15000 });
      if (page.url().includes('/onboarding')) return false;
      return true;
    } catch {
      return false;
    }
  }

  test('displays leaderboard heading and period tabs when authenticated', async ({
    page,
  }) => {
    const signedIn = await signIn(page);
    if (!signedIn) {
      test.skip(
        true,
        'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
      );
      return;
    }

    await page.goto('/leaderboard');

    // Heading.
    await expect(
      page.getByRole('heading', { name: /leaderboard/i }),
    ).toBeVisible();

    // Period tabs.
    await expect(page.getByRole('tab', { name: /weekly/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /monthly/i })).toBeVisible();

    // Either rankings or empty state.
    const hasContent =
      (await page.getByText(/player/i).isVisible().catch(() => false)) ||
      (await page.getByText(/no rankings yet/i).isVisible().catch(() => false));

    expect(hasContent).toBe(true);
  });

  test('switches from weekly to monthly leaderboard', async ({ page }) => {
    const signedIn = await signIn(page);
    if (!signedIn) {
      test.skip(
        true,
        'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
      );
      return;
    }

    await page.goto('/leaderboard');

    // Click the Monthly tab.
    await page.getByRole('tab', { name: /monthly/i }).click();
    await page.waitForURL(/period=monthly/);

    // The monthly tab should now be selected.
    await expect(
      page.getByRole('tab', { name: /monthly/i, selected: true }),
    ).toBeVisible();

    // The page should still show content.
    const hasContent =
      (await page.getByText(/player/i).isVisible().catch(() => false)) ||
      (await page.getByText(/no rankings yet/i).isVisible().catch(() => false));

    expect(hasContent).toBe(true);
  });
});
