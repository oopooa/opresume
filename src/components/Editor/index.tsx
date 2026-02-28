import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import type { Avatar, ResumeConfig } from '@/types/resume';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { schemas, type ModuleSchema } from './schemas';
import { FormCreator } from './FormCreator';
import { ListEditor } from './ListEditor';
import { AvatarEditor } from './AvatarEditor';
import { calculateAge } from '@/components/Resume/shared';

/* 不可隐藏的模块 */
const ALWAYS_VISIBLE = new Set(['profile']);

/* ── 折叠区块头部 ── */
function SectionHeader({
  module,
  expanded,
  hidden,
  canHide,
  onToggleHidden,
}: {
  module: string;
  expanded: boolean;
  hidden: boolean;
  canHide: boolean;
  onToggleHidden: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg px-3 transition-colors',
        'bg-sky-50/80',
        expanded && 'bg-sky-100/90',
      )}
      id={`editor-${module}`}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex flex-1 items-center gap-1.5 py-3 text-left text-[15px] font-medium text-gray-700"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
          <span className={cn(hidden && 'text-gray-400 line-through')}>
            {t(`module.${module}`)}
          </span>
        </button>
      </CollapsibleTrigger>
      {canHide && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-600"
          aria-label={t(hidden ? 'common.show' : 'common.hide')}
          onClick={onToggleHidden}
        >
          {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}

/* ── Profile 模块（特殊处理：头像 + 年龄） ── */
function ProfileSection({
  schema,
  config,
  update,
}: {
  schema: ModuleSchema;
  config: ResumeConfig;
  update: (partial: Partial<ResumeConfig>) => void;
}) {
  const { t } = useTranslation();
  const data = (config.profile ?? {}) as Record<string, unknown>;
  const age = calculateAge(config.profile?.birthday);
  const ageHidden = config.profile?.ageHidden ?? false;

  const birthdayIdx = schema.fields.findIndex((f) => f.key === 'birthday');
  const beforeFields = schema.fields.slice(0, birthdayIdx + 1);
  const afterFields = schema.fields.slice(birthdayIdx + 1);

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      update({ profile: { ...config.profile, name: config.profile?.name ?? '', [key]: value } });
    },
    [config.profile, update],
  );

  const handleAvatarChange = useCallback(
    (avatar: Avatar) => update({ avatar }),
    [update],
  );

  return (
    <div className="space-y-3">
      <AvatarEditor avatar={config.avatar} onChange={handleAvatarChange} />
      <FormCreator fields={beforeFields} data={data} onChange={handleFieldChange} />
      <div className="space-y-1">
        <Label>{t('field.ageLabel')}</Label>
        <div className="relative">
          <Input
            disabled
            className="pr-14"
            value={age !== null ? t('field.age', { age }) : ''}
            placeholder={t('field.birthdayHint')}
          />
          {age !== null && (
            <div className="absolute inset-y-0 right-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/60 hover:text-muted-foreground"
                aria-label={t(ageHidden ? 'common.show' : 'common.hide')}
                onClick={() => handleFieldChange('ageHidden', !ageHidden)}
              >
                {ageHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </div>
      <FormCreator fields={afterFields} data={data} onChange={handleFieldChange} />
    </div>
  );
}

/* ── 通用模块内容 ── */
function ModuleContent({
  schema,
  config,
  update,
}: {
  schema: ModuleSchema;
  config: ResumeConfig;
  update: (partial: Partial<ResumeConfig>) => void;
}) {
  const data = (config as Record<string, unknown>)[schema.dataKey];

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      const prev = (config as Record<string, unknown>)[schema.dataKey];
      update({ [schema.dataKey]: { ...(prev as Record<string, unknown>), [key]: value } });
    },
    [schema.dataKey, config, update],
  );

  const handleListChange = useCallback(
    (items: Record<string, unknown>[]) => {
      update({ [schema.dataKey]: items });
    },
    [schema.dataKey, update],
  );

  if (schema.isList) {
    return (
      <ListEditor
        schema={schema}
        items={(data as Record<string, unknown>[]) ?? []}
        onChange={handleListChange}
      />
    );
  }

  return (
    <FormCreator
      fields={schema.fields}
      data={(data as Record<string, unknown>) ?? {}}
      onChange={handleFieldChange}
    />
  );
}

/* ── 主编辑器 ── */
export function Editor() {
  const { t } = useTranslation();
  const editorOpen = useUIStore((s) => s.editorOpen);
  const activeModule = useUIStore((s) => s.activeModule);
  const closeEditor = useUIStore((s) => s.closeEditor);
  const clearActiveModule = useUIStore((s) => s.clearActiveModule);
  const config = useResumeStore((s) => s.config);
  const update = useResumeStore((s) => s.update);

  /* 手风琴：同时只展开一个模块 */
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = useCallback((module: string) => {
    setExpanded((prev) => (prev === module ? null : module));
  }, []);

  const toggleModuleHidden = useCallback(
    (module: string) => {
      if (!config) return;
      const prev = config.moduleHidden ?? {};
      update({ moduleHidden: { ...prev, [module]: !prev[module] } });
    },
    [config, update],
  );

  /* 点击简历区域时，展开对应模块并滚动到位 */
  useEffect(() => {
    if (!activeModule || !editorOpen) return;
    setExpanded(activeModule);
    const timer = setTimeout(() => {
      const el = document.getElementById(`editor-${activeModule}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      clearActiveModule();
    }, 150);
    return () => clearTimeout(timer);
  }, [activeModule, editorOpen, clearActiveModule]);

  if (!config) return null;

  return (
    <Sheet open={editorOpen} onOpenChange={(isOpen) => { if (!isOpen) closeEditor(); }}>
      <SheetContent side="right" hideClose className="flex w-[380px] flex-col p-0 print:hidden sm:max-w-[380px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>{t('toolbar.editResume')}</SheetTitle>
          <SheetDescription className="sr-only">{t('toolbar.editResume')}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-4 px-4 py-2">
            {schemas.map((schema) => {
              const module = schema.module;
              const isExpanded = expanded === module;
              const hidden = config.moduleHidden?.[module] === true;
              const canHide = !ALWAYS_VISIBLE.has(module);

              return (
                <Collapsible
                  key={module}
                  open={isExpanded}
                  onOpenChange={() => toggle(module)}
                >
                  <SectionHeader
                    module={module}
                    expanded={isExpanded}
                    hidden={hidden}
                    canHide={canHide}
                    onToggleHidden={() => toggleModuleHidden(module)}
                  />
                  <CollapsibleContent>
                    <div className="pt-3 pb-4">
                      {module === 'profile' ? (
                        <ProfileSection schema={schema} config={config} update={update} />
                      ) : (
                        <ModuleContent schema={schema} config={config} update={update} />
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
