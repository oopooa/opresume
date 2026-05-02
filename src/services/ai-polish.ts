import i18n from '@/i18n';
import { useAIStore } from '@/store/ai';
import { generateTextStream } from './ai-generate';

export type PolishOperation = 'optimize' | 'condense';

export interface PolishResult {
  html: string;
}

const STRUCTURE_RULES_ZH = `
## 输出格式（严格遵守）

只输出一个合法 JSON 对象，禁止 Markdown 代码块、注释或任何其他文字。

### Schema

{"html": "处理后的HTML"}

字段：
- html（必填，字符串）：处理后的完整 HTML 片段；无需改动时与原文逐字符相同

### 示例

输入：<ul><li>负责前端开发工作</li></ul>

有改动：
{"html":"<ul><li>主导前端架构设计与核心功能开发，按时交付项目</li></ul>"}

无改动：
{"html":"<ul><li>负责前端开发工作</li></ul>"}

## 内容约束

1. 仅基于原文事实改写，不得新增、推断或编造任何信息（公司、技术、数字、时间、角色等）。
2. 必须保留原文 HTML 标签结构（如 <p>/<ul>/<ol>/<li>/<strong>/<em>/<a>），仅改写文本内容，不得新增或删除标签层级。
3. 若原文含有明显与简历无关的内容（随机数字、乱码、测试文字、无意义表情符号等），删除无关内容。
4. 原文中数字或专业英文名词（如 React、Node.js、5 年）前后的空格必须完整保留，不得删除或合并。

## 硬约束

- 响应必须以 \`{\` 字符直接开始，禁止任何前缀文字（包括"好的""以下是"等开场白）。
- 禁止任何 Markdown 代码块包裹（不要 \`\`\`json）。
- JSON 必须且仅能包含 html 一个字段。
- html 值内的双引号必须转义为 \\"，反斜杠转义为 \\\\，换行转义为 \\n。`;

const STRUCTURE_RULES_EN = `
## Output Format (strict)

Output ONLY one valid JSON object. No Markdown fences, no comments, no extra text.

### Schema

{"html": "processed HTML"}

Fields:
- html (required, string): the full processed HTML snippet; byte-identical to the source when no changes are needed

### Examples

Input: <ul><li>Responsible for frontend development work</li></ul>

With changes:
{"html":"<ul><li>Led frontend architecture design and core feature development, delivering the project on schedule</li></ul>"}

No changes:
{"html":"<ul><li>Responsible for frontend development work</li></ul>"}

## Content constraints

1. Rewrite only based on facts in the source. Never add, infer, or fabricate information (companies, tech, numbers, dates, roles).
2. Preserve the original HTML tag structure (<p>/<ul>/<ol>/<li>/<strong>/<em>/<a>). Only rewrite text content; do not add or remove tag layers.
3. If the source contains content clearly unrelated to a resume (random numbers, gibberish, test text, meaningless filler emojis), remove the irrelevant content.
4. Preserve all whitespace around numbers or professional English terms (React, Node.js, 5 years) exactly as in the source.

## Hard constraints

- The response MUST start directly with the \`{\` character — no prefix text, no greetings.
- Do NOT wrap the output in Markdown code fences.
- The JSON MUST contain exactly one field: html.
- Inside html, escape \\" for double-quote, \\\\ for backslash, \\n for newline.`;

const GOALS: Record<PolishOperation, { zh: string; en: string }> = {
  optimize: {
    zh: `把用户提供的 HTML 简历片段重写为更专业的简历表达，遵循 STAR 原则（情境 Situation → 任务 Task → 行动 Action → 结果 Result）：
- 仅基于原文事实重写，不得新增、推断或编造任何信息
- 优先以强动词开头（设计、构建、主导、推动、优化等）
- 若原文有模糊表述但存在数据支撑，将结果改写为量化表达；若原文无数据，则保持原意，不编造数字
- 简洁、专业，去除空话套话
- 长度与原文大致相当`,
    en: `Rewrite the user's HTML resume snippet in a more professional resume tone, following the STAR principle (Situation → Task → Action → Result):
- Only rewrite based on facts in the source. Never add, infer, or fabricate information
- Prefer strong action verbs (designed, built, led, drove, optimized, etc.)
- If the source contains vague phrasing with factual backing, express results quantitatively; if no data exists in the source, preserve the original meaning — never invent numbers
- Be concise and professional; remove filler phrases
- Keep length roughly the same as the source`,
  },
  condense: {
    zh: `精简用户提供的 HTML 简历片段，在不损失关键信息的前提下缩短表达：
- 去除冗余词语、重复信息和无实质内容的套话
- 保留最重要的成果、数据与专有名词
- 精简幅度以内容完整为优先，避免删减有价值的细节`,
    en: `Condense the user's HTML resume snippet without losing key information:
- Remove redundant words, repeated information, and filler phrases
- Retain the most important outcomes, data, and proper nouns
- Prioritize content completeness; avoid cutting valuable details`,
  },
};

