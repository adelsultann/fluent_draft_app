/**
 * FluentDraft — Scoring engine types
 *
 * Mirrors the API contract in docs/api-contracts.md § Scoring And Gamification.
 * These types are used by the server-side scoring engine and returned
 * by the demo conversion action.
 */

/** Matches the `lesson_difficulty` Postgres enum. */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** A single typed-phrase attempt submitted by the client. */
export interface TypedPhraseAttemptInput {
  /** DB UUID of the key_phrases row. */
  keyPhraseId: string;
  /** What the user actually typed. */
  typedText: string;
  /** 1‑based attempt number (first try = 1). */
  attemptNumber: number;
}

/** A single pronunciation attempt summary submitted by the client. */
export interface PronunciationAttemptInput {
  /** DB UUID of the key_phrases row. */
  keyPhraseId: string;
  /** The text the user was supposed to pronounce. */
  expectedText: string;
  /** Browser speech recognition transcript (may be empty if unsupported). */
  transcript: string;
}

/** Details about one typed-phrase result after server validation. */
export interface TypedPhraseResult {
  keyPhraseId: string;
  expectedText: string;
  typedText: string;
  attemptNumber: number;
  correct: boolean;
}

/** Scoring breakdown returned after server-side calculation. */
export interface LessonScoreResult {
  accuracyPoints: number;
  recallPoints: number;
  completionPoints: number;
  savePhrasePoints: number;
  streakBonus: number;
  difficultyMultiplier: number;
  totalBeforeMultiplier: number;
  totalScore: number;
}

/** Input for the score calculation engine. */
export interface ScoreCalculationInput {
  /** Difficulty of the scenario. */
  difficulty: Difficulty;
  /** Whether the user completed the full lesson. */
  completed: boolean;
  /** Validated phrase results. */
  phraseResults: TypedPhraseResult[];
  /** Number of phrases the user saved to their Phrase Bank. */
  savedPhraseCount: number;
  /** Whether this is the user's first activity today (enables streak bonus). */
  firstActivityToday: boolean;
  /** Whether this is a repeat completion of the same lesson. */
  isRepeat: boolean;
}

/** Default scoring constants — source of truth: plan.md § Scoring */
export const SCORING = {
  CORRECT_FIRST_TRY: 10,
  CORRECT_AFTER_RETRY: 5,
  COMPLETE_LESSON: 15,
  PERFECT_RECALL_BONUS: 20,
  SAVE_PHRASE: 5,
  DAILY_STREAK: 5,
  DIFFICULTY_MULTIPLIER: {
    beginner: 1.0,
    intermediate: 1.2,
    advanced: 1.5,
  } as const,
} as const;
