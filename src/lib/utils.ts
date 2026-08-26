import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 归一化 OpenAI 兼容的 Base URL（应用内部会再拼接 /v1/models、/v1/chat/completions）：
 * - 去除首尾空白与结尾斜杠
 * - 缺少协议时补 https://
 * - 去除结尾的 /v1（用户常直接粘贴 https://api.example.com/v1，避免拼出 /v1/v1/...）
 * - 去除结尾的 /chat/completions（个别用户粘贴完整端点）
 */
export function normalizeApiBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/chat\/completions$/i, '');
  url = url.replace(/\/v1$/i, '');
  return url;
}
