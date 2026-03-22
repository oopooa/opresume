import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';
import { EditableSection, ResumeAvatar, calculateAge, getProfileIcon, useCustomFieldIconMap, ProfileField, usePrivacyMask } from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 border-b-2 border-resume-primary pb-1 resume-title-text font-bold text-resume-primary">
      <DynamicIcon name={icon} className="h-4 w-4" />
      {title}
    </h3>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-4', item: 'mb-2' },
  typography: { titleWeight: 'font-bold', titleSize: 'resume-title-text', contentSize: 'resume-body-text' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-600', muted: 'text-gray-500' },
  components: { SectionTitle },
  variants: { skill: 'bar', project: 'compact', education: 'stacked' },
  layout: { awardTimeInline: false, flexAlign: 'items-start' },
};

/* ---------- LayoutShell ---------- */

function Template1Shell({ config, sidebarContent, mainContent }: LayoutShellProps) {
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { t } = useTranslation();
  const age = calculateAge(config['x-op-birthday']);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="resume-padding flex min-h-[297mm] w-[210mm] gap-5 bg-white text-gray-800 shadow-lg print:shadow-none">
      <aside className="w-[70mm] shrink-0 bg-gray-50 p-4 print:bg-gray-50">
        <EditableSection module="profile">
          <div className="mb-4 text-center">
            <ResumeAvatar avatar={avatar} name={basics?.name} className="mx-auto mb-2" />
            <h1 className="text-xl font-bold text-resume-primary">{mask(basics?.name, 'name')}</h1>
            {basics?.label && (
              <p className="mt-0.5 text-xs text-gray-600">{basics.label}</p>
            )}
          </div>
          <div className="mb-4 space-y-1 text-xs text-gray-600">
            {basics?.phone && <ProfileField icon={getProfileIcon('mobile')} label={t('field.mobile')}>{mask(basics.phone, 'mobile')}</ProfileField>}
            {basics?.email && <ProfileField icon={getProfileIcon('email')} label={t('field.email')}>{mask(basics.email, 'email')}</ProfileField>}
            {basics?.location?.city && <ProfileField icon={getProfileIcon('workPlace')} label={t('field.workPlace')}>{mask(basics.location.city, 'workPlace')}</ProfileField>}
            {age !== null && !config['x-op-ageHidden'] && <ProfileField icon={getProfileIcon('age')} label={t('field.ageLabel')}>{t('field.age', { age })}</ProfileField>}
            {config['x-op-workExpYear'] && <ProfileField icon={getProfileIcon('workExpYear')} label={t('field.workExpYear')}>{t('common.yearsExp', { years: config['x-op-workExpYear'] })}</ProfileField>}
            {config['x-op-customFields']?.filter((f) => f.key.trim() || f.value.trim()).map((field, i) => (
              <ProfileField key={`${field.key}-${i}`} icon={customFieldIconMap[field.key]} label={field.key}>{field.value}</ProfileField>
            ))}
          </div>
        </EditableSection>

        {sidebarContent}
      </aside>

      <main className="flex-1">
        {mainContent}
      </main>
    </div>
  );
}

/* ---------- 导出 ---------- */

const definition: TemplateDefinition = {
  id: 'template1',
  tags: ['twoColumn', 'singlePage'],
  defaultLayout: {
    sidebar: ['skillList', 'educationList', 'awardList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template1Shell,
};

export default definition;
