import demoLesson from '@/domains/scenarios/seeds/demo-lesson';
import type { SeedScenario } from '@/domains/scenarios/seed-schema';

/**
 * Extracts the single demo scenario (marked `isDemo: true`) from the
 * fixed demo lesson seed.  Returns `null` if no demo scenario is found.
 */
export function getDemoLesson(): SeedScenario | null {
  for (const pack of demoLesson.packs) {
    for (const scenario of pack.scenarios) {
      if (scenario.isDemo) return scenario;
    }
  }
  return null;
}
