'use server';

/**
 * FluentDraft — Demo conversion server action
 *
 * Accepts locally stored demo progress from an authenticated user,
 * validates it against seeded demo content, calculates a trusted score,
 * and persists the result to Supabase.
 *
 * Related docs:
 *   - docs/api-contracts.md § Convert Demo Progress After Signup
 *   - docs/system-design.md § Signup And Demo Conversion
 */

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateScore } from '@/domains/scoring/engine';
import type { TypedPhraseResult } from '@/domains/scoring/types';
import { resolveLevelNumber } from '@/domains/gamification/levels';
import { calculateStreak, todayDateString } from '@/domains/gamification/streaks';
import { evaluateBadges } from '@/domains/gamification/badges';
import type { BadgeEvaluationContext } from '@/domains/gamification/badges';
import { evaluateMissions } from '@/domains/gamification/missions';
import type { MissionProgressContext, UserMissionState } from '@/domains/gamification/missions';
import { getWeekStartDate, getWeekEndDate, getMonthStartDate, getMonthEndDate } from '@/domains/leaderboard/periods';
import {
  DEMO_SCENARIO_ID,
  validateConversionPayload,
} from './validation';
import type {
  ConvertDemoProgressInput as ValidationInput,
} from './validation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Input / output types (re-exported for client use)
// ---------------------------------------------------------------------------

export interface TypedPhraseAttemptInput {
  keyPhraseId: string;
  typedText: string;
  attemptNumber: number;
}

export interface PronunciationAttemptInput {
  keyPhraseId: string;
  expectedText: string;
  transcript: string;
}

export type ConvertDemoProgressInput = ValidationInput;

export interface LessonScoreSummary {
  accuracyPoints: number;
  recallPoints: number;
  completionPoints: number;
  savePhrasePoints: number;
  streakBonus: number;
  difficultyMultiplier: number;
  repeatMultiplier: number;
  phaseCompletionMultiplier: number;
  totalBeforeMultiplier: number;
  totalScore: number;
}

export interface ConvertDemoProgressResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  lessonAttemptId?: string;
  score?: LessonScoreSummary;
  savedPhraseCount?: number;
  /** XP awarded for this lesson. */
  xpAwarded?: number;
  /** Whether the user's streak was updated. */
  streakUpdated?: boolean;
  /** Badge codes newly awarded. */
  newBadges?: string[];
  /** Mission codes newly completed. */
  completedMissions?: string[];
  /** XP awarded from newly completed missions. */
  missionXpAwarded?: number;
  /** Total XP awarded (lesson XP + mission XP). */
  totalXpAwarded?: number;
}

// ---------------------------------------------------------------------------
// Main conversion action
// ---------------------------------------------------------------------------

/**
 * Convert locally stored demo progress into persisted database records
 * for an authenticated user.
 *
 * - Authenticates the user.
 * - Validates the submitted payload against seeded demo content.
 * - Looks up expected phrase texts from the database.
 * - Runs trusted score calculation server-side.
 * - Inserts lesson_attempt, phrase_attempts, pronunciation_attempts,
 *   and phrase_bank_items in a single atomic flow.
 * - Awards XP, updates level and streak, records score events,
 *   evaluates badges, and updates mission progress.
 * - Returns the lesson attempt ID, score result, saved phrase count,
 *   and gamification summary.
 */
