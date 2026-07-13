# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: leaderboard.spec.ts >> Leaderboard auth gating >> redirects unauthenticated users away from leaderboard
- Location: tests\e2e\leaderboard.spec.ts:26:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/leaderboard", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * E2E — Leaderboard visibility
  3   |  *
  4   |  * Covers:
  5   |  *   1. Verify the leaderboard route requires auth (redirect to
  6   |  *      /login when unauthenticated).
  7   |  *   2. Display leaderboard when authenticated — rankings or
  8   |  *      empty state.
  9   |  *   3. Switch between weekly and monthly periods.
  10  |  *
  11  |  * Note: This test uses real Supabase auth. Set E2E_TEST_EMAIL and
  12  |  * E2E_TEST_PASSWORD env vars to run the full authenticated flow.
  13  |  *
  14  |  * Related docs:
  15  |  *   - docs/testing-strategy.md § End-To-End Tests
  16  |  *   - docs/tasks-and-acceptance-criteria.md § Step 50
  17  |  */
  18  | 
  19  | import { test, expect, type Page } from '@playwright/test';
  20  | 
  21  | // ---------------------------------------------------------------------------
  22  | // Auth gating
  23  | // ---------------------------------------------------------------------------
  24  | 
  25  | test.describe('Leaderboard auth gating', () => {
  26  |   test('redirects unauthenticated users away from leaderboard', async ({ page }) => {
> 27  |     await page.goto('/leaderboard');
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  28  | 
  29  |     // The (registered) layout should redirect unauthenticated users.
  30  |     // Verify we are NOT viewing leaderboard content.
  31  |     const onLeaderboard = page.url().includes('/leaderboard');
  32  |     if (onLeaderboard) {
  33  |       const hasLeaderboardContent = await page
  34  |         .getByRole('heading', { name: /leaderboard/i })
  35  |         .isVisible()
  36  |         .catch(() => false);
  37  |       // Should either be redirected or not show the protected content.
  38  |       expect(hasLeaderboardContent).toBe(false);
  39  |     }
  40  |   });
  41  | });
  42  | 
  43  | // ---------------------------------------------------------------------------
  44  | // Authenticated leaderboard
  45  | // ---------------------------------------------------------------------------
  46  | 
  47  | test.describe('Authenticated leaderboard', () => {
  48  |   /**
  49  |    * Sign in helper. Returns true if sign-in succeeded and user has
  50  |    * completed onboarding.
  51  |    */
  52  |   async function signIn(page: Page): Promise<boolean> {
  53  |     const email = process.env.E2E_TEST_EMAIL;
  54  |     const password = process.env.E2E_TEST_PASSWORD;
  55  |     if (!email || !password) return false;
  56  | 
  57  |     await page.goto('/login');
  58  |     await page.getByLabel('Email').fill(email);
  59  |     await page.getByLabel('Password').fill(password);
  60  |     await page.getByRole('button', { name: /sign in/i }).click();
  61  | 
  62  |     try {
  63  |       await page.waitForURL(/dashboard|onboarding/, { timeout: 15000 });
  64  |       if (page.url().includes('/onboarding')) return false;
  65  |       return true;
  66  |     } catch {
  67  |       return false;
  68  |     }
  69  |   }
  70  | 
  71  |   test('displays leaderboard heading and period tabs when authenticated', async ({
  72  |     page,
  73  |   }) => {
  74  |     const signedIn = await signIn(page);
  75  |     if (!signedIn) {
  76  |       test.skip(
  77  |         true,
  78  |         'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
  79  |       );
  80  |       return;
  81  |     }
  82  | 
  83  |     await page.goto('/leaderboard');
  84  | 
  85  |     // Heading.
  86  |     await expect(
  87  |       page.getByRole('heading', { name: /leaderboard/i }),
  88  |     ).toBeVisible();
  89  | 
  90  |     // Period tabs.
  91  |     await expect(page.getByRole('tab', { name: /weekly/i })).toBeVisible();
  92  |     await expect(page.getByRole('tab', { name: /monthly/i })).toBeVisible();
  93  | 
  94  |     // Either rankings or empty state.
  95  |     const hasContent =
  96  |       (await page.getByText(/player/i).isVisible().catch(() => false)) ||
  97  |       (await page.getByText(/no rankings yet/i).isVisible().catch(() => false));
  98  | 
  99  |     expect(hasContent).toBe(true);
  100 |   });
  101 | 
  102 |   test('switches from weekly to monthly leaderboard', async ({ page }) => {
  103 |     const signedIn = await signIn(page);
  104 |     if (!signedIn) {
  105 |       test.skip(
  106 |         true,
  107 |         'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set or user needs onboarding',
  108 |       );
  109 |       return;
  110 |     }
  111 | 
  112 |     await page.goto('/leaderboard');
  113 | 
  114 |     // Click the Monthly tab.
  115 |     await page.getByRole('tab', { name: /monthly/i }).click();
  116 |     await page.waitForURL(/period=monthly/);
  117 | 
  118 |     // The monthly tab should now be selected.
  119 |     await expect(
  120 |       page.getByRole('tab', { name: /monthly/i, selected: true }),
  121 |     ).toBeVisible();
  122 | 
  123 |     // The page should still show content.
  124 |     const hasContent =
  125 |       (await page.getByText(/player/i).isVisible().catch(() => false)) ||
  126 |       (await page.getByText(/no rankings yet/i).isVisible().catch(() => false));
  127 | 
```