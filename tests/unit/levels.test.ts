/**
 * Unit tests — Level resolution
 *
 * Covers: level lookup at XP boundaries, level numbers,
 * and edge cases (negative XP, very high XP).
 */

import { describe, it, expect } from 'vitest';
import { resolveLevel, resolveLevelNumber, LEVELS } from '@/domains/gamification/levels';

describe('resolveLevel', () => {
  it('returns Newcomer (level 1) for 0 XP', () => {
    const result = resolveLevel(0);
    expect(result.levelNumber).toBe(1);
    expect(result.name).toBe('Newcomer');
  });

  it('returns Newcomer for XP just below level 2 threshold', () => {
    const result = resolveLevel(99);
    expect(result.levelNumber).toBe(1);
  });

  it('returns Learner (level 2) for exactly 100 XP', () => {
    const result = resolveLevel(100);
    expect(result.levelNumber).toBe(2);
    expect(result.name).toBe('Learner');
  });

  it('returns Practitioner (level 3) for 250 XP', () => {
    const result = resolveLevel(250);
    expect(result.levelNumber).toBe(3);
  });

  it('returns Communicator (level 4) for 500 XP', () => {
    const result = resolveLevel(500);
    expect(result.levelNumber).toBe(4);
  });

  it('returns Wordsmith (level 5) for 1000 XP', () => {
    const result = resolveLevel(1000);
    expect(result.levelNumber).toBe(5);
  });

  it('returns highest level for XP above all thresholds', () => {
    const result = resolveLevel(20000);
    expect(result.levelNumber).toBe(10);
    expect(result.name).toBe('Virtuoso');
  });

  it('returns highest level matching XP between thresholds', () => {
    const result = resolveLevel(750); // between 500 (level 4) and 1000 (level 5)
    expect(result.levelNumber).toBe(4);
  });

  it('handles negative XP (returns level 1)', () => {
    const result = resolveLevel(-50);
    expect(result.levelNumber).toBe(1);
  });
});

describe('resolveLevelNumber', () => {
  it('returns 1 for 0 XP', () => {
    expect(resolveLevelNumber(0)).toBe(1);
  });

  it('returns 10 for 10000+ XP', () => {
    expect(resolveLevelNumber(10000)).toBe(10);
  });
});

describe('LEVELS constant', () => {
  it('has 10 levels', () => {
    expect(LEVELS).toHaveLength(10);
  });

  it('levels are in ascending order', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp);
    }
  });

  it('first level has minXp 0', () => {
    expect(LEVELS[0].minXp).toBe(0);
  });
});
