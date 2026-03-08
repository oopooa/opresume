import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';

import { EditableSection, ResumeAvatar, calculateAge, getProfileIcon, useCustomFieldIconMap, ProfileField, usePrivacyMask } from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-resume-primary">
      <DynamicIcon name={icon} className="h-3.5 w-3.5" />
      {title}
      <div className="mt-1 h-px flex-1 bg-gray-200" />
    </h3>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-5', item: 'mb-2' },
  typography: { titleWeight: 'font-semibold', titleSize: 'text-sm', contentSize: 'text-xs' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-500', muted: 'text-gray-400' },
  components: { SectionTitle },
  variants: { skill: 'tags', project: 'compact', education: 'stacked' },
  layout: { awardTimeInline: true, flexAlign: 'items-baseline' },
};

/* ---------- LayoutShell ---------- */

function Template2Shell({ config, sidebarContent, mainContent }: LayoutShellProps) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="flex min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <aside className="w-[65mm] shrink-0 border-r border-gray-200 p-5">
        <EditableSection module="profile">
          <div className="mb-5 text-center">
            <ResumeAvatar avatar={avatar} name={profile?.name} className="mx-auto mb-2" />
            <h1 className="text-lg font-bold text-gray-900">{mask(profile?.name, 'name')}</h1>
            {profile?.positionTitle && <p className="mt-0.5 text-xs text-gray-500">{profile.positionTitle}</p>}
          </div>
          <div className="mb-5 space-y-1.5 text-xs text-gray-600">
            {profile?.mobile && <ProfileField icon={getProfileIcon('mobile')}>{mask(profile.mobile, 'mobile')}</ProfileField>}
            {profile?.email && <ProfileField icon={getProfileIcon('email')}>{mask(profile.email, 'email')}</ProfileField>}
            {profile?.workPlace && <ProfileField icon={getProfileIcon('workPlace')}>{mask(profile.workPlace, 'workPlace')}</ProfileField>}
            {age !== null && !profile?.ageHidden && <ProfileField icon={getProfileIcon('age')}>{t('field.age', { age })}</ProfileField>}
            {profile?.workExpYear && <ProfileField icon={getProfileIcon('workExpYear')}>{t('common.yearsExp', { years: profile.workExpYear })}</ProfileField>}
            {profile?.customFields?.filter((f) => f.key.trim() || f.value.trim()).map((field) => (
              <ProfileField key={field.key} icon={customFieldIconMap[field.key]}>{field.key}: {field.value}</ProfileField>
            ))}
          </div>
        </EditableSection>
        {sidebarContent}
      </aside>
      <main className="flex-1 p-5">
        {mainContent}
      </main>
    </div>
  );
}

/* ---------- 导出 ---------- */

const definition: TemplateDefinition = {
  id: 'template2',
  defaultLayout: {
    sidebar: ['skillList', 'educationList', 'awardList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template2Shell,
};

export default definition;
