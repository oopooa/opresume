import type { AIProviderPreset } from '@/types';
import siliconflowIcon from '@/assets/icons/silicon.svg';

/**
 * 硅基流动免费文本对话模型
 * 来源：https://siliconflow.cn/models（标价 ¥0）
 */
const models: AIProviderPreset['models'] = [
  { id: 'Qwen/Qwen3.5-4B', name: 'Qwen3.5-4B', tags: ['free', 'chat'] },
  { id: 'Qwen/Qwen3-8B', name: 'Qwen3-8B', tags: ['free', 'chat'] },
  { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B-Instruct', tags: ['free', 'chat'] },
  { id: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B', name: 'DeepSeek-R1-Qwen3-8B', tags: ['free', 'reasoning'] },
  { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', name: 'DeepSeek-R1-Distill-Qwen-7B', tags: ['free', 'reasoning'] },
];

const siliconflow: AIProviderPreset = {
  id: 'siliconflow',
  nameKey: 'provider.siliconflow',
  abbr: 'SF',
  brandColor: 'bg-violet-500',
  icon: siliconflowIcon,
  defaultApiUrl: 'https://api.siliconflow.cn',
  modelsEndpoint: '/v1/models?sub_type=chat',
  recommendedModel: 'Qwen/Qwen3.5-4B',
  apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
  website: 'https://siliconflow.cn',
  models,
};

export default siliconflow;
