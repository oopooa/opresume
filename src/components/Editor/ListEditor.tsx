import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { GripVertical, Trash2, Plus } from 'lucide-react';
import type { ModuleSchema } from './schemas';
import { FormCreator } from './FormCreator';

interface ListEditorProps {
  schema: ModuleSchema;
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
}

function SortableItem({
  item,
  index,
  schema,
  onUpdate,
  onDelete,
}: {
  item: Record<string, unknown>;
  index: number;
  schema: ModuleSchema;
  onUpdate: (index: number, key: string, value: unknown) => void;
  onDelete: (index: number) => void;
}) {
  const { t } = useTranslation();
  const id = item.id as string;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="rounded border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label={t('common.dragSort')} {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={t('common.delete')}
          onClick={() => onDelete(index)}
          className="text-xs text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <FormCreator
        fields={schema.fields}
        data={item}
        onChange={(key, value) => onUpdate(index, key, value)}
      />
    </div>
  );
}

export function ListEditor({ schema, items, onChange }: ListEditorProps) {
  const { t } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
      const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
      onChange(next);
    },
    [items, onChange],
  );

  const handleDelete = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange],
  );

  const handleAdd = () => {
    if (!schema.defaultItem) return;
    onChange([...items, schema.defaultItem()]);
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id as string)} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id as string}
              item={item}
              index={index}
              schema={schema}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
      {schema.defaultItem && (
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-resume-primary hover:text-resume-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('common.add')}
        </button>
      )}
    </div>
  );
}
