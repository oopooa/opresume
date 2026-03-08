import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';
import { EditableSection, ResumeAvatar, calculateAge, getProfileIcon, useCustomFieldIconMap, ProfileField, usePrivacyMask } from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 border-b-2 border-resume-primary pb-1 text-sm font-bold text-resume-primary">
      <DynamicIcon name={icon} className="h-4 w-4" />
      {title}
    </h3>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-4', item: 'mb-2' },
  typography: { titleWeight: 'font-bold', titleSize: 'text-sm', contentSize: 'text-xs' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-600', muted: 'text-gray-500' },
  components: { SectionTitle },
  variants: { skill: 'bar', project: 'compact', education: 'stacked' },
  layout: { awardTimeInline: false, flexAlign: 'items-start' },
};

/* ---------- LayoutShell ---------- */

function Template1Shell({ config, sidebarContent, mainContent }: LayoutShellProps) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="flex min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <aside className="w-[70mm] shrink-0 bg-gray-50 p-5 print:bg-gray-50">
        <EditableSection module="profile">
          <div className="mb-4 text-center">
            <ResumeAvatar avatar={avatar} name={profile?.name} className="mx-auto mb-2" />
            <h1 className="text-xl font-bold text-resume-primary">{mask(profile?.name, 'name')}</h1>
            {profile?.positionTitle && (
              <p className="mt-0.5 text-xs text-gray-600">{profile.positionTitle}</p>
            )}
          </div>
          <div className="mb-4 space-y-1 text-xs text-gray-600">
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
  id: 'template1',
  defaultLayout: {
    sidebar: ['skillList', 'educationList', 'awardList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template1Shell,
};

export default definition;
