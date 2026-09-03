import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Check,
  Copy,
  Folder,
  Pencil,
  Plus,
  SquarePen,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useResumeLibraryStore } from '@/store/resume-library';
import { useResumeStore } from '@/store/resume';
import { useUIStore } from '@/store/ui';
import { loadResumeLibrary } from '@/services/resume-library';
import { ResumeView } from '@/components/Resume';
import { definitions } from '@/components/Resume/templates';
import { cn } from '@/lib/utils';
import type { JsonResume } from '@/types/json-resume';
import type { ResumeMeta } from '@/types/resume-library';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ResumeManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 将时间戳格式化为 YYYY-MM-DD HH:mm:ss 本地时间 */
function formatUpdatedAt(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function ResumeManagerDialog({ open, onOpenChange }: ResumeManagerDialogProps) {
  const { t } = useTranslation();
  const resumes = useResumeLibraryStore((s) => s.resumes);
  const activeId = useResumeLibraryStore((s) => s.activeId);
  const busy = useResumeLibraryStore((s) => s.busy);
  const loadList = useResumeLibraryStore((s) => s.loadList);
  const createResume = useResumeLibraryStore((s) => s.createResume);
  const duplicateResume = useResumeLibraryStore((s) => s.duplicateResume);
  const renameResume = useResumeLibraryStore((s) => s.renameResume);
  const deleteResume = useResumeLibraryStore((s) => s.deleteResume);
  const switchResume = useResumeLibraryStore((s) => s.switchResume);
  const liveConfig = useResumeStore((s) => s.config);
  const globalTemplate = useUIStore((s) => s.template);

  const [previewData, setPreviewData] = useState<Map<string, JsonResume>>(new Map());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingMeta, setDeletingMeta] = useState<ResumeMeta | null>(null);

  // 打开面板时刷新列表（同步最近的保存时间）
  useEffect(() => {
    if (open) void loadList();
  }, [open, loadList]);

  // 加载完整简历数据用于渲染缩略图；列表元数据变化（新建/删除/重命名等）时同步刷新
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadResumeLibrary()
      .then((library) => {
        if (!cancelled) {
          setPreviewData(new Map(library.resumes.map((r) => [r.meta.id, r.data])));
        }
      })
      .catch(() => {
        // 预览数据加载失败时仅缺少缩略图，不影响列表操作
      });
    return () => {
      cancelled = true;
    };
  }, [open, resumes]);

  // 底部边缘渐隐：未滚到底时显示渐变遮罩（顶部过渡由实底标题栏接管，无需 JS 状态）
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const updateScrollFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  // 缩略图异步加载后溢出高度会变化，内容就绪后重新检测一次
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(updateScrollFades);
    return () => cancelAnimationFrame(raf);
  }, [open, resumes, previewData]);

  // 当前激活简历用编辑器实时数据（可能含未保存更改），其余用简历库存储的数据
  const getPreviewConfig = (meta: ResumeMeta): JsonResume | null => {
    if (meta.id === activeId && liveConfig) return liveConfig;
    return previewData.get(meta.id) ?? null;
  };

  // 模板随简历存储：取简历自己记录的模板，旧数据无该字段时回退到当前全局模板
  const getTemplateId = (config: JsonResume | null): string => {
    const template = config?.['x-op-template'];
    return template && definitions[template] ? template : globalTemplate;
  };

  const handleSwitch = async (meta: ResumeMeta) => {
    if (busy || meta.id === activeId) return;
    try {
      await switchResume(meta.id);
      onOpenChange(false);
      toast.success(t('resumeManager.switchSuccess', { name: meta.name }));
    } catch {
      toast.error(t('resumeManager.operationFailed'));
    }
  };

  /** 编辑：当前简历直接关闭面板，其他简历切换后关闭 */
  const handleEdit = async (meta: ResumeMeta) => {
    if (meta.id === activeId) {
      onOpenChange(false);
      return;
    }
    await handleSwitch(meta);
  };

  const handleCreate = async () => {
    try {
      await createResume();
      onOpenChange(false);
      toast.success(t('resumeManager.createSuccess'));
    } catch {
      toast.error(t('resumeManager.operationFailed'));
    }
  };

  const handleDuplicate = async (meta: ResumeMeta) => {
    try {
      await duplicateResume(meta.id);
      toast.success(t('resumeManager.duplicateSuccess'));
    } catch {
      toast.error(t('resumeManager.operationFailed'));
    }
  };

  const startRename = (meta: ResumeMeta) => {
    setRenamingId(meta.id);
    setRenameValue(meta.name);
  };

  const confirmRename = async () => {
    const id = renamingId;
    setRenamingId(null);
    if (!id) return;
    try {
      await renameResume(id, renameValue);
    } catch {
      toast.error(t('resumeManager.operationFailed'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMeta) return;
    try {
      await deleteResume(deletingMeta.id);
      toast.success(t('resumeManager.deleteSuccess'));
    } catch {
      toast.error(t('resumeManager.operationFailed'));
    } finally {
      setDeletingMeta(null);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[85vh] max-w-5xl flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={scrollRef}
              onScroll={updateScrollFades}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1 pl-1 pr-3 pt-10"
            >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] justify-items-center gap-x-5 gap-y-6 py-2">
              {/* 新建简历卡片（固定在最左侧） */}
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleCreate()}
                aria-label={t('resumeManager.create')}
                className="group relative flex w-full max-w-56 cursor-pointer flex-col overflow-hidden rounded-lg border border-dashed border-gray-300 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-resume-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 px-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-primary/10">
                    <Plus className="h-7 w-7 text-gray-400 transition-colors group-hover:text-primary" />
                  </span>
                  <span className="text-base font-semibold text-gray-700">
                    {t('resumeManager.create')}
                  </span>
                </div>
              </button>

              {/* 简历卡片：缩略图 + 名称 + 操作按钮 */}
              {resumes.map((meta) => {
                const isActive = meta.id === activeId;
                const renaming = renamingId === meta.id;
                const config = getPreviewConfig(meta);
                const templateId = getTemplateId(config);
                return (
                  <div
                    key={meta.id}
                    className={cn(
                      'group relative w-full max-w-56 transform-gpu overflow-hidden rounded-lg bg-white transition-[transform,box-shadow] duration-200 will-change-transform [backface-visibility:hidden]',
                      isActive
                        ? 'shadow-md ring-2 ring-resume-primary'
                        : 'ring-1 ring-gray-200 hover:-translate-y-1 hover:shadow-lg hover:ring-gray-300',
                    )}
                  >
                    {isActive && (
                      <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-resume-primary text-white shadow-sm ring-2 ring-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}

                    {/* 缩略图区域：点击切换到该简历；hover 浮现切换提示 */}
                    <button
                      type="button"
                      disabled={isActive || busy}
                      onClick={() => void handleSwitch(meta)}
                      aria-label={meta.name}
                      className="group/thumb block w-full cursor-pointer text-left focus-visible:outline-none disabled:cursor-default"
                    >
                      <div className="relative h-64 w-full overflow-hidden bg-gray-50">
                        {config ? (
                          <div className="pointer-events-none absolute left-0 top-0 w-[210mm] origin-top-left scale-[0.28]">
                            <ResumeView config={config} templateId={templateId} disablePagination />
                          </div>
                        ) : (
                          <Skeleton className="h-full w-full rounded-none" />
                        )}
                        {!isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/0 opacity-0 transition-all duration-200 group-hover/thumb:bg-gray-900/40 group-hover/thumb:opacity-100">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-800 shadow-sm">
                              {t('resumeManager.switchTo')}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 信息区：名称 + 模板与更新时间（实底，与缩略图分隔） */}
                    <div className="border-t border-gray-100 bg-white px-3 pb-2 pt-2.5">
                      {renaming ? (
                        <div className="flex items-center gap-1 pb-0.5">
                          <Input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void confirmRename();
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            placeholder={t('resumeManager.renamePlaceholder')}
                            className="h-8 min-w-0 flex-1"
                            maxLength={50}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-resume-primary hover:text-resume-primary"
                            onClick={() => void confirmRename()}
                            aria-label={t('common.confirm')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => setRenamingId(null)}
                            aria-label={t('common.cancel')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <p className="min-w-0 truncate text-sm font-semibold text-gray-800">
                              {meta.name}
                            </p>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => startRename(meta)}
                              aria-label={t('resumeManager.rename')}
                              className="ml-auto shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-gray-600 focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {t(`template.${templateId}`)}
                            <span className="mx-1 text-gray-300">·</span>
                            {formatUpdatedAt(meta.updatedAt)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* 操作区：编辑 / 复制 / 删除（图标按钮 + tooltip） */}
                    {!renaming && (
                      <div className="flex items-center gap-0.5 border-t border-gray-100 bg-white px-1.5 py-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 flex-1 text-muted-foreground hover:text-foreground"
                              disabled={busy}
                              onClick={() => void handleEdit(meta)}
                              aria-label={t('resumeManager.edit')}
                            >
                              <SquarePen className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('resumeManager.edit')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 flex-1 text-muted-foreground hover:text-foreground"
                              disabled={busy}
                              onClick={() => void handleDuplicate(meta)}
                              aria-label={t('resumeManager.duplicate')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('resumeManager.duplicate')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={busy || resumes.length <= 1}
                              onClick={() => setDeletingMeta(meta)}
                              aria-label={t('resumeManager.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('resumeManager.delete')}</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
            {/* 顶部实底标题栏：内容滚入栏后被不透明栏直接遮挡，允许在标题栏处切断 */}
            <div className="absolute inset-x-0 top-0 bg-background">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-primary" />
                  {t('resumeManager.title')}
                </DialogTitle>
              </DialogHeader>
            </div>
            {/* 底部边缘渐隐遮罩：软化滚动内容与弹窗底部的硬边界 */}
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background to-transparent transition-opacity duration-200',
                showBottomFade ? 'opacity-100' : 'opacity-0',
              )}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMeta} onOpenChange={(open) => !open && setDeletingMeta(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              {t('resumeManager.deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('resumeManager.deleteDesc', { name: deletingMeta?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
              onClick={() => void handleDeleteConfirm()}
            >
              {t('resumeManager.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
