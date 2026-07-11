'use client';

/**
 * FluentDraft — Browser-native text-to-speech hook
 *
 * Uses window.speechSynthesis and SpeechSynthesisUtterance for
 * lightweight MVP audio playback.  Prefers an English voice where
 * available; falls back to the browser default voice.
 *
 * Gracefully handles unsupported browsers by returning an inert state.
 *
 * Related docs:
 *   - docs/system-design.md § Pronunciation Design
 *   - docs/testing-strategy.md § Manual QA
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpeechState {
  /** Whether the Web Speech API is available at all. */
  supported: boolean;
  /** Whether speech is currently playing. */
  speaking: boolean;
  /** Start speaking the given text.  No‑op when unsupported. */
  speak: (text: string) => void;
  /** Stop any active speech immediately. */
  stop: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns a speech-state object that can drive Listen/Stop buttons.
 *
 * - Automatically cancels speech when the component unmounts.
 * - Prefers an English voice (`lang` starts with "en").
 * - Only provides `speak`/`stop` when `speechSynthesis` is available.
 */
export function useSpeechSynthesis(): SpeechState {
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  });
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialise synthRef once on the client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis ?? null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth || !text.trim()) return;

    // Cancel any in-progress speech before starting a new one
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());

    // Prefer an English voice
    const voices = synth.getVoices();
    if (voices.length > 0) {
      const englishVoice = voices.find((v) => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
    } else {
      // Chrome loads voices asynchronously; re-check on voiceschanged
      const onVoicesChanged = () => {
        const updatedVoices = synth.getVoices();
        const enVoice = updatedVoices.find((v) => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
        synth.removeEventListener('voiceschanged', onVoicesChanged);
      };
      synth.addEventListener('voiceschanged', onVoicesChanged);
    }

    utterance.rate = 0.9; // slightly slower for learners
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  return {
    supported,
    speaking,
    speak,
    stop,
  };
}
