/**
 * FluentDraft — Phrase Bank data access
 *
 * Server-side data fetching for phrase bank items.
 * Fetches only the current user's saved phrases, joined with
 * key_phrase text/meaning and scenario title/slug.
 *
 * RLS on phrase_bank_items ensures users can only read their own data.
 *
 * Related docs:
 *   - docs/database-schema.md § Phrase Bank And Review
 *   - docs/api-contracts.md § Phrase Bank
 */

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { PhraseBankItem, MasteryStatus } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw row shape returned by the Supabase join query. */
interface PhraseBankJoinRow {
  id: string;
  mastery: string;
  saved_at: string;
  key_phrases: {
    id: string;
    text: string;
    meaning: string;
    example: string;
  } | null;
  scenarios: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all saved phrase bank items for the currently authenticated user.
 *
 * Joins phrase_bank_items → key_phrases → scenarios to include
 * phrase text, meaning, example, and source scenario metadata.
 *
 * Returns items ordered by most recently saved first.
 * Returns an empty array if the user has no saved phrases.
 *
 * @throws if there is a database error (callers should handle gracefully)
 */
export async function getUserPhrases(): Promise<PhraseBankItem[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('phrase_bank_items')
    .select(`
      id,
      mastery,
      saved_at,
      key_phrases!inner (
        id,
        text,
        meaning,
        example
      ),
      scenarios!inner (
        id,
        title,
        slug
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch phrase bank: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as PhraseBankJoinRow[]).map(mapRow);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRow(row: PhraseBankJoinRow): PhraseBankItem {
  return {
    id: row.id,
    text: row.key_phrases?.text ?? '(phrase unavailable)',
    meaning: row.key_phrases?.meaning ?? '',
    example: row.key_phrases?.example ?? '',
    scenarioTitle: row.scenarios?.title ?? 'Unknown scenario',
    scenarioSlug: row.scenarios?.slug ?? '',
    mastery: row.mastery as MasteryStatus,
    savedAt: row.saved_at,
  };
}
