// JSON Resume Schema 标准类型定义
// https://jsonresume.org/schema/

export interface JSONResume {
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
