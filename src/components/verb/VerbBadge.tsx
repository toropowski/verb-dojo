import type { CSSProperties } from 'react';
import type { VerbGroup } from '../../types/verb';

const GROUP_LABEL: Record<VerbGroup, string> = {
  1: 'Group 1 · U-verb',
  2: 'Group 2 · Ru-verb',
  3: 'Group 3 · Irregular',
};

// CSS-variable colors work in both light and dark themes — no Tailwind dark: needed
const GROUP_STYLE: Record<VerbGroup, CSSProperties> = {
  1: { background: 'rgba(0,122,255,0.13)',  color: 'var(--color-g1)', border: '1px solid rgba(0,122,255,0.32)' },
  2: { background: 'rgba(52,199,89,0.16)',  color: 'var(--color-g2)', border: '1px solid rgba(52,199,89,0.38)' },
  3: { background: 'rgba(175,82,222,0.13)', color: 'var(--color-g3)', border: '1px solid rgba(175,82,222,0.32)' },
};

type Props = { group: VerbGroup; className?: string };

export function VerbBadge({ group, className = '' }: Props) {
  return (
    <span
      style={GROUP_STYLE[group]}
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-[8px]',
        'text-[11px] font-bold uppercase tracking-wide',
        className,
      ].join(' ')}
    >
      {GROUP_LABEL[group]}
    </span>
  );
}
