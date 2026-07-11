/**
 * Unit tests — Badge evaluation
 *
 * Covers: evaluateBadges with various activity contexts,
 * duplicate prevention, edge cases, and all 11 badge rules.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateBadges,
} from '@/domains/gamification/badges';
import type { BadgeEvaluationContext } from '@/domains/gamification/badges';

// ---------------------------------------------------------------------------
// Helper: create base context
// ---------------------------------------------------------------------------

function baseCtx(overrides: Partial<BadgeEvaluationContext> = {}): BadgeEvaluationContext {
  return {
    totalLessonsCompleted: 0,
    streakDays: 0,
    perfectRecall: false,
    totalPhrasesSaved: 0,
    hasPronunciationAttempt: false,
    allPhasesCompleted: false,
    isFirstLesson: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Individual badge rules
// ---------------------------------------------------------------------------

describe('evaluateBadges', () => {
  it('awards first_lesson when isFirstLesson is true', () => {
    const result = evaluateBadges(
      baseCtx({ isFirstLesson: true, totalLessonsCompleted: 1 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('first_lesson');
  });

  it('does not award first_lesson when isFirstLesson is false', () => {
    const result = evaluateBadges(
      baseCtx({ isFirstLesson: false, totalLessonsCompleted: 5 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('first_lesson');
  });

  it('awards all_phases when allPhasesCompleted is true', () => {
    const result = evaluateBadges(
      baseCtx({ allPhasesCompleted: true }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('all_phases');
  });

  it('does not award all_phases when allPhasesCompleted is false', () => {
    const result = evaluateBadges(
      baseCtx({ allPhasesCompleted: false }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('all_phases');
  });

  it('awards perfect_recall when perfectRecall is true', () => {
    const result = evaluateBadges(
      baseCtx({ perfectRecall: true }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('perfect_recall');
  });

  it('does not award perfect_recall when perfectRecall is false', () => {
    const result = evaluateBadges(
      baseCtx({ perfectRecall: false }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('perfect_recall');
  });

  it('awards first_save when totalPhrasesSaved >= 1', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 1 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('first_save');
  });

  it('awards first_save with many phrases saved', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 15 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('first_save');
  });

  it('does not award first_save with zero phrases', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 0 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('first_save');
  });

  it('awards five_phrases when totalPhrasesSaved >= 5', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 5 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('five_phrases');
  });

  it('does not award five_phrases with only 4 phrases', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 4 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('five_phrases');
  });

  it('awards ten_phrases when totalPhrasesSaved >= 10', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 10 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('ten_phrases');
  });

  it('does not award ten_phrases with only 9 phrases', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 9 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('ten_phrases');
  });

  it('awards five_lessons when totalLessonsCompleted >= 5', () => {
    const result = evaluateBadges(
      baseCtx({ totalLessonsCompleted: 5 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('five_lessons');
  });

  it('does not award five_lessons with 4 lessons', () => {
    const result = evaluateBadges(
      baseCtx({ totalLessonsCompleted: 4 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('five_lessons');
  });

  it('awards ten_lessons when totalLessonsCompleted >= 10', () => {
    const result = evaluateBadges(
      baseCtx({ totalLessonsCompleted: 10 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('ten_lessons');
  });

  it('does not award ten_lessons with 9 lessons', () => {
    const result = evaluateBadges(
      baseCtx({ totalLessonsCompleted: 9 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('ten_lessons');
  });

  it('awards practice_streak_3 when streakDays >= 3', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 3 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('practice_streak_3');
  });

  it('does not award practice_streak_3 with 2-day streak', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 2 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('practice_streak_3');
  });

  it('awards practice_streak_7 when streakDays >= 7', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 7 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('practice_streak_7');
  });

  it('does not award practice_streak_7 with 6-day streak', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 6 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('practice_streak_7');
  });

  it('awards practice_streak_14 when streakDays >= 14', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 14 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('practice_streak_14');
  });

  it('does not award practice_streak_14 with 13-day streak', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 13 }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('practice_streak_14');
  });

  // ---------------------------------------------------------------------------
  // Multiple badge awards in single evaluation
  // ---------------------------------------------------------------------------

  it('awards multiple badges when multiple conditions are met', () => {
    const result = evaluateBadges(
      baseCtx({
        isFirstLesson: true,
        totalLessonsCompleted: 1,
        allPhasesCompleted: true,
        perfectRecall: true,
        totalPhrasesSaved: 3,
        streakDays: 1,
      }),
      new Set(),
    );
    // first_lesson, all_phases, perfect_recall, first_save
    expect(result.awardedCodes).toContain('first_lesson');
    expect(result.awardedCodes).toContain('all_phases');
    expect(result.awardedCodes).toContain('perfect_recall');
    expect(result.awardedCodes).toContain('first_save');
    // five_phrases requires 5, not met
    expect(result.awardedCodes).not.toContain('five_phrases');
  });

  it('awards all phrase-save badges together at high counts', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 10 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('first_save');
    expect(result.awardedCodes).toContain('five_phrases');
    expect(result.awardedCodes).toContain('ten_phrases');
  });

  it('awards all lesson-count badges together at high counts', () => {
    const result = evaluateBadges(
      baseCtx({ totalLessonsCompleted: 10, isFirstLesson: false }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('five_lessons');
    expect(result.awardedCodes).toContain('ten_lessons');
  });

  it('awards all streak badges together with a 14-day streak', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 14 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('practice_streak_3');
    expect(result.awardedCodes).toContain('practice_streak_7');
    expect(result.awardedCodes).toContain('practice_streak_14');
  });

  // ---------------------------------------------------------------------------
  // Duplicate prevention
  // ---------------------------------------------------------------------------

  it('does not re-award badges the user already owns', () => {
    const alreadyOwned = new Set(['first_lesson', 'all_phases']);
    const result = evaluateBadges(
      baseCtx({
        isFirstLesson: true,
        totalLessonsCompleted: 1,
        allPhasesCompleted: true,
      }),
      alreadyOwned,
    );
    expect(result.awardedCodes).not.toContain('first_lesson');
    expect(result.awardedCodes).not.toContain('all_phases');
    expect(result.alreadyOwnedCodes).toContain('first_lesson');
    expect(result.alreadyOwnedCodes).toContain('all_phases');
  });

  it('still awards unowned badges even when others are owned', () => {
    const alreadyOwned = new Set(['first_lesson']);
    const result = evaluateBadges(
      baseCtx({
        isFirstLesson: true,
        totalLessonsCompleted: 1,
        perfectRecall: true,
        allPhasesCompleted: true,
      }),
      alreadyOwned,
    );
    expect(result.awardedCodes).not.toContain('first_lesson');
    expect(result.awardedCodes).toContain('perfect_recall');
    expect(result.awardedCodes).toContain('all_phases');
  });

  it('returns empty awardedCodes when user already owns all eligible badges', () => {
    const alreadyOwned = new Set([
      'first_lesson',
      'all_phases',
      'perfect_recall',
      'first_save',
    ]);
    const result = evaluateBadges(
      baseCtx({
        isFirstLesson: true,
        totalLessonsCompleted: 1,
        allPhasesCompleted: true,
        perfectRecall: true,
        totalPhrasesSaved: 3,
      }),
      alreadyOwned,
    );
    expect(result.awardedCodes).toHaveLength(0);
    expect(result.alreadyOwnedCodes.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('returns no badges for empty context with no conditions met', () => {
    const result = evaluateBadges(baseCtx(), new Set());
    expect(result.awardedCodes).toHaveLength(0);
    expect(result.alreadyOwnedCodes).toHaveLength(0);
  });

  it('does not award pronunciation_try (handled separately in server action)', () => {
    const result = evaluateBadges(
      baseCtx({ hasPronunciationAttempt: true }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('pronunciation_try');
  });

  it('handles empty alreadyOwnedCodes set', () => {
    const result = evaluateBadges(
      baseCtx({ isFirstLesson: true, totalLessonsCompleted: 1 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('first_lesson');
    expect(result.alreadyOwnedCodes).toHaveLength(0);
  });

  it('streak badge with exact threshold (3 days) works', () => {
    const result = evaluateBadges(
      baseCtx({ streakDays: 3 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('practice_streak_3');
  });

  it('lesson badge with exact threshold (5 lessons) works', () => {
    const result = evaluateBadges(
      baseCtx({ totalLessonsCompleted: 5 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('five_lessons');
  });

  it('phrase save badge with exact threshold (5 phrases) works', () => {
    const result = evaluateBadges(
      baseCtx({ totalPhrasesSaved: 5 }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('five_phrases');
  });

  it('all_phases badge NOT awarded when hasPronunciationAttempt is set but allPhasesCompleted is false', () => {
    const result = evaluateBadges(
      baseCtx({ hasPronunciationAttempt: true, allPhasesCompleted: false }),
      new Set(),
    );
    expect(result.awardedCodes).not.toContain('all_phases');
  });

  it('all_phases badge IS awarded even without pronunciation when allPhasesCompleted is true', () => {
    const result = evaluateBadges(
      baseCtx({ hasPronunciationAttempt: false, allPhasesCompleted: true }),
      new Set(),
    );
    expect(result.awardedCodes).toContain('all_phases');
  });
});
