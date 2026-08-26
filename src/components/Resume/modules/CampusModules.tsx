/**
 * Campus Fresh Graduate（校园应届生）模板（template7）专用模块渲染器。
 *
 * 设计要点（对应 template/DHU_CV_Template.pdf）：
 * - 章节标题：主题色 Lucide 图标 + 黑色加粗标题 + 主题色细分隔线
 * - 正文字体：Noto Sans SC（替代方正兰亭黑 FZLTHPro，免费可商用）
 * - 强调/标注字体：LXGW WenKai 霞鹜文楷（替代 FandolKai / 仿宋楷体风格，OFL 可商用）
 * - 教育经历：学校名加粗 + 右侧时间；专业与学历另起一行（学历用楷体）
 * - 项目/实践经验：标题行 = 项目名(加粗) + 角色(居中) + 时间(右)；`描述：`、`主要工作：` 楷体标注
 * - 工作经历：公司(加粗) + 职位(居中) + 时间(右)；正文为富文本要点
 * - 专业技能：黑色圆点要点列表（与 DHU 原稿一致）
 * - 主体色统一使用 CSS 变量 --campus-primary（由 LayoutShell 从校徽主色提取，见 template7.tsx）
 */
import type { ComponentType } from 'react';
import type { ModuleProps } from '../types';
import type { CourseItem, JsonEducation, JsonWork, JsonProject, JsonSkill, JsonAward } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { RichContent } from '@/components/RichContent';
import { DynamicIcon } from '@/components/DynamicIcon';
import { DEFAULT_MODULE_ICONS } from '@/config/icons';
import { useUIStore } from '@/store/ui';
import {
  EditableSection,
  PolishHost,
  getTitle,
  isHidden,
} from '../shared';

/* ------------------------------------------------------------------ */
/*  章节图标（使用 OPResume 已有 Lucide 图标，对应 DHU 原稿语义）      */
/* ------------------------------------------------------------------ */

const CAMPUS_MODULE_ICONS: Record<string, string> = {
  educationList: 'GraduationCap',
  campusCourses: 'BookOpen',
  projectList: 'FolderKanban',
  workExpList: 'Briefcase',
  skillList: 'Wrench',
  aboutme: 'User',
  awardList: 'Trophy',
  achievementList: 'Award',
};

/** 优先使用用户覆盖的图标，否则使用 Campus 默认图标 */
function useCampusModuleIcon(module: string): string | undefined {
  const userIcon = useUIStore((s) => s.moduleIconMap[module]);
  return userIcon || CAMPUS_MODULE_ICONS[module] || DEFAULT_MODULE_ICONS[module];
}

/* ------------------------------------------------------------------ */
/*  章节标题                                                            */
/* ------------------------------------------------------------------ */

/**
 * 章节标题：主题色模块图标 + 黑色加粗标题 + 下方主题色细线。
 * 图标/细线颜色均取 --campus-primary（由模板从校徽主色提取，见 template7.tsx）。
 */
