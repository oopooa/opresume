import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { ThemeConfig } from '@/types';

interface UIStore {
  theme: ThemeConfig;
  template: string;
  lang: string;
  editorOpen: boolean;
  activeModule: string | null;
  updateTheme: (partial: Partial<ThemeConfig>) => void;
  setTemplate: (template: string) => void;
  setLang: (lang: string) => void;
  openEditor: (module?: string) => void;
  closeEditor: () => void;
  clearActiveModule: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: { color: '#2f5785', tagColor: '#8bc34a' },
      template: 'template1',
      lang: 'zh-CN',
      editorOpen: false,
      activeModule: null,

      updateTheme: (partial) =>
        set((s) => ({ theme: { ...s.theme, ...partial } })),

      setTemplate: (template) => set({ template }),

      setLang: (lang) => {
        i18n.changeLanguage(lang);
        set({ lang });
      },

      openEditor: (module) =>
        set({ editorOpen: true, activeModule: module ?? null }),
      closeEditor: () =>
        set({ editorOpen: false, activeModule: null }),
      clearActiveModule: () =>
        set({ activeModule: null }),
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
