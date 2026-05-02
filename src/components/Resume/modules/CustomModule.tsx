import type { JsonResume } from '@/types/json-resume';
import type { StyleTokens } from '../types';
import { RichContent } from '@/components/RichContent';
import {
  EditableSection,
  EditableSectionTitle,
  PolishHost,
  getTitle,
  isHidden,
  useModuleIcon,
} from '../shared';

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
  const moduleIcon = useModuleIcon(moduleId);
  const { SectionTitle } = tokens.components;

  const customModule = config['x-op-customModules']?.find((m) => m.id === moduleId);
  if (!customModule) return null;
  if (isHidden(config, moduleId)) return null;

  const title = getTitle(config, moduleId, customModule.title);

  return (
    <EditableSection module={moduleId} hoverScope="title">
      <section className={tokens.spacing.module}>
        {showTitle && (
          <EditableSectionTitle>
            <SectionTitle title={title} icon={moduleIcon} />
          </EditableSectionTitle>
        )}
        {customModule.contentHtml && (
          <PolishHost>
            <RichContent content={customModule.contentHtml} textSize={tokens.typography.contentSize} />
          </PolishHost>
        )}
      </section>
    </EditableSection>
  );
}
