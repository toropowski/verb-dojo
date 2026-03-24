import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SRSCard, DailyStats } from '../types/progress';
import { VERBS } from '../data/verbs';
import { VERB_PACKS, PACK_MAP } from '../data/verbPacks';
import { createCard, isDue, getMasteryLevel, reviewCard, computeQuality } from '../lib/srs';

type ProgressState = {
  cards: Record<string, SRSCard>;
  dailyStats: DailyStats[];
  streak: number;
  lastStudyDate: string | null;
  unlockedPacks: string[];

  initCards: () => void;
  getDueCards: () => SRSCard[];
  getNewCards: (limit: number) => SRSCard[];
  submitAnswer: (verbId: string, form: 'dictionary' | 'masu', correct: boolean, responseTimeMs: number) => void;
  getTodayStats: () => DailyStats;
  getCardKey: (verbId: string, form: 'dictionary' | 'masu') => string;
  getCard: (verbId: string, form: 'dictionary' | 'masu') => SRSCard | undefined;
  getTotalMastered: () => number;
  getOverallAccuracy: () => number;
  getPackProgress: (packId: string) => { learned: number; total: number; mastered: number };
  isPackUnlocked: (packId: string) => boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

function countLearned(cards: Record<string, SRSCard>, packId: string): number {
  const pack = PACK_MAP.get(packId);
  if (!pack) return 0;
  return pack.verbIds.filter(id => {
    const c = cards[`${id}:dictionary`];
    return c && c.repetitions > 0;
  }).length;
}

function checkUnlocks(cards: Record<string, SRSCard>, alreadyUnlocked: string[]): string[] {
  const newly: string[] = [];
  for (const pack of VERB_PACKS) {
    if (alreadyUnlocked.includes(pack.id)) continue;
    if (!pack.unlocksAfter) { newly.push(pack.id); continue; }
    if (countLearned(cards, pack.unlocksAfter.packId) >= pack.unlocksAfter.minLearned) {
      newly.push(pack.id);
    }
  }
  return newly;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      cards: {},
      dailyStats: [],
      streak: 0,
      lastStudyDate: null,
      unlockedPacks: ['pack-1'],

      getCardKey: (verbId, form) => `${verbId}:${form}`,
      getCard: (verbId, form) => get().cards[`${verbId}:${form}`],

      initCards: () => {
        set(state => {
          const cards = { ...state.cards };
          for (const verb of VERBS) {
            if (!cards[`${verb.id}:dictionary`]) cards[`${verb.id}:dictionary`] = createCard(verb.id, 'dictionary');
            if (!cards[`${verb.id}:masu`])       cards[`${verb.id}:masu`]       = createCard(verb.id, 'masu');
          }
          const newUnlocks = checkUnlocks(cards, state.unlockedPacks);
          const unlockedPacks = newUnlocks.length
            ? [...new Set([...state.unlockedPacks, ...newUnlocks])]
            : state.unlockedPacks;
          return { cards, unlockedPacks };
        });
      },

      getDueCards: () => Object.values(get().cards).filter(c => c.repetitions > 0 && isDue(c)),

      getNewCards: (limit: number) => {
        const { cards, unlockedPacks } = get();
        const unlockedIds = new Set(
          VERB_PACKS.filter(p => unlockedPacks.includes(p.id)).flatMap(p => p.verbIds)
        );
        const result: SRSCard[] = [];
        for (const verb of VERBS) {
          if (result.length >= limit) break;
          if (!unlockedIds.has(verb.id)) continue;
          const c = cards[`${verb.id}:dictionary`];
          if (c && c.repetitions === 0) result.push(c);
        }
        return result;
      },

      submitAnswer: (verbId, form, correct, responseTimeMs) => {
        const key = `${verbId}:${form}`;
        const card = get().cards[key];
        if (!card) return;
        const quality = computeQuality(correct, responseTimeMs);
        const updated = reviewCard(card, quality);
        const history = [...updated.history];
        const last = history[history.length - 1];
        if (last) history[history.length - 1] = { ...last, responseTimeMs };

        const todayStr = today();
        set(state => {
          let { streak, lastStudyDate } = state;
          if (lastStudyDate !== todayStr) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            streak = lastStudyDate === yesterday ? streak + 1 : 1;
            lastStudyDate = todayStr;
          }
          const stats = [...state.dailyStats];
          const idx = stats.findIndex(s => s.date === todayStr);
          if (idx >= 0) {
            stats[idx] = { ...stats[idx], reviewed: stats[idx].reviewed + 1, correct: stats[idx].correct + (correct ? 1 : 0) };
          } else {
            stats.push({ date: todayStr, reviewed: 1, correct: correct ? 1 : 0, newCards: card.repetitions === 0 ? 1 : 0 });
          }
          const newCards = { ...state.cards, [key]: { ...updated, history } };
          const newUnlocks = checkUnlocks(newCards, state.unlockedPacks);
          const unlockedPacks = newUnlocks.length
            ? [...new Set([...state.unlockedPacks, ...newUnlocks])]
            : state.unlockedPacks;
          return { cards: newCards, streak, lastStudyDate, dailyStats: stats, unlockedPacks };
        });
      },

      getTodayStats: () => {
        const todayStr = today();
        return get().dailyStats.find(s => s.date === todayStr) ?? { date: todayStr, reviewed: 0, correct: 0, newCards: 0 };
      },

      getTotalMastered: () => Object.values(get().cards).filter(c => getMasteryLevel(c) === 'mastered').length,

      getOverallAccuracy: () => {
        const { dailyStats } = get();
        const total = dailyStats.reduce((s, d) => s + d.reviewed, 0);
        const correct = dailyStats.reduce((s, d) => s + d.correct, 0);
        return total === 0 ? 0 : Math.round((correct / total) * 100);
      },

      getPackProgress: (packId: string) => {
        const { cards } = get();
        const pack = PACK_MAP.get(packId);
        if (!pack) return { learned: 0, total: 0, mastered: 0 };
        let learned = 0, mastered = 0;
        for (const verbId of pack.verbIds) {
          const c = cards[`${verbId}:dictionary`];
          if (!c) continue;
          if (c.repetitions > 0) learned++;
          if (getMasteryLevel(c) === 'mastered') mastered++;
        }
        return { learned, total: pack.verbIds.length, mastered };
      },

      isPackUnlocked: (packId: string) => get().unlockedPacks.includes(packId),
    }),
    { name: 'verb-dojo-progress' },
  ),
);
