import type { AIProviderPreset } from '@/types';
import deepseekIcon from '@/assets/icons/deepseek.svg';

/**
 * DeepSeek 官方平台
 * 官方 OpenAI 兼容接入：Base URL https://api.deepseek.com（等价 https://api.deepseek.com/v1）
 * 模型 ID 参考 models.dev（DeepSeek 官方模型列表，deepseek-v4-* 为当前主线，deepseek-chat/reasoner 为兼容旧别名）
 */
const models: AIProviderPreset['models'] = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', tags: ['chat'] },
  { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', tags: ['chat'] },
  { id: 'deepseek-v4-flash-vision-exp', name: 'DeepSeek-V4-Flash-Vision-Exp', tags: ['chat'] },
  { id: 'deepseek-chat', name: 'DeepSeek-V3 (deepseek-chat)', tags: ['chat'] },
  { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (deepseek-reasoner)', tags: ['reasoning'] },
];

const deepseek: AIProviderPreset = {
  id: 'deepseek',
  nameKey: 'provider.deepseek',
  abbr: 'DS',
  brandColor: 'bg-blue-600',
  icon: deepseekIcon,
  defaultApiUrl: 'https://api.deepseek.com',
  recommendedModel: 'deepseek-v4-flash',
  apiKeyUrl: 'https://platform.deepseek.com/api_keys',
  website: 'https://www.deepseek.com',
  models,
};

export default deepseek;