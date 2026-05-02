import { create } from 'zustand';
import i18n from '@/i18n';
import type { JsonResume } from '@/types/json-resume';
import { loadResume, saveResume } from '@/services/resume';

function createEmptyResume(): JsonResume {
  return { basics: { name: '' } };
}

interface ResumeStore {
  config: JsonResume | null;
  loading: boolean;
  error: string | null;
  saveError: string | null;
  dirty: boolean;
  load: () => Promise<void>;
  /**
   * 写入 store。两种用法：
   * - 传 Partial<JsonResume>：直接浅 merge 进当前 config（旧用法保持兼容）
   * - 传 (prev) => Partial<JsonResume> | null：基于"取出 patch 那一刻的最新 config"计算
   *   patch；返回 null 表示放弃此次写入。用于需要 read-modify-write 原子的场景（如 AI 润色）。
   */
  update: (
    partial: Partial<JsonResume> | ((prev: JsonResume) => Partial<JsonResume> | null),
  ) => void;
  reset: () => void;
  save: () => Promise<void>;
  clearSaveError: () => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  config: null,
  loading: true,
  error: null,
  saveError: null,
  dirty: false,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const config = await loadResume();
      set({ config, loading: false, dirty: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('common.loadError');
      set({ loading: false, error: msg });
    }
  },

  update: (partial) => {
    const prev = get().config;
    if (!prev) return;
    const patch = typeof partial === 'function' ? partial(prev) : partial;
    if (!patch) return;
    const next = { ...prev, ...patch };
    set({ config: next, saveError: null, dirty: true });
  },

  reset: () => {
    set({ config: createEmptyResume(), dirty: true, saveError: null });
  },

  save: async () => {
    const { config, dirty } = get();
    if (!config || !dirty) return;
    try {
      await saveResume(config);
      set({ dirty: false, saveError: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('common.saveError');
      set({ saveError: msg });
      throw e;
    }
  },

  clearSaveError: () => set({ saveError: null }),
}));
