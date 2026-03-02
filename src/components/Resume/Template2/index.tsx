import type { ReactNode } from 'react';
import type { ResumeConfig } from '@/types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden, ResumeAvatar, calculateAge } from '../shared';
import { getEffectiveLayout } from '@/config/layout';

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mb-2 text-xs font-semibold text-resume-primary">
      {title}
      <div className="mt-1 h-px bg-gray-200" />
    </h3>
  );
}

function useModuleRenderers(config: ResumeConfig): Record<string, () => ReactNode> {
  const { t } = useTranslation();
  return {
    skillList: () => {
      if (isHidden(config, 'skillList') || !config.skillList?.length) return null;
      return (
        <EditableSection module="skillList">
          <div className="mb-5">
            <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} />
            <div className="flex flex-wrap gap-1.5">
              {config.skillList.map((skill) => (
                <span key={skill.id} className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--resume-primary) 12%, transparent)', color: 'var(--resume-primary)' }}>
                  {skill.skillName}
                </span>
              ))}
            </div>
          </div>
        </EditableSection>
      );
    },
    educationList: () => {
      if (isHidden(config, 'educationList') || !config.educationList?.length) return null;
      return (
        <EditableSection module="educationList">
          <div className="mb-5">
            <SectionTitle title={getTitle(config, 'educationList', t('module.educationList'))} />
            {config.educationList.map((edu) => (
              <div key={edu.id} className="mb-2">
                <p className="text-xs font-semibold text-gray-800">{edu.school}</p>
                <p className="text-xs text-gray-500">{edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}</p>
                <TimeRange time={edu.eduTime} />
              </div>
            ))}
          </div>
        </EditableSection>
      );
    },
    awardList: () => {
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
    },
    workExpList: () => {
      if (isHidden(config, 'workExpList') || !config.workExpList?.length) return null;
      return (
        <EditableSection module="workExpList">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} />
            {config.workExpList.map((work) => (
              <div key={work.id} className="mb-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-gray-800">{work.companyName}</p>
                  <TimeRange time={work.workTime} />
                </div>
                {work.departmentName && <p className="text-xs text-gray-500">{work.departmentName}</p>}
                <div className="mt-1"><Markdown content={work.workDesc} /></div>
              </div>
            ))}
          </section>
        </EditableSection>
      );
    },
    projectList: () => {
      if (isHidden(config, 'projectList') || !config.projectList?.length) return null;
      return (
        <EditableSection module="projectList">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'projectList', t('module.projectList'))} />
            {config.projectList.map((proj) => (
              <div key={proj.id} className="mb-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{proj.projectName}</p>
                    {proj.projectRole && <span className="text-xs text-gray-500">/ {proj.projectRole}</span>}
                  </div>
                  <TimeRange time={proj.projectTime} />
                </div>
                {proj.projectDesc && <p className="mt-0.5 text-xs text-gray-500">{proj.projectDesc}</p>}
                {proj.projectContent && <div className="mt-1"><Markdown content={proj.projectContent} /></div>}
              </div>
            ))}
          </section>
        </EditableSection>
      );
    },
    workList: () => {
      if (isHidden(config, 'workList') || !config.workList?.length) return null;
      return (
        <EditableSection module="workList">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'workList', t('module.workList'))} />
            {config.workList.map((item) => (
              <div key={item.id} className="mb-2">
                <p className="text-sm font-semibold text-gray-800">
                  {item.workName}
                  {item.visitLink && (
                    <a href={item.visitLink} className="ml-2 text-xs font-normal text-resume-primary underline" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      {item.visitLink}
                    </a>
                  )}
                </p>
                {item.workDesc && <p className="text-xs text-gray-500">{item.workDesc}</p>}
              </div>
            ))}
          </section>
        </EditableSection>
      );
    },
    aboutme: () => {
      if (isHidden(config, 'aboutme') || !config.aboutme?.aboutmeDesc) return null;
      return (
        <EditableSection module="aboutme">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'aboutme', t('module.aboutme'))} />
            <Markdown content={config.aboutme.aboutmeDesc} />
          </section>
        </EditableSection>
      );
    },
  };
}

export function Template2({ config }: { config: ResumeConfig }) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);
  const layout = getEffectiveLayout('template2', config.moduleLayout);
  const renderers = useModuleRenderers(config);

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
        {layout.sidebar.map((key) => <div key={key}>{renderers[key]?.()}</div>)}
      </aside>
      <main className="flex-1 p-5">
        {layout.main.map((key) => <div key={key}>{renderers[key]?.()}</div>)}
      </main>
    </div>
  );
}
