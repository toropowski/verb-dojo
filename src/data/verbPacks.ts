export type VerbPack = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  verbIds: string[];
  /** Must reach this % ます-mastery in the prerequisite pack to unlock (default 80%) */
  unlocksAfter?: { packId: string; masteryThreshold: number };
};

export const VERB_PACKS: VerbPack[] = [
  {
    id: 'pack-1',
    name: 'Starter',
    emoji: '🌱',
    description: '10 most essential N5 verbs — eating, seeing, going, coming',
    verbIds: ['taberu', 'miru', 'iku', 'kuru', 'suru', 'nomu', 'yomu', 'hanasu', 'neru', 'okiru'],
  },
  {
    id: 'pack-2',
    name: 'Everyday Life',
    emoji: '🏃',
    description: 'Daily actions — waiting, buying, walking, borrowing',
    verbIds: ['matsu', 'kaeru', 'deru', 'kau', 'kaku', 'kiku', 'asobu', 'toru', 'hairu', 'oyogu',
              'aruku', 'hashiru', 'tsukau', 'kariru', 'kiru-wear'],
    unlocksAfter: { packId: 'pack-1', masteryThreshold: 5 },
  },
  {
    id: 'pack-3',
    name: 'Actions & Study',
    emoji: '📚',
    description: 'Opening, closing, teaching, washing — and useful する compounds',
    verbIds: ['oshieru', 'akeru', 'shimeru', 'iru', 'kangaeru', 'benkyosuru', 'ryokosuru',
              'unten-suru', 'kaimono-suru', 'kiru-cut', 'arau', 'hataraku', 'miseru', 'hajimeru', 'denwasuru'],
    unlocksAfter: { packId: 'pack-2', masteryThreshold: 8 },
  },
  {
    id: 'pack-4',
    name: 'N5 Complete',
    emoji: '⭐',
    description: 'Finish N5 — meeting, understanding, holding, becoming and more',
    verbIds: ['au', 'okuru', 'kaesu', 'sumu', 'wakaru', 'furu', 'motsu', 'naru', 'owaru',
              'tsukeru', 'oboeru', 'yameru', 'kakeru', 'shiraberu', 'umareru'],
    unlocksAfter: { packId: 'pack-3', masteryThreshold: 8 },
  },
  {
    id: 'pack-5',
    name: 'N4 Essentials',
    emoji: '🚀',
    description: 'Core N4 verbs — giving, receiving, deciding, searching, and more',
    verbIds: ['ageru', 'morau', 'kureru', 'kimeru', 'tsuzukeru', 'kawaru',
              'katsu', 'makeru', 'erabu', 'sagasu', 'odoru', 'utau', 'hiku', 'suteru', 'yaru'],
    unlocksAfter: { packId: 'pack-4', masteryThreshold: 8 },
  },
  {
    id: 'pack-6',
    name: 'N4 Advanced',
    emoji: '🏆',
    description: 'Master N4 — making, forgetting, explaining, promising and more',
    verbIds: ['tsukuru', 'narau', 'wasureru', 'mitsukeru', 'naosu', 'atsumeru',
              'tsutaeru', 'ukeru', 'sodateru', 'kowasu', 'nageru', 'yobu',
              'yakusokusuru', 'renshuusuru', 'setsumeisuru'],
    unlocksAfter: { packId: 'pack-5', masteryThreshold: 8 },
  },
];

export const PACK_MAP = new Map(VERB_PACKS.map(p => [p.id, p]));

/** Return the pack ID for a given verb ID */
export function getPackForVerb(verbId: string): string {
  for (const pack of VERB_PACKS) {
    if (pack.verbIds.includes(verbId)) return pack.id;
  }
  return 'pack-1';
}
