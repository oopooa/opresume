import { useTranslation } from 'react-i18next';
import type { FieldDef } from './schemas';

interface FormFieldProps {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FormField({ field, value, onChange }: FormFieldProps) {
  const { t } = useTranslation();
  const label = t(field.labelKey);

  switch (field.type) {
    case 'text':
      return (
        <label className="block">
          <span className="mb-1 block text-xs text-gray-600">{label}</span>
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-resume-primary"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );

    case 'textarea':
    case 'markdown':
      return (
        <label className="block">
          <span className="mb-1 block text-xs text-gray-600">{label}</span>
          <textarea
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-resume-primary"
            rows={field.type === 'markdown' ? 6 : 3}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.type === 'markdown' && (
            <span className="text-xs text-gray-400">Markdown</span>
          )}
        </label>
      );

    case 'number':
      return (
        <label className="block">
          <span className="mb-1 block text-xs text-gray-600">{label}</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              className="flex-1"
              value={(value as number) ?? 50}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            <span className="w-8 text-right text-xs text-gray-500">{(value as number) ?? 50}</span>
          </div>
        </label>
      );

    case 'time-range': {
      const arr = (value as [string?, string?]) ?? ['', ''];
      return (
        <div>
          <span className="mb-1 block text-xs text-gray-600">{label}</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t('field.startTime')}
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-resume-primary"
              value={arr[0] ?? ''}
              onChange={(e) => onChange([e.target.value, arr[1] ?? ''])}
            />
            <span className="text-gray-400">-</span>
            <input
              type="text"
              placeholder={t('field.endTime')}
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-resume-primary"
              value={arr[1] ?? ''}
              onChange={(e) => onChange([arr[0] ?? '', e.target.value])}
            />
          </div>
        </div>
      );
    }

    case 'select':
      return (
        <label className="block">
          <span className="mb-1 block text-xs text-gray-600">{label}</span>
          <select
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-resume-primary"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
        </label>
      );

    default:
      return null;
  }
}
