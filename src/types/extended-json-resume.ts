import type {
  JSONResume,
  ResumeEducation,
  ResumeWork,
  ResumeProject,
  ResumeSkill,
  ResumeAward,
} from './json-resume';
import type { Avatar, ModuleLayout } from './resume';
import type { ThemeConfig, LayoutConfig } from './theme';

export interface ExtendedJSONResume extends JSONResume {
  'x-op-avatar'?: Avatar;
  'x-op-birthday'?: string;
  'x-op-ageHidden'?: boolean;
  'x-op-workExpYear'?: string;
  'x-op-customFields'?: Array<{ id?: string; key: string; value: string }>;
  'x-op-aboutmeHtml'?: string;
  'x-op-moduleLayout'?: Record<string, ModuleLayout>;
  'x-op-moduleHidden'?: Record<string, boolean>;
  'x-op-titleNameMap'?: Record<string, string>;
  'x-op-theme'?: ThemeConfig;
  'x-op-layout'?: LayoutConfig;
  'x-op-locales'?: Record<string, Partial<ExtendedJSONResume>>;
}

export interface ExtendedEducation extends ResumeEducation {
  'x-op-id'?: string;
}

export interface ExtendedWork extends ResumeWork {
  'x-op-id'?: string;
  'x-op-departmentName'?: string;
  'x-op-workDescHtml'?: string;
}

export interface ExtendedProject extends ResumeProject {
  'x-op-id'?: string;
  'x-op-type'?: 'project' | 'portfolio';
  'x-op-projectContentHtml'?: string;
}

export interface ExtendedSkill extends ResumeSkill {
  'x-op-id'?: string;
  'x-op-skillLevel'?: number;
}

export interface ExtendedAward extends ResumeAward {
  'x-op-id'?: string;
}
