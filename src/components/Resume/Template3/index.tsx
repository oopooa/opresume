import type { ReactNode } from 'react';
import type { ResumeConfig } from '@/types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden, ResumeAvatar, calculateAge } from '../shared';
import { getEffectiveLayout } from '@/config/layout';

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="h-4 w-1 rounded-full bg-resume-primary" />
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: 'color-mix(in srgb, var(--resume-tag) 20%, transparent)', color: 'var(--resume-tag)' }}
    >
      {children}
    </span>
  );
}

function useSidebarRenderers(config: ResumeConfig): Record<string, () => ReactNode> {
  const { t } = useTranslation();
  return {
    skillList: () => {
      if (isHidden(config, 'skillList') || !config.skillList?.length) return null;
      return (
        <EditableSection module="skillList">
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold text-white">{getTitle(config, 'skillList', t('module.skillList'))}</h3>
            {config.skillList.map((skill) => (
              <div key={skill.id} className="mb-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-300">{skill.skillName}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-700">
                  <div className="h-1 rounded-full bg-resume-primary" style={{ width: `${skill.skillLevel ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </EditableSection>
      );
    },
    educationList: () => {
      if (isHidden(config, 'educationList') || !config.educationList?.length) return null;
      return (
        <EditableSection module="educationList">
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold text-white">{getTitle(config, 'educationList', t('module.educationList'))}</h3>
            {config.educationList.map((edu) => (
              <div key={edu.id} className="mb-2">
                <p className="text-xs font-semibold text-white">{edu.school}</p>
                <p className="text-xs text-gray-400">{edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}</p>
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
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold text-white">{getTitle(config, 'awardList', t('module.awardList'))}</h3>
            {config.awardList.map((award) => (
              <div key={award.id} className="mb-1.5 text-xs">
                <span className="text-gray-300">{award.awardInfo}</span>
                {award.awardTime && <span className="ml-1 text-gray-500">({award.awardTime})</span>}
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
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold text-white">{getTitle(config, 'workExpList', t('module.workExpList'))}</h3>
            {config.workExpList.map((work) => (
              <div key={work.id} className="mb-3">
                <p className="text-xs font-semibold text-white">{work.companyName}</p>
                {work.departmentName && <p className="text-xs text-gray-400">{work.departmentName}</p>}
                <TimeRange time={work.workTime} />
                <div className="mt-1 text-xs text-gray-300"><Markdown content={work.workDesc} /></div>
              </div>
            ))}
          </div>
        </EditableSection>
      );
    },
    projectList: () => {
      if (isHidden(config, 'projectList') || !config.projectList?.length) return null;
      return (
        <EditableSection module="projectList">
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold text-white">{getTitle(config, 'projectList', t('module.projectList'))}</h3>
            {config.projectList.map((proj) => (
              <div key={proj.id} className="mb-3">
                <p className="text-xs font-semibold text-white">{proj.projectName}</p>
                {proj.projectRole && <p className="text-xs text-gray-400">{proj.projectRole}</p>}
                <TimeRange time={proj.projectTime} />
                {proj.projectDesc && <p className="mt-1 text-xs text-gray-400">{proj.projectDesc}</p>}
                {proj.projectContent && <div className="mt-1 text-xs text-gray-300"><Markdown content={proj.projectContent} /></div>}
              </div>
            ))}
          </div>
        </EditableSection>
      );
    },
    workList: () => {
      if (isHidden(config, 'workList') || !config.workList?.length) return null;
      return (
        <EditableSection module="workList">
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold text-white">{getTitle(config, 'workList', t('module.workList'))}</h3>
            {config.workList.map((item) => (
              <div key={item.id} className="mb-2 text-xs">
                <p className="font-semibold text-white">{item.workName}</p>
                {item.workDesc && <p className="text-gray-400">{item.workDesc}</p>}
                {item.visitLink && (
                  <a href={item.visitLink} className="text-resume-primary underline" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{item.visitLink}</a>
                )}
              </div>
            ))}
          </div>
        </EditableSection>
      );
    },
    aboutme: () => {
      if (isHidden(config, 'aboutme') || !config.aboutme?.aboutmeDesc) return null;
      return (
        <EditableSection module="aboutme">
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold text-white">{getTitle(config, 'aboutme', t('module.aboutme'))}</h3>
            <div className="text-xs text-gray-300"><Markdown content={config.aboutme.aboutmeDesc} /></div>
          </div>
        </EditableSection>
      );
    },
  };
}

function useMainRenderers(config: ResumeConfig): Record<string, () => ReactNode> {
  const { t } = useTranslation();
  return {
    workExpList: () => {
      if (isHidden(config, 'workExpList') || !config.workExpList?.length) return null;
      return (
        <EditableSection module="workExpList">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} />
            {config.workExpList.map((work) => (
              <div key={work.id} className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{work.companyName}</p>
                    {work.departmentName && <Badge>{work.departmentName}</Badge>}
                  </div>
                  <TimeRange time={work.workTime} />
                </div>
                <div className="mt-2"><Markdown content={work.workDesc} /></div>
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
              <div key={proj.id} className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">{proj.projectName}</p>
                    {proj.projectRole && <Badge>{proj.projectRole}</Badge>}
                  </div>
                  <TimeRange time={proj.projectTime} />
                </div>
                {proj.projectDesc && <p className="mt-1 text-xs text-gray-500">{proj.projectDesc}</p>}
                {proj.projectContent && <div className="mt-2"><Markdown content={proj.projectContent} /></div>}
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
            <div className="grid grid-cols-2 gap-2">
              {config.workList.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <p className="text-sm font-semibold text-gray-800">{item.workName}</p>
                  {item.workDesc && <p className="mt-0.5 text-xs text-gray-500">{item.workDesc}</p>}
                  {item.visitLink && (
                    <a href={item.visitLink} className="mt-1 inline-block text-xs text-resume-primary underline" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{item.visitLink}</a>
                  )}
                </div>
              ))}
            </div>
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
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <Markdown content={config.aboutme.aboutmeDesc} />
            </div>
          </section>
        </EditableSection>
      );
    },
    skillList: () => {
      if (isHidden(config, 'skillList') || !config.skillList?.length) return null;
      return (
        <EditableSection module="skillList">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} />
            {config.skillList.map((skill) => (
              <div key={skill.id} className="mb-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-800">{skill.skillName}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-200">
                  <div className="h-1 rounded-full bg-resume-primary" style={{ width: `${skill.skillLevel ?? 0}%` }} />
                </div>
              </div>
            ))}
          </section>
        </EditableSection>
      );
    },
    educationList: () => {
      if (isHidden(config, 'educationList') || !config.educationList?.length) return null;
      return (
        <EditableSection module="educationList">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'educationList', t('module.educationList'))} />
            {config.educationList.map((edu) => (
              <div key={edu.id} className="mb-2">
                <p className="text-sm font-semibold text-gray-800">{edu.school}</p>
                <p className="text-xs text-gray-500">{edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}</p>
                <TimeRange time={edu.eduTime} />
              </div>
            ))}
          </section>
        </EditableSection>
      );
    },
    awardList: () => {
      if (isHidden(config, 'awardList') || !config.awardList?.length) return null;
      return (
        <EditableSection module="awardList">
          <section className="mb-5">
            <SectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} />
            {config.awardList.map((award) => (
              <div key={award.id} className="mb-1.5 text-sm">
                <span className="text-gray-700">{award.awardInfo}</span>
                {award.awardTime && <span className="ml-1 text-xs text-gray-400">({award.awardTime})</span>}
              </div>
            ))}
          </section>
        </EditableSection>
      );
    },
  };
}

export function Template3({ config }: { config: ResumeConfig }) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);
  const layout = getEffectiveLayout('template3', config.moduleLayout);
  const sidebarRenderers = useSidebarRenderers(config);
  const mainRenderers = useMainRenderers(config);

  return (
    <div className="flex min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <aside className="w-[72mm] shrink-0 bg-gray-900 p-5 text-gray-300">
        <EditableSection module="profile">
          <div className="mb-6 text-center">
            <ResumeAvatar avatar={avatar} name={profile?.name} className="mx-auto mb-3 border-2 border-gray-700" />
            <h1 className="text-xl font-bold text-white">{profile?.name}</h1>
            {profile?.positionTitle && <p className="mt-1 text-xs text-resume-primary">{profile.positionTitle}</p>}
          </div>
          <div className="mb-6 space-y-2 text-xs">
            {profile?.mobile && <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" /><span>{profile.mobile}</span></div>}
            {profile?.email && <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" /><span>{profile.email}</span></div>}
            {profile?.github && <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" /><span>github.com/{profile.github}</span></div>}
            {profile?.zhihu && <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" /><span>{profile.zhihu}</span></div>}
            {profile?.workPlace && <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" /><span>{profile.workPlace}</span></div>}
            {age !== null && !profile?.ageHidden && <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" /><span>{t('field.age', { age })}</span></div>}
            {profile?.workExpYear && <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" /><span>{t('common.yearsExp', { years: profile.workExpYear })}</span></div>}
          </div>
        </EditableSection>
        {layout.sidebar.map((key) => <div key={key}>{sidebarRenderers[key]?.()}</div>)}
      </aside>
      <main className="flex-1 p-6">
        {layout.main.map((key) => <div key={key}>{mainRenderers[key]?.()}</div>)}
      </main>
    </div>
  );
}
