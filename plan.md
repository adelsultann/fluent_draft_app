# FluentDraft MVP Implementation Plan

## Summary

Build FluentDraft as a focused scenario-based English writing practice app from an empty project directory. The MVP will use **Next.js App Router + TypeScript + Tailwind CSS + Supabase Auth/Postgres**, matching the Notion technical direction.

The first release should help users practice real-world English scenarios through this loop:

`Understand -> Practice -> Recall -> Save`

MVP priority is practical writing confidence, phrase memory, pronunciation practice, gamified motivation, and calm professional UX. Pronunciation feedback should start with browser-native speech recognition and later move to a stronger paid pronunciation API.

## Core Problem

Many English learners do not only struggle with grammar. They struggle with knowing how to write real messages professionally, naturally, and confidently.

Examples of real pain points:

- I need to write an email to HR, but I do not know the right wording.
- I want to follow up after an interview, but I do not want to sound rude.
- I need to reply to a client professionally.
- I know some English words, but I cannot form a polished message.
- I struggle to remember useful phrases for work and daily life because I do not practice them actively.
- I feel insecure about my pronunciation and speaking skills, but I have no way to practice and get feedback.
- I consume a lot of English content, but I struggle to understand native speakers in real conversations.
- I learn new phrases, but I struggle to remember them in the moment because I have not built muscle memory for the language.

FluentDraft helps users build confidence through scenario-based typing, active recall, listening, pronunciation practice, and repeated review.

## Target Users

Primary users:

- English learners who want practical writing practice.
- Job seekers who need emails, cover letters, and recruiter messages.
- Professionals who need workplace English.
- Students who need formal writing patterns.
- Freelancers who need proposals and client replies.
- Non-native English speakers who freeze when writing professional messages.
- Learners who want to improve listening and pronunciation.
- Learners who want to build muscle memory while learning.

Primary user motivation:

> I want to transform my passive English knowledge into active, confident communication so I can handle real-world work and daily life situations without hesitation.

## Product Brief

### What problem are we solving?

English learners often know grammar and vocabulary passively, but struggle to produce polished real-world messages when they need them. FluentDraft solves the gap between passive knowledge and active communication by helping users practice realistic scenarios through listening, pronunciation, typing, recall, and review.

### Who is the user?

The primary user is a non-native English learner who wants practical communication confidence for work, study, job search, freelance, and daily life situations. The user may understand English content, but freezes when writing or speaking because they have not practiced useful phrases actively enough.

### What are the main features?

- Fixed anonymous demo lesson with signup prompts to save progress.
- Scenario packs for job hunting, workplace communication, and daily life.
- Practice flow: Understand, Practice, Recall, Save.
- Exact text phrase typing and recall.
- Browser-first pronunciation practice and feedback.
- Translation reveal for the user's target language.
- Phrase Bank with review and mastery status.
- Dashboard with streak, XP, rank, reviews, recommendations, and progress.
- Gamification with XP, levels, badges, missions, unlocks, and ranks.
- Weekly and monthly leaderboards with display name and country.

### What is the expected outcome?

Users should become more confident writing and recalling useful English phrases in real situations. The MVP should prove that scenario-based practice can help users hear useful English, understand it, pronounce it, type it, remember it, save it, and review it later.

### What are the constraints?

- MVP starts as a web app, while leaving room for mobile apps later.
- Supabase is the primary backend for auth, database, RLS, progress, and leaderboards.
- Demo progress remains browser-local until signup.
- Trusted scoring must happen on the server.
- Typed answers require exact text matching for MVP.
- Pronunciation starts with browser APIs; paid pronunciation APIs are deferred.
- Stripe, Redis, premium gating, advanced AI feedback, custom scenarios, and native mobile apps are out of scope for MVP.
- The UI must stay serious, calm, professional, and modern, not childish or speed-typing focused.

## Key Changes

