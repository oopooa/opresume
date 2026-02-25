import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/resume';

type TFunction = ReturnType<typeof useTranslation>['t'];

export function saveWithToast(t: TFunction) {
  const { dirty, save } = useResumeStore.getState();
  if (!dirty) return;
  save()
    .then(() => toast.success(t('toolbar.saved')))
    .catch(() => toast.error(t('common.saveError')));
}

export function useSaveShortcut() {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveWithToast(t);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [t]);

  // 未保存时关闭/刷新页面弹出浏览器原生确认对话框
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useResumeStore.getState().dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}
