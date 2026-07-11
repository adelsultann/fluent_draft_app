-- FluentDraft MVP — Seed non-demo scenario packs
-- Inserts the 3 Registered MVP packs + 6 scenarios + their chunks
-- and key phrases into the database so Task 32 (persist registered
-- attempts) has DB rows to FK against.
--
-- Uses deterministic UUIDs derived from slug + order so the
-- server-side persistence action can reference them without
-- querying the DB for IDs.

-- ============================================================================
-- Packs (3)
-- ============================================================================

-- Pack 1: Job Hunt & Career
insert into scenario_packs (id, title, slug, description, sort_order, is_premium, is_active) values
('b0000000-0000-0000-0000-000000000001', 'Job Hunt & Career',  'job-hunt-career',
 'Practice writing professional emails and messages for job applications, interview follow-ups, and offer replies. Build the confidence to communicate clearly and politely at every stage of your job search.',
 1, false, true)
on conflict (slug) do nothing;

-- Pack 2: Daily Workplace
insert into scenario_packs (id, title, slug, description, sort_order, is_premium, is_active) values
('b0000000-0000-0000-0000-000000000002', 'Daily Workplace',     'daily-workplace',
 'Practice writing the everyday emails and messages that keep work moving: time-off requests, task follow-ups, meeting invites, and quick team updates.',
 2, false, true)
on conflict (slug) do nothing;

-- Pack 3: Daily Life & Adulting
insert into scenario_packs (id, title, slug, description, sort_order, is_premium, is_active) values
('b0000000-0000-0000-0000-000000000003', 'Daily Life & Adulting', 'daily-life-adulting',
 'Practice writing the messages that pop up in daily life: making reservations, contacting customer support, replying to invitations, and handling everyday situations with confidence.',
 3, false, true)
on conflict (slug) do nothing;

-- ============================================================================
-- Scenarios (6) — one range per pack
-- ============================================================================

-- Scenario 1: cover-letter-opening (Pack 1)
insert into scenarios (id, pack_id, title, slug, context, goal, tone, criteria, difficulty, model_response, is_demo, is_active, sort_order) values
('b0000000-0001-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Writing a Cover Letter Opening', 'cover-letter-opening',
 'You found a Graphic Designer job posting at Studio Nine on LinkedIn. You have four years of design experience and a strong portfolio. Write the opening paragraph of your cover letter — introduce yourself, state the role you are applying for, and mention your key qualifications.',
 'Write a clear cover letter opening that states the role, where you saw it, and your top qualifications in two concise sentences.',
 'professional', ARRAY['Address the hiring manager correctly','State the position title and company name','Mention where you found the job posting','Highlight one or two key qualifications','Keep it to a single short paragraph'],
 'beginner',
 'Dear Hiring Manager,

I am writing to express my interest in the Graphic Designer position at Studio Nine, as advertised on LinkedIn. With over four years of experience in brand design and a strong portfolio of client work, I believe I would be a great fit for your creative team.',
 false, true, 1)
on conflict (slug) do nothing;

-- Scenario 2: accepting-a-job-offer (Pack 1)
insert into scenarios (id, pack_id, title, slug, context, goal, tone, criteria, difficulty, model_response, is_demo, is_active, sort_order) values
('b0000000-0001-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 'Accepting a Job Offer', 'accepting-a-job-offer',
 'You just received a formal job offer from GreenLeaf Solutions for a Project Coordinator role. The offer includes the salary and start date you discussed. Write a short, professional email to accept the offer, confirm the start date, and express your enthusiasm.',
 'Write a concise job offer acceptance email that confirms you accept, repeats the key terms, and ends on a positive note.',
 'professional', ARRAY['Thank the sender for the offer','Clearly state that you accept','Confirm the start date','Express enthusiasm for joining the team','Keep the email brief and positive'],
 'beginner',
 'Dear Ms. Rivera,

Thank you so much for offering me the Project Coordinator position at GreenLeaf Solutions. I am delighted to accept the offer and look forward to joining the team.

I confirm that I will start on Monday, September 15th, as discussed. Please let me know if there is anything you need from me before my first day.

I am excited to contribute to the team and to get started.

Best regards,
Jordan',
 false, true, 2)
on conflict (slug) do nothing;

