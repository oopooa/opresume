import type { ModuleProps } from '../types';
import type { ExtendedProject } from '@/types/extended-json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

export function WorkListModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('workList');
  const { SectionTitle } = tokens.components;

  const allPortfolios = (config.projects ?? []).filter(
    (p) => (p as ExtendedProject)['x-op-type'] === 'portfolio',
  ) as ExtendedProject[];

  if (isHidden(config, 'workList') || !allPortfolios.length) return null;

  const list = itemRange ? allPortfolios.slice(itemRange[0], itemRange[1]) : allPortfolios;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="workList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'workList', t('module.workList'))} icon={moduleIcon} />}
        {list.map((item, i) => (
          <div key={item['x-op-id'] ?? i} className={tokens.spacing.item} data-item-index={indexOffset + i}>
            <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
              {item.name}
              {item.url && (
                <a
                  href={item.url}
                  className={cn('ml-2', tokens.typography.contentSize, 'font-normal text-resume-primary underline')}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.url}
                </a>
              )}
            </p>
            {item.description && (
              <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>{item.description}</p>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
