import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { JsonResume } from '@/types/json-resume';
import type { TemplateDefinition } from './types';
import { useUIStore } from '@/store/ui';
import { useTemplateModules, renderPageSlices } from './modules';
import { definitions, defaultDefinition } from './templates';
import { getEffectiveLayout } from '@/config/layout';
import { measureFromDOM, allocatePages } from '@/utils/pagination';
import type { PageAllocation } from '@/utils/pagination';

/* ---------- 原始单页渲染（用于测量和双栏模板） ---------- */

function TemplateRenderer({ def, config }: { def: TemplateDefinition; config: JsonResume }) {
  const { sidebarContent, mainContent } = useTemplateModules(def, config);
  const Shell = def.LayoutShell;
  return (
    <div className="resume-layout">
      <Shell config={config} sidebarContent={sidebarContent} mainContent={mainContent} />
    </div>
  );
}

/* ---------- 判断模板是否支持分页 ---------- */

function supportsPagination(def: TemplateDefinition, config: JsonResume): boolean {
  const layout = getEffectiveLayout(def.id, config['x-op-moduleLayout']);
  // 双栏模板（sidebar 有模块）不分页
  return layout.sidebar.length === 0;
}

/* ---------- 页码指示器 ---------- */

function PageIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-black shadow-md print:hidden">
      <FileText className="h-4 w-4" />
      <span>{current} / {total}</span>
    </div>
  );
}

/* ---------- 分页渲染 ---------- */

function PaginatedResumeView({ def, config }: { def: TemplateDefinition; config: JsonResume }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageAllocation[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const layout = useUIStore((s) => s.layout);
  const tokens = def.getTokens();
  const Shell = def.LayoutShell;

  const doMeasure = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;

    const measurement = measureFromDOM(container, layout.pageMargin, layout.moduleGap);
    if (!measurement) return;

    const result = allocatePages(measurement);
    setPages(result);
  }, [layout.pageMargin, layout.moduleGap]);

  // 测量容器渲染后立即测量（同步，避免闪烁）
  useLayoutEffect(() => {
    doMeasure();
  }, [doMeasure, config, layout.lineHeight]);

  // 通过 IntersectionObserver 追踪当前可见页
  useEffect(() => {
    if (!pages || pages.length <= 1) {
      setCurrentPage(1);
      return;
    }
    const container = pagesRef.current;
    if (!container) return;

    const pageEls = container.querySelectorAll<HTMLElement>('[data-page-index]');
    if (pageEls.length === 0) return;

    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-page-index') ?? 0);
          ratios.set(idx, entry.intersectionRatio);
        });

        let maxRatio = 0;
        let maxIdx = 0;
        ratios.forEach((ratio, idx) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            maxIdx = idx;
          }
        });
        if (maxRatio > 0) setCurrentPage(maxIdx + 1);
      },
      { threshold: Array.from({ length: 11 }, (_, i) => i / 10) },
    );

    pageEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages]);

  return (
    <>
      {/* 隐藏测量容器：完整渲染用于 DOM 测量 */}
      <div
        ref={measureRef}
        aria-hidden
        className="resume-measure-container"
      >
        <TemplateRenderer def={def} config={config} />
      </div>

      {/* 分页渲染结果 */}
      {pages && pages.length > 0 ? (
        <div ref={pagesRef} className="flex flex-col items-center gap-8 print:gap-0">
          {pages.map((page, i) => {
            const mainContent = renderPageSlices(page.slices, config, tokens);
            return (
              <div key={i} data-page-index={i} className="resume-page h-[297mm] w-[210mm] overflow-hidden">
                <div className="resume-layout">
                  <Shell
                    config={config}
                    sidebarContent={<></>}
                    mainContent={mainContent}
                    pageIndex={i}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // 测量完成前显示原始渲染（避免空白）
        <TemplateRenderer def={def} config={config} />
      )}

      {/* 页码指示器 */}
      {pages && pages.length > 0 && (
        <PageIndicator current={currentPage} total={pages.length} />
      )}
    </>
  );
}

/* ---------- 入口 ---------- */

export function ResumeView({ config, templateId, disablePagination }: { config: JsonResume; templateId?: string; disablePagination?: boolean }) {
  const storeTemplate = useUIStore((s) => s.template);
  const activeId = templateId ?? storeTemplate;
  const def = definitions[activeId] ?? defaultDefinition;
  const reduceMotion = useReducedMotion();

  const inner =
    !disablePagination && supportsPagination(def, config) ? (
      <PaginatedResumeView def={def} config={config} />
    ) : (
      <TemplateRenderer def={def} config={config} />
    );

  // 简历"从下到上"淡入：duration 1.0s + ease-out quint，足够慢让用户看清整体浮入过程；
  // y 80→0 让位移幅度大一点（之前 60 偏含蓄）；exit 留给模板切换用，淡出快一点不阻塞新模板。
  //
  // motion.div 主动接管布局：用 `flex w-full justify-center` 让它自己作为 flex container
  // 强制内部 inner 水平居中。两次失败都源于把 motion.div 当默认块级 flex item：
  //   1. 不指定 className 时 motion.div 的 flex item width 由内容决定（210mm），
  //      理论上 main `justify-center` 应居中，但实测双栏模板会左对齐 —— 推测 transform
  //      创建了新 stacking context 让 flex 算法对它的尺寸/位置推断不稳。
  //   2. align-items:stretch 把 motion.div 高度撑到 main 内容区高度，内部 resume-page
  //      297mm 远超 stretched 高度，向下 visible overflow 让 main 的 scrollHeight 计算
  //      把顶部 padding 吞掉，简历贴 header。
  // 现在让 motion.div w-full 明确撑满 main，自己作为 flex container 居中 inner，
  // padding 仍由父 main 的 py-8 提供 —— 这样布局完全可预测。
  //
  // key={activeId} + mode="wait"：模板切换时旧模板退出完毕再播新模板，避免 PaginatedResumeView
  // 的 useLayoutEffect 测量在两个模板间互相污染。
  //
  // onAnimationStart 中把父 main 强制滚到顶：
  // 浏览器的 scroll-anchoring 默认会跟随 motion.div 的视觉位置（initial 时 translateY(80)）
  // 自动滚动 main 来"保持视线"，导致动画结束 transform 归零后 main.scrollTop > 0，
  // padding-top 被滚到视口外，用户感觉简历贴 header。手动把 scrollTop 拉回 0 即可。
  const handleAnimationStart = () => {
    // 找到承载滚动的 main（第一层 ancestor 即为 App.tsx 的 main）
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeId}
        className="flex w-full justify-center"
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: 80 }
        }
        animate={{ opacity: 1, y: 0 }}
        exit={
          reduceMotion
            ? { opacity: 0, transition: { duration: 0.18 } }
            : { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeIn' } }
        }
        transition={
          reduceMotion
            ? { duration: 0.25, ease: 'easeOut' }
            : { duration: 1.15, ease: [0.16, 1, 0.3, 1] }
        }
        onAnimationStart={handleAnimationStart}
      >
        {inner}
      </motion.div>
    </AnimatePresence>
  );
}
