import { useRef, useEffect, useCallback } from 'react';
import { bindInput } from '../lib/wanakana';

export function useRomajiInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    const unbind = bindInput(inputRef.current);
    return unbind;
  }, []);

  const getValue = useCallback((): string => {
    return inputRef.current?.value ?? '';
  }, []);

  const clear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return { inputRef, getValue, clear, focus };
}
