import type { ExtendedJSONResume } from '@/types/extended-json-resume';
import { isLegacyFormat, convertLegacyToNew } from '@/utils/legacy-compat';
import { getSampleResume } from '@/config/sample-resume';
import { detectBrowserLanguage, isDemoMode } from '@/i18n';

const API_URL = '/api/resume';
const LS_KEY = 'opresume-config';

function isDev(): boolean {
  return import.meta.env.DEV;
}

function getDefaultResume(lang?: string): ExtendedJSONResume {
  const detectedLang = lang || detectBrowserLanguage();
  const sample = getSampleResume(detectedLang);
  return {
    ...sample,
    'x-op-avatar': { ...(sample['x-op-avatar'] || {}), hidden: false }
  };
}

function addCustomFieldIds(resume: ExtendedJSONResume): ExtendedJSONResume {
  if (!resume['x-op-customFields']) return resume;
  const timestamp = Date.now();
  return {
    ...resume,
    'x-op-customFields': resume['x-op-customFields'].map((field, index) => ({
      ...field,
      id: field.id || `custom-${timestamp}-${index}`,
    })),
  };
}

function removeCustomFieldIds(resume: ExtendedJSONResume): ExtendedJSONResume {
  const cleaned = { ...resume };
  if (cleaned['x-op-customFields']) {
    cleaned['x-op-customFields'] = cleaned['x-op-customFields']
      .filter((f) => f.key.trim() || f.value.trim())
      .map(({ id: _, ...rest }) => rest);
  }
  return cleaned;
}

function isExtendedJSONResume(data: unknown): data is ExtendedJSONResume {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  return 'basics' in obj || 'work' in obj || 'education' in obj;
}

export async function loadResume(lang?: string): Promise<ExtendedJSONResume> {
  // Demo 模式：直接返回对应语言的示例数据，忽略所有其他数据源
  if (isDemoMode()) {
    return addCustomFieldIds(getDefaultResume(lang));
  }

  let data: unknown;

  if (isDev()) {
    const res = await fetch(API_URL);
    if (res.ok) {
      data = await res.json();
      if (isExtendedJSONResume(data)) {
        return addCustomFieldIds(data);
      }
      if (isLegacyFormat(data)) {
        const converted = convertLegacyToNew(data);
        await saveResume(converted);
        return addCustomFieldIds(converted);
      }
    }
    // 开发模式下 API 失败，继续尝试其他来源
  }

  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (isExtendedJSONResume(parsed)) {
        return addCustomFieldIds(parsed);
      }
      if (isLegacyFormat(parsed)) {
        const converted = convertLegacyToNew(parsed);
        localStorage.setItem(LS_KEY, JSON.stringify(removeCustomFieldIds(converted)));
        return addCustomFieldIds(converted);
      }
      localStorage.removeItem(LS_KEY);
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }

  const res = await fetch('/data/resume.json');
  if (!res.ok) {
    return addCustomFieldIds(getDefaultResume(lang));
  }
  data = await res.json();
  if (isExtendedJSONResume(data)) {
    return addCustomFieldIds(data);
  }
  if (isLegacyFormat(data)) {
    return addCustomFieldIds(convertLegacyToNew(data));
  }
  return addCustomFieldIds(getDefaultResume(lang));
}

export async function saveResume(resume: ExtendedJSONResume): Promise<void> {
  const cleaned = removeCustomFieldIds(resume);

  if (isDev()) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned, null, 2),
    });
    if (!res.ok) {
      throw new Error(`保存失败 (${res.status})`);
    }
  } else {
    localStorage.setItem(LS_KEY, JSON.stringify(cleaned));
  }
}

export function exportResume(resume: ExtendedJSONResume, filename?: string): void {
  const cleaned = removeCustomFieldIds(resume);
  const output = { ...cleaned, opresumeVersion: __APP_VERSION__ };
  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'resume.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAsStandardJSONResume(resume: ExtendedJSONResume, filename?: string): void {
  const cleaned = removeCustomFieldIds(resume);
  const standardResume = Object.fromEntries(
    Object.entries(cleaned).filter(([key]) => !key.startsWith('x-op-'))
  );
  const blob = new Blob([JSON.stringify(standardResume, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'resume-standard.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importResume(file: File): Promise<ExtendedJSONResume> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { opresumeVersion: _, ...data } = JSON.parse(reader.result as string);
        if (isExtendedJSONResume(data)) {
          resolve(addCustomFieldIds(data));
        } else if (isLegacyFormat(data)) {
          resolve(addCustomFieldIds(convertLegacyToNew(data)));
        } else {
          reject(new Error('不支持的数据格式'));
        }
      } catch {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
