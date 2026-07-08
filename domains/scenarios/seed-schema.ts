/**
 * FluentDraft — Scenario seed schema
 *
 * These types define the human-writable seed format for lesson content.
 * Each type maps cleanly to the corresponding database tables:
 *   scenario_packs, scenarios, lesson_chunks, key_phrases, translations.
 *
 * UUIDs are generated at insert time; seeds use human-readable references
 * (order numbers + string keys) that an importer resolves during seeding.
 *
 * Related docs:
 *   - docs/database-schema.md §Lesson Content
 *   - docs/api-contracts.md §Lesson Content Types
 */

// ---------------------------------------------------------------------------
// Shared enums / literal types (mirrors DB enums + API contract types)
// ---------------------------------------------------------------------------

/** Matches the `lesson_difficulty` Postgres enum and API `Difficulty` type. */
export type SeedDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Matches the `translations.source_type` check constraint. */
export type SeedTranslationSourceType = 'model_response' | 'chunk' | 'key_phrase';

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

/**
 * A target-language translation for one piece of lesson content.
 *
 * Since seeds don't know the final UUIDs of their parent rows, translations
 * use a `sourceKey` that the importer resolves to the actual `source_id`.
 *
 * @example
 * // Translate the entire model response to Arabic
 * { languageCode: 'ar', sourceType: 'model_response', sourceKey: 'model', text: '...' }
 *
 * @example
 * // Translate chunk 1 to Spanish
 * { languageCode: 'es', sourceType: 'chunk', sourceKey: 'chunk-1', text: '...' }
 *
 * @example
 * // Translate key phrase 2 to French
 * { languageCode: 'fr', sourceType: 'key_phrase', sourceKey: 'phrase-2', text: '...' }
 */
export interface SeedTranslation {
  /** ISO 639-1 language code — must exist in `supported_languages`. */
  languageCode: string;
  /** What kind of content this translation targets. */
  sourceType: SeedTranslationSourceType;
  /**
   * Human-readable reference key for the source row:
   *   - `'model'`              → the full `model_response` text
   *   - `'chunk-{order}'`      → the chunk at `SeedChunk.order`
   *   - `'phrase-{order}'`     → the key phrase at `SeedKeyPhrase.order`
   */
  sourceKey: string;
  /** Translated text in the target language. */
  text: string;
}

// ---------------------------------------------------------------------------
// Lesson chunks
// ---------------------------------------------------------------------------

/**
 * A single chunk of the model response presented during guided typing.
 * Maps to the `lesson_chunks` table.
 */
export interface SeedChunk {
  /** Display order within the scenario (1‑based, matches `chunk_order`). */
  order: number;
  /** The chunk text the user reads, listens to, and types. */
  text: string;
  /**
   * Optional audio-friendly variant (e.g. without punctuation or filler words).
   * When absent, the TTS engine reads `text` directly.
   */
  audioText?: string;
}

// ---------------------------------------------------------------------------
// Key phrases
// ---------------------------------------------------------------------------

/**
 * A useful phrase extracted from the scenario that the user practises,
 * pronounces, recalls from memory, and saves to the Phrase Bank.
 * Maps to the `key_phrases` table.
 */
export interface SeedKeyPhrase {
  /** Display order within the scenario (1‑based, matches `phrase_order`). */
  order: number;
  /** The phrase text the user must type / pronounce / recall. */
  text: string;
  /** Brief explanation of meaning and when to use the phrase. */
  meaning: string;
  /** A natural example sentence showing the phrase in context. */
  example: string;
  /** A common mistake learners make with this phrase (optional). */
  commonMistake?: string;
  /** Whether pronunciation practice is required for this phrase (default `true`). */
  pronunciationRequired?: boolean;
}

// ---------------------------------------------------------------------------
// Recall blanks
// ---------------------------------------------------------------------------

