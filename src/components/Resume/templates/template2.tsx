import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';

import { EditableSection, ResumeAvatar, calculateAge, getProfileIcon, useCustomFieldIconMap, ProfileField, usePrivacyMask } from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-1.5 border-l-[3px] border-resume-primary bg-gray-50 py-1.5 pl-2 pr-3 text-xs font-semibold text-resume-primary">
      <DynamicIcon name={icon} className="h-3.5 w-3.5" />
      {title}
    </h3>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-5', item: 'mb-2' },
  typography: { titleWeight: 'font-semibold', titleSize: 'text-sm', contentSize: 'text-xs' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-500', muted: 'text-gray-400' },
  components: { SectionTitle },
  variants: { skill: 'tags', project: 'compact', education: 'inline' },
  layout: { awardTimeInline: true, flexAlign: 'items-baseline' },
};

/* ---------- LayoutShell ---------- */

function Template2Shell({ config, mainContent, pageIndex = 0 }: LayoutShellProps) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <div className="resume-padding">
        {pageIndex === 0 && (
          <EditableSection module="profile">
            <div className="mb-5 flex items-stretch gap-4 border-b border-gray-200 pb-4">
              <ResumeAvatar avatar={avatar} name={profile?.name} className="shrink-0" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{mask(profile?.name, 'name')}</h1>
                  {profile?.positionTitle && <p className="mt-0.5 text-sm text-gray-500">{profile.positionTitle}</p>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
                  {profile?.mobile && <ProfileField icon={getProfileIcon('mobile')} label={t('field.mobile')}>{mask(profile.mobile, 'mobile')}</ProfileField>}
                  {profile?.email && <ProfileField icon={getProfileIcon('email')} label={t('field.email')}>{mask(profile.email, 'email')}</ProfileField>}
                  {profile?.workPlace && <ProfileField icon={getProfileIcon('workPlace')} label={t('field.workPlace')}>{mask(profile.workPlace, 'workPlace')}</ProfileField>}
                  {age !== null && !profile?.ageHidden && <ProfileField icon={getProfileIcon('age')} label={t('field.ageLabel')}>{t('field.age', { age })}</ProfileField>}
                  {profile?.workExpYear && <ProfileField icon={getProfileIcon('workExpYear')} label={t('field.workExpYear')}>{t('common.yearsExp', { years: profile.workExpYear })}</ProfileField>}
                  {profile?.customFields?.filter((f) => f.key.trim() || f.value.trim()).map((field) => (
                    <ProfileField key={field.key} icon={customFieldIconMap[field.key]} label={field.key}>{field.value}</ProfileField>
                  ))}
                </div>
              </div>
            </div>
          </EditableSection>
        )}
        {mainContent}
      </div>
    </div>
  );
}

/* ---------- 导出 ---------- */

const definition: TemplateDefinition = {
  id: 'template2',
  tags: ['singleColumn', 'multiPage'],
  defaultLayout: {
    sidebar: [],
    main: ['workExpList', 'projectList', 'skillList', 'educationList', 'awardList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template2Shell,
};

export default definition;
