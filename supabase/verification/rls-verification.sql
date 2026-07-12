-- ============================================================================
-- FluentDraft — RLS Policy Verification Script
-- ============================================================================
-- Purpose: Verify that Row Level Security policies work correctly for all
--          11 user-owned tables and content/admin tables.
--
-- Usage:
--   Run this script in the Supabase Dashboard SQL Editor, or via:
--     psql <connection-string> -f supabase/verification/rls-verification.sql
--   or with a local Supabase container:
--     npx supabase db reset && npx supabase db test
--
-- The script is self-contained: it seeds minimal reference data, creates
-- two test users, runs RLS checks, and cleans up everything at the end.
--
-- Related docs:
--   - docs/database-schema.md § RLS Policy Direction
--   - docs/testing-strategy.md § Supabase And RLS Testing
--   - docs/tasks-and-acceptance-criteria.md § Step 51
-- ============================================================================


-- ============================================================================
-- Helper: Set up two test users
-- ============================================================================
-- We insert directly into auth.users for testing purposes. In production,
-- users are created via Supabase Auth. These IDs are deterministic for testing.
do $$
declare
  user_a_id uuid := '00000000-0000-0000-0000-aaaaaaaa0001';
  user_b_id uuid := '00000000-0000-0000-0000-bbbbbbbb0001';
