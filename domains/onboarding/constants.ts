/**
 * Onboarding constants.
 *
 * Kept in-sync with the seeded `supported_languages` table
 * (supabase/migrations/20260709000002_seed_languages.sql).
 * A future enhancement can load these from the DB at request time.
 */

import type { EnglishLevel } from './types';

// ---------------------------------------------------------------------------
// English levels
// ---------------------------------------------------------------------------

export const ENGLISH_LEVELS: { value: EnglishLevel; label: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner — I can understand and use basic phrases',
  },
  {
    value: 'intermediate',
    label: 'Intermediate — I can handle most everyday situations',
  },
  {
    value: 'advanced',
    label: 'Advanced — I can communicate fluently on complex topics',
  },
];

// ---------------------------------------------------------------------------
// Target languages (mirrors seed_languages.sql)
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'Arabic',              nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese',             nativeName: '中文' },
  { code: 'fr', name: 'French',              nativeName: 'Français' },
  { code: 'de', name: 'German',              nativeName: 'Deutsch' },
  { code: 'hi', name: 'Hindi',               nativeName: 'हिन्दी' },
  { code: 'it', name: 'Italian',             nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese',            nativeName: '日本語' },
  { code: 'ko', name: 'Korean',              nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese',          nativeName: 'Português' },
  { code: 'es', name: 'Spanish',             nativeName: 'Español' },
  { code: 'tr', name: 'Turkish',             nativeName: 'Türkçe' },
  { code: 'ur', name: 'Urdu',                nativeName: 'اردو' },
];

// ---------------------------------------------------------------------------
// Countries (common learner origins + major English-speaking countries)
// ---------------------------------------------------------------------------

export const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EG', name: 'Egypt' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'IR', name: 'Iran' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RU', name: 'Russia' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'MA', name: 'Morocco' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'OTHER', name: 'Other' },
];
