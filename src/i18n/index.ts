import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
} as const;

export const supportedLngs = ['zh-CN', 'en-US'] as const;
export type SupportedLng = (typeof supportedLngs)[number];

/** 将浏览器语言代码规范化为支持的语言 */
export function normalizeLanguage(lang: string): SupportedLng {
  if (supportedLngs.includes(lang as SupportedLng)) {
    return lang as SupportedLng;
  }
  const prefix = lang.split('-')[0].toLowerCase();
  if (prefix === 'zh') return 'zh-CN';
  return 'en-US';
}

/** 从 URL 参数获取语言设置 */
export function getLanguageFromURL(): SupportedLng | null {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  if (lang) {
    return normalizeLanguage(lang);
  }
  return null;
}

/** 检测 URL 是否包含 demo 参数 */
export function isDemoMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('demo');
}

/** 检测语言：优先 URL 参数，其次浏览器语言 */
export function detectBrowserLanguage(): SupportedLng {
  // 优先使用 URL 参数
  const urlLang = getLanguageFromURL();
  if (urlLang) return urlLang;

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  return normalizeLanguage(browserLang);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    supportedLngs: [...supportedLngs],
    detection: {
      // URL 参数优先级最高，其次 localStorage，最后浏览器语言
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'opresume_ui_lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
