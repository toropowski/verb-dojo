import type { Verb } from './verb';

export type QuizMode =
  | 'dict-to-masu'      // show dict form → type ます form
  | 'masu-to-dict'      // show ます form → type dict form
  | 'dict-to-te'        // show dict form → type て form
  | 'dict-to-negative'  // show dict form → type negative form
  | 'meaning-to-masu';  // show English   → type ます form (hardest)

export type QuizQuestion = {
  verb: Verb;
  mode: QuizMode;
  correctAnswer: string;   // hiragana
  startTime: number;
};

export type QuizAnswer = {
  verbId: string;
  mode: QuizMode;
  userAnswer: string;
  correct: boolean;
  responseTimeMs: number;
};

export type QuizSession = {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  currentIndex: number;
  startedAt: number;
};

// Config passed to startSession()
export type SessionConfig = {
  type: 'srs' | 'custom';
  // custom-only:
  forms: Array<'masu' | 'te' | 'negative' | 'recall'>;
  groups: Array<1 | 2 | 3>;
  packIds: string[];
};
