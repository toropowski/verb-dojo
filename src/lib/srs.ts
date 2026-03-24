import type { SRSCard, MasteryLevel, ReviewResult } from '../types/progress';

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

export function createCard(verbId: string, form: 'dictionary' | 'masu'): SRSCard {
  return {
    verbId,
    form,
    interval: 0,
    easeFactor: DEFAULT_EASE,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: null,
    history: [],
  };
}

/**
 * Compute quality rating (0-5) from correctness + response time.
 */
export function computeQuality(correct: boolean, responseTimeMs: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (!correct) return responseTimeMs < 5000 ? 1 : 0;
  if (responseTimeMs < 4000) return 5;
  if (responseTimeMs < 8000) return 4;
  return 3;
}

/**
 * SM-2 algorithm. Returns updated card.
 */
export function reviewCard(card: SRSCard, quality: 0 | 1 | 2 | 3 | 4 | 5): SRSCard {
  const now = Date.now();
  let { interval, easeFactor, repetitions } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(
    MIN_EASE,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );

  const result: ReviewResult = {
    timestamp: now,
    quality,
    correct: quality >= 3,
    responseTimeMs: 0, // filled by caller
  };

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReview: now + interval * 24 * 60 * 60 * 1000,
    lastReview: now,
    history: [...card.history, result],
  };
}

export function getMasteryLevel(card: SRSCard): MasteryLevel {
  if (card.repetitions === 0) return 'new';
  if (card.repetitions <= 2) return 'learning';
  if (card.interval <= 21) return 'reviewing';
  return 'mastered';
}

export function isDue(card: SRSCard): boolean {
  return card.nextReview <= Date.now();
}

export function getMasteryPercent(cards: SRSCard[]): number {
  if (cards.length === 0) return 0;
  const mastered = cards.filter(c => getMasteryLevel(c) === 'mastered').length;
  return Math.round((mastered / cards.length) * 100);
}
