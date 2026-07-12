'use server';

/**
 * FluentDraft — Phrase review server action
 *
 * Persists a phrase review for an authenticated user.
 * Server verifies phrase ownership, fetches the expected text from
 * seeded key_phrases, performs exact-match checking, inserts a
 * phrase_reviews row, and updates phrase_bank_items mastery and
 * next_review_at.
 *
 * Related docs:
 *   - docs/api-contracts.md § Review Phrase
 *   - docs/database-schema.md § Phrase Bank And Review
 */

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReviewPhraseInput, ReviewPhraseResult, MasteryStatus } from './types';
import { getNextMastery, getNextReviewAt } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

/**
 * Review a saved phrase.
 *
 * - Authenticates the user.
 * - Verifies the user owns the phrase_bank_item.
 * - Fetches the expected key_phrase text from the database.
 * - Performs exact-match checking server-side (not trusting the client).
 * - Inserts a phrase_reviews row.
 * - Updates phrase_bank_items mastery and next_review_at.
 */
export async function reviewPhrase(
  input: ReviewPhraseInput,
): Promise<ReviewPhraseResult> {
  // 1. Auth guard
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'You must be signed in to review phrases.',
      correct: false,
      expectedText: '',
      mastery: 'new',
    };
  }

  const supabase = (await createServerClient()) as unknown as DbClient;

  // 2. Fetch the phrase_bank_item to verify ownership and get key_phrase_id
  const { data: bankItem, error: bankError } = await supabase
    .from('phrase_bank_items')
    .select('id, user_id, key_phrase_id, mastery')
    .eq('id', input.phraseBankItemId)
    .single();

  if (bankError || !bankItem) {
    return {
      success: false,
      error: 'Phrase not found.',
      correct: false,
      expectedText: '',
      mastery: 'new',
    };
  }

  if (bankItem.user_id !== user.id) {
    return {
      success: false,
      error: 'You do not own this phrase.',
      correct: false,
      expectedText: '',
      mastery: 'new',
    };
  }

  // 3. Fetch the expected phrase text from key_phrases (source of truth)
  const { data: keyPhrase, error: phraseError } = await supabase
    .from('key_phrases')
    .select('text')
    .eq('id', bankItem.key_phrase_id)
    .single();

  if (phraseError || !keyPhrase) {
    return {
      success: false,
      error: 'Phrase content not found.',
      correct: false,
      expectedText: '',
      mastery: 'new',
    };
  }

  const expectedText = keyPhrase.text;

  // 4. Exact-match check (server-side, not trusting client)
  const correct = input.typedText.trim() === expectedText.trim();

  // 5. Determine new mastery and next review date
  const currentMastery = bankItem.mastery as MasteryStatus;
  const newMastery = getNextMastery(currentMastery, input.rating);
  const nextReviewAt = getNextReviewAt(input.rating);

  // 6. Insert phrase_reviews
  const now = new Date().toISOString();
  const { error: reviewError } = await supabase.from('phrase_reviews').insert({
    phrase_bank_item_id: input.phraseBankItemId,
    user_id: user.id,
    typed_text: input.typedText,
    expected_text: expectedText,
    is_correct: correct,
    rating: input.rating,
    mastery_after: newMastery,
    next_review_at: nextReviewAt,
    reviewed_at: now,
  });

  if (reviewError) {
    return {
      success: false,
      error: `Failed to save review: ${reviewError.message}`,
      correct,
      expectedText,
      mastery: newMastery,
    };
  }

  // 7. Update phrase_bank_items
  const { error: updateError } = await supabase
    .from('phrase_bank_items')
    .update({
      mastery: newMastery,
      next_review_at: nextReviewAt,
      updated_at: now,
    })
    .eq('id', input.phraseBankItemId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update mastery: ${updateError.message}`,
      correct,
      expectedText,
      mastery: newMastery,
    };
  }

  // 8. Return result
  return {
    success: true,
    correct,
    expectedText,
    mastery: newMastery,
    nextReviewAt,
  };
}
