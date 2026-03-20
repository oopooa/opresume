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
  /** 隐藏字段标签（适用于单字段模块，标签与模块标题重复时） */
  hideLabel?: boolean;
  /** time-range 类型的结束日期字段名（用于 startDate/endDate 分离存储） */
  endKey?: string;
  /** 从数据模型读取值时的转换（如 roles 数组 → 字符串） */
  readTransform?: (value: unknown) => unknown;
  /** 向数据模型写入值时的转换（如 字符串 → roles 数组） */
  writeTransform?: (value: unknown) => unknown;
}

export interface ModuleSchema {
  module: string;
  dataKey: string;
  isList: boolean;
  fields: FieldDef[];
  titleKey?: string;
  defaultItem?: () => Record<string, unknown>;
  /** 从共享数组中过滤子集（如从 projects 按 x-op-type 过滤） */
  filter?: (item: Record<string, unknown>) => boolean;
  /** dataKey 指向标量值而非对象/数组（如 aboutme 的 x-op-aboutmeHtml） */
  isScalar?: boolean;
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
      { key: 'label', labelKey: 'field.positionTitle', type: 'text' },
      { key: 'phone', labelKey: 'field.mobile', type: 'tel' },
      { key: 'email', labelKey: 'field.email', type: 'text' },
      { key: 'workPlace', labelKey: 'field.workPlace', type: 'text' },
      { key: 'workExpYear', labelKey: 'field.workExpYear', type: 'text' },
    ],
  },
  {
    module: 'educationList',
    dataKey: 'education',
    isList: true,
    titleKey: 'institution',
    fields: [
      { key: 'institution', labelKey: 'field.school', type: 'text' },
      { key: 'area', labelKey: 'field.major', type: 'text' },
      { key: 'studyType', labelKey: 'field.academicDegree', type: 'text' },
      { key: 'startDate', labelKey: 'field.eduTime', type: 'time-range', endKey: 'endDate' },
    ],
    defaultItem: () => ({ 'x-op-id': uid('edu'), institution: '', area: '', studyType: '', startDate: '', endDate: '' }),
  },
  {
    module: 'workExpList',
    dataKey: 'work',
    isList: true,
    titleKey: 'name',
    fields: [
      { key: 'name', labelKey: 'field.companyName', type: 'text' },
      { key: 'x-op-departmentName', labelKey: 'field.departmentName', type: 'text' },
      { key: 'startDate', labelKey: 'field.workTime', type: 'time-range', showPresent: true, endKey: 'endDate' },
      { key: 'x-op-workDescHtml', labelKey: 'field.workDesc', type: 'markdown' },
    ],
    defaultItem: () => ({ 'x-op-id': uid('work'), name: '', 'x-op-departmentName': '', startDate: '', endDate: '', 'x-op-workDescHtml': '' }),
  },
  {
    module: 'projectList',
    dataKey: 'projects',
    isList: true,
    titleKey: 'name',
    filter: (item) => !item['x-op-type'] || item['x-op-type'] === 'project',
    fields: [
      { key: 'name', labelKey: 'field.projectName', type: 'text' },
      {
        key: 'roles',
        labelKey: 'field.projectRole',
        type: 'text',
        readTransform: (v) => (Array.isArray(v) ? v[0] ?? '' : v ?? ''),
        writeTransform: (v) => (v ? [v as string] : []),
      },
      { key: 'startDate', labelKey: 'field.projectTime', type: 'time-range', showPresent: true, endKey: 'endDate' },
      { key: 'description', labelKey: 'field.projectDesc', type: 'textarea' },
      { key: 'x-op-projectContentHtml', labelKey: 'field.projectContent', type: 'markdown' },
    ],
    defaultItem: () => ({ 'x-op-id': uid('proj'), 'x-op-type': 'project', name: '', roles: [], startDate: '', endDate: '', description: '', 'x-op-projectContentHtml': '' }),
  },
  {
    module: 'skillList',
    dataKey: 'skills',
    isList: true,
    titleKey: 'name',
    fields: [
      { key: 'name', labelKey: 'field.skillName', type: 'text' },
      { key: 'x-op-skillLevel', labelKey: 'field.skillLevel', type: 'number' },
      { key: 'level', labelKey: 'field.skillDesc', type: 'text' },
    ],
    defaultItem: () => ({ 'x-op-id': uid('skill'), name: '', 'x-op-skillLevel': 50, level: '' }),
  },
  {
    module: 'awardList',
    dataKey: 'awards',
    isList: true,
    titleKey: 'title',
    fields: [
      { key: 'title', labelKey: 'field.awardInfo', type: 'text' },
      { key: 'date', labelKey: 'field.awardTime', type: 'text' },
    ],
    defaultItem: () => ({ 'x-op-id': uid('award'), title: '', date: '' }),
  },
  {
    module: 'workList',
    dataKey: 'projects',
    isList: true,
    titleKey: 'name',
    filter: (item) => item['x-op-type'] === 'portfolio',
    fields: [
      { key: 'name', labelKey: 'field.workName', type: 'text' },
      { key: 'description', labelKey: 'field.workItemDesc', type: 'textarea' },
      { key: 'url', labelKey: 'field.visitLink', type: 'text' },
    ],
    defaultItem: () => ({ 'x-op-id': uid('portfolio'), 'x-op-type': 'portfolio', name: '', description: '', url: '' }),
  },
  {
    module: 'aboutme',
    dataKey: 'x-op-aboutmeHtml',
    isList: false,
    isScalar: true,
    fields: [
      { key: 'aboutmeHtml', labelKey: 'field.aboutmeDesc', type: 'markdown', hideLabel: true },
    ],
  },
];

export function getSchema(module: string) {
  return schemas.find((s) => s.module === module);
}