- Scaffold a new Next.js app in `D:\Learning\Full Stack app\fluent_draft_app`.
- Build the core user areas:
  - Dashboard
  - Fixed demo lesson
  - Scenario pack browsing
  - Practice lesson screen
  - Phrase Bank / Review screen
  - Leaderboard
  - Onboarding
  - Auth screens
- Use a calm SaaS-style UI:
  - Navy `#0F172A`
  - Blue `#2563EB`
  - Green `#22C55E`
  - Amber `#F59E0B`
  - Red `#EF4444`
  - Background `#F8FAFC`
- Avoid making WPM visually dominant. Emphasize accuracy, recall, phrases learned, completion, and practice time.
- Allow users to try one fixed demo lesson before registering. Prompt them to create an account when they complete the demo or try to exit midway, explaining that their score/progress will be lost unless they sign up.
- Use Supabase as the primary long-term backend for MVP. Keep the existing Contabo VPS available for later custom services such as paid pronunciation API integration, background jobs, reports, or audio/AI processing.

## Product Scope

MVP includes:

- Scenario packs:
  - Job Hunt & Career
  - Daily Workplace
  - Daily Life & Adulting
- Practice lesson phases:
  - Understand scenario, goal, tone, criteria
  - Listen/read model response
  - Reveal translation to the user's target language when requested
  - Read/pronounce key phrases and receive feedback
  - Practice key phrases chunk by chunk
  - Recall missing phrases from memory
  - Review mistakes
  - Save phrases to Phrase Bank
- Phrase Bank:
  - Saved phrase cards
  - Search/filter
  - Source scenario
  - Mastery status: New / Learning / Mastered
  - Practice actions: complete phrase, type from memory, listen, use in sentence
- Dashboard:
  - Streak
  - Weekly XP
  - Rank
  - Today's review
  - Continue lesson
  - Recommended next lesson
  - Phrase Bank summary
  - Weekly progress
- Onboarding:
  - User chooses English level: Beginner, Intermediate, or Advanced
  - User chooses target language for translation reveal
  - User chooses country for leaderboard display
- Translation:
  - English remains the main learning language
  - Translation is a revealable helper inside the practice screen
  - MVP supports Arabic plus common languages so the app is not positioned only for Arabic speakers
- Answer checking:
  - MVP requires exact text for typed phrase answers
  - Capitalization, punctuation, and spacing rules should be shown clearly in the practice UI before checking
- Pronunciation:
  - MVP uses browser speech recognition / Web Speech API where available
  - Feedback should compare the spoken phrase against the expected phrase and provide a simple pass/retry result
  - If speech recognition is unsupported, the app should gracefully skip scoring and still allow the lesson to continue
- Scoring:
  - Correct phrase first try: 10
  - Correct after retry: 5
  - Complete lesson: 15
  - Perfect recall bonus: 20
  - Save phrase: 5
  - Daily streak: 5
  - Difficulty multiplier: Beginner `1.0`, Intermediate `1.2`, Advanced `1.5`
- Gamification:
  - XP
  - Streaks
  - Badges
  - Levels
  - Ranks
  - Missions
  - Unlocks
  - Country-based competition signals
- Leaderboards:
  - Weekly leaderboard first
  - Monthly leaderboard
  - Pack leaderboard can be added after MVP
  - Display user name and country
  - Weekly and monthly resets should give new users a fair chance to compete

Deferred from MVP:

- Stripe payments
- Redis leaderboard optimization
- Custom user-generated scenarios
- Advanced AI feedback
- Paid pronunciation API integration
- Full premium gating
- Native-quality pronunciation scoring beyond Web Speech API/browser capabilities

## Technical Plan

- App stack:
  - Next.js App Router
  - TypeScript
  - Tailwind CSS
  - Supabase Auth
  - Supabase Postgres
  - Web Speech API for MVP listening/pronunciation features
  - Contabo VPS reserved for later custom backend services/background workers
