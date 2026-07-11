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

  // 5. Insert lesson_attempt
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
      final_score: 0,
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

  // 6. Insert phrase_attempts
  let practiceCorrect = 0;
  let practiceTotal = 0;
  let recallCorrect = 0;
  let recallTotal = 0;

  const phraseAttemptRows: Array<{
    lesson_attempt_id: string;
    key_phrase_id: string;
    typed_text: string;
    expected_text: string;
    attempt_number: number;
    is_correct: boolean;
  }> = [];

  for (const a of input.typedPracticeAttempts) {
    const expected = phraseTextByOrder.get(a.phraseOrder);
    if (!expected) continue;
    const correct = isExactMatch(a.typedText, expected);
    phraseAttemptRows.push({
      lesson_attempt_id: lessonAttemptId,
      key_phrase_id: getPhraseDbId(input.scenarioSlug, a.phraseOrder),
      typed_text: a.typedText,
      expected_text: expected,
      attempt_number: a.attemptNumber,
      is_correct: correct,
    });
    practiceTotal++;
    if (correct) practiceCorrect++;
  }

  for (const a of input.typedRecallAttempts) {
    const expected = phraseTextByOrder.get(a.phraseOrder);
    if (!expected) continue;
    const correct = isExactMatch(a.typedText, expected);
    phraseAttemptRows.push({
      lesson_attempt_id: lessonAttemptId,
      key_phrase_id: getPhraseDbId(input.scenarioSlug, a.phraseOrder),
      typed_text: a.typedText,
      expected_text: expected,
      attempt_number: a.attemptNumber,
      is_correct: correct,
    });
    recallTotal++;
    if (correct) recallCorrect++;
  }

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

  // 7. Insert phrase_bank_items for saved phrases
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

  // 8. Return result
  return {
    success: true,
    lessonAttemptId,
    savedPhraseCount: savedCount,
    practiceCorrect,
    practiceTotal,
    recallCorrect,
    recallTotal,
  };
}
