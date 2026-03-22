export interface ThemeConfig {
  color: string;
  tagColor: string;
}

export interface PresetTheme {
  name: string;
  color: string;
  tagColor: string;
}

/** 排版预设等级 */
export type SpacingPreset = 'compact' | 'standard' | 'spacious';

/** 排版配置 */
export interface LayoutConfig {
  /** 页边距预设 */
  pageMargin: SpacingPreset;
  /** 模块间距预设 */
  moduleGap: SpacingPreset;
  /** 标题字号（px） */
  titleFontSize: number;
  /** 正文字号（px） */
  bodyFontSize: number;
  /** 行间距数值（1.2 – 2.0） */
  lineHeight: number;
}
