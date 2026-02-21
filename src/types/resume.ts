export interface Avatar {
  src?: string;
  width?: number;       // px，默认 90
  height?: number;      // px，默认 90
  borderRadius?: number; // px，0=无 8=中等 999=圆形
  hidden?: boolean;
}

export interface Profile {
  name: string;
  mobile?: string;
  email?: string;
  github?: string;
  zhihu?: string;
  workExpYear?: string;
  workPlace?: string;
  positionTitle?: string;
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
  locales?: Record<string, Partial<ResumeConfig>>;
}
