import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import type { ResumeConfig } from '@/types';
import type { TemplateDefinition } from './types';
import { useUIStore } from '@/store/ui';
import { useTemplateModules, renderPageSlices } from './modules';
import { definitions, defaultDefinition } from './templates';
import { getEffectiveLayout } from '@/config/layout';
import { measureFromDOM, allocatePages } from '@/utils/pagination';
import type { PageAllocation } from '@/utils/pagination';

/* ---------- 原始单页渲染（用于测量和双栏模板） ---------- */

function TemplateRenderer({ def, config }: { def: TemplateDefinition; config: ResumeConfig }) {
  const { sidebarContent, mainContent } = useTemplateModules(def, config);
  const Shell = def.LayoutShell;
  return (
    <div className="resume-layout">
      <Shell config={config} sidebarContent={sidebarContent} mainContent={mainContent} />
    </div>
  );
}

/* ---------- 判断模板是否支持分页 ---------- */

function supportsPagination(def: TemplateDefinition, config: ResumeConfig): boolean {
  const layout = getEffectiveLayout(def.id, config.moduleLayout);
  // 双栏模板（sidebar 有模块）不分页
  return layout.sidebar.length === 0;
}

/* ---------- 分页渲染 ---------- */

function PaginatedResumeView({ def, config }: { def: TemplateDefinition; config: ResumeConfig }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageAllocation[] | null>(null);
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
        <div className="flex flex-col items-center gap-8 print:gap-0">
          {pages.map((page, i) => {
            const mainContent = renderPageSlices(page.slices, config, tokens);
            return (
              <div key={i} className="resume-page h-[297mm] w-[210mm] overflow-hidden">
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
    </>
  );
}

/* ---------- 入口 ---------- */

export function ResumeView({ config, templateId, disablePagination }: { config: ResumeConfig; templateId?: string; disablePagination?: boolean }) {
  const storeTemplate = useUIStore((s) => s.template);
  const def = definitions[templateId ?? storeTemplate] ?? defaultDefinition;

  if (!disablePagination && supportsPagination(def, config)) {
    return <PaginatedResumeView def={def} config={config} />;
  }

  return <TemplateRenderer def={def} config={config} />;
}
