'use server';

/**
 * FluentDraft — Complete lesson server action
 *
 * Persists a completed registered practice lesson to Supabase.
 * Validates all typed answers server-side against seeded content,
 * calculates exact correctness, and writes to lesson_attempts,
 * phrase_attempts, and phrase_bank_items.
 *
 * Related docs:
 *   - docs/api-contracts.md § Complete Lesson
 *   - docs/database-schema.md § Practice Attempts
 */

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getScenarioWithPack } from '@/domains/scenarios/data';
import { getScenarioDbId, getPhraseDbId } from '@/domains/scenarios/db-ids';
import { isExactMatch } from '@/domains/scoring/engine';
import { calculateScore } from '@/domains/scoring/engine';
import type { TypedPhraseResult, LessonScoreResult } from '@/domains/scoring/types';
import { resolveLevelNumber } from '@/domains/gamification/levels';
import { calculateStreak, todayDateString } from '@/domains/gamification/streaks';
import { evaluateBadges } from '@/domains/gamification/badges';
import type { BadgeEvaluationContext } from '@/domains/gamification/badges';
import { evaluateMissions } from '@/domains/gamification/missions';
import type { MissionProgressContext, UserMissionState } from '@/domains/gamification/missions';
import { getWeekStartDate, getWeekEndDate, getMonthStartDate, getMonthEndDate } from '@/domains/leaderboard/periods';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export interface PracticeAttemptInput {
  typedText: string;
  expectedText: string;
  attemptNumber: number;
  phraseOrder: number;
}

