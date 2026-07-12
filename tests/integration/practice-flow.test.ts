/**
 * Integration tests — Registered practice flow
 *
 * Tests the full practice pipeline: checking answers → calculating score →
 * resolving level → evaluating badges → evaluating missions → streak
 * calculation. All pure logic composed together — no Supabase required.
 *
 * Related docs:
 *   - docs/testing-strategy.md § Integration Tests
 *   - docs/api-contracts.md § Complete Lesson, Scoring And Gamification
 */

import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  getDifficultyMultiplier,
} from '@/domains/scoring/engine';
import type { TypedPhraseResult } from '@/domains/scoring/types';
import { resolveLevel, LEVELS } from '@/domains/gamification/levels';
import { evaluateBadges } from '@/domains/gamification/badges';
import type { BadgeEvaluationContext } from '@/domains/gamification/badges';
import { evaluateMissions } from '@/domains/gamification/missions';
import type { MissionProgressContext, UserMissionState } from '@/domains/gamification/missions';
import { calculateStreak } from '@/domains/gamification/streaks';
import { resolveRank } from '@/domains/gamification/ranks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePhraseResults(
  configs: { correct: boolean; attemptNumber: number }[],
): TypedPhraseResult[] {
  return configs.map((c, i) => ({
    keyPhraseId: `phrase-${i + 1}`,
    expectedText: `expected text ${i + 1}`,
    typedText: c.correct ? `expected text ${i + 1}` : 'wrong',
    attemptNumber: c.attemptNumber,
    correct: c.correct,
  }));
}

// ---------------------------------------------------------------------------
// Full practice → gamification pipeline
// ---------------------------------------------------------------------------

