-- FluentDraft MVP — Row Level Security policies
-- Source of truth: docs/database-schema.md §RLS Policy Direction
-- Enables RLS on all 11 user-owned tables and adds auth.uid() ownership policies.
-- Content tables (languages, levels, packs, scenarios, chunks, phrases, translations,
-- badges, missions) remain without RLS — publicly readable, admin-only writes.
-- ============================================================================

-- ============================================================================
-- 1. user_profiles — users own exactly one row (keyed by user_id)
-- ============================================================================
alter table user_profiles enable row level security;

create policy "Users can select own profile" on user_profiles
  for select using (user_id = auth.uid());

create policy "Users can insert own profile" on user_profiles
  for insert with check (user_id = auth.uid());

create policy "Users can update own profile" on user_profiles
  for update using (user_id = auth.uid());

-- No delete policy — profiles are not user-deletable in MVP.

-- ============================================================================
-- 2. lesson_attempts — direct ownership via user_id
-- ============================================================================
alter table lesson_attempts enable row level security;

create policy "Users can select own lesson_attempts" on lesson_attempts
  for select using (user_id = auth.uid());

create policy "Users can insert own lesson_attempts" on lesson_attempts
  for insert with check (user_id = auth.uid());

create policy "Users can update own lesson_attempts" on lesson_attempts
  for update using (user_id = auth.uid());

create policy "Users can delete own lesson_attempts" on lesson_attempts
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 3. phrase_attempts — authorized through owning lesson_attempt
-- ============================================================================
alter table phrase_attempts enable row level security;

create policy "Users can select own phrase_attempts" on phrase_attempts
  for select using (
    exists (
      select 1 from lesson_attempts
      where lesson_attempts.id = phrase_attempts.lesson_attempt_id
      and lesson_attempts.user_id = auth.uid()
    )
  );

create policy "Users can insert own phrase_attempts" on phrase_attempts
  for insert with check (
    exists (
      select 1 from lesson_attempts
      where lesson_attempts.id = phrase_attempts.lesson_attempt_id
      and lesson_attempts.user_id = auth.uid()
    )
  );

-- Phrase attempts are append-only — no update/delete needed.

-- ============================================================================
-- 4. pronunciation_attempts — authorized through owning lesson_attempt
-- ============================================================================
alter table pronunciation_attempts enable row level security;

create policy "Users can select own pronunciation_attempts" on pronunciation_attempts
  for select using (
    exists (
      select 1 from lesson_attempts
      where lesson_attempts.id = pronunciation_attempts.lesson_attempt_id
      and lesson_attempts.user_id = auth.uid()
    )
  );

create policy "Users can insert own pronunciation_attempts" on pronunciation_attempts
  for insert with check (
    exists (
      select 1 from lesson_attempts
      where lesson_attempts.id = pronunciation_attempts.lesson_attempt_id
      and lesson_attempts.user_id = auth.uid()
    )
  );

-- Pronunciation attempts are append-only — no update/delete needed.

-- ============================================================================
-- 5. phrase_bank_items — direct ownership via user_id
-- ============================================================================
alter table phrase_bank_items enable row level security;

create policy "Users can select own phrase_bank_items" on phrase_bank_items
  for select using (user_id = auth.uid());

create policy "Users can insert own phrase_bank_items" on phrase_bank_items
  for insert with check (user_id = auth.uid());

create policy "Users can update own phrase_bank_items" on phrase_bank_items
  for update using (user_id = auth.uid());

create policy "Users can delete own phrase_bank_items" on phrase_bank_items
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 6. phrase_reviews — direct ownership via user_id, plus bank-item ownership for insert
-- ============================================================================
alter table phrase_reviews enable row level security;

create policy "Users can select own phrase_reviews" on phrase_reviews
  for select using (user_id = auth.uid());

create policy "Users can insert own phrase_reviews" on phrase_reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from phrase_bank_items
      where phrase_bank_items.id = phrase_reviews.phrase_bank_item_id
      and phrase_bank_items.user_id = auth.uid()
    )
  );

-- Phrase reviews are append-only — no update/delete needed.

-- ============================================================================
-- 7. score_events — direct ownership via user_id (append-only for users)
-- ============================================================================
alter table score_events enable row level security;

create policy "Users can select own score_events" on score_events
  for select using (user_id = auth.uid());

create policy "Users can insert own score_events" on score_events
  for insert with check (user_id = auth.uid());

-- Score events are append-only — no update/delete from user side.

-- ============================================================================
-- 8. streaks — direct ownership via user_id (one row per user)
-- ============================================================================
alter table streaks enable row level security;

create policy "Users can select own streak" on streaks
  for select using (user_id = auth.uid());

create policy "Users can insert own streak" on streaks
  for insert with check (user_id = auth.uid());

create policy "Users can update own streak" on streaks
  for update using (user_id = auth.uid());

-- Streaks are managed per-user — no delete needed.

-- ============================================================================
-- 9. user_badges — direct ownership via user_id (append-only)
-- ============================================================================
alter table user_badges enable row level security;

create policy "Users can select own user_badges" on user_badges
  for select using (user_id = auth.uid());

create policy "Users can insert own user_badges" on user_badges
  for insert with check (user_id = auth.uid());

-- Badges are awarded, never updated or deleted by users.

-- ============================================================================
-- 10. user_missions — direct ownership via user_id
-- ============================================================================
alter table user_missions enable row level security;

create policy "Users can select own user_missions" on user_missions
  for select using (user_id = auth.uid());

create policy "Users can insert own user_missions" on user_missions
  for insert with check (user_id = auth.uid());

create policy "Users can update own user_missions" on user_missions
  for update using (user_id = auth.uid());

-- Mission progress is system-managed — no user delete.

-- ============================================================================
-- 11. leaderboard_entries — read-only for authenticated users
-- ============================================================================
alter table leaderboard_entries enable row level security;

create policy "Authenticated users can read leaderboard" on leaderboard_entries
  for select using (auth.role() = 'authenticated');

-- No insert, update, or delete policies for normal users.
-- Leaderboard entries are populated by server-side logic (service_role).

-- ============================================================================
-- Content tables (intentionally left WITHOUT RLS):
--   supported_languages, user_levels, scenario_packs, scenarios,
--   lesson_chunks, key_phrases, translations, badges, missions
-- These remain publicly readable. Writes are admin-only via service_role /
-- migration scripts. Normal authenticated users cannot write to them
-- because no INSERT/UPDATE/DELETE policies exist.
-- ============================================================================
