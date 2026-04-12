import type { JsonResume } from '@/types/json-resume';
import zhCN from './sample-resume.zh-CN.json';
import enUS from './sample-resume.en-US.json';

const sampleResumes: Record<string, JsonResume> = {
  'zh-CN': zhCN as JsonResume,
  'en-US': enUS as JsonResume,
};

/** 根据语言获取对应的示例简历数据 */
export function getSampleResume(lang: string): JsonResume {
  // 支持语言代码的模糊匹配，如 'en' 匹配 'en-US'，'zh' 匹配 'zh-CN'
  if (lang in sampleResumes) {
    return sampleResumes[lang];
  }
  const prefix = lang.split('-')[0];
  if (prefix === 'zh') return sampleResumes['zh-CN'];
  if (prefix === 'en') return sampleResumes['en-US'];
  // 默认返回英文（面向国际用户）
  return sampleResumes['en-US'];
}
