import type { ResumeConfig } from '@/types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden, avatarStyle } from '../shared';

interface Template3Props {
  config: ResumeConfig;
}

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
      style={{
        backgroundColor: 'color-mix(in srgb, var(--resume-tag) 20%, transparent)',
        color: 'var(--resume-tag)',
      }}
    >
      {children}
    </span>
  );
}

export function Template3({ config }: Template3Props) {
  const { profile, avatar } = config;
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      {/* 左栏 */}
      <aside className="w-[72mm] shrink-0 bg-gray-900 p-5 text-gray-300">
        <EditableSection module="profile">
          <div className="mb-6 text-center">
            {avatar?.src && !avatar.hidden && (
              <img
                src={avatar.src}
                alt={profile?.name ?? ''}
                className="mx-auto mb-3 border-2 border-gray-700 object-cover"
                style={avatarStyle(avatar)}
              />
            )}
            <h1 className="text-xl font-bold text-white">{profile?.name}</h1>
            {profile?.positionTitle && (
              <p className="mt-1 text-xs text-resume-primary">{profile.positionTitle}</p>
            )}
          </div>

          <div className="mb-6 space-y-2 text-xs">
            {profile?.mobile && (
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" />
                <span>{profile.mobile}</span>
              </div>
            )}
            {profile?.email && (
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile?.github && (
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" />
                <span>github.com/{profile.github}</span>
              </div>
            )}
            {profile?.zhihu && (
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" />
                <span>{profile.zhihu}</span>
              </div>
            )}
            {profile?.workPlace && (
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" />
                <span>{profile.workPlace}</span>
              </div>
            )}
            {profile?.workExpYear && (
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-resume-primary shrink-0" />
                <span>{t('common.yearsExp', { years: profile.workExpYear })}</span>
              </div>
            )}
          </div>
        </EditableSection>

        {/* 专业技能 */}
        {!isHidden(config, 'skillList') && config.skillList?.length && (
          <EditableSection module="skillList">
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold text-white">
                {getTitle(config, 'skillList', t('module.skillList'))}
              </h3>
              {config.skillList.map((skill) => (
                <div key={skill.id} className="mb-2">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-300">{skill.skillName}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-700">
                    <div
                      className="h-1 rounded-full bg-resume-primary"
                      style={{ width: `${skill.skillLevel ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </EditableSection>
        )}

        {/* 教育经历 */}
        {!isHidden(config, 'educationList') && config.educationList?.length && (
          <EditableSection module="educationList">
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold text-white">
                {getTitle(config, 'educationList', t('module.educationList'))}
              </h3>
              {config.educationList.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="text-xs font-semibold text-white">{edu.school}</p>
                  <p className="text-xs text-gray-400">
                    {edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}
                  </p>
                  <TimeRange time={edu.eduTime} />
                </div>
              ))}
            </div>
          </EditableSection>
        )}

        {/* 荣誉奖项 */}
        {!isHidden(config, 'awardList') && config.awardList?.length && (
          <EditableSection module="awardList">
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold text-white">
                {getTitle(config, 'awardList', t('module.awardList'))}
              </h3>
              {config.awardList.map((award) => (
                <div key={award.id} className="mb-1.5 text-xs">
                  <span className="text-gray-300">{award.awardInfo}</span>
                  {award.awardTime && (
                    <span className="ml-1 text-gray-500">({award.awardTime})</span>
                  )}
                </div>
              ))}
            </div>
          </EditableSection>
        )}
      </aside>

      {/* 右栏 */}
      <main className="flex-1 p-6">
        {/* 工作经历 */}
        {!isHidden(config, 'workExpList') && config.workExpList?.length && (
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
                  <div className="mt-2">
                    <Markdown content={work.workDesc} />
                  </div>
                </div>
              ))}
            </section>
          </EditableSection>
        )}

        {/* 项目经历 */}
        {!isHidden(config, 'projectList') && config.projectList?.length && (
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
                  {proj.projectDesc && (
                    <p className="mt-1 text-xs text-gray-500">{proj.projectDesc}</p>
                  )}
                  {proj.projectContent && (
                    <div className="mt-2">
                      <Markdown content={proj.projectContent} />
                    </div>
                  )}
                </div>
              ))}
            </section>
          </EditableSection>
        )}

        {/* 个人作品 */}
        {!isHidden(config, 'workList') && config.workList?.length && (
          <EditableSection module="workList">
            <section className="mb-5">
              <SectionTitle title={getTitle(config, 'workList', t('module.workList'))} />
              <div className="grid grid-cols-2 gap-2">
                {config.workList.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <p className="text-sm font-semibold text-gray-800">{item.workName}</p>
                    {item.workDesc && (
                      <p className="mt-0.5 text-xs text-gray-500">{item.workDesc}</p>
                    )}
                    {item.visitLink && (
                      <a
                        href={item.visitLink}
                        className="mt-1 inline-block text-xs text-resume-primary underline"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.visitLink}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </EditableSection>
        )}

        {/* 自我评价 */}
        {!isHidden(config, 'aboutme') && config.aboutme?.aboutmeDesc && (
          <EditableSection module="aboutme">
            <section className="mb-5">
              <SectionTitle title={getTitle(config, 'aboutme', t('module.aboutme'))} />
              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <Markdown content={config.aboutme.aboutmeDesc} />
              </div>
            </section>
          </EditableSection>
        )}
      </main>
    </div>
  );
}
