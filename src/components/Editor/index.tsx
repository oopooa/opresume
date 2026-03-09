import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ChevronDown, GripVertical, Pencil } from 'lucide-react';
import {
  DndContext,
  pointerWithin,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import type { Avatar, ResumeConfig, ModuleLayout } from '@/types/resume';
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
import { CustomFieldsEditor } from './CustomFieldsEditor';
import { calculateAge } from '@/components/Resume/shared';
import { getEffectiveLayout, isTwoColumnTemplate } from '@/config/layout';
import { DEFAULT_MODULE_ICONS } from '@/config/icons';
import { IconPicker } from './IconPicker';
import { DynamicIcon } from '@/components/DynamicIcon';

const ALWAYS_VISIBLE = new Set(['profile']);

/* 自定义碰撞检测：先用 closestCenter 匹配具体 item，匹配不到时用 pointerWithin 匹配容器 */
const combinedCollision: CollisionDetection = (args) => {
  const centerHits = closestCenter(args);
  if (centerHits.length > 0) return centerHits;
  return pointerWithin(args);
};

/* ── 可拖拽的模块头部 ── */
function SortableModuleHeader({
  module,
  expanded,
  hidden,
  canHide,
  customTitle,
  moduleIcon,
  onToggleHidden,
  onTitleChange,
  onIconChange,
}: {
  module: string;
  expanded: boolean;
  hidden: boolean;
  canHide: boolean;
  customTitle?: string;
  moduleIcon?: string;
  onToggleHidden: () => void;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: string | undefined) => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(customTitle ?? '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [customTitle]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    onTitleChange(editValue.trim());
  }, [editValue, onTitleChange]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative overflow-hidden flex items-center gap-1 rounded-lg px-3 transition-colors',
        'bg-editor-module',
        expanded && 'bg-editor-module-active',
      )}
      id={`editor-${module}`}
    >
      <span className={cn('absolute left-0 top-0 bottom-0 w-[3px] transition-colors', expanded ? 'bg-resume-primary' : 'bg-transparent')} />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 cursor-grab text-gray-400 hover:text-gray-600"
        aria-label={t('common.dragSort')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-label={t(expanded ? 'common.collapse' : 'common.expand')}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-gray-400 transition-transform duration-200"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4',
              expanded && 'rotate-180',
            )}
          />
        </button>
      </CollapsibleTrigger>
      <IconPicker value={moduleIcon} onChange={onIconChange} />
      {editing ? (
        <div className="flex flex-1 items-center py-1.5">
          <Input
            ref={inputRef}
            value={editValue}
            placeholder={t(`module.${module}`)}
            className="h-8 text-[15px]"
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        </div>
      ) : (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex flex-1 items-center gap-1.5 py-3 text-left text-[15px] font-medium text-gray-700"
            >
              <span className={cn(hidden && 'text-gray-400 line-through')}>
                {customTitle || t(`module.${module}`)}
              </span>
              <span
                role="button"
                tabIndex={-1}
                aria-label={t('common.edit')}
                className="inline-flex shrink-0 text-gray-400 hover:text-gray-600"
                onClick={startEditing}
              >
                <Pencil className="h-3 w-3" />
              </span>
            </button>
          </CollapsibleTrigger>
      )}
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

