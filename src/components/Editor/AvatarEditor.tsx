import { useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Avatar } from '@/types/resume';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Avatar as AvatarUI, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { avatarStyle } from '@/components/Resume/shared';

const MAX_SIZE = 2 * 1024 * 1024;

const RATIOS = [
  { label: '1:1', w: 1, h: 1 },
  { label: '4:3', w: 4, h: 3 },
  { label: '3:4', w: 3, h: 4 },
] as const;

const RADIUS_PRESETS = [
  { labelKey: 'field.radiusNone', value: 0 },
  { labelKey: 'field.radiusMedium', value: 8 },
  { labelKey: 'field.radiusCircle', value: 999 },
] as const;

interface AvatarEditorProps {
  avatar?: Avatar;
  onChange: (avatar: Avatar) => void;
}

export function AvatarEditor({ avatar, onChange }: AvatarEditorProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
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

  const activeRatio = RATIOS.find((r) => Math.abs(w / h - r.w / r.h) < 0.01);

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

      {/* 在线链接 */}
      <div className="space-y-1">
        <Label>{t('field.avatarLink')}</Label>
        <Input
          placeholder="https://example.com/avatar.png"
          value={avatar?.src?.startsWith('/') ? '' : avatar?.src ?? ''}
          onChange={(e) => set({ src: e.target.value || undefined })}
        />
      </div>

      {/* 尺寸 */}
      <div>
        <Label className="mb-1 block">{t('field.avatarSize')}</Label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">W</span>
            <Input
              type="number"
              min={20}
              max={200}
              className="w-16 text-center"
              value={w}
              onChange={(e) => set({ width: Number(e.target.value) || 90 })}
            />
          </label>
          <span className="text-xs text-muted-foreground">×</span>
          <label className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">H</span>
            <Input
              type="number"
              min={20}
              max={200}
              className="w-16 text-center"
              value={h}
              onChange={(e) => set({ height: Number(e.target.value) || 90 })}
            />
          </label>
        </div>
      </div>

      {/* 宽高比 */}
      <div>
        <Label className="mb-1 block">{t('field.aspectRatio')}</Label>
        <ToggleGroup
          type="single"
          size="sm"
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

      {/* 圆角 */}
      <div>
        <Label className="mb-1 block">{t('field.borderRadius')}</Label>
        <ToggleGroup
          type="single"
          size="sm"
          value={String(radius)}
          onValueChange={(val) => {
            if (val) set({ borderRadius: Number(val) });
          }}
        >
          {RADIUS_PRESETS.map((p) => (
            <ToggleGroupItem key={p.value} value={String(p.value)} className="text-xs">
              {t(p.labelKey)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
