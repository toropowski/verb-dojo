import { Modal } from './Modal';
import { useSettingsStore } from '../../store/useSettingsStore';

type Props = {
  open: boolean;
  onClose: () => void;
};

const LIMIT_OPTIONS = [3, 5, 10, 15, 20];

export function SettingsModal({ open, onClose }: Props) {
  const { theme, toggleTheme, showFurigana, toggleFurigana, dailyNewLimit, setDailyNewLimit } = useSettingsStore();

  return (
    <Modal open={open} onClose={onClose} title="⚙️ Settings">
      <div className="space-y-5">

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[15px]">Appearance</p>
            <p className="text-[var(--color-text3)] text-[12px]">Light or dark mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--color-surface2)] text-[14px] font-medium hover:opacity-80 transition-opacity"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        {/* Furigana toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[15px]">Show furigana</p>
            <p className="text-[var(--color-text3)] text-[12px]">Hide to practice kanji reading</p>
          </div>
          <button
            onClick={toggleFurigana}
            aria-checked={showFurigana}
            role="switch"
            className={[
              'relative w-12 h-7 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              showFurigana ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface2)]',
            ].join(' ')}
          >
            <span className={[
              'absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
              showFurigana ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')} />
          </button>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        {/* Daily new cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-[15px]">New cards per day</p>
              <p className="text-[var(--color-text3)] text-[12px]">How many new verbs to introduce daily</p>
            </div>
            <span className="text-[var(--color-accent)] font-bold text-[16px]">{dailyNewLimit}</span>
          </div>
          <div className="flex gap-2">
            {LIMIT_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setDailyNewLimit(n)}
                className={[
                  'flex-1 py-2 rounded-[10px] text-[14px] font-semibold transition-all',
                  dailyNewLimit === n
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface2)] text-[var(--color-text2)] hover:opacity-80',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        {/* Info row */}
        <p className="text-[11px] text-[var(--color-text3)] text-center">
          Settings are saved automatically to your device
        </p>
      </div>
    </Modal>
  );
}
