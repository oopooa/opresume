import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';

import { EditableSection, ResumeAvatar, calculateAge, getProfileIcon, useCustomFieldIconMap, ProfileField, usePrivacyMask } from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-1.5 border-l-[3px] border-resume-primary bg-gray-50 py-1.5 pl-2 pr-3 resume-title-text font-semibold text-resume-primary">
      <DynamicIcon name={icon} className="h-3.5 w-3.5" />
      {title}
    </h3>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-5', item: 'mb-2' },
  typography: { titleWeight: 'font-semibold', titleSize: 'resume-title-text', contentSize: 'resume-body-text' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-500', muted: 'text-gray-400' },
  components: { SectionTitle },
  variants: { skill: 'tags', project: 'compact', education: 'inline' },
  layout: { awardTimeInline: true, flexAlign: 'items-baseline' },
};

/* ---------- LayoutShell ---------- */

function Template2Shell({ config, mainContent, pageIndex = 0 }: LayoutShellProps) {
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { t } = useTranslation();
  const age = calculateAge(config['x-op-birthday']);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <div className="resume-padding">
        {pageIndex === 0 && (
          <EditableSection module="profile">
            <div className="mb-5 flex items-stretch gap-4 border-b border-gray-200 pb-4">
              <ResumeAvatar avatar={avatar} name={basics?.name} className="shrink-0" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{mask(basics?.name, 'name')}</h1>
                  {basics?.label && <p className="mt-0.5 text-sm text-gray-500">{basics.label}</p>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
                  {basics?.phone && <ProfileField icon={getProfileIcon('mobile')} label={t('field.mobile')}>{mask(basics.phone, 'mobile')}</ProfileField>}
                  {basics?.email && <ProfileField icon={getProfileIcon('email')} label={t('field.email')}>{mask(basics.email, 'email')}</ProfileField>}
                  {basics?.location?.city && <ProfileField icon={getProfileIcon('workPlace')} label={t('field.workPlace')}>{mask(basics.location.city, 'workPlace')}</ProfileField>}
                  {age !== null && !config['x-op-ageHidden'] && <ProfileField icon={getProfileIcon('age')} label={t('field.ageLabel')}>{t('field.age', { age })}</ProfileField>}
                  {config['x-op-workExpYear'] && <ProfileField icon={getProfileIcon('workExpYear')} label={t('field.workExpYear')}>{t('common.yearsExp', { years: config['x-op-workExpYear'] })}</ProfileField>}
                  {config['x-op-customFields']?.filter((f) => f.key.trim() || f.value.trim()).map((field, i) => (
                    <ProfileField key={`${field.key}-${i}`} icon={customFieldIconMap[field.key]} label={field.key}>{field.value}</ProfileField>
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
