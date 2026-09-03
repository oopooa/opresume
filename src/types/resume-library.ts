import type { JsonResume } from './json-resume';

/** 简历库中单个简历的元数据 */
export interface ResumeMeta {
  /** 简历唯一 ID */
  id: string;
  /** 简历名称（用户可编辑） */
  name: string;
  /** 创建时间戳（毫秒） */
  createdAt: number;
  /** 最后更新时间戳（毫秒） */
  updatedAt: number;
}

/** 简历库中的一份简历（元数据 + JSON Resume 数据） */
export interface StoredResume {
  meta: ResumeMeta;
  data: JsonResume;
}

/** 简历库持久化结构（localStorage / 开发环境 data/resumes.json） */
export interface ResumeLibrary {
  /** 当前正在编辑的简历 ID */
  activeId: string;
  resumes: StoredResume[];
}
