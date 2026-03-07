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
  avatarEditorOpen: boolean;
  /** 模块图标覆盖，键为模块名如 "educationList"，值为 lucide 图标名 */
  moduleIconMap: Record<string, string>;
  /** 自定义字段图标，键为字段 key（字段名称），值为 lucide 图标名 */
  customFieldIconMap: Record<string, string>;
  /** 控制简历中所有图标的可见性 */
  showIcons: boolean;
  updateTheme: (partial: Partial<ThemeConfig>) => void;
  setTemplate: (template: string) => void;
  setLang: (lang: string) => void;
  openEditor: (module?: string) => void;
  closeEditor: () => void;
  clearActiveModule: () => void;
  toggleIcons: () => void;
  updateModuleIcon: (module: string, icon: string | undefined) => void;
  updateCustomFieldIcon: (fieldKey: string, icon: string | undefined) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: { color: '#2f5785', tagColor: '#8bc34a' },
      template: 'template1',
      lang: 'zh-CN',
      editorOpen: false,
      activeModule: null,
      avatarEditorOpen: false,
      moduleIconMap: {},
      customFieldIconMap: {},
      showIcons: true,

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

      toggleIcons: () =>
        set((s) => ({ showIcons: !s.showIcons })),

      updateModuleIcon: (module, icon) =>
        set((s) => {
          if (icon) {
            return { moduleIconMap: { ...s.moduleIconMap, [module]: icon } };
          }
          const { [module]: _, ...rest } = s.moduleIconMap;
          return { moduleIconMap: rest };
        }),

      updateCustomFieldIcon: (fieldKey, icon) =>
        set((s) => {
          if (icon) {
            return { customFieldIconMap: { ...s.customFieldIconMap, [fieldKey]: icon } };
          }
          const { [fieldKey]: _, ...rest } = s.customFieldIconMap;
          return { customFieldIconMap: rest };
        }),
    }),
    {
      name: 'opresume_ui',
      partialize: (state) => ({
        theme: state.theme,
        template: state.template,
        lang: state.lang,
        avatarEditorOpen: state.avatarEditorOpen,
        moduleIconMap: state.moduleIconMap,
        customFieldIconMap: state.customFieldIconMap,
        showIcons: state.showIcons,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.lang) {
          i18n.changeLanguage(state.lang);
        }
      },
    },
  ),
);
