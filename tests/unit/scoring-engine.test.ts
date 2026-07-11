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
});
