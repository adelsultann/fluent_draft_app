# FluentDraft Project Structure

## Purpose

This document defines how the Next.js codebase should be organized once implementation begins.

The structure should keep product domains clear: demo, onboarding, practice, phrase bank, gamification, leaderboards, and shared UI should not be mixed together randomly.

## Proposed Top-Level Shape

```text
fluent_draft_app/
  app/
  components/
  domains/
  lib/
  styles/
  tests/
  supabase/
  docs/
```

## App Routes

```text
app/
  page.tsx
  demo/
  dashboard/
  onboarding/
  packs/
    [packId]/
  practice/
    [scenarioId]/
  phrase-bank/
  leaderboard/
  login/
  signup/
```

Route files should stay thin. They should compose domain components and call server-side data functions rather than containing large business logic directly.

## Domain Modules

```text
domains/
  auth/
  onboarding/
  demo/
  scenarios/
  practice/
  pronunciation/
  translation/
  scoring/
  gamification/
  phrase-bank/
  leaderboard/
```

Each domain can contain its own components, actions, data access, validation, and tests when useful.

## Shared Code

```text
components/
  ui/
  layout/
  feedback/

lib/
  supabase/
  config/
  constants/
  utils/
```

- `components/ui`: reusable low-level UI primitives.
- `components/layout`: app shell, navigation, page layouts.
- `components/feedback`: shared empty states, loading states, error states, and prompts.
- `lib/supabase`: Supabase clients, server helpers, and auth helpers.
- `lib/config`: environment variable parsing and app configuration.
- `lib/constants`: stable product constants such as scoring values and supported defaults.
- `lib/utils`: small generic helpers only.

## Server And Client Boundaries

- Use server components by default for data-loaded pages.
- Use client components for interactive practice state, speech recognition, audio controls, timers, and local demo progress.
- Keep Supabase writes behind server actions or route handlers unless client-side access is explicitly needed and protected by RLS.
- Keep browser speech APIs isolated inside the pronunciation domain so a paid API can replace or augment them later.

## Styling Direction

- Use Tailwind CSS.
- Follow [style-guide.md](./style-guide.md) for FluentDraft's visual direction.
- Keep FluentDraft's design calm, professional, and focused.
- Use navy for structure, blue for primary actions, green for success, amber for phrase highlights, red for mistakes, and off-white backgrounds.
- Do not make typing speed or WPM visually dominant.
- Mobile layouts must avoid overlapping text and cramped controls.

## Testing Structure

```text
tests/
  unit/
  integration/
  e2e/
```

Priority test areas:

- Scoring and difficulty multipliers.
- Exact text answer checking.
- Demo exit/completion signup prompts.
- Demo-to-account conversion.
- Practice phase progression.
- Phrase bank save and review.
- Leaderboard period handling.
- Pronunciation unsupported-browser fallback.

## Supabase Structure

```text
supabase/
  migrations/
  seed/
```

Migrations should define tables, RLS policies, indexes, and database functions. Seed files should create the first scenario packs, fixed demo lesson, supported languages, badges, missions, and level thresholds.

## Related Docs

- [Docs index](./README.md)
- [plan.md](../plan.md)
- [system-design.md](./system-design.md)
- [architecture.md](./architecture.md)
- [database.md](./database.md)
- [api-contracts.md](./api-contracts.md)
- [style-guide.md](./style-guide.md)
- [testing-strategy.md](./testing-strategy.md)
