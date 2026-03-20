import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { RichContent } from '@/components/RichContent';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

export function AboutMeModule({ config, tokens, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('aboutme');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'aboutme') || !config['x-op-aboutmeHtml']) return null;

  return (
    <EditableSection module="aboutme">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'aboutme', t('module.aboutme'))} icon={moduleIcon} />}
        <RichContent content={config['x-op-aboutmeHtml']} textSize={tokens.typography.contentSize} />
      </section>
    </EditableSection>
  );
}
