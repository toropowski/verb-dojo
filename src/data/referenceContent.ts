export type Mnemonic = {
  id: string;
  title: string;
  body: string;
  highlight?: string;
};

export type ConjugationRule = {
  ending: string;
  stem: string;
  masuEnding: string;
  example: string;
  exampleMasu: string;
};

export const GROUP1_RULES: ConjugationRule[] = [
  { ending: 'く', stem: 'き', masuEnding: 'きます', example: 'かく', exampleMasu: 'かきます' },
  { ending: 'ぐ', stem: 'ぎ', masuEnding: 'ぎます', example: 'およぐ', exampleMasu: 'およぎます' },
  { ending: 'す', stem: 'し', masuEnding: 'します', example: 'はなす', exampleMasu: 'はなします' },
  { ending: 'つ', stem: 'ち', masuEnding: 'ちます', example: 'まつ', exampleMasu: 'まちます' },
  { ending: 'ぬ', stem: 'に', masuEnding: 'にます', example: 'しぬ', exampleMasu: 'しにます' },
  { ending: 'む', stem: 'み', masuEnding: 'みます', example: 'よむ', exampleMasu: 'よみます' },
  { ending: 'ぶ', stem: 'び', masuEnding: 'びます', example: 'あそぶ', exampleMasu: 'あそびます' },
  { ending: 'る', stem: 'り', masuEnding: 'ります', example: 'とる', exampleMasu: 'とります' },
  { ending: 'う', stem: 'い', masuEnding: 'います', example: 'かう', exampleMasu: 'かいます' },
];

export const MNEMONICS: Mnemonic[] = [
  {
    id: 'group-id-method',
    title: 'How to identify verb groups',
    body: 'Does the verb end in る? If YES — check the vowel before る. If it\'s い or え (e.g. たべ-る, み-る), it\'s likely Group 2. If the sound before る is anything else (e.g. か-える, き-る), it\'s Group 1. Anything else? Group 1 too. And すると くる are always Group 3.',
    highlight: 'い/え + る = Group 2',
  },
  {
    id: 'kash',
    title: 'The KASH Exception Trap',
    body: 'Watch out! These verbs end in いる or える but are secretly Group 1:\n• 帰る (かえる) — to return home\n• 入る (はいる) — to enter\n• 知る (しる) — to know\n• 切る (きる) — to cut\n\nRemember: KASH — Kaeru, hAiru, Shiru, Hiru... they look like Group 2 but conjugate like Group 1!',
    highlight: 'KASH = sneaky Group 1 verbs',
  },
  {
    id: 'group2-lazy',
    title: 'Group 2 Verbs Are Lazy',
    body: 'Group 2 (Ru-verbs) verbs are the laziest conjugators in Japanese. To make the ます form: just drop る and add ます. That\'s it!\n• たべる → たべ → たべます\n• みる → み → みます\n• おきる → おき → おきます',
    highlight: 'Drop る, add ます',
  },
  {
    id: 'group1-climb',
    title: 'Group 1 Verbs Climb the Chart',
    body: 'Group 1 verbs change their last kana to the い-row equivalent before adding ます. Think of the hiragana chart — they "climb up" to the い column:\n• く (ku) → き (ki)\n• ぐ (gu) → ぎ (gi)\n• つ (tsu) → ち (chi)\n• む (mu) → み (mi)\n• ぶ (bu) → び (bi)',
    highlight: 'u-sound → i-sound + ます',
  },
  {
    id: 'suru-magic',
    title: 'The する Magic Trick',
    body: 'する is a magic verb you can attach to almost any noun to turn it into a verb!\n• 勉強 (study) + する = 勉強する (to study)\n• 旅行 (travel) + する = 旅行する (to travel)\n• 運転 (driving) + する = 運転する (to drive)\n\nAnd they all become します in ます-form. One rule to learn, infinite verbs!',
    highlight: 'noun + する = new verb',
  },
  {
    id: 'kuru-shapeshifter',
    title: '来る Is a Shapeshifter',
    body: '来る (くる) is the second irregular verb. The kanji stays the same but the reading changes completely:\n• Dictionary: 来る (くる)\n• Masu: 来ます (きます) ← く becomes き!\n• Negative: 来ない (こない) ← becomes こ!\n\nKuru transforms, but する just adds し. Two irregulars to memorize.',
    highlight: 'くる → きます',
  },
  {
    id: 'te-form-pattern',
    title: 'て-form Pattern for Group 1',
    body: 'The て-form (used to connect actions or make requests) follows a pattern based on the dictionary ending:\n• く → いて　(かく → かいて)\n• ぐ → いで　(およぐ → およいで)\n• す → して　(はなす → はなして)\n• つ・る・う → って　(まつ → まって)\n• ぬ・む・ぶ → んで　(のむ → のんで)',
    highlight: 'て-form sound shifts',
  },
];
