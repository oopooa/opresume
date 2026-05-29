import type { JsonResume } from '@/types/json-resume';
import type { StyleTokens } from '../types';
import { useTranslation } from 'react-i18next';
import { RichContent } from '@/components/RichContent';
import {
  EditableSection,
  EditableSectionTitle,
  PolishHost,
  getTitle,
  isHidden,
  useModuleIcon,
} from '../shared';

/** 按当前语言取本地化值：精确语言码 > 语言前缀（zh/en） > 基础值 */
function pickLocale(base: string, locales: Record<string, string> | undefined, lang: string): string {
  if (!locales) return base;
  return locales[lang] ?? locales[lang.split('-')[0]] ?? base;
}

/**
 * 自定义模块渲染组件。
 *
 * 与其他模块不同，自定义模块通过 moduleId 从 config['x-op-customModules'] 中查找数据，
 * 而非直接从 config 的顶层字段读取。
 */
export function CustomModule({
  moduleId,
  config,
  tokens,
  showTitle = true,
}: {
  moduleId: string;
  config: JsonResume;
  tokens: StyleTokens;
  showTitle?: boolean;
}) {
  const { i18n } = useTranslation();
  const moduleIcon = useModuleIcon(moduleId);
  const { SectionTitle } = tokens.components;

  const customModule = config['x-op-customModules']?.find((m) => m.id === moduleId);
  if (!customModule) return null;
  if (isHidden(config, moduleId)) return null;

  // 标题 / 正文按当前语言解析（titleLocales / contentHtmlLocales）；用户在 titleNameMap 中的显式标题仍优先。
  const localizedTitle = pickLocale(customModule.title, customModule.titleLocales, i18n.language);
  const localizedContent = pickLocale(customModule.contentHtml, customModule.contentHtmlLocales, i18n.language);
  const title = getTitle(config, moduleId, localizedTitle);

  return (
    <EditableSection module={moduleId} hoverScope="title">
      <section className={tokens.spacing.module}>
        {showTitle && (
          <EditableSectionTitle>
            <SectionTitle title={title} icon={moduleIcon} />
          </EditableSectionTitle>
        )}
        {localizedContent && (
          <PolishHost>
            <RichContent content={localizedContent} textSize={tokens.typography.contentSize} />
          </PolishHost>
        )}
      </section>
    </EditableSection>
  );
}
