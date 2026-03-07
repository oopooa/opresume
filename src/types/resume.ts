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

export interface Profile {
  name: string;
  birthday?: string;
  ageHidden?: boolean;
  mobile?: string;
  email?: string;
  workExpYear?: string;
  workPlace?: string;
  positionTitle?: string;
  customFields?: CustomField[];
}

export interface Education {
  id: string;
  eduTime: [string?, string?];
  school: string;
  major?: string;
  academicDegree?: string;
}

export interface WorkExp {
  id: string;
  companyName: string;
  departmentName?: string;
  workTime?: [string?, string?];
  workDesc: string;
}

export interface Project {
  id: string;
  projectName: string;
  projectRole?: string;
  projectDesc?: string;
  projectContent?: string;
  projectTime?: [string?, string?];
}

export interface Skill {
  id: string;
  skillName?: string;
  skillLevel?: number;
  skillDesc?: string;
}

export interface Award {
  id: string;
  awardInfo: string;
  awardTime?: string;
}

export interface Work {
  id: string;
  workName?: string;
  workDesc?: string;
  visitLink?: string;
}

export interface AboutMe {
  aboutmeDesc: string;
}

/** 模块在模板中的分栏布局（不含 profile，profile 固定在侧栏首位） */
export interface ModuleLayout {
  sidebar: string[];
  main: string[];
}

export interface ResumeConfig {
  avatar?: Avatar;
  profile?: Profile;
  educationList?: Education[];
  workExpList?: WorkExp[];
  projectList?: Project[];
  skillList?: Skill[];
  awardList?: Award[];
  workList?: Work[];
  aboutme?: AboutMe;
  titleNameMap?: Record<string, string>;
  moduleHidden?: Record<string, boolean>;
  /** 按模板 ID 存储模块布局，键为模板名如 "template1" */
  moduleLayout?: Record<string, ModuleLayout>;
  locales?: Record<string, Partial<ResumeConfig>>;
}
