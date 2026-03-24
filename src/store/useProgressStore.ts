import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SRSCard, DailyStats } from '../types/progress';
import type { VerbMastery, PackDrillProgress, FormStage, DrillConfig, DrillAnswer } from '../types/drill';
import { VERBS } from '../data/verbs';
import { VERB_PACKS, PACK_MAP } from '../data/verbPacks';
import { createCard, isDue, getMasteryLevel, reviewCard, computeQuality } from '../lib/srs';

// ── Mastery thresholds ────────────────────────────────────────────────────────

const MASU_SRS_DAYS = 14;
const TE_NEG_SRS_DAYS = 7;
const PACK_UNLOCK_PCT = 80;          // % of prev pack masu-mastered to unlock next pack
const STAGE_TE_UNLOCK_PCT = 60;      // % masu-mastered in pack to unlock て stage
const STAGE_NEG_UNLOCK_PCT = 60;     // % て-mastered in pack to unlock negative stage
const STAGE_RECALL_UNLOCK_PCT = 80;  // % masu-mastered in pack to unlock recall stage

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

function defaultPackProgress(): PackDrillProgress {
  return {
    introducedVerbIds: [],
    completedDrills: 0,
    unlockedFormStages: ['masu'],
    shownIntroForForms: [],
    pendingUnlockNotifications: [],
  };
}

function defaultVerbMastery(verbId: string, form: FormStage): VerbMastery {
  return {
    verbId, form,
    typedDictToFormCorrect: 0,
    typedReverseCorrect: 0,
    mcCorrect: 0,
    sentenceFillCorrect: 0,
    srsFulfilled: false,
    firstSeenAt: null,
    masteredAt: null,
  };
}

function isMasuMastered(vm: VerbMastery | undefined): boolean {
  if (!vm) return false;
  return vm.typedDictToFormCorrect >= 3 && vm.typedReverseCorrect >= 2 && vm.srsFulfilled;
}

function isTeMastered(vm: VerbMastery | undefined): boolean {
  if (!vm) return false;
  return vm.typedDictToFormCorrect >= 2 && vm.sentenceFillCorrect >= 1 && vm.srsFulfilled;
}

function isNegMastered(vm: VerbMastery | undefined): boolean {
  return isTeMastered(vm); // same criteria
}

function checkFormMastered(vm: VerbMastery | undefined, form: FormStage): boolean {
  if (!vm) return false;
  switch (form) {
    case 'masu':     return isMasuMastered(vm);
    case 'te':       return isTeMastered(vm);
    case 'negative': return isNegMastered(vm);
    case 'recall':   return isMasuMastered(vm); // recall mastery = masu mastery
  }
}

function getPackMasuMasteryPct(verbMastery: Record<string, VerbMastery>, packId: string): number {
  const pack = PACK_MAP.get(packId);
  if (!pack || pack.verbIds.length === 0) return 0;
  const mastered = pack.verbIds.filter(id => isMasuMastered(verbMastery[`${id}:masu`])).length;
  return Math.round((mastered / pack.verbIds.length) * 100);
}

function checkPackUnlocks(
  verbMastery: Record<string, VerbMastery>,
  alreadyUnlocked: string[]
): string[] {
  const newly: string[] = [];
  for (const pack of VERB_PACKS) {
    if (alreadyUnlocked.includes(pack.id)) continue;
    if (!pack.unlocksAfter) { newly.push(pack.id); continue; }
    const pct = getPackMasuMasteryPct(verbMastery, pack.unlocksAfter.packId);
    if (pct >= PACK_UNLOCK_PCT) newly.push(pack.id);
  }
  return newly;
}

// ── Store type ────────────────────────────────────────────────────────────────

