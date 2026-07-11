-- FluentDraft MVP — Seed fixed demo lesson content
-- Inserts the single anonymous demo lesson into the database
-- so that Step 25 (demo conversion after signup) has DB rows to FK against.
--
-- Uses deterministic UUIDs so the conversion action can reference
-- the demo scenario and its key phrases by known IDs.

-- ============================================================================
-- Demo pack
-- ============================================================================
insert into scenario_packs (id, title, slug, description, sort_order, is_premium, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo Lesson',
  'demo-pack',
  'Try FluentDraft with a free demo lesson. Practice writing a professional follow-up email after a job interview — a real-world skill every job seeker needs.',
  0,
  false,
  true
) on conflict (slug) do nothing;

-- ============================================================================
-- Demo scenario
-- ============================================================================
insert into scenarios (id, pack_id, title, slug, context, goal, tone, criteria, difficulty, model_response, is_demo, is_active, sort_order)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Follow Up After a Job Interview',
  'follow-up-after-interview',
  'You interviewed for a Marketing Coordinator position at BrightPath Agency three days ago. The conversation went well and you felt a genuine connection with the team. Now you want to write a polite, professional follow-up email to thank the interviewer and reaffirm your interest without sounding pushy or desperate.',
  'Write a professional follow-up email that thanks the interviewer, expresses continued interest, and leaves a positive impression.',
  'professional',
  ARRAY[
    'Open with a polite thank you',
    'Reference a specific point from the interview',
    'Reaffirm interest in the role',
    'Keep the tone warm but professional',
    'End with a courteous closing'
  ],
  'beginner',
  'Dear Ms. Chen,

I wanted to thank you again for taking the time to speak with me about the Marketing Coordinator position. I really enjoyed learning more about the team and the exciting projects BrightPath is working on.

Our conversation reinforced my interest in the role. I was especially excited to hear about your upcoming brand refresh initiative — it sounds like an opportunity where my background in content strategy could be valuable.

Please don''t hesitate to reach out if you need any additional information from me. I look forward to hearing from you.

Best regards,
Alex',
  true,
  true,
  0
) on conflict (slug) do nothing;

-- ============================================================================
-- Demo lesson chunks (6 chunks)
-- ============================================================================
insert into lesson_chunks (id, scenario_id, chunk_order, text, audio_text)
values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000002',
    1,
    'Dear Ms. Chen,

I wanted to thank you again for taking the time to speak with me about the Marketing Coordinator position.',
    'Dear Ms. Chen. I wanted to thank you again for taking the time to speak with me about the Marketing Coordinator position.'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000002',
    2,
    'I really enjoyed learning more about the team and the exciting projects BrightPath is working on.',
    null
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000002',
    3,
    'Our conversation reinforced my interest in the role.',
    'Our conversation reinforced my interest in the role.'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000002',
    4,
    'I was especially excited to hear about your upcoming brand refresh initiative — it sounds like an opportunity where my background in content strategy could be valuable.',
    'I was especially excited to hear about your upcoming brand refresh initiative. It sounds like an opportunity where my background in content strategy could be valuable.'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000002',
    5,
    'Please don''t hesitate to reach out if you need any additional information from me.',
    null
  ),
  (
    '00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0000-000000000002',
    6,
    'I look forward to hearing from you.

Best regards,
Alex',
    'I look forward to hearing from you. Best regards, Alex.'
  )
on conflict (scenario_id, chunk_order) do nothing;

-- ============================================================================
-- Demo key phrases (6 phrases)
-- ============================================================================
insert into key_phrases (id, scenario_id, phrase_order, text, meaning, example, common_mistake, pronunciation_required)
values
  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000002',
    1,
    'thank you again for taking the time',
    'A polite way to express gratitude for someone''s time, especially after a meeting or interview.',
    'Thank you again for taking the time to review my application.',
    'Using "thank you for your time" alone can sound impersonal. Adding "again" shows this is a follow-up.',
    true
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0000-000000000002',
    2,
    'I really enjoyed learning more about',
    'A warm, natural way to express genuine curiosity and positive feelings after a conversation.',
    'I really enjoyed learning more about your company''s mission and vision.',
    'Learners sometimes write "I enjoyed to learn" instead of the correct gerund form "learning."',
    false
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0000-000000000002',
    3,
    'reinforced my interest in the role',
    'A professional way to say that the interview made you want the job even more.',
    'Meeting the team reinforced my interest in the position.',
    'Avoid "increased my interest" — "reinforced" sounds more natural and professional in this context.',
    true
  ),
  (
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0000-000000000002',
    4,
    'don''t hesitate to reach out',
    'A polite and common invitation for the recipient to contact you if needed.',
    'Don''t hesitate to reach out if you have any questions about my experience.',
    'Non-native speakers sometimes write "don''t hesitate to contact with me" — drop "with."',
    true
  ),
  (
    '00000000-0000-0000-0002-000000000005',
    '00000000-0000-0000-0000-000000000002',
    5,
    'I look forward to hearing from you',
    'A standard professional closing that shows anticipation without applying pressure.',
    'I look forward to hearing from you soon regarding the next steps.',
    'Remember to use the gerund "hearing," not the infinitive "to hear," after "look forward to."',
    false
  ),
  (
    '00000000-0000-0000-0002-000000000006',
    '00000000-0000-0000-0000-000000000002',
    6,
    'Best regards',
    'A widely accepted, neutral-professional email closing appropriate for most business contexts.',
    'Best regards,
Sarah',
    'Avoid "Best regard" (missing "s"). The correct form is always plural: "Best regards."',
    false
  )
on conflict (scenario_id, phrase_order) do nothing;
