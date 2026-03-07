import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RichContent } from '@/components/RichContent';
import { EditableSection, TimeRange, getTitle, isHidden, useModuleIcon } from '../shared';

export function ProjectModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('projectList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'projectList') || !config.projectList?.length) return null;

  const isDetailed = tokens.variants.project === 'detailed';

  return (
    <EditableSection module="projectList">
      <section className={tokens.spacing.module}>
        <SectionTitle title={getTitle(config, 'projectList', t('module.projectList'))} icon={moduleIcon} />
        {config.projectList.map((proj) => (
          <div key={proj.id} className={tokens.spacing.item}>
            <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
              <div className={cn(isDetailed ? 'flex items-baseline gap-2' : 'flex items-center gap-2')}>
                <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                  {proj.projectName}
                </p>
                {proj.projectRole && (
                  isDetailed ? (
                    <span
                      className={cn('rounded px-1.5 py-0.5', tokens.typography.contentSize)}
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--resume-tag) 20%, transparent)',
                        color: 'var(--resume-tag)',
                      }}
                    >
                      {proj.projectRole}
                    </span>
                  ) : (
                    <span className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                      / {proj.projectRole}
                    </span>
                  )
                )}
              </div>
              <TimeRange time={proj.projectTime} />
            </div>
            {proj.projectDesc && (
              <p className={cn('mt-1', tokens.typography.contentSize, tokens.colors.secondary)}>
                {proj.projectDesc}
              </p>
            )}
            {proj.projectContent && (
              <div className="mt-1">
                <RichContent content={proj.projectContent} textSize={tokens.typography.contentSize} />
              </div>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
