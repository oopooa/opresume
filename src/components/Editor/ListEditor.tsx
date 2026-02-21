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
import {
  GripVertical,
  Trash2,
  Plus,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

function ConfirmDialog({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-[320px] rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center gap-2 text-red-500">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-semibold">{t('common.confirmDelete')}</span>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          <Trans
            i18nKey="common.deleteHint"
            values={{ name: title }}
            components={{ bold: <span className="font-semibold text-gray-900" /> }}
          />
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-1.5 text-xs text-white transition-colors hover:bg-red-600"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
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
  onUpdate: (index: number, key: string, value: unknown) => void;
  onRequestDelete: (index: number, title: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const id = item.id as string;
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
    (key: string, value: unknown) => onUpdate(index, key, value),
    [index, onUpdate],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          aria-label={t('common.dragSort')}
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex-1 truncate text-left text-sm text-gray-700"
          onClick={() => setExpanded((v) => !v)}
        >
          {title}
        </button>

        <button
          type="button"
          aria-label={t('common.delete')}
          onClick={() => onRequestDelete(index, title)}
          className="text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          aria-label={expanded ? t('common.collapse') : t('common.expand')}
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2">
          <FormCreator
            fields={schema.fields}
            data={item}
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
}

export function ListEditor({ schema, items, onChange }: ListEditorProps) {
  const { t } = useTranslation();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items, onChange],
  );

  const handleUpdate = useCallback(
    (index: number, key: string, value: unknown) => {
      const next = items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      );
      onChange(next);
    },
    [items, onChange],
  );

  const handleRequestDelete = useCallback(
    (index: number, title: string) => {
      setDeleteConfirm({ index, title });
    },
    [],
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirm === null) return;
    onChange(items.filter((_, i) => i !== deleteConfirm.index));
    setDeleteConfirm(null);
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
          items={items.map((i) => i.id as string)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item, index) => (
            <SortableItem
              key={item.id as string}
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
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-800 py-2.5 text-xs text-white transition-colors hover:bg-gray-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('common.add')}
        </button>
      )}
      {deleteConfirm && (
        <ConfirmDialog
          title={deleteConfirm.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
