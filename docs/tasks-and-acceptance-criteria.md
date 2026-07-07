# FluentDraft Tasks And Acceptance Criteria

## Purpose

This document mirrors the MVP task plan in a repo-friendly Markdown format.

Use the Notion `MVP Task Tracker` as the live execution board. Use this document as the local reference for task order, dependencies, and acceptance criteria.

## Status Workflow

- Not Started
- In Progress
- Blocked
- Review
- Done

Only mark a task as Done when its acceptance criteria are met.

## MVP Tasks

| Step | Task | Phase | Priority | Area | Size | Depends On | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Create project scaffold | Foundation | P0 | Infra | M | None | Next.js App Router project runs locally with TypeScript and Tailwind CSS. |
| 2 | Configure linting and formatting | Foundation | P0 | Infra | S | Create project scaffold | Lint and format commands run successfully. |
| 3 | Configure FluentDraft theme tokens | Foundation | P0 | UI | S | Create project scaffold | FluentDraft colors are available in the app theme. |
| 4 | Set up base app layout | Foundation | P0 | UI | M | Configure FluentDraft theme tokens | App shell supports focused SaaS layout across desktop and mobile. |
| 5 | Create shared UI primitives | Foundation | P0 | UI | M | Configure FluentDraft theme tokens | Button, input, card, badge, progress, modal, tabs, and tooltip primitives exist. |
| 6 | Create docs index links | Foundation | P1 | Docs | S | Existing docs | Docs link to plan, architecture, system design, database, testing, and project structure. |
| 7 | Create Supabase project configuration | Database and Seed Content | P0 | Database | M | Create project scaffold | Local env variables and Supabase client setup are documented and usable. |
| 8 | Draft initial database migration | Database and Seed Content | P0 | Database | L | Create Supabase project configuration | Core MVP tables are defined for users, content, attempts, phrase bank, scoring, gamification, and leaderboards. |
| 9 | Add RLS policies for user-owned data | Database and Seed Content | P0 | Database | L | Draft initial database migration | Users can only access their own private learning data. |
| 10 | Seed supported languages | Database and Seed Content | P0 | Content | S | Draft initial database migration | Arabic plus common target languages are available for translation reveal. |
| 11 | Seed levels, badges, missions, and XP thresholds | Database and Seed Content | P0 | Gamification | M | Draft initial database migration | MVP gamification definitions are present in seed data. |
| 12 | Create seed scenario schema | Database and Seed Content | P0 | Content | M | Draft initial database migration | Scenario seed format supports pack, level, situation, goal, tone, model response, chunks, key phrases, translations, and recall blanks. |
| 13 | Seed fixed demo lesson | Database and Seed Content | P0 | Content | M | Create seed scenario schema | One polished demo lesson exists with chunks, key phrases, translations, and pronunciation phrases. |
| 14 | Seed MVP scenario packs | Database and Seed Content | P0 | Content | L | Create seed scenario schema | Job Hunt and Career, Daily Workplace, and Daily Life and Adulting packs exist with representative lessons. |
| 15 | Create content validation script | Database and Seed Content | P1 | Testing | M | Seed MVP scenario packs | Script checks required fields, chunks, key phrases, translations, recall blanks, and text length. |
| 16 | Build signup and login screens | Auth and Onboarding | P0 | Auth | M | Create Supabase project configuration | Users can create an account and log in. |
| 17 | Build session handling | Auth and Onboarding | P0 | Auth | M | Build signup and login screens | App can detect signed-in and signed-out states server-side and client-side where needed. |
| 18 | Build onboarding flow | Auth and Onboarding | P0 | Onboarding | M | Build session handling | User selects English level, target language, and country. |
| 19 | Persist user profile | Auth and Onboarding | P0 | Profile | M | Build onboarding flow | Profile stores display name, level, target language, country, and onboarding status. |
| 20 | Protect registered app routes | Auth and Onboarding | P0 | Auth | S | Build session handling | Dashboard, Phrase Bank, and registered practice routes require auth. |
| 21 | Build anonymous demo route | Anonymous Demo | P0 | Demo | M | Seed fixed demo lesson | Anonymous user can open the fixed demo lesson without signing in. |
| 22 | Store demo progress in browser state | Anonymous Demo | P0 | Demo | M | Build anonymous demo route | Demo progress is tracked locally without creating a server session. |
| 23 | Add demo exit warning | Anonymous Demo | P0 | Demo | S | Store demo progress in browser state | Exiting midway warns that score and progress will be lost unless the user signs up. |
| 24 | Add demo completion signup prompt | Anonymous Demo | P0 | Demo | S | Store demo progress in browser state | Completing demo prompts user to register and save progress. |
| 25 | Convert demo result after signup | Anonymous Demo | P0 | Demo | L | Auth and demo progress | Server validates demo payload, calculates trusted score, and attaches progress to account. |
| 26 | Build practice lesson shell | Practice Engine | P0 | Practice | L | App layout and content seed | Practice screen shows scenario, goal, tone, criteria, progress, and main action panel. |
| 27 | Implement Understand phase | Practice Engine | P0 | Practice | M | Build practice lesson shell | User can read context, goal, tone, criteria, and continue. |
| 28 | Implement Practice phase | Practice Engine | P0 | Practice | L | Build practice lesson shell | User can listen, reveal translation, pronounce, and type guided chunks. |
| 29 | Implement exact text answer checking | Practice Engine | P0 | Practice | M | Implement Practice phase | Typed phrase answers pass only when they exactly match expected text. |
| 30 | Implement Recall phase | Practice Engine | P0 | Practice | L | Implement exact text answer checking | User completes missing key phrases from memory and receives feedback. |
| 31 | Implement Review and Save phase | Practice Engine | P0 | Practice | M | Implement Recall phase | User reviews mistakes, useful phrases, score summary, and can save phrases. |
| 32 | Persist registered lesson attempts | Practice Engine | P0 | Practice | L | Server scoring and auth | Registered attempts, mistakes, saved phrases, and completion state persist. |
| 33 | Add text-to-speech playback | Pronunciation and Audio | P0 | Audio | M | Implement Practice phase | User can hear phrase or chunk playback with acceptable native-like browser voice where available. |
| 34 | Add browser speech recognition | Pronunciation and Audio | P0 | Pronunciation | L | Implement Practice phase | User can record phrase pronunciation and receive pass or retry feedback. |
| 35 | Handle microphone and unsupported browser fallback | Pronunciation and Audio | P0 | Pronunciation | M | Add browser speech recognition | App explains unsupported or denied microphone states and allows lesson continuation. |
| 36 | Implement translation reveal | Translation Reveal | P0 | Translation | M | Supported languages and practice phase | User can reveal target-language translation inside practice without leaving English-first flow. |
| 37 | Implement server-side scoring engine | Scoring and Gamification | P0 | Scoring | L | Implement exact text answer checking | Server calculates score using accuracy, recall, completion, save phrase, streak, and difficulty rules. |
| 38 | Implement XP, levels, and streaks | Scoring and Gamification | P0 | Gamification | L | Implement server-side scoring engine | User earns XP, level progress, and streak updates after eligible activity. |
| 39 | Implement badges, missions, ranks, and unlocks | Scoring and Gamification | P1 | Gamification | L | Implement XP, levels, and streaks | MVP badges, missions, ranks, and unlock states update from user activity. |
| 40 | Build Phrase Bank list | Phrase Bank and Review | P0 | Phrase Bank | M | Saved phrases | User can view saved phrases with source, use case, and mastery status. |
| 41 | Build phrase detail panel | Phrase Bank and Review | P0 | Phrase Bank | M | Build Phrase Bank list | Selected phrase shows meaning, example, common mistake, source scenario, and practice actions. |
| 42 | Build phrase review flow | Phrase Bank and Review | P0 | Review | L | Build phrase detail panel | User completes missing phrase, gets exact-check feedback, marks Easy or Hard, and mastery updates. |
| 43 | Build dashboard summary | Dashboard | P0 | Dashboard | L | Auth, attempts, phrase bank, scoring | Dashboard shows streak, weekly XP, rank, review due count, continue lesson, next recommendation, and phrase summary. |
| 44 | Build recommended next lesson card | Dashboard | P1 | Dashboard | M | Build dashboard summary | Dashboard recommends a next lesson with a clear reason. |
| 45 | Build weekly leaderboard | Leaderboards | P0 | Leaderboard | M | Implement server-side scoring engine | Weekly leaderboard shows rank, display name, country, and score. |
| 46 | Build monthly leaderboard | Leaderboards | P0 | Leaderboard | M | Implement server-side scoring engine | Monthly leaderboard shows rank, display name, country, and score. |
| 47 | Add leaderboard reset period logic | Leaderboards | P0 | Leaderboard | M | Weekly and monthly leaderboards | Scores are grouped by explicit weekly and monthly periods. |
| 48 | Add unit tests for core logic | Testing and QA | P0 | Testing | L | Scoring, validation, content | Unit tests cover exact checking, scoring, repeat scoring, levels, missions, and periods. |
| 49 | Add integration tests for core flows | Testing and QA | P0 | Testing | L | Core feature flows | Integration tests cover demo, onboarding, practice, phrase save, scoring, and leaderboard updates. |
| 50 | Add E2E tests for MVP journeys | Testing and QA | P0 | Testing | L | Stable UI flows | E2E tests cover demo completion, demo exit, signup onboarding, lesson completion, phrase review, and leaderboard. |
| 51 | Run Supabase RLS verification | Testing and QA | P0 | Security | M | RLS policies | Normal users cannot access another user's private learning data. |
| 52 | Run manual speech and audio QA | Testing and QA | P0 | QA | M | Pronunciation and audio | Speech, microphone, unsupported browser, and audio behavior are manually verified. |
| 53 | Run responsive UI QA | Testing and QA | P0 | QA | M | Main screens | Dashboard, practice, Phrase Bank, and leaderboards work on mobile and desktop without overlap. |
| 54 | Configure production environment | Deployment | P0 | Deployment | M | MVP feature complete | Production env variables, Supabase project, and hosting settings are ready. |
| 55 | Deploy MVP preview | Deployment | P0 | Deployment | M | Configure production environment | Preview deployment is accessible and passes smoke tests. |
| 56 | Complete MVP release checklist | Deployment | P0 | Release | M | Testing and preview deploy | Demo, auth, onboarding, practice, phrase bank, scoring, leaderboard, and RLS checks pass. |

## Related Docs

- [Docs index](./README.md)
- [plan.md](../plan.md)
- [system-design.md](./system-design.md)
- [architecture.md](./architecture.md)
- [database-schema.md](./database-schema.md)
- [api-contracts.md](./api-contracts.md)
- [testing-strategy.md](./testing-strategy.md)
