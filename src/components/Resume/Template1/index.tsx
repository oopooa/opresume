import type { ResumeConfig } from '@/types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden, avatarStyle } from '../shared';

interface Template1Props {
  config: ResumeConfig;
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mb-2 border-b-2 border-resume-primary pb-1 text-sm font-bold text-resume-primary">
      {title}
    </h3>
  );
}

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

export function Template1({ config }: Template1Props) {
  const { profile, avatar } = config;
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      {/* 左栏 */}
      <aside className="w-[70mm] shrink-0 bg-gray-50 p-5 print:bg-gray-50">
        {/* 头像 + 姓名 */}
        <EditableSection module="profile">
          <div className="mb-4 text-center">
            {avatar?.src && !avatar.hidden && (
              <img
                src={avatar.src}
                alt={profile?.name ?? ''}
                className="mx-auto mb-2 object-cover"
                style={avatarStyle(avatar)}
              />
            )}
            <h1 className="text-xl font-bold text-resume-primary">
              {profile?.name}
            </h1>
            {profile?.positionTitle && (
              <p className="mt-0.5 text-xs text-gray-600">{profile.positionTitle}</p>
            )}
          </div>

          {/* 联系方式 */}
          <div className="mb-4 space-y-1 text-xs text-gray-600">
            {profile?.mobile && <p>{profile.mobile}</p>}
            {profile?.email && <p>{profile.email}</p>}
            {profile?.github && <p>github.com/{profile.github}</p>}
            {profile?.zhihu && <p>{profile.zhihu}</p>}
            {profile?.workPlace && <p>{profile.workPlace}</p>}
            {profile?.workExpYear && <p>{t('common.yearsExp', { years: profile.workExpYear })}</p>}
          </div>
        </EditableSection>

        {/* 专业技能 */}
        {!isHidden(config, 'skillList') && config.skillList?.length && (
          <EditableSection module="skillList">
            <div className="mb-4">
              <SectionTitle title={getTitle(config, 'skillList', '专业技能')} />
              {config.skillList.map((skill) => (
                <SkillBar
                  key={skill.id}
                  name={skill.skillName ?? ''}
                  level={skill.skillLevel ?? 0}
                />
              ))}
            </div>
          </EditableSection>
        )}

        {/* 教育经历 */}
        {!isHidden(config, 'educationList') && config.educationList?.length && (
          <EditableSection module="educationList">
            <div className="mb-4">
              <SectionTitle title={getTitle(config, 'educationList', '教育经历')} />
              {config.educationList.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="text-xs font-semibold">{edu.school}</p>
                  <p className="text-xs text-gray-600">
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
            <div className="mb-4">
              <SectionTitle title={getTitle(config, 'awardList', '荣誉奖项')} />
              {config.awardList.map((award) => (
                <div key={award.id} className="mb-1 flex items-start justify-between text-xs">
                  <span>{award.awardInfo}</span>
                  {award.awardTime && (
                    <span className="ml-2 shrink-0 text-gray-500">{award.awardTime}</span>
                  )}
                </div>
              ))}
            </div>
          </EditableSection>
        )}
      </aside>

      {/* 右栏 */}
      <main className="flex-1 p-5">
        {/* 工作经历 */}
        {!isHidden(config, 'workExpList') && config.workExpList?.length && (
          <EditableSection module="workExpList">
            <section className="mb-4">
              <SectionTitle title={getTitle(config, 'workExpList', '工作经历')} />
              {config.workExpList.map((work) => (
                <div key={work.id} className="mb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{work.companyName}</p>
                      {work.departmentName && (
                        <p className="text-xs text-gray-600">{work.departmentName}</p>
                      )}
                    </div>
                    <TimeRange time={work.workTime} />
                  </div>
                  <div className="mt-1">
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
            <section className="mb-4">
              <SectionTitle title={getTitle(config, 'projectList', '项目经历')} />
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
        )}

        {/* 个人作品 */}
        {!isHidden(config, 'workList') && config.workList?.length && (
          <EditableSection module="workList">
            <section className="mb-4">
              <SectionTitle title={getTitle(config, 'workList', '个人作品')} />
              {config.workList.map((item) => (
                <div key={item.id} className="mb-2">
                  <p className="text-sm font-semibold">
                    {item.workName}
                    {item.visitLink && (
                      <a
                        href={item.visitLink}
                        className="ml-2 text-xs font-normal text-resume-primary underline"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.visitLink}
                      </a>
                    )}
                  </p>
                  {item.workDesc && (
                    <p className="text-xs text-gray-600">{item.workDesc}</p>
                  )}
                </div>
              ))}
            </section>
          </EditableSection>
        )}

        {/* 自我评价 */}
        {!isHidden(config, 'aboutme') && config.aboutme?.aboutmeDesc && (
          <EditableSection module="aboutme">
            <section className="mb-4">
              <SectionTitle title={getTitle(config, 'aboutme', '自我评价')} />
              <Markdown content={config.aboutme.aboutmeDesc} />
            </section>
          </EditableSection>
        )}
      </main>
    </div>
  );
}
