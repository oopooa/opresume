import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { ThemeConfig } from '@/types';

interface UIStore {
  theme: ThemeConfig;
  template: string;
  lang: string;
  editingModule: string | null;
  updateTheme: (partial: Partial<ThemeConfig>) => void;
  setTemplate: (template: string) => void;
  setLang: (lang: string) => void;
  openEditor: (module: string) => void;
  closeEditor: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: { color: '#2f5785', tagColor: '#8bc34a' },
      template: 'template1',
      lang: 'zh-CN',
      editingModule: null,

      updateTheme: (partial) =>
        set((s) => ({ theme: { ...s.theme, ...partial } })),

      setTemplate: (template) => set({ template }),

      setLang: (lang) => {
        i18n.changeLanguage(lang);
        set({ lang });
      },

      openEditor: (module) => set({ editingModule: module }),
      closeEditor: () => set({ editingModule: null }),
    }),
    {
      name: 'opresume_ui',
      partialize: (state) => ({
        theme: state.theme,
        template: state.template,
        lang: state.lang,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.lang) {
          i18n.changeLanguage(state.lang);
        }
      },
    },
  ),
);
