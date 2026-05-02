import type { JsonResume, JsonWork, JsonProject } from '@/types/json-resume';

/**
 * AI 润色的 read/write 协议。每个含富文本的模块注册一份 handler，
 * PolishDialog 通过 module 名查表完成"读取最新原文 → 校验 → 写回新 HTML"，
 * 不再在对话框组件里枚举模块。
 *
 * - `read` 返回当前 store 中的完整富文本 HTML（未找到时返回 null，调用方会回落到快照）
 * - `write` 计算并返回写回 store 用的局部 patch（条目缺失时返回 null，由调用方决定丢弃）
 */
export interface PolishHandler {
  read(config: JsonResume, itemIndex: number): string | null;
  write(config: JsonResume, itemIndex: number, newHtml: string): Partial<JsonResume> | null;
}

const handlers = new Map<string, PolishHandler>();

handlers.set('aboutme', {
  read: (config) => config['x-op-aboutmeHtml'] ?? null,
  write: (_config, _i, newHtml) => ({ 'x-op-aboutmeHtml': newHtml } as Partial<JsonResume>),
});

handlers.set('workExpList', {
  read: (config, i) => (config.work as JsonWork[] | undefined)?.[i]?.['x-op-workDescHtml'] ?? null,
  write: (config, i, newHtml) => {
    const work = [...(config.work ?? [])] as JsonWork[];
    if (!work[i]) return null;
    work[i] = { ...work[i], 'x-op-workDescHtml': newHtml };
    return { work };
  },
});

handlers.set('projectList', {
  read: (config, i) =>
    (config.projects as JsonProject[] | undefined)?.[i]?.['x-op-projectContentHtml'] ?? null,
  write: (config, i, newHtml) => {
    const projects = [...(config.projects ?? [])] as JsonProject[];
    if (!projects[i]) return null;
    projects[i] = { ...projects[i], 'x-op-projectContentHtml': newHtml };
    return { projects };
  },
});

/**
 * 自定义模块兜底 handler 工厂：自定义模块的 module id 是用户运行时生成的（如 `custom-xyz`），
 * 无法预先注册；改为按 id 即时构造一个查 `x-op-customModules` 的 handler。
 *
 * 用 `customCache` 按 moduleId 弱缓存，避免每次 getPolishHandler 都返回新对象——
 * 让消费侧（例如未来要把 handler 引用塞进 useMemo / useEffect 依赖）保持引用稳定。
 */
const customCache = new Map<string, PolishHandler>();

function createCustomModuleHandler(moduleId: string): PolishHandler {
  return {
    read: (config) =>
      config['x-op-customModules']?.find((m) => m.id === moduleId)?.contentHtml ?? null,
    write: (config, _i, newHtml) => {
      const customModules = [...(config['x-op-customModules'] ?? [])];
      const idx = customModules.findIndex((m) => m.id === moduleId);
      if (idx < 0) return null;
      customModules[idx] = { ...customModules[idx], contentHtml: newHtml };
      return { 'x-op-customModules': customModules } as Partial<JsonResume>;
    },
  };
}

/** 自定义模块 id 前缀。除此前缀外的未注册模块会在开发态抛警告。 */
const CUSTOM_MODULE_PREFIX = 'custom-';

/**
 * 为新模块注册 read/write 协议。一般在模块文件加载时调用一次。
 * 也可在测试或调试场景中覆盖默认实现。
 */
export function registerPolishHandler(module: string, handler: PolishHandler) {
  handlers.set(module, handler);
}

/**
 * 按 module 名查 handler：
 * - 命中注册表 → 返回注册项
 * - 未命中且 module 以 `custom-` 开头 → 返回（缓存的）自定义模块兜底 handler
 * - 未命中且非 custom 前缀 → 仍返回兜底 handler（在 customModules 中查不到时 read/write 返回 null），
 *   但在开发环境打 console.warn，提示开发者是否漏注册。
 */
export function getPolishHandler(module: string): PolishHandler {
  const h = handlers.get(module);
  if (h) return h;

  if (
    import.meta.env.DEV &&
    !module.startsWith(CUSTOM_MODULE_PREFIX)
  ) {
    console.warn(
      `[polish-handlers] 模块 "${module}" 未注册 read/write handler，` +
        `已回落到自定义模块查找；如这是新增的内置模块，请在 polish-handlers.ts 顶部 handlers.set 注册。`,
    );
  }

  let cached = customCache.get(module);
  if (!cached) {
    cached = createCustomModuleHandler(module);
    customCache.set(module, cached);
  }
  return cached;
}
