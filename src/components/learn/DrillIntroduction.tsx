// src/components/learn/DrillIntroduction.tsx
import { motion } from 'framer-motion';
import type { FormStage } from '../../types/drill';
import { VerbBadge } from '../verb/VerbBadge';
import { Button } from '../ui/Button';

type ExamplePair = { from: string; to: string };

type PatternEntry = {
  group: 1 | 2 | 3;
  label: string;
  rule: string;
  examples: ExamplePair[];
};

type IntroContent = {
  emoji: string;
  title: string;
  subtitle: string;
  explanation: string;
  patterns: PatternEntry[];
  tip: string;
  ctaLabel: string;
};

const INTRO_CONTENT: Record<FormStage, IntroContent> = {
  masu: {
    emoji: '丁',
    title: 'Polite Present — ます form',
    subtitle: "The form you'll use in everyday conversation",
    explanation:
      "Japanese verbs change form based on politeness. The ます form is the standard polite present and future tense — you'll hear it in almost every real conversation.",
    patterns: [
      {
        group: 2,
        label: 'Ru-verbs (Group 2)',
        rule: 'Drop る → add ます',
        examples: [
          { from: '食べる', to: '食べます' },
          { from: '見る', to: '見ます' },
        ],
      },
      {
        group: 1,
        label: 'U-verbs (Group 1)',
        rule: 'Change ending vowel u → i, add ます',
        examples: [
          { from: '書く (ku→ki)', to: '書きます' },
          { from: '飲む (mu→mi)', to: '飲みます' },
        ],
      },
      {
        group: 3,
        label: 'Irregular (Group 3)',
        rule: 'Must memorize',
        examples: [
          { from: 'する', to: 'します' },
          { from: 'くる', to: 'きます' },
        ],
      },
    ],
    tip: '💡 Group 2 is the easiest — just drop the る and add ます every time!',
    ctaLabel: 'Got it — show me the verbs',
  },
  te: {
    emoji: 'て',
    title: 'Connecting Actions — て form',
    subtitle: 'Link verbs, make requests, describe ongoing actions',
    explanation:
      'The て form is incredibly versatile: it connects verbs (ate and left), makes polite requests (〜てください), and creates the progressive tense (〜ています).',
    patterns: [
      {
        group: 2,
        label: 'Ru-verbs (Group 2)',
        rule: 'Drop る → add て',
        examples: [
          { from: '食べる', to: '食べて' },
          { from: '見る', to: '見て' },
        ],
      },
      {
        group: 1,
        label: 'U-verbs (Group 1) — 5 patterns!',
        rule: 'Based on the ending sound:',
        examples: [
          { from: 'く/ぐ → いて/いで', to: '書く→書いて, 泳ぐ→泳いで' },
          { from: 'す → して', to: '話す→話して' },
          { from: 'つ/る/う → って', to: '待つ→待って' },
          { from: 'ぬ/ぶ/む → んで', to: '飲む→飲んで' },
          { from: '⚠️ 行く exception', to: '行く→行って (not 行いて!)' },
        ],
      },
      {
        group: 3,
        label: 'Irregular (Group 3)',
        rule: 'Must memorize',
        examples: [
          { from: 'する', to: 'して' },
          { from: 'くる', to: 'きて' },
        ],
      },
    ],
    tip: '💡 You already know the ます form for these verbs. The て form follows different sound-based rules — pay attention to the final sound!',
    ctaLabel: 'Got it — start て form drills',
  },
  negative: {
    emoji: '✗',
    title: 'Saying No — ない form',
    subtitle: 'Plain negative present tense',
    explanation:
      "The ない form means 'don't do' or 'doesn't do' in casual speech. It's essential for negation and forms the base of many other grammar patterns.",
    patterns: [
      {
        group: 2,
        label: 'Ru-verbs (Group 2)',
        rule: 'Drop る → add ない',
        examples: [
          { from: '食べる', to: '食べない' },
          { from: '見る', to: '見ない' },
        ],
      },
      {
        group: 1,
        label: 'U-verbs (Group 1)',
        rule: 'Change ending vowel u → a, add ない',
        examples: [
          { from: '書く (ku→ka)', to: '書かない' },
          { from: '飲む (mu→ma)', to: '飲まない' },
          { from: '⚠️ Exception: う verbs!', to: '買う→買わない (not 買あない)' },
        ],
      },
      {
        group: 3,
        label: 'Irregular (Group 3)',
        rule: 'Must memorize',
        examples: [
          { from: 'する', to: 'しない' },
          { from: 'くる', to: 'こない' },
        ],
      },
    ],
    tip: '💡 Watch out! Verbs ending in う use わない, not ああない. 買う → 買わない!',
    ctaLabel: 'Got it — start ない drills',
  },
  recall: {
    emoji: '💭',
    title: 'Recall Mode',
    subtitle: 'Test what you actually remember',
    explanation:
      "Instead of seeing the verb and choosing an answer, you'll be shown the English meaning and must recall the Japanese form from memory. This is the hardest — and most effective — way to practice.",
    patterns: [],
    tip: '💡 Struggling? That\'s good! The effort of trying to recall strengthens memory far more than recognition.',
    ctaLabel: "I'm ready — start recall drills",
  },
};