-- Scenario 3: requesting-time-off (Pack 2)
insert into scenarios (id, pack_id, title, slug, context, goal, tone, criteria, difficulty, model_response, is_demo, is_active, sort_order) values
('b0000000-0002-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
 'Requesting Time Off', 'requesting-time-off',
 'You need to take next Friday off for a family commitment. Your manager prefers a short, polite email with the date and a brief reason. Write a concise leave request that is professional without oversharing.',
 'Write a short email to your manager requesting one day off, stating the date and reason clearly, and offering to plan around it.',
 'polite', ARRAY['State the request clearly in the first sentence','Give the exact date','Provide a brief, appropriate reason','Offer to plan work around the absence','Keep the email concise'],
 'beginner',
 'Hi Mark,

I would like to request Friday, October 10th off for a family commitment. I will make sure all my current tasks are up to date before I leave, and I am happy to prepare a handover note for the team.

Please let me know if that works for you.

Thank you,
Sam',
 false, true, 1)
on conflict (slug) do nothing;

-- Scenario 4: following-up-on-task (Pack 2)
insert into scenarios (id, pack_id, title, slug, context, goal, tone, criteria, difficulty, model_response, is_demo, is_active, sort_order) values
('b0000000-0002-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
 'Following Up on a Task', 'following-up-on-task',
 'You sent a report draft to your colleague Dana three days ago and have not heard back yet. The deadline is approaching. Write a short, friendly follow-up email to check in without sounding accusatory or impatient.',
 'Write a polite follow-up email that reminds a colleague about a pending task while maintaining a friendly, collaborative tone.',
 'friendly', ARRAY['Open with a friendly greeting','Reference the original task and date','Ask about progress without pressure','Offer help if needed','End with a positive tone'],
 'beginner',
 'Hi Dana,

I hope your week is going well. I just wanted to check in on the report draft I sent over on Monday. I know things can get busy, so please do not feel rushed.

If you have had a chance to review it, I would love to hear your thoughts when you are ready. Let me know if you need anything from my side.

Thanks so much,
Riley',
 false, true, 2)
on conflict (slug) do nothing;

-- Scenario 5: restaurant-reservation (Pack 3)
insert into scenarios (id, pack_id, title, slug, context, goal, tone, criteria, difficulty, model_response, is_demo, is_active, sort_order) values
('b0000000-0003-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003',
 'Making a Restaurant Reservation', 'restaurant-reservation',
 'You want to book a table for four people at La Piazza, a popular Italian restaurant, for Saturday evening at 7:30 PM. You also want to mention that one guest has a nut allergy. Write a short, polite reservation email.',
 'Write a concise email to request a dinner reservation, including the date, time, party size, and a dietary note.',
 'polite', ARRAY['State the purpose and restaurant name in the first sentence','Specify the date, time, and number of guests','Mention the allergy clearly and politely','Ask for confirmation','Keep the email brief'],
 'beginner',
 'Hello,

I would like to make a reservation for dinner at La Piazza on Saturday evening, March 8th, at 7:30 PM. We will be a party of four.

I also wanted to let you know that one of our guests has a nut allergy. I would appreciate it if you could accommodate this.

Please confirm the reservation at your earliest convenience.

Thank you,
Morgan',
 false, true, 1)
on conflict (slug) do nothing;

-- Scenario 6: contacting-customer-support (Pack 3)
insert into scenarios (id, pack_id, title, slug, context, goal, tone, criteria, difficulty, model_response, is_demo, is_active, sort_order) values
('b0000000-0003-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003',
 'Contacting Customer Support', 'contacting-customer-support',
 'The wireless headphones you ordered from SoundBox arrived with a defect — the left earbud produces no sound. You need to contact customer support to explain the problem and request a replacement. Write a clear, polite email with your order number.',
 'Write a concise complaint email that clearly describes the issue, provides the order number, and requests a replacement or refund.',
 'polite', ARRAY['State the purpose clearly in the first sentence','Include the order number','Describe the problem factually','State what resolution you want','End with a polite thank you'],
 'beginner',
 'Subject: Order #SB-48291 — Defective Item

Dear SoundBox Support Team,

I am writing to report a problem with my recent order. I received my package yesterday, but unfortunately the left earbud of the wireless headphones does not produce any sound.

My order number is SB-48291. I have tried charging the device and resetting it as suggested in the manual, but the issue persists.

I would like to request a replacement as soon as possible. Please let me know what steps I need to take next.

Thank you for your help,
Casey',
 false, true, 2)
on conflict (slug) do nothing;
