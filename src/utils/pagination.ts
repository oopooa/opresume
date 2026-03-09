import type { SpacingPreset } from '@/types';

/* ------------------------------------------------------------------ */
/*  类型定义                                                           */
/* ------------------------------------------------------------------ */

/** 单个条目的测量结果 */
interface ItemMeasure {
  /** 条目索引 */
  index: number;
  /** 条目高度（px） */
  height: number;
  /** 条目底边相对于模块顶边的偏移（px），含间距 */
  bottom: number;
  /** 条目顶边相对于模块顶边的偏移（px） */
  top: number;
}

/** 单个模块的测量结果 */
export interface ModuleMeasure {
  moduleKey: string;
  /** 模块总高度（px） */
  totalHeight: number;
  /** 模块内的条目测量（按 data-item-index 排列） */
  items: ItemMeasure[];
  /** 标题高度：第一个条目顶边相对于模块顶边的距离（无条目时等于 totalHeight） */
  titleHeight: number;
}

/** 整个简历的测量结果 */
export interface ResumeMeasurement {
  /** Profile 区域占用高度（px），即第一个模块顶边相对于内容区顶边的距离 */
  profileHeight: number;
  /** 各模块测量 */
  modules: ModuleMeasure[];
  /** 模块间距（px） */
  moduleGap: number;
  /** 单页内容可用高度（px） */
  pageContentHeight: number;
}

/** 单页中某个模块的渲染片段 */
export interface PageSlice {
  moduleKey: string;
  /** 条目渲染范围 [start, end) */
  startItem: number;
  endItem: number;
  /** 是否显示模块标题（续页第一个片段为 false） */
  showTitle: boolean;
}

/** 单页的分配结果 */
export interface PageAllocation {
  slices: PageSlice[];
}

/* ------------------------------------------------------------------ */
/*  页边距常量（与 useThemeEffect 保持一致）                             */
/* ------------------------------------------------------------------ */

const PAGE_MARGIN_Y: Record<SpacingPreset, number> = {
  compact: 10,
  standard: 16,
  spacious: 22,
};

const MODULE_GAP_PX: Record<SpacingPreset, number> = {
  compact: 16,
  standard: 24,
  spacious: 32,
};

/** A4 高度（mm） */
const A4_HEIGHT_MM = 297;

/* ------------------------------------------------------------------ */
/*  DOM 测量                                                           */
/* ------------------------------------------------------------------ */

/**
 * 从测量容器的 DOM 中提取简历各模块和条目的尺寸信息。
 *
 * 要求测量容器内部渲染了完整简历（与 LayoutShell 结构一致），
 * 且每个模块包装元素带有 `data-module-key` 属性，
 * 每个列表条目带有 `data-item-index` 属性。
 */
export function measureFromDOM(
  container: HTMLElement,
  pageMargin: SpacingPreset,
  moduleGap: SpacingPreset,
): ResumeMeasurement | null {
  // 找到简历的外层容器（w-[210mm] 的元素）
  const resumeOuter = container.querySelector('[class*="w-[210mm]"]') as HTMLElement | null;
  if (!resumeOuter) return null;

  // 找到 .resume-padding 内容区
  const paddingDiv = resumeOuter.querySelector('.resume-padding') as HTMLElement | null;
  if (!paddingDiv) return null;

  const outerRect = resumeOuter.getBoundingClientRect();
  const mmToPx = outerRect.width / 210;
  const marginY = PAGE_MARGIN_Y[pageMargin];
  const pageContentHeight = (A4_HEIGHT_MM - marginY * 2) * mmToPx;
  const gap = MODULE_GAP_PX[moduleGap];

  // 内容区域的绝对起点（padding-top 之后）
  const paddingTopPx = parseFloat(getComputedStyle(paddingDiv).paddingTop);
  const contentStartY = paddingDiv.getBoundingClientRect().top + paddingTopPx;

  // 测量所有模块
  const moduleEls = paddingDiv.querySelectorAll('[data-module-key]');
  const modules: ModuleMeasure[] = [];
  let profileHeight = 0;

  moduleEls.forEach((el, idx) => {
    const moduleEl = el as HTMLElement;
    const moduleKey = moduleEl.getAttribute('data-module-key')!;
    const moduleRect = moduleEl.getBoundingClientRect();
    const moduleTop = moduleRect.top - contentStartY;

    if (idx === 0) {
      profileHeight = moduleTop;
    }

    // 测量模块内的条目
    const itemEls = moduleEl.querySelectorAll('[data-item-index]');
    const items: ItemMeasure[] = [];

    itemEls.forEach((itemNode) => {
      const itemEl = itemNode as HTMLElement;
      const itemIndex = parseInt(itemEl.getAttribute('data-item-index')!, 10);
      const itemRect = itemEl.getBoundingClientRect();
      items.push({
        index: itemIndex,
        height: itemRect.height,
        top: itemRect.top - moduleRect.top,
        bottom: itemRect.bottom - moduleRect.top,
      });
    });

    // 按 index 排序
    items.sort((a, b) => a.index - b.index);

    const titleHeight = items.length > 0 ? items[0].top : moduleRect.height;

    modules.push({
      moduleKey,
      totalHeight: moduleRect.height,
      items,
      titleHeight,
    });
  });

  return {
    profileHeight,
    modules,
    moduleGap: gap,
    pageContentHeight,
  };
}

