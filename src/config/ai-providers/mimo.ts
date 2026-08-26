import type { AIProviderPreset } from '@/types';

/**
 * 小米 MiMo（Xiaomi MiMo 官方模型平台）
 * 官方 OpenAI 兼容接入：Base URL https://api.xiaomimimo.com/v1
 * 模型 ID 参考 models.dev（Xiaomi 官方模型列表）
 */
const models: AIProviderPreset['models'] = [
  { id: 'mimo-v2.5', name: 'MiMo-V2.5', tags: ['chat'] },
  { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', tags: ['chat'] },
  { id: 'mimo-v2.5-pro-ultraspeed', name: 'MiMo-V2.5-Pro-UltraSpeed', tags: ['chat'] },
  { id: 'mimo-v2-pro', name: 'MiMo-V2-Pro', tags: ['chat'] },
  { id: 'mimo-v2-flash', name: 'MiMo-V2-Flash', tags: ['chat'] },
  { id: 'mimo-v2-omni', name: 'MiMo-V2-Omni', tags: ['chat'] },
];

const mimo: AIProviderPreset = {
  id: 'mimo',
  nameKey: 'provider.mimo',
  abbr: 'MiMo',
  brandColor: 'bg-amber-500',
  defaultApiUrl: 'https://api.xiaomimimo.com',
  recommendedModel: 'mimo-v2.5',
  apiKeyUrl: '',
  website: 'https://www.xiaomimimo.com',
  models,
};

export default mimo;