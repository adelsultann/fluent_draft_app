/**
 * FluentDraft — Server-side scoring engine
 *
 * Pure-function score calculation.  No side effects, no database access.
 * The server calls this during demo conversion and registered lesson completion
 * to produce a trusted score that the client cannot manipulate.
 *
 * Scoring rules (source of truth: plan.md § Scoring):
 *   - Correct phrase first try ........... 10 points
 *   - Correct after retry ................. 5 points
 *   - Complete lesson ..................... 15 points
 *   - Perfect recall bonus (all first try) 20 points
 *   - Save phrase ......................... 5 points each
 *   - Daily streak ........................ 5 points
 *   - Difficulty multiplier:
 *       beginner    ×1.0
 *       intermediate ×1.2
 *       advanced    ×1.5
 */

import type {
  Difficulty,
  ScoreCalculationInput,
  LessonScoreResult,
  TypedPhraseResult,
} from './types';
import { SCORING } from './types';

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Exact text comparison after trimming. */
export function isExactMatch(typed: string, expected: string): boolean {
  return typed.trim() === expected.trim();
}

/** Determine whether a typed phrase attempt is correct via exact match. */
export function checkPhrase(
  keyPhraseId: string,
  expectedText: string,
  typedText: string,
  attemptNumber: number,
): TypedPhraseResult {
  return {
    keyPhraseId,
    expectedText,
    typedText,
    attemptNumber,
    correct: isExactMatch(typedText, expectedText),
  };
}

/** Get the difficulty multiplier for a given difficulty level. */
export function getDifficultyMultiplier(difficulty: Difficulty): number {
  return SCORING.DIFFICULTY_MULTIPLIER[difficulty];
}

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

/**
 * Calculate a trusted lesson score from validated phrase results and metadata.
 *
 * The caller is responsible for validating phrase IDs and expected texts
 * against seeded content before passing them here.
 */
export function calculateScore(input: ScoreCalculationInput): LessonScoreResult {
  const { difficulty, completed, phraseResults, savedPhraseCount, firstActivityToday, isRepeat } =
    input;

  // ---- Accuracy points (per-phrase typing) ----
  let accuracyPoints = 0;
  let firstTryPhrases = 0;
  const totalPhrases = phraseResults.length;

  for (const r of phraseResults) {
    if (r.correct) {
      if (r.attemptNumber === 1) {
        accuracyPoints += SCORING.CORRECT_FIRST_TRY;
        firstTryPhrases += 1;
      } else {
        accuracyPoints += SCORING.CORRECT_AFTER_RETRY;
      }
    }
    // Incorrect phrases award 0 points.
  }

  // ---- Perfect recall bonus ----
  const allFirstTry =
    totalPhrases > 0 && firstTryPhrases === totalPhrases;
  const recallPoints = allFirstTry ? SCORING.PERFECT_RECALL_BONUS : 0;

  // ---- Completion points ----
  const completionPoints = completed ? SCORING.COMPLETE_LESSON : 0;

  // ---- Save phrase points ----
  const savePhrasePoints = savedPhraseCount * SCORING.SAVE_PHRASE;

  // ---- Streak bonus (only for first activity of the day) ----
  const streakBonus =
    firstActivityToday && completed ? SCORING.DAILY_STREAK : 0;

  // ---- Repeat reduction (not implemented for MVP demo conversion;
  //      repeated lessons earn reduced points in full engine) ----
  // For MVP demo conversion, isRepeat is always false.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _repeatReduction = isRepeat;

  // ---- Total before multiplier ----
  const totalBeforeMultiplier =
    accuracyPoints + recallPoints + completionPoints + savePhrasePoints + streakBonus;

  // ---- Difficulty multiplier ----
  const multiplier = getDifficultyMultiplier(difficulty);
  const totalScore = Math.round(totalBeforeMultiplier * multiplier);

  return {
    accuracyPoints,
    recallPoints,
    completionPoints,
    savePhrasePoints,
    streakBonus,
    difficultyMultiplier: multiplier,
    totalBeforeMultiplier,
    totalScore,
  };
}
