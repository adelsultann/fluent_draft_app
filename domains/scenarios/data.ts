/**
 * FluentDraft — Scenario data access
 *
 * Provides server-side access to seeded scenario content.
 * Currently reads from in-memory TypeScript seed files.
 * Will be migrated to Supabase queries when the DB layer is ready
 * (after applying migrations and generating the Database type).
 *
 * Related docs:
 *   - docs/api-contracts.md § Get Practice Lesson
 *   - docs/database-schema.md § Lesson Content
 */

import type { SeedScenario, SeedPack } from './seed-schema';
import {
  jobHuntCareer,
  dailyWorkplace,
  dailyLifeAdulting,
} from './seeds';

// ---------------------------------------------------------------------------
// All non-demo packs (demo lesson is handled separately)
// ---------------------------------------------------------------------------

const ALL_PACKS: SeedPack[] = [jobHuntCareer, dailyWorkplace, dailyLifeAdulting];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Find a scenario by its URL slug across all active, non-demo packs.
 *
 * Returns `null` if no scenario matches.
 * Does NOT return demo scenarios — those are handled by the demo domain.
 */
export function getScenarioBySlug(slug: string): SeedScenario | null {
  for (const pack of ALL_PACKS) {
    for (const scenario of pack.scenarios) {
      if (scenario.slug === slug && scenario.isActive !== false) {
        return scenario;
      }
    }
  }
  return null;
}

/**
 * Return all available scenario packs with their scenarios included.
 * Each scenario includes its parent pack slug for navigation breadcrumbs.
 */
export interface ScenarioWithPack extends SeedScenario {
  packSlug: string;
  packTitle: string;
}

/**
 * Find a scenario by slug and include its parent pack information.
 */
export function getScenarioWithPack(slug: string): ScenarioWithPack | null {
  for (const pack of ALL_PACKS) {
    for (const scenario of pack.scenarios) {
      if (scenario.slug === slug && scenario.isActive !== false) {
        return {
          ...scenario,
          packSlug: pack.slug,
          packTitle: pack.title,
        };
      }
    }
  }
  return null;
}

/**
 * Return all active scenarios across all non-demo packs.
 * Useful for listing available lessons.
 */
export function getAllActiveScenarios(): ScenarioWithPack[] {
  const result: ScenarioWithPack[] = [];
  for (const pack of ALL_PACKS) {
    for (const scenario of pack.scenarios) {
      if (scenario.isActive !== false) {
        result.push({
          ...scenario,
          packSlug: pack.slug,
          packTitle: pack.title,
        });
      }
    }
  }
  return result;
}
