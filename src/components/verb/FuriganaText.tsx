type Props = {
  kanji: string;
  hiragana: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideFurigana?: boolean;
};

const sizeMap = {
  sm: { text: 'text-[20px]', ruby: 'text-[10px]' },
  md: { text: 'text-[28px]', ruby: 'text-[12px]' },
  lg: { text: 'text-[38px]', ruby: 'text-[14px]' },
  xl: { text: 'text-[52px]', ruby: 'text-[16px]' },
};

export function FuriganaText({ kanji, hiragana, size = 'md', hideFurigana = false }: Props) {
  const { text, ruby } = sizeMap[size];

  return (
    <ruby className={['font-jp font-bold leading-loose', text].join(' ')}>
      {kanji}
      <rt className={['font-normal transition-opacity', ruby, hideFurigana ? 'opacity-0 select-none' : 'text-[var(--color-text2)]'].join(' ')}>
        {hiragana}
      </rt>
    </ruby>
  );
}
