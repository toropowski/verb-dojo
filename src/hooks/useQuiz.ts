import { useState, useCallback, useRef } from 'react';
import type { QuizQuestion, QuizAnswer, QuizMode, SessionConfig } from '../types/quiz';
import { VERBS, VERB_MAP } from '../data/verbs';
import { VERB_PACKS } from '../data/verbPacks';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { checkAnswer } from '../lib/wanakana';

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeQuestion(verbId: string, mode: QuizMode): QuizQuestion | null {
  const verb = VERB_MAP.get(verbId);
  if (!verb) return null;
  const correctAnswer =
    mode === 'dict-to-masu'     ? verb.masuForm.hiragana :
    mode === 'masu-to-dict'     ? verb.dictionaryForm.hiragana :
    mode === 'dict-to-te'       ? verb.teForm.hiragana :
    mode === 'dict-to-negative' ? verb.negativeForm.hiragana :
    /* meaning-to-masu */         verb.masuForm.hiragana;
  return { verb, mode, correctAnswer, startTime: Date.now() };
}

export function useQuiz() {
  const { getDueCards, getNewCards, submitAnswer } = useProgressStore();
  const { dailyNewLimit } = useSettingsStore();

  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [index, setIndex]           = useState(0);
  const [answers, setAnswers]       = useState<QuizAnswer[]>([]);
  const [status, setStatus]         = useState<'idle' | 'active' | 'feedback' | 'done'>('idle');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hint, setHint]             = useState('');
  const startTimeRef = useRef<number>(Date.now());

  const startSession = useCallback((config: SessionConfig) => {
    const qs: QuizQuestion[] = [];

    if (config.type === 'srs') {
      // SRS: due cards + new cards (dict-to-masu / masu-to-dict only)
      const due    = getDueCards();
      const newOnes = getNewCards(dailyNewLimit);
      for (const card of due) {
        const mode: QuizMode = card.form === 'dictionary' ? 'dict-to-masu' : 'masu-to-dict';
        const q = makeQuestion(card.verbId, mode);
        if (q) qs.push(q);
      }
      for (const card of newOnes) {
        const q = makeQuestion(card.verbId, 'dict-to-masu');
        if (q) qs.push(q);
      }
      // Free practice fallback (all unlocked verbs)
      if (qs.length === 0) {
        for (const verb of VERBS) {
          const q = makeQuestion(verb.id, 'dict-to-masu');
          if (q) qs.push(q);
        }
      }
    } else {
      // Custom: build from selected packs × forms × groups
      const selectedVerbIds = new Set(
        VERB_PACKS
          .filter(p => config.packIds.includes(p.id))
          .flatMap(p => p.verbIds)
      );
      const verbsInScope = VERBS.filter(v =>
        selectedVerbIds.has(v.id) && config.groups.includes(v.group)
      );

      const modeMap: Record<string, QuizMode> = {
        masu:     'dict-to-masu',
        te:       'dict-to-te',
        negative: 'dict-to-negative',
        recall:   'meaning-to-masu',
      };

      for (const verb of verbsInScope) {
        for (const form of config.forms) {
          const q = makeQuestion(verb.id, modeMap[form]);
          if (q) qs.push(q);
        }
      }

      if (qs.length === 0) {
        for (const verb of VERBS) {
          const q = makeQuestion(verb.id, 'dict-to-masu');
          if (q) qs.push(q);
        }
      }
    }

    const shuffled = shuffle(qs).slice(0, 20);
    setQuestions(shuffled);
    setIndex(0);
    setAnswers([]);
    setStatus('active');
    setShowAnswer(false);
    setHint('');
    startTimeRef.current = Date.now();
  }, [getDueCards, getNewCards, dailyNewLimit]);

  const revealHint = useCallback(() => {
    const q = questions[index];
    if (!q) return;
    setHint(q.correctAnswer[0] ?? '');
  }, [questions, index]);

  const submitUserAnswer = useCallback((userInput: string) => {
    const q = questions[index];
    if (!q) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    const correct = checkAnswer(userInput, q.correctAnswer);
    setLastCorrect(correct);
    setShowAnswer(true);
    setStatus('feedback');
    setHint('');
    // Only feed SRS for dict-to-masu and masu-to-dict (SRS tracks those forms)
    if (q.mode === 'dict-to-masu' || q.mode === 'masu-to-dict') {
      submitAnswer(q.verb.id, q.mode === 'dict-to-masu' ? 'dictionary' : 'masu', correct, responseTimeMs);
    }
    setAnswers(prev => [...prev, { verbId: q.verb.id, mode: q.mode, userAnswer: userInput, correct, responseTimeMs }]);
  }, [questions, index, submitAnswer]);

  const nextQuestion = useCallback(() => {
    setShowAnswer(false);
    setHint('');
    if (index + 1 >= questions.length) {
      setStatus('done');
    } else {
      setIndex(i => i + 1);
      setStatus('active');
      startTimeRef.current = Date.now();
    }
  }, [index, questions.length]);

  const retryMissed = useCallback((verbIds: string[]) => {
    const qs: QuizQuestion[] = [];
    for (const verbId of verbIds) {
      const q = makeQuestion(verbId, 'dict-to-masu');
      if (q) qs.push(q);
    }
    if (qs.length === 0) return;
    setQuestions(shuffle(qs));
    setIndex(0);
    setAnswers([]);
    setStatus('active');
    setShowAnswer(false);
    setHint('');
    startTimeRef.current = Date.now();
  }, []);

  const skipQuestion = useCallback(() => {
    const q = questions[index];
    if (!q) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    setLastCorrect(false);
    setShowAnswer(true);
    setStatus('feedback');
    setHint('');
    if (q.mode === 'dict-to-masu' || q.mode === 'masu-to-dict') {
      submitAnswer(q.verb.id, q.mode === 'dict-to-masu' ? 'dictionary' : 'masu', false, responseTimeMs);
    }
    setAnswers(prev => [...prev, { verbId: q.verb.id, mode: q.mode, userAnswer: '', correct: false, responseTimeMs }]);
  }, [questions, index, submitAnswer]);

  const accuracy = answers.length > 0
    ? Math.round((answers.filter(a => a.correct).length / answers.length) * 100)
    : 0;

  return {
    status, currentQuestion: questions[index], questions, index, answers,
    lastCorrect, showAnswer, hint, accuracy,
    startSession, submitUserAnswer, nextQuestion, skipQuestion, revealHint, retryMissed,
  };
}
