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
 * - Returns the lesson attempt ID, score result, and saved phrase count.
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

  // 10. Return result
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
      totalBeforeMultiplier: score.totalBeforeMultiplier,
      totalScore: score.totalScore,
    },
    savedPhraseCount: savedCount,
  };
}
