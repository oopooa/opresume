import type { ModuleProps } from '../types';
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

export function AboutMeModule({ config, tokens, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('aboutme');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'aboutme') || !config['x-op-aboutmeHtml']) return null;

  return (
    <EditableSection module="aboutme" hoverScope="title">
      <section className={tokens.spacing.module}>
        {showTitle && (
          <EditableSectionTitle>
            <SectionTitle title={getTitle(config, 'aboutme', t('module.aboutme'))} icon={moduleIcon} />
          </EditableSectionTitle>
        )}
        <PolishHost>
          <RichContent content={config['x-op-aboutmeHtml']} textSize={tokens.typography.contentSize} />
        </PolishHost>
      </section>
    </EditableSection>
  );
}
