import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import type { Avatar } from '@/types/resume';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { getSchema } from './schemas';
import { FormCreator } from './FormCreator';
import { ListEditor } from './ListEditor';
import { AvatarEditor } from './AvatarEditor';

export function Editor() {
  const { t } = useTranslation();
  const editingModule = useUIStore((s) => s.editingModule);
  const closeEditor = useUIStore((s) => s.closeEditor);
  const config = useResumeStore((s) => s.config);
  const update = useResumeStore((s) => s.update);

  const open = editingModule !== null;
  const schema = editingModule ? getSchema(editingModule) : undefined;

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

  const handleAvatarChange = useCallback(
    (avatar: Avatar) => update({ avatar }),
    [update],
  );

  if (!config) return null;

  const data = schema
    ? (config as Record<string, unknown>)[schema.dataKey]
    : undefined;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) closeEditor(); }}>
      <SheetContent side="right" hideClose className="flex w-[380px] flex-col p-0 print:hidden sm:max-w-[380px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>
            {schema ? t(`module.${schema.module}`) : ''}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {schema ? t(`module.${schema.module}`) : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {schema && schema.isList ? (
            <ListEditor
              schema={schema}
              items={(data as Record<string, unknown>[]) ?? []}
              onChange={handleListChange}
            />
          ) : schema ? (
            <>
              {schema.module === 'profile' && (
                <AvatarEditor
                  avatar={config.avatar}
                  onChange={handleAvatarChange}
                />
              )}
              <FormCreator
                fields={schema.fields}
                data={(data as Record<string, unknown>) ?? {}}
                onChange={handleFieldChange}
              />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
