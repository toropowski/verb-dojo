import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-[0.97]',
  secondary: 'bg-[var(--color-surface2)] text-[var(--color-text1)] hover:opacity-80 active:scale-[0.97]',
  ghost:     'bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-surface2)] active:scale-[0.97]',
  danger:    'bg-[var(--color-error)] text-white hover:opacity-90 active:scale-[0.97]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-4 text-[14px] rounded-[10px]',
  md: 'h-11 px-5 text-[16px] rounded-[14px]',
  lg: 'h-[52px] px-6 text-[17px] rounded-[16px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-100 select-none cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
