import { create } from 'zustand';
import type { ResumeConfig } from '@/types';
import { loadConfig, saveConfig } from '@/services/resume';

interface ResumeStore {
  config: ResumeConfig | null;
  loading: boolean;
  error: string | null;
  saveError: string | null;
  load: () => Promise<void>;
  update: (partial: Partial<ResumeConfig>) => void;
  clearSaveError: () => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  config: null,
  loading: true,
  error: null,
  saveError: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const config = await loadConfig();
      set({ config, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载简历数据失败';
      set({ loading: false, error: msg });
    }
  },

  update: (partial) => {
    const prev = get().config;
    if (!prev) return;
    const next = { ...prev, ...partial };
    set({ config: next, saveError: null });
    saveConfig(next).catch((e) => {
      const msg = e instanceof Error ? e.message : '保存失败';
      set({ saveError: msg });
    });
  },

  clearSaveError: () => set({ saveError: null }),
}));
