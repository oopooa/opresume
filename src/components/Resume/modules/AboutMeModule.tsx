import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/Markdown';
import { EditableSection, getTitle, isHidden } from '../shared';

export function AboutMeModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens;
  if (isHidden(config, 'aboutme') || !config.aboutme?.aboutmeDesc) return null;

  return (
    <EditableSection module="aboutme">
      <section className={tokens.moduleSpacing}>
        <SectionTitle title={getTitle(config, 'aboutme', t('module.aboutme'))} />
        <Markdown content={config.aboutme.aboutmeDesc} />
      </section>
    </EditableSection>
  );
}
