/**
 * FluentDraft — Phrase Bank types
 *
 * Shared types for the phrase-bank domain, mirroring the database schema
 * and API contracts.
 *
 * Related docs:
 *   - docs/database-schema.md § Phrase Bank And Review
 *   - docs/api-contracts.md § Phrase Bank
 */

/** Matches the `phrase_mastery_status` Postgres enum. */
export type MasteryStatus = 'new' | 'learning' | 'mastered';

/** A single phrase bank item with joined key phrase and scenario data. */
export interface PhraseBankItem {
  /** UUID of the phrase_bank_items row. */
  id: string;
  /** The English phrase text from key_phrases. */
  text: string;
  /** The meaning / use case of the phrase. */
  meaning: string;
  /** An example sentence using the phrase. */
  example: string;
  /** The title of the source scenario. */
  scenarioTitle: string;
  /** The slug of the source scenario for linking. */
  scenarioSlug: string;
  /** Current mastery status. */
  mastery: MasteryStatus;
  /** When the phrase was saved. */
  savedAt: string;
}
