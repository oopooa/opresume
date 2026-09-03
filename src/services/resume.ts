import type { JsonResume } from '@/types/json-resume';
import { isDemoMode } from '@/i18n';
import {
  getDefaultResume,
  loadResumeLibrary,
  saveActiveResume,
} from '@/services/resume-library';

function addCustomFieldIds(resume: JsonResume): JsonResume {
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

function removeCustomFieldIds(resume: JsonResume): JsonResume {
  const cleaned = { ...resume };
  if (cleaned['x-op-customFields']) {
    cleaned['x-op-customFields'] = cleaned['x-op-customFields']
      .filter((f) => f.key.trim() || f.value.trim())
      .map(({ id: _, ...rest }) => rest);
  }
  return cleaned;
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return Boolean(data) && typeof data === 'object' && !Array.isArray(data);
}

/**
 * 导入仅接受 OpResume 导出的备份文件。opresumeVersion 仅由导出流程写入，
 * 用于识别文件来源，而非用于对外部数据做完整的 schema 校验。
 */
function isOpResumeExport(data: unknown): data is JsonResume & { opresumeVersion: string } {
  return isRecord(data)
    && typeof data.opresumeVersion === 'string'
    && data.opresumeVersion.length > 0;
}

export type ResumeImportErrorCode = 'invalid-format' | 'parse-failed';

export class ResumeImportError extends Error {
  constructor(public readonly code: ResumeImportErrorCode) {
    super(code);
    this.name = 'ResumeImportError';
  }
}

export async function loadResume(lang?: string): Promise<JsonResume> {
  // Demo 模式：直接返回对应语言的示例数据，忽略所有其他数据源
  if (isDemoMode()) {
    return addCustomFieldIds(getDefaultResume(lang));
  }

  try {
    const library = await loadResumeLibrary(lang);
    const active =
      library.resumes.find((r) => r.meta.id === library.activeId) ?? library.resumes[0];
    if (active) {
      return addCustomFieldIds(active.data);
    }
  } catch {
    // 简历库读取失败时回退到示例数据
  }
  return addCustomFieldIds(getDefaultResume(lang));
}

export async function saveResume(resume: JsonResume): Promise<void> {
  const cleaned = removeCustomFieldIds(resume);
  await saveActiveResume(cleaned);
}

export function exportResume(resume: JsonResume, filename?: string): void {
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

export function exportAsStandardJSONResume(resume: JsonResume, filename?: string): void {
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

export function importResume(file: File): Promise<JsonResume> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const exportedData: unknown = JSON.parse(reader.result as string);
        if (isOpResumeExport(exportedData)) {
          const { opresumeVersion: _, ...resume } = exportedData;
          resolve(addCustomFieldIds(resume));
        } else {
          reject(new ResumeImportError('invalid-format'));
        }
      } catch {
        reject(new ResumeImportError('parse-failed'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
