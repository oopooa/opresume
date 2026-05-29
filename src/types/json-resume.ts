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
  /** 可选：按语言（语言码，如 'zh-CN' / 'en-US'）覆盖标题，实现中英切换。命中当前语言则优先于 title */
  titleLocales?: Record<string, string>;
  /** 可选：按语言覆盖正文 HTML，实现中英切换。命中当前语言则优先于 contentHtml */
  contentHtmlLocales?: Record<string, string>;
}

export interface JsonResume extends JsonResumeBase {
  'x-op-avatar'?: Avatar;
  'x-op-birthday'?: string;
  'x-op-ageHidden'?: boolean;
  'x-op-workExpYear'?: string;
  'x-op-customFields'?: Array<{ id?: string; key: string; value: string; url?: string }>;
  'x-op-aboutmeHtml'?: string;
  'x-op-customModules'?: CustomModule[];
  'x-op-moduleLayout'?: Record<string, ModuleLayout>;
  'x-op-moduleHidden'?: Record<string, boolean>;
  'x-op-titleNameMap'?: Record<string, string>;
  'x-op-theme'?: ThemeConfig;
  'x-op-layout'?: LayoutConfig;
  'x-op-locales'?: Record<string, Partial<JsonResume>>;
  'x-op-publications'?: JsonPublication[];
  'x-op-grants'?: JsonGrant[];
  'x-op-posters'?: JsonPoster[];
  'x-op-teaching'?: JsonTeaching[];
}

export interface JsonEducation extends ResumeEducation {
  'x-op-id'?: string;
  'x-op-advisor'?: string;
}

export interface JsonWork extends ResumeWork {
  'x-op-id'?: string;
  'x-op-departmentName'?: string;
  'x-op-workDescHtml'?: string;
  'x-op-advisor'?: string;
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

/** 教学经历条目（用于 teachingList 模块） */
export interface JsonTeaching extends ResumeWork {
  'x-op-id'?: string;
  'x-op-departmentName'?: string;
  'x-op-workDescHtml'?: string;
  'x-op-advisor'?: string;
}

/** 学术出版物条目（用于 publicationList 模块） */
export interface JsonPublication {
  'x-op-id'?: string;
  authors?: string;
  selfAuthor?: string;
  title?: string;
  venue?: string;
  year?: string;
  doi?: string;
  url?: string;
  note?: string;
  category?: 'first' | 'contributing';
}

/** 学术资助/经费条目（用于 grantList 模块） */
export interface JsonGrant {
  'x-op-id'?: string;
  title?: string;
  agency?: string;
  grantId?: string;
  role?: string;
  total?: string;
  startDate?: string;
  endDate?: string;
}

/** 海报展示条目（用于 posterList 模块） */
export interface JsonPoster {
  'x-op-id'?: string;
  authors?: string;
  selfAuthor?: string;
  title?: string;
  venue?: string;
  year?: string;
}
