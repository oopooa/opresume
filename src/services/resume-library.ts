import i18n, { detectBrowserLanguage } from '@/i18n';
import type { JsonResume } from '@/types/json-resume';
import type { ResumeLibrary, ResumeMeta } from '@/types/resume-library';
import { getSampleResume } from '@/config/sample-resume';

const LIBRARY_API_URL = '/api/resumes';
const LS_LIBRARY_KEY = 'opresume-resumes';
const LS_LEGACY_KEY = 'opresume-config';

function isDev(): boolean {
  return import.meta.env.DEV;
}

export function isJsonResume(data: unknown): data is JsonResume {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  return 'basics' in obj || 'work' in obj || 'education' in obj;
}

/** 按语言生成示例简历（重置头像可见性） */
export function getDefaultResume(lang?: string): JsonResume {
  const detectedLang = lang || detectBrowserLanguage();
  const sample = getSampleResume(detectedLang);
  return {
    ...sample,
    'x-op-avatar': { ...(sample['x-op-avatar'] || {}), hidden: false }
  };
}

/** 生成简历唯一 ID */
export function generateResumeId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 生成不与现有简历重名的名称：基础名、基础名 2、基础名 3… */
export function generateResumeName(base: string, existing: ResumeMeta[]): string {
  const names = new Set(existing.map((r) => r.name));
  if (!names.has(base)) return base;
  let index = 2;
  while (names.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

function isResumeLibrary(data: unknown): data is ResumeLibrary {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.activeId !== 'string' || !Array.isArray(obj.resumes)) return false;
  return obj.resumes.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Record<string, unknown>;
    const meta = entry.meta as Record<string, unknown> | undefined;
    return (
      !!meta &&
      typeof meta.id === 'string' &&
      typeof meta.name === 'string' &&
      typeof meta.createdAt === 'number' &&
      typeof meta.updatedAt === 'number' &&
      isJsonResume(entry.data)
    );
  });
}

/** 将一份简历数据包装为新的简历库 */
function createLibrary(data: JsonResume): ResumeLibrary {
  const now = Date.now();
  const meta: ResumeMeta = {
    id: generateResumeId(),
    name: i18n.t('resumeManager.defaultName'),
    createdAt: now,
    updatedAt: now,
  };
  return { activeId: meta.id, resumes: [{ meta, data }] };
}

/** 读取旧版单简历数据（生产环境 localStorage，开发环境的文件迁移由 /api/resumes 服务端完成） */
function loadLegacyResume(): JsonResume | null {
  const cached = localStorage.getItem(LS_LEGACY_KEY);
  if (!cached) return null;
  try {
    const parsed: unknown = JSON.parse(cached);
    if (isJsonResume(parsed)) return parsed;
    localStorage.removeItem(LS_LEGACY_KEY);
  } catch {
    localStorage.removeItem(LS_LEGACY_KEY);
  }
  return null;
}

/** 读取构建产物中的默认简历（dist/data/resume.json），失败时回退到示例数据 */
async function loadBundledDefault(lang?: string): Promise<JsonResume> {
  try {
    const res = await fetch('/data/resume.json');
    if (res.ok) {
      const data: unknown = await res.json();
      if (isJsonResume(data)) return data;
    }
  } catch {
    // 忽略，回退到示例数据
  }
  return getDefaultResume(lang);
}

/**
 * 加载简历库。按优先级依次尝试：
 * 1. 开发环境的 /api/resumes（文件存储，旧数据迁移由服务端完成）
 * 2. localStorage 中的简历库
 * 3. 迁移旧版单简历数据（localStorage `opresume-config`）
 * 4. 构建产物默认数据 / 示例数据初始化
 *
 * 通过 inflight 去重：并发调用（如启动时 load 与 loadList）共享同一次加载，
 * 避免重复执行迁移逻辑。
 */
let inflightLoad: Promise<ResumeLibrary> | null = null;

export function loadResumeLibrary(lang?: string): Promise<ResumeLibrary> {
  inflightLoad ??= doLoadResumeLibrary(lang).finally(() => {
    inflightLoad = null;
  });
  return inflightLoad;
}

async function doLoadResumeLibrary(lang?: string): Promise<ResumeLibrary> {
  if (isDev()) {
    try {
      const res = await fetch(LIBRARY_API_URL);
      if (res.ok) {
        const data: unknown = await res.json();
        if (isResumeLibrary(data)) {
          return data;
        }
      }
    } catch {
      // 开发模式下 API 失败，继续尝试其他来源
    }
  }

  const cached = localStorage.getItem(LS_LIBRARY_KEY);
  if (cached) {
    try {
      const parsed: unknown = JSON.parse(cached);
      if (isResumeLibrary(parsed)) {
        return parsed;
      }
      localStorage.removeItem(LS_LIBRARY_KEY);
    } catch {
      localStorage.removeItem(LS_LIBRARY_KEY);
    }
  }

  const legacy = loadLegacyResume();
  const library = createLibrary(legacy ?? (await loadBundledDefault(lang)));
  await persistResumeLibrary(library);
  return library;
}

/** 全量持久化简历库（简历数据量小，整体读写） */
export async function persistResumeLibrary(library: ResumeLibrary): Promise<void> {
  if (isDev()) {
    const res = await fetch(LIBRARY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(library, null, 2),
    });
    if (!res.ok) {
      throw new Error(`保存失败 (${res.status})`);
    }
  } else {
    localStorage.setItem(LS_LIBRARY_KEY, JSON.stringify(library));
  }
}

/** 将简历数据保存到库中当前激活的位置，并刷新更新时间 */
export async function saveActiveResume(data: JsonResume): Promise<void> {
  const library = await loadResumeLibrary();
  const now = Date.now();
  const index = library.resumes.findIndex((r) => r.meta.id === library.activeId);
  if (index >= 0) {
    library.resumes[index] = {
      meta: { ...library.resumes[index].meta, updatedAt: now },
      data,
    };
  } else {
    // 激活简历缺失（异常兜底）：作为新简历追加
    library.resumes.push({
      meta: {
        id: library.activeId,
        name: i18n.t('resumeManager.defaultName'),
        createdAt: now,
        updatedAt: now,
      },
      data,
    });
  }
  await persistResumeLibrary(library);
}