export interface CompleteLessonInput {
  scenarioSlug: string;
  typedPracticeAttempts: PracticeAttemptInput[];
  typedRecallAttempts: PracticeAttemptInput[];
  savedPhraseOrders: number[];
  reviewedMistakes: boolean;
  /** The scenario's difficulty level (used for scoring). */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface CompleteLessonResult {
  success: boolean;
  error?: string;
  lessonAttemptId?: string;
  savedPhraseCount?: number;
  practiceCorrect?: number;
  practiceTotal?: number;
  recallCorrect?: number;
  recallTotal?: number;
  /** Trusted server-calculated score breakdown. */
  score?: LessonScoreResult;
  /** XP awarded for this lesson (equals totalScore). */
  xpAwarded?: number;
  /** Whether the user's streak was updated (incremented or started). */
  streakUpdated?: boolean;
  /** Badge codes newly awarded in this completion. */
  newBadges?: string[];
  /** Mission codes newly completed in this completion. */
  completedMissions?: string[];
  /** XP awarded from newly completed missions. */
  missionXpAwarded?: number;
  /** Total XP awarded (lesson XP + mission XP). */
  totalXpAwarded?: number;
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/**
 * Persist a completed registered practice lesson.
 *
 * - Authenticates the user.
 * - Looks up the scenario from seed data to validate phrase texts.
 * - Calculates exact correctness server-side.
 * - Upserts key phrases into the DB if they don't already exist.
 * - Inserts lesson_attempt, phrase_attempts, and phrase_bank_items.
 */
export async function completeLesson(
  input: CompleteLessonInput,
): Promise<CompleteLessonResult> {
  // 1. Auth guard
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be signed in to save your lesson.' };
  }

  // 2. Look up scenario from seed data
  const scenario = getScenarioWithPack(input.scenarioSlug);
  if (!scenario) {
    return { success: false, error: 'Scenario not found.' };
  }

  const scenarioDbId = getScenarioDbId(input.scenarioSlug);
  if (!scenarioDbId) {
    return { success: false, error: 'Scenario is not available for persistence.' };
  }

  // Build lookup for expected phrase text by order
  const phraseTextByOrder = new Map<number, string>();
  for (const p of scenario.keyPhrases) {
    phraseTextByOrder.set(p.order, p.text);
  }

  // 3. Validate saved phrase orders
  const validSavedOrders = input.savedPhraseOrders.filter((o) =>
    phraseTextByOrder.has(o),
  );

  const supabase = (await createServerClient()) as unknown as DbClient;

  // 4. Ensure key phrases exist in DB (upsert if needed)
  for (const [order, phrase] of phraseTextByOrder) {
    const phraseId = getPhraseDbId(input.scenarioSlug, order);
    const seedPhrase = scenario.keyPhrases.find((p) => p.order === order);
    if (!seedPhrase) continue;

    await supabase.from('key_phrases').upsert(
      {
        id: phraseId,
        scenario_id: scenarioDbId,
        phrase_order: order,
        text: phrase,
        meaning: seedPhrase.meaning,
        example: seedPhrase.example,
        common_mistake: seedPhrase.commonMistake ?? null,
        pronunciation_required: seedPhrase.pronunciationRequired ?? true,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  }

  // 5. Build validated phrase results for scoring
  const phraseResults: TypedPhraseResult[] = [];
  let practiceCorrect = 0;
  let practiceTotal = 0;
  let recallCorrect = 0;
  let recallTotal = 0;

  for (const a of input.typedPracticeAttempts) {
    const expected = phraseTextByOrder.get(a.phraseOrder);
    if (!expected) continue;
    const correct = isExactMatch(a.typedText, expected);
    phraseResults.push({
      keyPhraseId: getPhraseDbId(input.scenarioSlug, a.phraseOrder),
      expectedText: expected,
      typedText: a.typedText,
      attemptNumber: a.attemptNumber,
      correct,
    });
    practiceTotal++;
    if (correct) practiceCorrect++;
  }

  for (const a of input.typedRecallAttempts) {
    const expected = phraseTextByOrder.get(a.phraseOrder);
    if (!expected) continue;
    const correct = isExactMatch(a.typedText, expected);
    phraseResults.push({
      keyPhraseId: getPhraseDbId(input.scenarioSlug, a.phraseOrder),
      expectedText: expected,
      typedText: a.typedText,
      attemptNumber: a.attemptNumber,
      correct,
    });
    recallTotal++;
    if (correct) recallCorrect++;
  }

  // 6. Calculate trusted score (server-side, never trust client)
  const score = calculateScore({
    difficulty: input.difficulty ?? 'beginner',
    completed: true,
    phraseResults,
    savedPhraseCount: validSavedOrders.length,
    firstActivityToday: true,
    isRepeat: false,
    completedPhases: 4,
  });

  // 7. Insert lesson_attempt
  const now = new Date().toISOString();
  const { data: lessonAttempt, error: lessonError } = await supabase
    .from('lesson_attempts')
    .insert({
      user_id: user.id,
      scenario_id: scenarioDbId,
      status: 'completed',
      current_phase: 'save',
      completed_required_phases: ['understand', 'practice', 'recall', 'save'],
      reviewed_mistakes: input.reviewedMistakes,
      final_score: score.totalScore,
      started_at: now,
      completed_at: now,
    })
    .select('id')
    .single();

  if (lessonError || !lessonAttempt) {
    return {
      success: false,
      error: lessonError?.message ?? 'Failed to save lesson attempt.',
    };
  }

  const lessonAttemptId = lessonAttempt.id;

  // 8. Insert phrase_attempts (rows built from already-validated phraseResults)
  const phraseAttemptRows = phraseResults.map((r) => ({
    lesson_attempt_id: lessonAttemptId,
    key_phrase_id: r.keyPhraseId,
    typed_text: r.typedText,
    expected_text: r.expectedText,
    attempt_number: r.attemptNumber,
    is_correct: r.correct,
  }));

  if (phraseAttemptRows.length > 0) {
    const { error: paError } = await supabase
      .from('phrase_attempts')
      .insert(phraseAttemptRows);
    if (paError) {
      return {
        success: false,
        error: `Failed to save phrase attempts: ${paError.message}`,
      };
    }
  }

  // 9. Insert phrase_bank_items for saved phrases
  let savedCount = 0;
  if (validSavedOrders.length > 0) {
    const bankRows = validSavedOrders.map((order) => ({
      user_id: user.id,
      key_phrase_id: getPhraseDbId(input.scenarioSlug, order),
      source_scenario_id: scenarioDbId,
      mastery: 'new',
    }));

    const { error: bankError, count } = await supabase
      .from('phrase_bank_items')
      .upsert(bankRows, {
        onConflict: 'user_id, key_phrase_id',
        ignoreDuplicates: true,
      });

    if (bankError) {
      return {
        success: false,
        error: `Failed to save phrases: ${bankError.message}`,
      };
    }
    savedCount = count ?? validSavedOrders.length;
  }

  // 10. Update XP and level in user_profiles
  const xpAwarded = score.totalScore;
  let streakUpdated = false;

  // Fetch current profile for total_xp
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('total_xp')
    .eq('user_id', user.id)
    .maybeSingle();

  const currentXp = currentProfile?.total_xp ?? 0;
  const newTotalXp = currentXp + xpAwarded;
  const newLevelNumber = resolveLevelNumber(newTotalXp);

  const { error: xpError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,
        total_xp: newTotalXp,
        current_level_id: newLevelNumber,
      },
      { onConflict: 'user_id' },
    );

  if (xpError) {
    return {
      success: false,
      error: `Failed to update XP: ${xpError.message}`,
    };
  }

  // 11. Update streak
  const today = todayDateString();

  // Fetch current streak row
  const { data: currentStreak } = await supabase
    .from('streaks')
    .select('current_streak_days, longest_streak_days, last_practice_date')
    .eq('user_id', user.id)
    .maybeSingle();

  const existing = currentStreak
    ? {
        currentStreakDays: currentStreak.current_streak_days,
        longestStreakDays: currentStreak.longest_streak_days,
        lastPracticeDate: currentStreak.last_practice_date,
      }
    : null;

  const update = calculateStreak(existing, today);
  streakUpdated = update.updated;

  const { error: streakError } = await supabase.from('streaks').upsert(
    {
      user_id: user.id,
      current_streak_days: update.currentStreakDays,
      longest_streak_days: update.longestStreakDays,
      last_practice_date: update.lastPracticeDate,
    },
    { onConflict: 'user_id' },
  );

  if (streakError) {
    return {
      success: false,
      error: `Failed to update streak: ${streakError.message}`,
    };
  }

  // 12. Insert score_events for this lesson completion
  const { error: scoreEventError } = await supabase.from('score_events').insert({
    user_id: user.id,
    lesson_attempt_id: lessonAttemptId,
    event_type: 'lesson_completion',
    points: xpAwarded,
    metadata: {
      accuracyPoints: score.accuracyPoints,
      recallPoints: score.recallPoints,
      completionPoints: score.completionPoints,
      savePhrasePoints: score.savePhrasePoints,
      streakBonus: score.streakBonus,
      difficultyMultiplier: score.difficultyMultiplier,
      repeatMultiplier: score.repeatMultiplier,
      phaseCompletionMultiplier: score.phaseCompletionMultiplier,
    },
  });

  if (scoreEventError) {
    return {
      success: false,
      error: `Failed to record score event: ${scoreEventError.message}`,
    };
  }

  // 13. Evaluate and award badges
  const newBadges: string[] = [];
  let missionXpAwarded = 0;
  const completedMissions: string[] = [];

  // Gather context data for badge evaluation
  const { count: totalLessonsCount } = await supabase
    .from('lesson_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const totalLessonsCompleted = (totalLessonsCount ?? 0);

  const { count: totalPhrasesSavedCount } = await supabase
    .from('phrase_bank_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const totalPhrasesSaved = (totalPhrasesSavedCount ?? 0);

  // Check for any pronunciation attempt (ever)
  const { count: hasPronCount } = await supabase
    .from('pronunciation_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('lesson_attempt_id', lessonAttemptId);

  const hasPronunciationAttempt = (hasPronCount ?? 0) > 0;

  // Determine perfect recall: all phrase attempts correct on first try
  const perfectRecall =
    phraseResults.length > 0 &&
    phraseResults.every((r) => r.correct && r.attemptNumber === 1);

  const badgeCtx: BadgeEvaluationContext = {
    totalLessonsCompleted,
    streakDays: update.currentStreakDays,
    perfectRecall,
    totalPhrasesSaved,
    hasPronunciationAttempt,
    allPhasesCompleted: score.phaseCompletionMultiplier >= 1.0,
    isFirstLesson: totalLessonsCompleted === 1,
  };

  // Fetch existing badge codes
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id, badges!inner(code)')
    .eq('user_id', user.id);

  const alreadyOwnedCodes = new Set<string>(
    (existingBadges ?? []).map(
      (row: unknown) => (row as { badges: { code: string } }).badges.code,
    ),
  );

  const badgeResult = evaluateBadges(badgeCtx, alreadyOwnedCodes);

  // Insert newly awarded badges
  if (badgeResult.awardedCodes.length > 0) {
    // Resolve badge IDs from codes
    const { data: badgeRows } = await supabase
      .from('badges')
      .select('id, code')
      .in('code', badgeResult.awardedCodes);

    if (badgeRows && badgeRows.length > 0) {
      const badgeInserts = badgeRows.map((b) => ({
        user_id: user.id,
        badge_id: b.id,
      }));

      const { error: badgeInsertError } = await supabase
        .from('user_badges')
        .insert(badgeInserts);

      if (badgeInsertError) {
        // Non-fatal: log but don't fail the lesson completion
        console.error('Failed to award badges:', badgeInsertError.message);
      } else {
        newBadges.push(...badgeResult.awardedCodes);
      }
    }
  }

  // 14. Evaluate and update mission progress
  const missionCtx: MissionProgressContext = {
    totalLessonsCompleted,
    totalPhrasesSaved,
    streakDays: update.currentStreakDays,
    perfectRecallAchieved: perfectRecall,
  };

  // Fetch current mission states
  const { data: currentMissions } = await supabase
    .from('user_missions')
    .select('mission_id, progress_value, completed_at, missions!inner(code)')
    .eq('user_id', user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentStates = new Map<string, UserMissionState | null>();
  for (const row of (currentMissions ?? [])) {
    const missions = (row as { missions: unknown }).missions;
    const code = (missions as { code: string }).code;
    currentStates.set(code, {
      missionCode: code,
      progressValue: row.progress_value,
      completedAt: row.completed_at,
    });
  }

  const missionResult = evaluateMissions(missionCtx, currentStates);

  // Upsert mission progress for all tracked missions
  for (const [code, progress] of missionResult.updatedProgress) {
    // Get mission ID from code
    const { data: missionRows } = await supabase
      .from('missions')
      .select('id')
      .eq('code', code)
      .single();

    if (!missionRows) continue;

    const isNewlyCompleted = missionResult.newlyCompleted.some(
      (m) => m.code === code,
    );

    await supabase.from('user_missions').upsert(
      {
        user_id: user.id,
        mission_id: missionRows.id,
        progress_value: progress,
        completed_at: isNewlyCompleted ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id, mission_id' },
    );
  }

  // Award mission XP for newly completed missions
  missionXpAwarded = missionResult.totalMissionXp;
  if (missionXpAwarded > 0) {
    // Insert score event for mission bonus
    await supabase.from('score_events').insert({
      user_id: user.id,
      lesson_attempt_id: lessonAttemptId,
      event_type: 'mission_bonus',
      points: missionXpAwarded,
      metadata: {
        completedMissions: missionResult.newlyCompleted.map((m) => m.code),
      },
    });

    // Update total XP in user_profiles
    const newTotalWithMissions = newTotalXp + missionXpAwarded;
    const newLevelWithMissions = resolveLevelNumber(newTotalWithMissions);

    await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          total_xp: newTotalWithMissions,
          current_level_id: newLevelWithMissions,
        },
        { onConflict: 'user_id' },
      );

    completedMissions.push(
      ...missionResult.newlyCompleted.map((m) => m.code),
    );
  }

  // 15. Update weekly leaderboard entry
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();

  // Fetch current weekly score
  const { data: currentLeaderboardEntry } = await supabase
    .from('leaderboard_entries')
    .select('score')
    .eq('user_id', user.id)
    .eq('period_type', 'weekly')
    .eq('period_start', weekStart)
    .maybeSingle();

  const currentWeeklyScore = currentLeaderboardEntry?.score ?? 0;
  const newWeeklyScore = currentWeeklyScore + xpAwarded + missionXpAwarded;

  // Fetch user's country for the leaderboard
  const { data: countryProfile } = await supabase
    .from('user_profiles')
    .select('country_code')
    .eq('user_id', user.id)
    .maybeSingle();

  const countryCode = countryProfile?.country_code ?? 'XX';

  await supabase.from('leaderboard_entries').upsert(
    {
      user_id: user.id,
      period_type: 'weekly',
      period_start: weekStart,
      period_end: weekEnd,
      country_code: countryCode,
      score: newWeeklyScore,
    },
    { onConflict: 'user_id, period_type, period_start' },
  );

  // Also update monthly leaderboard entry
  const monthStart = getMonthStartDate();
  const monthEnd = getMonthEndDate();

  const { data: currentMonthlyEntry } = await supabase
    .from('leaderboard_entries')
    .select('score')
    .eq('user_id', user.id)
    .eq('period_type', 'monthly')
    .eq('period_start', monthStart)
    .maybeSingle();

  const currentMonthlyScore = currentMonthlyEntry?.score ?? 0;
  const newMonthlyScore = currentMonthlyScore + xpAwarded + missionXpAwarded;

  await supabase.from('leaderboard_entries').upsert(
    {
      user_id: user.id,
      period_type: 'monthly',
      period_start: monthStart,
      period_end: monthEnd,
      country_code: countryCode,
      score: newMonthlyScore,
    },
    { onConflict: 'user_id, period_type, period_start' },
  );

  // 16. Return result
  const totalXpAwarded = xpAwarded + missionXpAwarded;

  return {
    success: true,
    lessonAttemptId,
    savedPhraseCount: savedCount,
    practiceCorrect,
    practiceTotal,
    recallCorrect,
    recallTotal,
    xpAwarded,
    streakUpdated,
    newBadges: newBadges.length > 0 ? newBadges : undefined,
    completedMissions: completedMissions.length > 0 ? completedMissions : undefined,
    missionXpAwarded: missionXpAwarded > 0 ? missionXpAwarded : undefined,
    totalXpAwarded: totalXpAwarded > 0 ? totalXpAwarded : undefined,
    score: {
      accuracyPoints: score.accuracyPoints,
      recallPoints: score.recallPoints,
      completionPoints: score.completionPoints,
      savePhrasePoints: score.savePhrasePoints,
      streakBonus: score.streakBonus,
      difficultyMultiplier: score.difficultyMultiplier,
      repeatMultiplier: score.repeatMultiplier,
      phaseCompletionMultiplier: score.phaseCompletionMultiplier,
      totalBeforeMultiplier: score.totalBeforeMultiplier,
      totalScore: score.totalScore,
    },
  };
}
