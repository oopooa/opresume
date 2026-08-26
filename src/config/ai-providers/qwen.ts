import type { AIProviderPreset } from '@/types';
import qwenIcon from '@/assets/icons/qwen.svg';

/**
 * 千问（通义千问，阿里云百炼 DashScope）
 * 官方 OpenAI 兼容接入：Base URL https://dashscope.aliyuncs.com/compatible-mode/v1
 * 模型 ID 参考 models.dev（Alibaba 官方模型列表，与百炼控制台一致）
 */
const models: AIProviderPreset['models'] = [
  { id: 'qwen-max', name: 'Qwen-Max', tags: ['chat'] },
  { id: 'qwen-plus', name: 'Qwen-Plus', tags: ['chat'] },
  { id: 'qwen-turbo', name: 'Qwen-Turbo', tags: ['chat'] },
  { id: 'qwen-flash', name: 'Qwen-Flash', tags: ['free', 'chat'] },
  { id: 'qwen3.8-max', name: 'Qwen3.8-Max', tags: ['chat'] },
  { id: 'qwen3.7-max', name: 'Qwen3.7-Max', tags: ['chat'] },
  { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', tags: ['chat'] },
  { id: 'qwen3.6-plus', name: 'Qwen3.6-Plus', tags: ['chat'] },
  { id: 'qwen3.6-flash', name: 'Qwen3.6-Flash', tags: ['free', 'chat'] },
  { id: 'qwen3.5-plus', name: 'Qwen3.5-Plus', tags: ['chat'] },
  { id: 'qwen3-coder-plus', name: 'Qwen3-Coder-Plus', tags: ['code', 'chat'] },
  { id: 'qwen3-coder-flash', name: 'Qwen3-Coder-Flash', tags: ['free', 'code', 'chat'] },
];

const qwen: AIProviderPreset = {
  id: 'qwen',
  nameKey: 'provider.qwen',
  abbr: 'QW',
  brandColor: 'bg-fuchsia-600',
  icon: qwenIcon,
  defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
  recommendedModel: 'qwen-plus',
  apiKeyUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
  website: 'https://dashscope.aliyun.com',
  models,
};

export default qwen;