/* ------------------------------------------------------------------ */
/*  分页分配算法                                                       */
/* ------------------------------------------------------------------ */

/** 标题后至少保留一个条目所需的最小空间（px） */
const MIN_ORPHAN_HEIGHT = 30;

/**
 * 根据测量结果将模块/条目分配到多个页面。
 *
 * 核心规则：
 * 1. 模块标题后必须至少跟随一个条目（孤立标题移到下一页）
 * 2. 单个条目尽量不跨页
 * 3. 超长模块在条目边界处拆分
 */
export function allocatePages(measurement: ResumeMeasurement): PageAllocation[] {
  const { profileHeight, modules, moduleGap, pageContentHeight } = measurement;

  if (modules.length === 0) {
    return [{ slices: [] }];
  }

  const pages: PageAllocation[] = [];
  let currentPage: PageSlice[] = [];

  // 第一页需要减去 Profile 高度
  let remaining = pageContentHeight - profileHeight;
  let isFirstModuleOnPage = true;

  function startNewPage() {
    if (currentPage.length > 0) {
      pages.push({ slices: currentPage });
    }
    currentPage = [];
    remaining = pageContentHeight;
    isFirstModuleOnPage = true;
  }

  for (const mod of modules) {
    // 模块前的间距（非页面首个模块时需要间距）
    const gapBefore = isFirstModuleOnPage ? 0 : moduleGap;
    const availableForModule = remaining - gapBefore;

    if (mod.items.length === 0) {
      // 无条目的模块（如 aboutme）视为原子块
      if (availableForModule >= mod.totalHeight) {
        currentPage.push({
          moduleKey: mod.moduleKey,
          startItem: 0,
          endItem: 0,
          showTitle: true,
        });
        remaining = availableForModule - mod.totalHeight;
        isFirstModuleOnPage = false;
      } else {
        startNewPage();
        currentPage.push({
          moduleKey: mod.moduleKey,
          startItem: 0,
          endItem: 0,
          showTitle: true,
        });
        remaining = pageContentHeight - mod.totalHeight;
        isFirstModuleOnPage = false;
      }
      continue;
    }

    // 整个模块能放下
    if (availableForModule >= mod.totalHeight) {
      currentPage.push({
        moduleKey: mod.moduleKey,
        startItem: 0,
        endItem: mod.items.length,
        showTitle: true,
      });
      remaining = availableForModule - mod.totalHeight;
      isFirstModuleOnPage = false;
      continue;
    }

    // 模块需要拆分 — 尝试条目级拆分
    let itemStart = 0;
    let showTitle = true;

    while (itemStart < mod.items.length) {
      const gap = isFirstModuleOnPage ? 0 : moduleGap;
      let space = remaining - gap;

      if (space <= 0) {
        startNewPage();
        space = pageContentHeight;
      }

      // 计算标题占用的空间
      const titleSpace = showTitle ? mod.titleHeight : 0;

      // 标题 + 至少一个条目能否放下
      const firstItemHeight = mod.items[itemStart].height;
      if (space < titleSpace + firstItemHeight + MIN_ORPHAN_HEIGHT && space < pageContentHeight) {
        // 当前页空间不够放标题+一个条目，翻页
        startNewPage();
        space = pageContentHeight;
      }

      // 贪心填充条目
      let itemEnd = itemStart;
      let usedHeight = titleSpace;

      for (let i = itemStart; i < mod.items.length; i++) {
        const itemH = mod.items[i].height;
        // 条目间距：非首个条目时，条目间有间距
        // 从 DOM 测量中推算：item[i].top - item[i-1].bottom 为间距
        let itemGap = 0;
        if (i > itemStart && i > 0) {
          itemGap = mod.items[i].top - mod.items[i - 1].bottom;
        }

        if (usedHeight + itemGap + itemH <= space) {
          usedHeight += itemGap + itemH;
          itemEnd = i + 1;
        } else {
          break;
        }
      }

      // 如果一个条目都放不下（条目超过整页高度），强制放一个
      if (itemEnd === itemStart) {
        usedHeight += firstItemHeight;
        itemEnd = itemStart + 1;
      }

      currentPage.push({
        moduleKey: mod.moduleKey,
        startItem: itemStart,
        endItem: itemEnd,
        showTitle,
      });

      remaining = (isFirstModuleOnPage ? remaining : remaining - gap) - usedHeight;
      isFirstModuleOnPage = false;

      itemStart = itemEnd;
      showTitle = false; // 续页不显示标题
    }
  }

  // 收尾：将最后一页加入
  if (currentPage.length > 0) {
    pages.push({ slices: currentPage });
  }

  return pages.length > 0 ? pages : [{ slices: [] }];
}
