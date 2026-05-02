import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles, Eye, ArrowLeftRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RichContent } from '@/components/RichContent';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import { polishHtmlStream, type PolishOperation, type PolishResult } from '@/services/ai-polish';
import { extractText, countWords, applyInlineDiff } from '@/utils/text-diff';
import { getPolishHandler } from '@/components/Resume/polish-handlers';

// ─── 模块级常量 ────────────────────────────────────────────────────────────────

/** 流式动画推进速度（每秒字符），与 RENDER_INTERVAL_MS 配合控制视觉节奏 */
const STREAM_CHARS_PER_SEC = 400;
/** 每次 setState 的最小间隔（毫秒），约 30fps，约束 DOM 重建频率 */
const RENDER_INTERVAL_MS = 32;

// ─── 应用修改到 store ──────────────────────────────────────────────────────────

class PolishApplyError extends Error {
  constructor(public code: 'CONTENT_CHANGED' | 'SPLICE_FAILED' | 'TARGET_MISSING') {
    super(code);
  }
}

/**
 * 用解析后的 polishedHtml 替换 fullHtml 中 [textStart, textEnd] 这段文本。
 * 通过 DOM Range 在解析后的 host 副本上做精确替换，避免基于字符串 includes 的结构错位。
 *
 * 边界优先策略：
 * - startNode 优先选 `textStart < nodeEnd` 的最早文本节点（不含等号），避免落在前一节点尾边界。
 * - endNode 优先选 `textEnd <= nodeEnd` 的最早文本节点（含等号），保证 end 不越界到下一节点首部。
 * - 若 textStart === 总长度（仅追加场景），退化到末尾节点末尾。
 *
 * 失败时抛 PolishApplyError('SPLICE_FAILED')，由调用方提示用户而非静默返回原 HTML。
 */
function spliceHtmlByTextRange(
  fullHtml: string,
  textStart: number,
  textEnd: number,
  polishedHtml: string,
): string {
  const host = document.createElement('div');
  host.innerHTML = fullHtml;

  let acc = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  let lastTextNode: Text | null = null;
  let lastNodeEnd = 0;
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    const len = t.length;
    const nodeEnd = acc + len;
    if (startNode === null && textStart < nodeEnd) {
      startNode = t;
      startOffset = Math.max(0, textStart - acc);
    }
    if (endNode === null && textEnd <= nodeEnd) {
      endNode = t;
      endOffset = Math.max(0, textEnd - acc);
    }
    acc = nodeEnd;
    lastTextNode = t;
    lastNodeEnd = nodeEnd;
    if (startNode && endNode) break;
  }

  // 边界场景：textStart 恰好为总长度（仅追加），把起点放到最末尾文本节点末尾
  if (!startNode && lastTextNode && textStart === lastNodeEnd) {
    startNode = lastTextNode;
    startOffset = lastTextNode.length;
  }
  // textEnd 恰好为总长度，对齐到最末尾文本节点末尾
  if (!endNode && lastTextNode && textEnd === lastNodeEnd) {
    endNode = lastTextNode;
    endOffset = lastTextNode.length;
  }

  if (!startNode || !endNode) throw new PolishApplyError('SPLICE_FAILED');

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  range.deleteContents();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = polishedHtml;
  const frag = document.createDocumentFragment();
  while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
  range.insertNode(frag);

  return host.innerHTML;
}

/**
 * 用最新 store 中的 fullHtml 做替换，并校验选区原文未被其他路径修改。
 * 失败分三类：
 * - CONTENT_CHANGED：原选区范围在最新 HTML 中已与快照文本不一致（他处并发编辑）
 * - SPLICE_FAILED：文本偏移未命中任何文本节点（通常是 DOM 结构与偏移漂移）
 * - TARGET_MISSING：handler.write 返回 null，目标条目已不存在（如对应 work / project 被删除）
 *
 * 读写路径都走 polish-handlers 注册表，新模块只需在 polish-handlers.ts 注册一次。
 *
 * 实现使用 useResumeStore.update 的函数式重载，把 read-modify-write 收敛到 store 的同一次
 * set 内：避免快照-计算-写入之间被任何潜在的并发更新覆盖。失败信号通过抛出 PolishApplyError
 * 透传给 handleAccept，由 UI 给出对应 toast，而不是静默吞掉。
 */