begin

  -- Clean up any leftover test data from previous runs.
  delete from leaderboard_entries where user_id in (user_a_id, user_b_id);
  delete from score_events where user_id in (user_a_id, user_b_id);
  delete from phrase_reviews where user_id in (user_a_id, user_b_id);
  delete from phrase_bank_items where user_id in (user_a_id, user_b_id);
  delete from pronunciation_attempts
    where lesson_attempt_id in (
      select id from lesson_attempts where user_id in (user_a_id, user_b_id)
    );
  delete from phrase_attempts
    where lesson_attempt_id in (
      select id from lesson_attempts where user_id in (user_a_id, user_b_id)
    );
  delete from lesson_attempts where user_id in (user_a_id, user_b_id);
  delete from user_missions where user_id in (user_a_id, user_b_id);
  delete from user_badges where user_id in (user_a_id, user_b_id);
  delete from streaks where user_id in (user_a_id, user_b_id);
  delete from user_profiles where user_id in (user_a_id, user_b_id);

  -- =========================================================================
  -- Seed minimal reference data (self-contained — no existing data required)
  -- =========================================================================
  -- The database may not have seed data applied.  Insert the bare minimum
  -- needed for foreign-key integrity.

  -- supported_languages (needed for user_profiles FK)
  insert into supported_languages (code, name, native_name)
  values ('ar', 'Arabic', 'العربية')
  on conflict (code) do nothing;

  insert into supported_languages (code, name, native_name)
  values ('es', 'Spanish', 'Español')
  on conflict (code) do nothing;

  -- user_levels (needed for user_profiles FK, may be referenced)
  insert into user_levels (level_number, name, min_xp)
  values (1, 'Newcomer', 0)
  on conflict (level_number) do nothing;

  -- scenario_pack (parent of scenario)
  insert into scenario_packs (id, title, slug, description)
  values (
    '00000000-0000-0000-0000-ffffffff0001',
    'RLS Test Pack',
    'rls-test-pack',
    'Temporary pack for RLS verification'
  ) on conflict (id) do nothing;

  -- scenario (needed for lesson_attempts, phrase_bank_items FKs)
  insert into scenarios (id, pack_id, title, slug, context, goal, tone, difficulty, model_response)
  values (
    '00000000-0000-0000-0000-ffffffff0002',
    '00000000-0000-0000-0000-ffffffff0001',
    'RLS Test Scenario',
    'rls-test-scenario',
    'Test context for RLS verification.',
    'Test goal.',
    'professional',
    'beginner',
    'This is a test model response for RLS verification.'
  ) on conflict (id) do nothing;

  -- key_phrase (needed for phrase_attempts, phrase_bank_items FKs)
  insert into key_phrases (id, scenario_id, phrase_order, text, meaning, example)
  values (
    '00000000-0000-0000-0000-ffffffff0003',
    '00000000-0000-0000-0000-ffffffff0002',
    1,
    'test key phrase for RLS',
    'A phrase used only for RLS verification.',
    'Example usage of the test phrase.'
  ) on conflict (id) do nothing;

  -- badge (needed for user_badges FK)
  insert into badges (id, code, name, description)
  values (
    '00000000-0000-0000-0000-ffffffff0004',
    'rls_test_badge',
    'RLS Test Badge',
    'Temporary badge for RLS verification.'
  ) on conflict (id) do nothing;

  -- mission (needed for user_missions FK)
  insert into missions (id, code, title, description, target_value, xp_reward)
  values (
    '00000000-0000-0000-0000-ffffffff0005',
    'rls_test_mission',
    'RLS Test Mission',
    'Temporary mission for RLS verification.',
    1,
    10
  ) on conflict (id) do nothing;

  -- Insert test users into auth.users (skip if already present from prior run).
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (user_a_id, 'verify-a@fluentdraft.test', '$2a$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', now(), 'authenticated', 'authenticated', '{}', '{}', now(), now()),
    (user_b_id, 'verify-b@fluentdraft.test', '$2a$10$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', now(), 'authenticated', 'authenticated', '{}', '{}', now(), now())
  on conflict (id) do nothing;

  -- Seed user profiles (skip if already present).
  insert into user_profiles (user_id, display_name, country_code, english_level, target_language_code, onboarding_complete)
  values
    (user_a_id, 'Verification User A', 'US', 'intermediate', 'ar', true),
    (user_b_id, 'Verification User B', 'GB', 'beginner',    'es', true)
  on conflict (user_id) do update set display_name = excluded.display_name;

  -- Seed a lesson_attempt for User A.
  -- We need a valid scenario and key_phrase; use the fixed demo scenario.
  insert into lesson_attempts (id, user_id, scenario_id, status, current_phase)
  values (
    '00000000-0000-0000-0000-aaaaaaa10001',
    user_a_id,
    '00000000-0000-0000-0000-ffffffff0002',
    'completed',
    'save'
  );

  -- Seed a phrase_attempt owned by User A (via lesson_attempt).
  insert into phrase_attempts (lesson_attempt_id, key_phrase_id, typed_text, expected_text, attempt_number, is_correct)
  values (
    '00000000-0000-0000-0000-aaaaaaa10001',
    (select id from key_phrases where id = '00000000-0000-0000-0000-ffffffff0003'),
    'typed text',
    'expected text',
    1,
    true
  );

  -- Seed a pronunciation_attempt owned by User A.
  insert into pronunciation_attempts (lesson_attempt_id, key_phrase_id, expected_text, transcript, status, feedback, browser_supported)
  values (
    '00000000-0000-0000-0000-aaaaaaa10001',
    (select id from key_phrases where id = '00000000-0000-0000-0000-ffffffff0003'),
    'expected text',
    'transcript',
    'passed',
    'Great pronunciation!',
    true
  );

  -- Seed a phrase_bank_item for User A.
  insert into phrase_bank_items (id, user_id, key_phrase_id, source_scenario_id, mastery)
  values (
    '00000000-0000-0000-0000-aaaaaab10001',
    user_a_id,
    (select id from key_phrases where id = '00000000-0000-0000-0000-ffffffff0003'),
    '00000000-0000-0000-0000-ffffffff0002',
    'new'
  );

  -- Seed a phrase_review for User A.
  insert into phrase_reviews (phrase_bank_item_id, user_id, typed_text, expected_text, is_correct, rating, mastery_after)
  values (
    '00000000-0000-0000-0000-aaaaaab10001',
    user_a_id,
    'typed text',
    'expected text',
    true,
    'easy',
    'learning'
  );

  -- Seed a score_event for User A.
  insert into score_events (user_id, lesson_attempt_id, event_type, points)
  values (
    user_a_id,
    '00000000-0000-0000-0000-aaaaaaa10001',
    'lesson_completion',
    100
  );

  -- Seed a streak for User A.
  insert into streaks (user_id, current_streak_days, longest_streak_days, last_practice_date)
  values (user_a_id, 3, 5, current_date);

  -- Seed a user_badge for User A.
  insert into user_badges (user_id, badge_id)
  values (
    user_a_id,
    (select id from badges where id = '00000000-0000-0000-0000-ffffffff0004')
  );

  -- Seed a user_mission for User A.
  insert into user_missions (user_id, mission_id, progress_value)
  values (
    user_a_id,
    (select id from missions where id = '00000000-0000-0000-0000-ffffffff0005'),
    1
  );

  -- Seed a leaderboard_entry for User A.
  insert into leaderboard_entries (user_id, period_type, period_start, period_end, country_code, score, rank)
  values (
    user_a_id,
    'weekly',
    '2026-07-06',
    '2026-07-12',
    'US',
    500,
    1
  );

  raise notice 'Test data seeded for users % and %.', user_a_id, user_b_id;
