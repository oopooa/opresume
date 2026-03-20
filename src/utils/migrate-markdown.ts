import { marked } from 'marked';
import type { ResumeConfig } from '@/types/resume';

/**
 * 检测文本是否已经是 HTML 格式
 * 如果文本以 HTML 标签开头，视为 HTML；否则视为 Markdown
 */
function isHTML(text: string): boolean {
  return /^\s*<(p|ul|ol|div|h[1-6]|br)\b/i.test(text);
}

/**
 * 将 Markdown 文本转换为 HTML
 * 如果文本已经是 HTML，则原样返回
 */
function convertField(text: string | undefined): string | undefined {
  if (!text || isHTML(text)) return text;
  const html = marked.parse(text, { async: false }) as string;
  return html.trim();
}

/**
 * 迁移 ResumeConfig 中所有 Markdown 字段为 HTML
 * 处理 workExpList[].workDesc、projectList[].projectContent、aboutme.aboutmeDesc
 * 同时处理 locales 中的对应字段
 */
export function migrateMarkdownFields(config: ResumeConfig): ResumeConfig {
  const result = { ...config };

  if (result.workExpList) {
    result.workExpList = result.workExpList.map((item) => ({
      ...item,
      workDesc: convertField(item.workDesc) ?? item.workDesc,
    }));
  }

  if (result.projectList) {
    result.projectList = result.projectList.map((item) => ({
      ...item,
      projectContent: convertField(item.projectContent) ?? item.projectContent,
    }));
  }

  if (result.aboutme?.aboutmeDesc) {
    result.aboutme = {
      ...result.aboutme,
      aboutmeDesc: convertField(result.aboutme.aboutmeDesc) ?? result.aboutme.aboutmeDesc,
    };
  }

  if (result.locales) {
    result.locales = Object.fromEntries(
      Object.entries(result.locales).map(([lang, locale]) => [
        lang,
        migrateMarkdownFields(locale as ResumeConfig),
      ]),
    );
  }

  return result;
}
