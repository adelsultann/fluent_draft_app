/** Onboarding form payload (persisted in Task 19). */
export interface OnboardingFormData {
  displayName: string;
  englishLevel: 'beginner' | 'intermediate' | 'advanced';
  targetLanguageCode: string;
  countryCode: string;
}

/** Possible English self-assessment levels. */
export type EnglishLevel = OnboardingFormData['englishLevel'];
