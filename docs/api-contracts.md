# FluentDraft API Contracts

## Purpose

This document defines the expected contracts between the FluentDraft UI, Next.js server logic, Supabase, and future clients such as mobile apps.

For MVP, FluentDraft is a Next.js + Supabase app. Many interactions may be implemented as server actions, route handlers, or Supabase queries rather than a separate public REST API. The contracts here describe the required behavior and data shapes regardless of implementation style.

## Contract Principles

- Server validates all writes.
- Trusted scoring happens on the server.
- Supabase RLS protects user-owned data.
- Anonymous demo users can only use the fixed demo lesson.
- Demo progress remains browser-local until signup.
- Public leaderboard contracts expose safe fields only.
- Inputs and outputs should be typed in TypeScript.
- Future mobile apps should be able to reuse the same contract concepts.

## Shared Types

```ts
type UserLevel = "beginner" | "intermediate" | "advanced";
type LessonPhase = "understand" | "practice" | "recall" | "save";
type AttemptStatus = "in_progress" | "completed" | "abandoned";
type PhraseMastery = "new" | "learning" | "mastered";
type LeaderboardPeriod = "weekly" | "monthly";
type Difficulty = "beginner" | "intermediate" | "advanced";
```

## Error Shape

All server-handled mutations should return a consistent error shape.

```ts
interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  retryable: boolean;
}
```

## Auth And Profile

### Complete Onboarding

Input:

```ts
interface CompleteOnboardingInput {
  displayName: string;
  englishLevel: UserLevel;
  targetLanguageCode: string;
  countryCode: string;
}
```

Output:

```ts
interface CompleteOnboardingResult {
  profileId: string;
  onboardingComplete: true;
}
```

Rules:

- User must be authenticated.
- `targetLanguageCode` must exist in supported languages.
- `countryCode` is used for leaderboard display.
- Display name and country may be shown publicly on leaderboards.

## Demo Lesson

### Get Fixed Demo Lesson

Output:

```ts
interface DemoLessonResult {
  scenarioId: string;
  title: string;
  context: string;
  goal: string;
  tone: string;
  difficulty: Difficulty;
  modelResponse: string;
  chunks: LessonChunk[];
  keyPhrases: KeyPhrase[];
  translations: LessonTranslation[];
}
```

Rules:

- Available without authentication.
- Always returns the single fixed MVP demo lesson.
- Does not create a server-side anonymous attempt.

### Convert Demo Progress After Signup

Input:

```ts
interface ConvertDemoProgressInput {
  scenarioId: string;
  completed: boolean;
  phaseReached: LessonPhase;
  typedPhraseAttempts: TypedPhraseAttemptInput[];
  pronunciationAttempts: PronunciationAttemptInput[];
  savedPhraseIds: string[];
  clientCompletedAt?: string;
}
```

Output:

```ts
interface ConvertDemoProgressResult {
  lessonAttemptId: string;
  score: LessonScoreResult;
  savedPhraseCount: number;
}
```

Rules:

- User must be authenticated.
- Server validates the demo payload against seeded demo content.
- Server calculates trusted score.
- Invalid or tampered demo payload should be rejected.

## Scenario And Lesson Content

### List Scenario Packs

Output:

```ts
interface ScenarioPackSummary {
  id: string;
  title: string;
  description: string;
  scenarioCount: number;
  unlocked: boolean;
}
```

### Get Practice Lesson

Input:

```ts
interface GetPracticeLessonInput {
  scenarioId: string;
  targetLanguageCode?: string;
}
```

Output:

```ts
interface PracticeLessonResult {
  scenarioId: string;
  packId: string;
  title: string;
  context: string;
  goal: string;
  tone: string;
  criteria: string[];
  difficulty: Difficulty;
  modelResponse: string;
  chunks: LessonChunk[];
  keyPhrases: KeyPhrase[];
  translations: LessonTranslation[];
}
```

Rules:

- Registered users can access MVP scenario packs.
- Anonymous users can only access the fixed demo lesson.
- Translation data should match the requested or onboarded target language.

## Lesson Content Types

```ts
interface LessonChunk {
  id: string;
  order: number;
  text: string;
  audioText?: string;
}

interface KeyPhrase {
  id: string;
  text: string;
  meaning: string;
  example: string;
  commonMistake?: string;
}

interface LessonTranslation {
  sourceId: string;
  sourceType: "chunk" | "key_phrase" | "model_response";
  languageCode: string;
  text: string;
}
```

## Practice Attempts

### Start Lesson Attempt

Input:

```ts
interface StartLessonAttemptInput {
  scenarioId: string;
}
```