export function CampusSectionTitle({ title, icon, showIcons }: { title: string; icon?: string; showIcons?: boolean }) {
  return (
    <div className="campus-section-title">
      <div className="campus-section-title-row">
        {showIcons !== false && (
          <DynamicIcon name={icon} className="campus-section-icon h-4 w-4" />
        )}
        <h2 className="campus-section-title-text">{title}</h2>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  通用小部件                                                         */
/* ------------------------------------------------------------------ */

/** 统一日期展示：YYYY-MM / YYYY-M / YYYY-MM-DD 转为 YYYY/MM / YYYY/MM/DD */
function formatCampusDate(value?: string, presentLabel?: string): string {
  if (!value) return '';
  if (value === 'present' || value === '至今' || value === 'Present') {
    return presentLabel ?? '至今';
  }
  const m = value.match(/^(\d{4})[-\/.](\d{1,2})(?:[-\/.](\d{1,2}))?$/);
  if (m) {
    const month = m[2].padStart(2, '0');
    if (m[3]) return `${m[1]}/${month}/${m[3].padStart(2, '0')}`;
    return `${m[1]}/${month}`;
  }
  return value;
}

function TimeRange({ startDate, endDate, presentLabel }: { startDate?: string; endDate?: string; presentLabel?: string }) {
  if (!startDate && !endDate) return null;
  const display = (v?: string) => formatCampusDate(v, presentLabel);
  return (
    <span className="campus-date">
      {display(startDate)}{startDate && endDate ? ' - ' : ''}{display(endDate)}
    </span>
  );
}

/** 楷体标注（描述：/主要工作：/学历 等） */
function KaiLabel({ children }: { children: React.ReactNode }) {
  return <span className="campus-kai">{children}</span>;
}

/* ------------------------------------------------------------------ */
/*  教育经历（educationList 覆盖）                                     */
/*  第 1 行：学校（加粗）… 时间（右对齐）                              */
/*  第 2 行：专业（缩进） - 学历（楷体）                               */
/* ------------------------------------------------------------------ */

function EducationRenderer({ config, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useCampusModuleIcon('educationList');
  if (isHidden(config, 'educationList') || !config.education?.length) return null;

  const all = config.education as JsonEducation[];
  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const offset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="educationList">
      <section className="campus-section">
        {showTitle && (
          <CampusSectionTitle title={getTitle(config, 'educationList', t('module.educationList'))} icon={moduleIcon} />
        )}
        {list.map((edu, i) => (
          <div key={edu['x-op-id'] ?? i} className="campus-item campus-education" data-item-index={offset + i}>
            <div className="campus-item-head">
              <span className="campus-bold">{edu.institution}</span>
              <TimeRange startDate={edu.startDate} endDate={edu.endDate} />
            </div>
            {(edu.area || edu.studyType) && (
              <div className="campus-item-sub">
                {edu.area && <span>{edu.area}</span>}
                {edu.area && edu.studyType && <span className="campus-nowrap"> - </span>}
                {edu.studyType && <KaiLabel>{edu.studyType}</KaiLabel>}
              </div>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}

/* ------------------------------------------------------------------ */
/*  修读课程（campusCourses，数据：x-op-courses: {id,text}[]）             */
/* ------------------------------------------------------------------ */

function CoursesRenderer({ config, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useCampusModuleIcon('campusCourses');
  const courses = config['x-op-courses'] ?? [];
  const all = courses as CourseItem[];
  if (isHidden(config, 'campusCourses') || !all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const offset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="campusCourses">
      <section className="campus-section">
        {showTitle && (
          <CampusSectionTitle title={getTitle(config, 'campusCourses', t('module.campusCourses'))} icon={moduleIcon} />
        )}
        {list.map((c, i) => (
          <div key={c.id ?? i} className="campus-item campus-bullet" data-item-index={offset + i}>
            <span className="campus-bullet-dot" aria-hidden="true">•</span>
            <span className="campus-bullet-text">{c.text}</span>
          </div>
        ))}
      </section>
    </EditableSection>
  );
}

/* ------------------------------------------------------------------ */
/*  实践经验（projectList 覆盖）                                       */
/*  标题行：项目名（加粗）+ 角色（居中）+ 时间（右）                   */
/*  `描述：`（楷体）+ 描述文本；`主要工作：`（楷体）+ 富文本要点       */
/* ------------------------------------------------------------------ */

function ProjectRenderer({ config, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useCampusModuleIcon('projectList');
  const all = (config.projects ?? []).filter(
    (p) => !(p as JsonProject)['x-op-type'] || (p as JsonProject)['x-op-type'] === 'project',
  ) as JsonProject[];
  if (isHidden(config, 'projectList') || !all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const offset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="projectList">
      <section className="campus-section">
        {showTitle && (
          <CampusSectionTitle title={getTitle(config, 'projectList', t('module.projectList'))} icon={moduleIcon} />
        )}
        {list.map((proj, i) => {
          const items = (proj['x-op-projectContentHtml'] ?? '').trim();
          return (
            <div key={proj['x-op-id'] ?? i} className="campus-item campus-project-item" data-item-index={offset + i}>
              <div className="campus-item-head campus-item-head-with-role">
                <div className="campus-head-left">
                  <span className="campus-project-dot" aria-hidden="true">•</span>
                  <span className="campus-bold campus-ellipsis">{proj.name}</span>
                </div>
                {proj.roles?.[0] && <span className="campus-role campus-head-center">{proj.roles[0]}</span>}
                <div className="campus-head-right">
                  <TimeRange startDate={proj.startDate} endDate={proj.endDate} />
                </div>
              </div>
              {proj.description && (
                <div className="campus-item-sub">
                  <KaiLabel>-描述：</KaiLabel>
                  <span className="campus-plain">{proj.description}</span>
                </div>
              )}
              {items && (
                <div className="campus-item-sub campus-project-works-sub">
                  <KaiLabel>-主要工作：</KaiLabel>
                  <PolishHost className="campus-rich campus-project-works" itemIndex={offset + i}>
                    <RichContent content={items} />
                  </PolishHost>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </EditableSection>
  );
}

/* ------------------------------------------------------------------ */
/*  工作经历（workExpList 覆盖）                                       */
/*  标题行：公司（加粗）+ 岗位（居中）+ 时间（右）；富文本要点          */
/* ------------------------------------------------------------------ */

function WorkRenderer({ config, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useCampusModuleIcon('workExpList');
  const all = (config.work ?? []) as JsonWork[];
  if (isHidden(config, 'workExpList') || !all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const offset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="workExpList">
      <section className="campus-section">
        {showTitle && (
          <CampusSectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} icon={moduleIcon} />
        )}
        {list.map((work, i) => (
          <div key={work['x-op-id'] ?? i} className="campus-item" data-item-index={offset + i}>
            <div className="campus-item-head campus-item-head-with-role">
              <div className="campus-head-left">
                <span className="campus-bold campus-ellipsis">{work.name || work.position}</span>
              </div>
              {work.position && <span className="campus-role campus-head-center">{work.position}</span>}
              <div className="campus-head-right">
                <TimeRange startDate={work.startDate} endDate={work.endDate} />
              </div>
            </div>
            {work['x-op-workDescHtml'] && (
              <PolishHost className="campus-rich" itemIndex={offset + i}>
                <RichContent content={work['x-op-workDescHtml']} />
              </PolishHost>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}

/* ------------------------------------------------------------------ */
/*  专业技能（skillList 覆盖）：• 要点列表                              */
/* ------------------------------------------------------------------ */

function SkillRenderer({ config, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useCampusModuleIcon('skillList');
  const all = (config.skills ?? []) as JsonSkill[];
  if (isHidden(config, 'skillList') || !all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const offset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="skillList">
      <section className="campus-section">
        {showTitle && (
          <CampusSectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} icon={moduleIcon} />
        )}
        {list.map((skill, i) => (
          <div key={skill['x-op-id'] ?? i} className="campus-item campus-bullet" data-item-index={offset + i}>
            <span className="campus-bullet-dot" aria-hidden="true">•</span>
            <span className="campus-bullet-text">
              {skill.name}
              {skill.level && <span className="campus-muted"> — {skill.level}</span>}
            </span>
          </div>
        ))}
      </section>
    </EditableSection>
  );
}


/* ------------------------------------------------------------------ */
/*  荣誉奖项（awardList 覆盖）：与专业技能一致，使用 • 要点列表        */
/* ------------------------------------------------------------------ */

function AwardRenderer({ config, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useCampusModuleIcon('awardList');
  const all = (config.awards ?? []) as JsonAward[];
  if (isHidden(config, 'awardList') || !all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const offset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="awardList">
      <section className="campus-section">
        {showTitle && (
          <CampusSectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} icon={moduleIcon} />
        )}
        {list.map((award, i) => (
          <div key={award['x-op-id'] ?? i} className="campus-item campus-bullet" data-item-index={offset + i}>
            <span className="campus-bullet-dot" aria-hidden="true">•</span>
            <span className="campus-bullet-text">
              {award.title}
              {award.date && <span className="campus-muted"> ({formatCampusDate(award.date)})</span>}
            </span>
          </div>
        ))}
      </section>
    </EditableSection>
  );
}

/* ------------------------------------------------------------------ */
/*  模板级注册表：本模板对共享模块的渲染覆盖                           */
/* ------------------------------------------------------------------ */

export const CAMPUS_TEMPLATE_ID = 'template7';

/** 覆盖共享模块的渲染（键与共享模块一致，仅在本模板生效） */
export const CAMPUS_STYLE_OVERRIDES: Record<string, ComponentType<ModuleProps>> = {
  educationList: EducationRenderer,
  projectList: ProjectRenderer,
  workExpList: WorkRenderer,
  skillList: SkillRenderer,
  awardList: AwardRenderer,
};

/** 本模板新增的模块（其他模板不引用，无副作用） */
export const CAMPUS_EXTRA_MODULES: Record<string, ComponentType<ModuleProps>> = {
  campusCourses: CoursesRenderer,
};