import type { Verb } from './verb';

// ── Exercise taxonomy ─────────────────────────────────────────────────────────

export type DrillExerciseType =
  | 'mc-meaning'         // Show Japanese dict form → tap correct English meaning
  | 'mc-form'            // Show prompt → tap correct conjugated form
  | 'mc-sentence-fill'   // Example sentence with blank → tap correct form
  | 'type-dict-to-masu'
  | 'type-masu-to-dict'
  | 'type-dict-to-te'
  | 'type-dict-to-neg';

// ── Form stage taxonomy ───────────────────────────────────────────────────────

export type FormStage = 'masu' | 'te' | 'negative' | 'recall';

// ── Question model ────────────────────────────────────────────────────────────

export type DrillQuestion = {
  verb: Verb;
  exerciseType: DrillExerciseType;
  correctAnswer: string;          // hiragana for type exercises; exact option string for MC
  startTime: number;
  // MC-only fields
  mcOptions?: string[];           // exactly 4 strings; correctAnswer is one of them
  mcOptionType?: 'meaning' | 'form';
  // sentence-fill metadata
  sentenceTemplate?: string;      // e.g. "毎日学校に___。" with ___ as blank marker
  sentenceHiragana?: string;      // full hiragana for display
  sentenceEnglish?: string;       // English translation for context
};

export type DrillAnswer = {
  verbId: string;
  exerciseType: DrillExerciseType;
  userAnswer: string;
  correct: boolean;
  responseTimeMs: number;
};

// ── Drill configuration ───────────────────────────────────────────────────────

export type DrillConfig = {
  packId: string;
  verbIds: string[];            // up to 5 verb IDs for this drill
  formStage: FormStage;
  isFirstIntroduction: boolean; // true → show grammar intro + verb preview cards
  drillIndex: number;           // ordinal within pack drill history (0-based)
};

// ── Verb mastery tracking ─────────────────────────────────────────────────────

/**
 * Mastery criteria:
 *   masu: typedDictToFormCorrect >= 3 AND typedReverseCorrect >= 2 AND srsFulfilled (interval >= 14d)
 *   te/negative: typedDictToFormCorrect >= 2 AND sentenceFillCorrect >= 1 AND srsFulfilled (interval >= 7d)
 */
export type VerbMastery = {
  verbId: string;
  form: FormStage;
  typedDictToFormCorrect: number;
  typedReverseCorrect: number;      // masu only
  mcCorrect: number;
  sentenceFillCorrect: number;
  srsFulfilled: boolean;            // SRS interval threshold met
  firstSeenAt: number | null;       // set only in markDrillComplete
  masteredAt: number | null;        // set when all criteria are met
};

// ── Per-pack drill progress ───────────────────────────────────────────────────

export type PackDrillProgress = {
  introducedVerbIds: string[];       // verb IDs that have completed at least one drill
  completedDrills: number;
  unlockedFormStages: FormStage[];   // 'masu' always present
  shownIntroForForms: FormStage[];   // grammar intro already shown (once ever per form)
  pendingUnlockNotifications: FormStage[]; // newly unlocked stages not yet shown to user
};

// ── Drill session state ───────────────────────────────────────────────────────

export type DrillPhase = 'idle' | 'intro' | 'verb-preview' | 'drilling' | 'done';

export type DrillSession = {
  config: DrillConfig;
  questions: DrillQuestion[];
  answers: DrillAnswer[];
  currentIndex: number;
  startedAt: number;
  phase: DrillPhase;
  verbPreviewIndex: number;
};
