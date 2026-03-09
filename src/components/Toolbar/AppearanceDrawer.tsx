import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Check, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { templateIds } from '@/components/Resume/templates';
import { ResumeView } from '@/components/Resume';
import type { SpacingPreset } from '@/types';

const PRESETS = [
  { key: 'onyxBlack', color: '#18181B', tagColor: '#71717A' },
  { key: 'executiveNavy', color: '#2C3E50', tagColor: '#5B8C5A' },
  { key: 'techBlue', color: '#2563EB', tagColor: '#F59E0B' },
  { key: 'ivyTeal', color: '#115E59', tagColor: '#EA580C' },
  { key: 'charcoalSlate', color: '#334155', tagColor: '#818CF8' },
  { key: 'burgundy', color: '#7F1D1D', tagColor: '#CA8A04' },
  { key: 'mutedPlum', color: '#5B21B6', tagColor: '#14B8A6' },
  { key: 'espressoBrown', color: '#4E342E', tagColor: '#D97706' },
];

const SPACING_PRESETS: SpacingPreset[] = ['compact', 'standard', 'spacious'];

function SpacingPresetGroup({ value, onChange, labels }: {
  value: SpacingPreset;
  onChange: (v: SpacingPreset) => void;
  labels: Record<SpacingPreset, string>;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {SPACING_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className={cn(
            'rounded-md border px-2 py-1.5 text-xs font-medium transition-all',
            value === preset
              ? 'border-gray-800 bg-gray-50 text-gray-900'
              : 'border-gray-200 text-gray-500 hover:border-gray-300',
          )}
        >
          {labels[preset]}
        </button>
      ))}
    </div>
  );
}

