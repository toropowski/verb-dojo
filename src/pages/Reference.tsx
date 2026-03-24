import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VERBS } from '../data/verbs';
import { VerbBadge } from '../components/verb/VerbBadge';
import type { VerbGroup } from '../types/verb';

// ─────────────────────────────────────────────────────────────────────────────
// VERBS TAB
// ─────────────────────────────────────────────────────────────────────────────
function VerbsTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VerbGroup | 0>(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = VERBS.filter(v => {
    if (filter !== 0 && v.group !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.dictionaryForm.kanji.includes(q) ||
      v.dictionaryForm.hiragana.includes(q) ||
      v.dictionaryForm.romaji.toLowerCase().includes(q) ||
      v.meaning.toLowerCase().includes(q) ||
      v.masuForm.hiragana.includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search verbs… (kanji, hiragana, romaji, meaning)"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full h-11 px-4 rounded-[12px] bg-[var(--color-surface2)] text-[var(--color-text1)] placeholder:text-[var(--color-text3)] outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[15px]"
      />
      <div className="flex gap-2">
        {([0, 1, 2, 3] as const).map(g => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={[
              'px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all flex-1',
              filter === g
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface2)] text-[var(--color-text2)]',
            ].join(' ')}
          >
            {g === 0 ? 'All' : `G${g}`}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-[var(--color-text3)]">{filtered.length} verbs</p>

      <div className="space-y-1">
        {filtered.map(verb => (
          <div key={verb.id} className="bg-[var(--color-surface)] rounded-[14px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpanded(expanded === verb.id ? null : verb.id)}
            >
              <div className="flex items-center gap-3">
                <VerbBadge group={verb.group} />
                <span className="font-jp font-bold text-[17px]">{verb.dictionaryForm.kanji}</span>
                <span className="text-[var(--color-text3)] text-[12px]">{verb.dictionaryForm.romaji}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text2)] text-[13px]">{verb.meaning}</span>
                <span className="text-[var(--color-text3)] text-[11px]">{expanded === verb.id ? '▲' : '▼'}</span>
              </div>
            </button>
            <AnimatePresence>
              {expanded === verb.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2 border-t border-[var(--color-border)]">
                    {verb.tags.includes('exception-ru') && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30">
                        <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold">⚠ EXCEPTION</span>
                        <span className="text-amber-600 dark:text-amber-400 text-[11px]">Ends in る but conjugates as G1</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {[
                        { label: 'Dictionary', form: verb.dictionaryForm },
                        { label: 'ます form', form: verb.masuForm },
                        { label: 'て form', form: verb.teForm },
                        { label: 'Negative', form: verb.negativeForm },
                      ].map(({ label, form }) => (
                        <div key={label} className="bg-[var(--color-surface2)] rounded-[10px] p-3">
                          <p className="text-[10px] text-[var(--color-text3)] uppercase tracking-wide mb-1">{label}</p>
                          <p className="font-jp font-semibold text-[16px]">{form.kanji}</p>
                          <p className="text-[var(--color-text2)] text-[12px]">{form.hiragana}</p>
                          <p className="text-[var(--color-text3)] text-[11px]">{form.romaji}</p>
                        </div>
                      ))}
                    </div>
                    {verb.exampleSentence && (
                      <div className="bg-[var(--color-surface2)] rounded-[10px] p-3">
                        <p className="font-jp text-[15px]">{verb.exampleSentence.japanese}</p>
                        <p className="text-[var(--color-text3)] text-[12px] italic mt-0.5">{verb.exampleSentence.english}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-[var(--color-text3)] text-center py-8">No verbs found</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAMMAR TAB components
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, emoji, defaultOpen = true, children }: {
  title: string; emoji: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--color-surface)] rounded-[18px] overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[22px]">{emoji}</span>
          <span className="font-bold text-[17px]">{title}</span>
        </div>
        <span className="text-[var(--color-text3)] text-[12px]">{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--color-border)]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RuleBox({ color, title, rule, examples }: {
  color: string; title: string; rule: string;
  examples: { dict: string; result: string; meaning: string }[];
}) {
  return (
    <div className="rounded-[12px] overflow-hidden border" style={{ borderColor: color + '40' }}>
      <div className="px-4 py-2.5 font-semibold text-[13px]" style={{ background: color + '15', color }}>
        {title}
      </div>
      <div className="px-4 py-3 space-y-3 bg-[var(--color-surface2)]">
        <div className="bg-[var(--color-surface)] rounded-[8px] px-3 py-2">
          <p className="text-[13px] text-[var(--color-text1)] font-medium">{rule}</p>
        </div>
        <div className="space-y-1.5">
          {examples.map((ex, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className="font-jp text-[var(--color-text2)] w-28 shrink-0">{ex.dict}</span>
              <span className="text-[var(--color-text3)]">→</span>
              <span className="font-jp font-semibold" style={{ color }}>{ex.result}</span>
              <span className="text-[var(--color-text3)] text-[11px]">{ex.meaning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAMMAR TAB
// ─────────────────────────────────────────────────────────────────────────────
function GrammarTab() {
  return (
    <div className="space-y-4">

      {/* GROUP ID */}
      <Section title="How to Identify Verb Groups" emoji="🔍">
        <div className="space-y-3 pt-2">
          <p className="text-[13px] text-[var(--color-text2)] leading-relaxed">
            Every verb belongs to one of three groups. Identifying the group correctly is the foundation of conjugation.
          </p>
          {[
            {
              step: '1', color: 'var(--color-g3)',
              q: 'Is it する or くる?',
              a: '→ Group 3 (Irregular). These two verbs and all noun+する compounds.',
              chips: ['する (to do)', 'くる (to come)', '勉強する', '電話する'],
            },
            {
              step: '2', color: 'var(--color-g1)',
              q: "Doesn't end in る?",
              a: '→ Group 1 (U-verb). Always, no exceptions.',
              chips: ['かく (く)', 'のむ (む)', 'はなす (す)', 'まつ (つ)'],
            },
            {
              step: '3', color: 'var(--color-g2)',
              q: 'Ends in る — vowel before る?',
              a: 'い or え before る → probably G2. Anything else (あ/う/お) → G1. But check exceptions below!',
              chips: ['たべる (え+る → G2)', 'みる (い+る → G2)', 'かえる (え+る → G1! exception)', 'はしる (い+る → G1! exception)'],
            },
          ].map(({ step, color, q, a, chips }) => (
            <div key={step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5"
                style={{ background: color }}>{step}</div>
              <div className="flex-1 space-y-2">
                <p className="text-[14px] font-semibold text-[var(--color-text1)]">{q}</p>
                <p className="text-[13px] font-medium" style={{ color }}>{a}</p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map(c => (
                    <span key={c} className="font-jp text-[11px] bg-[var(--color-surface2)] px-2 py-0.5 rounded-[6px] text-[var(--color-text2)]">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="space-y-2 pt-1">
            <p className="text-[13px] font-bold flex items-center gap-2">⚠ These look like G2 but are G1 — memorize them!</p>
            {[
              ['帰る (かえる)', 'to return home', 'え+る but G1'],
              ['入る (はいる)', 'to enter', 'い+る but G1'],
              ['切る (きる)', 'to cut', 'い+る but G1'],
              ['走る (はしる)', 'to run', 'い+る but G1'],
              ['知る (しる)', 'to know', 'い+る but G1'],
              ['要る (いる)', 'to need', 'い+る but G1 (vs いる "to exist" = G2!)'],
            ].map(([v, m, note]) => (
              <div key={v} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-[10px] px-3 py-2">
                <span className="text-amber-500 text-[13px]">⚠</span>
                <span className="font-jp font-bold text-[14px] text-amber-700 dark:text-amber-400">{v}</span>
                <span className="text-[var(--color-text2)] text-[12px]">{m}</span>
                <span className="text-[var(--color-text3)] text-[10px] ml-auto">{note}</span>
              </div>
            ))}
            <div className="bg-[var(--color-surface2)] rounded-[10px] p-3">
              <p className="text-[12px] font-bold mb-0.5">Mnemonic: KASH-R</p>
              <p className="text-[12px] text-[var(--color-text2)]"><strong>K</strong>aeru · h<strong>A</strong>iru · <strong>S</strong>hiru · <strong>H</strong>ashiru · ki<strong>R</strong>u</p>
            </div>
          </div>
        </div>
      </Section>

      {/* MASU */}
      <Section title="ます Form — Polite Present/Future" emoji="丁">
        <div className="space-y-3 pt-2">
          <p className="text-[13px] text-[var(--color-text2)]">The most important form — used in all polite conversation.</p>
          <RuleBox color="var(--color-g2)" title="Group 2 — Drop る, add ます" rule="Remove る, add ます. Simplest rule in Japanese!"
            examples={[
              { dict: 'たべる', result: 'たべます', meaning: 'eat' },
              { dict: 'みる', result: 'みます', meaning: 'see/watch' },
              { dict: 'おきる', result: 'おきます', meaning: 'wake up' },
              { dict: 'ねる', result: 'ねます', meaning: 'sleep' },
              { dict: 'おしえる', result: 'おしえます', meaning: 'teach' },
              { dict: 'はじめる', result: 'はじめます', meaning: 'start' },
              { dict: 'かりる', result: 'かります', meaning: 'borrow' },
              { dict: 'みせる', result: 'みせます', meaning: 'show' },
            ]}
          />
          <RuleBox color="var(--color-g1)" title="Group 1 — う-row → い-row, add ます" rule="The last kana shifts from う-row to い-row in the hiragana chart."
            examples={[
              { dict: 'かく (く)', result: 'かきます', meaning: 'write' },
              { dict: 'およぐ (ぐ)', result: 'およぎます', meaning: 'swim' },
              { dict: 'はなす (す)', result: 'はなします', meaning: 'speak' },
              { dict: 'まつ (つ)', result: 'まちます', meaning: 'wait' },
              { dict: 'よむ (む)', result: 'よみます', meaning: 'read' },
              { dict: 'あそぶ (ぶ)', result: 'あそびます', meaning: 'play' },
              { dict: 'とる (る)', result: 'とります', meaning: 'take' },
              { dict: 'かう (う)', result: 'かいます', meaning: 'buy' },
              { dict: 'あるく (く)', result: 'あるきます', meaning: 'walk' },
              { dict: 'はたらく (く)', result: 'はたらきます', meaning: 'work' },
            ]}
          />
          <div className="bg-[var(--color-surface2)] rounded-[12px] p-3">
            <p className="text-[11px] font-bold text-[var(--color-text1)] mb-2 uppercase tracking-wide">G1 Quick Reference</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[['く→き','かく→かきます'],['ぐ→ぎ','およぐ→およぎます'],['す→し','はなす→はなします'],
                ['つ→ち','まつ→まちます'],['む→み','のむ→のみます'],['ぶ→び','あそぶ→あそびます'],
                ['る→り','とる→とります'],['う→い','かう→かいます'],['ぬ→に','しぬ→しにます']].map(([rule, ex]) => (
                <div key={rule} className="bg-[var(--color-surface)] rounded-[8px] p-2 text-center">
                  <p className="font-jp text-[12px] font-bold" style={{ color: 'var(--color-g1)' }}>{rule}</p>
                  <p className="font-jp text-[10px] text-[var(--color-text3)]">{ex}</p>
                </div>
              ))}
            </div>
          </div>
          <RuleBox color="var(--color-g3)" title="Group 3 — Irregular" rule="する→します · くる→きます · All noun+する follow する."
            examples={[
              { dict: 'する', result: 'します', meaning: 'do' },
              { dict: 'くる', result: 'きます', meaning: 'come' },
              { dict: 'べんきょうする', result: 'べんきょうします', meaning: 'study' },
              { dict: 'でんわする', result: 'でんわします', meaning: 'call' },
              { dict: 'りょこうする', result: 'りょこうします', meaning: 'travel' },
            ]}
          />
        </div>
      </Section>

      {/* TE FORM */}
      <Section title="て Form — Connecting / Requests" emoji="て">
        <div className="space-y-3 pt-2">
          <p className="text-[13px] text-[var(--color-text2)]">
            Connects actions ("eat and then sleep"), makes requests (〜てください), and builds progressive (〜ています).
          </p>
          <RuleBox color="var(--color-g2)" title="Group 2 — Drop る, add て" rule="Same stem as ます form, just use て instead."
            examples={[
              { dict: 'たべる', result: 'たべて', meaning: 'eat' },
              { dict: 'みる', result: 'みて', meaning: 'see' },
              { dict: 'おきる', result: 'おきて', meaning: 'wake up' },
              { dict: 'ねる', result: 'ねて', meaning: 'sleep' },
              { dict: 'おしえる', result: 'おしえて', meaning: 'teach' },
              { dict: 'みせる', result: 'みせて', meaning: 'show' },
              { dict: 'かりる', result: 'かりて', meaning: 'borrow' },
              { dict: 'はじめる', result: 'はじめて', meaning: 'start' },
            ]}
          />

          {[
            { title: 'く → いて', rule: 'Change く to いて',
              ex: [{ dict: 'かく', result: 'かいて', meaning: 'write' }, { dict: 'あるく', result: 'あるいて', meaning: 'walk' }, { dict: 'はたらく', result: 'はたらいて', meaning: 'work' }, { dict: 'きく', result: 'きいて', meaning: 'listen' }] },
            { title: 'ぐ → いで', rule: 'Change ぐ to いで (voiced)',
              ex: [{ dict: 'およぐ', result: 'およいで', meaning: 'swim' }, { dict: 'いそぐ', result: 'いそいで', meaning: 'hurry' }] },
            { title: 'す → して', rule: 'Change す to して',
              ex: [{ dict: 'はなす', result: 'はなして', meaning: 'speak' }, { dict: 'かえす', result: 'かえして', meaning: 'return (item)' }] },
            { title: 'つ / る / う → って', rule: 'Change ending to って',
              ex: [{ dict: 'まつ', result: 'まって', meaning: 'wait' }, { dict: 'とる', result: 'とって', meaning: 'take' }, { dict: 'かう', result: 'かって', meaning: 'buy' }, { dict: 'つかう', result: 'つかって', meaning: 'use' }, { dict: 'かえる', result: 'かえって', meaning: 'return home' }] },
            { title: 'む / ぶ / ぬ → んで', rule: 'Change ending to んで',
              ex: [{ dict: 'よむ', result: 'よんで', meaning: 'read' }, { dict: 'のむ', result: 'のんで', meaning: 'drink' }, { dict: 'あそぶ', result: 'あそんで', meaning: 'play' }] },
          ].map(({ title, rule, ex }) => (
            <RuleBox key={title} color="var(--color-g1)" title={`G1: ${title}`} rule={rule} examples={ex} />
          ))}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-[12px] p-3">
            <p className="text-[12px] font-bold text-amber-700 dark:text-amber-400 mb-1">⚠ Exception: 行く (いく)</p>
            <p className="text-[12px] text-[var(--color-text2)]">
              く normally gives いて, but 行く → <span className="font-jp font-bold text-amber-600">いって</span> (not いいて). The only exception to the く rule.
            </p>
          </div>

          <RuleBox color="var(--color-g3)" title="Group 3 — Irregular" rule="する→して · くる→きて"
            examples={[
              { dict: 'する', result: 'して', meaning: 'do' },
              { dict: 'くる', result: 'きて', meaning: 'come' },
              { dict: 'べんきょうする', result: 'べんきょうして', meaning: 'study' },
              { dict: 'でんわする', result: 'でんわして', meaning: 'call' },
            ]}
          />
        </div>
      </Section>

      {/* NEGATIVE */}
      <Section title="Negative Form — 〜ない" emoji="✗">
        <div className="space-y-3 pt-2">
          <p className="text-[13px] text-[var(--color-text2)]">Plain negative. Add ません for polite negative (〜ません).</p>
          <RuleBox color="var(--color-g2)" title="Group 2 — Drop る, add ない" rule="Same stem as ます/て, just add ない."
            examples={[
              { dict: 'たべる', result: 'たべない', meaning: 'not eat' },
              { dict: 'みる', result: 'みない', meaning: 'not see' },
              { dict: 'おきる', result: 'おきない', meaning: 'not wake up' },
              { dict: 'ねる', result: 'ねない', meaning: 'not sleep' },
              { dict: 'おしえる', result: 'おしえない', meaning: 'not teach' },
              { dict: 'はじめる', result: 'はじめない', meaning: 'not start' },
              { dict: 'かりる', result: 'かりない', meaning: 'not borrow' },
              { dict: 'みせる', result: 'みせない', meaning: 'not show' },
            ]}
          />
          <RuleBox color="var(--color-g1)" title="Group 1 — う-row → あ-row, add ない" rule="Similar to ます but drops to あ-row, not い-row. Then add ない."
            examples={[
              { dict: 'かく', result: 'かかない', meaning: 'not write' },
              { dict: 'はなす', result: 'はなさない', meaning: 'not speak' },
              { dict: 'まつ', result: 'またない', meaning: 'not wait' },
              { dict: 'よむ', result: 'よまない', meaning: 'not read' },
              { dict: 'あそぶ', result: 'あそばない', meaning: 'not play' },
              { dict: 'とる', result: 'とらない', meaning: 'not take' },
              { dict: 'いく', result: 'いかない', meaning: 'not go' },
              { dict: 'はしる', result: 'はしらない', meaning: 'not run' },
              { dict: 'あるく', result: 'あるかない', meaning: 'not walk' },
              { dict: 'はたらく', result: 'はたらかない', meaning: 'not work' },
            ]}
          />
          <div className="bg-[var(--color-surface2)] rounded-[12px] p-3">
            <p className="text-[12px] font-bold" style={{ color: 'var(--color-g1)' }}>⚠ Special: verbs ending in う → わ + ない</p>
            <div className="mt-2 space-y-1.5">
              {[['かう','かわない','not buy'],['つかう','つかわない','not use'],['あらう','あらわない','not wash']].map(([d,n,m]) => (
                <div key={d} className="flex items-center gap-2 text-[12px]">
                  <span className="font-jp text-[var(--color-text2)] w-20">{d}</span>
                  <span className="text-[var(--color-text3)]">→</span>
                  <span className="font-jp font-semibold" style={{ color: 'var(--color-g1)' }}>{n}</span>
                  <span className="text-[var(--color-text3)]">{m}</span>
                </div>
              ))}
            </div>
          </div>
          <RuleBox color="var(--color-g3)" title="Group 3 — Irregular" rule="する→しない · くる→こない"
            examples={[
              { dict: 'する', result: 'しない', meaning: 'not do' },
              { dict: 'くる', result: 'こない', meaning: 'not come' },
              { dict: 'べんきょうする', result: 'べんきょうしない', meaning: 'not study' },
              { dict: 'でんわする', result: 'でんわしない', meaning: 'not call' },
            ]}
          />
        </div>
      </Section>

      {/* TIPS */}
      <Section title="Tips & Mnemonics" emoji="💡" defaultOpen={false}>
        <div className="space-y-3 pt-2">
          {[
            { title: 'Group 2 is Lazy', highlight: 'Drop る, add ending',
              body: 'Ru-verbs always just drop る then add the ending:\nます form: drop る + ます\nて form: drop る + て\nNegative: drop る + ない\nOne stem, three forms.' },
            { title: 'Group 1 Chart Movements', highlight: 'う→い (ます) · う→あ (neg)',
              body: 'For ます: last kana climbs to い-row (ku→ki, mu→mi)\nFor negative: last kana drops to あ-row (ku→ka, mu→ma)\nFor て: it depends on the ending — see the て form table.' },
            { title: 'て Form Memory Aid', highlight: 'く-いて · ぐ-いで · す-して · つ/る/う-って · む/ぶ/ぬ-んで',
              body: 'Group them by sound change:\n• Unvoiced stops: く→いて\n• Voiced stop: ぐ→いで\n• Sibilant: す→して\n• Flaps + w-sound: つ・る・う→って\n• Nasals: む・ぶ・ぬ→んで' },
            { title: 'する Magic', highlight: 'noun + する = verb',
              body: 'Any noun can become a verb with する:\n勉強(study) + する = 勉強する\n電話(phone) + する = 電話する\nAll conjugate exactly like する.' },
          ].map(m => (
            <div key={m.title} className="bg-[var(--color-surface2)] rounded-[14px] p-4">
              <p className="font-semibold text-[14px] mb-1">{m.title}</p>
              <span className="inline-block mb-2 px-2.5 py-0.5 rounded-[7px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[11px] font-semibold">
                {m.highlight}
              </span>
              <p className="text-[var(--color-text2)] text-[13px] leading-relaxed whitespace-pre-line">{m.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function Reference() {
  const [tab, setTab] = useState<'verbs' | 'grammar'>('verbs');
  return (
    <div className="pt-6 pb-8 space-y-4">
      <h1 className="text-[28px] font-bold">Reference</h1>
      <div className="flex bg-[var(--color-surface2)] rounded-[12px] p-1 gap-1">
        {(['verbs', 'grammar'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={['flex-1 py-2 px-3 rounded-[9px] text-[14px] font-semibold capitalize transition-all',
              tab === t ? 'bg-[var(--color-surface)] text-[var(--color-text1)] shadow-sm' : 'text-[var(--color-text2)]',
            ].join(' ')}>
            {t === 'verbs' ? '📖 Verbs' : '📐 Grammar'}
          </button>
        ))}
      </div>
      {tab === 'verbs'   && <VerbsTab />}
      {tab === 'grammar' && <GrammarTab />}
    </div>
  );
}
