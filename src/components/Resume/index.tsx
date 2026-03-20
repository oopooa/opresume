import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import type { ExtendedJSONResume } from '@/types/extended-json-resume';
import type { TemplateDefinition } from './types';
import { useUIStore } from '@/store/ui';
import { useTemplateModules, renderPageSlices } from './modules';
import { definitions, defaultDefinition } from './templates';
import { getEffectiveLayout } from '@/config/layout';
import { measureFromDOM, allocatePages } from '@/utils/pagination';
import type { PageAllocation } from '@/utils/pagination';

/* ---------- 原始单页渲染（用于测量和双栏模板） ---------- */

function TemplateRenderer({ def, config }: { def: TemplateDefinition; config: ExtendedJSONResume }) {
  const { sidebarContent, mainContent } = useTemplateModules(def, config);
  const Shell = def.LayoutShell;
  return (
    <div className="resume-layout">
      <Shell config={config} sidebarContent={sidebarContent} mainContent={mainContent} />
    </div>
  );
}

/* ---------- 判断模板是否支持分页 ---------- */

function supportsPagination(def: TemplateDefinition, config: ExtendedJSONResume): boolean {
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

function PaginatedResumeView({ def, config }: { def: TemplateDefinition; config: ExtendedJSONResume }) {
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

export function ResumeView({ config, templateId, disablePagination }: { config: ExtendedJSONResume; templateId?: string; disablePagination?: boolean }) {
  const storeTemplate = useUIStore((s) => s.template);
  const def = definitions[templateId ?? storeTemplate] ?? defaultDefinition;

  if (!disablePagination && supportsPagination(def, config)) {
    return <PaginatedResumeView def={def} config={config} />;
  }

  return <TemplateRenderer def={def} config={config} />;
}
