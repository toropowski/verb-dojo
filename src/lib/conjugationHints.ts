// src/lib/conjugationHints.ts
// Plain-English conjugation rules shown after a wrong typed answer.

import type { VerbGroup } from '../types/verb';

type QuizMode = 'dict-to-masu' | 'masu-to-dict' | 'dict-to-te' | 'dict-to-negative' | 'meaning-to-masu';

const RULES: Record<QuizMode, Record<VerbGroup, string>> = {
  'dict-to-masu': {
    1: 'G1 (う-verb): Shift the final kana to its い-row, then add ます\n  く→き, ぐ→ぎ, す→し, つ→ち, ぬ→に, ぶ→び, む→み, る→り, う→い\n  E.g. 書く → 書き＋ます = 書きます',
    2: 'G2 (る-verb): Drop the final る, then add ます\n  E.g. 食べる → 食べ＋ます = 食べます',
    3: 'G3 (irregular): Two verbs only\n  する → します　　くる → きます',
  },
  'masu-to-dict': {
    1: 'G1 (う-verb): Remove ます, shift the い-row kana back to its う-row\n  き→く, ぎ→ぐ, し→す, ち→つ, に→ぬ, び→ぶ, み→む, り→る, い→う\n  E.g. 書きます → 書き → 書く',
    2: 'G2 (る-verb): Remove ます, add る\n  E.g. 食べます → 食べ → 食べる',
    3: 'G3 (irregular):\n  します → する　　きます → くる',
  },
  'dict-to-te': {
    1: 'G1 (う-verb): て-form depends on the verb ending:\n  く → いて  (書く → 書いて)\n  ぐ → いで  (泳ぐ → 泳いで)\n  す → して  (話す → 話して)\n  ぬ/ぶ/む → んで  (飲む → 飲んで)\n  る/つ/う → って  (待つ → 待って)\n  Exception: 行く → 行って (not 行いて)',
    2: 'G2 (る-verb): Drop る, add て\n  E.g. 食べる → 食べ＋て = 食べて',
    3: 'G3 (irregular):\n  する → して　　くる → きて',
  },
  'dict-to-negative': {
    1: 'G1 (う-verb): Shift the final kana to its あ-row, then add ない\n  く→か, ぐ→が, す→さ, つ→た, ぬ→な, ぶ→ば, む→ま, る→ら\n  Special: う-ending → わ (not あ)  E.g. 買う → 買わない\n  E.g. 書く → 書か＋ない = 書かない',
    2: 'G2 (る-verb): Drop る, add ない\n  E.g. 食べる → 食べ＋ない = 食べない',
    3: 'G3 (irregular):\n  する → しない　　くる → こない',
  },
  'meaning-to-masu': {
    1: 'G1 (う-verb): Shift the final kana to its い-row, then add ます',
    2: 'G2 (る-verb): Drop る, then add ます',
    3: 'G3 (irregular): する → します, くる → きます',
  },
};

export function getConjugationHint(group: VerbGroup, mode: string): string | null {
  const modeRules = RULES[mode as QuizMode];
  if (!modeRules) return null;
  return modeRules[group] ?? null;
}
