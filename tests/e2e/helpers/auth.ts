/**
 * E2E test helpers — Auth and Supabase mocking for E2E tests.
 *
 * Provides utilities for authenticating against the real Supabase
 * project during E2E runs, plus helpers to mock REST responses for
 * deterministic test data.
 *
 * Related docs:
 *   - docs/testing-strategy.md § End-To-End Tests
 */

import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Test user factory
// ---------------------------------------------------------------------------

let _testUserCounter = 0;

/**
 * Create a unique test user email for each E2E run.
 *
 * Uses a timestamp + counter to avoid collisions across parallel workers.
 */
export function uniqueTestEmail(): string {
  _testUserCounter += 1;
  const ts = Date.now();
  return `e2e-test-${ts}-${_testUserCounter}@fluentdraft.dev`;
}

// ---------------------------------------------------------------------------
// Supabase REST mock helpers
// ---------------------------------------------------------------------------

/**
 * Intercept Supabase REST calls to return empty data.
 * This makes authenticated pages render their empty/initial states
 * instead of erroring on missing data.
 *
 * Call this BEFORE navigating to an authenticated page so the
 * interceptors are in place before any data-fetching.
 */
export async function mockSupabaseRestEmpty(page: Page): Promise<void> {
  // GET requests → return empty array.
  // POST/PATCH requests → return success.
  await page.route('**/rest/v1/**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: '{}',
      });
    }
  });

  // RPC calls.
  await page.route('**/rest/v1/rpc/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
}

/**
 * Intercept Supabase REST calls to return seeded test data.
 * Use this for tests that need to verify content rendering
 * (leaderboard entries, phrase bank items, dashboard summary).
 */
export async function mockSupabaseRestWithData(
  page: Page,
  overrides: Record<string, unknown> = {},
): Promise<void> {
  // Default seeded data per table/endpoint.
  const seeds: Record<string, unknown[]> = {
    leaderboard_entries: [
      {
        user_id: 'user-1',
        display_name: 'Alex Johnson',
        country_code: 'US',
        score: 450,
        rank: 1,
        period: 'weekly',
        period_start: '2026-07-06',
        period_end: '2026-07-12',
      },
      {
        user_id: 'user-2',
        display_name: 'Maria Garcia',
        country_code: 'ES',
        score: 320,
        rank: 2,
        period: 'weekly',
        period_start: '2026-07-06',
        period_end: '2026-07-12',
      },
      {
        user_id: 'user-3',
        display_name: 'Chen Wei',
        country_code: 'CN',
        score: 280,
        rank: 3,
        period: 'weekly',
        period_start: '2026-07-06',
        period_end: '2026-07-12',
      },
    ],
    phrase_bank_items: [
      {
        id: '00000000-0000-0000-0000-000000000101',
        text: 'thank you again for taking the time',
        meaning: 'A polite way to express gratitude',
        example: 'Thank you again for taking the time to review.',
        common_mistake: null,
        mastery: 'new',
        scenario_id: '00000000-0000-0000-0000-000000000010',
        scenario_slug: 'requesting-time-off',
        scenario_title: 'Requesting Time Off',
        saved_at: '2026-07-01T00:00:00Z',
      },
    ],
    user_profiles: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000001',
        display_name: 'Test User',
        english_level: 'intermediate',
        target_language_code: 'ar',
        country_code: 'US',
        onboarding_completed: true,
        created_at: '2026-07-01T00:00:00Z',
      },
    ],
    user_streaks: [
      {
        user_id: '00000000-0000-0000-0000-000000000001',
        current_streak_days: 3,
        longest_streak_days: 5,
        last_practice_date: '2026-07-13',
      },
    ],
  };

  // Apply overrides.
  Object.assign(seeds, overrides);

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method !== 'GET') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      return;
    }

    // Match table name from URL path.
    for (const [table, data] of Object.entries(seeds)) {
      if (url.includes(`/${table}`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
        return;
      }
    }

    // Fallback: empty.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });

  // RPC calls.
  await page.route('**/rest/v1/rpc/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
}
