import type { ExtendedJSONResume } from '@/types/extended-json-resume';
import zhCN from './sample-resume.zh-CN.json';
import enUS from './sample-resume.en-US.json';

const sampleResumes: Record<string, ExtendedJSONResume> = {
  'zh-CN': zhCN as ExtendedJSONResume,
  'en-US': enUS as ExtendedJSONResume,
};

/** 根据语言获取对应的示例简历数据 */
export function getSampleResume(lang: string): ExtendedJSONResume {
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
