import type { ReactNode } from 'react';
import { createContext, useCallback, useContext } from 'react';
import type { JsonResume } from '@/types/json-resume';
import type { Avatar } from '@/types/resume';
import { useUIStore } from '@/store/ui';
import { useTranslation } from 'react-i18next';
import { Avatar as AvatarUI, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { DEFAULT_MODULE_ICONS, DEFAULT_PROFILE_ICONS, DEFAULT_CUSTOM_MODULE_ICON } from '@/config/icons';
import { DynamicIcon } from '@/components/DynamicIcon';
import { maskField } from '@/utils/privacy';

const RING_STYLE = {
  '--tw-ring-color': 'color-mix(in srgb, var(--resume-primary) 40%, transparent)',
} as React.CSSProperties;

/**
 * 模块上下文：由 EditableSection 注入当前模块名，让后代 EditableSectionTitle / PolishHost
 * 自动获取 module，无需在每处重复传参。在 EditableSection 之外使用时为 null，子组件应显式接受
 * module prop 作为兜底（或退化为透传）。
 */
const ModuleContext = createContext<string | null>(null);

/**
 * 整体可点击的模块容器：hover 高亮 + 点击打开对应模块编辑面板。
 *
 * 与 AI 框选润色的协同：当点击落在 [data-polish-host] 子树（富文本区）时，本组件不响应
 * 点击，把交互权完全让渡给 PolishSelectionOverlay,避免松手即关闭气泡 chip。
 *
 * 与文本选择的协同：用户在本节点内拖选文字时，mouseup 会同步触发 click；此处通过
 * Selection.anchorNode 检测，若选区仍处于本节点内，跳过 openEditor 以保留选区。
 *
 * hoverScope:
 * - "section"（默认）：整个区域可 hover/可点击（无富文本模块用此模式）。
 * - "title"：本身退化为纯 div 透传，不响应任何 hover/click；交互由内部的
 *   EditableSectionTitle 单独承担。给含富文本模块（about/custom/project/work）使用，
 *   让富文本区域完全脱离编辑触发，仅参与框选润色。保留 div 层级以维持
 *   `div.resume-module > div > section` 这类间距 CSS 选择器命中。
 */
export function EditableSection({
  module,
  hoverScope = 'section',
  children,
}: {
  module: string;
  hoverScope?: 'section' | 'title';
  children: ReactNode;
}) {
  const openEditor = useUIStore((s) => s.openEditor);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-polish-host="true"]')) return;
      const sel = typeof window !== 'undefined' ? window.getSelection() : null;
      if (sel && !sel.isCollapsed && sel.toString().trim()) {
        const anchor = sel.anchorNode;
        if (anchor && e.currentTarget.contains(anchor)) return;
      }
      openEditor(module);
    },
    [module, openEditor],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target as Element | null;
      if (target?.closest?.('[data-polish-host="true"]')) return;
      e.preventDefault();
      openEditor(module);
    },
    [module, openEditor],
  );

  if (hoverScope === 'title') {
    // 纯 div 透传：无 cursor / 无 ring / 无 onClick / 无 role=button。
    // 交互完全交给内部 EditableSectionTitle，富文本区不再被父级 hover/click 感知。
    return (
      <ModuleContext.Provider value={module}>
        <div>{children}</div>
      </ModuleContext.Provider>
    );
  }

  return (
    <ModuleContext.Provider value={module}>
      <div
        className="cursor-pointer rounded transition-shadow hover:ring-2 print:cursor-default print:hover:ring-0"
        style={RING_STYLE}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`Edit ${module}`}
      >
        {children}
      </div>
    </ModuleContext.Provider>
  );
}

/**
 * 标题行级别的可点击 + hover ring 触发器。承担本模块全部编辑交互：
 * - 仅自身 hover 时显示 ring（不依赖父 group）
 * - 点击/Enter/Space → openEditor(module)
 * - 拖选时 mouseup → click，若选区在自身内则跳过 openEditor，保留文字选择
 *
 * `module` 默认从 ModuleContext 取（外层 EditableSection 自动注入），可显式传 prop 覆盖。
 * 在 EditableSection 之外使用且未传 module 时退化为透传，避免运行时 openEditor(undefined)。
 *
 * 给含富文本模块（about/custom/project/work）的 SectionTitle 包一层即可。
 * 富文本区不被本组件感知，正常框选触发 AI 润色 chip。
 */
export function EditableSectionTitle({
  module: moduleProp,
  children,
  className,
}: {
  module?: string;
  children: ReactNode;
  className?: string;
}) {
  const moduleFromCtx = useContext(ModuleContext);
  const module = moduleProp ?? moduleFromCtx;
  const openEditor = useUIStore((s) => s.openEditor);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!module) return;
      const sel = typeof window !== 'undefined' ? window.getSelection() : null;
      if (sel && !sel.isCollapsed && sel.toString().trim()) {
        const anchor = sel.anchorNode;
        if (anchor && e.currentTarget.contains(anchor)) return;
      }
      openEditor(module);
    },
    [module, openEditor],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!module) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openEditor(module);
    },
    [module, openEditor],
  );

  if (!module) return <>{children}</>;

  return (
    <div
      className={cn(
        'cursor-pointer rounded transition-shadow hover:ring-2 print:cursor-default print:hover:ring-0',
        className,
      )}
      style={RING_STYLE}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`Edit ${module}`}
    >
      {children}
    </div>
  );
}

