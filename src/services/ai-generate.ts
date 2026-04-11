import i18n from '@/i18n';

/**
 * 调用 AI 生成文本
 * @param config AI 配置（apiKey、apiUrl、model）
 * @param messages 对话消息列表
 * @returns AI 生成的文本
 * @throws 如果 API 调用失败
 */
export async function generateText(
  config: {
    apiKey: string;
    apiUrl: string;
    model: string;
  },
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  const url = `${config.apiUrl}/v1/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.3, // 降低随机性，提高一致性
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(i18n.t('importPDF.errorInvalidApiKey'));
      }
      if (response.status === 429) {
        throw new Error(i18n.t('importPDF.errorRateLimit'));
      }
      throw new Error(i18n.t('importPDF.errorApiFailed', { status: response.status }));
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(i18n.t('importPDF.errorInvalidAIResponse'));
    }

    return data.choices[0].message.content;
  } catch (error) {
    // 检测 CORS 错误
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(i18n.t('importPDF.errorCORS'));
    }
    throw error;
  }
}

/**
 * 从 AI 返回的文本中提取 JSON
 * @param text AI 返回的文本（可能包含 markdown 代码块）
 * @returns 解析后的 JSON 对象
 * @throws 如果 JSON 解析失败
 */
export function extractJSON(text: string): unknown {
  // 虽然 prompt 要求 AI 直接返回 JSON，但很多 LLM 仍会包裹 markdown 代码块，
  // 因此这里做防御性提取：优先从代码块中取出纯 JSON 文本，再统一解析。
  const jsonText =
    text.match(/```json\s*([\s\S]*?)\s*```/)?.[1] ??
    text.match(/```\s*([\s\S]*?)\s*```/)?.[1] ??
    text.trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error(i18n.t('importPDF.errorExtractJSONFailed'));
  }
}
