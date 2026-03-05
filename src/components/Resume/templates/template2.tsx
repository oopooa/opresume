import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';

import { EditableSection, ResumeAvatar, calculateAge } from '../shared';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mb-2 text-xs font-semibold text-resume-primary">
      {title}
      <div className="mt-1 h-px bg-gray-200" />
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

  return (
    <div className="flex min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <aside className="w-[65mm] shrink-0 border-r border-gray-200 p-5">
        <EditableSection module="profile">
          <div className="mb-5 text-center">
            <ResumeAvatar avatar={avatar} name={profile?.name} className="mx-auto mb-2" />
            <h1 className="text-lg font-bold text-gray-900">{profile?.name}</h1>
            {profile?.positionTitle && <p className="mt-0.5 text-xs text-gray-500">{profile.positionTitle}</p>}
          </div>
          <div className="mb-5 space-y-1.5 text-xs text-gray-600">
            {profile?.mobile && <p>{profile.mobile}</p>}
            {profile?.email && <p>{profile.email}</p>}
            {profile?.github && <p>github.com/{profile.github}</p>}
            {profile?.zhihu && <p>{profile.zhihu}</p>}
            {profile?.workPlace && <p>{profile.workPlace}</p>}
            {age !== null && !profile?.ageHidden && <p>{t('field.age', { age })}</p>}
            {profile?.workExpYear && <p>{t('common.yearsExp', { years: profile.workExpYear })}</p>}
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