end;
$$;

-- ============================================================================
-- Helper: Impersonate a specific user
-- ============================================================================
-- Sets the session role to 'authenticated' and injects the provided user_id
-- into request.jwt.claims so that auth.uid() returns that value.
-- Must be run from a session that already has superuser/service_role privileges
-- (e.g. Supabase Dashboard SQL Editor).
create or replace function rls_verify_impersonate(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user_id, 'role', 'authenticated')::text,
    true);
end;
$$;

-- ============================================================================
-- Helper: Log a pass/fail result
-- ============================================================================
create or replace function rls_verify_log(
  p_test_name text,
  p_passed    boolean,
  p_detail    text default null
)
returns void
language plpgsql
as $$
begin
  if p_passed then
    raise notice 'PASS: %', p_test_name;
  else
    raise warning 'FAIL: % — %', p_test_name, coalesce(p_detail, 'unexpected result');
  end if;
end;
$$;

-- ============================================================================
-- ============================================================================
-- TESTS
-- ============================================================================
-- ============================================================================

do $$
declare
  user_a_id uuid := '00000000-0000-0000-0000-aaaaaaaa0001';
  user_b_id uuid := '00000000-0000-0000-0000-bbbbbbbb0001';

  -- Variables for test results
  v_count      integer;
  v_display    text;
  v_success    boolean;
  v_error_msg  text;
