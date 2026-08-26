/**
 * AI 供应商注册中心。
 *
 * 使用 Vite 的 import.meta.glob 扫描当前目录下所有供应商配置文件，
 * 每个文件必须 default export 一个 AIProviderPreset 对象。
 *
 * 新增静态供应商时只需在此目录新建文件并 default export，
 * 即可被自动发现——无需手动修改任何其他文件。
 *
 * 用户在设置面板创建的自定义供应商（OpenAI 兼容端点）通过
 * getEffectiveProviderPresets() 运行时合并进同一注册表。
 */
import {
  type AIProviderPreset,
  type AIProviderConfig,
  type CustomProvider,
  customProviderToPreset,
} from '@/types';

const modules = import.meta.glob<{ default: AIProviderPreset }>(
  ['./*.ts', '!./index.ts'],
  { eager: true },
);

/** 静态注册的供应商映射表，键为 preset.id */
export const AI_PROVIDER_PRESETS: Record<string, AIProviderPreset> = {};

/** 静态供应商 ID 有序列表 */
export const AI_PROVIDER_IDS: string[] = [];

for (const path of Object.keys(modules).sort()) {
  const preset = modules[path].default;
  AI_PROVIDER_PRESETS[preset.id] = preset;
  AI_PROVIDER_IDS.push(preset.id);
}

if (AI_PROVIDER_IDS.length === 0) {
  throw new Error('未找到任何 AI 供应商配置，请确认 ai-providers/ 目录下存在配置文件');
}

/**
 * 合并自定义供应商后的完整注册表（静态预设 + 用户自定义）。
 */
export function getEffectiveProviderPresets(
  customProviders: CustomProvider[],
): Record<string, AIProviderPreset> {
  const merged: Record<string, AIProviderPreset> = { ...AI_PROVIDER_PRESETS };
  for (const cp of customProviders) {
    merged[cp.id] = customProviderToPreset(cp);
  }
  return merged;
}

/** 合并后的供应商 ID 有序列表（静态在前，自定义在后） */
export function getEffectiveProviderIds(customProviders: CustomProvider[]): string[] {
  return [...AI_PROVIDER_IDS, ...customProviders.map((c) => c.id)];
}

/** 取单个 preset（含自定义供应商），不存在返回 undefined */
export function getProviderPreset(
  providerId: string,
  customProviders: CustomProvider[] = [],
): AIProviderPreset | undefined {
  return getEffectiveProviderPresets(customProviders)[providerId];
}

/**
 * 获取供应商的默认配置
 */
export function getDefaultProviderConfig(providerId: string, customProviders: CustomProvider[] = []): AIProviderConfig {
  const preset = getProviderPreset(providerId, customProviders);
  return {
    providerId,
    apiKey: '',
    apiUrl: preset?.defaultApiUrl ?? '',
    selectedModel: preset?.recommendedModel ?? '',
    verified: false,
  };
}