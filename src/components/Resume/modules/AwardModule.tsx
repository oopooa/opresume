import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

export function AwardModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('awardList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'awardList') || !config.awardList?.length) return null;

  const list = itemRange ? config.awardList.slice(itemRange[0], itemRange[1]) : config.awardList;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="awardList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} icon={moduleIcon} />}
        {list.map((award, i) => (
          <div
            key={award.id}
            data-item-index={indexOffset + i}
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
