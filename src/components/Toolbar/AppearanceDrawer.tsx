import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const config = useResumeStore((s) => s.config);

  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(closeTimer.current), []);

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
                  className="group relative block w-full max-w-40 cursor-pointer overflow-hidden rounded-lg ring-1 ring-gray-200 transition-all hover:ring-gray-300 hover:shadow-md text-left"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setTemplateDialogOpen(true);
                    }
                  }}
                >
                  <div className="relative h-52 w-full overflow-hidden bg-white">
                    {config && (
                      <div className="pointer-events-none absolute left-0 top-0 w-[210mm] origin-top-left scale-[0.20]">
                        <ResumeView config={config} templateId={template} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                      <span className="text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {t('toolbar.changeTemplate')}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 bg-white px-3 py-2 text-center">
                    <span className="text-xs font-medium text-gray-600">{t(`template.${template}`)}</span>
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
                          <ResumeView config={config} templateId={key} />
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
