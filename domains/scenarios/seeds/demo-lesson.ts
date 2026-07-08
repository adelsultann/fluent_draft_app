/**
 * FluentDraft — Fixed demo lesson seed
 *
 * A polished, practical scenario: writing a professional follow-up email
 * after a job interview.  Serves as the single anonymous demo lesson that
 * first-time visitors can try without signing up.
 *
 * Uses the seed schema defined in ../seed-schema.ts.
 */

import type { SeedContent } from '../seed-schema';

// ---------------------------------------------------------------------------
// Translations — model response + key phrases for all 12 supported languages
// ---------------------------------------------------------------------------

const demoTranslations = [
  // ---- Arabic (ar) ----------------------------------------------------------
  { languageCode: 'ar', sourceType: 'model_response' as const, sourceKey: 'model', text: 'السيدة تشن،\n\nأردت أن أشكرك مرة أخرى على تخصيص وقت للتحدث معي حول وظيفة منسق التسويق. لقد استمتعت حقًا بمعرفة المزيد عن الفريق والمشاريع المثيرة التي تعمل عليها برايتباث.\n\nمحادثتنا عززت اهتمامي بالوظيفة. لقد كنت متحمسًا بشكل خاص لسماع مبادرة تحديث العلامة التجارية القادمة — تبدو فرصة يمكن أن تكون فيها خلفيتي في استراتيجية المحتوى ذات قيمة.\n\nمن فضلك لا تتردد في التواصل إذا كنت بحاجة إلى أي معلومات إضافية مني. أتطلع إلى الاستماع منك.\n\nمع أطيب التحيات،\nأليكس' },
  { languageCode: 'ar', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'شكرًا لك مرة أخرى على تخصيص الوقت' },
  { languageCode: 'ar', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'لقد استمتعت حقًا بمعرفة المزيد عن' },
  { languageCode: 'ar', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'عزز اهتمامي بالوظيفة' },
  { languageCode: 'ar', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'لا تتردد في التواصل' },
  { languageCode: 'ar', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'أتطلع إلى الاستماع منك' },
  { languageCode: 'ar', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'مع أطيب التحيات' },

  // ---- German (de) ----------------------------------------------------------
  { languageCode: 'de', sourceType: 'model_response' as const, sourceKey: 'model', text: 'Sehr geehrte Frau Chen,\n\nich möchte mich nochmals bei Ihnen bedanken, dass Sie sich die Zeit genommen haben, mit mir über die Stelle als Marketing-Koordinator zu sprechen. Es hat mich sehr gefreut, mehr über das Team und die spannenden Projekte zu erfahren, an denen BrightPath arbeitet.\n\nUnser Gespräch hat mein Interesse an der Stelle noch verstärkt. Besonders begeistert hat mich Ihre bevorstehende Marken-Auffrischungsinitiative — das klingt nach einer Gelegenheit, bei der mein Hintergrund in der Content-Strategie wertvoll sein könnte.\n\nBitte zögern Sie nicht, sich zu melden, falls Sie weitere Informationen von mir benötigen. Ich freue mich darauf, von Ihnen zu hören.\n\nMit freundlichen Grüßen,\nAlex' },
  { languageCode: 'de', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'vielen Dank, dass Sie sich die Zeit genommen haben' },
  { languageCode: 'de', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'Es hat mich sehr gefreut, mehr zu erfahren über' },
  { languageCode: 'de', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'hat mein Interesse an der Stelle noch verstärkt' },
  { languageCode: 'de', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'zögern Sie nicht, sich zu melden' },
  { languageCode: 'de', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'Ich freue mich darauf, von Ihnen zu hören' },
  { languageCode: 'de', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'Mit freundlichen Grüßen' },

  // ---- Spanish (es) ---------------------------------------------------------
  { languageCode: 'es', sourceType: 'model_response' as const, sourceKey: 'model', text: 'Estimada Sra. Chen:\n\nQuería agradecerle nuevamente por tomarse el tiempo para hablar conmigo sobre el puesto de Coordinador de Marketing. Disfruté mucho aprendiendo más sobre el equipo y los emocionantes proyectos en los que está trabajando BrightPath.\n\nNuestra conversación reforzó mi interés en el puesto. Me entusiasmó especialmente escuchar sobre su próxima iniciativa de renovación de marca: parece una oportunidad en la que mi experiencia en estrategia de contenido podría ser valiosa.\n\nNo dude en comunicarse si necesita información adicional de mi parte. Quedo a la espera de su respuesta.\n\nAtentamente,\nAlex' },
  { languageCode: 'es', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'gracias nuevamente por tomarse el tiempo' },
  { languageCode: 'es', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'Disfruté mucho aprendiendo más sobre' },
  { languageCode: 'es', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'reforzó mi interés en el puesto' },
  { languageCode: 'es', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'no dude en comunicarse' },
  { languageCode: 'es', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'Quedo a la espera de su respuesta' },
  { languageCode: 'es', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'Atentamente' },

  // ---- French (fr) ----------------------------------------------------------
  { languageCode: 'fr', sourceType: 'model_response' as const, sourceKey: 'model', text: 'Chère Madame Chen,\n\nJe tenais à vous remercier encore une fois d\'avoir pris le temps de me parler du poste de Coordinateur Marketing. J\'ai vraiment apprécié d\'en apprendre davantage sur l\'équipe et les projets passionnants sur lesquels BrightPath travaille.\n\nNotre conversation a renforcé mon intérêt pour le poste. J\'ai été particulièrement enthousiaste d\'entendre parler de votre initiative de rafraîchissement de marque — cela semble être une opportunité où mon expérience en stratégie de contenu pourrait être précieuse.\n\nN\'hésitez pas à me contacter si vous avez besoin d\'informations supplémentaires de ma part. Je me réjouis d\'avoir de vos nouvelles.\n\nCordialement,\nAlex' },
  { languageCode: 'fr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'merci encore d\'avoir pris le temps' },
  { languageCode: 'fr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'J\'ai vraiment apprécié d\'en apprendre davantage sur' },
  { languageCode: 'fr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'a renforcé mon intérêt pour le poste' },
  { languageCode: 'fr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'n\'hésitez pas à me contacter' },
  { languageCode: 'fr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'Je me réjouis d\'avoir de vos nouvelles' },
  { languageCode: 'fr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'Cordialement' },

  // ---- Hindi (hi) -----------------------------------------------------------
  { languageCode: 'hi', sourceType: 'model_response' as const, sourceKey: 'model', text: 'प्रिय सुश्री चेन,\n\nमैं विपणन समन्वयक पद के बारे में मुझसे बात करने के लिए समय निकालने के लिए आपको फिर से धन्यवाद देना चाहता हूँ। मुझे टीम और ब्राइटपाथ द्वारा किए जा रहे रोमांचक परियोजनाओं के बारे में अधिक जानकर वास्तव में अच्छा लगा।\n\nहमारी बातचीत ने इस भूमिका में मेरी रुचि को और मजबूत किया। मैं आपकी आगामी ब्रांड रिफ्रेश पहल के बारे में सुनकर विशेष रूप से उत्साहित था — यह एक ऐसा अवसर लगता है जहाँ सामग्री रणनीति में मेरी पृष्ठभूमि मूल्यवान हो सकती है।\n\nकृपया यदि आपको मुझसे कोई अतिरिक्त जानकारी चाहिए तो संपर्क करने में संकोच न करें। मुझे आपसे सुनने की प्रतीक्षा रहेगी।\n\nसादर,\nएलेक्स' },
  { languageCode: 'hi', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'समय निकालने के लिए फिर से धन्यवाद' },
  { languageCode: 'hi', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'मुझे वास्तव में अधिक जानकर अच्छा लगा' },
  { languageCode: 'hi', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'इस भूमिका में मेरी रुचि को और मजबूत किया' },
  { languageCode: 'hi', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'संपर्क करने में संकोच न करें' },
  { languageCode: 'hi', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'मुझे आपसे सुनने की प्रतीक्षा रहेगी' },
  { languageCode: 'hi', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'सादर' },

  // ---- Italian (it) ---------------------------------------------------------
  { languageCode: 'it', sourceType: 'model_response' as const, sourceKey: 'model', text: 'Gentile Signora Chen,\n\nvolevo ringraziarLa nuovamente per il tempo che mi ha dedicato per parlare della posizione di Coordinatore Marketing. Mi ha fatto molto piacere saperne di più sul team e sugli entusiasmanti progetti a cui BrightPath sta lavorando.\n\nLa nostra conversazione ha rafforzato il mio interesse per il ruolo. Sono rimasto particolarmente entusiasta di sentire della vostra prossima iniziativa di rinnovo del marchio — sembra un\'opportunità in cui la mia esperienza in strategia dei contenuti potrebbe essere preziosa.\n\nNon esiti a contattarmi se ha bisogno di ulteriori informazioni da parte mia. Resto in attesa di un Suo riscontro.\n\nCordiali saluti,\nAlex' },
  { languageCode: 'it', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'grazie ancora per il tempo dedicato' },
  { languageCode: 'it', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'Mi ha fatto molto piacere saperne di più su' },
  { languageCode: 'it', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'ha rafforzato il mio interesse per il ruolo' },
  { languageCode: 'it', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'non esiti a contattarmi' },
  { languageCode: 'it', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'Resto in attesa di un Suo riscontro' },
  { languageCode: 'it', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'Cordiali saluti' },

  // ---- Japanese (ja) --------------------------------------------------------
  { languageCode: 'ja', sourceType: 'model_response' as const, sourceKey: 'model', text: 'チェン様\n\nマーケティングコーディネーターのポジションについてお話しするお時間をいただき、改めて感謝申し上げます。チームやブライトパスが取り組んでいるエキサイティングなプロジェクトについて詳しく知ることができ、大変嬉しく思いました。\n\n今回の会話を通じて、このポジションへの関心がさらに高まりました。特に、今後のブランド刷新の取り組みについてお聞きし、私のコンテンツ戦略のバックグラウンドが活かせる機会だと感じ、非常に興奮しました。\n\n追加情報が必要な場合は、どうぞ遠慮なくご連絡ください。ご連絡をお待ちしております。\n\n敬具\nアレックス' },
  { languageCode: 'ja', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'お時間をいただき、改めて感謝申し上げます' },
  { languageCode: 'ja', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: '詳しく知ることができ、大変嬉しく思いました' },
  { languageCode: 'ja', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'このポジションへの関心がさらに高まりました' },
  { languageCode: 'ja', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'どうぞ遠慮なくご連絡ください' },
  { languageCode: 'ja', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'ご連絡をお待ちしております' },
  { languageCode: 'ja', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: '敬具' },

  // ---- Korean (ko) ----------------------------------------------------------
  { languageCode: 'ko', sourceType: 'model_response' as const, sourceKey: 'model', text: '첸 부장님께,\n\n마케팅 코디네이터 직무에 대해 이야기할 시간을 내어 주셔서 다시 한번 감사드립니다. 팀과 브라이트패스가 진행 중인 흥미로운 프로젝트들에 대해 더 알게 되어 정말 즐거웠습니다.\n\n저희 대화는 이 직무에 대한 제 관심을 더욱 확고히 했습니다. 특히 다가오는 브랜드 리프레시 이니셔티브에 대해 듣고 매우 기뻤습니다 — 제 콘텐츠 전략 배경이 가치 있을 수 있는 기회로 보입니다.\n\n추가 정보가 필요하시면 언제든지 연락 주십시오. 연락을 기다리겠습니다.\n\n감사합니다,\n알렉스 드림' },
  { languageCode: 'ko', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: '시간을 내어 주셔서 다시 한번 감사드립니다' },
  { languageCode: 'ko', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: '더 알게 되어 정말 즐거웠습니다' },
  { languageCode: 'ko', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: '이 직무에 대한 제 관심을 더욱 확고히 했습니다' },
  { languageCode: 'ko', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: '언제든지 연락 주십시오' },
  { languageCode: 'ko', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: '연락을 기다리겠습니다' },
  { languageCode: 'ko', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: '감사합니다' },

  // ---- Portuguese (pt) ------------------------------------------------------
  { languageCode: 'pt', sourceType: 'model_response' as const, sourceKey: 'model', text: 'Prezada Sra. Chen,\n\nGostaria de agradecer novamente por dedicar seu tempo para conversar comigo sobre a vaga de Coordenador de Marketing. Gostei muito de saber mais sobre a equipe e os projetos empolgantes em que a BrightPath está trabalhando.\n\nNossa conversa reforçou meu interesse na vaga. Fiquei especialmente animado ao saber sobre a iniciativa de renovação da marca — parece uma oportunidade em que minha experiência em estratégia de conteúdo poderia ser valiosa.\n\nNão hesite em entrar em contato se precisar de qualquer informação adicional da minha parte. Aguardo seu retorno.\n\nAtenciosamente,\nAlex' },
  { languageCode: 'pt', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'obrigado novamente por dedicar seu tempo' },
  { languageCode: 'pt', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'Gostei muito de saber mais sobre' },
  { languageCode: 'pt', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'reforçou meu interesse na vaga' },
  { languageCode: 'pt', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'não hesite em entrar em contato' },
  { languageCode: 'pt', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'Aguardo seu retorno' },
  { languageCode: 'pt', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'Atenciosamente' },

  // ---- Turkish (tr) ---------------------------------------------------------
  { languageCode: 'tr', sourceType: 'model_response' as const, sourceKey: 'model', text: 'Sayın Chen Hanım,\n\nPazarlama Koordinatörü pozisyonu hakkında benimle konuşmaya zaman ayırdığınız için tekrar teşekkür etmek istedim. Ekip ve BrightPath\'in üzerinde çalıştığı heyecan verici projeler hakkında daha fazla bilgi edinmekten gerçekten keyif aldım.\n\nGörüşmemiz bu role olan ilgimi pekiştirdi. Özellikle yaklaşan marka yenileme girişiminizi duymaktan çok heyecanlandım — içerik stratejisi geçmişimin değerli olabileceği bir fırsat gibi görünüyor.\n\nBenden ek bilgiye ihtiyacınız olursa lütfen çekinmeden iletişime geçin. Sizden haber bekliyorum.\n\nSaygılarımla,\nAlex' },
  { languageCode: 'tr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'zaman ayırdığınız için tekrar teşekkür ederim' },
  { languageCode: 'tr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'hakkında daha fazla bilgi edinmekten gerçekten keyif aldım' },
  { languageCode: 'tr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'bu role olan ilgimi pekiştirdi' },
  { languageCode: 'tr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'lütfen çekinmeden iletişime geçin' },
  { languageCode: 'tr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'Sizden haber bekliyorum' },
  { languageCode: 'tr', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'Saygılarımla' },

  // ---- Urdu (ur) ------------------------------------------------------------
  { languageCode: 'ur', sourceType: 'model_response' as const, sourceKey: 'model', text: 'محترمہ چن،\n\nمیں مارکیٹنگ کوآرڈینیٹر کی پوزیشن کے بارے میں مجھ سے بات کرنے کے لیے وقت نکالنے پر آپ کا ایک بار پھر شکریہ ادا کرنا چاہتا ہوں۔ مجھے ٹیم اور برائٹ پاتھ کے دلچسپ منصوبوں کے بارے میں مزید جان کر واقعی اچھا لگا۔\n\nہماری گفتگو نے اس کردار میں میری دلچسپی کو مزید مضبوط کیا۔ میں خاص طور پر آپ کی آئندہ برانڈ ریفریش پہل کے بارے میں سن کر بہت پرجوش تھا — یہ ایک ایسا موقع لگتا ہے جہاں مواد کی حکمت عملی میں میرا پس منظر قیمتی ہو سکتا ہے۔\n\nبراہ کرم اگر آپ کو مجھ سے کسی اضافی معلومات کی ضرورت ہو تو رابطہ کرنے میں ہچکچاہٹ محسوس نہ کریں۔ میں آپ سے سننے کا منتظر ہوں۔\n\nبہترین احترام کے ساتھ،\nایلکس' },
  { languageCode: 'ur', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: 'وقت نکالنے پر ایک بار پھر شکریہ' },
  { languageCode: 'ur', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: 'مجھے مزید جان کر واقعی اچھا لگا' },
  { languageCode: 'ur', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: 'اس کردار میں میری دلچسپی کو مزید مضبوط کیا' },
  { languageCode: 'ur', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: 'رابطہ کرنے میں ہچکچاہٹ محسوس نہ کریں' },
  { languageCode: 'ur', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: 'میں آپ سے سننے کا منتظر ہوں' },
  { languageCode: 'ur', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: 'بہترین احترام کے ساتھ' },

  // ---- Chinese (zh) ---------------------------------------------------------
  { languageCode: 'zh', sourceType: 'model_response' as const, sourceKey: 'model', text: '尊敬的陈女士：\n\n我想再次感谢您抽出时间与我讨论市场营销协调员一职。我非常高兴能进一步了解团队以及 BrightPath 正在进行的激动人心的项目。\n\n我们的对话加深了我对这个职位的兴趣。听到您即将推出的品牌焕新计划，我尤其感到兴奋——这似乎是一个能让我的内容策略背景发挥价值的机会。\n\n如果您需要我提供任何补充信息，请随时与我联系。期待您的回复。\n\n此致\n敬礼\nAlex' },
  { languageCode: 'zh', sourceType: 'key_phrase' as const, sourceKey: 'phrase-1', text: '再次感谢您抽出时间' },
  { languageCode: 'zh', sourceType: 'key_phrase' as const, sourceKey: 'phrase-2', text: '我非常高兴能进一步了解' },
  { languageCode: 'zh', sourceType: 'key_phrase' as const, sourceKey: 'phrase-3', text: '加深了我对这个职位的兴趣' },
  { languageCode: 'zh', sourceType: 'key_phrase' as const, sourceKey: 'phrase-4', text: '请随时与我联系' },
  { languageCode: 'zh', sourceType: 'key_phrase' as const, sourceKey: 'phrase-5', text: '期待您的回复' },
  { languageCode: 'zh', sourceType: 'key_phrase' as const, sourceKey: 'phrase-6', text: '此致敬礼' },
];

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------

const demoScenario = {
  slug: 'follow-up-after-interview',
  title: 'Follow Up After a Job Interview',
  context:
    'You interviewed for a Marketing Coordinator position at BrightPath Agency three days ago. ' +
    'The conversation went well and you felt a genuine connection with the team. ' +
    'Now you want to write a polite, professional follow-up email to thank the interviewer ' +
    'and reaffirm your interest without sounding pushy or desperate.',
  goal: 'Write a professional follow-up email that thanks the interviewer, expresses continued interest, and leaves a positive impression.',
  tone: 'professional',
  difficulty: 'beginner' as const,
  criteria: [
    'Open with a polite thank you',
    'Reference a specific point from the interview',
    'Reaffirm interest in the role',
    'Keep the tone warm but professional',
    'End with a courteous closing',
  ],
  modelResponse:
    'Dear Ms. Chen,\n\n' +
    'I wanted to thank you again for taking the time to speak with me about ' +
    'the Marketing Coordinator position. I really enjoyed learning more about ' +
    'the team and the exciting projects BrightPath is working on.\n\n' +
    'Our conversation reinforced my interest in the role. I was especially ' +
    'excited to hear about your upcoming brand refresh initiative — it sounds ' +
    'like an opportunity where my background in content strategy could be valuable.\n\n' +
    'Please don\'t hesitate to reach out if you need any additional information ' +
    'from me. I look forward to hearing from you.\n\n' +
    'Best regards,\n' +
    'Alex',
  isDemo: true,

  chunks: [
    {
      order: 1,
      text: 'Dear Ms. Chen,\n\nI wanted to thank you again for taking the time to speak with me about the Marketing Coordinator position.',
      audioText:
        'Dear Ms. Chen. I wanted to thank you again for taking the time to speak with me about the Marketing Coordinator position.',
    },
    {
      order: 2,
      text: 'I really enjoyed learning more about the team and the exciting projects BrightPath is working on.',
    },
    {
      order: 3,
      text: 'Our conversation reinforced my interest in the role.',
      audioText: 'Our conversation reinforced my interest in the role.',
    },
    {
      order: 4,
      text: 'I was especially excited to hear about your upcoming brand refresh initiative — it sounds like an opportunity where my background in content strategy could be valuable.',
      audioText:
        'I was especially excited to hear about your upcoming brand refresh initiative. It sounds like an opportunity where my background in content strategy could be valuable.',
    },
    {
      order: 5,
      text: "Please don't hesitate to reach out if you need any additional information from me.",
    },
    {
      order: 6,
      text: 'I look forward to hearing from you.\n\nBest regards,\nAlex',
      audioText: 'I look forward to hearing from you. Best regards, Alex.',
    },
  ],

  keyPhrases: [
    {
      order: 1,
      text: 'thank you again for taking the time',
      meaning: 'A polite way to express gratitude for someone\'s time, especially after a meeting or interview.',
      example: 'Thank you again for taking the time to review my application.',
      commonMistake:
        'Using "thank you for your time" alone can sound impersonal. Adding "again" shows this is a follow-up.',
      pronunciationRequired: true,
    },
    {
      order: 2,
      text: 'I really enjoyed learning more about',
      meaning: 'A warm, natural way to express genuine curiosity and positive feelings after a conversation.',
      example: 'I really enjoyed learning more about your company\'s mission and vision.',
      commonMistake:
        'Learners sometimes write "I enjoyed to learn" instead of the correct gerund form "learning."',
      pronunciationRequired: false,
    },
    {
      order: 3,
      text: 'reinforced my interest in the role',
      meaning: 'A professional way to say that the interview made you want the job even more.',
      example: 'Meeting the team reinforced my interest in the position.',
      commonMistake:
        'Avoid "increased my interest" — "reinforced" sounds more natural and professional in this context.',
      pronunciationRequired: true,
    },
    {
      order: 4,
      text: "don't hesitate to reach out",
      meaning: 'A polite and common invitation for the recipient to contact you if needed.',
      example: "Don't hesitate to reach out if you have any questions about my experience.",
      commonMistake:
        'Non-native speakers sometimes write "don\'t hesitate to contact with me" — drop "with."',
      pronunciationRequired: true,
    },
    {
      order: 5,
      text: 'I look forward to hearing from you',
      meaning: 'A standard professional closing that shows anticipation without applying pressure.',
      example: 'I look forward to hearing from you soon regarding the next steps.',
      commonMistake:
        'Remember to use the gerund "hearing," not the infinitive "to hear," after "look forward to."',
      pronunciationRequired: false,
    },
    {
      order: 6,
      text: 'Best regards',
      meaning: 'A widely accepted, neutral-professional email closing appropriate for most business contexts.',
      example: 'Best regards,\nSarah',
      commonMistake:
        'Avoid "Best regard" (missing "s"). The correct form is always plural: "Best regards."',
      pronunciationRequired: false,
    },
  ],

  translations: demoTranslations,

  recallBlanks: [
    {
      phraseOrder: 1,
      blankedText:
        'I wanted to ___ to speak with me about the Marketing Coordinator position.',
    },
    {
      phraseOrder: 2,
      blankedText:
        '___ the team and the exciting projects BrightPath is working on.',
    },
    {
      phraseOrder: 3,
      blankedText: 'Our conversation ___.',
    },
    {
      phraseOrder: 4,
      blankedText:
        'Please ___ if you need any additional information from me.',
    },
    {
      phraseOrder: 5,
      blankedText: '___.\n\nBest regards,\nAlex',
    },
  ],
};

// ---------------------------------------------------------------------------
// Exported seed
// ---------------------------------------------------------------------------

const demoLesson = {
  packs: [
    {
      slug: 'demo-pack',
      title: 'Demo Lesson',
      description:
        'Try FluentDraft with a free demo lesson. Practice writing a professional ' +
        'follow-up email after a job interview — a real-world skill every job seeker needs.',
      scenarios: [demoScenario],
    },
  ],
} satisfies SeedContent;

export default demoLesson;
