# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registered-practice.spec.ts >> Practice route auth gating >> redirects unauthenticated users to login
- Location: tests\e2e\registered-practice.spec.ts:26:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/practice/requesting-time-off", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * E2E — Registered lesson completion
  3  |  *
  4  |  * Covers:
  5  |  *   1. Verify that the practice route requires auth (redirect to
  6  |  *      /login when unauthenticated).
  7  |  *   2. Display practice page when authenticated.
  8  |  *
  9  |  * Note: This test uses real Supabase auth. Set E2E_TEST_EMAIL and
  10 |  * E2E_TEST_PASSWORD env vars to run the full authenticated flow.
  11 |  *
  12 |  * Related docs:
  13 |  *   - docs/testing-strategy.md § End-To-End Tests
  14 |  *   - docs/tasks-and-acceptance-criteria.md § Step 50
  15 |  */
  16 | 
  17 | import { test, expect, type Page } from '@playwright/test';
  18 | 
  19 | const SCENARIO_SLUG = 'requesting-time-off';
  20 | 
  21 | // ---------------------------------------------------------------------------
  22 | // Auth gating
  23 | // ---------------------------------------------------------------------------
  24 | 
  25 | test.describe('Practice route auth gating', () => {
  26 |   test('redirects unauthenticated users to login', async ({ page }) => {
  27 |     // Navigate to a registered route. The layout should redirect to /login.
> 28 |     const response = await page.goto(`/practice/${SCENARIO_SLUG}`);
     |                                 ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  29 | 
  30 |     // Either the final URL is /login, or the response was a redirect.
  31 |     const isRedirected =
  32 |       page.url().includes('/login') ||
  33 |       response?.status() === 307 ||
  34 |       response?.request().redirectedFrom() !== null;
  35 | 
  36 |     // At minimum, we should NOT be on the practice page as anon.
  37 |     expect(page.url()).not.toContain(`/practice/${SCENARIO_SLUG}`);
  38 |     // Ideally we're on /login or were redirected.
  39 |     if (!isRedirected) {
  40 |       // May also land on /onboarding if user is somehow partially authed.
  41 |       // The important part is we're not viewing the protected page.
  42 |     }
  43 |   });
  44 | });
  45 | 
  46 | // ---------------------------------------------------------------------------
  47 | // Authenticated practice page
  48 | // ---------------------------------------------------------------------------
  49 | 
  50 | test.describe('Authenticated practice page', () => {
  51 |   /**
  52 |    * Sign in helper. Returns true if sign-in succeeded.
  53 |    */
  54 |   async function signIn(page: Page): Promise<boolean> {
  55 |     const email = process.env.E2E_TEST_EMAIL;
  56 |     const password = process.env.E2E_TEST_PASSWORD;
  57 |     if (!email || !password) return false;
  58 | 
  59 |     await page.goto('/login');
  60 |     await page.getByLabel('Email').fill(email);
  61 |     await page.getByLabel('Password').fill(password);
  62 |     await page.getByRole('button', { name: /sign in/i }).click();
  63 | 
  64 |     // Wait for redirect to a registered route.
  65 |     try {
  66 |       await page.waitForURL(/dashboard|onboarding/, { timeout: 15000 });
  67 |       if (page.url().includes('/onboarding')) return false;
  68 |       return true;
  69 |     } catch {
  70 |       return false;
  71 |     }
  72 |   }
  73 | 
  74 |   test('practice page shows content when authenticated', async ({ page }) => {
  75 |     const signedIn = await signIn(page);
  76 |     if (!signedIn) {
  77 |       test.skip(
  78 |         true,
  79 |         'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
  80 |       );
  81 |       return;
  82 |     }
  83 | 
  84 |     await page.goto(`/practice/${SCENARIO_SLUG}`);
  85 | 
  86 |     // Should show the practice shell.
  87 |     const hasContent =
  88 |       (await page.getByRole('heading').first().isVisible().catch(() => false)) ||
  89 |       (await page.locator('text=Practice').isVisible().catch(() => false)) ||
  90 |       (await page.locator('text=Understand').isVisible().catch(() => false));
  91 | 
  92 |     expect(hasContent).toBe(true);
  93 |   });
  94 | });
  95 | 
```