import { motion } from 'framer-motion';
import type { QuizQuestion } from '../../types/quiz';
import { FuriganaText } from '../verb/FuriganaText';
import { VerbBadge } from '../verb/VerbBadge';
import { useSettingsStore } from '../../store/useSettingsStore';

const MODE_PROMPT: Record<QuizQuestion['mode'], string> = {
  'dict-to-masu':      'What is the ます form?',
  'masu-to-dict':      'What is the dictionary form?',
  'dict-to-te':        'What is the て form?',
  'dict-to-negative':  'What is the negative form (〜ない)?',
  'meaning-to-masu':   'Write the ます form from memory',
};

const DIFFICULTY_OPTIONS = [
  { key: 'again' as const, label: 'Again',  interval: '<1d',  kbd: '1', color: 'bg-red-500 hover:bg-red-600' },
  { key: 'hard'  as const, label: 'Hard',   interval: '1d',   kbd: '2', color: 'bg-orange-400 hover:bg-orange-500' },
  { key: 'good'  as const, label: 'Good',   interval: '3d',   kbd: '3', color: 'bg-[var(--color-accent)] hover:opacity-90' },
  { key: 'easy'  as const, label: 'Easy',   interval: '7d+',  kbd: '4', color: 'bg-[var(--color-success)] hover:opacity-90' },
];

type Props = {
  question: QuizQuestion;
  showAnswer: boolean;
  lastCorrect?: boolean;
  userAnswer?: string;
  hint?: string;
  onDifficulty?: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
};

export function QuizCard({ question, showAnswer, lastCorrect, userAnswer, hint, onDifficulty }: Props) {
  const { verb, mode, correctAnswer } = question;
  const { showFurigana } = useSettingsStore();
  // What to show as the "question stimulus"
  const isMeaningMode = mode === 'meaning-to-masu';
  const promptForm = mode === 'masu-to-dict' ? verb.masuForm : verb.dictionaryForm;
  // After reveal, which form to highlight
  const targetLabel =
    mode === 'dict-to-masu'     ? 'ます form' :
    mode === 'masu-to-dict'     ? 'Dictionary' :
    mode === 'dict-to-te'       ? 'て form' :
    mode === 'dict-to-negative' ? 'Negative' :
    'ます form';

  return (
    <motion.div
      key={`${verb.id}-${mode}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className={[
        'w-full rounded-[22px] overflow-hidden bg-[var(--color-surface)]',
        'shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
        showAnswer
          ? lastCorrect ? 'ring-2 ring-[var(--color-success)]' : 'ring-2 ring-[var(--color-error)]'
          : '',
        'transition-shadow duration-200',
      ].join(' ')}
    >
      <div className="p-6 space-y-4">
        <VerbBadge group={verb.group} />

        {/* Verb display — hidden for meaning-to-masu until reveal */}
        {!isMeaningMode ? (
          <div className="text-center py-2">
            <FuriganaText kanji={promptForm.kanji} hiragana={promptForm.hiragana} size="xl" hideFurigana={!showFurigana} />
            <p className="text-[var(--color-text2)] text-[15px] mt-2">{verb.meaning}</p>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-[26px] font-bold text-[var(--color-text1)]">{verb.meaning}</p>
            <p className="text-[var(--color-text3)] text-[13px] mt-1">
              {showAnswer ? (
                <span className="font-jp">{verb.dictionaryForm.kanji} · {verb.dictionaryForm.hiragana}</span>
              ) : '?'}
            </p>
          </div>
        )}

        <p className="text-center text-[16px] font-semibold text-[var(--color-text1)]">
          {MODE_PROMPT[mode]}
        </p>

        {hint && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[var(--color-accent)] font-jp text-[20px] font-semibold"
          >
            {hint}…
          </motion.p>
        )}

        {/* Answer reveal */}
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={[
              'rounded-[14px] p-4 space-y-2',
              lastCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <span className="text-[20px]">{lastCorrect ? '✓' : '✗'}</span>
              <span className={['text-[15px] font-semibold', lastCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'].join(' ')}>
                {lastCorrect ? 'Correct!' : 'Not quite'}
              </span>
            </div>

            {!lastCorrect && userAnswer && (
              <p className="text-[13px] text-[var(--color-text2)]">
                You wrote: <span className="font-jp font-semibold text-[var(--color-error)]">{userAnswer}</span>
              </p>
            )}

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[12px] text-[var(--color-text3)]">{targetLabel}:</span>
              <span className="font-jp font-bold text-[20px] text-[var(--color-text1)]">{correctAnswer}</span>
              <span className="text-[12px] text-[var(--color-text3)]">
                ({mode === 'dict-to-masu' || mode === 'meaning-to-masu'
                  ? verb.masuForm.romaji
                  : mode === 'masu-to-dict'
                  ? verb.dictionaryForm.romaji
                  : mode === 'dict-to-te'
                  ? verb.teForm.romaji
                  : verb.negativeForm.romaji})
              </span>
            </div>

            {verb.exampleSentence && (
              <p className="text-[12px] text-[var(--color-text3)] italic border-t border-[var(--color-border)] pt-2 mt-2">
                {verb.exampleSentence.japanese} — {verb.exampleSentence.english}
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Difficulty bar */}
      {showAnswer && onDifficulty && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="border-t border-[var(--color-border)] px-4 py-3"
        >
          <p className="text-[11px] text-[var(--color-text3)] text-center mb-2 uppercase tracking-wide font-semibold">
            How well did you know it?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTY_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => onDifficulty(opt.key)}
                className={['flex flex-col items-center py-2 rounded-[10px] text-white transition-all active:scale-95', opt.color].join(' ')}
              >
                <span className="text-[13px] font-semibold">{opt.label}</span>
                <span className="text-[10px] opacity-80">{opt.interval}</span>
                <span className="text-[9px] opacity-50 mt-0.5">[{opt.kbd}]</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