type ProgressState = {
  // SRS cards (unchanged)
  cards: Record<string, SRSCard>;
  dailyStats: DailyStats[];
  streak: number;
  lastStudyDate: string | null;
  unlockedPacks: string[];

  // Drill system
  drillProgress: Record<string, PackDrillProgress>;   // key = packId
  verbMastery: Record<string, VerbMastery>;            // key = "${verbId}:${form}"

  // SRS methods (unchanged API)
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

  // Drill methods
  getNextDrill: (packId: string) => DrillConfig | null;
  markDrillComplete: (config: DrillConfig, answers: DrillAnswer[]) => void;
  getFormStages: (packId: string) => FormStage[];
  checkFormUnlocks: (packId: string) => FormStage[];
  isVerbFormMastered: (verbId: string, form: FormStage) => boolean;
  getFormMasteryCount: (packId: string, form: FormStage) => { mastered: number; total: number };
  getPackMasuMasteryPercent: (packId: string) => number;
  clearUnlockNotifications: (packId: string) => void;
  getVerbMastery: (verbId: string, form: FormStage) => VerbMastery;
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      cards: {},
      dailyStats: [],
      streak: 0,
      lastStudyDate: null,
      unlockedPacks: ['pack-1'],
      drillProgress: {},
      verbMastery: {},

      getCardKey: (verbId, form) => `${verbId}:${form}`,
      getCard: (verbId, form) => get().cards[`${verbId}:${form}`],

      initCards: () => {
        set(state => {
          const cards = { ...state.cards };
          for (const verb of VERBS) {
            if (!cards[`${verb.id}:dictionary`]) cards[`${verb.id}:dictionary`] = createCard(verb.id, 'dictionary');
            if (!cards[`${verb.id}:masu`])       cards[`${verb.id}:masu`]       = createCard(verb.id, 'masu');
          }
          // Seed drillProgress for any unlocked pack that doesn't have an entry yet
          const drillProgress = { ...state.drillProgress };
          for (const packId of state.unlockedPacks) {
            if (!drillProgress[packId]) drillProgress[packId] = defaultPackProgress();
          }
          // Pack unlocks still use old criteria for backward compat (new packs use 80% masu)
          const newUnlocks = checkPackUnlocks(state.verbMastery, state.unlockedPacks);
          const unlockedPacks = newUnlocks.length
            ? [...new Set([...state.unlockedPacks, ...newUnlocks])]
            : state.unlockedPacks;
          return { cards, drillProgress, unlockedPacks };
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

          // Sync srsFulfilled for ます form mastery
          let verbMastery = state.verbMastery;
          if (form === 'dictionary') {
            const masuKey = `${verbId}:masu`;
            const existing = verbMastery[masuKey] ?? defaultVerbMastery(verbId, 'masu');
            const srsFulfilled = updated.interval >= MASU_SRS_DAYS;
            if (existing.srsFulfilled !== srsFulfilled) {
              verbMastery = { ...verbMastery, [masuKey]: { ...existing, srsFulfilled } };
            }
          }

          // Check pack unlocks (80% masu mastery)
          const newUnlocks = checkPackUnlocks(verbMastery, state.unlockedPacks);
          let unlockedPacks = state.unlockedPacks;
          let drillProgress = state.drillProgress;
          if (newUnlocks.length) {
            unlockedPacks = [...new Set([...state.unlockedPacks, ...newUnlocks])];
            // Seed drillProgress for newly unlocked packs
            drillProgress = { ...drillProgress };
            for (const packId of newUnlocks) {
              if (!drillProgress[packId]) drillProgress[packId] = defaultPackProgress();
            }
          }

          return { cards: newCards, streak, lastStudyDate, dailyStats: stats, unlockedPacks, verbMastery, drillProgress };
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
        const { verbMastery } = get();
        const pack = PACK_MAP.get(packId);
        if (!pack) return { learned: 0, total: 0, mastered: 0 };
        let learned = 0, mastered = 0;
        for (const verbId of pack.verbIds) {
          const vm = verbMastery[`${verbId}:masu`];
          if (vm?.firstSeenAt !== null && vm?.firstSeenAt !== undefined) learned++;
          if (isMasuMastered(vm)) mastered++;
        }
        return { learned, total: pack.verbIds.length, mastered };
      },

      isPackUnlocked: (packId: string) => get().unlockedPacks.includes(packId),

      // ── Drill methods ──────────────────────────────────────────────────────

      getVerbMastery: (verbId: string, form: FormStage) => {
        return get().verbMastery[`${verbId}:${form}`] ?? defaultVerbMastery(verbId, form);
      },

      isVerbFormMastered: (verbId: string, form: FormStage) => {
        const vm = get().verbMastery[`${verbId}:${form}`];
        return checkFormMastered(vm, form);
      },

      getFormMasteryCount: (packId: string, form: FormStage) => {
        const pack = PACK_MAP.get(packId);
        if (!pack) return { mastered: 0, total: 0 };
        const { verbMastery } = get();
        const mastered = pack.verbIds.filter(id => checkFormMastered(verbMastery[`${id}:${form}`], form)).length;
        return { mastered, total: pack.verbIds.length };
      },

      getPackMasuMasteryPercent: (packId: string) => {
        return getPackMasuMasteryPct(get().verbMastery, packId);
      },

      getFormStages: (packId: string) => {
        const progress = get().drillProgress[packId];
        return progress?.unlockedFormStages ?? ['masu'];
      },

      checkFormUnlocks: (packId: string) => {
        const state = get();
        const pack = PACK_MAP.get(packId);
        if (!pack) return [];

        const progress = state.drillProgress[packId] ?? defaultPackProgress();
        const { verbMastery } = state;
        const newlyUnlocked: FormStage[] = [];

        const masuPct = pack.verbIds.length > 0
          ? Math.round(pack.verbIds.filter(id => isMasuMastered(verbMastery[`${id}:masu`])).length / pack.verbIds.length * 100)
          : 0;

        const tePct = pack.verbIds.length > 0
          ? Math.round(pack.verbIds.filter(id => isTeMastered(verbMastery[`${id}:te`])).length / pack.verbIds.length * 100)
          : 0;

        if (!progress.unlockedFormStages.includes('te') && masuPct >= STAGE_TE_UNLOCK_PCT) {
          newlyUnlocked.push('te');
        }
        if (!progress.unlockedFormStages.includes('negative') && tePct >= STAGE_NEG_UNLOCK_PCT) {
          newlyUnlocked.push('negative');
        }
        if (!progress.unlockedFormStages.includes('recall') && masuPct >= STAGE_RECALL_UNLOCK_PCT) {
          newlyUnlocked.push('recall');
        }

        if (newlyUnlocked.length > 0) {
          set(state => ({
            drillProgress: {
              ...state.drillProgress,
              [packId]: {
                ...progress,
                unlockedFormStages: [...progress.unlockedFormStages, ...newlyUnlocked],
                pendingUnlockNotifications: [...progress.pendingUnlockNotifications, ...newlyUnlocked],
              },
            },
          }));
        }

        return newlyUnlocked;
      },

      getNextDrill: (packId: string): DrillConfig | null => {
        const state = get();
        const pack = PACK_MAP.get(packId);
        if (!pack) return null;
        if (!state.unlockedPacks.includes(packId)) return null;

        const progress = state.drillProgress[packId] ?? defaultPackProgress();
        const { verbMastery } = state;
        const stageOrder: FormStage[] = ['masu', 'te', 'negative', 'recall'];

        for (const stage of stageOrder) {
          if (!progress.unlockedFormStages.includes(stage)) continue;

          // Find verbs not yet introduced for this stage (firstSeenAt is null)
          const notIntroduced = pack.verbIds.filter(id => {
            const vm = verbMastery[`${id}:${stage}`];
            return !vm || vm.firstSeenAt === null;
          });

          if (notIntroduced.length > 0) {
            const verbIds = notIntroduced.slice(0, 5);
            return {
              packId,
              verbIds,
              formStage: stage,
              isFirstIntroduction: true,
              drillIndex: progress.completedDrills,
            };
          }

          // All introduced — check for not-yet-mastered verbs (need review)
          const notMastered = pack.verbIds.filter(id => {
            const vm = verbMastery[`${id}:${stage}`];
            return !vm || !checkFormMastered(vm, stage);
          });

          if (notMastered.length > 0) {
            // Sort by least practiced first
            const sorted = [...notMastered].sort((a, b) => {
              const ma = verbMastery[`${a}:${stage}`];
              const mb = verbMastery[`${b}:${stage}`];
              const countA = ma?.typedDictToFormCorrect ?? 0;
              const countB = mb?.typedDictToFormCorrect ?? 0;
              return countA - countB;
            });
            return {
              packId,
              verbIds: sorted.slice(0, 5),
              formStage: stage,
              isFirstIntroduction: false,
              drillIndex: progress.completedDrills,
            };
          }

          // All mastered for this stage — check next stage
        }

        return null; // Everything mastered!
      },

      markDrillComplete: (config: DrillConfig, answers: DrillAnswer[]) => {
        set(state => {
          const { verbMastery: vm, drillProgress: dp } = state;
          const updatedMastery = { ...vm };

          // Update mastery counters for each verb in the drill
          for (const verbId of config.verbIds) {
            const form = config.formStage;
            const key = `${verbId}:${form}`;
            const existing = updatedMastery[key] ?? defaultVerbMastery(verbId, form);
            const verbAnswers = answers.filter(a => a.verbId === verbId);

            let { typedDictToFormCorrect, typedReverseCorrect, mcCorrect, sentenceFillCorrect } = existing;

            for (const ans of verbAnswers) {
              if (!ans.correct) continue;
              switch (ans.exerciseType) {
                case 'type-dict-to-masu':
                case 'type-dict-to-te':
                case 'type-dict-to-neg':
                  typedDictToFormCorrect++;
                  break;
                case 'type-masu-to-dict':
                  typedReverseCorrect++;
                  break;
                case 'mc-meaning':
                case 'mc-form':
                  mcCorrect++;
                  break;
                case 'mc-sentence-fill':
                  sentenceFillCorrect++;
                  mcCorrect++;
                  break;
              }
            }

            // Check SRS card interval for srsFulfilled
            const srsCard = state.cards[`${verbId}:dictionary`];
            const threshold = form === 'masu' ? MASU_SRS_DAYS : TE_NEG_SRS_DAYS;
            const srsFulfilled = srsCard ? srsCard.interval >= threshold : existing.srsFulfilled;

            const updated: VerbMastery = {
              ...existing,
              typedDictToFormCorrect,
              typedReverseCorrect,
              mcCorrect,
              sentenceFillCorrect,
              srsFulfilled,
              firstSeenAt: existing.firstSeenAt ?? Date.now(),
            };

            // Check if newly mastered
            if (!updated.masteredAt && checkFormMastered(updated, form)) {
              updated.masteredAt = Date.now();
            }

            updatedMastery[key] = updated;
          }

          // Update pack drill progress
          const existingProg = dp[config.packId] ?? defaultPackProgress();
          const newIntroduced = config.isFirstIntroduction
            ? [...new Set([...existingProg.introducedVerbIds, ...config.verbIds])]
            : existingProg.introducedVerbIds;

          // Mark grammar intro as shown
          const shownIntroForForms = existingProg.shownIntroForForms.includes(config.formStage)
            ? existingProg.shownIntroForForms
            : [...existingProg.shownIntroForForms, config.formStage];

          const updatedProg: PackDrillProgress = {
            ...existingProg,
            introducedVerbIds: newIntroduced,
            completedDrills: existingProg.completedDrills + 1,
            shownIntroForForms,
          };

          const drillProgress = { ...dp, [config.packId]: updatedProg };

          // Check for pack unlock
          const newPackUnlocks = checkPackUnlocks(updatedMastery, state.unlockedPacks);
          let unlockedPacks = state.unlockedPacks;
          let finalDrillProgress = drillProgress;
          if (newPackUnlocks.length) {
            unlockedPacks = [...new Set([...state.unlockedPacks, ...newPackUnlocks])];
            finalDrillProgress = { ...drillProgress };
            for (const packId of newPackUnlocks) {
              if (!finalDrillProgress[packId]) finalDrillProgress[packId] = defaultPackProgress();
            }
          }

          return {
            verbMastery: updatedMastery,
            drillProgress: finalDrillProgress,
            unlockedPacks,
          };
        });

        // Check form stage unlocks after state update
        get().checkFormUnlocks(config.packId);
      },

      clearUnlockNotifications: (packId: string) => {
        set(state => {
          const progress = state.drillProgress[packId];
          if (!progress || progress.pendingUnlockNotifications.length === 0) return state;
          return {
            drillProgress: {
              ...state.drillProgress,
              [packId]: { ...progress, pendingUnlockNotifications: [] },
            },
          };
        });
      },
    }),
    {
      name: 'verb-dojo-progress',
      version: 2,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const state = persistedState as Record<string, unknown>;
        if (fromVersion < 2) {
          const cards = (state.cards ?? {}) as Record<string, SRSCard>;
          const verbMastery: Record<string, VerbMastery> = {};
          const drillProgress: Record<string, PackDrillProgress> = {};

          // Seed verbMastery from existing SRS cards
          for (const [key, card] of Object.entries(cards)) {
            const parts = key.split(':');
            const verbId = parts[0];
            const form = parts[1];
            if (form !== 'dictionary' || !card) continue;
            const typedCount = Math.min(card.repetitions ?? 0, 5);
            const srsFulfilled = (card.interval ?? 0) >= MASU_SRS_DAYS;
            const masuKey = `${verbId}:masu`;
            verbMastery[masuKey] = {
              verbId,
              form: 'masu',
              typedDictToFormCorrect: typedCount,
              typedReverseCorrect: Math.max(0, typedCount - 2),
              mcCorrect: 0,
              sentenceFillCorrect: 0,
              srsFulfilled,
              firstSeenAt: typedCount > 0 ? (card.lastReview ?? Date.now()) : null,
              masteredAt: srsFulfilled && typedCount >= 3 ? (card.lastReview ?? null) : null,
            };
          }

          // Seed drillProgress from existing data
          for (const pack of VERB_PACKS) {
            const introducedVerbIds = pack.verbIds.filter(id => {
              const c = cards[`${id}:dictionary`];
              return c && (c.repetitions ?? 0) > 0;
            });
            if (introducedVerbIds.length > 0) {
              drillProgress[pack.id] = {
                introducedVerbIds,
                completedDrills: 0,
                unlockedFormStages: ['masu'],
                shownIntroForForms: ['masu'], // skip masu intro for existing users
                pendingUnlockNotifications: [],
              };
            }
          }

          return { ...state, drillProgress, verbMastery };
        }
        return state;
      },
    },
  ),
);