export async function convertDemoProgress(
  input: ConvertDemoProgressInput,
): Promise<ConvertDemoProgressResult> {
  // 1. Auth guard
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be signed in to convert demo progress.' };
  }

  // 2. Validate input
  const validationError = validateConversionPayload(input);
  if (validationError) {
    return { success: false, ...validationError };
  }

  const supabase = (await createServerClient()) as unknown as DbClient;

  // 3. Fetch demo key phrases from DB to get expected texts
  const { data: dbPhrases, error: phrasesError } = await supabase
    .from('key_phrases')
    .select('id, text, phrase_order')
    .eq('scenario_id', DEMO_SCENARIO_ID)
    .order('phrase_order');

  if (phrasesError || !dbPhrases || dbPhrases.length === 0) {
    return {
      success: false,
      error: 'Demo content is not available. Please try again later.',
    };
  }

  // Build a map of phrase ID → expected text
  const phraseTextMap = new Map<string, string>();
  for (const p of dbPhrases) {
    phraseTextMap.set(p.id, p.text);
  }

  // 4. Validate typed phrase attempts against expected texts (exact match)
  const phraseResults: TypedPhraseResult[] = [];
  for (const attempt of input.typedPhraseAttempts) {
    const expectedText = phraseTextMap.get(attempt.keyPhraseId);
    if (!expectedText) {
      return {
        success: false,
        error: `Phrase ${attempt.keyPhraseId} not found in demo lesson.`,
      };
    }
    phraseResults.push({
      keyPhraseId: attempt.keyPhraseId,
      expectedText,
      typedText: attempt.typedText,
      attemptNumber: attempt.attemptNumber,
      correct: attempt.typedText.trim() === expectedText.trim(),
    });
  }

  // 5. Calculate trusted score (server-side, never trust client)
  const score = calculateScore({
    difficulty: 'beginner',
    completed: true,
    phraseResults,
    savedPhraseCount: input.savedPhraseIds.length,
    firstActivityToday: true, // demo conversion is first activity
    isRepeat: false,
  });

  // 6. Insert lesson_attempt
  const now = new Date().toISOString();
  const { data: lessonAttempt, error: lessonError } = await supabase
    .from('lesson_attempts')
    .insert({
      user_id: user.id,
      scenario_id: DEMO_SCENARIO_ID,
      status: 'completed',
      current_phase: 'save',
      completed_required_phases: ['understand', 'practice', 'recall', 'save'],
      reviewed_mistakes: true,
      final_score: score.totalScore,
      started_at: input.clientCompletedAt ?? now,
      completed_at: now,
    })
    .select('id')
    .single();

  if (lessonError || !lessonAttempt) {
    return {
      success: false,
      error: lessonError?.message ?? 'Failed to create lesson attempt.',
    };
  }

  const lessonAttemptId = lessonAttempt.id;

  // 7. Insert phrase_attempts
  if (input.typedPhraseAttempts.length > 0) {
    const phraseAttemptRows = phraseResults.map((r) => ({
      lesson_attempt_id: lessonAttemptId,
      key_phrase_id: r.keyPhraseId,
      typed_text: r.typedText,
      expected_text: r.expectedText,
      attempt_number: r.attemptNumber,
      is_correct: r.correct,
    }));

    const { error: paError } = await supabase.from('phrase_attempts').insert(phraseAttemptRows);
    if (paError) {
      return {
        success: false,
        error: `Failed to save phrase attempts: ${paError.message}`,
      };
    }
  }

  // 8. Insert pronunciation_attempts (summaries only)
  if (input.pronunciationAttempts.length > 0) {
    const pronRows = input.pronunciationAttempts.map((a) => ({
      lesson_attempt_id: lessonAttemptId,
      key_phrase_id: a.keyPhraseId,
      expected_text: a.expectedText,
      transcript: a.transcript || null,
      status: a.transcript ? 'passed' : 'unsupported',
      feedback: a.transcript ? 'Pronunciation recorded.' : 'Browser speech not supported.',
      browser_supported: !!a.transcript,
      microphone_denied: false,
    }));

    const { error: pronError } = await supabase.from('pronunciation_attempts').insert(pronRows);
    if (pronError) {
      return {
        success: false,
        error: `Failed to save pronunciation attempts: ${pronError.message}`,
      };
    }
  }

  // 9. Insert phrase_bank_items for saved phrases
  let savedCount = 0;
  if (input.savedPhraseIds.length > 0) {
    const bankRows = input.savedPhraseIds.map((phraseId) => ({
      user_id: user.id,
      key_phrase_id: phraseId,
      source_scenario_id: DEMO_SCENARIO_ID,
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
    savedCount = count ?? input.savedPhraseIds.length;
  }

  // 10. Update XP and level in user_profiles
  const xpAwarded = score.totalScore;

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
  let streakUpdated = false;

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

  const streakUpdate = calculateStreak(existing, today);
  streakUpdated = streakUpdate.updated;

  const { error: streakError } = await supabase.from('streaks').upsert(
    {
      user_id: user.id,
      current_streak_days: streakUpdate.currentStreakDays,
      longest_streak_days: streakUpdate.longestStreakDays,
      last_practice_date: streakUpdate.lastPracticeDate,
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

  // Gather context data
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

  const hasPronunciationAttempt = input.pronunciationAttempts.length > 0;

  const perfectRecall =
    phraseResults.length > 0 &&
    phraseResults.every((r) => r.correct && r.attemptNumber === 1);

  const badgeCtx: BadgeEvaluationContext = {
    totalLessonsCompleted,
    streakDays: streakUpdate.currentStreakDays,
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

  if (badgeResult.awardedCodes.length > 0) {
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
    streakDays: streakUpdate.currentStreakDays,
    perfectRecallAchieved: perfectRecall,
  };

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

  for (const [code, progress] of missionResult.updatedProgress) {
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

  missionXpAwarded = missionResult.totalMissionXp;
  if (missionXpAwarded > 0) {
    await supabase.from('score_events').insert({
      user_id: user.id,
      lesson_attempt_id: lessonAttemptId,
      event_type: 'mission_bonus',
      points: missionXpAwarded,
      metadata: {
        completedMissions: missionResult.newlyCompleted.map((m) => m.code),
      },
    });

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

  const { data: currentLeaderboardEntry } = await supabase
    .from('leaderboard_entries')
    .select('score')
    .eq('user_id', user.id)
    .eq('period_type', 'weekly')
    .eq('period_start', weekStart)
    .maybeSingle();

  const currentWeeklyScore = currentLeaderboardEntry?.score ?? 0;
  const newWeeklyScore = currentWeeklyScore + xpAwarded + missionXpAwarded;

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
    savedPhraseCount: savedCount,
    xpAwarded,
    streakUpdated,
    newBadges: newBadges.length > 0 ? newBadges : undefined,
    completedMissions: completedMissions.length > 0 ? completedMissions : undefined,
    missionXpAwarded: missionXpAwarded > 0 ? missionXpAwarded : undefined,
    totalXpAwarded: totalXpAwarded > 0 ? totalXpAwarded : undefined,
  };
}
