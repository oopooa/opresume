export interface Avatar {
  src?: string;
  width?: number;       // px，默认 90
  height?: number;      // px，默认 90
  borderRadius?: number; // px，0=无 8=中等 999=圆形
  hidden?: boolean;
}

export interface CustomField {
  id?: string;
  key: string;
  value: string;
}

/** 模块在模板中的分栏布局（不含 profile，profile 固定在侧栏首位） */
export interface ModuleLayout {
  sidebar: string[];
  main: string[];
}