Output:

```ts
interface StartLessonAttemptResult {
  lessonAttemptId: string;
  status: "in_progress";
}
```

Rules:

- User must be authenticated.
- Starting an attempt does not award score.

### Save Phase Progress

Input:

```ts
interface SavePhaseProgressInput {
  lessonAttemptId: string;
  phase: LessonPhase;
  currentChunkId?: string;
}
```

Rules:

- User must own the attempt.
- Progress saves should be idempotent.

### Submit Typed Phrase Answer

Input:

```ts
interface TypedPhraseAttemptInput {
  keyPhraseId: string;
  typedText: string;
  attemptNumber: number;
}
```

Output:

```ts
interface TypedPhraseAttemptResult {
  keyPhraseId: string;
  correct: boolean;
  expectedText: string;
  typedText: string;
  attemptNumber: number;
}
```

Rules:

- MVP uses exact text matching.
- The server should compare against seeded phrase text for registered attempts and trusted score calculation.
- UI may show expected text after an incorrect attempt according to the practice design.

### Submit Pronunciation Attempt

Input:

```ts
interface PronunciationAttemptInput {
  keyPhraseId: string;
  expectedText: string;
  transcript: string;
  browserSupported: boolean;
  microphoneDenied?: boolean;
}
```

Output:

```ts
interface PronunciationAttemptResult {
  keyPhraseId: string;
  status: "passed" | "retry" | "unsupported";
  feedback: string;
}
```

Rules:

- MVP feedback is simple pass/retry/unsupported.
- Do not store raw microphone audio for MVP.
- Unsupported or denied microphone states must not block lesson completion.

### Complete Lesson

Input:

```ts
interface CompleteLessonInput {
  lessonAttemptId: string;
  typedPhraseAttempts: TypedPhraseAttemptInput[];
  pronunciationAttempts: PronunciationAttemptInput[];
  savedPhraseIds: string[];
  reviewedMistakes: boolean;
}
```

Output:

```ts
interface CompleteLessonResult {
  lessonAttemptId: string;
  score: LessonScoreResult;
  xpAwarded: number;
  streakUpdated: boolean;
  leaderboardUpdated: boolean;
}
```

Rules:

- Server calculates final score.
- Repeated lesson completion gives reduced points.
- Skipped required phases reduce total score.

## Scoring And Gamification

```ts
interface LessonScoreResult {
  accuracyPoints: number;
  recallPoints: number;
  completionPoints: number;
  savePhrasePoints: number;
  streakBonus: number;
  difficultyMultiplier: number;
  totalBeforeMultiplier: number;
  totalScore: number;
}
```

Dashboard summary output:

```ts
interface DashboardSummary {
  displayName: string;
  streakDays: number;
  weeklyXp: number;
  weeklyRank?: number;
  reviewDueCount: number;
  phraseBankSummary: {
    saved: number;
    learning: number;
    weak: number;
    mastered: number;
  };
  recommendedLesson?: {
    scenarioId: string;
    title: string;
    packTitle: string;
    reason: string;
  };
}
```

## Phrase Bank

### Save Phrase

Input:

```ts
interface SavePhraseInput {
  keyPhraseId: string;
  sourceScenarioId: string;
}
```

Output:

```ts
interface SavePhraseResult {
  phraseBankItemId: string;
  mastery: PhraseMastery;
}
```

### Review Phrase

Input:

```ts
interface ReviewPhraseInput {
  phraseBankItemId: string;
  typedText: string;
  rating: "easy" | "hard";
}
```

Output:

```ts
interface ReviewPhraseResult {
  correct: boolean;
  expectedText: string;
  mastery: PhraseMastery;
  nextReviewAt?: string;
}
```

Rules:

- User must own the phrase bank item.
- MVP review uses exact text checking.

## Leaderboards

Input:

```ts
interface GetLeaderboardInput {
  period: LeaderboardPeriod;
  countryCode?: string;
  limit?: number;
}
```

Output:

```ts
interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  countryCode: string;
  score: number;
  period: LeaderboardPeriod;
  periodStart: string;
  periodEnd: string;
}
```

Rules:

- Public fields only.
- Weekly and monthly periods must be explicit.
- Country filtering can be supported for competitive country views.

## Related Docs

- [Docs index](./README.md)
- [plan.md](../plan.md)
- [system-design.md](./system-design.md)
- [architecture.md](./architecture.md)
- [database.md](./database.md)
- [project-structure.md](./project-structure.md)
- [testing-strategy.md](./testing-strategy.md)
- [style-guide.md](./style-guide.md)
