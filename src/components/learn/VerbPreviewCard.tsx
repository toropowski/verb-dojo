// src/components/learn/VerbPreviewCard.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Verb } from '../../types/verb';
import type { FormStage } from '../../types/drill';
import { VerbBadge } from '../verb/VerbBadge';
import { FuriganaText } from '../verb/FuriganaText';
import { Button } from '../ui/Button';

type Props = {
  verb: Verb;
  index: number;
  total: number;
  formStage: FormStage;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
};

type FormRow = {
  label: string;
  kanji: string;
  hiragana: string;
  isHighlighted: boolean;
};

function getFormRows(verb: Verb, formStage: FormStage): FormRow[] {
  const rows: FormRow[] = [];

  // ます form — always shown
  rows.push({
    label: 'ます form',
    kanji: verb.masuForm.kanji,
    hiragana: verb.masuForm.hiragana,
    isHighlighted: formStage === 'masu',
  });

  // て form — shown for te, negative, recall
  if (formStage === 'te' || formStage === 'negative' || formStage === 'recall') {
    rows.push({
      label: 'て form',
      kanji: verb.teForm.kanji,
      hiragana: verb.teForm.hiragana,
      isHighlighted: formStage === 'te',
    });
  }

  // negative form — shown for negative, recall
  if (formStage === 'negative' || formStage === 'recall') {
    rows.push({
      label: 'ない form',
      kanji: verb.negativeForm.kanji,
      hiragana: verb.negativeForm.hiragana,
      isHighlighted: formStage === 'negative',
    });
  }

  return rows;
}

export function VerbPreviewCard({
  verb,
  index,
  total,
  formStage,
  onNext,
  onPrev,
  isLast,
}: Props) {
  const [direction, setDirection] = useState(1);
  const formRows = getFormRows(verb, formStage);

  function handleNext() {
    setDirection(1);
        onNext();
  }

  function handlePrev() {
    setDirection(-1);
        onPrev();
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[460px] mx-auto px-4 py-6">

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === index ? 20 : 8,
              height: 8,
              background: i === index ? 'var(--color-accent)' : 'var(--color-surface2)',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={verb.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col gap-4"
        >
          {/* Main verb display */}
          <div
            className="rounded-[22px] p-6 flex flex-col items-center gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
            style={{ background: 'var(--color-surface)' }}
          >
            <VerbBadge group={verb.group} />

            <div className="flex flex-col items-center gap-1">
              <FuriganaText
                kanji={verb.dictionaryForm.kanji}
                hiragana={verb.dictionaryForm.hiragana}
                size="xl"
              />
            </div>

            <p className="text-[20px] font-bold text-[var(--color-text1)]">
              {verb.meaning}
            </p>

            <p className="text-[12px] text-[var(--color-text3)] font-mono">
              {verb.dictionaryForm.romaji}
            </p>
          </div>

          {/* Forms panel */}
          <div
            className="rounded-[18px] overflow-hidden border border-[var(--color-border)]"
            style={{ background: 'var(--color-surface2)' }}
          >
            {formRows.map((row, i) => (
              <div
                key={row.label}
                className={[
                  'flex items-center justify-between px-4 py-3',
                  i < formRows.length - 1 ? 'border-b border-[var(--color-border)]' : '',
                  'transition-colors duration-150',
                ].join(' ')}
                style={
                  row.isHighlighted
                    ? { background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }
                    : {}
                }
              >
                <span
                  className="text-[12px] font-semibold uppercase tracking-wide w-[72px] shrink-0"
                  style={
                    row.isHighlighted
                      ? { color: 'var(--color-accent)' }
                      : { color: 'var(--color-text3)' }
                  }
                >
                  {row.label}
                </span>
                <div className="flex items-baseline gap-2 min-w-0">
                  <span
                    className="font-jp font-bold text-[18px] truncate"
                    style={
                      row.isHighlighted
                        ? { color: 'var(--color-accent)' }
                        : { color: 'var(--color-text1)' }
                    }
                  >
                    {row.kanji}
                  </span>
                  <span className="text-[12px] text-[var(--color-text2)] font-jp shrink-0">
                    {row.hiragana}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Example sentence */}
          {verb.exampleSentence && (
            <div
              className="rounded-[16px] px-4 py-3 border border-[var(--color-border)]"
              style={{ background: 'var(--color-surface)' }}
            >
              <p className="font-jp text-[15px] text-[var(--color-text1)] leading-relaxed">
                {verb.exampleSentence.japanese}
              </p>
              <p className="text-[12px] text-[var(--color-text3)] font-jp mt-0.5">
                {verb.exampleSentence.hiragana}
              </p>
              <p className="text-[12px] text-[var(--color-text2)] mt-1 italic">
                {verb.exampleSentence.english}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="secondary"
          size="lg"
          onClick={handlePrev}
          disabled={index === 0}
          className="flex-1"
        >
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleNext}
          className="flex-[2]"
        >
          {isLast ? 'Start Drill →' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