function applyToStore(
  module: string,
  itemIndex: number,
  snapshotFullHtml: string,
  textStart: number,
  textEnd: number,
  polishedHtml: string,
) {
  const { update } = useResumeStore.getState();
  const handler = getPolishHandler(module);

  // applyError 暂存函数式回调里的失败原因，回调内不能直接抛（会被 zustand 内部 set 包裹），
  // 等回调返回 null 跳过 update 后再抛到外层。
  let applyError: PolishApplyError | null = null;

  update((latest) => {
    const latestFullHtml = handler.read(latest, itemIndex);
    const fullHtml = latestFullHtml ?? snapshotFullHtml;

    // 校验偏移区间的原文与快照一致，避免覆盖他处并发编辑。
    const latestText = extractText(fullHtml);
    const snapshotText = extractText(snapshotFullHtml);
    if (
      textStart > latestText.length ||
      textEnd > latestText.length ||
      latestText.slice(textStart, textEnd) !== snapshotText.slice(textStart, textEnd)
    ) {
      applyError = new PolishApplyError('CONTENT_CHANGED');
      return null;
    }

    let newHtml: string;
    try {
      newHtml = spliceHtmlByTextRange(fullHtml, textStart, textEnd, polishedHtml);
    } catch (err) {
      applyError = err instanceof PolishApplyError ? err : new PolishApplyError('SPLICE_FAILED');
      return null;
    }

    const patch = handler.write(latest, itemIndex, newHtml);
    if (!patch) {
      applyError = new PolishApplyError('TARGET_MISSING');
      return null;
    }
    return patch;
  });

  if (applyError) throw applyError;
}

// ─── 流式片段解析 ─────────────────────────────────────────────────────────────

/**
 * 从流式累积的原始 JSON 文本中提取指定字段的字符串值，能识别字符串内的转义。
 * 主路径走标准 JSON.parse；流式中走状态机扫描；混合 markdown 分支保留为旧版兼容。
 */
function extractStreamingField(raw: string, field: 'html'): string {
  const trimmed = raw.trim().replace(/^```(?:json|JSON)?\s*/i, '');

  // 完整 JSON 已就绪
  try {
    const parsed = JSON.parse(trimmed.replace(/\s*```$/, '').trim()) as Record<string, unknown>;
    const v = parsed[field];
    if (typeof v === 'string') return v;
  } catch {}

  // 兼容历史：极少数模型仍会把 html 输出为 JSON 对象 + markdown 代码块
  if (field === 'html') {
    let depth = 0, inStr = false, esc = false, jsonEnd = -1;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { jsonEnd = i; break; } }
    }
    if (jsonEnd > 0) {
      const rest = trimmed.slice(jsonEnd + 1).trim();
      if (rest.startsWith('`')) {
        return rest.replace(/^```(?:html|HTML)?\s*\n?/i, '').replace(/\s*```\s*$/, '');
      }
    }
  }

  // 流式 / 未闭合：按状态机扫描 "field":"..." 的值
  const re = new RegExp(`"${field}"\\s*:\\s*"`);
  const keyMatch = trimmed.match(re);
  if (!keyMatch || keyMatch.index === undefined) return '';
  const valueStart = keyMatch.index + keyMatch[0].length;
  let result = '';
  for (let i = valueStart; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\\') {
      if (i + 1 >= trimmed.length) break; // 转义不完整，保留到下一次拼接
      const next = trimmed[++i];
      if (next === '"') result += '"';
      else if (next === 'n') result += '\n';
      else if (next === 'r') result += '\r';
      else if (next === 't') result += '\t';
      else if (next === '\\') result += '\\';
      else if (next === '/') result += '/';
      else if (next === 'b') result += '\b';
      else if (next === 'f') result += '\f';
      else if (next === 'u') {
        if (i + 4 >= trimmed.length) break; // 4 位 hex 尚未全部到达
        const hex = trimmed.slice(i + 1, i + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) { result += 'u' + hex; i += 4; continue; }
        result += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else {
        result += next;
      }
    } else if (ch === '"') {
      break;
    } else {
      result += ch;
    }
  }
  return result;
}

/** 去掉末尾未闭合的 HTML 标签，避免浏览器把 `<strong` 渲染成文本 */
function stripUnclosedTrailingTag(html: string): string {
  const lastOpen = html.lastIndexOf('<');
  if (lastOpen === -1) return html;
  if (html.indexOf('>', lastOpen) === -1) return html.slice(0, lastOpen);
  return html;
}

