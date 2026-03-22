import { useEffect } from 'react';
import { useUIStore } from '@/store/ui';
import type { SpacingPreset } from '@/types';

/** 页边距预设 → CSS 值（上下 y 稍窄、左右 x 稍宽，视觉更稳重） */
const PAGE_MARGIN: Record<SpacingPreset, { y: string; x: string }> = {
  compact: { y: '10mm', x: '12mm' },
  standard: { y: '16mm', x: '18mm' },
  spacious: { y: '22mm', x: '24mm' },
};

/** 模块间距预设 → CSS 值（px） */
const MODULE_GAP: Record<SpacingPreset, string> = {
  compact: '16px',
  standard: '24px',
  spacious: '32px',
};

export function useThemeEffect() {
  const theme = useUIStore((s) => s.theme);
  const layout = useUIStore((s) => s.layout);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--resume-primary', theme.color);
    root.style.setProperty('--resume-tag', theme.tagColor);
    const margin = PAGE_MARGIN[layout.pageMargin];
    root.style.setProperty('--resume-page-padding', `${margin.y} ${margin.x}`);
    root.style.setProperty('--resume-page-padding-x', margin.x);
    root.style.setProperty('--resume-module-gap', MODULE_GAP[layout.moduleGap]);
    root.style.setProperty('--resume-title-size', `${layout.titleFontSize}px`);
    root.style.setProperty('--resume-body-size', `${layout.bodyFontSize}px`);
    root.style.setProperty('--resume-line-height', String(layout.lineHeight));
  }, [theme.color, theme.tagColor, layout.pageMargin, layout.moduleGap, layout.titleFontSize, layout.bodyFontSize, layout.lineHeight]);
}
