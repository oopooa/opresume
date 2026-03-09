import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RichContent } from '@/components/RichContent';
import { EditableSection, TimeRange, getTitle, isHidden, useModuleIcon, usePrivacyMask } from '../shared';

export function WorkExpModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('workExpList');
  const { SectionTitle } = tokens.components;
  const mask = usePrivacyMask();
  if (isHidden(config, 'workExpList') || !config.workExpList?.length) return null;

  const list = itemRange ? config.workExpList.slice(itemRange[0], itemRange[1]) : config.workExpList;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="workExpList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} icon={moduleIcon} />}
        {list.map((work, i) => (
          <div key={work.id} className={tokens.spacing.item} data-item-index={indexOffset + i}>
            <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
              <div>
                <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                  {mask(work.companyName, 'companyName')}
                </p>
                {work.departmentName && (
                  <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                    {mask(work.departmentName, 'departmentName')}
                  </p>
                )}
              </div>
              <TimeRange time={work.workTime} />
            </div>
            <div className="mt-1">
              <RichContent content={work.workDesc} textSize={tokens.typography.contentSize} />
            </div>
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
