/**
 * Unit tests — Scenario data access layer
 *
 * Covers: scenario lookup by slug, pack metadata enrichment,
 * active scenario filtering, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  getScenarioBySlug,
  getScenarioWithPack,
  getAllActiveScenarios,
} from '@/domains/scenarios/data';

// ---------------------------------------------------------------------------
// getScenarioBySlug
// ---------------------------------------------------------------------------

describe('getScenarioBySlug', () => {
  it('returns a scenario for a known slug', () => {
    const scenario = getScenarioBySlug('cover-letter-opening');
    expect(scenario).not.toBeNull();
    expect(scenario!.title).toBe('Writing a Cover Letter Opening');
    expect(scenario!.difficulty).toBe('beginner');
    expect(scenario!.chunks.length).toBeGreaterThan(0);
    expect(scenario!.keyPhrases.length).toBeGreaterThan(0);
  });

  it('returns a scenario for a different known slug', () => {
    const scenario = getScenarioBySlug('accepting-a-job-offer');
    expect(scenario).not.toBeNull();
    expect(scenario!.title).toBe('Accepting a Job Offer');
  });

  it('returns null for an unknown slug', () => {
    const scenario = getScenarioBySlug('non-existent-lesson');
    expect(scenario).toBeNull();
  });

  it('returns null for an empty slug', () => {
    const scenario = getScenarioBySlug('');
    expect(scenario).toBeNull();
  });

  it('returns scenario from the correct pack (daily-workplace)', () => {
    const scenario = getScenarioBySlug('requesting-time-off');
    expect(scenario).not.toBeNull();
    expect(scenario!.title).toBe('Requesting Time Off');
    expect(scenario!.tone).toBe('polite');
  });

  it('returns scenario from daily-life-adulting pack', () => {
    const scenario = getScenarioBySlug('restaurant-reservation');
    expect(scenario).not.toBeNull();
    expect(scenario!.title).toBe('Making a Restaurant Reservation');
  });
});

// ---------------------------------------------------------------------------
// getScenarioWithPack
// ---------------------------------------------------------------------------

describe('getScenarioWithPack', () => {
  it('returns scenario with pack metadata', () => {
    const result = getScenarioWithPack('cover-letter-opening');
    expect(result).not.toBeNull();
    expect(result!.packSlug).toBe('job-hunt-career');
    expect(result!.packTitle).toBe('Job Hunt & Career');
    expect(result!.title).toBe('Writing a Cover Letter Opening');
  });

  it('returns the correct pack for daily-workplace scenarios', () => {
    const result = getScenarioWithPack('following-up-on-task');
    expect(result).not.toBeNull();
    expect(result!.packSlug).toBe('daily-workplace');
    expect(result!.packTitle).toBe('Daily Workplace');
  });

  it('returns null for an unknown slug', () => {
    const result = getScenarioWithPack('does-not-exist');
    expect(result).toBeNull();
  });

  it('scenario has all required fields for the practice shell', () => {
    const result = getScenarioWithPack('accepting-a-job-offer');
    expect(result).not.toBeNull();
    expect(result!.slug).toBeTruthy();
    expect(result!.title).toBeTruthy();
    expect(result!.context).toBeTruthy();
    expect(result!.goal).toBeTruthy();
    expect(result!.tone).toBeTruthy();
    expect(result!.criteria.length).toBeGreaterThan(0);
    expect(result!.difficulty).toBeTruthy();
    expect(result!.modelResponse).toBeTruthy();
    expect(result!.chunks.length).toBeGreaterThan(0);
    expect(result!.keyPhrases.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getAllActiveScenarios
// ---------------------------------------------------------------------------

describe('getAllActiveScenarios', () => {
  it('returns all active scenarios across all packs', () => {
    const scenarios = getAllActiveScenarios();
    // We have 3 packs × 2 scenarios = 6 total (plus demo which is excluded)
    expect(scenarios.length).toBeGreaterThanOrEqual(6);
  });

  it('each scenario has pack metadata', () => {
    const scenarios = getAllActiveScenarios();
    for (const s of scenarios) {
      expect(s.packSlug).toBeTruthy();
      expect(s.packTitle).toBeTruthy();
      expect(s.slug).toBeTruthy();
    }
  });

  it('no two scenarios have the same slug', () => {
    const scenarios = getAllActiveScenarios();
    const slugs = scenarios.map((s) => s.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('all scenarios span the expected packs', () => {
    const scenarios = getAllActiveScenarios();
    const packSlugs = new Set(scenarios.map((s) => s.packSlug));
    expect(packSlugs.has('job-hunt-career')).toBe(true);
    expect(packSlugs.has('daily-workplace')).toBe(true);
    expect(packSlugs.has('daily-life-adulting')).toBe(true);
    // Demo pack is excluded from this function
    expect(packSlugs.has('demo-pack')).toBe(false);
  });
});
