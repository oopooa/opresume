import { useEffect } from 'react';
import { useResumeStore } from '@/store/resume';

function App() {
  const { config, loading, error, load } = useResumeStore();

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error ?? '加载简历数据失败'}</p>
        <button
          type="button"
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => load()}
        >
          重试
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
        {config.profile?.workExpYear && ` · ${config.profile.workExpYear}年经验`}
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
