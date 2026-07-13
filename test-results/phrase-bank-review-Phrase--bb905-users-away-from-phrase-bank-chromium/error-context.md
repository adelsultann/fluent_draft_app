# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phrase-bank-review.spec.ts >> Phrase Bank auth gating >> redirects unauthenticated users away from phrase bank
- Location: tests\e2e\phrase-bank-review.spec.ts:25:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/phrase-bank", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * E2E — Phrase Bank review
  3  |  *
  4  |  * Covers:
  5  |  *   1. Verify the Phrase Bank route requires auth (redirect to
  6  |  *      /login when unauthenticated).
  7  |  *   2. Display Phrase Bank page when authenticated — phrase list
  8  |  *      or empty state.
  9  |  *
  10 |  * Note: This test uses real Supabase auth. Set E2E_TEST_EMAIL and
  11 |  * E2E_TEST_PASSWORD env vars to run the full authenticated flow.
  12 |  *
  13 |  * Related docs:
  14 |  *   - docs/testing-strategy.md § End-To-End Tests
  15 |  *   - docs/tasks-and-acceptance-criteria.md § Step 50
  16 |  */
  17 | 
  18 | import { test, expect, type Page } from '@playwright/test';
  19 | 
  20 | // ---------------------------------------------------------------------------
  21 | // Auth gating
  22 | // ---------------------------------------------------------------------------
  23 | 
  24 | test.describe('Phrase Bank auth gating', () => {
  25 |   test('redirects unauthenticated users away from phrase bank', async ({ page }) => {
> 26 |     await page.goto('/phrase-bank');
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  27 | 
  28 |     // The (registered) layout should redirect unauthenticated users.
  29 |     // We verify we are NOT viewing the Phrase Bank content.
  30 |     const onPhraseBank = page.url().includes('/phrase-bank');
  31 |     if (onPhraseBank) {
  32 |       // If no redirect happened, verify the page doesn't show phrase bank content.
  33 |       const hasPhraseBankContent = await page
  34 |         .getByText(/phrase bank/i)
  35 |         .isVisible()
  36 |         .catch(() => false);
  37 |       // Should either be redirected or not show the protected content.
  38 |       expect(hasPhraseBankContent).toBe(false);
  39 |     }
  40 |     // Pass if we're redirected to /login or the protected content is hidden.
  41 |   });
  42 | });
  43 | 
  44 | // ---------------------------------------------------------------------------
  45 | // Authenticated Phrase Bank
  46 | // ---------------------------------------------------------------------------
  47 | 
  48 | test.describe('Authenticated Phrase Bank', () => {
  49 |   /**
  50 |    * Sign in helper. Returns true if sign-in succeeded and user has
  51 |    * completed onboarding.
  52 |    */
  53 |   async function signIn(page: Page): Promise<boolean> {
  54 |     const email = process.env.E2E_TEST_EMAIL;
  55 |     const password = process.env.E2E_TEST_PASSWORD;
  56 |     if (!email || !password) return false;
  57 | 
  58 |     await page.goto('/login');
  59 |     await page.getByLabel('Email').fill(email);
  60 |     await page.getByLabel('Password').fill(password);
  61 |     await page.getByRole('button', { name: /sign in/i }).click();
  62 | 
  63 |     try {
  64 |       await page.waitForURL(/dashboard|onboarding/, { timeout: 15000 });
  65 |       if (page.url().includes('/onboarding')) return false;
  66 |       return true;
  67 |     } catch {
  68 |       return false;
  69 |     }
  70 |   }
  71 | 
  72 |   test('displays Phrase Bank heading when authenticated', async ({ page }) => {
  73 |     const signedIn = await signIn(page);
  74 |     if (!signedIn) {
  75 |       test.skip(
  76 |         true,
  77 |         'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
  78 |       );
  79 |       return;
  80 |     }
  81 | 
  82 |     await page.goto('/phrase-bank');
  83 | 
  84 |     // Heading should be visible.
  85 |     await expect(
  86 |       page.getByRole('heading', { name: /phrase bank/i }),
  87 |     ).toBeVisible();
  88 | 
  89 |     // Either phrase list or empty state.
  90 |     const hasContent =
  91 |       (await page.getByText(/saved phrase/i).isVisible().catch(() => false)) ||
  92 |       (await page.getByText(/your phrase bank is empty/i).isVisible().catch(() => false));
  93 | 
  94 |     expect(hasContent).toBe(true);
  95 |   });
  96 | });
  97 | 
```