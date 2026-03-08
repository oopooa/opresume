import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';

import { EditableSection, ResumeAvatar, calculateAge, getProfileIcon, useCustomFieldIconMap, ProfileField, usePrivacyMask } from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';
import { useUIStore } from '@/store/ui';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  const showIcons = useUIStore((s) => s.showIcons);
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon && showIcons && (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--resume-primary) 15%, transparent)' }}
        >
          <DynamicIcon name={icon} className="h-3 w-3 text-resume-primary" />
        </span>
      )}
      <span className="text-base font-bold text-resume-primary">{title}</span>
    </div>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-5', item: 'mb-3' },
  typography: { titleWeight: 'font-semibold', titleSize: 'text-sm', contentSize: 'text-xs' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-500', muted: 'text-gray-400' },
  components: { SectionTitle },
  variants: { skill: 'tags', project: 'compact', education: 'inline' },
  layout: { awardTimeInline: true, flexAlign: 'items-baseline' },
};

/* ---------- LayoutShell ---------- */

function Template3Shell({ config, mainContent }: LayoutShellProps) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <div className="resume-padding">
        <EditableSection module="profile">
          <div className="mb-5 border-b border-gray-200 pb-4">
            <div className="mb-3 flex flex-col items-center">
              <ResumeAvatar avatar={avatar} name={profile?.name} />
              <h1 className="mt-2 text-xl font-bold text-gray-900">{mask(profile?.name, 'name')}</h1>
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
        </EditableSection>
        {mainContent}
      </div>
    </div>
  );
}

/* ---------- export ---------- */

const definition: TemplateDefinition = {
  id: 'template3',
  defaultLayout: {
    sidebar: [],
    main: ['workExpList', 'projectList', 'skillList', 'educationList', 'awardList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template3Shell,
};

export default definition;
