import type { AIProviderPreset } from '@/types';

/**
 * Opencode Zen — opencode.ai 团队提供的 OpenAI 兼容网关
 * 基础 URL：https://opencode.ai/zen/go
 * 请求层会自动拼接 /v1/chat/completions
 * 默认推荐模型：deepseek-v4-pro
 */
const models: AIProviderPreset['models'] = [
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', tags: ['reasoning', 'chat'] },
];

const opencodeZen: AIProviderPreset = {
  id: 'opencode-zen',
  nameKey: 'provider.opencodeZen',
  abbr: 'OZ',
  brandColor: 'bg-emerald-500',
  defaultApiUrl: 'https://opencode.ai/zen/go',
  modelsEndpoint: '/v1/models',
  recommendedModel: 'deepseek-v4-pro',
  apiKeyUrl: 'https://opencode.ai/auth',
  website: 'https://opencode.ai',
  models,
};

export default opencodeZen;
