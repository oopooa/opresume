import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';
import { EditableSection, getTitle, ResumeAvatar, calculateAge, getProfileIcon, useCustomFieldIconMap, useModuleIcon, usePrivacyMask } from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1 resume-title-text font-bold text-white"
        style={{ backgroundColor: 'var(--resume-primary)' }}
      >
        <DynamicIcon name={icon} className="h-3.5 w-3.5" />
        {title}
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

/* ---------- InfoItem（Template4 专有） ---------- */

function InfoItem({ icon, label, value }: { icon?: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1 text-xs">
      <DynamicIcon name={icon} className="h-3 w-3 shrink-0 opacity-60" />
      <span className="shrink-0 text-gray-500">{label}：</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-5', item: 'mb-3' },
  typography: { titleWeight: 'font-bold', titleSize: 'resume-title-text', contentSize: 'resume-body-text' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-500', muted: 'text-gray-400' },
  components: { SectionTitle },
  variants: { skill: 'list', project: 'detailed', education: 'inline' },
  layout: { awardTimeInline: false, flexAlign: 'items-baseline' },
};

/* ---------- LayoutShell ---------- */

function Template4Shell({ config, mainContent, pageIndex = 0 }: LayoutShellProps) {
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { t } = useTranslation();
  const age = calculateAge(config['x-op-birthday']);
  const customFieldIconMap = useCustomFieldIconMap();
  const profileIcon = useModuleIcon('profile');
  const mask = usePrivacyMask();

  return (
    <div className="relative min-h-[297mm] w-[210mm] bg-white shadow-lg print:shadow-none">
      <div className="resume-padding resume-padding-offset-left">
        {pageIndex === 0 && (
          <>
            <EditableSection module="profile">
              <div className="mb-5 flex items-center gap-4 border-b-2 border-resume-primary pb-4">
                <ResumeAvatar avatar={avatar} name={basics?.name} className="shrink-0" />
                <div>
                  <h1 className="text-2xl font-bold text-resume-primary">{mask(basics?.name, 'name')}</h1>
                  {basics?.label && <p className="mt-0.5 text-sm text-gray-600">{basics.label}</p>}
                </div>
              </div>
            </EditableSection>
            <EditableSection module="profile">
              <div className="mb-5">
                <SectionTitle title={getTitle(config, 'profile', t('module.profile'))} icon={profileIcon} />
                <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
                  <InfoItem icon={getProfileIcon('mobile')} label={t('field.mobile')} value={mask(basics?.phone, 'mobile')} />
                  <InfoItem icon={getProfileIcon('email')} label={t('field.email')} value={mask(basics?.email, 'email')} />
                  <InfoItem icon={getProfileIcon('workPlace')} label={t('field.workPlace')} value={mask(basics?.location?.city, 'workPlace')} />
                  {age !== null && !config['x-op-ageHidden'] && <InfoItem icon={getProfileIcon('age')} label={t('field.ageLabel')} value={t('field.age', { age })} />}
                  <InfoItem icon={getProfileIcon('workExpYear')} label={t('field.workExpYear')} value={config['x-op-workExpYear'] ? t('common.yearsExp', { years: config['x-op-workExpYear'] }) : undefined} />
                  {config['x-op-customFields']?.filter((f) => f.key.trim() || f.value.trim()).map((field, i) => (
                    <InfoItem key={`${field.key}-${i}`} icon={customFieldIconMap[field.key]} label={field.key} value={field.value} />
                  ))}
                </div>
              </div>
            </EditableSection>
          </>
        )}
        {mainContent}
      </div>
    </div>
  );
}

/* ---------- 导出 ---------- */

const definition: TemplateDefinition = {
  id: 'template4',
  tags: ['singleColumn', 'multiPage'],
  defaultLayout: {
    sidebar: [],
    main: ['workExpList', 'projectList', 'skillList', 'educationList', 'awardList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template4Shell,
};

export default definition;
