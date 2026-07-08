/**
 * FluentDraft — Daily Life & Adulting scenario pack seed
 *
 * Practical English for everyday situations: reservations, customer support,
 * invitations, and other real-world adulting moments.
 */
import type { SeedPack } from '../seed-schema';

const dailyLifeAdulting = {
  slug: 'daily-life-adulting',
  title: 'Daily Life & Adulting',
  description:
    'Practice writing the messages that pop up in daily life: making reservations, ' +
    'contacting customer support, replying to invitations, and handling everyday ' +
    'situations with confidence.',
  sortOrder: 3,
  scenarios: [
    // =========================================================================
    // Scenario 1 — Making a Restaurant Reservation
    // =========================================================================
    {
      slug: 'restaurant-reservation',
      title: 'Making a Restaurant Reservation',
      context:
        'You want to book a table for four people at La Piazza, a popular Italian ' +
        'restaurant, for Saturday evening at 7:30 PM. You also want to mention ' +
        'that one guest has a nut allergy. Write a short, polite reservation email.',
      goal: 'Write a concise email to request a dinner reservation, including the date, time, party size, and a dietary note.',
      tone: 'polite',
      difficulty: 'beginner' as const,
      criteria: [
        'State the purpose and restaurant name in the first sentence',
        'Specify the date, time, and number of guests',
        'Mention the allergy clearly and politely',
        'Ask for confirmation',
        'Keep the email brief',
      ],
      modelResponse:
        'Hello,\n\n' +
        'I would like to make a reservation for dinner at La Piazza on ' +
        'Saturday evening, March 8th, at 7:30 PM. We will be a party of four.\n\n' +
        'I also wanted to let you know that one of our guests has a nut ' +
        'allergy. I would appreciate it if you could accommodate this.\n\n' +
        'Please confirm the reservation at your earliest convenience.\n\n' +
        'Thank you,\n' +
        'Morgan',
      isDemo: false,

      chunks: [
        {
          order: 1,
          text: 'Hello,\n\nI would like to make a reservation for dinner at La Piazza on Saturday evening, March 8th, at 7:30 PM.',
          audioText:
            'Hello. I would like to make a reservation for dinner at La Piazza on Saturday evening, March 8th, at 7:30 PM.',
        },
        {
          order: 2,
          text: 'We will be a party of four.',
        },
        {
          order: 3,
          text: 'I also wanted to let you know that one of our guests has a nut allergy.',
          audioText:
            'I also wanted to let you know that one of our guests has a nut allergy.',
        },
        {
          order: 4,
          text: 'I would appreciate it if you could accommodate this.',
        },
        {
          order: 5,
          text: 'Please confirm the reservation at your earliest convenience.\n\nThank you,\nMorgan',
          audioText:
            'Please confirm the reservation at your earliest convenience. Thank you, Morgan.',
        },
      ],

      keyPhrases: [
        {
          order: 1,
          text: 'I would like to make a reservation for',
          meaning: 'The standard polite opening for booking a table, room, or appointment.',
          example: 'I would like to make a reservation for two on Friday evening.',
          commonMistake:
            '"I want to book a table" is informal. Use "make a reservation" in written communication.',
          pronunciationRequired: true,
        },
        {
          order: 2,
          text: 'We will be a party of',
          meaning: 'A formal way to state the number of people in your group.',
          example: 'We will be a party of six for the birthday dinner.',
          commonMistake:
            '"A party of" is the standard restaurant phrase. Do not say "a group of" — it sounds less natural in this context.',
          pronunciationRequired: true,
        },
        {
          order: 3,
          text: 'I also wanted to let you know that',
          meaning: 'A gentle transition phrase for adding important information.',
          example: 'I also wanted to let you know that we will arrive a few minutes early.',
          commonMistake:
            '"I also want to inform you" is grammatically correct but overly formal. The past-tense "wanted" softens the tone.',
          pronunciationRequired: false,
        },
        {
          order: 4,
          text: 'I would appreciate it if you could',
          meaning: 'A very polite way to make a request while showing respect.',
          example: 'I would appreciate it if you could send me the menu in advance.',
          commonMistake:
            'The structure is "I would appreciate it if you could" + base verb. Do not use "can" instead of "could."',
          pronunciationRequired: true,
        },
        {
          order: 5,
          text: 'at your earliest convenience',
          meaning: 'A formal, polite way to say "as soon as you can" without pressure.',
          example: 'Please reply at your earliest convenience.',
          commonMistake:
            '"At your earliest" is incomplete — always include "convenience." Also, avoid using this phrase in very casual messages.',
          pronunciationRequired: false,
        },
      ],

      translations: [
        {
          languageCode: 'ar',
          sourceType: 'model_response',
          sourceKey: 'model',
          text: 'مرحبًا،\n\nأود إجراء حجز للعشاء في لا بيازا مساء السبت 8 مارس، الساعة 7:30 مساءً. سنكون مجموعة من أربعة أشخاص.\n\nكما أردت إعلامكم أن أحد ضيوفنا يعاني من حساسية تجاه المكسرات. سأكون ممتنًا لو تمكنتم من استيعاب ذلك.\n\nمن فضلكم أكدوا الحجز في أقرب وقت ممكن.\n\nشكرًا،\nمورجان',
        },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-1', text: 'أود إجراء حجز لـ' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-2', text: 'سنكون مجموعة من' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-3', text: 'كما أردت إعلامكم أن' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-4', text: 'سأكون ممتنًا لو تمكنتم من' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-5', text: 'في أقرب وقت ممكن' },
      ],

      recallBlanks: [
        {
          phraseOrder: 1,
          blankedText:
            '___ dinner at La Piazza on Saturday evening, March 8th, at 7:30 PM.',
        },
        {
          phraseOrder: 2,
          blankedText:
            '___ four.',
        },
        {
          phraseOrder: 3,
          blankedText:
            '___ one of our guests has a nut allergy.',
        },
        {
          phraseOrder: 4,
          blankedText:
            '___ accommodate this.',
        },
      ],
    },

    // =========================================================================
    // Scenario 2 — Contacting Customer Support
    // =========================================================================
    {
      slug: 'contacting-customer-support',
      title: 'Contacting Customer Support',
      context:
        'The wireless headphones you ordered from SoundBox arrived with a ' +
        'defect — the left earbud produces no sound. You need to contact ' +
        'customer support to explain the problem and request a replacement. ' +
        'Write a clear, polite email with your order number.',
      goal: 'Write a concise complaint email that clearly describes the issue, provides the order number, and requests a replacement or refund.',
      tone: 'polite',
      difficulty: 'beginner' as const,
      criteria: [
        'State the purpose clearly in the first sentence',
        'Include the order number',
        'Describe the problem factually',
        'State what resolution you want',
        'End with a polite thank you',
      ],
      modelResponse:
        'Subject: Order #SB-48291 — Defective Item\n\n' +
        'Dear SoundBox Support Team,\n\n' +
        'I am writing to report a problem with my recent order. I received ' +
        'my package yesterday, but unfortunately the left earbud of the ' +
        'wireless headphones does not produce any sound.\n\n' +
        'My order number is SB-48291. I have tried charging the device and ' +
        'resetting it as suggested in the manual, but the issue persists.\n\n' +
        'I would like to request a replacement as soon as possible. Please ' +
        'let me know what steps I need to take next.\n\n' +
        'Thank you for your help,\n' +
        'Casey',
      isDemo: false,

      chunks: [
        {
          order: 1,
          text: 'Subject: Order #SB-48291 — Defective Item\n\nDear SoundBox Support Team,\n\nI am writing to report a problem with my recent order.',
          audioText:
            'Subject: Order number SB-48291, Defective Item. Dear SoundBox Support Team. I am writing to report a problem with my recent order.',
        },
        {
          order: 2,
          text: 'I received my package yesterday, but unfortunately the left earbud of the wireless headphones does not produce any sound.',
          audioText:
            'I received my package yesterday, but unfortunately the left earbud of the wireless headphones does not produce any sound.',
        },
        {
          order: 3,
          text: 'My order number is SB-48291. I have tried charging the device and resetting it as suggested in the manual, but the issue persists.',
          audioText:
            'My order number is SB-48291. I have tried charging the device and resetting it as suggested in the manual, but the issue persists.',
        },
        {
          order: 4,
          text: 'I would like to request a replacement as soon as possible.',
        },
        {
          order: 5,
          text: 'Please let me know what steps I need to take next.\n\nThank you for your help,\nCasey',
          audioText:
            'Please let me know what steps I need to take next. Thank you for your help, Casey.',
        },
      ],

      keyPhrases: [
        {
          order: 1,
          text: 'I am writing to report a problem with',
          meaning: 'A clear, direct opening for a complaint or issue-report email.',
          example: 'I am writing to report a problem with my account access.',
          commonMistake:
            '"I am writing to complain about" is too aggressive for a first contact. "Report a problem" is neutral and constructive.',
          pronunciationRequired: true,
        },
        {
          order: 2,
          text: 'does not produce any sound',
          meaning: 'A factual way to describe a specific product defect — use "does not" + verb for clear complaints.',
          example: 'The microphone does not pick up any sound during calls.',
          commonMistake:
            '"Does not work" is too vague. Always describe the specific symptom in customer support emails.',
          pronunciationRequired: false,
        },
        {
          order: 3,
          text: 'the issue persists',
          meaning: 'A concise way to state that a problem continues despite attempted solutions.',
          example: 'I restarted the application, but the issue persists.',
          commonMistake:
            '"The problem still exists" is correct but "persists" is more professional and commonly used in support contexts.',
          pronunciationRequired: true,
        },
        {
          order: 4,
          text: 'I would like to request a replacement',
          meaning: 'A polite, direct way to ask for a new item to replace a defective one.',
          example: 'I would like to request a replacement for the damaged book.',
          commonMistake:
            '"I want a refund" can sound demanding. Always explain the issue first, then state your preferred resolution politely.',
          pronunciationRequired: true,
        },
        {
          order: 5,
          text: 'Please let me know what steps I need to take next',
          meaning: 'A cooperative closing that invites the support team to guide you through their process.',
          example: 'Please let me know what steps I need to take next to return the item.',
          commonMistake:
            '"Tell me what to do next" can sound rude. The polite version includes "please" and frames it as a request for guidance.',
          pronunciationRequired: false,
        },
      ],

      translations: [
        {
          languageCode: 'ar',
          sourceType: 'model_response',
          sourceKey: 'model',
          text: 'الموضوع: طلب رقم SB-48291 — منتج معيب\n\nعزيزي فريق دعم ساوند بوكس،\n\nأكتب إليكم للإبلاغ عن مشكلة في طلبي الأخير. استلمت الطرد بالأمس، ولكن للأسف السماعة اليسرى من سماعات الرأس اللاسلكية لا تصدر أي صوت.\n\nرقم طلبي هو SB-48291. حاولت شحن الجهاز وإعادة ضبطه كما هو مقترح في الدليل، ولكن المشكلة مستمرة.\n\nأود طلب استبدال في أقرب وقت ممكن. من فضلكم أعلموني ما هي الخطوات التي يجب علي اتخاذها بعد ذلك.\n\nشكرًا لمساعدتكم،\nكيسي',
        },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-1', text: 'أكتب إليكم للإبلاغ عن مشكلة في' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-2', text: 'لا يصدر أي صوت' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-3', text: 'المشكلة مستمرة' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-4', text: 'أود طلب استبدال' },
        { languageCode: 'ar', sourceType: 'key_phrase', sourceKey: 'phrase-5', text: 'من فضلكم أعلموني ما هي الخطوات التي يجب علي اتخاذها بعد ذلك' },
      ],

      recallBlanks: [
        {
          phraseOrder: 1,
          blankedText:
            '___ my recent order.',
        },
        {
          phraseOrder: 2,
          blankedText:
            'I received my package yesterday, but unfortunately the left earbud of the wireless headphones ___.',
        },
        {
          phraseOrder: 3,
          blankedText:
            'I have tried charging the device and resetting it as suggested in the manual, but ___.',
        },
        {
          phraseOrder: 4,
          blankedText:
            '___ as soon as possible.',
        },
        {
          phraseOrder: 5,
          blankedText:
            '___.\n\nThank you for your help,\nCasey',
        },
      ],
    },
  ],
} satisfies SeedPack;

export default dailyLifeAdulting;
