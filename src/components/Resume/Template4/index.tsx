import type { ResumeConfig } from '@/types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden, ResumeAvatar, calculateAge } from '../shared';

interface Template4Props {
  config: ResumeConfig;
}

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

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-1 text-xs">
      <span className="shrink-0 text-gray-500">{label}：</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

export function Template4({ config }: Template4Props) {
  const { profile, avatar } = config;
  const { t } = useTranslation();
  const age = calculateAge(profile?.birthday);

  return (
    <div className="relative min-h-[297mm] w-[210mm] bg-white shadow-lg print:shadow-none">
      <div className="px-8 py-6 pl-10">
        {/* 页头 */}
        <EditableSection module="profile">
        <div className="mb-5 flex items-center gap-4 border-b-2 border-resume-primary pb-4">
          <ResumeAvatar avatar={avatar} name={profile?.name} className="shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-resume-primary">{profile?.name}</h1>
            {profile?.positionTitle && (
              <p className="mt-0.5 text-sm text-gray-600">{profile.positionTitle}</p>
            )}
          </div>
        </div>
        </EditableSection>

        {/* 基本信息 */}
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

        {/* 工作经历 */}
        {!isHidden(config, 'workExpList') && config.workExpList?.length && (
          <EditableSection module="workExpList">
            <div className="mb-5">
              <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} />
              {config.workExpList.map((work) => (
                <div key={work.id} className="mb-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-bold text-gray-800">{work.companyName}</p>
                      {work.departmentName && (
                        <span className="text-xs text-gray-500">{work.departmentName}</span>
                      )}
                    </div>
                    <TimeRange time={work.workTime} />
                  </div>
                  <div className="mt-1">
                    <Markdown content={work.workDesc} />
                  </div>
                </div>
              ))}
            </div>
          </EditableSection>
        )}

        {/* 项目经历 */}
        {!isHidden(config, 'projectList') && config.projectList?.length && (
          <EditableSection module="projectList">
            <div className="mb-5">
              <SectionTitle title={getTitle(config, 'projectList', t('module.projectList'))} />
              {config.projectList.map((proj) => (
                <div key={proj.id} className="mb-4">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-bold text-gray-800">{proj.projectName}</p>
                      {proj.projectRole && (
                        <span
                          className="rounded px-1.5 py-0.5 text-xs"
                          style={{ backgroundColor: 'color-mix(in srgb, var(--resume-tag) 20%, transparent)', color: 'var(--resume-tag)' }}
                        >
                          {proj.projectRole}
                        </span>
                      )}
                    </div>
                    <TimeRange time={proj.projectTime} />
                  </div>
                  {proj.projectDesc && (
                    <p className="mt-1 text-xs text-gray-500">{proj.projectDesc}</p>
                  )}
                  {proj.projectContent && (
                    <div className="mt-1">
                      <Markdown content={proj.projectContent} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </EditableSection>
        )}

        {/* 专业技能 */}
        {!isHidden(config, 'skillList') && config.skillList?.length && (
          <EditableSection module="skillList">
            <div className="mb-5">
              <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} />
              <ul className="list-inside space-y-1">
                {config.skillList.map((skill, i) => (
                  <li key={skill.id} className="text-sm text-gray-700">
                    <span className="mr-1 text-xs font-semibold text-resume-primary">{i + 1}.</span>
                    {skill.skillName}
                    {skill.skillDesc && (
                      <span className="ml-1 text-xs text-gray-400">— {skill.skillDesc}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </EditableSection>
        )}

        {/* 教育经历 */}
        {!isHidden(config, 'educationList') && config.educationList?.length && (
          <EditableSection module="educationList">
            <div className="mb-5">
              <SectionTitle title={getTitle(config, 'educationList', t('module.educationList'))} />
              {config.educationList.map((edu) => (
                <div key={edu.id} className="mb-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold text-gray-800">{edu.school}</p>
                    <span className="text-xs text-gray-500">
                      {edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}
                    </span>
                  </div>
                  <TimeRange time={edu.eduTime} />
                </div>
              ))}
            </div>
          </EditableSection>
        )}

        {/* 荣誉奖项 */}
        {!isHidden(config, 'awardList') && config.awardList?.length && (
          <EditableSection module="awardList">
            <div className="mb-5">
              <SectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} />
              {config.awardList.map((award) => (
                <div key={award.id} className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-gray-700">{award.awardInfo}</span>
                  {award.awardTime && (
                    <span className="text-xs text-gray-400">{award.awardTime}</span>
                  )}
                </div>
              ))}
            </div>
          </EditableSection>
        )}

        {/* 个人作品 */}
        {!isHidden(config, 'workList') && config.workList?.length && (
          <EditableSection module="workList">
            <div className="mb-5">
              <SectionTitle title={getTitle(config, 'workList', t('module.workList'))} />
              {config.workList.map((item) => (
                <div key={item.id} className="mb-2">
                  <p className="text-sm font-semibold text-gray-800">
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
                    <p className="text-xs text-gray-500">{item.workDesc}</p>
                  )}
                </div>
              ))}
            </div>
          </EditableSection>
        )}

        {/* 自我评价 */}
        {!isHidden(config, 'aboutme') && config.aboutme?.aboutmeDesc && (
          <EditableSection module="aboutme">
            <div className="mb-5">
              <SectionTitle title={getTitle(config, 'aboutme', t('module.aboutme'))} />
              <Markdown content={config.aboutme.aboutmeDesc} />
            </div>
          </EditableSection>
        )}
      </div>
    </div>
  );
}
