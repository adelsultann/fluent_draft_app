/**
 * Unit tests — Exact text answer checking for the Practice phase.
 *
 * Covers: the pure `isExactMatch` helper, attempt tracking logic,
 * answer validation, and edge cases relevant to guided chunk typing.
 */

import { describe, it, expect } from 'vitest';
import { isExactMatch } from '@/domains/scoring/engine';

// ---------------------------------------------------------------------------
// isExactMatch — comprehensive edge cases
// ---------------------------------------------------------------------------

describe('isExactMatch — Practice phase requirements', () => {
  it('matches identical text', () => {
    expect(
      isExactMatch(
        'Dear Ms. Chen,',
        'Dear Ms. Chen,',
      ),
    ).toBe(true);
  });

  it('matches text with surrounding whitespace', () => {
    expect(
      isExactMatch('  I wanted to thank you  ', 'I wanted to thank you'),
    ).toBe(true);
  });

  it('rejects different capitalization', () => {
    expect(
      isExactMatch('dear ms. chen,', 'Dear Ms. Chen,'),
    ).toBe(false);
  });

  it('rejects missing punctuation', () => {
    expect(
      isExactMatch('Dear Ms Chen', 'Dear Ms. Chen,'),
    ).toBe(false);
  });

  it('rejects extra spaces between words', () => {
    expect(
      isExactMatch('I  wanted  to  thank  you', 'I wanted to thank you'),
    ).toBe(false);
  });

  it('rejects different line breaks', () => {
    expect(
      isExactMatch('line1\nline2', 'line1\r\nline2'),
    ).toBe(false);
  });

  it('matches multiline text with preserved newlines', () => {
    const typed = 'Dear Ms. Chen,\n\nI wanted to thank you';
    const expected = 'Dear Ms. Chen,\n\nI wanted to thank you';
    expect(isExactMatch(typed, expected)).toBe(true);
  });

  it('rejects trailing whitespace difference (trim handles it, but internal matters)', () => {
    // Both sides trimmed — surrounding whitespace is ignored
    expect(isExactMatch('hello  ', 'hello')).toBe(true);
    expect(isExactMatch('  hello', 'hello')).toBe(true);
  });

  it('rejects empty typed text against non-empty expected', () => {
    expect(isExactMatch('', 'Expected text')).toBe(false);
  });

  it('matches both empty strings', () => {
    expect(isExactMatch('', '')).toBe(true);
  });

  it('rejects when only typed is empty and expected is not', () => {
    expect(isExactMatch('', 'some text')).toBe(false);
  });

  it('rejects when only expected is empty and typed is not', () => {
    expect(isExactMatch('some text', '')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Attempt tracking logic (pure function simulation)
// ---------------------------------------------------------------------------

interface AttemptState {
  isChecked: boolean;
  attemptCount: number;
  feedback: 'idle' | 'correct' | 'retry';
}

function simulateCheck(
  state: AttemptState,
  typed: string,
  expected: string,
): AttemptState {
  if (!typed.trim()) return state;

  const newCount = state.attemptCount + 1;
  const correct = isExactMatch(typed, expected);

  return {
    isChecked: correct ? true : state.isChecked,
    attemptCount: newCount,
    feedback: correct ? 'correct' : 'retry',
  };
}

function simulateEditAfterCheck(state: AttemptState): AttemptState {
  // Editing after a correct answer clears feedback but keeps checked status
  if (state.isChecked) {
    return { ...state, feedback: 'idle' };
  }
  // Editing after a retry clears the retry feedback
  if (state.feedback === 'retry') {
    return { ...state, feedback: 'idle' };
  }
  return state;
}

describe('attempt tracking — simulated state transitions', () => {
  const idleState: AttemptState = {
    isChecked: false,
    attemptCount: 0,
    feedback: 'idle',
  };

  const expected =
    'I wanted to thank you again for taking the time to speak with me about the Marketing Coordinator position.';

  it('first correct attempt sets checked and correct feedback', () => {
    const result = simulateCheck(idleState, expected, expected);
    expect(result.isChecked).toBe(true);
    expect(result.attemptCount).toBe(1);
    expect(result.feedback).toBe('correct');
  });

  it('first incorrect attempt sets retry feedback, not checked', () => {
    const result = simulateCheck(idleState, 'wrong text', expected);
    expect(result.isChecked).toBe(false);
    expect(result.attemptCount).toBe(1);
    expect(result.feedback).toBe('retry');
  });

  it('second incorrect attempt increments count, still not checked', () => {
    const afterFirst = simulateCheck(idleState, 'wrong', expected);
    const afterSecond = simulateCheck(afterFirst, 'still wrong', expected);
    expect(afterSecond.isChecked).toBe(false);
    expect(afterSecond.attemptCount).toBe(2);
    expect(afterSecond.feedback).toBe('retry');
  });

  it('correct on third attempt sets checked', () => {
    const s1 = simulateCheck(idleState, 'wrong 1', expected);
    const s2 = simulateCheck(s1, 'wrong 2', expected);
    const s3 = simulateCheck(s2, expected, expected);
    expect(s3.isChecked).toBe(true);
    expect(s3.attemptCount).toBe(3);
    expect(s3.feedback).toBe('correct');
  });

  it('does not increment count for empty input', () => {
    const result = simulateCheck(idleState, '', expected);
    expect(result.attemptCount).toBe(0);
  });

  it('does not increment count for whitespace-only input', () => {
    const result = simulateCheck(idleState, '   ', expected);
    expect(result.attemptCount).toBe(0);
  });

  it('editing after retry clears feedback to idle', () => {
    const afterCheck = simulateCheck(idleState, 'wrong', expected);
    expect(afterCheck.feedback).toBe('retry');

    const afterEdit = simulateEditAfterCheck(afterCheck);
    expect(afterEdit.feedback).toBe('idle');
    expect(afterEdit.isChecked).toBe(false);
    expect(afterEdit.attemptCount).toBe(1); // unchanged
  });

  it('editing after correct clears feedback but keeps checked', () => {
    const afterCheck = simulateCheck(idleState, expected, expected);
    expect(afterCheck.feedback).toBe('correct');
    expect(afterCheck.isChecked).toBe(true);

    const afterEdit = simulateEditAfterCheck(afterCheck);
    expect(afterEdit.feedback).toBe('idle');
    expect(afterEdit.isChecked).toBe(true); // stays checked
  });
});
