/**
 * FluentDraft — Mission evaluation
 *
 * Pure functions that determine mission progress and completion
 * based on the user's current activity context.
 *
 * Related docs:
 *   - supabase/migrations/20260709000003_seed_gamification.sql § Missions
 *   - docs/database-schema.md § missions, user_missions
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Context passed to mission evaluation after lesson completion. */
export interface MissionProgressContext {
  /** Total completed lessons (including this one). */
  totalLessonsCompleted: number;
  /** Total phrases saved to the Phrase Bank (including this lesson). */
  totalPhrasesSaved: number;
  /** Current streak days (after this lesson's update). */
  streakDays: number;
  /** Whether the user achieved a perfect recall in this lesson. */
  perfectRecallAchieved: boolean;
}

/** A seeded mission definition (mirrors the missions table). */
export interface MissionDefinition {
  code: string;
  title: string;
  description: string;
  targetValue: number;
  xpReward: number;
}

/** Current progress state for a single mission from the database. */
export interface UserMissionState {
  missionCode: string;
  progressValue: number;
  /** ISO timestamp if completed, null otherwise. */
  completedAt: string | null;
}

/** Result of evaluating all missions against current context. */
export interface MissionEvaluationResult {
  /** Missions that just became newly completed in this evaluation. */
  newlyCompleted: { code: string; xpReward: number }[];
  /** Total XP to award from newly completed missions. */
  totalMissionXp: number;
  /** Updated progress value for each tracked mission code. */
  updatedProgress: Map<string, number>;
}

// ---------------------------------------------------------------------------
// Mission definitions (mirrors seed migration)
// ---------------------------------------------------------------------------

/** All seeded mission codes and their tracking rules. */
const MISSION_DEFINITIONS: MissionDefinition[] = [
  {
    code: 'complete_first_lesson',
    title: 'First Mission',
    description: 'Complete 1 lesson',
    targetValue: 1,
    xpReward: 50,
  },
  {
    code: 'save_three_phrases',
    title: 'Build Your Bank',
    description: 'Save 3 phrases to the Phrase Bank',
    targetValue: 3,
    xpReward: 30,
  },
  {
    code: 'three_day_streak',
    title: 'Keep It Going',
    description: 'Achieve a 3-day practice streak',
    targetValue: 3,
    xpReward: 25,
  },
  {
    code: 'complete_five_lessons',
    title: 'Lesson Marathon',
    description: 'Complete 5 lessons',
    targetValue: 5,
    xpReward: 100,
  },
  {
    code: 'perfect_recall_mission',
    title: 'Memory Master',
    description: 'Complete a recall phase perfectly',
    targetValue: 1,
    xpReward: 40,
  },
  {
    code: 'save_ten_phrases',
    title: 'Phrase Collector',
    description: 'Save 10 phrases to the Phrase Bank',
    targetValue: 10,
    xpReward: 75,
  },
  {
    code: 'complete_ten_lessons',
    title: 'Seasoned Learner',
    description: 'Complete 10 lessons',
    targetValue: 10,
    xpReward: 150,
  },
];

// ---------------------------------------------------------------------------
// Progress derivation
// ---------------------------------------------------------------------------

/**
 * Derive the current progress value for a mission given the user context.
 *
 * Each mission code maps to a specific tracked metric:
 *   - Lesson-count missions track totalLessonsCompleted
 *   - Phrase-save missions track totalPhrasesSaved
 *   - Streak missions track streakDays
 *   - Perfect recall mission tracks perfectRecallAchieved (0 or 1)
 */
export function deriveMissionProgress(
  code: string,
  ctx: MissionProgressContext,
): number {
  switch (code) {
    case 'complete_first_lesson':
    case 'complete_five_lessons':
    case 'complete_ten_lessons':
      return ctx.totalLessonsCompleted;

    case 'save_three_phrases':
    case 'save_ten_phrases':
      return ctx.totalPhrasesSaved;

    case 'three_day_streak':
      return ctx.streakDays;

    case 'perfect_recall_mission':
      return ctx.perfectRecallAchieved ? 1 : 0;

    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate mission progress for a user given their activity context and
 * current mission states from the database.
 *
 * Rules:
 *   - For each mission, derive current progress from context.
 *   - If progress >= targetValue and the mission is NOT already completed,
 *     it is considered newly completed and its XP reward is included.
 *   - Missions already completed (completedAt !== null) are never re-awarded.
 *   - Returns the set of newly completed missions and updated progress values.
 *
 * @param ctx — the user's current activity context
 * @param currentStates — map of mission code → current user_mission state (or null if not tracked yet)
 * @returns evaluation result with newly completed missions and progress updates
 */
export function evaluateMissions(
  ctx: MissionProgressContext,
  currentStates: Map<string, UserMissionState | null>,
): MissionEvaluationResult {
  const newlyCompleted: { code: string; xpReward: number }[] = [];
  const updatedProgress = new Map<string, number>();

  for (const def of MISSION_DEFINITIONS) {
    const progress = deriveMissionProgress(def.code, ctx);
    updatedProgress.set(def.code, progress);

    const current = currentStates.get(def.code);

    // Already completed — skip
    if (current && current.completedAt !== null) {
      continue;
    }

    // Not yet at target — skip
    if (progress < def.targetValue) {
      continue;
    }

    // Newly completed!
    newlyCompleted.push({ code: def.code, xpReward: def.xpReward });
  }

  return {
    newlyCompleted,
    totalMissionXp: newlyCompleted.reduce((sum, m) => sum + m.xpReward, 0),
    updatedProgress,
  };
}

/**
 * Return all mission definitions for reference.
 */
export function getMissionDefinitions(): MissionDefinition[] {
  return MISSION_DEFINITIONS;
}
