import type { ModuleProps } from '../types';
import type { ExtendedWork } from '@/types/extended-json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RichContent } from '@/components/RichContent';
import { EditableSection, TimeRange, getTitle, isHidden, useModuleIcon, usePrivacyMask } from '../shared';

export function WorkExpModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('workExpList');
  const { SectionTitle } = tokens.components;
  const mask = usePrivacyMask();
  if (isHidden(config, 'workExpList') || !config.work?.length) return null;

  const allWork = config.work as ExtendedWork[];
  const list = itemRange ? allWork.slice(itemRange[0], itemRange[1]) : allWork;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="workExpList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} icon={moduleIcon} />}
        {list.map((work, i) => (
          <div key={work['x-op-id'] ?? i} className={tokens.spacing.item} data-item-index={indexOffset + i}>
            <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
              <div>
                <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                  {mask(work.name, 'companyName')}
                </p>
                {work['x-op-departmentName'] && (
                  <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                    {mask(work['x-op-departmentName'], 'departmentName')}
                  </p>
                )}
              </div>
              <TimeRange startDate={work.startDate} endDate={work.endDate} />
            </div>
            {work['x-op-workDescHtml'] && (
              <div className="mt-1">
                <RichContent content={work['x-op-workDescHtml']} textSize={tokens.typography.contentSize} />
              </div>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
