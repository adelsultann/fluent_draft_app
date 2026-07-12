/**
 * Unit tests — Scoring engine
 *
 * Covers: exact text matching, phrase checking, difficulty multipliers,
 * score calculation, perfect recall bonus, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  isExactMatch,
  checkPhrase,
  getDifficultyMultiplier,
  calculateScore,
  SCORING,
} from '@/domains/scoring';
import type { ScoreCalculationInput } from '@/domains/scoring';

// ---------------------------------------------------------------------------
// isExactMatch
// ---------------------------------------------------------------------------

describe('isExactMatch', () => {
  it('returns true for identical strings', () => {
    expect(isExactMatch('hello', 'hello')).toBe(true);
  });

  it('returns true when strings differ only in surrounding whitespace', () => {
    expect(isExactMatch('  hello world  ', 'hello world')).toBe(true);
    expect(isExactMatch('hello world', '  hello world  ')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(isExactMatch('hello', 'world')).toBe(false);
  });

  it('returns false when case differs (exact match is case-sensitive)', () => {
    expect(isExactMatch('Hello', 'hello')).toBe(false);
  });

  it('returns false for punctuation differences', () => {
    expect(isExactMatch("don't hesitate", "dont hesitate")).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(isExactMatch('', '')).toBe(true);
  });

  it('returns false when expected is empty and typed is not', () => {
    expect(isExactMatch('something', '')).toBe(false);
  });

  // -- Edge cases
  it('returns false when internal whitespace differs', () => {
    // Only outer whitespace is trimmed; internal spacing must match exactly
    expect(isExactMatch('hello   world', 'hello world')).toBe(false);
    expect(isExactMatch('hello\tworld', 'hello world')).toBe(false);
  });

  it('returns true for strings with matching internal whitespace', () => {
    expect(isExactMatch('hello   world', 'hello   world')).toBe(true);
    expect(isExactMatch('  hello world  ', '  hello world  ')).toBe(true);
  });

  it('handles special characters', () => {
    expect(isExactMatch('email@example.com', 'email@example.com')).toBe(true);
    expect(isExactMatch('100% sure', '100% sure')).toBe(true);
    expect(isExactMatch('$50.00', '$50.00')).toBe(true);
  });

  it('handles Unicode characters', () => {
    expect(isExactMatch('café', 'café')).toBe(true);
    expect(isExactMatch('résumé', 'resume')).toBe(false); // accent matters
    expect(isExactMatch('naïve', 'naive')).toBe(false); // diaeresis matters
  });

  it('handles newlines and tabs exactly', () => {
    expect(isExactMatch('line1\nline2', 'line1\nline2')).toBe(true);
    expect(isExactMatch('line1\nline2', 'line1 line2')).toBe(false);
    expect(isExactMatch('col1\tcol2', 'col1\tcol2')).toBe(true);
  });

  it('handles numbers and mixed content', () => {
    expect(isExactMatch('Room 101', 'Room 101')).toBe(true);
    expect(isExactMatch('Room 101', 'room 101')).toBe(false); // case-sensitive
    expect(isExactMatch('Step 1: Introduction', 'Step 1: Introduction')).toBe(true);
  });

  it('handles long strings', () => {
    const long = 'a'.repeat(10000);
    expect(isExactMatch(long, long)).toBe(true);
    expect(isExactMatch(long + ' ', long)).toBe(true); // outer whitespace trimmed
  });
});

// ---------------------------------------------------------------------------
// checkPhrase
// ---------------------------------------------------------------------------

describe('checkPhrase', () => {
  const phraseId = 'phrase-1';
  const expected = 'thank you again for taking the time';

  it('returns correct: true on exact match on first try', () => {
    const result = checkPhrase(phraseId, expected, 'thank you again for taking the time', 1);
    expect(result.correct).toBe(true);
    expect(result.attemptNumber).toBe(1);
    expect(result.keyPhraseId).toBe(phraseId);
  });

  it('returns correct: true on exact match after retry', () => {
    const result = checkPhrase(phraseId, expected, 'thank you again for taking the time', 2);
    expect(result.correct).toBe(true);
    expect(result.attemptNumber).toBe(2);
  });

  it('returns correct: false when text does not match', () => {
    const result = checkPhrase(phraseId, expected, 'thanks for your time', 1);
    expect(result.correct).toBe(false);
  });

  it('returns correct: true with trimmed whitespace', () => {
    const result = checkPhrase(phraseId, expected, '  thank you again for taking the time  ', 1);
    expect(result.correct).toBe(true);
  });

  it('preserves the original typed text in result', () => {
    const typed = '  thanks  ';
    const result = checkPhrase(phraseId, expected, typed, 1);
    expect(result.typedText).toBe(typed);
  });
});

// ---------------------------------------------------------------------------
// getDifficultyMultiplier
// ---------------------------------------------------------------------------

describe('getDifficultyMultiplier', () => {
  it('returns 1.0 for beginner', () => {
    expect(getDifficultyMultiplier('beginner')).toBe(1.0);
  });

  it('returns 1.2 for intermediate', () => {
    expect(getDifficultyMultiplier('intermediate')).toBe(1.2);
  });

  it('returns 1.5 for advanced', () => {
    expect(getDifficultyMultiplier('advanced')).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// calculateScore
// ---------------------------------------------------------------------------

describe('calculateScore', () => {
  const DEMO_PHRASE_IDS = [
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0002-000000000005',
    '00000000-0000-0000-0002-000000000006',
  ];

  const baseInput: ScoreCalculationInput = {
    difficulty: 'beginner',
    completed: true,
    phraseResults: [],
    savedPhraseCount: 0,
    firstActivityToday: false,
    isRepeat: false,
  };

  it('returns zero for no phrases and no completion', () => {
    const result = calculateScore({ ...baseInput, completed: false });
    expect(result.totalScore).toBe(0);
    expect(result.totalBeforeMultiplier).toBe(0);
  });

  it('awards completion points when lesson is completed', () => {
    const result = calculateScore({ ...baseInput, completed: true });
    expect(result.completionPoints).toBe(SCORING.COMPLETE_LESSON);
    expect(result.totalBeforeMultiplier).toBe(SCORING.COMPLETE_LESSON);
  });

  it('awards correct-first-try points for each correct first-try phrase', () => {
    const phraseResults = DEMO_PHRASE_IDS.map((id, i) => ({
      keyPhraseId: id,
      expectedText: `phrase text ${i + 1}`,
      typedText: `phrase text ${i + 1}`,
      attemptNumber: 1,
      correct: true,
    }));

    const result = calculateScore({ ...baseInput, phraseResults });
    expect(result.accuracyPoints).toBe(6 * SCORING.CORRECT_FIRST_TRY); // 60
    expect(result.totalBeforeMultiplier).toBe(
      60 + SCORING.PERFECT_RECALL_BONUS + SCORING.COMPLETE_LESSON, // 60 + 20 + 15 = 95
    );
    expect(result.totalScore).toBe(95); // beginner ×1.0
  });

  it('awards correct-after-retry points for correct retry phrases', () => {
    const phraseResults = [
      {
        keyPhraseId: DEMO_PHRASE_IDS[0],
        expectedText: 'text',
        typedText: 'text',
        attemptNumber: 2, // second try
        correct: true,
      },
    ];

    const result = calculateScore({ ...baseInput, phraseResults });
    expect(result.accuracyPoints).toBe(SCORING.CORRECT_AFTER_RETRY); // 5
  });

  it('awards 0 points for incorrect phrases', () => {
    const phraseResults = [
      {
        keyPhraseId: DEMO_PHRASE_IDS[0],
        expectedText: 'expected',
        typedText: 'wrong',
        attemptNumber: 1,
        correct: false,
      },
    ];

    const result = calculateScore({ ...baseInput, phraseResults });
    expect(result.accuracyPoints).toBe(0);
  });

  it('awards perfect recall bonus when all phrases are correct on first try', () => {
    const phraseResults = DEMO_PHRASE_IDS.map((id) => ({
      keyPhraseId: id,
      expectedText: 'text',
      typedText: 'text',
      attemptNumber: 1,
      correct: true,
    }));

    const result = calculateScore({ ...baseInput, phraseResults });
    expect(result.recallPoints).toBe(SCORING.PERFECT_RECALL_BONUS); // 20
  });

  it('does not award perfect recall bonus when any phrase is incorrect', () => {
    const phraseResults = [
      {
        keyPhraseId: DEMO_PHRASE_IDS[0],
        expectedText: 'text',
        typedText: 'text',
        attemptNumber: 1,
        correct: true,
      },
      {
        keyPhraseId: DEMO_PHRASE_IDS[1],
        expectedText: 'text',
        typedText: 'wrong',
        attemptNumber: 1,
        correct: false,
      },
    ];

    const result = calculateScore({ ...baseInput, phraseResults });
    expect(result.recallPoints).toBe(0);
  });

  it('does not award perfect recall bonus when any phrase is on retry', () => {
    const phraseResults = [
      {
        keyPhraseId: DEMO_PHRASE_IDS[0],
        expectedText: 'text',
        typedText: 'text',
        attemptNumber: 1,
        correct: true,
      },
      {
        keyPhraseId: DEMO_PHRASE_IDS[1],
        expectedText: 'text',
        typedText: 'text',
        attemptNumber: 2,
        correct: true,
      },
    ];

    const result = calculateScore({ ...baseInput, phraseResults });
    expect(result.recallPoints).toBe(0);
  });

  it('awards save phrase points correctly', () => {
    const result = calculateScore({ ...baseInput, savedPhraseCount: 3 });
    expect(result.savePhrasePoints).toBe(3 * SCORING.SAVE_PHRASE); // 15
  });

  it('awards streak bonus only on first activity of the day', () => {
    const withStreak = calculateScore({
      ...baseInput,
      firstActivityToday: true,
    });
    expect(withStreak.streakBonus).toBe(SCORING.DAILY_STREAK); // 5

    const withoutStreak = calculateScore({
      ...baseInput,
      firstActivityToday: false,
    });
    expect(withoutStreak.streakBonus).toBe(0);
  });

  it('does not award streak bonus when lesson is not completed', () => {
    const result = calculateScore({
      ...baseInput,
      completed: false,
      firstActivityToday: true,
    });
    expect(result.streakBonus).toBe(0);
  });

  it('applies difficulty multiplier correctly', () => {
    const intermediateInput: ScoreCalculationInput = {
      ...baseInput,
      difficulty: 'intermediate',
      phraseResults: DEMO_PHRASE_IDS.map((id) => ({
        keyPhraseId: id,
        expectedText: 'text',
        typedText: 'text',
        attemptNumber: 1,
        correct: true,
      })),
    };

    const result = calculateScore(intermediateInput);
    expect(result.difficultyMultiplier).toBe(1.2);
    expect(result.totalBeforeMultiplier).toBe(60 + 20 + 15); // 95
    expect(result.totalScore).toBe(Math.round(95 * 1.2)); // 114
  });

  it('applies advanced multiplier correctly', () => {
    const result = calculateScore({
      ...baseInput,
      difficulty: 'advanced',
    });
    expect(result.difficultyMultiplier).toBe(1.5);
    expect(result.totalScore).toBe(Math.round(15 * 1.5)); // 23
  });

  it('returns integer totalScore', () => {
    const result = calculateScore({
      ...baseInput,
      difficulty: 'intermediate',
    });
    expect(Number.isInteger(result.totalScore)).toBe(true);
  });

  it('handles empty phrase results with completion and saves', () => {
    const result = calculateScore({
      ...baseInput,
      completed: true,
      savedPhraseCount: 2,
    });
    expect(result.accuracyPoints).toBe(0);
    expect(result.recallPoints).toBe(0);
    expect(result.completionPoints).toBe(SCORING.COMPLETE_LESSON);
    expect(result.savePhrasePoints).toBe(2 * SCORING.SAVE_PHRASE); // 10
  });

  it('handles zero saved phrases', () => {
    const result = calculateScore({ ...baseInput, savedPhraseCount: 0 });
    expect(result.savePhrasePoints).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Repeat reduction
  // ---------------------------------------------------------------------------

  it('applies repeat multiplier of 0.5 for repeated lessons', () => {
    const result = calculateScore({ ...baseInput, completed: true, isRepeat: true });
    expect(result.repeatMultiplier).toBe(0.5);
    // Raw total = 15 (completion). After repeat: 15 * 0.5 = 7.5 → Math.round = 8
    expect(result.totalBeforeMultiplier).toBe(8);
    expect(result.totalScore).toBe(8); // beginner ×1.0
  });

  it('applies repeat reduction to phrase points', () => {
    const phraseResults = DEMO_PHRASE_IDS.map((id) => ({
      keyPhraseId: id,
      expectedText: 'text',
      typedText: 'text',
      attemptNumber: 1,
      correct: true,
    }));

    const result = calculateScore({
      ...baseInput,
      phraseResults,
      isRepeat: true,
    });
    // Raw: 60 (accuracy) + 20 (recall) + 15 (completion) = 95
    // With repeat ×0.5: 47.5 → Math.round = 48
    expect(result.repeatMultiplier).toBe(0.5);
    expect(result.totalBeforeMultiplier).toBe(48);
    expect(result.totalScore).toBe(48);
  });

  it('repeat multiplier is 1.0 for non-repeat lessons', () => {
    const result = calculateScore({ ...baseInput, isRepeat: false });
    expect(result.repeatMultiplier).toBe(1.0);
  });

  // ---------------------------------------------------------------------------
  // Phase-skip reduction
  // ---------------------------------------------------------------------------

  it('phaseCompletionMultiplier is 1.0 when all 4 phases completed', () => {
    const result = calculateScore({ ...baseInput, completedPhases: 4 });
    expect(result.phaseCompletionMultiplier).toBe(1.0);
  });

  it('phaseCompletionMultiplier is 0.75 when 3 of 4 phases completed', () => {
    const result = calculateScore({ ...baseInput, completedPhases: 3 });
    expect(result.phaseCompletionMultiplier).toBe(0.75);
    // 15 (completion) * 0.75 = 11.25 → Math.round = 11
    expect(result.totalBeforeMultiplier).toBe(11);
  });

  it('phaseCompletionMultiplier is 0.5 when 2 of 4 phases completed', () => {
    const result = calculateScore({ ...baseInput, completedPhases: 2 });
    expect(result.phaseCompletionMultiplier).toBe(0.5);
    // 15 * 0.5 = 7.5 → Math.round = 8
    expect(result.totalBeforeMultiplier).toBe(8);
  });

  it('phaseCompletionMultiplier is 0 when 0 phases completed', () => {
    const result = calculateScore({ ...baseInput, completedPhases: 0, completed: false });
    expect(result.phaseCompletionMultiplier).toBe(0);
    expect(result.totalScore).toBe(0);
  });

  it('defaults completedPhases to 4 when not provided', () => {
    const result = calculateScore({
      ...baseInput,
      completed: true,
      // completedPhases not set — should default to 4
    });
    expect(result.phaseCompletionMultiplier).toBe(1.0);
  });

  // ---------------------------------------------------------------------------
  // Combined penalties
  // ---------------------------------------------------------------------------

  it('applies both repeat and phase-skip reductions together', () => {
    const phraseResults = DEMO_PHRASE_IDS.map((id) => ({
      keyPhraseId: id,
      expectedText: 'text',
      typedText: 'text',
      attemptNumber: 1,
      correct: true,
    }));

    const result = calculateScore({
      ...baseInput,
      phraseResults,
      isRepeat: true,          // ×0.5
      completedPhases: 3,      // ×0.75
    });
    // Raw: 60 + 20 + 15 = 95
    // 95 * 0.5 * 0.75 = 35.625 → Math.round = 36
    expect(result.repeatMultiplier).toBe(0.5);
    expect(result.phaseCompletionMultiplier).toBe(0.75);
    expect(result.totalBeforeMultiplier).toBe(36);
    expect(result.totalScore).toBe(36); // beginner ×1.0
  });

  // ---------------------------------------------------------------------------
  // Combined scenarios (all scoring rules together)
  // ---------------------------------------------------------------------------

  it('applies all scoring rules together: accuracy + saves + streak + difficulty', () => {
    const phraseResults = DEMO_PHRASE_IDS.slice(0, 3).map((id, i) => ({
      keyPhraseId: id,
      expectedText: `text ${i + 1}`,
      typedText: `text ${i + 1}`,
      attemptNumber: 1,
      correct: true,
    }));

    const result = calculateScore({
      difficulty: 'intermediate',
      completed: true,
      phraseResults,
      savedPhraseCount: 2,
      firstActivityToday: true,
      isRepeat: false,
    });
    // Accuracy: 3 × 10 = 30
    // Recall: 3 all first-try → 20
    // Completion: 15
    // Saves: 2 × 5 = 10
    // Streak: 5
    // Raw: 30 + 20 + 15 + 10 + 5 = 80
    // ×1.2 (intermediate) = 96
    expect(result.accuracyPoints).toBe(30);
    expect(result.recallPoints).toBe(20);
    expect(result.completionPoints).toBe(15);
    expect(result.savePhrasePoints).toBe(10);
    expect(result.streakBonus).toBe(5);
    expect(result.difficultyMultiplier).toBe(1.2);
    expect(result.totalBeforeMultiplier).toBe(80);
    expect(result.totalScore).toBe(96);
  });

  it('applies all scoring rules with repeat and phase penalties together', () => {
    const phraseResults = DEMO_PHRASE_IDS.slice(0, 2).map((id, i) => ({
      keyPhraseId: id,
      expectedText: `text ${i + 1}`,
      typedText: `text ${i + 1}`,
      attemptNumber: i === 0 ? 1 : 2, // first on try 1, second on try 2
      correct: true,
    }));

    const result = calculateScore({
      difficulty: 'advanced',
      completed: true,
      phraseResults,
      savedPhraseCount: 1,
      firstActivityToday: true,
      isRepeat: true,
      completedPhases: 3,
    });
    // Accuracy: 10 + 5 = 15
    // Recall: NOT perfect (phrase 2 on retry) → 0
    // Completion: 15
    // Saves: 1 × 5 = 5
    // Streak: 5
    // Raw: 15 + 0 + 15 + 5 + 5 = 40
    // Repeat ×0.5 → 20
    // Phase ×0.75 → 15
    // Math.round(40 × 0.5 × 0.75) = Math.round(15) = 15
    // Advanced ×1.5 → 22.5 → Math.round = 23
    expect(result.accuracyPoints).toBe(15);
    expect(result.recallPoints).toBe(0);
    expect(result.completionPoints).toBe(15);
    expect(result.savePhrasePoints).toBe(5);
    expect(result.streakBonus).toBe(5);
    expect(result.repeatMultiplier).toBe(0.5);
    expect(result.phaseCompletionMultiplier).toBe(0.75);
    expect(result.difficultyMultiplier).toBe(1.5);
    expect(result.totalBeforeMultiplier).toBe(15);
    expect(result.totalScore).toBe(23);
  });

  it('awards correct-first-try for multiple attempts where some fail and some pass', () => {
    const phraseResults = [
      { keyPhraseId: DEMO_PHRASE_IDS[0], expectedText: 'hello', typedText: 'hello', attemptNumber: 1, correct: true },
      { keyPhraseId: DEMO_PHRASE_IDS[1], expectedText: 'world', typedText: 'wrong', attemptNumber: 1, correct: false },
      { keyPhraseId: DEMO_PHRASE_IDS[2], expectedText: 'test', typedText: 'test', attemptNumber: 2, correct: true },
    ];

    const result = calculateScore({
      ...baseInput,
      phraseResults,
      completed: true,
    });
    // Accuracy: 10 (phrase 0 first-try) + 0 (phrase 1 wrong) + 5 (phrase 2 retry) = 15
    // Recall: phrase 1 wrong → no perfect recall → 0
    // Completion: 15
    // TotalBeforeMultiplier: 30
    // Beginner ×1.0 → 30
    expect(result.accuracyPoints).toBe(15);
    expect(result.recallPoints).toBe(0);
    expect(result.totalBeforeMultiplier).toBe(30);
    expect(result.totalScore).toBe(30);
  });

  it('totalScore always equals totalBeforeMultiplier for beginner difficulty', () => {
    const phraseResults = DEMO_PHRASE_IDS.slice(0, 2).map((id) => ({
      keyPhraseId: id,
      expectedText: 'text',
      typedText: 'text',
      attemptNumber: 1,
      correct: true,
    }));

    const result = calculateScore({
      difficulty: 'beginner',
      completed: true,
      phraseResults,
      savedPhraseCount: 3,
      firstActivityToday: true,
      isRepeat: false,
    });
    expect(result.difficultyMultiplier).toBe(1.0);
    expect(result.totalScore).toBe(result.totalBeforeMultiplier);
  });

  it('SCORING constants match expected documented values', () => {
    expect(SCORING.CORRECT_FIRST_TRY).toBe(10);
    expect(SCORING.CORRECT_AFTER_RETRY).toBe(5);
    expect(SCORING.COMPLETE_LESSON).toBe(15);
    expect(SCORING.PERFECT_RECALL_BONUS).toBe(20);
    expect(SCORING.SAVE_PHRASE).toBe(5);
    expect(SCORING.DAILY_STREAK).toBe(5);
  });
});
