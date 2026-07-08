#!/usr/bin/env tsx
/**
 * FluentDraft — Scenario content validation script
 *
 * Validates all scenario seed content against structural, semantic, and
 * text-length rules.  Prints all errors with context and exits non-zero
 * when problems are found.
 *
 * Usage:
 *   npm run validate:content
 *   npx tsx scripts/validate-scenario-seeds.ts
 */
import demoLesson from '../domains/scenarios/seeds/demo-lesson';
import jobHuntCareer from '../domains/scenarios/seeds/job-hunt-career';
import dailyWorkplace from '../domains/scenarios/seeds/daily-workplace';
import dailyLifeAdulting from '../domains/scenarios/seeds/daily-life-adulting';
import type {
  SeedPack,
  SeedScenario,
  SeedChunk,
  SeedKeyPhrase,
  SeedTranslation,
  SeedRecallBlank,
} from '../domains/scenarios/seed-schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Supported language codes (from supabase/migrations/..._seed_languages.sql). */
const SUPPORTED_LANGUAGES = new Set([
  'ar', 'de', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'pt', 'tr', 'ur', 'zh',
]);

const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const VALID_SOURCE_TYPES = new Set(['model_response', 'chunk', 'key_phrase']);

/** Practical text-length limits (inclusive). */
const L = {
  title:            { min: 3,   max: 100 },
  packDescription:  { min: 10,  max: 300 },
  context:          { min: 20,  max: 500 },
  goal:             { min: 10,  max: 200 },
  modelResponse:    { min: 50,  max: 2000 },
  chunkText:        { min: 10,  max: 500 },
  keyPhraseText:    { min: 3,   max: 100 },
  keyPhraseMeaning: { min: 5,   max: 200 },
  keyPhraseExample: { min: 5,   max: 300 },
  translationText:  { min: 1,   max: 2000 },
  recallBlankText:  { min: 5,   max: 300 },
  criteriaItem:     { min: 5,   max: 150 },
  tone:             { min: 2,   max: 30 },
};

// ---------------------------------------------------------------------------
// Error collector
// ---------------------------------------------------------------------------

const errors: string[] = [];

