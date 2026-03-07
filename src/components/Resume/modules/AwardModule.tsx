import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

export function AwardModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('awardList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'awardList') || !config.awardList?.length) return null;

  return (
    <EditableSection module="awardList">
      <section className={tokens.spacing.module}>
        <SectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} icon={moduleIcon} />
        {config.awardList.map((award) => (
          <div
            key={award.id}
            className={cn(
              tokens.spacing.item,
              tokens.typography.contentSize,
              !tokens.layout.awardTimeInline && 'flex justify-between',
              !tokens.layout.awardTimeInline && tokens.layout.flexAlign,
            )}
          >
            <span>{award.awardInfo}</span>
            {award.awardTime && (
              tokens.layout.awardTimeInline
                ? <span className={cn('ml-1', tokens.colors.muted)}>({award.awardTime})</span>
                : <span className={cn('ml-2 shrink-0', tokens.colors.muted)}>{award.awardTime}</span>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
