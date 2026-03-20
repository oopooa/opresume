import type { ModuleProps } from '../types';
import type { ExtendedAward } from '@/types/extended-json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

export function AwardModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('awardList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'awardList') || !config.awards?.length) return null;

  const allAwards = config.awards as ExtendedAward[];
  const list = itemRange ? allAwards.slice(itemRange[0], itemRange[1]) : allAwards;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="awardList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} icon={moduleIcon} />}
        {list.map((award, i) => (
          <div
            key={award['x-op-id'] ?? i}
            data-item-index={indexOffset + i}
            className={cn(
              tokens.spacing.item,
              tokens.typography.contentSize,
              !tokens.layout.awardTimeInline && 'flex justify-between',
              !tokens.layout.awardTimeInline && tokens.layout.flexAlign,
            )}
          >
            <span>{award.title}</span>
            {award.date && (
              tokens.layout.awardTimeInline
                ? <span className={cn('ml-1', tokens.colors.muted)}>({award.date})</span>
                : <span className={cn('ml-2 shrink-0', tokens.colors.muted)}>{award.date}</span>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
