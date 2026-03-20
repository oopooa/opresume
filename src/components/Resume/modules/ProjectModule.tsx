import type { ModuleProps } from '../types';
import type { ExtendedProject } from '@/types/extended-json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RichContent } from '@/components/RichContent';
import { EditableSection, TimeRange, getTitle, isHidden, useModuleIcon } from '../shared';

export function ProjectModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('projectList');
  const { SectionTitle } = tokens.components;

  const allProjects = (config.projects ?? []).filter(
    (p) => !(p as ExtendedProject)['x-op-type'] || (p as ExtendedProject)['x-op-type'] === 'project',
  ) as ExtendedProject[];

  if (isHidden(config, 'projectList') || !allProjects.length) return null;

  const isDetailed = tokens.variants.project === 'detailed';
  const list = itemRange ? allProjects.slice(itemRange[0], itemRange[1]) : allProjects;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="projectList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'projectList', t('module.projectList'))} icon={moduleIcon} />}
        {list.map((proj, i) => (
          <div key={proj['x-op-id'] ?? i} className={tokens.spacing.item} data-item-index={indexOffset + i}>
            <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
              <div className={cn(isDetailed ? 'flex items-baseline gap-2' : 'flex items-center gap-2')}>
                <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                  {proj.name}
                </p>
                {proj.roles?.[0] && (
                  isDetailed ? (
                    <span
                      className={cn('rounded px-1.5 py-0.5', tokens.typography.contentSize)}
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--resume-tag) 20%, transparent)',
                        color: 'var(--resume-tag)',
                      }}
                    >
                      {proj.roles[0]}
                    </span>
                  ) : (
                    <span className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                      / {proj.roles[0]}
                    </span>
                  )
                )}
              </div>
              <TimeRange startDate={proj.startDate} endDate={proj.endDate} />
            </div>
            {proj.description && (
              <p className={cn('mt-1', tokens.typography.contentSize, tokens.colors.secondary)}>
                {proj.description}
              </p>
            )}
            {proj['x-op-projectContentHtml'] && (
              <div className="mt-1">
                <RichContent content={proj['x-op-projectContentHtml']} textSize={tokens.typography.contentSize} />
              </div>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
