/**
 * FluentDraft — RLS Verification Runner (Node.js / Supabase API)
 *
 * Tests Row Level Security policies by making API calls as two
 * different authenticated users and verifying that cross-user
 * access is properly blocked.
 *
 * Usage:
 *   npx tsx scripts/verify-rls.ts
 *
 * Environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL      — required (already in .env.local)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — required (already in .env.local)
 *   SUPABASE_SERVICE_ROLE_KEY     — optional; enables full user-creation
 *                                   and authenticated RLS testing via the
 *                                   Admin API. Without it, only public-read
 *                                   and unauthenticated checks run.
 *
 * Related docs:
 *   - docs/testing-strategy.md § Supabase And RLS Testing
 *   - docs/database-schema.md § RLS Policy Direction
 *   - tests-and-acceptance-criteria.md § Step 51
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TestResult = { name: string; passed: boolean; detail?: string };

const results: TestResult[] = [];

function log(name: string, passed: boolean, detail?: string) {
  const icon = passed ? 'PASS' : 'FAIL';
  results.push({ name, passed, detail });
  if (passed) {
    console.log(`  ✅ ${icon}: ${name}`);
  } else {
    console.error(`  ❌ ${icon}: ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function summary() {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`RLS Verification: ${passed} passed, ${failed} failed, ${results.length} total`);
  if (failed > 0) {
    console.error(`\nFailed checks:`);
    for (const r of results.filter((r) => !r.passed)) {
      console.error(`  ❌ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

function getAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

interface TestUser {
  email: string;
  password: string;
  session: { access_token: string } | null;
}

const USER_A_EMAIL = `verify-rls-a-${Date.now()}@fluentdraft.dev`;
const USER_B_EMAIL = `verify-rls-b-${Date.now()}@fluentdraft.dev`;
const TEST_PASSWORD = 'RLSverify123!';

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('FluentDraft — RLS Verification Runner\n');
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`Service role key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'NOT SET'}`);
  console.log('');

  const serviceClient = getServiceClient();
  const anonClient = getAnonClient();

  if (!serviceClient) {
    console.warn(
      '⚠ SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
      '  Only public/unauthenticated checks will run.\n' +
      '  Set SUPABASE_SERVICE_ROLE_KEY to run full authenticated RLS verification.\n',
    );
  }

  // =========================================================================
  // SECTION 1: Public read access on content tables
  // =========================================================================
  console.log('── SECTION 1: Public read access (unauthenticated) ──');

  const contentTables = [
    { table: 'supported_languages', label: 'supported_languages' },
    { table: 'user_levels', label: 'user_levels' },
    { table: 'scenario_packs', label: 'scenario_packs' },
    { table: 'scenarios', label: 'scenarios' },
    { table: 'lesson_chunks', label: 'lesson_chunks' },
    { table: 'key_phrases', label: 'key_phrases' },
    { table: 'translations', label: 'translations' },
    { table: 'badges', label: 'badges' },
    { table: 'missions', label: 'missions' },
  ];

  for (const { table, label } of contentTables) {
    try {
      const { data, error } = await anonClient.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        log(`Public read: ${label}`, false, error.message);
      } else {
        log(`Public read: ${label}`, true, `${(data as unknown[])?.length ?? '?'} rows`);
      }
    } catch (err) {
      log(`Public read: ${label}`, false, String(err));
    }
  }

  // =========================================================================
  // SECTION 2: Leaderboard — public read, no write
  // =========================================================================
  console.log('\n── SECTION 2: Leaderboard entries ──');

  // 2a: Unauthenticated read (should fail or return empty)
  try {
    const { data, error } = await anonClient.from('leaderboard_entries').select('*');
    // Leaderboard requires authenticated role per policy.
    if (error) {
      log('leaderboard: anon cannot read (expected)', true, error.message);
    } else if (!data || (data as unknown[]).length === 0) {
      log('leaderboard: anon cannot read (expected)', true, 'empty result');
    } else {
      log('leaderboard: anon cannot read (expected)', false, `got ${(data as unknown[]).length} rows — should be blocked`);
    }
  } catch (err) {
    log('leaderboard: anon cannot read (expected)', true, String(err));
  }

  // =========================================================================
  // SECTION 3: Authenticated RLS (requires service_role key)
  // =========================================================================
  if (!serviceClient) {
    console.log('\n── SECTION 3: Authenticated RLS — SKIPPED (no service_role key) ──');
    console.log('  To run these tests, set SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('  The SQL script at supabase/verification/rls-verification.sql');
    console.log('  can also be run manually via the Supabase Dashboard SQL Editor.');
    summary();
    return;
  }

  console.log('\n── SECTION 3: Authenticated RLS ──');

  // 3a: Create two test users via Admin API
  console.log('  Creating test users...');
  const userA: TestUser = { email: USER_A_EMAIL, password: TEST_PASSWORD, session: null };
  const userB: TestUser = { email: USER_B_EMAIL, password: TEST_PASSWORD, session: null };

  const { data: createdA, error: createErrA } = await serviceClient.auth.admin.createUser({
    email: USER_A_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createErrA || !createdA?.user) {
    log('Setup: create user A', false, createErrA?.message ?? 'no user returned');
    summary();
    return;
  }
  log(`Setup: create user A (${createdA.user.id})`, true);

  const { data: createdB, error: createErrB } = await serviceClient.auth.admin.createUser({
    email: USER_B_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createErrB || !createdB?.user) {
    log('Setup: create user B', false, createErrB?.message ?? 'no user returned');
    summary();
    return;
  }
  log(`Setup: create user B (${createdB.user.id})`, true);

  // 3b: Sign in both users to get valid access tokens
  const { data: sessionA } = await anonClient.auth.signInWithPassword({
    email: USER_A_EMAIL,
    password: TEST_PASSWORD,
  });
  userA.session = sessionA?.session ? { access_token: sessionA.session.access_token } : null;
  log('Setup: sign in user A', !!userA.session, userA.session ? '' : 'sign-in failed');

  const { data: sessionB } = await anonClient.auth.signInWithPassword({
    email: USER_B_EMAIL,
    password: TEST_PASSWORD,
  });
  userB.session = sessionB?.session ? { access_token: sessionB.session.access_token } : null;
  log('Setup: sign in user B', !!userB.session, userB.session ? '' : 'sign-in failed');

  // Create authenticated clients
  const clientA = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${userA.session?.access_token}` } } },
  );
  const clientB = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${userB.session?.access_token}` } } },
  );

  // 3c: Seed test data for User A
  console.log('\n  Seeding test data for User A...');

  // user_profiles
  const { error: profileErrA } = await serviceClient.from('user_profiles').insert({
    user_id: createdA.user.id,
    display_name: 'RLS Test User A',
    country_code: 'US',
    english_level: 'intermediate',
    target_language_code: 'ar',
    onboarding_complete: true,
  });
  log('seed: user A profile', !profileErrA, profileErrA?.message);

  // user_profiles for User B
  const { error: profileErrB } = await serviceClient.from('user_profiles').insert({
    user_id: createdB.user.id,
    display_name: 'RLS Test User B',
    country_code: 'GB',
    english_level: 'beginner',
    target_language_code: 'es',
    onboarding_complete: true,
  });
  log('seed: user B profile', !profileErrB, profileErrB?.message);

  // Find a scenario to use
  const { data: scenarios } = await anonClient.from('scenarios').select('id').limit(1);
  const scenarioId = (scenarios as { id: string }[] | null)?.[0]?.id;
  if (!scenarioId) {
    log('seed: find scenario', false, 'no scenarios in DB');
    summary();
    return;
  }

  // Find a key_phrase to use
  const { data: keyPhrases } = await anonClient.from('key_phrases').select('id').limit(1);
  const keyPhraseId = (keyPhrases as { id: string }[] | null)?.[0]?.id;
  if (!keyPhraseId) {
    log('seed: find key_phrase', false, 'no key_phrases in DB');
    summary();
    return;
  }

  // lesson_attempt for User A
  const { data: lessonAttempt } = await serviceClient.from('lesson_attempts').insert({
    user_id: createdA.user.id,
    scenario_id: scenarioId,
    status: 'completed',
    current_phase: 'save',
  }).select('id').single();
  const lessonAttemptId = (lessonAttempt as { id: string } | null)?.id;
  log('seed: user A lesson_attempt', !!lessonAttemptId, lessonAttemptId ? '' : 'insert failed');

  // phrase_bank_item for User A
  const { data: bankItem } = await serviceClient.from('phrase_bank_items').insert({
    user_id: createdA.user.id,
    key_phrase_id: keyPhraseId,
    source_scenario_id: scenarioId,
    mastery: 'new',
  }).select('id').single();
  const bankItemId = (bankItem as { id: string } | null)?.id;
  log('seed: user A phrase_bank_item', !!bankItemId, bankItemId ? '' : 'insert failed');

  // score_event for User A
  const { error: scoreErr } = await serviceClient.from('score_events').insert({
    user_id: createdA.user.id,
    event_type: 'lesson_completion',
    points: 100,
  });
  log('seed: user A score_event', !scoreErr, scoreErr?.message);

  // streaks for User A
  const { error: streakErr } = await serviceClient.from('streaks').insert({
    user_id: createdA.user.id,
    current_streak_days: 3,
    longest_streak_days: 5,
    last_practice_date: new Date().toISOString().split('T')[0],
  });
  log('seed: user A streak', !streakErr, streakErr?.message);

  // =========================================================================
  // SECTION 3d: Cross-user RLS tests
  // =========================================================================
  console.log('\n  Running cross-user RLS tests...');

  const userAId = createdA.user.id;
  const userBId = createdB.user.id;

  // --- user_profiles ---
  // User A can read own
  const { data: selfProfileA } = await clientA.from('user_profiles').select('*').eq('user_id', userAId).maybeSingle();
  log('RLS user_profiles: A reads own', !!selfProfileA, !selfProfileA ? 'blocked or not found' : '');

  // User B CANNOT read User A's profile
  const { data: crossProfile } = await clientB.from('user_profiles').select('*').eq('user_id', userAId).maybeSingle();
  log('RLS user_profiles: B cannot read A', !crossProfile, crossProfile ? `got row: ${(crossProfile as Record<string, unknown>).display_name}` : '');

  // User B CANNOT update User A's profile
  const { error: crossUpdateProfile } = await clientB.from('user_profiles').update({ display_name: 'HACKED' }).eq('user_id', userAId);
  log('RLS user_profiles: B cannot update A', !!crossUpdateProfile, crossUpdateProfile?.message);

  // --- lesson_attempts ---
  if (lessonAttemptId) {
    // User A can read own
    const { data: selfAttempt } = await clientA.from('lesson_attempts').select('*').eq('id', lessonAttemptId).maybeSingle();
    log('RLS lesson_attempts: A reads own', !!selfAttempt, !selfAttempt ? 'blocked' : '');

    // User B CANNOT read User A's lesson_attempt
    const { data: crossAttempt } = await clientB.from('lesson_attempts').select('*').eq('id', lessonAttemptId).maybeSingle();
    log('RLS lesson_attempts: B cannot read A', !crossAttempt, crossAttempt ? 'saw user A data' : '');

    // User B CANNOT insert phrase_attempt into User A's lesson
    const { error: crossPhraseInsert } = await clientB.from('phrase_attempts').insert({
      lesson_attempt_id: lessonAttemptId,
      key_phrase_id: keyPhraseId,
      typed_text: 'hacked',
      expected_text: 'expected',
      attempt_number: 1,
      is_correct: false,
    });
    log('RLS phrase_attempts: B cannot insert into A lesson', !!crossPhraseInsert, crossPhraseInsert?.message);
  }

  // --- phrase_bank_items ---
  if (bankItemId) {
    // User A can read own
    const { data: selfBank } = await clientA.from('phrase_bank_items').select('*').eq('id', bankItemId).maybeSingle();
    log('RLS phrase_bank_items: A reads own', !!selfBank, !selfBank ? 'blocked' : '');

    // User B CANNOT read User A's phrase_bank_item
    const { data: crossBank } = await clientB.from('phrase_bank_items').select('*').eq('id', bankItemId).maybeSingle();
    log('RLS phrase_bank_items: B cannot read A', !crossBank, crossBank ? 'saw user A data' : '');

    // User B CANNOT delete User A's phrase_bank_item
    await clientB.from('phrase_bank_items').delete().eq('id', bankItemId);
    const { data: stillExists } = await clientA.from('phrase_bank_items').select('id').eq('id', bankItemId).maybeSingle();
    log('RLS phrase_bank_items: B cannot delete A', !!stillExists, !stillExists ? 'item was deleted!' : '');
  }

  // --- score_events ---
  const { data: selfScore } = await clientA.from('score_events').select('id').eq('user_id', userAId).limit(1);
  log('RLS score_events: A reads own', (selfScore as unknown[] || []).length > 0);

  const { data: crossScore } = await clientB.from('score_events').select('id').eq('user_id', userAId).limit(1);
  log('RLS score_events: B cannot read A', (crossScore as unknown[] || []).length === 0, crossScore?.length ? `got ${(crossScore as unknown[]).length} rows` : '');

  // --- streaks ---
  const { data: selfStreak } = await clientA.from('streaks').select('*').eq('user_id', userAId).maybeSingle();
  log('RLS streaks: A reads own', !!selfStreak, !selfStreak ? 'blocked' : '');

  const { data: crossStreak } = await clientB.from('streaks').select('*').eq('user_id', userAId).maybeSingle();
  log('RLS streaks: B cannot read A', !crossStreak, crossStreak ? 'saw user A data' : '');

  // --- leaderboard_entries ---
  // Seed leaderboard entry via service_role
  await serviceClient.from('leaderboard_entries').insert({
    user_id: userAId,
    period_type: 'weekly',
    period_start: '2026-07-06',
    period_end: '2026-07-12',
    country_code: 'US',
    score: 500,
    rank: 1,
  });

  // Authenticated user can read leaderboard
  const { data: lbRead } = await clientA.from('leaderboard_entries').select('*').limit(1);
  log('RLS leaderboard: authenticated can read', (lbRead as unknown[] || []).length > 0);

  // Normal user CANNOT insert leaderboard
  const { error: lbInsert } = await clientA.from('leaderboard_entries').insert({
    user_id: userAId,
    period_type: 'weekly',
    period_start: '2026-07-13',
    period_end: '2026-07-19',
    country_code: 'US',
    score: 9999,
    rank: 1,
  });
  log('RLS leaderboard: user cannot insert', !!lbInsert, lbInsert?.message);

  // =========================================================================
  // SECTION 4: Content/admin tables — cannot be written by normal users
  // =========================================================================
  console.log('\n── SECTION 4: Content table write protection ──');

  const { error: contentInsertBadge } = await clientA.from('badges').insert({
    code: 'test_rls_badge',
    name: 'Test RLS Badge',
    description: 'Should not be insertable',
  });
  log('RLS content: user cannot insert badge', !!contentInsertBadge, contentInsertBadge?.message);

  const { error: contentUpdateScenario } = await clientA.from('scenarios').update({ title: 'HACKED' }).eq('is_demo', true);
  log('RLS content: user cannot update scenario', !!contentUpdateScenario, contentUpdateScenario?.message);

  const { error: contentDeleteMission } = await clientA.from('missions').delete().neq('code', 'nonexistent');
  log('RLS content: user cannot delete mission', !!contentDeleteMission, contentDeleteMission?.message);

  // =========================================================================
  // Cleanup
  // =========================================================================
  console.log('\n── Cleanup ──');

  // Delete all test data.
  await serviceClient.from('leaderboard_entries').delete().eq('user_id', userAId);
  await serviceClient.from('score_events').delete().eq('user_id', userAId);
  if (bankItemId) {
    await serviceClient.from('phrase_reviews').delete().eq('phrase_bank_item_id', bankItemId);
    await serviceClient.from('phrase_bank_items').delete().eq('id', bankItemId);
  }
  if (lessonAttemptId) {
    await serviceClient.from('phrase_attempts').delete().eq('lesson_attempt_id', lessonAttemptId);
    await serviceClient.from('pronunciation_attempts').delete().eq('lesson_attempt_id', lessonAttemptId);
    await serviceClient.from('lesson_attempts').delete().eq('id', lessonAttemptId);
  }
  await serviceClient.from('streaks').delete().eq('user_id', userAId);
  await serviceClient.from('user_missions').delete().eq('user_id', userAId);
  await serviceClient.from('user_badges').delete().eq('user_id', userAId);
  await serviceClient.from('user_profiles').delete().eq('user_id', userAId);
  await serviceClient.from('user_profiles').delete().eq('user_id', userBId);

  // Delete test users
  await serviceClient.auth.admin.deleteUser(userAId);
  await serviceClient.auth.admin.deleteUser(userBId);

  console.log('  Test data cleaned up.');

  // =========================================================================
  // Results
  // =========================================================================
  summary();
}

main().catch((err) => {
  console.error('RLS verification failed with error:', err);
  process.exit(1);
});
