/**
 * FluentDraft — Job Hunt & Career scenario pack seed
 *
 * Practical email and message scenarios for job seekers:
 * cover letters, offer replies, and professional communication.
 */
import type { SeedPack } from '../seed-schema';

const jobHuntCareer = {
  slug: 'job-hunt-career',
  title: 'Job Hunt & Career',
  description:
    'Practice writing professional emails and messages for job applications, ' +
    'interview follow-ups, and offer replies. Build the confidence to communicate ' +
    'clearly and politely at every stage of your job search.',
  sortOrder: 1,
  scenarios: [
    // =========================================================================
    // Scenario 1 — Cover Letter Opening
    // =========================================================================
    {
      slug: 'cover-letter-opening',
      title: 'Writing a Cover Letter Opening',
      context:
        'You found a Graphic Designer job posting at Studio Nine on LinkedIn. ' +
        'You have four years of design experience and a strong portfolio. ' +
        'Write the opening paragraph of your cover letter — introduce yourself, ' +
        'state the role you are applying for, and mention your key qualifications.',
      goal: 'Write a clear cover letter opening that states the role, where you saw it, and your top qualifications in two concise sentences.',
      tone: 'professional',
      difficulty: 'beginner' as const,
      criteria: [
        'Address the hiring manager correctly',
        'State the position title and company name',
        'Mention where you found the job posting',
        'Highlight one or two key qualifications',
        'Keep it to a single short paragraph',
      ],
      modelResponse:
        'Dear Hiring Manager,\n\n' +
        'I am writing to express my interest in the Graphic Designer position ' +
        'at Studio Nine, as advertised on LinkedIn. With over four years of ' +
        'experience in brand design and a strong portfolio of client work, ' +
        'I believe I would be a great fit for your creative team.',
      isDemo: false,

      chunks: [
        {
          order: 1,
          text: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Graphic Designer position at Studio Nine, as advertised on LinkedIn.',
          audioText:
            'Dear Hiring Manager. I am writing to express my interest in the Graphic Designer position at Studio Nine, as advertised on LinkedIn.',
        },
        {
          order: 2,
          text: 'With over four years of experience in brand design',
        },
        {
          order: 3,
          text: 'and a strong portfolio of client work,',
        },
        {
          order: 4,
          text: 'I believe I would be a great fit for your creative team.',
        },
      ],

      keyPhrases: [
        {
          order: 1,
          text: 'I am writing to express my interest in',
          meaning: 'A standard formal opening for cover letters and application emails.',
          example: 'I am writing to express my interest in the Sales Manager role.',
          commonMistake:
            'Using "I am writing to apply for" is also correct but less formal than "express my interest in."',
          pronunciationRequired: false,
        },
        {
          order: 2,
          text: 'as advertised on',
          meaning: 'A concise way to say where you found the job listing.',
          example: 'I am applying for the role as advertised on your company website.',
          commonMistake:
            'Do not write "as per your advertisement on" — too formal and outdated.',
          pronunciationRequired: false,
        },
        {
          order: 3,
          text: 'With over four years of experience in',
          meaning: 'A strong phrase to introduce the length and domain of your professional background.',
          example: 'With over five years of experience in project management, I am confident I can contribute immediately.',
          commonMistake:
            'Avoid "I have 4 years experience" — include the preposition "of" and write out small numbers in formal letters.',
          pronunciationRequired: true,
        },
        {
          order: 4,
          text: 'a strong portfolio of client work',
          meaning: 'A phrase creative professionals use to summarise their body of work.',
          example: 'I bring a strong portfolio of client work across multiple industries.',
          commonMistake:
            '"a strong client portfolio" is acceptable, but "a strong portfolio of client work" sounds more complete.',
          pronunciationRequired: false,
        },
        {
          order: 5,
          text: 'I believe I would be a great fit for',
          meaning: 'A confident but polite way to express that you match the role.',
          example: 'I believe I would be a great fit for your marketing department.',
          commonMistake:
            'Overusing "I think" instead of "I believe" — "believe" sounds more professional.',
          pronunciationRequired: true,
        },
      ],

      translations: [
        {
          languageCode: 'ar',
          sourceType: 'model_response',
          sourceKey: 'model',
          text: 'عزيزي مدير التوظيف،\n\nأكتب إليكم للتعبير عن اهتمامي بوظيفة مصمم جرافيك في استوديو ناين، كما هو معلن على لينكد إن. مع أكثر من أربع سنوات من الخبرة في تصميم العلامات التجارية ومحفظة قوية من أعمال العملاء، أعتقد أنني سأكون مناسبًا تمامًا لفريقكم الإبداعي.',
        },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-1', text: 'أكتب إليكم للتعبير عن اهتمامي بـ' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-2', text: 'كما هو معلن على' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-3', text: 'مع أكثر من أربع سنوات من الخبرة في' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-4', text: 'محفظة قوية من أعمال العملاء' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-5', text: 'أعتقد أنني سأكون مناسبًا تمامًا لـ' },
      ],

      recallBlanks: [
        {
          phraseOrder: 1,
          blankedText:
            '___ the Graphic Designer position at Studio Nine, as advertised on LinkedIn.',
        },
        {
          phraseOrder: 3,
          blankedText:
            '___ brand design and a strong portfolio of client work, I believe I would be a great fit for your creative team.',
        },
        {
          phraseOrder: 5,
          blankedText:
            'With over four years of experience in brand design and a strong portfolio of client work, ___ your creative team.',
        },
      ],
    },

    // =========================================================================
    // Scenario 2 — Accepting a Job Offer
    // =========================================================================
    {
      slug: 'accepting-a-job-offer',
      title: 'Accepting a Job Offer',
      context:
        'You just received a formal job offer from GreenLeaf Solutions for a ' +
        'Project Coordinator role. The offer includes the salary and start date ' +
        'you discussed. Write a short, professional email to accept the offer, ' +
        'confirm the start date, and express your enthusiasm.',
      goal: 'Write a concise job offer acceptance email that confirms you accept, repeats the key terms, and ends on a positive note.',
      tone: 'professional',
      difficulty: 'beginner' as const,
      criteria: [
        'Thank the sender for the offer',
        'Clearly state that you accept',
        'Confirm the start date',
        'Express enthusiasm for joining the team',
        'Keep the email brief and positive',
      ],
      modelResponse:
        'Dear Ms. Rivera,\n\n' +
        'Thank you so much for offering me the Project Coordinator position ' +
        'at GreenLeaf Solutions. I am delighted to accept the offer and look ' +
        'forward to joining the team.\n\n' +
        'I confirm that I will start on Monday, September 15th, as discussed. ' +
        'Please let me know if there is anything you need from me before my ' +
        'first day.\n\n' +
        'I am excited to contribute to the team and to get started.\n\n' +
        'Best regards,\n' +
        'Jordan',
      isDemo: false,

      chunks: [
        {
          order: 1,
          text: 'Dear Ms. Rivera,\n\nThank you so much for offering me the Project Coordinator position at GreenLeaf Solutions.',
          audioText:
            'Dear Ms. Rivera. Thank you so much for offering me the Project Coordinator position at GreenLeaf Solutions.',
        },
        {
          order: 2,
          text: 'I am delighted to accept the offer and look forward to joining the team.',
        },
        {
          order: 3,
          text: 'I confirm that I will start on Monday, September 15th, as discussed.',
        },
        {
          order: 4,
          text: 'Please let me know if there is anything you need from me before my first day.',
          audioText:
            'Please let me know if there is anything you need from me before my first day.',
        },
        {
          order: 5,
          text: 'I am excited to contribute to the team and to get started.\n\nBest regards,\nJordan',
          audioText:
            'I am excited to contribute to the team and to get started. Best regards, Jordan.',
        },
      ],

      keyPhrases: [
        {
          order: 1,
          text: 'Thank you so much for offering me',
          meaning: 'A warm, grateful opening for accepting a job offer.',
          example: 'Thank you so much for offering me the internship opportunity.',
          commonMistake:
            'Avoid "Thank you for offering me the job" — it sounds abrupt. Add "so much" or "very much" for warmth.',
          pronunciationRequired: true,
        },
        {
          order: 2,
          text: 'I am delighted to accept the offer',
          meaning: 'A clear, positive statement that you are saying yes to the job.',
          example: 'I am delighted to accept the offer and join your engineering team.',
          commonMistake:
            '"I am happy to accept" is also fine, but "delighted" shows stronger enthusiasm in professional English.',
          pronunciationRequired: true,
        },
        {
          order: 3,
          text: 'look forward to joining the team',
          meaning: 'A forward-looking phrase that shows eagerness to start.',
          example: 'I look forward to joining the team next month.',
          commonMistake:
            'Remember to use the gerund "joining," not the infinitive "to join," after "look forward to."',
          pronunciationRequired: false,
        },
        {
          order: 4,
          text: 'I confirm that I will start on',
          meaning: 'A clear way to restate the agreed start date in writing.',
          example: 'I confirm that I will start on Monday, June 3rd.',
          commonMistake:
            'Do not write "I am confirming" — use the simple present "I confirm" in formal correspondence.',
          pronunciationRequired: true,
        },
        {
          order: 5,
          text: 'Please let me know if there is anything you need from me',
          meaning: 'A polite closing offer to provide additional information before starting.',
          example: 'Please let me know if there is anything you need from me ahead of the onboarding.',
          commonMistake:
            'Avoid "if there is anything you need" without "from me" — the phrase is incomplete.',
          pronunciationRequired: false,
        },
        {
          order: 6,
          text: 'I am excited to contribute to the team',
          meaning: 'A positive closing that expresses motivation and team spirit.',
          example: 'I am excited to contribute to the team and learn from everyone.',
          commonMistake:
            '"I am excited to work with you" is fine, but "contribute to the team" sounds more proactive.',
          pronunciationRequired: false,
        },
      ],

      translations: [
        {
          languageCode: 'ar',
          sourceType: 'model_response',
          sourceKey: 'model',
          text: 'عزيزتي السيدة ريفيرا،\n\nشكرًا جزيلاً لعرضكم عليّ وظيفة منسق مشروع في جرين ليف سوليوشنز. يسعدني قبول العرض وأتطلع إلى الانضمام إلى الفريق.\n\nأؤكد أنني سأبدأ يوم الاثنين 15 سبتمبر، كما تم الاتفاق. من فضلكم أعلموني إذا كان هناك أي شيء تحتاجونه مني قبل يومي الأول.\n\nأنا متحمس للمساهمة في الفريق وللبدء.\n\nمع أطيب التحيات،\nجوردان',
        },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-1', text: 'شكرًا جزيلاً لعرضكم عليّ' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-2', text: 'يسعدني قبول العرض' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-3', text: 'أتطلع إلى الانضمام إلى الفريق' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-4', text: 'أؤكد أنني سأبدأ يوم' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-5', text: 'من فضلكم أعلموني إذا كان هناك أي شيء تحتاجونه مني' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-6', text: 'أنا متحمس للمساهمة في الفريق' },
      ],

      recallBlanks: [
        {
          phraseOrder: 1,
          blankedText:
            '___ the Project Coordinator position at GreenLeaf Solutions.',
        },
        {
          phraseOrder: 2,
          blankedText:
            '___ and look forward to joining the team.',
        },
        {
          phraseOrder: 4,
          blankedText:
            '___ Monday, September 15th, as discussed.',
        },
        {
          phraseOrder: 6,
          blankedText:
            '___ and to get started.\n\nBest regards,\nJordan',
        },
      ],
    },
  ],
} satisfies SeedPack;

export default jobHuntCareer;
