import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useResumeStore } from '@/store/resume';
import type { FieldDef } from './schemas';

/** 从 "YYYY.MM" 或 "YYYY" 格式中提取年份 */
function parseYear(v: string): number | null {
  const m = v.match(/^(\d{4})/);
  return m ? Number(m[1]) : null;
}

/** 将 Date 转为 YYYY-MM-DD 字符串 */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 日期选择器（Popover + Calendar） */
function DatePickerField({ field, value, onChange }: FormFieldProps) {
  const { t, i18n } = useTranslation();
  const label = t(field.labelKey);
  const [open, setOpen] = useState(false);

  const str = (value as string) ?? '';
  const date = str ? new Date(str) : undefined;
  const valid = date && !isNaN(date.getTime());

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
          >
            {valid ? date.toLocaleDateString(i18n.language) : <span className="text-muted-foreground">{t('field.selectDate')}</span>}
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={valid ? date : undefined}
            defaultMonth={valid ? date : undefined}
            captionLayout="dropdown"
            startMonth={new Date(1940, 0)}
            endMonth={new Date()}
            onSelect={(d) => {
              if (d) onChange(toDateString(d));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface FormFieldProps {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

/** 带生日约束的时间范围输入 */
function TimeRangeField({ field, value, onChange }: FormFieldProps) {
  const { t } = useTranslation();
  const label = t(field.labelKey);
  const arr = (value as [string?, string?]) ?? ['', ''];
  const birthday = useResumeStore((s) => s.config?.profile?.birthday);
  const [startError, setStartError] = useState('');

  let minYear: number | null = null;
  if (field.minFromBirthday && birthday) {
    const birthYear = new Date(birthday).getFullYear();
    if (!isNaN(birthYear)) minYear = birthYear + field.minFromBirthday;
  }

  const handleStartChange = (raw: string) => {
    if (minYear) {
      const y = parseYear(raw);
      if (y !== null && y < minYear) {
        setStartError(t('field.eduTimeMinError', { year: minYear }));
        return;
      }
    }
    setStartError('');
    onChange([raw, arr[1] ?? '']);
  };

  return (
    <div className="min-w-0 space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          className="min-w-0 flex-1"
          placeholder={t('field.startTime')}
          value={arr[0] ?? ''}
          onChange={(e) => handleStartChange(e.target.value)}
        />
        <span className="shrink-0 text-muted-foreground">-</span>
        <Input
          className="min-w-0 flex-1"
          placeholder={t('field.endTime')}
          value={arr[1] ?? ''}
          onChange={(e) => onChange([arr[0] ?? '', e.target.value])}
        />
      </div>
      {startError && (
        <p className="text-xs text-destructive">{startError}</p>
      )}
    </div>
  );
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

    case 'date':
      return <DatePickerField field={field} value={value} onChange={onChange} />;

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

    case 'time-range':
      return <TimeRangeField field={field} value={value} onChange={onChange} />;

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
