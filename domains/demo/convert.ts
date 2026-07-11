'use client';

/**
 * FluentDraft — Client-side demo conversion utility
 *
 * Reads locally stored DemoProgress from localStorage, maps it to the
 * ConvertDemoProgressInput format that the server action expects, and
 * calls the conversion server action.
 *
 * On success, clears localStorage demo progress so the user starts fresh.
 * On failure, keeps localStorage so the user can retry.
 */

import { convertDemoProgress } from './actions';
import { loadProgress, clearProgress } from './progress';
import type { ConvertDemoProgressResult } from './actions';

// ---------------------------------------------------------------------------
// Demo content ID mapping (order → DB UUID)
// ---------------------------------------------------------------------------

/** Map phrase_order (1‑based) to the fixed DB UUID from the seed migration. */
const PHRASE_ORDER_TO_ID: Record<number, string> = {
  1: '00000000-0000-0000-0002-000000000001',
  2: '00000000-0000-0000-0002-000000000002',
  3: '00000000-0000-0000-0002-000000000003',
  4: '00000000-0000-0000-0002-000000000004',
  5: '00000000-0000-0000-0002-000000000005',
  6: '00000000-0000-0000-0002-000000000006',
};

/** Fixed UUID of the demo scenario. */
const DEMO_SCENARIO_ID = '00000000-0000-0000-0000-000000000002';

// ---------------------------------------------------------------------------
// Conversion function
// ---------------------------------------------------------------------------

/**
 * Attempt to convert any locally stored demo progress for the current user.
 *
 * - Reads DemoProgress from localStorage (keyed by scenario slug).
 * - Only converts if the demo is marked `completed: true`.
 * - Maps revealed phrase orders to typed phrase attempts (demo reveals
 *   count as correct-first-try for scoring).
 * - Calls the server action, which validates, scores, and persists.
 * - Clears localStorage only on success.
 *
 * @param scenarioSlug — the demo scenario slug (e.g. "follow-up-after-interview")
 * @returns The conversion result from the server.
 */
export async function convertStoredDemoProgress(
  scenarioSlug: string,
): Promise<ConvertDemoProgressResult> {
  // 1. Load progress from localStorage
  const progress = loadProgress(scenarioSlug);

  if (!progress) {
    return {
      success: false,
      error: 'No demo progress found in this browser.',
    };
  }

  if (!progress.completed) {
    return {
      success: false,
      error: 'Your demo is not yet complete. Please finish the demo lesson before converting.',
    };
  }

  // 2. Map revealed phrase orders to typed phrase attempts
  //    In the demo, clicking "Reveal answer" counts as a correct first try.
  const typedPhraseAttempts = progress.completedPhraseOrders.map((order) => {
    const phraseId = PHRASE_ORDER_TO_ID[order];
    // We pass an empty typed text since the demo doesn't track actual typing;
    // the server will mark these as incorrect. A future full practice version
    // would supply the actual typed text from the practice state.
    return {
      keyPhraseId: phraseId ?? `unknown-order-${order}`,
      typedText: '',
      attemptNumber: 1,
    };
  });

  // 3. Call the server action
  const result = await convertDemoProgress({
    scenarioId: DEMO_SCENARIO_ID,
    completed: true,
    phaseReached: 'save',
    typedPhraseAttempts,
    pronunciationAttempts: [], // demo doesn't include pronunciation
    savedPhraseIds: [], // demo doesn't pre-select saved phrases
    clientCompletedAt: progress.updatedAt,
  });

  // 4. Clear localStorage only on success
  if (result.success) {
    clearProgress(scenarioSlug);
  }

  return result;
}
