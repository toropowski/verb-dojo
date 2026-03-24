import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { VERBS } from '../data/verbs';
import { VERB_PACKS } from '../data/verbPacks';
import { getMasteryLevel } from '../lib/srs';
import { Button } from '../components/ui/Button';
import { VerbBadge } from '../components/verb/VerbBadge';
import { SettingsModal } from '../components/ui/SettingsModal';

const todayStr = () => new Date().toISOString().slice(0, 10);

function MasteryRing({ percent }: { percent: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = percent > 0 ? Math.max((percent / 100) * circ, 4) : 0;
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--color-surface2)" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="10"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="65" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-text1)">{percent}%</text>
      <text x="65" y="78" textAnchor="middle" fontSize="11" fill="var(--color-text2)">mastered</text>
    </svg>
  );
}

function WeeklyChart({ dailyStats }: { dailyStats: { date: string; reviewed: number; correct: number }[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const stat = dailyStats.find(s => s.date === dateStr);
    return { label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1), dateStr, reviewed: stat?.reviewed ?? 0, correct: stat?.correct ?? 0, isToday: i === 6 };
  });
  const maxReviewed = Math.max(...days.map(d => d.reviewed), 1);
  return (
    <div className="bg-[var(--color-surface)] rounded-[16px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <p className="text-[13px] font-semibold text-[var(--color-text2)] mb-3">Last 7 Days</p>
      <div className="flex items-end gap-1.5 h-16">
        {days.map((day, i) => {
          const heightPct = day.reviewed > 0 ? (day.reviewed / maxReviewed) * 100 : 0;
          const accuracyPct = day.reviewed > 0 ? day.correct / day.reviewed : 0;
          return (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end h-12 relative">
                {day.reviewed > 0 ? (
                  <motion.div
                    className="w-full rounded-t-[4px] relative overflow-hidden"
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                    style={{ originY: 1, height: `${heightPct}%`, minHeight: 4 }}
                  >
                    <div className="absolute inset-0 bg-[var(--color-accent)] opacity-25 rounded-t-[4px]" />
                    <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-accent)] rounded-t-[4px]"
                      style={{ height: `${accuracyPct * 100}%` }} />
                  </motion.div>
                ) : (
                  <div className="w-full h-1 bg-[var(--color-surface2)] rounded-full" />
                )}
              </div>
              <span className={['text-[10px] font-medium', day.isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text3)]'].join(' ')}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[var(--color-text3)] mt-2">Darker = correct · Lighter = total</p>
    </div>
  );
}

function PackCard({ pack, unlocked, progress }: {
  pack: typeof VERB_PACKS[0];
  unlocked: boolean;
  progress: { learned: number; total: number; mastered: number };
}) {
  const pct = Math.round((progress.learned / progress.total) * 100);
  return (
    <div className={[
      'bg-[var(--color-surface)] rounded-[16px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]',
      !unlocked && 'opacity-60',
    ].join(' ')}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[22px]">{unlocked ? pack.emoji : '🔒'}</span>
          <div>
            <p className="font-semibold text-[14px]">{pack.name}</p>
            <p className="text-[11px] text-[var(--color-text3)]">{pack.verbIds.length} verbs</p>
          </div>
        </div>
        <span className="text-[13px] font-bold text-[var(--color-accent)]">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-[var(--color-surface2)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: pct === 100 ? 'var(--color-success)' : 'var(--color-accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[11px] text-[var(--color-text3)] mt-1.5">
        {unlocked
          ? `${progress.learned} learned · ${progress.mastered} mastered`
          : pack.unlocksAfter
            ? `Learn ${pack.unlocksAfter.minLearned} verbs from previous pack`
            : 'Complete previous pack to unlock'}
      </p>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { initCards, cards, getDueCards, getNewCards, streak, getTodayStats,
          getTotalMastered, getOverallAccuracy, dailyStats, isPackUnlocked, getPackProgress,
          lastStudyDate } = useProgressStore();
  const { theme, toggleTheme } = useSettingsStore();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const streakAtRisk = streak > 1 && lastStudyDate !== todayStr();

  useEffect(() => { initCards(); }, [initCards]);

  const dueCount     = getDueCards().length;
  const newCount     = getNewCards(5).length;
  const todayStats   = getTodayStats();
  const totalMastered = getTotalMastered();
  const totalCards   = VERBS.length * 2;
  const masteryPercent = Math.round((totalMastered / totalCards) * 100);
  const accuracy     = getOverallAccuracy();

  const recentVerbs = Object.values(cards)
    .filter(c => c.lastReview !== null && c.form === 'dictionary')
    .sort((a, b) => (b.lastReview ?? 0) - (a.lastReview ?? 0))
    .slice(0, 3)
    .map(c => VERBS.find(v => v.id === c.verbId))
    .filter(Boolean) as typeof VERBS;

  const levelColor: Record<string, string> = {
    new: 'text-[var(--color-text3)]', learning: 'text-[var(--color-warning)]',
    reviewing: 'text-[var(--color-accent)]', mastered: 'text-[var(--color-success)]',
  };

  return (
    <div className="pt-6 pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">動詞道場</h1>
          <p className="text-[var(--color-text2)] text-[14px]">Verb Dojo</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} aria-label="Toggle theme"
            className="w-10 h-10 rounded-full bg-[var(--color-surface2)] flex items-center justify-center text-[18px] hover:opacity-80 transition-opacity">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => setShowSettings(true)} aria-label="Open settings"
            className="w-10 h-10 rounded-full bg-[var(--color-surface2)] flex items-center justify-center text-[18px] hover:opacity-80 transition-opacity">
            ⚙️
          </button>
        </div>
      </div>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />

      {/* Streak */}
      {streak > 0 && (
        <div className="bg-[var(--color-surface)] rounded-[16px] p-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <span className="text-[28px]">🔥</span>
          <div>
            <p className="font-bold text-[16px]">{streak}-day streak!</p>
            <p className="text-[var(--color-text2)] text-[13px]">Keep it going</p>
          </div>
          <div className="ml-auto flex gap-1">
            {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-orange-400"
                style={{ opacity: 0.3 + (i / Math.min(streak, 7)) * 0.7 }} />
            ))}
          </div>
        </div>
      )}

      {/* Streak at risk warning */}
      {streakAtRisk && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-700/50 rounded-[14px] px-4 py-3 flex items-center gap-3"
        >
          <span className="text-[22px]">⚠️</span>
          <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">
            Study today to keep your <span className="font-bold">{streak}-day streak!</span>
          </p>
        </motion.div>
      )}

      {/* CTA */}
      <div className="space-y-2">
        <Button variant="primary" fullWidth size="lg" onClick={() => navigate('/learn')} className="shadow-lg">
          {dueCount + newCount > 0 ? `Start Practice  ·  ${dueCount + newCount} cards` : 'Practice'}
        </Button>
        <div className="flex justify-center gap-4">
          {dueCount > 0 && <span className="text-[12px] text-[var(--color-accent)]">{dueCount} due for review</span>}
          {newCount > 0 && <span className="text-[12px] text-[var(--color-success)]">{newCount} new</span>}
          {dueCount + newCount === 0 && <span className="text-[12px] text-[var(--color-success)]">All caught up! ✓</span>}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[var(--color-surface)] rounded-[16px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <button onClick={() => setShowHowItWorks(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">❓</span>
            <span className="font-semibold text-[14px]">How does this app work?</span>
          </div>
          <span className="text-[var(--color-text3)] text-[12px]">{showHowItWorks ? '▲' : '▼'}</span>
        </button>
        {showHowItWorks && (
          <div className="px-4 pb-4 border-t border-[var(--color-border)] space-y-3">
            <div className="space-y-2 pt-3">
              {[
                { step: '1', emoji: '🌱', title: 'Unlock verb packs', body: 'Start with 10 core verbs. Practice them to unlock the next pack of 15, then 20 more.' },
                { step: '2', emoji: '📝', title: 'Learn conjugation forms', body: 'Practice ます form first. Once comfortable, add て form, negative, and recall mode from the Practice screen.' },
                { step: '3', emoji: '⚡', title: 'Spaced repetition (SRS)', body: 'The app tracks how well you know each verb and resurfaces it at exactly the right time — not too soon, not too late.' },
                { step: '4', emoji: '🎯', title: 'Difficulty rating', body: 'After each answer, rate how hard it was. "Again" resets the card; "Easy" pushes it far into the future.' },
                { step: '5', emoji: '📊', title: 'Track progress', body: 'See your mastery ring grow. A verb is "mastered" after 4+ successful reviews with increasing intervals.' },
              ].map(({ step, emoji, title, body }) => (
                <div key={step} className="flex gap-3">
                  <span className="text-[18px] shrink-0">{emoji}</span>
                  <div>
                    <p className="font-semibold text-[13px]">{title}</p>
                    <p className="text-[var(--color-text2)] text-[12px] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
        <MasteryRing percent={masteryPercent} />
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: totalMastered, label: 'Mastered', color: 'var(--color-accent)' },
            { val: `${accuracy}%`, label: 'Accuracy', color: 'var(--color-success)' },
            { val: todayStats.reviewed, label: 'Today', color: undefined },
            { val: VERBS.length, label: 'Verbs', color: undefined },
          ].map(({ val, label, color }) => (
            <div key={label} className="bg-[var(--color-surface)] rounded-[12px] p-3 text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <p className="text-[22px] font-bold" style={color ? { color } : undefined}>{val}</p>
              <p className="text-[11px] text-[var(--color-text2)]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly chart */}
      <WeeklyChart dailyStats={dailyStats} />

      {/* Verb packs */}
      <div className="space-y-2">
        <h2 className="font-semibold text-[16px]">Verb Packs</h2>
        <div className="space-y-2">
          {VERB_PACKS.map(pack => (
            <PackCard
              key={pack.id}
              pack={pack}
              unlocked={isPackUnlocked(pack.id)}
              progress={getPackProgress(pack.id)}
            />
          ))}
        </div>
      </div>

      {/* Recently practiced */}
      {recentVerbs.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-[16px]">Recently Practiced</h2>
          <div className="space-y-2">
            {recentVerbs.map(verb => {
              const card = cards[`${verb.id}:dictionary`];
              const level = card ? getMasteryLevel(card) : 'new';
              return (
                <div key={verb.id} className="bg-[var(--color-surface)] rounded-[14px] px-4 py-3 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <VerbBadge group={verb.group} />
                    <div>
                      <p className="font-jp font-bold text-[16px]">{verb.dictionaryForm.kanji}</p>
                      <p className="text-[var(--color-text2)] text-[12px]">{verb.meaning}</p>
                    </div>
                  </div>
                  <span className={['text-[12px] font-semibold capitalize', levelColor[level]].join(' ')}>{level}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/reference')}
          className="bg-[var(--color-surface)] rounded-[16px] p-4 text-left hover:opacity-80 transition-opacity shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="text-[24px] mb-1">📖</div>
          <p className="font-semibold text-[15px]">Reference</p>
          <p className="text-[var(--color-text2)] text-[12px]">Rules & tables</p>
        </button>
        <button onClick={() => navigate('/progress')}
          className="bg-[var(--color-surface)] rounded-[16px] p-4 text-left hover:opacity-80 transition-opacity shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="text-[24px] mb-1">📊</div>
          <p className="font-semibold text-[15px]">Progress</p>
          <p className="text-[var(--color-text2)] text-[12px]">Your stats</p>
        </button>
      </div>
    </div>
  );
}
