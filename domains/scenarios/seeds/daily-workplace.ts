/**
 * FluentDraft — Daily Workplace scenario pack seed
 *
 * Practical workplace communication: leave requests, task follow-ups,
 * meeting scheduling, and team updates.
 */
import type { SeedPack } from '../seed-schema';

const dailyWorkplace = {
  slug: 'daily-workplace',
  title: 'Daily Workplace',
  description:
    'Practice writing the everyday emails and messages that keep work moving: ' +
    'time-off requests, task follow-ups, meeting invites, and quick team updates.',
  sortOrder: 2,
  scenarios: [
    // =========================================================================
    // Scenario 1 — Requesting Time Off
    // =========================================================================
    {
      slug: 'requesting-time-off',
      title: 'Requesting Time Off',
      context:
        'You need to take next Friday off for a family commitment. Your manager ' +
        'prefers a short, polite email with the date and a brief reason. ' +
        'Write a concise leave request that is professional without oversharing.',
      goal: 'Write a short email to your manager requesting one day off, stating the date and reason clearly, and offering to plan around it.',
      tone: 'polite',
      difficulty: 'beginner' as const,
      criteria: [
        'State the request clearly in the first sentence',
        'Give the exact date',
        'Provide a brief, appropriate reason',
        'Offer to plan work around the absence',
        'Keep the email concise',
      ],
      modelResponse:
        'Hi Mark,\n\n' +
        'I would like to request Friday, October 10th off for a family commitment. ' +
        'I will make sure all my current tasks are up to date before I leave, and ' +
        'I am happy to prepare a handover note for the team.\n\n' +
        'Please let me know if that works for you.\n\n' +
        'Thank you,\n' +
        'Sam',
      isDemo: false,

      chunks: [
        {
          order: 1,
          text: 'Hi Mark,\n\nI would like to request Friday, October 10th off for a family commitment.',
          audioText:
            'Hi Mark. I would like to request Friday, October 10th off for a family commitment.',
        },
        {
          order: 2,
          text: 'I will make sure all my current tasks are up to date before I leave,',
        },
        {
          order: 3,
          text: 'and I am happy to prepare a handover note for the team.',
          audioText:
            'and I am happy to prepare a handover note for the team.',
        },
        {
          order: 4,
          text: 'Please let me know if that works for you.\n\nThank you,\nSam',
          audioText: 'Please let me know if that works for you. Thank you, Sam.',
        },
      ],

      keyPhrases: [
        {
          order: 1,
          text: 'I would like to request',
          meaning: 'A polite and direct way to ask for something in a workplace email.',
          example: 'I would like to request a meeting to discuss the project timeline.',
          commonMistake:
            'Avoid "I want to request" — "would like" is softer and more professional.',
          pronunciationRequired: true,
        },
        {
          order: 2,
          text: 'off for a family commitment',
          meaning: 'A brief, professional way to state the reason for leave without oversharing.',
          example: 'I need Tuesday off for a family commitment.',
          commonMistake:
            'Do not say "off for personal reasons" which can sound vague or secretive. "Family commitment" is specific enough without being too personal.',
          pronunciationRequired: false,
        },
        {
          order: 3,
          text: 'I will make sure all my current tasks are up to date',
          meaning: 'A responsible assurance that work will not be left undone.',
          example: 'I will make sure all my current tasks are up to date before the weekend.',
          commonMistake:
            '"Up to date" is three words — do not hyphenate it as "up-to-date" when used after a noun.',
          pronunciationRequired: true,
        },
        {
          order: 4,
          text: 'prepare a handover note',
          meaning: 'To write a short summary for colleagues covering what needs attention while you are away.',
          example: 'I will prepare a handover note for the team before I go on leave.',
          commonMistake:
            '"Handover" is one word in British English; in American English "hand-off" is sometimes used but "handover" is understood in both.',
          pronunciationRequired: true,
        },
        {
          order: 5,
          text: 'Please let me know if that works for you',
          meaning: 'A respectful way to ask for confirmation or approval.',
          example: 'Please let me know if that works for you and I will block the calendar.',
          commonMistake:
            'Avoid "if that is okay for you" — "works for you" is more natural in professional English.',
          pronunciationRequired: false,
        },
      ],

      translations: [
        {
          languageCode: 'ar',
          sourceType: 'model_response',
          sourceKey: 'model',
          text: 'مرحبًا مارك،\n\nأود أن أطلب إجازة يوم الجمعة 10 أكتوبر لالتزام عائلي. سأتأكد من أن جميع مهامي الحالية محدثة قبل مغادرتي، وسأكون سعيدًا بإعداد مذكرة تسليم للفريق.\n\nمن فضلك أعلمني إذا كان ذلك مناسبًا لك.\n\nشكرًا،\nسام',
        },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-1', text: 'أود أن أطلب' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-2', text: 'إجازة لالتزام عائلي' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-3', text: 'سأتأكد من أن جميع مهامي الحالية محدثة' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-4', text: 'إعداد مذكرة تسليم' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-5', text: 'من فضلك أعلمني إذا كان ذلك مناسبًا لك' },
      ],

      recallBlanks: [
        {
          phraseOrder: 1,
          blankedText:
            '___ Friday, October 10th off for a family commitment.',
        },
        {
          phraseOrder: 3,
          blankedText:
            '___ before I leave, and I am happy to prepare a handover note for the team.',
        },
        {
          phraseOrder: 4,
          blankedText:
            'and I am happy to ___ for the team.',
        },
        {
          phraseOrder: 5,
          blankedText:
            '___.\n\nThank you,\nSam',
        },
      ],
    },

    // =========================================================================
    // Scenario 2 — Following Up on a Task
    // =========================================================================
    {
      slug: 'following-up-on-task',
      title: 'Following Up on a Task',
      context:
        'You sent a report draft to your colleague Dana three days ago and ' +
        'have not heard back yet. The deadline is approaching. ' +
        'Write a short, friendly follow-up email to check in without sounding ' +
        'accusatory or impatient.',
      goal: 'Write a polite follow-up email that reminds a colleague about a pending task while maintaining a friendly, collaborative tone.',
      tone: 'friendly',
      difficulty: 'beginner' as const,
      criteria: [
        'Open with a friendly greeting',
        'Reference the original task and date',
        'Ask about progress without pressure',
        'Offer help if needed',
        'End with a positive tone',
      ],
      modelResponse:
        'Hi Dana,\n\n' +
        'I hope your week is going well. I just wanted to check in on the ' +
        'report draft I sent over on Monday. I know things can get busy, so ' +
        'please do not feel rushed.\n\n' +
        'If you have had a chance to review it, I would love to hear your ' +
        'thoughts when you are ready. Let me know if you need anything ' +
        'from my side.\n\n' +
        'Thanks so much,\n' +
        'Riley',
      isDemo: false,

      chunks: [
        {
          order: 1,
          text: 'Hi Dana,\n\nI hope your week is going well.',
          audioText: 'Hi Dana. I hope your week is going well.',
        },
        {
          order: 2,
          text: 'I just wanted to check in on the report draft I sent over on Monday.',
          audioText:
            'I just wanted to check in on the report draft I sent over on Monday.',
        },
        {
          order: 3,
          text: 'I know things can get busy, so please do not feel rushed.',
        },
        {
          order: 4,
          text: 'If you have had a chance to review it, I would love to hear your thoughts when you are ready.',
          audioText:
            'If you have had a chance to review it, I would love to hear your thoughts when you are ready.',
        },
        {
          order: 5,
          text: 'Let me know if you need anything from my side.\n\nThanks so much,\nRiley',
          audioText: 'Let me know if you need anything from my side. Thanks so much, Riley.',
        },
      ],

      keyPhrases: [
        {
          order: 1,
          text: 'I hope your week is going well',
          meaning: 'A warm, friendly opener that softens a follow-up email.',
          example: 'I hope your week is going well and you are settling into the new project.',
          commonMistake:
            '"I hope you are doing well" is fine but more generic. Mentioning "week" or "day" sounds more personal.',
          pronunciationRequired: false,
        },
        {
          order: 2,
          text: 'I just wanted to check in on',
          meaning: 'A gentle way to follow up without sounding demanding.',
          example: 'I just wanted to check in on the proposal we discussed last week.',
          commonMistake:
            'Avoid "I am following up on" in a first reminder — it can sound too formal. "Check in on" is friendlier.',
          pronunciationRequired: true,
        },
        {
          order: 3,
          text: 'please do not feel rushed',
          meaning: 'A courteous phrase that removes pressure from the recipient.',
          example: 'Take your time reviewing the document — please do not feel rushed.',
          commonMistake:
            '"Please do not rush" has a different meaning (it tells someone not to hurry themselves). "Do not feel rushed" is about their feeling, not their action.',
          pronunciationRequired: true,
        },
        {
          order: 4,
          text: 'I would love to hear your thoughts',
          meaning: 'An inviting and respectful way to ask for feedback.',
          example: 'I would love to hear your thoughts on the design direction.',
          commonMistake:
            '"I would like your feedback" is direct but less warm. "Love to hear your thoughts" builds collaboration.',
          pronunciationRequired: true,
        },
        {
          order: 5,
          text: 'Let me know if you need anything from my side',
          meaning: 'An offer of support that keeps the collaboration open.',
          example: 'Let me know if you need anything from my side to move this forward.',
          commonMistake:
            '"From my side" is a natural English idiom. "From my end" is also acceptable but slightly more casual.',
          pronunciationRequired: false,
        },
      ],

      translations: [
        {
          languageCode: 'ar',
          sourceType: 'model_response',
          sourceKey: 'model',
          text: 'مرحبًا دانا،\n\nأتمنى أن يكون أسبوعك يسير على ما يرام. أردت فقط أن أطمئن على مسودة التقرير التي أرسلتها يوم الاثنين. أعلم أن الأمور قد تصبح مزدحمة، لذا من فضلك لا تشعري بالاستعجال.\n\nإذا سنحت لك فرصة لمراجعتها، سأحب سماع أفكارك عندما تكونين مستعدة. أعلميني إذا كنت بحاجة إلى أي شيء من جانبي.\n\nشكرًا جزيلاً،\nرايلي',
        },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-1', text: 'أتمنى أن يكون أسبوعك يسير على ما يرام' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-2', text: 'أردت فقط أن أطمئن على' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-3', text: 'من فضلك لا تشعر بالاستعجال' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-4', text: 'سأحب سماع أفكارك' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-5', text: 'أعلميني إذا كنت بحاجة إلى أي شيء من جانبي' },
      ],

      recallBlanks: [
        {
          phraseOrder: 1,
          blankedText:
            'Hi Dana,\n\n___.',
        },
        {
          phraseOrder: 2,
          blankedText:
            '___ the report draft I sent over on Monday.',
        },
        {
          phraseOrder: 3,
          blankedText:
            'I know things can get busy, so ___.',
        },
        {
          phraseOrder: 4,
          blankedText:
            'If you have had a chance to review it, ___ when you are ready.',
        },
        {
          phraseOrder: 5,
          blankedText:
            '___.\n\nThanks so much,\nRiley',
        },
      ],
    },
  ],
} satisfies SeedPack;

export default dailyWorkplace;
