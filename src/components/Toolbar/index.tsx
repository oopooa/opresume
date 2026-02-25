import { useTranslation } from 'react-i18next';
import { Printer, Save } from 'lucide-react';
import { useResumeStore } from '@/store/resume';
import { saveWithToast } from '@/hooks/useSaveShortcut';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemePanel } from './ThemePanel';
import { TemplateSelector } from './TemplateSelector';
import { LangSwitcher } from './LangSwitcher';

const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const SHORTCUT = IS_MAC ? '⌘S' : 'Ctrl+S';

export function Toolbar() {
  const { t } = useTranslation();
  const dirty = useResumeStore((s) => s.dirty);

  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4 print:hidden">
      <span className="text-sm font-semibold text-gray-700">opresume</span>
      <div className="flex items-center gap-1">
        <TemplateSelector />
        <ThemePanel />
        <LangSwitcher />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative gap-1.5"
                onClick={() => saveWithToast(t)}
                disabled={!dirty}
              >
                {dirty && (
                  <span className="absolute -right-1 -top-1 inline-flex h-2 w-2 rounded-full bg-amber-500" />
                )}
                <Save className="h-3.5 w-3.5" />
                {t('toolbar.save')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {dirty ? `${t('toolbar.unsaved')} (${SHORTCUT})` : SHORTCUT}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => window.print()}
        >
          <Printer className="h-3.5 w-3.5" />
          {t('toolbar.print')}
        </Button>
      </div>
    </header>
  );
}