/**
 * AI 框选润色的"宿主"标记：在富文本容器外包一层，让 PolishSelectionOverlay 能识别选区
 * 所在模块，并在 PolishDialog 接受时找到对应的 read/write handler（见 polish-handlers.ts）。
 *
 * - `module` 默认从 ModuleContext 取（即外层 EditableSection 的 module），可显式覆盖。
 * - `itemIndex` 用于列表型模块（如 workExpList、projectList）定位条目；非列表模块省略即可（默认 0）。
 *
 * 设计取舍：只接受 `className` / `style` / `id` 三个白名单属性，**不透传任意 HTML props**（如
 * onClick / role / tabIndex 等）。原因：本组件语义是"AI 选区宿主、不响应交互"，把交互事件挂在
 * 这里会与 EditableSection 的 closest('[data-polish-host]') 跳过逻辑冲突，并污染 a11y 含义。
 *
 * 取代原本散落各模块的 `data-polish-host="true" + data-polish-module="..." + data-polish-item-index={...}`
 * 三件套，避免拼写错误并消除 module 名重复传参。
 */
export function PolishHost({
  module: moduleProp,
  itemIndex = 0,
  children,
  className,
  style,
  id,
}: {
  module?: string;
  itemIndex?: number;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  const moduleFromCtx = useContext(ModuleContext);
  const module = moduleProp ?? moduleFromCtx;

  // 在 EditableSection 之外使用且未显式传 module：退化为透传，框选不会触发润色。
  if (!module) return <>{children}</>;

  return (
    <div
      className={className}
      style={style}
      id={id}
      data-polish-host="true"
      data-polish-module={module}
      data-polish-item-index={itemIndex}
    >
      {children}
    </div>
  );
}

export function TimeRange({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const { t } = useTranslation();
  if (!startDate && !endDate) return null;
  const display = (v?: string) => {
    if (!v) return '';
    if (v === 'present' || v === '至今' || v === 'Present') return t('field.present');
    return v;
  };
  return (
    <span className="text-xs text-gray-500">
      {display(startDate)}{startDate && endDate ? ' - ' : ''}{display(endDate)}
    </span>
  );
}

export function getTitle(config: JsonResume, key: string, fallback: string) {
  return config['x-op-titleNameMap']?.[key] ?? fallback;
}

export function isHidden(config: JsonResume, key: string) {
  return config['x-op-moduleHidden']?.[key] === true;
}

export function avatarStyle(a?: Avatar): React.CSSProperties {
  const w = a?.width ?? 90;
  const h = a?.height ?? 90;
  const r = a?.borderRadius ?? 999;
  return { width: w, height: h, borderRadius: Math.min(r, Math.min(w, h) / 2) };
}

export function ResumeAvatar({ avatar, name, className }: { avatar?: Avatar; name?: string; className?: string }) {
  if (!avatar?.src || avatar.hidden) return null;
  return (
    <AvatarUI className={cn('h-auto w-auto rounded-none', className)} style={avatarStyle(avatar)}>
      <AvatarImage src={avatar.src} alt={name ?? ''} className="object-cover" />
      <AvatarFallback className="rounded-none text-xs">{name?.[0] ?? ''}</AvatarFallback>
    </AvatarUI>
  );
}

/** 根据生日计算周岁，未填写返回 null */
export function calculateAge(birthday?: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/** 响应式获取模块图标：用户覆盖（UIStore） → 自定义模块默认 → 内置默认图标 */
export function useModuleIcon(key: string): string | undefined {
  const icon = useUIStore((s) => s.moduleIconMap[key]);
  if (icon) return icon;
  if (key.startsWith('custom-')) return DEFAULT_CUSTOM_MODULE_ICON;
  return DEFAULT_MODULE_ICONS[key];
}

/** 获取 Profile 字段默认图标 */
export function getProfileIcon(key: string): string | undefined {
  return DEFAULT_PROFILE_ICONS[key];
}

/** 响应式获取自定义字段图标映射 */
export function useCustomFieldIconMap(): Record<string, string> {
  return useUIStore((s) => s.customFieldIconMap);
}

/** Profile 字段带图标渲染，图标隐藏时回退显示文字标签 */
export function ProfileField({
  icon,
  label,
  children,
  className,
}: {
  icon?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const showIcons = useUIStore((s) => s.showIcons);
  return (
    <p className={cn('flex items-center gap-1.5', className)}>
      <DynamicIcon name={icon} className="h-3 w-3 shrink-0 opacity-60" />
      {!showIcons && label && <span className="shrink-0 text-gray-400">{label}:</span>}
      <span>{children}</span>
    </p>
  );
}

/**
 * 隐私打码 hook
 *
 * 返回 mask 函数：隐私模式开启时对值打码，关闭时原样返回。
 * 用法：const mask = usePrivacyMask(); mask(basics?.name, 'name')
 */
export function usePrivacyMask() {
  const privacyMode = useUIStore((s) => s.privacyMode);
  return useCallback(
    (value: string | undefined, fieldKey: string): string | undefined => {
      if (!privacyMode || !value) return value;
      return maskField(value, fieldKey);
    },
    [privacyMode],
  );
}
