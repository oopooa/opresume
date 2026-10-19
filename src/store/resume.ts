import { create } from 'zustand';
import i18n from '@/i18n';
import type { JsonResume } from '@/types/json-resume';
import { loadResume, saveResume } from '@/services/resume';
import { useUIStore } from '@/store/ui';
import { trackClarityEvent } from '@/utils/clarity';

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
   *
   * 注意浅合并语义：patch 中未出现的字段会保留旧值。整体写入（如导入覆盖，
   * "文件里没有即视为清空"）请用 replace，勿用本方法。
   */
  update: (
    partial: Partial<JsonResume> | ((prev: JsonResume) => Partial<JsonResume> | null),
  ) => void;
  /** 整体替换当前简历（导入覆盖场景）：导入数据中缺失的字段视为"清空" */
  replace: (resume: JsonResume) => void;
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
      // 模板随简历存储：加载（启动/切换简历）时把该简历的模板同步到 UI
      const template = config['x-op-template'];
      const ui = useUIStore.getState();
      if (typeof template === 'string' && template && ui.template !== template) {
        ui.setTemplate(template);
      }
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

  replace: (resume) => {
    set({ config: resume, saveError: null, dirty: true });
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
      trackClarityEvent('resume_save_succeeded');
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('common.saveError');
      set({ saveError: msg });
      trackClarityEvent('resume_save_failed');
      throw e;
    }
  },

  clearSaveError: () => set({ saveError: null }),
}));
