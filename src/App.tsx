import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/resume';
import { useThemeEffect } from '@/hooks/useThemeEffect';

function App() {
  const { config, loading, error, load } = useResumeStore();
  const { t } = useTranslation();
  useThemeEffect();

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
        <button
          type="button"
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => load()}
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-2 text-3xl font-bold">
        {config.profile?.name}
      </h1>
      <p className="text-muted-foreground">
        {config.profile?.positionTitle}
        {config.profile?.workPlace && ` · ${config.profile.workPlace}`}
        {config.profile?.workExpYear && ` · ${t('common.yearsExp', { years: config.profile.workExpYear })}`}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {config.profile?.email}
        {config.profile?.mobile && ` | ${config.profile.mobile}`}
        {config.profile?.github && ` | github.com/${config.profile.github}`}
      </p>

      <pre className="mt-8 rounded bg-muted p-4 text-xs overflow-auto">
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}

export default App;
