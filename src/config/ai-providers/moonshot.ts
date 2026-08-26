import type { AIProviderPreset } from '@/types';

/**
 * Kimi（月之暗面 Moonshot）
 * 官方 OpenAI 兼容接入：Base URL https://api.moonshot.cn（追加 /v1/chat/completions）
 * 模型 ID 参考开放平台与 models.dev：kimi-k3 / kimi-k2.7-code / kimi-k2.6 / kimi-k2.5 为当前主线，moonshot-v1-* 为兼容旧模型
 */
const models: AIProviderPreset['models'] = [
  { id: 'kimi-k3', name: 'Kimi-K3', tags: ['chat'] },
  { id: 'kimi-k2.7-code', name: 'Kimi-K2.7-Code', tags: ['code', 'chat'] },
  { id: 'kimi-k2.6', name: 'Kimi-K2.6', tags: ['chat'] },
  { id: 'kimi-k2.5', name: 'Kimi-K2.5', tags: ['chat'] },
  { id: 'kimi-k2-thinking', name: 'Kimi-K2-Thinking', tags: ['reasoning'] },
  { id: 'kimi-latest', name: 'Kimi-Latest（滚动更新）', tags: ['chat'] },
  { id: 'moonshot-v1-128k', name: 'Moonshot-v1-128K', tags: ['chat'] },
  { id: 'moonshot-v1-32k', name: 'Moonshot-v1-32K', tags: ['chat'] },
];

const moonshot: AIProviderPreset = {
  id: 'moonshot',
  nameKey: 'provider.moonshot',
  abbr: 'MK',
  brandColor: 'bg-slate-700',
  defaultApiUrl: 'https://api.moonshot.cn',
  recommendedModel: 'kimi-latest',
  apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
  website: 'https://www.moonshot.cn',
  models,
};

export default moonshot;