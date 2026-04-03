/**
 * AI 供应商自动注册中心。
 *
 * 使用 Vite 的 import.meta.glob 扫描当前目录下所有供应商配置文件，
 * 每个文件必须 default export 一个 AIProviderPreset 对象。
 *
 * 新增供应商时只需在此目录新建文件并 default export，
 * 即可被自动发现——无需手动修改任何其他文件。
 */
import type { AIProviderPreset, AIProviderConfig } from '@/types';

const modules = import.meta.glob<{ default: AIProviderPreset }>(
  ['./*.ts', '!./index.ts'],
  { eager: true },
);

/**
 * 所有已注册供应商的映射表，键为 preset.id。
 */
export const AI_PROVIDER_PRESETS: Record<string, AIProviderPreset> = {};

/** 供应商 ID 有序列表 */
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
 * 获取供应商的默认配置
 */
export function getDefaultProviderConfig(providerId: string): AIProviderConfig {
  const preset = AI_PROVIDER_PRESETS[providerId];
  return {
    providerId,
    apiKey: '',
    apiUrl: preset.defaultApiUrl,
    selectedModel: preset.recommendedModel,
    verified: false,
  };
}
