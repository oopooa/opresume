/**
 * 老格式兼容层 - 仅用于数据迁移
 */

import type { ResumeConfig } from '@/types';
import type { ExtendedJSONResume } from '@/types/extended-json-resume';
import { migrateMarkdownFields } from './migrate-markdown';

function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function parseHtmlToList(html?: string): string[] {
  if (!html) return [];
  const matches = html.match(/<li>(.*?)<\/li>/g);
  return matches?.map(m => m.replace(/<\/?li>/g, '').trim()) || [];
}

function listToHtml(list?: string[]): string {
  if (!list?.length) return '';
  return `<ul>${list.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

function formatDate(date?: string): string {
  if (!date) return '';
  if (date === '至今') return '';
  return date.replace('.', '-');
}

function parseDate(date?: string): string {
  if (!date) return '';
  return date.replace('-', '.');
}

function convertSkillLevel(level?: number): string {
  if (!level) return 'Intermediate';
  if (level <= 30) return 'Beginner';
  if (level <= 60) return 'Intermediate';
  if (level <= 85) return 'Advanced';
  return 'Master';
}

function convertSkillLevelToNumber(level?: string): number {
  const map: Record<string, number> = {
    'Beginner': 30,
    'Intermediate': 60,
    'Advanced': 80,
    'Master': 95,
  };
  return map[level || ''] || 60;
}

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isLegacyFormat(data: unknown): data is ResumeConfig {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  if ('basics' in obj || 'work' in obj || 'education' in obj) return false;
  const legacyKeys = ['profile', 'workExpList', 'educationList', 'projectList'];
  return legacyKeys.some(k => k in obj);
}

export function convertLegacyToNew(config: ResumeConfig): ExtendedJSONResume {
  const migrated = migrateMarkdownFields(config);

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/master/schema.json',
    basics: {
      name: migrated.profile?.name || '',
      label: migrated.profile?.positionTitle,
      image: migrated.avatar?.src,
      email: migrated.profile?.email,
      phone: migrated.profile?.mobile,
      summary: stripHtml(migrated.aboutme?.aboutmeDesc),
      location: migrated.profile?.workPlace ? { city: migrated.profile.workPlace } : undefined,
    },
    work: migrated.workExpList?.map(w => ({
      name: w.companyName,
      position: migrated.profile?.positionTitle,
      startDate: formatDate(w.workTime?.[0]),
      endDate: formatDate(w.workTime?.[1]),
      summary: stripHtml(w.workDesc),
      highlights: parseHtmlToList(w.workDesc),
      'x-op-id': w.id,
      'x-op-departmentName': w.departmentName,
      'x-op-workDescHtml': w.workDesc,
    })),
    education: migrated.educationList?.map(e => ({
      institution: e.school,
      area: e.major,
      studyType: e.academicDegree,
      startDate: formatDate(e.eduTime?.[0]),
      endDate: formatDate(e.eduTime?.[1]),
      'x-op-id': e.id,
    })),
    projects: [
      ...(migrated.projectList?.map(p => ({
        name: p.projectName,
        description: p.projectDesc,
        highlights: parseHtmlToList(p.projectContent),
        startDate: formatDate(p.projectTime?.[0]),
        endDate: formatDate(p.projectTime?.[1]),
        roles: p.projectRole ? [p.projectRole] : undefined,
        'x-op-id': p.id,
        'x-op-type': 'project' as const,
        'x-op-projectContentHtml': p.projectContent,
      })) || []),
      ...(migrated.workList?.map(w => ({
        name: w.workName,
        description: w.workDesc,
        url: w.visitLink,
        'x-op-id': w.id,
        'x-op-type': 'portfolio' as const,
      })) || []),
    ],
    skills: migrated.skillList?.map(s => ({
      name: s.skillName,
      level: convertSkillLevel(s.skillLevel),
      'x-op-id': s.id,
      'x-op-skillLevel': s.skillLevel,
    })),
    awards: migrated.awardList?.map(a => ({
      title: a.awardInfo,
      date: a.awardTime,
      'x-op-id': a.id,
    })),
    'x-op-avatar': migrated.avatar,
    'x-op-birthday': migrated.profile?.birthday,
    'x-op-ageHidden': migrated.profile?.ageHidden,
    'x-op-workExpYear': migrated.profile?.workExpYear,
    'x-op-customFields': migrated.profile?.customFields,
    'x-op-aboutmeHtml': migrated.aboutme?.aboutmeDesc,
    'x-op-moduleLayout': migrated.moduleLayout,
    'x-op-moduleHidden': migrated.moduleHidden,
    'x-op-titleNameMap': migrated.titleNameMap,
  };
}

export function convertNewToLegacy(resume: ExtendedJSONResume): ResumeConfig {
  return {
    avatar: resume['x-op-avatar'] || {
      src: resume.basics?.image,
      width: 90,
      height: 90,
      borderRadius: 8,
    },
    profile: {
      name: resume.basics?.name || '',
      email: resume.basics?.email,
      mobile: resume.basics?.phone,
      positionTitle: resume.basics?.label,
      workPlace: resume.basics?.location?.city,
      birthday: resume['x-op-birthday'],
      ageHidden: resume['x-op-ageHidden'],
      workExpYear: resume['x-op-workExpYear'],
      customFields: resume['x-op-customFields'],
    },
    educationList: resume.education?.map(e => {
      const ext = e as any;
      return {
        id: ext['x-op-id'] || generateId(),
        school: e.institution || '',
        major: e.area,
        academicDegree: e.studyType,
        eduTime: [parseDate(e.startDate), parseDate(e.endDate)],
      };
    }),
    workExpList: resume.work?.map(w => {
      const ext = w as any;
      return {
        id: ext['x-op-id'] || generateId(),
        companyName: w.name || '',
        departmentName: ext['x-op-departmentName'],
        workTime: [parseDate(w.startDate), parseDate(w.endDate)],
        workDesc: ext['x-op-workDescHtml'] || listToHtml(w.highlights),
      };
    }),
    projectList: resume.projects
      ?.filter(p => {
        const ext = p as any;
        return !ext['x-op-type'] || ext['x-op-type'] === 'project';
      })
      .map(p => {
        const ext = p as any;
        return {
          id: ext['x-op-id'] || generateId(),
          projectName: p.name || '',
          projectDesc: p.description,
          projectRole: p.roles?.[0],
          projectTime: [parseDate(p.startDate), parseDate(p.endDate)],
          projectContent: ext['x-op-projectContentHtml'] || listToHtml(p.highlights),
        };
      }),
    workList: resume.projects
      ?.filter(p => {
        const ext = p as any;
        return ext['x-op-type'] === 'portfolio';
      })
      .map(p => {
        const ext = p as any;
        return {
          id: ext['x-op-id'] || generateId(),
          workName: p.name,
          workDesc: p.description,
          visitLink: p.url,
        };
      }),
    skillList: resume.skills?.map(s => {
      const ext = s as any;
      return {
        id: ext['x-op-id'] || generateId(),
        skillName: s.name,
        skillLevel: ext['x-op-skillLevel'] ?? convertSkillLevelToNumber(s.level),
        skillDesc: s.level,
      };
    }),
    awardList: resume.awards?.map(a => {
      const ext = a as any;
      return {
        id: ext['x-op-id'] || generateId(),
        awardInfo: a.title || '',
        awardTime: a.date,
      };
    }),
    aboutme: {
      aboutmeDesc: resume['x-op-aboutmeHtml'] || `<p>${resume.basics?.summary || ''}</p>`,
    },
    moduleLayout: resume['x-op-moduleLayout'],
    moduleHidden: resume['x-op-moduleHidden'],
    titleNameMap: resume['x-op-titleNameMap'],
  };
}
