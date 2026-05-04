import { useTranslation } from 'react-i18next';
import { Download, Github, Save, PenLine } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  // 减少动画偏好 → 退化为静态显示，避免对前庭敏感用户造成不适
  const reduceMotion = useReducedMotion();

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
      {/*
        悬浮工具栏入场：从右侧滑入 + 微缩放。
        改用长时长 tween + 末端减速曲线 [0.16, 1, 0.3, 1]（ease-out quint），
        起步柔和、尾部缓停，比高 stiffness 的 spring 更"丝"，避免硬顿感。
        delay 0.2s 让用户先看到主内容再被工具栏吸引注意。
        reduceMotion 用户：跳过位移/缩放，仅保留 opacity 渐显，时长压到 0.18s。
      */}
      <motion.div
        className="fixed right-4 top-1/2 z-40 flex flex-col gap-1 rounded-2xl border bg-white/90 p-1.5 shadow-lg backdrop-blur print:hidden"
        // 用 style 写 translateY(-50%)：framer-motion 的 y 会和这个 transform 冲突，
        // 因此入场用 x 而非 y，且垂直居中靠 style.top + transform 完成（不靠 -translate-y-1/2 类）。
        style={{ translateY: '-50%' }}
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, x: 36, scale: 0.94 }
        }
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={
          reduceMotion
            ? { duration: 0.18, ease: 'easeOut' }
            : { duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
        }
      >
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
              {/*
                未保存红点：dirty 切换时用 AnimatePresence + spring scale 弹出/收回。
                key=dirty 让真假切换都触发完整 enter/exit 周期；
                origin 中心，scale 0→1，给一个细微过冲（damping 偏低）。
              */}
              <AnimatePresence>
                {dirty && (
                  <motion.span
                    key="dirty-dot"
                    className="absolute right-1 top-1 inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0, transition: { duration: 0.1 } }
                        : { opacity: 0, scale: 0, transition: { duration: 0.12 } }
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0.12 }
                        : { type: 'spring', stiffness: 600, damping: 18, mass: 0.5 }
                    }
                  />
                )}
              </AnimatePresence>
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
      </motion.div>
    </TooltipProvider>
  );
}
