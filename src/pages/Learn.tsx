import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrill } from '../hooks/useDrill';
import { useProgressStore } from '../store/useProgressStore';
import { QuizCard } from '../components/quiz/QuizCard';
import { MultipleChoiceCard } from '../components/quiz/MultipleChoiceCard';
import { RomajiInput } from '../components/quiz/RomajiInput';
import { DrillIntroduction } from '../components/learn/DrillIntroduction';
import { VerbPreviewCard } from '../components/learn/VerbPreviewCard';
import { Button } from '../components/ui/Button';
import { VERB_MAP } from '../data/verbs';
import { VERB_PACKS, PACK_MAP } from '../data/verbPacks';
import type { DrillConfig } from '../types/drill';

const AUTO_ADVANCE_MS = 1400;

export function Learn() {
  const navigate = useNavigate();
  const { initCards, unlockedPacks, getNextDrill, clearUnlockNotifications, getFormStages, getFormMasteryCount, getPackMasuMasteryPercent, drillProgress } = useProgressStore();

  const {
    phase, session, currentQuestion,
    showAnswer, lastCorrect, lastUserAnswer, hint, hintMaxed, accuracy, progressPct,
    startDrill, advanceFromIntro, nextVerbPreview, prevVerbPreview,
    submitTypedAnswer, submitMCAnswer, nextQuestion, revealHint, skipQuestion, resetDrill,
  } = useDrill();

  const [autoProgress, setAutoProgress] = useState(0);
  const autoRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const getInputValue = useRef<() => string>(() => '');

  useEffect(() => { initCards(); }, []);

  // Auto-advance on correct answer for MC and typed
  useEffect(() => {
    if (phase === 'drilling' && showAnswer && lastCorrect) {
      // For MC questions, auto-advance faster (1s)
      const isMC = currentQuestion?.exerciseType.startsWith('mc-');
      const delay = isMC ? 900 : AUTO_ADVANCE_MS;
      setAutoProgress(0);
      const t0 = Date.now();
      intervalRef.current = setInterval(() => {
        setAutoProgress(Math.min(((Date.now() - t0) / delay) * 100, 100));
      }, 30);
      autoRef.current = setTimeout(() => {
        clearInterval(intervalRef.current!);
        handleNext();
      }, delay);
    }
    return () => {
      if (autoRef.current)     clearTimeout(autoRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAutoProgress(0);
    };
  }, [phase, showAnswer, lastCorrect, session?.currentIndex]);

  // Keyboard shortcuts when answer is showing
  useEffect(() => {
    if (!showAnswer || phase !== 'drilling') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // 1-4: advance on wrong answer (difficulty rating)
      if (!lastCorrect && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        handleNext();
      }
      // Enter or Space: skip auto-advance on correct answer immediately
      if (lastCorrect && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (autoRef.current) clearTimeout(autoRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAnswer, lastCorrect, phase]);

  const handleNext = () => {
    nextQuestion();
    setAutoProgress(0);
  };

  // ── Idle: pack picker ────────────────────────────────────────────────────

  if (phase === 'idle') {
    return <DrillSetupScreen
      unlockedPacks={unlockedPacks}
      getNextDrill={getNextDrill}
      getFormStages={getFormStages}
      getFormMasteryCount={getFormMasteryCount}
      getPackMasuMasteryPercent={getPackMasuMasteryPercent}
      onStartDrill={startDrill}
    />;
  }

  // ── Grammar intro screen ─────────────────────────────────────────────────

  if (phase === 'intro' && session) {
    return (
      <div className="pt-4 pb-8">
        <button
          onClick={resetDrill}
          className="text-[var(--color-accent)] text-[15px] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity mb-4"
        >
          ← Back
        </button>
        <DrillIntroduction
          formStage={session.config.formStage}
          onContinue={advanceFromIntro}
        />
      </div>
    );
  }

  // ── Verb preview cards ───────────────────────────────────────────────────

  if (phase === 'verb-preview' && session) {
    const verbId = session.config.verbIds[session.verbPreviewIndex];
    const verb = VERB_MAP.get(verbId ?? '');
    if (!verb) return null;
    return (
      <div className="pt-4 pb-8">
        <button
          onClick={resetDrill}
          className="text-[var(--color-accent)] text-[15px] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity mb-4"
        >
          ← Back
        </button>
        <div className="mb-3">
          <p className="text-[13px] text-[var(--color-text3)] text-center">Learn these verbs first</p>
        </div>
        <VerbPreviewCard
          verb={verb}
          index={session.verbPreviewIndex}
          total={session.config.verbIds.length}
          formStage={session.config.formStage}
          onNext={nextVerbPreview}
          onPrev={prevVerbPreview}
          isLast={session.verbPreviewIndex === session.config.verbIds.length - 1}
        />
      </div>
    );
  }

  // ── Drilling ─────────────────────────────────────────────────────────────

  if (phase === 'drilling' && session && currentQuestion) {
    const isMC = currentQuestion.exerciseType.startsWith('mc-');

    return (
      <div className="pt-4 pb-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={resetDrill}
            className="text-[var(--color-accent)] text-[15px] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            ← Stop
          </button>
          <span className="text-[14px] text-[var(--color-text2)]">
            {Math.min(session.currentIndex + 1, session.questions.length)} / {session.questions.length}
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
          {isMC ? (
            <MultipleChoiceCard
              key={`mc-${currentQuestion.verb.id}-${session.currentIndex}`}
              question={currentQuestion}
              showResult={showAnswer}
              selectedOption={showAnswer ? lastUserAnswer : null}
              onSelect={option => { if (!showAnswer) submitMCAnswer(option); }}
            />
          ) : (
            <QuizCard
              key={`typed-${currentQuestion.verb.id}-${session.currentIndex}`}
              question={{
                verb: currentQuestion.verb,
                mode: exerciseTypeToMode(currentQuestion.exerciseType),
                correctAnswer: currentQuestion.correctAnswer,
                startTime: currentQuestion.startTime,
              }}
              showAnswer={showAnswer}
              lastCorrect={lastCorrect}
              userAnswer={lastUserAnswer}
              hint={hint}
              onDifficulty={showAnswer && !lastCorrect ? () => handleNext() : undefined}
            />
          )}
        </AnimatePresence>

        {/* Input area — only for typed questions */}
        {!isMC && (
          !showAnswer ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`input-${session.currentIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <RomajiInput
                  onSubmit={val => { submitTypedAnswer(val); }}
                  onSkip={skipQuestion}
                  onGetValue={fn => { getInputValue.current = fn; }}
                  disabled={showAnswer}
                  resetKey={session.currentIndex}
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={skipQuestion}>Skip</Button>
                  <Button variant="secondary" size="sm" onClick={revealHint} disabled={hintMaxed}>
                    {hint ? 'More hint' : 'Hint'}
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => { const v = getInputValue.current().trim(); if (v) submitTypedAnswer(v); }}
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
                  {session.currentIndex + 1 >= session.questions.length ? 'See Results' : 'Next →'}
                </Button>
              </motion.div>
            )
          )
        )}

        {/* For MC wrong answers: show Next button */}
        {isMC && showAnswer && !lastCorrect && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="primary" fullWidth onClick={handleNext} size="lg">
              {session.currentIndex + 1 >= session.questions.length ? 'See Results' : 'Next →'}
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Drill done ───────────────────────────────────────────────────────────

  if (phase === 'done' && session) {
    const { config, answers } = session;
    const correct = answers.filter(a => a.correct).length;
    const packProg = drillProgress[config.packId];
    const newNotifications = packProg?.pendingUnlockNotifications ?? [];
    const missedVerbIds = [...new Set(answers.filter(a => !a.correct).map(a => a.verbId))];

    return (
      <DrillSummary
        accuracy={accuracy}
        correct={correct}
        total={answers.length}
        formStage={config.formStage}
        packId={config.packId}
        newUnlocks={newNotifications}
        missedVerbIds={missedVerbIds}
        onClearNotifications={() => clearUnlockNotifications(config.packId)}
        onHome={() => navigate('/')}
        onContinue={resetDrill}
        onRetryMissed={missedVerbIds.length > 0 ? () => {
          if (newNotifications.length > 0) clearUnlockNotifications(config.packId);
          startDrill({
            packId: config.packId,
            verbIds: missedVerbIds.slice(0, 5),
            formStage: config.formStage,
            isFirstIntroduction: false,
            drillIndex: config.drillIndex + 1,
          });
        } : undefined}
      />
    );
  }

  return null;
}

// ── Helper: map drill exercise type to legacy QuizMode ──────────────────────

function exerciseTypeToMode(exerciseType: string) {
  switch (exerciseType) {
    case 'type-dict-to-masu': return 'dict-to-masu' as const;
    case 'type-masu-to-dict': return 'masu-to-dict' as const;
    case 'type-dict-to-te':   return 'dict-to-te' as const;
    case 'type-dict-to-neg':  return 'dict-to-negative' as const;
    default:                  return 'dict-to-masu' as const;
  }
}

// ── Drill setup screen ───────────────────────────────────────────────────────

type DrillSetupProps = {
  unlockedPacks: string[];
  getNextDrill: (packId: string) => DrillConfig | null;
  getFormStages: (packId: string) => import('../types/drill').FormStage[];
  getFormMasteryCount: (packId: string, form: import('../types/drill').FormStage) => { mastered: number; total: number };
  getPackMasuMasteryPercent: (packId: string) => number;
  onStartDrill: (config: DrillConfig) => void;
};

const STAGE_LABELS: Record<string, string> = {
  masu: 'ます', te: 'て', negative: 'ない', recall: '💭',
};

function DrillSetupScreen({
  unlockedPacks, getNextDrill, getFormStages,
  getFormMasteryCount, getPackMasuMasteryPercent, onStartDrill,
}: DrillSetupProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-6 pb-8 space-y-5"
    >
      <div>
        <h1 className="text-[28px] font-bold">Practice</h1>
        <p className="text-[var(--color-text2)] text-[14px]">Choose a pack to drill</p>
      </div>

      <div className="space-y-3">
        {VERB_PACKS.map(pack => {
          const unlocked = unlockedPacks.includes(pack.id);
          const nextDrill = unlocked ? getNextDrill(pack.id) : null;
          const stages = unlocked ? getFormStages(pack.id) : [];
          const masuPct = unlocked ? getPackMasuMasteryPercent(pack.id) : 0;
          const masuCount = unlocked ? getFormMasteryCount(pack.id, 'masu') : { mastered: 0, total: pack.verbIds.length };
          const allDone = unlocked && !nextDrill;

          return (
            <div key={pack.id}
              className={[
                'bg-[var(--color-surface)] rounded-[18px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
                !unlocked ? 'opacity-50' : '',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <span className="text-[26px] mt-0.5">{unlocked ? pack.emoji : '🔒'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[15px]">{pack.name}</p>
                    {unlocked && (
                      <span className="text-[12px] font-bold text-[var(--color-accent)]">{masuPct}%</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--color-text3)] mt-0.5">{pack.description}</p>

                  {unlocked && (
                    <>
                      {/* Progress bar */}
                      <div className="w-full h-1 bg-[var(--color-surface2)] rounded-full overflow-hidden mt-2 mb-2">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: masuPct === 100 ? 'var(--color-success)' : 'var(--color-accent)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${masuPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>

                      {/* Form stage badges */}
                      <div className="flex gap-1 flex-wrap mb-3">
                        {(['masu', 'te', 'negative', 'recall'] as const).map(stage => {
                          const isUnlocked = stages.includes(stage);
                          const count = getFormMasteryCount(pack.id, stage);
                          return (
                            <span key={stage}
                              className={[
                                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                                isUnlocked
                                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                                  : 'bg-[var(--color-surface2)] text-[var(--color-text3)]',
                              ].join(' ')}
                            >
                              {STAGE_LABELS[stage]} {isUnlocked ? `${count.mastered}/${count.total}` : '🔒'}
                            </span>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-[var(--color-text3)] mb-3">
                        {masuCount.mastered}/{masuCount.total} ます mastered
                        {!allDone && pack.unlocksAfter && (
                          <span className="text-[var(--color-warning)]"> · {80 - masuPct > 0 ? `${80 - masuPct}% more to unlock next pack` : '✓ next pack unlocked'}</span>
                        )}
                      </p>

                      {allDone ? (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-[10px] px-3 py-2 text-[12px] text-[var(--color-success)] font-medium text-center">
                          ✓ All forms mastered in this pack!
                        </div>
                      ) : nextDrill ? (() => {
                        const qCount = nextDrill.isFirstIntroduction
                          ? nextDrill.verbIds.length * 4
                          : nextDrill.verbIds.length * 3;
                        const estMins = Math.max(1, Math.round(qCount * 15 / 60));
                        return (
                          <div className="space-y-1">
                            <Button
                              variant="primary"
                              fullWidth
                              onClick={() => onStartDrill(nextDrill)}
                            >
                              {nextDrill.isFirstIntroduction
                                ? `Introduce ${nextDrill.verbIds.length} new verbs — ${STAGE_LABELS[nextDrill.formStage]} form`
                                : `Review drill — ${STAGE_LABELS[nextDrill.formStage]} form`}
                            </Button>
                            <p className="text-[11px] text-center text-[var(--color-text3)]">
                              {qCount} questions · ~{estMins} min
                            </p>
                          </div>
                        );
                      })() : null}
                    </>
                  )}

                  {!unlocked && pack.unlocksAfter && (
                    <p className="text-[11px] text-[var(--color-warning)] mt-2">
                      🔒 Master 80% of {PACK_MAP.get(pack.unlocksAfter.packId)?.name ?? 'previous pack'} ます form to unlock
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate('/reference')}
        className="w-full py-3 rounded-[14px] bg-[var(--color-surface)] text-[14px] font-medium text-[var(--color-text2)] border border-[var(--color-border)] hover:opacity-80 transition-opacity"
      >
        📐 View Grammar Reference
      </button>
    </motion.div>
  );
}

// ── Drill summary ────────────────────────────────────────────────────────────

type DrillSummaryProps = {
  accuracy: number;
  correct: number;
  total: number;
  formStage: import('../types/drill').FormStage;
  packId: string;
  newUnlocks: import('../types/drill').FormStage[];
  missedVerbIds: string[];
  onClearNotifications: () => void;
  onHome: () => void;
  onContinue: () => void;
  onRetryMissed?: () => void;
};

const FORM_NAMES: Record<string, string> = {
  masu: 'ます form', te: 'て form', negative: 'ない form', recall: 'Recall',
};

function DrillSummary({ accuracy, correct, total, formStage, packId, newUnlocks, missedVerbIds, onClearNotifications, onHome, onContinue, onRetryMissed }: DrillSummaryProps) {
  const pack = PACK_MAP.get(packId);

  const handleContinue = () => {
    if (newUnlocks.length > 0) onClearNotifications();
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-8 pb-8 space-y-5 text-center"
    >
      <div className="text-[52px]">{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '👍' : '💪'}</div>
      <div>
        <h2 className="text-[24px] font-bold">Drill Complete!</h2>
        <p className="text-[var(--color-text2)] text-[14px] mt-1">
          {pack?.name} · {FORM_NAMES[formStage]}
        </p>
      </div>

      {/* Score */}
      <div className="bg-[var(--color-surface)] rounded-[18px] p-5 mx-2">
        <div className="text-[42px] font-bold text-[var(--color-accent)]">{accuracy}%</div>
        <p className="text-[var(--color-text2)] text-[14px]">{correct} / {total} correct</p>
      </div>

      {/* New unlock notifications */}
      {newUnlocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 dark:bg-amber-900/20 rounded-[18px] p-4 mx-2 text-left"
        >
          <p className="text-[15px] font-bold text-amber-700 dark:text-amber-300 mb-1">
            🔓 New form unlocked!
          </p>
          {newUnlocks.map(stage => (
            <p key={stage} className="text-[13px] text-amber-600 dark:text-amber-400">
              {FORM_NAMES[stage]} is now available for {pack?.name}
            </p>
          ))}
        </motion.div>
      )}

      {onRetryMissed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="px-2"
        >
          <Button variant="secondary" fullWidth onClick={onRetryMissed}>
            🔄 Practice {missedVerbIds.length} missed verb{missedVerbIds.length !== 1 ? 's' : ''}
          </Button>
        </motion.div>
      )}

      <div className="flex gap-3 px-2">
        <Button variant="secondary" fullWidth onClick={onHome}>Home</Button>
        <Button variant="primary" fullWidth onClick={handleContinue}>
          Continue Drilling
        </Button>
      </div>
    </motion.div>
  );
}
