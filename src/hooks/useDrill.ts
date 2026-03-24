import { useState, useCallback, useRef } from 'react';
import type { DrillConfig, DrillQuestion, DrillAnswer, DrillPhase, DrillSession } from '../types/drill';
import { buildDrillQuestions } from '../lib/drillBuilder';
import { useProgressStore } from '../store/useProgressStore';
import { VERB_MAP } from '../data/verbs';
import { PACK_MAP } from '../data/verbPacks';
import { checkAnswer } from '../lib/wanakana';

function getAllPackVerbs(packId: string) {
  const pack = PACK_MAP.get(packId);
  if (!pack) return [];
  return pack.verbIds.map(id => VERB_MAP.get(id)).filter(Boolean) as ReturnType<typeof VERB_MAP.get>[];
}

export function useDrill() {
  const { submitAnswer, markDrillComplete, drillProgress } = useProgressStore();

  const [session, setSession] = useState<DrillSession | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lastUserAnswer, setLastUserAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  const phase: DrillPhase = session?.phase ?? 'idle';
  const currentQuestion: DrillQuestion | null = session
    ? session.questions[session.currentIndex] ?? null
    : null;

  const startDrill = useCallback((config: DrillConfig) => {
    const allPackVerbs = getAllPackVerbs(config.packId).filter(Boolean) as NonNullable<ReturnType<typeof VERB_MAP.get>>[];
    const questions = buildDrillQuestions(config, allPackVerbs);

    // Check whether to show grammar intro
    const packProg = drillProgress[config.packId];
    const introAlreadyShown = packProg?.shownIntroForForms.includes(config.formStage) ?? false;
    const startPhase: DrillPhase = (config.isFirstIntroduction && !introAlreadyShown)
      ? 'intro'
      : config.isFirstIntroduction
        ? 'verb-preview'
        : 'drilling';

    setSession({
      config,
      questions,
      answers: [],
      currentIndex: 0,
      startedAt: Date.now(),
      phase: startPhase,
      verbPreviewIndex: 0,
    });
    setShowAnswer(false);
    setLastUserAnswer('');
    setHint('');
    setHintLevel(0);
    startTimeRef.current = Date.now();
  }, [drillProgress]);

  /** Move from intro → verb-preview (or drilling if not first intro) */
  const advanceFromIntro = useCallback(() => {
    setSession(s => s ? {
      ...s,
      phase: s.config.isFirstIntroduction ? 'verb-preview' : 'drilling',
    } : null);
  }, []);

  /** Move through verb preview cards */
  const nextVerbPreview = useCallback(() => {
    setSession(s => {
      if (!s) return s;
      const totalVerbs = s.config.verbIds.length;
      if (s.verbPreviewIndex + 1 >= totalVerbs) {
        return { ...s, phase: 'drilling', verbPreviewIndex: 0 };
      }
      return { ...s, verbPreviewIndex: s.verbPreviewIndex + 1 };
    });
  }, []);

  const prevVerbPreview = useCallback(() => {
    setSession(s => {
      if (!s || s.verbPreviewIndex === 0) return s;
      return { ...s, verbPreviewIndex: s.verbPreviewIndex - 1 };
    });
  }, []);

  /** Submit typed answer */
  const submitTypedAnswer = useCallback((userInput: string) => {
    if (!session || !currentQuestion) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    const correct = checkAnswer(userInput, currentQuestion.correctAnswer);

    setLastCorrect(correct);
    setLastUserAnswer(userInput);
    setShowAnswer(true);
    setHint('');

    // Feed SRS for dict-to-masu and masu-to-dict typed exercises
    if (currentQuestion.exerciseType === 'type-dict-to-masu') {
      submitAnswer(currentQuestion.verb.id, 'dictionary', correct, responseTimeMs);
    } else if (currentQuestion.exerciseType === 'type-masu-to-dict') {
      submitAnswer(currentQuestion.verb.id, 'masu', correct, responseTimeMs);
    }

    const answer: DrillAnswer = {
      verbId: currentQuestion.verb.id,
      exerciseType: currentQuestion.exerciseType,
      userAnswer: userInput,
      correct,
      responseTimeMs,
    };

    setSession(s => s ? { ...s, answers: [...s.answers, answer] } : null);
  }, [session, currentQuestion, submitAnswer]);

  /** Submit multiple-choice answer */
  const submitMCAnswer = useCallback((selectedOption: string) => {
    if (!session || !currentQuestion) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    const correct = selectedOption === currentQuestion.correctAnswer;

    setLastCorrect(correct);
    setLastUserAnswer(selectedOption);
    setShowAnswer(true);
    setHint('');

    const answer: DrillAnswer = {
      verbId: currentQuestion.verb.id,
      exerciseType: currentQuestion.exerciseType,
      userAnswer: selectedOption,
      correct,
      responseTimeMs,
    };

    setSession(s => s ? { ...s, answers: [...s.answers, answer] } : null);
  }, [session, currentQuestion]);

  /** Advance to next question or finish drill */
  const nextQuestion = useCallback(() => {
    if (!session) return;
    setShowAnswer(false);
    setLastUserAnswer('');
    setHint('');
    setHintLevel(0);

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      // Drill complete — save results
      markDrillComplete(session.config, [...session.answers]);
      setSession(s => s ? { ...s, phase: 'done' } : null);
    } else {
      setSession(s => s ? { ...s, currentIndex: nextIndex } : null);
      startTimeRef.current = Date.now();
    }
  }, [session, markDrillComplete]);

  const revealHint = useCallback(() => {
    if (!currentQuestion) return;
    const answer = currentQuestion.correctAnswer;
    setHintLevel(prev => {
      const next = Math.min(prev + 1, answer.length - 1);
      setHint(answer.slice(0, next));
      return next;
    });
  }, [currentQuestion]);

  const skipQuestion = useCallback(() => {
    if (!session || !currentQuestion) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    setLastCorrect(false);
    setLastUserAnswer('');
    setShowAnswer(true);
    setHint('');
    setHintLevel(0);

    if (currentQuestion.exerciseType === 'type-dict-to-masu') {
      submitAnswer(currentQuestion.verb.id, 'dictionary', false, responseTimeMs);
    } else if (currentQuestion.exerciseType === 'type-masu-to-dict') {
      submitAnswer(currentQuestion.verb.id, 'masu', false, responseTimeMs);
    }

    const answer: DrillAnswer = {
      verbId: currentQuestion.verb.id,
      exerciseType: currentQuestion.exerciseType,
      userAnswer: '',
      correct: false,
      responseTimeMs,
    };
    setSession(s => s ? { ...s, answers: [...s.answers, answer] } : null);
  }, [session, currentQuestion, submitAnswer]);

  const resetDrill = useCallback(() => {
    setSession(null);
    setShowAnswer(false);
    setLastUserAnswer('');
    setHint('');
    setHintLevel(0);
    setLastCorrect(false);
  }, []);

  const accuracy = session && session.answers.length > 0
    ? Math.round((session.answers.filter(a => a.correct).length / session.answers.length) * 100)
    : 0;

  const progressPct = session && session.questions.length > 0
    ? ((session.currentIndex + (showAnswer ? 1 : 0)) / session.questions.length) * 100
    : 0;

  const hintMaxed = currentQuestion
    ? hintLevel >= currentQuestion.correctAnswer.length - 1
    : false;

  return {
    // State
    phase,
    session,
    currentQuestion,
    showAnswer,
    lastCorrect,
    lastUserAnswer,
    hint,
    hintMaxed,
    accuracy,
    progressPct,
    // Actions
    startDrill,
    advanceFromIntro,
    nextVerbPreview,
    prevVerbPreview,
    submitTypedAnswer,
    submitMCAnswer,
    nextQuestion,
    revealHint,
    skipQuestion,
    resetDrill,
  };
}
