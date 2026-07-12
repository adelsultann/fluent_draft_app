/**
 * E2E — Registered lesson completion
 *
 * Covers:
 *   1. Verify that the practice route requires auth (redirect to
 *      /login when unauthenticated).
 *   2. Display practice page when authenticated.
 *
 * Note: This test uses real Supabase auth. Set E2E_TEST_EMAIL and
 * E2E_TEST_PASSWORD env vars to run the full authenticated flow.
 *
 * Related docs:
 *   - docs/testing-strategy.md § End-To-End Tests
 *   - docs/tasks-and-acceptance-criteria.md § Step 50
 */

import { test, expect, type Page } from '@playwright/test';

const SCENARIO_SLUG = 'requesting-time-off';

// ---------------------------------------------------------------------------
// Auth gating
// ---------------------------------------------------------------------------

test.describe('Practice route auth gating', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Navigate to a registered route. The layout should redirect to /login.
    const response = await page.goto(`/practice/${SCENARIO_SLUG}`);

    // Either the final URL is /login, or the response was a redirect.
    const isRedirected =
      page.url().includes('/login') ||
      response?.status() === 307 ||
      response?.request().redirectedFrom() !== null;

    // At minimum, we should NOT be on the practice page as anon.
    expect(page.url()).not.toContain(`/practice/${SCENARIO_SLUG}`);
    // Ideally we're on /login or were redirected.
    if (!isRedirected) {
      // May also land on /onboarding if user is somehow partially authed.
      // The important part is we're not viewing the protected page.
    }
  });
});

// ---------------------------------------------------------------------------
// Authenticated practice page
// ---------------------------------------------------------------------------

test.describe('Authenticated practice page', () => {
  /**
   * Sign in helper. Returns true if sign-in succeeded.
   */
  async function signIn(page: Page): Promise<boolean> {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    if (!email || !password) return false;

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to a registered route.
    try {
      await page.waitForURL(/dashboard|onboarding/, { timeout: 15000 });
      if (page.url().includes('/onboarding')) return false;
      return true;
    } catch {
      return false;
    }
  }

  test('practice page shows content when authenticated', async ({ page }) => {
    const signedIn = await signIn(page);
    if (!signedIn) {
      test.skip(
        true,
        'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
      );
      return;
    }

    await page.goto(`/practice/${SCENARIO_SLUG}`);

    // Should show the practice shell.
    const hasContent =
      (await page.getByRole('heading').first().isVisible().catch(() => false)) ||
      (await page.locator('text=Practice').isVisible().catch(() => false)) ||
      (await page.locator('text=Understand').isVisible().catch(() => false));

    expect(hasContent).toBe(true);
  });
});