describe('Practice → Gamification pipeline', () => {
  it('completes a beginner lesson with perfect score and updates all gamification', () => {
    // Step 1: Check answers (simulated — all correct first try)
    const phraseResults = makePhraseResults([
      { correct: true, attemptNumber: 1 },
      { correct: true, attemptNumber: 1 },
      { correct: true, attemptNumber: 1 },
      { correct: true, attemptNumber: 1 },
    ]);

    // All are correct first-try
    expect(phraseResults.every((r) => r.correct)).toBe(true);

    // Step 2: Calculate score
    const score = calculateScore({
      difficulty: 'beginner',
      completed: true,
      phraseResults,
      savedPhraseCount: 2,
      firstActivityToday: true,
      isRepeat: false,
    });
    // Accuracy: 4 × 10 = 40, Recall: 20, Completion: 15, Saves: 2×5=10, Streak: 5
    // Total: 40 + 20 + 15 + 10 + 5 = 90
    expect(score.totalScore).toBe(90);

    // Step 3: Resolve level (new user, 0 XP → +90 = level 1)
    const currentXp = 0;
    const newTotalXp = currentXp + score.totalScore;
    const level = resolveLevel(newTotalXp);
    expect(level.name).toBe('Newcomer');
    expect(level.levelNumber).toBe(1);

    // Step 4: Evaluate badges
    const badgeCtx: BadgeEvaluationContext = {
      totalLessonsCompleted: 1,
      streakDays: 1,
      perfectRecall: true,
      totalPhrasesSaved: 2,
      hasPronunciationAttempt: false,
      allPhasesCompleted: true,
      isFirstLesson: true,
    };
    const badgeResult = evaluateBadges(badgeCtx, new Set());
    // Should award: first_lesson, all_phases, perfect_recall, first_save
    expect(badgeResult.awardedCodes).toContain('first_lesson');
    expect(badgeResult.awardedCodes).toContain('all_phases');
    expect(badgeResult.awardedCodes).toContain('perfect_recall');
    expect(badgeResult.awardedCodes).toContain('first_save');

    // Step 5: Evaluate missions
    const missionCtx: MissionProgressContext = {
      totalLessonsCompleted: 1,
      totalPhrasesSaved: 2,
      streakDays: 1,
      perfectRecallAchieved: true,
    };
    const missionResult = evaluateMissions(missionCtx, new Map());
    // Should complete: complete_first_lesson, perfect_recall_mission
    expect(missionResult.newlyCompleted.map((m) => m.code)).toContain('complete_first_lesson');
    expect(missionResult.newlyCompleted.map((m) => m.code)).toContain('perfect_recall_mission');
    // 50 + 40 = 90 mission XP
    expect(missionResult.totalMissionXp).toBe(90);

    // Step 6: Streak (first activity)
    const streak = calculateStreak(null, '2026-07-13');
    expect(streak.currentStreakDays).toBe(1);
    expect(streak.updated).toBe(true);
  });

  it('handles intermediate difficulty with repeat lesson', () => {
    const phraseResults = makePhraseResults(
      Array(4).fill({ correct: true, attemptNumber: 1 }),
    );

    const score = calculateScore({
      difficulty: 'intermediate',
      completed: true,
      phraseResults,
      savedPhraseCount: 0,
      firstActivityToday: false,
      isRepeat: true,
    });
    // Accuracy: 4×10=40, Recall: 20, Completion: 15, Streak: 0
    // Raw: 75. Repeat ×0.5 = 37.5 → 38. Intermediate ×1.2 = 45.6 → 46
    expect(score.difficultyMultiplier).toBe(1.2);
    expect(score.repeatMultiplier).toBe(0.5);
    expect(score.totalBeforeMultiplier).toBe(38);
    expect(score.totalScore).toBe(46);
  });

  it('level progression works across multiple lessons', () => {
    // Simulate 3 completed beginner lessons at ~70 XP each
    const totalXp = 3 * 70; // 210
    const level = resolveLevel(totalXp);
    expect(level.levelNumber).toBe(2); // Learner starts at 100
    expect(level.name).toBe('Learner');
  });

  it('rank resolution matches level', () => {
    const xp = 750; // Communicator (level 4, threshold 500)
    const level = resolveLevel(xp);
    const nextLevel = LEVELS[level.levelNumber] ?? null;

    const rank = resolveRank(xp, level, nextLevel);
    expect(rank.rankName).toBe('Communicator');
    expect(rank.levelNumber).toBe(4);
    expect(rank.xpToNextLevel).toBe(250); // 1000 - 750
    expect(rank.isMaxLevel).toBe(false);
  });

  it('streak increments across consecutive days', () => {
    const day1 = calculateStreak(null, '2026-07-13');
    expect(day1.currentStreakDays).toBe(1);

    const day2 = calculateStreak(
      { currentStreakDays: 1, longestStreakDays: 1, lastPracticeDate: '2026-07-13' },
      '2026-07-14',
    );
    expect(day2.currentStreakDays).toBe(2);
    expect(day2.longestStreakDays).toBe(2);

    const day3 = calculateStreak(
      { currentStreakDays: 2, longestStreakDays: 2, lastPracticeDate: '2026-07-14' },
      '2026-07-15',
    );
    expect(day3.currentStreakDays).toBe(3);
  });

  it('badge and mission evaluation respect existing state (no duplicates)', () => {
    // User already has first_lesson badge and mission
    const badgeCtx: BadgeEvaluationContext = {
      totalLessonsCompleted: 5,
      streakDays: 3,
      perfectRecall: false,
      totalPhrasesSaved: 3,
      hasPronunciationAttempt: false,
      allPhasesCompleted: true,
      isFirstLesson: false,
    };

    const alreadyOwned = new Set(['first_lesson', 'all_phases']);
    const badgeResult = evaluateBadges(badgeCtx, alreadyOwned);
    // first_lesson and all_phases should NOT be re-awarded
    expect(badgeResult.awardedCodes).not.toContain('first_lesson');
    expect(badgeResult.awardedCodes).not.toContain('all_phases');
    // But new ones (five_lessons, practice_streak_3, first_save) should
    expect(badgeResult.awardedCodes).toContain('five_lessons');
    expect(badgeResult.awardedCodes).toContain('first_save');
    // practice_streak_3 requires streakDays >= 3
    expect(badgeResult.awardedCodes).toContain('practice_streak_3');

    // Missions: complete_first_lesson already done
    const missionStates = new Map<string, UserMissionState | null>();
    missionStates.set('complete_first_lesson', {
      missionCode: 'complete_first_lesson',
      progressValue: 1,
      completedAt: '2026-01-01T00:00:00Z',
    });

    const missionCtx: MissionProgressContext = {
      totalLessonsCompleted: 5,
      totalPhrasesSaved: 3,
      streakDays: 3,
      perfectRecallAchieved: false,
    };
    const missionResult = evaluateMissions(missionCtx, missionStates);
    // complete_first_lesson NOT in newly completed
    expect(missionResult.newlyCompleted.map((m) => m.code)).not.toContain('complete_first_lesson');
    // complete_five_lessons, save_three_phrases, three_day_streak ARE
    expect(missionResult.newlyCompleted.map((m) => m.code)).toContain('complete_five_lessons');
    expect(missionResult.newlyCompleted.map((m) => m.code)).toContain('save_three_phrases');
    expect(missionResult.newlyCompleted.map((m) => m.code)).toContain('three_day_streak');
  });
});

