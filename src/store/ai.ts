import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProviderId, AIProviderConfig, AISettings } from '@/types';
import { getDefaultProviderConfig } from '@/config/ai-providers';

interface AIStore extends AISettings {
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

      // Actions
      updateProviderConfig: (providerId, config) =>
        set((state) => {
          const existing = state.providers[providerId] ?? getDefaultProviderConfig(providerId);
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
        return state.providers[providerId] ?? getDefaultProviderConfig(providerId);
      },

      setProviderVerified: (providerId, verified) =>
        set((state) => {
          const existing = state.providers[providerId] ?? getDefaultProviderConfig(providerId);
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
      }),
    },
  ),
);
