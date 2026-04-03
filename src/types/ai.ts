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
