# AGENTS.md

## Project Identity

FluentDraft is a scenario-based English writing practice app.

The product helps users practice practical English emails, messages, sentences, and professional replies by reading, listening, pronouncing, typing, recalling, reviewing, and saving real-world examples.

Core learning loop:

```text
Understand -> Practice -> Recall -> Save
```

The product should feel serious, practical, premium, calm, focused, professional, and modern. It can be gamified, but it should not feel childish or like a typing game.

## Source Of Truth

Before making product or architecture decisions, read the relevant docs:

- `plan.md`
- `docs/README.md`
- `docs/system-design.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/database-schema.md`
- `docs/api-contracts.md`
- `docs/tasks-and-acceptance-criteria.md`
- `docs/project-structure.md`
- `docs/testing-strategy.md`
- `docs/style-guide.md`
- Notion: `MVP Task Tracker`

Prefer these decisions over inventing new direction. If a decision changes, update the relevant doc instead of leaving knowledge only in chat.

## Working Rules

- Do not implement before understanding the current task and its acceptance criteria.
- Keep changes scoped to the current MVP step.
- Follow the Notion MVP Task Tracker `Step` order unless there is a clear reason not to.
- Use the task's Acceptance Criteria as the definition of done.
- Keep Notion task `Status` current when working from the tracker.
- Do not add premium or future-scope features during MVP unless the task explicitly asks for them.
- Prefer simple, modular monolith design over microservices for MVP.
- Favor clear product behavior over clever abstractions.
- Keep docs updated when implementation decisions affect architecture, database, API contracts, testing, or project structure.

## Tech Direction

MVP stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase/Postgres
- Supabase RLS for user-owned data
- Postgres-first leaderboard implementation
- Browser Web Speech API for MVP pronunciation and audio experiments

Reserved for later:

- Contabo VPS for workers, reports, audio/AI processing, or custom backend services
- Stripe for payments
- Redis if leaderboards become heavy
- Paid pronunciation API after the browser-first MVP proves the practice loop

## Product Rules

- Anonymous users can try one fixed demo lesson.
- Demo progress stays browser-local until signup.
- When a demo user exits midway, prompt them that score and progress will be lost unless they sign up.
- When a demo user completes the lesson, prompt them to register to save progress and compete on leaderboards.
- Registered users complete onboarding with English level, target translation language, and country.
- English is the main learning language.
- Translation is a revealable helper inside the practice screen, not the primary experience.
- MVP supports Arabic plus common target languages for translation reveal.
- Typed phrase answers require exact text matching for MVP.
- Trusted score calculation must happen on the server.
- First full lesson completion gives full eligible points.
- Repeated lesson completion gives reduced points.
- Skipped required phases reduce score.
- Leaderboards show safe public fields only: display name, country, rank, score, and period.
- Weekly and monthly leaderboards should reset by explicit period so new users have a fair chance.

## Practice Experience Rules

The practice screen should support:

- Scenario title
- Context
- Goal
- Tone badge
- Criteria
- Model response
- Translation reveal
- Audio controls
- Chunk-by-chunk listening
- Useful phrase highlights
- Pronunciation practice
- Typing area
- Recall mode
- Feedback
- Learning score
- Accuracy
- Completion
- Phrases learned
- Words learned
- Practice time

Avoid making WPM visually dominant. The app is about better English writing, recall, and confidence, not speed typing.

## Gamification Rules

Gamification should motivate repeat practice while staying professional.

MVP gamification includes:

- XP
- Streaks
- Badges
- Levels
- Ranks
- Missions
- Unlocks
- Weekly leaderboard
- Monthly leaderboard
- Country-based competition signals

Do not let streaks overpower skill. Accuracy, recall, completion, and phrase retention matter more.

## Design Rules

Use the FluentDraft visual direction from `docs/style-guide.md`.

UI expectations:

- Serious, calm, focused, professional SaaS feel.
- Clear hierarchy and practical workflows.
- No childish game visuals.
- No text overlap on mobile or desktop.
- Translation and pronunciation controls should support practice without distracting from English-first learning.

## Testing Expectations

Before considering work done, verify the relevant layer:

- Unit tests for scoring, exact answer checking, retry rules, level progression, mission progress, leaderboard periods, and content validation.
- Integration tests for demo, signup, onboarding, practice, phrase saving, scoring, and leaderboard updates.
- E2E tests for critical MVP journeys once UI exists.
- Manual QA for browser speech, microphone permissions, audio quality, and unsupported-browser fallback.
- Supabase RLS checks for all user-owned learning data.
- Responsive UI checks for dashboard, practice, Phrase Bank, and leaderboards.

If tests cannot be run, document why and what remains risky.

## Data And Security Rules

- Lesson content should be seeded into Supabase/Postgres.
- User-owned learning data must be protected by RLS.
- Public leaderboard views must expose only safe public fields.
- Do not store raw microphone audio for MVP.
- Browser speech transcripts may be stored only as learning/pronunciation summaries for registered users.
- Admin-only data includes seeded lesson content, supported languages, badge definitions, mission definitions, and level thresholds.

## Out Of Scope For MVP

Do not implement these unless the task explicitly changes scope:

- Stripe payments
- Redis leaderboard optimization
- Paid pronunciation API
- Advanced AI writing feedback
- User-generated custom scenarios
- Native mobile apps
- Full premium gating
- Fully localized app UI

## Contributor Note

When uncertain, choose the option that best protects the core learning loop:

```text
hear useful English -> understand it -> pronounce it -> type it -> recall it -> save it -> review it later
```
