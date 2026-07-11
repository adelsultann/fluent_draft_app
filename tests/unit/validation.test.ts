/**
 * Unit tests — Demo conversion payload validation
 *
 * Covers: scenario ID validation, completion requirement, phrase ID validation,
 * tamper rejection, and duplicate detection.
 */

import { describe, it, expect } from 'vitest';
import {
  validateConversionPayload,
  DEMO_SCENARIO_ID,
} from '@/domains/demo/validation';
import type { ConvertDemoProgressInput } from '@/domains/demo/validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_PHRASE_ID = '00000000-0000-0000-0002-000000000001';
const VALID_PHRASE_ID_2 = '00000000-0000-0000-0002-000000000002';
const INVALID_PHRASE_ID = '00000000-0000-0000-0000-000000000999';

function validInput(): ConvertDemoProgressInput {
  return {
    scenarioId: DEMO_SCENARIO_ID,
    completed: true,
    phaseReached: 'save',
    typedPhraseAttempts: [],
    pronunciationAttempts: [],
    savedPhraseIds: [],
  };
}

// ---------------------------------------------------------------------------
// Scenario ID validation
// ---------------------------------------------------------------------------

describe('scenarioId validation', () => {
  it('accepts the fixed demo scenario ID', () => {
    const result = validateConversionPayload(validInput());
    expect(result).toBeNull();
  });

  it('rejects a different scenario ID', () => {
    const result = validateConversionPayload({
      ...validInput(),
      scenarioId: 'some-other-id',
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors.scenarioId).toContain('Invalid');
  });

  it('rejects an empty scenario ID', () => {
    const result = validateConversionPayload({
      ...validInput(),
      scenarioId: '',
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors.scenarioId).toContain('Invalid');
  });
});

// ---------------------------------------------------------------------------
// Completion requirement
// ---------------------------------------------------------------------------

describe('completed validation', () => {
  it('accepts completed: true', () => {
    const result = validateConversionPayload(validInput());
    expect(result).toBeNull();
  });

  it('rejects completed: false', () => {
    const result = validateConversionPayload({
      ...validInput(),
      completed: false,
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors.completed).toBeDefined();
  });

  it('rejects completed: undefined', () => {
    const input = { ...validInput(), completed: undefined as unknown as boolean };
    const result = validateConversionPayload(input);
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Typed phrase attempt validation
// ---------------------------------------------------------------------------

describe('typedPhraseAttempts validation', () => {
  it('accepts empty typed phrase attempts', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [],
    });
    expect(result).toBeNull();
  });

  it('accepts valid typed phrase attempts with correct IDs', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [
        { keyPhraseId: VALID_PHRASE_ID, typedText: 'hello', attemptNumber: 1 },
        { keyPhraseId: VALID_PHRASE_ID_2, typedText: 'world', attemptNumber: 2 },
      ],
    });
    expect(result).toBeNull();
  });

  it('rejects a phrase attempt with an unknown phrase ID', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [
        { keyPhraseId: INVALID_PHRASE_ID, typedText: 'hello', attemptNumber: 1 },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors['typedPhraseAttempts[0].keyPhraseId']).toContain('Invalid');
  });

  it('rejects a phrase attempt with attemptNumber < 1', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [
        { keyPhraseId: VALID_PHRASE_ID, typedText: 'hello', attemptNumber: 0 },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors['typedPhraseAttempts[0].attemptNumber']).toBeDefined();
  });

  it('rejects a phrase attempt with missing typedText', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [
        {
          keyPhraseId: VALID_PHRASE_ID,
          typedText: undefined as unknown as string,
          attemptNumber: 1,
        },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors['typedPhraseAttempts[0].typedText']).toBeDefined();
  });

  it('rejects a phrase attempt with empty keyPhraseId', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [
        { keyPhraseId: '', typedText: 'hello', attemptNumber: 1 },
      ],
    });
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Pronunciation attempt validation
// ---------------------------------------------------------------------------

describe('pronunciationAttempts validation', () => {
  it('accepts empty pronunciation attempts', () => {
    const result = validateConversionPayload({
      ...validInput(),
      pronunciationAttempts: [],
    });
    expect(result).toBeNull();
  });

  it('accepts valid pronunciation attempts', () => {
    const result = validateConversionPayload({
      ...validInput(),
      pronunciationAttempts: [
        {
          keyPhraseId: VALID_PHRASE_ID,
          expectedText: 'thank you',
          transcript: 'thank you',
        },
      ],
    });
    expect(result).toBeNull();
  });

  it('rejects pronunciation attempt with unknown phrase ID', () => {
    const result = validateConversionPayload({
      ...validInput(),
      pronunciationAttempts: [
        {
          keyPhraseId: INVALID_PHRASE_ID,
          expectedText: 'hello',
          transcript: 'hello',
        },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors['pronunciationAttempts[0].keyPhraseId']).toContain('Invalid');
  });
});

// ---------------------------------------------------------------------------
// Saved phrase IDs validation
// ---------------------------------------------------------------------------

describe('savedPhraseIds validation', () => {
  it('accepts empty saved phrase IDs', () => {
    const result = validateConversionPayload({
      ...validInput(),
      savedPhraseIds: [],
    });
    expect(result).toBeNull();
  });

  it('accepts valid saved phrase IDs', () => {
    const result = validateConversionPayload({
      ...validInput(),
      savedPhraseIds: [VALID_PHRASE_ID, VALID_PHRASE_ID_2],
    });
    expect(result).toBeNull();
  });

  it('rejects an unknown saved phrase ID', () => {
    const result = validateConversionPayload({
      ...validInput(),
      savedPhraseIds: [INVALID_PHRASE_ID],
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors['savedPhraseIds[0]']).toContain('Invalid');
  });

  it('rejects duplicate saved phrase IDs', () => {
    const result = validateConversionPayload({
      ...validInput(),
      savedPhraseIds: [VALID_PHRASE_ID, VALID_PHRASE_ID],
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors['savedPhraseIds[1]']).toContain('Duplicate');
  });

  it('accepts non-duplicate phrase IDs', () => {
    const result = validateConversionPayload({
      ...validInput(),
      savedPhraseIds: [VALID_PHRASE_ID, VALID_PHRASE_ID_2],
    });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tamper / edge case tests
// ---------------------------------------------------------------------------

describe('tamper rejection', () => {
  it('rejects an array with a single invalid phrase ID among valid ones', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [
        { keyPhraseId: VALID_PHRASE_ID, typedText: 'good', attemptNumber: 1 },
        { keyPhraseId: INVALID_PHRASE_ID, typedText: 'bad', attemptNumber: 1 },
        { keyPhraseId: VALID_PHRASE_ID_2, typedText: 'good', attemptNumber: 1 },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.fieldErrors['typedPhraseAttempts[1].keyPhraseId']).toBeDefined();
  });

  it('rejects a massive array of invalid phrase IDs', () => {
    const attempts = Array.from({ length: 100 }, (_, i) => ({
      keyPhraseId: `invalid-${i}`,
      typedText: 'x',
      attemptNumber: 1,
    }));
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: attempts,
    });
    expect(result).not.toBeNull();
    // Should fail on the first invalid one
    expect(result!.fieldErrors['typedPhraseAttempts[0].keyPhraseId']).toBeDefined();
  });

  it('rejects non-numeric attemptNumber values', () => {
    const result = validateConversionPayload({
      ...validInput(),
      typedPhraseAttempts: [
        {
          keyPhraseId: VALID_PHRASE_ID,
          typedText: 'hello',
          attemptNumber: 'first' as unknown as number,
        },
      ],
    });
    expect(result).not.toBeNull();
  });
});
