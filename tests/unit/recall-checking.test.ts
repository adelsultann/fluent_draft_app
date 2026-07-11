/**
 * Unit tests — Recall phase checking logic
 *
 * Covers: recall prompt construction (with and without seeded blanks),
 * exact matching for recall, and state transition simulation.
 */

import { describe, it, expect } from 'vitest';
import { isExactMatch } from '@/domains/scoring/engine';

// ---------------------------------------------------------------------------
// Recall prompt construction (pure function tests)
// ---------------------------------------------------------------------------

interface PhraseData {
  order: number;
  text: string;
  meaning: string;
}

interface BlankData {
  phraseOrder: number;
  blankedText: string;
}

interface RecallPrompt {
  phraseOrder: number;
  promptText: string;
  expectedText: string;
}

function buildRecallPrompts(
  phrases: PhraseData[],
  blanks: BlankData[] | undefined,
): RecallPrompt[] {
  const phraseByOrder = new Map<number, PhraseData>();
  for (const p of phrases) {
    phraseByOrder.set(p.order, p);
  }

  const prompts: RecallPrompt[] = [];

  if (blanks && blanks.length > 0) {
    const sorted = [...blanks].sort((a, b) => a.phraseOrder - b.phraseOrder);
    for (const blank of sorted) {
      const phrase = phraseByOrder.get(blank.phraseOrder);
      if (phrase) {
        prompts.push({
          phraseOrder: blank.phraseOrder,
          promptText: blank.blankedText,
          expectedText: phrase.text,
        });
      }
    }
  }

  // Fallback: no blanks → use all phrases directly
  if (prompts.length === 0) {
    const sorted = [...phrases].sort((a, b) => a.order - b.order);
    for (const p of sorted) {
      prompts.push({
        phraseOrder: p.order,
        promptText: `Type the phrase: "${p.text}"`,
        expectedText: p.text,
      });
    }
  }

  return prompts;
}

const samplePhrases: PhraseData[] = [
  { order: 1, text: 'I am writing to express my interest in', meaning: 'Formal opening' },
  { order: 2, text: 'as advertised on', meaning: 'Where you saw the job' },
  { order: 3, text: 'With over four years of experience in', meaning: 'Experience statement' },
  { order: 4, text: 'a strong portfolio of client work', meaning: 'Portfolio mention' },
  { order: 5, text: 'I believe I would be a great fit for', meaning: 'Confidence statement' },
];

const sampleBlanks: BlankData[] = [
  { phraseOrder: 1, blankedText: '___ the Graphic Designer position at Studio Nine, as advertised on LinkedIn.' },
  { phraseOrder: 3, blankedText: '___ brand design and a strong portfolio of client work, I believe I would be a great fit for your creative team.' },
  { phraseOrder: 5, blankedText: 'With over four years of experience in brand design and a strong portfolio of client work, ___ your creative team.' },
];

describe('buildRecallPrompts', () => {
  it('uses seeded recall blanks when available', () => {
    const prompts = buildRecallPrompts(samplePhrases, sampleBlanks);
    expect(prompts).toHaveLength(3);
    expect(prompts[0].phraseOrder).toBe(1);
    expect(prompts[0].promptText).toContain('___');
    expect(prompts[0].expectedText).toBe('I am writing to express my interest in');
  });

  it('returns prompts in phrase order', () => {
    const prompts = buildRecallPrompts(samplePhrases, sampleBlanks);
    expect(prompts[0].phraseOrder).toBe(1);
    expect(prompts[1].phraseOrder).toBe(3);
    expect(prompts[2].phraseOrder).toBe(5);
  });

  it('falls back to all key phrases when no blanks exist', () => {
    const prompts = buildRecallPrompts(samplePhrases, undefined);
    expect(prompts).toHaveLength(5);
    expect(prompts[0].expectedText).toBe('I am writing to express my interest in');
    expect(prompts[4].expectedText).toBe('I believe I would be a great fit for');
  });

  it('falls back when blanks array is empty', () => {
    const prompts = buildRecallPrompts(samplePhrases, []);
    expect(prompts).toHaveLength(5);
  });

  it('skips blanks referencing unknown phrase orders', () => {
    const badBlanks: BlankData[] = [
      { phraseOrder: 999, blankedText: '___ unknown' },
      { phraseOrder: 1, blankedText: '___ valid' },
    ];
    const prompts = buildRecallPrompts(samplePhrases, badBlanks);
    expect(prompts).toHaveLength(1);
    expect(prompts[0].phraseOrder).toBe(1);
  });

  it('falls back when all blanks reference unknown phrases', () => {
    const badBlanks: BlankData[] = [
      { phraseOrder: 99, blankedText: '___ bad 1' },
      { phraseOrder: 100, blankedText: '___ bad 2' },
    ];
    const prompts = buildRecallPrompts(samplePhrases, badBlanks);
    expect(prompts).toHaveLength(5); // falls back
  });
});

