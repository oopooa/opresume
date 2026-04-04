import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/resume';
import { useUIStore } from '@/store/ui';
import { useThemeEffect } from '@/hooks/useThemeEffect';
import { useSaveShortcut } from '@/hooks/useSaveShortcut';
import { Toolbar, FloatingToolbar } from '@/components/Toolbar';
import { ResumeView } from '@/components/Resume';
import { SettingsPanel } from '@/components/Settings';
import { Toaster } from '@/components/ui/sonner';
import { Settings } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

const Editor = lazy(() =>
  import('@/components/Editor').then((m) => ({ default: m.Editor })),
);

const Agentation = lazy(() =>
  import('agentation').then((m) => ({ default: m.Agentation })),
);

function DevAgentation() {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Suspense>
      <Agentation />
    </Suspense>
  );
}

function App() {
  const { config, loading, error, load } = useResumeStore();
  const openSettingsPanel = useUIStore((s) => s.openSettingsPanel);
  const { t } = useTranslation();
  useThemeEffect();
  useSaveShortcut();

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error ?? t('common.loadError')}</p>
        <Button size="sm" onClick={() => load()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen flex-col bg-gray-100">
        <Toolbar />
        <main className="flex flex-1 justify-center overflow-auto py-8 print:overflow-visible print:py-0">
          <ResumeView config={config} />
        </main>
        <FloatingToolbar />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed bottom-4 left-4 z-40 rounded-2xl border bg-white/90 text-muted-foreground shadow-lg backdrop-blur hover:text-foreground print:hidden"
              onClick={openSettingsPanel}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('settings.title')}</TooltipContent>
        </Tooltip>
        <SettingsPanel />
        <Suspense>
          <Editor />
        </Suspense>
        <Toaster />
        <DevAgentation />
      </div>
    </TooltipProvider>
  );
}

export default App;
