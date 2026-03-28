import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import { detectBrowserLanguage, getLanguageFromURL } from '@/i18n';
import { TITLE_FONT_SIZE_RANGE, BODY_FONT_SIZE_RANGE } from '@/config/layout';
import type { ThemeConfig, LayoutConfig, SpacingPreset } from '@/types';

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
  /** 隐私模式：对敏感信息进行打码显示 */
  privacyMode: boolean;
  /** 排版配置 */
  layout: LayoutConfig;
  updateTheme: (partial: Partial<ThemeConfig>) => void;
  setTemplate: (template: string) => void;
  setLang: (lang: string) => void;
  openEditor: (module?: string) => void;
  closeEditor: () => void;
  clearActiveModule: () => void;
  toggleIcons: () => void;
  togglePrivacy: () => void;
  updateModuleIcon: (module: string, icon: string | undefined) => void;
  updateCustomFieldIcon: (fieldKey: string, icon: string | undefined) => void;
  setPageMargin: (preset: SpacingPreset) => void;
  setModuleGap: (preset: SpacingPreset) => void;
  setTitleFontSize: (value: number) => void;
  setBodyFontSize: (value: number) => void;
  setLineHeight: (value: number) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: { color: '#2C3E50', tagColor: '#5B8C5A' },
      template: 'template1',
      lang: detectBrowserLanguage(),
      editorOpen: false,
      activeModule: null,
      avatarEditorOpen: false,
      moduleIconMap: {},
      customFieldIconMap: {},
      showIcons: true,
      privacyMode: false,
      layout: { pageMargin: 'standard', moduleGap: 'standard', titleFontSize: 16, bodyFontSize: 14, lineHeight: 1.5 },

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

      togglePrivacy: () =>
        set((s) => ({ privacyMode: !s.privacyMode })),

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

      setPageMargin: (preset) =>
        set((s) => ({ layout: { ...s.layout, pageMargin: preset } })),

      setModuleGap: (preset) =>
        set((s) => ({ layout: { ...s.layout, moduleGap: preset } })),

      setTitleFontSize: (value) =>
        set((s) => ({ layout: { ...s.layout, titleFontSize: value } })),

      setBodyFontSize: (value) =>
        set((s) => ({ layout: { ...s.layout, bodyFontSize: value } })),

      setLineHeight: (value) =>
        set((s) => ({ layout: { ...s.layout, lineHeight: value } })),
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
        privacyMode: state.privacyMode,
        layout: state.layout,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<UIStore>;
        const mergedLayout = { ...current.layout, ...stored.layout };
        // 修复旧数据中缺失、无效或越界的字号值
        if (!Number.isFinite(mergedLayout.titleFontSize)) mergedLayout.titleFontSize = current.layout.titleFontSize;
        else mergedLayout.titleFontSize = Math.max(TITLE_FONT_SIZE_RANGE.min, Math.min(TITLE_FONT_SIZE_RANGE.max, mergedLayout.titleFontSize));
        if (!Number.isFinite(mergedLayout.bodyFontSize)) mergedLayout.bodyFontSize = current.layout.bodyFontSize;
        else mergedLayout.bodyFontSize = Math.max(BODY_FONT_SIZE_RANGE.min, Math.min(BODY_FONT_SIZE_RANGE.max, mergedLayout.bodyFontSize));
        return {
          ...current,
          ...stored,
          layout: mergedLayout,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        // URL 参数优先级最高，覆盖 localStorage 中的语言设置
        const urlLang = getLanguageFromURL();
        if (urlLang && state) {
          state.lang = urlLang;
          i18n.changeLanguage(urlLang);
        } else if (state?.lang) {
          i18n.changeLanguage(state.lang);
        }
      },
    },
  ),
);
