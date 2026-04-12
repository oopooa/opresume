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
  update: (partial: Partial<JsonResume>) => void;
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
    const next = { ...prev, ...partial };
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
