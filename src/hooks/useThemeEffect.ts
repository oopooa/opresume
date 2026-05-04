import { useEffect } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { useUIStore } from '@/store/ui';
import type { SpacingPreset } from '@/types';

/** 页边距预设 → 数值（mm，由 useThemeEffect 注入 CSS 变量时拼接单位） */
const PAGE_MARGIN: Record<SpacingPreset, { y: number; x: number }> = {
  compact: { y: 10, x: 12 },
  standard: { y: 16, x: 18 },
  spacious: { y: 22, x: 24 },
};

/** 模块间距预设 → 数值（px） */
const MODULE_GAP: Record<SpacingPreset, number> = {
  compact: 16,
  standard: 24,
  spacious: 32,
};

/** 间距过渡：与 SpacingPresetGroup 滑块同曲线（ease-out quint）、同时长。
 *  duration 0.6s 偏缓让"撑开/收紧"动作可清晰感知，且与切换器滑块同步完成。 */
const SPACING_TRANSITION = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

/** 用 framer-motion 平滑过渡数值 CSS 变量。
 *  - 起点取 getComputedStyle 当前值（可能是上次未播完的中间值）→ 快速连续切换时不跳回 preset 起点
 *  - reduce motion / 同值 → 直接赋值，返回 noop（统一返回 () => void，调用处无需 optional chaining）
 *  - 否则返回 stop 函数，由 useEffect cleanup 调用 */
function tweenCssVar(
  cssVar: string,
  unit: string,
  to: number,
  reduceMotion: boolean,
): () => void {
  const root = document.documentElement;
  const current = parseFloat(getComputedStyle(root).getPropertyValue(cssVar));
  const from = Number.isFinite(current) ? current : to;

  if (reduceMotion || from === to) {
    root.style.setProperty(cssVar, `${to}${unit}`);
    return () => {};
  }

  const ctrl = animate(from, to, {
    ...SPACING_TRANSITION,
    onUpdate: (v) => root.style.setProperty(cssVar, `${v}${unit}`),
  });
  return () => ctrl.stop();
}

export function useThemeEffect() {
  const theme = useUIStore((s) => s.theme);
  const layout = useUIStore((s) => s.layout);
  const reduceMotion = useReducedMotion() ?? false;

  // 主题色 / 字号 / 行高：直接设置（无动画需求）。
  // 字号 stepper、行高 slider 是连续触发，加动画会让目标值与显示值持续偏离，造成"跟手滞后"感。
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--resume-primary', theme.color);
    root.style.setProperty('--resume-tag', theme.tagColor);
    root.style.setProperty('--resume-title-size', `${layout.titleFontSize}px`);
    root.style.setProperty('--resume-body-size', `${layout.bodyFontSize}px`);
    root.style.setProperty('--resume-line-height', String(layout.lineHeight));
  }, [theme.color, theme.tagColor, layout.titleFontSize, layout.bodyFontSize, layout.lineHeight]);

  // 页边距：framer-motion 平滑过渡 y/x 两个数值，再各自拼回 mm 写入 CSS 变量。
  // 不直接用 animate(root, { '--var': '22mm' })：framer-motion 对带单位字符串 CSS 变量的解析在
  // 不同单位间不稳定，分开 animate 数值再拼单位最可控。
  useEffect(() => {
    const { y, x } = PAGE_MARGIN[layout.pageMargin];
    const stopY = tweenCssVar('--resume-page-padding-y', 'mm', y, reduceMotion);
    const stopX = tweenCssVar('--resume-page-padding-x', 'mm', x, reduceMotion);
    return () => {
      stopY();
      stopX();
    };
  }, [layout.pageMargin, reduceMotion]);

  // 模块间距
  useEffect(() => {
    const stop = tweenCssVar('--resume-module-gap', 'px', MODULE_GAP[layout.moduleGap], reduceMotion);
    return stop;
  }, [layout.moduleGap, reduceMotion]);
}
