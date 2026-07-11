/**
 * Unit tests — Mission evaluation
 *
 * Covers: deriveMissionProgress, evaluateMissions for all 7 mission types,
 * progress tracking, completion detection, XP reward aggregation,
 * duplicate prevention (already-completed missions are not re-awarded),
 * and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateMissions,
  deriveMissionProgress,
  getMissionDefinitions,
} from '@/domains/gamification/missions';
import type {
  MissionProgressContext,
  UserMissionState,
} from '@/domains/gamification/missions';

// ---------------------------------------------------------------------------
// Helper: create base context
// ---------------------------------------------------------------------------

function baseCtx(overrides: Partial<MissionProgressContext> = {}): MissionProgressContext {
  return {
    totalLessonsCompleted: 0,
    totalPhrasesSaved: 0,
    streakDays: 0,
    perfectRecallAchieved: false,
    ...overrides,
  };
}

/** Create a UserMissionState with progress and optional completion. */
function state(
  overrides: Partial<UserMissionState> & { missionCode: string },
): UserMissionState {
  return {
    progressValue: 0,
    completedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveMissionProgress
// ---------------------------------------------------------------------------

describe('deriveMissionProgress', () => {
  it('tracks lesson count for complete_first_lesson', () => {
    const ctx = baseCtx({ totalLessonsCompleted: 3 });
    expect(deriveMissionProgress('complete_first_lesson', ctx)).toBe(3);
  });

  it('tracks lesson count for complete_five_lessons', () => {
    const ctx = baseCtx({ totalLessonsCompleted: 6 });
    expect(deriveMissionProgress('complete_five_lessons', ctx)).toBe(6);
  });

  it('tracks lesson count for complete_ten_lessons', () => {
    const ctx = baseCtx({ totalLessonsCompleted: 11 });
    expect(deriveMissionProgress('complete_ten_lessons', ctx)).toBe(11);
  });

  it('tracks phrase save count for save_three_phrases', () => {
    const ctx = baseCtx({ totalPhrasesSaved: 4 });
    expect(deriveMissionProgress('save_three_phrases', ctx)).toBe(4);
  });

  it('tracks phrase save count for save_ten_phrases', () => {
    const ctx = baseCtx({ totalPhrasesSaved: 12 });
    expect(deriveMissionProgress('save_ten_phrases', ctx)).toBe(12);
  });

  it('tracks streak days for three_day_streak', () => {
    const ctx = baseCtx({ streakDays: 5 });
    expect(deriveMissionProgress('three_day_streak', ctx)).toBe(5);
  });

  it('returns 1 when perfect recall achieved', () => {
    const ctx = baseCtx({ perfectRecallAchieved: true });
    expect(deriveMissionProgress('perfect_recall_mission', ctx)).toBe(1);
  });

  it('returns 0 when perfect recall not achieved', () => {
    const ctx = baseCtx({ perfectRecallAchieved: false });
    expect(deriveMissionProgress('perfect_recall_mission', ctx)).toBe(0);
  });

  it('returns 0 for unknown mission code', () => {
    const ctx = baseCtx({ totalLessonsCompleted: 100 });
    expect(deriveMissionProgress('unknown_mission', ctx)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// evaluateMissions — basic completion
// ---------------------------------------------------------------------------

describe('evaluateMissions', () => {
  it('completes complete_first_lesson when 1 lesson is done', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 1 }),
      states,
    );
    expect(result.newlyCompleted).toHaveLength(1);
    expect(result.newlyCompleted[0].code).toBe('complete_first_lesson');
    expect(result.newlyCompleted[0].xpReward).toBe(50);
  });

  it('does not complete complete_first_lesson with 0 lessons', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 0 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).not.toContain('complete_first_lesson');
  });

  it('completes save_three_phrases when 3 phrases saved', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalPhrasesSaved: 3 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('save_three_phrases');
  });

  it('completes save_three_phrases when more than 3 phrases saved', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalPhrasesSaved: 7 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('save_three_phrases');
  });

  it('does not complete save_three_phrases with only 2 phrases', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalPhrasesSaved: 2 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).not.toContain('save_three_phrases');
  });

  it('completes three_day_streak at exactly 3 days', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ streakDays: 3 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('three_day_streak');
  });

  it('completes three_day_streak above 3 days', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ streakDays: 10 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('three_day_streak');
  });

  it('does not complete three_day_streak with 2 days', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ streakDays: 2 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).not.toContain('three_day_streak');
  });

  it('completes complete_five_lessons at 5 lessons', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 5 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('complete_five_lessons');
  });

  it('completes complete_ten_lessons at 10 lessons', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 10 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('complete_ten_lessons');
  });

  it('completes perfect_recall_mission when achieved', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ perfectRecallAchieved: true }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('perfect_recall_mission');
  });

  it('does not complete perfect_recall_mission when not achieved', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ perfectRecallAchieved: false }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).not.toContain('perfect_recall_mission');
  });

  it('completes save_ten_phrases at 10 phrases', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalPhrasesSaved: 10 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).toContain('save_ten_phrases');
  });

  it('does not complete save_ten_phrases at 9 phrases', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalPhrasesSaved: 9 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).not.toContain('save_ten_phrases');
  });

  // ---------------------------------------------------------------------------
  // Multiple completions
  // ---------------------------------------------------------------------------

  it('can complete multiple missions simultaneously', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({
        totalLessonsCompleted: 5,
        totalPhrasesSaved: 3,
        streakDays: 3,
        perfectRecallAchieved: true,
      }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    // Should complete: complete_first_lesson, complete_five_lessons,
    //   save_three_phrases, three_day_streak, perfect_recall_mission
    expect(codes).toContain('complete_first_lesson');
    expect(codes).toContain('complete_five_lessons');
    expect(codes).toContain('save_three_phrases');
    expect(codes).toContain('three_day_streak');
    expect(codes).toContain('perfect_recall_mission');
    // save_ten_phrases only needs 3, not 10
    expect(codes).not.toContain('save_ten_phrases');
  });

  it('sums totalMissionXp correctly for multiple completions', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 1, totalPhrasesSaved: 3, streakDays: 3 }),
      states,
    );
    // complete_first_lesson (50) + save_three_phrases (30) + three_day_streak (25) = 105
    expect(result.totalMissionXp).toBe(105);
  });

  // ---------------------------------------------------------------------------
  // Duplicate prevention (already completed missions)
  // ---------------------------------------------------------------------------

  it('does not re-complete an already completed mission', () => {
    const states = new Map<string, UserMissionState | null>();
    states.set(
      'complete_first_lesson',
      state({ missionCode: 'complete_first_lesson', progressValue: 1, completedAt: '2026-01-01T00:00:00Z' }),
    );

    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 5 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).not.toContain('complete_first_lesson');
  });

  it('still completes other missions when one is already done', () => {
    const states = new Map<string, UserMissionState | null>();
    states.set(
      'complete_first_lesson',
      state({ missionCode: 'complete_first_lesson', progressValue: 1, completedAt: '2026-01-01T00:00:00Z' }),
    );

    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 5, totalPhrasesSaved: 3 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    // complete_first_lesson should NOT be here (already done)
    expect(codes).not.toContain('complete_first_lesson');
    // complete_five_lessons should be here (newly reached)
    expect(codes).toContain('complete_five_lessons');
    // save_three_phrases should be here
    expect(codes).toContain('save_three_phrases');
  });

  it('returns zero XP when all eligible missions are already completed', () => {
    const states = new Map<string, UserMissionState | null>();
    states.set(
      'complete_first_lesson',
      state({ missionCode: 'complete_first_lesson', progressValue: 1, completedAt: '2026-01-01T00:00:00Z' }),
    );

    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 1 }),
      states,
    );
    expect(result.newlyCompleted).toHaveLength(0);
    expect(result.totalMissionXp).toBe(0);
  });

  it('does not award XP for missions still below target even with partial progress', () => {
    const states = new Map<string, UserMissionState | null>();
    states.set(
      'save_three_phrases',
      state({ missionCode: 'save_three_phrases', progressValue: 2 }),
    );

    const result = evaluateMissions(
      baseCtx({ totalPhrasesSaved: 2 }),
      states,
    );
    const codes = result.newlyCompleted.map((m) => m.code);
    expect(codes).not.toContain('save_three_phrases');
  });

  // ---------------------------------------------------------------------------
  // Progress tracking
  // ---------------------------------------------------------------------------

  it('updates progress values in output map', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 3, totalPhrasesSaved: 5, streakDays: 2 }),
      states,
    );
    expect(result.updatedProgress.get('complete_first_lesson')).toBe(3);
    expect(result.updatedProgress.get('save_three_phrases')).toBe(5);
    expect(result.updatedProgress.get('three_day_streak')).toBe(2);
  });

  it('includes all mission codes in updatedProgress map', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(baseCtx(), states);
    // All 7 mission codes should be present
    const allCodes = getMissionDefinitions().map((d) => d.code);
    for (const code of allCodes) {
      expect(result.updatedProgress.has(code)).toBe(true);
    }
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('returns empty for context with no progress', () => {
    const states = new Map<string, UserMissionState | null>();
    const result = evaluateMissions(baseCtx(), states);
    expect(result.newlyCompleted).toHaveLength(0);
    expect(result.totalMissionXp).toBe(0);
  });

  it('handles progress above target gracefully (does not multiply awards)', () => {
    const states = new Map<string, UserMissionState | null>();
    // Already above the 'complete_five_lessons' target of 5
    const result = evaluateMissions(
      baseCtx({ totalLessonsCompleted: 15 }),
      states,
    );
    // Should be completed once, not three times
    const fiveLessonCompletions = result.newlyCompleted.filter(
      (m) => m.code === 'complete_five_lessons',
    );
    expect(fiveLessonCompletions).toHaveLength(1);
  });

  it('has exactly 7 mission definitions', () => {
    const defs = getMissionDefinitions();
    expect(defs).toHaveLength(7);
  });

  it('all mission definitions have positive target values', () => {
    const defs = getMissionDefinitions();
    for (const def of defs) {
      expect(def.targetValue).toBeGreaterThan(0);
    }
  });

  it('all mission definitions have non-negative XP rewards', () => {
    const defs = getMissionDefinitions();
    for (const def of defs) {
      expect(def.xpReward).toBeGreaterThanOrEqual(0);
    }
  });
});
