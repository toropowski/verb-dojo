import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SettingsState = {
  theme: 'light' | 'dark';
  showFurigana: boolean;
  dailyNewLimit: number;
  toggleTheme: () => void;
  setTheme: (t: 'light' | 'dark') => void;
  toggleFurigana: () => void;
  setDailyNewLimit: (n: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      showFurigana: true,
      dailyNewLimit: 5,

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },

      setTheme: (t) => {
        document.documentElement.setAttribute('data-theme', t);
        set({ theme: t });
      },

      toggleFurigana: () => set(s => ({ showFurigana: !s.showFurigana })),
      setDailyNewLimit: (n) => set({ dailyNewLimit: Math.max(1, Math.min(20, n)) }),
    }),
    { name: 'verb-dojo-settings' },
  ),
);
