-- FluentDraft MVP — Seed gamification definitions
-- Idempotent: safe to re-run (ON CONFLICT DO UPDATE).
-- Seeds user_levels, badges, and missions reference tables.
-- Awarding/progress/scoring logic is implemented in later steps (38–39).

-- ============================================================================
-- User levels: clear increasing XP thresholds with professional names
-- ============================================================================
-- XP scale rationale (from plan.md scoring):
--   Correct phrase first try: 10, retry: 5, lesson completion: 15,
--   perfect recall: 20, save phrase: 5, daily streak: 5,
--   difficulty multiplier: 1.0 / 1.2 / 1.5
--   → ~30–60 XP per full lesson for a typical beginner/intermediate user.
-- Thresholds are designed so early levels feel achievable (2–3 lessons)
-- and later levels require sustained practice.

insert into user_levels (level_number, name, min_xp) values
  (1,  'Newcomer',       0),
  (2,  'Learner',        100),
  (3,  'Practitioner',   250),
  (4,  'Communicator',   500),
  (5,  'Wordsmith',      1000),
  (6,  'Professional',   2000),
  (7,  'Specialist',     3500),
  (8,  'Expert',         5000),
  (9,  'Master',         7500),
  (10, 'Virtuoso',       10000)
on conflict (level_number) do update set
  name   = excluded.name,
  min_xp = excluded.min_xp;

-- ============================================================================
-- Badges: stable lowercase snake_case codes, names & descriptions aligned
-- with FluentDraft's core learning loop (Understand → Practice → Recall → Save)
-- ============================================================================

insert into badges (code, name, description, icon) values
  ('first_lesson',        'First Step',        'Complete your first lesson',                        null),
  ('practice_streak_3',   'Consistent',        'Maintain a 3-day practice streak',                  null),
  ('practice_streak_7',   'Dedicated',         'Maintain a 7-day practice streak',                  null),
  ('practice_streak_14',  'Committed',         'Maintain a 14-day practice streak',                 null),
  ('perfect_recall',      'Perfect Recall',    'Complete a recall phase with zero mistakes',        null),
  ('first_save',          'Collector',         'Save your first phrase to the Phrase Bank',         null),
  ('five_phrases',        'Librarian',         'Save 5 phrases to the Phrase Bank',                 null),
  ('ten_phrases',         'Curator',           'Save 10 phrases to the Phrase Bank',                null),
  ('five_lessons',        'Scholar',           'Complete 5 lessons',                                null),
  ('ten_lessons',         'Veteran',           'Complete 10 lessons',                               null),
  ('pronunciation_try',   'Speaker',           'Complete your first pronunciation practice',        null),
  ('all_phases',          'Thorough',          'Complete all four phases in a single lesson',       null)
on conflict (code) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon;

-- ============================================================================
-- Missions: simple MVP-trackable goals with target_value, xp_reward, is_active.
-- Avoids future/premium/social features.
-- ============================================================================

insert into missions (code, title, description, target_value, xp_reward, is_active) values
  ('complete_first_lesson',    'First Mission',     'Complete 1 lesson',                       1,   50,  true),
  ('save_three_phrases',       'Build Your Bank',   'Save 3 phrases to the Phrase Bank',       3,   30,  true),
  ('three_day_streak',         'Keep It Going',     'Achieve a 3-day practice streak',         3,   25,  true),
  ('complete_five_lessons',    'Lesson Marathon',   'Complete 5 lessons',                      5,   100, true),
  ('perfect_recall_mission',   'Memory Master',     'Complete a recall phase perfectly',       1,   40,  true),
  ('save_ten_phrases',         'Phrase Collector',  'Save 10 phrases to the Phrase Bank',      10,  75,  true),
  ('complete_ten_lessons',     'Seasoned Learner',  'Complete 10 lessons',                     10,  150, true)
on conflict (code) do update set
  title        = excluded.title,
  description  = excluded.description,
  target_value = excluded.target_value,
  xp_reward    = excluded.xp_reward,
  is_active    = excluded.is_active;
