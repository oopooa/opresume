import { useState, useEffect } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import type { CustomField } from '@/types/resume';
import { useTranslation, Trans } from 'react-i18next';
import { IconPicker } from './IconPicker';
import { useUIStore } from '@/store/ui';

interface CustomFieldsEditorProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

function SortableField({
  field,
  onUpdate,
  onIconChange,
  onDelete,
  onBlur,
  isLastEmpty,
}: {
  field: CustomField;
  onUpdate: (field: 'key' | 'value', val: string) => void;
  onIconChange: (icon: string | undefined) => void;
  onDelete: () => void;
  onBlur: () => void;
  isLastEmpty: boolean;
}) {
  const { t } = useTranslation();
  const fieldIcon = useUIStore((s) => s.customFieldIconMap[field.key]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id!,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 p-1.5">
      <button
        type="button"
        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <IconPicker value={fieldIcon} onChange={onIconChange} disabled={isLastEmpty} />
      <Input
        value={field.key}
        onChange={(e) => onUpdate('key', e.target.value)}
        onBlur={onBlur}
        placeholder={t('field.customFieldKey')}
        className="flex-1 h-8 text-sm"
      />
      <Input
        value={field.value}
        onChange={(e) => onUpdate('value', e.target.value)}
        onBlur={onBlur}
        placeholder={t('field.customFieldValue')}
        className="flex-1 h-8 text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={isLastEmpty}
        className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CustomFieldsEditor({ fields, onChange }: CustomFieldsEditorProps) {
  const { t } = useTranslation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // 确保始终有一个空行
  const ensureGhostRow = () => {
    const hasEmptyField = fields.some((f) => !f.key.trim() && !f.value.trim());
    if (!hasEmptyField) {
      const newField: CustomField = {
        id: `custom-${Date.now()}`,
        key: '',
        value: '',
      };
      onChange([...fields, newField]);
    }
  };

  // 初始化时确保有幽灵行
  useEffect(() => {
    ensureGhostRow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = () => {
    if (deleteId) {
      onChange(fields.filter((f) => f.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleDeleteClick = (field: CustomField) => {
    const isEmpty = !field.key.trim() && !field.value.trim();
    const emptyCount = fields.filter((f) => !f.key.trim() && !f.value.trim()).length;

    // 如果是最后一个空行，不允许删除
    if (isEmpty && emptyCount === 1) {
      return;
    }

    // 如果字段为空，直接删除
    if (isEmpty) {
      onChange(fields.filter((f) => f.id !== field.id));
    } else {
      setDeleteId(field.id!);
    }
  };

  const handleUpdate = (id: string, field: 'key' | 'value', val: string) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, [field]: val } : f)));
  };

  const handleIconChange = (fieldKey: string, icon: string | undefined) => {
    useUIStore.getState().updateCustomFieldIcon(fieldKey, icon);
  };

  const handleBlur = (id: string) => {
    const field = fields.find((f) => f.id === id);
    // 只有当 key 和 value 都有值时才新增幽灵行
    if (field && field.key.trim() && field.value.trim()) {
      ensureGhostRow();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const fieldToDelete = fields.find((f) => f.id === deleteId);

  const emptyCount = fields.filter((f) => !f.key.trim() && !f.value.trim()).length;

  return (
    <div className="space-y-1">
      <div className="border-t border-gray-200 pt-3">
        <Label>{t('field.customFields')}</Label>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id!)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {fields.map((field) => {
              const isEmpty = !field.key.trim() && !field.value.trim();
              const isLastEmpty = isEmpty && emptyCount === 1;

              return (
                <SortableField
                  key={field.id}
                  field={field}
                  onUpdate={(f, val) => handleUpdate(field.id!, f, val)}
                  onIconChange={(icon) => handleIconChange(field.key, icon)}
                  onDelete={() => handleDeleteClick(field)}
                  onBlur={() => handleBlur(field.id!)}
                  isLastEmpty={isLastEmpty}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <p className="text-sm text-muted-foreground">
                <Trans
                  i18nKey="common.deleteHint"
                  values={{ name: fieldToDelete?.key || t('field.customFieldKey') }}
                  components={{ bold: <span className="font-semibold text-foreground" /> }}
                />
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
