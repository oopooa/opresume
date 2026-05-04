import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scissors, Sparkles, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';

import { useAIStore } from '@/store/ai';
import { useUIStore } from '@/store/ui';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface OverlayState {
  module: string;
  itemIndex: number;
  selectedHtml: string;
  fullHtml: string;
  textStart: number;
  textEnd: number;
  rect: { top: number; left: number; right: number; bottom: number };
}

function readSelection(): OverlayState | null {
  if (typeof window === 'undefined') return null;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  if (!sel.toString().trim()) return null;

  const range = sel.getRangeAt(0);

  let node: Node | null = range.commonAncestorContainer;
  if (node && node.nodeType !== 1) node = node.parentElement;
  const host = (node as Element | null)?.closest('[data-polish-host="true"]') as HTMLElement | null;
  if (!host) return null;

  const module = host.getAttribute('data-polish-module');
  if (!module) return null;

  const itemIndex = parseInt(host.getAttribute('data-polish-item-index') ?? '0', 10);

  // 用 Range.toString().length 计算选区两端相对 host 文本内容的偏移
  const startProbe = document.createRange();
  startProbe.setStart(host, 0);
  startProbe.setEnd(range.startContainer, range.startOffset);
  const textStart = startProbe.toString().length;

  const endProbe = document.createRange();
  endProbe.setStart(host, 0);
  endProbe.setEnd(range.endContainer, range.endOffset);
  const textEnd = endProbe.toString().length;
  if (textEnd <= textStart) return null;

  // 用 getClientRects 的并集计算选区视觉边界，比单一 boundingRect 更鲁棒
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 || r.height > 0);
  let bounds: { top: number; left: number; right: number; bottom: number };
  if (rects.length) {
    bounds = rects.reduce(
      (acc, r) => ({
        top: Math.min(acc.top, r.top),
        left: Math.min(acc.left, r.left),
        right: Math.max(acc.right, r.right),
        bottom: Math.max(acc.bottom, r.bottom),
      }),
      { top: Infinity, left: Infinity, right: -Infinity, bottom: -Infinity },
    );
  } else {
    const r = range.getBoundingClientRect();
    bounds = { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  }
  if (bounds.right <= bounds.left || bounds.bottom <= bounds.top) return null;

  const fragment = range.cloneContents();
  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);
  const selectedHtml = wrapper.innerHTML;
  if (!selectedHtml.replace(/<[^>]+>/g, '').trim()) return null;

  return {
    module,
    itemIndex,
    selectedHtml,
    fullHtml: host.innerHTML,
    textStart,
    textEnd,
    rect: bounds,
  };
}

const CHIPS: Array<{ id: 'optimize' | 'condense'; icon: React.ElementType; labelKey: string }> = [
  { id: 'optimize', icon: Sparkles, labelKey: 'editor.polish.op.aiOptimize' },
  { id: 'condense', icon: Scissors, labelKey: 'editor.polish.op.aiCondense' },
];

const ESTIMATED_ACTION_BAR_WIDTH = 176;
const ESTIMATED_BAR_HEIGHT = 32;
const GAP = 8;
const SAFE_INSET = 8;

