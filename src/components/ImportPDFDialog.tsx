import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Upload,
  FileText,

  Check,
  Sparkles,
  Briefcase,
  GraduationCap,
  FolderKanban,
  Wrench,
  Award,
  User,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAIStore } from '@/store/ai';
import { useResumeStore } from '@/store/resume';
import { AI_PROVIDER_PRESETS } from '@/config/ai-providers';
import { extractTextFromPDF } from '@/services/pdf-parser';
import { generateText, extractJSON } from '@/services/ai-generate';
import { mapAIJsonToResume, isValidAIResumeData } from '@/services/resume-mapper';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/utils/pdf-prompts';
import type { ExtendedJSONResume } from '@/types/extended-json-resume';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStage =
  | { step: 'upload' }
  | { step: 'extracting' }
  | { step: 'calling-ai' }
  | { step: 'preview'; data: ExtendedJSONResume }
  | { step: 'error'; message: string; recoverable: boolean; failedStep?: string };

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** 解析进度步骤定义 */
const PROGRESS_STEPS: readonly {
  key: string;
  activeKey: string;
  doneKey: string;
  pendingKey: string;
  hintKey?: string;
}[] = [
  {
    key: 'extracting',
    activeKey: 'importPDF.stepExtractActive',
    doneKey: 'importPDF.stepExtractDone',
    pendingKey: 'importPDF.stepExtractPending',
  },
  {
    key: 'calling-ai',
    activeKey: 'importPDF.stepAIActive',
    doneKey: 'importPDF.stepAIDone',
    pendingKey: 'importPDF.stepAIPending',
    hintKey: 'importPDF.stepAIHint',
  },
];

