import { useRef, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Eye, EyeOff, ChevronDown, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Avatar } from '@/types/resume';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Card } from '@/components/ui/card';
import { useUIStore } from '@/store/ui';

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg']);
const ACCEPT_ATTR = 'image/png,image/jpeg';

const PREVIEW_BASE = 120;

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
  const expanded = useUIStore((s) => s.avatarEditorOpen);
  const setExpanded = useCallback((open: boolean) => useUIStore.setState({ avatarEditorOpen: open }), []);

  const w = avatar?.width ?? 90;
  const h = avatar?.height ?? 90;
  const radius = avatar?.borderRadius ?? 999;
  const hidden = avatar?.hidden ?? false;
  const hasSrc = !!avatar?.src;

  const previewH = Math.round(PREVIEW_BASE * h / w);

  const set = useCallback(
    (partial: Partial<Avatar>) => onChange({ ...avatar, ...partial }),
    [avatar, onChange],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.has(file.type)) { toast.error(t('field.invalidFileType')); return; }
      if (file.size > MAX_SIZE) { toast.error(t('field.fileTooLarge')); return; }

      // 生产环境：转为 base64 data URL，随 config 存入 localStorage
      if (!import.meta.env.DEV) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          set({ src: dataUrl });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t('field.uploadFailed'));
        }
        return;
      }

      // 开发环境：上传到 Vite API 中间件，保存到 data/ 目录
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
      if (file && ACCEPTED_TYPES.has(file.type)) uploadFile(file);
      else if (file) toast.error(t('field.invalidFileType'));
    },
    [uploadFile, t],
  );

  const isCircle = radius >= 999;
  const activeRatio = RATIOS.find((r) => Math.abs(w / h - r.w / r.h) < 0.01);

  // 非圆形时持续记住当前比例，供圆形切回方形时恢复
  useEffect(() => {
    if (!isCircle && activeRatio) ratioRef.current = activeRatio;
  }, [isCircle, activeRatio]);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full items-center justify-between py-1">
          <span className="text-sm font-medium">{t('field.avatar')}</span>
          <div className="flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-accent hover:text-gray-600"
              aria-label={t(hidden ? 'common.show' : 'common.hide')}
              onClick={(e) => { e.stopPropagation(); set({ hidden: !hidden }); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); set({ hidden: !hidden }); } }}
            >
              {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', expanded && 'rotate-180')} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <Card className="flex gap-6 p-5">
          {/* 左侧：预览区 */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className={cn(
                'group relative flex cursor-pointer items-center justify-center overflow-hidden transition-all',
                hasSrc
                  ? 'shadow-sm ring-1 ring-black/5'
                  : cn(
                      'border-2 border-dashed',
                      dragging ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-50',
                    ),
              )}
              style={{
                width: PREVIEW_BASE,
                height: previewH,
                borderRadius: isCircle ? '50%' : '8px',
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {hasSrc ? (
                <img src={avatar!.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-300">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-[11px] text-slate-400">{t('field.uploadAvatar')}</span>
                </div>
              )}
              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                <Upload className="mb-1 h-4 w-4" />
                <span className="text-[11px] font-medium">{hasSrc ? t('field.changeAvatar') : t('field.uploadAvatar')}</span>
              </div>
            </div>
            {hasSrc && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-red-500"
                onClick={() => set({ src: undefined })}
              >
                <Trash2 className="h-3 w-3" />
                {t('field.removeAvatar')}
              </button>
            )}
          </div>

          {/* 右侧：设置区 */}
          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-xs font-medium text-slate-600">{t('field.avatarShape')}</Label>
                <ToggleGroup
                  type="single"
                  className="inline-flex gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-1"
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
                    <ToggleGroupItem
                      key={s.value}
                      value={String(s.value)}
                      className="h-7 rounded-md px-4 text-xs font-medium text-slate-500 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm"
                    >
                      {t(s.labelKey)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-medium text-slate-600">{t('field.aspectRatio')}</Label>
                <ToggleGroup
                  type="single"
                  className="inline-flex gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-1"
                  value={activeRatio?.label ?? ''}
                  onValueChange={(val) => {
                    const r = RATIOS.find((r) => r.label === val);
                    if (r) set({ height: Math.round(w * r.h / r.w) });
                  }}
                >
                  {RATIOS.map((r) => (
                    <ToggleGroupItem
                      key={r.label}
                      value={r.label}
                      className="h-7 rounded-md px-3.5 text-xs font-medium text-slate-500 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm"
                    >
                      {r.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ImageIcon className="h-3 w-3 shrink-0" />
              {t('field.avatarFormatHint')}
            </p>
          </div>
        </Card>

        <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="hidden" aria-label={t('field.uploadAvatar')} onChange={onFileChange} />
      </CollapsibleContent>
    </Collapsible>
  );
}