export function PolishSelectionOverlay() {
  const { t } = useTranslation();
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const editorOpen = useUIStore((s) => s.editorOpen);
  const openPolishDialog = useUIStore((s) => s.openPolishDialog);
  // 系统/浏览器开启"减少动画"偏好时，退化为纯透明度切换，
  // 避免对前庭功能敏感的用户造成不适。
  const reduceMotion = useReducedMotion();

  // 拖选过程中暂时隐藏浮层，避免位置随手指抖动
  const draggingRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const hasOverlayRef = useRef(false);
  const editorOpenRef = useRef(editorOpen);
  // 在 commit 后同步最新 overlay 状态，避免在渲染期写入 ref 导致并发/StrictMode 下读到陈旧值
  useEffect(() => {
    hasOverlayRef.current = !!overlay;
  }, [overlay]);
  // 编辑器打开时立即清空浮层并标记 ref，避免事件回调读到陈旧的 editorOpen
  useEffect(() => {
    editorOpenRef.current = editorOpen;
    if (editorOpen) setOverlay(null);
  }, [editorOpen]);
  const forceNoAI = import.meta.env.DEV
    && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('debugNoAI') === 'true';

  const aiConfigured = useAIStore((s) => {
    if (forceNoAI) return false;
    if (!s.activeProviderId) return false;
    const cfg = s.getProviderConfig(s.activeProviderId);
    return !!(cfg.apiKey && cfg.verified);
  });

  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      if (editorOpenRef.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOverlay(readSelection()));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (editorOpenRef.current) return;
      // 点击发生在浮层自身时不进入"拖选"分支，避免 chip 点击前就被隐藏
      if ((e.target as Element | null)?.closest('[data-polish-overlay="true"]')) return;
      draggingRef.current = true;
      setOverlay(null);
    };
    const onPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (editorOpenRef.current) return;
      // 双 RAF 保证 selection 已稳定后再读
      requestAnimationFrame(() => requestAnimationFrame(refresh));
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (editorOpenRef.current) return;
      // shift+方向键 / cmd+a 等键盘选择
      if (e.shiftKey || ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A'))) refresh();
    };
    const onSelectionChange = () => {
      if (editorOpenRef.current) return;
      if (draggingRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        if (hasOverlayRef.current) setOverlay(null);
        return;
      }
      // 只有已显示浮层时才跟随选区变化重新定位（避免拖选过程中频繁触发）
      if (hasOverlayRef.current) refresh();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
    };
  }, []);

  if (editorOpen) return null;

  // 计算位置（仅在 overlay 存在时进行）；为 AnimatePresence 提供存在性切换。
  let top = 0;
  let left = 0;
  // 浮层默认放选区上方时 origin 在底部中心；翻转到下方时 origin 在顶部中心。
  // 这样 spring 弹出方向始终从选区方向"长"出来，视觉上贴合用户的注意力锚点。
  let originY: 'bottom' | 'top' = 'bottom';
  if (overlay) {
    const rect = overlay.rect;
    const center = (rect.left + rect.right) / 2;
    left = center - ESTIMATED_ACTION_BAR_WIDTH / 2;
    left = Math.max(SAFE_INSET, Math.min(window.innerWidth - ESTIMATED_ACTION_BAR_WIDTH - SAFE_INSET, left));

    const aboveTop = rect.top - ESTIMATED_BAR_HEIGHT - GAP;
    const belowTop = rect.bottom + GAP;
    if (aboveTop >= SAFE_INSET) {
      top = aboveTop;
      originY = 'bottom';
    } else if (belowTop + ESTIMATED_BAR_HEIGHT + SAFE_INSET <= window.innerHeight) {
      top = belowTop;
      originY = 'top';
    } else {
      top = SAFE_INSET;
      originY = 'top';
    }
  }

  const handleChipClick = (op: 'optimize' | 'condense') => {
    if (!overlay) return;
    if (!aiConfigured) {
      toast.error(t('editor.polish.errorNoAI'));
      return;
    }
    openPolishDialog({
      module: overlay.module,
      itemIndex: overlay.itemIndex,
      originalHtml: overlay.selectedHtml,
      fullHtml: overlay.fullHtml,
      textStart: overlay.textStart,
      textEnd: overlay.textEnd,
      initialOperation: op,
    });
    setOverlay(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <AnimatePresence mode="popLayout">
      {overlay && (
        <motion.div
          ref={overlayRef}
          data-polish-overlay="true"
          role="toolbar"
          aria-label={t('editor.polish.bubbleButton')}
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border bg-popover px-1.5 py-1 shadow-md print:hidden"
          style={{ top, left, transformOrigin: `center ${originY}` }}
          // 弹出动画：从选区方向"长"出来 —— scale + 轻微位移 + 透明度。
          // 用 spring 物理参数（stiffness 高、damping 偏低）制造细微的过冲，
          // 让出现的感觉更"鲜活"，但不至于晃动到打扰阅读。
          // reduceMotion 用户：退化为纯 fade（无 scale / 无位移 / 短时长），
          // 满足无障碍偏好。
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.7, y: originY === 'bottom' ? 6 : -6 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.1, ease: 'easeOut' } }
              : {
                  opacity: 0,
                  scale: 0.85,
                  y: originY === 'bottom' ? 4 : -4,
                  transition: { duration: 0.12, ease: 'easeOut' },
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.12, ease: 'easeOut' }
              : { type: 'spring', stiffness: 520, damping: 22, mass: 0.6 }
          }
        >
          {CHIPS.map(({ id, icon: Icon, labelKey }) => {
            const label = t(labelKey);
            const noAIMessage = t('editor.polish.tooltipNoAI');
            const button = (
              <button
                type="button"
                aria-label={aiConfigured ? label : `${label}: ${noAIMessage}`}
                onClick={() => handleChipClick(id)}
                className="flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium text-popover-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {aiConfigured ? (
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                )}
                {label}
              </button>
            );

            if (aiConfigured) {
              return <React.Fragment key={id}>{button}</React.Fragment>;
            }

            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {noAIMessage}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