// ---------------------------------------------------------------------------
// Exact matching for recall phrases
// ---------------------------------------------------------------------------

describe('isExactMatch — recall phrases', () => {
  it('matches exact phrase text', () => {
    expect(
      isExactMatch(
        'I am writing to express my interest in',
        'I am writing to express my interest in',
      ),
    ).toBe(true);
  });

  it('rejects phrase with wrong capitalization', () => {
    expect(
      isExactMatch(
        'i am writing to express my interest in',
        'I am writing to express my interest in',
      ),
    ).toBe(false);
  });

  it('rejects phrase with extra words', () => {
    expect(
      isExactMatch(
        'I am writing to express my interest in the',
        'I am writing to express my interest in',
      ),
    ).toBe(false);
  });

  it('rejects phrase missing words', () => {
    expect(
      isExactMatch(
        'I am writing to express my interest',
        'I am writing to express my interest in',
      ),
    ).toBe(false);
  });

  it('rejects wrong punctuation', () => {
    expect(
      isExactMatch(
        "don't hesitate to reach out",
        'dont hesitate to reach out',
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Recall state transition simulation
// ---------------------------------------------------------------------------

interface RecallAttemptState {
  isChecked: boolean;
  attemptCount: number;
  feedback: 'idle' | 'correct' | 'retry';
}

function simulateRecallCheck(
  state: RecallAttemptState,
  typed: string,
  expected: string,
): RecallAttemptState {
  if (!typed.trim()) return state;

  const newCount = state.attemptCount + 1;
  const correct = isExactMatch(typed, expected);

  return {
    isChecked: correct ? true : state.isChecked,
    attemptCount: newCount,
    feedback: correct ? 'correct' : 'retry',
  };
}

describe('recall attempt state transitions', () => {
  const idle: RecallAttemptState = {
    isChecked: false,
    attemptCount: 0,
    feedback: 'idle',
  };

  const expected = 'I believe I would be a great fit for';

  it('first attempt correct marks checked', () => {
    const result = simulateRecallCheck(idle, expected, expected);
    expect(result.isChecked).toBe(true);
    expect(result.attemptCount).toBe(1);
    expect(result.feedback).toBe('correct');
  });

  it('two retries then correct on third', () => {
    const s1 = simulateRecallCheck(idle, 'wrong', expected);
    expect(s1.feedback).toBe('retry');
    expect(s1.isChecked).toBe(false);

    const s2 = simulateRecallCheck(s1, 'still wrong', expected);
    expect(s2.attemptCount).toBe(2);

    const s3 = simulateRecallCheck(s2, expected, expected);
    expect(s3.isChecked).toBe(true);
    expect(s3.attemptCount).toBe(3);
    expect(s3.feedback).toBe('correct');
  });

  it('ignores empty checks', () => {
    const result = simulateRecallCheck(idle, '', expected);
    expect(result.attemptCount).toBe(0);
    expect(result.isChecked).toBe(false);
  });

  it('ignores whitespace-only checks', () => {
    const result = simulateRecallCheck(idle, '   ', expected);
    expect(result.attemptCount).toBe(0);
  });
});
