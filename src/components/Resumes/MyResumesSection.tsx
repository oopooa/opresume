import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Folder } from 'lucide-react';
import { isDemoMode } from '@/i18n';
import { useResumeLibraryStore } from '@/store/resume-library';
import { Badge } from '@/components/ui/badge';
import { ResumeManagerDialog } from './ResumeManagerDialog';

/** 侧边栏一级菜单「我的简历」：点击打开简历管理面板 */
export function MyResumesSection() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const resumes = useResumeLibraryStore((s) => s.resumes);
  const activeId = useResumeLibraryStore((s) => s.activeId);
  const loaded = useResumeLibraryStore((s) => s.loaded);
  const loadList = useResumeLibraryStore((s) => s.loadList);

  const demo = isDemoMode();

  useEffect(() => {
    if (!demo && !loaded) {
      void loadList();
    }
  }, [demo, loaded, loadList]);

  // Demo 模式为只读演示，不启用简历库
  if (demo) return null;

  const activeName = resumes.find((r) => r.id === activeId)?.name;

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="group relative z-10 flex w-full items-center justify-between py-2"
      >
        <div className="flex shrink-0 items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t('resumeManager.title')}</span>
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {activeName && (
            <Badge
              variant="secondary"
              className="max-w-[140px] truncate text-xs font-normal"
            >
              {activeName}
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </button>

      <ResumeManagerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
