import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';

const TEMPLATES = ['template1', 'template2', 'template3', 'template4'] as const;

export function TemplateSelector() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const template = useUIStore((s) => s.template);
  const setTemplate = useUIStore((s) => s.setTemplate);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100"
      >
        <LayoutTemplate className="h-3.5 w-3.5" />
        {t('toolbar.template')}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border bg-white py-1 shadow-lg">
          {TEMPLATES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTemplate(key); setOpen(false); }}
              className={cn(
                'w-full px-3 py-1.5 text-left text-xs transition-colors',
                template === key
                  ? 'bg-gray-100 font-medium text-resume-primary'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {t(`template.${key}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
