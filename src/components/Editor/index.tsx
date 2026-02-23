import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getSchema } from './schemas';
import { FormCreator } from './FormCreator';
import { ListEditor } from './ListEditor';
import { AvatarEditor } from './AvatarEditor';
import { calculateAge } from '@/components/Resume/shared';

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

  const isProfile = schema?.module === 'profile';

  const birthdayIdx = isProfile && schema ? schema.fields.findIndex((f) => f.key === 'birthday') : -1;
  const beforeFields = isProfile && schema ? schema.fields.slice(0, birthdayIdx + 1) : [];
  const afterFields = isProfile && schema ? schema.fields.slice(birthdayIdx + 1) : [];
  const profileData = isProfile ? ((data as Record<string, unknown>) ?? {}) : {};
  const age = isProfile ? calculateAge(config.profile?.birthday) : null;
  const ageHidden = config.profile?.ageHidden ?? false;

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
              {isProfile && (
                <AvatarEditor
                  avatar={config.avatar}
                  onChange={handleAvatarChange}
                />
              )}
              {isProfile ? (
                <div className="space-y-3">
                  <FormCreator fields={beforeFields} data={profileData} onChange={handleFieldChange} />
                  <div className="space-y-1">
                    <Label>{t('field.ageLabel')}</Label>
                    <div className="relative">
                      <Input
                        disabled
                        className="pr-16"
                        value={age !== null ? t('field.age', { age }) : ''}
                        placeholder={t('field.birthdayHint')}
                      />
                      {age !== null && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={t(ageHidden ? 'common.show' : 'common.hide')}
                          className="absolute inset-y-0 right-2 flex cursor-pointer items-center gap-0.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                          onClick={() => handleFieldChange('ageHidden', !ageHidden)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFieldChange('ageHidden', !ageHidden); }}
                        >
                          {ageHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {t(ageHidden ? 'common.show' : 'common.hide')}
                        </span>
                      )}
                    </div>
                  </div>
                  <FormCreator fields={afterFields} data={profileData} onChange={handleFieldChange} />
                </div>
              ) : (
                <FormCreator
                  fields={schema.fields}
                  data={(data as Record<string, unknown>) ?? {}}
                  onChange={handleFieldChange}
                />
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
