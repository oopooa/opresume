import { create } from 'zustand';
import i18n from '@/i18n';
import type { JsonResume } from '@/types/json-resume';
import type { ResumeLibrary, ResumeMeta } from '@/types/resume-library';
import { useResumeStore } from '@/store/resume';
import { useUIStore } from '@/store/ui';
import {
  generateResumeId,
  generateResumeName,
  loadResumeLibrary,
  persistResumeLibrary,
} from '@/services/resume-library';

function createEmptyResume(): JsonResume {
  return { basics: { name: '' } };
}

function toMetas(library: ResumeLibrary): ResumeMeta[] {
  return library.resumes.map((r) => r.meta);
}

interface ResumeLibraryStore {
  /** 简历元数据列表（与持久化存储同步） */
  resumes: ResumeMeta[];
  /** 当前激活简历 ID */
  activeId: string | null;
  /** 是否已从存储加载过 */
  loaded: boolean;
  /** 正在执行异步操作（切换/新建等），用于防止重复操作 */
  busy: boolean;

  loadList: () => Promise<void>;
  createResume: () => Promise<void>;
  duplicateResume: (id: string) => Promise<void>;
  renameResume: (id: string, name: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  switchResume: (id: string) => Promise<void>;
}

export const useResumeLibraryStore = create<ResumeLibraryStore>((set, get) => ({
  resumes: [],
  activeId: null,
  loaded: false,
  busy: false,

  loadList: async () => {
    try {
      const library = await loadResumeLibrary();
      set({ resumes: toMetas(library), activeId: library.activeId, loaded: true });
    } catch {
      // 列表加载失败时保持空态，主流程（useResumeStore.load）有独立的错误处理
    }
  },

  /** 新建空白简历并切换过去 */
  createResume: async () => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const resumeStore = useResumeStore.getState();
      if (resumeStore.dirty) await resumeStore.save();
      const library = await loadResumeLibrary();
      const now = Date.now();
      const meta: ResumeMeta = {
        id: generateResumeId(),
        name: generateResumeName(i18n.t('resumeManager.untitled'), toMetas(library)),
        createdAt: now,
        updatedAt: now,
      };
      // 新简历继承当前正在使用的模板
      library.resumes.push({
        meta,
        data: { ...createEmptyResume(), 'x-op-template': useUIStore.getState().template },
      });
      library.activeId = meta.id;
      await persistResumeLibrary(library);
      set({ resumes: toMetas(library), activeId: library.activeId });
      await resumeStore.load();
    } finally {
      set({ busy: false });
    }
  },

  /** 基于现有简历创建副本（不切换） */
  duplicateResume: async (id) => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const library = await loadResumeLibrary();
      const source = library.resumes.find((r) => r.meta.id === id);
      if (!source) return;
      const now = Date.now();
      const meta: ResumeMeta = {
        id: generateResumeId(),
        name: generateResumeName(
          i18n.t('resumeManager.copySuffix', { name: source.meta.name }),
          toMetas(library),
        ),
        createdAt: now,
        updatedAt: now,
      };
      const cloned = JSON.parse(JSON.stringify(source.data)) as JsonResume;
      library.resumes.push({ meta, data: cloned });
      await persistResumeLibrary(library);
      set({ resumes: toMetas(library) });
    } finally {
      set({ busy: false });
    }
  },

  renameResume: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const library = await loadResumeLibrary();
    const target = library.resumes.find((r) => r.meta.id === id);
    if (!target || target.meta.name === trimmed) return;
    target.meta.name = trimmed;
    await persistResumeLibrary(library);
    set({ resumes: toMetas(library) });
  },

  deleteResume: async (id) => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const library = await loadResumeLibrary();
      // 至少保留一份简历
      if (library.resumes.length <= 1) return;
      library.resumes = library.resumes.filter((r) => r.meta.id !== id);
      const deletingActive = library.activeId === id;
      if (deletingActive) {
        library.activeId = library.resumes[0].meta.id;
      }
      await persistResumeLibrary(library);
      set({ resumes: toMetas(library), activeId: library.activeId });
      if (deletingActive) {
        // 当前简历被删除：加载新的激活简历；旧简历未保存的更改随删除一并丢弃
        await useResumeStore.getState().load();
      }
    } finally {
      set({ busy: false });
    }
  },

  /** 切换到指定简历：先保存当前简历的未保存更改，再加载目标简历 */
  switchResume: async (id) => {
    if (get().busy || get().activeId === id) return;
    set({ busy: true });
    try {
      const resumeStore = useResumeStore.getState();
      if (resumeStore.dirty) await resumeStore.save();
      const library = await loadResumeLibrary();
      if (!library.resumes.some((r) => r.meta.id === id)) return;
      library.activeId = id;
      await persistResumeLibrary(library);
      set({ resumes: toMetas(library), activeId: id });
      await resumeStore.load();
    } finally {
      set({ busy: false });
    }
  },
}));
