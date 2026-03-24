import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'sm' | 'md' | 'lg';
};

const padMap = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--color-surface)] rounded-[16px]',
        'shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
        padMap[padding],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
