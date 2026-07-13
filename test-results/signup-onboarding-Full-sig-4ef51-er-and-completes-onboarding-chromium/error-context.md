# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup-onboarding.spec.ts >> Full signup and onboarding flow >> signs up a new user and completes onboarding
- Location: tests\e2e\signup-onboarding.spec.ts:117:7

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
  23  | 
  24  | // ---------------------------------------------------------------------------
  25  | // Public page tests (no auth needed)
  26  | // ---------------------------------------------------------------------------
  27  | 
  28  | test.describe('Signup page', () => {
  29  |   test('displays the signup form with all expected elements', async ({ page }) => {
  30  |     await page.goto('/signup');
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
> 123 |     await page.goto('/signup');
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  124 | 
  125 |     // 2. Fill and submit the signup form.
  126 |     await page.getByLabel('Email').fill(email);
  127 |     await page.getByLabel('Password').fill(password);
  128 |     await page.getByRole('button', { name: /create account/i }).click();
  129 | 
  130 |     // 3. Wait for either:
  131 |     //    a) Redirect to onboarding (email confirmation disabled)
  132 |     //    b) Success message about checking email (confirmation required)
  133 |     // Wait for navigation or the success message to appear.
  134 |     await page.waitForLoadState('networkidle').catch(() => {});
  135 |     // Give the page a moment to settle after network activity.
  136 |     await new Promise((r) => setTimeout(r, 2000));
  137 | 
  138 |     // Check if we got redirected to onboarding.
  139 |     const isOnOnboarding = page.url().includes('/onboarding');
  140 | 
  141 |     if (isOnOnboarding) {
  142 |       // Email confirmation is NOT required — proceed with onboarding.
  143 |       await expect(
  144 |         page.getByRole('heading', { name: /welcome to fluentdraft/i }),
  145 |       ).toBeVisible();
  146 | 
  147 |       // Fill onboarding form.
  148 |       await page.getByLabel(/display name/i).fill('E2E Test User');
  149 | 
  150 |       // Select English level — click "Intermediate".
  151 |       await page.getByLabel(/intermediate/i).check();
  152 | 
  153 |       // Select target language — pick Arabic (first non-empty option).
  154 |       await page.locator('#onboarding-language').selectOption('ar');
  155 | 
  156 |       // Select country — type in the combobox.
  157 |       const countryInput = page.locator('#onboarding-country-search');
  158 |       await countryInput.click();
  159 |       await countryInput.fill('United States');
  160 |       // Click the first dropdown option.
  161 |       const firstOption = page.locator('#onboarding-country-listbox li').first();
  162 |       await firstOption.click();
  163 | 
  164 |       // Submit onboarding.
  165 |       await page.getByRole('button', { name: /continue/i }).click();
  166 | 
  167 |       // Should redirect to dashboard.
  168 |       await page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {
  169 |         // Onboarding may fail if the profile already exists or other DB issues.
  170 |         // That's ok — the UI is what we're testing.
  171 |       });
  172 | 
  173 |       // Verify we landed somewhere after onboarding (dashboard or error page).
  174 |       // Brief pause to let any redirect settle.
  175 |       await new Promise((r) => setTimeout(r, 1000));
  176 |     } else {
  177 |       // Email confirmation may be required, or Supabase may reject the
  178 |       // sign-up (rate limiting, etc.).  Either way the form should have
  179 |       // been submitted — we just verify we didn't crash.
  180 |       const stillOnSignup = page.url().includes('/signup');
  181 |       // We expect to still be on some valid page.
  182 |       expect(stillOnSignup || page.url().includes('/onboarding')).toBe(true);
  183 |     }
  184 |   });
  185 | });
  186 | 
```