// ─── HTML 截断 ────────────────────────────────────────────────────────────────

/**
 * 截断 HTML 使其只显示前 maxChars 个文本字符（按 Unicode code point 计），保持标签结构完整。
 * 关键点：使用 Array.from 而非 string.slice，避免在 emoji（surrogate pair）或扩展 CJK 边界
 * 切断渲染为 �。预算口径与 utils/text-diff.ts 的 countWords 保持一致。
 */
function truncateHtmlToChars(html: string, maxChars: number): string {
  if (!html || maxChars <= 0) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  let remaining = maxChars;
  const walk = (node: Node) => {
    if (remaining <= 0) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const codePoints = Array.from(text);
      if (codePoints.length <= remaining) { remaining -= codePoints.length; return; }
      node.textContent = codePoints.slice(0, remaining).join('');
      remaining = 0;
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const kids = Array.from(node.childNodes);
      for (let i = 0; i < kids.length; i++) {
        if (remaining <= 0) { for (let j = i; j < kids.length; j++) node.removeChild(kids[j]); break; }
        walk(kids[i]);
      }
    }
  };
  walk(div);
  return div.innerHTML;
}

// ─── PolishDialog ─────────────────────────────────────────────────────────────

type Phase = 'idle' | 'loading' | 'result' | 'error';

