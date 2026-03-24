import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '../store/useProgressStore';
import { VERBS } from '../data/verbs';
import { VERB_PACKS } from '../data/verbPacks';
import { getMasteryLevel } from '../lib/srs';
import type { MasteryLevel } from '../types/progress';
import { VerbBadge } from '../components/verb/VerbBadge';

type Tab = 'packs' | 'cards';
type Filter = 'all' | MasteryLevel;

// ── Shared helpers ──────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<MasteryLevel, string> = {
  new:       'text-[var(--color-text3)]',
  learning:  'text-[var(--color-warning)]',
  reviewing: 'text-[var(--color-accent)]',
  mastered:  'text-[var(--color-success)]',
};

const LEVEL_BG: Record<MasteryLevel, string> = {
  new:       'bg-[var(--color-surface2)]',
  learning:  'bg-amber-50 dark:bg-amber-900/20',
  reviewing: 'bg-blue-50 dark:bg-blue-900/20',
  mastered:  'bg-green-50 dark:bg-green-900/20',
};

// ── Sub-components ──────────────────────────────────────────────────────────

function BigRing({ percent }: { percent: number }) {
  const r = 65;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-surface2)" strokeWidth="12" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="12"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="80" y="75" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--color-text1)">{percent}%</text>
      <text x="80" y="96" textAnchor="middle" fontSize="12" fill="var(--color-text2)">mastered</text>
    </svg>
  );
}

function MasteryBar({ level }: { level: MasteryLevel }) {
  const fill: Record<MasteryLevel, number> = { new: 0, learning: 25, reviewing: 60, mastered: 100 };
  const color: Record<MasteryLevel, string> = {
    new:       'bg-[var(--color-text3)]',
    learning:  'bg-[var(--color-warning)]',
    reviewing: 'bg-[var(--color-accent)]',
    mastered:  'bg-[var(--color-success)]',
  };
  return (
    <div className="w-20 h-1.5 bg-[var(--color-surface2)] rounded-full overflow-hidden">
      <div className={['h-full rounded-full transition-all', color[level]].join(' ')}
        style={{ width: `${fill[level]}%` }} />
    </div>
  );
}

// ── Packs tab ───────────────────────────────────────────────────────────────

