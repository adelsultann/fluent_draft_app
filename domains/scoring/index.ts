export type {
  Difficulty,
  TypedPhraseAttemptInput,
  PronunciationAttemptInput,
  TypedPhraseResult,
  LessonScoreResult,
  ScoreCalculationInput,
} from './types';

export { SCORING } from './types';

export {
  isExactMatch,
  checkPhrase,
  getDifficultyMultiplier,
  calculateScore,
} from './engine';