// ---------------------------------------------------------------------------
// Difficulty multiplier integration
// ---------------------------------------------------------------------------

describe('Difficulty multiplier integration', () => {
  it('beginner ×1.0 does not change score', () => {
    expect(getDifficultyMultiplier('beginner')).toBe(1.0);
   });

  it('intermediate ×1.2 increases score by 20%', () => {
    const beginner = calculateScore({
      difficulty: 'beginner',
      completed: true,
      phraseResults: [],
      savedPhraseCount: 0,
      firstActivityToday: false,
      isRepeat: false,
    });
    const intermediate = calculateScore({
      difficulty: 'intermediate',
      completed: true,
      phraseResults: [],
      savedPhraseCount: 0,
      firstActivityToday: false,
      isRepeat: false,
    });
    // Both have same raw total (15), diff is just multiplier
    expect(intermediate.totalBeforeMultiplier).toBe(beginner.totalBeforeMultiplier);
    expect(intermediate.totalScore).toBeGreaterThan(beginner.totalScore);
    expect(intermediate.totalScore).toBe(18); // 15 * 1.2
  });

  it('advanced ×1.5 increases score by 50%', () => {
    const result = calculateScore({
      difficulty: 'advanced',
      completed: true,
      phraseResults: [],
      savedPhraseCount: 0,
      firstActivityToday: false,
      isRepeat: false,
    });
    expect(result.difficultyMultiplier).toBe(1.5);
    expect(result.totalScore).toBe(23); // 15 * 1.5 = 22.5 → Math.round = 23
  });
});

// ---------------------------------------------------------------------------
// Score persistence validation (what gets stored)
// ---------------------------------------------------------------------------

describe('Score breakdown consistency', () => {
  it('totalScore is always a non-negative integer', () => {
    const inputs = [
      { difficulty: 'beginner' as const, completed: true, phrases: [], saves: 0, streak: false, repeat: false },
      { difficulty: 'beginner' as const, completed: false, phrases: [], saves: 0, streak: false, repeat: false },
      { difficulty: 'advanced' as const, completed: true, phrases: makePhraseResults([{ correct: true, attemptNumber: 1 }]), saves: 5, streak: true, repeat: true },
      { difficulty: 'intermediate' as const, completed: true, phrases: makePhraseResults([{ correct: false, attemptNumber: 1 }]), saves: 0, streak: false, repeat: false },
    ];

    for (const input of inputs) {
      const score = calculateScore({
        difficulty: input.difficulty,
        completed: input.completed,
        phraseResults: input.phrases,
        savedPhraseCount: input.saves,
        firstActivityToday: input.streak,
        isRepeat: input.repeat,
      });
      expect(Number.isInteger(score.totalScore)).toBe(true);
      expect(score.totalScore).toBeGreaterThanOrEqual(0);
    }
  });

  it('score breakdown components sum correctly before multiplier', () => {
    const phraseResults = makePhraseResults([
      { correct: true, attemptNumber: 1 },
      { correct: true, attemptNumber: 2 },
    ]);

    const score = calculateScore({
      difficulty: 'beginner',
      completed: true,
      phraseResults,
      savedPhraseCount: 1,
      firstActivityToday: true,
      isRepeat: false,
    });

    const sum = score.accuracyPoints + score.recallPoints +
      score.completionPoints + score.savePhrasePoints + score.streakBonus;
    // accuracy: 10 + 5 = 15, recall: 0 (not all first-try), completion: 15, saves: 5, streak: 5
    // sum: 15 + 0 + 15 + 5 + 5 = 40
    // totalBeforeMultiplier = 40 * 1.0 * 1.0 = 40
    expect(score.totalBeforeMultiplier).toBe(sum);
    expect(score.totalScore).toBe(sum); // beginner ×1.0
  });
});
