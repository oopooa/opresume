import type { ResumeConfig } from '@/types';

const API_URL = '/api/resume';

function isDev(): boolean {
  return import.meta.env.DEV;
}

export async function loadConfig(): Promise<ResumeConfig> {
  if (isDev()) {
    const res = await fetch(API_URL);
    if (res.ok) return res.json();
  }

  const res = await fetch('/data/resume.json');
  if (!res.ok) {
    throw new Error(`加载简历数据失败 (${res.status})`);
  }
  return res.json();
}

export async function saveConfig(config: ResumeConfig): Promise<void> {
  if (isDev()) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config, null, 2),
    });
    if (!res.ok) {
      throw new Error(`保存失败 (${res.status})`);
    }
  }
}

export function exportConfig(config: ResumeConfig): void {
  const blob = new Blob(
    [JSON.stringify(config, null, 2)],
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
        resolve(JSON.parse(reader.result as string));
      } catch {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
