'use client';

/**
 * FluentDraft — Browser-native speech recognition hook
 *
 * Uses window.SpeechRecognition / webkitSpeechRecognition for
 * MVP pronunciation practice.  Captures transcripts and returns
 * pass/retry/unsupported status.
 *
 * Handles unsupported browsers, microphone denial, and network
 * errors with user-facing statuses.  Isolated under
 * domains/pronunciation for future paid-API upgrade.
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

export type RecognitionErrorType = 'none' | 'not-allowed' | 'network' | 'other';

export type PronunciationStatus =
  | 'idle'
  | 'listening'
  | 'passed'
  | 'retry'
  | 'unsupported'
  | 'denied';

export interface RecognitionState {
  /** Whether the Web Speech Recognition API is available. */
  supported: boolean;
  /** Whether the user denied microphone access. */
  microphoneDenied: boolean;
  /** The type of the last recognition error (for fallback messages). */
  errorType: RecognitionErrorType;
  /** Current recognition status. */
  status: PronunciationStatus;
  /** The captured transcript (empty until recording stops). */
  transcript: string;
  /** Start listening for speech. No‑op when unsupported / denied. */
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

  if (normTranscript === normExpected) return true;
  if (normTranscript.includes(normExpected)) return true;
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
 * - Detects `not-allowed` (microphone denied) errors explicitly.
 * - Returns `supported: false` when the API is unavailable.
 */
export function useSpeechRecognition(): RecognitionState {
  const [RecognitionCtor] = useState(() => getRecognitionConstructor());
  const supported = !!RecognitionCtor;

  const [status, setStatus] = useState<PronunciationStatus>(
    RecognitionCtor ? 'idle' : 'unsupported',
  );
  const [transcript, setTranscript] = useState('');
  const [errorType, setErrorType] = useState<RecognitionErrorType>('none');
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);

  const microphoneDenied = errorType === 'not-allowed';

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

    instance.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed') {
        setErrorType('not-allowed');
        setStatus('denied');
      } else if (event.error === 'network') {
        setErrorType('network');
        setStatus('idle');
      } else {
        setErrorType('other');
        setStatus('idle');
      }
      recognitionRef.current = null;
    };

    instance.onend = () => {
      // Recognition ended — stay in listening state until explicit stop
    };

    instance.start();
    recognitionRef.current = instance;
    setTranscript('');
    setErrorType('none');
    setStatus('listening');
  }, [RecognitionCtor]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.stop();
      recognitionRef.current = null;
    }
  }, []);

  return {
    supported,
    microphoneDenied,
    errorType,
    status,
    transcript,
    start,
    stop,
  };
}
