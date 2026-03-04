import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/Markdown';
import { EditableSection, TimeRange, getTitle, isHidden } from '../shared';

export function ProjectModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens;
  if (isHidden(config, 'projectList') || !config.projectList?.length) return null;

  return (
    <EditableSection module="projectList">
      <section className={tokens.moduleSpacing}>
        <SectionTitle title={getTitle(config, 'projectList', t('module.projectList'))} />
        {config.projectList.map((proj) => (
          <div key={proj.id} className="mb-3">
            <div className={cn('flex justify-between', tokens.flexAlign)}>
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-semibold', tokens.textPrimary)}>{proj.projectName}</p>
                {proj.projectRole && (
                  <span className={cn('text-xs', tokens.textSecondary)}>/ {proj.projectRole}</span>
                )}
              </div>
              <TimeRange time={proj.projectTime} />
            </div>
            {proj.projectDesc && (
              <p className={cn('mt-0.5 text-xs', tokens.textSecondary)}>{proj.projectDesc}</p>
            )}
            {proj.projectContent && (
              <div className="mt-1">
                <Markdown content={proj.projectContent} />
              </div>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
