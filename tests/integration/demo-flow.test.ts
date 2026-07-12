/**
 * Integration tests — Demo lesson flow
 *
 * Tests the full demo pipeline: loading the demo lesson from seed data,
 * validating a conversion payload, and calculating a trusted score.
 * All pure logic — no Supabase required.
 *
 * Related docs:
 *   - docs/testing-strategy.md § Integration Tests
 *   - docs/api-contracts.md § Demo Lesson, Convert Demo Progress
 */

import { describe, it, expect } from 'vitest';
import { getDemoLesson } from '@/domains/demo/get-demo-lesson';
import { validateConversionPayload } from '@/domains/demo/validation';
import type { ConvertDemoProgressInput } from '@/domains/demo/validation';
import { calculateScore, isExactMatch } from '@/domains/scoring/engine';
import type { TypedPhraseResult } from '@/domains/scoring/types';

// ---------------------------------------------------------------------------
// Demo lesson loading
// ---------------------------------------------------------------------------

describe('Demo lesson loading', () => {
  it('loads the fixed demo lesson from seed data', () => {
    const lesson = getDemoLesson();
    expect(lesson).not.toBeNull();
    expect(lesson!.isDemo).toBe(true);
    expect(lesson!.title).toBeTruthy();
    expect(lesson!.keyPhrases.length).toBeGreaterThan(0);
    expect(lesson!.chunks.length).toBeGreaterThan(0);
    expect(lesson!.translations.length).toBeGreaterThan(0);
  });

  it('demo lesson has the expected 6 key phrases', () => {
    const lesson = getDemoLesson();
    expect(lesson!.keyPhrases).toHaveLength(6);
  });

  it('demo lesson key phrases have expected fields', () => {
    const lesson = getDemoLesson();
    for (const phrase of lesson!.keyPhrases) {
      expect(phrase.text).toBeTruthy();
      expect(phrase.meaning).toBeTruthy();
      expect(phrase.example).toBeTruthy();
      expect(phrase.order).toBeGreaterThan(0);
    }
  });

  it('demo lesson has 4 required phases worth of content', () => {
    const lesson = getDemoLesson();
    expect(lesson!.context).toBeTruthy();
    expect(lesson!.goal).toBeTruthy();
    expect(lesson!.tone).toBeTruthy();
    expect(lesson!.modelResponse).toBeTruthy();
    expect(lesson!.criteria.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Demo conversion — validation + scoring pipeline
// ---------------------------------------------------------------------------

describe('Demo conversion pipeline', () => {
  const DEMO_PHRASE_ID = '00000000-0000-0000-0002-000000000001';

  /** Build a valid demo payload with all 6 phrases. */
  function validPayload(overrides: Partial<ConvertDemoProgressInput> = {}): ConvertDemoProgressInput {
    const phraseIds = [
      '00000000-0000-0000-0002-000000000001',
      '00000000-0000-0000-0002-000000000002',
      '00000000-0000-0000-0002-000000000003',
      '00000000-0000-0000-0002-000000000004',
      '00000000-0000-0000-0002-000000000005',
      '00000000-0000-0000-0002-000000000006',
    ];

    return {
      scenarioId: '00000000-0000-0000-0000-000000000002',
      completed: true,
      phaseReached: 'save',
      typedPhraseAttempts: phraseIds.map((id) => ({
        keyPhraseId: id,
        typedText: 'correct',
        attemptNumber: 1,
      })),
      pronunciationAttempts: [],
      savedPhraseIds: [],
      clientCompletedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  // -- Validation

  it('accepts a valid completed demo payload', () => {
    const payload = validPayload();
    const error = validateConversionPayload(payload);
    expect(error).toBeNull();
  });

  it('rejects a payload with wrong scenario ID', () => {
    const payload = validPayload({ scenarioId: 'wrong-id' });
    const error = validateConversionPayload(payload);
    expect(error).not.toBeNull();
    expect(error!.fieldErrors.scenarioId).toBeTruthy();
  });

  it('rejects an incomplete demo', () => {
    const payload = validPayload({ completed: false });
    const error = validateConversionPayload(payload);
    expect(error).not.toBeNull();
    expect(error!.fieldErrors.completed).toBeTruthy();
  });

  it('rejects a payload with an unknown phrase ID', () => {
    const payload = validPayload({
      typedPhraseAttempts: [
        { keyPhraseId: '00000000-0000-0000-0000-000000000999', typedText: 'x', attemptNumber: 1 },
      ],
    });
    const error = validateConversionPayload(payload);
    expect(error).not.toBeNull();
  });

  it('rejects a payload with attempt number less than 1', () => {
    const payload = validPayload({
      typedPhraseAttempts: [
        { keyPhraseId: DEMO_PHRASE_ID, typedText: 'x', attemptNumber: 0 },
      ],
    });
    const error = validateConversionPayload(payload);
    expect(error).not.toBeNull();
  });

  it('rejects duplicate saved phrase IDs', () => {
    const payload = validPayload({
      savedPhraseIds: [DEMO_PHRASE_ID, DEMO_PHRASE_ID],
    });
    const error = validateConversionPayload(payload);
    expect(error).not.toBeNull();
    expect(error!.fieldErrors['savedPhraseIds[1]']).toContain('Duplicate');
  });

  // -- Validation → Scoring pipeline

  it('calculates trusted score from a valid payload with seeded phrase texts', () => {
    const lesson = getDemoLesson()!;
    const phraseTexts = new Map(lesson.keyPhrases.map((p) => [p.order, p.text]));

    // Simulate: server matches typed answers against seeded texts
    const phraseIds = [
      '00000000-0000-0000-0002-000000000001',
      '00000000-0000-0000-0002-000000000002',
      '00000000-0000-0000-0002-000000000003',
      '00000000-0000-0000-0002-000000000004',
      '00000000-0000-0000-0002-000000000005',
      '00000000-0000-0000-0002-000000000006',
    ];

    // Build phrase results using real seeded texts (order 1→6 maps to phraseIds 0→5)
    const phraseResults: TypedPhraseResult[] = phraseIds.map((id, i) => {
      const order = i + 1;
      const expectedText = phraseTexts.get(order) ?? '';
      return {
        keyPhraseId: id,
        expectedText,
        typedText: expectedText, // perfect match
        attemptNumber: 1,
        correct: isExactMatch(expectedText, expectedText),
      };
    });

    const score = calculateScore({
      difficulty: 'beginner',
      completed: true,
      phraseResults,
      savedPhraseCount: 3,
      firstActivityToday: true,
      isRepeat: false,
    });

    // Should be a positive non-zero score
    expect(score.totalScore).toBeGreaterThan(0);
    // All 6 phrases correct on first try = perfect recall
    expect(score.recallPoints).toBe(20);
    expect(score.accuracyPoints).toBe(60); // 6 × 10
    expect(score.completionPoints).toBe(15);
    expect(score.savePhrasePoints).toBe(15); // 3 × 5
    expect(score.streakBonus).toBe(5);
    // 60 + 20 + 15 + 15 + 5 = 115 beginner ×1.0 = 115
    expect(score.totalScore).toBe(115);
  });

  it('trusted score properly reduces for incorrect answers in demo conversion', () => {
    const lesson = getDemoLesson()!;

    const phraseResults: TypedPhraseResult[] = lesson.keyPhrases.map((p, i) => ({
      keyPhraseId: `00000000-0000-0000-0002-00000000000${i + 1}`,
      expectedText: p.text,
      // First 3 correct on first try, last 3 wrong
      typedText: i < 3 ? p.text : 'wrong answer',
      attemptNumber: 1,
      correct: i < 3,
    }));

    const score = calculateScore({
      difficulty: 'beginner',
      completed: true,
      phraseResults,
      savedPhraseCount: 0,
      firstActivityToday: false,
      isRepeat: false,
    });

    // 3 correct × 10 = 30, 0 recall (not all first-try), 15 completion = 45
    expect(score.accuracyPoints).toBe(30);
    expect(score.recallPoints).toBe(0); // no perfect recall
    expect(score.totalBeforeMultiplier).toBe(45);
  });
});