function buildSystemPrompt(lang: 'zh' | 'en', operation: PolishOperation, customInstruction?: string): string {
  let goal: string;
  if (customInstruction?.trim()) {
    goal = lang === 'zh'
      ? `按以下用户指令处理 HTML 简历片段："${customInstruction.trim()}"`
      : `Apply the following user instruction to the HTML resume snippet: "${customInstruction.trim()}"`;
  } else {
    goal = GOALS[operation][lang];
  }
  if (lang === 'en') {
    return `You are a professional resume editing assistant.\n\n${goal}\n\n${STRUCTURE_RULES_EN}`;
  }
  return `你是专业的简历编辑助手。\n\n${goal}\n\n${STRUCTURE_RULES_ZH}`;
}

function parseResult(raw: string): PolishResult {
  const trimmed = raw.trim();

  // 防御性剥离 markdown fence（prompt 已禁止，但部分模型仍会包裹）
  const unwrapped = trimmed.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```$/, '').trim();

  // 主路径：标准 JSON 解析（启用 JSON Mode 后绝大多数命中此路径）
  try {
    const parsed = JSON.parse(unwrapped) as { html?: unknown };
    const html = typeof parsed.html === 'string' ? parsed.html.trim() : '';
    if (html) return { html };
  } catch {}

  // 兜底：从指定字段起向前扫描第一个未转义的 "，避免依赖 lastIndexOf 在尾部追加文本时错位。
  const decodeJsonString = (input: string): string =>
    input
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');

  const findField = (key: string): string | undefined => {
    const re = new RegExp(`"${key}"\\s*:\\s*"`);
    const keyMatch = unwrapped.match(re);
    if (!keyMatch || keyMatch.index === undefined) return undefined;
    const start = keyMatch.index + keyMatch[0].length;
    let i = start;
    while (i < unwrapped.length) {
      const ch = unwrapped[i];
      if (ch === '\\') { i += 2; continue; }
      if (ch === '"') return decodeJsonString(unwrapped.slice(start, i));
      i++;
    }
    // 字符串未闭合（如响应被截断），返回到末尾的内容兜底
    return decodeJsonString(unwrapped.slice(start));
  };

  const html = findField('html')?.trim() ?? '';
  if (html) return { html };

  return { html: unwrapped };
}

/**
 * 按原文长度动态估算 max_tokens，避免长段落被截断。
 * 经验值：中文 1 字 ≈ 1.5–2 token，英文/HTML 标签按字符近似计；
 * 留 256 给 JSON 包装与转义；下限 1024 兼顾短句一次返回；上限 8192 保护账单。
 */
function estimateMaxTokens(html: string): number {
  const cps = Array.from(html).length;
  const estimated = Math.ceil(cps * 1.6) + 256;
  return Math.min(8192, Math.max(1024, estimated));
}

/**
 * AI 改写支持的模型列表（硅基流动供应商）
 */
const POLISH_SUPPORTED_MODELS = [
  'Qwen/Qwen3.5-4B',
  'Qwen/Qwen3-8B',
  'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
];

/**
 * 流式调用 AI 润色，每收到新内容就回调 onChunk(rawAccumulated)，完成后返回解析结果。
 * @throws 当 AI 未配置、未验证或调用失败时抛出已本地化的错误
 */
export async function polishHtmlStream(
  html: string,
  operation: PolishOperation = 'optimize',
  customInstruction: string | undefined,
  onChunk: (rawAccumulated: string) => void,
  signal?: AbortSignal,
): Promise<PolishResult> {
  const trimmed = html.trim();
  if (!trimmed) {
    throw new Error(i18n.t('editor.polish.errorEmpty'));
  }

  const ai = useAIStore.getState();
  if (!ai.activeProviderId) {
    throw new Error(i18n.t('editor.polish.errorNoAI'));
  }
  const config = ai.getProviderConfig(ai.activeProviderId);
  if (!config.apiKey || !config.verified) {
    throw new Error(i18n.t('editor.polish.errorNoAI'));
  }

  // 硅基流动供应商：自动切换到支持的模型
  let modelToUse = config.selectedModel;
  if (ai.activeProviderId === 'siliconflow' && !POLISH_SUPPORTED_MODELS.includes(config.selectedModel)) {
    modelToUse = POLISH_SUPPORTED_MODELS[0]; // 默认切换到 Qwen3.5-4B
    console.warn(
      `[AI Polish] 硅基流动供应商选中的模型 "${config.selectedModel}" 不支持 AI 改写功能，已自动切换到 "${modelToUse}"`,
    );
  }

  const lang = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'zh';
  const systemPrompt = buildSystemPrompt(lang, operation, customInstruction);

  const raw = await generateTextStream(
    { apiKey: config.apiKey, apiUrl: config.apiUrl, model: modelToUse },
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: trimmed },
    ],
    onChunk,
    signal,
    estimateMaxTokens(trimmed),
    {
      temperature: 0.7,
      response_format: { type: 'json_object' },
      enable_thinking: false,
    },
  );

  return parseResult(raw);
}
