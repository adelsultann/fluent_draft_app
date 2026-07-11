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

  // 12. Return result
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
