import { create } from 'zustand';
import i18n from '@/i18n';
import type { ResumeConfig } from '@/types';
import { loadResume, saveResume } from '@/services/resume';
import { convertNewToLegacy, convertLegacyToNew } from '@/utils/legacy-compat';

interface ResumeStore {
  config: ResumeConfig | null;
  loading: boolean;
  error: string | null;
  saveError: string | null;
  dirty: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<ResumeConfig>) => void;
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
      const extended = await loadResume();
      const config = convertNewToLegacy(extended);
      set({ config, loading: false, dirty: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('common.loadError');
      set({ loading: false, error: msg });
    }
  },

  update: (partial) => {
    const prev = get().config;
    if (!prev) return;
    const next = { ...prev, ...partial };
    set({ config: next, saveError: null, dirty: true });
  },

  reset: () => {
    set({ config: {} as ResumeConfig, dirty: true, saveError: null });
  },

  save: async () => {
    const { config, dirty } = get();
    if (!config || !dirty) return;
    try {
      const extended = convertLegacyToNew(config);
      await saveResume(extended);
      set({ dirty: false, saveError: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('common.saveError');
      set({ saveError: msg });
      throw e;
    }
  },

  clearSaveError: () => set({ saveError: null }),
}));

