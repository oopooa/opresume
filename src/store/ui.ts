import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeConfig } from '@/types';

interface UIStore {
  theme: ThemeConfig;
  template: string;
  lang: string;
  updateTheme: (partial: Partial<ThemeConfig>) => void;
  setTemplate: (template: string) => void;
  setLang: (lang: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: { color: '#2f5785', tagColor: '#8bc34a' },
      template: 'template1',
      lang: 'zh-CN',

      updateTheme: (partial) =>
        set((s) => ({ theme: { ...s.theme, ...partial } })),

      setTemplate: (template) => set({ template }),

      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'opresume_ui',
      partialize: (state) => ({
        theme: state.theme,
        template: state.template,
        lang: state.lang,
      }),
    },
  ),
);