const GROUP_COLOR: Record<1 | 2 | 3, string> = {
  1: 'var(--color-g1)',
  2: 'var(--color-g2)',
  3: 'var(--color-g3)',
};

type Props = {
  formStage: FormStage;
  onContinue: () => void;
};

export function DrillIntroduction({ formStage, onContinue }: Props) {
  const content = INTRO_CONTENT[formStage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col min-h-screen bg-[var(--color-surface)] px-4 py-8"
    >
      <div className="flex flex-col gap-6 max-w-[460px] mx-auto w-full flex-1">

        {/* Top: emoji + title */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div
            className="w-20 h-20 rounded-[24px] flex items-center justify-center text-[36px]"
            style={{ background: 'var(--color-surface2)' }}
          >
            {content.emoji}
          </div>
          <div className="text-center">
            <h1 className="text-[24px] font-bold text-[var(--color-text1)] leading-tight">
              {content.title}
            </h1>
            <p className="text-[14px] text-[var(--color-text2)] mt-1">
              {content.subtitle}
            </p>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-[14px] text-[var(--color-text2)] leading-relaxed text-center max-w-[340px] mx-auto">
          {content.explanation}
        </p>

        {/* Patterns */}
        {content.patterns.length > 0 && (
          <div className="flex flex-col gap-4">
            {content.patterns.map((pattern) => (
              <div
                key={pattern.group}
                className="rounded-[16px] overflow-hidden border border-[var(--color-border)]"
                style={{ background: 'var(--color-surface2)' }}
              >
                {/* Pattern header */}
                <div
                  className="px-4 py-3 flex items-center gap-2 border-b border-[var(--color-border)]"
                  style={{
                    background: `color-mix(in srgb, ${GROUP_COLOR[pattern.group]} 8%, transparent)`,
                  }}
                >
                  <VerbBadge group={pattern.group} />
                  <span className="text-[13px] font-semibold text-[var(--color-text1)] ml-1">
                    {pattern.rule}
                  </span>
                </div>

                {/* Examples table */}
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  {pattern.examples.map((ex, i) => (
                    <div key={i} className="grid grid-cols-[1fr_20px_1fr] items-center gap-1">
                      <span className="font-jp text-[13px] text-[var(--color-text2)] truncate">
                        {ex.from}
                      </span>
                      <span className="text-[11px] text-[var(--color-text3)] text-center">→</span>
                      <span
                        className="font-jp text-[13px] font-semibold truncate"
                        style={{ color: GROUP_COLOR[pattern.group] }}
                      >
                        {ex.to}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tip box */}
        <div className="rounded-[14px] px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40">
          <p className="text-[13px] text-amber-700 dark:text-amber-300 leading-relaxed">
            {content.tip}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-2 pb-2">
          <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
            {content.ctaLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
