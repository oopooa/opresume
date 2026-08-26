import type { AIProviderPreset } from '@/types';

/**
 * OpenCode Go（opencode.ai「Go」订阅套餐，10 美元/月访问精选开源编程模型）
 * 官方文档：https://opencode.ai/docs/zh-cn/go
 * API 端点：https://opencode.ai/zen/go/v1/chat/completions（OpenAI 兼容，实测 401= 需鉴权）
 * 模型列表：https://opencode.ai/zen/go/v1/models（实测返回 OpenAI 格式 { data: [{ id }] }）
 *
 * ✅ 2026-08 实测校准（scripts/verify-provider-endpoints.ts）：
 * - 官方 /v1/models 返回 31 个模型；本表仅收录 /v1/chat/completions 可用模型。
 * - grok-4.6 / gpt-5.6-luna 走 /v1/responses（官方文档标注），不适用本应用的
 *   chat/completions 请求格式，故不列出；grok-4.5、muse-spark-1.2-contributor
 *   端点类型未确认，同样不列出。
 * - ⚠️ 浏览器直连限制（已实测）：官方端点对 OPTIONS 预检返回 404、响应不带
 *   Access-Control-Allow-Origin，浏览器无法直连。曾用 Vercel AI Gateway 中转
 *   （https://ai-sdk-gateway.vercel.ai），但该网关已下线（全部返回
 *   DEPLOYMENT_NOT_FOUND，含 gateway.vercel.ai / ai-gateway.vercel.ai 变体）。
 *   因此：服务端/Node（本仓库 scripts/*.ts 测试脚本）可直连官方端点使用；
 *   浏览器端需自备 OpenAI 兼容 CORS 中转（在设置中添加自定义供应商，或恢复
 *   本预设的 relay 字段指向可用网关）。
 */
const models: AIProviderPreset['models'] = [
  { id: 'minimax-m3', name: 'MiniMax-M3', tags: ['chat'] },
  { id: 'minimax-m2.7', name: 'MiniMax-M2.7', tags: ['chat'] },
  { id: 'minimax-m2.5', name: 'MiniMax-M2.5', tags: ['chat'] },
  { id: 'kimi-k3', name: 'Kimi-K3', tags: ['chat'] },
  { id: 'kimi-k2.7-code', name: 'Kimi-K2.7-Code', tags: ['code', 'chat'] },
  { id: 'kimi-k2.6', name: 'Kimi-K2.6', tags: ['chat'] },
  { id: 'longcat-2.0', name: 'LongCat-2.0', tags: ['chat'] },
  { id: 'kimi-k2.5', name: 'Kimi-K2.5', tags: ['chat'] },
  { id: 'glm-5.2', name: 'GLM-5.2', tags: ['chat'] },
  { id: 'glm-5.3-flash', name: 'GLM-5.3-Flash', tags: ['chat'] },
  { id: 'glm-5.3', name: 'GLM-5.3', tags: ['chat'] },
  { id: 'glm-5.1', name: 'GLM-5.1', tags: ['chat'] },
  { id: 'glm-5', name: 'GLM-5', tags: ['chat'] },
  { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', tags: ['chat'] },
  { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', tags: ['chat'] },
  { id: 'deepseek-v4-flash-vision-exp', name: 'DeepSeek-V4-Flash-Vision-Exp', tags: ['chat'] },
  { id: 'qwen3.7-max', name: 'Qwen3.7-Max', tags: ['chat'] },
  { id: 'qwen3.8-max', name: 'Qwen3.8-Max', tags: ['chat'] },
  { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', tags: ['chat'] },
  { id: 'qwen3.6-plus', name: 'Qwen3.6-Plus', tags: ['chat'] },
  { id: 'qwen3.5-plus', name: 'Qwen3.5-Plus', tags: ['chat'] },
  { id: 'mimo-v2-pro', name: 'MiMo-V2-Pro', tags: ['chat'] },
  { id: 'mimo-v2-omni', name: 'MiMo-V2-Omni', tags: ['chat'] },
  { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', tags: ['chat'] },
  { id: 'mimo-v2.5', name: 'MiMo-V2.5', tags: ['chat'] },
  { id: 'hy3', name: 'Hy3', tags: ['chat'] },
  { id: 'hy3-preview', name: 'Hy3-Preview', tags: ['chat'] },
];

const opencode: AIProviderPreset = {
  id: 'opencode',
  nameKey: 'provider.opencode',
  abbr: 'OC',
  brandColor: 'bg-slate-900',
  defaultApiUrl: 'https://opencode.ai/zen/go',
  recommendedModel: 'deepseek-v4-flash',
  apiKeyUrl: 'https://opencode.ai/auth',
  website: 'https://opencode.ai',
  models,
};

export default opencode;