/* ── 拖拽覆盖层（拖拽时显示的浮动元素） ── */
function DragOverlayContent({ module, customTitle, moduleIcon }: { module: string; customTitle?: string; moduleIcon?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 rounded-lg bg-editor-module-active px-3 py-3 shadow-lg">
      <GripVertical className="h-4 w-4 text-gray-400" />
      <DynamicIcon name={moduleIcon} className="h-4 w-4 text-gray-500" forceShow />
      <span className="text-[15px] font-medium text-gray-700">{customTitle || t(`module.${module}`)}</span>
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

  const handleCustomFieldsChange = useCallback(
    (customFields: NonNullable<typeof config.profile>['customFields']) => {
      update({ profile: { ...config.profile, name: config.profile?.name ?? '', customFields } });
    },
    [config.profile, update],
  );

  return (
    <div className="space-y-3">
      <AvatarEditor avatar={config.avatar} onChange={handleAvatarChange} />
      <FormCreator fields={beforeFields} data={data} onChange={handleFieldChange} />
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>{t('field.ageLabel')}</Label>
          {age !== null && (
            <span
              role="button"
              tabIndex={0}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-accent hover:text-gray-600"
              aria-label={t(ageHidden ? 'common.show' : 'common.hide')}
              onClick={() => handleFieldChange('ageHidden', !ageHidden)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFieldChange('ageHidden', !ageHidden); }}
            >
              {ageHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </span>
          )}
        </div>
        <Input
          disabled
          value={age !== null ? t('field.age', { age }) : ''}
          placeholder={t('field.birthdayHint')}
        />
      </div>
      <FormCreator fields={afterFields} data={data} onChange={handleFieldChange} />

      <CustomFieldsEditor
        fields={config.profile?.customFields ?? []}
        onChange={handleCustomFieldsChange}
      />
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

/* ── 分栏区域标题 ── */
function ColumnLabel({ label, id }: { label: string; id: string }) {
  return (
    <div id={id} className="mb-1 mt-2 flex items-center gap-2 px-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

/* ── 可排序的模块列表（一个栏） ── */
function SortableColumn({
  columnId,
  modules,
  expanded,
  config,
  toggle,
  toggleModuleHidden,
  update,
}: {
  columnId: string;
  modules: string[];
  expanded: string | null;
  config: ResumeConfig;
  toggle: (module: string) => void;
  toggleModuleHidden: (module: string) => void;
  update: (partial: Partial<ResumeConfig>) => void;
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const moduleIconMap = useUIStore((s) => s.moduleIconMap);
  const schemaMap = useMemo(() => {
    const map: Record<string, ModuleSchema> = {};
    for (const s of schemas) map[s.module] = s;
    return map;
  }, []);

  const handleTitleChange = useCallback(
    (module: string, title: string) => {
      const prev = config.titleNameMap ?? {};
      if (title) {
        update({ titleNameMap: { ...prev, [module]: title } });
      } else {
        const { [module]: _, ...rest } = prev;
        update({ titleNameMap: rest });
      }
    },
    [config.titleNameMap, update],
  );

  const handleIconChange = useCallback(
    (module: string, icon: string | undefined) => {
      useUIStore.getState().updateModuleIcon(module, icon);
    },
    [],
  );

  return (
    <SortableContext id={columnId} items={modules} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[40px] space-y-2 rounded-lg transition-colors',
          modules.length === 0 && 'min-h-[64px] border-2 border-dashed border-gray-200 p-3',
          modules.length === 0 && isOver && 'border-editor-drop bg-editor-module',
        )}
      >
        {modules.length === 0 ? (
          <p className="py-2 text-center text-xs text-gray-400">
            {t('toolbar.dropHint')}
          </p>
        ) : (
          modules.map((module) => {
            const schema = schemaMap[module];
            if (!schema) return null;
            const isExpanded = expanded === module;
            const hidden = config.moduleHidden?.[module] === true;
            const canHide = !ALWAYS_VISIBLE.has(module);
            const customTitle = config.titleNameMap?.[module];
            const moduleIcon = moduleIconMap[module] ?? DEFAULT_MODULE_ICONS[module];

            return (
              <Collapsible key={module} open={isExpanded} onOpenChange={() => toggle(module)}>
                <SortableModuleHeader
                  module={module}
                  expanded={isExpanded}
                  hidden={hidden}
                  canHide={canHide}
                  customTitle={customTitle}
                  moduleIcon={moduleIcon}
                  onToggleHidden={() => toggleModuleHidden(module)}
                  onTitleChange={(title) => handleTitleChange(module, title)}
                  onIconChange={(icon) => handleIconChange(module, icon)}
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
          })
        )}
      </div>
    </SortableContext>
  );
}

/* ── 主编辑器 ── */
export function Editor() {
  const { t } = useTranslation();
  const editorOpen = useUIStore((s) => s.editorOpen);
  const activeModule = useUIStore((s) => s.activeModule);
  const closeEditor = useUIStore((s) => s.closeEditor);
  const clearActiveModule = useUIStore((s) => s.clearActiveModule);
  const template = useUIStore((s) => s.template);
  const editorModuleIconMap = useUIStore((s) => s.moduleIconMap);
  const config = useResumeStore((s) => s.config);
  const update = useResumeStore((s) => s.update);

  const twoColumn = isTwoColumnTemplate(template);
  const layout = config ? getEffectiveLayout(template, config.moduleLayout) : { sidebar: [], main: [] };

  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  /* 拖拽过程中的临时布局状态 */
  const [tempLayout, setTempLayout] = useState<ModuleLayout | null>(null);

  /* 实际使用的布局（拖拽中用临时状态，否则用持久化的） */
  const currentLayout = tempLayout ?? layout;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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

  /* 持久化布局到 config */
  const saveLayout = useCallback(
    (newLayout: ModuleLayout) => {
      if (!config) return;
      const prev = config.moduleLayout ?? {};
      update({ moduleLayout: { ...prev, [template]: newLayout } });
    },
    [config, template, update],
  );

  /* 找到模块所在的栏 */
  const findColumn = useCallback(
    (id: string, ly: ModuleLayout): 'sidebar' | 'main' | null => {
      if (ly.sidebar.includes(id)) return 'sidebar';
      if (ly.main.includes(id)) return 'main';
      return null;
    },
    [],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    setExpanded((prev) => (prev === id ? null : prev));
    setTempLayout({ sidebar: [...currentLayout.sidebar], main: [...currentLayout.main] });
  }, [currentLayout]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !tempLayout) return;

      const activeModule = active.id as string;
      const overId = over.id as string;

      const fromCol = findColumn(activeModule, tempLayout);
      if (!fromCol) return;

      /* over 可能是另一个模块，也可能是容器 ID（sidebar / main） */
      let toCol: 'sidebar' | 'main';
      if (overId === 'sidebar' || overId === 'main') {
        toCol = overId;
      } else {
        const col = findColumn(overId, tempLayout);
        if (!col) return;
        toCol = col;
      }

      /* 单栏模板不允许拖到侧栏 */
      if (!twoColumn && toCol === 'sidebar') return;

      if (fromCol === toCol) {
        /* 同栏内排序 */
        const items = [...tempLayout[fromCol]];
        const oldIdx = items.indexOf(activeModule);
        const newIdx = items.indexOf(overId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          setTempLayout({ ...tempLayout, [fromCol]: arrayMove(items, oldIdx, newIdx) });
        }
      } else {
        /* 跨栏移动 */
        const fromItems = tempLayout[fromCol].filter((m) => m !== activeModule);
        const toItems = [...tempLayout[toCol]];
        const overIdx = toItems.indexOf(overId);
        if (overIdx !== -1) {
          toItems.splice(overIdx, 0, activeModule);
        } else {
          toItems.push(activeModule);
        }
        setTempLayout({ ...tempLayout, [fromCol]: fromItems, [toCol]: toItems });
      }
    },
    [tempLayout, findColumn, twoColumn],
  );

  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      setActiveId(null);
      if (tempLayout) {
        saveLayout(tempLayout);
        setTempLayout(null);
      }
    },
    [tempLayout, saveLayout],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setTempLayout(null);
  }, []);

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
      <SheetContent side="right" className="flex w-[380px] flex-col p-0 print:hidden sm:max-w-[380px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>{t('toolbar.editResume')}</SheetTitle>
          <SheetDescription className="sr-only">{t('toolbar.editResume')}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-2 px-4 py-2">
            {/* Profile 固定在最上方，不参与拖拽 */}
            {(() => {
              const schema = schemas.find((s) => s.module === 'profile');
              if (!schema) return null;
              const isExpanded = expanded === 'profile';
              return (
                <Collapsible open={isExpanded} onOpenChange={() => toggle('profile')}>
                  <div
                    className={cn(
                      'relative overflow-hidden flex items-center gap-1 rounded-lg px-3 transition-colors',
                      'bg-editor-module',
                      isExpanded && 'bg-editor-module-active',
                    )}
                    id="editor-profile"
                  >
                    <span className={cn('absolute left-0 top-0 bottom-0 w-[3px] transition-colors', isExpanded ? 'bg-resume-primary' : 'bg-transparent')} />
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        aria-label={t(isExpanded ? 'common.collapse' : 'common.expand')}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-gray-400 transition-transform duration-200"
                      >
                        <ChevronDown className={cn('h-4 w-4', isExpanded && 'rotate-180')} />
                      </button>
                    </CollapsibleTrigger>
                    <DynamicIcon name={DEFAULT_MODULE_ICONS['profile']} className="h-4 w-4 text-gray-500" forceShow />
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-1.5 py-3 text-left text-[15px] font-medium text-gray-700"
                      >
                        <span>{t('module.profile')}</span>
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="pt-3 pb-4">
                      <ProfileSection schema={schema} config={config} update={update} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })()}

            {/* 可拖拽的模块区域 */}
            <DndContext
              sensors={sensors}
              collisionDetection={combinedCollision}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              {twoColumn && (
                <>
                  <ColumnLabel label={t('toolbar.sidebar')} id="column-sidebar" />
                  <SortableColumn
                    columnId="sidebar"
                    modules={currentLayout.sidebar}
                    expanded={expanded}
                    config={config}
                    toggle={toggle}
                    toggleModuleHidden={toggleModuleHidden}
                    update={update}
                  />
                </>
              )}

              <ColumnLabel label={twoColumn ? t('toolbar.mainArea') : ''} id="column-main" />
              <SortableColumn
                columnId="main"
                modules={currentLayout.main}
                expanded={expanded}
                config={config}
                toggle={toggle}
                toggleModuleHidden={toggleModuleHidden}
                update={update}
              />

              <DragOverlay>
                {activeId ? <DragOverlayContent module={activeId} customTitle={config.titleNameMap?.[activeId]} moduleIcon={editorModuleIconMap[activeId] ?? DEFAULT_MODULE_ICONS[activeId]} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
