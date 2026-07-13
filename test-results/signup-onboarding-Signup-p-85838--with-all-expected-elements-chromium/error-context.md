# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup-onboarding.spec.ts >> Signup page >> displays the signup form with all expected elements
- Location: tests\e2e\signup-onboarding.spec.ts:29:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/signup", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * E2E — Signup and onboarding
  3   |  *
  4   |  * Covers:
  5   |  *   1. Signup page form validation.
  6   |  *   2. Login page UI.
  7   |  *   3. Onboarding redirect for unauthenticated users.
  8   |  *   4. (Optional) Full signup + onboarding flow when E2E test
  9   |  *      credentials are provided via env vars.
  10  |  *
  11  |  * To run the full signup flow, set these env variables:
  12  |  *   E2E_TEST_EMAIL=you@example.com
  13  |  *   E2E_TEST_PASSWORD=yourpassword
  14  |  *
  15  |  * The flow: signup → onboarding form → dashboard.
  16  |  *
  17  |  * Related docs:
  18  |  *   - docs/testing-strategy.md § End-To-End Tests
  19  |  *   - docs/tasks-and-acceptance-criteria.md § Step 50
  20  |  */
  21  | 
  22  | import { test, expect } from '@playwright/test';
  23  | 
  24  | // ---------------------------------------------------------------------------
  25  | // Public page tests (no auth needed)
  26  | // ---------------------------------------------------------------------------
  27  | 
  28  | test.describe('Signup page', () => {
  29  |   test('displays the signup form with all expected elements', async ({ page }) => {
> 30  |     await page.goto('/signup');
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  31  | 
  32  |     await expect(
  33  |       page.getByRole('heading', { name: /create your account/i }),
  34  |     ).toBeVisible();
  35  | 
  36  |     await expect(page.getByLabel('Email')).toBeVisible();
  37  |     await expect(page.getByLabel('Password')).toBeVisible();
  38  |     await expect(
  39  |       page.getByRole('button', { name: /create account/i }),
  40  |     ).toBeVisible();
  41  | 
  42  |     // "Sign in" link appears in the footer of the form.
  43  |     // Use .first() to avoid the nav header link.
  44  |     await expect(
  45  |       page.getByRole('link', { name: /sign in/i }).first(),
  46  |     ).toBeVisible();
  47  |   });
  48  | 
  49  |   test('shows validation error for empty fields', async ({ page }) => {
  50  |     await page.goto('/signup');
  51  | 
  52  |     // Submit without filling.
  53  |     await page.getByRole('button', { name: /create account/i }).click();
  54  | 
  55  |     // Client-side validation should show error.
  56  |     await expect(
  57  |       page.getByText(/please fill in both email and password/i),
  58  |     ).toBeVisible();
  59  |   });
  60  | 
  61  |   test('navigates to login page from signup', async ({ page }) => {
  62  |     await page.goto('/signup');
  63  | 
  64  |     // Use the main content's Sign in link (the last one, inside the form card).
  65  |     await page.getByRole('link', { name: /sign in/i }).last().click();
  66  |     await page.waitForURL('/login');
  67  | 
  68  |     await expect(
  69  |       page.getByRole('heading', { name: /welcome back/i }),
  70  |     ).toBeVisible();
  71  |   });
  72  | });
  73  | 
  74  | test.describe('Login page', () => {
  75  |   test('displays the login form with all expected elements', async ({ page }) => {
  76  |     await page.goto('/login');
  77  | 
  78  |     await expect(
  79  |       page.getByRole('heading', { name: /welcome back/i }),
  80  |     ).toBeVisible();
  81  | 
  82  |     await expect(page.getByLabel('Email')).toBeVisible();
  83  |     await expect(page.getByLabel('Password')).toBeVisible();
  84  |     await expect(
  85  |       page.getByRole('button', { name: /sign in/i }),
  86  |     ).toBeVisible();
  87  | 
  88  |     // Link to signup.
  89  |     await expect(
  90  |       page.getByRole('link', { name: /create one/i }),
  91  |     ).toBeVisible();
  92  |   });
  93  | });
  94  | 
  95  | test.describe('Onboarding page (auth gating)', () => {
  96  |   test('redirects unauthenticated users to sign-in prompt', async ({ page }) => {
  97  |     await page.goto('/onboarding');
  98  | 
  99  |     // Without auth, the onboarding page shows a "Sign in required" prompt.
  100 |     await expect(
  101 |       page.getByText(/sign in required/i),
  102 |     ).toBeVisible();
  103 |     await expect(
  104 |       page.getByRole('link', { name: /sign in/i }),
  105 |     ).toBeVisible();
  106 |     await expect(
  107 |       page.getByRole('link', { name: /create account/i }),
  108 |     ).toBeVisible();
  109 |   });
  110 | });
  111 | 
  112 | // ---------------------------------------------------------------------------
  113 | // Full signup + onboarding flow (requires real Supabase)
  114 | // ---------------------------------------------------------------------------
  115 | 
  116 | test.describe('Full signup and onboarding flow', () => {
  117 |   test('signs up a new user and completes onboarding', async ({ page }) => {
  118 |     // Generate unique credentials for this run.
  119 |     const email = `e2e-signup-${Date.now()}@fluentdraft.dev`;
  120 |     const password = 'testpassword123';
  121 | 
  122 |     // 1. Go to signup.
  123 |     await page.goto('/signup');
  124 | 
  125 |     // 2. Fill and submit the signup form.
  126 |     await page.getByLabel('Email').fill(email);
  127 |     await page.getByLabel('Password').fill(password);
  128 |     await page.getByRole('button', { name: /create account/i }).click();
  129 | 
  130 |     // 3. Wait for either:
```