export function AppearanceDrawer() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const template = useUIStore((s) => s.template);
  const setTemplate = useUIStore((s) => s.setTemplate);
  const theme = useUIStore((s) => s.theme);
  const updateTheme = useUIStore((s) => s.updateTheme);
  const showIcons = useUIStore((s) => s.showIcons);
  const toggleIcons = useUIStore((s) => s.toggleIcons);
  const layout = useUIStore((s) => s.layout);
  const setPageMargin = useUIStore((s) => s.setPageMargin);
  const setModuleGap = useUIStore((s) => s.setModuleGap);
  const setLineHeight = useUIStore((s) => s.setLineHeight);
  const config = useResumeStore((s) => s.config);

  // drawer 动画完成后才启用缩略图 hover 效果，避免鼠标滑过时误触
  const [drawerReady, setDrawerReady] = useState(false);
  const readyTimer = useRef<ReturnType<typeof setTimeout>>();

  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(readyTimer.current); }, []);

  useEffect(() => {
    if (!open) {
      setDrawerReady(false);
      clearTimeout(readyTimer.current);
      return;
    }
    readyTimer.current = setTimeout(() => setDrawerReady(true), 500);
    return () => { clearTimeout(readyTimer.current); };
  }, [open]);

  const handleTemplateSelect = useCallback((key: string) => {
    setTemplate(key);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setTemplateDialogOpen(false), 350);
  }, [setTemplate]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <Palette className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{t('toolbar.appearanceSettings')}</TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-[380px] flex-col p-0 sm:max-w-[380px]">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>{t('toolbar.appearanceSettings')}</SheetTitle>
            <SheetDescription className="sr-only">{t('toolbar.appearanceSettings')}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-4 py-4">
              {/* 模板选择 — 缩略图打开 Dialog */}
              <section>
                <h3 className="mb-2 text-sm font-medium text-foreground">{t('toolbar.template')}</h3>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setTemplateDialogOpen(true)}
                  className={cn(
                    'w-full cursor-pointer overflow-hidden rounded-xl ring-1 ring-gray-200 transition-all',
                    drawerReady ? 'hover:ring-gray-300 hover:shadow-md' : 'pointer-events-none',
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setTemplateDialogOpen(true);
                    }
                  }}
                >
                  {/* 静态骨架 */}
                  <div className="bg-gray-50/50 px-6 py-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-4 w-10 rounded" style={{ backgroundColor: theme.color }} />
                        <div className="h-2.5 w-20 rounded-full bg-gray-200" />
                      </div>
                      <div className="space-y-2 pt-0.5">
                        <div className="h-2 w-full rounded-full bg-gray-200/70" />
                        <div className="h-2 w-3/4 rounded-full bg-gray-200/70" />
                        <div className="h-2 w-full rounded-full bg-gray-200/70" />
                        <div className="h-2 w-5/6 rounded-full bg-gray-200/70" />
                        <div className="h-2 w-2/3 rounded-full bg-gray-200/70" />
                      </div>
                    </div>
                  </div>
                  {/* 模板信息 */}
                  <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">{t('toolbar.currentTemplate')}</p>
                      <p className="text-sm font-semibold text-foreground">{t(`template.${template}`)}</p>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </section>

              {/* 主题配色 */}
              <section>
                <h3 className="mb-3 text-sm font-medium text-foreground">{t('toolbar.theme')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => {
                    const active = theme.color === preset.color;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => updateTheme({ color: preset.color, tagColor: preset.tagColor })}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all',
                          active
                            ? 'border-gray-800 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300',
                        )}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className={cn(
                          'text-xs font-medium',
                          active ? 'text-gray-900' : 'text-gray-600',
                        )}>
                          {t(`theme.${preset.key}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 图标显示 */}
              <section>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('toolbar.iconMode')}</Label>
                  <Switch
                    checked={showIcons}
                    onCheckedChange={toggleIcons}
                    aria-label={showIcons ? t('toolbar.hideIcons') : t('toolbar.showIcons')}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {showIcons ? t('toolbar.showIcons') : t('toolbar.hideIcons')}
                </p>
              </section>

              {/* 排版 */}
              <section>
                <h3 className="mb-3 text-sm font-medium text-foreground">{t('toolbar.typography')}</h3>
                <div className="space-y-4">
                  {/* 页边距 */}
                  <div>
                    <span className="mb-1.5 block text-xs text-muted-foreground">{t('toolbar.pageMargin')}</span>
                    <SpacingPresetGroup value={layout.pageMargin} onChange={setPageMargin} labels={{ compact: t('toolbar.narrow'), standard: t('toolbar.standard'), spacious: t('toolbar.wide') }} />
                  </div>
                  {/* 模块间距 */}
                  <div>
                    <span className="mb-1.5 block text-xs text-muted-foreground">{t('toolbar.moduleGap')}</span>
                    <SpacingPresetGroup value={layout.moduleGap} onChange={setModuleGap} labels={{ compact: t('toolbar.compact'), standard: t('toolbar.standard'), spacious: t('toolbar.spacious') }} />
                  </div>
                  {/* 行间距 */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('toolbar.lineHeight')}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{layout.lineHeight.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[layout.lineHeight]}
                      min={1.2}
                      max={1.8}
                      step={0.1}
                      onValueChange={([v]) => setLineHeight(v)}
                    />
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 模板选择 Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('toolbar.template')}</DialogTitle>
            <DialogDescription className="sr-only">{t('toolbar.templateDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain pb-1 pl-1 pr-3">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] justify-items-center gap-x-5 gap-y-6 py-2">
              {templateIds.map((key) => {
                const selected = template === key;
                const label = t(`template.${key}`);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={label}
                    onClick={() => handleTemplateSelect(key)}
                    className={cn(
                      'group relative w-full max-w-56 cursor-pointer overflow-hidden rounded-lg bg-white text-left transition-all duration-200',
                      selected
                        ? 'ring-2 ring-resume-primary shadow-md'
                        : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-resume-primary focus-visible:outline-none',
                    )}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-resume-primary text-white shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <div className="relative h-72 w-full overflow-hidden">
                      {config && (
                        <div className="pointer-events-none absolute left-0 top-0 w-[210mm] origin-top-left scale-[0.28]">
                          <ResumeView config={config} templateId={key} disablePagination />
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 px-3 py-2.5 text-center">
                      <p className={cn(
                        'text-sm font-medium',
                        selected ? 'text-resume-primary' : 'text-gray-700',
                      )}>
                        {label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
