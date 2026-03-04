import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden } from '../shared';

export function WorkExpModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens;
  if (isHidden(config, 'workExpList') || !config.workExpList?.length) return null;

  return (
    <EditableSection module="workExpList">
      <section className={tokens.moduleSpacing}>
        <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} />
        {config.workExpList.map((work) => (
          <div key={work.id} className="mb-3">
            <div className={cn('flex justify-between', tokens.flexAlign)}>
              <div>
                <p className={cn('text-sm font-semibold', tokens.textPrimary)}>{work.companyName}</p>
                {work.departmentName && (
                  <p className={cn('text-xs', tokens.textSecondary)}>{work.departmentName}</p>
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