- Core data entities:
  - `users`
  - `user_profiles`
  - `scenario_packs`
  - `scenarios`
  - `lesson_chunks`
  - `key_phrases`
  - `lesson_attempts`
  - `demo_attempts`
  - `phrase_bank_items`
  - `phrase_reviews`
  - `user_scores`
  - `leaderboard_entries`
  - `streaks`
  - `badges`
  - `missions`
  - `user_levels`
  - `supported_languages`
- Main routes:
  - `/`
  - `/demo`
  - `/dashboard`
  - `/onboarding`
  - `/packs`
  - `/packs/[packId]`
  - `/practice/[scenarioId]`
  - `/phrase-bank`
  - `/leaderboard`
  - `/login`
  - `/signup`
- Practice state should track:
  - Current phase
  - Current chunk
  - Typed answer
  - Attempts per phrase
  - Mistakes
  - Pronunciation attempts
  - Translation reveal state
  - Saved phrases
  - Completion status
  - Final score
- Use Supabase Row Level Security so users can only read/write their own attempts, phrase bank, reviews, streaks, and progress.
- Seed the MVP with representative scenarios from the Notion page before adding authoring tools.
- Keep anonymous demo progress local/session-based until the user registers. After signup, convert the completed demo score/progress into the user's account.

## Test Plan

- Unit tests:
  - Scoring calculation
  - Difficulty multiplier
  - Retry scoring
  - Reduced repeat lesson scoring
  - Phrase mastery transitions
  - Exact text answer validation
  - Demo completion and signup conversion rules
- Integration tests:
  - Anonymous user starts the fixed demo lesson
  - Anonymous user exits midway and sees the lost-progress signup prompt
  - Anonymous user completes demo and is prompted to save progress by registering
  - User signs up and reaches dashboard
  - User completes onboarding with level, target language, and country
  - User starts a scenario
  - User completes practice and recall
  - User reveals translation during practice
  - User completes pronunciation practice where browser support allows
  - Score is persisted
  - Saved phrases appear in Phrase Bank
  - Review updates phrase mastery
  - Leaderboard reflects weekly and monthly score with user name and country
- UI acceptance checks:
  - Practice screen shows scenario, context, goal, tone, progress, and action panel
  - Practice screen supports translation reveal and pronunciation feedback
  - Demo completion/exit prompts make account creation feel like progress preservation, not a hard wall
  - Dashboard prioritizes today's review and next lesson
  - Phrase Bank supports filtering and selected phrase details
  - Mobile layout has no overlapping text or cramped controls
- Manual browser checks:
  - Audio controls work where browser support allows
  - Speech/pronunciation MVP gracefully degrades if unsupported
  - Auth flow works with Supabase environment variables configured
  - Leaderboards reset correctly for weekly and monthly competition windows

## Assumptions

- The project directory is currently empty, so implementation starts from a fresh scaffold.
- MVP build is the chosen scope.
- Supabase is the primary backend for auth, database, and persisted progress.
- The existing Contabo VPS should not be the main MVP app backend, but it remains useful for later custom workers/services.
- Web Speech API is acceptable for MVP audio/pronunciation experiments.
- A paid pronunciation API is planned after the browser-first MVP proves the practice loop.
- The first anonymous experience is one fixed demo lesson, not broad anonymous browsing.
- English is the main learning language; target-language translations are optional practice helpers.
- Arabic plus common languages should be supported for translation reveal.
- User country is collected during onboarding and shown on competitive leaderboard views.
- Premium features are planned structurally but not implemented in the first version.

## Related Docs

- [Docs index](./docs/README.md)
- [System design](./docs/system-design.md)
- [Architecture](./docs/architecture.md)
- [Database plan](./docs/database.md)
- [Database schema](./docs/database-schema.md)
- [API contracts](./docs/api-contracts.md)
- [Tasks and acceptance criteria](./docs/tasks-and-acceptance-criteria.md)
- [Project structure](./docs/project-structure.md)
- [Style guide](./docs/style-guide.md)
- [Testing strategy](./docs/testing-strategy.md)
