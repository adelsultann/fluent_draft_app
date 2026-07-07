# FluentDraft Database Plan

## Purpose

This document explains the high-level direction for FluentDraft's Supabase/Postgres data model. The concrete proposed schema and ER diagram live in [database-schema.md](./database-schema.md).

The goal is to keep the data model aligned with the product loop: demo, onboarding, practice, pronunciation, recall, scoring, phrase bank, review, and leaderboards.

## Initial Entity Groups

### Identity And Profile

- `users`: Supabase-managed auth users.
- `user_profiles`: display name, country, English level, target language, onboarding status, and public leaderboard preferences.
- `supported_languages`: languages available for translation reveal.

### Lesson Content

- `scenario_packs`: groups such as Job Hunt & Career, Daily Workplace, and Daily Life & Adulting.
- `scenarios`: individual lessons with title, context, goal, tone, criteria, difficulty, and model response.
- `lesson_chunks`: chunked parts of the model response used for guided typing.
- `key_phrases`: useful phrases users pronounce, type, recall, and save.
- `phrase_translations`: target-language translations for key phrases or lesson content.

### Practice And Attempts

- `demo_attempts`: temporary or converted records for the fixed demo lesson.
- `lesson_attempts`: registered user attempts, phase progress, completion state, score, and timestamps.
- `phrase_attempts`: typed phrase answers, attempt number, exact-match result, and mistake details.
- `pronunciation_attempts`: spoken phrase attempts, browser transcript, pass/retry result, and feedback summary.

### Phrase Bank And Review

- `phrase_bank_items`: saved phrases linked to users, source scenarios, meaning, examples, and favorite status.
- `phrase_reviews`: review attempts, answer result, Easy/Hard rating, and next review date.
- `phrase_mastery_events`: optional history of mastery changes if detailed tracking is needed.

### Scoring And Gamification

- `user_scores`: score events from lessons, reviews, streaks, bonuses, and missions.
- `streaks`: current and historical streak tracking.
- `badges`: badge definitions.
- `user_badges`: awarded badges.
- `missions`: mission definitions.
- `user_missions`: user progress toward missions.
- `user_levels`: XP thresholds and level names.

### Leaderboards

- `leaderboard_entries`: weekly and monthly rankable score aggregates by user, period, and optional pack.
- Leaderboard public fields should include display name, country, rank, score, and period.

## MVP Rules To Model

- Anonymous users can only access one fixed demo lesson.
- Demo progress should remain local/session-based until signup, then convert into registered user progress.
- Typed phrase answers require exact text for MVP.
- Pronunciation starts with browser speech recognition and simple pass/retry feedback.
- English is the primary learning language.
- Translation is a revealable helper based on the user's target language.
- Weekly and monthly leaderboards reset by period so new users have a fair chance.
- Repeating the same lesson should give reduced points after first full completion.

## Security And RLS Direction

- Users can read their own profile, attempts, phrase bank, reviews, streaks, badges, missions, and private progress.
- Users can update their own profile and learning data only.
- Lesson content can be publicly readable if it is part of the free/demo/MVP catalog.
- Leaderboard views should expose only public-safe fields.
- Admin-only writes are required for seeded lesson content, supported languages, badge definitions, mission definitions, and level definitions.

## Indexing Direction

- Index user-owned tables by `user_id`.
- Index attempts by `user_id`, `scenario_id`, and completion timestamp.
- Index leaderboard entries by period type, period start, score, country, and pack where applicable.
- Index phrase reviews by `user_id` and next review date.

## Open Decisions

- Exact list of common target languages for MVP.
- Whether demo attempts are stored only in browser state or also in a temporary server table before signup.
- Whether phrase mastery uses a simple status field or a spaced-repetition schedule from the start.
- Whether leaderboard aggregation is calculated on write, scheduled, or queried from score events.

## Related Docs

- [Docs index](./README.md)
- [plan.md](../plan.md)
- [system-design.md](./system-design.md)
- [architecture.md](./architecture.md)
- [database-schema.md](./database-schema.md)
- [api-contracts.md](./api-contracts.md)
- [project-structure.md](./project-structure.md)
- [testing-strategy.md](./testing-strategy.md)
