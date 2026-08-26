/**
 * AI 供应商 ID（由供应商配置文件动态注册，不再硬编码）
 */
export type AIProviderId = string;

/**
 * AI 模型配置
 */
export interface AIModel {
  /** 模型 ID（用于 API 调用） */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 模型描述 */
  description?: string;
  /** 模型标签（如 free、reasoning、code） */
  tags?: string[];
}

/**
 * AI 供应商预设配置（只读）
 */
export interface AIProviderPreset {
  /** 供应商 ID */
  id: AIProviderId;
  /** 供应商显示名称（i18n 键） */
  nameKey: string;
  /** 供应商缩写（用于图标展示） */
  abbr: string;
  /** 供应商品牌色（Tailwind 类名） */
  brandColor: string;
  /** 供应商自定义图标（SVG 导入路径） */
  icon?: string;
  /** 默认 API 地址 */
  defaultApiUrl: string;
  /** 模型列表端点路径（可带查询参数过滤，默认 /v1/models） */
  modelsEndpoint?: string;
  /** 推荐模型 ID（验证成功后自动选中） */
  recommendedModel: string;
  /** 预设模型列表 */
  models: AIModel[];
  /** 获取 API 密钥的链接 */
  apiKeyUrl: string;
  /** 供应商官网地址 */
  website: string;
  /** 是否需要 API Key（如 Ollama 本地模型为 false，跳过 Key 校验） */
  requiresKey?: boolean;
  /** 是否为用户在设置中创建的自定义供应商（运行时合并进注册表） */
  custom?: boolean;
  /**
   * 中转代理（CORS 中继）：部分平台接口不允许浏览器直连（响应不带
   * Access-Control-Allow-Origin），需经 OpenAI 兼容的中转代理转发请求。
   * 参考 Vercel AI SDK 的 AI Gateway 方案（https://ai-sdk.dev/docs/gateway）。
   * 启用后：调用地址为 ${relay.baseUrl}/v1/chat/completions（或 /v1/models），
   * 并附加 x-provider-id / x-provider-options 头；验证改用极小的 chat 探测请求。
   */
  relay?: {
    /** 中转代理 Base URL（不含 /v1） */
    baseUrl: string;
    /** 中转代理选择上游供应商的标识（如 openai-compatible） */
    providerId: string;
    /** 以 OpenAI 兼容自定义供应商方式中转：x-provider-options 携带 { baseURL: 上游地址, apiKey } */
    optionsBaseUrl?: boolean;
  };
}

/**
 * 用户自定义供应商（OpenAI 兼容端点的轻量封装）。
 * 用户在「设置 → AI 供应商」一键添加：填名称 + Base URL + API Key + 模型名即可。
 */
export interface CustomProvider {
  /** 唯一 ID（custom-{timestamp}） */
  id: string;
  /** 显示名称 */
  name: string;
  /** API Base URL（不含 /v1，与预设 defaultApiUrl 同义） */
  apiUrl: string;
  /** API 密钥 */
  apiKey: string;
  /** 默认模型 ID（可后续在配置对话框修改） */
  model: string;
  /** 是否已验证（最近一次检测通过） */
  verified: boolean;
  /** 最后验证时间 */
  lastVerifiedAt?: number;
}

/** 根据用户自定义供应商生成运行时预设（用于统一注册表与配置对话框） */
export function customProviderToPreset(cp: CustomProvider): AIProviderPreset {
  return {
    id: cp.id,
    nameKey: `custom.name.${cp.id}`,
    abbr: cp.name.slice(0, 2).toUpperCase(),
    brandColor: 'bg-slate-600',
    defaultApiUrl: cp.apiUrl,
    recommendedModel: cp.model,
    apiKeyUrl: '',
    website: '',
    custom: true,
    models: cp.model ? [{ id: cp.model, name: cp.model, tags: ['chat'] }] : [],
  };
}

/**
 * AI 供应商用户配置（可持久化）
 */
export interface AIProviderConfig {
  /** 供应商 ID */
  providerId: AIProviderId;
  /** API 密钥 */
  apiKey: string;
  /** API 地址（可覆盖默认值） */
  apiUrl: string;
  /** 当前选中的模型 ID */
  selectedModel: string;
  /** API 确认的可用模型 ID 列表（用于过滤预设模型） */
  availableModelIds?: string[];
  /** 是否已验证（最近一次检测通过） */
  verified: boolean;
  /** 最后验证时间 */
  lastVerifiedAt?: number;
}

/**
 * AI 设置状态
 */
export interface AISettings {
  /** 当前激活的供应商 ID */
  activeProviderId: AIProviderId | null;
  /** 各供应商的配置 */
  providers: Partial<Record<AIProviderId, AIProviderConfig>>;
}
