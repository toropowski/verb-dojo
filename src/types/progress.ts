export type ReviewResult = {
  timestamp: number;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
  correct: boolean;
  responseTimeMs: number;
};

export type SRSCard = {
  verbId: string;
  form: 'dictionary' | 'masu';
  interval: number;        // days
  easeFactor: number;      // SM-2 E-factor, starts at 2.5
  repetitions: number;     // consecutive correct answers
  nextReview: number;      // Unix timestamp ms
  lastReview: number | null;
  history: ReviewResult[];
};

export type MasteryLevel = 'new' | 'learning' | 'reviewing' | 'mastered';

export type DailyStats = {
  date: string;   // YYYY-MM-DD
  reviewed: number;
  correct: number;
  newCards: number;
};