/**
 * A position in the model response where a key phrase is blanked out
 * and the user must recall it from memory during the Recall phase.
 *
 * The importer uses `phraseOrder` to link each blank to the correct
 * `SeedKeyPhrase`, and `blankedText` as the prompt shown to the user.
 */
export interface SeedRecallBlank {
  /** References `SeedKeyPhrase.order` — which phrase is blanked. */
  phraseOrder: number;
  /**
   * The recall prompt shown to the user.
   * Use `___` (triple underscore) to mark the blank position.
   *
   * @example
   * "I am writing to ___ regarding the position."
   */
  blankedText: string;
}

// ---------------------------------------------------------------------------
// Scenario (individual lesson)
// ---------------------------------------------------------------------------

/**
 * A single practice scenario (lesson).
 * Maps to a row in `scenarios` plus related rows in `lesson_chunks`,
 * `key_phrases`, and `translations`.
 */
export interface SeedScenario {
  /** URL-friendly unique slug (maps to `scenarios.slug`). */
  slug: string;
  /** Display title shown on the pack page and practice screen. */
  title: string;
  /**
   * Situation / context description — what is happening?
   * Maps to `scenarios.context`.
   */
  context: string;
  /** What the user is trying to accomplish (maps to `scenarios.goal`). */
  goal: string;
  /**
   * Tone descriptor shown as a badge on the practice screen.
   * Examples: `'professional'`, `'friendly'`, `'formal'`, `'casual'`.
   */
  tone: string;
  /** Difficulty tier (maps to `scenarios.difficulty`). */
  difficulty: SeedDifficulty;
  /**
   * Checklist of criteria the user should meet.
   * Maps to `scenarios.criteria text[]`.
   */
  criteria: string[];
  /** The full model / exemplar response the user learns from. */
  modelResponse: string;
  /** Whether this scenario is the anonymous demo lesson (default `false`). */
  isDemo?: boolean;
  /** Whether this scenario is active / published (default `true`). */
  isActive?: boolean;
  /** Display order within the pack (default `0`). */
  sortOrder?: number;
  /** Ordered chunks for guided typing practice. */
  chunks: SeedChunk[];
  /** Key phrases extracted from the scenario. */
  keyPhrases: SeedKeyPhrase[];
  /** Target-language translations for chunks, key phrases, and model response. */
  translations: SeedTranslation[];
  /** Recall blanks: prompts where key phrases are blanked in the model response. */
  recallBlanks: SeedRecallBlank[];
}

// ---------------------------------------------------------------------------
// Scenario pack
// ---------------------------------------------------------------------------

/**
 * A pack groups related scenarios under a theme such as
 * "Job Hunt & Career" or "Daily Workplace".
 * Maps to a row in `scenario_packs`.
 */
export interface SeedPack {
  /** URL-friendly unique slug (maps to `scenario_packs.slug`). */
  slug: string;
  /** Display title shown on the packs page. */
  title: string;
  /** Short description of the pack's theme and what the user will practice. */
  description: string;
  /** Display order on the packs page (default `0`). */
  sortOrder?: number;
  /** Whether this pack is premium (always `false` for MVP, default `false`). */
  isPremium?: boolean;
  /** Whether this pack is active / published (default `true`). */
  isActive?: boolean;
  /** Scenarios belonging to this pack. */
  scenarios: SeedScenario[];
}

// ---------------------------------------------------------------------------
// Top-level seed document
// ---------------------------------------------------------------------------

/**
 * The top-level seed file format consumed by the content importer.
 *
 * @example
 * ```ts
 * const seed: SeedContent = {
 *   packs: [
 *     {
 *       slug: 'job-hunt-career',
 *       title: 'Job Hunt & Career',
 *       description: '...',
 *       scenarios: [ ... ],
 *     },
 *   ],
 * };
 * ```
 */
export interface SeedContent {
  /** Scenario packs with their lessons. */
  packs: SeedPack[];
}
