import { useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, EyeOff, Eye, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Avatar } from '@/types/resume';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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

function PresetBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded px-2.5 py-1 text-xs',
        active ? 'bg-resume-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
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
    <div className="mb-4 border-b border-gray-100 pb-4">
      {/* 折叠头 */}
      <button
        type="button"
        className="flex w-full items-center justify-between py-1"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-xs font-medium text-gray-700">{t('field.avatar')}</span>
        <div className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            onClick={(e) => { e.stopPropagation(); set({ hidden: !hidden }); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); set({ hidden: !hidden }); } }}
          >
            {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {t(hidden ? 'field.showAvatar' : 'field.hideAvatar')}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expanded && (
      <div className="mt-3 space-y-3">

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
          <img
            src={avatar!.src}
            alt=""
            className="mb-2 object-cover"
            style={{ width: w, height: h, borderRadius: Math.min(radius, Math.min(w, h) / 2) }}
          />
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
        <div className="flex flex-wrap gap-1">
          {RATIOS.map((r) => (
            <PresetBtn
              key={r.label}
              active={activeRatio === r}
              onClick={() => set({ height: Math.round(w * r.h / r.w) })}
            >
              {r.label}
            </PresetBtn>
          ))}
        </div>
      </div>

      {/* 圆角 */}
      <div>
        <Label className="mb-1 block">{t('field.borderRadius')}</Label>
        <div className="flex flex-wrap gap-1">
          {RADIUS_PRESETS.map((p) => (
            <PresetBtn
              key={p.value}
              active={radius === p.value}
              onClick={() => set({ borderRadius: p.value })}
            >
              {t(p.labelKey)}
            </PresetBtn>
          ))}
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
