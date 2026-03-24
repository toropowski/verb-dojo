import * as wanakana from 'wanakana';

export const WK_OPTIONS = {
  IMEMode: true,
  useObsoleteKana: false,
  passRomaji: false,
};

export function bindInput(el: HTMLInputElement): () => void {
  wanakana.bind(el, WK_OPTIONS as Parameters<typeof wanakana.bind>[1]);
  return () => wanakana.unbind(el);
}

export function toHiragana(str: string): string {
  return wanakana.toHiragana(str, WK_OPTIONS);
}

export function isHiragana(str: string): boolean {
  return wanakana.isHiragana(str);
}

export function checkAnswer(userInput: string, correctHiragana: string): boolean {
  const a = userInput.trim().normalize('NFC');
  const b = correctHiragana.trim().normalize('NFC');
  return a === b;
}