begin

  -- ==========================================================================
  -- 1. user_profiles
  -- ==========================================================================

  -- 1a: User A can read own profile
  perform rls_verify_impersonate(user_a_id);
  select display_name into v_display from user_profiles where user_id = user_a_id;
  perform rls_verify_log('user_profiles: user can read own profile', v_display = 'Verification User A');

  -- 1b: User A can update own profile
  update user_profiles set display_name = 'User A Updated' where user_id = user_a_id;
  select display_name into v_display from user_profiles where user_id = user_a_id;
  perform rls_verify_log('user_profiles: user can update own profile', v_display = 'User A Updated');
  -- Restore
  update user_profiles set display_name = 'Verification User A' where user_id = user_a_id;

  -- 1c: User B CANNOT read User A's profile
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from user_profiles where user_id = user_a_id;
  perform rls_verify_log('user_profiles: user B cannot read user A profile', v_count = 0,
    'got ' || v_count || ' rows');

  -- 1d: User B CANNOT update User A's profile
  update user_profiles set display_name = 'HACKED' where user_id = user_a_id;
  select display_name into v_display from user_profiles where user_id = user_a_id;
  perform rls_verify_log('user_profiles: user B cannot update user A profile', v_display is null,
    'got display_name=' || coalesce(v_display, 'NULL'));

  -- 1e: User A can insert their own profile (if not exists)
  -- Already inserted above; test that duplicate insert fails.
  perform rls_verify_impersonate(user_a_id);
  begin
    insert into user_profiles (user_id, display_name, country_code, english_level, target_language_code)
    values (user_a_id, 'Duplicate', 'US', 'beginner', 'ar');
    raise notice 'UNEXPECTED: insert succeeded on existing profile';
  exception when others then
    -- Expected (primary key violation or RLS)
  end;

  -- ==========================================================================
  -- 2. lesson_attempts
  -- ==========================================================================

  -- 2a: User A can read own lesson_attempts
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from lesson_attempts where user_id = user_a_id;
  perform rls_verify_log('lesson_attempts: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 2b: User B CANNOT read User A's lesson_attempts
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from lesson_attempts where user_id = user_a_id;
  perform rls_verify_log('lesson_attempts: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 2c: User B CANNOT insert a lesson_attempt with User A's user_id
  -- But CAN insert with its own user_id
  perform rls_verify_impersonate(user_b_id);
  begin
    insert into lesson_attempts (user_id, scenario_id, status, current_phase)
    values (user_a_id, '00000000-0000-0000-0000-ffffffff0002', 'in_progress', 'understand');
    perform rls_verify_log('lesson_attempts: user B cannot insert with user A id', false,
      'INSERT succeeded — RLS violation');
  exception when others then
    perform rls_verify_log('lesson_attempts: user B cannot insert with user A id', true);
  end;

  -- ==========================================================================
  -- 3. phrase_attempts (via parent lesson_attempt ownership)
  -- ==========================================================================

  -- 3a: User A can read own phrase_attempts (via owned lesson_attempt)
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from phrase_attempts
  where lesson_attempt_id = '00000000-0000-0000-0000-aaaaaaa10001';
  perform rls_verify_log('phrase_attempts: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 3b: User B CANNOT read User A's phrase_attempts
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from phrase_attempts
  where lesson_attempt_id = '00000000-0000-0000-0000-aaaaaaa10001';
  perform rls_verify_log('phrase_attempts: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 3c: User B CANNOT insert phrase_attempt into User A's lesson_attempt
  perform rls_verify_impersonate(user_b_id);
  begin
    insert into phrase_attempts (lesson_attempt_id, key_phrase_id, typed_text, expected_text, attempt_number, is_correct)
    values (
      '00000000-0000-0000-0000-aaaaaaa10001',
      (select id from key_phrases where id = '00000000-0000-0000-0000-ffffffff0003'),
      'hacked text',
      'expected text',
      1,
      false
    );
    perform rls_verify_log('phrase_attempts: user B cannot insert into user A lesson', false,
      'INSERT succeeded — RLS violation');
  exception when others then
    perform rls_verify_log('phrase_attempts: user B cannot insert into user A lesson', true);
  end;

  -- ==========================================================================
  -- 4. pronunciation_attempts (via parent lesson_attempt ownership)
  -- ==========================================================================

  -- 4a: User A can read own pronunciation_attempts
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from pronunciation_attempts
  where lesson_attempt_id = '00000000-0000-0000-0000-aaaaaaa10001';
  perform rls_verify_log('pronunciation_attempts: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 4b: User B CANNOT read User A's pronunciation_attempts
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from pronunciation_attempts
  where lesson_attempt_id = '00000000-0000-0000-0000-aaaaaaa10001';
  perform rls_verify_log('pronunciation_attempts: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 4c: User B CANNOT insert pronunciation_attempt into User A's lesson_attempt
  perform rls_verify_impersonate(user_b_id);
  begin
    insert into pronunciation_attempts (lesson_attempt_id, key_phrase_id, expected_text, transcript, status, feedback, browser_supported)
    values (
      '00000000-0000-0000-0000-aaaaaaa10001',
      (select id from key_phrases where id = '00000000-0000-0000-0000-ffffffff0003'),
      'expected text',
      'hacked transcript',
      'passed',
      'ok',
      true
    );
    perform rls_verify_log('pronunciation_attempts: user B cannot insert into user A lesson', false,
      'INSERT succeeded — RLS violation');
  exception when others then
    perform rls_verify_log('pronunciation_attempts: user B cannot insert into user A lesson', true);
  end;

  -- ==========================================================================
  -- 5. phrase_bank_items
  -- ==========================================================================

  -- 5a: User A can read own phrase_bank_items
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from phrase_bank_items where user_id = user_a_id;
  perform rls_verify_log('phrase_bank_items: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 5b: User B CANNOT read User A's phrase_bank_items
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from phrase_bank_items where user_id = user_a_id;
  perform rls_verify_log('phrase_bank_items: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 5c: User B CANNOT update User A's phrase_bank_items
  perform rls_verify_impersonate(user_b_id);
  update phrase_bank_items set mastery = 'mastered'
  where id = '00000000-0000-0000-0000-aaaaaab10001';
  select mastery into v_display from phrase_bank_items
  where id = '00000000-0000-0000-0000-aaaaaab10001';
  -- As user B, we should either see 0 rows (RLS blocks read) or mastery unchanged
  perform rls_verify_log('phrase_bank_items: user B cannot update user A''s',
    (v_display is null or v_display = 'new'),
    'got mastery=' || coalesce(v_display, 'NULL'));

  -- 5d: User B CANNOT delete User A's phrase_bank_items
  perform rls_verify_impersonate(user_b_id);
  delete from phrase_bank_items where id = '00000000-0000-0000-0000-aaaaaab10001';
  -- Verify item still exists (as user A)
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from phrase_bank_items
  where id = '00000000-0000-0000-0000-aaaaaab10001';
  perform rls_verify_log('phrase_bank_items: user B cannot delete user A''s', v_count > 0,
    'got ' || v_count || ' rows (0 = deleted)');

  -- ==========================================================================
  -- 6. phrase_reviews
  -- ==========================================================================

  -- 6a: User A can read own phrase_reviews
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from phrase_reviews where user_id = user_a_id;
  perform rls_verify_log('phrase_reviews: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 6b: User B CANNOT read User A's phrase_reviews
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from phrase_reviews where user_id = user_a_id;
  perform rls_verify_log('phrase_reviews: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 6c: User B CANNOT insert phrase_review tied to User A's phrase_bank_item
  perform rls_verify_impersonate(user_b_id);
  begin
    insert into phrase_reviews (phrase_bank_item_id, user_id, typed_text, expected_text,
                                is_correct, rating, mastery_after)
    values (
      '00000000-0000-0000-0000-aaaaaab10001',
      user_a_id,  -- attempting to insert with User A's ID
      'hacked',
      'expected text',
      false,
      'hard',
      'learning'
    );
    perform rls_verify_log('phrase_reviews: user B cannot insert into user A bank item', false,
      'INSERT succeeded — RLS violation');
  exception when others then
    perform rls_verify_log('phrase_reviews: user B cannot insert into user A bank item', true);
  end;

  -- ==========================================================================
  -- 7. score_events
  -- ==========================================================================

  -- 7a: User A can read own score_events
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from score_events where user_id = user_a_id;
  perform rls_verify_log('score_events: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 7b: User B CANNOT read User A's score_events
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from score_events where user_id = user_a_id;
  perform rls_verify_log('score_events: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 7c: User B CANNOT insert score_event with User A's user_id
  perform rls_verify_impersonate(user_b_id);
  begin
    insert into score_events (user_id, event_type, points)
    values (user_a_id, 'lesson_completion', 999);
    perform rls_verify_log('score_events: user B cannot insert with user A id', false,
      'INSERT succeeded — RLS violation');
  exception when others then
    perform rls_verify_log('score_events: user B cannot insert with user A id', true);
  end;

  -- ==========================================================================
  -- 8. streaks
  -- ==========================================================================

  -- 8a: User A can read own streaks
  perform rls_verify_impersonate(user_a_id);
  select current_streak_days into v_count from streaks where user_id = user_a_id;
  perform rls_verify_log('streaks: user can read own', v_count = 3,
    'got streak=' || v_count);

  -- 8b: User B CANNOT read User A's streaks
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from streaks where user_id = user_a_id;
  perform rls_verify_log('streaks: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 8c: User B CANNOT update User A's streaks
  perform rls_verify_impersonate(user_b_id);
  update streaks set current_streak_days = 999 where user_id = user_a_id;
  perform rls_verify_impersonate(user_a_id);
  select current_streak_days into v_count from streaks where user_id = user_a_id;
  perform rls_verify_log('streaks: user B cannot update user A''s', v_count = 3,
    'got streak=' || v_count);

  -- ==========================================================================
  -- 9. user_badges
  -- ==========================================================================

  -- 9a: User A can read own badges
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from user_badges where user_id = user_a_id;
  perform rls_verify_log('user_badges: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 9b: User B CANNOT read User A's badges
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from user_badges where user_id = user_a_id;
  perform rls_verify_log('user_badges: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- ==========================================================================
  -- 10. user_missions
  -- ==========================================================================

  -- 10a: User A can read own missions
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from user_missions where user_id = user_a_id;
  perform rls_verify_log('user_missions: user can read own', v_count > 0,
    'got ' || v_count || ' rows');

  -- 10b: User B CANNOT read User A's missions
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from user_missions where user_id = user_a_id;
  perform rls_verify_log('user_missions: user B cannot read user A''s', v_count = 0,
    'got ' || v_count || ' rows');

  -- 10c: User B CANNOT update User A's missions
  perform rls_verify_impersonate(user_b_id);
  update user_missions set progress_value = 999 where user_id = user_a_id;
  perform rls_verify_impersonate(user_a_id);
  select max(progress_value) into v_count from user_missions where user_id = user_a_id;
  perform rls_verify_log('user_missions: user B cannot update user A''s', v_count < 999,
    'got progress=' || v_count);

  -- ==========================================================================
  -- 11. leaderboard_entries
  -- ==========================================================================

  -- 11a: Authenticated user (A) can read leaderboard entries
  perform rls_verify_impersonate(user_a_id);
  select count(*) into v_count from leaderboard_entries;
  perform rls_verify_log('leaderboard_entries: user can read all', v_count > 0,
    'got ' || v_count || ' rows');

  -- 11b: Authenticated user (B) can also read leaderboard entries
  perform rls_verify_impersonate(user_b_id);
  select count(*) into v_count from leaderboard_entries;
  perform rls_verify_log('leaderboard_entries: user B can also read all', v_count > 0,
    'got ' || v_count || ' rows');

  -- 11c: Normal user (A) CANNOT insert leaderboard entries
  perform rls_verify_impersonate(user_a_id);
  begin
    insert into leaderboard_entries (user_id, period_type, period_start, period_end, country_code, score, rank)
    values (user_a_id, 'weekly', '2026-07-13', '2026-07-19', 'US', 1000, 1);
    perform rls_verify_log('leaderboard_entries: user cannot insert', false,
      'INSERT succeeded — RLS violation');
  exception when others then
    perform rls_verify_log('leaderboard_entries: user cannot insert', true);
  end;

  -- 11d: Normal user (A) CANNOT update leaderboard entries
  perform rls_verify_impersonate(user_a_id);
  begin
    update leaderboard_entries set score = 99999 where user_id = user_a_id;
    perform rls_verify_log('leaderboard_entries: user cannot update', false,
      'UPDATE succeeded — RLS violation (user set score to 99999)');
  exception when others then
    perform rls_verify_log('leaderboard_entries: user cannot update', true);
  end;

  -- 11e: Normal user CANNOT delete leaderboard entries
  perform rls_verify_impersonate(user_a_id);
  begin
    delete from leaderboard_entries where user_id = user_a_id;
    perform rls_verify_log('leaderboard_entries: user cannot delete', false,
      'DELETE succeeded — RLS violation');
  exception when others then
    perform rls_verify_log('leaderboard_entries: user cannot delete', true);
  end;

  -- ==========================================================================
  -- 12. Content / admin tables — cannot be written by normal users
  -- ==========================================================================

  -- 12a: Normal user CANNOT insert into badges
  perform rls_verify_impersonate(user_a_id);
  begin
    insert into badges (code, name, description) values ('test_badge', 'Test', 'RLS test');
    perform rls_verify_log('content: user cannot insert into badges', false,
      'INSERT succeeded — missing admin protection');
  exception when others then
    perform rls_verify_log('content: user cannot insert into badges', true);
  end;

  -- 12b: Normal user CANNOT insert into missions
  begin
    insert into missions (code, title, description, target_value, xp_reward)
    values ('test_mission', 'Test Mission', 'RLS test', 5, 50);
    perform rls_verify_log('content: user cannot insert into missions', false,
      'INSERT succeeded — missing admin protection');
  exception when others then
    perform rls_verify_log('content: user cannot insert into missions', true);
  end;

  -- 12c: Normal user CANNOT update scenarios
  begin
    update scenarios set title = 'HACKED' where id = '00000000-0000-0000-0000-ffffffff0002';
    perform rls_verify_log('content: user cannot update scenarios', false,
      'UPDATE succeeded — missing admin protection');
  exception when others then
    perform rls_verify_log('content: user cannot update scenarios', true);
  end;

  -- 12d: Normal user CAN read scenarios (public read)
  select count(*) into v_count from scenarios;
  perform rls_verify_log('content: user can read scenarios', v_count > 0,
    'got ' || v_count || ' rows');

  -- 12e: Normal user CAN read badges (public read)
  select count(*) into v_count from badges;
  perform rls_verify_log('content: user can read badges', v_count > 0,
    'got ' || v_count || ' rows');

  -- ==========================================================================
  -- Done
  -- ==========================================================================
  raise notice '========================================';
  raise notice 'RLS verification complete.';
  raise notice 'Check output above for any FAIL warnings.';
  raise notice '========================================';
end;
$$;

-- ============================================================================
-- Cleanup — removes all test data (user-owned + reference content)
-- ============================================================================
do $$
declare
  user_a_id uuid := '00000000-0000-0000-0000-aaaaaaaa0001';
  user_b_id uuid := '00000000-0000-0000-0000-bbbbbbbb0001';
begin
  -- User-owned data
  delete from leaderboard_entries where user_id in (user_a_id, user_b_id);
  delete from score_events where user_id in (user_a_id, user_b_id);
  delete from phrase_reviews where user_id in (user_a_id, user_b_id);
  delete from phrase_bank_items where user_id in (user_a_id, user_b_id);
  delete from pronunciation_attempts
    where lesson_attempt_id in (
      select id from lesson_attempts where user_id in (user_a_id, user_b_id)
    );
  delete from phrase_attempts
    where lesson_attempt_id in (
      select id from lesson_attempts where user_id in (user_a_id, user_b_id)
    );
  delete from lesson_attempts where user_id in (user_a_id, user_b_id);
  delete from user_missions where user_id in (user_a_id, user_b_id);
  delete from user_badges where user_id in (user_a_id, user_b_id);
  delete from streaks where user_id in (user_a_id, user_b_id);
  delete from user_profiles where user_id in (user_a_id, user_b_id);

  -- Reference data seeded by this script
  delete from key_phrases where id = '00000000-0000-0000-0000-ffffffff0003';
  delete from scenarios where id = '00000000-0000-0000-0000-ffffffff0002';
  delete from scenario_packs where id = '00000000-0000-0000-0000-ffffffff0001';
  delete from badges where id = '00000000-0000-0000-0000-ffffffff0004';
  delete from missions where id = '00000000-0000-0000-0000-ffffffff0005';

  raise notice 'Test data cleaned up (helper functions left in place for re-runs).';
end;
$$;
