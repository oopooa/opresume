/**
 * Campus Fresh Graduate（校园应届生）模板（template7）
 *
 * 复刻《DHU_CV_Template.pdf》的整体框架：
 * - 左上角：学校 logo（优先使用用户上传的校徽 `x-op-schoolLogo`；无上传时按
 *   教育经历第一条的学校名查内置离线品牌库，也可在“自定义字段”里填 `校徽链接` 指定）
 * - 右上角：证件照（`x-op-avatar`）
 * - 居中：姓名 + 联系信息
 * - 章节：主题色 Lucide 模块图标 + 黑色标题 + 主题色分隔线（主体色从校徽图片提取，**先排除
 *   空白/近白背景**再取主色；默认回退 #A9021F）
 * - 页脚：主题色横条（色条与章节箭头/分隔线共用 --campus-primary，随校徽主色自适应）
 *
 * 学校 logo 解析顺序（全部失败则隐藏 logo、保留默认主色；全程浏览器端、零网络依赖）：
 *   1. 用户上传的校徽（`x-op-schoolLogo.src`，data URL）
 *   2. 自定义字段 `校徽链接` / `schoolLogo` 等 → 直接使用
 *   3. 内置精选高校品牌库（campus-brands.ts，离线）
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { School } from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { toast } from 'sonner';
import type { TemplateDefinition, StyleTokens } from '../types';
import type { JsonResume } from '@/types/json-resume';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import { cn } from '@/lib/utils';
import {
  EditableSection,
  calculateAge,
  usePrivacyMask,
} from '../shared';
import { CAMPUS_TEMPLATE_ID, CampusSectionTitle } from '../modules/CampusModules';
import {
  resolveSchoolBrand,
  ACCENT_FALLBACK,
  type SchoolBrand,
} from '../modules/campus-brands';
import { loadSchoolLogoImage, extractAccentColorFromImage } from '../modules/campus-logo';

const LOGO_MAX_SIZE = 1024 * 1024;
const LOGO_ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg']);

/** 校园模板默认校徽：东华大学 logo（本地静态资源，随模板内置） */
const DEFAULT_SCHOOL_LOGO = '/school-logos/dhu-logo.png';

/* ------------------------------------------------------------------ */
/*  校徽品牌解析：logo + 主体色（浏览器端，带模块级缓存）               */
/* ------------------------------------------------------------------ */

const brandCache = new Map<string, SchoolBrand>();

async function loadBrand(schoolName: string): Promise<SchoolBrand> {
  const key = schoolName.trim();
  if (!key) return { logoUrl: '', color: ACCENT_FALLBACK };
  const cached = brandCache.get(key);
  if (cached) return cached;
  const brand = await resolveSchoolBrand(key);
  brandCache.set(key, brand);
  return brand;
}

function useSchoolBrand(config: JsonResume): { logoUrl: string; color: string } {
  const [brand, setBrand] = useState<SchoolBrand>({ logoUrl: '', color: ACCENT_FALLBACK });

  const schoolName = useMemo(() => {
    // 用户可在自定义字段中用“学校名称”覆盖（默认取第一段教育经历的学校名）
    const custom = config['x-op-customFields']?.find((f) => /学校名称|schoolName/i.test(f.key));
    const first = config.education?.[0]?.institution;
    return (custom?.value || first || '').trim();
  }, [config]);

  const uploadedSrc = config['x-op-schoolLogo']?.src ?? '';

  const customLink = useMemo(
    () => config['x-op-customFields']?.find((f) => /校徽链接|schoolLogo/i.test(f.key))?.value?.trim() ?? '',
    [config],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 解析链：用户上传 → 自定义字段链接 → 内置品牌库（全部离线）
      const sources: Array<() => Promise<SchoolBrand>> = [];
      if (uploadedSrc) sources.push(async () => ({ logoUrl: uploadedSrc, color: ACCENT_FALLBACK }));
      if (customLink) sources.push(async () => ({ logoUrl: customLink, color: ACCENT_FALLBACK }));
      sources.push(() => loadBrand(schoolName)); // 品牌库未命中时 logoUrl 为空

      for (const make of sources) {
        let b: SchoolBrand;
        try { b = await make(); } catch { continue; }
        if (!b.logoUrl) continue;
        if (cancelled) return;
        setBrand(b);
        // 图片加载成功后提取主底色：先排除空白/近白背景，再适配色条（--campus-primary）
        try {
          const img = await loadSchoolLogoImage(b.logoUrl);
          if (cancelled) return;
          const c = extractAccentColorFromImage(img);
          if (c) setBrand({ logoUrl: b.logoUrl, color: c });
        } catch { /* 图片加载失败/Canvas 污染：保留当前候选色 */ }
        return; // 已有可用 logo，停止解析链
      }

      if (!cancelled) {
        // 未命中任何来源时，使用模板默认校徽（东华大学，本地内置）并尝试提取主色
        setBrand({ logoUrl: DEFAULT_SCHOOL_LOGO, color: ACCENT_FALLBACK });
        try {
          const img = await loadSchoolLogoImage(DEFAULT_SCHOOL_LOGO);
          if (cancelled) return;
          const c = extractAccentColorFromImage(img);
          if (c) setBrand({ logoUrl: DEFAULT_SCHOOL_LOGO, color: c });
        } catch { /* 加载失败保留默认色 */ }
      }
    })();

    return () => { cancelled = true; };
  }, [uploadedSrc, schoolName, customLink]);

  return brand;
}

