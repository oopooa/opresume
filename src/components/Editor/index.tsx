import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Eye, EyeOff, ChevronDown, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { Avatar, ModuleLayout } from '@/types/resume';
import type { JsonResume } from '@/types/json-resume';
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { schemas, type ModuleSchema, getCustomModuleSchema } from './schemas';
import { FormCreator } from './FormCreator';
import { ListEditor } from './ListEditor';
import { AvatarEditor } from './AvatarEditor';
import { CustomFieldsEditor } from './CustomFieldsEditor';
import { calculateAge } from '@/components/Resume/shared';
import { getEffectiveLayout, isTwoColumnTemplate } from '@/config/layout';
import { DEFAULT_MODULE_ICONS, DEFAULT_CUSTOM_MODULE_ICON } from '@/config/icons';
import { isCustomModule } from '@/components/Resume/modules';
import { IconPicker } from './IconPicker';
import { DynamicIcon } from '@/components/DynamicIcon';

const ALWAYS_VISIBLE = new Set(['profile']);
const BASICS_KEYS = new Set(['name', 'label', 'phone', 'email']);
/** 模块头部容器通用样式 */
const editorHeaderRootClass = 'relative flex min-w-0 items-center gap-1 overflow-hidden rounded-lg px-3 transition-colors';
/** 模块标题按钮样式（可点击展开/折叠） */
const editorHeaderTitleButtonClass = 'flex w-0 min-w-0 flex-1 items-center gap-1.5 overflow-hidden py-3 text-left text-[15px] font-medium text-gray-700';
/** 模块标题文本样式（超长截断） */
const editorHeaderTitleTextClass = 'min-w-0 flex-1 truncate';

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
  onDelete,
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
  /** 仅自定义模块有此回调，点击后触发删除确认 */
  onDelete?: () => void;
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
        editorHeaderRootClass,
        'bg-editor-module',
        expanded && 'bg-editor-module-active',
      )}
      id={`editor-${module}`}
    >
      <span className={cn('absolute left-0 top-0 bottom-0 w-[3px] transition-colors', expanded ? 'bg-resume-primary' : 'bg-transparent')} />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 cursor-grab text-gray-400 hover:text-gray-600"
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
      <div className="shrink-0">
        <IconPicker value={moduleIcon} onChange={onIconChange} />
      </div>
      {editing ? (
        <div className="flex w-0 min-w-0 flex-1 items-center py-1.5">
          <Input
            ref={inputRef}
            value={editValue}
            placeholder={customTitle || t(`module.${module}`)}
            className="h-8 w-full min-w-0 text-[15px]"
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
              className={editorHeaderTitleButtonClass}
            >
              <span className={cn(editorHeaderTitleTextClass, hidden && 'text-gray-400 line-through')}>
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
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-gray-400 hover:text-destructive"
          aria-label={t('common.delete')}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
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
  config: JsonResume;
  update: (partial: Partial<JsonResume>) => void;
}) {
  const { t } = useTranslation();

  // 从 JsonResume 构造虚拟 profile data 供 FormCreator 使用
  const data: Record<string, unknown> = {
    name: config.basics?.name ?? '',
    birthday: config['x-op-birthday'] ?? '',
    label: config.basics?.label ?? '',
    phone: config.basics?.phone ?? '',
    email: config.basics?.email ?? '',
    workExpYear: config['x-op-workExpYear'] ?? '',
    workPlace: config.basics?.location?.city ?? '',
  };

  const age = calculateAge(config['x-op-birthday']);
  const ageHidden = config['x-op-ageHidden'] ?? false;
  const birthdayIdx = schema.fields.findIndex((f) => f.key === 'birthday');
  const beforeFields = schema.fields.slice(0, birthdayIdx + 1);
  const afterFields = schema.fields.slice(birthdayIdx + 1);

  // 按 key 分发到 basics 或 x-op-* 字段（合并为一次 update 调用，避免状态覆盖）
  const handleFieldChange = useCallback(
    (updates: Record<string, unknown>) => {
      const basicsUpdates: Record<string, unknown> = {};
      let locationCity: string | undefined;
      const result: Partial<JsonResume> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (BASICS_KEYS.has(key)) {
          basicsUpdates[key] = value;
        } else if (key === 'workPlace') {
          locationCity = value as string;
        } else if (key === 'birthday') {
          result['x-op-birthday'] = value as string;
        } else if (key === 'ageHidden') {
          result['x-op-ageHidden'] = value as boolean;
        } else if (key === 'workExpYear') {
          result['x-op-workExpYear'] = value as string;
        }
      }

      // 合并 basics 字段更新
      if (Object.keys(basicsUpdates).length > 0 || locationCity !== undefined) {
        result.basics = {
          ...config.basics,
          ...basicsUpdates,
          ...(locationCity !== undefined && {
            location: { ...config.basics?.location, city: locationCity },
          }),
        };
      }

      if (Object.keys(result).length > 0) {
        update(result);
      }
    },
    [config.basics, update],
  );

  const handleAvatarChange = useCallback(
    (avatar: Avatar) => update({ 'x-op-avatar': avatar }),
    [update],
  );

  const handleCustomFieldsChange = useCallback(
    (customFields: NonNullable<JsonResume['x-op-customFields']>) => {
      update({ 'x-op-customFields': customFields });
    },
    [update],
  );

  return (
    <div className="space-y-3">
      <AvatarEditor avatar={config['x-op-avatar']} onChange={handleAvatarChange} />
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
              onClick={() => handleFieldChange({ ageHidden: !ageHidden })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFieldChange({ ageHidden: !ageHidden }); }}
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
        fields={config['x-op-customFields'] ?? []}
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
  config: JsonResume;
  update: (partial: Partial<JsonResume>) => void;
}) {
  const rawData = (config as Record<string, unknown>)[schema.dataKey];

  // 所有 hooks 必须在条件分支之前调用，确保调用顺序一致
  const fullArray = useMemo(
    () => (Array.isArray(rawData) ? rawData as Record<string, unknown>[] : []),
    [rawData],
  );

  const handleScalarChange = useCallback(
    (updates: Record<string, unknown>) => {
      // isScalar 模式下只有一个字段，取第一个 value
      const value = Object.values(updates)[0];
      update({ [schema.dataKey]: value } as Partial<JsonResume>);
    },
    [schema.dataKey, update],
  );

  const handleFilteredListChange = useCallback(
    (items: Record<string, unknown>[]) => {
      const others = fullArray.filter((item) => !schema.filter!(item));
      update({ [schema.dataKey]: [...others, ...items] } as Partial<JsonResume>);
    },
    [schema.dataKey, schema.filter, fullArray, update],
  );

  const handleListChange = useCallback(
    (items: Record<string, unknown>[]) => {
      update({ [schema.dataKey]: items } as Partial<JsonResume>);
    },
    [schema.dataKey, update],
  );

  const handleFieldChange = useCallback(
    (updates: Record<string, unknown>) => {
      const prev = (config as Record<string, unknown>)[schema.dataKey];
      update({ [schema.dataKey]: { ...(prev as Record<string, unknown>), ...updates } } as Partial<JsonResume>);
    },
    [schema.dataKey, config, update],
  );

  // isScalar 处理（aboutme）：将标量值包装为对象
  if (schema.isScalar) {
    const scalarData: Record<string, unknown> = {};
    if (schema.fields.length > 0) {
      scalarData[schema.fields[0].key] = rawData ?? '';
    }
    return (
      <FormCreator fields={schema.fields} data={scalarData} onChange={handleScalarChange} />
    );
  }

  // 列表且有 filter（projectList / workList 共享 projects 数组）
  if (schema.isList && schema.filter) {
    const filtered = fullArray.filter(schema.filter);
    return (
      <ListEditor schema={schema} items={filtered} onChange={handleFilteredListChange} />
    );
  }

  // 普通列表
  if (schema.isList) {
    return (
      <ListEditor
        schema={schema}
        items={fullArray}
        onChange={handleListChange}
      />
    );
  }

  // 普通对象
  return (
    <FormCreator
      fields={schema.fields}
      data={(rawData as Record<string, unknown>) ?? {}}
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

/* ── 自定义模块编辑内容 ── */
function CustomModuleContent({
  moduleId,
  config,
  update,
}: {
  moduleId: string;
  config: JsonResume;
  update: (partial: Partial<JsonResume>) => void;
}) {
  const schema = useMemo(() => getCustomModuleSchema(moduleId), [moduleId]);
  const customModule = config['x-op-customModules']?.find((m) => m.id === moduleId);
  const scalarData: Record<string, unknown> = {
    contentHtml: customModule?.contentHtml ?? '',
  };

  const handleChange = useCallback(
    (updates: Record<string, unknown>) => {
      const modules = config['x-op-customModules'] ?? [];
      const updated = modules.map((m) =>
        m.id === moduleId ? { ...m, ...updates } : m,
      );
      update({ 'x-op-customModules': updated });
    },
    [moduleId, config, update],
  );

  return (
    <FormCreator fields={schema.fields} data={scalarData} onChange={handleChange} />
  );
}

/* ── 可排序的模块列表（一个栏） ── */
function SortableColumn({
  columnId,
  modules,
  expanded,
  config,
  customModuleMap,
  toggle,
  toggleModuleHidden,
  update,
  onRequestDeleteCustomModule,
}: {
  columnId: string;
  modules: string[];
  expanded: string | null;
  config: JsonResume;
  /** 自定义模块 ID → 数据的预建映射，避免重复 .find() */
  customModuleMap: Map<string, import('@/types/json-resume').CustomModule>;
  toggle: (module: string) => void;
  toggleModuleHidden: (module: string) => void;
  update: (partial: Partial<JsonResume>) => void;
  /** 请求删除自定义模块（由 Editor 统一管理弹框） */
  onRequestDeleteCustomModule: (moduleId: string) => void;
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
      /* 自定义模块的标题同时更新 customModules 数组中的 title */
      if (isCustomModule(module)) {
        const modules = config['x-op-customModules'] ?? [];
        const updated = modules.map((m) =>
          m.id === module ? { ...m, title: title || t('module.customModule') } : m,
        );
        update({ 'x-op-customModules': updated });
        return;
      }
      const prev = config['x-op-titleNameMap'] ?? {};
      if (title) {
        update({ 'x-op-titleNameMap': { ...prev, [module]: title } } as Partial<JsonResume>);
      } else {
        const { [module]: _, ...rest } = prev;
        update({ 'x-op-titleNameMap': rest } as Partial<JsonResume>);
      }
    },
    [config, update, t],
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
            const isCustom = isCustomModule(module);
            const schema = isCustom ? getCustomModuleSchema(module) : schemaMap[module];
            if (!schema) return null;
            const isExpanded = expanded === module;
            const hidden = config['x-op-moduleHidden']?.[module] === true;
            const canHide = !ALWAYS_VISIBLE.has(module);
            const customTitle = isCustom
              ? (customModuleMap.get(module)?.title ?? t('module.customModule'))
              : config['x-op-titleNameMap']?.[module];
            const moduleIcon = moduleIconMap[module] ?? (isCustom ? DEFAULT_CUSTOM_MODULE_ICON : DEFAULT_MODULE_ICONS[module]);

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
                  onDelete={isCustom ? () => onRequestDeleteCustomModule(module) : undefined}
                />
                <CollapsibleContent>
                  <div className="pt-3 pb-4">
                    {isCustom ? (
                      <CustomModuleContent moduleId={module} config={config} update={update} />
                    ) : module === 'profile' ? (
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
  const layout = config ? getEffectiveLayout(template, config['x-op-moduleLayout']) : { sidebar: [], main: [] };

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
      const prev = config['x-op-moduleHidden'] ?? {};
      update({ 'x-op-moduleHidden': { ...prev, [module]: !prev[module] } } as Partial<JsonResume>);
    },
    [config, update],
  );

  /* 持久化布局到 config */
  const saveLayout = useCallback(
    (newLayout: ModuleLayout) => {
      if (!config) return;
      const prev = config['x-op-moduleLayout'] ?? {};
      update({ 'x-op-moduleLayout': { ...prev, [template]: newLayout } } as Partial<JsonResume>);
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

  /* 添加自定义模块 */
  const addCustomModule = useCallback(() => {
    if (!config) return;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newModule = { id, title: t('module.customModule'), contentHtml: '' };
    const modules = config['x-op-customModules'] ?? [];

    /* 将新模块追加到当前布局的 main 栏末尾 */
    const prevLayoutMap = config['x-op-moduleLayout'] ?? {};
    const curLayout = getEffectiveLayout(template, prevLayoutMap);
    const newLayout: ModuleLayout = { sidebar: [...curLayout.sidebar], main: [...curLayout.main, id] };

    /* 合并为一次 update 调用，避免浅合并覆盖 */
    update({
      'x-op-customModules': [...modules, newModule],
      'x-op-moduleLayout': { ...prevLayoutMap, [template]: newLayout },
    } as Partial<JsonResume>);

    /* 自动展开新模块 */
    setExpanded(id);
  }, [config, template, update, t]);

  /* 删除自定义模块 */
  const deleteCustomModule = useCallback(
    (moduleId: string) => {
      if (!config) return;
      /* 从 customModules 数组移除 */
      const modules = (config['x-op-customModules'] ?? []).filter((m) => m.id !== moduleId);
      /* 从所有模板的布局中移除 */
      const layoutMap = config['x-op-moduleLayout'] ?? {};
      const cleanedLayout: Record<string, ModuleLayout> = {};
      for (const [tmpl, ly] of Object.entries(layoutMap)) {
        cleanedLayout[tmpl] = {
          sidebar: ly.sidebar.filter((m) => m !== moduleId),
          main: ly.main.filter((m) => m !== moduleId),
        };
      }
      /* 清理标题和隐藏状态 */
      const titleMap = { ...config['x-op-titleNameMap'] };
      delete titleMap[moduleId];
      const hiddenMap = { ...config['x-op-moduleHidden'] };
      delete hiddenMap[moduleId];

      update({
        'x-op-customModules': modules,
        'x-op-moduleLayout': cleanedLayout,
        'x-op-titleNameMap': titleMap,
        'x-op-moduleHidden': hiddenMap,
      });

      if (expanded === moduleId) setExpanded(null);
    },
    [config, update, expanded],
  );

  /* 自定义模块 ID → 数据的预建映射，供子组件高效查找 */
  const customModuleMap = useMemo(() => {
    const map = new Map<string, import('@/types/json-resume').CustomModule>();
    for (const m of config?.['x-op-customModules'] ?? []) {
      map.set(m.id, m);
    }
    return map;
  }, [config?.['x-op-customModules']]);

  /* 删除确认弹框状态（提升到 Editor 层级，避免双栏重复实例） */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleRequestDeleteCustomModule = useCallback((moduleId: string) => {
    setPendingDeleteId(moduleId);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteCustomModule(pendingDeleteId);
    }
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  }, [pendingDeleteId, deleteCustomModule]);

  const pendingDeleteTitle = pendingDeleteId
    ? (customModuleMap.get(pendingDeleteId)?.title ?? t('module.customModule'))
    : '';

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
      <SheetContent side="right" className="flex w-[380px] flex-col overflow-x-hidden p-0 print:hidden sm:max-w-[380px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>{t('toolbar.editResume')}</SheetTitle>
          <SheetDescription className="sr-only">{t('toolbar.editResume')}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-w-0 [&>div[data-radix-scroll-area-viewport]]:!overflow-x-hidden">
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
                      editorHeaderRootClass,
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
                    <DynamicIcon name={DEFAULT_MODULE_ICONS['profile']} className="h-4 w-4 shrink-0 text-gray-500" forceShow />
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className={editorHeaderTitleButtonClass}
                      >
                        <span className={editorHeaderTitleTextClass}>{t('module.profile')}</span>
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
                    customModuleMap={customModuleMap}
                    toggle={toggle}
                    toggleModuleHidden={toggleModuleHidden}
                    update={update}
                    onRequestDeleteCustomModule={handleRequestDeleteCustomModule}
                  />
                </>
              )}

              <ColumnLabel label={twoColumn ? t('toolbar.mainArea') : ''} id="column-main" />
              <SortableColumn
                columnId="main"
                modules={currentLayout.main}
                expanded={expanded}
                config={config}
                customModuleMap={customModuleMap}
                toggle={toggle}
                toggleModuleHidden={toggleModuleHidden}
                update={update}
                onRequestDeleteCustomModule={handleRequestDeleteCustomModule}
              />

              <DragOverlay>
                {activeId ? (
                  <DragOverlayContent
                    module={activeId}
                    customTitle={
                      config['x-op-titleNameMap']?.[activeId]
                      ?? customModuleMap.get(activeId)?.title
                    }
                    moduleIcon={
                      editorModuleIconMap[activeId]
                      ?? (isCustomModule(activeId) ? DEFAULT_CUSTOM_MODULE_ICON : DEFAULT_MODULE_ICONS[activeId])
                    }
                  />
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* 添加自定义模块按钮 */}
            <button
              type="button"
              className={cn(
                editorHeaderRootClass,
                'mt-1 w-full justify-center border border-dashed border-gray-300 text-gray-500 hover:border-resume-primary hover:text-resume-primary',
              )}
              onClick={addCustomModule}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="py-3 text-[15px] font-medium">{t('module.addCustomModule')}</span>
            </button>
          </div>
        </ScrollArea>

        {/* 自定义模块删除确认弹框（统一在 Editor 层级管理，避免双栏重复实例） */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setPendingDeleteId(null);
          }}
        >
          <AlertDialogContent className="max-w-[320px]">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <p className="text-sm text-muted-foreground">
                  <Trans
                    i18nKey="common.deleteHint"
                    values={{ name: pendingDeleteTitle }}
                    components={{ bold: <span className="font-semibold text-foreground" /> }}
                  />
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleConfirmDelete}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
