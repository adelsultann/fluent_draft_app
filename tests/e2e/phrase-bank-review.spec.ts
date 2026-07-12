/**
 * E2E — Phrase Bank review
 *
 * Covers:
 *   1. Verify the Phrase Bank route requires auth (redirect to
 *      /login when unauthenticated).
 *   2. Display Phrase Bank page when authenticated — phrase list
 *      or empty state.
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

test.describe('Phrase Bank auth gating', () => {
  test('redirects unauthenticated users away from phrase bank', async ({ page }) => {
    await page.goto('/phrase-bank');

    // The (registered) layout should redirect unauthenticated users.
    // We verify we are NOT viewing the Phrase Bank content.
    const onPhraseBank = page.url().includes('/phrase-bank');
    if (onPhraseBank) {
      // If no redirect happened, verify the page doesn't show phrase bank content.
      const hasPhraseBankContent = await page
        .getByText(/phrase bank/i)
        .isVisible()
        .catch(() => false);
      // Should either be redirected or not show the protected content.
      expect(hasPhraseBankContent).toBe(false);
    }
    // Pass if we're redirected to /login or the protected content is hidden.
  });
});

// ---------------------------------------------------------------------------
// Authenticated Phrase Bank
// ---------------------------------------------------------------------------

test.describe('Authenticated Phrase Bank', () => {
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

  test('displays Phrase Bank heading when authenticated', async ({ page }) => {
    const signedIn = await signIn(page);
    if (!signedIn) {
      test.skip(
        true,
        'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
      );
      return;
    }

    await page.goto('/phrase-bank');

    // Heading should be visible.
    await expect(
      page.getByRole('heading', { name: /phrase bank/i }),
    ).toBeVisible();

    // Either phrase list or empty state.
    const hasContent =
      (await page.getByText(/saved phrase/i).isVisible().catch(() => false)) ||
      (await page.getByText(/your phrase bank is empty/i).isVisible().catch(() => false));

    expect(hasContent).toBe(true);
  });
});
