'use client';

/**
 * FluentDraft — Browser-native speech recognition hook
 *
 * Uses window.SpeechRecognition / webkitSpeechRecognition for
 * MVP pronunciation practice.  Captures transcripts and returns
 * pass/retry/unsupported status.
 *
 * Gracefully handles unsupported browsers by returning an inert state.
 * Isolated under domains/pronunciation for future paid-API upgrade.
 *
 * Related docs:
 *   - docs/system-design.md § Pronunciation Design
 *   - docs/api-contracts.md § Submit Pronunciation Attempt
 *   - docs/testing-strategy.md § Manual QA
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PronunciationStatus = 'idle' | 'listening' | 'passed' | 'retry' | 'unsupported';

export interface RecognitionState {
  /** Whether the Web Speech Recognition API is available. */
  supported: boolean;
  /** Current recognition status. */
  status: PronunciationStatus;
  /** The captured transcript (empty until recording stops). */
  transcript: string;
  /** Start listening for speech. No‑op when unsupported. */
  start: () => void;
  /** Stop listening and evaluate the transcript. */
  stop: () => void;
}

// ---------------------------------------------------------------------------
// Simple pronunciation checker
// ---------------------------------------------------------------------------

/**
 * Compare a speech recognition transcript to the expected text.
 *
 * Uses a lenient comparison suitable for browser speech recognition:
 * - Lowercased
 * - Punctuation stripped
 * - Extra whitespace normalized
 *
 * Returns `true` when the transcript is close enough to be considered
 * a pass for MVP pronunciation practice.
 */
export function checkPronunciation(transcript: string, expected: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, '') // strip punctuation except apostrophes
      .replace(/\s+/g, ' ')          // normalize whitespace
      .trim();

  const normTranscript = normalize(transcript);
  const normExpected = normalize(expected);

  // Exact match after normalization
  if (normTranscript === normExpected) return true;

  // Also check if the expected text is fully contained in the transcript
  // (speech recognition sometimes captures extra words)
  if (normTranscript.includes(normExpected)) return true;

  // Or if the transcript is substantially contained in expected
  if (normExpected.includes(normTranscript) && normTranscript.length > normExpected.length * 0.5) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionConstructor = new () => any;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const ctor =
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  return (ctor as SpeechRecognitionConstructor) ?? null;
}

/**
 * Returns a recognition-state object for driving Record/Stop buttons.
 *
 * - Automatically stops recognition on unmount.
 * - Returns `supported: false` when the API is unavailable.
 * - Microphone denial is NOT explicitly detected (Task 35).
 */
export function useSpeechRecognition(): RecognitionState {
  const [RecognitionCtor] = useState(() => getRecognitionConstructor());
  const supported = !!RecognitionCtor;

  const [status, setStatus] = useState<PronunciationStatus>(
    RecognitionCtor ? 'idle' : 'unsupported',
  );
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!RecognitionCtor) return;
    const rec = recognitionRef.current;

    // Abort any in-progress session
    if (rec) {
      rec.abort();
    }

    const instance = new RecognitionCtor();
    instance.lang = 'en-US';
    instance.interimResults = false;
    instance.maxAlternatives = 1;

    instance.onresult = (event: { results: { transcript: string }[][] }) => {
      const last = event.results[event.results.length - 1];
      if (last && last[0]) {
        setTranscript(last[0].transcript);
      }
    };

    instance.onerror = () => {
      // Microphone denied or network error — treat as retryable
      setStatus('idle');
    };

    instance.onend = () => {
      // Recognition ended — stay in listening state until explicit stop
    };

    instance.start();
    recognitionRef.current = instance;
    setTranscript('');
    setStatus('listening');
  }, [RecognitionCtor]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.stop();
      recognitionRef.current = null;
    }
    // Status is set by the caller after evaluating the transcript
  }, []);

  return {
    supported,
    status,
    transcript,
    start,
    stop,
  };
}
