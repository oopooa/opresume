import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import { getSchema } from './schemas';
import { FormCreator } from './FormCreator';
import { ListEditor } from './ListEditor';

export function Editor() {
  const { t } = useTranslation();
  const editingModule = useUIStore((s) => s.editingModule);
  const closeEditor = useUIStore((s) => s.closeEditor);
  const config = useResumeStore((s) => s.config);
  const update = useResumeStore((s) => s.update);

  const open = editingModule !== null;
  const schema = editingModule ? getSchema(editingModule) : undefined;

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEditor();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closeEditor]);

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      if (!schema || !config) return;
      const prev = (config as Record<string, unknown>)[schema.dataKey];
      update({ [schema.dataKey]: { ...(prev as Record<string, unknown>), [key]: value } });
    },
    [schema, config, update],
  );

  const handleListChange = useCallback(
    (items: Record<string, unknown>[]) => {
      if (!schema) return;
      update({ [schema.dataKey]: items });
    },
    [schema, update],
  );

  if (!config) return null;

  const data = schema
    ? (config as Record<string, unknown>)[schema.dataKey]
    : undefined;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity print:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeEditor}
        aria-hidden="true"
      />

      {/* 抽屉面板 */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col bg-white shadow-xl transition-transform print:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={schema ? t(`module.${schema.module}`) : ''}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {schema ? t(`module.${schema.module}`) : ''}
          </h2>
          <button
            type="button"
            aria-label={t('common.cancel')}
            onClick={closeEditor}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          {schema && schema.isList ? (
            <ListEditor
              schema={schema}
              items={(data as Record<string, unknown>[]) ?? []}
              onChange={handleListChange}
            />
          ) : schema ? (
            <FormCreator
              fields={schema.fields}
              data={(data as Record<string, unknown>) ?? {}}
              onChange={handleFieldChange}
            />
          ) : null}
        </div>
      </aside>
    </>
  );
}
