-- FluentDraft MVP — Seed supported languages
-- Idempotent: safe to re-run (ON CONFLICT DO UPDATE).
-- English is the primary learning language; these are target languages
-- for optional translation reveal during practice.

insert into supported_languages (code, name, native_name, enabled) values
  ('ar', 'Arabic',              'العربية',    true),
  ('de', 'German',              'Deutsch',    true),
  ('es', 'Spanish',             'Español',    true),
  ('fr', 'French',              'Français',   true),
  ('hi', 'Hindi',               'हिन्दी',       true),
  ('it', 'Italian',             'Italiano',   true),
  ('ja', 'Japanese',            '日本語',       true),
  ('ko', 'Korean',              '한국어',       true),
  ('pt', 'Portuguese',          'Português',  true),
  ('tr', 'Turkish',             'Türkçe',     true),
  ('ur', 'Urdu',                'اردو',        true),
  ('zh', 'Chinese',             '中文',         true)
on conflict (code) do update set
  name         = excluded.name,
  native_name  = excluded.native_name,
  enabled      = excluded.enabled;
