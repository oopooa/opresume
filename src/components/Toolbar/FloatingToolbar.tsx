import { useTranslation } from 'react-i18next';
import { Download, Github, Save, PenLine } from 'lucide-react';
import { useResumeStore } from '@/store/resume';
import { useUIStore } from '@/store/ui';
import { saveWithToast } from '@/hooks/useSaveShortcut';
import { Button } from '@/components/ui/button';
import { useCallback, useRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppearanceDrawer } from './AppearanceDrawer';

const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const SHORTCUT = IS_MAC ? '⌘S' : 'Ctrl+S';

export function FloatingToolbar() {
  const { t } = useTranslation();
  const dirty = useResumeStore((s) => s.dirty);
  const openEditor = useUIStore((s) => s.openEditor);
  const printingRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (printingRef.current) return;
    printingRef.current = true;
    requestIdleCallback(
      () => {
        window.print();
        printingRef.current = false;
      },
      { timeout: 100 }
    );
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed right-4 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border bg-white/90 p-1.5 shadow-lg backdrop-blur print:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => openEditor()}
            >
              <PenLine className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('common.edit')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => saveWithToast(t)}
              disabled={!dirty}
            >
              {dirty && (
                <span className="absolute right-1 top-1 inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {dirty ? `${t('toolbar.unsaved')} (${SHORTCUT})` : `${t('toolbar.save')} (${SHORTCUT})`}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="rounded-xl"
              onClick={handlePrint}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('toolbar.print')}</TooltipContent>
        </Tooltip>

        <div className="mx-auto h-px w-5 bg-border" />

        <AppearanceDrawer />

        <div className="mx-auto h-px w-5 bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href="https://github.com/oopooa/opresume" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">GitHub</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
