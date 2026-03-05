import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden } from '../shared';

export function WorkExpModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'workExpList') || !config.workExpList?.length) return null;

  return (
    <EditableSection module="workExpList">
      <section className={tokens.spacing.module}>
        <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} />
        {config.workExpList.map((work) => (
          <div key={work.id} className={tokens.spacing.item}>
            <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
              <div>
                <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                  {work.companyName}
                </p>
                {work.departmentName && (
                  <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                    {work.departmentName}
                  </p>
                )}
              </div>
              <TimeRange time={work.workTime} />
            </div>
            <div className="mt-1">
              <Markdown content={work.workDesc} />
            </div>
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
