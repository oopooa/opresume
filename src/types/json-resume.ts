// JSON Resume Schema 标准类型定义
// https://jsonresume.org/schema/

import type { Avatar, ModuleLayout } from './resume';
import type { ThemeConfig, LayoutConfig } from './theme';

// --- 标准 JSON Resume 基础类型 ---

export interface JsonResumeBase {
  $schema?: string;
  basics?: ResumeBasics;
  work?: ResumeWork[];
  volunteer?: ResumeVolunteer[];
  education?: ResumeEducation[];
  awards?: ResumeAward[];
  certificates?: ResumeCertificate[];
  publications?: ResumePublication[];
  skills?: ResumeSkill[];
  languages?: ResumeLanguage[];
  interests?: ResumeInterest[];
  references?: ResumeReference[];
  projects?: ResumeProject[];
  meta?: ResumeMeta;
}

export interface ResumeBasics {
  name?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: ResumeLocation;
  profiles?: ResumeProfile[];
}

export interface ResumeLocation {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface ResumeProfile {
  network?: string;
  username?: string;
  url?: string;
}

export interface ResumeWork {
  name?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface ResumeVolunteer {
  organization?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface ResumeEducation {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface ResumeAward {
  title?: string;
  date?: string;
  awarder?: string;
  summary?: string;
}

export interface ResumeCertificate {
  name?: string;
  date?: string;
  issuer?: string;
  url?: string;
}

export interface ResumePublication {
  name?: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
}

export interface ResumeSkill {
  name?: string;
  level?: string;
  keywords?: string[];
}

export interface ResumeLanguage {
  language?: string;
  fluency?: string;
}

export interface ResumeInterest {
  name?: string;
  keywords?: string[];
}

export interface ResumeReference {
  name?: string;
  reference?: string;
}

export interface ResumeProject {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
}

export interface ResumeMeta {
  canonical?: string;
  version?: string;
  lastModified?: string;
}

// --- OpResume 扩展类型 ---

/** 自定义模块数据 */
export interface CustomModule {
  /** 唯一标识，格式为 custom-{timestamp} */
  id: string;
  /** 模块标题 */
  title: string;
  /** 富文本 HTML 内容 */
  contentHtml: string;
}

/** 校园模板（template7）修读课程条目 */
export interface CourseItem {
  id?: string;
  text?: string;
}

/** 用户上传的校徽（data URL 形式，随简历存 localStorage） */
export interface SchoolLogo {
  src?: string;
  /** 是否在简历中隐藏校徽 */
  hidden?: boolean;
}

export interface JsonResume extends JsonResumeBase {
  'x-op-avatar'?: Avatar;
  'x-op-schoolLogo'?: SchoolLogo;
  /** 校园模板修读课程（template7） */
  'x-op-courses'?: CourseItem[];
  'x-op-birthday'?: string;
  'x-op-ageHidden'?: boolean;
  'x-op-showJobTitle'?: boolean;
  'x-op-workExpYear'?: string;
  'x-op-customFields'?: Array<{ id?: string; key: string; value: string }>;
  'x-op-aboutmeHtml'?: string;
  'x-op-customModules'?: CustomModule[];
  'x-op-moduleLayout'?: Record<string, ModuleLayout>;
  'x-op-moduleHidden'?: Record<string, boolean>;
  'x-op-titleNameMap'?: Record<string, string>;
  'x-op-theme'?: ThemeConfig;
  'x-op-layout'?: LayoutConfig;
  'x-op-locales'?: Record<string, Partial<JsonResume>>;
}

export interface JsonEducation extends ResumeEducation {
  'x-op-id'?: string;
}

export interface JsonWork extends ResumeWork {
  'x-op-id'?: string;
  'x-op-departmentName'?: string;
  'x-op-workDescHtml'?: string;
}

export interface JsonProject extends ResumeProject {
  'x-op-id'?: string;
  'x-op-type'?: 'project' | 'portfolio';
  'x-op-projectContentHtml'?: string;
}

export interface JsonSkill extends ResumeSkill {
  'x-op-id'?: string;
  'x-op-skillLevel'?: number;
}

export interface JsonAward extends ResumeAward {
  'x-op-id'?: string;
}

export interface JsonPublication extends ResumePublication {
  'x-op-id'?: string;
  'x-op-type'?: string;        // 扩展字段：类型标签（论文/专利/报告等）
  'x-op-identifier'?: string;  // 扩展字段：编号（专利号/DOI等）
}
