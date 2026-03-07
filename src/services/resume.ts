import type { ResumeConfig } from '@/types';
import { migrateMarkdownFields } from '@/utils/migrate-markdown';

const API_URL = '/api/resume';

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

  const res = await fetch('/data/resume.json');
  if (!res.ok) {
    throw new Error(`加载简历数据失败 (${res.status})`);
  }
  config = await res.json();
  return migrateMarkdownFields(addCustomFieldIds(config));
}

export async function saveConfig(config: ResumeConfig): Promise<void> {
  if (isDev()) {
    const cleaned = removeCustomFieldIds(config);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned, null, 2),
    });
    if (!res.ok) {
      throw new Error(`保存失败 (${res.status})`);
    }
  }
}

export function exportConfig(config: ResumeConfig): void {
  const cleaned = removeCustomFieldIds(config);
  const blob = new Blob(
    [JSON.stringify(cleaned, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importConfig(file: File): Promise<ResumeConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const config = JSON.parse(reader.result as string);
        resolve(migrateMarkdownFields(addCustomFieldIds(config)));
      } catch {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
