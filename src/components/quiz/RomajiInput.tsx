import { useEffect, type KeyboardEvent } from 'react';
import { useRomajiInput } from '../../hooks/useRomajiInput';

type Props = {
  onSubmit: (value: string) => void;
  onSkip?: () => void;
  onGetValue?: (fn: () => string) => void;
  disabled?: boolean;
  placeholder?: string;
  resetKey?: string | number;
};

export function RomajiInput({ onSubmit, onSkip, onGetValue, disabled, placeholder = 'Type romaji...', resetKey }: Props) {
  const { inputRef, getValue, clear, focus } = useRomajiInput();

  useEffect(() => {
    onGetValue?.(getValue);
  }, [onGetValue, getValue]);

  // Clear + refocus when question changes
  useEffect(() => {
    clear();
    focus();
  }, [resetKey, clear, focus]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = getValue();
      if (val.trim()) onSubmit(val.trim());
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onSkip?.();
    }
  };

  return (
    <div className="w-full space-y-1">
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={handleKey}
        className={[
          'w-full h-14 px-4 rounded-[14px] text-[18px] font-jp',
          'bg-[var(--color-surface2)] text-[var(--color-text1)]',
          'border-2 border-transparent outline-none',
          'placeholder:text-[var(--color-text3)]',
          'focus:border-[var(--color-accent)]',
          'transition-colors duration-150',
          'disabled:opacity-50',
        ].join(' ')}
      />
      <p className="text-[12px] text-[var(--color-text3)] pl-1">
        Type in romaji — it converts automatically. Press <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface2)] text-[11px]">Enter</kbd> to submit, <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface2)] text-[11px]">Esc</kbd> to skip.
      </p>
    </div>
  );
}
