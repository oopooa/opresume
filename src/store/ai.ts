import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProviderId, AIProviderConfig, AISettings, CustomProvider } from '@/types';
import { getDefaultProviderConfig } from '@/config/ai-providers';

interface AIStore extends AISettings {
  /** 用户创建的自定义供应商列表（OpenAI 兼容端点） */
  customProviders: CustomProvider[];
  /** 新增或更新自定义供应商 */
  upsertCustomProvider: (custom: CustomProvider) => void;
  /** 删除自定义供应商（同时清理其配置与激活状态） */
  removeCustomProvider: (id: string) => void;
  /** 更新供应商配置 */
  updateProviderConfig: (providerId: AIProviderId, config: Partial<AIProviderConfig>) => void;
  /** 设为当前引擎 */
  setActiveProvider: (providerId: AIProviderId) => void;
  /** 清除当前引擎 */
  clearActiveProvider: () => void;
  /** 获取指定供应商的配置（如不存在则返回默认值） */
  getProviderConfig: (providerId: AIProviderId) => AIProviderConfig;
  /** 设置供应商验证状态 */
  setProviderVerified: (providerId: AIProviderId, verified: boolean) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // State
      activeProviderId: null,
      providers: {},
      customProviders: [],

      // Actions
      upsertCustomProvider: (custom) =>
        set((state) => {
          const exists = state.customProviders.some((c) => c.id === custom.id);
          return {
            customProviders: exists
              ? state.customProviders.map((c) => (c.id === custom.id ? { ...c, ...custom } : c))
              : [...state.customProviders, custom],
          };
        }),

      removeCustomProvider: (id) =>
        set((state) => {
          const providers = { ...state.providers };
          delete providers[id];
          return {
            customProviders: state.customProviders.filter((c) => c.id !== id),
            providers,
            activeProviderId: state.activeProviderId === id ? null : state.activeProviderId,
          };
        }),

      updateProviderConfig: (providerId, config) =>
        set((state) => {
          const existing = state.providers[providerId] ?? getDefaultProviderConfig(providerId, state.customProviders);
          return {
            providers: {
              ...state.providers,
              [providerId]: { ...existing, ...config },
            },
          };
        }),

      setActiveProvider: (providerId) => set({ activeProviderId: providerId }),

      clearActiveProvider: () => set({ activeProviderId: null }),

      getProviderConfig: (providerId) => {
        const state = get();
        return state.providers[providerId] ?? getDefaultProviderConfig(providerId, state.customProviders);
      },

      setProviderVerified: (providerId, verified) =>
        set((state) => {
          const existing = state.providers[providerId] ?? getDefaultProviderConfig(providerId, state.customProviders);
          return {
            providers: {
              ...state.providers,
              [providerId]: {
                ...existing,
                verified,
                lastVerifiedAt: verified ? Date.now() : existing.lastVerifiedAt,
              },
            },
          };
        }),
    }),
    {
      name: 'opresume_ai',
      partialize: (state) => ({
        activeProviderId: state.activeProviderId,
        providers: state.providers,
        customProviders: state.customProviders,
      }),
    },
  ),
);
