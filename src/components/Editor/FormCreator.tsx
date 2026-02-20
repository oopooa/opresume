import type { FieldDef } from './schemas';
import { FormField } from './FormField';

interface FormCreatorProps {
  fields: FieldDef[];
  data: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function FormCreator({ fields, data, onChange }: FormCreatorProps) {
  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <FormField
          key={field.key}
          field={field}
          value={data[field.key]}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
    </div>
  );
}