function PacksTab() {
  const { isPackUnlocked, getPackProgress, cards } = useProgressStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {VERB_PACKS.map((pack, i) => {
        const unlocked = isPackUnlocked(pack.id);
        const progress = getPackProgress(pack.id);
        const pct = Math.round((progress.learned / progress.total) * 100);
        const isOpen = expanded === pack.id;

        // Per-verb mastery for expanded view
        const verbRows = pack.verbIds.map(vid => {
          const verb = VERBS.find(v => v.id === vid);
          const card = verb ? cards[`${vid}:dictionary`] : undefined;
          const level: MasteryLevel = card ? getMasteryLevel(card) : 'new';
          return { verb, level };
        }).filter(r => r.verb) as { verb: typeof VERBS[0]; level: MasteryLevel }[];

        return (
          <div key={pack.id}
            className={['bg-[var(--color-surface)] rounded-[18px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
              !unlocked && 'opacity-60'].join(' ')}>

            {/* Header row */}
            <button
              className="w-full flex items-center gap-3 px-4 py-4 text-left"
              onClick={() => unlocked && setExpanded(isOpen ? null : pack.id)}
              disabled={!unlocked}
            >
              <div className="relative shrink-0">
                <span className="text-[26px]">{unlocked ? pack.emoji : '🔒'}</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-surface2)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text3)]">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-[15px]">{pack.name}</p>
                  <span className="text-[13px] font-bold text-[var(--color-accent)] ml-2">{pct}%</span>
                </div>
                <p className="text-[var(--color-text3)] text-[12px] leading-snug mb-2">{pack.description}</p>
                <div className="w-full h-1.5 bg-[var(--color-surface2)] rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background: pct === 100 ? 'var(--color-success)' : 'var(--color-accent)' }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  {unlocked ? (
                    <p className="text-[11px] text-[var(--color-text3)]">
                      {progress.learned} learned · {progress.mastered} mastered · {progress.total} total
                    </p>
                  ) : pack.unlocksAfter ? (
                    <p className="text-[11px] text-[var(--color-warning)]">
                      🔒 Learn {pack.unlocksAfter.minLearned} verbs from previous pack to unlock
                    </p>
                  ) : (
                    <p className="text-[11px] text-[var(--color-text3)]">Complete previous pack to unlock</p>
                  )}
                  {unlocked && (
                    <span className="text-[11px] text-[var(--color-text3)]">{isOpen ? '▲' : '▼'}</span>
                  )}
                </div>
              </div>
            </button>

            {/* Expanded verb list */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-[var(--color-border)]"
                >
                  <div className="px-4 py-3 grid grid-cols-1 gap-1.5">
                    {verbRows.map(({ verb, level }) => (
                      <div key={verb.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <VerbBadge group={verb.group} />
                          <div>
                            <span className="font-jp font-semibold text-[14px]">{verb.dictionaryForm.kanji}</span>
                            <span className="text-[var(--color-text3)] text-[11px] ml-1.5">{verb.dictionaryForm.hiragana}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MasteryBar level={level} />
                          <span className={['text-[11px] font-semibold capitalize w-16 text-right', LEVEL_COLOR[level]].join(' ')}>
                            {level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Cards tab ───────────────────────────────────────────────────────────────

function CardsTab() {
  const { cards } = useProgressStore();
  const [filter, setFilter] = useState<Filter>('all');

  const allCards = VERBS.flatMap(v => {
    const dc = cards[`${v.id}:dictionary`];
    const mc = cards[`${v.id}:masu`];
    return [
      dc ? { verb: v, card: dc, form: 'dictionary' as const } : null,
      mc ? { verb: v, card: mc, form: 'masu' as const } : null,
    ].filter(Boolean) as { verb: typeof VERBS[0]; card: (typeof cards)[string]; form: 'dictionary' | 'masu' }[];
  });

  const counts: Record<MasteryLevel, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  allCards.forEach(x => counts[getMasteryLevel(x.card)]++);

  const filtered = filter === 'all' ? allCards : allCards.filter(x => getMasteryLevel(x.card) === filter);

  return (
    <>
      {/* Level summary chips */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'new', 'learning', 'reviewing', 'mastered'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={[
              'px-3 py-1 rounded-[8px] text-[12px] font-semibold capitalize transition-all',
              filter === f
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface2)] text-[var(--color-text2)] hover:opacity-80',
            ].join(' ')}
          >
            {f} ({f === 'all' ? allCards.length : counts[f as MasteryLevel]})
          </button>
        ))}
      </div>

      {/* Card list */}
      <div className="space-y-1.5">
        {filtered.map(({ verb, card, form }) => {
          const level = getMasteryLevel(card);
          const nextDate = card.nextReview
            ? new Date(card.nextReview).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '—';
          return (
            <div key={`${verb.id}:${form}`}
              className={['rounded-[14px] px-4 py-3 flex items-center justify-between gap-2', LEVEL_BG[level]].join(' ')}>
              <div className="flex items-center gap-2 min-w-0">
                <VerbBadge group={verb.group} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-jp font-bold text-[15px]">
                      {form === 'dictionary' ? verb.dictionaryForm.kanji : verb.masuForm.kanji}
                    </span>
                    <span className="text-[var(--color-text3)] text-[11px]">
                      {form === 'dictionary' ? 'dict' : 'ます'}
                    </span>
                  </div>
                  <p className="text-[var(--color-text2)] text-[12px] truncate">{verb.meaning}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <MasteryBar level={level} />
                <div className="text-right">
                  <p className={['text-[12px] font-semibold capitalize', LEVEL_COLOR[level]].join(' ')}>{level}</p>
                  <p className="text-[var(--color-text3)] text-[11px]">{nextDate}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export function Progress() {
  const { initCards, cards } = useProgressStore();
  const [tab, setTab] = useState<Tab>('packs');

  useEffect(() => { initCards(); }, [initCards]);

  const totalCards = VERBS.length * 2;
  const allCards = VERBS.flatMap(v => {
    const dc = cards[`${v.id}:dictionary`];
    const mc = cards[`${v.id}:masu`];
    return [dc, mc].filter(Boolean);
  });
  const mastered = allCards.filter(c => c && getMasteryLevel(c) === 'mastered').length;
  const masteryPercent = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;

  const counts: Record<MasteryLevel, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  allCards.forEach(c => { if (c) counts[getMasteryLevel(c)]++; });

  return (
    <div className="pt-6 pb-8 space-y-5">
      <h1 className="text-[28px] font-bold">Progress</h1>

      {/* Overall ring */}
      <div className="flex flex-col items-center gap-2">
        <BigRing percent={masteryPercent} />
        <div className="flex gap-4">
          {(Object.entries(counts) as [MasteryLevel, number][]).map(([level, count]) => (
            <div key={level} className="text-center">
              <p className={['font-bold text-[16px]', LEVEL_COLOR[level]].join(' ')}>{count}</p>
              <p className="text-[11px] text-[var(--color-text3)] capitalize">{level}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-surface2)] rounded-[12px] p-1">
        {([['packs', '📦 Packs'], ['cards', '🗂 Cards']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={[
              'flex-1 py-2 rounded-[10px] text-[14px] font-semibold transition-all',
              tab === t
                ? 'bg-[var(--color-surface)] text-[var(--color-text1)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                : 'text-[var(--color-text3)]',
            ].join(' ')}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}>
          {tab === 'packs' ? <PacksTab /> : <CardsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