/* ------------------------------------------------------------------ */
/*  校徽上传占位区（未上传时显示在左上角，点击上传）                   */
/* ------------------------------------------------------------------ */

function CampusLogoPlaceholder() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const update = useResumeStore((s) => s.update);
  const openEditor = useUIStore((s) => s.openEditor);

  const handleFile = useCallback(
    async (file: File) => {
      if (!LOGO_ACCEPTED_TYPES.has(file.type)) {
        toast.error(t('field.invalidFileType'));
        return;
      }
      if (file.size > LOGO_MAX_SIZE) {
        toast.error(t('field.schoolLogoTooLarge'));
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      update({ 'x-op-schoolLogo': { src: dataUrl, hidden: false } });
    },
    [t, update],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  return (
    <>
      <button
        type="button"
        className={cn(
          'campus-logo campus-logo-placeholder campus-editable-image print:hidden',
        )}
        onClick={(e) => { e.stopPropagation(); openEditor('profile'); }}
        aria-label={t('field.uploadSchoolLogo')}
      >
        <span className="campus-logo-placeholder-inner">
          <School className="h-5 w-5" />
          <span className="campus-logo-placeholder-text">{t('field.uploadSchoolLogo')}</span>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        aria-label={t('field.uploadSchoolLogo')}
        onChange={onChange}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  头部（姓名 + 联系信息）                                            */
/* ------------------------------------------------------------------ */

function Header({ config }: { config: JsonResume }) {
  const { t } = useTranslation();
  const basics = config.basics;
  const mask = usePrivacyMask();
  const showIcons = useUIStore((s) => s.showIcons);
  const age = calculateAge(config['x-op-birthday']);
  const workPlace = basics?.location?.city || basics?.location?.region;
  const showAge = age !== null && !config['x-op-ageHidden'];
  const showLabel = !!basics?.label && config['x-op-showJobTitle'] === true;

  const contactItem = (icon: string, children: ReactNode, href?: string) => (
    <span className="campus-contact-item">
      {showIcons && <DynamicIcon name={icon} className="campus-contact-icon h-3 w-3" />}
      {href ? (
        <a className="campus-contact-link" href={href}>{children}</a>
      ) : (
        <span>{children}</span>
      )}
    </span>
  );

  // ── 智能自动居中布局 ──────────────────────────────────────────
  // 三种模式：
  // 1. 不显示岗位，且隐藏年龄：地点/电话/邮箱/自定义直接在姓名下方一行居中；
  // 2. 不显示岗位：年龄+地点一行，电话+邮箱+自定义一行（两行居中版式）；
  // 3. 显示岗位：岗位放在姓名正下方，年龄/地点/电话/邮箱/自定义合并为一行居中。
  const customFields = (config['x-op-customFields'] ?? []).filter(
    (f) => (f.key ?? '').trim() || (f.value ?? '').trim(),
  );

  const hasLocation = !!workPlace;
  const hasPhone = !!basics?.phone;
  const hasEmail = !!basics?.email;
  const hasCustom = customFields.length > 0;
  const hasRow1 = showAge || hasLocation;
  const hasRow2 = hasPhone || hasEmail || hasCustom;
  const hasAnyContact = hasRow1 || hasRow2;

  return (
    <div className="campus-header">
      {/* 姓名行：始终独立一行居中 */}
      <div className="campus-header-name-row">
        <h1 className="campus-name">{mask(basics?.name, 'name') || ' '}</h1>
      </div>

      {/* 显示岗位时：岗位放在姓名正下方 */}
      {showLabel && (
        <div className="campus-header-role-line">
          <span className="campus-header-role">{basics.label}</span>
        </div>
      )}

      {/* 模式 3：显示岗位时，其余基础信息合并为一行 */}
      {showLabel && hasAnyContact && (
        <div className="campus-contact">
          {showAge && contactItem('Cake', t('field.age', { age }))}
          {workPlace && contactItem('MapPin', mask(workPlace, 'workPlace'))}
          {basics?.phone && contactItem('Phone', mask(basics.phone, 'mobile'))}
          {basics?.email && contactItem('Mail', mask(basics.email, 'email'), `mailto:${basics.email}`)}
          {customFields.map((f, i) => (
            <span key={`${f.key}-${i}`} className="campus-contact-item campus-contact-custom">
              <span>{f.key}：{f.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* 模式 2：不显示岗位时，沿用两行居中版式 */}
      {!showLabel && showAge && (
        <>
          {hasRow1 && (
            <div className="campus-contact">
              {showAge && contactItem('Cake', t('field.age', { age }))}
              {workPlace && contactItem('MapPin', mask(workPlace, 'workPlace'))}
            </div>
          )}
          {hasRow2 && (
            <div className="campus-contact">
              {basics?.phone && contactItem('Phone', mask(basics.phone, 'mobile'))}
              {basics?.email && contactItem('Mail', mask(basics.email, 'email'), `mailto:${basics.email}`)}
              {customFields.map((f, i) => (
                <span key={`${f.key}-${i}`} className="campus-contact-item campus-contact-custom">
                  <span>{f.key}：{f.value}</span>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* 模式 1：不显示岗位且隐藏年龄时，剩余信息在姓名下方一行居中 */}
      {!showLabel && !showAge && hasAnyContact && (
        <div className="campus-contact">
          {workPlace && contactItem('MapPin', mask(workPlace, 'workPlace'))}
          {basics?.phone && contactItem('Phone', mask(basics.phone, 'mobile'))}
          {basics?.email && contactItem('Mail', mask(basics.email, 'email'), `mailto:${basics.email}`)}
          {customFields.map((f, i) => (
            <span key={`${f.key}-${i}`} className="campus-contact-item campus-contact-custom">
              <span>{f.key}：{f.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LayoutShell                                                       */
/* ------------------------------------------------------------------ */

function Template7Shell({ config, mainContent, pageIndex = 0 }: {
  config: JsonResume;
  sidebarContent?: ReactNode;
  mainContent: ReactNode;
  pageIndex?: number;
}) {
  const { t } = useTranslation();
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { logoUrl, color } = useSchoolBrand(config);
  const logoHidden = config['x-op-schoolLogo']?.hidden === true;
  const isFirstPage = pageIndex === 0;
  const openEditor = useUIStore((s) => s.openEditor);

  const style = { '--campus-primary': color } as CSSProperties;

  return (
    <div className="campus-resume relative min-h-[297mm] w-[210mm] bg-white text-gray-900 shadow-lg print:shadow-none" style={style}>
      {/* 左上角校徽（已上传）或上传占位区（未上传）：点击打开 Profile 编辑器 */}
      {isFirstPage && !logoHidden && (
        logoUrl ? (
          <button
            type="button"
            className="campus-logo campus-editable-image"
            onClick={(e) => { e.stopPropagation(); openEditor('profile'); }}
            aria-label={t('field.schoolLogo')}
          >
            <img className="campus-logo-img" src={logoUrl} alt={config.education?.[0]?.institution ?? '校徽'} crossOrigin="anonymous" />
          </button>
        ) : (
          <CampusLogoPlaceholder />
        )
      )}

      {/* 右上角证件照：点击打开 Profile 编辑器 */}
      {isFirstPage && avatar?.src && !avatar.hidden && (
        <button
          type="button"
          className="campus-photo campus-editable-image"
          onClick={(e) => { e.stopPropagation(); openEditor('profile'); }}
          aria-label={t('field.avatar')}
        >
          <img className="campus-photo-img" src={avatar.src} alt={basics?.name ?? '证件照'} />
        </button>
      )}

      <div className="resume-padding">
        {isFirstPage && (
          <EditableSection module="profile">
            <Header config={config} />
          </EditableSection>
        )}
        {mainContent}
      </div>

      {/* 页脚主体色横条 */}
      <div className="campus-footer-bar" aria-hidden="true" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StyleTokens                                                       */
/* ------------------------------------------------------------------ */

const tokens: StyleTokens = {
  spacing: { module: 'campus-section-space', item: 'campus-item-space' },
  typography: {
    titleWeight: 'font-semibold',
    titleSize: 'resume-title-text',
    contentSize: 'resume-body-text',
  },
  colors: { primary: 'text-gray-900', secondary: 'text-gray-600', muted: 'text-gray-400' },
  components: {
    SectionTitle: (props) => {
      const showIcons = useUIStore((s) => s.showIcons);
      return <CampusSectionTitle {...props} showIcons={showIcons} />;
    },
  },
  variants: { skill: 'list', project: 'detailed', education: 'inline' },
  layout: { awardTimeInline: true, flexAlign: 'items-baseline' },
};

/* ------------------------------------------------------------------ */
/*  export                                                            */
/* ------------------------------------------------------------------ */

const definition: TemplateDefinition = {
  id: CAMPUS_TEMPLATE_ID,
  tags: ['singleColumn', 'singlePage'],
  defaultLayout: {
    sidebar: [],
    main: [
      'educationList',
      'campusCourses',
      'projectList',
      'workExpList',
      'skillList',
      'awardList',
      'aboutme',
      'achievementList',
    ],
  },
  getTokens: () => tokens,
  LayoutShell: Template7Shell,
};

export default definition;