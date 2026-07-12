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

// ---------------------------------------------------------------------------
// All level boundaries
// ---------------------------------------------------------------------------

describe('resolveLevel — all 10 boundaries', () => {
  const boundaries: { xp: number; expectedLevel: number; expectedName: string }[] = [
    { xp: 0, expectedLevel: 1, expectedName: 'Newcomer' },
    { xp: 99, expectedLevel: 1, expectedName: 'Newcomer' },
    { xp: 100, expectedLevel: 2, expectedName: 'Learner' },
    { xp: 249, expectedLevel: 2, expectedName: 'Learner' },
    { xp: 250, expectedLevel: 3, expectedName: 'Practitioner' },
    { xp: 499, expectedLevel: 3, expectedName: 'Practitioner' },
    { xp: 500, expectedLevel: 4, expectedName: 'Communicator' },
    { xp: 999, expectedLevel: 4, expectedName: 'Communicator' },
    { xp: 1000, expectedLevel: 5, expectedName: 'Wordsmith' },
    { xp: 1999, expectedLevel: 5, expectedName: 'Wordsmith' },
    { xp: 2000, expectedLevel: 6, expectedName: 'Professional' },
    { xp: 3499, expectedLevel: 6, expectedName: 'Professional' },
    { xp: 3500, expectedLevel: 7, expectedName: 'Specialist' },
    { xp: 4999, expectedLevel: 7, expectedName: 'Specialist' },
    { xp: 5000, expectedLevel: 8, expectedName: 'Expert' },
    { xp: 7499, expectedLevel: 8, expectedName: 'Expert' },
    { xp: 7500, expectedLevel: 9, expectedName: 'Master' },
    { xp: 9999, expectedLevel: 9, expectedName: 'Master' },
    { xp: 10000, expectedLevel: 10, expectedName: 'Virtuoso' },
  ];

  for (const { xp, expectedLevel, expectedName } of boundaries) {
    it(`resolves ${xp} XP to level ${expectedLevel} (${expectedName})`, () => {
      const result = resolveLevel(xp);
      expect(result.levelNumber).toBe(expectedLevel);
      expect(result.name).toBe(expectedName);
    });
  }
});

// ---------------------------------------------------------------------------
// XP progress between levels
// ---------------------------------------------------------------------------

describe('resolveLevel — XP progress', () => {
  it('identifies XP needed for next level from Newcomer', () => {
    const current = resolveLevel(50);
    const next = LEVELS[current.levelNumber]; // next level is at index 1
    expect(next.minXp - 50).toBe(50); // need 50 more to reach Learner
  });

  it('identifies XP needed for next level from Practitioner', () => {
    const current = resolveLevel(300);
    const next = LEVELS[current.levelNumber]; // next level is Communicator (500)
    expect(next.minXp - 300).toBe(200);
  });

  it('returns isMaxLevel for Virtuoso (level 10)', () => {
    const current = resolveLevel(15000);
    expect(current.levelNumber).toBe(10);
    const hasNext = current.levelNumber < LEVELS.length;
    expect(hasNext).toBe(false);
  });

  it('resolveLevelNumber returns correct level numbers', () => {
    expect(resolveLevelNumber(0)).toBe(1);
    expect(resolveLevelNumber(250)).toBe(3);
    expect(resolveLevelNumber(5000)).toBe(8);
    expect(resolveLevelNumber(9999)).toBe(9);
    expect(resolveLevelNumber(10000)).toBe(10);
    expect(resolveLevelNumber(99999)).toBe(10);
  });

  it('level thresholds increase monotonically', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp);
      expect(LEVELS[i].levelNumber).toBe(LEVELS[i - 1].levelNumber + 1);
    }
  });
});
