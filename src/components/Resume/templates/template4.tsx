import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';
import { EditableSection, getTitle, ResumeAvatar, calculateAge } from '../shared';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        className="inline-block rounded-sm px-3 py-1 text-xs font-bold text-white"
        style={{ backgroundColor: 'var(--resume-primary)' }}
      >
        {title}
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

/* ---------- InfoItem（Template4 专有） ---------- */

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-1 text-xs">
      <span className="shrink-0 text-gray-500">{label}：</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-5', item: 'mb-3' },
  typography: { titleWeight: 'font-bold', titleSize: 'text-sm', contentSize: 'text-xs' },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-500', muted: 'text-gray-400' },
  components: { SectionTitle },
  variants: { skill: 'list', project: 'detailed', education: 'inline' },
  layout: { awardTimeInline: false, flexAlign: 'items-baseline' },
};

/* ---------- LayoutShell ---------- */

function Template4Shell({ config, mainContent }: LayoutShellProps) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);

  return (
    <div className="relative min-h-[297mm] w-[210mm] bg-white shadow-lg print:shadow-none">
      <div className="px-8 py-6 pl-10">
        <EditableSection module="profile">
          <div className="mb-5 flex items-center gap-4 border-b-2 border-resume-primary pb-4">
            <ResumeAvatar avatar={avatar} name={profile?.name} className="shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-resume-primary">{profile?.name}</h1>
              {profile?.positionTitle && <p className="mt-0.5 text-sm text-gray-600">{profile.positionTitle}</p>}
            </div>
          </div>
        </EditableSection>
        <EditableSection module="profile">
          <div className="mb-5">
            <SectionTitle title={getTitle(config, 'profile', t('module.profile'))} />
            <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
              <InfoItem label={t('field.mobile')} value={profile?.mobile} />
              <InfoItem label={t('field.email')} value={profile?.email} />
              <InfoItem label={t('field.workPlace')} value={profile?.workPlace} />
              {age !== null && !profile?.ageHidden && <InfoItem label={t('field.ageLabel')} value={t('field.age', { age })} />}
              <InfoItem label={t('field.workExpYear')} value={profile?.workExpYear ? t('common.yearsExp', { years: profile.workExpYear }) : undefined} />
              <InfoItem label={t('field.github')} value={profile?.github ? `github.com/${profile.github}` : undefined} />
              <InfoItem label={t('field.zhihu')} value={profile?.zhihu} />
            </div>
          </div>
        </EditableSection>
        {mainContent}
      </div>
    </div>
  );
}

/* ---------- 导出 ---------- */

const definition: TemplateDefinition = {
  id: 'template4',
  defaultLayout: {
    sidebar: [],
    main: ['workExpList', 'projectList', 'skillList', 'educationList', 'awardList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template4Shell,
};

export default definition;
