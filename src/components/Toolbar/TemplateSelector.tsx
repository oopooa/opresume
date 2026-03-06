import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutTemplate, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { templateIds } from '@/components/Resume/templates';
import { ResumeView } from '@/components/Resume';

export function TemplateSelector() {
  const { t } = useTranslation();
  const template = useUIStore((s) => s.template);
  const setTemplate = useUIStore((s) => s.setTemplate);
  const config = useResumeStore((s) => s.config);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const handleSelect = useCallback((key: string) => {
    setTemplate(key);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 350);
  }, [setTemplate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <LayoutTemplate className="h-3.5 w-3.5" />
          {t('toolbar.template')}
        </Button>
      </DialogTrigger>
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
                  onClick={() => handleSelect(key)}
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
                  {/* A4 = 794×1123, scale 0.28 → ~222×314 */}
                  <div className="h-72 w-full overflow-hidden">
                    {config && (
                      <div className="pointer-events-none origin-top-left scale-[0.28]">
                        <ResumeView config={config} templateId={key} />
                      </div>
                    )}
                  </div>
                  {/* 模板名称 */}
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
  );
}