function error(ctx: string, msg: string): void {
  errors.push(`[${ctx}] ${msg}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function checkLength(
  ctx: string,
  label: string,
  value: string,
  limits: { min: number; max: number },
): void {
  const len = value.length;
  if (len < limits.min) {
    error(ctx, `${label} is too short (${len} chars, min ${limits.min})`);
  }
  if (len > limits.max) {
    error(ctx, `${label} is too long (${len} chars, max ${limits.max})`);
  }
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function validateChunks(ctx: string, chunks: SeedChunk[], scenario: SeedScenario): void {
  const count = chunks.length;
  if (count < 4 || count > 6) {
    error(ctx, `expected 4–6 chunks, got ${count}`);
  }

  const orders = new Set<number>();
  for (const chunk of chunks) {
    const cctx = `${ctx} chunk order=${chunk.order}`;

    if (typeof chunk.order !== 'number' || chunk.order < 1 || !Number.isInteger(chunk.order)) {
      error(cctx, `invalid order: ${chunk.order}`);
      continue;
    }

    if (orders.has(chunk.order)) {
      error(cctx, `duplicate chunk order`);
    }
    orders.add(chunk.order);

    if (!isNonEmptyString(chunk.text)) {
      error(cctx, `text is required and must be a non-empty string`);
    } else {
      checkLength(cctx, 'text', chunk.text, L.chunkText);
    }

    if (chunk.audioText !== undefined && typeof chunk.audioText !== 'string') {
      error(cctx, `audioText must be a string when provided`);
    }
  }

  // Verify each chunk's text appears in the model response (whitespace-normalised)
  const normalisedModel = scenario.modelResponse.replace(/\s+/g, ' ').trim();
  for (const chunk of chunks) {
    const normalisedChunk = chunk.text.replace(/\s+/g, ' ').trim();
    if (normalisedChunk.length > 0 && !normalisedModel.includes(normalisedChunk)) {
      error(
        `${ctx} chunk order=${chunk.order}`,
        `chunk text not found in modelResponse — check exact wording`,
      );
    }
  }
}

function validateKeyPhrases(ctx: string, phrases: SeedKeyPhrase[], scenario: SeedScenario): void {
  const count = phrases.length;
  if (count < 4 || count > 6) {
    error(ctx, `expected 4–6 key phrases, got ${count}`);
  }

  const orders = new Set<number>();
  for (const phrase of phrases) {
    const pctx = `${ctx} keyPhrase order=${phrase.order}`;

    if (typeof phrase.order !== 'number' || phrase.order < 1 || !Number.isInteger(phrase.order)) {
      error(pctx, `invalid order: ${phrase.order}`);
      continue;
    }

    if (orders.has(phrase.order)) {
      error(pctx, `duplicate key phrase order`);
    }
    orders.add(phrase.order);

    if (!isNonEmptyString(phrase.text)) {
      error(pctx, `text is required and must be a non-empty string`);
      continue;
    }
    checkLength(pctx, 'text', phrase.text, L.keyPhraseText);

    // Exact-match check: phrase text must appear verbatim in modelResponse
    if (!scenario.modelResponse.includes(phrase.text)) {
      error(
        pctx,
        `text "${phrase.text}" does not appear exactly in modelResponse`,
      );
    }

    if (!isNonEmptyString(phrase.meaning)) {
      error(pctx, `meaning is required`);
    } else {
      checkLength(pctx, 'meaning', phrase.meaning, L.keyPhraseMeaning);
    }

    if (!isNonEmptyString(phrase.example)) {
      error(pctx, `example is required`);
    } else {
      checkLength(pctx, 'example', phrase.example, L.keyPhraseExample);
    }

    if (phrase.commonMistake !== undefined && typeof phrase.commonMistake !== 'string') {
      error(pctx, `commonMistake must be a string when provided`);
    }
  }
}

function validateTranslations(
  ctx: string,
  translations: SeedTranslation[],
  scenario: SeedScenario,
): void {
  const chunkOrders = new Set(scenario.chunks.map((c) => c.order));
  const phraseOrders = new Set(scenario.keyPhrases.map((p) => p.order));

  for (const t of translations) {
    const tctx = `${ctx} translation lang=${t.languageCode} type=${t.sourceType} key=${t.sourceKey}`;

    if (!SUPPORTED_LANGUAGES.has(t.languageCode)) {
      error(tctx, `unsupported language code: ${t.languageCode}`);
    }

    if (!VALID_SOURCE_TYPES.has(t.sourceType)) {
      error(tctx, `invalid sourceType: ${t.sourceType}`);
      continue;
    }

    // Validate sourceKey
    if (t.sourceType === 'model_response') {
      if (t.sourceKey !== 'model') {
        error(tctx, `sourceKey must be "model" for model_response translations, got "${t.sourceKey}"`);
      }
    } else if (t.sourceType === 'chunk') {
      const match = t.sourceKey.match(/^chunk-(\d+)$/);
      if (!match) {
        error(tctx, `sourceKey must be "chunk-{order}" for chunk translations, got "${t.sourceKey}"`);
      } else {
        const order = parseInt(match[1], 10);
        if (!chunkOrders.has(order)) {
          error(tctx, `sourceKey "${t.sourceKey}" references unknown chunk order ${order}`);
        }
      }
    } else if (t.sourceType === 'key_phrase') {
      const match = t.sourceKey.match(/^phrase-(\d+)$/);
      if (!match) {
        error(tctx, `sourceKey must be "phrase-{order}" for key_phrase translations, got "${t.sourceKey}"`);
      } else {
        const order = parseInt(match[1], 10);
        if (!phraseOrders.has(order)) {
          error(tctx, `sourceKey "${t.sourceKey}" references unknown key phrase order ${order}`);
        }
      }
    }

    if (!isNonEmptyString(t.text)) {
      error(tctx, `text is required and must be a non-empty string`);
    } else {
      checkLength(tctx, 'text', t.text, L.translationText);
    }
  }
}

function validateRecallBlanks(
  ctx: string,
  blanks: SeedRecallBlank[],
  scenario: SeedScenario,
): void {
  const count = blanks.length;
  if (count < 3 || count > 5) {
    error(ctx, `expected 3–5 recall blanks, got ${count}`);
  }

  const phraseOrders = new Set(scenario.keyPhrases.map((p) => p.order));

  for (const blank of blanks) {
    const bctx = `${ctx} recallBlank phraseOrder=${blank.phraseOrder}`;

    if (!phraseOrders.has(blank.phraseOrder)) {
      error(
        bctx,
        `phraseOrder ${blank.phraseOrder} does not match any key phrase in this scenario (valid: ${[...phraseOrders].join(', ')})`,
      );
    }

    if (!isNonEmptyString(blank.blankedText)) {
      error(bctx, `blankedText is required and must be a non-empty string`);
      continue;
    }
    checkLength(bctx, 'blankedText', blank.blankedText, L.recallBlankText);

    if (!blank.blankedText.includes('___')) {
      error(bctx, `blankedText must contain "___" (triple underscore placeholder)`);
    }
  }
}

function validateScenario(ctx: string, s: SeedScenario): void {
  if (!isNonEmptyString(s.slug)) {
    error(ctx, 'slug is required');
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.slug)) {
    error(ctx, `slug "${s.slug}" must be lowercase kebab-case`);
  }

  if (!isNonEmptyString(s.title)) {
    error(ctx, 'title is required');
  } else {
    checkLength(ctx, 'title', s.title, L.title);
  }

  if (!isNonEmptyString(s.context)) {
    error(ctx, 'context is required');
  } else {
    checkLength(ctx, 'context', s.context, L.context);
  }

  if (!isNonEmptyString(s.goal)) {
    error(ctx, 'goal is required');
  } else {
    checkLength(ctx, 'goal', s.goal, L.goal);
  }

  if (!isNonEmptyString(s.tone)) {
    error(ctx, 'tone is required');
  } else {
    checkLength(ctx, 'tone', s.tone, L.tone);
  }

  if (!VALID_DIFFICULTIES.has(s.difficulty)) {
    error(ctx, `invalid difficulty "${s.difficulty}" — must be: ${[...VALID_DIFFICULTIES].join(', ')}`);
  }

  if (!Array.isArray(s.criteria) || s.criteria.length === 0) {
    error(ctx, 'criteria must be a non-empty array');
  } else {
    s.criteria.forEach((c, i) => {
      if (!isNonEmptyString(c)) {
        error(ctx, `criteria[${i}] is required and must be a non-empty string`);
      } else {
        checkLength(ctx, `criteria[${i}]`, c, L.criteriaItem);
      }
    });
  }

  if (!isNonEmptyString(s.modelResponse)) {
    error(ctx, 'modelResponse is required');
  } else {
    checkLength(ctx, 'modelResponse', s.modelResponse, L.modelResponse);
  }

  // Sub-collections
  if (!Array.isArray(s.chunks)) {
    error(ctx, 'chunks must be an array');
  } else {
    validateChunks(ctx, s.chunks, s);
  }

  if (!Array.isArray(s.keyPhrases)) {
    error(ctx, 'keyPhrases must be an array');
  } else {
    validateKeyPhrases(ctx, s.keyPhrases, s);
  }

  if (!Array.isArray(s.translations)) {
    error(ctx, 'translations must be an array');
  } else {
    validateTranslations(ctx, s.translations, s);
  }

  if (!Array.isArray(s.recallBlanks)) {
    error(ctx, 'recallBlanks must be an array');
  } else {
    validateRecallBlanks(ctx, s.recallBlanks, s);
  }
}

function validatePack(pack: SeedPack): void {
  const pctx = `pack ${pack.slug}`;

  if (!isNonEmptyString(pack.slug)) {
    error('pack', 'slug is required');
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pack.slug)) {
    error(pctx, `slug "${pack.slug}" must be lowercase kebab-case`);
  }

  if (!isNonEmptyString(pack.title)) {
    error(pctx, 'title is required');
  } else {
    checkLength(pctx, 'title', pack.title, L.title);
  }

  if (!isNonEmptyString(pack.description)) {
    error(pctx, 'description is required');
  } else {
    checkLength(pctx, 'description', pack.description, L.packDescription);
  }

  if (!Array.isArray(pack.scenarios) || pack.scenarios.length === 0) {
    error(pctx, 'scenarios must be a non-empty array');
    return;
  }

  const scenarioSlugs = new Set<string>();
  for (const s of pack.scenarios) {
    const sctx = `${pctx} / scenario ${s.slug}`;

    if (scenarioSlugs.has(s.slug)) {
      error(sctx, `duplicate scenario slug within pack`);
    }
    scenarioSlugs.add(s.slug);

    validateScenario(sctx, s);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function extractPacks(seed: unknown, name: string): SeedPack[] {
  if (
    seed &&
    typeof seed === 'object' &&
    'packs' in seed &&
    Array.isArray((seed as Record<string, unknown>).packs)
  ) {
    return (seed as { packs: SeedPack[] }).packs;
  }

  if (
    seed &&
    typeof seed === 'object' &&
    'slug' in seed &&
    'scenarios' in seed
  ) {
    return [seed as SeedPack];
  }

  error(name, 'seed must be a SeedPack or SeedContent (with packs array)');
  return [];
}

function main(): void {
  const seedEntries: [string, unknown][] = [
    ['demoLesson', demoLesson],
    ['jobHuntCareer', jobHuntCareer],
    ['dailyWorkplace', dailyWorkplace],
    ['dailyLifeAdulting', dailyLifeAdulting],
  ];

  const allPacks: SeedPack[] = [];
  for (const [name, seed] of seedEntries) {
    allPacks.push(...extractPacks(seed, name));
  }

  // Check unique pack slugs
  const packSlugs = new Set<string>();
  for (const pack of allPacks) {
    if (packSlugs.has(pack.slug)) {
      error(`pack ${pack.slug}`, 'duplicate pack slug across all seeds');
    }
    packSlugs.add(pack.slug);
  }

  // Check unique scenario slugs across all packs
  const allScenarioSlugs = new Set<string>();
  for (const pack of allPacks) {
    for (const s of pack.scenarios) {
      if (allScenarioSlugs.has(s.slug)) {
        error(
          `pack ${pack.slug} / scenario ${s.slug}`,
          'duplicate scenario slug across all packs',
        );
      }
      allScenarioSlugs.add(s.slug);
    }
  }

  // Validate each pack
  for (const pack of allPacks) {
    validatePack(pack);
  }

  // Report
  if (errors.length > 0) {
    console.error(`\n${errors.length} validation error(s) found:\n`);
    for (const err of errors) {
      console.error(`  ✗ ${err}`);
    }
    console.error('');
    process.exit(1);
  }

  const totalScenarios = allPacks.reduce((s, p) => s + p.scenarios.length, 0);
  console.log(
    `\n✓ All content valid — ${allPacks.length} pack(s), ${totalScenarios} scenario(s)\n`,
  );
}

main();
