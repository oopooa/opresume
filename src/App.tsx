import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/resume';
import { useThemeEffect } from '@/hooks/useThemeEffect';
import { useSaveShortcut } from '@/hooks/useSaveShortcut';
import { Toolbar } from '@/components/Toolbar';
import { ResumeView } from '@/components/Resume';
import { Editor } from '@/components/Editor';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

function App() {
  const { config, loading, error, load } = useResumeStore();
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
    <div className="flex min-h-screen flex-col bg-gray-100">
      <Toolbar />
      <main className="flex flex-1 justify-center overflow-auto py-8 print:overflow-visible print:py-0">
        <ResumeView config={config} />
      </main>
      <Editor />
      <Toaster />
    </div>
  );
}

export default App;
