import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

export function WorkListModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('workList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'workList') || !config.workList?.length) return null;

  const list = itemRange ? config.workList.slice(itemRange[0], itemRange[1]) : config.workList;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="workList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'workList', t('module.workList'))} icon={moduleIcon} />}
        {list.map((item, i) => (
          <div key={item.id} className={tokens.spacing.item} data-item-index={indexOffset + i}>
            <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
              {item.workName}
              {item.visitLink && (
                <a
                  href={item.visitLink}
                  className={cn('ml-2', tokens.typography.contentSize, 'font-normal text-resume-primary underline')}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.visitLink}
                </a>
              )}
            </p>
            {item.workDesc && (
              <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>{item.workDesc}</p>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
