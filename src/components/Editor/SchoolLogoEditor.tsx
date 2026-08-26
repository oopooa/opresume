import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, ImageIcon, Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { extractAccentColorFromSrc } from '@/components/Resume/modules/campus-logo';
import type { SchoolLogo } from '@/types/json-resume';

const MAX_SIZE = 1024 * 1024; // 1MB
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg']);
const ACCEPT_ATTR = 'image/png,image/jpeg';

interface SchoolLogoEditorProps {
  logo?: SchoolLogo;
  onChange: (logo: SchoolLogo) => void;
}

/**
 * 校徽编辑器：用户上传校徽图片（data URL 存 localStorage），
 * 浏览器端识别主底色（先排除空白/近白背景），并预览提取结果。
 */
export function SchoolLogoEditor({ logo, onChange }: SchoolLogoEditorProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedColor, setExtractedColor] = useState<string | null>(null);

  const src = logo?.src;
  const hidden = logo?.hidden ?? false;
  const hasSrc = !!src;

  const set = useCallback(
    (partial: Partial<SchoolLogo>) => onChange({ ...logo, ...partial }),
    [logo, onChange],
  );

  /** 上传后：存 data URL + 浏览器端提取主底色 */
  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.has(file.type)) { toast.error(t('field.invalidFileType')); return; }
      if (file.size > MAX_SIZE) { toast.error(t('field.schoolLogoTooLarge')); return; }

      let dataUrl: string;
      try {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      } catch {
        toast.error(t('field.uploadFailed'));
        return;
      }

      set({ src: dataUrl, hidden: false });

      // 提取主底色（排除空白后），供编辑器中预览 + 模板色条适配
      setExtracting(true);
      const c = await extractAccentColorFromSrc(dataUrl);
      setExtracting(false);
      setExtractedColor(c);
    },
    [set, t],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && ACCEPTED_TYPES.has(file.type)) void handleFile(file);
      else if (file) toast.error(t('field.invalidFileType'));
    },
    [handleFile, t],
  );

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full items-center justify-between py-1">
          <span className="text-sm font-medium">{t('field.schoolLogo')}</span>
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', expanded && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <Card className="flex gap-6 p-5">
          {/* 左侧：预览区 */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className={cn(
                'group relative flex h-24 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl transition-all',
                hasSrc
                  ? 'shadow-sm ring-1 ring-black/5'
                  : cn(
                      'border-2 border-dashed',
                      dragging ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-50',
                    ),
              )}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {hasSrc ? (
                <img src={src} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-300">
                  <ImageIcon className="h-8 w-8" />
                  <span className="px-2 text-center text-[11px] text-slate-400">{t('field.uploadSchoolLogo')}</span>
                </div>
              )}
              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                <Upload className="mb-1 h-4 w-4" />
                <span className="text-[11px] font-medium">{hasSrc ? t('field.changeSchoolLogo') : t('field.uploadSchoolLogo')}</span>
              </div>
            </div>
            {hasSrc && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={!hidden}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-slate-600"
                  onClick={() => set({ hidden: !hidden })}
                >
                  {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {t(hidden ? 'common.show' : 'common.hide')}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-red-500"
                  onClick={() => { set({ src: undefined, hidden: false }); setExtractedColor(null); }}
                >
                  <Trash2 className="h-3 w-3" />
                  {t('field.removeSchoolLogo')}
                </button>
              </div>
            )}
          </div>

          {/* 右侧：主色识别结果 */}
          <div className="flex flex-1 flex-col justify-center">
            <Label className="mb-2 block text-xs font-medium text-slate-600">{t('field.schoolLogoExtractedColor')}</Label>
            <div className="flex items-center gap-2.5">
              {extracting ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('field.schoolLogoExtracting')}
                </div>
              ) : extractedColor ? (
                <>
                  <span
                    className="inline-block h-7 w-7 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: extractedColor }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs text-slate-600">{extractedColor}</span>
                  <span className="text-[11px] text-slate-400">{t('field.schoolLogoColorHint')}</span>
                </>
              ) : (
                <span className="text-xs text-slate-400">{t('field.schoolLogoNoColor')}</span>
              )}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ImageIcon className="h-3 w-3 shrink-0" />
              {t('field.schoolLogoHint')}
            </p>
          </div>
        </Card>

        <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="hidden" aria-label={t('field.uploadSchoolLogo')} onChange={onFileChange} />
      </CollapsibleContent>
    </Collapsible>
  );
}