export function ImportPDFDialog({ open, onOpenChange }: ImportPDFDialogProps) {
  const { t } = useTranslation();
  const update = useResumeStore((s) => s.update);
  const reset = useResumeStore((s) => s.reset);
  const save = useResumeStore((s) => s.save);
  const activeProviderId = useAIStore((s) => s.activeProviderId);
  const getProviderConfig = useAIStore((s) => s.getProviderConfig);

  const [state, setState] = useState<ImportStage>({ step: 'upload' });
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 缓存最近使用的文件，支持错误后重试 */
  const lastFileRef = useRef<File | null>(null);
  /** 用 ref 追踪处理状态，避免 useCallback 闭包失效 */
  const isProcessingRef = useRef(false);
  /** 会话标记：每次发起解析时递增，关闭/取消时也递增，用于丢弃过期的异步回调 */
  const sessionIdRef = useRef(0);

  /** 真正执行关闭：重置全部状态，并使正在进行的异步流程失效 */
  const performClose = useCallback(() => {
    sessionIdRef.current += 1;
    setState({ step: 'upload' });
    setDragging(false);
    setFileName('');
    setShowCancelConfirm(false);
    lastFileRef.current = null;
    onOpenChange(false);
  }, [onOpenChange]);

  /** 拦截所有关闭入口（X 按钮、遮罩层、Escape、取消按钮） */
  const handleCloseAttempt = useCallback((newOpen: boolean) => {
    if (newOpen) {
      onOpenChange(true);
      return;
    }
    if (isProcessingRef.current) {
      setShowCancelConfirm(true);
    } else {
      performClose();
    }
  }, [onOpenChange, performClose]);

  /** 核心解析流程 */
  const processFile = useCallback(async (file: File) => {
    // 检查 AI 配置
    if (!activeProviderId) {
      setState({ step: 'error', message: t('importPDF.errorNoAI'), recoverable: false });
      return;
    }

    const providerConfig = getProviderConfig(activeProviderId);
    if (!providerConfig.apiKey || !providerConfig.verified) {
      setState({ step: 'error', message: t('importPDF.errorNoAI'), recoverable: false });
      return;
    }

    const preset = AI_PROVIDER_PRESETS[activeProviderId];
    if (!preset) {
      setState({ step: 'error', message: t('importPDF.errorNoAI'), recoverable: false });
      return;
    }

    // 生成新的会话标记，用于在 await 之后判断本次流程是否已被取消
    const currentSession = ++sessionIdRef.current;
    const isStale = () => sessionIdRef.current !== currentSession;

    setFileName(file.name);
    lastFileRef.current = file;

    try {
      // 阶段 1：提取 PDF 文本
      // 使用最小显示时间，避免步骤一闪而过影响用户感知
      setState({ step: 'extracting' });
      const minDisplayDelay = new Promise((r) => setTimeout(r, 2100));
      const [pdfText] = await Promise.all([extractTextFromPDF(file), minDisplayDelay]);
      if (isStale()) return;

      // 阶段 2：调用 AI 解析
      // 硅基流动固定使用 Qwen2.5-7B-Instruct，该模型对结构化简历解析效果最稳定
      const pdfModel = activeProviderId === 'siliconflow'
        ? 'Qwen/Qwen2.5-7B-Instruct'
        : providerConfig.selectedModel;
      setState({ step: 'calling-ai' });
      const aiResponse = await generateText(
        {
          apiKey: providerConfig.apiKey,
          apiUrl: providerConfig.apiUrl,
          model: pdfModel,
        },
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(pdfText) },
        ],
      );
      if (isStale()) return;

      // 阶段 3：解析和映射数据（瞬时完成，不单独展示步骤）
      const aiJson = extractJSON(aiResponse);

      if (!isValidAIResumeData(aiJson)) {
        throw new Error(t('importPDF.errorInvalidAIData'));
      }

      const resume = mapAIJsonToResume(aiJson);

      // 进入预览阶段
      setState({ step: 'preview', data: resume });
    } catch (error) {
      if (isStale()) return;
      const message = error instanceof Error ? error.message : t('importPDF.errorUnknown');
      const isCors = message.includes('CORS');
      setState({
        step: 'error',
        message: isCors ? t('importPDF.errorCORS') : message,
        recoverable: !isCors,
        failedStep: undefined,
      });
    }
  }, [activeProviderId, getProviderConfig, t]);

  /** 处理文件选择 */
  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error(t('importPDF.errorNotPDF'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('importPDF.errorTooLarge'));
      return;
    }
    processFile(file);
  }, [processFile, t]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  /** 确认导入 */
  const handleConfirm = useCallback(async () => {
    if (state.step !== 'preview') return;
    try {
      // 先清空旧数据，再写入新数据，确保完全替换而非合并
      reset();
      update(state.data);
      await save();
      toast.success(t('importPDF.success'));
      performClose();
    } catch {
      toast.error(t('common.saveError'));
    }
  }, [state, reset, update, save, performClose, t]);

  /** 重试：回到上传阶段 */
  const handleRetry = useCallback(() => {
    setState({ step: 'upload' });
    setFileName('');
    lastFileRef.current = null;
  }, []);

  /** 错误后重试：使用缓存的文件重新执行 */
  const handleRetryFromError = useCallback(() => {
    const cachedFile = lastFileRef.current;
    if (cachedFile) {
      processFile(cachedFile);
    } else {
      handleRetry();
    }
  }, [processFile, handleRetry]);

  /** 确认取消 */
  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    performClose();
  }, [performClose]);

  // 判断当前进度步骤
  const currentProgressIndex =
    state.step === 'extracting' ? 0 :
    state.step === 'calling-ai' ? 1 : -1;

  const isProcessing = currentProgressIndex >= 0;

  // 同步 ref，供 handleCloseAttempt 回调使用（必须放在 useEffect 中，避免并发渲染下 ref 不一致）
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  return (
    <Dialog open={open} onOpenChange={handleCloseAttempt}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pb-0 pt-5">
          <DialogTitle className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5" />
            {t('importPDF.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5">
          {/* 上传阶段 */}
          {state.step === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-300',
                dragging
                  ? 'border-foreground/30 bg-muted/50'
                  : 'border-muted-foreground/20 hover:border-foreground/25 hover:bg-muted/30',
              )}
            >
              <div className={cn(
                'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300',
                dragging
                  ? 'bg-muted text-foreground scale-110'
                  : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground',
              )}>
                <Upload className="h-6 w-6" />
              </div>
              <p className="mb-1 text-sm font-medium text-foreground">
                {t('importPDF.dropHint')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('importPDF.formatHint')}
              </p>
            </div>
          )}

          {/* 解析进度 */}
          {isProcessing && (
            <div className="space-y-4">
              {/* 文件名卡片：压缩 padding */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
                <FileText className="h-4 w-4 shrink-0 text-foreground" />
                <span className="truncate text-sm font-medium">{fileName}</span>
              </div>

              {/* 进度步骤 */}
              <div className="space-y-1.5">
                {PROGRESS_STEPS.map((step, index) => {
                  const isActive = index === currentProgressIndex;
                  const isDone = index < currentProgressIndex;

                  // 根据状态选择对应的 i18n key
                  const labelKey = isDone
                    ? step.doneKey
                    : isActive
                      ? step.activeKey
                      : step.pendingKey;

                  return (
                    <div key={step.key}>
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-500',
                          isActive && 'bg-sky-50/80 dark:bg-sky-950/30',
                        )}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                          {isDone ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          ) : isActive ? (
                            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/15" />
                          )}
                        </div>
                        <span className={cn(
                          'text-sm transition-colors',
                          isActive
                            ? 'font-medium text-sky-700 dark:text-sky-300'
                            : isDone
                              ? 'text-muted-foreground/70'
                              : 'text-muted-foreground/40',
                        )}>
                          {t(labelKey)}
                        </span>
                      </div>
                      {/* AI 步骤激活时显示等待提示 */}
                      {isActive && step.hintKey && (
                        <p className="ml-14 mt-0.5 text-xs text-muted-foreground/60">
                          {t(step.hintKey)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 预览阶段 */}
          {state.step === 'preview' && (
            <div className="space-y-4">
              <ScrollArea className="h-[320px]">
                <div className="space-y-3 pr-3">
                  <PreviewSection
                    icon={<User className="h-4 w-4" />}
                    title={t('module.profile')}
                    visible={!!state.data.basics?.name}
                  >
                    {state.data.basics?.name && (
                      <p className="text-sm font-semibold">{state.data.basics.name}</p>
                    )}
                    {state.data.basics?.label && (
                      <p className="text-xs text-muted-foreground">{state.data.basics.label}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {state.data.basics?.email && <span>{state.data.basics.email}</span>}
                      {state.data.basics?.phone && <span>{state.data.basics.phone}</span>}
                      {state.data.basics?.location?.city && <span>{state.data.basics.location.city}</span>}
                    </div>
                  </PreviewSection>

                  <PreviewSection
                    icon={<Briefcase className="h-4 w-4" />}
                    title={t('module.workExpList')}
                    count={state.data.work?.length}
                    visible={!!state.data.work?.length}
                  >
                    {state.data.work?.map((w, i) => (
                      <div key={`${w.name}-${w.startDate}-${i}`} className="border-l-2 border-sky-200 pl-3 py-1">
                        <p className="text-sm font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[w.position, w.startDate && w.endDate ? `${w.startDate} – ${/^present$/i.test(w.endDate) ? t('field.present') : w.endDate}` : ''].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    ))}
                  </PreviewSection>

                  <PreviewSection
                    icon={<GraduationCap className="h-4 w-4" />}
                    title={t('module.educationList')}
                    count={state.data.education?.length}
                    visible={!!state.data.education?.length}
                  >
                    {state.data.education?.map((e, i) => (
                      <div key={`${e.institution}-${e.startDate}-${i}`} className="border-l-2 border-emerald-200 pl-3 py-1">
                        <p className="text-sm font-medium">{e.institution}</p>
                        <p className="text-xs text-muted-foreground">
                          {[e.area, e.studyType].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    ))}
                  </PreviewSection>

                  <PreviewSection
                    icon={<FolderKanban className="h-4 w-4" />}
                    title={t('module.projectList')}
                    count={state.data.projects?.length}
                    visible={!!state.data.projects?.length}
                  >
                    {state.data.projects?.map((p, i) => (
                      <div key={`${p.name}-${i}`} className="border-l-2 border-amber-200 pl-3 py-1">
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                        )}
                      </div>
                    ))}
                  </PreviewSection>

                  <PreviewSection
                    icon={<Wrench className="h-4 w-4" />}
                    title={t('module.skillList')}
                    count={state.data.skills?.length}
                    visible={!!state.data.skills?.length}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {state.data.skills?.map((s, i) => (
                        <span
                          key={`${s.name}-${i}`}
                          className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </PreviewSection>

                  <PreviewSection
                    icon={<Award className="h-4 w-4" />}
                    title={t('module.awardList')}
                    count={state.data.awards?.length}
                    visible={!!state.data.awards?.length}
                  >
                    {state.data.awards?.map((a, i) => (
                      <p key={`${a.title}-${i}`} className="text-xs">
                        <span className="font-medium">{a.title}</span>
                        {a.date && <span className="ml-2 text-muted-foreground">{a.date}</span>}
                      </p>
                    ))}
                  </PreviewSection>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* 错误阶段 */}
          {state.step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
                <X className="h-7 w-7 text-red-500 dark:text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{t('importPDF.errorTitle')}</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">{state.message}</p>
              </div>
              {state.recoverable && (
                <Button variant="outline" size="sm" onClick={handleRetryFromError}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  {t('importPDF.retryStep')}
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="ghost" onClick={() => handleCloseAttempt(false)}>
            {t('common.cancel')}
          </Button>
          {state.step === 'preview' && (
            <Button onClick={handleConfirm}>
              {t('importPDF.confirm')}
            </Button>
          )}
        </DialogFooter>

        {/* 隐藏文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          aria-label="Import PDF"
          onChange={handleInputChange}
        />
      </DialogContent>

      {/* 取消二次确认弹窗 */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('importPDF.cancelConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('importPDF.cancelConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('importPDF.cancelConfirmNo')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              {t('importPDF.cancelConfirmYes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// --- 预览子组件 ---

function PreviewSection({
  icon,
  title,
  count,
  visible,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null;

  return (
    <div className="rounded-lg border bg-card p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sky-500">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {count !== undefined && (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
