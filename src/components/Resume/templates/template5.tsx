import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  EditableSection,
  ResumeAvatar,
  getProfileIcon,
  useCustomFieldIconMap,
  ProfileField,
  usePrivacyMask,
} from '../shared';

/* ---------- SectionTitle ----------
 * 学术 CV 风格：全大写、字距加宽、底部细线，无图标。
 */

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mt-3 mb-2 border-b border-gray-400 pb-0.5 resume-title-text font-normal uppercase tracking-wider text-gray-700">
      {title}
    </h3>
  );
}

/* ---------- StyleTokens ---------- */

const tokens: StyleTokens = {
  spacing: { module: 'mb-3', item: 'mb-2' },
  typography: {
    titleWeight: 'font-bold',
    titleSize: 'resume-body-text',
    contentSize: 'resume-body-text',
  },
  colors: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
  },
  components: { SectionTitle },
  variants: { skill: 'list', project: 'detailed', education: 'stacked' },
  layout: { awardTimeInline: false, flexAlign: 'items-baseline' },
};

/* ---------- LayoutShell ---------- */

function Template5Shell({ config, mainContent, pageIndex = 0 }: LayoutShellProps) {
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { t } = useTranslation();
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  const customFields = (config['x-op-customFields'] ?? []).filter(
    (f) => f.key.trim() || f.value.trim(),
  );

  return (
    <div className="resume-sheet bg-white font-serif text-gray-900 shadow-lg print:shadow-none">
      <div className="resume-padding">
        {pageIndex === 0 && (
          <EditableSection module="profile">
            <div className="mb-4">
              <div className="mb-3 flex flex-col items-center">
                <ResumeAvatar avatar={avatar} name={basics?.name} />
                <h1 className="resume-name-text text-center uppercase tracking-[0.2em] font-bold text-gray-900">
                  {mask(basics?.name, 'name')}
                </h1>
                {basics?.label && (
                  <p className="mt-1 text-center text-sm italic text-gray-600">{basics.label}</p>
                )}
              </div>
              <div
                className={cn(
                  'mx-auto grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-700',
                  'max-w-[140mm]',
                )}
              >
                {basics?.email && (
                  <ProfileField icon={getProfileIcon('email')} label={t('field.email')}>
                    {mask(basics.email, 'email')}
                  </ProfileField>
                )}
                {basics?.phone && (
                  <ProfileField icon={getProfileIcon('mobile')} label={t('field.mobile')}>
                    {mask(basics.phone, 'mobile')}
                  </ProfileField>
                )}
                {basics?.location?.city && (
                  <ProfileField icon={getProfileIcon('workPlace')} label={t('field.workPlace')}>
                    {mask(basics.location.city, 'workPlace')}
                  </ProfileField>
                )}
                {/* 学术 CV 不显示 age / workExpYear */}
                {customFields.map((field, i) => (
                  <ProfileField
                    key={`${field.key}-${i}`}
                    icon={customFieldIconMap[field.key]}
                    label={field.key}
                    href={field.url}
                  >
                    {field.value}
                  </ProfileField>
                ))}
              </div>
            </div>
          </EditableSection>
        )}
        {mainContent}
      </div>
    </div>
  );
}

/* ---------- 导出 ---------- */

const definition: TemplateDefinition = {
  id: 'template5',
  tags: ['singleColumn', 'multiPage', 'academic'],
  // 学术 CV 默认紧凑字号：正文 12px 以匹配目标导出（round3）；标题 16px / 行高 1.5。
  // 用户可在 AppearanceDrawer 中调整，调整值按模板记忆（见 getEffectiveTypography）。
  defaultTypography: { titleFontSize: 16, bodyFontSize: 12, lineHeight: 1.5 },
  defaultLayout: {
    sidebar: [],
    main: [
      'educationList',
      'grantList',
      'awardList',
      'publicationList',
      'posterList',
      'projectList',
      'teachingList',
      'workExpList',
    ],
  },
  getTokens: () => tokens,
  LayoutShell: Template5Shell,
};

export default definition;
