/**
 * FluentDraft — DB ID mappings
 *
 * Maps seed scenario slugs and phrase orders to their deterministic
 * database UUIDs (as inserted by seed migrations).
 *
 * Used by the server-side persistence action to reference the correct
 * foreign keys without an extra DB round-trip.
 */

// ---------------------------------------------------------------------------
// Scenario UUIDs (by slug)
// ---------------------------------------------------------------------------

/** Maps a scenario slug to its DB UUID. */
export const SCENARIO_DB_IDS: Record<string, string> = {
  'cover-letter-opening':        'b0000000-0001-0000-0000-000000000001',
  'accepting-a-job-offer':       'b0000000-0001-0000-0000-000000000002',
  'requesting-time-off':         'b0000000-0002-0000-0000-000000000001',
  'following-up-on-task':        'b0000000-0002-0000-0000-000000000002',
  'restaurant-reservation':      'b0000000-0003-0000-0000-000000000001',
  'contacting-customer-support': 'b0000000-0003-0000-0000-000000000002',
};

/**
 * Return the DB UUID for a scenario by its slug.
 * Returns `undefined` if the slug is unknown.
 */
export function getScenarioDbId(slug: string): string | undefined {
  return SCENARIO_DB_IDS[slug];
}

// ---------------------------------------------------------------------------
// Phrase UUID helpers
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic UUID for a key phrase.
 *
 * Constructed from the scenario slug and phrase order so it is stable
 * across seeds and server restarts.  Not cryptographic — just deterministic.
 */
export function getPhraseDbId(scenarioSlug: string, phraseOrder: number): string {
  // Use a simple prefix + hash for deterministic UUID generation.
  // The seed migration inserts these UUIDs using the same formula.
  const hash = simpleHash(`${scenarioSlug}:phrase:${phraseOrder}`);
  // Format as UUID v4-ish with the hash filling the last segments
  return `b0000000-0000-${padHex((hash & 0xFFFF))}-${padHex(((hash >> 16) & 0xFFFF))}-${padHex(((hash >>> 0) & 0xFFFFFFFF) % 0x1000000000000)}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Simple DJB2-like hash producing a 32-bit integer. */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Pad a number to 4 hex digits. */
function padHex(n: number): string {
  return n.toString(16).padStart(4, '0').slice(0, 4);
}
