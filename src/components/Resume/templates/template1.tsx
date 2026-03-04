import type { TemplateDefinition, StyleTokens, LayoutShellProps, ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden, ResumeAvatar, calculateAge } from '../shared';

/* ---------- SectionTitle ---------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mb-2 border-b-2 border-resume-primary pb-1 text-sm font-bold text-resume-primary">
      {title}
    </h3>
  );
}

/* ---------- SkillBar ---------- */

function SkillBar({ name, level }: { name: string; level: number }) {
  return (
    <div className="mb-1.5">
      <div className="mb-0.5 flex items-center justify-between text-xs">
        <span>{name}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-resume-primary"
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  moduleSpacing: 'mb-4',
  textPrimary: '',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-500',
  SectionTitle,
  awardTimeInline: false,
  educationInline: false,
  flexAlign: 'items-start',
};

/* ---------- overrides ---------- */

function SkillListOverride({ config }: ModuleProps) {
  const { t } = useTranslation();
  if (isHidden(config, 'skillList') || !config.skillList?.length) return null;
  return (
    <EditableSection module="skillList">
      <div className="mb-4">
        <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} />
        {config.skillList.map((skill) => (
          <SkillBar key={skill.id} name={skill.skillName ?? ''} level={skill.skillLevel ?? 0} />
        ))}
      </div>
    </EditableSection>
  );
}

function ProjectListOverride({ config }: ModuleProps) {
  const { t } = useTranslation();
  if (isHidden(config, 'projectList') || !config.projectList?.length) return null;
  return (
    <EditableSection module="projectList">
      <section className="mb-4">
        <SectionTitle title={getTitle(config, 'projectList', t('module.projectList'))} />
        {config.projectList.map((proj) => (
          <div key={proj.id} className="mb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{proj.projectName}</p>
                {proj.projectRole && (
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-xs text-resume-primary"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--resume-tag) 20%, transparent)' }}
                  >
                    {proj.projectRole}
                  </span>
                )}
              </div>
              <TimeRange time={proj.projectTime} />
            </div>
            {proj.projectDesc && (
              <p className="mt-1 text-xs text-gray-600">{proj.projectDesc}</p>
            )}
            {proj.projectContent && (
              <div className="mt-1">
                <Markdown content={proj.projectContent} />
              </div>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}

/* ---------- LayoutShell ---------- */

function Template1Shell({ config, sidebarContent, mainContent }: LayoutShellProps) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);

  return (
    <div className="flex min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <aside className="w-[70mm] shrink-0 bg-gray-50 p-5 print:bg-gray-50">
        <EditableSection module="profile">
          <div className="mb-4 text-center">
            <ResumeAvatar avatar={avatar} name={profile?.name} className="mx-auto mb-2" />
            <h1 className="text-xl font-bold text-resume-primary">{profile?.name}</h1>
            {profile?.positionTitle && (
              <p className="mt-0.5 text-xs text-gray-600">{profile.positionTitle}</p>
            )}
          </div>
          <div className="mb-4 space-y-1 text-xs text-gray-600">
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
  id: 'template1',
  defaultLayout: {
    sidebar: ['skillList', 'educationList', 'awardList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  moduleOverrides: {
    skillList: SkillListOverride,
    projectList: ProjectListOverride,
  },
  LayoutShell: Template1Shell,
};

export default definition;
