import { useTranslation } from 'react-i18next';
import { LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const TEMPLATES = ['template1', 'template2', 'template3', 'template4'] as const;

export function TemplateSelector() {
  const { t } = useTranslation();
  const template = useUIStore((s) => s.template);
  const setTemplate = useUIStore((s) => s.setTemplate);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <LayoutTemplate className="h-3.5 w-3.5" />
          {t('toolbar.template')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        {TEMPLATES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTemplate(key)}
            className={cn(
              'w-full rounded-sm px-3 py-1.5 text-left text-xs transition-colors',
              template === key
                ? 'bg-accent font-medium text-resume-primary'
                : 'text-gray-600 hover:bg-accent',
            )}
          >
            {t(`template.${key}`)}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
