import type { FieldDef } from './schemas';
import { FormField } from './FormField';

interface FormCreatorProps {
  fields: FieldDef[];
  data: Record<string, unknown>;
  onChange: (updates: Record<string, unknown>) => void;
}

export function FormCreator({ fields, data, onChange }: FormCreatorProps) {
  return (
    <div className="space-y-3">
      {fields.map((field) => {
        let value = data[field.key];

        // readTransform：自定义读取转换（如 roles 数组 → 字符串）
        if (field.readTransform) {
          value = field.readTransform(value);
        }

        // time-range + endKey：从两个独立字段组合成 [start, end] 数组
        if (field.type === 'time-range' && field.endKey) {
          value = [data[field.key] ?? '', data[field.endKey] ?? ''];
        }

        const handleChange = (v: unknown) => {
          // time-range + endKey：一次性更新两个独立字段（避免状态覆盖）
          if (field.type === 'time-range' && field.endKey) {
            const arr = v as [string?, string?];
            onChange({
              [field.key]: arr[0] ?? '',
              [field.endKey]: arr[1] ?? '',
            });
            return;
          }

          // writeTransform：自定义写入转换（如 字符串 → roles 数组）
          const finalValue = field.writeTransform ? field.writeTransform(v) : v;
          onChange({ [field.key]: finalValue });
        };

        return (
          <FormField
            key={field.key}
            field={field}
            value={value}
            onChange={handleChange}
          />
        );
      })}
    </div>
  );
}
