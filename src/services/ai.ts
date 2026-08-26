import type { AIProviderId, CustomProvider } from '@/types';
import { getProviderPreset } from '@/config/ai-providers';
import { normalizeApiBaseUrl } from '@/lib/utils';
import { resolveTarget } from './ai-generate';

/** 验证错误码，由 UI 层通过 i18n 映射为用户可读文本 */
export type VerifyErrorCode = 'empty_key' | 'invalid_key' | 'network_error' | 'unknown_provider' | 'request_failed' | 'cors_error';

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
  customProviders: CustomProvider[] = [],
): Promise<VerifyResult> {
  const preset = getProviderPreset(providerId, customProviders);
  if (!preset) {
    return { success: false, errorCode: 'unknown_provider' };
  }

  // 免 Key 供应商（Ollama 等）或自定义供应商允许空 Key（如本地无鉴权网关）
  if (!apiKey.trim() && preset.requiresKey !== false && !preset.custom) {
    return { success: false, errorCode: 'empty_key' };
  }

  // 归一化 Base URL：去除结尾斜杠与多余的 /v1，避免拼出 /v1/v1/models
  const baseUrl = normalizeApiBaseUrl(apiUrl || preset.defaultApiUrl);

  // 中转代理（CORS 中继）供应商：网关通常不提供 /v1/models，
  // 改用最小的 chat 探测请求验证密钥与模型可用性。
  if (preset.relay) {
    const target = resolveTarget({ apiKey, apiUrl: baseUrl, model: preset.recommendedModel, relay: preset.relay }, '/v1/chat/completions');
    try {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {}),
          ...target.headers,
        },
        body: JSON.stringify({
          model: preset.recommendedModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
          stream: false,
        }),
      });
      if (response.ok) {
        return { success: true };
      }
      if (response.status === 401 || response.status === 403) {
        return { success: false, errorCode: 'invalid_key', errorDetail: String(response.status) };
      }
      return {
        success: false,
        errorCode: 'request_failed',
        errorDetail: buildErrorDetail(response.status, await readBodySnippet(response)),
      };
    } catch (error) {
      return classifyFetchError(error);
    }
  }

  const endpoint = preset.modelsEndpoint ?? '/v1/models';
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: apiKey.trim()
        ? { Authorization: `Bearer ${apiKey.trim()}` }
        : {},
    });

    if (response.ok) {
      const json = await response.json();
      const ids = extractModelIds(json);
      return { success: true, availableModelIds: ids };
    }

    if (response.status === 401) {
      return { success: false, errorCode: 'invalid_key' };
    }

    return {
      success: false,
      errorCode: 'request_failed',
      errorDetail: buildErrorDetail(response.status, await readBodySnippet(response)),
    };
  } catch (error) {
    return classifyFetchError(error);
  }
}

/**
 * 归类浏览器 fetch 抛出的异常：
 * - CORS 拦截 / 断网 / DNS 失败在浏览器端都表现为 TypeError("Failed to fetch")，
 *   单独拆分为 cors_error 让 UI 给出可操作的提示，并保留原始 message 便于排查。
 * - 其余异常作为网络错误返回，同样携带原始信息。
 */
function classifyFetchError(error: unknown): VerifyResult {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return { success: false, errorCode: 'cors_error', errorDetail: message };
  }
  return { success: false, errorCode: 'network_error', errorDetail: message };
}

/** 拼接验证失败详情（HTTP 状态码 + 响应体摘要，便于排查中转代理问题） */
function buildErrorDetail(status: number, bodySnippet: string): string {
  const detail = String(status);
  return bodySnippet ? `${detail} · ${bodySnippet}` : detail;
}

/** 读取响应体前 160 字符作为错误摘要 */
async function readBodySnippet(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 160);
  } catch {
    return '';
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
