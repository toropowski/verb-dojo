import { motion } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { QuizAnswer } from '../../types/quiz';
import { VERB_MAP } from '../../data/verbs';

type Props = {
  open: boolean;
  answers: QuizAnswer[];
  accuracy: number;
  onHome: () => void;
  onRetry: () => void;
  onRetryMissed?: (verbIds: string[]) => void;
};

function AccuracyRing({ accuracy }: { accuracy: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (accuracy / 100) * circ;
  const color = accuracy >= 80 ? 'var(--color-success)' : accuracy >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
  const emoji = accuracy >= 90 ? '🎉' : accuracy >= 70 ? '👍' : accuracy >= 50 ? '📚' : '💪';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface2)" strokeWidth="9" />
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-text1)">{accuracy}%</text>
        <text x="50" y="62" textAnchor="middle" fontSize="16">{emoji}</text>
      </svg>
    </div>
  );
}

export function SessionSummary({ open, answers, accuracy, onHome, onRetry, onRetryMissed }: Props) {
  const correct = answers.filter(a => a.correct).length;
  const incorrect = answers.filter(a => !a.correct);
  const missedVerbIds = [...new Set(incorrect.map(a => a.verbId))];
  const avgTime = answers.length > 0
    ? Math.round(answers.reduce((s, a) => s + a.responseTimeMs, 0) / answers.length / 100) / 10
    : 0;

  const message = accuracy >= 90
    ? 'Excellent work! 🌟'
    : accuracy >= 70
    ? 'Good job! Keep it up.'
    : accuracy >= 50
    ? 'Nice effort. Review the missed ones!'
    : 'Keep practicing — you\'ll get there!';

  return (
    <Modal open={open} title="Session Complete">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-1">
          <AccuracyRing accuracy={accuracy} />
          <p className="font-semibold text-[16px] text-[var(--color-text1)]">{correct} / {answers.length} correct</p>
          <p className="text-[var(--color-text2)] text-[13px]">{message}</p>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[var(--color-surface2)] rounded-[10px] p-2 text-center">
            <p className="text-[18px] font-bold text-[var(--color-success)]">{correct}</p>
            <p className="text-[10px] text-[var(--color-text3)]">Correct</p>
          </div>
          <div className="bg-[var(--color-surface2)] rounded-[10px] p-2 text-center">
            <p className="text-[18px] font-bold text-[var(--color-error)]">{answers.length - correct}</p>
            <p className="text-[10px] text-[var(--color-text3)]">Missed</p>
          </div>
          <div className="bg-[var(--color-surface2)] rounded-[10px] p-2 text-center">
            <p className="text-[18px] font-bold">{avgTime}s</p>
            <p className="text-[10px] text-[var(--color-text3)]">Avg time</p>
          </div>
        </div>

        {/* Missed verbs */}
        {incorrect.length > 0 && (
          <div className="space-y-1">
            <p className="text-[12px] font-semibold text-[var(--color-text3)] uppercase tracking-wide">
              Review these ({incorrect.length})
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {incorrect.map((a, i) => {
                const verb = VERB_MAP.get(a.verbId);
                if (!verb) return null;
                const correct = a.mode === 'dict-to-masu' ? verb.masuForm : verb.dictionaryForm;
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-[10px] bg-red-50 dark:bg-red-900/15">
                    <div className="flex items-center gap-2">
                      <span className="font-jp font-bold text-[15px]">{verb.dictionaryForm.kanji}</span>
                      <span className="text-[var(--color-text3)] text-[12px]">{verb.meaning}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-jp text-[14px] font-semibold text-[var(--color-text1)]">{correct.hiragana}</span>
                      {a.userAnswer && (
                        <p className="font-jp text-[11px] text-[var(--color-error)] line-through">{a.userAnswer}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All correct celebration */}
        {incorrect.length === 0 && answers.length > 0 && (
          <div className="text-center py-2">
            <p className="text-[28px]">🏆</p>
            <p className="text-[var(--color-success)] font-semibold text-[14px]">Perfect score!</p>
          </div>
        )}

        <div className="space-y-2">
          {missedVerbIds.length > 0 && onRetryMissed && (
            <Button variant="secondary" fullWidth onClick={() => onRetryMissed(missedVerbIds)}>
              🔁 Retry {missedVerbIds.length} missed verb{missedVerbIds.length > 1 ? 's' : ''}
            </Button>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={onHome}>Home</Button>
            <Button variant="primary" fullWidth onClick={onRetry}>Practice Again</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