export function PolishDialog() {
  const { t } = useTranslation();
  const polishDialog = useUIStore((s) => s.polishDialog);
  const closePolishDialog = useUIStore((s) => s.closePolishDialog);

  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<PolishResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastOperation, setLastOperation] = useState<PolishOperation>('optimize');
  const [streamingHtml, setStreamingHtml] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const initialRunRef = useRef(false);

  // 流式动画：目标 HTML（AI 最新输出）与已显示字数解耦，以固定速率推进
  const targetHtmlRef = useRef('');
  const targetTextLenRef = useRef(0);
  const displayedLenRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const prevRafTimeRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  const stopStreamAnim = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    prevRafTimeRef.current = 0;
    lastUpdateTimeRef.current = 0;
  }, []);

  const startStreamAnim = useCallback(() => {
    if (rafRef.current !== null) return;
    const step = (ts: number) => {
      if (prevRafTimeRef.current === 0) prevRafTimeRef.current = ts;
      const dt = ts - prevRafTimeRef.current;
      prevRafTimeRef.current = ts;
      const add = Math.max(1, Math.round((dt / 1000) * STREAM_CHARS_PER_SEC));
      const next = Math.min(displayedLenRef.current + add, targetTextLenRef.current);
      const reached = next >= targetTextLenRef.current;
      if (next !== displayedLenRef.current) {
        displayedLenRef.current = next;
        // setState 节流：每 RENDER_INTERVAL_MS 才重建一次 DOM；终点强制刷新
        if (ts - lastUpdateTimeRef.current >= RENDER_INTERVAL_MS || reached) {
          lastUpdateTimeRef.current = ts;
          setStreamingHtml(truncateHtmlToChars(targetHtmlRef.current, next));
        }
      }
      if (next < targetTextLenRef.current) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        prevRafTimeRef.current = 0;
        lastUpdateTimeRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => stopStreamAnim(), [stopStreamAnim]);

  const hasChanges = useMemo(() => {
    if (!polishDialog || !result) return false;
    return extractText(polishDialog.originalHtml).trim() !== extractText(result.html).trim();
  }, [polishDialog, result]);

  const highlightedHtml = useMemo(() => {
    if (!polishDialog || !result) return '';
    if (!hasChanges) return result.html;
    return applyInlineDiff(polishDialog.originalHtml, result.html);
  }, [polishDialog, result, hasChanges]);

  const origWordCount = useMemo(
    () => (polishDialog ? countWords(polishDialog.originalHtml) : 0),
    [polishDialog],
  );

  const resultWordCount = useMemo(
    () => (result ? countWords(result.html) : 0),
    [result],
  );

  const wordDeltaLabel = useMemo(() => {
    if (!result || origWordCount === 0) return '';
    const delta = resultWordCount - origWordCount;
    const pct = Math.round(Math.abs(delta / origWordCount) * 100);
    if (pct === 0) return '';
    return t('editor.polish.wordDelta', { sign: delta > 0 ? '+' : '-', percent: pct });
  }, [result, origWordCount, resultWordCount, t]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    requestIdRef.current++;
    stopStreamAnim();
    targetHtmlRef.current = '';
    targetTextLenRef.current = 0;
    displayedLenRef.current = 0;
    setPhase('idle');
    setResult(null);
    setErrorMsg('');
    setStreamingHtml('');
    setShowDiff(false);
    initialRunRef.current = false;
    closePolishDialog();
  }, [closePolishDialog, stopStreamAnim]);

  const runPolish = useCallback(
    async (op: PolishOperation) => {
      if (!polishDialog) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const id = ++requestIdRef.current;
      setLastOperation(op);
      setPhase('loading');
      setResult(null);
      setErrorMsg('');
      setStreamingHtml('');
      setShowDiff(false);
      targetHtmlRef.current = '';
      targetTextLenRef.current = 0;
      displayedLenRef.current = 0;
      try {
        const res = await polishHtmlStream(
          polishDialog.originalHtml,
          op,
          undefined,
          (raw) => {
            if (id !== requestIdRef.current) return;
            const html = stripUnclosedTrailingTag(extractStreamingField(raw, 'html'));
            targetHtmlRef.current = html;
            targetTextLenRef.current = Array.from(extractText(html)).length;
            startStreamAnim();
          },
          controller.signal,
        );
        if (id !== requestIdRef.current) return;
        stopStreamAnim();
        setStreamingHtml('');
        // 兜底：若模型仍输出了与原文相同的 html，强制视为无变化
        const finalHtml = extractText(res.html).trim();
        const origHtml = extractText(polishDialog.originalHtml).trim();
        if (finalHtml === origHtml) {
          // 强制设置为"无需修改"状态，避免模型返回的等价 HTML 造成误替换。
          setResult({ html: polishDialog.originalHtml });
          setShowDiff(true); // 无需修改时默认显示对比状态
        } else {
          setResult(res);
          setShowDiff(false); // 有改动时默认显示预览状态
        }
        setPhase('result');
      } catch (err) {
        if (id !== requestIdRef.current) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorMsg(err instanceof Error ? err.message : t('editor.polish.errorFailed'));
        setPhase('error');
      }
    },
    [polishDialog, t, startStreamAnim, stopStreamAnim],
  );

  // 打开时若有 initialOperation 则自动执行
  useEffect(() => {
    if (!polishDialog || initialRunRef.current) return;
    initialRunRef.current = true;
    const op = polishDialog.initialOperation ?? 'optimize';
    runPolish(op);
  }, [polishDialog, runPolish]);

  const handleAccept = useCallback(() => {
    if (!polishDialog || !result || !hasChanges) return;
    try {
      applyToStore(
        polishDialog.module,
        polishDialog.itemIndex,
        polishDialog.fullHtml,
        polishDialog.textStart,
        polishDialog.textEnd,
        result.html,
      );
    } catch (err) {
      // 三类失败信号都给独立提示，避免静默关闭对话框：
      // - CONTENT_CHANGED：原文已被并发改写
      // - TARGET_MISSING：原条目（work / project / customModule）已被删除
      // - SPLICE_FAILED 或其他：偏移漂移，无法定位选区
      let key = 'editor.polish.errorApplyFailed';
      if (err instanceof PolishApplyError) {
        if (err.code === 'CONTENT_CHANGED') key = 'editor.polish.errorContentChanged';
        else if (err.code === 'TARGET_MISSING') key = 'editor.polish.errorTargetMissing';
      }
      toast.error(t(key));
      return;
    }
    toast.success(t('editor.polish.accepted'));
    handleClose();
  }, [polishDialog, result, hasChanges, t, handleClose]);

  const toggleShowDiff = useCallback(() => setShowDiff((v) => !v), []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) handleClose();
    },
    [handleClose],
  );

  // Cmd/Ctrl+Enter：在 dialog 焦点内时确认/重试。Escape 由 Radix Dialog 自身处理。
  const handleDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (phase === 'result' && hasChanges) handleAccept();
        else if (phase === 'idle' || phase === 'error') runPolish(lastOperation);
      }
    },
    [phase, hasChanges, handleAccept, runPolish, lastOperation],
  );

  if (!polishDialog) return null;

  const opLabelKey = lastOperation === 'optimize' ? 'editor.polish.op.aiOptimize' : 'editor.polish.op.aiCondense';

  return (
    <Dialog open={!!polishDialog} onOpenChange={handleOpenChange}>
      <DialogContent
        onKeyDown={handleDialogKeyDown}
        className="flex max-h-[86vh] w-[820px] max-w-[96vw] flex-col gap-0 border border-border bg-popover p-0 sm:max-w-[820px]"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-4 py-3 pr-10 text-left">
          <DialogTitle className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('editor.polish.dialogTitle')}
          </DialogTitle>
        </DialogHeader>

        {/* 内容区 */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          {/* 双栏对比 */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
            {/* 共享标题行：两栏 header 同行确保等高 */}
            <div className="flex h-8 shrink-0 border-b">
              <div className="flex h-full flex-1 items-center justify-between bg-muted/60 px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('editor.polish.originalLabel')}
                </span>
                {origWordCount > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {t('editor.polish.wordCount', { count: origWordCount })}
                  </span>
                )}
              </div>
              <div className="w-px shrink-0 bg-border" />
              <div className="flex h-full flex-1 items-center justify-between bg-gray-100 px-3 dark:bg-gray-800">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  {t('editor.polish.polishedLabel')}
                </span>
                <div className="flex h-5 items-center gap-2">
                  {phase === 'result' && result && (
                    <button
                      type="button"
                      aria-pressed={showDiff ? 'true' : 'false'}
                      onClick={toggleShowDiff}
                      className="flex h-5 items-center gap-1 rounded bg-gray-100 px-2 text-[11px] leading-none text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                      {!showDiff ? <Eye className="h-3 w-3" aria-hidden="true" /> : <ArrowLeftRight className="h-3 w-3" aria-hidden="true" />}
                      {!showDiff ? t('editor.polish.viewPreview') : t('editor.polish.viewDiff')}
                    </button>
                  )}
                  {phase === 'result' && result && resultWordCount > 0 && (
                    <span
                      className="text-[11px] leading-none text-emerald-600 dark:text-emerald-400"
                    >
                      {t('editor.polish.wordCount', { count: resultWordCount })}
                      {wordDeltaLabel && <span className="ml-1">({wordDeltaLabel})</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* 内容行：高度自适应，被父容器 max-h-[86vh] 约束 */}
            <div className="flex min-h-[200px] flex-1">
              <div className="min-w-0 flex-1 overflow-y-auto px-6 py-4">
                <RichContent content={polishDialog.originalHtml} className="text-sm text-foreground" textSize="" />
              </div>
              <div className="w-px shrink-0 bg-border" />
              <div className="min-w-0 flex-1 overflow-y-auto px-6 py-4" aria-live="polite" aria-atomic="false">
                {phase === 'loading' && (() => {
                  if (streamingHtml) return (
                    <div
                      className="rich-content text-sm text-foreground"
                      dangerouslySetInnerHTML={{ __html: streamingHtml }}
                    />
                  );
                  return (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                      <span className="text-xs text-muted-foreground">{t(`editor.polish.loadingOp.${lastOperation}`)}</span>
                    </div>
                  );
                })()}
                {phase === 'result' && result && (
                  hasChanges
                    ? (
                      <div
                        className="rich-content text-sm text-foreground"
                        dangerouslySetInnerHTML={{ __html: showDiff ? highlightedHtml : result.html }}
                      />
                    )
                    : (
                      showDiff
                        ? (
                          <div className="flex h-full items-center justify-center gap-2 text-center">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            <p className="text-xs text-muted-foreground">{t('editor.polish.noChanges')}</p>
                          </div>
                        )
                        : (
                          <RichContent content={result.html} className="text-sm text-foreground" textSize="" />
                        )
                    )
                )}
                {phase === 'error' && (
                  <p className="text-xs text-destructive" role="alert">{errorMsg}</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            disabled={phase === 'loading'}
            onClick={() => runPolish(lastOperation)}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('editor.polish.retryWithOp', { op: t(opLabelKey) })}
          </Button>
          <div className="flex items-center gap-2">
            {!(phase === 'result' && !hasChanges) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground focus-visible:ring-0"
                disabled={phase === 'loading'}
                onClick={handleClose}
              >
                {t('editor.polish.discard')}
              </Button>
            )}
            {phase === 'result' && hasChanges ? (
              <Button size="sm" className="h-8 px-3 text-xs" onClick={handleAccept}>
                {t('editor.polish.accept')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={phase === 'loading' || phase === 'idle'}
                onClick={phase === 'result' ? handleClose : undefined}
              >
                {phase === 'result' ? t('common.close') : t('editor.polish.accept')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
