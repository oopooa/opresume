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

/** 纸张尺寸：美式信纸（默认）或 A4 */
export type PageFormat = 'letter' | 'A4';

/** 字号 / 行高排版 — 按模板维度解析（每个模板有自己的默认值，用户调整按模板记忆） */
export interface Typography {
  /** 标题字号（px） */
  titleFontSize: number;
  /** 正文字号（px） */
  bodyFontSize: number;
  /** 行间距数值 */
  lineHeight: number;
}

/** 排版配置 */
export interface LayoutConfig {
  /** 页边距预设 */
  pageMargin: SpacingPreset;
  /** 模块间距预设 */
  moduleGap: SpacingPreset;
  /**
   * 标题字号（px）。
   * @deprecated 字号 / 行高已迁移到「按模板」存储（UIStore.typographyByTemplate）。
   * 这些字段保留仅为兼容旧 localStorage 持久化结构，不再被任何渲染路径读取。
   */
  titleFontSize: number;
  /** @deprecated 见 titleFontSize 说明，已迁移到 typographyByTemplate */
  bodyFontSize: number;
  /** @deprecated 见 titleFontSize 说明，已迁移到 typographyByTemplate */
  lineHeight: number;
}
