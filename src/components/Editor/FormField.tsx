import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
        <div className="space-y-1">
          <Label>{label}</Label>
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case 'textarea':
    case 'markdown':
      return (
        <div className="space-y-1">
          <Label>{label}</Label>
          <Textarea
            rows={field.type === 'markdown' ? 6 : 3}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.type === 'markdown' && (
            <span className="text-xs text-muted-foreground">Markdown</span>
          )}
        </div>
      );

    case 'number': {
      const num = (value as number) ?? 50;
      return (
        <div className="space-y-1">
          <Label>{label}</Label>
          <div className="flex items-center gap-2">
            <Slider
              className="flex-1"
              min={0}
              max={100}
              step={1}
              value={[num]}
              onValueChange={([v]) => onChange(v)}
            />
            <span className="w-8 text-right text-xs text-muted-foreground">{num}</span>
          </div>
        </div>
      );
    }

    case 'time-range': {
      const arr = (value as [string?, string?]) ?? ['', ''];
      return (
        <div className="min-w-0 space-y-1">
          <Label>{label}</Label>
          <div className="flex items-center gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder={t('field.startTime')}
              value={arr[0] ?? ''}
              onChange={(e) => onChange([e.target.value, arr[1] ?? ''])}
            />
            <span className="shrink-0 text-muted-foreground">-</span>
            <Input
              className="min-w-0 flex-1"
              placeholder={t('field.endTime')}
              value={arr[1] ?? ''}
              onChange={(e) => onChange([arr[0] ?? '', e.target.value])}
            />
          </div>
        </div>
      );
    }

    case 'select':
      return (
        <div className="space-y-1">
          <Label>{label}</Label>
          <Select value={(value as string) ?? ''} onValueChange={(v) => onChange(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    default:
      return null;
  }
}
