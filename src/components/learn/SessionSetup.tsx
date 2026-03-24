import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SessionConfig } from '../../types/quiz';
import { VERB_PACKS } from '../../data/verbPacks';
import { useProgressStore } from '../../store/useProgressStore';
import { Button } from '../ui/Button';

type Props = {
  dueCount: number;
  newCount: number;
  onStart: (config: SessionConfig) => void;
};

type FormKey = 'masu' | 'te' | 'negative' | 'recall';

const FORM_OPTIONS: { key: FormKey; label: string; desc: string; emoji: string }[] = [
  { key: 'masu',     label: 'ます form',  desc: '食べる → 食べます',     emoji: '丁' },
  { key: 'te',       label: 'て form',    desc: '食べる → 食べて',       emoji: 'て' },
  { key: 'negative', label: 'Negative',   desc: '食べる → 食べない',      emoji: '✗' },
  { key: 'recall',   label: 'Recall',     desc: 'to eat → 食べます',     emoji: '💭' },
];

export function SessionSetup({ dueCount, newCount, onStart }: Props) {
  const { isPackUnlocked, getPackProgress } = useProgressStore();
  const [tab, setTab] = useState<'srs' | 'custom'>(dueCount + newCount > 0 ? 'srs' : 'custom');
  const [forms, setForms] = useState<Set<FormKey>>(new Set(['masu']));
  const [groups, setGroups] = useState<Set<1 | 2 | 3>>(new Set([1, 2, 3]));
  const [packs, setPacks] = useState<Set<string>>(new Set(['pack-1']));

  const toggleForm = (f: FormKey) => {
    const next = new Set(forms);
    if (next.has(f) && next.size === 1) return; // keep at least one
    next.has(f) ? next.delete(f) : next.add(f);
    setForms(next);
  };

  const toggleGroup = (g: 1 | 2 | 3) => {
    const next = new Set(groups);
    if (next.has(g) && next.size === 1) return;
    next.has(g) ? next.delete(g) : next.add(g);
    setGroups(next);
  };

  const togglePack = (id: string) => {
    const next = new Set(packs);
    if (next.has(id) && next.size === 1) return;
    next.has(id) ? next.delete(id) : next.add(id);
    setPacks(next);
  };

  const handleStart = () => {
    if (tab === 'srs') {
      onStart({ type: 'srs', forms: ['masu'], groups: [1, 2, 3], packIds: [] });
    } else {
      onStart({
        type: 'custom',
        forms: Array.from(forms),
        groups: Array.from(groups),
        packIds: Array.from(packs),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-6 pb-8 space-y-5"
    >
      <div>
        <h1 className="text-[28px] font-bold">Practice</h1>
        <p className="text-[var(--color-text2)] text-[14px]">What do you want to work on?</p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[var(--color-surface2)] rounded-[12px] p-1">
        {(['srs', 'custom'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-2 px-3 rounded-[9px] text-[14px] font-semibold transition-all',
              tab === t
                ? 'bg-[var(--color-surface)] text-[var(--color-text1)] shadow-sm'
                : 'text-[var(--color-text2)]',
            ].join(' ')}
          >
            {t === 'srs' ? '⚡ Smart Review' : '🎯 Custom Practice'}
          </button>
        ))}
      </div>

      {tab === 'srs' ? (
        <div className="space-y-3">
          <div className="bg-[var(--color-surface)] rounded-[18px] p-5 space-y-3">
            <p className="font-semibold text-[16px]">Your scheduled cards</p>
            <div className="flex gap-3">
              <div className="flex-1 bg-[var(--color-surface2)] rounded-[12px] p-3 text-center">
                <p className="text-[26px] font-bold text-[var(--color-error)]">{dueCount}</p>
                <p className="text-[12px] text-[var(--color-text2)]">Due for review</p>
              </div>
              <div className="flex-1 bg-[var(--color-surface2)] rounded-[12px] p-3 text-center">
                <p className="text-[26px] font-bold text-[var(--color-success)]">{newCount}</p>
                <p className="text-[12px] text-[var(--color-text2)]">New cards</p>
              </div>
            </div>
            {dueCount + newCount === 0 && (
              <p className="text-[var(--color-success)] text-[13px] text-center font-medium">
                ✓ All caught up! Switch to Custom Practice to keep going.
              </p>
            )}
            <p className="text-[12px] text-[var(--color-text3)]">
              The app uses spaced repetition (SM-2) to show you cards exactly when you're about to forget them.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Form picker */}
          <div className="bg-[var(--color-surface)] rounded-[18px] p-4 space-y-3">
            <p className="font-semibold text-[15px]">Which forms?</p>
            <div className="grid grid-cols-2 gap-2">
              {FORM_OPTIONS.map(opt => {
                const active = forms.has(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleForm(opt.key)}
                    className={[
                      'flex items-start gap-3 p-3 rounded-[12px] text-left transition-all',
                      active
                        ? 'bg-[var(--color-accent)]/12 border border-[var(--color-accent)]/40'
                        : 'bg-[var(--color-surface2)] border border-transparent',
                    ].join(' ')}
                  >
                    <span className={[
                      'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5',
                      active ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text3)]',
                    ].join(' ')}>
                      {active ? '✓' : '○'}
                    </span>
                    <div>
                      <p className={['text-[13px] font-semibold', active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text1)]'].join(' ')}>
                        {opt.label}
                      </p>
                      <p className="font-jp text-[11px] text-[var(--color-text3)]">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verb groups */}
          <div className="bg-[var(--color-surface)] rounded-[18px] p-4 space-y-3">
            <p className="font-semibold text-[15px]">Which groups?</p>
            <div className="flex gap-2">
              {([
                { g: 1 as const, label: 'G1 U-verbs',    color: 'var(--color-g1)' },
                { g: 2 as const, label: 'G2 Ru-verbs',   color: 'var(--color-g2)' },
                { g: 3 as const, label: 'G3 Irregular',  color: 'var(--color-g3)' },
              ]).map(({ g, label, color }) => {
                const active = groups.has(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGroup(g)}
                    style={active ? { background: color + '20', border: `1px solid ${color}50`, color } : undefined}
                    className={[
                      'flex-1 py-2 px-2 rounded-[10px] text-[12px] font-semibold text-center transition-all',
                      active ? '' : 'bg-[var(--color-surface2)] text-[var(--color-text3)] border border-transparent',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verb packs */}
          <div className="bg-[var(--color-surface)] rounded-[18px] p-4 space-y-3">
            <p className="font-semibold text-[15px]">Which packs?</p>
            <div className="space-y-2">
              {VERB_PACKS.map(pack => {
                const unlocked = isPackUnlocked(pack.id);
                const prog = getPackProgress(pack.id);
                const active = packs.has(pack.id);
                return (
                  <button
                    key={pack.id}
                    disabled={!unlocked}
                    onClick={() => unlocked && togglePack(pack.id)}
                    className={[
                      'w-full flex items-center gap-3 p-3 rounded-[12px] text-left transition-all',
                      !unlocked ? 'opacity-40 cursor-not-allowed bg-[var(--color-surface2)]' :
                      active ? 'bg-[var(--color-accent)]/12 border border-[var(--color-accent)]/40' :
                               'bg-[var(--color-surface2)] border border-transparent',
                    ].join(' ')}
                  >
                    <span className="text-[20px]">{unlocked ? pack.emoji : '🔒'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px]">{pack.name}</p>
                      <p className="text-[11px] text-[var(--color-text3)]">{prog.learned}/{pack.verbIds.length} learned</p>
                    </div>
                    {unlocked && (
                      <div className={[
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        active ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text3)]',
                      ].join(' ')}>
                        {active ? '✓' : '○'}
                      </div>
                    )}
                    {!unlocked && pack.unlocksAfter && (
                      <p className="text-[10px] text-[var(--color-text3)] text-right">
                        Master 80% of prev pack to unlock
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        size="lg"
        onClick={handleStart}
        disabled={tab === 'srs' && dueCount + newCount === 0}
      >
        {tab === 'srs'
          ? dueCount + newCount > 0
            ? `Start Review  ·  ${dueCount + newCount} cards`
            : 'Nothing due — try Custom Practice'
          : `Start Practice  ·  ${forms.size} form${forms.size > 1 ? 's' : ''}`}
      </Button>
    </motion.div>
  );
}
