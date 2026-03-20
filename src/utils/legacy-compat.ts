/**
 * 老格式兼容层 - 仅用于导入旧格式数据
 */

import type { ResumeConfig } from '@/types/resume';
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

function formatDate(date?: string): string {
  if (!date) return '';
  if (date === '至今' || date.toLowerCase() === 'present') return 'present';
  return date.replace('.', '-');
}

function convertSkillLevel(level?: number): string {
  if (!level) return 'Intermediate';
  if (level <= 30) return 'Beginner';
  if (level <= 60) return 'Intermediate';
  if (level <= 85) return 'Advanced';
  return 'Master';
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
    'x-op-locales': migrated.locales
      ? Object.fromEntries(
          Object.entries(migrated.locales).map(([lang, partial]) => [
            lang,
            convertLegacyToNew({ ...config, ...partial }),
          ]),
        )
      : undefined,
  };
}
