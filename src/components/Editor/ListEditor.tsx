import { useCallback, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { GripVertical, Trash2, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ModuleSchema } from './schemas';
import { FormCreator } from './FormCreator';

interface ListEditorProps {
  schema: ModuleSchema;
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
}

interface DeleteConfirm {
  index: number;
  title: string;
}

function SortableItem({
  item,
  index,
  schema,
  onUpdate,
  onRequestDelete,
}: {
  item: Record<string, unknown>;
  index: number;
  schema: ModuleSchema;
  onUpdate: (index: number, updates: Record<string, unknown>) => void;
  onRequestDelete: (index: number, title: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const id = item['x-op-id'] as string;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = schema.titleKey
    ? (item[schema.titleKey] as string) || `${t(`module.${schema.module}`)} ${index + 1}`
    : `#${index + 1}`;

  const handleChange = useCallback(
    (updates: Record<string, unknown>) => onUpdate(index, updates),
    [index, onUpdate],
  );

  return (
    /*
      外层 motion.div 负责"加入/删除"时的高度+透明度+底部间距过渡：
      - height 0 → auto（spring damping 偏高防止抖动）
      - opacity 0 → 1
      - marginBottom 0 → 8（替代父级 space-y-2 的间距，关键修复点）

      为什么 marginBottom 要参与动画：
      原本父级用 `space-y-2`，靠 CSS `> * + *` 选择器给非首子加 margin-top: 0.5rem。
      A 退出时 height 收缩到 0，B 仍是第二个子（有 mt-2）；A unmount 瞬间 B 升级为
      第一个子失去 mt-2 → 视觉上 B 突然上跳 8px。
      把间距搬到每个 motion.div 自己的 marginBottom 上，让 marginBottom 与 height
      一起 → 0，A 完全占位 0 时 B 已在最终位置，A unmount 不再触发任何同级位移。

      overflow:hidden 是高度动画必需的（auto → 0 期间防止内容溢出可视）；
      layout 不开 —— 拖拽排序的位移由 dnd-kit transform 处理，layout 动画会和它打架。
    */
    <motion.div
      className="overflow-hidden"
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, height: 0, marginBottom: 0 }
      }
      animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
      exit={
        reduceMotion
          ? { opacity: 0, marginBottom: 0, transition: { duration: 0.12 } }
          : {
              opacity: 0,
              height: 0,
              marginBottom: 0,
              transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
            }
      }
      transition={
        reduceMotion
          ? { duration: 0.18 }
          : { type: 'spring', stiffness: 360, damping: 30, mass: 0.7 }
      }
    >
      <Collapsible open={expanded} onOpenChange={setExpanded} asChild>
        <div
          ref={setNodeRef}
          style={style}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          <div className="flex min-w-0 items-center gap-2 overflow-hidden px-3 py-2.5">
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

            <div className="w-0 min-w-0 flex-1 overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="block w-full min-w-0 overflow-hidden text-left text-sm text-gray-700"
                    >
                      <span className="block truncate">{title}</span>
                    </button>
                  </CollapsibleTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-80 break-words">
                  {title}
                </TooltipContent>
              </Tooltip>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-destructive"
              aria-label={t('common.delete')}
              onClick={() => onRequestDelete(index, title)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-600"
                aria-label={expanded ? t('common.collapse') : t('common.expand')}
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    expanded && 'rotate-180',
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="border-t border-gray-100 px-3 pb-3 pt-2">
              <FormCreator
                fields={schema.fields}
                data={item}
                onChange={handleChange}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}

export function ListEditor({ schema, items, onChange }: ListEditorProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((i) => i['x-op-id'] === active.id);
      const newIndex = items.findIndex((i) => i['x-op-id'] === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items, onChange],
  );

  const handleUpdate = useCallback(
    (index: number, updates: Record<string, unknown>) => {
      const next = items.map((item, i) =>
        i === index ? { ...item, ...updates } : item,
      );
      onChange(next);
    },
    [items, onChange],
  );

  const handleRequestDelete = useCallback(
    (index: number, title: string) => {
      setDeleteConfirm({ index, title });
      setDialogOpen(true);
    },
    [],
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirm === null) return;
    onChange(items.filter((_, i) => i !== deleteConfirm.index));
  }, [deleteConfirm, items, onChange]);

  const handleAdd = () => {
    if (!schema.defaultItem) return;
    onChange([...items, schema.defaultItem()]);
  };

  return (
      /*
        外层父级故意不用 `space-y-2`：原本 space-y-* 靠 `> :not([hidden]) ~ :not([hidden])`
        选择器给非首子加 margin-top，会导致 AnimatePresence 退出元素 unmount 时
        后继元素从"非首子"晋级"首子"瞬间失去 mt → 跳 8px。
        现在间距完全由每个 SortableItem 的 motion.div marginBottom 8px 提供，
        最后一项的 marginBottom 同时提供与 add Button 之间的视觉间距。
      */
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i['x-op-id'] as string)}
            strategy={verticalListSortingStrategy}
          >
            {/*
              AnimatePresence 监听 items 数组变化，为退出的 SortableItem 跑 exit 动画；
              initial={false} 让首屏已有的项不再播放 enter 动画（避免每次打开抽屉都"展一遍"）；
              新增/删除时才跑动画。mode 默认 sync，新增项立即出现、被删项同步收起，
              视觉上是"被删的塌下去 + 后继向上递补"。
            */}
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <SortableItem
                  key={item['x-op-id'] as string}
                  item={item}
                  index={index}
                  schema={schema}
                  onUpdate={handleUpdate}
                  onRequestDelete={handleRequestDelete}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
        {schema.defaultItem && (
          <Button
            variant="default"
            className="w-full gap-1.5"
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('common.add')}
          </Button>
        )}

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent className="max-w-[320px]">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <p className="text-sm text-muted-foreground">
                  <Trans
                    i18nKey="common.deleteHint"
                    values={{ name: deleteConfirm?.title ?? '' }}
                    components={{ bold: <span className="font-semibold text-foreground" /> }}
                  />
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirmDelete}>
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
