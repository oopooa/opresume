import type { TemplateDefinition, StyleTokens, LayoutShellProps, ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';

import { EditableSection, getTitle, isHidden, ResumeAvatar, calculateAge } from '../shared';

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
  moduleSpacing: 'mb-5',
  textPrimary: 'text-gray-800',
  textSecondary: 'text-gray-500',
  textMuted: 'text-gray-400',
  SectionTitle,
  awardTimeInline: true,
  educationInline: false,
  flexAlign: 'items-baseline',
};

/* ---------- overrides ---------- */

function SkillListOverride({ config }: ModuleProps) {
  const { t } = useTranslation();
  if (isHidden(config, 'skillList') || !config.skillList?.length) return null;
  return (
    <EditableSection module="skillList">
      <div className="mb-5">
        <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} />
        <div className="flex flex-wrap gap-1.5">
          {config.skillList.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--resume-primary) 12%, transparent)',
                color: 'var(--resume-primary)',
              }}
            >
              {skill.skillName}
            </span>
          ))}
        </div>
      </div>
    </EditableSection>
  );
}

function AwardListOverride({ config }: ModuleProps) {
  const { t } = useTranslation();
  if (isHidden(config, 'awardList') || !config.awardList?.length) return null;
  return (
    <EditableSection module="awardList">
      <div className="mb-5">
        <SectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} />
        {config.awardList.map((award) => (
          <div key={award.id} className="mb-1 text-xs text-gray-600">
            <span>{award.awardInfo}</span>
            {award.awardTime && <span className="ml-1 text-gray-400">({award.awardTime})</span>}
          </div>
        ))}
      </div>
    </EditableSection>
  );
}

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
  moduleOverrides: {
    skillList: SkillListOverride,
    awardList: AwardListOverride,
  },
  LayoutShell: Template2Shell,
};

export default definition;
