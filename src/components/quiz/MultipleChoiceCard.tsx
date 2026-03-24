// src/components/quiz/MultipleChoiceCard.tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DrillQuestion } from '../../types/drill';
import { FuriganaText } from '../verb/FuriganaText';
import { VerbBadge } from '../verb/VerbBadge';

type Props = {
  question: DrillQuestion;
  showResult: boolean;
  selectedOption: string | null;
  onSelect: (option: string) => void;
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const KEY_MAP: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

function getPromptLabel(question: DrillQuestion): string {
  switch (question.exerciseType) {
    case 'mc-form': {
      const { formStage } = resolveFormLabel(question);
      return `What is the ${formStage} form?`;
    }
    case 'mc-meaning':
      return 'What does this mean?';
    case 'mc-sentence-fill':
      return 'Choose the correct form:';
    default:
      return '';
  }
}

function resolveFormLabel(question: DrillQuestion): { formStage: string } {
  if (question.mcOptionType === 'form') {
    const ca = question.correctAnswer;
    if (ca.endsWith('ます') || ca.endsWith('ません')) return { formStage: 'ます' };
    if (ca.endsWith('て') || ca.endsWith('で')) return { formStage: 'て' };
    if (ca.endsWith('ない')) return { formStage: 'ない' };
  }
  return { formStage: 'correct' };
}

function renderSentenceTemplate(template: string): React.ReactNode {
  const parts = template.split('___');
  if (parts.length < 2) return <span className="font-jp">{template}</span>;

  return (
    <span className="font-jp">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-[6px] mx-1 font-bold text-white text-[15px]"
              style={{ background: 'var(--color-accent)' }}
            >
              ＿＿
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

type OptionState = 'idle' | 'correct' | 'wrong' | 'unselected-after';

function getOptionState(
  option: string,
  correctAnswer: string,
  selectedOption: string | null,
  showResult: boolean,
): OptionState {
  if (!showResult || selectedOption === null) return 'idle';
  if (option === correctAnswer) return 'correct';
  if (option === selectedOption) return 'wrong';
  return 'unselected-after';
}

const OPTION_STATE_STYLES: Record<OptionState, { wrapper: string; label: string; border: string }> = {
  idle: {
    wrapper: 'bg-[var(--color-surface2)] hover:opacity-90 active:scale-[0.97]',
    label: 'text-[var(--color-text3)]',
    border: 'border-[var(--color-border)]',
  },
  correct: {
    wrapper: 'bg-green-50 dark:bg-green-900/20',
    label: 'text-[var(--color-success)]',
    border: 'border-green-400 dark:border-green-600',
  },
  wrong: {
    wrapper: 'bg-red-50 dark:bg-red-900/20',
    label: 'text-[var(--color-error)]',
    border: 'border-red-400 dark:border-red-600',
  },
  'unselected-after': {
    wrapper: 'bg-[var(--color-surface2)] opacity-50',
    label: 'text-[var(--color-text3)]',
    border: 'border-[var(--color-border)]',
  },
};

export function MultipleChoiceCard({
  question,
  showResult,
  selectedOption,
  onSelect,
}: Props) {
  const { verb, exerciseType, correctAnswer, mcOptions = [], mcOptionType } = question;
  const isFormType = mcOptionType === 'form';
  const promptLabel = getPromptLabel(question);

  // A/B/C/D keyboard shortcuts
  useEffect(() => {
    if (showResult) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const idx = KEY_MAP[e.key.toLowerCase()];
      if (idx !== undefined && mcOptions[idx] !== undefined) {
        e.preventDefault();
        onSelect(mcOptions[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showResult, mcOptions, onSelect]);

  // Decide whether to show options in 2×2 grid or stacked
  const useStack = mcOptions.some((o) => o.length > 14);

  return (
    <motion.div
      key={`${verb.id}-${exerciseType}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className={[
        'w-full rounded-[22px] overflow-hidden bg-[var(--color-surface)]',
        'shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
        showResult && selectedOption
          ? selectedOption === correctAnswer
            ? 'ring-2 ring-[var(--color-success)]'
            : 'ring-2 ring-[var(--color-error)]'
          : '',
        'transition-shadow duration-200',
      ].join(' ')}
    >
      {/* Question area */}
      <div className="p-5 pb-4 space-y-4">
        <VerbBadge group={verb.group} />

        {/* Stimulus */}
        {exerciseType === 'mc-meaning' && (
          <div className="text-center py-2 space-y-1">
            <FuriganaText
              kanji={verb.dictionaryForm.kanji}
              hiragana={verb.dictionaryForm.hiragana}
              size="lg"
            />
            {showResult && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[14px] text-[var(--color-text2)]"
              >
                {verb.meaning}
              </motion.p>
            )}
          </div>
        )}

        {exerciseType === 'mc-form' && (
          <div className="text-center py-2 space-y-1">
            <FuriganaText
              kanji={verb.dictionaryForm.kanji}
              hiragana={verb.dictionaryForm.hiragana}
              size="lg"
            />
            <p className="text-[14px] text-[var(--color-text2)]">{verb.meaning}</p>
          </div>
        )}

        {exerciseType === 'mc-sentence-fill' && (
          <div className="space-y-2">
            <div
              className="rounded-[14px] px-4 py-3"
              style={{ background: 'var(--color-surface2)' }}
            >
              <p className="text-[17px] leading-loose text-[var(--color-text1)]">
                {renderSentenceTemplate(question.sentenceTemplate ?? '')}
              </p>
              {question.sentenceHiragana && (
                <p className="font-jp text-[12px] text-[var(--color-text3)] mt-1">
                  {question.sentenceHiragana}
                </p>
              )}
            </div>
            {question.sentenceEnglish && (
              <p className="text-[13px] text-[var(--color-text3)] italic px-1">
                {question.sentenceEnglish}
              </p>
            )}
          </div>
        )}

        {/* Prompt label */}
        <p className="text-center text-[15px] font-semibold text-[var(--color-text1)]">
          {promptLabel}
        </p>

        {/* Keyboard hint */}
        {!showResult && (
          <p className="text-center text-[11px] text-[var(--color-text3)]">
            Press A · B · C · D to select
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mx-5" style={{ background: 'var(--color-border)' }} />

      {/* Options */}
      <div className="p-4">
        <div
          className={[
            useStack ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-2',
          ].join(' ')}
        >
          {mcOptions.map((option, i) => {
            const state = getOptionState(option, correctAnswer, selectedOption, showResult);
            const styles = OPTION_STATE_STYLES[state];
            const isCorrectAndResult = showResult && option === correctAnswer;

            return (
              <motion.button
                key={option}
                whileTap={!showResult ? { scale: 0.97 } : {}}
                // Shake the wrong option when result is shown
                animate={state === 'wrong' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                onClick={() => !showResult && onSelect(option)}
                disabled={showResult}
                className={[
                  'relative flex items-center justify-center rounded-[14px]',
                  'min-h-[52px] px-4 py-3 border-2',
                  'text-left transition-all duration-150 cursor-pointer',
                  'disabled:cursor-default',
                  styles.wrapper,
                  styles.border,
                ].join(' ')}
              >
                {/* A/B/C/D label */}
                <span
                  className={[
                    'absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wide',
                    styles.label,
                  ].join(' ')}
                >
                  {OPTION_LABELS[i]}
                </span>

                {/* Result icon */}
                {showResult && state === 'correct' && (
                  <span className="absolute top-2 right-3 text-[var(--color-success)] text-[14px] font-bold">
                    ✓
                  </span>
                )}
                {showResult && state === 'wrong' && (
                  <span className="absolute top-2 right-3 text-[var(--color-error)] text-[14px] font-bold">
                    ✗
                  </span>
                )}

                {/* Option text */}
                <span
                  className={[
                    'text-center leading-snug mt-2',
                    isFormType ? 'font-jp font-bold text-[18px]' : 'text-[14px] font-medium',
                    isCorrectAndResult
                      ? 'text-[var(--color-success)]'
                      : state === 'wrong'
                      ? 'text-[var(--color-error)]'
                      : 'text-[var(--color-text1)]',
                  ].join(' ')}
                >
                  {option}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
