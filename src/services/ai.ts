import type { AIProviderId } from '@/types';
import { AI_PROVIDER_PRESETS } from '@/config/ai-providers';

/** 验证错误码，由 UI 层通过 i18n 映射为用户可读文本 */
export type VerifyErrorCode = 'empty_key' | 'invalid_key' | 'network_error' | 'unknown_provider' | 'request_failed';

export interface VerifyResult {
  success: boolean;
  /** 错误码（UI 层负责翻译） */
  errorCode?: VerifyErrorCode;
  /** 补充信息（如 HTTP 状态码），不直接展示给用户 */
  errorDetail?: string;
  /** API 返回的可用模型 ID 列表 */
  availableModelIds?: string[];
}

/**
 * 验证 API 密钥是否有效，同时获取可用模型 ID 列表
 */
export async function verifyApiKey(
  providerId: AIProviderId,
  apiKey: string,
  apiUrl?: string,
): Promise<VerifyResult> {
  if (!apiKey.trim()) {
    return { success: false, errorCode: 'empty_key' };
  }

  const preset = AI_PROVIDER_PRESETS[providerId];
  if (!preset) {
    return { success: false, errorCode: 'unknown_provider' };
  }

  const baseUrl = apiUrl || preset.defaultApiUrl;
  const endpoint = preset.modelsEndpoint ?? '/v1/models';
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.ok) {
      const json = await response.json();
      const ids = extractModelIds(json);
      return { success: true, availableModelIds: ids };
    }

    if (response.status === 401) {
      return { success: false, errorCode: 'invalid_key' };
    }

    return { success: false, errorCode: 'request_failed', errorDetail: String(response.status) };
  } catch {
    return { success: false, errorCode: 'network_error' };
  }
}

/** 从 /v1/models 响应中提取模型 ID 列表 */
function extractModelIds(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.data)) return [];
  return (obj.data as Record<string, unknown>[])
    .filter((m) => typeof m.id === 'string')
    .map((m) => m.id as string);
}
