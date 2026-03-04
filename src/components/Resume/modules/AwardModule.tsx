import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden } from '../shared';

export function AwardModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens;
  if (isHidden(config, 'awardList') || !config.awardList?.length) return null;

  return (
    <EditableSection module="awardList">
      <section className={tokens.moduleSpacing}>
        <SectionTitle title={getTitle(config, 'awardList', t('module.awardList'))} />
        {config.awardList.map((award) => (
          <div
            key={award.id}
            className={cn(
              'mb-1 text-xs',
              !tokens.awardTimeInline && 'flex justify-between',
              !tokens.awardTimeInline && tokens.flexAlign,
            )}
          >
            <span>{award.awardInfo}</span>
            {award.awardTime && (
              tokens.awardTimeInline
                ? <span className={cn('ml-1', tokens.textMuted)}>({award.awardTime})</span>
                : <span className={cn('ml-2 shrink-0', tokens.textMuted)}>{award.awardTime}</span>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
