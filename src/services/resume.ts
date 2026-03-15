import type { ResumeConfig } from '@/types';
import { migrateMarkdownFields } from '@/utils/migrate-markdown';
import { sampleResume } from '@/config/sample-resume';

const API_URL = '/api/resume';
const LS_KEY = 'opresume-config';

function isDev(): boolean {
  return import.meta.env.DEV;
}

function addCustomFieldIds(config: ResumeConfig): ResumeConfig {
  if (!config.profile?.customFields) return config;

  return {
    ...config,
    profile: {
      ...config.profile,
      customFields: config.profile.customFields.map((field, index) => ({
        ...field,
        id: field.id || `custom-${Date.now()}-${index}`,
      })),
    },
  };
}

function removeCustomFieldIds(config: ResumeConfig): ResumeConfig {
  const cleaned = { ...config };
  if (cleaned.profile?.customFields) {
    cleaned.profile = {
      ...cleaned.profile,
      customFields: cleaned.profile.customFields
        .filter((f) => f.key.trim() || f.value.trim())
        .map(({ id: _, ...rest }) => rest),
    };
  }
  return cleaned;
}

export async function loadConfig(): Promise<ResumeConfig> {
  let config: ResumeConfig;

  if (isDev()) {
    const res = await fetch(API_URL);
    if (res.ok) {
      config = await res.json();
      return migrateMarkdownFields(addCustomFieldIds(config));
    }
  }

  // 生产模式：优先从 localStorage 读取用户编辑过的数据
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (validateConfig(parsed)) {
        config = parsed;
        return migrateMarkdownFields(addCustomFieldIds(config));
      }
      localStorage.removeItem(LS_KEY);
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }

  const res = await fetch('/data/resume.json');
  if (!res.ok) {
    return migrateMarkdownFields(
      addCustomFieldIds({ ...sampleResume, avatar: { ...sampleResume.avatar, hidden: false } }),
    );
  }
  config = await res.json();
  return migrateMarkdownFields(addCustomFieldIds(config));
}

export async function saveConfig(config: ResumeConfig): Promise<void> {
  const cleaned = removeCustomFieldIds(config);
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

export function exportConfig(config: ResumeConfig, filename?: string): void {
  const cleaned = removeCustomFieldIds(config);
  const output = { ...cleaned, opresumeVersion: __APP_VERSION__ };
  const blob = new Blob(
    [JSON.stringify(output, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'resume.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importConfig(file: File): Promise<ResumeConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { opresumeVersion: _, ...config } = JSON.parse(reader.result as string);
        resolve(migrateMarkdownFields(addCustomFieldIds(config)));
      } catch {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** 校验导入的数据是否符合 ResumeConfig 基本结构 */
export function validateConfig(data: unknown): data is ResumeConfig {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  const knownKeys = [
    'profile', 'avatar', 'educationList', 'workExpList', 'projectList',
    'skillList', 'awardList', 'workList', 'aboutme',
    'titleNameMap', 'moduleHidden', 'moduleLayout', 'locales',
  ];
  if (!knownKeys.some((k) => k in obj)) return false;
  if ('profile' in obj && obj.profile !== undefined) {
    if (typeof obj.profile !== 'object' || obj.profile === null) return false;
    const p = obj.profile as Record<string, unknown>;
    if ('name' in p && typeof p.name !== 'string') return false;
  }
  const listKeys = ['educationList', 'workExpList', 'projectList', 'skillList', 'awardList', 'workList'];
  for (const key of listKeys) {
    if (key in obj && obj[key] !== undefined) {
      if (!Array.isArray(obj[key])) return false;
      if ((obj[key] as unknown[]).some((item) => typeof item !== 'object' || item === null)) return false;
    }
  }
  return true;
}
