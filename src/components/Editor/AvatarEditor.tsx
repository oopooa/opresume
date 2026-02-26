import { useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Avatar } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Avatar as AvatarUI, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { avatarStyle } from '@/components/Resume/shared';

const MAX_SIZE = 2 * 1024 * 1024;

const RATIOS = [
  { label: '3:4', w: 3, h: 4 },
  { label: '5:7', w: 5, h: 7 },
  { label: '1:1', w: 1, h: 1 },
] as const;

const SHAPES = [
  { labelKey: 'field.square', value: 0 },
  { labelKey: 'field.circle', value: 999 },
] as const;

interface AvatarEditorProps {
  avatar?: Avatar;
  onChange: (avatar: Avatar) => void;
}

export function AvatarEditor({ avatar, onChange }: AvatarEditorProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const ratioRef = useRef<(typeof RATIOS)[number]>(RATIOS[0]);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const w = avatar?.width ?? 90;
  const h = avatar?.height ?? 90;
  const radius = avatar?.borderRadius ?? 999;
  const hidden = avatar?.hidden ?? false;
  const hasSrc = !!avatar?.src;

  const set = useCallback(
    (partial: Partial<Avatar>) => onChange({ ...avatar, ...partial }),
    [avatar, onChange],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE) { toast.error(t('field.fileTooLarge')); return; }
      try {
        const res = await fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
        const json = await res.json();
        if (json.src) set({ src: `${json.src}?t=${Date.now()}` });
        else if (json.error) toast.error(json.error);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('field.uploadFailed'));
      }
    },
    [set, t],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = '';
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) uploadFile(file);
      else if (file) toast.error(t('field.invalidFileType'));
    },
    [uploadFile, t],
  );

  const isCircle = radius >= 999;
  const activeRatio = isCircle
    ? RATIOS.find((r) => r.label === '1:1')!
    : RATIOS.find((r) => Math.abs(w / h - r.w / r.h) < 0.01);

  // 非圆形时持续记住当前比例，供圆形切回方形时恢复
  if (!isCircle && activeRatio) ratioRef.current = activeRatio;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="mb-4 border-b border-gray-100 pb-4">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between py-1"
        >
          <span className="text-xs font-medium text-gray-700">{t('field.avatar')}</span>
          <div className="flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-accent hover:text-gray-600"
              aria-label={t(hidden ? 'common.show' : 'common.hide')}
              onClick={(e) => { e.stopPropagation(); set({ hidden: !hidden }); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); set({ hidden: !hidden }); } }}
            >
              {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-3">

      {/* 上传区域 */}
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 transition-colors',
          dragging ? 'border-resume-primary bg-resume-primary/5' : 'border-gray-300 bg-gray-50 hover:border-gray-400',
        )}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
      >
        {hasSrc ? (
          <AvatarUI
            className="mb-2 h-auto w-auto rounded-none"
            style={avatarStyle(avatar)}
          >
            <AvatarImage src={avatar!.src} alt="" className="object-cover" />
            <AvatarFallback className="rounded-none text-xs text-muted-foreground">N/A</AvatarFallback>
          </AvatarUI>
        ) : (
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
        )}
        <p className="text-xs text-gray-500">
          {t('field.uploadHint')}
        </p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label={t('field.uploadAvatar')} onChange={onFileChange} />

      {/* 删除按钮 */}
      {hasSrc && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-destructive"
          onClick={() => set({ src: undefined })}
        >
          <Trash2 className="h-3 w-3" />
          {t('field.removeAvatar')}
        </Button>
      )}

      {/* 形状 */}
      <div>
        <Label className="mb-1 block">{t('field.avatarShape')}</Label>
        <ToggleGroup
          type="single"
          size="sm"
          className="justify-start"
          value={String(isCircle ? 999 : 0)}
          onValueChange={(val) => {
            if (!val) return;
            const v = Number(val);
            if (v >= 999) {
              set({ borderRadius: 999, height: w });
            } else {
              const r = ratioRef.current;
              set({ borderRadius: 0, height: Math.round(w * r.h / r.w) });
            }
          }}
        >
          {SHAPES.map((s) => (
            <ToggleGroupItem key={s.value} value={String(s.value)} className="text-xs">
              {t(s.labelKey)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* 比例（圆形时锁定 1:1） */}
      {!isCircle && (
        <div>
          <Label className="mb-1 block">{t('field.aspectRatio')}</Label>
          <ToggleGroup
            type="single"
            size="sm"
            className="justify-start"
            value={activeRatio?.label ?? ''}
            onValueChange={(val) => {
              const r = RATIOS.find((r) => r.label === val);
              if (r) set({ height: Math.round(w * r.h / r.w) });
            }}
          >
            {RATIOS.map((r) => (
              <ToggleGroupItem key={r.label} value={r.label} className="text-xs">
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}
      </CollapsibleContent>
    </Collapsible>
  );
}
