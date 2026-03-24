import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz } from '../hooks/useQuiz';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { QuizCard } from '../components/quiz/QuizCard';
import { RomajiInput } from '../components/quiz/RomajiInput';
import { SessionSummary } from '../components/quiz/SessionSummary';
import { SessionSetup } from '../components/learn/SessionSetup';
import { Button } from '../components/ui/Button';
import type { SessionConfig } from '../types/quiz';

const AUTO_ADVANCE_MS = 1400;

// Keyboard key → difficulty rating
const KEY_TO_DIFFICULTY: Record<string, 'again' | 'hard' | 'good' | 'easy'> = {
  '1': 'again', '2': 'hard', '3': 'good', '4': 'easy',
};

export function Learn() {
  const navigate = useNavigate();
  const { initCards, getDueCards, getNewCards } = useProgressStore();
  const { dailyNewLimit } = useSettingsStore();
  const {
    status, currentQuestion, questions, index, answers,
    lastCorrect, showAnswer, hint, accuracy,
    startSession, submitUserAnswer, nextQuestion, skipQuestion, revealHint, retryMissed,
  } = useQuiz();

  const [lastUserAnswer, setLastUserAnswer] = useState('');
  const [autoProgress, setAutoProgress] = useState(0);
  const autoRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const getInputValue = useRef<() => string>(() => '');

  useEffect(() => { initCards(); }, []);

  // Auto-advance on correct answer
  useEffect(() => {
    if (status === 'feedback' && lastCorrect) {
      setAutoProgress(0);
      const t0 = Date.now();
      intervalRef.current = setInterval(() => {
        setAutoProgress(Math.min(((Date.now() - t0) / AUTO_ADVANCE_MS) * 100, 100));
      }, 30);
      autoRef.current = setTimeout(() => {
        clearInterval(intervalRef.current!);
        handleNext();
      }, AUTO_ADVANCE_MS);
    }
    return () => {
      if (autoRef.current)     clearTimeout(autoRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAutoProgress(0);
    };
  }, [status, lastCorrect, index]);

  // Keyboard shortcuts: 1-4 for difficulty rating when answer is shown and wrong
  useEffect(() => {
    if (!showAnswer || lastCorrect) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const rating = KEY_TO_DIFFICULTY[e.key];
      if (rating) { e.preventDefault(); handleNext(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAnswer, lastCorrect, index]);

  const handleSubmit = (val: string) => { setLastUserAnswer(val); submitUserAnswer(val); };
  const handleNext   = () => { nextQuestion(); setLastUserAnswer(''); setAutoProgress(0); };
  const handleStart  = (cfg: SessionConfig) => { startSession(cfg); };
  const handleRetryMissed = (verbIds: string[]) => { retryMissed(verbIds); };

  const dueCount = getDueCards().length;
  const newCount = getNewCards(dailyNewLimit).length;
  const progressPct = questions.length > 0
    ? ((index + (showAnswer ? 1 : 0)) / questions.length) * 100
    : 0;

  // ── Setup screen ────────────────────────────────────────────────────────
  if (status === 'idle') {
    return <SessionSetup dueCount={dueCount} newCount={newCount} onStart={handleStart} />;
  }

  return (
    <div className="pt-4 pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-[var(--color-accent)] text-[15px] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          ← Home
        </button>
        <span className="text-[14px] text-[var(--color-text2)]">
          {Math.min(index + 1, questions.length)} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[var(--color-surface2)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--color-accent)] rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Auto-advance countdown */}
      {showAnswer && lastCorrect && (
        <div className="w-full h-0.5 bg-[var(--color-surface2)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-success)] rounded-full transition-none" style={{ width: `${autoProgress}%` }} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentQuestion && (
          <QuizCard
            key={`${currentQuestion.verb.id}-${index}`}
            question={currentQuestion}
            showAnswer={showAnswer}
            lastCorrect={lastCorrect}
            userAnswer={lastUserAnswer}
            hint={hint}
            onDifficulty={showAnswer && !lastCorrect ? () => handleNext() : undefined}
          />
        )}
      </AnimatePresence>

      {!showAnswer ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`input-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <RomajiInput
              onSubmit={handleSubmit}
              onSkip={skipQuestion}
              onGetValue={fn => { getInputValue.current = fn; }}
              disabled={showAnswer}
              resetKey={index}
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={skipQuestion}>Skip</Button>
              <Button variant="secondary" size="sm" onClick={revealHint} disabled={!!hint}>Hint</Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => { const v = getInputValue.current().trim(); if (v) handleSubmit(v); }}
              >
                Check Answer
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        !lastCorrect && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="primary" fullWidth onClick={handleNext} size="lg">
              {index + 1 >= questions.length ? 'See Results' : 'Next →'}
            </Button>
          </motion.div>
        )
      )}

      <SessionSummary
        open={status === 'done'}
        answers={answers}
        accuracy={accuracy}
        onHome={() => navigate('/')}
        onRetry={() => { startSession({ type: 'srs', forms: ['masu'], groups: [1, 2, 3], packIds: [] }); }}
        onRetryMissed={handleRetryMissed}
      />
    </div>
  );
}
