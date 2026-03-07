export type FieldType = 'text' | 'textarea' | 'markdown' | 'number' | 'time-range' | 'select' | 'date' | 'tel';

export interface FieldDef {
  key: string;
  labelKey: string;
  type: FieldType;
  options?: { labelKey: string; value: string }[];
  /** 时间范围结束日期是否显示「至今」选项 */
  showPresent?: boolean;
  /** 字段图标名（lucide 图标） */
  icon?: string;
}

export interface ModuleSchema {
  module: string;
  dataKey: string;
  isList: boolean;
  fields: FieldDef[];
  titleKey?: string;
  defaultItem?: () => Record<string, unknown>;
}

let _id = Date.now();
function uid(prefix: string) {
  return `${prefix}-${++_id}`;
}

export const schemas: ModuleSchema[] = [
  {
    module: 'profile',
    dataKey: 'profile',
    isList: false,
    fields: [
      { key: 'name', labelKey: 'field.name', type: 'text' },
      { key: 'birthday', labelKey: 'field.birthday', type: 'date' },
      { key: 'positionTitle', labelKey: 'field.positionTitle', type: 'text' },
      { key: 'mobile', labelKey: 'field.mobile', type: 'tel' },
      { key: 'email', labelKey: 'field.email', type: 'text' },
      { key: 'workExpYear', labelKey: 'field.workExpYear', type: 'text' },
    ],
  },
  {
    module: 'educationList',
    dataKey: 'educationList',
    isList: true,
    titleKey: 'school',
    fields: [
      { key: 'school', labelKey: 'field.school', type: 'text' },
      { key: 'major', labelKey: 'field.major', type: 'text' },
      { key: 'academicDegree', labelKey: 'field.academicDegree', type: 'text' },
      { key: 'eduTime', labelKey: 'field.eduTime', type: 'time-range' },
    ],
    defaultItem: () => ({ id: uid('edu'), school: '', major: '', academicDegree: '', eduTime: ['', ''] }),
  },
  {
    module: 'workExpList',
    dataKey: 'workExpList',
    isList: true,
    titleKey: 'companyName',
    fields: [
      { key: 'companyName', labelKey: 'field.companyName', type: 'text' },
      { key: 'departmentName', labelKey: 'field.departmentName', type: 'text' },
      { key: 'workTime', labelKey: 'field.workTime', type: 'time-range', showPresent: true },
      { key: 'workDesc', labelKey: 'field.workDesc', type: 'markdown' },
    ],
    defaultItem: () => ({ id: uid('work'), companyName: '', departmentName: '', workTime: ['', ''], workDesc: '' }),
  },
  {
    module: 'projectList',
    dataKey: 'projectList',
    isList: true,
    titleKey: 'projectName',
    fields: [
      { key: 'projectName', labelKey: 'field.projectName', type: 'text' },
      { key: 'projectRole', labelKey: 'field.projectRole', type: 'text' },
      { key: 'projectTime', labelKey: 'field.projectTime', type: 'time-range', showPresent: true },
      { key: 'projectDesc', labelKey: 'field.projectDesc', type: 'textarea' },
      { key: 'projectContent', labelKey: 'field.projectContent', type: 'markdown' },
    ],
    defaultItem: () => ({ id: uid('proj'), projectName: '', projectRole: '', projectTime: ['', ''], projectDesc: '', projectContent: '' }),
  },
  {
    module: 'skillList',
    dataKey: 'skillList',
    isList: true,
    titleKey: 'skillName',
    fields: [
      { key: 'skillName', labelKey: 'field.skillName', type: 'text' },
      { key: 'skillLevel', labelKey: 'field.skillLevel', type: 'number' },
      { key: 'skillDesc', labelKey: 'field.skillDesc', type: 'text' },
    ],
    defaultItem: () => ({ id: uid('skill'), skillName: '', skillLevel: 50, skillDesc: '' }),
  },
  {
    module: 'awardList',
    dataKey: 'awardList',
    isList: true,
    titleKey: 'awardInfo',
    fields: [
      { key: 'awardInfo', labelKey: 'field.awardInfo', type: 'text' },
      { key: 'awardTime', labelKey: 'field.awardTime', type: 'text' },
    ],
    defaultItem: () => ({ id: uid('award'), awardInfo: '', awardTime: '' }),
  },
  {
    module: 'workList',
    dataKey: 'workList',
    isList: true,
    titleKey: 'workName',
    fields: [
      { key: 'workName', labelKey: 'field.workName', type: 'text' },
      { key: 'workDesc', labelKey: 'field.workItemDesc', type: 'textarea' },
      { key: 'visitLink', labelKey: 'field.visitLink', type: 'text' },
    ],
    defaultItem: () => ({ id: uid('portfolio'), workName: '', workDesc: '', visitLink: '' }),
  },
  {
    module: 'aboutme',
    dataKey: 'aboutme',
    isList: false,
    fields: [
      { key: 'aboutmeDesc', labelKey: 'field.aboutmeDesc', type: 'markdown' },
    ],
  },
];

export function getSchema(module: string) {
  return schemas.find((s) => s.module === module);
}
