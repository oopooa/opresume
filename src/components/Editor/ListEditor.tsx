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
    <Collapsible open={expanded} onOpenChange={setExpanded} asChild>
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
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
              className="flex-1 truncate text-left text-sm text-gray-700"
            >
              {title}
            </button>
          </CollapsibleTrigger>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            aria-label={t('common.delete')}
            onClick={() => onRequestDelete(index, title)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
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
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i['x-op-id'] as string)}
          strategy={verticalListSortingStrategy}
        >
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
